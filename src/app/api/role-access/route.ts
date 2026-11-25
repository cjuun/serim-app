import {NextRequest,NextResponse} from 'next/server';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';

type Role='chief'|'subadmin'|'operator'|'worker';
const PRIVILEGES=['attendance.manage','shift.manage','dailyreport.manage','tbm.manage','claims.manage','calendar.manage','machines.manage','breaks.view'] as const;
const ALL=new Set<string>(PRIVILEGES);
function fail(error:string,status:number){return NextResponse.json({error},{status});}
function config(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;const service=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&pub&&service?{url,pub,service}:null;}
async function context(req:NextRequest){
 const c=config();if(!c)return null;
 const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!token)return null;
 const auth=createClient(c.url,c.pub,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await auth.auth.getUser(token);if(error||!user)return null;
 const db=createClient(c.url,c.service,{auth:{persistSession:false,autoRefreshToken:false}});
 return {db,userId:user.id};
}
async function isChief(db:SupabaseClient,userId:string){const {data,error}=await db.from('admin_users').select('user_id').eq('user_id',userId).maybeSingle();if(error)throw error;return !!data;}
async function staff(db:SupabaseClient,userId:string){const {data,error}=await db.from('staff_members').select('id,employee_code,full_name,team,employee_role,division_role,active,auth_user_id').eq('auth_user_id',userId).eq('active',true).maybeSingle();if(error)throw error;return data;}
async function getAccess(db:SupabaseClient,userId:string){
 const [chief,member,supervisor,grant]=await Promise.all([
  isChief(db,userId),staff(db,userId),db.from('production_supervisors').select('user_id').eq('user_id',userId).maybeSingle(),db.from('serim_access_grants').select('role,team_scope,permissions').eq('user_id',userId).maybeSingle()
 ]);
 const role:Role=chief?'chief':(grant.data?.role==='subadmin'||supervisor.data)?'subadmin':grant.data?.role==='operator'?'operator':grant.data?.role==='worker'?'worker':member?.employee_role==='operator'?'operator':'worker';
 return {role,team:member?.team||null,teamScope:grant.data?.team_scope||member?.team||null,permissions:chief?[...PRIVILEGES]:Array.isArray(grant.data?.permissions)?grant.data.permissions:[],staffId:member?.id||null,fullName:member?.full_name||null,staffCode:member?.employee_code||null,ready:!grant.error,grantExists:!!grant.data,legacySupervisor:!!supervisor.data,grantError:grant.error?.code==='42P01'?'not_installed':grant.error?.message||null};
}
export async function GET(req:NextRequest){
 try{
  const ctx=await context(req);if(!ctx)return fail('Login required or server configuration missing',401);
  if(req.nextUrl.searchParams.get('mode')==='audit'){
   if(!await isChief(ctx.db,ctx.userId))return fail('Chief administrator only',403);
   const {data,error}=await ctx.db.from('serim_access_audit').select('id,staff_id,previous_role,new_role,created_at,previous_scope,new_scope').order('created_at',{ascending:false}).limit(30);
   if(error)return fail(error.message,500);return NextResponse.json({rows:data||[]});
  }
  if(req.nextUrl.searchParams.get('mode')==='members'){
   if(!await isChief(ctx.db,ctx.userId))return fail('Chief administrator only',403);
   const [staffRows,grants,admins,supervisors]=await Promise.all([
    ctx.db.from('staff_members').select('id,employee_code,full_name,team,employee_role,active,auth_user_id').eq('active',true).order('full_name'),
    ctx.db.from('serim_access_grants').select('user_id,role,team_scope,permissions'),
    ctx.db.from('admin_users').select('user_id'),
    ctx.db.from('production_supervisors').select('user_id'),
   ]);
   if(staffRows.error||admins.error||supervisors.error)return fail(staffRows.error?.message||admins.error?.message||supervisors.error?.message||'Read error',500);
   type GrantRow={user_id:string;role:Role;team_scope:string;permissions:string[]};
   const gs=new Map<string,GrantRow>((grants.data||[]).map(x=>[x.user_id,x as GrantRow]));const as=new Set((admins.data||[]).map(x=>x.user_id));const ss=new Set((supervisors.data||[]).map(x=>x.user_id));
   return NextResponse.json({ready:!grants.error,rows:(staffRows.data||[]).map(p=>{const g=p.auth_user_id?gs.get(p.auth_user_id):null;const role=as.has(p.auth_user_id)?'chief':(ss.has(p.auth_user_id)||g?.role==='subadmin')?'subadmin':g?.role|| (p.employee_role==='operator'?'operator':'worker');return {...p,role,team_scope:g?.team_scope||p.team,permissions:g?.permissions||[]};})});
  }
  return NextResponse.json(await getAccess(ctx.db,ctx.userId));
 }catch(e){return fail(e instanceof Error?e.message:'Cannot load access',500);}
}
export async function POST(req:NextRequest){
 try{
  const origin=req.headers.get('origin');
  if(origin && origin!==req.nextUrl.origin)return fail('Invalid origin',403);
  const ctx=await context(req);if(!ctx)return fail('Login required',401);
  if(!await isChief(ctx.db,ctx.userId))return fail('Chief administrator only',403);
  const b=await req.json() as Record<string,unknown>;
  const staffId=Number(b.staffId);
  const role=String(b.role||'') as Role;
  const teamScope=String(b.teamScope||'');
  const permissions=Array.isArray(b.permissions)
    ? [...new Set(b.permissions.filter((v):v is string=>typeof v==='string'))]
    : [];
  if(!Number.isSafeInteger(staffId)||staffId<1 ||
    !['chief','subadmin','operator','worker'].includes(role) ||
    permissions.some(permission=>!ALL.has(permission)))return fail('Invalid role request',400);
  if(role==='subadmin'&&!['vacuum','newmaterial'].includes(teamScope))return fail('Select a valid management team',400);
  if(role!=='subadmin'&&permissions.length)return fail('Extra permissions are only available to subadministrators',400);
  if(role==='chief'&&b.confirmChief!=='CHIEF')return fail('Chief role requires explicit confirmation',400);
  // One database transaction owns grant, legacy cleanup, chief role, and audit.
  // Any error rolls back all permission changes; this route performs no partial writes.
  const {data,error}=await ctx.db.rpc('serim_apply_access_role',{
   p_actor:ctx.userId,
   p_staff_id:staffId,
   p_role:role,
   p_team_scope:role==='subadmin'?teamScope:null,
   p_permissions:role==='subadmin'?permissions:[],
  });
  if(error){
   // Never expose raw database errors or account details to callers.
   console.error('[role-access] atomic role change failed',error.code);
   return fail('Permission update could not be completed. Check test database migration and server logs.',500);
  }
  return NextResponse.json({success:true,result:data});
 }catch(e){
  console.error('[role-access] unexpected failure',e instanceof Error?e.name:'unknown');
  return fail('Unable to update role',500);
 }
}

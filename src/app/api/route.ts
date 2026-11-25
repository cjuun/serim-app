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
  if(req.headers.get('origin')&&req.headers.get('origin')!==req.nextUrl.origin)return fail('Invalid origin',403);
  const ctx=await context(req);if(!ctx)return fail('Login required',401);
  if(!await isChief(ctx.db,ctx.userId))return fail('Chief administrator only',403);
  const b=await req.json() as Record<string,unknown>;
  const staffId=Number(b.staffId), role=String(b.role||'') as Role,teamScope=String(b.teamScope||'');
  const permissions=Array.isArray(b.permissions)?[...new Set(b.permissions.filter(x=>typeof x==='string'))] as string[]:[];
  if(!Number.isSafeInteger(staffId)||staffId<1||!['chief','subadmin','operator','worker'].includes(role)||permissions.some(p=>!ALL.has(p)))return fail('Invalid role request',400);
  const {data:member,error:memberErr}=await ctx.db.from('staff_members').select('id,auth_user_id,full_name,employee_code,team,active').eq('id',staffId).maybeSingle();
  if(memberErr||!member?.active||!member.auth_user_id)return fail('An active employee account is required',400);
  if(member.auth_user_id===ctx.userId)return fail('Cannot change your own chief administrator account',403);
  if(role==='subadmin'&&!['vacuum','newmaterial'].includes(teamScope))return fail('Select a valid management team',400);
  if(role!=='subadmin'&&permissions.length)return fail('Extra permissions are only available to subadministrators',400);
  if(role==='chief'&&b.confirmChief!=='CHIEF')return fail('Chief role requires explicit confirmation',400);
  const before=await getAccess(ctx.db,member.auth_user_id);
  const wasChief=await isChief(ctx.db,member.auth_user_id);
  if(wasChief&&role!=='chief'){
   const {count,error}=await ctx.db.from('admin_users').select('user_id',{count:'exact',head:true});
   if(error||!count||count<=1)return fail('Cannot remove the last chief administrator',409);
  }
  // A role grant is independent of personnel rank and production job classification.
  const {error:grantErr}=await ctx.db.from('serim_access_grants').upsert({user_id:member.auth_user_id,staff_id:staffId,role:role==='chief'?'worker':role,team_scope:role==='subadmin'?teamScope:member.team,permissions:role==='subadmin'?permissions:[],updated_by:ctx.userId,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(grantErr)return fail(grantErr.message,500);
  if(role==='chief'&&!wasChief){const {error}=await ctx.db.from('admin_users').insert({user_id:member.auth_user_id});if(error)return fail('Chief assignment failed: '+error.message,500);}
  if(role!=='chief'&&wasChief){const {error}=await ctx.db.from('admin_users').delete().eq('user_id',member.auth_user_id);if(error)return fail('Chief removal failed: '+error.message,500);}
  // Remove legacy unrestricted supervisor access when converting a user to the new
  // granular access model. Future machine changes use the scoped API endpoint.
  const {error:legacyErr}=await ctx.db.from('production_supervisors').delete().eq('user_id',member.auth_user_id);
  if(legacyErr)return fail('Legacy supervisor privilege cleanup failed: '+legacyErr.message,500);
  const {error:auditErr}=await ctx.db.from('serim_access_audit').insert({actor_user_id:ctx.userId,target_user_id:member.auth_user_id,staff_id:staffId,previous_role:before.role,new_role:role,previous_permissions:before.permissions,new_permissions:role==='subadmin'?permissions:[],previous_scope:before.teamScope,new_scope:role==='subadmin'?teamScope:member.team});
  if(auditErr)return fail('Role updated, but audit failed: '+auditErr.message,500);
  return NextResponse.json({success:true,role});
 }catch(e){return fail(e instanceof Error?e.message:'Unable to update role',500);}
}

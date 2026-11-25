import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
function fail(error:string,status:number){return NextResponse.json({error},{status});}
export async function POST(req:NextRequest){
 try{
  const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return fail('Invalid origin',403);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!pub||!key)return fail('Missing server settings',503);
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!token)return fail('Login required',401);
  const verifier=createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await verifier.auth.getUser(token);if(error||!user)return fail('Invalid session',401);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const [admin,grant,member]=await Promise.all([
   db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle(),
   db.from('serim_access_grants').select('role,team_scope,permissions,staff_id').eq('user_id',user.id).maybeSingle(),
   db.from('staff_members').select('active,team').eq('auth_user_id',user.id).maybeSingle(),
  ]);
  const chief=!!admin.data;const has=grant.data?.role==='subadmin'&&grant.data.team_scope==='vacuum'&&Array.isArray(grant.data.permissions)&&grant.data.permissions.includes('machines.manage')&&member.data?.active&&member.data.team==='vacuum';
  if(!chief&&!has)return fail('Machine update permission denied',403);
  const b=await req.json() as {id?:number;status?:string};
  if(!Number.isSafeInteger(b.id)||!b.id||b.id<1||!['received','investigating','resolved'].includes(b.status||''))return fail('Invalid machine status',400);
  const {data:issue,error:issueErr}=await db.from('machine_issues').select('id,machine_code').eq('id',b.id).maybeSingle();
  if(issueErr||!issue)return fail('Issue not found',404);
  if(!/^([123])-([1-6])$/.test(issue.machine_code))return fail('Machine is outside the approved team',403);
  const {error:upErr}=await db.from('machine_issues').update({status:b.status}).eq('id',b.id);
  if(upErr)return fail(upErr.message,500);
  return NextResponse.json({success:true});
 }catch(e){return fail(e instanceof Error?e.message:'Unexpected error',500);}
}

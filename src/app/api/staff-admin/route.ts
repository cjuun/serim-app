import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';

// The service-role key is SERVER ONLY; never prefix it with NEXT_PUBLIC_.
const EMAIL_DOMAIN='staff.serimbng.example.com';
function reply(error:string,status:number){return NextResponse.json({error},{status});}
export async function POST(req:NextRequest){
  try{
    const origin=req.headers.get('origin');
    if(origin && origin!==req.nextUrl.origin)return reply('Invalid origin',403);
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!publicKey||!serviceKey)return reply('Server auth settings missing',503);
    const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
    if(!token)return reply('Admin login required',401);
    const auth=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
    const {data:user,error:userErr}=await auth.auth.getUser(token);
    if(userErr||!user.user)return reply('Session expired',401);
    const {data:admin,error:adminErr}=await auth.from('admin_users').select('user_id').eq('user_id',user.user.id).maybeSingle();
    if(adminErr||!admin)return reply('Admin only',403);
    const service=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const body=await req.json() as Record<string,unknown>;
    const action=String(body.action||'');
    if(action==='add'){
      const full_name=String(body.name||'').trim();
      const team=body.team;
      const employee_role=body.role;
      if(full_name.length<2||full_name.length>70||!['vacuum','newmaterial'].includes(String(team))||!['operator','worker'].includes(String(employee_role)))return reply('Invalid employee information',400);
      const {data,error}=await service.from('staff_members').insert({full_name,team,employee_role}).select('id,employee_code,full_name,team,employee_role,active,auth_user_id').single();
      if(error)return reply(error.message,400);
      return NextResponse.json({member:data});
    }
    const id=Number(body.staffId);
    if(!Number.isSafeInteger(id)||id<1)return reply('Invalid staff ID',400);
    const {data:member,error:memberErr}=await service.from('staff_members').select('id,employee_code,full_name,auth_user_id,active').eq('id',id).single();
if (memberErr) {
  return reply(`Employee lookup failed: ${memberErr.message}`, 500);
}
if (!member) {
  return reply(`Employee ID ${id} not found`, 404);
}
    if(action==='issue'){
      if(!member.active)return reply('Inactive employee',400);
      if(member.auth_user_id)return reply('Account already issued',409);
      const email=`${member.employee_code.toLowerCase()}@${EMAIL_DOMAIN}`;
      const password=randomBytes(18).toString('base64url');
      const {data:created,error}=await service.auth.admin.createUser({email,password,email_confirm:true});
      if(error||!created.user)return reply(error?.message||'Create user failed',400);
      const {error:linkErr}=await service.from('staff_members').update({auth_user_id:created.user.id}).eq('id',id).is('auth_user_id',null);
      if(linkErr){await service.auth.admin.deleteUser(created.user.id);return reply(linkErr.message,400);}
      // Password is shown to administrator ONCE. Do not log it or persist it in app tables.
      return NextResponse.json({employee_code:member.employee_code,temporary_password:password});
    }
    if(action==='reset'){
      if(!member.auth_user_id||!member.active)return reply('No active account',400);
      const password=randomBytes(18).toString('base64url');
      const {error}=await service.auth.admin.updateUserById(member.auth_user_id,{password});
      if(error)return reply(error.message,400);
      return NextResponse.json({employee_code:member.employee_code,temporary_password:password});
    }
    if(action==='disable'||action==='enable'){
      const active=action==='enable';
      if(member.auth_user_id){
        const {error}=await service.auth.admin.updateUserById(member.auth_user_id,{ban_duration:active?'none':'876000h'});
        if(error)return reply(error.message,400);
      }
      const {error}=await service.from('staff_members').update({active}).eq('id',id);
      if(error)return reply(error.message,400);
      return NextResponse.json({active});
    }
    return reply('Unknown action',400);
  }catch{return reply('Request could not be processed',500);}
}

import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

export async function POST(req:NextRequest){
 try{
  const origin=req.headers.get('origin');
  if(origin && origin!==req.nextUrl.origin)return NextResponse.json({error:'Login failed'},{status:403});
  const {identifier,password}=await req.json() as {identifier?:string;password?:string};
  const alias=String(identifier||'').trim().toLowerCase();
  if(!/^[a-z][a-z0-9_]{4,23}$/.test(alias)||!password||password.length>128)
    return NextResponse.json({error:'Invalid credentials'},{status:401});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!serviceKey||!key)return NextResponse.json({error:'Service unavailable'},{status:503});
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.from('staff_login_aliases').select('staff_id,staff_members!inner(employee_code,active)').eq('alias',alias).maybeSingle();
  if(error||!data)return NextResponse.json({error:'Invalid credentials'},{status:401});
  const member=(data.staff_members as unknown as {employee_code:string;active:boolean});
  if(!member?.active)return NextResponse.json({error:'Invalid credentials'},{status:401});
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const r=await client.auth.signInWithPassword({email:`${member.employee_code.toLowerCase()}@staff.serimbng.example.com`,password});
  if(r.error||!r.data.session)return NextResponse.json({error:'Invalid credentials'},{status:401});
  return NextResponse.json({access_token:r.data.session.access_token,refresh_token:r.data.session.refresh_token});
 }catch{return NextResponse.json({error:'Unable to log in'},{status:500});}
}

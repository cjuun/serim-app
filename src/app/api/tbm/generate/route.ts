import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {generateTbmForDate,koreaDay,trainingDay} from '../../../lib/tbmAutomation';

// GET: Vercel Cron (Production only). POST: authorized admin manual Preview test.
export async function GET(request:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret)return NextResponse.json({error:'CRON_SECRET missing'},{status:503});
 if(request.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});
 const date=koreaDay();
 if(!trainingDay(date))return NextResponse.json({skipped:true,date});
 try{return NextResponse.json({date,results:await generateTbmForDate(date)},{headers:{'Cache-Control':'no-store'}});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Generation failed'},{status:503});}
}
export async function POST(request:NextRequest){
 if(request.headers.get('origin')&&request.headers.get('origin')!==request.nextUrl.origin)return NextResponse.json({error:'Invalid origin'},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!publishable)return NextResponse.json({error:'Missing Preview Supabase settings'},{status:503});
 const token=(request.headers.get('authorization')||'').replace(/^Bearer /,'');
 if(!token)return NextResponse.json({error:'Login required'},{status:401});
 const db=createClient(url,publishable,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user)return NextResponse.json({error:'Invalid session'},{status:401});
 const {data:admin,error:adminError}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
 if(adminError||!admin)return NextResponse.json({error:'Admin only'},{status:403});
 const body=await request.json().catch(()=>({})) as {date?:string};
 const date=body.date||koreaDay();
 if(!trainingDay(date))return NextResponse.json({error:'Select a Monday/Wednesday/Friday date'},{status:400});
 const delta=Math.abs(new Date(`${date}T00:00:00Z`).getTime()-new Date(`${koreaDay()}T00:00:00Z`).getTime());
 if(delta>31*86400000)return NextResponse.json({error:'Date must be within 31 days'},{status:400});
 try{return NextResponse.json({date,results:await generateTbmForDate(date)});}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Generation failed'},{status:503});}
}

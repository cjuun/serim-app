import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
const langs=['en','ne','km','tl','vi'] as const;
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin');
 if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:'Invalid origin'},{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
       key=process.env.GEMINI_API_KEY,model=process.env.GEMINI_MODEL;
 if(!url||!pub||!key||!model)return NextResponse.json({error:'Translation server settings missing'},{status:503});
 const token=(request.headers.get('authorization')||'').replace(/^Bearer /,'');
 if(!token)return NextResponse.json({error:'Login required'},{status:401});
 const db=createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
 const {data:{user}}=await db.auth.getUser(token);
 if(!user)return NextResponse.json({error:'Invalid session'},{status:401});
 const body=await request.json().catch(()=>({})) as {sessionId?:unknown;title?:unknown;detail?:unknown};
 const id=Number(body.sessionId),title=typeof body.title==='string'?body.title.trim():'',detail=typeof body.detail==='string'?body.detail.trim():'';
 if(!Number.isInteger(id)||id<=0||title.length<3||title.length>250||detail.length<10||detail.length>4000)return NextResponse.json({error:'Invalid TBM text'},{status:400});
 const {data:session}=await db.from('tbm_sessions').select('id,group_id,status').eq('id',id).maybeSingle();
 if(!session||session.status==='completed')return NextResponse.json({error:'Draft not available'},{status:404});
 const [{data:admin},{data:group}]=await Promise.all([
   db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle(),
   db.from('tbm_groups').select('supervisor_user_id').eq('id',session.group_id).maybeSingle(),
 ]);
 if(!admin&&group?.supervisor_user_id!==user.id)return NextResponse.json({error:'Supervisor only'},{status:403});
 try{
  const schema={type:'object',properties:Object.fromEntries(langs.map(x=>[x,{type:'object',properties:{title:{type:'string'},detail:{type:'string'}},required:['title','detail'],additionalProperties:false}])),required:[...langs],additionalProperties:false};
  const upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
   method:'POST',signal:AbortSignal.timeout(23000),cache:'no-store',headers:{'Content-Type':'application/json','x-goog-api-key':key},
   body:JSON.stringify({systemInstruction:{parts:[{text:'Translate the Korean TBM safety briefing accurately into five target languages. Preserve safety meaning, numbers, and caution statements. This is a translation only; add no new instructions. Return JSON only.'}]},
    contents:[{role:'user',parts:[{text:`Title:\n${title}\n\nDetail:\n${detail}\n\nLanguages: en English, ne Nepali, km Khmer, tl Filipino, vi Vietnamese.`}]}],
    generationConfig:{temperature:0.1,maxOutputTokens:6000,responseMimeType:'application/json',responseJsonSchema:schema}}),
  });
  if(!upstream.ok)return NextResponse.json({error:`Translation service HTTP ${upstream.status}`},{status:502});
  const data=await upstream.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]};
  const parsed=JSON.parse((data.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('')) as Record<string,{title:string;detail:string}>;
  if(langs.some(x=>typeof parsed[x]?.title!=='string'||!parsed[x].title.trim()||typeof parsed[x]?.detail!=='string'||!parsed[x].detail.trim()))throw Error('Incomplete translation');
  return NextResponse.json({translations:parsed},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Translation service failed'},{status:502});}
}

import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

const languages=['en','ne','km','tl','vi'] as const;
type Translation={en:string;ne:string;km:string;tl:string;vi:string};

export async function POST(request:NextRequest){
  try{
    const origin=request.headers.get('origin');
    if(origin && origin!==request.nextUrl.origin){
      return NextResponse.json({error:'Invalid origin'},{status:403});
    }
    const bearer=request.headers.get('authorization')||'';
    const token=bearer.startsWith('Bearer ')?bearer.slice(7):'';
    if(!token)return NextResponse.json({error:'Administrator login required'},{status:401});
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const geminiKey=process.env.GEMINI_API_KEY;
    if(!url||!key||!geminiKey)return NextResponse.json({error:'Server translation settings are missing'},{status:503});

    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
    const {data:userData,error:userError}=await db.auth.getUser(token);
    if(userError||!userData.user)return NextResponse.json({error:'Invalid login session'},{status:401});
    const {data:admin,error:adminError}=await db.from('admin_users').select('user_id').eq('user_id',userData.user.id).maybeSingle();
    if(adminError||!admin)return NextResponse.json({error:'Administrator access required'},{status:403});

    let payload:unknown;
    try{payload=await request.json();}catch{return NextResponse.json({error:'Invalid JSON'},{status:400});}
    const text=typeof payload==='object'&&payload!==null&&'text' in payload?(payload as {text:unknown}).text:null;
    if(typeof text!=='string'||!text.trim()||text.length>4000)return NextResponse.json({error:'Notice text must be 1 to 4000 characters'},{status:400});
    const model=process.env.GEMINI_MODEL||'gemini-3.5-flash';
    // Model names are controlled by the administrator; never accept them from the client.
    const timer=AbortSignal.timeout(45000);
    const upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
      method:'POST',signal:timer,cache:'no-store',
      headers:{'Content-Type':'application/json','x-goog-api-key':geminiKey},
      body:JSON.stringify({
        contents:[{role:'user',parts:[{text:
          'Translate the following Korean manufacturing workplace notice faithfully into five languages: English (en), Nepali (ne), Cambodian Khmer (km), Filipino/Tagalog (tl), Vietnamese (vi). Preserve dates, numeric values, safety instructions, formatting and line breaks. Do not add or omit instructions. Return just JSON with keys en, ne, km, tl, vi. Do not include any explanations. The Korean notice is:\n\n'+text,
        }]}],
        generationConfig:{responseMimeType:'application/json',temperature:0.1,maxOutputTokens:8192,
          responseJsonSchema:{type:'object',properties:Object.fromEntries(languages.map(code=>[code,{type:'string'}])),required:[...languages],additionalProperties:false}},
      }),
    });
    if(!upstream.ok){
      // Do not expose API credentials or raw provider response to clients.
      return NextResponse.json({error:`Translation provider error (HTTP ${upstream.status}). Check GEMINI_MODEL and API quota.`},{status:502});
    }
    const result=await upstream.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]};
    const raw=result.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
    let parsed:Partial<Translation>;
    try{parsed=JSON.parse(raw) as Partial<Translation>;}catch{return NextResponse.json({error:'Translation JSON was invalid'},{status:502});}
    if(languages.some(code=>typeof parsed[code]!=='string'||!parsed[code]?.trim())){
      return NextResponse.json({error:'Some translations are missing. The notice was not saved.'},{status:502});
    }
    return NextResponse.json(parsed,{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    return NextResponse.json({error:error instanceof Error&&error.name==='TimeoutError'?'Translation timed out':'Translation failed. Try again.'},{status:502});
  }
}

import 'server-only';
import {createClient} from '@supabase/supabase-js';

const supported=['ko','en','ne','km','tl','vi'] as const;
type Locale=typeof supported[number];
type Lesson={title:string;detail:string};
const units=[
 {id:1,work:'플라스틱 트레이 포장 및 선별'},
 {id:2,work:'플라스틱 트레이 포장 및 선별'},
 {id:3,work:'오퍼레이터 및 스크랩 작업'},
] as const;

export function serviceDb(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Missing server Supabase service-role configuration');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function koreaDay(){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const v=(k:string)=>parts.find(p=>p.type===k)?.value||'';
 return `${v('year')}-${v('month')}-${v('day')}`;
}
export function trainingDay(date:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const d=new Date(`${date}T00:00:00Z`);
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===date&&[1,3,5].includes(d.getUTCDay());
}
async function geminiLesson(groupId:number,work:string,date:string):Promise<Record<Locale,Lesson>>{
 const key=process.env.GEMINI_API_KEY;
 const model=process.env.GEMINI_MODEL;
 if(!key||!model)throw new Error('GEMINI_API_KEY or GEMINI_MODEL missing');
 const detailSchema={type:'object',properties:{title:{type:'string'},detail:{type:'string'}},required:['title','detail'],additionalProperties:false};
 const schema={type:'object',properties:Object.fromEntries(supported.map(x=>[x,detailSchema])),required:[...supported],additionalProperties:false};
 const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
  method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},cache:'no-store',signal:AbortSignal.timeout(25000),
  body:JSON.stringify({
   systemInstruction:{parts:[{text:'You are drafting short, correct toolbox safety meeting content for a Korean manufacturing site. Only provide general safe practices, not speculative site-specific controls. A human supervisor must review before use. Ensure the same meaning across all six languages. Do not claim hazards were inspected. Do not invent laws. Return only the requested JSON.'}]},
   contents:[{role:'user',parts:[{text:`Produce one original 5-10 minute TBM safety briefing for ${date}, TBM group ${groupId}, work: ${work}. Group 1 and 2 do tray packing and sorting; group 3 does machine operating and scrap handling. Topic should rotate with hazards: sharp edges, pinch points, slip/trip, ergonomics, lockout prior to clearing jam, PPE, machine guarding, fire/emergency procedures. Use a concise title and 3 clear safe reminders and one group check question, Korean and fully translated into English, Nepali, Khmer, Filipino, and Vietnamese. Field detail should be 100-300 Korean characters for ko and comparable length for each other language.`}]}],
   generationConfig:{temperature:0.35,maxOutputTokens:6000,responseMimeType:'application/json',responseJsonSchema:schema},
  }),
 });
 if(!response.ok)throw new Error(`AI HTTP ${response.status} (${model})`);
 const data=await response.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]};
 const raw=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('');
 const parsed=JSON.parse(raw) as Record<Locale,Lesson>;
 if(supported.some(x=>typeof parsed[x]?.title!=='string'||!parsed[x].title.trim()||typeof parsed[x]?.detail!=='string'||parsed[x].detail.trim().length<12))throw new Error('Incomplete 6-language response');
 return parsed;
}
export async function generateTbmForDate(date:string){
 if(!trainingDay(date))throw new Error('Only Monday, Wednesday, Friday dates are supported');
 const db=serviceDb();
 const report:{group:number;result:string}[]=[];
 await Promise.all(units.map(async g=>{
  const {data:existing,error:lookupErr}=await db.from('tbm_sessions').select('id,status').eq('group_id',g.id).eq('session_date',date).maybeSingle();
  if(lookupErr)throw lookupErr;
  if(existing?.status==='approved'||existing?.status==='completed'){
   report.push({group:g.id,result:'already approved'});return;
  }
  try{
   const lesson=await geminiLesson(g.id,g.work,date);
   const translations=Object.fromEntries(supported.filter(x=>x!=='ko').map(x=>[x,lesson[x]]));
   const data={group_id:g.id,session_date:date,topic_ko:lesson.ko.title,details_ko:lesson.ko.detail,
    translations,status:'draft',generation_error:null,work_description:g.work};
   const {error}=await db.from('tbm_sessions').upsert(data,{onConflict:'group_id,session_date'});
   if(error)throw error;
   report.push({group:g.id,result:'draft created'});
  }catch(error){
   const reason=error instanceof Error?error.message:'Unknown generation error';
   const {error:writeError}=await db.from('tbm_sessions').upsert({group_id:g.id,session_date:date,status:'draft',generation_error:reason,work_description:g.work}, {onConflict:'group_id,session_date'});
   if(writeError)throw writeError;
   report.push({group:g.id,result:'draft pending: '+reason});
  }
 }));
 return report.sort((a,b)=>a.group-b.group);
}

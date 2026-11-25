import 'server-only';
import {createClient} from '@supabase/supabase-js';

const langs=['ko','en','ne','km','tl','vi'] as const;
type Locale=typeof langs[number];
type Lesson={title:string;detail:string};
const units=[
 {id:1,work:'플라스틱 트레이 포장 및 선별'},
 {id:2,work:'플라스틱 트레이 포장 및 선별'},
 {id:3,work:'오퍼레이터 및 스크랩 작업'},
] as const;
const TOPICS=[
 {key:'industrial-sharp',category:'산업안전',title:'날카로운 제품·절단 도구 취급',prompt:'제품 모서리 및 테이프 절단 도구, 손 베임 방지'},
 {key:'fire-path',category:'화재',title:'비상대피로와 소화기 주변 정리',prompt:'대피로와 소화기 접근을 막는 적재물 제거, 경보 시 보고'},
 {key:'accident-nearmiss',category:'산업재해',title:'아차사고 발견과 즉시 보고',prompt:'작은 위험 징후를 발견했을 때 중단하고 관리감독자에게 알리기'},
 {key:'daily-check',category:'일상점검',title:'작업 시작 전 안전 확인',prompt:'가동 전 설비 상태, 바닥, 안전장치 확인; 이상 시 임의 가동 금지'},
 {key:'periodic-check',category:'정기점검',title:'정기점검 항목 누락 방지',prompt:'정기점검표 확인, 기록 누락 방지, 점검 담당자와 공유'},
 {key:'special-check',category:'특별점검',title:'수리 후 재가동 전 확인',prompt:'수리 후 안전장치 복구, 주변 인원 확인, 승인된 절차에 따른 재가동'},
 {key:'box-stacking',category:'원부자재',title:'박스 안전 적재',prompt:'박스 적재 높이와 안정성, 통로 확보, 무거운 박스 안전 운반'},
 {key:'hdpe-roll',category:'원부자재',title:'하이덴 비닐 포장재 관리',prompt:'비닐 롤·포장재 이동 중 굴러감 방지, 걸림 위험 감소'},
 {key:'tape-storage',category:'원부자재',title:'테이프 및 칼 보관',prompt:'테이프 사용 후 도구 정리, 칼날 노출 방지'},
 {key:'housekeeping',category:'정리정돈',title:'작업장 5S 정리정돈',prompt:'사용한 자재를 정해진 위치에 두고 작업 통로 비우기'},
 {key:'floor-cleaning',category:'청소',title:'바닥·설비 주변 청소',prompt:'미끄럼 위험 물질 제거, 가동 중 위험부위 직접 청소 금지'},
 {key:'msds-basic',category:'MSDS',title:'MSDS 확인 방법',prompt:'실제 사용하는 화학제품의 안전보건자료 확인, 모르는 물질은 책임자에게 문의; 유해성 추측 금지'},
 {key:'ppe',category:'산업안전',title:'작업별 보호구 확인',prompt:'업무에 정해진 보호구 사용, 훼손된 보호구 교체'},
 {key:'ergonomics',category:'산업재해',title:'반복 포장작업의 자세',prompt:'무리한 허리 숙임과 반복동작, 편한 작업높이, 불편감 보고'},
 {key:'machine-guard',category:'산업안전',title:'설비 방호장치 상태 확인',prompt:'설비 덮개와 안전장치 임의 해제 금지, 이상 시 작업 중지'},
 {key:'scrap-transport',category:'정리정돈',title:'스크랩 운반과 분리',prompt:'스크랩 보관구역, 바닥 낙하물, 운반 중 시야 확보'},
 {key:'fire-electric',category:'화재',title:'전기설비 주변 화재예방',prompt:'비정상 발열·냄새 발견 시 작업 중단 및 보고, 임의 분해 금지'},
 {key:'lifting',category:'산업안전',title:'박스·원료 운반 시 손·허리 보호',prompt:'무거운 물건 이동 시 장비 활용, 무리한 단독 운반 금지'},
 {key:'slip',category:'산업재해',title:'미끄러짐·걸림 사고 예방',prompt:'물기와 포장재 조각 제거, 통로 장애물 즉시 처리'},
 {key:'jam',category:'특별점검',title:'설비 막힘 발생 시 안전 중지',prompt:'막힘 발생 시 설비 정지 및 작업 권한 확인, 움직이는 부분에 손 넣지 않기'},
] as const;
type Topic=(typeof TOPICS)[number];
type History={topic_key:string|null;session_date:string;status:string};
export function serviceDb(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
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
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===date&&[1,2,3,4,5].includes(d.getUTCDay());
}
const dayDiff=(later:string,earlier:string)=>Math.round((Date.parse(later+'T00:00:00Z')-Date.parse(earlier+'T00:00:00Z'))/86400000);
function selectTopic(history:History[],date:string,group:number):{topic:Topic;repeat:boolean}{
 const prior=history.filter(h=>h.topic_key&&h.session_date<date&&['approved','completed'].includes(h.status));
 const latest=(topic:Topic)=>prior.find(h=>h.topic_key===topic.key);
 const daysSince=(topic:Topic)=>{const row=latest(topic);return row?dayDiff(date,row.session_date):Infinity;};
 const dayIndex=Math.floor(Date.parse(date+'T00:00:00Z')/86400000);
 const ordered=[...TOPICS].sort((a,b)=>{
  // Prefer topics absent from the previous 14 days; use stable, group-shifted cycle for diversity.
  const aPenalty=daysSince(a)<14?1000:0,bPenalty=daysSince(b)<14?1000:0;
  const aCycle=(TOPICS.indexOf(a)-dayIndex-group*7+TOPICS.length*100)%TOPICS.length;
  const bCycle=(TOPICS.indexOf(b)-dayIndex-group*7+TOPICS.length*100)%TOPICS.length;
  return aPenalty-bPenalty||aCycle-bCycle;
 });
 const repeatSlot=(dayIndex+group)%10<3; // Approximately 30% reinforcement briefs.
 const repetitions=ordered.filter(t=>daysSince(t)>=14&&daysSince(t)<=21);
 if(repeatSlot&&repetitions.length)return {topic:repetitions[0],repeat:true};
 const fresh=ordered.find(t=>!latest(t));
 return {topic:fresh||ordered[0],repeat:!!latest(fresh||ordered[0])};
}
async function geminiLesson(groupId:number,work:string,date:string,topic:Topic,repeat:boolean):Promise<Record<Locale,Lesson>>{
 const key=process.env.GEMINI_API_KEY,model=process.env.GEMINI_MODEL;
 if(!key||!model)throw new Error('GEMINI_API_KEY or GEMINI_MODEL missing');
 const one={type:'object',properties:{title:{type:'string'},detail:{type:'string'}},required:['title','detail'],additionalProperties:false};
 const schema={type:'object',properties:Object.fromEntries(langs.map(x=>[x,one])),required:[...langs],additionalProperties:false};
 const direction=`Write one practical, easy 5-10 minute daily TBM for ${date}. Group ${groupId} work: ${work}. Main category ${topic.category}, specific topic: ${topic.title}. Safety focus: ${topic.prompt}. ${repeat?'This is a REINFORCEMENT briefing of an earlier safety topic; retain essential safety rules but use a different simple example and checking question.':'This is a new briefing.'} Use a short title, 3 to 5 clear actions, and one very easy group-check question. Examples must fit plastics tray packing/sorting or machine operators/scrap work. Include cartons, HDPE(high-density polyethylene) bags, tapes and work-site housekeeping where relevant. Translate faithfully into Korean, English, Nepali, Khmer, Filipino, Vietnamese. Do not assume a particular machine, chemical, MSDS hazard, legal requirement, inspection result, or plant-specific procedure. Avoid technical jargon. Korean detail ~120-300 chars and comparable length other languages. Respond strictly with the required JSON.`;
 const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
  method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},cache:'no-store',signal:AbortSignal.timeout(25000),
  body:JSON.stringify({systemInstruction:{parts:[{text:'You write simple Korean manufacturing safety briefings. A human supervisor must approve before use. Never invent site-specific rules, inspections, or MSDS hazards. Maintain meaning in six languages. Return only JSON.'}]},contents:[{role:'user',parts:[{text:direction}]}],generationConfig:{temperature:0.35,maxOutputTokens:6500,responseMimeType:'application/json',responseJsonSchema:schema}})
 });
 if(!response.ok)throw new Error(`AI HTTP ${response.status} (${model})`);
 const data=await response.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[]};
 const raw=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('');
 const parsed=JSON.parse(raw) as Record<Locale,Lesson>;
 if(langs.some(x=>typeof parsed[x]?.title!=='string'||!parsed[x].title.trim()||typeof parsed[x]?.detail!=='string'||parsed[x].detail.trim().length<12))throw new Error('Incomplete 6-language response');
 return parsed;
}
export async function generateTbmForDate(date:string){
 if(!trainingDay(date))throw new Error('Only Monday to Friday dates are supported');
 const db=serviceDb();
 const results=await Promise.all(units.map(async unit=>{
  const [found,recent]=await Promise.all([
   db.from('tbm_sessions').select('id,status').eq('group_id',unit.id).eq('session_date',date).maybeSingle(),
   db.from('tbm_sessions').select('topic_key,session_date,status').eq('group_id',unit.id).lt('session_date',date).gte('session_date',new Date(Date.parse(date+'T00:00:00Z')-90*86400000).toISOString().slice(0,10)).order('session_date',{ascending:false}).limit(100),
  ]);
  if(found.error)throw new Error('TBM 조회 실패: '+found.error.message);
  if(recent.error)throw new Error('TBM 교육이력 조회 실패: '+recent.error.message);
  if(found.data?.status==='approved'||found.data?.status==='completed')return {group:unit.id,result:'already approved'};
  const choice=selectTopic((recent.data||[]) as History[],date,unit.id);
  try{
   const lesson=await geminiLesson(unit.id,unit.work,date,choice.topic,choice.repeat);
   const translations=Object.fromEntries(langs.filter(l=>l!=='ko').map(l=>[l,lesson[l]]));
   const {error}=await db.from('tbm_sessions').upsert({group_id:unit.id,session_date:date,topic_ko:lesson.ko.title,details_ko:lesson.ko.detail,translations,status:'draft',generation_error:null,work_description:unit.work,topic_category:choice.topic.category,topic_key:choice.topic.key,is_reinforcement:choice.repeat},{onConflict:'group_id,session_date'});
   if(error)throw new Error('TBM 교육자료 저장 실패: '+error.message);
   return {group:unit.id,result:choice.repeat?'reinforcement draft created':'new topic draft created'};
  }catch(error){
   const reason=error instanceof Error?error.message:'Unknown generation error';
   const {error:writeError}=await db.from('tbm_sessions').upsert({group_id:unit.id,session_date:date,status:'draft',generation_error:reason,work_description:unit.work,topic_category:choice.topic.category,topic_key:choice.topic.key,is_reinforcement:choice.repeat},{onConflict:'group_id,session_date'});
   if(writeError)throw new Error('AI 생성 오류: '+reason+' / Supabase 오류 저장 실패: '+writeError.message);
   return {group:unit.id,result:'draft pending: '+reason};
  }
 }));
 return results.sort((a,b)=>a.group-b.group);
}

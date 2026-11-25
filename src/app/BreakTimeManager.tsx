'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';
import type {Lang} from './i18n';
import {pu} from './productionUiText';
type Entry={id:number;staff_id:number;started_at:string;ended_at:string|null};
type Member={id:number;full_name:string;team:'vacuum'|'newmaterial';active:boolean};
const words={
 team:{ko:'공장 선택',en:'Factory',ne:'कारखाना',km:'រោងចក្រ',tl:'Pabrika',vi:'Nhà máy'},
 vacuum:{ko:'진공성형',en:'Vacuum forming',ne:'भ्याकुम फर्मिङ',km:'បង្កើតសុញ្ញាកាស',tl:'Vacuum forming',vi:'Định hình chân không'},
 newmaterial:{ko:'신소재생산',en:'New material',ne:'नयाँ सामग्री',km:'សម្ភារៈថ្មី',tl:'Bagong materyal',vi:'Vật liệu mới'},
 employee:{ko:'직원',en:'Employee',ne:'कर्मचारी',km:'បុគ្គលិក',tl:'Empleyado',vi:'Nhân viên'},
 first:{ko:'1차 휴게',en:'1st break',ne:'पहिलो विश्राम',km:'សម្រាកទី១',tl:'Unang pahinga',vi:'Nghỉ lần 1'},
 second:{ko:'2차 휴게',en:'2nd break',ne:'दोस्रो विश्राम',km:'សម្រាកទី២',tl:'Ikalawang pahinga',vi:'Nghỉ lần 2'},
 minutes:{ko:'분',en:'min',ne:'मिनेट',km:'នាទី',tl:'min',vi:'phút'},
 missing:{ko:'미기록',en:'No record',ne:'रेकर्ड छैन',km:'គ្មានកំណត់ត្រា',tl:'Walang tala',vi:'Chưa ghi'},
 alert:{ko:'휴게시간 초과',en:'Over break limit',ne:'विश्राम सीमा नाघ्यो',km:'លើសម៉ោងសម្រាក',tl:'Lampas sa pahinga',vi:'Quá thời gian nghỉ'},
 today:{ko:'오늘',en:'Today',ne:'आज',km:'ថ្ងៃនេះ',tl:'Ngayon',vi:'Hôm nay'},
 ongoing:{ko:'휴게 중',en:'On break',ne:'विश्राममा',km:'កំពុងសម្រាក',tl:'Nagpapahinga',vi:'Đang nghỉ'},
 working:{ko:'작업 중',en:'Working',ne:'काम गर्दै',km:'កំពុងធ្វើការ',tl:'Nagtatrabaho',vi:'Đang làm việc'},
 status:{ko:'현재 상태',en:'Status',ne:'स्थिति',km:'ស្ថានភាព',tl:'Katayuan',vi:'Trạng thái'},
 excessOnly:{ko:'초과인원만',en:'Over-limit only',ne:'सीमा नाघेका मात्र',km:'តែអ្នកលើសកំណត់',tl:'Lampas lamang',vi:'Chỉ người quá giờ'},
 overCount:{ko:'초과인원',en:'Over-limit staff',ne:'सीमा नाघेका कर्मचारी',km:'បុគ្គលិកលើសកំណត់',tl:'Mga lumampas',vi:'Nhân viên quá giờ'},
 access:{ko:'관리자 조회',en:'Manager view',ne:'प्रबन्धक दृश्य',km:'ទិដ្ឋភាពអ្នកគ្រប់គ្រង',tl:'Tingin ng admin',vi:'Quản lý'},
} as const;
const wd=(lang:Lang,key:keyof typeof words)=>words[key][lang];
const time=(iso:string)=>new Date(iso).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false});
const kstDate=(d:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
function sessionMinutes(r:Entry,now:number){return Math.max(0,Math.floor(((r.ended_at?new Date(r.ended_at).getTime():now)-new Date(r.started_at).getTime())/60000));}
export default function BreakTimeManager({lang,isAdmin=false,scopeTeam=null}:{lang:Lang;isAdmin?:boolean;scopeTeam?:'vacuum'|'newmaterial'|null}){
 const [mine,setMine]=useState<Entry[]>([]);const [members,setMembers]=useState<Member[]>([]);const [all,setAll]=useState<Entry[]>([]);
 const [staffId,setStaffId]=useState<number|null>(null);const [team,setTeam]=useState<'vacuum'|'newmaterial'>(scopeTeam||'vacuum');
 useEffect(()=>{if(scopeTeam)setTeam(scopeTeam);},[scopeTeam]);
 const [historyDate,setHistoryDate]=useState('');const [overOnly,setOverOnly]=useState(false);const [search,setSearch]=useState('');
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [now,setNow]=useState(0);const [limit,setLimit]=useState(20);
 useEffect(()=>{void supabase.from('production_app_settings').select('value').eq('key','break_limit_minutes').maybeSingle().then(({data})=>{if(typeof data?.value==='number')setLimit(data.value);});setNow(Date.now());const timer=window.setInterval(()=>setNow(Date.now()),30000);return()=>window.clearInterval(timer);},[]);
 const today=kstDate(new Date(now||Date.now()));
 const adminDate=historyDate||today;
 const adminClock=adminDate===today?now:new Date(`${adminDate}T23:59:59+09:00`).getTime();
 const load=useCallback(async()=>{
  const {data:{user}}=await supabase.auth.getUser();if(!user){setStaffId(null);setMine([]);return;}
  const {data:staff}=await supabase.from('staff_members').select('id').eq('auth_user_id',user.id).eq('active',true).maybeSingle();
  setStaffId(staff?.id??null);
  const from=new Date(`${today}T00:00:00+09:00`).toISOString();
  const to=new Date(new Date(`${today}T00:00:00+09:00`).getTime()+86400000).toISOString();
  if(staff?.id){const {data,error}=await supabase.from('staff_breaks').select('id,staff_id,started_at,ended_at').eq('staff_id',staff.id).gte('started_at',from).lt('started_at',to).order('started_at');if(error)setMessage(error.message);else setMine((data||[]) as Entry[]);}
  const adminFrom=new Date(`${adminDate}T00:00:00+09:00`).toISOString();
  const adminTo=new Date(new Date(`${adminDate}T00:00:00+09:00`).getTime()+86400000).toISOString();
  if(isAdmin){
   let q=supabase.from('staff_members').select('id,full_name,team,active').eq('active',true).order('id');if(scopeTeam)q=q.eq('team',scopeTeam);
   const p=await q;const ids=(p.data||[]).map(x=>x.id);
   if(p.error){setMessage(p.error.message);return;}setMembers((p.data||[]) as Member[]);
   if(!ids.length){setAll([]);return;}
   const r=await supabase.from('staff_breaks').select('id,staff_id,started_at,ended_at').in('staff_id',ids).gte('started_at',adminFrom).lt('started_at',adminTo).order('started_at');
   if(r.error)setMessage(r.error.message);else setAll((r.data||[]) as Entry[]);
  }
 },[isAdmin,today,adminDate,scopeTeam]);
 useEffect(()=>{void load();},[load]);
 const active=mine.find(r=>!r.ended_at);
 const change=async(action:'start'|'end')=>{if(busy||staffId===null)return;setBusy(true);setMessage('');const {error}=await supabase.rpc('record_staff_break',{p_action:action});setBusy(false);if(error)setMessage(error.message);else{setMessage(pu(lang,'saved'));await load();}};
 const people=useMemo(()=>members.filter(m=>m.team===team&&m.full_name.includes(search)),[members,team,search]);
 const exceeding=people.filter(p=>all.some(r=>r.staff_id===p.id&&sessionMinutes(r,adminClock)>limit));
 const visiblePeople=overOnly?exceeding:people;
 const display=(list:Entry[],clock=now)=>{if(!list.length)return <span className="font-semibold text-red-700">{wd(lang,'missing')}</span>;return <div className="space-y-1">{list.map((r,i)=>{const minutes=sessionMinutes(r,clock);return <div key={r.id} className={`text-xs ${minutes>limit?'font-bold text-red-700':'text-gray-800'}`}>{i+1}. {time(r.started_at)} ~ {r.ended_at?time(r.ended_at):wd(lang,'ongoing')} ({minutes}{wd(lang,'minutes')})</div>;})}</div>;};
 return <div className="space-y-4">
  <section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#145C42]">{pu(lang,'breakMenu')}</h2><p className="mt-2 text-sm"><span className={`mr-2 inline-block h-3 w-3 rounded-full ${active?'bg-amber-500':staffId?'bg-emerald-500':'bg-gray-400'}`}/>{active?wd(lang,'ongoing'):staffId?wd(lang,'working'):wd(lang,'missing')}</p><div className="mt-4 grid grid-cols-2 gap-3"><button disabled={busy||!!active||staffId===null} onClick={()=>change('start')} className="rounded-lg bg-[#168253] p-4 font-bold text-white disabled:opacity-40">{pu(lang,'start')}</button><button disabled={busy||!active||staffId===null} onClick={()=>change('end')} className="rounded-lg bg-[#145C42] p-4 font-bold text-white disabled:opacity-40">{pu(lang,'end')}</button></div></section>
  {message&&<p role="status" className="rounded-lg border bg-white p-3 text-sm">{message}</p>}
  <section className="rounded-xl bg-white p-5 shadow-sm"><h3 className="mb-3 font-semibold">{wd(lang,'today')} · {today}</h3>{display(mine)}</section>
  {isAdmin&&<section className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-[#145C42]">{wd(lang,'access')} · {adminDate}</h3><input type="date" className="rounded border p-2 text-sm" value={adminDate} onChange={e=>setHistoryDate(e.target.value)}/></div><div className="my-3 grid grid-cols-2 gap-2">{(['vacuum','newmaterial'] as const).filter(t=>!scopeTeam||t===scopeTeam).map(t=><button key={t} onClick={()=>setTeam(t)} className={`rounded-lg border p-3 font-semibold ${team===t?'border-[#168253] bg-green-100':'bg-white'}`}>{wd(lang,t)}</button>)}</div><div className="mb-3 flex flex-wrap items-center gap-3"><input className="rounded border p-2 text-sm" placeholder={wd(lang,'employee')} value={search} onChange={e=>setSearch(e.target.value)}/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={overOnly} onChange={e=>setOverOnly(e.target.checked)}/>{wd(lang,'excessOnly')}</label><span className="font-semibold text-red-700">{wd(lang,'overCount')}: {exceeding.length}명</span></div><div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead><tr className="bg-[#E6F1E9]"><th className="p-2">{wd(lang,'employee')}</th><th className="p-2">{wd(lang,'status')}</th><th className="p-2">{wd(lang,'first')} / {wd(lang,'second')}</th></tr></thead><tbody>{visiblePeople.map(person=>{const sessions=all.filter(r=>r.staff_id===person.id);const current=sessions.find(r=>!r.ended_at);const over=sessions.some(r=>sessionMinutes(r,adminClock)>limit);return <tr key={person.id} className={`border-b ${over?'bg-red-50':''}`}><td className="p-2 font-medium">{person.full_name}</td><td className={`p-2 ${over||!sessions.length?'text-red-700':''}`}><span className={`mr-1 inline-block h-2.5 w-2.5 rounded-full ${over||!sessions.length?'bg-red-500':current?'bg-amber-500':'bg-emerald-500'}`}/>{over?wd(lang,'alert'):current?wd(lang,'ongoing'):sessions.length?wd(lang,'working'):wd(lang,'missing')}</td><td className="p-2">{display(sessions,adminClock)}</td></tr>;})}</tbody></table></div></section>}
 </div>;
}

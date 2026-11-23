'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';
import {t,localDate,formatDay,type Lang,type Team} from './i18n';
import {pu} from './productionUiText';

type ApprovedLeave={staff_name:string;leave_type:string;start_date:string;end_date:string};
type Category='production'|'training'|'inspection'|'holiday'|'other';
type EventRow={id:number;event_date:string;team:string;category:Category;title_ko:string;title_en:string|null;title_ne:string|null;title_km:string|null;title_tl:string|null;title_vi:string|null;details_ko:string|null;details_en:string|null;details_ne:string|null;details_km:string|null;details_tl:string|null;details_vi:string|null};
const I={
  heading:['생산 일정 캘린더','Production Calendar','उत्पादन पात्रो','ប្រតិទិនផលិតកម្ម','Kalendaryo ng Produksyon','Lịch sản xuất'],
  new:['일정 등록','New event','कार्यक्रम थप्नुहोस्','បន្ថែមកាលវិភាគ','Magdagdag ng iskedyul','Thêm lịch'],
  title:['일정 제목 (한국어)','Title (Korean)','शीर्षक (कोरियाली)','ចំណងជើង (កូរ៉េ)','Pamagat (Korean)','Tiêu đề (tiếng Hàn)'],
  detail:['상세 내용 (한국어)','Details (Korean)','विवरण (कोरियाली)','ព័ត៌មានលម្អិត (កូរ៉េ)','Detalye (Korean)','Nội dung (tiếng Hàn)'],
  date:['일정 날짜','Event date','मिति','កាលបរិច្ឆេទ','Petsa','Ngày'],
  category:['일정 분류','Category','वर्ग','ប្រភេទ','Uri','Loại'],
  target:['대상 팀','Team','टोली','ក្រុម','Team','Đội'],
  all:['전체 팀','All teams','सबै टोली','ក្រុមទាំងអស់','Lahat ng team','Tất cả đội'],
  production:['생산','Production','उत्पादन','ផលិតកម្ម','Produksyon','Sản xuất'],
  training:['교육','Training','तालिम','បណ្តុះបណ្តាល','Pagsasanay','Đào tạo'],
  inspection:['설비점검','Inspection','निरीक्षण','ត្រួតពិនិត្យ','Inspeksiyon','Kiểm tra'],
  holiday:['휴무','Day off','बिदा','ថ្ងៃឈប់សម្រាក','Pahinga','Nghỉ'],
  other:['기타','Other','अन्य','ផ្សេងៗ','Iba pa','Khác'],
  save:['저장','Save','सुरक्षित गर्नुहोस्','រក្សាទុក','I-save','Lưu'],
  edit:['수정','Edit','सम्पादन','កែប្រែ','Baguhin','Sửa'],
  del:['삭제','Delete','मेट्नुहोस्','លុប','Burahin','Xóa'],
  close:['닫기','Close','बन्द','បិទ','Isara','Đóng'],
  none:['이 날짜에는 일정이 없습니다.','No events on this date.','यस दिन कुनै कार्यक्रम छैन।','គ្មានកាលវិភាគសម្រាប់ថ្ងៃនេះ។','Walang iskedyul sa araw na ito.','Không có lịch ngày này.'],
  translating:['5개 언어로 자동 번역 후 저장 중...','Translating to five languages...','पाँच भाषामा अनुवाद हुँदैछ...','កំពុងបកប្រែ ៥ ភាសា...','Isinasalin sa 5 wika...','Đang dịch sang 5 ngôn ngữ...'],
  failed:['처리 실패','Failed','असफल','បរាជ័យ','Nabigo','Thất bại'],
  confirm:['일정을 삭제하시겠습니까?','Delete event?','कार्यक्रम हटाउने?','លុបកាលវិភាគ?','Burahin ang iskedyul?','Xóa lịch này?'],
};
const langs:Lang[]=['ko','en','ne','km','tl','vi'];
function u(lang:Lang,key:keyof typeof I){return I[key][langs.indexOf(lang)]||I[key][0];}
function titleFor(row:EventRow,lang:Lang,field:'title'|'details'){
  const korean=field==='title'?row.title_ko:row.details_ko||'';
  if(lang==='ko')return korean;
  const translated=row[`${field}_${lang}` as keyof EventRow];
  return typeof translated==='string'&&translated.trim()&&translated!==korean?translated:'['+pu(lang,'translationMissing')+']';
}
const categories:Category[]=['production','training','inspection','holiday','other'];
export default function CalendarManager({lang,isAdmin}:{lang:Lang;isAdmin:boolean}){
  const [yearMonth,setYearMonth]=useState<{year:number;month:number}|null>(null);
  const [selected,setSelected]=useState('');
  const [events,setEvents]=useState<EventRow[]>([]);
  const [approvedLeaves,setApprovedLeaves]=useState<ApprovedLeave[]>([]);
  const [editing,setEditing]=useState<number|null>(null);
  const [formOpen,setFormOpen]=useState(false);
  const [title,setTitle]=useState('');const [details,setDetails]=useState('');
  const [team,setTeam]=useState<'all'|Team>('all');const [category,setCategory]=useState<Category>('production');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  useEffect(()=>{const d=new Date();setYearMonth({year:d.getFullYear(),month:d.getMonth()});setSelected(localDate(d));},[]);
  const load=useCallback(async()=>{
    if(!yearMonth)return;
    const start=localDate(new Date(yearMonth.year,yearMonth.month,1));
    const end=localDate(new Date(yearMonth.year,yearMonth.month+1,1));
    const {data,error}=await supabase.from('calendar_events').select('*').gte('event_date',start).lt('event_date',end).order('event_date');
    if(error)setError(error.message);else {setEvents((data||[]) as EventRow[]);setError('');}
    const {data:leaveData,error:leaveError}=await supabase.rpc('calendar_approved_leaves',{p_start:start,p_end:end});
    if(leaveError)setError(prev=>prev||leaveError.message);else setApprovedLeaves((leaveData||[]) as ApprovedLeave[]);
  },[yearMonth]);
  useEffect(()=>{void load();},[load]);
  const move=(n:number)=>setYearMonth(p=>{if(!p)return p;const d=new Date(p.year,p.month+n,1);return {year:d.getFullYear(),month:d.getMonth()};});
  const selectedEvents=events.filter(e=>e.event_date===selected);
  const count=yearMonth?new Date(yearMonth.year,yearMonth.month+1,0).getDate():0;
  const pad=yearMonth?new Date(yearMonth.year,yearMonth.month,1).getDay():0;
  const leaveForDate=(date:string)=>approvedLeaves.filter(x=>date>=x.start_date&&date<=x.end_date);
  const leaveLabel=(x:ApprovedLeave)=>`${x.staff_name} · ${pu(lang,x.leave_type==='annual'?'annual':x.leave_type==='unpaid'?'unpaid':x.leave_type==='am_half'?'am_half':'pm_half')}`;
  const reset=()=>{setEditing(null);setTitle('');setDetails('');setTeam('all');setCategory('production');setFormOpen(false);};
  const beginEdit=(e:EventRow)=>{setEditing(e.id);setSelected(e.event_date);setTitle(e.title_ko);setDetails(e.details_ko||'');setTeam(e.team as 'all'|Team);setCategory(e.category);setFormOpen(true);};
  const translate=async(text:string)=>{
    if(!text.trim())return {en:'',ne:'',km:'',tl:'',vi:''};
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token)throw new Error(t(lang,'loginRequired'));
    const res=await fetch('/api/translate-notice',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({text})});
    const result=await res.json();if(!res.ok)throw new Error(result.error||u(lang,'failed'));
    return result as {en:string;ne:string;km:string;tl:string;vi:string};
  };
  const save=async()=>{
    if(!isAdmin||busy||!title.trim()||!selected)return;
    setBusy(true);setError(u(lang,'translating'));
    try{
      const names=await translate(title.trim());const descriptions=await translate(details.trim());
      const values={event_date:selected,team,category,title_ko:title.trim(),details_ko:details.trim(),...Object.fromEntries((['en','ne','km','tl','vi'] as const).flatMap(l=>[[`title_${l}`,names[l]],[`details_${l}`,descriptions[l]]]))};
      const result=editing!==null?await supabase.from('calendar_events').update(values).eq('id',editing):await supabase.from('calendar_events').insert(values);
      if(result.error)throw new Error(result.error.message);
      reset();await load();setError('');
    }catch(e){setError(`${u(lang,'failed')}: ${e instanceof Error?e.message:String(e)}`);}finally{setBusy(false);}
  };
  const remove=async(id:number)=>{
    if(!isAdmin||!window.confirm(u(lang,'confirm')))return;
    setBusy(true);const {error}=await supabase.from('calendar_events').delete().eq('id',id);setBusy(false);
    if(error)setError(error.message);else await load();
  };
  return <div className="space-y-4">
    <div className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#145C42]">{u(lang,'heading')}</h2><div className="mt-3 flex items-center justify-between"><button onClick={()=>move(-1)} className="rounded-lg border px-4 py-2">‹</button><b>{yearMonth?`${yearMonth.year} / ${String(yearMonth.month+1).padStart(2,'0')}`:'...'}</b><button onClick={()=>move(1)} className="rounded-lg border px-4 py-2">›</button></div></div>
    {error&&<div role="status" className="rounded-lg bg-white p-3 text-sm text-red-700">{error}</div>}
    <div className="rounded-xl bg-white p-3 shadow-sm"><div className="grid grid-cols-7 gap-1 text-center">{(['sun','mon','tue','wed','thu','fri','sat'] as const).map(k=><b key={k} className="py-2 text-xs">{t(lang,k)}</b>)}{Array.from({length:pad+count},(_,i)=>{
      if(i<pad)return <div key={i}/>;
      const day=i-pad+1;const date=yearMonth?localDate(new Date(yearMonth.year,yearMonth.month,day)):'';
      return <button key={i} onClick={()=>{setSelected(date);reset();}} className={`relative flex min-h-16 flex-col items-start rounded-lg border p-1 text-left text-xs sm:min-h-24 ${selected===date?'border-[#168253] bg-green-100 font-bold':'border-gray-100 bg-[#FAFCFA]'}`}><span className="font-bold">{day}</span>{events.filter(e=>e.event_date===date).slice(0,2).map(e=><span key={`e${e.id}`} className="mt-1 w-full truncate rounded bg-green-100 px-1 text-[10px] text-green-900">{titleFor(e,lang,'title')}</span>)}{leaveForDate(date).slice(0,2).map((l,i)=><span key={`l${i}`} className="mt-1 w-full truncate rounded bg-blue-100 px-1 text-[10px] text-blue-900">{leaveLabel(l)}</span>)}{events.filter(e=>e.event_date===date).length+leaveForDate(date).length>4&&<span className="text-[10px] text-gray-500">+{events.filter(e=>e.event_date===date).length+leaveForDate(date).length-4} {pu(lang,'eventMore')}</span>}</button>;
    })}</div></div>
    <section className="rounded-xl bg-white p-4 shadow-sm"><h3 className="mb-3 font-bold text-[#145C42]">{({ko:'월간 일정 목록 · 날짜 / 내용',en:'Monthly event list · Date / Details',ne:'मासिक सूची · मिति / विवरण',km:'បញ្ជីប្រចាំខែ · កាលបរិច្ឆេទ / ព័ត៌មាន',tl:'Buwanang listahan · Petsa / Detalye',vi:'Danh sách tháng · Ngày / Nội dung'} as Record<Lang,string>)[lang]}</h3><div className="max-h-72 space-y-2 overflow-y-auto">{[...events.map(e=>({key:'e'+e.id,date:e.event_date,label:titleFor(e,lang,'title')})),...approvedLeaves.map((l,i)=>({key:'l'+i,date:l.start_date,label:leaveLabel(l)+(l.end_date!==l.start_date?' ~ '+l.end_date:'')}))].sort((a,b)=>a.date.localeCompare(b.date)).map(item=><button type="button" key={item.key} onClick={()=>setSelected(item.date)} className="flex w-full gap-3 rounded-lg border border-gray-100 p-2 text-left text-sm hover:bg-green-50"><span className="shrink-0 font-bold text-[#145C42]">{item.date}</span><span>{item.label}</span></button>)}</div></section>
    <div className="rounded-xl bg-white p-4 shadow-sm"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-[#145C42]">{formatDay(selected,lang)}</h3>{isAdmin&&<button onClick={()=>{reset();setFormOpen(true);}} className="rounded-lg bg-[#168253] px-3 py-2 text-sm text-white">+ {u(lang,'new')}</button>}</div>
      {leaveForDate(selected).length>0&&<div className="mb-3 rounded-lg bg-blue-50 p-3"><h4 className="mb-2 text-sm font-bold text-blue-900">{pu(lang,'calendarLeave')}</h4>{leaveForDate(selected).map((l,i)=><p key={i} className="py-1 text-sm text-blue-900">{leaveLabel(l)}</p>)}</div>}
      {selectedEvents.length===0?<p className="py-4 text-sm text-gray-500">{u(lang,'none')}</p>:<div className="space-y-2">{selectedEvents.map(e=><article key={e.id} className="rounded-lg border p-3"><div className="flex flex-wrap gap-2 text-xs text-[#168253]"><span>{e.team==='all'?u(lang,'all'):t(lang,e.team as Team)}</span><span>{u(lang,e.category)}</span></div><b className="mt-1 block">{titleFor(e,lang,'title')}</b>{e.details_ko&&<p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{titleFor(e,lang,'details')}</p>}{isAdmin&&<div className="mt-3 flex gap-2"><button onClick={()=>beginEdit(e)} className="rounded border px-3 py-1 text-xs">{u(lang,'edit')}</button><button onClick={()=>remove(e.id)} className="rounded border border-red-200 px-3 py-1 text-xs text-red-700">{u(lang,'del')}</button></div>}</article>)}</div>}
    </div>
    {isAdmin&&formOpen&&<div className="rounded-xl border border-green-200 bg-white p-5 shadow-sm"><h3 className="mb-3 font-bold">{u(lang,editing===null?'new':'edit')}</h3><label className="mb-2 block text-sm">{u(lang,'date')}<input className="mt-1 w-full rounded-lg border p-2" type="date" value={selected} onChange={e=>setSelected(e.target.value)}/></label><label className="mb-2 block text-sm">{u(lang,'title')}<input maxLength={200} className="mt-1 w-full rounded-lg border p-2" value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="mb-2 block text-sm">{u(lang,'detail')}<textarea maxLength={4000} rows={3} className="mt-1 w-full rounded-lg border p-2" value={details} onChange={e=>setDetails(e.target.value)}/></label><div className="grid grid-cols-2 gap-2"><label className="text-sm">{u(lang,'target')}<select className="mt-1 w-full rounded-lg border p-2" value={team} onChange={e=>setTeam(e.target.value as 'all'|Team)}><option value="all">{u(lang,'all')}</option><option value="vacuum">{t(lang,'vacuum')}</option><option value="newmaterial">{t(lang,'newmaterial')}</option></select></label><label className="text-sm">{u(lang,'category')}<select className="mt-1 w-full rounded-lg border p-2" value={category} onChange={e=>setCategory(e.target.value as Category)}>{categories.map(c=><option key={c} value={c}>{u(lang,c)}</option>)}</select></label></div><div className="mt-4 flex gap-2"><button disabled={busy||!title.trim()} onClick={save} className="rounded-lg bg-[#168253] px-4 py-2 text-white disabled:opacity-40">{u(lang,'save')}</button><button onClick={reset} className="rounded-lg border px-4 py-2">{u(lang,'close')}</button></div></div>}
  </div>;
}

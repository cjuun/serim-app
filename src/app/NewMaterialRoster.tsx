'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import {addDays,formatDay,localDate,monday,type Lang} from './i18n';
const GROUP1=['박원식','로타'];
const GROUP2=['주우팔','이은','소팟'];
const PROCESS_NIGHT=['김현준','박세영'];
const PROCESS_DAY=['김석희','강동효','송규옥','장숙이','디팍싱','판넛','비노드','김미숙'];
type Shift='day'|'night';
type Row={employee_name:string;shift:Shift};
export default function NewMaterialRoster({lang,isAdmin}:{lang:Lang;isAdmin:boolean}){
 const [date,setDate]=useState('');const [rows,setRows]=useState<Row[]>([]);const [group1Shift,setGroup1Shift]=useState<Shift>('day');const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 const start=date?monday(date):'';const end=start?addDays(start,6):'';
 useEffect(()=>{
  if(!start)return;
  const weeks=Math.floor((Date.parse(start+'T00:00:00Z')-Date.UTC(2026,10,23))/604800000);
  setGroup1Shift(((weeks%2)+2)%2===0?'day':'night');
 },[start]);
 useEffect(()=>setDate(localDate(new Date())),[]);
 const load=useCallback(async()=>{if(!start)return;setLoading(true);const {data,error}=await supabase.from('weekly_assignments').select('employee_name,shift').eq('week_start',start).eq('team','newmaterial');if(error)setMessage(error.message);else {setRows((data??[]) as Row[]);const current=(data??[]).find(x=>x.employee_name==='박원식');if(current)setGroup1Shift(current.shift as Shift);}setLoading(false);},[start]);
 useEffect(()=>{void load();},[load]);
 const save=async()=>{if(!isAdmin||busy||!start)return;setBusy(true);setMessage('');const {error}=await supabase.rpc('save_newmaterial_week',{p_week_start:start,p_group1_shift:group1Shift});setBusy(false);setMessage(error?error.message:'근무 편성이 저장되었습니다.');if(!error)void load();};
 const shiftOf=(name:string):Shift=>rows.find(x=>x.employee_name===name)?.shift??(GROUP1.includes(name)?group1Shift:GROUP2.includes(name)?(group1Shift==='day'?'night':'day'):PROCESS_NIGHT.includes(name)?'night':'day');
 const labels={ko:['신소재생산팀 교대근무','압출실 · 1주 단위','가공실 · 주야 고정','1조 주간','1조 야간','근무표 저장'],en:['New material shifts','Extrusion · Weekly rotation','Processing · Fixed shifts','Group 1 day','Group 1 night','Save shifts'],ne:['नयाँ सामग्री सिफ्ट','एक्सट्रुसन · साप्ताहिक','प्रशोधन · स्थिर सिफ्ट','समूह १ दिन','समूह १ रात','सिफ्ट सुरक्षित गर्नुहोस्'],km:['វេនផលិតកម្មសម្ភារៈថ្មី','បញ្ចេញ · ប្រចាំសប្ដាហ៍','កែច្នៃ · វេនថេរ','ក្រុម១ ថ្ងៃ','ក្រុម១ យប់','រក្សាទុក'],tl:['New material shifts','Extrusion · Lingguhan','Processing · Nakatakdang shift','Group 1 araw','Group 1 gabi','I-save'],vi:['Ca làm việc vật liệu mới','Đùn · Đổi ca hàng tuần','Gia công · Ca cố định','Nhóm 1 ca ngày','Nhóm 1 ca đêm','Lưu lịch'] }[lang];
 const block=(title:string,people:string[])=><section className="rounded-xl border bg-white p-4"><h3 className="mb-2 font-bold text-[#145C42]">{title}</h3><div className="flex flex-wrap gap-2">{people.map(name=><span key={name} className={`rounded-lg px-3 py-2 text-sm ${shiftOf(name)==='day'?'bg-green-100 text-green-900':'bg-indigo-100 text-indigo-900'}`}>{name} · {shiftOf(name)==='day'?'☀️':'🌙'}</span>)}</div></section>;
 return <div className="space-y-4"><div className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-[#145C42]">{labels[0]}</h2><div className="mt-3 flex items-center justify-between gap-2"><button onClick={()=>setDate(addDays(date,-7))} className="rounded border px-3 py-2">‹</button><div className="text-center text-sm font-semibold">{formatDay(start,lang)} ~ {formatDay(end,lang)}</div><button onClick={()=>setDate(addDays(date,7))} className="rounded border px-3 py-2">›</button></div></div>{message&&<div className="rounded-xl border bg-white p-3 text-sm">{message}</div>}
 {isAdmin&&<div className="rounded-xl border bg-white p-4"><p className="mb-3 font-bold">{labels[1]}</p><div className="grid grid-cols-2 gap-2"><button onClick={()=>setGroup1Shift('day')} className={`rounded-lg border p-3 ${group1Shift==='day'?'bg-green-100 font-bold':''}`}>{labels[3]}</button><button onClick={()=>setGroup1Shift('night')} className={`rounded-lg border p-3 ${group1Shift==='night'?'bg-indigo-100 font-bold':''}`}>{labels[4]}</button></div><p className="my-2 text-xs text-gray-500">1조 · 박원식, 로타 / 2조 · 주우팔, 이은, 소팟 (반대 근무조)</p><button disabled={busy||!date} onClick={save} className="mt-2 w-full rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-50">{labels[5]}</button></div>}
 {loading?<div className="rounded-xl bg-white p-5">Loading...</div>:rows.length===0?<div className="rounded-xl bg-white p-5 text-sm text-gray-600">해당 주간 근무표가 아직 저장되지 않았습니다. (No published roster)</div>:<>{block(labels[1]+' · 1조',GROUP1)}{block(labels[1]+' · 2조',GROUP2)}{block(labels[2]+' · ☀️',PROCESS_DAY)}{block(labels[2]+' · 🌙',PROCESS_NIGHT)}</>}</div>;
}

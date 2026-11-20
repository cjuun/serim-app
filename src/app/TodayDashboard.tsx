'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import {localDate,t,type Lang,type Team,type Status} from './i18n';
type Attendance={team:Team;shift:'day'|'night';status:Status};
type Event={id:number;event_date:string;title_ko:string;title_en:string|null;title_ne:string|null;title_km:string|null;title_tl:string|null;title_vi:string|null};
const words={ko:['오늘의 출석 현황','확정된 출근표 기준','오늘 일정','확정된 팀','출근 현황 없음'],en:["Today's Attendance",'Confirmed sheets only',"Today's schedule",'Confirmed teams','No confirmed attendance'],ne:['आजको उपस्थिति','पुष्टि भएको सूची मात्र','आजका कार्यक्रम','पुष्टि टोली','पुष्टि गरिएको उपस्थिति छैन'],km:['វត្តមានថ្ងៃនេះ','តែបញ្ជីដែលបានបញ្ជាក់','កាលវិភាគថ្ងៃនេះ','ក្រុមបានបញ្ជាក់','មិនមានវត្តមានដែលបានបញ្ជាក់ទេ'],tl:['Attendance ngayong araw','Kumpirmadong tala lamang','Iskedyul ngayon','Kumpirmadong team','Walang kumpirmadong attendance'],vi:['Chấm công hôm nay','Chỉ bảng đã xác nhận','Lịch hôm nay','Đội đã xác nhận','Chưa có bảng chấm công xác nhận']};
export default function TodayDashboard({lang}:{lang:Lang}){
  const [date,setDate]=useState('');const [data,setData]=useState<Attendance[]>([]);const [confirmations,setConfirmations]=useState<Team[]>([]);const [events,setEvents]=useState<Event[]>([]);const [error,setError]=useState('');
  useEffect(()=>setDate(localDate(new Date())),[]);
  const load=useCallback(async()=>{
    if(!date)return;
    const [c,a,e]=await Promise.all([
      supabase.from('attendance_confirmations').select('team').eq('work_date',date),
      supabase.from('daily_attendance').select('team,shift,status').eq('work_date',date),
      supabase.from('calendar_events').select('id,event_date,title_ko,title_en,title_ne,title_km,title_tl,title_vi').eq('event_date',date),
    ]);
    const problems=[c.error,a.error,e.error].filter(Boolean).map(x=>x!.message);
    if(problems.length){setError(problems.join(' / '));return;}
    const teams=(c.data||[]).map(x=>x.team as Team);
    setConfirmations(teams);
    setData(((a.data||[]) as Attendance[]).filter(x=>teams.includes(x.team)));
    setEvents((e.data||[]) as Event[]);
    setError('');
  },[date]);
  useEffect(()=>{void load();},[load]);
  const w=words[lang];
  const title=(e:Event)=>{if(lang==='ko')return e.title_ko;const value=e[`title_${lang}` as keyof Event];return typeof value==='string'&&value?value:e.title_ko;};
  return <div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-white p-5 shadow-sm"><div className="mb-1 text-sm text-[#168253]">{date}</div><h3 className="font-bold text-[#145C42]">{w[0]}</h3><p className="mt-1 text-xs text-gray-500">{w[1]}</p><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg bg-green-50 p-3"><b className="text-xl text-[#168253]">{data.filter(r=>r.shift==='day').length}</b><p className="text-xs">{t(lang,'day')}</p></div><div className="rounded-lg bg-blue-50 p-3"><b className="text-xl text-blue-700">{data.filter(r=>r.shift==='night').length}</b><p className="text-xs">{t(lang,'night')}</p></div></div><p className="mt-3 text-xs text-gray-500">{w[3]}: {confirmations.map(code=>t(lang,code)).join(', ')||w[4]}</p><div className="mt-3 flex flex-wrap gap-2">{(['present','annual','unpaid','am_half','pm_half'] as Status[]).map(s=><span key={s} className="rounded bg-gray-100 px-2 py-1 text-xs">{t(lang,s)} {data.filter(r=>r.status===s).length}</span>)}</div></div><div className="rounded-xl bg-white p-5 shadow-sm"><div className="mb-1 text-sm text-[#168253]">{date}</div><h3 className="font-bold text-[#145C42]">{w[2]}</h3>{events.length?<ul className="mt-3 space-y-2">{events.map(e=><li key={e.id} className="border-b py-2 text-sm">{title(e)}</li>)}</ul>:<p className="mt-3 text-sm text-gray-500">{t(lang,'noEvents')}</p>}</div>{error&&<div className="rounded-lg bg-white p-3 text-xs text-red-600 md:col-span-2">{error}</div>}</div>;
}

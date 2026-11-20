'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';
import {employees,localDate,t,type Lang,type Team,type Status} from './i18n';
type RecordRow={work_date:string;employee_name:string;employee_role:string;team:Team;shift:string;status:Status};
const statuses:Status[]=['present','annual','unpaid','am_half','pm_half'];
const word={ko:['월별 출석 보고서','월 선택','조회','CSV 다운로드','총 기록','해당 월에 기록이 없습니다.'],en:['Monthly attendance report','Month','Load','Download CSV','Records','No records this month.'],ne:['मासिक उपस्थिति रिपोर्ट','महिना','खोज्नुहोस्','CSV डाउनलोड','अभिलेख','यस महिनाको रेकर्ड छैन।'],km:['របាយការណ៍វត្តមានប្រចាំខែ','ខែ','ស្វែងរក','ទាញយក CSV','កំណត់ត្រា','គ្មានទិន្នន័យ'],tl:['Buwanang ulat ng attendance','Buwan','Tingnan','I-download ang CSV','Mga rekord','Walang rekord ngayong buwan.'],vi:['Báo cáo chấm công tháng','Tháng','Xem','Tải CSV','Bản ghi','Không có dữ liệu tháng này.']};
const words=(lang:Lang,i:number)=>word[lang][i];
function csvValue(v:string){const safe=/^[=+@\-\t\r]/.test(v)?`'${v}`:v;return '"'+safe.replaceAll('"','""')+'"';}
export default function AttendanceReport({lang,isAdmin}:{lang:Lang;isAdmin:boolean}){
  const [month,setMonth]=useState('');const [team,setTeam]=useState<Team>('vacuum');const [rows,setRows]=useState<RecordRow[]>([]);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
  useEffect(()=>setMonth(localDate(new Date()).slice(0,7)),[]);
  const fetchMonth=useCallback(async()=>{
    if(!isAdmin||!month)return;
    setLoading(true);setError('');
    const [year,m]=month.split('-').map(Number);const from=`${month}-01`;const next=localDate(new Date(year,m,1));
    const {data,error}=await supabase.from('daily_attendance').select('work_date,employee_name,employee_role,team,shift,status').eq('team',team).gte('work_date',from).lt('work_date',next).order('work_date');
    if(error)setError(error.message);else setRows((data||[]) as RecordRow[]);
    setLoading(false);
  },[month,team,isAdmin]);
  useEffect(()=>{void fetchMonth();},[fetchMonth]);
  const summary=useMemo(()=>employees[team].map(e=>({name:e.name,role:e.role,counts:statuses.map(s=>rows.filter(r=>r.employee_name===e.name&&r.status===s).length)})),[rows,team]);
  const download=()=>{
    const header=['날짜','팀','직원','구분','근무조','출석상태'];
    const data=rows.map(r=>[r.work_date,r.team==='vacuum'?'진공성형팀':'신소재생산팀',r.employee_name,r.employee_role==='operator'?'오퍼레이터':'작업자',r.shift==='day'?'주간':'야간',t('ko',r.status)]);
    const csv='\uFEFF'+[header,...data].map(line=>line.map(x=>csvValue(String(x))).join(',')).join('\r\n');
    const a=document.createElement('a');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));a.href=url;a.download=`serim_attendance_${team}_${month}.csv`;a.click();URL.revokeObjectURL(url);
  };
  if(!isAdmin)return <div className="rounded-xl bg-white p-6">{t(lang,'loginRequired')}</div>;
  return <div className="space-y-4"><div className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#145C42]">{words(lang,0)}</h2><div className="mt-4 flex flex-wrap gap-2"><label className="text-sm">{words(lang,1)}<input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="mt-1 block rounded-lg border p-2"/></label><label className="text-sm">{t(lang,'division')}<select className="mt-1 block rounded-lg border p-2" value={team} onChange={e=>setTeam(e.target.value as Team)}><option value="vacuum">{t(lang,'vacuum')}</option><option value="newmaterial">{t(lang,'newmaterial')}</option></select></label></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={fetchMonth} className="rounded-lg border px-4 py-2 text-sm">{words(lang,2)}</button><button disabled={!rows.length} onClick={download} className="rounded-lg bg-[#168253] px-4 py-2 text-sm text-white disabled:opacity-40">{words(lang,3)}</button></div></div>
  {error&&<div className="rounded-lg bg-white p-3 text-red-700">{error}</div>}
  {loading?<div className="rounded-lg bg-white p-4">{t(lang,'loading')}</div>:<><div className="rounded-xl bg-white p-4 font-semibold">{words(lang,4)}: {rows.length}</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{statuses.map(s=><div key={s} className="rounded-lg bg-white p-3 text-center shadow-sm"><div className="text-xl font-bold text-[#168253]">{rows.filter(r=>r.status===s).length}</div><div className="text-xs">{t(lang,s)}</div></div>)}</div><div className="overflow-x-auto rounded-xl bg-white p-3 shadow-sm"><table className="w-full min-w-[520px] text-sm"><thead><tr className="border-b text-left"><th className="p-2">{t(lang,'worker')}</th>{statuses.map(s=><th key={s} className="p-2">{t(lang,s)}</th>)}</tr></thead><tbody>{summary.map(e=><tr key={e.name} className="border-b"><th className="p-2 text-left">{e.name}</th>{e.counts.map((count,i)=><td className="p-2" key={i}>{count}</td>)}</tr>)}</tbody></table></div>{rows.length===0&&<p className="rounded-lg bg-white p-4 text-sm">{words(lang,5)}</p>}</>}
  </div>;
}

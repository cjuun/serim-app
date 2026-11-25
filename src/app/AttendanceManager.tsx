'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';
import {addDays,employees,formatDay,localDate,monday,t, type Key,type Lang,type Role,type Shift,type Status,type Team} from './i18n';

type Assignment = {week_start:string;employee_name:string;employee_role:Role;team:Team;shift:Shift};
type RecordRow = {work_date:string;employee_name:string;employee_role:Role;team:Team;shift:Shift;status:Status};
const statusKeys: Status[]=['present','annual','unpaid','am_half','pm_half'];
const cls='rounded-xl border border-[#DFE9E1] bg-white p-4 shadow-sm';
export default function AttendanceManager({team,isAdmin,lang}:{team:Team;isAdmin:boolean;lang:Lang}) {
  const [directory,setDirectory]=useState<{name:string;role:Role}[]|null>(null);
  const people=directory??employees[team];
  useEffect(()=>{
    let cancelled=false;
    void supabase.from('staff_members').select('full_name,employee_role').eq('team',team).eq('active',true).order('id').then(({data,error})=>{
      if(!cancelled&&!error)setDirectory((data||[]).map(x=>({name:x.full_name,role:x.employee_role as Role})));
    });
    return()=>{cancelled=true;};
  },[team]);
  const [search,setSearch]=useState('');
  const [date,setDate]=useState('');
  const [shift,setShift]=useState<Shift>('day');
  const [assignments,setAssignments]=useState<Assignment[]>([]);
  const [records,setRecords]=useState<RecordRow[]>([]);
  const [statuses,setStatuses]=useState<Record<string,Status>>({});
  const [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState('');
  const [refresh,setRefresh]=useState(0);
  const week=date?monday(date):'';
  useEffect(()=>setDate(localDate(new Date())),[]);
  const load=useCallback(async()=>{
    if(!date) return;
    setLoading(true);
    const [c,r,a]=await Promise.all([
      supabase.from('attendance_confirmations').select('team').eq('work_date',date).eq('team',team).maybeSingle(),
      supabase.from('daily_attendance').select('*').eq('work_date',date).eq('team',team),
      isAdmin ? supabase.from('weekly_assignments').select('*').eq('week_start',week).eq('team',team) : Promise.resolve({data:[],error:null}),
    ]);
    const error=c.error||r.error||a.error;
    if(error)setMessage(`${t(lang,'fail')}: ${error.message}`);
    setConfirmed(!!c.data);
    const rows=(r.data||[]) as RecordRow[];
    setRecords(rows);
    setStatuses(Object.fromEntries(rows.map(x=>[x.employee_name,x.status])));
    setAssignments((a.data||[]) as Assignment[]);
    setLoading(false);
  },[date,team,isAdmin,week,lang]);
  useEffect(()=>{void load();},[load,refresh]);
  const visible=useMemo(()=>{
    if(isAdmin)return assignments.filter(x=>x.shift===shift&&people.some(p=>p.name===x.employee_name)).map(x=>({name:x.employee_name,role:x.employee_role}));
    if(!confirmed)return [];
    return records.filter(x=>x.shift===shift&&people.some(p=>p.name===x.employee_name)).map(x=>({name:x.employee_name,role:x.employee_role}));
  },[isAdmin,confirmed,assignments,records,shift,people]);
  visible.sort((a,b)=>people.findIndex(x=>x.name===a.name)-people.findIndex(x=>x.name===b.name));
  const allChecked=assignments.length===people.length && assignments.every(x=>!!statuses[x.employee_name]);
  const markAllPresent=()=>{
    if(!isAdmin||confirmed||busy)return;
    // Do not overwrite leave/half-day selections or approved leave records.
    setStatuses(prev=>{
      const next={...prev};
      assignments.forEach(row=>{if(!next[row.employee_name])next[row.employee_name]='present';});
      return next;
    });
  };
  const save=async(finalize:boolean)=>{
    if(!isAdmin||busy||confirmed||!date)return;
    if(assignments.length!==people.length){setMessage(t(lang,'missingPeople'));return;}
    if(finalize&&!allChecked){setMessage(t(lang,'missingCheck'));return;}
    setBusy(true);setMessage('');
    const rows=assignments.filter(x=>statuses[x.employee_name]).map(x=>({
      work_date:date,employee_name:x.employee_name,employee_role:x.employee_role,team,shift:x.shift,
      status:statuses[x.employee_name],updated_at:new Date().toISOString(),
    }));
    if(rows.length){
      const {error}=await supabase.from('daily_attendance').upsert(rows,{onConflict:'work_date,employee_name'});
      if(error){setMessage(`${t(lang,'fail')}: ${error.message}`);setBusy(false);return;}
    }
    if(finalize){
      const {error}=await supabase.rpc('confirm_attendance',{p_date:date,p_team:team});
      setMessage(error?`${t(lang,'fail')}: ${error.message}`:t(lang,'published'));
    }else setMessage(t(lang,'saved'));
    setBusy(false);setRefresh(x=>x+1);
  };
  const reopen=async()=>{
    if(!isAdmin||busy||!confirmed||!window.confirm(t(lang,'confirmReopen')))return;
    setBusy(true);
    const {error}=await supabase.from('attendance_confirmations').delete().eq('work_date',date).eq('team',team);
    setMessage(error?`${t(lang,'fail')}: ${error.message}`:t(lang,'reopenDone'));
    setBusy(false);setRefresh(x=>x+1);
  };
  const group=(role:Role)=>{
    if(team==='newmaterial'&&role==='operator')return null;
    const members=visible.filter(x=>x.role===role&&x.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
    return <section className="space-y-2" key={role}>
      <h3 className="font-bold text-[#145C42]">{t(lang,role)} ({members.length} {t(lang,'people')})</h3>
      {members.length===0?<div className={cls}>{t(lang,'unassigned')}</div>:members.map(e=><div key={e.name} className={cls}>
        <div className="mb-2 flex items-center justify-between gap-2"><b>{e.name}</b><span className="rounded-full bg-[#E1F3E9] px-2 py-1 text-xs">{statuses[e.name]?t(lang,statuses[e.name]):t(lang,'unchecked')}</span></div>
        {isAdmin&&!confirmed&&<div className="grid grid-cols-5 gap-1">{statusKeys.map(s=><button key={s} onClick={()=>setStatuses(prev=>({...prev,[e.name]:s}))} className={`min-w-0 rounded-md px-0.5 py-2 text-[10px] sm:text-xs ${statuses[e.name]===s?'bg-[#168253] font-bold text-white':'bg-gray-100 text-gray-700'}`}>{t(lang,s)}</button>)}</div>}
      </div>)}
    </section>;
  };
  return <div className="space-y-5">
    <div className={cls}>
      <div className="text-sm font-semibold text-[#168253]">{t(lang,'division')} / {t(lang,team)}</div>
      <h2 className="mt-1 text-xl font-bold text-[#145C42]">{t(lang,'dailyAttendance')}</h2>
      <p className="mt-3 text-sm text-gray-500">{t(lang,'workDate')}</p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button className="rounded-lg border px-3 py-2" disabled={!date} onClick={()=>setDate(addDays(date,-1))}>‹</button>
        <input type="date" className="min-w-0 rounded-lg border p-2" value={date} onChange={e=>setDate(e.target.value)}/>
        <button className="rounded-lg border px-3 py-2" disabled={!date} onClick={()=>setDate(addDays(date,1))}>›</button>
      </div>
      <p className="mt-2 text-center font-semibold">{formatDay(date,lang)}</p>
      <p className="text-center text-xs text-gray-500">{t(lang,'weekPeriod')}: {week} ~ {week?addDays(week,6):''}</p>
    </div>
    {message&&<div role="status" className={cls}>{message}</div>}
    <div className="grid grid-cols-2 gap-2">{(['day','night'] as Shift[]).map(s=><button key={s} onClick={()=>setShift(s)} className={`rounded-xl border p-4 font-bold ${shift===s?'border-[#168253] bg-[#E0F4E7] text-[#145C42]':'bg-white text-gray-600'}`}>{s==='day'?'☀️':'🌙'} {t(lang,s)}</button>)}</div>
    <div className={`${cls} flex items-center justify-between`}><b>{t(lang,team)}</b><span className="text-sm">{t(lang,confirmed?'confirmed':'unconfirmed')}</span></div>
    {loading?<div className={cls}>{t(lang,'loading')}</div>:!isAdmin&&!confirmed?<div className={cls}>{t(lang,'notPublished')}</div>:<>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{statusKeys.map(s=><div className="rounded-lg bg-white p-2 text-center shadow-sm" key={s}><div className="text-xl font-bold text-[#168253]">{visible.filter(e=>statuses[e.name]===s).length}</div><div className="text-xs">{t(lang,s)}</div></div>)}</div>
      {isAdmin&&!confirmed&&<button onClick={markAllPresent} disabled={busy||assignments.length===0} className="w-full rounded-xl border border-[#168253] bg-[#E3F5E9] p-3 text-sm font-bold text-[#145C42] disabled:opacity-50">✓ {({ko:'미체크 인원 전원 출근처리',en:'Mark all unchecked as present',ne:'सबै जाँच नभएकालाई उपस्थित',km:'កំណត់អ្នកមិនទាន់ធីកថាមកធ្វើការ',tl:'Markahan ang lahat ng hindi pa na-check bilang pumasok',vi:'Đánh dấu đi làm cho tất cả người chưa kiểm tra'} as Record<Lang,string>)[lang]}</button>}
      <div className={cls}><label className="block text-sm font-semibold text-[#145C42]">{({ko:'직원 검색',en:'Search employees',ne:'कर्मचारी खोज्नुहोस्',km:'ស្វែងរកបុគ្គលិក',tl:'Maghanap ng empleyado',vi:'Tìm nhân viên'} as Record<Lang,string>)[lang]}</label><input className="mt-2 w-full rounded-lg border bg-white p-3 text-gray-900" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search / 이름"/></div>
      {group('operator')}{group('worker')}
      {isAdmin&&<div className="sticky bottom-3 rounded-xl border border-green-200 bg-white p-4 shadow-lg"><div className="mb-2 text-sm">{t(lang,'progress')}: {assignments.filter(x=>statuses[x.employee_name]).length} / {people.length} {t(lang,'people')}</div>
        {confirmed?<button disabled={busy} onClick={reopen} className="w-full rounded-lg border border-orange-400 p-3 font-bold text-orange-700">{t(lang,'reopen')}</button>:<div className="grid grid-cols-2 gap-2"><button disabled={busy||assignments.length!==people.length} onClick={()=>save(false)} className="rounded-lg border border-[#168253] p-3 font-bold text-[#168253] disabled:opacity-40">{t(lang,'savedTemp')}</button><button disabled={busy||!allChecked} onClick={()=>save(true)} className="rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-40">{t(lang,'confirmAttendance')}</button></div>}
      </div>}
    </>}
  </div>;
}

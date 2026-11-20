'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';
import {addDays,employees,formatDay,t, type Lang,type Role,type Shift,type Team} from './i18n';
const BASE='2026-11-23';
function cycleIndexFor(today:Date){
  const d=Date.UTC(today.getFullYear(),today.getMonth(),today.getDate());
  const b=Date.UTC(2026,10,23);
  return Math.max(0,Math.floor((d-b)/86400000/14));
}
type Saved = {employee_name:string;employee_role:Role;shift:Shift};
const card='rounded-xl border border-[#DFE9E1] bg-white p-4 shadow-sm';
export default function ShiftRoster({team,isAdmin,lang}:{team:Team;isAdmin:boolean;lang:Lang}){
  const [directory,setDirectory]=useState<{name:string;role:Role}[]|null>(null);
  const people=directory??employees[team];
  useEffect(()=>{
    if(!isAdmin){setDirectory(null);return;}
    let cancelled=false;
    void supabase.from('staff_members').select('full_name,employee_role').eq('team',team).eq('active',true).order('id').then(({data,error})=>{
      if(!cancelled&&!error)setDirectory((data||[]).map(x=>({name:x.full_name,role:x.employee_role as Role})));
    });
    return()=>{cancelled=true;};
  },[team,isAdmin]);
  const [index,setIndex]=useState(0);
  const [draft,setDraft]=useState<Record<string,Shift|''>>({});
  const [saved,setSaved]=useState<Saved[]>([]);
  const [editing,setEditing]=useState(false);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [refresh,setRefresh]=useState(0);
  const start=useMemo(()=>addDays(BASE,index*14),[index]);
  const end=addDays(start,13);
  useEffect(()=>setIndex(cycleIndexFor(new Date())),[]);
  const load=useCallback(async()=>{
    setLoading(true);
    const {data,error}=await supabase.from('shift_cycle_assignments').select('employee_name,employee_role,shift').eq('cycle_start',start).eq('team',team);
    if(error)setMessage(`${t(lang,'fail')}: ${error.message}`);
    const rows=(data||[]) as Saved[];setSaved(rows);
    const m:Record<string,Shift|''>={};people.forEach(x=>m[x.name]='');rows.forEach(x=>{if(x.employee_name in m)m[x.employee_name]=x.shift;});setDraft(m);
    setLoading(false);
  },[start,team,people,lang]);
  useEffect(()=>{void load();},[load,refresh]);
  useEffect(()=>{setEditing(false);setMessage('');},[team,index]);
  const found=Object.fromEntries(saved.map(x=>[x.employee_name,x.shift]));
  const complete=saved.length>0 && (!isAdmin || (saved.length===people.length && people.every(e=>found[e.name])));
  const selected=people.filter(x=>!!draft[x.name]).length;
  const setAll=(shift:Shift)=>setDraft(Object.fromEntries(people.map(x=>[x.name,shift])));
  const swap=()=>setDraft(p=>Object.fromEntries(people.map(x=>[x.name,p[x.name]==='day'?'night':p[x.name]==='night'?'day':''])));
  const copy=async()=>{
    if(index===0||busy)return;
    setBusy(true);
    const {data,error}=await supabase.from('shift_cycle_assignments').select('employee_name,shift').eq('cycle_start',addDays(start,-14)).eq('team',team);
    setBusy(false);
    if(error){setMessage(`${t(lang,'fail')}: ${error.message}`);return;}
    if(!data||data.length!==people.length){setMessage(t(lang,'noRoster'));return;}
    setDraft(Object.fromEntries(data.map(x=>[x.employee_name,x.shift as Shift])));
    setMessage(t(lang,'saved'));
  };
  const autoSuggest=async()=>{
    if(!isAdmin||busy||index===0)return;
    setBusy(true);setMessage('');
    const {data,error}=await supabase.from('shift_cycle_assignments')
      .select('employee_name,shift').eq('cycle_start',addDays(start,-14)).eq('team',team);
    setBusy(false);
    if(error){setMessage(`${t(lang,'fail')}: ${error.message}`);return;}
    const old=Object.fromEntries((data||[]).map(row=>[row.employee_name,row.shift]));
    if(!people.every(e=>old[e.name]==='day'||old[e.name]==='night')){setMessage(t(lang,'noRoster'));return;}
    setDraft(Object.fromEntries(people.map(e=>[e.name,old[e.name]==='day'?'night':'day'])));
    setMessage(t(lang,'suggestReady'));
  };
  const save=async()=>{
    if(!isAdmin||busy)return;
    if(selected!==people.length){setMessage(t(lang,'missingPeople'));return;}
    setBusy(true);setMessage('');
    const {error}=await supabase.rpc('save_shift_cycle',{
      p_cycle_start:start,p_team:team,
      p_people:people.map(x=>({employee_name:x.name,employee_role:x.role,shift:draft[x.name]})),
    });
    setBusy(false);
    if(error){setMessage(`${t(lang,'fail')}: ${error.message}`);return;}
    setMessage(t(lang,'saved'));setEditing(false);setRefresh(x=>x+1);
  };
  const editor=(role:Role)=>{
    if(team==='newmaterial'&&role==='operator')return null;
    const group=people.filter(x=>x.role===role);
    return <section key={role}><h4 className="mb-2 font-bold">{t(lang,role)} ({group.length} {t(lang,'people')})</h4>{group.map(p=><div key={p.name} className="grid grid-cols-[minmax(65px,1fr)_auto_auto] items-center gap-2 border-b py-2"><span className="text-sm">{p.name}</span>{(['day','night'] as Shift[]).map(s=><button key={s} onClick={()=>setDraft(prev=>({...prev,[p.name]:s}))} className={`rounded-lg px-2 py-2 text-xs ${draft[p.name]===s?(s==='day'?'bg-[#168253] text-white':'bg-[#394E79] text-white'):'bg-gray-100 text-gray-600'}`}>{s==='day'?'☀️':'🌙'} {t(lang,s)}</button>)}</div>)}</section>;
  };
  const display=(s:Shift)=>{
    const members=(isAdmin?people:saved.map(x=>({name:x.employee_name,role:x.employee_role}))).filter(x=>found[x.name]===s);
    return <section className={`rounded-xl border p-4 ${s==='day'?'border-green-200 bg-[#EDF8F0]':'border-blue-200 bg-[#EEF2FB]'}`} key={s}>
      <h3 className="mb-3 text-lg font-bold">{s==='day'?'☀️':'🌙'} {t(lang,s)} · {members.length} {t(lang,'people')}</h3>
      {(['operator','worker'] as Role[]).map(role=>{
        if(team==='newmaterial'&&role==='operator')return null;
        const group=members.filter(x=>x.role===role);
        return <div key={role} className="mb-3"><h4 className="mb-2 text-sm font-semibold">{t(lang,role)} ({group.length})</h4><div className="flex flex-wrap gap-2">{group.map(x=><span key={x.name} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm">{x.name}</span>)}</div></div>;
      })}
    </section>;
  };
  return <div className="space-y-5">
    <div className={card}><p className="text-sm font-semibold text-[#168253]">{t(lang,'division')} / {t(lang,team)}</p><h2 className="mt-1 text-xl font-bold text-[#145C42]">{t(lang,'cycleRoster')}</h2><p className="mt-2 text-sm text-gray-500">{t(lang,'cycleHint')}</p>
      <div className="mt-4 rounded-xl bg-[#F1F8F3] p-4"><div className="flex items-center justify-between gap-2"><button onClick={()=>setIndex(x=>Math.max(0,x-1))} disabled={index===0} className="rounded-lg bg-white px-3 py-2 disabled:opacity-40">‹</button><div className="text-center"><p className="text-sm font-bold text-[#145C42]">{t(lang,'cycle')} {index+1}</p><p>{formatDay(start,lang)}</p><p>~ {formatDay(end,lang)}</p></div><button onClick={()=>setIndex(x=>x+1)} className="rounded-lg bg-white px-3 py-2">›</button></div><div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs"><div className="rounded-lg bg-white p-2"><b>{t(lang,'firstWeek')}</b><div>{start} ~ {addDays(start,6)}</div></div><div className="rounded-lg bg-white p-2"><b>{t(lang,'secondWeek')}</b><div>{addDays(start,7)} ~ {end}</div></div></div></div>
    </div>
    {message&&<div className={card} role="status">{message}</div>}
    {loading?<div className={card}>{t(lang,'loading')}</div>:<>
      <div className={`${card} flex items-center justify-between`}><b>{t(lang,team)} ({people.length} {t(lang,'people')})</b><span className="text-sm">{t(lang,complete?'setupCompleted':'setupMissing')}</span></div>
      {isAdmin&&<div className={card}><div className="flex items-center justify-between gap-2"><div><h3 className="font-bold text-[#145C42]">{t(lang,'adminSettings')}</h3><p className="mt-1 text-xs text-gray-500">{t(lang,'twoWeeksSame')}</p></div><button onClick={()=>setEditing(x=>!x)} className="rounded-lg bg-[#145C42] px-3 py-2 text-sm text-white">{t(lang,editing?'close':'assignShift')}</button></div>
        {editing&&<div className="mt-4 space-y-4"><div className="grid grid-cols-2 gap-2"><button disabled={index===0||busy} onClick={copy} className="rounded-lg border p-2 text-xs disabled:opacity-40">{t(lang,'copyPrevious')}</button><button onClick={swap} className="rounded-lg border p-2 text-xs">{t(lang,'swap')}</button><button disabled={index===0||busy} onClick={autoSuggest} className="col-span-2 rounded-lg border border-green-300 bg-green-50 p-2 text-xs font-semibold text-[#145C42] disabled:opacity-40">{t(lang,'suggestOpposite')}</button></div><div className="flex gap-2"><button onClick={()=>setAll('day')} className="rounded-lg bg-green-100 px-3 py-2 text-xs">{t(lang,'allDay')}</button><button onClick={()=>setAll('night')} className="rounded-lg bg-blue-100 px-3 py-2 text-xs">{t(lang,'allNight')}</button></div>{editor('operator')}{editor('worker')}<div className="sticky bottom-3 rounded-lg border bg-white p-3 shadow-lg"><p className="mb-2 text-sm">{t(lang,'progress')}: {selected}/{people.length} {t(lang,'people')}</p><button disabled={busy||selected!==people.length} onClick={save} className="w-full rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-40">{busy?t(lang,'saving'):t(lang,'saveCycle')}</button></div></div>}
      </div>}
      {!complete?<div className={card}>{t(lang,'noRoster')}</div>:<div className="grid gap-4 md:grid-cols-2">{display('day')}{display('night')}</div>}
    </>}
  </div>;
}


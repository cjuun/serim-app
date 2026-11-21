'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import type {Lang} from './i18n';
import {pu} from './productionUiText';
type Entry={id:number;started_at:string;ended_at:string|null};
export default function BreakTimeManager({lang}:{lang:Lang}){
 const [rows,setRows]=useState<Entry[]>([]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [staffId,setStaffId]=useState<number|null>(null);
 const load=useCallback(async()=>{
  const {data:{user}}=await supabase.auth.getUser();if(!user){setStaffId(null);setRows([]);return;}
  const {data:staff,error:staffError}=await supabase.from('staff_members').select('id').eq('auth_user_id',user.id).eq('active',true).maybeSingle();
  if(staffError||!staff){setStaffId(null);setMessage(pu(lang,'noAccess'));return;}
  setStaffId(staff.id as number);
  const {data,error}=await supabase.from('staff_breaks').select('id,started_at,ended_at').eq('staff_id',staff.id).order('started_at',{ascending:false}).limit(30);
  if(error)setMessage(`${pu(lang,'error')}: ${error.message}`);else setRows((data||[]) as Entry[]);
 },[lang]);
 useEffect(()=>{void load();},[load]);
 const active=rows.find(r=>!r.ended_at);const today=new Date().toLocaleDateString(lang==='ko'?'ko-KR':'en-CA');
 const change=async(action:'start'|'end')=>{
  if(busy||staffId===null)return;setBusy(true);setMessage('');
  const {error}=await supabase.rpc('record_staff_break',{p_action:action});
  setBusy(false);if(error)setMessage(`${pu(lang,'error')}: ${error.message}`);else {setMessage(pu(lang,'saved'));await load();}
 };
 const fmt=(s:string)=>new Date(s).toLocaleTimeString(lang==='ko'?'ko-KR':'en-US',{hour:'2-digit',minute:'2-digit'});
 return <div className="space-y-4"><section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#145C42]">{pu(lang,'breakMenu')}</h2><p className="mt-2 text-sm text-gray-500">{pu(lang,'current')}: <b>{active?pu(lang,'resting'):pu(lang,'working')}</b></p><div className="mt-4 grid grid-cols-2 gap-3"><button disabled={busy||!!active||staffId===null} onClick={()=>change('start')} className="rounded-lg bg-[#168253] p-4 font-bold text-white disabled:opacity-40">{pu(lang,'start')}</button><button disabled={busy||!active||staffId===null} onClick={()=>change('end')} className="rounded-lg bg-[#145C42] p-4 font-bold text-white disabled:opacity-40">{pu(lang,'end')}</button></div></section>{message&&<p role="status" className="rounded-lg bg-white p-3 text-sm">{message}</p>}<section className="rounded-xl bg-white p-5 shadow-sm"><h3 className="mb-3 font-semibold">{pu(lang,'today')}</h3>{rows.length===0?<p className="text-sm text-gray-500">{pu(lang,'recordNone')}</p>:rows.map(r=><div key={r.id} className="flex justify-between border-b py-2 text-sm"><span>{new Date(r.started_at).toLocaleDateString()} · {fmt(r.started_at)}</span><span>{r.ended_at?fmt(r.ended_at):pu(lang,'resting')}</span></div>)}</section></div>;
}

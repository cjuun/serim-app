'use client';
import {useEffect,useState} from 'react';
import {supabase} from './supabase';
import {type Lang} from './i18n';
import {tbmText as tx} from './tbmText';
export default function TBMInbox({lang,onOpen}:{lang:Lang;onOpen:()=>void}){
 const [count,setCount]=useState(0);
 useEffect(()=>{
  let active=true;
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const val=(k:string)=>parts.find(x=>x.type===k)?.value||'';
  const today=`${val('year')}-${val('month')}-${val('day')}`;
  void supabase.from('tbm_sessions').select('id,status').eq('session_date',today).eq('status','draft').then(({data})=>{if(active)setCount(data?.length||0);});
  return()=>{active=false;};
 },[]);
 return <button className="w-full rounded-xl border border-[#D2E6D6] bg-white px-4 py-3 text-left shadow-sm" onClick={onOpen}>
  <div className="flex items-center justify-between gap-2"><b className="text-[#145C42]">🛡 {tx(lang,'tbm')}</b>{count>0&&<span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">{count} {tx(lang,'pending')}</span>}</div>
  <p className="mt-1 text-xs text-gray-600">{tx(lang,'schedule')} · {tx(lang,'aiReview')}</p>
 </button>;
}

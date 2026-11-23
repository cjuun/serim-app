'use client';
import {useState} from 'react';
import {WORK_PATTERNS,LABELS,calculatePattern,hm,localizedPatternName,type PatternId,type Language} from './workSchedule';
export default function WorkTimePicker({lang,value,onChange}:{lang:Language;value:PatternId|null;onChange:(id:PatternId)=>void}){
 const current=WORK_PATTERNS.find(p=>p.id===value);
 const [tab,setTab]=useState<'day'|'night'>(current?.group||'day');
 const l=LABELS[lang];
 return <div className="rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
  <h3 className="mb-3 text-sm font-semibold text-emerald-900">{l.select}</h3>
  <div className="mb-3 grid grid-cols-2 gap-2" role="tablist">
   {(['day','night'] as const).map(group=><button key={group} type="button" role="tab" aria-selected={tab===group} onClick={()=>setTab(group)} className={`rounded-lg px-3 py-2.5 font-medium ${tab===group?'bg-emerald-700 text-white':'bg-gray-100 text-gray-700'}`}>{group==='day'?'☀':'☾'} {l[group]}</button>)}
  </div>
  <div className="space-y-2">
   {WORK_PATTERNS.filter(p=>p.group===tab).map(p=>{const calc=calculatePattern(p);const picked=value===p.id;return <button key={p.id} type="button" onClick={()=>onChange(p.id)} aria-pressed={picked} className={`flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left ${picked?'border-emerald-600 bg-emerald-50':'border-gray-200 bg-white'}`}>
    <span className="min-w-0"><span className="block font-semibold text-gray-900">{p.start} ~ {p.nextDay?l.nextDay+' ':''}{p.end}</span><span className="block text-xs text-gray-500">{localizedPatternName(p,lang)} · {l.break} {p.breaks.map(b=>`${b.start}~${b.end}`).join(', ')}</span></span>
    <span className="shrink-0 text-right text-sm font-semibold text-emerald-800">{l.net}<br/>{hm(calc.netMinutes)}</span>
   </button>;})}
  </div>
 </div>;
}

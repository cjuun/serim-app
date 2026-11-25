'use client';
import {useState} from 'react';
import {supabase} from './supabase';
import {type Lang} from './i18n';
import {tbmText} from './tbmText';

type Message={role:'user'|'assistant';text:string};
const quick:Record<Lang,string[]>={
 ko:['휴가 신청 방법','TBM 교육은 어디서 확인하나요?','휴게시간 기록 방법','내 근무조 확인 방법'],
 en:['How do I request leave?','Where can I see TBM training?','How do I log breaks?','How do I check my shift?'],
 ne:['बिदा कसरी माग्ने?','TBM तालिम कहाँ हेर्ने?','विश्राम समय कसरी राख्ने?','मेरो सिफ्ट कहाँ हेर्ने?'],
 km:['តើសុំច្បាប់ឈប់សម្រាកដូចម្តេច?','តើមើល TBM នៅណា?','តើកត់ពេលសម្រាកដូចម្តេច?','តើមើលវេនការងារនៅណា?'],
 tl:['Paano mag-request ng leave?','Saan makikita ang TBM?','Paano itala ang pahinga?','Paano tingnan ang shift ko?'],
 vi:['Cách xin nghỉ phép?','Xem huấn luyện TBM ở đâu?','Cách ghi giờ nghỉ?','Xem ca làm việc ở đâu?'],
};
export default function AssistantChat({lang,menuOpen=false}:{lang:Lang;menuOpen?:boolean}){
 const [open,setOpen]=useState(false),[input,setInput]=useState(''),[messages,setMessages]=useState<Message[]>([]),[busy,setBusy]=useState(false);
 const ask=async(q:string)=>{
  const question=q.trim();if(!question||busy)return;
  setMessages(v=>[...v,{role:'user',text:question}]);setInput('');setBusy(true);
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session?.access_token)throw new Error(tbmText(lang,'loginRequired'));
   const response=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({question,lang})});
   const json=await response.json() as {answer?:string;error?:string};
   if(!response.ok)throw new Error(json.error||tbmText(lang,'chatFailed'));
   setMessages(v=>[...v,{role:'assistant',text:json.answer||tbmText(lang,'chatFailed')}]);
  }catch(err){setMessages(v=>[...v,{role:'assistant',text:err instanceof Error?err.message:tbmText(lang,'chatFailed')}]);}
  finally{setBusy(false);}
 };
 if(menuOpen)return null;
 return <div className="fixed right-3 z-[35] sm:right-4 sm:z-[80]" style={{bottom:'calc(12px + env(safe-area-inset-bottom, 0px))'}}>
  {!open?<button type="button" onClick={()=>setOpen(true)} className="flex h-14 w-14 items-center justify-center rounded-full border border-green-300 bg-gradient-to-r from-[#238e50] to-[#0c6647] p-1 text-left text-white shadow-xl hover:brightness-110 sm:h-auto sm:w-auto sm:gap-2 sm:py-2 sm:pl-2 sm:pr-5" aria-label="림봇 도우미"><img src="/rimbot.svg" alt="" className="h-11 w-11 rounded-full bg-[#D3F6DE] p-0.5 sm:h-12 sm:w-12"/><span className="hidden sm:block"><b className="block text-sm">{lang==='ko'?'림봇 도우미':'Rimbot'}</b><span className="block text-[10px] text-green-100">{tbmText(lang,'chatShort')}</span></span><span aria-hidden className="hidden sm:inline">›</span></button>
  :<section className="flex h-[min(590px,calc(100dvh-75px))] w-[min(410px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-[#CFE1D4] bg-white shadow-2xl" aria-label={tbmText(lang,'chatTitle')}>
    <header className="flex items-center justify-between bg-gradient-to-r from-[#145C42] to-[#168253] px-4 py-3 text-white"><div className="flex items-center gap-2"><img src="/rimbot.svg" alt="" className="h-11 w-11 rounded-full bg-green-100"/><div><h3 className="font-bold">{lang==='ko'?'림봇 · 생산본부 AI 도우미':'Rimbot · AI Assistant'}</h3><p className="text-xs text-green-100">{tbmText(lang,'chatDisclaimer')}</p></div></div><button onClick={()=>setOpen(false)} aria-label={tbmText(lang,'close')} className="p-2 text-xl">×</button></header>
    <div className="flex-1 space-y-3 overflow-y-auto bg-[#F4F9F5] p-3">
      {messages.length===0&&<><p className="text-sm text-[#365E49]">{tbmText(lang,'chatHello')}</p><div className="space-y-2">{quick[lang].map(q=><button type="button" key={q} onClick={()=>void ask(q)} className="block w-full rounded-lg border bg-white p-2 text-left text-sm text-[#145C42]">{q}</button>)}</div></>}
      {messages.map((m,i)=><div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}><p className={`max-w-[90%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm ${m.role==='user'?'bg-[#168253] text-white':'bg-white text-gray-800 shadow-sm'}`}>{m.text}</p></div>)}
      {busy&&<div className="text-xs text-gray-600">{tbmText(lang,'loading')}</div>}
    </div>
    <form className="flex gap-2 border-t bg-white p-3" onSubmit={e=>{e.preventDefault();void ask(input);}}><input value={input} onChange={e=>setInput(e.target.value)} maxLength={800} placeholder={tbmText(lang,'chatPlaceholder')} className="min-w-0 flex-1 rounded-lg border bg-white p-2 text-sm text-black placeholder:text-gray-500"/><button disabled={busy||!input.trim()} className="rounded-lg bg-[#168253] px-3 text-sm font-bold text-white disabled:opacity-40">{tbmText(lang,'send')}</button></form>
  </section>}
 </div>;
}

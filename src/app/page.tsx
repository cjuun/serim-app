'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import AttendanceManager from './AttendanceManager';
import ShiftRoster from './ShiftRoster';
import {languages,t,type Lang,type Team,type Key} from './i18n';

type Page='dashboard'|'calendar'|'notice'|'attendance'|'shift';
type Notice={id:number;team:Team;content_ko:string;content_en:string|null;content_ne:string|null;content_km:string|null;content_tl:string|null;content_vi:string|null;important:boolean;created_at:string};
type Translated={en:string;ne:string;km:string;tl:string;vi:string};
const button='rounded-lg bg-[#168253] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40';
const card='rounded-xl border border-[#DFE9E1] bg-white p-5 shadow-sm';
export default function Home(){
  const [lang,setLang]=useState<Lang>('ko');
  const [page,setPage]=useState<Page>('dashboard');
  const [team,setTeam]=useState<Team>('vacuum');
  const [notices,setNotices]=useState<Notice[]>([]);
  const [isAdmin,setIsAdmin]=useState(false);
  const [showLogin,setShowLogin]=useState(false);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [menuOpen,setMenuOpen]=useState(false);
  const [expanded,setExpanded]=useState<Record<Team,boolean>>({vacuum:true,newmaterial:true});
  const [input,setInput]=useState('');
  const [important,setImportant]=useState(false);
  const [editId,setEditId]=useState<number|null>(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState('');
  const [month,setMonth]=useState<{year:number;month:number}|null>(null);
  useEffect(()=>{
    const stored=window.localStorage.getItem('serim-language');
    if(languages.some(x=>x.code===stored))setLang(stored as Lang);
    const today=new Date();setMonth({year:today.getFullYear(),month:today.getMonth()});
  },[]);
  const changeLang=(l:Lang)=>{setLang(l);window.localStorage.setItem('serim-language',l);};
  const loadNotices=useCallback(async()=>{
    const {data,error}=await supabase.from('notices').select('*').order('created_at',{ascending:false});
    if(error)setMessage(`${t(lang,'fail')}: ${error.message}`);
    else setNotices((data||[]) as Notice[]);
    setLoading(false);
  },[lang]);
  const checkAdmin=useCallback(async()=>{
    const {data}=await supabase.auth.getUser();
    if(!data.user){setIsAdmin(false);return;}
    const {data:admin,error}=await supabase.from('admin_users').select('user_id').eq('user_id',data.user.id).maybeSingle();
    setIsAdmin(!error&&!!admin);
  },[]);
  useEffect(()=>{
    void loadNotices();void checkAdmin();
    const refresh=window.setInterval(()=>void loadNotices(),15000);
    const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{void checkAdmin();});
    return()=>{window.clearInterval(refresh);subscription.unsubscribe();};
  },[loadNotices,checkAdmin]);
  const login=async()=>{
    setBusy(true);setMessage('');
    const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error||!data.user){setMessage(`${t(lang,'fail')}: ${error?.message||t(lang,'loginRequired')}`);setBusy(false);return;}
    const {data:admin,error:roleError}=await supabase.from('admin_users').select('user_id').eq('user_id',data.user.id).maybeSingle();
    if(roleError||!admin){await supabase.auth.signOut();setMessage(t(lang,'loginRequired'));setIsAdmin(false);}else{
      setIsAdmin(true);setShowLogin(false);setPassword('');setMessage('');
    }
    setBusy(false);
  };
  const logout=async()=>{
    const {error}=await supabase.auth.signOut();
    if(error){setMessage(`${t(lang,'fail')}: ${error.message}`);return;}
    setIsAdmin(false);setEditId(null);setInput('');setMessage('');
  };
  const nav=(target:Page,selected?:Team)=>{
    if(selected)setTeam(selected);
    setPage(target);setMenuOpen(false);setMessage('');setEditId(null);setInput('');setImportant(false);
  };
  const translate=async(text:string):Promise<Translated>=>{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token)throw new Error(t(lang,'loginRequired'));
    const response=await fetch('/api/translate-notice',{
      method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},
      body:JSON.stringify({text}),
    });
    const data=await response.json() as Translated & {error?:string};
    if(!response.ok||data.error)throw new Error(data.error||t(lang,'fail'));
    return data;
  };
  const saveNotice=async()=>{
    if(!isAdmin||busy||!input.trim())return;
    setBusy(true);setMessage(t(lang,'translationWorking'));
    try{
      const content=input.trim();
      const translated=await translate(content);
      const fields={content_ko:content,content_en:translated.en,content_ne:translated.ne,content_km:translated.km,content_tl:translated.tl,content_vi:translated.vi,important,updated_at:new Date().toISOString()};
      const result=editId!==null
        ?await supabase.from('notices').update(fields).eq('id',editId).select('id')
        :await supabase.from('notices').insert({...fields,team}).select('id');
      if(result.error)throw new Error(result.error.message);
      if(!result.data?.length)throw new Error(t(lang,'fail'));
      setInput('');setImportant(false);setEditId(null);setMessage(t(lang,'saved'));await loadNotices();
    }catch(e){setMessage(`${t(lang,'fail')}: ${e instanceof Error?e.message:String(e)}`);}
    finally{setBusy(false);}
  };
  const editNotice=(n:Notice)=>{
    setPage('notice');setTeam(n.team);setInput(n.content_ko);setImportant(!!n.important);setEditId(n.id);
    window.scrollTo({top:0,behavior:'smooth'});
  };
  const deleteNotice=async(n:Notice)=>{
    if(!isAdmin||busy||!window.confirm(t(lang,'confirmDelete')))return;
    setBusy(true);
    const {data,error}=await supabase.from('notices').delete().eq('id',n.id).select('id');
    setMessage(error?`${t(lang,'fail')}: ${error.message}`:data?.length?t(lang,'saved'):t(lang,'fail'));
    if(!error&&data?.length)await loadNotices();
    setBusy(false);
  };
  const retran=async(n:Notice)=>{
    if(!isAdmin||busy)return;
    setBusy(true);setMessage(t(lang,'translationWorking'));
    try{
      const x=await translate(n.content_ko);
      const {error}=await supabase.from('notices').update({content_en:x.en,content_ne:x.ne,content_km:x.km,content_tl:x.tl,content_vi:x.vi}).eq('id',n.id);
      if(error)throw new Error(error.message);
      setMessage(t(lang,'saved'));await loadNotices();
    }catch(e){setMessage(`${t(lang,'fail')}: ${e instanceof Error?e.message:String(e)}`);}
    finally{setBusy(false);}
  };
  const content=(n:Notice)=>{
    if(lang==='ko')return n.content_ko;
    const foreign=n[`content_${lang}` as keyof Notice];
    // Legacy entries might contain copied Korean instead of a real translation.
    return typeof foreign==='string'&&foreign.trim()&&foreign.trim()!==n.content_ko.trim()
      ?foreign : `${t(lang,'translationNotice')}\n\n${n.content_ko}`;
  };
  const noticeCard=(n:Notice)=><article key={n.id} className={`${card} border-l-4 ${n.important?'border-l-red-500':'border-l-[#168253]'}`}>
    <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded bg-[#E1F3E9] px-2 py-1 text-xs font-semibold text-[#146B46]">{t(lang,n.team)}</span>{n.important&&<span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">{t(lang,'important')}</span>}<time className="ml-auto text-xs text-gray-500" dateTime={n.created_at}>{new Date(n.created_at).toLocaleDateString(t(lang,'dateLocale'))}</time></div>
    <p className="whitespace-pre-wrap break-words text-sm leading-7">{content(n)}</p>
    {isAdmin&&<div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-3"><button onClick={()=>retran(n)} disabled={busy} className="rounded-lg border px-3 py-2 text-xs">🌐 {t(lang,'retranslate')}</button><button onClick={()=>editNotice(n)} className="rounded-lg border px-3 py-2 text-xs">{t(lang,'edit')}</button><button disabled={busy} onClick={()=>deleteNotice(n)} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700">{t(lang,'remove')}</button></div>}
  </article>;
  const sidebarButton=(label:string,active:boolean,fn:()=>void)=><button onClick={fn} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm ${active?'bg-white font-bold text-[#145C42]':'text-[#E0F4E8] hover:bg-[#267553]'}`}>{label}</button>;
  const sidebar=<div className="flex h-full flex-col bg-[#145C42] text-white"><div className="border-b border-[#34785B] p-5"><div className="text-xl font-black">🌿 SERIM B&G</div><p className="text-xs text-[#C5E8D2]">Eco-friendly Production System</p></div><nav className="flex-1 space-y-2 overflow-y-auto p-3">
    {sidebarButton(`▦ ${t(lang,'dashboard')}`,page==='dashboard',()=>nav('dashboard'))}
    {sidebarButton(`▣ ${t(lang,'calendar')}`,page==='calendar',()=>nav('calendar'))}
    <div className="border-t border-[#34785B] pt-3 text-sm font-bold">{t(lang,'division')}</div>
    {(['vacuum','newmaterial'] as Team[]).map(teamCode=><div key={teamCode}><button onClick={()=>setExpanded(p=>({...p,[teamCode]:!p[teamCode]}))} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold"><span>{t(lang,teamCode)}</span><span>{expanded[teamCode]?'▾':'▸'}</span></button>{expanded[teamCode]&&<div className="ml-3 space-y-1">{(['notice','attendance','shift'] as Page[]).map(p=>sidebarButton(`• ${t(lang,p as Key)}`,page===p&&team===teamCode,()=>nav(p,teamCode)))}</div>}</div>)}
  </nav><div className="border-t border-[#34785B] p-4 text-xs text-[#BDE7D0]">© SERIM B&G</div></div>;
  const dashboard=<div className="space-y-5"><div className="rounded-2xl bg-gradient-to-r from-[#145C42] to-[#25865B] p-6 text-white"><p className="text-sm">SERIM B&G</p><h2 className="mt-1 text-2xl font-bold">{t(lang,'dashboard')}</h2><p className="mt-2 text-sm">{t(lang,'welcome')}</p></div><div className="grid grid-cols-3 gap-2">{[[notices.length,'countNotice'],[2,'countTeams'],[6,'countLanguages']].map(([num,key])=><div key={key} className={card}><div className="text-2xl font-black text-[#168253]">{num}</div><p className="text-xs text-gray-500">{t(lang,key as Key)}</p></div>)}</div><h3 className="font-bold text-[#145C42]">{t(lang,'latest')}</h3>{notices.length?notices.slice(0,5).map(noticeCard):<div className={card}>{t(lang,'emptyNotice')}</div>}</div>;
  const noticePage=<div className="space-y-4"><div className={card}><div className="text-sm text-[#168253]">{t(lang,'division')} / {t(lang,team)}</div><h2 className="text-xl font-bold text-[#145C42]">{t(lang,'notice')}</h2></div>{isAdmin&&<div className={card}><h3 className="mb-3 font-bold text-[#145C42]">{t(lang,editId!==null?'edit':'addNotice')}</h3><textarea rows={5} value={input} onChange={e=>setInput(e.target.value)} placeholder={t(lang,'noticeText')} className="w-full rounded-lg border p-3 text-sm"/><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={important} onChange={e=>setImportant(e.target.checked)}/>{t(lang,'important')}</label><p className="my-3 text-xs text-amber-700">{t(lang,'translationNotice')}</p><div className="flex gap-2"><button className={button} disabled={busy||!input.trim()} onClick={saveNotice}>{busy?t(lang,'translationWorking'):t(lang,editId!==null?'save':'addNotice')}</button>{editId!==null&&<button className="rounded-lg border px-4 py-2" onClick={()=>{setInput('');setEditId(null);setImportant(false);}}>{t(lang,'cancel')}</button>}</div></div>}{notices.filter(n=>n.team===team).length?notices.filter(n=>n.team===team).map(noticeCard):<div className={card}>{t(lang,'emptyNotice')}</div>}</div>;
  const renderCalendar=()=>{
    if(!month)return <div className={card}>{t(lang,'loading')}</div>;
    const count=new Date(month.year,month.month+1,0).getDate();
    const pad=new Date(month.year,month.month,1).getDay();
    const weekdays:Key[]=['sun','mon','tue','wed','thu','fri','sat'];
    const change=(n:number)=>{const d=new Date(month.year,month.month+n,1);setMonth({year:d.getFullYear(),month:d.getMonth()});};
    return <div className="space-y-4"><div className={card}><h2 className="text-xl font-bold text-[#145C42]">{t(lang,'calendar')}</h2><p className="mt-2 text-sm text-gray-500">{t(lang,'calendarInfo')}</p></div><div className={card}><div className="mb-4 flex items-center justify-between"><button className="rounded border px-3 py-2" onClick={()=>change(-1)}>‹</button><b>{month.year} {t(lang,'month')} {month.month+1}</b><button className="rounded border px-3 py-2" onClick={()=>change(1)}>›</button></div><div className="grid grid-cols-7 gap-1 text-center">{weekdays.map(k=><div key={k} className="py-2 text-xs font-bold">{t(lang,k)}</div>)}{Array.from({length:pad+count},(_,i)=><div key={i} className={`min-h-12 rounded border p-2 text-sm sm:min-h-20 ${i<pad?'border-transparent':'border-[#E4EEE7] bg-[#FAFCFA]'}`}>{i>=pad?i-pad+1:''}</div>)}</div></div><div className={card}>{t(lang,'noEvents')}</div></div>;
  };
  return <div className="min-h-screen bg-[#F1F8F3] text-gray-900">
    {menuOpen&&<button aria-label="Close menu" onClick={()=>setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/50 md:hidden"/>}
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform md:translate-x-0 ${menuOpen?'translate-x-0':'-translate-x-full'}`}>{sidebar}</aside>
    <div className="min-h-screen md:ml-64"><header className="sticky top-0 z-30 border-b border-[#D5E8DB] bg-white px-4 py-4 shadow-sm sm:px-6"><div className="flex items-center gap-3"><button className="rounded-lg bg-[#145C42] px-3 py-2 text-white md:hidden" onClick={()=>setMenuOpen(true)}>☰</button><div className="min-w-0 flex-1"><h1 className="text-base font-bold text-[#145C42]">{t(lang,'brand')}</h1><p className="text-xs text-[#648778]">SERIM B&G · ECO-FRIENDLY PACKAGING</p></div>{isAdmin?<button className={button} onClick={logout}>{t(lang,'logout')}</button>:<button className={button} onClick={()=>setShowLogin(x=>!x)}>{t(lang,'admin')}</button>}</div><div className="mt-3 flex flex-wrap gap-1.5">{languages.map(l=><button key={l.code} onClick={()=>changeLang(l.code)} className={`rounded-md px-2.5 py-2 text-xs font-semibold ${lang===l.code?'bg-[#168253] text-white':'bg-[#E7F2EA] text-[#32684D]'}`}>{l.label}</button>)}</div></header>
      <main className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
        {message&&<div role="status" className={card}>{message}</div>}
        {showLogin&&!isAdmin&&<form onSubmit={e=>{e.preventDefault();void login();}} className={`${card} space-y-3`}><h2 className="font-bold">{t(lang,'login')}</h2><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" placeholder={t(lang,'email')} className="w-full rounded-lg border p-3"/><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder={t(lang,'password')} className="w-full rounded-lg border p-3"/><button type="submit" disabled={busy} className={button}>{t(lang,'login')}</button></form>}
        <div className="text-xs text-[#648778]">{t(lang,'division')} / {page==='notice'||page==='attendance'||page==='shift'?`${t(lang,team)} / `:''}{t(lang,page as Key)}</div>
        {loading?<div className={card}>{t(lang,'loading')}</div>:page==='dashboard'?dashboard:page==='calendar'?renderCalendar():page==='notice'?noticePage:page==='attendance'?<AttendanceManager team={team} isAdmin={isAdmin} lang={lang}/>:<ShiftRoster team={team} isAdmin={isAdmin} lang={lang}/>}
      </main>
    </div>
  </div>;
}

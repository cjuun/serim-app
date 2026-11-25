'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from './supabase';
import AttendanceManager from './AttendanceManager';
import ShiftRoster from './ShiftRoster';
import CalendarManager from './CalendarManager';
import TodayDashboard from './TodayDashboard';
import StaffPortal from './StaffPortal';
import StaffAdmin from './StaffAdmin';
import OrganizationChart from './OrganizationChart';
import CustomerClaims from './CustomerClaims';
import NewMaterialRoster from './NewMaterialRoster';
import BreakTimeManager from './BreakTimeManager';
import MachineRegistry from './MachineRegistry';
import ProductionSettings from './ProductionSettings';
import DailyAttendanceExport from './DailyAttendanceExport';
import TBMManager from './TBMManager';
import TBMInbox from './TBMInbox';
import AssistantChat from './AssistantChat';
import MySchedule from './MySchedule';
import AccessManager from './AccessManager';
import {menuText, type MenuKey} from './menuText';
import {tbmText as tbmT} from './tbmText';
import {pu} from './productionUiText';
import {s} from './staffText';
import {languages,t,type Lang,type Team,type Key} from './i18n';

type Page='dashboard'|'calendar'|'notice'|'myattendance'|'myleave'|'myclaims'|'attendance'|'shift'|'staffportal'|'staffadmin'|'organization'|'productionStatus'|'inventory'|'risk'|'claims'|'breaks'|'machines'|'settings'|'dailyreport'|'tbm'|'access';
type AppRole='chief'|'subadmin'|'operator'|'worker';
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
  const [authReady,setAuthReady]=useState(false);
  const [signedIn,setSignedIn]=useState(false);
  const [isSupervisor,setIsSupervisor]=useState(false);
  const [accessRole,setAccessRole]=useState<AppRole>('worker');
  const [accessPermissions,setAccessPermissions]=useState<string[]>([]);
  const [accessScope,setAccessScope]=useState<Team|null>(null);
  const [legacySupervisor,setLegacySupervisor]=useState(false);
  const landingSet=useRef(false);
  const [staffCode,setStaffCode]=useState('');
  const [loginType,setLoginType]=useState<'staff'|'admin'>('staff');
  const [showLogin,setShowLogin]=useState(false);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [menuOpen,setMenuOpen]=useState(false);
  const [languageMenuOpen,setLanguageMenuOpen]=useState(false);
  const [navExpanded,setNavExpanded]=useState('mySchedule');
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
    document.documentElement.style.fontSize=window.localStorage.getItem('serim-text-size')==='large'?'18px':'16px';
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
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setIsAdmin(false);setIsSupervisor(false);setSignedIn(false);setAccessRole('worker');setAccessPermissions([]);setAccessScope(null);landingSet.current=false;setAuthReady(true);return;}
    const [adminQuery,staffQuery,supervisorQuery,sessionQuery]=await Promise.all([
      supabase.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle(),
      supabase.from('staff_members').select('id,team,employee_role').eq('auth_user_id',user.id).eq('active',true).maybeSingle(),
      supabase.from('production_supervisors').select('user_id').eq('user_id',user.id).maybeSingle(),
      supabase.auth.getSession(),
    ]);
    const chief=!!adminQuery.data&&!adminQuery.error;
    const legacySub=!!supervisorQuery.data;
    if(!chief&&!staffQuery.data&&!legacySub){await supabase.auth.signOut();setSignedIn(false);setIsAdmin(false);setIsSupervisor(false);landingSet.current=false;setAuthReady(true);return;}
    let role:AppRole=chief?'chief':legacySub?'subadmin':staffQuery.data?.employee_role==='operator'?'operator':'worker';
    let rights:string[]=[];
    let scope:Team|null=(staffQuery.data?.team as Team)||null;
    let legacy=legacySub;
    const token=sessionQuery.data.session?.access_token;
    if(token){
      try{const res=await fetch('/api/role-access',{headers:{Authorization:`Bearer ${token}`}});
        if(res.ok){const a=await res.json() as {role?:AppRole;permissions?:string[];teamScope?:Team;grantExists?:boolean;legacySupervisor?:boolean};
          if(a.role)role=a.role;
          rights=Array.isArray(a.permissions)?a.permissions:[];
          if(a.teamScope)scope=a.teamScope;
          legacy=!!a.legacySupervisor&&!a.grantExists;
        }
      }catch{/* Keep existing roles when the new access API is unavailable. */}
    }
    if(chief)role='chief';
    if(role==='subadmin'&&scope)setTeam(scope);
    setSignedIn(true);setIsAdmin(chief);setIsSupervisor(role==='subadmin');setAccessRole(role);setAccessPermissions(rights);setAccessScope(scope);setLegacySupervisor(legacy);
    if(!landingSet.current){setPage(role==='operator'||role==='worker'?'myattendance':'dashboard');setNavExpanded(role==='operator'||role==='worker'?'mySchedule':'dashboard');landingSet.current=true;}
    setAuthReady(true);
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
    const {data:supervisor}=await supabase.from('production_supervisors').select('user_id').eq('user_id',data.user.id).maybeSingle();
    if((roleError||!admin)&&!supervisor){await supabase.auth.signOut();setMessage(t(lang,'loginRequired'));setIsAdmin(false);}else{
      setIsSupervisor(!!supervisor);setIsAdmin(!!admin);setSignedIn(true);landingSet.current=false;await checkAdmin();setShowLogin(false);setPassword('');setMessage('');
    }
    setBusy(false);
  };
  const employeeLogin=async()=>{
    const identifier=staffCode.trim();
    setBusy(true);setMessage('');
    if(!/^SR[0-9]{4,}$/i.test(identifier) && !/^[a-z][a-z0-9_]{4,23}$/i.test(identifier)){
      setMessage('직원번호 또는 변경한 로그인 아이디를 확인해 주세요.');setBusy(false);return;
    }
    if(/^SR[0-9]{4,}$/i.test(identifier)){
      const {error}=await supabase.auth.signInWithPassword({email:`${identifier.toLowerCase()}@staff.serimbng.example.com`,password});
      if(error){setMessage('아이디 또는 비밀번호가 맞지 않습니다.');setBusy(false);return;}
    }else{
      try{
        const res=await fetch('/api/staff-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier,password})});
        const json=await res.json() as {access_token?:string;refresh_token?:string;error?:string};
        if(!res.ok||!json.access_token||!json.refresh_token)throw new Error('로그인 정보가 맞지 않습니다.');
        const {error}=await supabase.auth.setSession({access_token:json.access_token,refresh_token:json.refresh_token});
        if(error)throw error;
      }catch{setMessage('아이디 또는 비밀번호가 맞지 않습니다.');setBusy(false);return;}
    }
    setSignedIn(true);setIsAdmin(false);landingSet.current=false;await checkAdmin();setPassword('');setBusy(false);
  };
  const logout=async()=>{
    const {error}=await supabase.auth.signOut();
    if(error){setMessage(`${t(lang,'fail')}: ${error.message}`);return;}
    setIsAdmin(false);setIsSupervisor(false);setSignedIn(false);setAccessPermissions([]);landingSet.current=false;setEditId(null);setInput('');setMessage('');
  };
  const nav=(target:Page,selected?:Team)=>{
    if(selected)setTeam(selected);
    setPage(target);setMenuOpen(false);setLanguageMenuOpen(false);setMessage('');setEditId(null);setInput('');setImportant(false);
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
  const sidebarButton=(label:string,active:boolean,fn:()=>void)=><button onClick={fn} className={`w-full rounded-lg px-3 py-2 text-left text-sm sm:py-2.5 ${active?'bg-white font-bold text-[#145C42]':'text-[#E0F4E8] hover:bg-[#267553]'}`}>{label}</button>;
  const has=(permission:string)=>isAdmin||(isSupervisor&&(accessPermissions.includes(permission)||(legacySupervisor&&['machines.manage','breaks.view'].includes(permission))));
  const groupedNav:{key:MenuKey;landing?:Page;pages:{id:Page;key:MenuKey;chiefOnly?:boolean;subPermission?:string;chiefOrSub?:boolean;pending?:boolean}[]}[]=[
    {key:'dashboard',landing:'dashboard',pages:[{id:'notice',key:'notice'},{id:'calendar',key:'calendar'}]},
    {key:'mySchedule',landing:'myattendance',pages:[{id:'myattendance',key:'myAttendance'},{id:'myleave',key:'myLeave'},{id:'myclaims',key:'myClaims'}]},
    {key:'attendanceGroup',pages:[{id:'attendance',key:'attendance'},{id:'shift',key:'shift'}]},
    {key:'production',pages:[{id:'organization',key:'organization'},{id:'productionStatus',key:'productionStatus',pending:true},{id:'inventory',key:'inventory',pending:true},{id:'machines',key:'machines'}]},
    {key:'education',pages:[{id:'tbm',key:'tbm'},{id:'risk',key:'risk',pending:true}]},
    {key:'quality',pages:[{id:'claims',key:'claims'}]},
    {key:'system',pages:[{id:'settings',key:'settings'}]},
    {key:'operations',pages:[{id:'staffadmin',key:'staffadmin',chiefOnly:true},{id:'dailyreport',key:'dailyreport',chiefOrSub:true,subPermission:'dailyreport.manage'},{id:'breaks',key:'breaks',chiefOrSub:true,subPermission:'breaks.view'},{id:'access',key:'access',chiefOnly:true}]},
  ];
  const canVisit=(item:{id:Page;chiefOnly?:boolean;chiefOrSub?:boolean;subPermission?:string})=>{
    if(item.chiefOnly)return isAdmin;
    if(item.chiefOrSub)return isAdmin||(isSupervisor&&!!item.subPermission&&has(item.subPermission));
    return true;
  };
  const accessibleGroups=groupedNav.map(group=>({...group,pages:group.pages.filter(canVisit)})).filter(g=>g.pages.length>0);
  const sidebar=<div className="flex h-full min-h-0 flex-col bg-[#145C42] text-white">
    <div className="flex items-center justify-between gap-2 border-b border-[#34785B] px-4 py-3 sm:p-5"><div className="min-w-0"><p className="text-xl font-bold tracking-tight">SERIM B&G</p><p className="text-xs text-[#C5E8D2]">Eco-friendly Production System</p></div><button type="button" className="shrink-0 rounded-lg border border-[#47866A] px-3 py-2 text-lg sm:hidden" aria-label="메뉴 닫기" onClick={()=>setMenuOpen(false)}>✕</button></div>
    <nav aria-label="생산본부 메뉴" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2 pb-4 sm:space-y-2 sm:p-3">
      {accessibleGroups.map(group=><div key={group.key} className="rounded-md border-t border-[#34785B] pt-1 sm:pt-2">
        <div className="flex items-center"><button type="button" className="flex-1 px-3 py-2 text-left text-sm font-bold text-white" onClick={()=>{setNavExpanded(p=>p===group.key?'':group.key);if(group.landing)nav(group.landing);}}>{menuText(lang,group.key)}</button><button type="button" className="px-3 py-2 text-white" aria-label={menuText(lang,group.key)+' 하위 메뉴'} aria-expanded={navExpanded===group.key} onClick={()=>setNavExpanded(p=>p===group.key?'':group.key)}>{navExpanded===group.key?'▾':'▸'}</button></div>
        {navExpanded===group.key&&<div className="space-y-0.5 pl-2 md:space-y-1">{group.pages.map(item=><div key={item.id}>{sidebarButton('• '+menuText(lang,item.key)+(item.pending?' · 준비중':''),page===item.id,()=>nav(item.id))}</div>)}</div>}
      </div>)}
    </nav><div className="border-t border-[#34785B] px-4 pt-3 text-xs text-[#BDE7D0]" style={{paddingBottom:'max(12px, env(safe-area-inset-bottom))'}}><button type="button" className="mb-3 w-full rounded-lg border border-[#47866A] bg-[#1F6D51] px-3 py-2.5 text-left text-sm font-semibold text-white sm:hidden" onClick={()=>{setMenuOpen(false);void logout();}}>{t(lang,'logout')}</button>© SERIM B&G</div>
  </div>;
  const dashboard=<div className="space-y-5"><div className="rounded-2xl bg-gradient-to-r from-[#145C42] to-[#25865B] p-6 text-white"><p className="text-sm">SERIM B&G</p><h2 className="mt-1 text-2xl font-bold">{t(lang,'dashboard')}</h2><p className="mt-2 text-sm">{t(lang,'welcome')}</p></div><div className="grid grid-cols-3 gap-2">{[[notices.length,'countNotice'],[2,'countTeams'],[6,'countLanguages']].map(([num,key])=><div key={key} className={card}><div className="text-2xl font-black text-[#168253]">{num}</div><p className="text-xs text-gray-500">{t(lang,key as Key)}</p></div>)}</div><TodayDashboard lang={lang}/><TBMInbox lang={lang} onOpen={()=>nav('tbm')}/><h3 className="font-bold text-[#145C42]">{t(lang,'latest')}</h3>{notices.length?notices.slice(0,5).map(noticeCard):<div className={card}>{t(lang,'emptyNotice')}</div>}</div>;
  const noticePage=<div className="space-y-4"><div className={card}><div className="text-sm text-[#168253]">{t(lang,'division')} / {t(lang,team)}</div><h2 className="text-xl font-bold text-[#145C42]">{t(lang,'notice')}</h2></div>{isAdmin&&<div className={card}><h3 className="mb-3 font-bold text-[#145C42]">{t(lang,editId!==null?'edit':'addNotice')}</h3><textarea rows={5} value={input} onChange={e=>setInput(e.target.value)} placeholder={t(lang,'noticeText')} className="w-full rounded-lg border p-3 text-sm"/><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={important} onChange={e=>setImportant(e.target.checked)}/>{t(lang,'important')}</label><p className="my-3 text-xs text-amber-700">{t(lang,'translationNotice')}</p><div className="flex gap-2"><button className={button} disabled={busy||!input.trim()} onClick={saveNotice}>{busy?t(lang,'translationWorking'):t(lang,editId!==null?'save':'addNotice')}</button>{editId!==null&&<button className="rounded-lg border px-4 py-2" onClick={()=>{setInput('');setEditId(null);setImportant(false);}}>{t(lang,'cancel')}</button>}</div></div>}{notices.filter(n=>n.team===team).length?notices.filter(n=>n.team===team).map(noticeCard):<div className={card}>{t(lang,'emptyNotice')}</div>}</div>;
  const renderCalendar=()=>{
    if(!month)return <div className={card}>{t(lang,'loading')}</div>;
    const count=new Date(month.year,month.month+1,0).getDate();
    const pad=new Date(month.year,month.month,1).getDay();
    const weekdays:Key[]=['sun','mon','tue','wed','thu','fri','sat'];
    const change=(n:number)=>{const d=new Date(month.year,month.month+n,1);setMonth({year:d.getFullYear(),month:d.getMonth()});};
    return <div className="space-y-4"><div className={card}><h2 className="text-xl font-bold text-[#145C42]">{t(lang,'calendar')}</h2><p className="mt-2 text-sm text-gray-500">{t(lang,'calendarInfo')}</p></div><div className={card}><div className="mb-4 flex items-center justify-between"><button className="rounded border px-3 py-2" onClick={()=>change(-1)}>‹</button><b>{month.year} {t(lang,'month')} {month.month+1}</b><button className="rounded border px-3 py-2" onClick={()=>change(1)}>›</button></div><div className="grid grid-cols-7 gap-1 text-center">{weekdays.map(k=><div key={k} className="py-2 text-xs font-bold">{t(lang,k)}</div>)}{Array.from({length:pad+count},(_,i)=><div key={i} className={`min-h-12 rounded border p-2 text-sm sm:min-h-20 ${i<pad?'border-transparent':'border-[#E4EEE7] bg-[#FAFCFA]'}`}>{i>=pad?i-pad+1:''}</div>)}</div></div><div className={card}>{t(lang,'noEvents')}</div></div>;
  };
  if(!authReady)return <div className="flex min-h-screen items-center justify-center bg-[#F1F8F3] p-5"><div className={card}>Loading...</div></div>;
  if(!signedIn)return <div className="flex min-h-screen items-center justify-center bg-[#F1F8F3] p-4">
    <div className="w-full max-w-md rounded-2xl border border-[#DCEADD] bg-white p-6 shadow-xl sm:p-9">
      <div className="mb-6 text-center"><div className="text-3xl font-bold tracking-[-0.04em] text-[#145C42]" style={{fontFamily:'Arial, Helvetica, sans-serif'}}>SERIM B&G</div><h1 className="mt-3 text-xl font-bold text-[#145C42]">{pu(lang,'division')}</h1><p className="mt-1 text-sm text-gray-500">Production Division</p></div>
      <div className="mb-4 grid grid-cols-3 gap-1.5">{languages.map(l=><button type="button" key={l.code} onClick={()=>changeLang(l.code)} className={`rounded px-2 py-1 text-xs ${lang===l.code?'bg-[#145C42] text-white':'bg-green-50 text-green-900'}`}>{l.label}</button>)}</div>
      <div className="mb-4 grid grid-cols-2 gap-2"><button onClick={()=>{setLoginType('staff');setMessage('');}} className={`rounded-lg p-3 text-sm ${loginType==='staff'?'bg-[#145C42] text-white':'bg-gray-100'}`}>{s(lang,'staffLogin')}</button><button onClick={()=>{setLoginType('admin');setMessage('');}} className={`rounded-lg p-3 text-sm ${loginType==='admin'?'bg-[#145C42] text-white':'bg-gray-100'}`}>{t(lang,'admin')}</button></div>
      <form onSubmit={e=>{e.preventDefault();void(loginType==='admin'?login():employeeLogin());}} className="space-y-3">
        {loginType==='admin'?<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder={t(lang,'email')} className="w-full rounded-lg border bg-white p-3 text-gray-900 placeholder:text-gray-500"/>:<input type="text" autoComplete="username" required value={staffCode} onChange={e=>setStaffCode(e.target.value)} placeholder="SR0001" className="w-full rounded-lg border bg-white p-3 text-gray-900 placeholder:text-gray-500"/>}
        <input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder={t(lang,'password')} className="w-full rounded-lg border bg-white p-3 text-gray-900 placeholder:text-gray-500"/>
        {message&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        <button disabled={busy} type="submit" className="w-full rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-50">{pu(lang,'login')}</button>
      </form>
      <p className="mt-4 text-center text-xs"><a className="text-[#145C42] underline" href="/install">{tbmT(lang,'install')}</a></p>
      <p className="mt-5 text-center text-xs text-gray-500">© SERIM B&G · Production Division</p>
    </div></div>;
  return <div className="min-h-screen bg-[#F1F8F3] text-gray-900">
    {menuOpen&&<button type="button" aria-label="메뉴 닫기" onClick={()=>setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/50 sm:hidden"/>}
    <aside className={`fixed inset-y-0 left-0 z-50 h-[100dvh] w-[min(82vw,300px)] transition-transform duration-200 sm:w-64 sm:translate-x-0 ${menuOpen?'translate-x-0':'-translate-x-full'}`}>{sidebar}</aside>
    <div className="min-h-screen sm:ml-64">
      <header className="sticky top-0 z-30 border-b border-[#D5E8DB] bg-white px-3 py-3 shadow-sm sm:px-6 md:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" aria-label="메뉴 열기" aria-expanded={menuOpen} className="shrink-0 rounded-lg bg-[#145C42] px-3 py-2 text-white sm:hidden" onClick={()=>{setLanguageMenuOpen(false);setMenuOpen(true);}}>☰</button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-[#145C42] sm:text-base">세림비앤지 생산본부</h1>
            <p className="hidden text-xs text-[#648778] sm:block">SERIM B&G · ECO-FRIENDLY PACKAGING</p>
          </div>
          <div className="relative sm:hidden">
            <button type="button" aria-label="언어 선택" aria-expanded={languageMenuOpen} onClick={()=>setLanguageMenuOpen(v=>!v)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D5E8DB] bg-white text-lg text-[#145C42]">🌐</button>
            {languageMenuOpen&&<div className="absolute right-0 top-full z-[60] mt-2 max-h-[55dvh] w-48 overflow-y-auto rounded-xl border border-[#D5E8DB] bg-white p-2 shadow-xl">
              {languages.map(l=><button key={l.code} type="button" onClick={()=>{changeLang(l.code);setLanguageMenuOpen(false);}} className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${lang===l.code?'bg-[#168253] text-white':'text-[#32684D] hover:bg-[#E7F2EA]'}`}>{l.label}</button>)}
            </div>}
          </div>
          <a href="/install" aria-label={tbmT(lang,'install')} title={tbmT(lang,'install')} className="hidden rounded-lg border border-[#D5E8DB] bg-white px-3 py-2.5 text-[#145C42] sm:inline-flex">📲</a>
          <button type="button" aria-label={pu(lang,'settings')} title={pu(lang,'settings')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D5E8DB] bg-white text-lg text-[#145C42]" onClick={()=>nav('settings')}>⚙</button>
          <button type="button" className={`${button} hidden sm:block`} onClick={logout}>{t(lang,'logout')}</button>
        </div>
        <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">{languages.map(l=><button type="button" key={l.code} onClick={()=>changeLang(l.code)} className={`rounded-md px-2.5 py-2 text-xs font-semibold ${lang===l.code?'bg-[#168253] text-white':'bg-[#E7F2EA] text-[#32684D]'}`}>{l.label}</button>)}</div>
      </header>
      <main className="w-full max-w-none space-y-4 p-3 pb-24 sm:p-4 sm:pb-8 lg:p-6 lg:pb-8 2xl:p-8">
        {message&&<div role="status" className={card}>{message}</div>}
        <div className="text-xs text-[#648778]">{t(lang,'division')} / {page==='staffportal'?menuText(lang,'staffportal'):page==='dashboard'?menuText(lang,'dashboard'):menuText(lang,(Object.entries({calendar:'calendar',notice:'notice',myattendance:'myAttendance',myleave:'myLeave',myclaims:'myClaims',attendance:'attendance',shift:'shift',organization:'organization',productionStatus:'productionStatus',inventory:'inventory',machines:'machines',tbm:'tbm',risk:'risk',claims:'claims',settings:'settings',staffadmin:'staffadmin',dailyreport:'dailyreport',breaks:'breaks',access:'access'}) as [string,MenuKey][]).find(([id])=>id===page)?.[1]||'dashboard')}</div>
        {(['attendance','shift','notice'] as Page[]).includes(page)&&<div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white px-4 py-3"><span className="mr-2 text-sm font-semibold">{({ko:'팀 선택',en:'Select team',ne:'टोली छान्नुहोस्',km:'ជ្រើសរើសក្រុម',tl:'Pumili ng team',vi:'Chọn nhóm'} as Record<Lang,string>)[lang]}</span>{(['vacuum','newmaterial'] as Team[]).filter(v=>!(isSupervisor&&['attendance','shift'].includes(page)&& (has(page==='attendance'?'attendance.manage':'shift.manage')))||v===accessScope).map(v=><button key={v} type="button" onClick={()=>setTeam(v)} className={`rounded-lg border px-4 py-2 text-sm ${team===v?'border-green-700 bg-green-50 font-bold text-green-900':''}`}>{t(lang,v)}</button>)}</div>}
        {loading?<div className={card}>{t(lang,'loading')}</div>:page==='dashboard'?dashboard:page==='myattendance'||page==='myleave'||page==='myclaims'?<MySchedule lang={lang} section={page==='myleave'?'leave':page==='myclaims'?'claims':'attendance'} onNavigate={target=>nav(target)}/>:page==='productionStatus'||page==='inventory'||page==='risk'?<div className={card}><h2 className="text-xl font-bold text-[#145C42]">{menuText(lang,page==='productionStatus'?'productionStatus':page==='inventory'?'inventory':'risk')}</h2><p className="mt-2 text-sm text-gray-500">{t(lang,'ready')} · ERP 연동 및 신규 개발은 보류 중입니다.</p></div>:page==='access'?(isAdmin?<AccessManager lang={lang}/>:<div className={card}>Access denied</div>):page==='organization'?<OrganizationChart lang={lang}/>:page==='claims'?<CustomerClaims lang={lang} isAdmin={has('claims.manage')} scopeTeam={!isAdmin&&isSupervisor?accessScope:null}/>:page==='breaks'?<BreakTimeManager lang={lang} isAdmin={isAdmin||has('breaks.view')} scopeTeam={!isAdmin&&isSupervisor?accessScope:null}/>:page==='machines'?<MachineRegistry lang={lang} isManager={has('machines.manage')} granularAccess={!isAdmin&&!legacySupervisor}/>:page==='dailyreport'?<DailyAttendanceExport lang={lang} isAdmin={isAdmin||has('dailyreport.manage')} scopeTeam={!isAdmin&&isSupervisor?accessScope:null}/>:page==='tbm'?<TBMManager lang={lang} isAdmin={isAdmin}/>:page==='settings'?<ProductionSettings lang={lang} onLanguage={changeLang} isAdmin={isAdmin} onNavigate={target=>nav(target)}/>:page==='calendar'?<CalendarManager lang={lang} isAdmin={has('calendar.manage')} scopeTeam={!isAdmin&&isSupervisor?accessScope:null}/>:page==='staffportal'?<StaffPortal lang={lang}/>:page==='staffadmin'?(isAdmin?<StaffAdmin lang={lang} isAdmin={isAdmin}/>:<div className={card}>Access denied</div>):page==='notice'?noticePage:page==='attendance'?<AttendanceManager team={team} isAdmin={has('attendance.manage')&&(!isSupervisor||!accessScope||team===accessScope)} lang={lang}/>:team==='newmaterial'?<NewMaterialRoster lang={lang} isAdmin={isAdmin} />:<ShiftRoster team={team} isAdmin={has('shift.manage')&&(!isSupervisor||!accessScope||team===accessScope)} lang={lang}/>}
      </main>
    </div>
    <AssistantChat lang={lang} menuOpen={menuOpen}/>
  </div>;
}

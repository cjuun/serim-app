'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import {type Lang,t} from './i18n';
import {s} from './staffText';

type Member={id:number;employee_code:string;full_name:string;team:'vacuum'|'newmaterial';employee_role:string;active:boolean};
type Leave={id:number;leave_type:string;start_date:string;end_date:string;reason:string;status:string;reviewer_comment:string;created_at:string};
type Suggestion={id:number;category:string;body:string;status:string;admin_reply:string;created_at:string};
const input='w-full rounded-lg border border-gray-200 bg-white p-3 text-sm';
const card='rounded-xl border border-[#DFE9E1] bg-white p-4 shadow-sm';
const types=['annual','unpaid','am_half','pm_half'] as const;
const categories=['workplace','facility','safety','welfare','other'] as const;
export default function StaffPortal({lang}:{lang:Lang}){
  const [code,setCode]=useState(''); const [password,setPassword]=useState('');
  const [member,setMember]=useState<Member|null>(null);const [leaves,setLeaves]=useState<Leave[]>([]);
  const [suggestions,setSuggestions]=useState<Suggestion[]>([]);
  const [leaveType,setLeaveType]=useState<string>('annual');const [start,setStart]=useState('');const [end,setEnd]=useState('');
  const [reason,setReason]=useState('');const [category,setCategory]=useState('workplace');const [body,setBody]=useState('');
  const [alias,setAlias]=useState('');const [newPassword,setNewPassword]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [loading,setLoading]=useState(true);
  useEffect(()=>{const d=new Date();const today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');setStart(today);setEnd(today);},[]);
  const load=useCallback(async()=>{
    const {data:user}=await supabase.auth.getUser();
    if(!user.user){setMember(null);setLeaves([]);setSuggestions([]);setLoading(false);return;}
    const {data:m,error}=await supabase.from('staff_members').select('id,employee_code,full_name,team,employee_role,active').eq('auth_user_id',user.user.id).eq('active',true).maybeSingle();
    if(error||!m){setMember(null);setLoading(false);return;}
    const mem=m as Member;setMember(mem);
    const [l,g]=await Promise.all([
      supabase.from('leave_requests').select('id,leave_type,start_date,end_date,reason,status,reviewer_comment,created_at').eq('staff_id',mem.id).order('created_at',{ascending:false}).limit(30),
      supabase.from('staff_suggestions').select('id,category,body,status,admin_reply,created_at').eq('staff_id',mem.id).order('created_at',{ascending:false}).limit(30),
    ]);
    if(l.error||g.error)setMessage(`${l.error?.message||''} ${g.error?.message||''}`);
    setLeaves((l.data||[]) as Leave[]);setSuggestions((g.data||[]) as Suggestion[]);setLoading(false);
  },[]);
  useEffect(()=>{void load();const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{void load();});return()=>subscription.unsubscribe();},[load]);
  const login=async()=>{
    const id=code.trim().toUpperCase();
    if(!/^SR\d{4,}$/.test(id)){setMessage(s(lang,'badCode'));return;}
    setBusy(true);setMessage('');
    const {error}=await supabase.auth.signInWithPassword({email:`${id.toLowerCase()}@staff.serimbng.example.com`,password});
    setBusy(false);setPassword('');
    if(error)setMessage(s(lang,'loginFailed'));
    else void load();
  };
  const logout=async()=>{await supabase.auth.signOut();setMember(null);setMessage('');};
  const changePassword=async()=>{
    if(newPassword.length<8){setMessage(s(lang,'passwordMin'));return;}
    setBusy(true);const {error}=await supabase.auth.updateUser({password:newPassword});setBusy(false);
    setMessage(error?error.message:s(lang,'passwordChanged'));if(!error)setNewPassword('');
  };
  const saveAlias=async()=>{
    setBusy(true);setMessage('');
    const {data,error}=await supabase.rpc('set_staff_login_alias',{p_alias:alias.trim().toLowerCase()});
    setBusy(false);setMessage(error?error.message:`새 로그인 아이디: ${data} (기존 직원번호 로그인도 유지됩니다)`);
  };
  const submitLeave=async()=>{
    if(!member||busy)return;
    if(!start||!end||end<start){setMessage(s(lang,'badDates'));return;}
    if(['am_half','pm_half'].includes(leaveType)&&start!==end){setMessage(s(lang,'halfOneDay'));return;}
    setBusy(true);setMessage('');
    const {error}=await supabase.from('leave_requests').insert({staff_id:member.id,leave_type:leaveType,start_date:start,end_date:end,reason:reason.trim().slice(0,1000)});
    setBusy(false);setMessage(error?error.message:s(lang,'submitted'));if(!error){setReason('');void load();}
  };
  const submitSuggestion=async()=>{
    if(!member||busy)return;
    if(body.trim().length<5){setMessage(s(lang,'tooShort'));return;}
    setBusy(true);setMessage('');
    const {error}=await supabase.from('staff_suggestions').insert({staff_id:member.id,category,body:body.trim().slice(0,3000)});
    setBusy(false);setMessage(error?error.message:s(lang,'submitted'));if(!error){setBody('');void load();}
  };
  if(loading)return <div className={card}>{t(lang,'loading')}</div>;
  if(!member)return <div className="space-y-4">
    <div className={card}><h2 className="text-lg font-bold text-[#145C42]">{s(lang,'staffLogin')}</h2><p className="mt-2 text-sm text-gray-500">{s(lang,'firstLogin')}</p>
      <form onSubmit={e=>{e.preventDefault();void login();}} className="mt-4 space-y-3">
        <input className={input} placeholder={s(lang,'employeeCode')} value={code} onChange={e=>setCode(e.target.value)} autoComplete="username" required/>
        <input className={input} placeholder={t(lang,'password')} value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" required/>
        <button disabled={busy} className="w-full rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-50">{s(lang,'signIn')}</button>
      </form>
      <p className="mt-3 text-xs text-gray-500">{s(lang,'adminProvides')}</p>
    </div>{message&&<div className={card} role="status">{message}</div>}
  </div>;
  return <div className="space-y-4">
    <div className={card}><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-[#145C42]">{member.full_name}</h2><p className="text-sm text-gray-500">{member.employee_code} · {t(lang,member.team)}</p></div><button onClick={logout} className="rounded-lg border px-3 py-2 text-sm">{t(lang,'logout')}</button></div></div>
    {message&&<div className={card} role="status">{message}</div>}
    <section className={card}><h3 className="mb-2 font-bold">{({ko:'로그인 아이디 변경',en:'Change login ID',ne:'लगइन आईडी परिवर्तन',km:'ប្តូរឈ្មោះចូល',tl:'Palitan ang login ID',vi:'Đổi tên đăng nhập'} as Record<Lang,string>)[lang]}</h3><p className="mb-2 text-xs text-gray-500">5~24 English letters/digits/_ · first character must be a letter. Permanent SR number remains valid.</p><div className="flex gap-2"><input value={alias} onChange={e=>setAlias(e.target.value)} className={input} maxLength={24} placeholder="myserimid"/><button disabled={busy||!(/^[a-z][a-z0-9_]{4,23}$/i.test(alias))} className="rounded-lg bg-[#168253] px-4 py-2 text-white disabled:opacity-40" onClick={saveAlias}>{t(lang,'save')}</button></div></section>
    <section className={card}><h3 className="mb-2 font-bold">{s(lang,'changePassword')}</h3><div className="flex flex-wrap gap-2"><input type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className={`${input} flex-1`} placeholder={s(lang,'newPassword')}/><button disabled={busy||newPassword.length<8} className="rounded-lg bg-[#168253] px-4 py-2 text-sm font-bold text-white disabled:opacity-40" onClick={changePassword}>{t(lang,'save')}</button></div></section>
    <section className={card}><h3 className="mb-3 text-lg font-bold text-[#145C42]">{s(lang,'applyLeave')}</h3>
      <label className="block text-sm">{s(lang,'leaveType')}</label><select className={input} value={leaveType} onChange={e=>{setLeaveType(e.target.value);if(['am_half','pm_half'].includes(e.target.value))setEnd(start);}}>{types.map(x=><option key={x} value={x}>{t(lang,x)}</option>)}</select>
      <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-sm">{s(lang,'startDate')}<input type="date" className={input} value={start} onChange={e=>{setStart(e.target.value);if(['am_half','pm_half'].includes(leaveType))setEnd(e.target.value);}}/></label><label className="text-sm">{s(lang,'endDate')}<input type="date" className={input} value={end} min={start} disabled={['am_half','pm_half'].includes(leaveType)} onChange={e=>setEnd(e.target.value)}/></label></div>
      <textarea className={`${input} mt-3`} rows={2} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} placeholder={s(lang,'optionalReason')}/>
      <button disabled={busy} onClick={submitLeave} className="mt-3 w-full rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-50">{s(lang,'submit')}</button>
    </section>
    <section className={card}><h3 className="mb-3 font-bold">{s(lang,'leaveHistory')}</h3>{leaves.length===0?<p className="text-sm text-gray-500">{s(lang,'noRequests')}</p>:leaves.map(x=><div key={x.id} className="border-b py-3 text-sm"><div className="flex justify-between gap-2"><span>{t(lang,x.leave_type as 'annual')} · {x.start_date} ~ {x.end_date}</span><b>{s(lang,x.status)}</b></div>{x.reviewer_comment&&<p className="mt-2 text-gray-600">{x.reviewer_comment}</p>}</div>)}</section>
    <section className={card}><h3 className="mb-3 text-lg font-bold text-[#145C42]">{s(lang,'suggestion')}</h3><p className="mb-3 text-xs text-gray-500">{s(lang,'namedOnly')}</p>
      <select className={input} value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x} value={x}>{s(lang,x)}</option>)}</select>
      <textarea className={`${input} mt-3`} rows={4} maxLength={3000} value={body} onChange={e=>setBody(e.target.value)} placeholder={s(lang,'suggestPlaceholder')}/>
      <button disabled={busy} onClick={submitSuggestion} className="mt-3 w-full rounded-lg bg-[#168253] p-3 font-bold text-white disabled:opacity-50">{s(lang,'submit')}</button>
    </section>
    <section className={card}><h3 className="mb-3 font-bold">{s(lang,'suggestHistory')}</h3>{suggestions.length===0?<p className="text-sm text-gray-500">{s(lang,'noRequests')}</p>:suggestions.map(x=><div key={x.id} className="border-b py-3 text-sm"><div className="mb-2 flex justify-between"><b>{s(lang,x.category)}</b><span>{s(lang,x.status)}</span></div><p className="whitespace-pre-wrap">{x.body}</p>{x.admin_reply&&<p className="mt-2 rounded bg-green-50 p-2">{s(lang,'response')}: {x.admin_reply}</p>}</div>)}</section>
  </div>;
}

'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import {t,type Lang,type Team} from './i18n';
import {s} from './staffText';

type Member={id:number;employee_code:string;full_name:string;team:Team;employee_role:'operator'|'worker';rank_title?:string|null;active:boolean;auth_user_id:string|null};
type Leave={id:number;staff_id:number;leave_type:string;start_date:string;end_date:string;reason:string;status:string;reviewer_comment:string;created_at:string};
type Suggestion={id:number;staff_id:number;category:string;body:string;status:string;admin_reply:string;created_at:string};
const c='rounded-xl border border-[#DFE9E1] bg-white p-4 shadow-sm';
const field='min-w-0 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm';
const green='rounded-lg bg-[#168253] px-3 py-2 text-sm font-bold text-white disabled:opacity-50';
export default function StaffAdmin({lang,isAdmin}:{lang:Lang;isAdmin:boolean}){
  const [people,setPeople]=useState<Member[]>([]);
  const [memberSearch,setMemberSearch]=useState('');
  const [savingRank,setSavingRank]=useState<number|null>(null);
  const [leaves,setLeaves]=useState<Leave[]>([]);
  const [suggestions,setSuggestions]=useState<Suggestion[]>([]);
  const [name,setName]=useState('');const [team,setTeam]=useState<Team>('vacuum');const [role,setRole]=useState<'operator'|'worker'>('worker');
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const [credentials,setCredentials]=useState<{code:string;password:string}|null>(null);
  const [replies,setReplies]=useState<Record<number,string>>({});
  const load=useCallback(async()=>{
    if(!isAdmin)return;
    const [p,l,g]=await Promise.all([
      supabase.from('staff_members').select('id,employee_code,full_name,team,employee_role,rank_title,active,auth_user_id').order('id'),
      supabase.from('leave_requests').select('id,staff_id,leave_type,start_date,end_date,reason,status,reviewer_comment,created_at').order('created_at',{ascending:false}).limit(150),
      supabase.from('staff_suggestions').select('id,staff_id,category,body,status,admin_reply,created_at').order('created_at',{ascending:false}).limit(150),
    ]);
    const error=p.error||l.error||g.error;
    if(error)setMessage(error.message);
    setPeople((p.data||[]) as Member[]);setLeaves((l.data||[]) as Leave[]);setSuggestions((g.data||[]) as Suggestion[]);
  },[isAdmin]);
  useEffect(()=>{void load();},[load]);
  const staffName=(id:number)=>people.find(x=>x.id===id)?.full_name||String(id);
  const api=async(action:string,staffId?:number)=>{
    if(!isAdmin||busy)return;
    if(['disable','enable','reset'].includes(action) && !window.confirm('직원 계정 변경을 진행하시겠습니까?'))return;
    setBusy(true);setMessage('');setCredentials(null);
    const {data:{session}}=await supabase.auth.getSession();
    if(!session){setMessage('관리자 로그인이 필요합니다.');setBusy(false);return;}
    try{
      const res=await fetch('/api/staff-admin',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({action,staffId,name,team,role})});
      const json=await res.json() as {error?:string;employee_code?:string;temporary_password?:string};
      if(!res.ok||json.error)throw new Error(json.error||'Request failed');
      if(json.temporary_password&&json.employee_code)setCredentials({code:json.employee_code,password:json.temporary_password});
      setMessage('처리되었습니다.');if(action==='add')setName('');await load();
    }catch(e){setMessage(e instanceof Error?e.message:String(e));}
    setBusy(false);
  };
  const changeRank=async(id:number,value:string)=>{
    if(!isAdmin||savingRank!==null)return;
    setSavingRank(id);
    const {error}=await supabase.rpc('set_staff_rank',{p_id:id,p_rank:value||null});
    setSavingRank(null);if(error)setMessage(error.message);else await load();
  };
  const review=async(id:number,status:'approved'|'rejected')=>{
    if(!isAdmin||busy)return;
    const comment=window.prompt('관리자 의견 (선택)') ?? '';
    setBusy(true);setMessage('');
    const {error}=await supabase.rpc('review_leave',{p_id:id,p_status:status,p_comment:comment});
    setBusy(false);setMessage(error?error.message:'처리되었습니다.');await load();
  };
  const reply=async(id:number,status:string)=>{
    if(!isAdmin||busy)return;
    setBusy(true);setMessage('');
    const {error}=await supabase.rpc('reply_suggestion',{p_id:id,p_status:status,p_reply:replies[id]??''});
    setBusy(false);setMessage(error?error.message:'처리되었습니다.');await load();
  };
  if(!isAdmin)return <div className={c}>{t(lang,'login')}</div>;
  return <div className="space-y-5">
    <div className={c}><h2 className="text-xl font-bold text-[#145C42]">{s(lang,'staffAdmin')}</h2><p className="mt-2 text-sm text-gray-500">{s(lang,'adminIntro')}</p></div>
    {message&&<div role="status" className={c}>{message}</div>}
    {credentials&&<div className={`${c} border-green-400 bg-green-50`}><h3 className="font-bold text-green-900">{s(lang,'initialCredentials')}</h3><p className="mt-2 font-mono">{credentials.code}</p><p className="mt-1 break-all font-mono">{credentials.password}</p><p className="mt-2 text-xs text-red-700">{s(lang,'passwordWarning')}</p><button onClick={()=>setCredentials(null)} className="mt-2 rounded border px-3 py-1">{t(lang,'close')}</button></div>}
    <section className={c}><h3 className="mb-3 font-bold text-[#145C42]">{s(lang,'addEmployee')} ({people.length})</h3>
      <div className="grid gap-2 sm:grid-cols-4"><input className={field} value={name} onChange={e=>setName(e.target.value)} placeholder={s(lang,'name')} maxLength={70}/>
      <select className={field} value={team} onChange={e=>setTeam(e.target.value as Team)}><option value="vacuum">{t(lang,'vacuum')}</option><option value="newmaterial">{t(lang,'newmaterial')}</option></select>
      <select className={field} value={role} onChange={e=>setRole(e.target.value as 'operator'|'worker')}><option value="worker">{t(lang,'worker')}</option><option value="operator">{t(lang,'operator')}</option></select>
      <button disabled={busy||name.trim().length<2} className={green} onClick={()=>api('add')}>{s(lang,'addEmployee')}</button></div>
    </section>
    <section className={c}><h3 className="mb-3 font-bold text-[#145C42]">{s(lang,'staffList')} ({people.filter(x=>x.active).length})</h3>
      <input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder={({ko:'직원 이름 또는 직원번호 검색',en:'Search name or employee ID',ne:'नाम वा कर्मचारी नम्बर खोज्नुहोस्',km:'ស្វែងរកឈ្មោះ ឬលេខបុគ្គលិក',tl:'Hanapin ang pangalan o ID',vi:'Tìm tên hoặc mã nhân viên'} as Record<Lang,string>)[lang]} className={`${field} mb-3`} />
      <div className="max-h-[520px] space-y-2 overflow-y-auto">{people.filter(p=>`${p.full_name} ${p.employee_code}`.toLocaleLowerCase().includes(memberSearch.trim().toLocaleLowerCase())).map(p=><div key={p.id} className="flex flex-wrap items-center gap-2 border-b py-2 text-sm"><div className="min-w-[130px] flex-1"><b>{p.full_name}</b><p className="text-xs text-gray-500">{p.employee_code} · {t(lang,p.team)} · {s(lang,p.active?'active':'inactive')}</p></div>
        <select aria-label={p.full_name+' rank'} disabled={savingRank!==null} value={p.rank_title||''} onChange={e=>void changeRank(p.id,e.target.value)} className="rounded border bg-white px-2 py-2 text-xs text-gray-900"><option value="">직급 미지정</option>{['전무','수석부장','부장','실장','과장','대리','주임','사원'].map(r=><option key={r} value={r}>{r}</option>)}</select>
        {!p.auth_user_id?<button disabled={busy||!p.active} className={green} onClick={()=>api('issue',p.id)}>{s(lang,'issueAccount')}</button>:<button disabled={busy||!p.active} onClick={()=>api('reset',p.id)} className="rounded border px-2 py-2 text-xs">{s(lang,'resetPassword')}</button>}
        <button disabled={busy} className="rounded border px-2 py-2 text-xs" onClick={()=>api(p.active?'disable':'enable',p.id)}>{s(lang,p.active?'disable':'enable')}</button>
      </div>)}</div>
    </section>
    <section className={c}><h3 className="mb-3 font-bold text-[#145C42]">{s(lang,'reviewLeave')}</h3>
      {leaves.length===0?<p className="text-sm text-gray-500">{s(lang,'noRequests')}</p>:leaves.map(x=><div key={x.id} className="space-y-2 border-b py-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><b>{staffName(x.staff_id)} · {t(lang,x.leave_type as 'annual')}</b><span>{s(lang,x.status)}</span></div><p>{x.start_date} ~ {x.end_date} · {x.reason}</p>{x.reviewer_comment&&<p className="text-xs text-gray-500">{x.reviewer_comment}</p>}{x.status==='pending'&&<div className="flex gap-2"><button disabled={busy} className={green} onClick={()=>review(x.id,'approved')}>{s(lang,'approved')}</button><button disabled={busy} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700" onClick={()=>review(x.id,'rejected')}>{s(lang,'rejected')}</button></div>}</div>)}
    </section>
    <section className={c}><h3 className="mb-3 font-bold text-[#145C42]">{s(lang,'reviewSuggestion')}</h3>
      {suggestions.length===0?<p className="text-sm text-gray-500">{s(lang,'noRequests')}</p>:suggestions.map(x=><div key={x.id} className="space-y-2 border-b py-3 text-sm"><div className="flex justify-between gap-2"><b>{staffName(x.staff_id)} · {s(lang,x.category)}</b><span>{s(lang,x.status)}</span></div><p className="whitespace-pre-wrap">{x.body}</p><textarea rows={2} className={field} placeholder={s(lang,'response')} value={replies[x.id]??x.admin_reply} onChange={e=>setReplies(p=>({...p,[x.id]:e.target.value}))}/><div className="flex flex-wrap gap-2"><button disabled={busy} className="rounded border px-3 py-2" onClick={()=>reply(x.id,'reviewing')}>{s(lang,'reviewing')}</button><button disabled={busy} className={green} onClick={()=>reply(x.id,'resolved')}>{s(lang,'resolved')}</button></div></div>)}
    </section>
  </div>;
}

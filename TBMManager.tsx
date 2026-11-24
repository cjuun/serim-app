'use client';
import {useCallback,useEffect,useRef,useState,type PointerEvent} from 'react';
import {supabase} from './supabase';
import {type Lang} from './i18n';
import {tbmText as tx} from './tbmText';

type Group={id:number;name_ko:string;work_ko:string;supervisor_user_id:string|null;supervisor_name:string|null};
type Person={id:number;full_name:string;employee_code:string;auth_user_id?:string|null};
type Membership={group_id:number;staff_id:number};
type Translation={title:string;detail:string};
type Session={id:number;group_id:number;session_date:string;status:'draft'|'approved'|'completed';topic_ko:string;details_ko:string;translations:Record<string,Translation>|null;generation_error:string|null;work_description:string;start_time:string|null;end_time:string|null;risk_assessed:boolean|null;photo_path:string|null;supervisor_signature_path:string|null};
type Attendee={staff_id:number;signed_at:string;signature_path:string};
const LANGS=['en','ne','km','tl','vi'] as const;
const card='rounded-xl border border-[#DFE9E1] bg-white p-4 shadow-sm';
const input='w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900';
const primary='rounded-lg bg-[#168253] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40';
function todayKorea(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const f=(k:string)=>parts.find(p=>p.type===k)?.value||'';return `${f('year')}-${f('month')}-${f('day')}`;}
function SignaturePad({lang,onSave,busy}:{lang:Lang;onSave:(blob:Blob)=>Promise<void>;busy:boolean}){
 const ref=useRef<HTMLCanvasElement|null>(null),drawing=useRef(false);const [hasInk,setHasInk]=useState(false);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const context=canvas.getContext('2d');if(!context)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=520*dpr;canvas.height=155*dpr;
  context.setTransform(dpr,0,0,dpr,0,0);context.fillStyle='white';context.fillRect(0,0,520,155);
  context.lineWidth=2.3;context.lineCap='round';context.strokeStyle='#133D2A';
 },[]);
 const point=(e:PointerEvent<HTMLCanvasElement>)=>{
  const r=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-r.left)*520/r.width,y:(e.clientY-r.top)*155/r.height};
 };
 const down=(e:PointerEvent<HTMLCanvasElement>)=>{e.preventDefault();drawing.current=true;setHasInk(true);e.currentTarget.setPointerCapture(e.pointerId);const c=ref.current?.getContext('2d'),p=point(e);c?.beginPath();c?.moveTo(p.x,p.y);};
 const move=(e:PointerEvent<HTMLCanvasElement>)=>{if(!drawing.current)return;e.preventDefault();const c=ref.current?.getContext('2d'),p=point(e);c?.lineTo(p.x,p.y);c?.stroke();};
 const clear=()=>{const c=ref.current?.getContext('2d');if(!c)return;c.fillStyle='#fff';c.fillRect(0,0,520,155);c.fillStyle='#123';c.beginPath();setHasInk(false);};
 const save=async()=>{if(!hasInk||!ref.current)return;const blob=await new Promise<Blob|null>(resolve=>ref.current?.toBlob(resolve,'image/png'));if(blob)await onSave(blob);};
 return <div className="space-y-2"><canvas ref={ref} onPointerDown={down} onPointerMove={move} onPointerUp={()=>{drawing.current=false;}} onPointerCancel={()=>{drawing.current=false;}} className="h-[155px] w-full touch-none rounded-lg border border-[#C4D9C9] bg-white" aria-label={tx(lang,'sign')}/>
 <div className="flex gap-2"><button type="button" onClick={clear} className="rounded-lg border px-3 py-2 text-sm">{tx(lang,'erase')}</button><button type="button" disabled={busy||!hasInk} onClick={()=>void save()} className={primary}>{tx(lang,'signSave')}</button></div></div>;
}

export default function TBMManager({lang,isAdmin}:{lang:Lang;isAdmin:boolean}){
 const [date,setDate]=useState(todayKorea),[team,setTeam]=useState(1);
 const [groups,setGroups]=useState<Group[]>([]),[members,setMembers]=useState<Membership[]>([]),[people,setPeople]=useState<Person[]>([]);
 const [selfId,setSelfId]=useState<number|null>(null),[userId,setUserId]=useState('');
 const [session,setSession]=useState<Session|null>(null),[attendees,setAttendees]=useState<Attendee[]>([]);
 const [topic,setTopic]=useState(''),[detail,setDetail]=useState(''),[translations,setTranslations]=useState<Record<string,Translation>>({}),[dirty,setDirty]=useState(false);
 const [start,setStart]=useState('08:00'),[end,setEnd]=useState('08:10'),[risk,setRisk]=useState(true);
 const [photo,setPhoto]=useState<File|null>(null),[photoUrl,setPhotoUrl]=useState('');
 const [supervisorUuid,setSupervisorUuid]=useState(''),[supervisorName,setSupervisorName]=useState(''),[newMember,setNewMember]=useState('');
 const [signMode,setSignMode]=useState<'staff'|'supervisor'|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState('');
 const chosen=groups.find(x=>x.id===team);
 const canManage=isAdmin||Boolean(chosen?.supervisor_user_id&&chosen.supervisor_user_id===userId);
 const assigned=members.filter(m=>m.group_id===team).map(m=>people.find(p=>p.id===m.staff_id)).filter((x):x is Person=>Boolean(x));
 const selfAssigned=Boolean(selfId&&members.some(m=>m.group_id===team&&m.staff_id===selfId));
 const ownSigned=Boolean(selfId&&attendees.some(a=>a.staff_id===selfId));
 const load=useCallback(async()=>{
  setLoading(true);setMessage('');
  const {data:{user}}=await supabase.auth.getUser();setUserId(user?.id||'');
  const [gr,mem,staff,se]=await Promise.all([
   supabase.from('tbm_groups').select('id,name_ko,work_ko,supervisor_user_id,supervisor_name').order('id'),
   supabase.from('tbm_group_members').select('group_id,staff_id'),
   supabase.from('staff_members').select('id,full_name,employee_code,auth_user_id').eq('team','vacuum').eq('active',true).order('id'),
   supabase.from('tbm_sessions').select('id,group_id,session_date,status,topic_ko,details_ko,translations,generation_error,work_description,start_time,end_time,risk_assessed,photo_path,supervisor_signature_path').eq('session_date',date).eq('group_id',team).maybeSingle(),
  ]);
  if(gr.error||mem.error||staff.error||se.error)setMessage(tx(lang,'loadError')+' '+(gr.error?.message||mem.error?.message||staff.error?.message||se.error?.message||''));
  setGroups((gr.data||[]) as Group[]);setMembers((mem.data||[]) as Membership[]);setPeople((staff.data||[]) as Person[]);
  setSelfId(((staff.data||[]) as Person[]).find(x=>x.auth_user_id===user?.id)?.id||null);
  const sessionRow=(se.data||null) as Session|null;
  setSession(sessionRow);setTopic(sessionRow?.topic_ko||'');setDetail(sessionRow?.details_ko||'');setTranslations(sessionRow?.translations||{});
  setStart(sessionRow?.start_time?.slice(0,5)||'08:00');setEnd(sessionRow?.end_time?.slice(0,5)||'08:10');setRisk(sessionRow?.risk_assessed??true);setDirty(false);
  setSupervisorUuid(((gr.data||[]) as Group[]).find(x=>x.id===team)?.supervisor_user_id||'');
  setSupervisorName(((gr.data||[]) as Group[]).find(x=>x.id===team)?.supervisor_name||'');
  if(sessionRow){
   const {data,error}=await supabase.from('tbm_attendance').select('staff_id,signed_at,signature_path').eq('session_id',sessionRow.id);
   if(error)setMessage(tx(lang,'loadError')+' '+error.message);
   setAttendees((data||[]) as Attendee[]);
   if(sessionRow.photo_path){const {data:signed}=await supabase.storage.from('tbm-evidence').createSignedUrl(sessionRow.photo_path,900);setPhotoUrl(signed?.signedUrl||'');}else setPhotoUrl('');
  }else{setAttendees([]);setPhotoUrl('');}
  setLoading(false);
 },[date,team,lang]);
 useEffect(()=>{void load();},[load]);
 const run=async(task:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await task();await load();}catch(e){setMessage(e instanceof Error?e.message:tx(lang,'loadError'));}finally{setBusy(false);}};
 const generate=()=>run(async()=>{
  const {data:{session:s}}=await supabase.auth.getSession();if(!s)throw Error(tx(lang,'loginRequired'));
  const r=await fetch('/api/tbm/generate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${s.access_token}`},body:JSON.stringify({date})});
  const v=await r.json() as {error?:string;results?:{group:number;result:string}[]};if(!r.ok)throw Error(v.error||tx(lang,'loadError'));
  setMessage((v.results||[]).map(x=>`${x.group}: ${x.result}`).join('; '));
 });
 // Do not use run() for local translation; it reloads the draft and discards unsaved edits.
 const redoTranslation=async()=>{
  setBusy(true);setMessage('');try{
   if(!session)throw Error(tx(lang,'empty'));
   const {data:{session:s}}=await supabase.auth.getSession();if(!s)throw Error(tx(lang,'loginRequired'));
   const r=await fetch('/api/tbm/translate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${s.access_token}`},body:JSON.stringify({sessionId:session.id,title:topic,detail})});
   const v=await r.json() as {error?:string;translations?:Record<string,Translation>};if(!r.ok||!v.translations)throw Error(v.error||tx(lang,'loadError'));
   setTranslations(v.translations);setDirty(false);
  }catch(e){setMessage(e instanceof Error?e.message:tx(lang,'loadError'));}finally{setBusy(false);}
 };
 const approve=()=>run(async()=>{
  if(!session||dirty||LANGS.some(k=>!translations[k]?.title?.trim()||!translations[k]?.detail?.trim()))throw Error(tx(lang,'translationPending'));
  const {error}=await supabase.rpc('tbm_approve_session',{p_session:session.id,p_topic:topic,p_details:detail,p_translations:translations,p_start:start||null,p_end:end||null,p_risk:risk});if(error)throw error;
 });
 const compactPhoto=async(file:File):Promise<{blob:Blob;mime:string;ext:string}>=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('JPG / PNG / WEBP only');
  if(file.size<=5*1024*1024)return {blob:file,mime:file.type,ext:file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'};
  const bitmap=await createImageBitmap(file);
  const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
  const context=canvas.getContext('2d');if(!context)throw Error('Photo processing failed');
  context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',0.77));
  if(!blob||blob.size>5*1024*1024)throw Error('Photo must be under 5 MB');
  return {blob,mime:'image/jpeg',ext:'jpg'};
 };
 const upload=async(path:string,file:File|Blob,type:string)=>{
  const {error}=await supabase.storage.from('tbm-evidence').upload(path,file,{contentType:type,upsert:false});
  if(error&&!/duplicate|already exists|resource already/i.test(error.message))throw error;
 };
 const submitSign=async(blob:Blob)=>run(async()=>{
  if(!session||!userId)throw Error(tx(lang,'loginRequired'));
  const path=`sessions/${session.id}/signatures/${userId}.png`;
  await upload(path,blob,'image/png');
  const {error}=await supabase.rpc('tbm_attend',{p_session:session.id,p_path:path});if(error)throw error;
  setSignMode(null);
 });
 const complete=async(blob:Blob)=>run(async()=>{
  if(!session||!userId||!photo)throw Error(tx(lang,'completeFirst'));
  const prepared=await compactPhoto(photo);
  const signPath=`sessions/${session.id}/signatures/${userId}.png`;
  const ext=prepared.ext;
  const photoPath=`sessions/${session.id}/photo/${userId}.${ext}`;
  await upload(signPath,blob,'image/png');await upload(photoPath,prepared.blob,prepared.mime);
  const {error}=await supabase.rpc('tbm_complete_session',{p_session:session.id,p_sign_path:signPath,p_photo_path:photoPath});if(error)throw error;
  setSignMode(null);setPhoto(null);
 });
 const setManager=()=>run(async()=>{
  const uuid=supervisorUuid.trim();if(uuid&&!/^[a-f0-9-]{36}$/i.test(uuid))throw Error('Invalid UUID');
  const {error}=await supabase.rpc('tbm_set_supervisor',{p_group:team,p_user:uuid||null,p_name:supervisorName});if(error)throw error;
 });
 const assign=(id:number)=>run(async()=>{const {error}=await supabase.rpc('tbm_assign_member',{p_group:team,p_staff:id});if(error)throw error;});
 const unassign=(id:number)=>run(async()=>{const {error}=await supabase.rpc('tbm_remove_member',{p_staff:id});if(error)throw error;});
 const printable=Boolean(session&&(canManage||session.status==='completed'));
 const localized=session?.translations?.[lang];
 const displayTitle=lang==='ko'?session?.topic_ko:localized?.title;
 const displayDetail=lang==='ko'?session?.details_ko:localized?.detail;
 return <div className="space-y-4">
  <header className={card}><h2 className="text-xl font-bold text-[#145C42]">{tx(lang,'tbm')}</h2><p className="mt-1 text-sm text-gray-500">{tx(lang,'schedule')}</p><p className="mt-2 text-xs text-[#876A19]">{tx(lang,'aiReview')}</p></header>
  <section className={card}><div className="grid gap-3 sm:grid-cols-[190px_1fr]"><label className="text-sm">{tx(lang,'selectDate')}<input type="date" value={date} onChange={e=>setDate(e.target.value)} className={`${input} mt-1`}/></label><div><p className="mb-1 text-sm">{tx(lang,'selectTeam')}</p><div className="grid grid-cols-3 gap-1.5">{[1,2,3].map(x=><button key={x} onClick={()=>setTeam(x)} className={`rounded-lg px-2 py-3 text-sm font-semibold ${team===x?'bg-[#145C42] text-white':'border bg-white'}`}>{tx(lang,'team')} {x}</button>)}</div></div></div>
  <p className="mt-3 text-sm text-[#31513B]">{team===3?tx(lang,'workScrap'):tx(lang,'workPack')}</p><p className="mt-1 text-sm">{tx(lang,'supervisor')}: {chosen?.supervisor_name||'—'}</p></section>
  {message&&<p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
  {loading?<section className={card}>{tx(lang,'loading')}</section>:<>
   {isAdmin&&<section className={card}><button onClick={generate} disabled={busy} className={primary}>{tx(lang,'aiGenerate')}</button><p className="mt-2 text-xs text-gray-500">{tx(lang,'aiReview')}</p></section>}
   {!session?<section className={card}>{tx(lang,'empty')}</section>:<>
    <section className={card}>
     <div className="flex items-center justify-between gap-2"><h3 className="font-bold text-[#145C42]">{tx(lang,'topic')}</h3><span className={`rounded-full px-3 py-1 text-xs ${session.status==='completed'?'bg-green-100 text-green-800':session.status==='approved'?'bg-blue-50 text-blue-800':'bg-amber-100 text-amber-800'}`}>{tx(lang,session.status==='draft'?'pending':session.status)}</span></div>
     {session.generation_error&&canManage&&<p className="mt-2 text-sm text-amber-700">{session.generation_error}</p>}
     {canManage&&session.status!=='completed'?<div className="mt-3 space-y-3">
       <label className="block text-sm">{tx(lang,'topic')}<input value={topic} maxLength={250} onChange={e=>{setTopic(e.target.value);setDirty(true);}} className={`${input} mt-1`}/></label>
       <label className="block text-sm">{tx(lang,'detail')}<textarea value={detail} maxLength={4000} rows={5} onChange={e=>{setDetail(e.target.value);setDirty(true);}} className={`${input} mt-1`}/></label>
       <button type="button" onClick={()=>void redoTranslation()} disabled={busy||topic.trim().length<3||detail.trim().length<10} className="rounded-lg border border-[#168253] px-3 py-2 text-sm text-[#145C42] disabled:opacity-40">{tx(lang,'translationPending')} ↻</button>
       <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><label className="text-xs">{tx(lang,'started')}<input className={`${input} mt-1`} type="time" value={start} onChange={e=>setStart(e.target.value)}/></label><label className="text-xs">{tx(lang,'ended')}<input className={`${input} mt-1`} type="time" value={end} onChange={e=>setEnd(e.target.value)}/></label><label className="text-xs">{tx(lang,'riskCheck')}<select className={`${input} mt-1`} value={risk?'yes':'no'} onChange={e=>setRisk(e.target.value==='yes')}><option value="yes">{tx(lang,'yes')}</option><option value="no">{tx(lang,'no')}</option></select></label></div>
       <button disabled={busy||dirty||LANGS.some(k=>!translations[k]?.title||!translations[k]?.detail)} className={primary} onClick={approve}>{tx(lang,'approve')}</button>
     </div>:<div className="mt-2 space-y-2"><p className="text-lg font-semibold">{displayTitle||tx(lang,'translationPending')}</p><p className="whitespace-pre-wrap text-sm leading-relaxed">{displayDetail||tx(lang,'translationPending')}</p></div>}
    </section>
    {session.status!=='draft'&&<section className={card}><h3 className="mb-3 font-bold">{tx(lang,'attendance')} · {attendees.length}</h3>
     {assigned.length?<div className="grid gap-2 sm:grid-cols-2">{assigned.map(p=><div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"><span>{p.full_name} · {p.employee_code}</span><span className={attendees.some(a=>a.staff_id===p.id)?'text-green-700':'text-gray-500'}>{attendees.some(a=>a.staff_id===p.id)?tx(lang,'signDone'):'—'}</span></div>)}</div>:<p className="text-sm text-gray-500">{tx(lang,'noStaff')}</p>}
     {selfAssigned&&!ownSigned&&session.status==='approved'&&<div className="mt-4 border-t pt-3"><h4 className="mb-2 font-semibold">{tx(lang,'sign')}</h4><SignaturePad lang={lang} busy={busy} onSave={submitSign}/></div>}
     {selfAssigned&&ownSigned&&<p className="mt-3 text-sm font-semibold text-green-700">✓ {tx(lang,'signDone')}</p>}
    </section>}
    {canManage&&session.status==='approved'&&<section className={card}><h3 className="mb-3 font-bold">{tx(lang,'photo')} & {tx(lang,'supervisor')}</h3><label className="block text-sm">{tx(lang,'photoSelect')}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="mt-2 block w-full text-sm" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label>
     <p className="mt-2 text-xs text-gray-500">{tx(lang,'completeFirst')}</p><div className="mt-3"><SignaturePad lang={lang} busy={busy||!photo} onSave={complete}/></div>
    </section>}
    {photoUrl&&<section className={card}><h3 className="mb-2 font-semibold">{tx(lang,'photo')}</h3><img src={photoUrl} alt={tx(lang,'photo')} className="max-h-80 w-full rounded-lg object-contain"/></section>}
    {printable&&<button type="button" onClick={()=>window.open(`/tbm/print?session=${session.id}`,'_blank','noopener,noreferrer')} className={primary}>{tx(lang,'print')}</button>}
   </>}
   {isAdmin&&<section className={card}><h3 className="mb-3 text-lg font-bold text-[#145C42]">{tx(lang,'staffAssignment')} · {tx(lang,'team')} {team}</h3>
      <div className="space-y-2 rounded-lg bg-green-50 p-3"><label className="text-xs">{tx(lang,'supervisorSetup')} · {tx(lang,'accountId')}<input className={`${input} mt-1`} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={supervisorUuid} onChange={e=>setSupervisorUuid(e.target.value)}/></label><input className={input} value={supervisorName} placeholder={tx(lang,'supervisor')} onChange={e=>setSupervisorName(e.target.value)}/><button disabled={busy} className={primary} onClick={setManager}>{tx(lang,'save')}</button></div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2"><select value={newMember} onChange={e=>setNewMember(e.target.value)} className={input}><option value="">{tx(lang,'addStaff')}</option>{people.filter(p=>!members.some(m=>m.staff_id===p.id)).map(p=><option key={p.id} value={p.id}>{p.full_name} · {p.employee_code}</option>)}</select><button disabled={busy||!newMember} className={primary} onClick={()=>void assign(Number(newMember))}>{tx(lang,'assign')}</button></div>
      <div className="mt-3 space-y-1">{assigned.map(p=><div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"><span>{p.full_name}</span><button disabled={busy} className="text-red-700" onClick={()=>void unassign(p.id)}>{tx(lang,'remove')}</button></div>)}</div>
    </section>}
  </>}
 </div>;
}

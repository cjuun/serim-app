'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import {type Lang} from './i18n';

type Role='chief'|'subadmin'|'operator'|'worker';
type Audit={id:number;staff_id:number;previous_role:string|null;new_role:string;created_at:string};
type Member={id:number;employee_code:string;full_name:string;team:'vacuum'|'newmaterial';employee_role:string;active:boolean;auth_user_id:string|null;role:Role;team_scope:string;permissions:string[]};
const OPTIONS:{key:string;ko:string;en:string}[]=[
 {key:'attendance.manage',ko:'출석체크 확정',en:'Manage attendance'},
 {key:'shift.manage',ko:'주/야 교대명단 편성',en:'Manage shifts'},
 {key:'dailyreport.manage',ko:'일일 근태보고서 수정',en:'Edit daily report'},
 {key:'tbm.manage',ko:'TBM 교육 관리',en:'Manage TBM'},
 {key:'claims.manage',ko:'고객사 클레임 등록·수정',en:'Manage claims'},
 {key:'calendar.manage',ko:'소속팀 캘린더 일정 관리',en:'Manage team calendar'},
 {key:'machines.manage',ko:'설비 이상 조치',en:'Handle machine issues'},
 {key:'breaks.view',ko:'소속팀 휴게시간 전체 조회',en:'View team breaks'},
];
const card='rounded-xl border border-[#DFE9E1] bg-white p-4 shadow-sm';
export default function AccessManager({lang}:{lang:Lang}){
 const [audit,setAudit]=useState<Audit[]>([]);
 const [rows,setRows]=useState<Member[]>([]),[selected,setSelected]=useState<number|null>(null),[search,setSearch]=useState(''),[role,setRole]=useState<Role>('worker'),[scope,setScope]=useState<'vacuum'|'newmaterial'>('vacuum'),[rights,setRights]=useState<string[]>([]),[message,setMessage]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
 const load=useCallback(async()=>{setLoading(true);try{const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('관리자 인증이 필요합니다.');const res=await fetch('/api/role-access?mode=members',{headers:{Authorization:`Bearer ${session.access_token}`}});const result=await res.json();if(!res.ok)throw new Error(result.error||'Cannot load');setRows(result.rows||[]);setReady(!!result.ready);
   const ar=await fetch('/api/role-access?mode=audit',{headers:{Authorization:`Bearer ${session.access_token}`}});if(ar.ok){const a=await ar.json();setAudit(a.rows||[]);}}catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 const selectedRow=rows.find(r=>r.id===selected);
 const choose=(p:Member)=>{setSelected(p.id);setRole(p.role);setScope(p.team_scope==='newmaterial'?'newmaterial':'vacuum');setRights(p.permissions||[]);setMessage('');};
 const save=async()=>{
  if(!selectedRow?.auth_user_id||busy||!ready)return;
  const chief=role==='chief';
  if(!window.confirm(`${selectedRow.full_name} (${selectedRow.employee_code})의 시스템 권한을 '${role}'(으)로 변경할까요?`))return;
  let confirmChief: string|undefined;
  if(chief){confirmChief=window.prompt('총괄관리자 지정은 높은 권한을 부여합니다. 계속하려면 영문 CHIEF를 입력하세요.')||'';if(confirmChief!=='CHIEF')return;}
  setBusy(true);setMessage('');try{
   const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('로그인 만료');
   const res=await fetch('/api/role-access',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({staffId:selectedRow.id,role,teamScope:scope,permissions:role==='subadmin'?rights:[],confirmChief})});
   const result=await res.json();if(!res.ok)throw new Error(result.error||'Save failed');setMessage('권한 정보가 저장되었습니다. 서버/RLS 기능별 테스트를 확인하세요.');await load();
  }catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 };
 return <div className="space-y-4"><section className={card}><h2 className="text-xl font-bold text-[#145C42]">{lang==='ko'?'사용자 권한 관리':'User access management'}</h2><p className="mt-2 text-sm text-gray-600">{lang==='ko'?'총괄관리자 전용. 직급(실장/부장 등)과 시스템 권한은 별도 관리합니다. 권한 부여·해제는 변경 이력을 저장합니다.':'Chief administrator only. Personnel rank and app access are separate.'}</p></section>
 {!ready&&<div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">권한 관리용 데이터베이스가 준비되지 않았습니다. 별도 테스트 DB에서 SQL을 먼저 적용하세요. 실제 저장은 차단됩니다.</div>}
 {message&&<div role="status" className={card}>{message}</div>}
 <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,2fr)_minmax(320px,3fr)]"><section className={card}><h3 className="font-bold text-[#145C42]">직원 계정 선택</h3><input className="my-3 w-full rounded-lg border p-3 text-sm" value={search} onChange={e=>setSearch(e.target.value)} placeholder="이름 또는 직원번호 검색"/><div className="max-h-[510px] space-y-1 overflow-y-auto">{loading?'Loading...':rows.filter(r=>`${r.full_name} ${r.employee_code}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(p=><button key={p.id} type="button" onClick={()=>choose(p)} className={`w-full rounded-lg border px-3 py-3 text-left text-sm ${selected===p.id?'border-green-600 bg-green-50':'border-gray-100'}`}><div className="flex flex-wrap items-center justify-between gap-2"><b>{p.full_name}</b><span className="text-xs text-green-800">{p.role}</span></div><p className="mt-1 text-xs text-gray-500">{p.employee_code} · {p.team==='vacuum'?'진공성형팀':'신소재생산팀'}{p.auth_user_id?'':' · 계정 없음'}</p></button>)}</div></section>
 <section className={card}>{!selectedRow?<p className="text-sm text-gray-600">왼쪽에서 직원을 선택하세요.</p>:<div className="space-y-4"><div><h3 className="text-lg font-bold text-[#145C42]">{selectedRow.full_name}</h3><p className="text-sm text-gray-500">{selectedRow.employee_code} · {selectedRow.employee_role==='operator'?'현장 오퍼레이터':'현장 직원'}</p></div>{!selectedRow.auth_user_id&&<p className="rounded bg-amber-50 p-3 text-sm text-amber-700">로그인 계정이 없는 직원입니다. 직원 신청관리에서 먼저 계정을 발급하세요.</p>}
 <label className="block text-sm font-semibold">시스템 역할<select className="mt-2 w-full rounded-lg border p-3" value={role} onChange={e=>{const next=e.target.value as Role;setRole(next);if(next!=='subadmin')setRights([]);}}><option value="chief">총괄관리자</option><option value="subadmin">부관리자</option><option value="operator">오퍼레이터</option><option value="worker">작업자</option></select></label>
 {role==='subadmin'&&<><label className="block text-sm font-semibold">관리 범위<select className="mt-2 w-full rounded-lg border p-3" value={scope} onChange={e=>setScope(e.target.value as 'vacuum'|'newmaterial')}><option value="vacuum">진공성형팀</option><option value="newmaterial">신소재생산팀</option></select></label><div className="space-y-2"><h4 className="text-sm font-bold">부관리자 세부 권한</h4>{OPTIONS.map(o=><label key={o.key} className="flex items-center gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={rights.includes(o.key)} onChange={e=>setRights(p=>e.target.checked?[...p,o.key]:p.filter(x=>x!==o.key))}/>{lang==='ko'?o.ko:o.en}</label>)}</div><p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">기능별 데이터 수정은 Supabase RLS/RPC 권한이 허용된 경우에만 가능합니다. 이 화면의 체크만으로 운영 DB 접근 권한이 자동 확장되지는 않습니다.</p></>}
 {role==='chief'&&<p className="rounded-lg bg-red-50 p-3 text-xs text-red-900">전체 관리 권한입니다. 부여하려면 별도 확인이 필요하며, 마지막 총괄관리자는 해제할 수 없습니다.</p>}
 <button type="button" disabled={busy||!ready||!selectedRow.auth_user_id} className="w-full rounded-lg bg-[#168253] px-4 py-3 font-bold text-white disabled:opacity-40" onClick={()=>void save()}>{busy?'저장 중...':'권한 변경 저장'}</button></div>}</section></div>
 <section className={card}><h3 className="font-bold text-[#145C42]">최근 권한 변경 이력</h3><div className="mt-3 space-y-2">{audit.length?audit.slice(0,10).map(a=><div key={a.id} className="flex flex-wrap justify-between gap-2 border-b py-2 text-xs"><span>{rows.find(p=>p.id===a.staff_id)?.full_name||'직원 '+a.staff_id} · {a.previous_role||'-'} → {a.new_role}</span><time className="text-gray-500">{new Date(a.created_at).toLocaleString('ko-KR')}</time></div>):<p className="text-sm text-gray-500">등록된 변경 이력이 없습니다.</p>}</div></section>
 </div>;
}

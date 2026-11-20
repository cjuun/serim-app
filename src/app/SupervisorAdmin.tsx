'use client';
import {useEffect,useState} from 'react';
import {supabase} from './supabase';
const NAMES=['최종상','박종선','박경석','연원진','송형석'];
type Row={user_id:string;full_name:string};
export default function SupervisorAdmin(){
 const [name,setName]=useState(NAMES[0]);const [userId,setUserId]=useState('');const [list,setList]=useState<Row[]>([]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 const load=async()=>{const {data,error}=await supabase.from('production_supervisors').select('user_id,full_name');if(error)setMessage(error.message);else setList((data??[]) as Row[]);};
 useEffect(()=>{void load();},[]);
 const save=async()=>{if(busy||!userId)return;setBusy(true);setMessage('');const {error}=await supabase.rpc('assign_production_supervisor',{p_user_id:userId.trim(),p_full_name:name});setBusy(false);setMessage(error?error.message:'부관리자 연결 완료');if(!error){setUserId('');void load();}};
 return <section className="rounded-xl border border-[#DFE9E1] bg-white p-4 shadow-sm"><h3 className="text-lg font-bold text-[#145C42]">부관리자 권한 연결 (총괄 관리자 전용)</h3><p className="mt-2 text-sm text-gray-500">해당 임직원의 Supabase Authentication User ID(UUID)를 확인한 뒤 연결하세요. 이름만으로 권한이 부여되지 않습니다. 초기 권한은 클레임 관리로 제한합니다.</p><div className="mt-3 grid gap-2 sm:grid-cols-[160px_1fr_auto]"><select value={name} onChange={e=>setName(e.target.value)} className="rounded-lg border p-2">{NAMES.map(n=><option key={n}>{n}</option>)}</select><input value={userId} onChange={e=>setUserId(e.target.value)} placeholder="Supabase Auth User ID (UUID)" className="min-w-0 rounded-lg border p-2 text-sm"/><button disabled={busy||!userId.trim()} onClick={save} className="rounded-lg bg-[#168253] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">권한 연결</button></div>{message&&<p className="mt-2 text-sm">{message}</p>}<div className="mt-3 flex flex-wrap gap-2">{list.map(x=><span key={x.user_id} className="rounded-md bg-green-50 px-2 py-1 text-xs">{x.full_name} · 연결됨</span>)}</div></section>;
}

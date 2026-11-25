'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';
import type {Lang} from './i18n';

type Member={id:number;full_name:string;team:string;employee_role:string;division_role:string|null;rank_title:string|null;active:boolean};
const managerNames=['최종상','박종선','강장원','김문수','박원식','주우팔','강동효','박경석','송형석','연원진','최준혁'];
const original:Record<string,string>={
 '최종상':'본부장','강장원':'생산1팀','박지현':'생산1팀','김문수':'생산2팀','정동훈':'생산2팀',
 '박종선':'생산지원팀','박경석':'생산지원팀','최준혁':'생산지원팀','송형석':'품질관리팀',
 '박원식':'신소재생산팀','주우팔':'신소재생산팀','강동효':'신소재생산팀','연원진':'신소재생산팀'
};
const teams:Record<string,Record<Lang,string>>={
 '본부장':{ko:'본부장',en:'Division director',ne:'विभाग प्रमुख',km:'ប្រធានផ្នែក',tl:'Pinuno ng dibisyon',vi:'Trưởng bộ phận'},
 '생산1팀':{ko:'생산1팀',en:'Production 1',ne:'उत्पादन १',km:'ផលិតកម្ម ១',tl:'Produksyon 1',vi:'Sản xuất 1'},
 '생산2팀':{ko:'생산2팀',en:'Production 2',ne:'उत्पादन २',km:'ផលិតកម្ម ២',tl:'Produksyon 2',vi:'Sản xuất 2'},
 '생산지원팀':{ko:'생산지원팀',en:'Production support',ne:'उत्पादन सहायता',km:'គាំទ្រផលិតកម្ម',tl:'Suporta sa produksyon',vi:'Hỗ trợ sản xuất'},
 '품질관리팀':{ko:'품질관리팀',en:'Quality control',ne:'गुणस्तर',km:'គ្រប់គ្រងគុណភាព',tl:'Kontrol sa kalidad',vi:'Quản lý chất lượng'},
 '신소재생산팀':{ko:'신소재생산팀',en:'New materials',ne:'नयाँ सामग्री',km:'វត្ថុធាតុថ្មី',tl:'Bagong materyal',vi:'Vật liệu mới'},
 '진공성형팀 · 배정 대기':{ko:'진공성형팀 · 팀 배정 대기',en:'Vacuum forming · Unassigned',ne:'भ्याकुम टोली तोक्न बाँकी',km:'មិនទាន់ចាត់ក្រុម',tl:'Vacuum · Hindi pa nakatalaga',vi:'Định hình · Chưa phân tổ'}
};
const lbl={
 title:{ko:'생산본부 통합 조직도',en:'Production organization',ne:'उत्पादन संगठन',km:'រចនាសម្ព័ន្ធបុគ្គលិក',tl:'Organisasyon',vi:'Sơ đồ tổ chức'},
 all:{ko:'전체',en:'All',ne:'सबै',km:'ទាំងអស់',tl:'Lahat',vi:'Tất cả'},
 manager:{ko:'관리자',en:'Manager',ne:'प्रबन्धक',km:'អ្នកគ្រប់គ្រង',tl:'Manager',vi:'Quản lý'},
 operator:{ko:'오퍼레이터',en:'Operator',ne:'अपरेटर',km:'ប្រតិបត្តិករ',tl:'Operator',vi:'Vận hành'},
 worker:{ko:'작업자',en:'Worker',ne:'कामदार',km:'កម្មករ',tl:'Manggagawa',vi:'Công nhân'},
 search:{ko:'이름 검색',en:'Search names',ne:'नाम खोज्नुहोस्',km:'ស្វែងរកឈ្មោះ',tl:'Hanapin ang pangalan',vi:'Tìm tên'},
 missing:{ko:'직원명단 등록 필요',en:'Not in employee registry',ne:'दर्ता आवश्यक',km:'ត្រូវការចុះបញ្ជី',tl:'Kailangang irehistro',vi:'Cần đăng ký'}
} as const;
export default function OrganizationChart({lang}:{lang:Lang}){
 const [people,setPeople]=useState<Member[]>([]),[query,setQuery]=useState(''),[role,setRole]=useState('all'),[error,setError]=useState('');
 useEffect(()=>{let active=true;void supabase.from('staff_members').select('id,full_name,team,employee_role,division_role,rank_title,active').eq('active',true).order('full_name').then(({data,error})=>{if(active){setPeople((data||[]) as Member[]);setError(error?.message||'');}});return()=>{active=false;};},[]);
 const decorate=(p:Member)=>({id:p.id,name:p.full_name,team:original[p.full_name]||(p.team==='newmaterial'?'신소재생산팀':'진공성형팀 · 배정 대기'),role:managerNames.includes(p.full_name)?'manager':p.employee_role==='operator'?'operator':'worker',rank:p.rank_title||'사원',missing:false});
 const members=useMemo(()=>{
  const known=people.map(decorate),seen=new Set(known.map(p=>p.name));
  return [...known,...managerNames.filter(n=>!seen.has(n)).map(n=>({id:-managerNames.indexOf(n)-1,name:n,team:original[n]||'생산지원팀',role:'manager',rank:'사원',missing:true}))];
 },[people]);
 const filtered=members.filter(p=>(role==='all'||p.role===role)&&p.name.toLowerCase().includes(query.trim().toLowerCase()));
 const grouped=[...new Set(filtered.map(p=>p.team))].map(team=>({team,list:filtered.filter(p=>p.team===team)}));
 return <div className="space-y-4">
  <section className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-[#145C42]">{lbl.title[lang]}</h2><p className="mt-2 text-sm text-gray-500">SERIM B&G · {people.length} active staff{members.some(x=>x.missing)?' · 등록 대기 '+members.filter(x=>x.missing).length:''}</p>{error&&<p className="mt-2 text-red-700">{error}</p>}</section>
  <section className="rounded-xl border bg-white p-4"><div className="grid gap-3 sm:grid-cols-4">{([['all',lbl.all],['manager',lbl.manager],['operator',lbl.operator],['worker',lbl.worker]] as const).map(([code,name])=><button key={code} className={`rounded-lg border p-3 text-sm ${role===code?'border-green-700 bg-green-50 font-bold':''}`} onClick={()=>setRole(code)}>{name[lang]} · {members.filter(p=>code==='all'||p.role===code).length}</button>)}</div><input className="mt-3 w-full rounded-lg border p-3 text-sm" placeholder={lbl.search[lang]} value={query} onChange={e=>setQuery(e.target.value)}/></section>
  <div className="grid items-start gap-4 xl:grid-cols-2">{grouped.map(g=><section key={g.team} className="rounded-xl border bg-white p-4"><h3 className="mb-3 font-bold text-[#145C42]">{teams[g.team]?.[lang]||g.team} · {g.list.length}</h3><div className="grid gap-2 sm:grid-cols-2">{g.list.map(p=><div key={p.id} className="rounded-lg border bg-[#F5FAF6] p-3"><div className="flex items-center justify-between gap-2"><b className="text-sm">{p.name}</b><span className="text-xs text-gray-600">{p.rank}</span></div><p className="mt-1 text-xs text-[#168253]">{lbl[p.role as 'manager'|'operator'|'worker'][lang]}</p>{p.missing&&<p className="mt-1 text-xs text-red-700">{lbl.missing[lang]}</p>}</div>)}</div></section>)}</div>
  <p className="text-xs text-gray-500">{lang==='ko'?'조직도에서 누락된 관리자는 임시로 표시됩니다. 직원명단에 등록하면 자동으로 통합됩니다. 기존 개인별 생산1·2팀 미배정은 임의 배치하지 않습니다.':'The organization view follows the active employee registry; missing managers require registration.'}</p>
 </div>;
}

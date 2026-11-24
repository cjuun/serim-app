'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../supabase';
import {type Lang,languages} from '../../i18n';
import {tbmText as tx} from '../../tbmText';

type RecordRow={session:{id:number;session_date:string;group_id:number;topic_ko:string;details_ko:string;translations:Record<string,{title:string;detail:string}>|null;work_description:string;start_time:string|null;end_time:string|null;risk_assessed:boolean|null;photo_path:string|null;supervisor_signature_path:string|null;status:string};groupName:string;supervisor:string;people:{name:string;signature:string;signedAt:string}[];photo:string;supervisorSign:string};
export default function TbmPrint(){
 const [report,setReport]=useState<RecordRow|null>(null),[message,setMessage]=useState('TBM 일지를 불러오는 중입니다.'),[lang,setLang]=useState<Lang>('ko');
 useEffect(()=>{
  let active=true;const stored=window.localStorage.getItem('serim-language');if(languages.some(x=>x.code===stored))setLang(stored as Lang);
  (async()=>{
   const id=Number(new URLSearchParams(window.location.search).get('session'));
   if(!Number.isInteger(id)||id<=0){setMessage('교육일지 번호가 올바르지 않습니다.');return;}
   const {data:auth}=await supabase.auth.getUser();if(!auth.user){setMessage('로그인이 필요합니다.');return;}
   const {data:s,error}=await supabase.from('tbm_sessions').select('id,session_date,group_id,topic_ko,details_ko,translations,work_description,start_time,end_time,risk_assessed,photo_path,supervisor_signature_path,status').eq('id',id).maybeSingle();
   if(error||!s){setMessage(error?.message||'일지를 찾지 못했습니다.');return;}
   const [{data:group},{data:attendance}]=await Promise.all([
    supabase.from('tbm_groups').select('name_ko,supervisor_name').eq('id',s.group_id).maybeSingle(),
    supabase.from('tbm_attendance').select('staff_id,signed_at,signature_path').eq('session_id',id).order('signed_at'),
   ]);
   const ids=(attendance||[]).map(x=>x.staff_id);
   const {data:members}=ids.length?await supabase.from('staff_members').select('id,full_name').in('id',ids):{data:[] as {id:number;full_name:string}[]};
   const names=new Map((members||[]).map(x=>[x.id,x.full_name]));
   async function signed(path:string|null){if(!path)return '';const {data}=await supabase.storage.from('tbm-evidence').createSignedUrl(path,1800);return data?.signedUrl||'';}
   const photos=await Promise.all((attendance||[]).map(async a=>({name:names.get(a.staff_id)||String(a.staff_id),signature:await signed(a.signature_path),signedAt:a.signed_at})));
   const [photo,supervisorSign]=await Promise.all([signed(s.photo_path),signed(s.supervisor_signature_path)]);
   if(active){setReport({session:s,groupName:group?.name_ko||`TBM ${s.group_id}팀`,supervisor:group?.supervisor_name||'',people:photos,photo,supervisorSign});setMessage('');}
  })().catch(e=>{if(active)setMessage(e instanceof Error?e.message:'일지 로딩 오류');});
  return()=>{active=false;};
 },[]);
 if(!report)return <div className="p-8 text-center text-gray-700">{message}</div>;
 const {session:s}=report;
 const title=lang==='ko'?s.topic_ko:s.translations?.[lang]?.title||tx(lang,'translationPending');
 const details=lang==='ko'?s.details_ko:s.translations?.[lang]?.detail||tx(lang,'translationPending');
 const pairs=[] as {name:string;signature:string;signedAt:string}[][];
 for(let i=0;i<report.people.length;i+=3)pairs.push(report.people.slice(i,i+3));
 if(!pairs.length)pairs.push([]);
 return <main className="mx-auto max-w-[900px] bg-white p-5 text-gray-950">
  <div className="print:hidden mb-5 flex justify-between gap-2"><div><b>{tx(lang,'tbm')}</b><p className="text-sm">{tx(lang,'print')}</p></div><button className="rounded-lg bg-[#145C42] px-4 py-2 text-white" onClick={()=>window.print()}>{tx(lang,'print')}</button></div>
  <section className="tbm-print-sheet">
   <table className="w-full table-fixed border-collapse text-center text-sm">
    <colgroup><col style={{width:'18%'}}/><col style={{width:'31%'}}/><col style={{width:'18%'}}/><col style={{width:'33%'}}/></colgroup>
    <tbody>
     <tr><td colSpan={3} className="h-20 border border-black text-2xl font-bold">{tx(lang,'tbm')}</td><td className="border border-black"><div className="mb-2 font-semibold">결 재 · 관리감독자</div>{report.supervisorSign?<img src={report.supervisorSign} className="mx-auto h-12 max-w-full object-contain" alt="관리감독자 서명"/>:<span className="text-xs">{tx(lang,'pending')}</span>}</td></tr>
     <tr><td colSpan={2} className="border border-black p-2 text-right">{s.session_date}</td><td className="border border-black p-2">시간</td><td className="border border-black p-2">{s.start_time?.slice(0,5)||'—'} ~ {s.end_time?.slice(0,5)||'—'}</td></tr>
     <tr><td className="bg-gray-100 border border-black p-2 font-semibold">사업장명</td><td colSpan={3} className="border border-black p-2">세림B&G</td></tr>
     <tr><td className="bg-gray-100 border border-black p-2 font-semibold">본부 / 팀</td><td colSpan={3} className="border border-black p-2">생산본부 (성형파트) · {report.groupName}</td></tr>
     <tr><td className="bg-gray-100 border border-black p-2 font-semibold">작업내용</td><td colSpan={3} className="border border-black p-2 text-left">{s.work_description}</td></tr>
     <tr><td className="bg-gray-100 border border-black p-2 font-semibold">TBM 장소</td><td className="border border-black p-2">{report.groupName} · 현장</td><td className="bg-gray-100 border border-black p-2 font-semibold">{tx(lang,'riskCheck')}</td><td className="border border-black p-2">{s.risk_assessed?'예 ☑ / 아니오 ☐':'예 ☐ / 아니오 ☑'}</td></tr>
     <tr><td colSpan={2} className="bg-gray-100 border border-black p-2 font-semibold">{tx(lang,'topic')}</td><td colSpan={2} className="bg-gray-100 border border-black p-2 font-semibold">{tx(lang,'detail')}</td></tr>
     <tr><td colSpan={2} className="h-36 border border-black p-3 align-top text-left font-bold">{title}</td><td colSpan={2} className="border border-black p-3 align-top text-left whitespace-pre-wrap">{details}</td></tr>
    </tbody>
   </table>
   <div className="border-x border-b border-black bg-gray-100 p-2 text-center font-semibold">{tx(lang,'participants')}</div>
   <table className="w-full table-fixed border-collapse text-center text-sm"><thead><tr>{[tx(lang,'attendanceName'),tx(lang,'sign'),tx(lang,'attendanceName'),tx(lang,'sign'),tx(lang,'attendanceName'),tx(lang,'sign'),tx(lang,'remarks')].map(x=><th key={x} className="border border-black bg-gray-50 p-2 text-sm">{x}</th>)}</tr></thead><tbody>{pairs.map((line,i)=><tr key={i}>{[0,1,2].flatMap(j=><><td key={`${i}-${j}-name`} className="h-16 border border-black text-xs">{line[j]?.name||''}</td><td key={`${i}-${j}-sig`} className="h-16 border border-black">{line[j]?.signature&&<img src={line[j].signature} alt="참석자 서명" className="mx-auto h-11 max-w-full object-contain"/>}</td></>)}<td className="border border-black"/></tr>)}</tbody></table>
   <div className="mt-3 break-inside-avoid"><b className="text-sm">{tx(lang,'photo')}</b>{report.photo?<img src={report.photo} alt="교육 단체사진" className="mt-2 max-h-72 w-full object-contain"/>:<p className="text-sm text-gray-500">사진 없음</p>}</div>
   <p className="mt-3 text-xs text-gray-500">저장 시각·전자서명은 로그인 계정을 통해 기록됩니다. 사진 및 서명 원본은 비공개 저장소에 보관됩니다.</p>
  </section>
  <style jsx global>{`@media print { @page { size: A4 portrait; margin: 12mm; } body { background: white !important; } .tbm-print-sheet { margin:0; } .print\\:hidden { display:none !important; } table { break-inside:auto; } tr { break-inside:avoid; } }`}</style>
 </main>;
}

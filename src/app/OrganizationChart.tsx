'use client';
import {type Lang} from './i18n';

const sections = [
  {title:'본부장',people:['최종상 전무']},
  {title:'생산1팀',people:['강장원 부장','박지현 주임']},
  {title:'생산2팀',people:['김문수 부장','정동훈 대리']},
  {title:'생산지원팀',people:['박종선 수석부장 (팀장)','박경석 과장','최준혁 사원']},
  {title:'품질관리팀',people:['송형석 과장']},
  {title:'신소재생산팀',people:['박원식 실장','주우팔 실장','강동효 실장','연원진 대리']},
  {title:'압출실 · 1조',people:['박원식','로타']},
  {title:'압출실 · 2조',people:['주우팔','이은','소팟']},
  {title:'가공실 · 야간 고정',people:['김현준','박세영']},
  {title:'가공실 · 주간 고정',people:['김석희','강동효','송규옥','장숙이','디팍싱','판넛','비노드','김미숙']},
];
export default function OrganizationChart({lang}:{lang:Lang}){
  const title:Record<Lang,string>={ko:'생산본부 조직도',en:'Production organization',ne:'उत्पादन संगठन',km:'រចនាសម្ព័ន្ធផ្នែកផលិតកម្ម',tl:'Organisasyon ng produksyon',vi:'Sơ đồ tổ chức sản xuất'};
  return <div className="space-y-4">
    <div className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-[#145C42]">{title[lang]}</h2><p className="mt-2 text-xs text-gray-500">SERIM B&G · 조직 및 직급 안내 / Job titles and groups</p></div>
    <div className="grid gap-3 md:grid-cols-2">{sections.map(s=><section key={s.title} className="rounded-xl border border-[#DFE9E1] bg-white p-4 shadow-sm"><h3 className="mb-3 font-bold text-[#145C42]">{s.title}</h3><div className="flex flex-wrap gap-2">{s.people.map(p=><span key={p} className="rounded-lg bg-[#EAF5ED] px-3 py-2 text-sm">{p}</span>)}</div></section>)}</div>
    <p className="text-xs text-gray-500">진공성형팀의 기타 오퍼레이터·작업자는 생산1·2팀 예하입니다. 개인별 1팀/2팀 배정은 미지정 상태입니다.</p>
  </div>;
}

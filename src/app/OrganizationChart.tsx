'use client';
import {type Lang} from './i18n';

const sections = [
  {title:'본부장',people:['최종상 전무']},
  {title:'생산1팀',people:['강장원 부장','박지현 주임']},
  {title:'생산2팀',people:['김문수 부장','정동훈 대리']},
  {title:'생산지원팀',people:['박종선 수석부장','박경석 과장','최준혁 사원']},
  {title:'품질관리팀',people:['송형석 과장']},
  {title:'신소재생산팀',people:['박원식 실장','주우팔 실장','강동효 실장','연원진 대리']},
  {title:'압출실 · 1조',people:['박원식','로타']},
  {title:'압출실 · 2조',people:['주우팔','이은','소팟']},
  {title:'가공실 · 야간 고정',people:['김현준','박세영']},
  {title:'가공실 · 주간 고정',people:['김석희','강동효','송규옥','장숙이','디팍싱','판넛','비노드','김미숙']},
];
const titles:Record<string,Record<Lang,string>>={
 '본부장':{ko:'본부장',en:'Division Director',ne:'विभाग प्रमुख',km:'ប្រធានផ្នែក',tl:'Pinuno ng Dibisyon',vi:'Trưởng bộ phận'},
 '생산1팀':{ko:'생산1팀',en:'Production Team 1',ne:'उत्पादन टोली १',km:'ក្រុមផលិតកម្ម ១',tl:'Produksyon Team 1',vi:'Tổ sản xuất 1'},
 '생산2팀':{ko:'생산2팀',en:'Production Team 2',ne:'उत्पादन टोली २',km:'ក្រុមផលិតកម្ម ២',tl:'Produksyon Team 2',vi:'Tổ sản xuất 2'},
 '생산지원팀':{ko:'생산지원팀',en:'Production Support',ne:'उत्पादन सहायता',km:'គាំទ្រផលិតកម្ម',tl:'Suporta sa Produksyon',vi:'Hỗ trợ sản xuất'},
 '품질관리팀':{ko:'품질관리팀',en:'Quality Control',ne:'गुणस्तर नियन्त्रण',km:'ត្រួតពិនិត្យគុណភាព',tl:'Kontrol sa Kalidad',vi:'Quản lý chất lượng'},
 '신소재생산팀':{ko:'신소재생산팀',en:'New Materials Production',ne:'नयाँ सामग्री उत्पादन',km:'ផលិតកម្មសម្ភារៈថ្មី',tl:'Produksyon ng Bagong Materyal',vi:'Sản xuất vật liệu mới'},
 '압출실 · 1조':{ko:'압출실 · 1조',en:'Extrusion · Group 1',ne:'एक्स्ट्रुसन · समूह १',km:'បន្ទប់អ៊ិចស្ត្រូសិន · ក្រុម ១',tl:'Extrusion · Grupo 1',vi:'Đùn ép · Nhóm 1'},
 '압출실 · 2조':{ko:'압출실 · 2조',en:'Extrusion · Group 2',ne:'एक्स्ट्रुसन · समूह २',km:'បន្ទប់អ៊ិចស្ត្រូសិន · ក្រុម ២',tl:'Extrusion · Grupo 2',vi:'Đùn ép · Nhóm 2'},
 '가공실 · 야간 고정':{ko:'가공실 · 야간 고정',en:'Processing · Fixed Night',ne:'प्रशोधन · स्थायी रात्रि',km:'កែច្នៃ · វេនយប់ថេរ',tl:'Processing · Palagi Gabi',vi:'Gia công · Đêm cố định'},
 '가공실 · 주간 고정':{ko:'가공실 · 주간 고정',en:'Processing · Fixed Day',ne:'प्रशोधन · स्थायी दिवा',km:'កែច្នៃ · វេនថ្ងៃថេរ',tl:'Processing · Palagi Araw',vi:'Gia công · Ngày cố định'}
};
const rankText:Record<string,Record<Lang,string>>={
 전무:{ko:'전무',en:'Executive Director',ne:'कार्यकारी निर्देशक',km:'នាយកប្រតិបត្តិ',tl:'Executive Director',vi:'Giám đốc điều hành'},
 수석부장:{ko:'수석부장',en:'Senior General Manager',ne:'वरिष्ठ महाप्रबन्धक',km:'ប្រធានគ្រប់គ្រងជាន់ខ្ពស់',tl:'Senior General Manager',vi:'Trưởng phòng cấp cao'},
 부장:{ko:'부장',en:'General Manager',ne:'महाप्रबन्धक',km:'ប្រធានគ្រប់គ្រង',tl:'General Manager',vi:'Trưởng phòng'},
 실장:{ko:'실장',en:'Section Head',ne:'शाखा प्रमुख',km:'ប្រធានផ្នែក',tl:'Section Head',vi:'Trưởng bộ phận'},
 과장:{ko:'과장',en:'Manager',ne:'प्रबन्धक',km:'អ្នកគ្រប់គ្រង',tl:'Manager',vi:'Quản lý'},
 대리:{ko:'대리',en:'Assistant Manager',ne:'सहायक प्रबन्धक',km:'ជំនួយការអ្នកគ្រប់គ្រង',tl:'Assistant Manager',vi:'Phó quản lý'},
 주임:{ko:'주임',en:'Senior Staff',ne:'वरिष्ठ कर्मचारी',km:'បុគ្គលិកជាន់ខ្ពស់',tl:'Senior Staff',vi:'Nhân viên chính'},
 사원:{ko:'사원',en:'Staff',ne:'कर्मचारी',km:'បុគ្គលិក',tl:'Staff',vi:'Nhân viên'}
};
const localPerson=(person:string,lang:Lang)=>{
 const rank=Object.keys(rankText).find(rank=>person.endsWith(' '+rank));
 return rank?person.slice(0,-rank.length)+' '+rankText[rank][lang]:person;
};
export default function OrganizationChart({lang}:{lang:Lang}){
  const title:Record<Lang,string>={ko:'생산본부 조직도',en:'Production organization',ne:'उत्पादन संगठन',km:'រចនាសម្ព័ន្ធផ្នែកផលិតកម្ម',tl:'Organisasyon ng produksyon',vi:'Sơ đồ tổ chức sản xuất'};
  const ranks=['전무','수석부장','부장','실장','과장','대리','주임','사원'];
  const ranked=ranks.map(rank=>({rank,people:[...new Set(sections.flatMap(section=>section.people).filter(person=>person.endsWith(' '+rank)))]})).filter(item=>item.people.length);
  return <div className="space-y-4">
    <div className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-[#145C42]">{title[lang]}</h2><p className="mt-2 text-xs text-gray-500">SERIM B&G · Production Division</p></div>
    <div className="grid gap-3 md:grid-cols-2">{sections.map(s=><section key={s.title} className="rounded-xl border border-[#DFE9E1] bg-white p-4 shadow-sm"><h3 className="mb-3 font-bold text-[#145C42]">{titles[s.title]?.[lang]||s.title}</h3><div className="flex flex-wrap gap-2">{s.people.map(p=><span key={p} className="rounded-lg bg-[#EAF5ED] px-3 py-2 text-sm">{localPerson(p,lang)}</span>)}</div></section>)}</div>
    <section className="rounded-xl border bg-white p-5"><h3 className="mb-3 font-bold text-[#145C42]">{({ko:'직급별 명단',en:'Staff by rank',ne:'पदअनुसार कर्मचारी',km:'បុគ្គលិកតាមឋានៈ',tl:'Listahan ayon sa ranggo',vi:'Danh sách theo chức vụ'} as Record<Lang,string>)[lang]}</h3><div className="grid gap-2 md:grid-cols-2">{ranked.map(item=><div key={item.rank} className="flex gap-3 rounded-lg border p-3"><b className="w-20 shrink-0 text-[#145C42]">{rankText[item.rank]?.[lang]||item.rank}</b><span className="text-sm">{item.people.map(p=>localPerson(p,lang)).join(', ')}</span></div>)}</div></section>
    <p className="text-xs text-gray-500">{({ko:'진공성형팀의 기타 오퍼레이터·작업자는 생산1·2팀 예하입니다. 개인별 1팀/2팀 배정은 미지정 상태입니다.',en:'Remaining vacuum-forming operators and workers belong under Production Teams 1 and 2; individual team assignment is pending.',ne:'बाँकी भ्याकुम फर्मिङ कर्मचारी उत्पादन टोली १ र २ अन्तर्गत छन्; व्यक्तिगत टोली बाँडफाँट बाँकी छ।',km:'បុគ្គលិកផ្សេងទៀតស្ថិតក្រោមក្រុមផលិតកម្ម ១ និង ២; ការបែងចែកនីមួយៗមិនទាន់កំណត់។',tl:'Ang ibang vacuum forming operator at manggagawa ay nasa ilalim ng Production Team 1 at 2; hindi pa nakatalaga ang bawat isa.',vi:'Các nhân viên định hình chân không còn lại thuộc tổ sản xuất 1 và 2; chưa phân công từng người.'} as Record<Lang,string>)[lang]}</p>
  </div>;
}

'use client';
import {useEffect,useState} from 'react';
import {supabase} from './supabase';
import {languages,type Lang} from './i18n';
import {pu} from './productionUiText';
const words={
 language:{ko:'언어',en:'Language',ne:'भाषा',km:'ភាសា',tl:'Wika',vi:'Ngôn ngữ'},
 font:{ko:'글씨 크기',en:'Text size',ne:'अक्षर आकार',km:'ទំហំអក្សរ',tl:'Laki ng teksto',vi:'Cỡ chữ'},
 normal:{ko:'기본',en:'Normal',ne:'सामान्य',km:'ធម្មតា',tl:'Karaniwan',vi:'Bình thường'},
 large:{ko:'크게',en:'Large',ne:'ठूलो',km:'ធំ',tl:'Malaki',vi:'Lớn'},
 note:{ko:'개인 화면 설정은 이 기기에 저장됩니다.',en:'Personal display settings are saved on this device.',ne:'व्यक्तिगत सेटिङ यस उपकरणमा सुरक्षित हुन्छ।',km:'ការកំណត់ផ្ទាល់ខ្លួនរក្សាទុកនៅលើឧបករណ៍នេះ។',tl:'Naka-save sa device na ito ang personal na setting.',vi:'Cài đặt cá nhân lưu trên thiết bị này.'},
 breakLimit:{ko:'휴게 초과 표시 기준 (분)',en:'Break alert limit (minutes)',ne:'विश्राम चेतावनी सीमा (मिनेट)',km:'កំណត់ពេលសម្រាក (នាទី)',tl:'Limitasyon ng pahinga (minuto)',vi:'Giới hạn nghỉ (phút)'},
 admin:{ko:'시스템 운영 설정',en:'System operations',ne:'प्रणाली सञ्चालन',km:'ប្រតិបត្តិការប្រព័ន្ធ',tl:'Mga setting ng sistema',vi:'Vận hành hệ thống'},
 leave:{ko:'직원·신청 관리',en:'Employee and requests',ne:'कर्मचारी र अनुरोध',km:'បុគ្គលិក និងសំណើ',tl:'Empleyado at kahilingan',vi:'Nhân viên và yêu cầu'},
 daily:{ko:'일일 근태보고서',en:'Daily attendance report',ne:'दैनिक हाजिरी रिपोर्ट',km:'របាយការណ៍វត្តមានប្រចាំថ្ងៃ',tl:'Arawang ulat',vi:'Báo cáo chấm công ngày'},
 saved:{ko:'저장했습니다.',en:'Saved.',ne:'सुरक्षित गरियो।',km:'បានរក្សាទុក។',tl:'Na-save.',vi:'Đã lưu.'},
};
export default function ProductionSettings({lang,onLanguage,isAdmin=false,onNavigate}:{lang:Lang;onLanguage:(lang:Lang)=>void;isAdmin?:boolean;onNavigate?:(target:'staffadmin'|'dailyreport')=>void}){
 const [size,setSize]=useState<'normal'|'large'>('normal');const [limit,setLimit]=useState(20);const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 useEffect(()=>{setSize(localStorage.getItem('serim-text-size')==='large'?'large':'normal');void supabase.from('production_app_settings').select('value').eq('key','break_limit_minutes').maybeSingle().then(({data})=>{if(typeof data?.value==='number')setLimit(data.value);});},[]);
 const change=(value:'normal'|'large')=>{setSize(value);localStorage.setItem('serim-text-size',value);document.documentElement.style.fontSize=value==='large'?'18px':'16px';};
 const save=async()=>{if(!isAdmin||busy)return;setBusy(true);const {error}=await supabase.from('production_app_settings').upsert({key:'break_limit_minutes',value:limit});setBusy(false);setMessage(error?error.message:words.saved[lang]);};
 return <div className="space-y-4"><section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#145C42]">{pu(lang,'settings')}</h2><p className="mt-2 text-xs text-gray-500">{words.note[lang]}</p></section>
 <section className="rounded-xl bg-white p-5 shadow-sm"><h3 className="mb-3 font-semibold">{words.language[lang]}</h3><div className="grid grid-cols-3 gap-2">{languages.map(x=><button key={x.code} className={`rounded-lg border p-3 text-xs ${lang===x.code?'border-[#168253] bg-green-100':'bg-white'}`} onClick={()=>onLanguage(x.code)}>{x.label}</button>)}</div></section>
 <section className="rounded-xl bg-white p-5 shadow-sm"><h3 className="mb-3 font-semibold">{words.font[lang]}</h3><div className="grid grid-cols-2 gap-2">{(['normal','large'] as const).map(x=><button key={x} className={`rounded-lg border p-3 ${size===x?'border-[#168253] bg-green-100':'bg-white'}`} onClick={()=>change(x)}>{words[x][lang]}</button>)}</div></section>
 {isAdmin&&<section className="space-y-3 rounded-xl bg-white p-5 shadow-sm"><h3 className="font-bold text-[#145C42]">{words.admin[lang]}</h3><label className="block text-sm">{words.breakLimit[lang]}<input type="number" min="5" max="120" value={limit} onChange={e=>setLimit(Math.min(120,Math.max(5,Number(e.target.value)||20)))} className="mt-2 block w-28 rounded-lg border p-2 text-gray-900"/></label><button disabled={busy} onClick={()=>void save()} className="rounded-lg bg-[#168253] px-4 py-2 font-semibold text-white">{pu(lang,'save')}</button><div className="grid grid-cols-2 gap-2">{(['staffadmin','dailyreport'] as const).map((x,i)=><button key={x} onClick={()=>onNavigate?.(x)} className="rounded-lg border p-3 text-sm text-[#145C42]">{i?words.daily[lang]:words.leave[lang]}</button>)}</div>{message&&<p role="status" className="text-sm">{message}</p>}</section>}
 </div>;
}

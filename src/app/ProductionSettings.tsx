'use client';
import {useEffect,useState} from 'react';
import {languages,type Lang} from './i18n';
import {pu} from './productionUiText';
const words={
 language:{ko:'언어',en:'Language',ne:'भाषा',km:'ភាសា',tl:'Wika',vi:'Ngôn ngữ'},
 font:{ko:'글씨 크기',en:'Text size',ne:'अक्षर आकार',km:'ទំហំអក្សរ',tl:'Laki ng teksto',vi:'Cỡ chữ'},
 normal:{ko:'기본',en:'Normal',ne:'सामान्य',km:'ធម្មតា',tl:'Karaniwan',vi:'Bình thường'},
 large:{ko:'크게',en:'Large',ne:'ठूलो',km:'ធំ',tl:'Malaki',vi:'Lớn'},
 note:{ko:'설정은 이 기기에 저장됩니다.',en:'Settings are saved on this device.',ne:'सेटिङ यो उपकरणमा सुरक्षित हुन्छ।',km:'ការកំណត់ត្រូវបានរក្សាទុកនៅលើឧបករណ៍នេះ។',tl:'Naka-save ang mga setting sa device na ito.',vi:'Cài đặt được lưu trên thiết bị này.'},
};
export default function ProductionSettings({lang,onLanguage}:{lang:Lang;onLanguage:(lang:Lang)=>void}){
 const [size,setSize]=useState<'normal'|'large'>('normal');
 useEffect(()=>{setSize(localStorage.getItem('serim-text-size')==='large'?'large':'normal');},[]);
 const change=(value:'normal'|'large')=>{setSize(value);localStorage.setItem('serim-text-size',value);document.documentElement.style.fontSize=value==='large'?'18px':'16px';};
 return <div className="space-y-4"><section className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#145C42]">{pu(lang,'settings')}</h2><p className="mt-2 text-xs text-gray-500">{words.note[lang]}</p></section><section className="rounded-xl bg-white p-5 shadow-sm"><h3 className="mb-3 font-semibold">{words.language[lang]}</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{languages.map(x=><button key={x.code} className={`rounded-lg border p-3 text-sm ${lang===x.code?'border-[#168253] bg-green-100':'bg-white'}`} onClick={()=>onLanguage(x.code)}>{x.label}</button>)}</div></section><section className="rounded-xl bg-white p-5 shadow-sm"><h3 className="mb-3 font-semibold">{words.font[lang]}</h3><div className="grid grid-cols-2 gap-2">{(['normal','large'] as const).map(x=><button key={x} className={`rounded-lg border p-3 ${size===x?'border-[#168253] bg-green-100':'bg-white'}`} onClick={()=>change(x)}>{words[x][lang]}</button>)}</div></section></div>;
}

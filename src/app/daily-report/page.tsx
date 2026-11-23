'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../supabase';
import DailyAttendanceExport from '../DailyAttendanceExport';
import type {Lang} from '../i18n';

const labels:Record<Lang,{loading:string,denied:string,back:string,title:string}>={
 ko:{loading:'권한 확인 중...',denied:'관리자 계정으로 로그인해야 근태보고서를 확인할 수 있습니다.',back:'생산본부 홈으로',title:'일일 근태보고서'},
 en:{loading:'Checking permissions...',denied:'Admin login is required to view attendance reports.',back:'Back to home',title:'Daily attendance report'},
 ne:{loading:'अनुमति जाँच हुँदैछ...',denied:'हाजिरी रिपोर्ट हेर्न प्रशासकको लगइन आवश्यक छ।',back:'मुख्य पृष्ठमा फर्कनुहोस्',title:'दैनिक हाजिरी रिपोर्ट'},
 km:{loading:'កំពុងពិនិត្យសិទ្ធិ...',denied:'ត្រូវចូលគណនីអ្នកគ្រប់គ្រង ដើម្បីមើលរបាយការណ៍វត្តមាន។',back:'ត្រឡប់ទៅទំព័រដើម',title:'របាយការណ៍វត្តមានប្រចាំថ្ងៃ'},
 tl:{loading:'Sinusuri ang access...',denied:'Kailangan ng admin login para makita ang attendance report.',back:'Bumalik sa home',title:'Arawang ulat ng attendance'},
 vi:{loading:'Đang kiểm tra quyền...',denied:'Cần đăng nhập quản trị viên để xem báo cáo chấm công.',back:'Về trang chủ',title:'Báo cáo chấm công hằng ngày'},
};
export default function DailyReportRoute(){
 const [lang,setLang]=useState<Lang>('ko');
 const [state,setState]=useState<'loading'|'allowed'|'denied'>('loading');
 useEffect(()=>{
  const s=window.localStorage.getItem('serim-language');
  if(s&&['ko','en','ne','km','tl','vi'].includes(s))setLang(s as Lang);
  let alive=true;
  const verify=async()=>{
   const {data:{user},error}=await supabase.auth.getUser();
   if(error||!user){if(alive)setState('denied');return;}
   const {data:admin,error:adminError}=await supabase.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
   if(alive)setState(!adminError&&!!admin?'allowed':'denied');
  };
  void verify();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{if(alive){setState('loading');void verify();}});
  return ()=>{alive=false;subscription.unsubscribe();};
 },[]);
 return <main className="min-h-screen bg-[#F2F8F3] px-3 py-5 text-[#173E2C] sm:p-8">
  <div className="mx-auto max-w-[1500px]">
   <header className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-bold">{labels[lang].title}</h1><a href="/" className="rounded-lg border border-[#BFD6C8] bg-white px-4 py-2 text-sm font-semibold text-[#145C42]">{labels[lang].back}</a></header>
   {state==='loading'?<p role="status">{labels[lang].loading}</p>:state==='denied'?<p role="alert" className="rounded-lg border bg-white p-5">{labels[lang].denied}</p>:<DailyAttendanceExport lang={lang} isAdmin={true}/>}
  </div>
 </main>;
}

'use client';
import {useEffect,useState} from 'react';
import {type Lang,languages} from '../i18n';
import {tbmText as tx} from '../tbmText';
type InstallPrompt=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
const translations:Record<Lang,{free:string;already:string;android:string;ios:string;desktop:string;action:string;go:string;notice:string;qr:string}>={
 ko:{free:'무료 설치 안내',already:'이미 앱 형태로 실행 중입니다.',android:'Android: Chrome에서 열기 → 메뉴(⋮) → 앱 설치 또는 홈 화면에 추가 → 확인',ios:'iPhone: Safari에서 열기 → 공유 → 홈 화면에 추가 → 웹 앱으로 열기',desktop:'휴대전화 카메라로 QR을 촬영하거나 이 주소를 Chrome/Safari에서 열어주세요.',action:'앱 설치',go:'생산본부 로그인으로 이동',notice:'QR을 찍는 것만으로 자동 설치되지는 않습니다. 브라우저에서 사용자가 설치를 확인해야 합니다.',qr:'QR은 현재 운영 주소로 연결됩니다. 회사 주소 변경 후 다시 생성해야 합니다.'},
 en:{free:'Free installation',already:'Already running as an installed app.',android:'Android: Open in Chrome → ⋮ menu → Install app or Add to Home screen → Confirm',ios:'iPhone: Open in Safari → Share → Add to Home Screen → Open as Web App',desktop:'Scan the QR with your phone or open this URL in Chrome/Safari.',action:'Install app',go:'Go to production login',notice:'Scanning a QR code alone does not install an app. Confirm the installation in your browser.',qr:'The QR uses the current address. Regenerate it after a domain change.'},
 ne:{free:'नि:शुल्क एप स्थापना',already:'एपको रूपमा चलिरहेको छ।',android:'Android: Chrome खोल्नुहोस् → ⋮ → Install app वा Add to Home screen → पुष्टि गर्नुहोस्',ios:'iPhone: Safari → Share → Add to Home Screen → Open as Web App',desktop:'फोनबाट QR स्क्यान गर्नुहोस् वा Chrome/Safari मा लिंक खोल्नुहोस्।',action:'एप स्थापना',go:'उत्पादन लगइनमा जानुहोस्',notice:'QR स्क्यान गर्दा मात्रै एप स्वतः स्थापना हुँदैन। ब्राउजरमा पुष्टि गर्नुहोस्।',qr:'QR हालको ठेगानामा छ। डोमेन बदलेपछि नयाँ QR बनाउनुपर्छ।'},
 km:{free:'ដំឡើងកម្មវិធីឥតគិតថ្លៃ',already:'កំពុងដំណើរការជាកម្មវិធី។',android:'Android៖ បើកក្នុង Chrome → ⋮ → Install app ឬ Add to Home screen → បញ្ជាក់',ios:'iPhone៖ Safari → Share → Add to Home Screen → Open as Web App',desktop:'ស្កេន QR ដោយទូរស័ព្ទ ឬបើកតំណក្នុង Chrome/Safari។',action:'ដំឡើងកម្មវិធី',go:'ទៅទំព័រចូលប្រើ',notice:'ស្កេន QR មិនអាចដំឡើងដោយស្វ័យប្រវត្តិទេ។ ត្រូវបញ្ជាក់ក្នុងកម្មវិធីរុករក។',qr:'QR ប្រើអាសយដ្ឋានបច្ចុប្បន្ន។ ត្រូវបង្កើតថ្មីបន្ទាប់ពីប្តូរដូមេន។'},
 tl:{free:'Libreng pag-install',already:'Tumatakbo na bilang naka-install na app.',android:'Android: Buksan sa Chrome → ⋮ → Install app o Add to Home screen → Kumpirmahin',ios:'iPhone: Safari → Share → Add to Home Screen → Open as Web App',desktop:'I-scan ang QR gamit ang telepono o buksan sa Chrome/Safari.',action:'I-install ang app',go:'Pumunta sa login',notice:'Hindi awtomatikong mag-i-install sa pag-scan ng QR. Kumpirmahin sa browser.',qr:'Kasalukuyang address ang gamit ng QR. Gumawa ng bago pagkatapos palitan ang domain.'},
 vi:{free:'Cài ứng dụng miễn phí',already:'Đang chạy dưới dạng ứng dụng đã cài.',android:'Android: Mở bằng Chrome → ⋮ → Cài ứng dụng hoặc Thêm vào màn hình chính → Xác nhận',ios:'iPhone: Safari → Chia sẻ → Thêm vào Màn hình chính → Mở dạng ứng dụng web',desktop:'Quét mã QR hoặc mở đường dẫn bằng Chrome/Safari trên điện thoại.',action:'Cài ứng dụng',go:'Đến trang đăng nhập',notice:'Quét QR không tự động cài đặt. Cần xác nhận trong trình duyệt.',qr:'QR dùng địa chỉ hiện tại. Hãy tạo lại sau khi đổi tên miền.'},
};
export default function InstallGuide(){
 const [lang,setLang]=useState<Lang>('ko');
 const [platform,setPlatform]=useState<'ios'|'android'|'desktop'>('desktop');
 const [prompt,setPrompt]=useState<InstallPrompt|null>(null);
 const [installed,setInstalled]=useState(false);
 useEffect(()=>{
  const remembered=window.localStorage.getItem('serim-language');if(languages.some(x=>x.code===remembered))setLang(remembered as Lang);
  const ua=navigator.userAgent.toLowerCase();setPlatform(/iphone|ipad|ipod/.test(ua)?'ios':/android/.test(ua)?'android':'desktop');
  setInstalled(window.matchMedia('(display-mode: standalone)').matches);
  const onPrompt=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt);};
  const onInstall=()=>setInstalled(true);
  window.addEventListener('beforeinstallprompt',onPrompt);window.addEventListener('appinstalled',onInstall);
  return()=>{window.removeEventListener('beforeinstallprompt',onPrompt);window.removeEventListener('appinstalled',onInstall);};
 },[]);
 const install=async()=>{if(prompt){await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')setPrompt(null);}};
 const tr=translations[lang];
 return <div className="flex min-h-screen items-center justify-center bg-[#F1F8F3] p-4 text-gray-900"><main className="w-full max-w-xl space-y-4 rounded-2xl border border-[#CCE2D2] bg-white p-6 shadow-xl">
  <div className="flex items-center gap-4"><img src="/icon-192.png" alt="SERIM icon" width="72" height="72" className="rounded-2xl"/><div><h1 className="text-xl font-bold text-[#145C42]">SERIM B&G</h1><p className="text-sm text-gray-500">{tx(lang,'install')}</p></div></div>
  <div className="grid grid-cols-3 gap-2">{languages.map(x=><button type="button" key={x.code} onClick={()=>{setLang(x.code);window.localStorage.setItem('serim-language',x.code);}} className={`rounded-lg px-1 py-2 text-xs ${lang===x.code?'bg-[#145C42] text-white':'bg-green-50 text-green-900'}`}>{x.label}</button>)}</div>
  {installed?<p className="rounded-lg bg-green-50 p-4 font-semibold text-green-800">{tr.already}</p>:<div className="space-y-2 rounded-xl bg-[#F1F8F3] p-4"><h2 className="font-bold">{tr.free}</h2><p className="text-sm leading-7">{tr[platform]}</p>{prompt&&<button className="mt-3 w-full rounded-lg bg-[#168253] p-3 font-semibold text-white" onClick={()=>void install()}>{tr.action}</button>}</div>}
  <div className="flex flex-col items-center gap-2"><img src="/install-qr.png" alt="QR" width={205} height={205}/><p className="text-center text-xs text-gray-500">{tr.qr}</p></div>
  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{tr.notice}</p>
  <a href="/" className="block rounded-lg border border-[#168253] p-3 text-center text-sm font-bold text-[#145C42]">{tr.go}</a>
 </main></div>;
}

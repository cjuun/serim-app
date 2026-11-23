// Six approved time patterns. Times after midnight are on the next calendar day.
// Do not treat the scheduled break as proof that the employee actually rested.
export type PatternId = 'day_0820'|'day_0817'|'day_0822'|'night_2008'|'night_2005'|'night_1702';
export type Language = 'ko'|'en'|'ne'|'km'|'tl'|'vi';
export type BreakWindow = {start:string; end:string};
export type WorkPattern = {id:PatternId; group:'day'|'night'; start:string; end:string; nextDay:boolean; breaks:BreakWindow[]; label:string};
export const WORK_PATTERNS:WorkPattern[] = [
 {id:'day_0820',group:'day',start:'08:00',end:'20:00',nextDay:false,label:'기본',breaks:[{start:'12:00',end:'13:00'},{start:'17:00',end:'17:30'}]},
 {id:'day_0817',group:'day',start:'08:00',end:'17:00',nextDay:false,label:'단축',breaks:[{start:'12:00',end:'13:00'}]},
 {id:'day_0822',group:'day',start:'08:00',end:'22:00',nextDay:false,label:'연장',breaks:[{start:'12:00',end:'13:00'},{start:'17:00',end:'17:30'}]},
 {id:'night_2008',group:'night',start:'20:00',end:'08:00',nextDay:true,label:'기본',breaks:[{start:'00:00',end:'01:00'},{start:'05:00',end:'05:30'}]},
 {id:'night_2005',group:'night',start:'20:00',end:'05:00',nextDay:true,label:'단축',breaks:[{start:'00:00',end:'01:00'}]},
 // EXCEPTION: do not subtract 17:00-17:30 or 00:00-01:00 from this pattern.
 {id:'night_1702',group:'night',start:'17:00',end:'02:00',nextDay:true,label:'예외',breaks:[{start:'21:00',end:'22:00'}]},
];
export const LABELS:Record<Language,{day:string;night:string;standard:string;reduced:string;extended:string;exception:string;nextDay:string;break:string;net:string;select:string;search:string}> = {
 ko:{day:'주간',night:'야간',standard:'기본',reduced:'단축',extended:'연장',exception:'예외',nextDay:'익일',break:'휴게',net:'실제 근무',select:'근무시간 선택',search:'직원 이름 또는 직원번호 검색'},
 en:{day:'Day',night:'Night',standard:'Standard',reduced:'Short',extended:'Extended',exception:'Exception',nextDay:'next day',break:'Break',net:'Net work',select:'Select working hours',search:'Search name or employee ID'},
 ne:{day:'दिवा',night:'रात्रि',standard:'सामान्य',reduced:'छोटो',extended:'थप',exception:'अपवाद',nextDay:'अर्को दिन',break:'विश्राम',net:'वास्तविक काम',select:'कामको समय छान्नुहोस्',search:'नाम वा कर्मचारी नम्बर खोज्नुहोस्'},
 km:{day:'វេនថ្ងៃ',night:'វេនយប់',standard:'ធម្មតា',reduced:'ខ្លី',extended:'បន្ថែម',exception:'ករណីពិសេស',nextDay:'ថ្ងៃបន្ទាប់',break:'សម្រាក',net:'ម៉ោងធ្វើការពិត',select:'ជ្រើសម៉ោងធ្វើការ',search:'ស្វែងរកឈ្មោះ ឬលេខបុគ្គលិក'},
 tl:{day:'Araw',night:'Gabi',standard:'Karaniwan',reduced:'Maikli',extended:'Dagdag',exception:'Espesyal',nextDay:'kinabukasan',break:'Pahinga',net:'Oras ng trabaho',select:'Pumili ng oras',search:'Hanapin ang pangalan o ID'},
 vi:{day:'Ca ngày',night:'Ca đêm',standard:'Cơ bản',reduced:'Rút ngắn',extended:'Tăng ca',exception:'Ngoại lệ',nextDay:'ngày hôm sau',break:'Nghỉ',net:'Giờ làm thực tế',select:'Chọn giờ làm',search:'Tìm tên hoặc mã nhân viên'},
};
const minutes=(s:string)=>{const [h,m]=s.split(':').map(Number);return h*60+m;};
export function calculatePattern(p:WorkPattern){
 const start=minutes(p.start),end=minutes(p.end)+(p.nextDay?1440:0);
 const total=end-start;
 if(total<=0)throw new Error('Invalid shift time');
 const segments=p.breaks.map(b=>{
  let s=minutes(b.start),e=minutes(b.end);
  if(p.nextDay&&s<start)s+=1440;
  if(p.nextDay&&e<start)e+=1440;
  if(e<=s)e+=1440;
  return {start:s,end:e};
 }).sort((a,b)=>a.start-b.start);
 // Merge intervals so overlapping configured breaks cannot be double-subtracted.
 let breakMinutes=0,prevEnd=-Infinity;
 for(const seg of segments){const s=Math.max(seg.start,start,prevEnd),e=Math.min(seg.end,end);if(e>s)breakMinutes+=e-s;prevEnd=Math.max(prevEnd,seg.end);}
 return {grossMinutes:total,breakMinutes,netMinutes:total-breakMinutes};
}
export const hm=(n:number)=>`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
export function localizedPatternName(pattern:WorkPattern,lang:Language){const l=LABELS[lang];return pattern.label==='기본'?l.standard:pattern.label==='단축'?l.reduced:pattern.label==='연장'?l.extended:l.exception;}

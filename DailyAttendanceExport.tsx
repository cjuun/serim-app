 'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';
import type {Lang} from './i18n';
import WorkTimePicker from './WorkTimePicker';
import {makeAttendanceWorkbook} from './reportXlsx';
import {v3t} from './v3Text';
import {WORK_PATTERNS,calculatePattern,hm,LABELS,type PatternId} from './workSchedule';

type Person={id:number;full_name:string;team:string;employee_role:string;employee_code:string;rank_title?:string|null};
type Status='present'|'annual'|'unpaid'|'am_half'|'pm_half';
type ReportRow={staff_id:number;work_date:string;planned_start:string|null;planned_end:string|null;actual_start:string|null;actual_end:string|null;note:string;meal_lunch:boolean;meal_dinner:boolean;confirmed:boolean;work_pattern_id:PatternId|null};
type Attendance={work_date:string;employee_name:string;status:Status;shift:'day'|'night';team:string};
type Assignment={employee_name:string;team:string;shift:'day'|'night';week_start:string};
type Entry={person:Person;prev:ReportRow;today:ReportRow;statusPrev?:Status;statusToday?:Status;shift?:'day'|'night'};
const weekStart=(date:string)=>{const d=new Date(date+'T12:00:00');const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const prevDay=(date:string)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const empty=(id:number,date:string):ReportRow=>({staff_id:id,work_date:date,planned_start:null,planned_end:null,actual_start:null,actual_end:null,note:'',meal_lunch:false,meal_dinner:false,confirmed:false,work_pattern_id:null});
const clean=(value:string)=> /^[=+@\-\t\r]/.test(value)?"'"+value:value;
const csvCell=(value:unknown)=>'"'+clean(String(value??'')).replaceAll('"','""')+'"';
const dict={
 ko:['일일 근태보고서','기준일','부서','전체','진공성형팀','신소재생산팀','불러오기','전일 확정','당일 예정','출근','퇴근','비고','중식','석식','저장','확정','CSV 다운로드','확정된 전일 실제시간이 없는 경우 임의로 채우지 않습니다. 당일 기본시간은 근무조를 근거로 제안합니다.','직원','직급','상태','전일 확정 저장','출퇴근 시간 입력','근태는 관리자만 수정할 수 있습니다.','불러오는 중','저장 완료','데이터를 불러오지 못했습니다.','확정됨','미확정'],
 en:['Daily attendance report','Report date','Team','All','Vacuum forming','New material','Refresh','Previous day confirmed','Today planned','Start','End','Notes','Lunch','Dinner','Save','Confirm','Download CSV','Never invent actual attendance times. Suggested planned times are based on the shift roster.','Employee','Position','Status','Confirm previous day','Enter working times','Only administrators may edit.','Loading','Saved','Data load failed.','Confirmed','Not confirmed'],
 ne:['दैनिक हाजिरी रिपोर्ट','मिति','टोली','सबै','भ्याकुम फर्मिङ','नयाँ सामग्री','रिफ्रेस','अघिल्लो दिन पुष्टि','आजको योजना','सुरु','समाप्त','टिप्पणी','दिउँसो खाना','बेलुकी खाना','बचत','पुष्टि','CSV डाउनलोड','वास्तविक समय अनुमान गरेर भरिँदैन। प्रस्तावित समय सिफ्टमा आधारित छ।','कर्मचारी','पद','स्थिति','अघिल्लो दिन पुष्टि','समय प्रविष्टि','प्रबन्धकले मात्र परिवर्तन गर्न सक्छ।','लोड हुँदैछ','सुरक्षित','लोड असफल','पुष्टि भएको','पुष्टि नभएको'],
 km:['របាយការណ៍វត្តមានប្រចាំថ្ងៃ','កាលបរិច្ឆេទ','ក្រុម','ទាំងអស់','បង្កើតសុញ្ញាកាស','សម្ភារៈថ្មី','ផ្ទុកឡើងវិញ','ថ្ងៃមុនបានបញ្ជាក់','ផែនការថ្ងៃនេះ','ចូល','ចេញ','កំណត់ចំណាំ','អាហារថ្ងៃត្រង់','អាហារពេលល្ងាច','រក្សាទុក','បញ្ជាក់','ទាញយក CSV','មិនបញ្ចូលម៉ោងពិតដោយការស្មានទេ។ ម៉ោងគម្រោងផ្អែកលើវេន។','បុគ្គលិក','តួនាទី','ស្ថានភាព','បញ្ជាក់ថ្ងៃមុន','បញ្ចូលម៉ោង','អ្នកគ្រប់គ្រងប៉ុណ្ណោះអាចកែប្រែ។','កំពុងផ្ទុក','បានរក្សាទុក','ផ្ទុកបរាជ័យ','បានបញ្ជាក់','មិនទាន់បញ្ជាក់'],
 tl:['Arawang tala ng pagpasok','Petsa','Pangkat','Lahat','Vacuum forming','Bagong materyal','I-refresh','Nakumpirmang nakaraang araw','Plano ngayong araw','Pasok','Uwi','Tala','Tanghalian','Hapunan','I-save','Kumpirmahin','I-download ang CSV','Huwag mag-imbento ng aktuwal na oras. Batay sa iskedyul ang mungkahing oras.','Empleyado','Posisyon','Katayuan','Kumpirmahin ang nakaraang araw','Ilagay ang oras','Admin lamang ang maaaring mag-edit.','Naglo-load','Na-save','Hindi ma-load','Nakumpirma','Hindi pa kumpirmado'],
 vi:['Báo cáo chấm công hằng ngày','Ngày','Bộ phận','Tất cả','Định hình chân không','Vật liệu mới','Tải lại','Hôm trước đã xác nhận','Dự kiến hôm nay','Vào','Ra','Ghi chú','Ăn trưa','Ăn tối','Lưu','Xác nhận','Tải CSV','Không tự điền giờ thực tế. Giờ dự kiến lấy theo lịch ca.','Nhân viên','Chức vụ','Trạng thái','Xác nhận ngày trước','Nhập giờ','Chỉ quản trị viên được chỉnh sửa.','Đang tải','Đã lưu','Không tải được dữ liệu','Đã xác nhận','Chưa xác nhận'],
} as const;
const QUICK_TIMES=['08:00','17:00','20:00','02:00','05:00','22:00'];
const labels=['daily','date','team','all','vacuum','newmaterial','refresh','previous','planned','start','end','note','lunch','dinner','save','confirm','csv','help','employee','position','status','confirmPrev','times','adminOnly','loading','saved','loadFailed','confirmed','unconfirmed'] as const;
const word=(lang:Lang,key:typeof labels[number])=>dict[lang][labels.indexOf(key)];
export default function DailyAttendanceExport({lang,isAdmin,scopeTeam=null}:{lang:Lang;isAdmin:boolean;scopeTeam?:'vacuum'|'newmaterial'|null}){
 const [selection,setSelection]=useState<number[]>([]);
 const [bulkField,setBulkField]=useState<'actual_start'|'actual_end'|'planned_start'|'planned_end'>('planned_start');
 const [bulkTime,setBulkTime]=useState('08:00');
 const [query,setQuery]=useState('');const [editingId,setEditingId]=useState<number|null>(null);
 const [date,setDate]=useState('');const [team,setTeam]=useState(scopeTeam||'all');const [people,setPeople]=useState<Person[]>([]);const [records,setRecords]=useState<Record<string,ReportRow>>({});const [attendance,setAttendance]=useState<Attendance[]>([]);const [assignments,setAssignments]=useState<Assignment[]>([]);const [loading,setLoading]=useState(false);const [message,setMessage]=useState('');const [dirty,setDirty]=useState<string[]>([]);
 useEffect(()=>{const d=new Date();setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);},[]);
 useEffect(()=>{if(scopeTeam)setTeam(scopeTeam);},[scopeTeam]);
 const yesterday=date?prevDay(date):'';
 const load=async()=>{
  if(!date||!isAdmin)return;setLoading(true);setMessage('');
  const startYesterday=weekStart(yesterday),startToday=weekStart(date);
  const [p,r,a,w]=await Promise.all([
   supabase.from('staff_members').select('id,full_name,employee_code,employee_role,team,rank_title').eq('active',true).order('id'),
   supabase.from('daily_attendance_reports').select('*').in('work_date',[yesterday,date]),
   supabase.from('daily_attendance').select('work_date,employee_name,status,shift,team').in('work_date',[yesterday,date]),
   supabase.from('weekly_assignments').select('week_start,employee_name,team,shift').in('week_start',[...new Set([startYesterday,startToday])]),
  ]);
  const error=p.error||r.error||a.error||w.error;
  if(error)setMessage(`${word(lang,'loadFailed')} ${error.message}`);
  else {setPeople(((p.data||[]) as Person[]).filter(v=>!scopeTeam||v.team===scopeTeam));setRecords(Object.fromEntries(((r.data||[]) as ReportRow[]).map(v=>[v.work_date+':'+v.staff_id,v])));setAttendance((a.data||[]) as Attendance[]);setAssignments((w.data||[]) as Assignment[]);setDirty([]);}
  setLoading(false);
 };
 useEffect(()=>{void load();/* load only on date/team change */},[date,isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps
 const rows=useMemo<Entry[]>(()=>people.filter(p=>(!scopeTeam||p.team===scopeTeam)&&(team==='all'||p.team===team)).map(person=>{
  const prev=records[yesterday+':'+person.id]||empty(person.id,yesterday);
  const storedToday=records[date+':'+person.id];
  const today=storedToday||empty(person.id,date);
  const aToday=attendance.find(a=>a.work_date===date&&a.employee_name===person.full_name&&a.team===person.team);
  const aPrev=attendance.find(a=>a.work_date===yesterday&&a.employee_name===person.full_name&&a.team===person.team);
  const shift=assignments.find(a=>a.week_start===weekStart(date)&&a.employee_name===person.full_name&&a.team===person.team)?.shift;
  const isLeave=['annual','unpaid','am_half','pm_half'].includes(aToday?.status||'');
  return {person,prev,today:{...today,planned_start:storedToday?.planned_start??(isLeave?null:shift==='day'?'08:00':shift==='night'?'20:00':null),planned_end:storedToday?.planned_end??(isLeave?null:shift==='day'?'20:00':shift==='night'?'08:00':null)},statusPrev:aPrev?.status,statusToday:aToday?.status,shift};
 }),[people,team,records,yesterday,date,attendance,assignments]);
 const searchTerms=query.split(/[,，、;\n]+/).map(x=>x.trim().toLocaleLowerCase()).filter(Boolean);
 const shownRows=rows.filter(r=>searchTerms.length===0||searchTerms.some(term=>`${r.person.full_name} ${r.person.employee_code}`.toLocaleLowerCase().includes(term)));
 const selectedVisibleIds=selection.filter(id=>shownRows.some(r=>r.person.id===id));
 const setPattern=(id:number, patternId:PatternId)=>{setDirty(keys=>[...new Set([...keys,date+':'+id])]);const p=WORK_PATTERNS.find(x=>x.id===patternId);if(!p)return;setRecords(prev=>{const k=date+':'+id;return {...prev,[k]:{...(prev[k]||empty(id,date)),work_pattern_id:patternId,planned_start:p.start,planned_end:p.end}};});};
 const update=(personId:number,workDate:string,key:keyof ReportRow,value:string|boolean)=>{
  const k=workDate+':'+personId;setDirty(keys=>[...new Set([...keys,k])]);setRecords(p=>({...p,[k]:{...(p[k]||empty(personId,workDate)),[key]:value}}));
 };
 const applyBulk=()=>{
   const d=bulkField.startsWith('actual_')?yesterday:date;
   setRecords(old=>{const next={...old};for(const id of selectedVisibleIds){const key=d+':'+id;next[key]={...(next[key]||empty(id,d)),[bulkField]:bulkTime};}return next;});
   setDirty(old=>[...new Set([...old,...selectedVisibleIds.map(id=>d+':'+id)])]);
 };
 const save=async(confirmPrevious=false)=>{
  if(!isAdmin||loading||!date)return;setLoading(true);setMessage('');
  const payload=Object.values(records).filter(r=>dirty.includes(r.work_date+':'+r.staff_id)||(confirmPrevious&&r.work_date===yesterday&&!!r.actual_start&&!!r.actual_end)).map(r=>({...r,confirmed:confirmPrevious&&r.work_date===yesterday&&!!r.actual_start&&!!r.actual_end?true:r.confirmed}));
  if(!payload.length){setLoading(false);setMessage(word(lang,'saved'));return;}
  const {error}=await supabase.from('daily_attendance_reports').upsert(payload,{onConflict:'staff_id,work_date'});
  setLoading(false);setMessage(error?`${word(lang,'loadFailed')} ${error.message}`:word(lang,'saved'));
  if(!error)void load();
 };
 const download=()=>{
  // Always export the full selected team, even when the on-screen name search is active.
  const exportRows=rows.map((r,i)=>({
   no:i+1,name:r.person.full_name,rank:r.person.rank_title||'',
   previousStart:r.prev.confirmed?(r.prev.actual_start||''):'',
   previousEnd:r.prev.confirmed?(r.prev.actual_end||''):'',
   plannedStart:r.today.planned_start||'',plannedEnd:r.today.planned_end||'',
   note:r.today.note||r.prev.note||(r.statusToday==='annual'?'연차':r.statusToday==='unpaid'?'무급휴가':r.statusToday==='am_half'?'오전반차':r.statusToday==='pm_half'?'오후반차':''),
   lunch:r.today.meal_lunch,dinner:r.today.meal_dinner,
  }));
  const blob=makeAttendanceWorkbook(date,yesterday,exportRows);
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`세림비앤지_일일근태보고서_${date}.xlsx`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
 };
 if(!isAdmin)return <p className="rounded-xl bg-white p-5">{word(lang,'adminOnly')}</p>;
 const timeInput=(id:number,day:string,key:'planned_start'|'planned_end'|'actual_start'|'actual_end',val:string|null)=><div className="flex min-w-[132px] flex-col gap-1"><select aria-label={key+' quick selection'} disabled={loading} value={QUICK_TIMES.includes(val||'')?val||'':'custom'} onChange={e=>{if(e.target.value!=='custom')update(id,day,key,e.target.value);}} className="w-[132px] rounded border bg-white px-1 py-1 text-xs"><option value="custom">{v3t(lang,'custom')}</option>{QUICK_TIMES.map(time=><option key={time} value={time}>{time}</option>)}</select><input aria-label={key} type="time" step="60" value={val||''} disabled={loading} onChange={e=>update(id,day,key,e.target.value||'')} className="w-[132px] rounded border border-gray-300 bg-white px-1 py-1 text-xs text-gray-900"/></div>;
 return <section className="space-y-4"><div className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#145C42]">{word(lang,'daily')}</h2><p className="mt-2 text-xs text-gray-500">{word(lang,'help')}</p><div className="mt-3 flex flex-wrap items-end gap-2"><label className="text-sm">{word(lang,'date')}<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 block rounded-lg border bg-white p-2 text-gray-900"/></label><label className="text-sm">{word(lang,'team')}<select value={team} onChange={e=>setTeam(e.target.value)} className="mt-1 block rounded-lg border bg-white p-2 text-gray-900">{!scopeTeam&&<option value="all">{word(lang,'all')}</option>}{(!scopeTeam||scopeTeam==='vacuum')&&<option value="vacuum">{word(lang,'vacuum')}</option>}{(!scopeTeam||scopeTeam==='newmaterial')&&<option value="newmaterial">{word(lang,'newmaterial')}</option>}</select></label><button onClick={load} disabled={loading} className="rounded-lg border px-3 py-2 text-sm">{word(lang,'refresh')}</button></div><div className="mt-3"><label className="text-sm font-medium">{LABELS[lang].search}</label><input className="mt-1 block w-full rounded-lg border border-gray-200 bg-white p-2 text-gray-900" value={query} onChange={e=>setQuery(e.target.value)} placeholder={lang==='ko'?'예: 박지현, 정동훈, SR0007':LABELS[lang].search}/><p className="mt-1 text-xs text-gray-500">{({ko:'쉼표(,)로 여러 직원 이름·번호를 구분하세요. 조회된 직원만 일괄 적용됩니다.',en:'Separate names or employee IDs with commas. Bulk actions affect only visible staff.',ne:'नाम वा कर्मचारी नम्बर अल्पविरामले छुट्याउनुहोस्।',km:'បំបែកឈ្មោះ ឬលេខបុគ្គលិកដោយសញ្ញាក្បៀស។',tl:'Paghiwalayin ang mga pangalan o ID gamit ang kuwit.',vi:'Phân cách tên hoặc mã nhân viên bằng dấu phẩy.'} as Record<Lang,string>)[lang]}</p></div></div>
 {message&&<p role="status" className="rounded-lg bg-white p-3 text-sm text-[#145C42]">{message}</p>}
 <section className="rounded-xl border bg-white p-4 shadow-sm"><div className="mb-3 font-bold text-[#145C42]">{v3t(lang,'bulk')} · {selectedVisibleIds.length} {v3t(lang,'chosen')}</div><div className="flex flex-wrap items-end gap-2"><label className="text-xs">{v3t(lang,'column')}<select value={bulkField} onChange={e=>setBulkField(e.target.value as typeof bulkField)} className="mt-1 block rounded border p-2"><option value="actual_start">{v3t(lang,'prevStart')}</option><option value="actual_end">{v3t(lang,'prevEnd')}</option><option value="planned_start">{v3t(lang,'plannedStart')}</option><option value="planned_end">{v3t(lang,'plannedEnd')}</option></select></label><label className="text-xs">{v3t(lang,'time')}<select value={bulkTime} onChange={e=>setBulkTime(e.target.value)} className="mt-1 block rounded border p-2">{QUICK_TIMES.map(x=><option key={x}>{x}</option>)}</select></label><button className="rounded bg-[#168253] px-4 py-2 text-sm font-bold text-white disabled:opacity-40" disabled={!selectedVisibleIds.length} onClick={applyBulk}>{v3t(lang,'apply')}</button><button className="rounded border px-3 py-2 text-xs" onClick={()=>setSelection(shownRows.map(x=>x.person.id))}>{v3t(lang,'selectAll')}</button><button className="rounded border px-3 py-2 text-xs" onClick={()=>setSelection([])}>{v3t(lang,'clear')}</button></div><p className="mt-2 text-xs text-gray-500">{v3t(lang,'saveHint')}</p></section>
 <div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="w-full min-w-[1100px] border-collapse text-left text-xs"><thead className="sticky top-0 bg-[#E2F0E5] text-[#184B34]"><tr><th rowSpan={2} className="border p-2">{v3t(lang,'chosen')}</th><th rowSpan={2} className="border p-2">No</th><th rowSpan={2} className="border p-2">{word(lang,'employee')}</th><th rowSpan={2} className="border p-2">{word(lang,'position')}</th><th colSpan={2} className="border p-2 text-center">{word(lang,'previous')} ({yesterday})</th><th colSpan={2} className="border p-2 text-center">{word(lang,'planned')} ({date})</th><th rowSpan={2} className="border p-2">{word(lang,'note')}</th><th rowSpan={2} className="border p-2">{word(lang,'lunch')}</th><th rowSpan={2} className="border p-2">{word(lang,'dinner')}</th><th rowSpan={2} className="border p-2">{word(lang,'status')}</th></tr><tr>{[0,1].flatMap(i=>(['start','end'] as const).map(k=><th key={i+k} className="border p-2">{word(lang,k)}</th>))}</tr></thead><tbody>{shownRows.map((r,i)=><tr key={r.person.id} className={i%2?'bg-[#FAFCFA]':''}><td className="border p-2"><input type="checkbox" checked={selection.includes(r.person.id)} onChange={e=>setSelection(prev=>e.target.checked?[...new Set([...prev,r.person.id])]:prev.filter(id=>id!==r.person.id))}/></td><td className="border p-2">{i+1}</td><td className="border p-2 font-semibold">{r.person.full_name}</td><td className="border p-2">{r.person.rank_title||'-'}</td><td className="border p-1">{timeInput(r.person.id,yesterday,'actual_start',r.prev.actual_start)}</td><td className="border p-1">{timeInput(r.person.id,yesterday,'actual_end',r.prev.actual_end)}</td><td className="border p-1">{timeInput(r.person.id,date,'planned_start',r.today.planned_start)}</td><td className="border p-1">{timeInput(r.person.id,date,'planned_end',r.today.planned_end)}</td><td className="border p-1"><input className="w-[175px] rounded border bg-white p-2 text-gray-900" maxLength={500} value={records[date+':'+r.person.id]?.note??r.today.note} onChange={e=>update(r.person.id,date,'note',e.target.value)}/></td><td className="border p-2 text-center"><input type="checkbox" checked={records[date+':'+r.person.id]?.meal_lunch??r.today.meal_lunch} onChange={e=>update(r.person.id,date,'meal_lunch',e.target.checked)}/></td><td className="border p-2 text-center"><input type="checkbox" checked={records[date+':'+r.person.id]?.meal_dinner??r.today.meal_dinner} onChange={e=>update(r.person.id,date,'meal_dinner',e.target.checked)}/></td><td className="border p-2">{r.statusPrev||'-'} / {r.statusToday||'-'}<button type="button" className="mt-2 block rounded border border-emerald-600 bg-white p-1.5 text-emerald-800" onClick={()=>setEditingId(editingId===r.person.id?null:r.person.id)}>{LABELS[lang].select}</button>{r.today.work_pattern_id&&<span className="mt-1 block text-xs text-emerald-800">{hm(calculatePattern(WORK_PATTERNS.find(p=>p.id===r.today.work_pattern_id)!).netMinutes)}</span>}</td></tr>)}</tbody></table></div>
 {editingId!==null&&<div className="max-w-xl rounded-xl border bg-white p-3"><p className="mb-2 text-sm font-bold">{people.find(p=>p.id===editingId)?.full_name}</p><WorkTimePicker key={editingId} lang={lang} value={records[date+':'+editingId]?.work_pattern_id||null} onChange={v=>setPattern(editingId,v)}/><button type="button" onClick={()=>setEditingId(null)} className="mt-3 rounded-lg border px-4 py-2">{({ko:"닫기",en:"Close",ne:"बन्द गर्नुहोस्",km:"បិទ",tl:"Isara",vi:"Đóng"} as Record<Lang,string>)[lang]}</button></div>}
 <div className="flex flex-wrap gap-2"><button disabled={loading} onClick={()=>void save(false)} className="rounded-lg bg-[#168253] px-4 py-3 font-semibold text-white">{word(lang,'save')}</button><button disabled={loading} onClick={()=>void save(true)} className="rounded-lg border border-[#168253] bg-white px-4 py-3 font-semibold text-[#145C42]">{word(lang,'confirmPrev')}</button><button onClick={download} disabled={loading||rows.length===0} className="rounded-lg border bg-white px-4 py-3 font-semibold text-gray-800">{({ko:'근태보고서 다운로드',en:'Download attendance report',ne:'हाजिरी रिपोर्ट डाउनलोड',km:'ទាញយករបាយការណ៍វត្តមាន',tl:'I-download ang attendance report',vi:'Tải báo cáo chấm công'} as Record<Lang,string>)[lang]}</button></div>
 </section>;
}

'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';
import type {Lang} from './i18n';

type Member={id:number;full_name:string;employee_code:string;team:string;employee_role:string;division_role:string|null;active:boolean;auth_user_id:string|null};
type Claim={id:number;received_date:string;customer_name:string;product_name:string;specification:string;production_date:string|null;description:string;factory:string;machine_no:string|null;defect_type:string|null;photo_paths:string[]|null;description_i18n:Record<string,string>|null;material:string|null;color:string|null;pack_quantity:string|null;worker1_id:number|null;worker2_id:number|null;archived_at:string|null};
type Receipt={claim_id:number;staff_id:number;acknowledged_at:string};
const langText:Record<string,Record<Lang,string>>={
 title:{ko:'고객사 클레임 공지',en:'Customer complaint notices',ne:'ग्राहक उजुरी सूचना',km:'សេចក្តីជូនដំណឹងបណ្ដឹងអតិថិជន',tl:'Paunawa sa reklamo',vi:'Thông báo khiếu nại'},
 vac:{ko:'진공성형팀',en:'Vacuum forming',ne:'भ्याकुम फर्मिङ',km:'បង្កើតសុញ្ញាកាស',tl:'Vacuum forming',vi:'Định hình chân không'},
 mat:{ko:'신소재생산팀',en:'New materials',ne:'नयाँ सामग्री',km:'សម្ភារៈថ្មី',tl:'Bagong materyal',vi:'Vật liệu mới'},
 month:{ko:'조회 월',en:'Month',ne:'महिना',km:'ខែ',tl:'Buwan',vi:'Tháng'},
 customer:{ko:'고객사',en:'Customer',ne:'ग्राहक',km:'អតិថិជន',tl:'Customer',vi:'Khách hàng'},
 product:{ko:'제품명',en:'Product',ne:'उत्पादन',km:'ផលិតផល',tl:'Produkto',vi:'Sản phẩm'},
 material:{ko:'재질',en:'Material',ne:'सामग्री',km:'សម្ភារៈ',tl:'Materyal',vi:'Chất liệu'},
 color:{ko:'색상',en:'Color',ne:'रङ',km:'ពណ៌',tl:'Kulay',vi:'Màu sắc'},
 pack:{ko:'입수량',en:'Pack quantity',ne:'प्याक सङ्ख्या',km:'ចំនួនក្នុងកញ្ចប់',tl:'Dami kada pakete',vi:'Số lượng/kiện'},
 machine:{ko:'발생 호기',en:'Machine',ne:'मेसिन',km:'ម៉ាស៊ីន',tl:'Makina',vi:'Máy'},
 workers:{ko:'관련 작업자 (최대 2명)',en:'Assigned workers (up to 2)',ne:'कामदार (बढीमा २)',km:'កម្មករពាក់ព័ន្ធ (២ នាក់)',tl:'Mga manggagawa (hanggang 2)',vi:'Công nhân liên quan (tối đa 2)'},
 search:{ko:'직원 이름·번호 검색',en:'Search employee name/ID',ne:'नाम वा नम्बर खोज्नुहोस्',km:'ស្វែងរកឈ្មោះ/លេខ',tl:'Hanapin ang pangalan/ID',vi:'Tìm tên/mã nhân viên'},
 date:{ko:'접수일',en:'Received date',ne:'प्राप्त मिति',km:'កាលបរិច្ឆេទទទួល',tl:'Petsa',vi:'Ngày nhận'},
 prodDate:{ko:'생산일',en:'Production date',ne:'उत्पादन मिति',km:'ថ្ងៃផលិត',tl:'Petsa ng produksyon',vi:'Ngày sản xuất'},
 defect:{ko:'불량 유형',en:'Defect type',ne:'दोषको प्रकार',km:'ប្រភេទកំហុស',tl:'Uri ng depekto',vi:'Loại lỗi'},
 detail:{ko:'클레임 내용',en:'Complaint detail',ne:'उजुरी विवरण',km:'ព័ត៌មានបណ្ដឹង',tl:'Detalye',vi:'Nội dung'},
 photo:{ko:'사진 첨부 (최대 3장)',en:'Photos (up to 3)',ne:'तस्बिर (३ सम्म)',km:'រូបថត (៣)',tl:'Mga larawan (3)',vi:'Ảnh (tối đa 3)'},
 save:{ko:'클레임 공지 저장',en:'Save notice',ne:'सूचना सुरक्षित',km:'រក្សាទុក',tl:'I-save',vi:'Lưu thông báo'},
 cancel:{ko:'취소',en:'Cancel',ne:'रद्द',km:'បោះបង់',tl:'Kanselahin',vi:'Hủy'},
 edit:{ko:'수정',en:'Edit',ne:'सम्पादन',km:'កែប្រែ',tl:'Baguhin',vi:'Sửa'},
 archive:{ko:'목록에서 제외',en:'Archive notice',ne:'सूचीबाट हटाउनुहोस्',km:'លុបចេញពីបញ្ជី',tl:'I-archive',vi:'Lưu trữ'},
 noMachine:{ko:'미지정',en:'Not assigned',ne:'नतोकिएको',km:'មិនបានកំណត់',tl:'Hindi itinalaga',vi:'Chưa chọn'},
 read:{ko:'내용과 사진을 확인했습니다',en:'I have reviewed the notice and photos',ne:'सूचना र तस्बिर हेरेँ',km:'ខ្ញុំបានអាននិងមើលរូបភាព',tl:'Nabasa ko ang abiso at nakita ang mga larawan',vi:'Tôi đã xem nội dung và ảnh'},
 ack:{ko:'내용 확인 완료',en:'Confirm read',ne:'पढेको पुष्टि',km:'បញ្ជាក់បានអាន',tl:'Kumpirmahin',vi:'Xác nhận đã đọc'},
 acked:{ko:'확인 완료',en:'Confirmed',ne:'पुष्टि भयो',km:'បានបញ្ជាក់',tl:'Nakumpirma',vi:'Đã xác nhận'},
 pending:{ko:'미확인',en:'Not confirmed',ne:'पुष्टि बाँकी',km:'មិនទាន់បញ្ជាក់',tl:'Hindi pa',vi:'Chưa xác nhận'},
 empty:{ko:'해당 월의 클레임 공지가 없습니다.',en:'No notices this month.',ne:'यो महिनामा सूचना छैन।',km:'គ្មានសេចក្តីជូនដំណឹង',tl:'Walang abiso.',vi:'Không có thông báo.'},
 noStaff:{ko:'해당 직원의 계정으로 로그인하면 확인할 수 있습니다.',en:'Log in as the assigned employee to confirm.',ne:'तोकिएको खातामा लगइन गर्नुहोस्।',km:'ចូលជាគណនីបុគ្គលិកដែលបានចាត់តាំង',tl:'Mag-log in bilang nakatalagang empleyado.',vi:'Đăng nhập bằng tài khoản được chỉ định.'}
};
const tr=(l:Lang,k:keyof typeof langText)=>langText[k][l];
const defects=['이바리','탄화물','구멍','벌레혼입','이물혼입','금속혼입','미성형','주름','편심','백화','스크래치','실리콘불량','합지불량'];
const machines=['1-1','1-2','1-3','1-4','1-5','1-6','2-1','2-2','2-3','2-4','3-1','3-2'];
const field='w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900';
const emptyForm={received_date:'',customer_name:'',product_name:'',production_date:'',description:'',factory:'vacuum',machine_no:'',defect_type:'',material:'',color:'',pack_quantity:'',worker1_id:null as number|null,worker2_id:null as number|null};
function kstDay(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export default function CustomerClaims({lang,isAdmin}:{lang:Lang;isAdmin:boolean}){
 const [month,setMonth]=useState(kstDay().slice(0,7)),[factory,setFactory]=useState<'vacuum'|'newmaterial'>('vacuum');
 const [items,setItems]=useState<Claim[]>([]),[members,setMembers]=useState<Member[]>([]),[receipts,setReceipts]=useState<Receipt[]>([]);
 const [myId,setMyId]=useState<number|null>(null),[editing,setEditing]=useState<number|null>(null),[expanded,setExpanded]=useState<number|null>(null);
 const [form,setForm]=useState({...emptyForm,received_date:kstDay()}),[search,setSearch]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[files,setFiles]=useState<File[]>([]),[photos,setPhotos]=useState<Record<string,string>>({});
 const load=useCallback(async()=>{
  const [year,m]=month.split('-').map(Number);if(!year||!m)return;
  const end=new Date(Date.UTC(year,m,1)).toISOString().slice(0,10);
  const {data:{user}}=await supabase.auth.getUser();
  const [claims,people,ack]=await Promise.all([
   supabase.from('customer_claims').select('*').is('archived_at',null).eq('factory',factory).gte('received_date',month+'-01').lt('received_date',end).order('received_date',{ascending:false}).limit(400),
   supabase.from('staff_members').select('id,full_name,employee_code,team,employee_role,division_role,active,auth_user_id').order('full_name'),
   supabase.from('claim_read_receipts').select('claim_id,staff_id,acknowledged_at'),
  ]);
  if(claims.error||people.error||ack.error)setMessage(claims.error?.message||people.error?.message||ack.error?.message||'');
  setItems((claims.data||[]) as Claim[]);setMembers((people.data||[]) as Member[]);setReceipts((ack.data||[]) as Receipt[]);
  setMyId(((people.data||[]) as Member[]).find(p=>p.auth_user_id===user?.id&&p.active)?.id||null);
 },[month,factory]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{let stale=false;const paths=items.flatMap(c=>c.photo_paths||[]);if(!paths.length){setPhotos({});return;}void Promise.all(paths.map(p=>supabase.storage.from('claim-photos').createSignedUrl(p,900))).then(res=>{if(!stale)setPhotos(Object.fromEntries(paths.map((p,i)=>[p,res[i].data?.signedUrl||''])));});return()=>{stale=true;};},[items]);
 useEffect(()=>{if(editing===null)setForm(p=>({...p,factory,worker1_id:p.factory===factory?p.worker1_id:null,worker2_id:p.factory===factory?p.worker2_id:null}));setSearch('');},[factory,editing]);
 const memberName=(id:number|null)=>id===null?'-':members.find(x=>x.id===id)?.full_name||'이전 직원';
 const eligibleWorkers=useMemo(()=>members.filter(p=>p.active&&p.team===form.factory&&p.employee_role==='worker'&&p.division_role==='작업자'),[members,form.factory]);
 const options=useMemo(()=>eligibleWorkers.filter(p=>`${p.full_name} ${p.employee_code}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())&&p.id!==form.worker1_id&&p.id!==form.worker2_id),[eligibleWorkers,search,form.worker1_id,form.worker2_id]);
 const update=(key:keyof typeof emptyForm,value:string|number|null)=>setForm(p=>({...p,[key]:value}));
 const pick=(id:number)=>{if(form.worker1_id===null)update('worker1_id',id);else if(form.worker2_id===null)update('worker2_id',id);setSearch('');};
 const reset=()=>{setForm({...emptyForm,received_date:kstDay(),factory});setEditing(null);setSearch('');setFiles([]);};
 const edit=(row:Claim)=>{setEditing(row.id);setForm({received_date:row.received_date,customer_name:row.customer_name,product_name:row.product_name,production_date:row.production_date||'',description:row.description,factory:row.factory,machine_no:row.machine_no||'',defect_type:row.defect_type||'',material:row.material||'',color:row.color||'',pack_quantity:row.pack_quantity||'',worker1_id:row.worker1_id,worker2_id:row.worker2_id});window.scrollTo({top:0,behavior:'smooth'});};
 const translateDetail=async(text:string)=>{if(!text.trim())return {};const {data:{session}}=await supabase.auth.getSession();if(!session)return {};try{const response=await fetch('/api/translate-notice',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({text})});return response.ok?await response.json():{};}catch{return {};}};
 const save=async()=>{
  if(!isAdmin||busy||!form.customer_name.trim()||!form.product_name.trim()||!form.received_date)return;
  setBusy(true);setMessage('');try{
   if(form.worker1_id!==null&&form.worker1_id===form.worker2_id)throw new Error('Duplicate employee');
   const selectedIds=[form.worker1_id,form.worker2_id].filter((id):id is number=>id!==null);
   if(selectedIds.some(id=>!eligibleWorkers.some(p=>p.id===id)))throw new Error('Selected worker is not an active worker in this team');
   const translated=await translateDetail(form.description);
   const original=items.find(c=>c.id===editing);
   const values={...form,production_date:form.production_date||null,specification:[form.material,form.color,form.pack_quantity].filter(Boolean).join(' / '),description_i18n:translated};
   let id=editing;
   if(id===null){const result=await supabase.from('customer_claims').insert(values).select('id').single();if(result.error)throw result.error;id=result.data.id;}
   else{const result=await supabase.from('customer_claims').update(values).eq('id',id).select('id');if(result.error)throw result.error;if(!result.data?.length)throw new Error('Permission denied');}
   const paths=[...(original?.photo_paths||[])];
   for(const file of files){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('JPG/PNG/WebP 5MB only');const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path=`${id}/${crypto.randomUUID()}.${ext}`;const result=await supabase.storage.from('claim-photos').upload(path,file,{contentType:file.type});if(result.error)throw result.error;paths.push(path);}
   if(files.length){const result=await supabase.from('customer_claims').update({photo_paths:paths}).eq('id',id);if(result.error)throw result.error;}
   reset();await load();setMessage(lang==='ko'?'저장했습니다.':'Saved');
  }catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 };
 const archive=async(id:number)=>{if(!isAdmin||busy||!window.confirm('현재 목록에서 제외할까요?'))return;setBusy(true);const result=await supabase.from('customer_claims').update({archived_at:new Date().toISOString()}).eq('id',id);setBusy(false);setMessage(result.error?.message||'Archived');if(!result.error)await load();};
 const acknowledge=async(row:Claim)=>{
  if(myId===null||![row.worker1_id,row.worker2_id].includes(myId)||busy)return;setBusy(true);setMessage('');
  const {error}=await supabase.rpc('serim_acknowledge_claim',{p_claim:row.id});
  setBusy(false);if(error)setMessage(error.message);else await load();
 };
 const receiptsFor=(row:Claim)=>receipts.filter(r=>r.claim_id===row.id&&[row.worker1_id,row.worker2_id].includes(r.staff_id));
 const currentPhotos=(row:Claim)=>(row.photo_paths||[]).filter(p=>photos[p]);
 return <div className="space-y-4">
  <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[#145C42]">{tr(lang,'title')}</h2><div className="mt-3 flex flex-wrap items-end gap-3"><label className="text-sm">{tr(lang,'month')}<input type="month" value={month} onChange={e=>setMonth(e.target.value)} className={field}/></label><div className="flex gap-2">{(['vacuum','newmaterial'] as const).map(v=><button key={v} onClick={()=>setFactory(v)} className={`rounded-lg border px-4 py-2 text-sm ${factory===v?'bg-green-100 font-bold text-green-900':''}`}>{tr(lang,v==='vacuum'?'vac':'mat')}</button>)}</div><span className="ml-auto text-sm font-semibold">{items.length} {lang==='ko'?'건':'records'}</span></div></section>
  {message&&<p role="status" className="rounded-lg border bg-white p-3 text-sm">{message}</p>}
  {isAdmin&&<section className="space-y-3 rounded-xl border bg-white p-5 shadow-sm"><h3 className="font-bold text-[#145C42]">{editing===null?tr(lang,'save'):tr(lang,'edit')}</h3><div className="grid gap-3 md:grid-cols-3">{([['received_date','date','date'],['customer_name','customer','text'],['product_name','product','text'],['production_date','prodDate','date']] as const).map(([key,label,type])=><label key={key} className="text-sm">{tr(lang,label)}<input type={type} className={field} value={form[key]} onChange={e=>update(key,e.target.value)}/></label>)}
   <label className="text-sm">{tr(lang,'machine')}<select className={field} value={form.machine_no} onChange={e=>update('machine_no',e.target.value)}><option value="">{tr(lang,'noMachine')}</option>{machines.map(m=><option key={m} value={m}>{lang==='ko'?m+'호기':m}</option>)}</select></label>
   <label className="text-sm">{tr(lang,'defect')}<select className={field} value={form.defect_type} onChange={e=>update('defect_type',e.target.value)}><option value="">{tr(lang,'noMachine')}</option>{defects.map(d=><option key={d} value={d}>{d}</option>)}</select></label>
   {([['material','material'],['color','color'],['pack_quantity','pack']] as const).map(([key,label])=><label key={key} className="text-sm">{tr(lang,label)}<input className={field} value={form[key]} onChange={e=>update(key,e.target.value)}/></label>)}
   </div><div className="rounded-lg bg-green-50 p-3"><h4 className="mb-2 text-sm font-bold">{tr(lang,'workers')}</h4><div className="mb-2 flex flex-wrap gap-2">{([form.worker1_id,form.worker2_id] as (number|null)[]).map((id,i)=><span key={i} className="rounded-full border bg-white px-3 py-1 text-xs">{i+1}. {memberName(id)} {id!==null&&<button type="button" className="ml-2 text-red-700" onClick={()=>update(i===0?'worker1_id':'worker2_id',null)}>×</button>}</span>)}</div><input className={field} value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr(lang,'search')}/><div className="mt-2 text-xs font-semibold text-green-900">{tr(lang,form.factory==='vacuum'?'vac':'mat')} · {eligibleWorkers.length} {({ko:'명',en:'workers',ne:'जना',km:'នាក់',tl:'manggagawa',vi:'người'} as Record<Lang,string>)[lang]}</div><div className="mt-2 flex max-h-48 flex-wrap gap-1 overflow-y-auto">{options.map(p=><button key={p.id} disabled={form.worker1_id!==null&&form.worker2_id!==null} onClick={()=>pick(p.id)} className="rounded border bg-white px-2 py-1 text-xs disabled:opacity-40">+ {p.full_name}</button>)}</div></div>
   <label className="block text-sm">{tr(lang,'detail')}<textarea rows={3} className={field} value={form.description} onChange={e=>update('description',e.target.value)}/></label><label className="block text-sm">{tr(lang,'photo')}<input className={field} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,3))}/></label>
   <div className="flex gap-2"><button disabled={busy} className="rounded bg-[#168253] px-5 py-2 font-bold text-white disabled:opacity-40" onClick={()=>void save()}>{tr(lang,'save')}</button>{editing!==null&&<button className="rounded border px-4 py-2" onClick={reset}>{tr(lang,'cancel')}</button>}</div></section>}
  {items.length===0?<div className="rounded-lg border bg-white p-4">{tr(lang,'empty')}</div>:<div className="grid items-start gap-3 xl:grid-cols-2">{items.map(row=>{const workerIds=[row.worker1_id,row.worker2_id].filter((id):id is number=>id!==null);const received=receiptsFor(row);const myReceipt=received.some(r=>r.staff_id===myId);const isMine=myId!==null&&workerIds.includes(myId);return <article key={row.id} className="rounded-xl border bg-white p-4 shadow-sm"><button className="w-full text-left" onClick={()=>setExpanded(expanded===row.id?null:row.id)}><div className="flex justify-between gap-2"><b className="text-[#145C42]">{row.customer_name} · {row.product_name}</b><span className="text-xs text-gray-500">{row.received_date}</span></div><p className="mt-2 text-sm">{row.machine_no?(lang==='ko'?row.machine_no+'호기':row.machine_no):tr(lang,'noMachine')} · {[row.material,row.color,row.pack_quantity].filter(Boolean).join(' / ')||row.specification||'-'}</p><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded bg-gray-100 px-2 py-1">{row.defect_type||'-'}</span><span className="rounded bg-green-50 px-2 py-1 text-green-800">{received.length}/{workerIds.length} {tr(lang,'acked')}</span></div></button>
   {(expanded===row.id||isMine&&!myReceipt)&&<div className="mt-3 border-t pt-3"><p className="whitespace-pre-wrap text-sm">{lang==='ko'?row.description:row.description_i18n?.[lang]||row.description}</p><div className="mt-3 flex flex-wrap gap-2">{currentPhotos(row).map(p=><a key={p} href={photos[p]} target="_blank" rel="noreferrer"><img src={photos[p]} alt="Complaint evidence" className="h-28 w-28 rounded object-cover"/></a>)}</div><div className="mt-3 text-xs">{tr(lang,'workers')}: {workerIds.length?workerIds.map(id=>`${memberName(id)} (${received.find(r=>r.staff_id===id)?tr(lang,'acked'):tr(lang,'pending')}${received.find(r=>r.staff_id===id)?' '+new Date(received.find(r=>r.staff_id===id)!.acknowledged_at).toLocaleString():''})`).join(' · '):'-'}</div>{isMine&&!myReceipt&&<div className="mt-3 rounded-lg bg-green-50 p-3"><p className="mb-2 text-xs text-gray-600">{tr(lang,'noStaff')}</p><button disabled={busy} className="rounded bg-[#168253] px-4 py-2 text-sm font-bold text-white" onClick={()=>void acknowledge(row)}>{tr(lang,'read')} ✓</button></div>}{isMine&&myReceipt&&<p className="mt-2 text-sm font-bold text-green-800">✓ {tr(lang,'acked')}</p>}{isAdmin&&<div className="mt-3 flex gap-2"><button className="rounded border px-3 py-1.5 text-xs" onClick={()=>edit(row)}>{tr(lang,'edit')}</button><button className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-700" onClick={()=>void archive(row.id)}>{tr(lang,'archive')}</button></div>}</div>}</article>;})}</div>}
 </div>;
}

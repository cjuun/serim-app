'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import {type Lang} from './i18n';

type Claim={id:number;received_date:string;customer_name:string;product_name:string;specification:string;production_date:string|null;description:string;status:string;resolution_note?:string;created_at:string};
const captions:Record<Lang,{title:string;date:string;company:string;product:string;spec:string;production:string;desc:string;save:string;status:string}>={
ko:{title:'고객사 클레임',date:'접수일',company:'업체명',product:'제품명',spec:'규격',production:'생산날짜',desc:'클레임 내용',save:'클레임 등록',status:'처리상태'},
en:{title:'Customer complaints',date:'Received',company:'Customer',product:'Product',spec:'Specification',production:'Production date',desc:'Details',save:'Register complaint',status:'Status'},
ne:{title:'ग्राहक गुनासो',date:'प्राप्त मिति',company:'ग्राहक',product:'उत्पादन',spec:'विशिष्टता',production:'उत्पादन मिति',desc:'विवरण',save:'दर्ता गर्नुहोस्',status:'स्थिति'},
km:{title:'បណ្ដឹងអតិថិជន',date:'ថ្ងៃទទួល',company:'អតិថិជន',product:'ផលិតផល',spec:'លក្ខណៈបច្ចេកទេស',production:'ថ្ងៃផលិត',desc:'ព័ត៌មានលម្អិត',save:'ចុះបញ្ជី',status:'ស្ថានភាព'},
tl:{title:'Reklamo ng customer',date:'Petsa ng pagtanggap',company:'Customer',product:'Produkto',spec:'Espesipikasyon',production:'Petsa ng produksyon',desc:'Detalye',save:'Irehistro',status:'Katayuan'},
vi:{title:'Khiếu nại khách hàng',date:'Ngày tiếp nhận',company:'Khách hàng',product:'Sản phẩm',spec:'Quy cách',production:'Ngày sản xuất',desc:'Nội dung',save:'Đăng ký',status:'Trạng thái'}};
const field='w-full rounded-lg border border-gray-200 p-3 text-sm';
export default function CustomerClaims({lang,isAdmin}:{lang:Lang;isAdmin:boolean}){
 const labels=captions[lang]; const [items,setItems]=useState<Claim[]>([]);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 const [form,setForm]=useState({received_date:'',customer_name:'',product_name:'',specification:'',production_date:'',description:''});
 const load=useCallback(async()=>{const {data,error}=await supabase.from('customer_claims').select('*').order('received_date',{ascending:false}).limit(100);if(error)setMessage(error.message);else setItems((data??[]) as Claim[]);},[]);
 useEffect(()=>{const now=new Date();const local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);setForm(p=>({...p,received_date:local}));void load();},[load]);
 const resolve=async(id:number,status:'received'|'investigating'|'resolved')=>{
  if(!isAdmin||busy)return;
  const note=window.prompt('조치 내용 / Action note (optional)')??'';
  setBusy(true);const {error}=await supabase.rpc('set_claim_status',{p_id:id,p_status:status,p_note:note});setBusy(false);
  setMessage(error?error.message:'처리상태 저장 완료');if(!error)void load();
 };
 const save=async()=>{if(!isAdmin||busy||!form.received_date||!form.customer_name.trim()||!form.product_name.trim())return;setBusy(true);
 const {error}=await supabase.from('customer_claims').insert({received_date:form.received_date,customer_name:form.customer_name.trim(),product_name:form.product_name.trim(),specification:form.specification.trim(),production_date:form.production_date||null,description:form.description.trim()});setBusy(false);
 if(error){setMessage(error.message);return;}setMessage('저장 완료');setForm(p=>({...p,customer_name:'',product_name:'',specification:'',production_date:'',description:''}));void load();};
 return <div className="space-y-4"><div className="rounded-xl border bg-white p-5"><h2 className="text-xl font-bold text-[#145C42]">{labels.title}</h2></div>{message&&<div className="rounded-lg border bg-white p-3 text-sm">{message}</div>}
 {isAdmin&&<div className="rounded-xl border bg-white p-5"><div className="grid gap-3 md:grid-cols-2">{([
 ['received_date',labels.date,'date'],['customer_name',labels.company,'text'],['product_name',labels.product,'text'],['specification',labels.spec,'text'],['production_date',labels.production,'date'],['description',labels.desc,'text']
 ] as const).map(([key,label,type])=><label key={key} className="text-sm"><span className="mb-1 block font-medium">{label}</span><input className={field} type={type} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/></label>)}</div><button disabled={busy||!form.customer_name.trim()||!form.product_name.trim()} onClick={save} className="mt-4 rounded-lg bg-[#168253] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{labels.save}</button></div>}
 <div className="space-y-3">{items.length===0?<div className="rounded-lg bg-white p-5 text-sm text-gray-500">No records</div>:items.map(c=><article key={c.id} className="rounded-xl border bg-white p-4"><div className="flex justify-between gap-2"><b>{c.customer_name} · {c.product_name}</b><span className="text-xs text-gray-500">{c.received_date}</span></div><p className="mt-2 text-sm">{labels.spec}: {c.specification||'-'} · {labels.production}: {c.production_date||'-'}</p><p className="mt-2 whitespace-pre-wrap text-sm">{c.description}</p><p className="mt-1 text-xs text-gray-500">{labels.status}: {c.status}</p>{c.resolution_note&&<p className="mt-2 text-xs text-gray-500">{c.resolution_note}</p>}{isAdmin&&<div className="mt-2 flex flex-wrap gap-2"><button onClick={()=>resolve(c.id,'investigating')} className="rounded border px-3 py-2 text-xs">조사 중</button><button onClick={()=>resolve(c.id,'resolved')} className="rounded bg-green-100 px-3 py-2 text-xs">조치 완료</button></div>}</article>)}</div></div>;
}

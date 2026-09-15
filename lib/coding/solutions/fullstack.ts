import type { CodingSolution } from '../types';
import { FULLSTACK_APPS, fullstackSeed, type FullStackApp } from '../tasks/fullstack';
import { EVOLVING_CHALLENGES } from '../../../shared/evolving';

function build(app:FullStackApp,stage:number):string {
 const {amount,endpoint,action}=app;
 const plain=`function normalizeInput(value){if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.name!=='string')return null;const name=value.name.trim(),amount=value.${amount};if(!name||name.length>80||!Number.isInteger(amount)||amount<0||amount>1000)return null;return {name,${amount}:amount}}`;
 if(stage===1)return plain;
 const backend=`type Draft={name:string;${amount}:number};type Item=Draft & {id:number;version:number};type RequestData={method:string;path:string;body?:unknown};type Reply={status:number;body:unknown};
 function normalizeInput(value:unknown):Draft|null {if(!value||typeof value!=='object'||Array.isArray(value))return null;const v=value as Record<string,unknown>;if(typeof v.name!=='string'||typeof v.${amount}!=='number')return null;const name=v.name.trim(),amount=v.${amount};if(!name||name.length>80||!Number.isInteger(amount)||amount<0||amount>1000)return null;return {name,${amount}:amount}}
 function updateItem(item:Item,patch:unknown):Item|null {if(!patch||typeof patch!=='object'||Array.isArray(patch))return null;const p=patch as Record<string,unknown>;if(!Number.isInteger(p.version)||p.version!==item.version)return null;const draft=normalizeInput({name:item.name,${amount}:p.${amount}});return draft?{...item,${amount}:draft.${amount},version:item.version+1}:null;}
 function createApi(seed:readonly Item[]):(request:RequestData)=>Reply {let rows:Item[]=seed.map(r=>({...r})),nextId=Math.max(0,...rows.map(r=>r.id))+1;return request=>{
 const notFound=():Reply=>({status:404,body:{error:'not_found'}}),invalid=():Reply=>({status:400,body:{error:'invalid'}});
 if(request.path==='${endpoint}'){
 if(request.method==='GET')return {status:200,body:rows.map(r=>({...r}))};
 if(request.method==='POST'){const draft=normalizeInput(request.body);if(!draft)return invalid();const item={...draft,id:nextId++,version:1};rows.push(item);return {status:201,body:{...item}};}
 return notFound();}
 ${stage>=4?`const suffix=request.path.startsWith('${endpoint}/')?request.path.slice('${endpoint}/'.length):'';if(!/^[1-9][0-9]*$/.test(suffix))return notFound();const id=Number(suffix),index=rows.findIndex(r=>r.id===id);if(index<0)return notFound();
 if(request.method==='DELETE'){rows=rows.filter(r=>r.id!==id);return {status:200,body:{deleted:id}};}
 if(request.method==='PATCH'){const p=request.body;if(!p||typeof p!=='object'||Array.isArray(p)||!Number.isInteger((p as Record<string,unknown>).version)||(p as Record<string,unknown>).version!==rows[index].version)return {status:409,body:{error:'conflict'}};const updated=updateItem(rows[index],p);if(!updated)return invalid();rows[index]=updated;return {status:200,body:{...updated}};}`:''}
 return notFound();};}
 `;
 if(stage<5)return backend;
 return backend+`
 import React,{useState,useEffect,useRef} from 'react';import {createLocalFetch} from './localFetch';
 export {normalizeInput,updateItem,createApi};
 export default function App({fetcher}){
 const [local]=useState(()=>createLocalFetch(createApi(${JSON.stringify(fullstackSeed(app))}))),fetch=fetcher||local;
 const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[name,setName]=useState(''),[amount,setAmount]=useState(''),[query,setQuery]=useState(''),[available,setAvailable]=useState(false),[page,setPage]=useState(0);
 const alive=useRef(true),requestId=useRef(0),mutation=useRef(false);
 async function refresh(clearError=true){const token=++requestId.current;setLoading(true);if(clearError)setError('');try{const response=await fetch('${endpoint}');if(!response.ok)throw Error();const data=await response.json();if(alive.current&&token===requestId.current)setRows(data)}catch{if(alive.current&&token===requestId.current)setError('Request failed')}finally{if(alive.current&&token===requestId.current)setLoading(false)}}
 useEffect(()=>{alive.current=true;void refresh();return ()=>{alive.current=false;requestId.current++}},[fetch]);
 async function write(path,method,body){if(mutation.current)return;mutation.current=true;setBusy(true);setError('');try{const response=await fetch(path,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});if(!alive.current)return;if(response.status===409){setError('Changed elsewhere');await refresh(false);return}if(!response.ok)throw Error();if(method==='POST'){setName('');setAmount('')}await refresh(false)}catch{if(alive.current)setError('Request failed')}finally{mutation.current=false;if(alive.current)setBusy(false)}}
 const filtered=rows.filter(r=>${stage>=8?`r.name.toLowerCase().includes(query.trim().toLowerCase())&&(!available||r.${amount}>0)`:'true'}),pages=Math.ceil(filtered.length/2),current=Math.min(page,Math.max(0,pages-1)),visible=${stage>=8?'filtered.slice(current*2,current*2+2)':'filtered'};
 return <main>{loading&&<p role="status">Loading</p>}{error&&<><p role="alert">{error}</p><button disabled={loading||busy} onClick={()=>refresh()}>Retry</button></>}
 ${stage>=6?`<form onSubmit={e=>{e.preventDefault();const draft=normalizeInput({name,${amount}:amount===''?NaN:Number(amount)});if(!draft){setError('Request failed');return}void write('${endpoint}','POST',draft)}}><label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>${amount}<input type="number" value={amount} onChange={e=>setAmount(e.target.value)}/></label><button disabled={busy||loading}>Create</button></form>`:''}
 ${stage>=8?`<label>Search<input value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/></label><label><input type="checkbox" checked={available} onChange={e=>{setAvailable(e.target.checked);setPage(0)}}/>Available only</label>`:''}
 {!loading&&!visible.length&&<p>No items</p>}<ul>{visible.map(item=><li key={item.id}>{item.name}<output aria-label={'${amount} '+item.name}>{item.${amount}}</output>
 ${stage>=7?`<button aria-label={'${action} '+item.name} disabled={busy||loading||item.${amount}===0} onClick={()=>write('${endpoint}/'+item.id,'PATCH',{version:item.version,${amount}:item.${amount}-1})}>${action}</button>`:''}
 ${stage>=8?`<button aria-label={'Delete '+item.name} disabled={busy||loading} onClick={()=>write('${endpoint}/'+item.id,'DELETE')}>Delete</button>`:''}</li>)}</ul>
 ${stage>=8?`<button disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button><output aria-label="Page">{pages?current+1:0} / {pages}</output><button disabled={current+1>=pages} onClick={()=>setPage(current+1)}>Next</button>`:''}
 </main>;
 }
 `;
}

export const FULLSTACK_SOLUTIONS:Record<string,CodingSolution> = Object.fromEntries(FULLSTACK_APPS.flatMap(app=>{
 const project=EVOLVING_CHALLENGES.find(p=>p.id===`fullstack-${app.slug}`)!;
 return project.stages.map((id,i)=>[id,{solution:build(app,i+1),...(i<4?{hiddenTests:[
  {call:`normalizeInput({name:'x'.repeat(81),${app.amount}:1})`,expected:null},
  {call:`normalizeInput({name:'A',${app.amount}:1001})`,expected:null},
  ...(i>=2?[{call:`(()=>{const seed=${JSON.stringify(fullstackSeed(app))};const api=createApi(seed);seed[0].name='changed';const first=api({method:'GET',path:'${app.endpoint}'});first.body[0].name='mutated';return api({method:'GET',path:'${app.endpoint}'}).body[0].name})()`,expected:app.first}]:[]),
 ]}:{})}]);
}));

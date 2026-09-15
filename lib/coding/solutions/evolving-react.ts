import type { CodingSolution } from '../types';

const builders: Record<string,(stage:number)=>string> = {
  'react-evolving-board': stage => `import React,{useState,useRef} from 'react';
export default function App(){
 const [text,setText]=useState(''),[filter,setFilter]=useState('All');const id=useRef(0);
 const [history,setHistory]=useState({past:[],present:[],future:[]});const tasks=history.present;
 const change=fn=>setHistory(h=>({past:[...h.past,h.present],present:fn(h.present),future:[]}));
 const add=()=>{const name=text.trim();if(!name)return;const task={id:++id.current,name,done:false};change(rows=>[...rows,task]);setText('')};
 ${stage === 3 ? `const undo=()=>setHistory(h=>h.past.length?{past:h.past.slice(0,-1),present:h.past[h.past.length-1],future:[h.present,...h.future]}:h);
 const redo=()=>setHistory(h=>h.future.length?{past:[...h.past,h.present],present:h.future[0],future:h.future.slice(1)}:h);` : ''}
 return <main><label>Task<input value={text} onChange={e=>setText(e.target.value)}/></label><button onClick={add}>Add</button>
 ${stage >= 2 ? `<div>{['All','Active','Completed'].map(f=><button key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div><output aria-label="Remaining">{tasks.filter(t=>!t.done).length}</output>` : ''}
 <ul>{tasks.filter(t=>${stage >= 2 ? "filter==='All'||(filter==='Completed'?t.done:!t.done)" : 'true'}).map(t=><li key={t.id}><label><input type="checkbox" checked={t.done} onChange={()=>change(rows=>rows.map(row=>row.id===t.id?{...row,done:!row.done}:row))}/>{t.name}</label>${stage >= 2 ? '<button aria-label={"Delete "+t.name} onClick={()=>change(rows=>rows.filter(row=>row.id!==t.id))}>Delete</button>' : ''}</li>)}</ul>
 ${stage === 3 ? '<button disabled={!history.past.length} onClick={undo}>Undo</button><button disabled={!history.future.length} onClick={redo}>Redo</button>' : ''}
 </main>;
}`,
  'react-evolving-catalog': stage => `import React,{useState} from 'react';
const products=[{id:1,name:'Apple',price:2},{id:2,name:'Banana',price:1},{id:3,name:'Carrot',price:3},{id:4,name:'Dates',price:4}];
export default function App(){const [query,setQuery]=useState(''),[sort,setSort]=useState('name'),[page,setPage]=useState(0),[selected,setSelected]=useState([]);
 const rows=products.filter(p=>p.name.toLowerCase().includes(query.trim().toLowerCase()));
 ${stage >= 2 ? `rows.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='price-asc'?a.price-b.price:b.price-a.price);` : ''}
 const pages=Math.ceil(rows.length/2),visible=${stage >= 2 ? 'rows.slice(page*2,page*2+2)' : 'rows'};
 return <main><label>Search<input value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/></label>
 ${stage >= 2 ? `<label>Sort<select value={sort} onChange={e=>{setSort(e.target.value);setPage(0)}}><option value="name">Name</option><option value="price-asc">Price ascending</option><option value="price-desc">Price descending</option></select></label>` : ''}
 {!visible.length&&<p>No products</p>}<ul>{visible.map(p=><li key={p.id}>${stage === 3 ? '<label><input type="checkbox" checked={selected.includes(p.id)} onChange={()=>setSelected(ids=>ids.includes(p.id)?ids.filter(id=>id!==p.id):[...ids,p.id])}/>{p.name}</label>' : '{p.name}'} {p.price}</li>)}</ul>
 ${stage >= 2 ? '<button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button><output aria-label="Page">{pages?page+1:0} / {pages}</output><button disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)}>Next</button>' : ''}
 ${stage === 3 ? '<output aria-label="Selected total">{products.filter(p=>selected.includes(p.id)).reduce((sum,p)=>sum+p.price,0)}</output><button disabled={!visible.length} onClick={()=>setSelected(ids=>[...new Set([...ids,...visible.map(p=>p.id)])])}>Select page</button><button disabled={!selected.length} onClick={()=>setSelected([])}>Clear selection</button>' : ''}
 </main>;
}`,
  'react-evolving-form': stage => `import React,{useState} from 'react';
export default function App(){const [email,setEmail]=useState(''),[name,setName]=useState(''),[step,setStep]=useState(0),[error,setError]=useState(''),[consent,setConsent]=useState(false),[snapshot,setSnapshot]=useState(null);
 const next=e=>{e.preventDefault();setError('');if(step===0){const value=email.trim();if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)){setError('Invalid email');return}setEmail(value);setStep(1)}${stage >= 2 ? "else if(step===1){if(name.replace(/\\s/g,'').length<2){setError('Invalid name');return}setName(name.trim());setStep(2)}" : ''}};
 const back=()=>{setStep(s=>s-1);setError('');setConsent(false)};
 ${stage === 3 ? `if(snapshot)return <main><p>Submitted</p><p>{snapshot.email}</p><p>{snapshot.name}</p><button onClick={()=>{setEmail('');setName('');setStep(0);setError('');setConsent(false);setSnapshot(null)}}>Start over</button></main>;` : ''}
 return <main>{step>0&&<p>Email accepted</p>}{error&&<p role="alert">{error}</p>}<form onSubmit={next}>
 {step===0&&<><label>Email<input value={email} onChange={e=>setEmail(e.target.value)}/></label><button>Next</button></>}
 ${stage >= 2 ? `{step===1&&<><label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><button type="button" onClick={back}>Back</button><button>Next</button></>}
 {step===2&&<><p>{email}</p><p>{name}</p><button type="button" onClick={back}>Back</button>${stage === 3 ? '<label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I agree</label><button type="button" disabled={!consent} onClick={()=>setSnapshot({email,name})}>Submit</button>' : ''}</>}` : ''}
 </form></main>;
}`,
};
export const REACT_EVOLVING_SOLUTIONS: Record<string,CodingSolution> = Object.fromEntries(
  Object.entries(builders).flatMap(([id,build])=>[1,2,3].map(stage=>[`${id}-${stage}`,{solution:build(stage)}])),
);

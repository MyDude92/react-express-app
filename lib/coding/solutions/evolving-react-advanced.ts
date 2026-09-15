export function advanceReact(source: string, id: string, stage: number): string {
  if (stage < 4) return source;
  if (id === 'react-evolving-board') {
    source = source.replace('return <main>', `const move=(taskId,delta)=>change(rows=>{const out=[...rows],i=out.findIndex(t=>t.id===taskId);[out[i],out[i+delta]]=[out[i+delta],out[i]];return out});
 return <main>`);
    source = source.replace('</main>', `<button disabled={!tasks.some(t=>!t.done)} onClick={()=>change(rows=>rows.map(t=>({...t,done:true})))}>Complete all</button><button disabled={!tasks.some(t=>t.done)} onClick={()=>change(rows=>rows.filter(t=>!t.done))}>Clear completed</button></main>`);
    if (stage >= 5) source = source.replace('</li>', `<button aria-label={'Move up '+t.name} disabled={tasks[0].id===t.id} onClick={()=>move(t.id,-1)}>Move up</button><button aria-label={'Move down '+t.name} disabled={tasks[tasks.length-1].id===t.id} onClick={()=>move(t.id,1)}>Move down</button></li>`);
  }
  if (id === 'react-evolving-catalog') {
    source = source.replace('const rows=', "const [maxPrice,setMaxPrice]=useState(''),[quantities,setQuantities]=useState({});const rows=");
    source = source.replace('includes(query.trim().toLowerCase()))', "includes(query.trim().toLowerCase())&&(maxPrice===''||p.price<=Number(maxPrice)))");
    source = source.replace('</main>', `<label>Maximum price<input type="number" min="0" value={maxPrice} onChange={e=>{setMaxPrice(e.target.value);setPage(0)}}/></label></main>`);
    if (stage >= 5) {
      source = source.replace('sum+p.price,0)', 'sum+p.price*(quantities[p.id]??1),0)');
      source = source.replace('setSelected(ids=>ids.includes(p.id)?ids.filter(id=>id!==p.id):[...ids,p.id])', '{setSelected(ids=>ids.includes(p.id)?ids.filter(id=>id!==p.id):[...ids,p.id]);setQuantities(q=>{const next={...q};delete next[p.id];return next})}');
      source = source.replace('onClick={()=>setSelected([])}', 'onClick={()=>{setSelected([]);setQuantities({})}}');
      source = source.replace('</main>', `<section aria-label="Cart">{products.filter(p=>selected.includes(p.id)).map(p=><label key={p.id}>{'Quantity '+p.name}<input type="number" min="1" max="99" value={quantities[p.id]??1} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=1&&n<=99)setQuantities(q=>({...q,[p.id]:n}))}}/></label>)}</section></main>`);
    }
  }
  if (id === 'react-evolving-form') {
    source = source.replace('const next=', "const [account,setAccount]=useState('personal'),[company,setCompany]=useState('');const next=");
    source = source.replace('setName(name.trim());setStep(2)', "if(account==='business'&&company.replace(/\\s/g,'').length<2){setError('Invalid company');return}setCompany(company.trim());setName(name.trim());setStep(2)");
    source = source.replace('<label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label>', `<label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Account type<select value={account} onChange={e=>setAccount(e.target.value)}><option value="personal">Personal</option><option value="business">Business</option></select></label>{account==='business'&&<label>Company<input value={company} onChange={e=>setCompany(e.target.value)}/></label>}`);
    source = source.replace('<p>{email}</p><p>{name}</p>', "<p>{email}</p><p>{name}</p>{account==='business'&&<p>{company}</p>}");
    source = source.replace('setSnapshot({email,name})', "setSnapshot({email,name,company:account==='business'?company:''})");
    source = source.replace('<p>{snapshot.name}</p>', '<p>{snapshot.name}</p>{snapshot.company&&<p>{snapshot.company}</p>}');
    source = source.replace('setSnapshot(null)', "setSnapshot(null);setAccount('personal');setCompany('')");
    if (stage >= 5) {
      source = source.replace('const back=', `const draftAction=action=>{try{if(action==='clear'){localStorage.removeItem('evolving-form-draft');return}if(action==='save'){localStorage.setItem('evolving-form-draft',JSON.stringify({version:1,email,name,account,company}));return}const d=JSON.parse(localStorage.getItem('evolving-form-draft'));if(!d||d.version!==1||!['email','name','account','company'].every(k=>typeof d[k]==='string')||!['personal','business'].includes(d.account))throw 0;setEmail(d.email);setName(d.name);setAccount(d.account);setCompany(d.company);setStep(0);setConsent(false);setError('')}catch{setError('Draft unavailable')}};const back=`);
      source = source.replace('</form>', `<button type="button" onClick={()=>draftAction('save')}>Save draft</button><button type="button" onClick={()=>draftAction('restore')}>Restore draft</button><button type="button" onClick={()=>draftAction('clear')}>Clear draft</button></form>`);
    }
  }
  return source;
}

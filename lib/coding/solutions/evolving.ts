import type { CodingSolution } from '../types';

// Per-stage reference implementations stay on the server. Later capabilities
// are added when generating the later stage, not revealed by earlier stages.
const solutions: Record<string, (stage: number) => string> = {
  'js-evolving-calculator': stage => stage === 1
    ? 'function calculate(s) { return s.split("+").reduce((sum,n)=>sum+Number(n),0); }'
    : `function calculate(s) {
      let i=0;
      const space=()=>{while(/\\s/.test(s[i]||'') && i<s.length)i++};
      function atom(){ space(); ${stage === 3 ? `if(s[i]==='+'||s[i]==='-'){const op=s[i++];const n=atom();return op==='-'?-n:n}
        if(s[i]==='('){i++;const n=sum();space();if(s[i++]!==')')throw 0;return n}` : ''}
        const m=s.slice(i).match(/^\\d+(?:\\.\\d+)?/);if(!m)throw 0;i+=m[0].length;return Number(m[0]);
      }
      function product(){let n=atom();space();while(s[i]==='*'||s[i]==='/'){const op=s[i++],v=atom();if(op==='/'&&v===0)throw 0;n=op==='*'?n*v:n/v;space()}return n}
      function sum(){let n=product();space();while(s[i]==='+'||s[i]==='-'){const op=s[i++],v=product();n=op==='+'?n+v:n-v;space()}return n}
      try{const n=sum();space();return i===s.length&&Number.isFinite(n)?n:null}catch{return null}
    }`,
  'js-evolving-query': stage => `function query(rows, options={}) {
    let out=rows.filter(row=>Object.entries(options.where||{}).every(([k,v])=>row[k]===v));
    ${stage >= 2 ? `if(options.orderBy)out.sort((a,b)=>{const x=a[options.orderBy],y=b[options.orderBy];return (x<y?-1:x>y?1:0)*(options.desc?-1:1)});
    const offset=options.offset??0;out=out.slice(offset,options.limit===undefined?undefined:offset+options.limit);` : ''}
    ${stage === 3 ? `if(options.select)out=out.map(row=>Object.fromEntries(options.select.filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]])));
    if(options.distinct){const seen=new Set();out=out.filter(row=>{const key=JSON.stringify(Object.keys(row).sort().map(k=>[k,row[k]]));if(seen.has(key))return false;seen.add(key);return true})}` : ''}
    return out;
  }`,
  'js-evolving-events': stage => `function createBus(){
    const events=new Map();
    function add(event,fn,once=false){const sub={fn,once,fired:false};const list=events.get(event)||[];list.push(sub);events.set(event,list);return ()=>{const i=list.indexOf(sub);if(i>=0)list.splice(i,1)}}
    return {on:(e,f)=>add(e,f),${stage >= 2 ? 'once:(e,f)=>add(e,f,true),' : ''}
      emit(event,value){const errors=[];for(const sub of [...(events.get(event)||[])]){
        ${stage >= 2 ? `if(sub.once){if(sub.fired)continue;sub.fired=true;const list=events.get(event);const i=list.indexOf(sub);if(i>=0)list.splice(i,1)}` : ''}
        ${stage === 3 ? 'try{sub.fn(value)}catch(error){errors.push(error)}' : 'sub.fn(value);'}
      }${stage === 3 ? 'return errors;' : ''}}
    };
  }`,
  'js-evolving-graph': stage => `function plan(graph,options={}){
    const done=new Set(),visiting=new Set(),out=[];
    function visit(id){if(done.has(id))return;${stage >= 2 ? 'if(!Object.hasOwn(graph,id)||visiting.has(id))throw 0;' : ''}visiting.add(id);for(const dep of graph[id])visit(dep);visiting.delete(id);done.add(id);out.push(id)}
    try{for(const id of Object.keys(graph))visit(id)}catch{return null}
    ${stage === 3 ? `if(options.layers){const layers=[];done.clear();while(done.size<out.length){const ready=Object.keys(graph).filter(id=>!done.has(id)&&graph[id].every(dep=>done.has(dep)));layers.push(ready);ready.forEach(id=>done.add(id))}return layers}` : ''}
    return out;
  }`,
  'ts-evolving-result': stage => `type Result<T>={ok:true;value:T}|{ok:false;error:string};
    function mapResult<T,U>(r:Result<T>,fn:(v:T)=>U):Result<U>{if(!r.ok)return r;${stage >= 2 ? 'try{' : ''}return {ok:true,value:fn(r.value)};${stage >= 2 ? '}catch(e){return {ok:false,error:e instanceof Error?e.message:String(e)}}' : ''}}
    ${stage >= 2 ? 'function flatMapResult<T,U>(r:Result<T>,fn:(v:T)=>Result<U>):Result<U>{if(!r.ok)return r;try{return fn(r.value)}catch(e){return {ok:false,error:e instanceof Error?e.message:String(e)}}}' : ''}
    ${stage === 3 ? `function collectResults<T>(rs:readonly Result<T>[]):Result<T[]>{const values:T[]=[];for(const r of rs){if(!r.ok)return r;values.push(r.value)}return {ok:true,value:values}}
    function traverseResults<T,U>(values:readonly T[],fn:(v:T)=>Result<U>):Result<U[]>{const out:U[]=[];for(const value of values){const r=flatMapResult({ok:true,value},fn);if(!r.ok)return r;out.push(r.value)}return {ok:true,value:out}}` : ''}`,
  'ts-evolving-store': stage => `function createStore<T>(initial:T){let value=initial;
    ${stage >= 2 ? 'const listeners=new Set<(v:T)=>void>();const notify=()=>{for(const fn of [...listeners])fn(value)};' : ''}
    ${stage === 3 ? 'const past:T[]=[],future:T[]=[];' : ''}
    const set=(next:T):void=>{if(Object.is(value,next))return;${stage === 3 ? 'past.push(value);future.length=0;' : ''}value=next;${stage >= 2 ? 'notify();' : ''}};
    return {get:():T=>value,set,
    ${stage >= 2 ? 'update:(fn:(v:T)=>T):void=>set(fn(value)),subscribe:(fn:(v:T)=>void):(()=>void)=>{const sub=(v:T)=>fn(v);listeners.add(sub);return ()=>{listeners.delete(sub)}},' : ''}
    ${stage === 3 ? 'undo:():boolean=>{if(!past.length)return false;future.push(value);value=past.pop()!;notify();return true},redo:():boolean=>{if(!future.length)return false;past.push(value);value=future.pop()!;notify();return true},' : ''}
    };
  }`,
  'ts-evolving-schema': stage => `type Schema='string'|'number'|'boolean'${stage >= 2 ? '|{object:Record<string,Schema>}' : ''}${stage === 3 ? '|{array:Schema}|{optional:Schema}' : ''};
    function validate(schema:Schema,value:unknown):string[]{
      function check(s:Schema,v:unknown,path:string):string[]{
        if(typeof s==='string')return typeof v===s&&(s!=='number'||Number.isFinite(v))?[]:[path+': expected '+s];
        ${stage === 3 ? `if('optional' in s)return v===undefined?[]:check(s.optional,v,path);
        if('array' in s)return Array.isArray(v)?v.flatMap((item,i)=>check(s.array,item,path+'['+i+']')):[path+': expected array'];` : ''}
        ${stage >= 2 ? `if(v===null||typeof v!=='object'||Array.isArray(v))return [path+': expected object'];
        return Object.keys(s.object).flatMap(k=>check(s.object[k],Object.prototype.hasOwnProperty.call(v,k)?(v as Record<string,unknown>)[k]:undefined,path+'.'+k));` : ''}
        ${stage === 1 ? "return [path+': expected '+s];" : ''}
      }
      return check(schema,value,'$');
    }`,
};

export const EVOLVING_SOLUTIONS: Record<string, CodingSolution> = Object.fromEntries(
  Object.entries(solutions).flatMap(([id, build]) => [1,2,3].map(stage => [`${id}-${stage}`, {solution: build(stage)}])),
);

const hidden: Record<string, [string, unknown][][]> = {
  'js-evolving-calculator': [
    [['calculate("17+23+0+4")',44]],
    [['calculate("20/2/2-1.5")',3.5]],
    [['calculate("(1+2")',null],['calculate("2**3")',null],['calculate("1e2")',null],['calculate("3 / -(-2)")',1.5]],
  ],
  'js-evolving-query': [
    [['(()=>{const a=[{x:1},{x:2}];const out=query(a);out.pop();return a.length})()',2]],
    [['(()=>{const a=[{x:2},{x:1}];query(a,{orderBy:"x"});return a})()',[{x:2},{x:1}]]],
    [['query([{a:null},{a:false},{a:0},{a:null}],{select:["a"],distinct:true})',[{a:null},{a:false},{a:0}]]],
  ],
  'js-evolving-events': [
    [['(()=>{const b=createBus(),a=[];const fn=v=>a.push(v);b.on("e",fn);b.on("e",fn);b.emit("e",0);return a})()',[0,0]]],
    [['(()=>{const b=createBus();let n=0;const off=b.once("x",()=>n++);off();b.emit("x");return n})()',0]],
    [['(()=>{const b=createBus(),a=[];b.once("e",()=>{a.push(1);throw "oops"});b.on("e",()=>a.push(2));return [b.emit("e"),b.emit("e"),a]})()',[['oops'],[],[1,2,2]]]],
  ],
  'js-evolving-graph': [
    [['plan({a:["c","c"],b:["c"],c:[]})',['c','a','b']]],
    [['plan({a:["b"],b:["c"],c:["b"]})',null]],
    [['plan({d:["b","c"],c:["a"],b:["a"],a:[]},{layers:true})',[['a'],['c','b'],['d']]]],
  ],
  'ts-evolving-result': [
    [['mapResult({ok:true,value:false},x=>!x)',{ok:true,value:true}]],
    [['flatMapResult({ok:false,error:"first"},()=>{throw "second"})',{ok:false,error:'first'}]],
    [['collectResults([{ok:true,value:0},{ok:false,error:"a"},{ok:false,error:"b"}])',{ok:false,error:'a'}],['traverseResults([1,2],()=>{throw "stop"})',{ok:false,error:'stop'}]],
  ],
  'ts-evolving-store': [
    [['(()=>{const s=createStore(null);s.set(null);return s.get()})()',null]],
    [['(()=>{const s=createStore(0),a=[];s.subscribe(v=>a.push(v));s.update(v=>v);return a})()',[]]],
    [['(()=>{const s=createStore(0);s.update(x=>x+1);s.update(x=>x+1);s.undo();s.undo();s.redo();s.redo();return [s.get(),s.redo()]})()',[2,false]]],
  ],
  'ts-evolving-schema': [
    [['validate("number",Infinity)',['$: expected number']],['validate("boolean",false)',[]]],
    [['validate({object:{a:"string",b:"number"}},null)',['$: expected object']],['validate({object:{a:"string",b:"number"}},{})',['$.a: expected string','$.b: expected number']]],
    [['validate({array:{optional:"number"}},[undefined,0,null])',['$[2]: expected number']],['validate({array:"string"},{})',['$: expected array']]],
  ],
};
for (const [id, stages] of Object.entries(hidden)) {
  for (let index=0; index<3; index++) EVOLVING_SOLUTIONS[`${id}-${index+1}`].hiddenTests = stages.slice(0,index+1).flat().map(([call,expected])=>({call,expected,edge:true}));
}

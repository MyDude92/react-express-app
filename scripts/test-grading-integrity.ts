import assert from 'node:assert/strict';
import { runInSandbox } from '../lib/coding/sandbox';

const attacks = [
  ['replace comparison', 'globalThis.__deepEqual=()=>true; function answer(){return 0}'],
  ['replace expected answer', 'globalThis.__expect=[0]; function answer(){return 0}'],
  ['replace evaluator', 'globalThis.eval=()=>1; function answer(){return 0}'],
  ['replace intrinsic equality', 'Object.is=()=>true; function answer(){return 0}'],
  ['replace serializer', 'JSON.stringify=()=>\'[ {"pass":true,"actual":"1","error":null} ]\'; function answer(){return 0}'],
  ['forge completion', 'function answer(){globalThis.__done=true;globalThis.__out=\'[ {"pass":true,"actual":"1","error":null} ]\';return new Promise(()=>{})}'],
  ['replace promise combinator', 'Promise.all=()=>Promise.resolve([{ok:true,value:1}]);function answer(){return 0}'],
  ['poison prototype serializer', 'Array.prototype.toJSON=()=>[{pass:true,actual:"1",error:null}];function answer(){return 0}'],
  ['read controller closure', 'function answer(){return __expect[0]}'],
  ['read caller arguments', 'function answer(){return answer.caller.arguments[0]}'],
] as const;
for (const [name, code] of attacks) {
  const run = await runInSandbox({ code, calls: ['answer()'], expectations: [1] });
  assert(!run.results.some(result => result.pass === true), `${name}: forged a pass`);
  console.log(`PASS integrity: ${name}`);
}
const special = await runInSandbox({code:'function answer(){return {a:undefined,b:[NaN,Infinity,-Infinity,-0]}}',calls:['answer()'],expectations:[{a:undefined,b:[NaN,Infinity,-Infinity,-0]}]});
assert.equal(special.results[0]?.pass, true);
const clean = await runInSandbox({code:'function answer(){return 1}',calls:['answer()'],expectations:[1]});
assert.equal(clean.results[0]?.pass, true, 'an attack must not poison the next run');
console.log('PASS integrity: lossless values and fresh run');

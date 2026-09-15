import assert from 'node:assert/strict';
import { runIsolatedReactSuite } from '../lib/coding/react-isolated';
import { CODING_TASKS } from '../lib/coding/catalog';
import { solutionFor } from '../lib/coding/solutions/index';

async function main() {
  assert(
    process.env.REACT_RUNNER_SNAPSHOT_ID,
    'Configure a test snapshot before this integration check',
  );
  // Deliberately fake values, never a real account credential.
  process.env.SHARK_ISOLATION_SENTINEL = 'must-not-enter-the-guest';
  const probes = [
    [
      'credentials',
      'function App(){ return null; }',
      `test('no application credentials',()=>{ expect(process.env.SHARK_ISOLATION_SENTINEL).toBe(undefined); expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBe(undefined); expect(process.env.VERCEL_TOKEN).toBe(undefined); });`,
    ],
    [
      'network',
      'function App(){ return null; }',
      `test('network denied',async()=>{let connected=false;try{await fetch('https://example.com',{signal:AbortSignal.timeout(700)});connected=true;}catch{}expect(connected).toBe(false);});`,
    ],
  ];
  for (const [name, appSource, suite] of probes) {
    const result = await runIsolatedReactSuite({ appSource, suite });
    assert.equal(result.passed, 1, `${name}: ${JSON.stringify(result)}`);
    console.log(`PASS isolated ${name}`);
  }
  for (const id of [
    'react-evolving-form-2',
    'react-uselocalstorage-hook',
    'react-fullstack-stockroom-6',
  ]) {
    const task = CODING_TASKS.find((task) => task.id === id);
    if (!task?.suite) throw new Error(`Missing fixture ${id}`);
    const appSource = solutionFor(task.id)?.solution;
    if (!appSource) throw new Error(`Missing solution ${id}`);
    const result = await runIsolatedReactSuite({
      appSource,
      suite: task.suite,
    });
    assert.equal(result.failed, 0, `${id}: ${JSON.stringify(result)}`);
    console.log(`PASS isolated ${id}: ${result.passed} tests`);
  }
  const stuck = await runIsolatedReactSuite({
    appSource: 'while(true){}; export default function App(){return null}',
    suite: `import App from './App'; test('render',()=>{expect(App).toBeTruthy()});`,
  });
  assert.equal(stuck.timedOut, true, JSON.stringify(stuck));
  console.log(
    'PASS synchronous infinite loop terminates outside the API process',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

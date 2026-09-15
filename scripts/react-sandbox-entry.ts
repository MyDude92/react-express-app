// Executed only inside a fresh, network-denied microVM. Never import this
// entry point into an API handler: learner code can access this process.
import { readFileSync, writeFileSync } from 'node:fs';
import { runReactSuite } from '../lib/coding/react-runner';

async function main() {
  const input = JSON.parse(readFileSync('/vercel/sandbox/input.json', 'utf8'));
  const result = await runReactSuite(input);
  writeFileSync('/vercel/sandbox/result.json', JSON.stringify(result));
  process.exit(0);
}
main().catch(() => process.exit(1));

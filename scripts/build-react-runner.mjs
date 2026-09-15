import { build } from 'esbuild';
await build({
  entryPoints: ['scripts/react-sandbox-entry.ts'],
  outfile: 'lib/coding/generated/react-sandbox.cjs',
  bundle: true, platform: 'node', format: 'cjs', packages: 'external', target: 'node24',
});

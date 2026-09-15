// Run with Vercel OIDC, or VERCEL_TOKEN / VERCEL_TEAM_ID / VERCEL_PROJECT_ID.
// Uploads only package manifests, never the checkout or application secrets.
import { readFile } from 'node:fs/promises';
import { Sandbox } from '@vercel/sandbox';
const credentials = process.env.VERCEL_TOKEN ? { token: process.env.VERCEL_TOKEN, teamId: process.env.VERCEL_TEAM_ID, projectId: process.env.VERCEL_PROJECT_ID } : {};
const sandbox = await Sandbox.create({ ...credentials, runtime: 'node24', persistent: false, timeout: 180_000 });
try {
  await sandbox.writeFiles(await Promise.all(['package.json', 'package-lock.json'].map(async path => ({
    path: `/vercel/sandbox/${path}`, content: await readFile(path),
  }))));
  const install = await sandbox.runCommand({ cmd: 'npm', args: ['ci', '--omit=dev', '--ignore-scripts'], timeoutMs: 120_000 });
  if (install.exitCode !== 0) throw new Error(`Dependency installation failed: ${await install.stderr()}`);
  const snapshot = await sandbox.snapshot({ expiration: 0 });
  console.log(`REACT_RUNNER_SNAPSHOT_ID=${snapshot.snapshotId}`);
} finally {
  await sandbox.stop().catch(() => undefined);
}

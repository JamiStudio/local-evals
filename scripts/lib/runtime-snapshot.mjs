import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const GLOBAL_TOOL = join(process.env.USERPROFILE ?? '', 'tools', 'lm-runtime-snapshot', 'bin', 'lm-runtime-snapshot.mjs');

export function readSystemProfile(root) {
  const path = join(root, 'results/system-profile.json');
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function captureSystemProfile(root, { quick = false } = {}) {
  const args = ['scripts/capture-system-profile.mjs'];
  if (quick) args.push('--quick');
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: quick ? 'pipe' : 'inherit',
  });
  return result.status === 0;
}

export function snapshotBinPath() {
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['lm-runtime-snapshot'], {
    encoding: 'utf8',
    shell: true,
  });
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim().split('\n')[0].trim();
  return existsSync(GLOBAL_TOOL) ? GLOBAL_TOOL : null;
}
#!/usr/bin/env node
/**
 * Writes live runtime facts to results/system-profile.json and registry/runtime-snapshot.json.
 * Uses global `lm-runtime-snapshot` when on PATH; falls back to C:\Users\james\tools\... copy.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEvalEnv } from './lib/env.mjs';

const { root } = loadEvalEnv();
const resultsDir = join(root, 'results');
const registryDir = join(root, 'registry');
mkdirSync(resultsDir, { recursive: true });
mkdirSync(registryDir, { recursive: true });

const GLOBAL_TOOL = join(process.env.USERPROFILE ?? '', 'tools', 'lm-runtime-snapshot', 'bin', 'lm-runtime-snapshot.mjs');
const outPath = join(resultsDir, 'system-profile.json');
const registryPath = join(registryDir, 'runtime-snapshot.json');

const modelsFile = join(registryDir, 'models.json');
const matrixSummary = join(resultsDir, 'matrix-summary.json');
const loadProfiles = join(registryDir, 'load-profiles.json');

function resolveSnapshotBin() {
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['lm-runtime-snapshot'], {
    encoding: 'utf8',
    shell: true,
  });
  if (which.status === 0 && which.stdout.trim()) {
    return which.stdout.trim().split('\n')[0].trim();
  }
  if (existsSync(GLOBAL_TOOL)) return GLOBAL_TOOL;
  return null;
}

const bin = resolveSnapshotBin();
if (!bin) {
  console.error('lm-runtime-snapshot not found. Run: npm install -g C:\\Users\\james\\tools\\lm-runtime-snapshot');
  process.exit(1);
}

const args = [
  bin,
  '--out',
  outPath,
  '--load-profiles',
  loadProfiles,
  '--matrix-summary',
  matrixSummary,
];
if (existsSync(modelsFile)) {
  args.push('--models-file', modelsFile);
}

const skipEstimates = process.argv.includes('--quick');
if (skipEstimates) args.push('--skip-estimates');

const result = spawnSync(process.execPath, args, { encoding: 'utf8', stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);

copyFileSync(outPath, registryPath);
console.log(`System profile → ${outPath}`);
console.log(`Registry snapshot → ${registryPath}`);
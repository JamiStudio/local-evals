#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { loadEvalEnv } from './lib/env.mjs';

const { root } = loadEvalEnv();

console.log('=== evals setup ===\n');

const steps = [
  ['npm install', 'npm install'],
  ['better-sqlite3 prebuild', 'node scripts/ensure-sqlite.mjs'],
  ['uv sync', 'uv sync'],
  ['registry export', 'node scripts/export-registry.mjs'],
  ['system snapshot', 'node scripts/capture-system-profile.mjs'],
  ['connectivity', 'node scripts/verify-connectivity.mjs'],
];

for (const [label, cmd] of steps) {
  console.log(`\n--- ${label} ---`);
  try {
    execSync(cmd, { cwd: root, stdio: 'inherit', shell: true });
  } catch {
    console.warn(`Step "${label}" failed — continuing`);
  }
}

console.log('\n=== setup complete ===');
console.log('Next: pnpm baseline:collect && pnpm optimize:smoke');
console.log('Long-running: pnpm optimize:loop');
#!/usr/bin/env node
/**
 * Ensure better-sqlite3 prebuilt binary is present (npm install scripts sometimes skip unpack).
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const binding = join(root, 'node_modules/better-sqlite3/build/Release/better_sqlite3.node');

if (existsSync(binding)) {
  console.log('better-sqlite3 binding OK');
  process.exit(0);
}

console.log('better-sqlite3 binding missing — running prebuild-install...');
const result = spawnSync(process.execPath, ['../prebuild-install/bin.js'], {
  cwd: join(root, 'node_modules/better-sqlite3'),
  stdio: 'inherit',
});

if (result.status !== 0 || !existsSync(binding)) {
  console.error('Failed to install better-sqlite3 prebuild. Run from evals/:');
  console.error('  cd node_modules/better-sqlite3 && node ../prebuild-install/bin.js');
  process.exit(1);
}

console.log('better-sqlite3 binding installed');
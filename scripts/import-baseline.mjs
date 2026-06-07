#!/usr/bin/env node
/**
 * Import a reference output collected OUTSIDE the harness (sub UI, Azure credits, Vertex).
 * Usage:
 *   pnpm baseline:import -- --task research-synthetic-smoke --source chatgpt-sub --file answer.md
 *   pnpm baseline:import -- --task plan-synthetic-smoke --source azure-openai --text "..."
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const taskId = getArg('task');
const source = getArg('source') ?? process.env.EVAL_BASELINE_SOURCE ?? 'other-sub';
const file = getArg('file');
const textArg = getArg('text');

if (!taskId) {
  console.error('Usage: pnpm baseline:import -- --task <taskId> --source <source> (--file path | --text "...")');
  process.exit(1);
}

const manifestPath = join(root, 'baselines/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const task = manifest.tasks.find((t) => t.taskId === taskId);
if (!task) {
  console.error(`Unknown taskId: ${taskId}. See baselines/manifest.json`);
  process.exit(1);
}

let output = textArg ?? '';
if (file) {
  const filePath = join(process.cwd(), file);
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  output = readFileSync(filePath, 'utf8');
}

if (!output.trim()) {
  console.error('No output text. Pass --file or --text');
  process.exit(1);
}

const taskDir = join(root, 'baselines', taskId);
mkdirSync(taskDir, { recursive: true });

const entry = {
  taskId,
  source,
  lane: task.lane,
  importedAt: new Date().toISOString(),
  output: output.trim(),
};

const outPath = join(taskDir, `${source}.json`);
writeFileSync(outPath, JSON.stringify(entry, null, 2) + '\n', 'utf8');

manifest.imports = manifest.imports.filter((i) => !(i.taskId === taskId && i.source === source));
manifest.imports.push({ taskId, source, path: `baselines/${taskId}/${source}.json`, importedAt: entry.importedAt });
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`Imported baseline → ${outPath}`);
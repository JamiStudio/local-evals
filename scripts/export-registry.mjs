#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const registryDir = join(root, 'registry');

mkdirSync(registryDir, { recursive: true });

const rawPath = join(registryDir, 'models.raw.json');
let rawText = '';
try {
  rawText = execSync('lms ls --json', {
    encoding: 'utf8',
    shell: process.platform === 'win32' ? 'pwsh.exe' : true,
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
  if (rawText) writeFileSync(rawPath, rawText + '\n', 'utf8');
} catch (error) {
  console.warn(`lms export failed (${error.message}); falling back to models.raw.json`);
}

if (!rawText) {
  try {
    rawText = readFileSync(rawPath, 'utf8').trim();
  } catch {
    console.error('No model inventory available. Run `lms ls --json` and save to registry/models.raw.json');
    process.exit(1);
  }
}

if (!rawText) {
  console.error('Model inventory file is empty. Run `lms ls --json` first.');
  process.exit(1);
}

const raw = JSON.parse(rawText);
const llms = raw.filter((entry) => entry.type === 'llm');

const models = {
  version: 1,
  exportedAt: new Date().toISOString(),
  source: 'lms ls --json',
  llms: llms.map((entry) => ({
    modelKey: entry.modelKey,
    displayName: entry.displayName,
    params: entry.paramsString,
    architecture: entry.architecture,
    sizeGb: Number((entry.sizeBytes / 1e9).toFixed(2)),
    quantization: entry.quantization?.name ?? null,
    variants: entry.variants ?? [entry.selectedVariant].filter(Boolean),
    selectedVariant: entry.selectedVariant,
    trainedForToolUse: entry.trainedForToolUse ?? false,
    vision: entry.vision ?? false,
    maxContextLength: entry.maxContextLength ?? null,
  })),
  embeddings: raw
    .filter((entry) => entry.type === 'embedding')
    .map((entry) => ({
      modelKey: entry.modelKey,
      displayName: entry.displayName,
      quantization: entry.quantization?.name ?? null,
    })),
};

writeFileSync(join(registryDir, 'models.json'), JSON.stringify(models, null, 2) + '\n', 'utf8');
console.log(`Exported ${models.llms.length} LLMs to registry/models.json`);
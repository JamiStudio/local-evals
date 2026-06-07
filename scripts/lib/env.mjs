import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

export function loadEvalEnv() {
  const envPath = join(root, '.env');
  if (existsSync(envPath)) dotenv.config({ path: envPath });
  return { root, envPath };
}

export function readManifest() {
  return JSON.parse(readFileSync(join(root, 'baselines/manifest.json'), 'utf8'));
}

export function renderPrompt(task) {
  const template = readFileSync(join(root, task.promptFile), 'utf8');
  let out = template;
  for (const [key, value] of Object.entries(task.vars ?? {})) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out.trim();
}
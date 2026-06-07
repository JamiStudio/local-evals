#!/usr/bin/env node
/** Print prompts to run manually in ChatGPT / Claude / Grok / Gemini / Azure / Vertex. */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'baselines/manifest.json'), 'utf8'));

for (const task of manifest.tasks) {
  const promptPath = join(root, task.promptFile);
  let template = readFileSync(promptPath, 'utf8');
  const vars = task.vars ?? {};
  for (const [key, value] of Object.entries(vars)) {
    template = template.replaceAll(`{{${key}}}`, value);
  }
  console.log(`\n${'='.repeat(72)}\nTASK: ${task.taskId} (${task.lane})\n${'='.repeat(72)}\n`);
  console.log(template.trim());
  console.log('\nImport with:');
  console.log(`  pnpm baseline:import -- --task ${task.taskId} --source <chatgpt-sub|claude-sub|azure-openai|...> --file <answer.txt>\n`);
}
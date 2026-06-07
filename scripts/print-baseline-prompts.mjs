#!/usr/bin/env node
/** Print prompts to run manually in ChatGPT / Claude / Grok / Gemini / Azure / Vertex. */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'baselines/manifest.json'), 'utf8'));
const taskFilters = new Set();

for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === '--task' && process.argv[i + 1]) {
    taskFilters.add(process.argv[i + 1]);
    i += 1;
  } else if (arg.startsWith('--task=')) {
    taskFilters.add(arg.slice('--task='.length));
  }
}

const tasks = taskFilters.size
  ? manifest.tasks.filter((task) => taskFilters.has(task.taskId))
  : manifest.tasks;

if (taskFilters.size && tasks.length !== taskFilters.size) {
  const known = new Set(manifest.tasks.map((task) => task.taskId));
  const missing = [...taskFilters].filter((taskId) => !known.has(taskId));
  console.error(`Unknown baseline task filter(s): ${missing.join(', ')}`);
  process.exit(1);
}

for (const task of tasks) {
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

#!/usr/bin/env node
/**
 * Collect baselines via credit-funded endpoints (Vertex Gemini or Azure OpenAI).
 * Not direct openai.com API — uses existing project credits/subs infrastructure.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEvalEnv, readManifest, renderPrompt } from './lib/env.mjs';
import { azureChat } from './lib/azure-openai.mjs';
import { generateContent, baselineModelId, baselineSourceLabel } from './lib/gemini.mjs';

const { root } = loadEvalEnv();
const collector = process.env.EVAL_BASELINE_COLLECTOR ?? 'vertex';
const manifest = readManifest();

async function vertexGenerate(prompt) {
  const { modelId, output } = await generateContent(prompt);
  return { modelId, output };
}

async function azureGenerate(prompt) {
  return azureChat([{ role: 'user', content: prompt }], { temperature: 0.2, max_tokens: 2048 });
}

const generate = collector === 'azure' ? azureGenerate : vertexGenerate;

let source = process.env.EVAL_BASELINE_SOURCE;
if (collector === 'vertex' && !source) {
  source = baselineSourceLabel(baselineModelId());
}
if (!source) {
  console.error('EVAL_BASELINE_SOURCE unset. For Vertex, set VERTEX_BASELINE_MODEL and re-run.');
  process.exit(1);
}

console.log(`Collecting baselines via ${collector} → source=${source}`);

for (const task of manifest.tasks) {
  const outPath = join(root, 'baselines', task.taskId, `${source}.json`);
  if (existsSync(outPath) && !process.argv.includes('--force')) {
    console.log(`skip ${task.taskId} (exists)`);
    continue;
  }

  const prompt = renderPrompt(task);
  console.log(`→ ${task.taskId} ...`);
  try {
    const result = await generate(prompt);
    const output = typeof result === 'string' ? result : result.output;
    const model = typeof result === 'string' ? null : result.modelId;
    mkdirSync(join(root, 'baselines', task.taskId), { recursive: true });
    const entry = {
      taskId: task.taskId,
      source,
      lane: task.lane,
      collector,
      model,
      importedAt: new Date().toISOString(),
      output: output.trim(),
    };
    writeFileSync(outPath, JSON.stringify(entry, null, 2) + '\n', 'utf8');
    manifest.imports = manifest.imports.filter((i) => !(i.taskId === task.taskId && i.source === source));
    manifest.imports.push({
      taskId: task.taskId,
      source,
      path: `baselines/${task.taskId}/${source}.json`,
      importedAt: entry.importedAt,
      collector,
    });
    console.log(`  saved ${outPath} (${output.length} chars)`);
  } catch (e) {
    console.error(`  FAILED ${task.taskId}: ${e.message}`);
  }
}

writeFileSync(join(root, 'baselines/manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('Done.');
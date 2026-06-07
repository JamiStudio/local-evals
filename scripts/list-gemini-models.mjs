#!/usr/bin/env node
/**
 * List text-safe Gemini models available to GEMINI_API_KEY (live API, no assumptions).
 */
import { loadEvalEnv } from './lib/env.mjs';
import { listGenerateContentModels } from './lib/gemini.mjs';

loadEvalEnv();
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error('GEMINI_API_KEY not set in .env');
  process.exit(1);
}

const models = await listGenerateContentModels(key);
const text = models.filter((m) => m.textSafe);
const blocked = models.filter((m) => !m.textSafe);

console.log(`Text-safe models (${text.length}) — use for VERTEX_BASELINE_MODEL (evals) / VERTEX_JUDGE_MODEL:\n`);
for (const m of text) {
  const rec =
    m.id.includes('3.5-flash') || m.id === 'gemini-flash-latest'
      ? '  ← recommended flash'
      : m.id.includes('3.1-pro')
        ? '  ← recommended pro baseline'
        : '';
  console.log(`  ${m.id}${rec}`);
}

console.log(`\nNon-text models (${blocked.length}) — do NOT use for baselines:`);
for (const m of blocked.slice(0, 12)) console.log(`  ${m.id} (${m.displayName})`);
if (blocked.length > 12) console.log(`  ... +${blocked.length - 12} more`);

console.log(`\nCurrent VERTEX_BASELINE_MODEL: ${process.env.VERTEX_BASELINE_MODEL ?? '(unset)'}`);
console.log(`Current VERTEX_JUDGE_MODEL: ${process.env.VERTEX_JUDGE_MODEL ?? '(unset)'}`);
if (process.env.VERTEX_TEXT_MODEL) {
  console.log(`(voice project VERTEX_TEXT_MODEL=${process.env.VERTEX_TEXT_MODEL} — ignored by evals)`);
}
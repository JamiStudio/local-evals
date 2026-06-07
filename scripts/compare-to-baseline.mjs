#!/usr/bin/env node
/**
 * Compare local Promptfoo results against imported baselines.
 * Produces results/baseline-comparison.jsonl for user-judge review.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const resultsDir = join(root, 'results');
const outPath = process.env.EVAL_BASELINE_COMPARISON_OUT
  ? join(root, process.env.EVAL_BASELINE_COMPARISON_OUT)
  : join(resultsDir, 'baseline-comparison.jsonl');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function findLatestPromptfooResult() {
  const candidates = ['promptfoo-latest.json', 'promptfoo-azure-judge.json'];
  for (const name of candidates) {
    const p = join(resultsDir, name);
    if (existsSync(p)) return p;
  }
  const jsonFiles = readdirSync(resultsDir).filter((f) => f.endsWith('.json') && f.startsWith('promptfoo'));
  if (!jsonFiles.length) return null;
  return join(resultsDir, jsonFiles.sort().at(-1));
}

function loadBaseline(taskId, preferredSource) {
  const dir = join(root, 'baselines', taskId);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (!files.length) return null;
  const candidates = preferredSource
    ? [files.find((f) => f.replace('.json', '') === preferredSource), ...files].filter(Boolean)
    : files;
  const pick = candidates.find((file) => {
    const baseline = loadJson(join(dir, file));
    return Boolean(String(baseline.output ?? '').trim());
  });
  if (!pick) return null;
  return loadJson(join(dir, pick));
}

const manifest = loadJson(join(root, 'baselines/manifest.json'));
const promptfooPath = findLatestPromptfooResult();
if (!promptfooPath) {
  console.error('No Promptfoo result found in results/. Run pnpm matrix:smoke first.');
  process.exit(1);
}

const data = loadJson(promptfooPath);
const rows = data.results?.results ?? [];
const preferredSource = process.env.EVAL_BASELINE_SOURCE;
const comparisons = [];

for (const row of rows) {
  const taskId = row.testCase?.metadata?.taskId ?? row.metadata?.taskId;
  if (!taskId) continue;

  const localOutput = row.response?.output ?? row.output ?? '';
  const baseline = loadBaseline(taskId, preferredSource);
  const deterministicPass = row.success ?? row.pass ?? row.gradingResult?.pass ?? null;

  comparisons.push({
    taskId,
    lane: row.testCase?.metadata?.lane ?? null,
    subjectModel: process.env.EVAL_SUBJECT_MODEL ?? row.provider?.label ?? null,
    loadProfile: process.env.EVAL_LOAD_PROFILE ?? null,
    deterministicPass,
    baselineSource: baseline?.source ?? null,
    hasBaseline: Boolean(baseline),
    localOutput: String(localOutput).slice(0, 4000),
    baselineOutput: baseline ? String(baseline.output).slice(0, 4000) : null,
    userJudgeStatus: 'pending',
    notes: baseline ? 'Compare in sub UI or review queue' : 'Import baseline via pnpm baseline:import',
  });
}

mkdirSync(resultsDir, { recursive: true });
writeFileSync(outPath, comparisons.map((r) => JSON.stringify(r)).join('\n') + (comparisons.length ? '\n' : ''), 'utf8');
console.log(`Wrote ${comparisons.length} comparisons → ${outPath}`);
console.log(`With baseline: ${comparisons.filter((c) => c.hasBaseline).length} / ${comparisons.length}`);

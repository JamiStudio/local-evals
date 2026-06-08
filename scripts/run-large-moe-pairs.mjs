#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEvalEnv } from './lib/env.mjs';

const { root } = loadEvalEnv();
const config = JSON.parse(readFileSync(join(root, 'registry/large-moe-pairs.json'), 'utf8'));

const args = process.argv.slice(2).filter((arg) => arg !== '--');
const smoke = args.includes('--smoke');
const full = args.includes('--full');
const list = args.includes('--list');
const pairArg = args.find((arg) => arg.startsWith('--pair='))?.split('=')[1] ?? null;
const candidateArg = args.find((arg) => arg.startsWith('--candidate='))?.split('=')[1] ?? null;

if (list) {
  console.log(JSON.stringify(config.pairs, null, 2));
  process.exit(0);
}

if (!smoke && !full) {
  console.error('Usage: node scripts/run-large-moe-pairs.mjs --list|--smoke|--full [--pair=<id>] [--candidate=<id>]');
  process.exit(1);
}

function flattenCandidates() {
  return config.pairs.flatMap((pair) => [
    { pairId: pair.id, role: 'moeCandidate', ...pair.moeCandidate },
    ...(pair.counterparts ?? []).map((candidate) => ({ pairId: pair.id, role: 'counterpart', ...candidate })),
  ]);
}

function runCommand(command, args, env) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, {
      cwd: root,
      env,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.on('close', (status, signal) => {
      resolve({ status, signal, stdout, stderr, durationMs: Date.now() - started });
    });
  });
}

async function runDirectCandidate(candidate) {
  const env = {
    ...process.env,
    EVAL_SUBJECT_MODEL: candidate.model,
    EVAL_LOAD_PROFILE: candidate.profile,
    EVAL_RUN_ID: `large-moe-${candidate.id}-${new Date().toISOString()}`,
  };

  if (candidate.backend === 'llama-server') {
    env.LMSTUDIO_BASE_URL = process.env.LMSTUDIO_BASE_URL ?? 'http://127.0.0.1:8080/v1';
  }

  if (smoke) {
    env.EVAL_TASK_FILTER = process.env.EVAL_TASK_FILTER ?? 'build-synthetic-smoke';
  } else {
    delete env.EVAL_TASK_FILTER;
  }

  const result = await runCommand('node', ['scripts/run-local-eval.mjs'], env);
  const artifactName = `large-moe-${smoke ? 'smoke' : 'full'}-${candidate.id}.json`;
  const artifactPath = join(root, 'results', artifactName);
  copyFileSync(join(root, 'results/promptfoo-latest.json'), artifactPath);
  return { candidate, artifact: `results/${artifactName}`, ...result };
}

const candidates = flattenCandidates()
  .filter((candidate) => !pairArg || candidate.pairId === pairArg)
  .filter((candidate) => !candidateArg || candidate.id === candidateArg);

if (!candidates.length) {
  console.error('No candidates matched the requested pair/candidate filter.');
  process.exit(1);
}

mkdirSync(join(root, 'results'), { recursive: true });
const runStarted = new Date().toISOString();
const results = [];

for (const candidate of candidates) {
  if (candidate.download === 'optional' && !process.env.EVAL_INCLUDE_OPTIONAL_DOWNLOADS) {
    results.push({ candidate, skipped: true, reason: 'optional download candidate; set EVAL_INCLUDE_OPTIONAL_DOWNLOADS=1' });
    continue;
  }
  if (candidate.backend === 'lmstudio' && process.env.EVAL_SKIP_LMSTUDIO) {
    results.push({ candidate, skipped: true, reason: 'EVAL_SKIP_LMSTUDIO set' });
    continue;
  }
  if (candidate.backend === 'llama-server' && process.env.EVAL_SKIP_SIDECAR) {
    results.push({ candidate, skipped: true, reason: 'EVAL_SKIP_SIDECAR set' });
    continue;
  }
  console.log(`\n=== ${candidate.id} (${candidate.backend}) ===`);
  results.push(await runDirectCandidate(candidate));
}

const summary = {
  at: new Date().toISOString(),
  runStarted,
  mode: smoke ? 'smoke' : 'full',
  filters: { pair: pairArg, candidate: candidateArg },
  results,
};
const summaryPath = join(root, `results/large-moe-${smoke ? 'smoke' : 'full'}-summary.json`);
writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log(`\nWrote ${summaryPath}`);

const failures = results.filter((result) => !result.skipped && result.status !== 0);
process.exit(failures.length ? 1 : 0);

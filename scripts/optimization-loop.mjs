#!/usr/bin/env node
/**
 * One optimization cycle for long-running agent goals:
 * registry → baselines (if missing) → matrix → compare → judge → summary → report
 *
 * Usage:
 *   node scripts/optimization-loop.mjs --smoke
 *   node scripts/optimization-loop.mjs --full
 *   node scripts/optimization-loop.mjs --smoke --loop   # repeat until SIGINT
 */
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEvalEnv } from './lib/env.mjs';

const { root } = loadEvalEnv();
const args = process.argv.slice(2);
const smoke = args.includes('--smoke') || !args.includes('--full');
const loop = args.includes('--loop');
const reportOnly = args.includes('--report-only');
const intervalMs = Number(process.env.EVAL_OPTIMIZATION_INTERVAL_MS ?? 0) || 300_000;

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', shell: true });
}

function runOptional(cmd) {
  try {
    run(cmd);
    return true;
  } catch {
    console.warn(`Optional step failed: ${cmd}`);
    return false;
  }
}

function baselineCoverage() {
  const manifest = JSON.parse(readFileSync(join(root, 'baselines/manifest.json'), 'utf8'));
  const source = process.env.EVAL_BASELINE_SOURCE;
  if (!source) return { covered: 0, total: manifest.tasks.length, source: null };
  let covered = 0;
  for (const task of manifest.tasks) {
    const p = join(root, 'baselines', task.taskId, `${source}.json`);
    if (existsSync(p)) covered += 1;
  }
  return { covered, total: manifest.tasks.length, source };
}

function latestFile(prefix, ext) {
  const resultsDir = join(root, 'results');
  if (!existsSync(resultsDir)) return null;
  const files = readdirSync(resultsDir).filter((f) => f.startsWith(prefix) && f.endsWith(ext));
  return files.sort().at(-1) ?? null;
}

function loadMatrixSummary() {
  const path = join(root, 'results/matrix-summary.json');
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadSystemProfile() {
  const path = join(root, 'results/system-profile.json');
  if (!existsSync(path)) return null;
  try {
    const snap = JSON.parse(readFileSync(path, 'utf8'));
    return {
      at: snap.at,
      vramGb: snap.nvidia?.vramGb ?? snap.recommendations?.hostVramGiB,
      llmCount: snap.lmstudio?.inventory?.llmCount,
      serverRunning: snap.lmstudio?.server?.running,
      placementHints: (snap.recommendations?.perModel ?? []).slice(0, 5).map((m) => ({
        modelKey: m.modelKey,
        suggestedMatrixPreset: m.suggestedMatrixPreset,
        fitsGpuMaxOnHost: m.fitsGpuMaxOnHost,
      })),
    };
  } catch {
    return null;
  }
}

function writeOptimizationState(cycle, report) {
  const statePath = join(root, 'results/optimization-state.json');
  const state = {
    cycle,
    at: new Date().toISOString(),
    mode: smoke ? 'smoke' : 'full',
    readyForLongRunningGoal: report.baseline.covered === report.baseline.total && report.comparison,
    reportPath: `results/optimization-report-${cycle}.json`,
    matrixSummary: report.matrixSummary,
    systemProfile: loadSystemProfile(),
    nextActions: report.nextActions,
    connectivity: {
      lmstudio: true,
      vertexBaselines: report.baseline.covered === report.baseline.total,
      langfuse: Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY),
      dockerRequiredForLangfuse: true,
    },
  };
  writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
  console.log(`Optimization state → ${statePath}`);
  return state;
}

function writeOptimizationReport(cycle) {
  const resultsDir = join(root, 'results');
  mkdirSync(resultsDir, { recursive: true });
  const latestMatrix = latestFile('matrix-', '.jsonl');
  const matrixSummary = loadMatrixSummary();
  const report = {
    cycle,
    at: new Date().toISOString(),
    mode: smoke ? 'smoke' : 'full',
    baseline: baselineCoverage(),
    latestMatrix,
    matrixSummary: matrixSummary?.leaderboard ?? null,
    comparison: existsSync(join(resultsDir, 'baseline-comparison.jsonl')),
    userJudgeQueue: existsSync(join(resultsDir, 'user-judge-queue.jsonl')),
    nextActions: [],
  };

  if (report.baseline.covered < report.baseline.total) {
    report.nextActions.push('pnpm baseline:collect');
  }
  if (!report.comparison) {
    report.nextActions.push('pnpm compare:baseline');
  }
  if (!report.userJudgeQueue) {
    report.nextActions.push('pnpm judge:queue');
  }
  if (!matrixSummary) {
    report.nextActions.push('pnpm summarize:matrix');
  }
  if (matrixSummary?.leaderboard?.length) {
    const best = matrixSummary.leaderboard[0];
    report.nextActions.push(
      `Tune thresholds using leader ${best.modelKey}@${best.profileId} (${best.pct}% pass)`,
    );
  }
  report.nextActions.push('Review results/user-judge-queue.jsonl');
  report.nextActions.push('Tune suites/promptfoo/tests/*.yaml thresholds and matrix presets');

  const path = join(resultsDir, `optimization-report-${cycle}.json`);
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`\nOptimization report → ${path}`);
  writeOptimizationState(cycle, report);
  return report;
}

async function cycleOnce(n) {
  console.log(`\n${'='.repeat(60)}\nOptimization cycle ${n} — ${smoke ? 'smoke' : 'full'}\n${'='.repeat(60)}`);
  run('node scripts/export-registry.mjs');
  runOptional('node scripts/capture-system-profile.mjs');

  const cov = baselineCoverage();
  if (cov.covered < cov.total) {
    console.log(`Baselines ${cov.covered}/${cov.total} — collecting via credits...`);
    run('node scripts/collect-baselines-credits.mjs');
  }

  run(smoke ? 'node scripts/run-matrix.mjs --smoke' : 'node scripts/run-matrix.mjs --full');
  runOptional('node scripts/compare-to-baseline.mjs');
  runOptional('node scripts/queue-user-judge.mjs');
  runOptional('node scripts/summarize-matrix.mjs');
  writeOptimizationReport(n);
}

let cycle = 1;
if (reportOnly) {
  runOptional('node scripts/summarize-matrix.mjs');
  writeOptimizationReport(cycle);
} else {
  await cycleOnce(cycle);
}

if (loop && !reportOnly) {
  console.log(`Looping every ${intervalMs / 1000}s — Ctrl+C to stop`);
  setInterval(async () => {
    cycle += 1;
    try {
      await cycleOnce(cycle);
    } catch (e) {
      console.error(`Cycle ${cycle} failed:`, e.message);
    }
  }, intervalMs);
}
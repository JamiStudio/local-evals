#!/usr/bin/env node
/**
 * Summarize latest matrix JSONL into results/matrix-summary.json
 * for optimization agents and long-running goal checkpoints.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEvalEnv } from './lib/env.mjs';

const { root } = loadEvalEnv();
const resultsDir = join(root, 'results');

function latestMatrixFile() {
  if (!existsSync(resultsDir)) return null;
  const files = readdirSync(resultsDir).filter(
    (f) => f.startsWith('matrix-') && f.endsWith('.jsonl') && !f.endsWith('.progress.jsonl'),
  );
  return files.sort().at(-1) ?? null;
}

function parsePassRate(stderr) {
  const m = stderr?.match(/(\d+)\/(\d+) passed/);
  if (m) return { passes: Number(m[1]), total: Number(m[2]) };

  const summary = stderr?.match(/Results:\s*.*?(\d+) passed,.*?(\d+) failed,.*?(\d+) errors/s);
  if (!summary) return null;

  const passes = Number(summary[1]);
  const failed = Number(summary[2]);
  const errors = Number(summary[3]);
  return { passes, total: passes + failed + errors };
}

const matrixFile = latestMatrixFile();
if (!matrixFile) {
  console.error('No matrix-*.jsonl in results/. Run pnpm matrix:smoke first.');
  process.exit(1);
}

const rows = readFileSync(join(resultsDir, matrixFile), 'utf8')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const cells = rows.map((row) => {
  const passRate =
    Number.isFinite(row.passes) && Number.isFinite(row.total)
      ? { passes: row.passes, total: row.total }
      : parsePassRate(row.stderr);
  const evalOk =
    (row.status === 'completed' && Boolean(passRate)) ||
    row.status === 'eval_partial' ||
    Boolean(passRate && passRate.passes > 0);
  return {
    modelKey: row.modelKey,
    profileId: row.profileId,
    status: row.status,
    durationMs: row.durationMs,
    passRate,
    evalOk,
  };
});

const summary = {
  at: new Date().toISOString(),
  matrixFile,
  runId: rows[0]?.runId ?? null,
  cells,
  totals: {
    cells: cells.length,
    completed: cells.filter((c) => c.evalOk).length,
    loadFailed: cells.filter((c) => c.status === 'load_failed').length,
    avgPassRate:
      cells.filter((c) => c.passRate).length > 0
        ? cells
            .filter((c) => c.passRate)
            .reduce((sum, c) => sum + c.passRate.passes / c.passRate.total, 0) /
          cells.filter((c) => c.passRate).length
        : null,
  },
  leaderboard: [...cells]
    .filter((c) => c.passRate)
    .sort((a, b) => b.passRate.passes / b.passRate.total - a.passRate.passes / a.passRate.total)
    .map((c) => ({
      modelKey: c.modelKey,
      profileId: c.profileId,
      passes: c.passRate.passes,
      total: c.passRate.total,
      pct: Math.round((100 * c.passRate.passes) / c.passRate.total),
    })),
};

mkdirSync(resultsDir, { recursive: true });
const outPath = join(resultsDir, 'matrix-summary.json');
writeFileSync(outPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log(`Matrix summary → ${outPath}`);
console.log(`Leaderboard: ${summary.leaderboard.map((r) => `${r.modelKey}@${r.profileId} ${r.pct}%`).join(', ')}`);

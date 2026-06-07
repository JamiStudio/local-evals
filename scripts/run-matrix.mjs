#!/usr/bin/env node
import { spawnSync, execSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(root, '.env') });

const args = process.argv.slice(2);
const smoke = args.includes('--smoke');
const full = args.includes('--full');

if (!smoke && !full) {
  console.error('Usage: node scripts/run-matrix.mjs --smoke|--full');
  process.exit(1);
}

const models = JSON.parse(readFileSync(join(root, 'registry/models.json'), 'utf8'));
const profiles = JSON.parse(readFileSync(join(root, 'registry/load-profiles.json'), 'utf8'));

const smokeKeys = (process.env.EVAL_SMOKE_MODELS ?? 'liquid/lfm2.5-1.2b,qwen/qwen3.5-9b')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const targets = (smoke ? models.llms.filter((m) => smokeKeys.includes(m.modelKey)) : models.llms).flatMap(
  (model) =>
    Object.keys(profiles.profiles).map((profileId) => ({
      model,
      profileId,
      profile: profiles.profiles[profileId],
    })),
);

const resultsDir = join(root, 'results');
mkdirSync(resultsDir, { recursive: true });
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const jsonlPath = join(resultsDir, `matrix-${runId}.jsonl`);

function logRow(row) {
  appendFileSync(jsonlPath, JSON.stringify(row) + '\n', 'utf8');
}

function loadModel(modelKey, gpuFlag) {
  const result = spawnSync('lms', ['load', modelKey, '--gpu', gpuFlag, '-y'], {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function unloadModels() {
  spawnSync('lms', ['unload', '--all'], {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
}

function runPromptfoo(modelKey, profileId) {
  const env = {
    ...process.env,
    EVAL_SUBJECT_MODEL: modelKey,
    EVAL_LOAD_PROFILE: profileId,
    EVAL_RUN_ID: runId,
  };
  const started = Date.now();
  const sqliteBinding = join(root, 'node_modules/better-sqlite3/build/Release/better_sqlite3.node');
  const usePromptfoo =
    process.env.EVAL_USE_PROMPTFOO === 'true' ||
    (process.env.EVAL_USE_PROMPTFOO !== 'false' && existsSync(sqliteBinding));
  const result = spawnSync(
    process.execPath,
    usePromptfoo
      ? [
          'node_modules/promptfoo/dist/src/entrypoint.js',
          'eval',
          '-c',
          'suites/promptfoo/promptfooconfig.yaml',
          '--max-concurrency',
          '1',
          '-o',
          'results/promptfoo-latest.json',
        ]
      : ['scripts/run-local-eval.mjs'],
    { cwd: root, env, encoding: 'utf8', stdio: 'pipe' },
  );
  const combined = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
  return {
    ok: result.status === 0,
    durationMs: Date.now() - started,
    stdout: combined.slice(-4000),
    stderr: result.status !== 0 ? combined.slice(-2000) : '',
  };
}

console.log(`Matrix run ${runId}: ${targets.length} cells`);
writeFileSync(jsonlPath, '', 'utf8');

try {
  execSync('node scripts/capture-system-profile.mjs --quick', { cwd: root, stdio: 'inherit' });
} catch {
  console.warn('Pre-matrix system snapshot skipped — run pnpm capture:system');
}

for (const { model, profileId, profile } of targets) {
  const cellStarted = Date.now();
  console.log(`\n→ ${model.modelKey} @ ${profileId} (${profile.lmsGpuFlag})`);

  const load = loadModel(model.modelKey, profile.lmsGpuFlag);
  if (!load.ok) {
    logRow({
      runId,
      modelKey: model.modelKey,
      profileId,
      status: 'load_failed',
      error: load.stderr || load.stdout,
      durationMs: Date.now() - cellStarted,
    });
    continue;
  }

  const evalResult = runPromptfoo(model.modelKey, profileId);
  const passMatch = evalResult.stderr?.match(/(\d+)\/(\d+) passed/);
  const passes = passMatch ? Number(passMatch[1]) : null;
  const total = passMatch ? Number(passMatch[2]) : null;
  const partial = passes != null && total != null && passes > 0 && passes < total;
  logRow({
    runId,
    modelKey: model.modelKey,
    variant: model.selectedVariant,
    profileId,
    gpuFlag: profile.lmsGpuFlag,
    status: evalResult.ok ? 'completed' : partial ? 'eval_partial' : 'eval_failed',
    passes,
    total,
    durationMs: evalResult.durationMs,
    stderr: evalResult.stderr,
  });

  unloadModels();
}

console.log(`\nResults: ${jsonlPath}`);
try {
  execSync('node scripts/capture-system-profile.mjs', { cwd: root, stdio: 'inherit' });
} catch {
  console.warn('Post-matrix system snapshot skipped');
}
try {
  execSync('node scripts/compare-to-baseline.mjs', { cwd: root, stdio: 'inherit' });
  execSync('node scripts/queue-user-judge.mjs', { cwd: root, stdio: 'inherit' });
} catch {
  console.warn('Baseline comparison / user-judge queue skipped');
}
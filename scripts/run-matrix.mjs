#!/usr/bin/env node
import { spawn, execSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(root, '.env') });

const args = process.argv.slice(2);
const smoke = args.includes('--smoke');
const full = args.includes('--full');
const cellTimeoutMs = Number(process.env.EVAL_CELL_TIMEOUT_MS ?? 0);

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

const allProfileEntries = Object.entries(profiles.profiles);
const smokeProfiles = (process.env.EVAL_SMOKE_PROFILES ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const selectedProfileEntries = smokeProfiles.length
  ? allProfileEntries.filter(([profileId]) => smokeProfiles.includes(profileId))
  : allProfileEntries;

if (smokeProfiles.length && selectedProfileEntries.length !== smokeProfiles.length) {
  const known = new Set(allProfileEntries.map(([profileId]) => profileId));
  const missing = smokeProfiles.filter((profileId) => !known.has(profileId));
  console.error(`Unknown EVAL_SMOKE_PROFILES value(s): ${missing.join(', ')}`);
  process.exit(1);
}

const targets = (smoke ? models.llms.filter((m) => smokeKeys.includes(m.modelKey)) : models.llms).flatMap(
  (model) =>
    selectedProfileEntries.map(([profileId, profile]) => ({
      model,
      profileId,
      profile,
    })),
);

// O1 robustness log (adjacent update for full matrix reliability per system-profile + load-profiles; aids bg/pnpm/direct diagnosis)
console.log(`O1 matrix: smoke=${smoke} full=${full} (argv=${JSON.stringify(args)}); ${targets.length} cells (${models.llms.length} LLMs × ${selectedProfileEntries.length}/${allProfileEntries.length} profiles per registry/load-profiles). Cite results/system-profile.json for 8GB serialize + placement. LM Studio only.`);

const resultsDir = join(root, 'results');
mkdirSync(resultsDir, { recursive: true });
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const jsonlPath = join(resultsDir, `matrix-${runId}.jsonl`);
const progressPath = join(resultsDir, `matrix-${runId}.progress.jsonl`);
const latestProgressPath = join(resultsDir, 'matrix-latest-progress.json');
const taskFilter = (process.env.EVAL_TASK_FILTER ?? '').trim() || null;
const progressIntervalMs = Number(process.env.EVAL_PROGRESS_INTERVAL_MS ?? 30000);

function logRow(row) {
  appendFileSync(jsonlPath, JSON.stringify(row) + '\n', 'utf8');
}

function writeProgress(event) {
  const payload = {
    at: new Date().toISOString(),
    runId,
    ...event,
  };
  appendFileSync(progressPath, JSON.stringify(payload) + '\n', 'utf8');
  writeFileSync(
    latestProgressPath,
    JSON.stringify(
      {
        runId,
        matrixJsonl: jsonlPath,
        progressJsonl: progressPath,
        updatedAt: payload.at,
        latest: payload,
      },
      null,
      2,
    ),
    'utf8',
  );
}

function tailText(value, max = 4000) {
  return (value ?? '').slice(-max);
}

function runCommand(command, args, { cwd = root, env = process.env, phase, cell }) {
  return new Promise((resolve) => {
    const started = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let done = false;
    const child = spawn(command, args, {
      cwd,
      env,
      shell: process.platform === 'win32',
      windowsHide: true,
    });

    writeProgress({
      event: `${phase}_started`,
      phase,
      cell,
      command,
      args,
      pid: child.pid,
      timeoutMs: cellTimeoutMs > 0 ? cellTimeoutMs : null,
    });

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
      writeProgress({
        event: `${phase}_stdout`,
        phase,
        cell,
        pid: child.pid,
        elapsedMs: Date.now() - started,
        output: tailText(text, 2000),
      });
    });

    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
      writeProgress({
        event: `${phase}_stderr`,
        phase,
        cell,
        pid: child.pid,
        elapsedMs: Date.now() - started,
        output: tailText(text, 2000),
      });
    });

    const heartbeat =
      progressIntervalMs > 0
        ? setInterval(() => {
            writeProgress({
              event: `${phase}_heartbeat`,
              phase,
              cell,
              pid: child.pid,
              elapsedMs: Date.now() - started,
              stdoutTail: tailText(stdout, 1200),
              stderrTail: tailText(stderr, 1200),
            });
            console.log(
              `[progress] ${phase} ${cell?.modelKey ?? ''} ${cell?.profileId ?? ''} elapsed=${Date.now() - started}ms`,
            );
          }, progressIntervalMs)
        : null;

    const timeout =
      cellTimeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            writeProgress({
              event: `${phase}_timeout`,
              phase,
              cell,
              pid: child.pid,
              elapsedMs: Date.now() - started,
              timeoutMs: cellTimeoutMs,
            });
            child.kill('SIGTERM');
          }, cellTimeoutMs)
        : null;

    child.on('close', (status, signal) => {
      if (done) return;
      done = true;
      if (heartbeat) clearInterval(heartbeat);
      if (timeout) clearTimeout(timeout);
      const durationMs = Date.now() - started;
      writeProgress({
        event: `${phase}_finished`,
        phase,
        cell,
        pid: child.pid,
        status,
        signal,
        timedOut,
        durationMs,
        stdoutTail: tailText(stdout, 2000),
        stderrTail: tailText(stderr, 2000),
      });
      resolve({
        ok: status === 0 && !timedOut,
        status,
        signal,
        timedOut,
        stdout,
        stderr,
        durationMs,
      });
    });

    child.on('error', (error) => {
      if (done) return;
      done = true;
      if (heartbeat) clearInterval(heartbeat);
      if (timeout) clearTimeout(timeout);
      const durationMs = Date.now() - started;
      writeProgress({
        event: `${phase}_error`,
        phase,
        cell,
        pid: child.pid,
        error: error.message,
        durationMs,
      });
      resolve({
        ok: false,
        status: null,
        signal: null,
        timedOut,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        durationMs,
      });
    });
  });
}

async function loadModel(modelKey, gpuFlag, cell) {
  const result = await runCommand('lms', ['load', modelKey, '--gpu', gpuFlag, '-y'], {
    phase: 'load',
    cell,
  });
  return {
    ok: result.status === 0 && !result.timedOut,
    timedOut: result.timedOut,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function unloadModels() {
  return runCommand('lms', ['unload', '--all'], {
    phase: 'unload',
    cell: null,
  });
}

async function runPromptfoo(modelKey, profileId, cell) {
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
  const promptfooArgs = [
    'node_modules/promptfoo/dist/src/entrypoint.js',
    'eval',
    '-c',
    'suites/promptfoo/promptfooconfig.yaml',
    '--max-concurrency',
    '1',
    '-o',
    'results/promptfoo-latest.json',
  ];
  if (process.env.EVAL_PROMPTFOO_NO_CACHE === 'true') {
    promptfooArgs.push('--no-cache');
  }
  if (taskFilter) {
    promptfooArgs.push('--filter-metadata', `taskId=${taskFilter}`);
  }
  const result = await runCommand(process.execPath, usePromptfoo ? promptfooArgs : ['scripts/run-local-eval.mjs'], {
    cwd: root,
    env,
    phase: 'eval',
    cell,
  });
  const combined = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
  const timedOut = result.timedOut;
  return {
    ok: result.ok && !timedOut,
    timedOut,
    durationMs: result.durationMs ?? Date.now() - started,
    stdout: combined.slice(-4000),
    stderr: timedOut
      ? `EVAL_CELL_TIMEOUT_MS=${cellTimeoutMs} elapsed before eval completed.\n${combined.slice(-1800)}`
      : result.status !== 0
        ? combined.slice(-2000)
        : '',
  };
}

function parsePassRate(output) {
  const slash = output?.match(/(\d+)\/(\d+) passed/);
  if (slash) {
    return { passes: Number(slash[1]), total: Number(slash[2]) };
  }

  const summary = output?.match(/Results:\s*.*?(\d+) passed,.*?(\d+) failed,.*?(\d+) errors/s);
  if (summary) {
    const passes = Number(summary[1]);
    const failed = Number(summary[2]);
    const errors = Number(summary[3]);
    return { passes, total: passes + failed + errors };
  }

  return null;
}

console.log(`Matrix run ${runId}: ${targets.length} cells`);
console.log(`Progress: ${progressPath}`);
console.log(`Latest progress: ${latestProgressPath}`);
if (cellTimeoutMs > 0) {
  console.log(`Per-cell timeout enabled: ${cellTimeoutMs} ms`);
}
writeFileSync(jsonlPath, '', 'utf8');
writeFileSync(progressPath, '', 'utf8');
writeProgress({
  event: 'run_started',
  smoke,
  full,
  targets: targets.length,
  models: targets.map(({ model, profileId }) => `${model.modelKey}@${profileId}`),
  taskFilter,
});

try {
  execSync('node scripts/capture-system-profile.mjs --quick', { cwd: root, stdio: 'inherit' });
} catch {
  console.warn('Pre-matrix system snapshot skipped — run pnpm capture:system');
}

for (const { model, profileId, profile } of targets) {
  const cellStarted = Date.now();
  const cell = {
    modelKey: model.modelKey,
    profileId,
    gpuFlag: profile.lmsGpuFlag,
    taskFilter,
  };
  console.log(`\n→ ${model.modelKey} @ ${profileId} (${profile.lmsGpuFlag})`);
  writeProgress({ event: 'cell_started', cell });

  const load = await loadModel(model.modelKey, profile.lmsGpuFlag, cell);
  if (!load.ok) {
    const row = {
      runId,
      modelKey: model.modelKey,
      profileId,
      status: load.timedOut ? 'load_timeout' : 'load_failed',
      error: load.stderr || load.stdout,
      durationMs: Date.now() - cellStarted,
    };
    logRow(row);
    writeProgress({ event: 'cell_finished', cell, row });
    await unloadModels();
    continue;
  }

  const evalResult = await runPromptfoo(model.modelKey, profileId, cell);
  const evalOutput = `${evalResult.stdout ?? ''}\n${evalResult.stderr ?? ''}`;
  const passRate = parsePassRate(evalOutput);
  const passes = passRate?.passes ?? null;
  const total = passRate?.total ?? null;
  const partial = passes != null && total != null && passes > 0 && passes < total;
  const row = {
    runId,
    modelKey: model.modelKey,
    variant: model.selectedVariant,
    profileId,
    gpuFlag: profile.lmsGpuFlag,
    taskFilter,
    status: evalResult.timedOut ? 'eval_timeout' : evalResult.ok ? 'completed' : partial ? 'eval_partial' : 'eval_failed',
    passes,
    total,
    durationMs: evalResult.durationMs,
    stderr: evalResult.stderr,
  };
  logRow(row);
  writeProgress({ event: 'cell_finished', cell, row });

  await unloadModels();
}

writeProgress({ event: 'run_finished' });
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

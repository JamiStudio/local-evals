#!/usr/bin/env node
import { spawnSync, execSync } from 'node:child_process';
import { loadEvalEnv } from './lib/env.mjs';
import { azureChat } from './lib/azure-openai.mjs';
import { generateContent, judgeModelId, baselineModelId } from './lib/gemini.mjs';

const { root } = loadEvalEnv();
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const mark = ok ? 'OK' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ''}`);
}

// LM Studio
try {
  const ping = await fetch(`${process.env.LMSTUDIO_BASE_URL ?? 'http://localhost:1234/v1'}/models`);
  record('lmstudio', ping.ok, `status ${ping.status}`);
} catch (e) {
  record('lmstudio', false, e.message);
}

// lms CLI
try {
  const out = execSync('lms ps', {
    encoding: 'utf8',
    shell: process.platform === 'win32' ? 'pwsh.exe' : true,
  });
  record('lms-cli', true, out.trim().split('\n')[0]);
} catch (e) {
  record('lms-cli', false, e.message);
}

// Azure OpenAI (credit) — deployments API probe
if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
  try {
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT;
    const out = await azureChat([{ role: 'user', content: 'Reply with exactly: pong' }], { max_tokens: 8 });
    record('azure-openai', Boolean(out), deployment ?? 'configured');
  } catch (e) {
    record('azure-openai', false, e.message);
  }
} else {
  record('azure-openai', false, 'missing AZURE_OPENAI_API_KEY or ENDPOINT (optional)');
}

// Vertex Gemini (credit) — live model from .env, no stale defaults
if (process.env.GEMINI_API_KEY) {
  try {
    const { modelId, output } = await generateContent('Reply with exactly: pong', {
      model: judgeModelId() ?? baselineModelId(),
      extra: { maxOutputTokens: 32 },
    });
    record('vertex-gemini-api', output.trim().length > 0, modelId);
  } catch (e) {
    record('vertex-gemini-api', false, e.message);
  }
} else {
  record('vertex-gemini-api', false, 'missing GEMINI_API_KEY');
}

// Azure deployment sanity — realtime/voice deployments cannot do chat completions
const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? '';
if (/realtime/i.test(azureDeployment)) {
  record('azure-chat-deployment', false, `${azureDeployment} is realtime/voice — set a chat deployment for baselines/judge`);
}

// Docker / Langfuse
const docker = spawnSync('docker', ['--version'], { encoding: 'utf8' });
record('docker', docker.status === 0, docker.status === 0 ? docker.stdout.trim() : 'not on PATH — Langfuse OSS skipped');

// better-sqlite3 (Promptfoo dependency)
try {
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const binding = join(root, 'node_modules/better-sqlite3/build/Release/better_sqlite3.node');
  if (!existsSync(binding)) {
    const { spawnSync: spawn } = await import('node:child_process');
    spawn(process.execPath, ['scripts/ensure-sqlite.mjs'], { cwd: root, stdio: 'pipe' });
  }
  const { createRequire } = await import('node:module');
  createRequire(import.meta.url)('better-sqlite3')(':memory:');
  record('better-sqlite3', true, 'binding loaded');
} catch (e) {
  record('better-sqlite3', false, e.message);
}

// promptfoo
const pf = spawnSync('npx', ['promptfoo', '--version'], { cwd: root, encoding: 'utf8', shell: true });
record('promptfoo', pf.status === 0, pf.stdout?.trim() || pf.stderr?.trim());

// Global runtime snapshot CLI
try {
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['lm-runtime-snapshot'], {
    encoding: 'utf8',
    shell: true,
  });
  record('lm-runtime-snapshot', which.status === 0, which.stdout?.trim().split('\n')[0] ?? 'not on PATH');
} catch (e) {
  record('lm-runtime-snapshot', false, e.message);
}

// nvidia-smi (hardware facts for placement)
try {
  const gpu = spawnSync(
    'nvidia-smi',
    ['--query-gpu=name,memory.total,memory.free', '--format=csv,noheader,nounits'],
    { encoding: 'utf8' },
  );
  record('nvidia-smi', gpu.status === 0, gpu.stdout?.trim().split('\n')[0]);
} catch (e) {
  record('nvidia-smi', false, e.message);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.some((f) => f.name === 'lmstudio' || f.name === 'lms-cli') ? 1 : 0);
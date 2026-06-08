#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Agent, setGlobalDispatcher } from 'undici';
import { loadEvalEnv } from './lib/env.mjs';

const { root } = loadEvalEnv();

setGlobalDispatcher(new Agent({ headersTimeout: 900_000, bodyTimeout: 900_000 }));

const baseUrl = (process.env.LMSTUDIO_BASE_URL ?? 'http://127.0.0.1:8080/v1').replace(/\/$/, '');
const model = process.env.EVAL_SUBJECT_MODEL ?? 'unsloth/gemma-4-26B-A4B-it-qat-GGUF';
const maxTokens = Number(process.env.EVAL_PRESSURE_MAX_TOKENS ?? 900);
const temperature = Number(process.env.EVAL_PRESSURE_TEMPERATURE ?? 0.1);

function readText(path) {
  return readFileSync(join(root, path), 'utf8');
}

function fileBlock(path) {
  return `\n\n--- FILE: ${path} ---\n${readText(path)}`;
}

function truncate(value, maxChars) {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n[TRUNCATED ${value.length - maxChars} chars]`;
}

async function chat(task) {
  const started = Date.now();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LMSTUDIO_API_KEY ?? 'local'}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are being evaluated. Use only the supplied context. Be specific, cite file names, and clearly separate proven facts from recommendations.',
        },
        { role: 'user', content: task.prompt },
      ],
      temperature,
      max_tokens: task.maxTokens ?? maxTokens,
    }),
  });
  const body = await res.json();
  const durationMs = Date.now() - started;
  const output = body.choices?.[0]?.message?.content ?? '';
  return {
    id: task.id,
    title: task.title,
    ok: res.ok,
    status: res.status,
    durationMs,
    promptCharLength: task.prompt.length,
    promptTokens: body.usage?.prompt_tokens ?? null,
    completionTokens: body.usage?.completion_tokens ?? null,
    timings: body.timings ?? null,
    finishReason: body.choices?.[0]?.finish_reason ?? null,
    output,
    checks: task.checks?.map((check) => ({
      label: check.label,
      pass: check.pattern.test(output),
    })),
    error: res.ok ? null : body,
  };
}

function buildAuditTask() {
  const context = [
    'docs/operations/llama-cmoe-sidecar.md',
    'docs/roadmaps/2026-06-07-contained-eval-streams-plan.md',
    'docs/evals/2026-06-07-strict-gap-audit.md',
    'docs/evals/2026-06-07-stream42-decision-ledger.md',
    'docs/evals/2026-06-07-final-selection-scoring-worksheet.md',
    'docs/evals/2026-06-07-review-readiness-index.md',
    'results/matrix-summary.json',
    'results/promptfoo-latest.json',
  ]
    .map(fileBlock)
    .join('');

  return {
    id: 'repo-evidence-audit',
    title: 'Repo evidence audit and model-placement decision',
    prompt: `Pressure test 1: audit the supplied local-evals evidence. The newest evidence is the llama.cpp CPU-MoE sidecar doc; weigh that against the older campaign docs.\n\nYour task:\n1. Decide whether Gemma 4 26B QAT CPU-MoE should enter the local model shortlist now.\n2. Name exactly what is proven and not proven.\n3. Identify the highest-value next eval, but only if it would change a decision.\n4. Do not overclaim broad matrix completion or user review.\n\nReturn markdown with headings: Decision, Proven, Not Proven, Next Eval, Risks.\n${context}`,
    maxTokens: 1000,
    checks: [
      { label: 'mentions CPU MoE sidecar', pattern: /cpu.?moe|sidecar/i },
      { label: 'mentions user review gap', pattern: /user review|human review|review-gated/i },
      { label: 'does not claim final completion', pattern: /not (complete|proven)|does not prove|not proven/i },
      { label: 'mentions qwen or liquid comparison', pattern: /qwen|liquid/i },
    ],
  };
}

function buildCodeReviewTask() {
  const context = [
    'scripts/run-matrix.mjs',
    'scripts/run-local-eval.mjs',
    'scripts/probe-openai-compatible.mjs',
    'scripts/llama-cmoe-server.ps1',
    'suites/promptfoo/providers/lmstudio-subject.yaml',
    'docs/evals/2026-06-07-strict-gap-audit.md',
  ]
    .map((path) => fileBlock(path))
    .join('');

  return {
    id: 'harness-code-review',
    title: 'Harness code review under repo context',
    prompt: `Pressure test 2: review the harness/sidecar code and recent failure notes.\n\nAct as a code reviewer. Find concrete risks only. For each finding include severity, file, why it matters, and a precise fix. Prefer 3-6 findings. Avoid style-only comments.\n${context}`,
    maxTokens: 1000,
    checks: [
      { label: 'references run-matrix', pattern: /run-matrix\.mjs/i },
      { label: 'references sidecar script or probe', pattern: /llama-cmoe-server|probe-openai-compatible/i },
      { label: 'has severity language', pattern: /severity|high|medium|low|\bP[0-3]\b/i },
    ],
  };
}

function buildNeedleTask() {
  const chunks = [];
  const needleWords = Number(process.env.EVAL_NEEDLE_WORDS ?? 12000);
  for (let i = 0; i < needleWords; i += 1) {
    if (i === 3117) chunks.push('NEEDLE_ALPHA: preferred-profile=llama_cmoe_ctx262k_q4kv');
    if (i === Math.floor(needleWords / 2)) chunks.push('NEEDLE_BETA: observed-decode-band=16-17-tokens-per-second');
    if (i === needleWords - 1500) chunks.push('NEEDLE_GAMMA: do-not-promote-without-user-review');
    chunks.push(`filler_${i % 257}`);
  }
  const longContext = chunks.join(' ');

  return {
    id: 'long-context-needle',
    title: 'Long-context needle retrieval and synthesis',
    prompt: `Pressure test 3: retrieve buried facts from a long synthetic context and synthesize the operational implication.\n\nInstructions:\n1. Quote the values of NEEDLE_ALPHA, NEEDLE_BETA, and NEEDLE_GAMMA.\n2. Explain in two sentences what those three facts imply for the eval campaign.\n3. If any needle is missing, say MISSING.\n\nLONG CONTEXT:\n${longContext}`,
    maxTokens: 400,
    checks: [
      { label: 'finds alpha', pattern: /llama_cmoe_ctx262k_q4kv/i },
      { label: 'finds beta', pattern: /16-17|16\s*to\s*17/i },
      { label: 'finds gamma', pattern: /do-not-promote|without user review|user review/i },
    ],
  };
}

const selected = new Set((process.env.EVAL_PRESSURE_TASKS ?? 'audit,code,needle').split(',').map((s) => s.trim()));
const tasks = [
  ['audit', buildAuditTask],
  ['code', buildCodeReviewTask],
  ['needle', buildNeedleTask],
]
  .filter(([key]) => selected.has(key))
  .map(([, builder]) => builder());

const results = [];
for (const task of tasks) {
  console.log(`\n=== ${task.id}: ${task.prompt.length} chars ===`);
  const result = await chat(task);
  results.push(result);
  console.log(
    JSON.stringify(
      {
        id: result.id,
        ok: result.ok,
        durationMs: result.durationMs,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        timings: result.timings,
        checks: result.checks,
        outputPreview: truncate(result.output, 1200),
      },
      null,
      2,
    ),
  );
}

const payload = {
  at: new Date().toISOString(),
  baseUrl,
  model,
  tasks: results,
};

mkdirSync(join(root, 'results'), { recursive: true });
writeFileSync(join(root, 'results', 'llama-cmoe-pressure-latest.json'), JSON.stringify(payload, null, 2) + '\n', 'utf8');
for (const result of results) {
  writeFileSync(
    join(root, 'results', `llama-cmoe-pressure-${result.id}.json`),
    JSON.stringify({ at: payload.at, baseUrl, model, task: result }, null, 2) + '\n',
    'utf8',
  );
}
console.log(`\nWrote ${join(root, 'results', 'llama-cmoe-pressure-latest.json')}`);

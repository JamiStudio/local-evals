#!/usr/bin/env node
/**
 * Direct LM Studio eval runner — no promptfoo/sqlite dependency.
 * Reads suites/promptfoo tests and writes results/promptfoo-latest.json
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { loadEvalEnv, renderPrompt } from './lib/env.mjs';

const { root } = loadEvalEnv();

const model = process.env.EVAL_SUBJECT_MODEL;
if (!model) {
  console.error('EVAL_SUBJECT_MODEL required');
  process.exit(1);
}

const baseUrl = (process.env.LMSTUDIO_BASE_URL ?? 'http://localhost:1234/v1').replace(/\/$/, '');
const prompts = {
  research: readFileSync(join(root, 'suites/promptfoo/prompts/research.txt'), 'utf8'),
  plan: readFileSync(join(root, 'suites/promptfoo/prompts/plan.txt'), 'utf8'),
  build: readFileSync(join(root, 'suites/promptfoo/prompts/build.txt'), 'utf8'),
  'tool-call': readFileSync(join(root, 'suites/promptfoo/prompts/tool-call.txt'), 'utf8'),
};

function loadTests(lane) {
  const raw = readFileSync(join(root, `suites/promptfoo/tests/${lane}.yaml`), 'utf8');
  return YAML.parse(raw);
}

function renderTemplate(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars ?? {})) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

async function chat(prompt) {
  const started = Date.now();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LMSTUDIO_API_KEY ?? 'lm-studio'}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 2048,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  const output = body.choices?.[0]?.message?.content ?? '';
  return { output, latencyMs: Date.now() - started, usage: body.usage };
}

function evalAssert(type, value, output, vars) {
  const text = String(output);
  switch (type) {
    case 'contains':
      return text.includes(value);
    case 'javascript': {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('output', 'vars', `return Boolean(${value})`);
        return fn(text, vars);
      } catch {
        return false;
      }
    }
    default:
      return true;
  }
}

const lanes = ['research', 'plan', 'build', 'tool-call'];
const results = [];

for (const lane of lanes) {
  const tests = loadTests(lane);
  const template = prompts[lane];
  for (const test of tests) {
    const prompt = renderTemplate(template, test.vars);
    const taskId = test.metadata?.taskId ?? test.description;
    console.log(`→ ${taskId}`);
    let output = '';
    let latencyMs = 0;
    let error = null;
    try {
      const r = await chat(prompt);
      output = test.options?.transform
        ? String(new Function('output', `return (${test.options.transform})`)(r.output))
        : r.output;
      latencyMs = r.latencyMs;
    } catch (e) {
      error = e.message;
    }

    const asserts = (test.assert ?? []).map((a) => ({
      ...a,
      pass: error ? false : evalAssert(a.type, a.value, output, test.vars),
    }));
    const pass = !error && asserts.every((a) => a.pass);
    results.push({
      testCase: { metadata: test.metadata, description: test.description, vars: test.vars },
      provider: { id: `lmstudio:${model}`, label: model },
      response: { output },
      latencyMs,
      success: pass,
      error,
      assertResults: asserts,
    });
    console.log(`  ${pass ? 'PASS' : 'FAIL'} ${latencyMs}ms`);
  }
}

const payload = {
  evalId: process.env.EVAL_RUN_ID ?? new Date().toISOString(),
  model,
  loadProfile: process.env.EVAL_LOAD_PROFILE,
  results: { results },
  stats: {
    passes: results.filter((r) => r.success).length,
    failures: results.filter((r) => !r.success).length,
    total: results.length,
  },
};

mkdirSync(join(root, 'results'), { recursive: true });
const outFile = join(root, 'results/promptfoo-latest.json');
writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`\nWrote ${outFile} — ${payload.stats.passes}/${payload.stats.total} passed`);
process.exit(payload.stats.failures > 0 ? 1 : 0);
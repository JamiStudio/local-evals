#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEvalEnv } from './lib/env.mjs';

const { root } = loadEvalEnv();

const baseUrl = (process.env.LMSTUDIO_BASE_URL ?? process.env.OPENAI_BASE_URL ?? 'http://127.0.0.1:8080/v1').replace(
  /\/$/,
  '',
);
const model = process.env.EVAL_SUBJECT_MODEL ?? 'unsloth/gemma-4-26B-A4B-it-qat-GGUF';
const repeatWords = Number(process.env.EVAL_PROBE_REPEAT_WORDS ?? 0);
const prompt =
  process.env.EVAL_PROBE_PROMPT ??
  (repeatWords > 0
    ? `${Array.from({ length: repeatWords }, (_, index) => `fact${index % 100}`).join(
        ' ',
      )}\n\nSummarize the repeated facts in one sentence.`
    : 'In exactly three concise bullet points, explain why CPU MoE offload can help an 8GB VRAM machine run a large MoE model.');
const maxTokens = Number(process.env.EVAL_PROBE_MAX_TOKENS ?? 160);
const temperature = Number(process.env.EVAL_PROBE_TEMPERATURE ?? 0.2);

const started = Date.now();
const response = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.LMSTUDIO_API_KEY ?? process.env.OPENAI_API_KEY ?? 'local'}`,
  },
  body: JSON.stringify({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxTokens,
  }),
});

let body;
try {
  body = await response.json();
} catch {
  body = { raw: await response.text() };
}

const durationMs = Date.now() - started;
if (!response.ok) {
  console.error(JSON.stringify({ ok: false, status: response.status, durationMs, body }, null, 2));
  process.exit(1);
}

const output = body.choices?.[0]?.message?.content ?? body.choices?.[0]?.text ?? '';
const reasoningOutput = body.choices?.[0]?.message?.reasoning_content ?? '';
const completionTokens = body.usage?.completion_tokens ?? null;
const promptTokens = body.usage?.prompt_tokens ?? null;
const approxOutputTokens = output.trim() ? output.trim().split(/\s+/).length : 0;
const measuredTokens = completionTokens ?? approxOutputTokens;
const tokensPerSecond = measuredTokens > 0 ? measuredTokens / (durationMs / 1000) : null;

const result = {
  at: new Date().toISOString(),
  ok: true,
  baseUrl,
  model,
  prompt: repeatWords > 0 ? `[generated repeat prompt: ${repeatWords} words]` : prompt,
  promptPreview: prompt.slice(0, 500),
  promptCharLength: prompt.length,
  durationMs,
  promptTokens,
  completionTokens,
  approxOutputTokens,
  tokensPerSecond,
  output,
  reasoningOutput,
  finishReason: body.choices?.[0]?.finish_reason ?? null,
  timings: body.timings ?? null,
  usage: body.usage ?? null,
};

mkdirSync(join(root, 'results'), { recursive: true });
writeFileSync(join(root, 'results', 'llama-cmoe-probe-latest.json'), JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(result, null, 2));

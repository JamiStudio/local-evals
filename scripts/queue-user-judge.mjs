#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(root, '.env') });

const resultsDir = join(root, 'results');
const queuePath = process.env.EVAL_USER_JUDGE_QUEUE_OUT
  ? join(root, process.env.EVAL_USER_JUDGE_QUEUE_OUT)
  : join(resultsDir, 'user-judge-queue.jsonl');
const comparisonPath = process.env.EVAL_BASELINE_COMPARISON_IN
  ? join(root, process.env.EVAL_BASELINE_COMPARISON_IN)
  : join(resultsDir, 'baseline-comparison.jsonl');
const reviewAll = (process.env.EVAL_USER_JUDGE_REVIEW_ALL ?? 'true') === 'true';

mkdirSync(resultsDir, { recursive: true });

let queue = [];

if (existsSync(comparisonPath)) {
  const lines = readFileSync(comparisonPath, 'utf8').trim().split('\n').filter(Boolean);
  queue = lines.map((line) => {
    const row = JSON.parse(line);
    return {
      ...row,
      reviewReason: row.hasBaseline ? 'baseline-comparison' : 'missing-baseline',
      status: 'pending_user_review',
    };
  });
  if (!reviewAll) {
    queue = queue.filter((row) => row.hasBaseline);
  }
} else {
  console.log(`No baseline comparison found at ${comparisonPath}. Run: pnpm compare:baseline`);
}

writeFileSync(queuePath, queue.map((r) => JSON.stringify(r)).join('\n') + (queue.length ? '\n' : ''), 'utf8');
console.log(`User-judge queue: ${queue.length} cases → ${queuePath}`);

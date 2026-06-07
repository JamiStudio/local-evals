# Running Local OSS Model Evals

Operator guide for the `evals` harness on Windows.

**Billing policy:** automated runs use LM Studio only. No direct paid API calls.
Baselines and primary judging happen outside the harness via subs or imported
Azure/Vertex credit outputs.

## Prerequisites

- LM Studio with `lms` CLI on PATH
- Node.js 20+
- Python 3.11+ and [uv](https://docs.astral.sh/uv/)
- Docker Desktop (optional — Langfuse OSS only; JSONL is primary)
- A subscription or Azure/Vertex credits for baseline collection (separate step)

## First-Time Setup

```powershell
cd C:\Users\james\projects\evals
Copy-Item .env.example .env
# Langfuse keys after langfuse:up — no OpenAI API key required

pnpm install
uv sync
pnpm registry:export
```

## Baselines (do this first)

**Automated (Vertex credits):**

```powershell
pnpm baseline:collect
```

**Manual (subs):** see `baseline-collection.md` — `pnpm baseline:prompts` then `pnpm baseline:import`.

## Results inspection (primary)

- `results/matrix-summary.json` — leaderboard
- `results/optimization-state.json` — resume checkpoint
- `results/user-judge-queue.jsonl` — review queue

Langfuse OSS (`pnpm langfuse:up`) is optional — requires Docker.

## LM Studio Server

```powershell
lms server start
lms ps
```

## Run Evals

### One-shot optimization cycle

```powershell
pnpm optimize:smoke
```

### Matrix smoke (automated, local only)

```powershell
pnpm matrix:smoke
```

Uses **Promptfoo** when `better-sqlite3` binding is present (default). Falls back to
`run-local-eval.mjs` if `EVAL_USE_PROMPTFOO=false` or binding missing. After `npm install`,
`pnpm ensure:sqlite` unpacks the prebuild if needed.

Runs 2 models × 2 load presets. Outputs:

- `results/matrix-<timestamp>.jsonl`
- `results/promptfoo-latest.json`
- `results/baseline-comparison.jsonl`
- `results/user-judge-queue.jsonl`

### Full matrix

```powershell
pnpm matrix:full
```

### Compare and review

```powershell
pnpm compare:baseline
pnpm judge:queue
```

Review local vs imported baseline in your sub UI or the queue file.

### DeepEval (local only)

```powershell
lms load liquid/lfm2.5-1.2b --gpu max -y
$env:EVAL_SUBJECT_MODEL = "liquid/lfm2.5-1.2b"
pnpm eval:deepeval
```

### Optional Azure credit judge

Only when `EVAL_ENABLE_AZURE_JUDGE=true`:

```powershell
pnpm eval:azure-judge
```

## Refresh Model Registry

```powershell
pnpm registry:export
```

## Stop Services

```powershell
lms unload --all
pnpm langfuse:down
```
# Large MoE Focused Eval Roadmap

**Date:** 2026-06-08
**Status:** Active focused roadmap for the large MoE / QAT comparison campaign.
**Parent context:** This is a contained-stream addendum to `docs/roadmaps/2026-06-07-contained-eval-streams-plan.md`. It does not replace the monolithic roadmap; it gives the goal orchestrator a concrete target for the new large-MoE work.

## Objective

Find whether a large Gemma 4 MoE/QAT model served through llama.cpp CPU-MoE is actually useful in this local workflow, compared against nearby single-GPU or LM Studio counterparts.

The goal is not to force a win. The goal is to find the practical sweet spots and produce evidence:

- pass/fail quality on the direct local workflow suite
- long-context retrieval pressure
- source-grounded compilation / review behavior
- throughput and stability on this 8GB GPU host
- whether the large model is worth its load compared with smaller local models

## Source Files

- Pair registry: `registry/large-moe-pairs.json`
- Sidecar operations: `docs/operations/llama-cmoe-sidecar.md`
- Focused eval operations: `docs/operations/large-moe-focused-evals.md`
- Fresh-session handoff: `docs/operations/large-moe-long-run-handoff.md`
- Active goal rules: `docs/engineering/agents/goal-eval.md`
- Orchestration reliability: `docs/engineering/agents/orchestration-reliability.md`

## Current Evidence

Known 26B CPU-MoE sidecar setup:

- Backend: llama.cpp `llama-server`
- Model: `unsloth/gemma-4-26B-A4B-it-qat-GGUF`
- File: `gemma-4-26B-A4B-it-qat-UD-Q4_K_XL.gguf`
- Context: `262144`
- Serving flags: `-cmoe -ngl auto -ctk q4_0 -ctv q4_0 -np 1 --cache-ram 0 --reasoning off`
- Endpoint: `http://127.0.0.1:8080/v1`

Observed evidence already produced:

- Full context server loaded successfully at `n_ctx=262144`.
- Direct full suite: `8/10`.
- Focused smoke wrapper: `build-synthetic-smoke` passed `1/1`.
- Long-context pressure previously found the 55k-token needle set.
- 58k-token generated prompt prefill was around 400 tokens/sec and decode was around 16 tokens/sec in prior sidecar pressure.

Current artifacts:

- `results/large-moe-smoke-gemma4-26b-a4b-qat-cpu-moe.json`
- `results/large-moe-smoke-summary.json`
- `results/large-moe-full-gemma4-26b-a4b-qat-cpu-moe.json`
- `results/large-moe-full-summary.json`
- `results/llama-cmoe-ctx262k-full-suite.json`
- `results/llama-cmoe-pressure-long-context-needle.json`
- `results/llama-cmoe-pressure-repo-evidence-audit.json`
- `results/llama-cmoe-pressure-harness-code-review.json`

Known full-suite failures for the 26B CPU-MoE sidecar:

- `research-synthetic-smoke`
- `tool-call-read-file`

## Model Pairs

The orchestrator must use `registry/large-moe-pairs.json` as the source of truth for the active pair list.

Primary pair:

- `gemma4-26b-a4b-qat-cpu-moe` through llama.cpp sidecar
- `google/gemma-4-12b` through LM Studio
- `google/gemma-4-12b-qat` through LM Studio
- optional sidecar counterpart: `unsloth/gemma-4-12B-it-qat-GGUF`

Secondary pair:

- optional sidecar candidate: `unsloth/gemma-4-31B-it-qat-GGUF`
- `google/gemma-4-31b` through LM Studio
- `google/gemma-4-31b-qat` through LM Studio

Control pair:

- `google/gemma-4-e4b`
- `google/gemma-4-e2b`

## Orchestration Rules

- The orchestrator stays active for the goal session.
- Subagents run the eval streams.
- The orchestrator polls in bounded intervals until terminal result, then assesses artifacts and dispatches the next stream.
- Only one GPU-bound local model-serving stream may run at a time.
- Stop `llama-server` before LM Studio load tests.
- Run `lms unload --all` before sidecar tests.
- Do not dispatch another GPU-bound stream while a sidecar or LM Studio model is loaded for eval.
- Parallel subagents are allowed only for non-GPU artifact review, docs, or analysis.
- Tune exactly one variable at a time, only after an artifact identifies a concrete failure class.
- Archive every meaningful output under `results/large-moe-*`.
- Do not promote a model from one filtered smoke task.
- Do not claim final promotion without user-review evidence.

## Stream Plan

### Stream 1: Sidecar Baseline Confirmation

Owner: one subagent.

Run:

```powershell
Set-Location C:\Users\james\projects\evals
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:8080/v1"
pnpm large-moe:smoke -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-26b-a4b-qat-cpu-moe
pnpm large-moe:full -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-26b-a4b-qat-cpu-moe
```

Exit criteria:

- New smoke/full artifacts exist under `results/large-moe-*`.
- Direct full-suite result is assessed against the prior `8/10`.
- Failures are listed by task and assertion, not summarized loosely.

Current status:

- Done once locally and by subagent.
- Latest observed full result: `8/10`.
- Still needs pressure rerun or explicit decision to reuse existing pressure artifacts.

### Stream 2: Sidecar Pressure Rerun

Owner: one subagent, only after confirming no other GPU-bound model server is running.

Run:

```powershell
Set-Location C:\Users\james\projects\evals
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:8080/v1"
$env:EVAL_SUBJECT_MODEL = "unsloth/gemma-4-26B-A4B-it-qat-GGUF"
pnpm llama:cmoe:pressure
```

Exit criteria:

- `results/llama-cmoe-pressure-latest.json` is refreshed.
- Per-task artifacts are refreshed.
- Needle, repo audit, and code review outputs are judged separately.
- Any failure class is tied to a proposed single-variable tweak or explicitly marked not worth tuning.

### Stream 3: 12B LM Studio Counterparts

Owner: one subagent, after sidecar is stopped.

Required preflight:

```powershell
Stop-Process -Name llama-server -Force -ErrorAction SilentlyContinue
lms unload --all
lms ps
nvidia-smi
```

Run focused smoke/full for:

- `gemma4-12b-lmstudio`
- `gemma4-12b-qat-lmstudio`

Exit criteria:

- Each counterpart has smoke/full artifacts under `results/large-moe-*`.
- Runtime facts are captured in the subagent report.
- Results are compared directly against 26B CPU-MoE `8/10`, including latency and failure classes.

### Stream 4: Primary Pair Decision

Owner: non-GPU analysis subagent or orchestrator assessment.

Inputs:

- Stream 1 artifacts
- Stream 2 pressure artifacts
- Stream 3 counterpart artifacts
- Existing baseline comparison and user-judge queue if relevant

Output:

- A decision doc under `docs/evals/`.

Required conclusions:

- Does the 26B CPU-MoE sidecar beat the 12B/12B-QAT counterparts on results alone?
- Does it beat them enough to justify memory/load complexity?
- Which tasks should use it, if any?
- Which tasks should stay on smaller local models?
- What is still user-review gated?

### Stream 5: 31B Optional Exploration

Run only if Stream 4 says the large-model lane is still promising.

Candidates:

- `gemma4-31b-qat-sidecar` if optional HF download is approved or already present
- `gemma4-31b-lmstudio`
- `gemma4-31b-qat-lmstudio`

Rules:

- Start with smoke only.
- Do not full-suite a 31B lane that cannot clear smoke cleanly.
- Stop after the first clear hardware/runtime blocker unless a single-variable tweak is obvious.

### Stream 6: E4B/E2B Control

Run as a control after the primary pair decision or if smaller models appear likely to dominate cost/performance.

Candidates:

- `gemma4-e4b-lmstudio`
- `gemma4-e2b-lmstudio`

Exit criteria:

- Establish whether smaller Gemma efficient variants already cover the deterministic retrieval/sorting/tool tasks well enough.
- Use this to prevent large-model enthusiasm from overriding measured quality.

### Stream 7: Final Large-MoE Scoreboard

Owner: analysis subagent or orchestrator.

Output:

- `docs/evals/<date>-large-moe-scoreboard.md`

Required table columns:

- candidate
- backend
- context
- smoke result
- full direct suite result
- pressure result
- average latency or observed throughput
- strongest tasks
- failure classes
- recommendation
- user-review status

## Tuning Policy

Allowed one-variable tweaks:

- context length
- reasoning on/off
- KV cache type
- `max_tokens`
- GPU layer placement
- CPU-MoE flag
- chat/template handling

Forbidden:

- broad config churn without an artifact-backed failure
- changing multiple variables in one rerun
- changing suite assertions to make a model pass
- running LM Studio and llama.cpp sidecar loads at the same time
- treating a timeout or partial artifact as a completed eval

## Completion Criteria

This focused roadmap is complete when:

- primary 26B CPU-MoE sidecar has current smoke/full/pressure artifacts
- 12B and 12B-QAT counterparts have current smoke/full artifacts
- one decision doc compares them on results alone and practical fit
- optional 31B exploration is either run or explicitly rejected with evidence
- E4B/E2B controls are either run or explicitly deferred with evidence
- final scoreboard exists under `docs/evals/`
- orchestrator has recorded any remaining user-review gates

Completion does not require claiming the large model is best. A well-supported "not worth it except for long-context retrieval" is a valid outcome.

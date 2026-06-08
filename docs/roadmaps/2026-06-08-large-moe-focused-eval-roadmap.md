# Large MoE Focused Eval Roadmap

**Date:** 2026-06-08
**Status:** Active focused roadmap for the large MoE / QAT comparison campaign.
**Source reports:** `docs/_legacy/research/2026-06-06-local-oss-model-evals-feasibility-report.md`, `docs/evals/2026-06-07-stream42-decision-ledger.md`, current `results/large-moe-*`, current `results/llama-cmoe-*`, and `registry/large-moe-pairs.json`.
**Owner:** Goal orchestrator in `docs/engineering/agents/goal-eval.md`; eval execution belongs to subagents.
**Surface:** Local eval harness only: `registry/`, `scripts/`, `suites/`, `results/`, `docs/evals/`, and focused large-MoE operations docs.
**Parent context:** This is the focused execution plan for large-MoE/QAT work inside the contained-stream campaign. For this lane, this file owns stream order, model-pair scope, artifact requirements, tuning gates, and completion criteria. The contained-stream roadmap owns broader campaign context only.

## Purpose

Find whether a large Gemma 4 MoE/QAT model served through llama.cpp CPU-MoE is actually useful in this local workflow compared with nearby LM Studio counterparts.

The goal is evidence, not a forced win:

- pass/fail quality on the direct local workflow suite
- long-context retrieval pressure
- source-grounded compilation and review behavior
- throughput and stability on this 8GB GPU host
- whether the large model is worth its load and process complexity compared with smaller local models

## Status Legend

- `[ ]` not started
- `[~]` in progress or waiting on a bounded follow-up
- `[x]` complete with artifact evidence listed in this roadmap
- `[!]` blocked, stale, or unsafe to run until the listed condition is resolved

## Source Files

- Pair registry: `registry/large-moe-pairs.json`
- Large-MoE runner: `scripts/run-large-moe-pairs.mjs`
- Sidecar pressure runner: `scripts/llama-cmoe-pressure.mjs`
- Direct local eval runner: `scripts/run-local-eval.mjs`
- Sidecar operations: `docs/operations/llama-cmoe-sidecar.md`
- Focused eval operations: `docs/operations/large-moe-focused-evals.md`
- Fresh-session handoff: `docs/operations/large-moe-long-run-handoff.md`
- Active goal rules: `docs/engineering/agents/goal-eval.md`
- Orchestration reliability: `docs/engineering/agents/orchestration-reliability.md`
- Planning standard: `docs/engineering/standards/planning-style.md`
- Docs standard: `docs/engineering/standards/docs-standards.md`

## Source Findings

Facts refreshed on 2026-06-08 at about 03:34 America/New_York from local commands and artifacts:

- `package.json` exposes `large-moe:list`, `large-moe:smoke`, `large-moe:full`, `llama:cmoe:server`, `llama:cmoe:probe`, `llama:cmoe:pressure`, `capture:system`, `capture:system:quick`, and `verify`.
- `pnpm -C C:\Users\james\projects\evals large-moe:list` matched `registry/large-moe-pairs.json`.
- `node --check scripts/run-large-moe-pairs.mjs` and `node --check scripts/llama-cmoe-pressure.mjs` returned cleanly.
- `scripts/run-large-moe-pairs.mjs` reads candidates from `registry/large-moe-pairs.json`, writes `results/large-moe-smoke-summary.json` or `results/large-moe-full-summary.json`, and copies `results/promptfoo-latest.json` to `results/large-moe-<mode>-<candidate>.json`.
- For `llama-server` candidates, `scripts/run-large-moe-pairs.mjs` sets `LMSTUDIO_BASE_URL` to the shell value or defaults to `http://127.0.0.1:8080/v1`.
- For LM Studio candidates, `scripts/run-large-moe-pairs.mjs` inherits the shell environment. If `LMSTUDIO_BASE_URL` is still set to the sidecar URL, the LM Studio comparison stream can be misrouted. Reset it to `http://localhost:1234/v1` before LM Studio counterpart runs.
- `nvidia-smi` at refresh showed `NVIDIA GeForce RTX 2080 Super with Max-Q Design`, 8192 MiB total, 6057 MiB used, 1939 MiB free, driver `610.47`, and `llama-server.exe` PID `3196` using the GPU.
- `Get-Process` showed `llama-server` PID `3196` at `C:\Users\james\tools\llama.cpp-b9544-cuda12.4\llama-server.exe`.
- `lms ps` did not return within the bounded diagnostic timeout. A standalone hung `lms.exe` CLI process from that diagnostic was stopped. The LM Studio application process remained untouched.
- `results/system-profile.json` and `registry/runtime-snapshot.json` were last modified on 2026-06-07 00:23:03 local time. Refresh them with `pnpm capture:system` before any tuning or load-profile changes.
- Current focused `results/large-moe-*` artifacts only cover `gemma4-26b-a4b-qat-cpu-moe`; no current focused artifacts were found for the 12B, 12B-QAT, 31B, E4B, or E2B candidates.

## Locked Decisions

- Automated eval runs in this repository use local LM Studio or local llama.cpp sidecar only. No direct paid API calls from the harness.
- `registry/large-moe-pairs.json` is the candidate source of truth. Do not hand-maintain a separate model list in this roadmap.
- The 26B sidecar baseline is compared against the current 12B and 12B-QAT LM Studio counterparts before any final 31B or control-model conclusion.
- One GPU-bound model-serving stream runs at a time. Do not overlap LM Studio model loads with `llama-server`.
- Every tuning change must alter exactly one variable and must be tied to a concrete artifact failure class.
- Do not change suite assertions to make a model pass.
- Do not count a timeout, missing `promptfoo-latest.json`, null pass total, fetch failure, or partial artifact as a completed eval.
- Do not promote from one filtered smoke task.
- Do not claim final promotion without user-review evidence.

## Scope Boundaries

- In scope: model evaluation, model-pair comparison, sidecar-vs-LM-Studio operational fit, result artifacts, user-review gates, decision docs, and scoreboard docs.
- Out of scope: implementing Harness, Hermes, Zavi, Studio runtime behavior, production routing, real shell/network tool side effects in eval suites, new paid API wiring, and unrelated model-matrix expansion.
- Optional HF downloads stay optional. Only use `EVAL_INCLUDE_OPTIONAL_DOWNLOADS=1` after explicit operator approval or visible local availability.
- Secrets stay in `.env` only. Do not write tokens into suites, fixtures, docs, committed results, or examples.
- Langfuse is not required for this lane. JSON artifacts are primary.

## Repo Guidance

- Use Windows PowerShell commands.
- Use `rg` first for repo search.
- Read live artifacts and source files before marking roadmap status.
- Capture runtime facts before tuning: `pnpm capture:system` or `pnpm capture:system:quick`, plus `nvidia-smi`, `lms ps`, and sidecar process/endpoint checks as relevant.
- If `lms ps` hangs or times out, record it as an unknown runtime state. Do not infer LM Studio is clean.
- Keep orchestration state in this roadmap so a resumed coordinator can continue without relying on chat context.
- Subagents run eval commands and commit/push stream outputs. The orchestrator assesses artifacts, updates checkpoints, and dispatches the next explicit stream.

## Target Harness Shape

The focused lane is complete when the repo contains:

- current direct smoke/full artifacts for the 26B sidecar and both 12B LM Studio counterparts
- current pressure artifacts for the 26B sidecar or a dated decision that the current pressure artifacts are accepted
- a decision doc under `docs/evals/` comparing primary candidates on result quality and practical fit
- a final scoreboard under `docs/evals/`
- explicit evidence-backed inclusion, rejection, or deferral of 31B optional exploration and E4B/E2B controls
- a roadmap checkpoint trail with agent ids, artifacts, verification, blockers, and next dispatches

## Current Artifact Evidence

| Artifact | Timestamp | Candidate / mode | Result | Evidence notes |
| --- | --- | --- | --- | --- |
| `results/large-moe-smoke-summary.json` | `2026-06-08T06:51:16.185Z` | `gemma4-26b-a4b-qat-cpu-moe`, smoke | status `0`, duration `6071ms` | Filtered `build-synthetic-smoke`; copied artifact is `results/large-moe-smoke-gemma4-26b-a4b-qat-cpu-moe.json`. |
| `results/large-moe-full-summary.json` | `2026-06-08T06:55:47.679Z` | `gemma4-26b-a4b-qat-cpu-moe`, full direct suite | status `1`, duration `159554ms`, stdout says `8/10 passed` | Failure status is expected because two direct tasks failed. |
| `results/llama-cmoe-ctx262k-full-suite.json` | `2026-06-08T06:37:48.246Z` | `unsloth/gemma-4-26B-A4B-it-qat-GGUF`, `llama_cmoe_ctx262k_q4kv_full_suite` | stats `8` passes, `2` failures, `10` total | Failed `research-synthetic-smoke` on assertion `String(output ?? '').includes('next')`; failed `tool-call-read-file` on assertion requiring both `gpu_full` and `gpu_offload`. |
| `results/llama-cmoe-pressure-latest.json` | `2026-06-08T07:07:30.564Z` | `unsloth/gemma-4-26B-A4B-it-qat-GGUF`, pressure suite | all three tasks returned HTTP `200` | Per-task artifacts listed below own detailed checks and output. |
| `results/llama-cmoe-pressure-long-context-needle.json` | `2026-06-08T07:07:30.564Z` | long-context needle | `ok: true`, duration `176612ms`, prompt tokens `55019`, completion tokens `178` | Checks `finds alpha`, `finds beta`, and `finds gamma` all passed; prompt throughput `336.5186` tokens/sec, decode `13.6669` tokens/sec. |
| `results/llama-cmoe-pressure-repo-evidence-audit.json` | `2026-06-08T07:07:30.564Z` | repo evidence audit | `ok: true`, duration `348436ms`, prompt tokens `78059`, completion tokens `732` | Output recommends not entering the local model shortlist yet; prompt throughput `281.7556` tokens/sec, decode `10.2829` tokens/sec. |
| `results/llama-cmoe-pressure-harness-code-review.json` | `2026-06-08T07:07:30.564Z` | harness code review | `ok: true`, duration `146237ms`, prompt tokens `18817`, completion tokens `957` | Output identifies concrete harness risks; prompt throughput `281.9491` tokens/sec, decode `12.0462` tokens/sec. |

## Known Unknowns And Runtime Risks

- `lms ps` timed out during refresh. Do not start LM Studio counterpart streams until LM Studio state is visible through a bounded check or equivalent process evidence.
- A `llama-server.exe` process, PID `3196`, is currently visible on the GPU. Do not stop it blindly. Confirm whether it is the intentional 26B sidecar for this campaign and whether any active run depends on it.
- `results/system-profile.json` and `registry/runtime-snapshot.json` are from 2026-06-07. They are not current enough for tuning decisions on 2026-06-08.
- Current pressure artifacts exist and are fresh relative to this roadmap refresh. A rerun is only justified if sidecar flags, prompt tasks, runner code, or model file changed after `2026-06-08T07:07:30.564Z`.
- User review is still required before any final promotion or routing recommendation.

## Model Pairs

The orchestrator must use `registry/large-moe-pairs.json` as the source of truth.

| Pair | Role | Candidate id | Backend | Model | Profile / context | Current focused artifact status |
| --- | --- | --- | --- | --- | --- | --- |
| `gemma4-26b-a4b-vs-12b` | MoE candidate | `gemma4-26b-a4b-qat-cpu-moe` | `llama-server` | `unsloth/gemma-4-26B-A4B-it-qat-GGUF` | `llama_cmoe_ctx262k_q4kv`, context `262144` | Smoke/full/pressure artifacts exist. |
| `gemma4-26b-a4b-vs-12b` | counterpart | `gemma4-12b-lmstudio` | `lmstudio` | `google/gemma-4-12b` | `gpu_partial_0.9` | Pending focused smoke/full. |
| `gemma4-26b-a4b-vs-12b` | counterpart | `gemma4-12b-qat-lmstudio` | `lmstudio` | `google/gemma-4-12b-qat` | `gpu_partial_0.95` | Pending focused smoke/full. |
| `gemma4-26b-a4b-vs-12b` | optional counterpart | `gemma4-12b-qat-sidecar` | `llama-server` | `unsloth/gemma-4-12B-it-qat-GGUF` | `llama_ctx262k_q4kv_no_cmoe`, context `262144` | Optional download; do not run without approval or visible local availability. |
| `gemma4-31b-qat-vs-31b` | optional MoE candidate | `gemma4-31b-qat-sidecar` | `llama-server` | `unsloth/gemma-4-31B-it-qat-GGUF` | `llama_ctx262k_q4kv_31b_qat`, context `262144` | Gated by primary-pair decision and optional download approval/availability. |
| `gemma4-31b-qat-vs-31b` | counterpart | `gemma4-31b-lmstudio` | `lmstudio` | `google/gemma-4-31b` | `gpu_offload` | Gated by primary-pair decision. |
| `gemma4-31b-qat-vs-31b` | counterpart | `gemma4-31b-qat-lmstudio` | `lmstudio` | `google/gemma-4-31b-qat` | `gpu_offload` | Gated by primary-pair decision. |
| `gemma4-e4b-vs-e2b-small-moe-control` | control | `gemma4-e4b-lmstudio` | `lmstudio` | `google/gemma-4-e4b` | `gpu_full` | Gated by primary-pair decision or explicit control need. |
| `gemma4-e4b-vs-e2b-small-moe-control` | control | `gemma4-e2b-lmstudio` | `lmstudio` | `google/gemma-4-e2b` | `gpu_full` | Gated by primary-pair decision or explicit control need. |

## Cross-Stream Dependency Map

1. Stream 0 refresh and runtime checkpoint must be current before dispatch.
2. Stream 1 and Stream 2 provide 26B sidecar baseline and pressure evidence.
3. Stream 3 depends on sidecar ownership being resolved and no GPU-bound sidecar eval running.
4. Stream 4 depends on Streams 1-3.
5. Stream 5 runs only if Stream 4 says 31B exploration is still worth the hardware time.
6. Stream 6 runs after Stream 4 or sooner only if Stream 4 cannot be answered without smaller controls.
7. Stream 7 depends on final decisions from Streams 4-6.

## Execution Ledger

Update this table immediately after dispatch and after terminal result. Never leave the only checkpoint in chat context.

| Stream | Status | Agent id | Dispatch / return | Artifacts | Verification | Blocker / next action |
| --- | --- | --- | --- | --- | --- | --- |
| Stream 0: Refresh and command audit | `[x]` | Codex local edit | 2026-06-08 | This roadmap | `package.json`, pair registry, runner source, `pnpm large-moe:list`, `node --check`, `nvidia-smi`, `Get-Process`, current artifacts read | Next dispatch is Stream 3 only after sidecar ownership and LM Studio state are clear. |
| Stream 1: 26B sidecar smoke/full | `[x]` | not recorded in previous roadmap | Returned before this refresh | `results/large-moe-smoke-summary.json`, `results/large-moe-full-summary.json`, `results/llama-cmoe-ctx262k-full-suite.json` | Artifact read confirms `1/1` smoke and `8/10` full | No rerun unless runner, suite, sidecar flags, model file, or artifact freshness changes. |
| Stream 2: 26B sidecar pressure | `[x]` | not recorded in previous roadmap | Returned before this refresh | `results/llama-cmoe-pressure-latest.json`, `results/llama-cmoe-pressure-long-context-needle.json`, `results/llama-cmoe-pressure-repo-evidence-audit.json`, `results/llama-cmoe-pressure-harness-code-review.json` | Artifact read confirms all three pressure tasks returned HTTP `200` | Do not rerun without a specific freshness reason. |
| Stream 3: 12B LM Studio counterparts | `[!]` | TBD | TBD | Pending | Must capture `lms ps`, `nvidia-smi`, and counterpart smoke/full artifacts | Blocked until live `llama-server` PID `3196` ownership is confirmed and LM Studio state is visible. |
| Stream 4: Primary pair decision | `[ ]` | TBD | TBD | Pending decision doc under `docs/evals/` | Requires Stream 3 artifacts | Next after Stream 3. |
| Stream 5: 31B optional exploration | `[ ]` | TBD | TBD | Pending | Requires Stream 4 saying 31B is worth testing | Gated; optional HF downloads require approval or visible local availability. |
| Stream 6: E4B/E2B controls | `[ ]` | TBD | TBD | Pending | Requires control smoke/full or explicit evidence-backed deferral | Gated by Stream 4 or explicit control need. |
| Stream 7: Final scoreboard | `[ ]` | TBD | TBD | Pending `docs/evals/<date>-large-moe-scoreboard.md` | Requires final artifact table, decision gates, `git diff --check` | Final closeout. |

## Common Preflight For GPU-Bound Streams

Run these before each GPU-bound stream and paste the relevant facts into the ledger:

```powershell
Set-Location C:\Users\james\projects\evals
Get-Date
git status --short
Get-Process -Name llama-server -ErrorAction SilentlyContinue | Select-Object ProcessName,Id,StartTime,Path
nvidia-smi
lms ps
```

If `lms ps` times out, record the timeout and do not infer clean LM Studio state. Use bounded waits in the orchestrator; do not leave a hung diagnostic process behind.

Before any tuning or load-profile change:

```powershell
Set-Location C:\Users\james\projects\evals
pnpm capture:system
```

If a stream only reads artifacts or writes docs, do not run GPU-bound commands.

## Workstream 1: 26B Sidecar Baseline Confirmation

Goal: Confirm the already-running 26B CPU-MoE sidecar direct smoke/full evidence and classify failures.

Depends on:

- `[x]` `registry/large-moe-pairs.json` includes `gemma4-26b-a4b-qat-cpu-moe`.
- `[x]` Sidecar endpoint is intended to serve `http://127.0.0.1:8080/v1`.

Primary areas:

- `registry/large-moe-pairs.json`
- `scripts/run-large-moe-pairs.mjs`
- `results/large-moe-*`
- `results/llama-cmoe-ctx262k-full-suite.json`

Run only if the current artifacts are stale:

```powershell
Set-Location C:\Users\james\projects\evals
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:8080/v1"
pnpm large-moe:smoke -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-26b-a4b-qat-cpu-moe
pnpm large-moe:full -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-26b-a4b-qat-cpu-moe
```

Current exit status:

- `[x]` `results/large-moe-smoke-summary.json` exists and records `1/1` filtered smoke pass.
- `[x]` `results/large-moe-full-summary.json` exists and records full-suite status `1` with stdout `8/10 passed`.
- `[x]` `results/llama-cmoe-ctx262k-full-suite.json` records failures by task and assertion.
- `[x]` Known direct failures are `research-synthetic-smoke` and `tool-call-read-file`.

Failure classification:

- `research-synthetic-smoke`: deterministic assertion failure; output did not satisfy `String(output ?? '').includes('next')`.
- `tool-call-read-file`: deterministic assertion failure; output did not include both `gpu_full` and `gpu_offload`.

## Workstream 2: 26B Sidecar Pressure Evidence

Goal: Confirm or refresh long-context, repo-audit, and code-review pressure evidence for the 26B CPU-MoE sidecar.

Depends on:

- `[x]` Stream 1 sidecar baseline is available.
- `[x]` Sidecar endpoint is intended to serve `http://127.0.0.1:8080/v1`.

Primary areas:

- `scripts/llama-cmoe-pressure.mjs`
- `results/llama-cmoe-pressure-latest.json`
- `results/llama-cmoe-pressure-*.json`

Run only if the current pressure artifacts are stale:

```powershell
Set-Location C:\Users\james\projects\evals
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:8080/v1"
$env:EVAL_SUBJECT_MODEL = "unsloth/gemma-4-26B-A4B-it-qat-GGUF"
pnpm llama:cmoe:pressure
```

Current exit status:

- `[x]` `results/llama-cmoe-pressure-latest.json` exists with timestamp `2026-06-08T07:07:30.564Z`.
- `[x]` `long-context-needle` returned HTTP `200`, `ok: true`, and all three explicit checks passed.
- `[x]` `repo-evidence-audit` returned HTTP `200`, `ok: true`.
- `[x]` `harness-code-review` returned HTTP `200`, `ok: true`.
- `[x]` Pressure throughput is recorded per task in the artifacts.

Current interpretation:

- Do not rerun this stream unless a source-truth change makes the artifacts stale.
- The repo-audit pressure output itself recommends not entering the local shortlist yet. Treat that as reviewable evidence, not an automated final decision.

## Workstream 3: 12B LM Studio Counterparts

Goal: Run current smoke/full direct-suite artifacts for the primary LM Studio counterparts and compare them directly against the 26B sidecar.

Depends on:

- `[x]` Streams 1 and 2 are artifact-backed.
- `[!]` The live `llama-server` PID `3196` is confirmed idle and safe to stop, or an operator explicitly leaves it running and defers this stream.
- `[!]` `lms ps` or equivalent visible process/runtime evidence confirms LM Studio state.

Primary areas:

- `registry/large-moe-pairs.json`
- `scripts/run-large-moe-pairs.mjs`
- `results/large-moe-*`

Required preflight:

```powershell
Set-Location C:\Users\james\projects\evals
Get-Process -Name llama-server -ErrorAction SilentlyContinue | Select-Object ProcessName,Id,StartTime,Path
nvidia-smi
lms ps
```

Only after confirming no active sidecar eval depends on the running `llama-server`:

```powershell
Stop-Process -Name llama-server -Force -ErrorAction Stop
lms unload --all
lms ps
nvidia-smi
```

Reset the endpoint for LM Studio candidates so the inherited sidecar URL cannot leak into the run:

```powershell
$env:LMSTUDIO_BASE_URL = "http://localhost:1234/v1"
```

Run `google/gemma-4-12b`:

```powershell
pnpm large-moe:smoke -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-12b-lmstudio
pnpm large-moe:full -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-12b-lmstudio
```

Run `google/gemma-4-12b-qat`:

```powershell
pnpm large-moe:smoke -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-12b-qat-lmstudio
pnpm large-moe:full -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-12b-qat-lmstudio
```

Exit criteria:

- `[ ]` `results/large-moe-smoke-gemma4-12b-lmstudio.json` exists and is summarized.
- `[ ]` `results/large-moe-full-gemma4-12b-lmstudio.json` exists and is summarized.
- `[ ]` `results/large-moe-smoke-gemma4-12b-qat-lmstudio.json` exists and is summarized.
- `[ ]` `results/large-moe-full-gemma4-12b-qat-lmstudio.json` exists and is summarized.
- `[ ]` Runtime facts are recorded: `lms ps`, `nvidia-smi`, endpoint value, loaded model, and duration.
- `[ ]` Failures are listed by task and assertion.
- `[ ]` Results are compared against 26B sidecar `8/10`, including duration and failure classes.
- `[ ]` LM Studio closeout state is recorded with `lms unload --all`, `lms ps`, and `nvidia-smi`, unless an intentional loaded-model continuation is recorded.

## Workstream 4: Primary Pair Decision

Goal: Decide the primary pair using current artifacts, not preference or stale roadmap prose.

Depends on:

- `[x]` 26B sidecar smoke/full evidence.
- `[x]` 26B sidecar pressure evidence.
- `[ ]` 12B LM Studio counterpart smoke/full evidence.
- `[ ]` 12B-QAT LM Studio counterpart smoke/full evidence.

Primary areas:

- `docs/evals/`
- `results/large-moe-*`
- `results/llama-cmoe-*`
- `registry/large-moe-pairs.json`

Output:

- `docs/evals/<date>-large-moe-primary-pair-decision.md`

Required decision sections:

- Evidence table with artifact paths and timestamps.
- Direct full-suite comparison by pass count, failed tasks, failed assertions, and duration.
- Pressure-task comparison for any candidate with pressure artifacts.
- Practical-fit comparison: process complexity, endpoint risk, load/unload burden, VRAM state, and throughput.
- User-review status.
- Recommendation by task class, not just by model name.

Decision rubric:

- A candidate must match or beat `8/10` on the direct full suite before any primary-lane promotion is considered.
- A candidate must pass long-context needle pressure before any long-context routing recommendation is considered.
- A candidate that ties pass count but is materially slower or operationally riskier is not the default recommendation unless it has a unique pressure or quality win.
- If 12B or 12B-QAT matches the 26B direct-suite result with simpler LM Studio operations, the 26B sidecar can only be recommended for tasks where the pressure artifacts show a unique advantage.
- If all candidates fail the same deterministic task, mark the task as suite/model-output review needed rather than tuning randomly.
- If user-review evidence is absent, the decision doc must say "user-review gated" for any subjective quality claim.
- No absolute latency ceiling is defined in repo policy. Use measured paired comparison and explicitly state the tradeoff instead of inventing a threshold.

## Workstream 5: 31B Optional Exploration

Goal: Test 31B lanes only if the primary-pair decision says additional large-model exploration is worth the hardware time.

Depends on:

- `[ ]` Stream 4 decision says 31B is still promising or explicitly needed for the final scoreboard.
- `[!]` Optional HF download approval or visible local availability for `gemma4-31b-qat-sidecar`.

Primary areas:

- `registry/large-moe-pairs.json`
- `results/large-moe-*`

LM Studio candidates:

```powershell
Set-Location C:\Users\james\projects\evals
$env:LMSTUDIO_BASE_URL = "http://localhost:1234/v1"
lms unload --all
lms ps
nvidia-smi
pnpm large-moe:smoke -- --pair=gemma4-31b-qat-vs-31b --candidate=gemma4-31b-lmstudio
pnpm large-moe:smoke -- --pair=gemma4-31b-qat-vs-31b --candidate=gemma4-31b-qat-lmstudio
```

Optional sidecar candidate, only after approval/availability and after LM Studio is unloaded:

```powershell
Set-Location C:\Users\james\projects\evals
$env:EVAL_INCLUDE_OPTIONAL_DOWNLOADS = "1"
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:8080/v1"
pnpm large-moe:smoke -- --pair=gemma4-31b-qat-vs-31b --candidate=gemma4-31b-qat-sidecar
```

Rules:

- Start with smoke only.
- Do not full-suite a 31B lane that cannot clear smoke cleanly.
- Stop after the first clear hardware/runtime blocker unless a single-variable tweak is tied to the failure.
- If a 31B run times out, returns empty output, fetch-fails, or leaves no pass total, classify it as runtime-limited rather than incomplete success.

## Workstream 6: E4B/E2B Control

Goal: Establish whether smaller Gemma efficient variants already cover deterministic retrieval, sorting, and tool-like tasks well enough to make large-model enthusiasm unjustified.

Depends on:

- `[ ]` Stream 4 says controls are needed, or Stream 4 cannot make a practical recommendation without them.

Primary areas:

- `registry/large-moe-pairs.json`
- `results/large-moe-*`

Run controls:

```powershell
Set-Location C:\Users\james\projects\evals
$env:LMSTUDIO_BASE_URL = "http://localhost:1234/v1"
lms unload --all
lms ps
nvidia-smi
pnpm large-moe:smoke -- --pair=gemma4-e4b-vs-e2b-small-moe-control --candidate=gemma4-e4b-lmstudio
pnpm large-moe:full -- --pair=gemma4-e4b-vs-e2b-small-moe-control --candidate=gemma4-e4b-lmstudio
pnpm large-moe:smoke -- --pair=gemma4-e4b-vs-e2b-small-moe-control --candidate=gemma4-e2b-lmstudio
pnpm large-moe:full -- --pair=gemma4-e4b-vs-e2b-small-moe-control --candidate=gemma4-e2b-lmstudio
```

Exit criteria:

- `[ ]` Each control has current smoke/full artifacts or an explicit evidence-backed deferral.
- `[ ]` Control outputs are compared against primary-pair failures, not only pass counts.
- `[ ]` The final decision records whether small controls are sufficient for deterministic tasks.

## Workstream 7: Final Large-MoE Scoreboard

Goal: Produce the final focused scoreboard and close out the lane without overclaiming.

Depends on:

- `[x]` Streams 1 and 2.
- `[ ]` Stream 3.
- `[ ]` Stream 4.
- `[ ]` Stream 5 run or evidence-backed rejection.
- `[ ]` Stream 6 run or evidence-backed deferral.

Output:

- `docs/evals/<date>-large-moe-scoreboard.md`

Required table columns:

- candidate
- backend
- model id
- profile/context
- command
- artifact path
- artifact timestamp
- smoke result
- full direct-suite result
- pressure result
- average latency or observed throughput
- strongest tasks
- failure classes
- practical-fit recommendation
- user-review status

Required closeout notes:

- what was tested
- what was not tested and why
- which artifacts are current
- which artifacts are stale or superseded
- whether any live model server remains intentionally loaded
- whether user review is still needed

## Failure Taxonomy

Every failed task or stream must use one or more of these labels:

- `assertion_failure`: model returned output, but deterministic suite assertions failed.
- `timeout`: command exceeded the stream cap.
- `fetch_or_transport`: endpoint call failed, server disconnected, or fetch failed.
- `missing_or_stale_artifact`: expected result file missing, empty, or older than the command run.
- `null_pass_total`: runner returned no usable pass/total count.
- `template_or_chat_format`: output suggests wrong prompt template, role handling, or chat formatting.
- `tool_call_shape`: tool-like output omitted required fields, paths, profiles, or action structure.
- `source_grounding`: output did not cite or use provided source facts.
- `context_retrieval`: long-context task failed to recover explicit needles or evidence.
- `refusal_or_safety_mismatch`: refusal or safety behavior blocked an allowed local eval task.
- `runtime_contention`: LM Studio, sidecar, GPU, or process state was not clean enough to trust the run.
- `user_review_gated`: deterministic checks passed or partially passed, but quality needs human judgment.

## Artifact Freshness Rules

An artifact is current only if:

- it was generated after the latest relevant change to runner code, suite prompts/assertions, model file, sidecar flags, load profile, endpoint, or candidate registry entry
- its timestamp is recorded in this roadmap or a decision doc
- the command that generated it is known or reconstructable from the runner summary
- it contains a completed result, not a timeout/partial/null-count state unless the purpose was to prove that failure mode

An artifact is stale if any of those conditions is false. Mark stale artifacts explicitly rather than silently rerunning broad suites.

## Tuning Policy

Allowed one-variable tweaks:

- context length
- reasoning on/off
- KV cache type
- `max_tokens`
- GPU layer placement
- CPU-MoE flag
- chat/template handling

Required before any tweak:

- current `pnpm capture:system` output in `results/system-profile.json` and `registry/runtime-snapshot.json`
- exact source artifact and failure taxonomy label
- one stated hypothesis
- one command that changes only the chosen variable
- before/after artifact paths

Forbidden:

- broad config churn without an artifact-backed failure
- changing multiple variables in one rerun
- changing suite assertions to make a model pass
- running LM Studio and llama.cpp sidecar loads at the same time
- treating a timeout or partial artifact as a completed eval
- promoting a candidate from filtered smoke only

## Final Verification And Closeout

Before closing this roadmap:

```powershell
Set-Location C:\Users\james\projects\evals
pnpm large-moe:list
node --check scripts/run-large-moe-pairs.mjs
node --check scripts/llama-cmoe-pressure.mjs
node --check scripts/run-local-eval.mjs
git diff --check
nvidia-smi
lms ps
Get-Process -Name llama-server -ErrorAction SilentlyContinue | Select-Object ProcessName,Id,StartTime,Path
```

Also read back:

- this roadmap
- the primary decision doc
- the final scoreboard
- every artifact referenced by the scoreboard

Closeout must record:

- changed files
- exact verification commands and outcomes
- unavailable commands or timed-out diagnostics
- loaded model/server state left behind intentionally or cleaned up
- remaining user-review gates
- commit SHA and push status when a stream is executed by subagents

## Acceptance Criteria

This focused roadmap is complete when:

- `[x]` primary 26B CPU-MoE sidecar has current smoke/full/pressure artifacts
- `[ ]` 12B and 12B-QAT counterparts have current smoke/full artifacts
- `[ ]` one decision doc compares the primary pair on results and practical fit
- `[ ]` optional 31B exploration is either run or explicitly rejected with evidence
- `[ ]` E4B/E2B controls are either run or explicitly deferred with evidence
- `[ ]` final scoreboard exists under `docs/evals/`
- `[ ]` orchestrator has recorded all remaining user-review gates
- `[ ]` final verification and closeout commands are recorded

Completion does not require claiming the large model is best. A well-supported "not worth it except for long-context retrieval" is a valid outcome.

## Implementation Order

1. Resolve current live runtime state: identify whether `llama-server` PID `3196` is an intentional sidecar to keep or safe to stop; get bounded LM Studio state evidence.
2. Run Stream 3 for `gemma4-12b-lmstudio` and `gemma4-12b-qat-lmstudio`.
3. Write Stream 4 primary-pair decision under `docs/evals/`.
4. Decide whether Stream 5 31B exploration is justified. Run only smoke if justified; otherwise record evidence-backed rejection.
5. Decide whether Stream 6 controls are necessary. Run or defer with evidence.
6. Write Stream 7 final scoreboard.
7. Run final verification and update this roadmap ledger.

## Expansion Track

Only after this focused lane is complete:

- optional 12B QAT sidecar counterpart if the primary decision needs packaging parity
- optional 31B sidecar tuning if hardware/runtime evidence says a single-variable tweak is justified
- Promptfoo full-suite comparison if direct-suite and pressure evidence show a candidate is worth the longer path

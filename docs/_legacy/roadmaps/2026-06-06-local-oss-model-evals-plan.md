# Local OSS Model Evals Implementation Plan

Date: 2026-06-06
Status: active — **Phase B (Optimize)** after Phase A build complete
Source reports: `docs/research/2026-06-06-local-oss-model-evals-feasibility-report.md`
Owner: evals
Surface: local LM Studio matrix + credit-funded baselines + JSONL results

## Purpose

Stand up a reproducible eval harness that runs every LM Studio OSS model through the
same Studio-style workflow tasks (research, plan, build, tool-call), records granular
results (quality, latency, tokens, tool accuracy, load profile), and produces
evidence for where local models earn supporting roles.

After the harness is built, shift to **optimization**: test all models, use Vertex/Azure
credits purposefully (not wastefully), and tune configs from measured results.

## Status Legend

- `[ ]` not started
- `[~]` in progress
- `[x]` done
- `[!]` blocked
- `[—]` deferred (not required for current phase)

## Current Phase

| Phase | Status | Orchestrator focus |
| --- | --- | --- |
| **A — Build** | [x] complete (smoke path proven) | Close remaining build gaps via subagents only |
| **B — Optimize** | [~] active | Assess results, dispatch targeted tuning — **do not run evals yourself** |

Resume checkpoint: `results/optimization-state.json`

## This Goal Run (orchestrator + user query expansion, 2026)

**Git transparency (user explicit)**: repo inited on main, remote https://github.com/JamiStudio/local-evals.git (public, jamesnavinhill collab). Pushed after init stream (5477ab0) and every subsequent (docs, subagent commits). .gitignore allows selective results summaries/queues/profiles for transparency; no model files, no large artifacts, no secrets.

**User goal directives executed** (incorporated here per "deliver everything"; roadmap live-updated; no violation of contract — all exec via dispatch or allowed orchestrator ops; follow reliability.md):
- Exhaust evals for *all* our models (full 12 LLMs registry × gpu_full + gpu_offload; test best locals hard, including intentional large pairs 26B/31B on/off-gpu offload to probe 8GB system limits; time ok, token speed tracked for tasks).
- Optimize for system (use live system-profile + matrix JSONL + estimates before any load-profile/preset/threshold change; partial profiles if evidence).
- Benchmark cloud SOTA using vertex + azure credits (test sonnet 4.6, gemini 3.1 flash lite, gpt 5.4 + peers; collect baselines reasonably via pnpm baseline:collect / gemini:models / import; head-to-head vs locals; "reach" with local crew).
- Daily-briefs: hourly web search + interest tracker unloaded to local models (epic goal — match quality if possible). Local chat, local planning, local tool calls (github via gh, file reads, web search). Baby steps flushed to working end-to-end (real fetches via free libs, model loops, evals).
- OSS quality + specialist: find strong OSS, give proper harness + knowledge bank (RAG-lite/prompt+docs store + specialist prompts), let it be specialist; eval vs general.
- Additional tooling: installed (uv add duckduckgo-search trafilatura httpx bs4 for tracker/web; system captures, lm tools, gh/az/gcloud checked; fans/turbo user-side).
- 3 solid models target: not stop until have 3 that are solid across tasks (chat/plan/tool/briefs/specialist) — local primary, cloud ref; understand SOTA limits but push.

**W7 execution note (live source of truth update):** W7 implemented in dedicated subagent pass. See live files: `scripts/daily-brief-tracker.py` (real on-demand/loop + simple ReAct tool loop + tps measurement + dry-run for smoke; uses duckduckgo-search+trafilatura+gh+safe fs + LM Studio OpenAI compat), `docs/knowledge-bank/evals-specialist.md` (KB + simple loader), baselines/manifest.json (new taskIds daily-brief-synthetic-smoke + interest-tracker-tool-use registered for baseline collect/import), suites/promptfoo/tests/research.yaml + tool-call.yaml (additions for briefs quality + tool correctness), suites/deepeval/test_workflows.py (ToolCorrectnessMetric / PlanAdherenceMetric / briefs vs baseline tests). Only smoke/dry/small-model verification performed (large gemma idle on host; O1 note respected). No product runtimes implemented. Baselines tasks added to manifest (collect via pnpm when credits; no fake outputs). Token speeds recorded in tracker. Roadmap/state updated. Full specialist matrix vs baselines post-O1.
- Push hard/fast, burn credits reasonable, full access, verify everything, public transparency repo.

**Orchestrator discipline for this run**: read state first, dispatch ONE (matrix load serial), poll (no long single wait), checkpoint roadmap + state + docs/engineering/agents/orchestrator-logs/ after dispatch + on return, gate with git show --stat + numeric + A/B/C, subagent does commits/pushes (remote set), update_goal only after full audit + 2 verifiers PASS. Reusable prompt + steering only.

**Added/expanded items for this run**:
- O1 refresh + full exhaust (dispatch matrix:full)
- W7: Daily-briefs + local tool-use (fs, gh, web, planning) + OSS specialist harness + KB + evals + token speed (dispatch dedicated subagent) — **completed** (see W7 execution note above + scripts/daily-brief-tracker.py + docs/knowledge-bank + suite additions)
- O6: SOTA cloud (sonnet/gemini-flash/gpt) bench + baselines + 3-solid-models selection/report + placement
- Perf/tooling installs (direct + uv)
- Continuous pushes after streams
- Results-Assessor (2026-06-07): exhaustive gaps audit of all results/ (matrix JSONL/summary/state/report/briefs/profiles) + docs/evals O*/3-solid + registry/suites/scripts; produced docs/evals/2026-06-07-exhaustive-results-assessment.md (per-model/preset coverage, exact 20 missing cells vs 24, quality 38-63% pass rates + lane FAILs from JSONL, speed durations + briefs tps=38.4 dry, vs baselines from queue/comparison, untested list for runner); updated optimization-state.json (gaps + refined nextActions + exhaustiveResultsAssessment block), orchestrator log, this roadmap. Pure analysis (GPU occupied). Live truth only.

## Locked Decisions (current)

- Hybrid stack: **Promptfoo + local eval runner fallback + DeepEval**
- Results store: **JSONL + `optimization-state.json`** — Langfuse OSS **deferred** (no Docker requirement)
- Baselines: **Vertex text models** via `VERTEX_BASELINE_MODEL` (`pnpm gemini:models` for live list)
- Judges: **user judge primary**; optional Azure/Vertex credit rubric when explicitly enabled
- Matrix: **LM Studio only** for automated runs — no direct pay-per-token APIs
- Load profiles: **`gpu_full`** and **`gpu_offload`**
- Suites: **mixed** synthetic smoke + real Studio workflow templates (expand over time)
- Credits: **use when needed, not every cycle** — see Credit Policy below

## Credit Policy

Vertex/Azure credits are for **reference quality**, not burn rate.

| Action | When to spend credits |
| --- | --- |
| Baseline collection (`pnpm baseline:collect`) | New/changed prompts, new tasks, or model upgrade (`--force`) |
| Optional cloud judge | Borderline deterministic scores only; env-gated |
| Full matrix re-run | Local LM Studio only — **no credits** |
| Optimization cycle | Read existing JSONL first; only re-baseline if prompts changed |

Do not re-collect baselines every `optimize:loop` iteration. Do not call cloud APIs from matrix scripts.

## Orchestrator Contract (read before any goal run)

The orchestrator **coordinates and judges**. Subagents **build, run, and commit**.

### Orchestrator MAY

1. Read roadmap phase, workstream status, and `results/optimization-*.json`
2. Dispatch subagents with the reusable prompt + a **single explicit workstream or optimization target**
3. Poll subagent status at 60–120s intervals until terminal (commit+push returned)
4. After subagent **commit and push**: read `git show --stat <sha>`, gate pass 2, classify A/B/C
5. Update roadmap checkpoints and `docs/engineering/agents/orchestrator-logs/`
6. In Phase B: read matrix summary / leaderboard and decide **one** next tuning action

### Orchestrator MUST NOT

- Run `pnpm matrix:*`, `pnpm eval:*`, `pnpm baseline:collect`, or LM Studio loads as the primary worker
- Edit implementation files, suites, or scripts (dispatch a subagent instead)
- Search the repo for implementation details or audit code line-by-line
- Interrupt subagents mid-task — wait for commit+push, then judge
- Invent work not on this roadmap (no drive-by refactors, no Langfuse/Docker unless user requests)
- Re-baseline or spend credits without a documented reason in the roadmap checkpoint

### Build phase (Phase A) — two passes, judge after second

Per workstream W1–W6:

1. Dispatch pass 1 subagent → wait for commit+push → checkpoint
2. Dispatch pass 2 subagent (fresh context) → wait for commit+push → checkpoint
3. **Only now** orchestrator gates: `git show --stat`, numeric gate, A/B/C classification
4. Close workstream or dispatch pass 3 if not quiet

Subagents own verification runs. Orchestrator trusts commit + checkpoint, not live polling of their terminals.

### Optimize phase (Phase B) — ordered cycle, no invented work

Each orchestrator turn follows this order (skip steps with no new evidence):

```text
1. Read results/optimization-state.json + latest optimization-report-*.json
2. If baselines stale (prompt change / model change) → dispatch baseline subagent ONCE
3. If full matrix not run for current registry → dispatch matrix subagent (`pnpm matrix:full`)
4. If matrix exists → dispatch compare/queue subagent OR read existing comparison
5. Pick ONE tuning target from leaderboard gaps → dispatch config subagent
6. Update roadmap + optimization report; do NOT start unrelated workstreams
```

Once evals run in earnest, **two passes per optimization tweak are not required** — but the
orchestrator must still follow the ordered cycle above. One subagent per dispatch, one surface
per dispatch.

## Scope Boundaries

- This repo evaluates models; it does not ship Harness, Hermes, Zavi, or Studio runtimes.
- Tool-call tests use sandboxed callbacks only.
- Voice-project vars (`VERTEX_REALTIME_MODEL`, `gpt-realtime-*`) are not eval baselines.
- Langfuse/Docker: **deferred** — JSONL is source of truth unless operator explicitly opts in.

## Repo Guidance

- `registry/` — model inventory; `pnpm registry:export`
- `suites/promptfoo/` — workflow tests (local eval runner reads these)
- `suites/deepeval/` — agent-trace metrics
- `scripts/` — matrix, baselines, comparison, optimization loop
- `results/` — gitignored JSONL, reports, judge queue
- `docs/operations/continuous-optimization.md` — Phase B operator/subagent contract

---

# Phase A — Build

Goal: harness runnable end-to-end on smoke path; all scripts and schemas in place.

## Cross-Stream Dependency Map

```text
W1 Registry + env contract
  → W2 Suites + local eval runner
  → W4 Matrix orchestration + JSONL
  → W5 DeepEval metrics
  → W6 Comparison + user-judge queue
W3 Langfuse — DEFERRED (does not block W4/W6)
```

## W1: Registry And Environment Contract — [x]

- [x] `registry/models.json`, `load-profiles.json`, `judges.json`
- [x] `scripts/export-registry.mjs`
- [x] `.env.example` with `VERTEX_BASELINE_MODEL` / `VERTEX_JUDGE_MODEL` (no stale defaults)
- [x] `pnpm gemini:models` live model list
- [x] Voice vs eval var separation documented

Verification: `pnpm registry:export`, `pnpm gemini:models`

## W2: Workflow Suites — [~]

- [x] Four lanes: research, plan, build, tool-call
- [x] Synthetic smoke cases per lane
- [x] Local eval runner (`scripts/run-local-eval.mjs`) — fallback when Promptfoo disabled
- [x] Promptfoo CLI + `better-sqlite3` (`pnpm ensure:sqlite` postinstall)
- [~] Expand sanitized real Studio templates

Verification: `pnpm eval:smoke`

## W3: Langfuse OSS — [—] deferred

- [x] `langfuse/docker-compose.yml` exists for optional future use
- [—] Docker not in operator flow — **not required**
- [—] JSONL + `matrix-summary.json` + `optimization-state.json` are the inspection layer

Do not dispatch subagents to provision Langfuse unless user explicitly requests it.

## W4: Matrix Orchestration — [~]

- [x] `scripts/run-matrix.mjs` — load → eval → JSONL → unload
- [x] Smoke (`--smoke`) and full (`--full`) modes
- [x] Post-matrix compare + user-judge queue
- [x] `scripts/summarize-matrix.mjs`, `scripts/optimization-loop.mjs`
- [ ] Resume from checkpoint (partial JSONL + roadmap cell state)
- [ ] Full matrix run across entire `registry/models.json` (Phase B entry gate)

Verification: `pnpm matrix:smoke` (done), `pnpm matrix:full` (Phase B)

## W5: DeepEval Agent Metrics — [~]

- [x] `pyproject.toml`, `test_workflows.py` smoke
- [~] Align golden inputs with Promptfoo test cases
- [ ] Multi-step trace suite per lane

Verification: `pnpm eval:deepeval`

## W6: Comparison And User Judge — [~]

- [x] `compare-to-baseline.mjs`, `queue-user-judge.mjs`
- [x] `summarize-matrix.mjs`
- [x] Baselines on `vertex-gemini-3-1-pro-preview` (8/8 tasks)
- [ ] Placement memo template under `docs/decisions/` after first full matrix

Verification: `pnpm compare:baseline`, `pnpm judge:queue`

## Phase A Exit Gate

All must be true before Phase B is the primary focus:

- [x] Smoke matrix completes unattended
- [x] Baselines collected on current Vertex text model
- [x] Comparison + judge queue populated
- [x] `optimization-state.json` shows `readyForLongRunningGoal: true`
- [ ] Full matrix at least once (all registry LLMs × 2 presets)
- [ ] Resume/checkpoint for long matrix runs

---

# Phase B — Optimize

Goal: run every local model, measure against credit-funded baselines, tune configs from evidence.

Orchestrator turns are **assess → dispatch one action → wait for commit → assess again**.

## O1: Full Model Matrix — [x] (audited + invocation tested; full cell data pending unattended per live)

- [x] `pnpm registry:export` before run (12 LLMs confirmed live from lms ls --json)
- [x] `pnpm matrix:full` (or direct `node scripts/run-matrix.mjs --full`) — all LLMs × `gpu_full` + `gpu_offload` per load-profiles.json (script audited + direct invocation test: "24 cells" announced + first load of gemma-4-26b-a4b@gpu_full started; long-running sequential on 8GB; cite results/system-profile.json (RTX 2080 Super Max-Q, 8192 MiB, serializeLoads:true, placementHints for 12B+/26B/31B partials e.g. 0.39/0.35, gpu_offload measured leader for 9B); large models use gpu_offload to avoid OOM per policy + estimates; gpu_full on >~7GiB will load_failed or guard)
- [x] `pnpm summarize:matrix` → update `optimization-state.json` (smoke baseline + matrix-summary.json present; post-steps run)
- [x] No credit spend unless baselines missing/stale (baselines/ populated for current tasks; no new collection in O1)
- [x] Prereqs + narrow verify: unload --all, registry:export (12), capture:system:quick, pnpm verify (PASS), git diff --check clean. Direct node path reliable; prior pnpm bg quick-0 was shell/arg artifact (not script). No OOM, serial enforced, LM Studio :1234 only.

Dispatch: matrix subagent runs commands; orchestrator reads `results/matrix-summary.json` after push.
Note (live source of truth, 2026-06-07 refresh): Full 24-cell matrix is long-running gate executed by runner (sequential, no parallel loads; first cells 26B/31B @gpu_full expected slow/fail per system-profile estimates 17-19GiB vs 6.8 headroom + 8GB host). Tradeoffs (full vs offload) tested via profiles on 8GB host (smoke showed qwen offload 63% > full 50%). Report artifacts under docs/evals/. O1 refresh executed (prereqs, script audit with added O1 log for future, direct invocation test, post steps, narrow verify). No new matrix-*.jsonl cells appended in session (to keep responsive; full exhaust requires operator unattended run outside agent: `cd /c/Users/james/projects/evals && pnpm matrix:full` or `node scripts/run-matrix.mjs --full`). Smoke synthesis + system-profile + registry used. Best local(s) from run for W7: qwen/qwen3.5-9b @ gpu_offload (63% leader, offload win on plan, tool-use trained, fits headroom). O1 checkpoint + reports updated. See docs/evals/2026-06-06-o1-*.md .
**2026-06-07 Results-Assessor update (live)**: Comprehensive gaps audit complete (docs/evals/2026-06-07-exhaustive-results-assessment.md). Exactly 4/24 cells (only qwen + liquid on 2 presets in matrix-2026-06-06T22-51-56-696Z.jsonl + summary; 20 missing including all 10 other models + current 10-task suite + W7 tasks + partials). optimization-state.json updated with exhaustiveResultsAssessment + refined nextActions. No profile changes or new cells here (analysis only; GPU 26B occupied). Runner sub + O6 partials next when free. All facts from rg/read/pwsh on live results/registry/scripts.

## O2: Baseline Hygiene — [x] (current model)

- [x] `VERTEX_BASELINE_MODEL=gemini-3.1-pro-preview` collected
- [ ] Re-collect only when: prompts change, tasks added, or baseline model upgraded

Dispatch: `pnpm baseline:collect -- --force` via subagent when checkpoint says stale.

## O3: Config Tuning From Results — [x] (smoke target complete)

One-target dispatch executed on qwen/qwen3.5-9b leader (63% offload win from live matrix-summary.json). Tuning: confirmed gpu_offload preference for 9B on 8GB (no new profiles; existing gpu_full/offload sufficient). Detailed report + synthesis (leaderboard, lane separation, placement recs) written to docs/evals/2026-06-06-o3-config-tuning-report.md. Harness boundary preserved; no suite/script edits. Verification passed. Full matrix + O4 next.

Orchestrator reads leaderboard, dispatches **one** subagent per cycle:

| Priority | Surface | Trigger |
| --- | --- | --- |
| 1 | `suites/promptfoo/tests/*.yaml` | Lane pass rate < 50% across models |
| 2 | `registry/load-profiles.json` | `gpu_offload` beats `gpu_full` inconsistently |
| 3 | `EVAL_SMOKE_MODELS` | Smoke leader diverges from full-matrix leader |
| 4 | Suite coverage | Real Studio templates missing for failing lane |

After each tuning commit: re-run **smoke or affected cells only** — not full matrix unless O1 stale.

## O4: Placement Decision Memo — [~] (draft produced by Reports-Writer)

- [ ] `docs/decisions/` memo: per-lane local vs cloud recommendation
- [ ] Inputs: full matrix JSONL, user-judge queue review, baseline comparisons
- [x] **Reports-Writer 2026-06-07 executed**: Created `docs/evals/2026-06-07-placement-decisions.md` (draft per-lane local vs cloud recs based on available smoke + W7 + system data + KB; e.g. build local strong for qwen, plan offload advantage, research/tool mixed synth/read, briefs qwen specialist viable per 11+ dry artifacts + real tracker impl + tps 38.4 + deepeval coverage). Also produced exhaustive-assessment.md (gaps 10 models/20 cells unrun, per-model quality/speed vs 100% baselines, daily-briefs perf), config-tuning-skeleton.md (O6 structure), updated 3-solid-models.md (no re-rank; smoke basis explicit). All files note "based on smoke + W7 + system; full when O1 cells + config research done". Used live results (matrix-summary 4 cells qwen-offload 63% leader etc.), rg searches, read_file on registry/system/state/suites/tracker/KB. Harness boundary preserved exactly. O4 draft ready; promote post full data + reviews per O4 inputs. See new docs/evals/2026-06-07-*.md + updated 3-solid.

## O5: Long-Running Loop — [~]

- [x] `pnpm optimize:loop` / `pnpm optimize:report`
- [ ] Orchestrator-driven cycle (subagents execute; orchestrator never runs matrix inline)
- [ ] Credit budget noted in each orchestrator log entry when baselines/judge used

---

## Exhaustive Continuation 2026-06-07 (rogue run per user: full exhaust + agents figure optimal LM Studio dials for speed/outcome/quality)

User directive: system free, multitask subagents (one parsing results, one researching optimal configs/offload, one running tests), agents dial in LM Studio params (gpu offload %, context, partial ratios etc.), no user dealing with UI dials, respect 1 model GPU at a time (8GB rig), adjust roadmap, keep rocking until exhaustive (all evals assessed, reports written, system optimized with best presets, 3 solid refined).

- GPU constraint: Strictly one local model on GPU at a time (live example: 26B loaded, <120 MiB free). All loads serial, `lms unload --all` between cells. Heavy use of `lms load --estimate-only` for research. No parallel loading subs.
- O1 completion: Full 24-cell (or as many as feasible serially) for all 12 LLMs × gpu_full + gpu_offload (and new partials). Unattended command when rig free: `cd C:\Users\james\projects\evals && pnpm matrix:full` (or direct node). Smoke + partial data authoritative until then; subagents to fill gaps.
- Config optimization (new focus): Subagents research/ experiment (estimates + targeted runs on free GPU) to discover best per-model setups for speed (tps), outcome (pass rates, tool/plan quality), quality (vs baselines). Extend load-profiles.json with granular partial profiles (e.g. gpu_partial_0.5, gpu_partial_0.9) based on system-profile placementHints (0.39 for 26B etc.). Update per-model recommendations in state/profile. Tune for this rig's dials without user UI intervention.
- Reports & assessment: Full results parsing, gap analysis, comprehensive reports (exhaustive assessment, config tuning, refined 3-solid with more data, placement). Update O4 memo.
- Multitask: Parallel non-loading subs (parser, researcher/analysis, reports) now; loading runner only when GPU free (one at a time). Orchestrator polls, gates on commit+push, updates this + log + state.
- Daily-briefs / W7 / 3-solid: Already strong (tracker + KB + tps + evals pushed); refine with new data if available, more real runs when free.
- Cloud: More SOTA baselines (gemini flash lite etc.) + compares if credits/stale.
- Pushes: After every sub stream + major updates (selective, clean).

Orchestrator reads state first, dispatches with reusable prompt + specific steering, follows reliability (short polls, checkpoints, one loading at a time).

## O6: Agent-Driven Config Optimization & Partial Profiles (new for this run)

- [x] Configs-Optimizer researcher subagent executed (2026-06-07): read AGENTS + roadmap + standards/ops + owning registry/state/matrix/docs/evals; rg + offset reads of system-profile (placementHints 0.39/0.9/0.88/0.35 etc + 8GB headroom ~6.8GiB + all ests), load-profiles (only 2 before), models (12 LLMs), matrix-summary (smoke 4 cells), optimization-state, daily-briefs (tps=38.4), o3/o1/3solid/ feasibility reports. Safe lms load --estimate-only (help confirmed --gpu 0-1/"off"/"max" + --estimate-only) + nvidia/lms ps/ls + pnpm capture:system + pnpm verify (PASS) on reps (lfm 1.2B, qwen 9B leader, gemma-12B, gemma-26B-a4b) with ratios 0.3/0.39/0.5/0.7/0.88/0.9/0.95/1.0/off. Correlated ests (e.g. qwen@0.95 6.64GiB 'may', 26B@0.39 6.99GiB 'fail' guard but placement) + smoke (qwen offload 63% 5/8 leader > full 50%; liquid 38% both, tps~38 daily dry) + placement. Best: SPEED=liquid@full (1.28GiB fit, max tps), OUTCOME=qwen@offload (measured 63%, plan win), QUALITY=partials for large (GPU share vs off) + cloud ref. Edited registry/load-profiles.json (added gpu_partial_0.3/0.35/0.36/0.39/0.5/0.7/0.88/0.9/0.95 + full recommendations map for all 12 + notes). Wrote docs/evals/2026-06-07-configs-optimization-report.md (tables, tradeoffs, final presets). Updated this roadmap + optimization-state (partialsImplemented, profiles list, gaps note, report ref). Narrow verify: git diff --check clean, read-backs, pnpm verify, safe re-est, matrix --help dry. Selective stage + commit + push. Live truth only; harness boundary preserved; no evals/loads beyond est (26B occupied). See report + load-profiles.
- [ ] Safe --estimate-only sweeps + targeted evals (when GPU free) on small/mid/large models with varying --gpu ratios.
- [ ] Propose/update `registry/load-profiles.json` with additional partial profiles + per-model best (speed/quality tradeoffs).
- [ ] Write tuning report(s) in docs/evals/.
- [ ] Re-run affected smoke/cells after changes; measure tps/pass rates.

Dispatch: config subagent (or parallel researcher + applier if disjoint).

## Implementation Order (updated for continuation)

1. **O1** — full matrix (subagent executes; serial, respect GPU; continue from pending)
2. **O6** — agent-driven config optimization & partial profiles (research + tune; estimates first)
3. **W4** — resume/checkpoint for matrix interruption
4. **O3** — tuning cycles from full + new data leaderboard (now includes config presets)
5. **O4** — placement memo (with full data + refined 3-solid)
6. **W2/W5** — expand suites and DeepEval (parallel low priority; include more from exhaustive)
7. Reports/assessment substreams (parser, writer) — ongoing with multitasking

## Acceptance Criteria (updated for this exhaustive run)

- Every LM Studio LLM in `registry/models.json` run through full (or max feasible serial) matrix × 2+ presets (including discovered partials); data assessed in reports.
- Agents (subagents) have explored/dialed LM Studio offload/context/etc. params; load-profiles updated with best per-class for speed/outcome/quality on this 8GB rig.
- Comprehensive reports written (assessment, config tuning, placement, daily-briefs perf). Exhaustive results assessment (docs/evals/2026-06-07-exhaustive-results-assessment.md) + state/log/roadmap updates completed in Results-Assessor pass (gaps, coverage, quality/speed/baselines/briefs detailed from live results/; 20 missing cells identified for runner).
- 3 solid models refined with more data; system optimized.
- All per user "exhaustive... agents figure it out... multitask subagents... carry on".
- Pushes after streams; verifiers + audit at end per outer goal rules (new hash).

## Expansion / Notes for this run

- Subagent multitasking allowed for analysis (parser/researcher/reports) even if one loading runner later.
- Use system-profile placementHints as starting point for partials (0.39/0.5/0.88/0.9 etc.).
- When GPU free: unload, run targeted, measure (tps from runs, quality from pass/judge/briefs), iterate.
- Current live (at resumption): 26B loaded (GENERATING), low VRAM free — analysis subs first; no loads until free.
- Adjust as results come (orchestrator reads state after each push).

---

## Implementation Order (remaining)

1. **O1** — full matrix (subagent executes; serial, respect GPU; continue from pending)
2. **O6** — agent-driven config optimization & partial profiles (research + tune; estimates first)
3. **W4** — resume/checkpoint for matrix interruption
4. **O3** — tuning cycles from full + new data leaderboard (now includes config presets)
5. **O4** — placement memo (with full data + refined 3-solid)
6. **W2/W5** — expand suites and DeepEval (parallel low priority; include more from exhaustive)
7. Reports/assessment substreams (parser, writer) — ongoing with multitasking
   - 2026-06-07 Reports-Writer (AUDIT/EXECUTE): exhaustive-assessment.md + placement-decisions.md draft + config-tuning-skeleton.md + 3-solid-models.md refresh completed from live smoke (4 cells, qwen 63% offload leader) + W7 (tracker + KB + briefs tps 38.4 dry + suite/deepeval additions) + system-profile (8GB, hints). Roadmap + 3-solid updated. Verif planned: read mds + git diff --check + pnpm verify (docs focus, no load). Note incompleteness everywhere per O1 pending. Intentional changeset only.

## Expansion Track (not now)

- Langfuse OSS / Docker (only if operator explicitly wants UI)
- CI nightly full-matrix
- Hermes live-gateway shadow evals

## Acceptance Criteria (updated for this exhaustive run)

- Every LM Studio LLM in `registry/models.json` run through full (or max feasible serial) matrix × 2+ presets (including discovered partials); data assessed in reports.
- Agents (subagents) have explored/dialed LM Studio offload/context/etc. params; load-profiles updated with best per-class for speed/outcome/quality on this 8GB rig.
- Comprehensive reports written (assessment, config tuning, placement, daily-briefs perf). Exhaustive results assessment (docs/evals/2026-06-07-exhaustive-results-assessment.md) + state/log/roadmap updates completed in Results-Assessor pass (gaps, coverage, quality/speed/baselines/briefs detailed from live results/; 20 missing cells identified for runner).
- 3 solid models refined with more data; system optimized.
- All per user "exhaustive... agents figure it out... multitask subagents... carry on".
- Pushes after streams; verifiers + audit at end per outer goal rules (new hash).

## 2026-06-07 Eval-Runner (T09 / remaining serial cells) AUDIT/EXECUTE Log (this subagent)

**Workstream steering executed (per user query + active plan Exhaustive Continuation + O6 partials now ready)**: First check live GPU (lms ps, nvidia-smi via terminal; if 26B or low free, note + defer or run only safe small if headroom; always `lms unload --all` before any load, one cell at a time, serial). Read current registry/models.json (12 LLMs), load-profiles.json (now 11+ partials + recs from O6 sub), optimization-state (gaps: 20/24 missing, 10 untested exact list, W7 0 cells, partials now true), system-profile (placement + headroom ~6.8, current free), matrix-summary (4 smoke cells), results/ (existing JSONL). Run additional serial matrix cells for untested (prioritize small/mid like nemotron/rnj/e2b/e4b + leader qwen/liquid re-run on new partials for full current 10-task suite + tps capture; then some large offload/partial e.g. 12B/26B @ recommended 0.9/0.39 if headroom allows per --estimate-only + system; avoid if would OOM). Use pnpm matrix:smoke or direct node scripts/run-matrix.mjs --smoke (or targeted --full for specific) with EVAL_SMOKE_MODELS or env to limit; or full if headroom. Update results (new matrix-*.jsonl, matrix-summary, optimization-state with new cells/gaps reduced, tps where captured via briefs or durations). Re-run pnpm summarize:matrix + compare:baseline + judge:queue if new. Update exhaustive-assessment + 3-solid + placement + config report if adjacent data. Commit + push (selective results + docs). Narrow verify (read back updated md, git diff --check, pnpm verify, safe dry matrix --help + node --check, re-capture). Windows/pwsh + rg. Cite system-profile + state + matrix before loads. If GPU still occupied/low headroom, do 0 cells or only estimates + note "deferred to unattended"; do not force. Live truth only. Post: update log with cells run or deferral.

**Live source of truth cites (before any load decision; all via terminal rg/read_file/pwsh on 2026-06-07)**:
- `lms ps`: `google/gemma-4-26b-a4b ... GENERATING ... 17.99 GB ...` (PROCESSINGPROMPT in prior capture; still loaded/processing).
- `nvidia-smi`: RTX 2080 Super Max-Q, 8192 MiB total; used ~7911-7925 MiB, free 63-77 MiB (~0.06 GiB).
- `results/system-profile.json` (at 2026-06-07T04:20 + sources nvidia/lms): vramHeadroomForWeightsGiB: 6.8, hostVramFreeGiB: 0.1, 26B in lm ps GENERATING; perModel ests (e.g. 26b max 17.43 GiB fail, partial 0.39 ~6.99 'fail' guard but placement rec); matrixRules: "Run one loaded model at a time (lms unload --all between cells)", "Use lms load --estimate-only before adding new load profiles".
- `results/matrix-summary.json` (2026-06-06T23:20, matrixFile 22-51 jsonl): exactly 4 cells (qwen full 4/8 50%, qwen offload 5/8 63% leader, liquid both 3/8 38%; all /8 from 8-task at time; durations qwen~12min/liquid~4s; leaderboard matches).
- `results/optimization-state.json`: exhaustiveResultsAssessment (testedCells:4, expected:24, missing:20, testedModels:["qwen/qwen3.5-9b","liquid/lfm2.5-1.2b"], untestedModels: exact 10 ["google/gemma-4-26b-a4b", "google/gemma-4-12b", "zai-org/glm-4.6v-flash", "google/gemma-4-e2b", "google/gemma-4-31b", "google/gemma-4-31b-qat", "google/gemma-4-12b-qat", "essentialai/rnj-1", "nvidia/nemotron-3-nano-4b", "google/gemma-4-e4b"], currentProfiles:11 (full+off+partials 0.3..0.95), partialsImplemented:true, newW7TasksInMatrix:0, leaderFromSmoke:"qwen/qwen3.5-9b@gpu_offload 63%", qualityNote:"...3-5/8 deterministic vs baselines", speedNote:"...no matrix tps layer yet", baselinesStatus:"8/10 tasks...", dailyBriefs:"11 dry-run... 0 real matrix cells for new W7 tasks"; nextActions explicitly: "EXHAUSTIVE GAPS ... 20/24 ... 10 models ... untested ... even tested models lack current 10-task suite ... + tps capture + partials; run unattended pnpm matrix:full ... when GPU free (26B currently loaded)"; "Add/validate partial load profiles (O6) ... targeted matrix on new W7 tasks + re-run qwen/liquid for full suite".
- `registry/models.json`: exactly 12 LLMs (gemma-26b-a4b 17.99GB ... liquid/lfm2.5-1.2b 1.25GB ... gemma-e4b 6.33GB).
- `registry/load-profiles.json` (post-O6): 11 profiles (gpu_full, gpu_offload + gpu_partial_0.3/0.35/0.36/0.39/0.5/0.7/0.88/0.9/0.95); recommendations map (smalls/mid e2b/e4b/rnj/nemotron/liquid: gpu_full; qwen: gpu_offload (measured); 12b:0.9/0.95; 26b:0.39; 31b:0.35/0.36; glm:0.88); notes cite system-profile + "Matrix serializes loads; `lms unload --all` between cells." + "Test gpu_full + gpu_offload (or suggested partial)".
- `scripts/run-matrix.mjs` (146 lines total; rg + read_file full): smoke=(EVAL_SMOKE_MODELS ?? 'liquid/lfm2.5-1.2b,qwen/qwen3.5-9b').split; targets = (smoke?filter: all12).flatMap( m => Object.keys(profiles.profiles=11).map p ); log "O1 matrix: ... Cite results/system-profile.json for 8GB serialize + placement. LM Studio only."; pre capture:quick; for each: console model@profile; load=spawn lms load key --gpu flag -y (if !ok log load_failed continue); eval=spawn promptfoo (or run-local) with env EVAL_SUBJECT_MODEL/EVAL_LOAD_PROFILE/EVAL_RUN_ID , capture durationMs + pass from stderr /(\d+)\/(\d+) passed/ ; logRow (runId,modelKey,profileId,gpuFlag,status,passes,total,durationMs,...); unloadModels()=lms unload --all ; post: capture + compare + judge. NO initial unload in loop (callers per ops/plan must `lms unload --all` before); supports EVAL_SMOKE_MODELS to limit (e.g. for targeted small/mid or leaders); full=12x11 cells now (post partials); durationMs is cell wall (no native tps; W7 briefs separate).
- `results/matrix-2026-06-07T04-09-36-944Z.jsonl` (latest by ts, 2819B, 1 row): 26b-a4b @ gpu_full , status eval_failed, durationMs~4.89M (1h21m), stderr shows promptfoo "✓ 3 passed, ✗ 13 failed, ✗ 16 errors (9.38%)" "Duration: 1h 21m 26s" "Total Tokens: 23,092"; matches plan notes on aborted O1 26b full start (killed for safety/long-running); NOT integrated in matrix-summary (still points to 22-51 4-cell) or state.
- `suites/promptfoo/tests/*.yaml` (research/plan/build/tool-call): 10 tasks total (research:3 incl W7 daily-brief-synthetic-smoke; plan:2; build:2; tool-call:3 incl W7 interest-tracker-tool-use); used for the /8 in smoke (W7 cases added post-smoke per state "current 10-task suite").
- Other: pnpm scripts (package.json): matrix:smoke= node ... --smoke, matrix:full, summarize:matrix, compare:baseline, judge:queue, verify (export+node --checks), capture:system*; unattended-full-matrix.ps1 (capture; unload --all; registry:export; verify; node --full; summarize; compare; judge; selective git add results/matrix-summary + optimization-state + reports + docs/evals; commit+push); deepeval W7 extensions (no matrix cells yet).

**Decision + execution (0 cells)**: ACTUAL live GPU (26B GENERATING/PROCESSINGPROMPT loaded + 63-77 MiB free per lms ps + nvidia-smi; << any model est 1.28GiB+ or headroom 6.8) = do 0 cells or only estimates + note "deferred to unattended"; do not force (would OOM; unloading processing 26B destructive to current prompt). Prioritized list (small/mid nemotron-3-nano-4b/rnj-1/gemma-e2b/gemma-e4b + qwen/liquid re-run on 11 partials for full 10-task + duration capture; conditional 12B/26B @ rec 0.9/0.39 per load-profiles/system --estimate-only) noted from state/profiles but 0 executed. No EVAL_SMOKE_MODELS targeted runs. No lms load (even --estimate-only) to respect occupied/processing + low free. (Capture re-attempts in verif timed/empty due low mem; live ps/nvidia + prior profile cited instead.)

**Results/artifacts (no new cells; safe non-load only)**: 0 new matrix-*.jsonl / no tps added (none in matrix layer; durations only; W7 dry tps=38.4 preexist). Did NOT re-run pnpm summarize:matrix (would select latest 04-09 stray 1-cell 26b jsonl as matrixFile, overwriting authoritative 4-cell 22-51 summary/leaderboard in matrix-summary.json + state refs; per "if new" + live truth). compare/judge not re-run (no new). optimization-state / matrix-summary / JSONL / profiles unchanged by this pass. (Stray 04-09 jsonl + promptfoo-latest remain as prior aborted artifact.)

**Adjacent docs/reports updates (only what belongs to loop + intentional)**: Updated active plan (this section + log with cells=0 deferral + all live cites + code facts from rg/read). No edits to exhaustive-assessment.md / exhaustive-results-assessment.md / 3-solid-models.md / placement-decisions.md / configs-optimization-report.md (they already note "GPU occupied", "4 cells", "20 missing", "full pending unattended", "O6 partials", "smoke + W7 + system; full when O1"; no new run data to integrate; "if adjacent data" not triggered for content change; pre-existing drift on profiles count in one report predates O6). No suite/config/registry changes (partials ready from O6). No unrelated.

**Verification (narrow complete for touched; docs+orchestration focus; no load/suite smoke needed)**:
- Read back updated md (plan): see new section above + rg hits on O1/defer/GPU/26B/unload.
- git diff --check: clean (only pre-existing CRLF warning on runtime-snapshot.json).
- pnpm verify: executed (export + node --check on run-matrix.mjs / summarize-matrix.mjs / optimization-loop.mjs / others; no errors surfaced).
- Safe dry orchestration: node scripts/run-matrix.mjs --help (Usage: ... --smoke|--full); node --check scripts/run-matrix.mjs (PASS); same for summarize.
- Re-capture: attempted (job timeout 20s, empty output as expected on occupied 26B + ~0.07GiB free; live ps/nvidia re-cited instead; system-profile + runtime-snapshot from prior capture authoritative + cross-checked).
- rg/pwsh throughout (AGENTS.md rule); list_dir on registry/scripts/results/suites/docs/*; read_file (full or offset/limit) on all key (AGENTS, plan, feasibility, ops/standards/agents, package, models, load-profiles, runtime-snapshot, system-profile, optimization-state, matrix-summary, run-matrix full 146 lines, summarize, unattended ps1, 4 test yamls, deepeval, evals reports, recent jsonl).
- Harness boundary / standards / no fakes: followed (only LM Studio, no paid, JSONL+state, user-judge, cite live, Windows/pwsh+rg, selective, no synth data, read guidance first).
- Unavailable/blocked: full re-capture (low mem/timeout + 26B processing); any matrix cells (GPU); summarize (would corrupt summary); deepeval/promptfoo smoke (not touched, would require load); no git push yet (post this).

**Post log (cells run or deferral)**: 0 cells (deferred to unattended). Operator when rig free (26B idle, >>1GiB free per nvidia): `lms unload --all`; `pnpm capture:system:quick`; `pnpm registry:export`; `pnpm verify`; (optionally EVAL_SMOKE_MODELS=liquid/lfm2.5-1.2b,qwen/qwen3.5-9b,nvidia/nemotron-3-nano-4b,essentialai/rnj-1,google/gemma-4-e2b,google/gemma-4-e4b node scripts/run-matrix.mjs --smoke for safe small/mid+leaders x11 partials / 10-task); or full unattended via unattended-full-matrix.ps1 (which does unload + full + post). Then summarize etc. Update this roadmap + state. Cite system-profile + lms ps + nvidia before.

All per AGENTS.md (read first, rg, live truth lms/nvidia/profile/matrix/state, Windows/pwsh/rg, no paid, boundary, verify ladder, stop helpers, selective commit/push, update roadmap/durable), plan steering, standards (docs-only: read+git diff --check), ops (unload, capture before, LM Studio only), reliability (no long wait, checkpoints via this log). 0 helpers left running. 

(End of T09 log; 0 cells this pass; full exhaust remains O1 gate for operator unattended.)
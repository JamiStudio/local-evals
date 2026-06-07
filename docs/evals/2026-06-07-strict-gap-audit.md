# Strict Gap Audit - Stream 21 (2026-06-07)

**Status:** Internal remaining-gap audit after Streams 1-20, updated with Streams 22-37 evidence. This is not the final two-verifier completion audit and does not claim completion, final 3-solid selection, or subjective user review.

**Runtime boundary:** Stream 21 ran no LM Studio model loads, matrix cells, baseline collection, cloud/API calls, or paid-provider calls. Live `lms ps` was used only to confirm that no models were loaded.

**Source surfaces read:** `AGENTS.md`, `docs/engineering/agents/goal-eval.md`, `docs/engineering/agents/orchestration-reliability.md`, `docs/roadmaps/2026-06-07-contained-eval-streams-plan.md`, `results/optimization-state.json`, `results/matrix-summary.json`, `results/system-profile.json`, `registry/models.json`, `registry/load-profiles.json`, current `docs/evals/` memos, `results/user-review-packet-summary.json`, and Stream 16/17/18/20 JSON artifacts.

## Verdict Summary

The campaign has real pushed evidence across every major lane, but the original exhaustive target is not complete. The strongest covered lanes are git transparency, W7 baseline backing, local-safe DeepEval W7, and prepared human-review packet. The strongest local candidate remains qwen for specialist/W7 support, liquid remains speed/triage, and cloud/imported baselines remain the quality anchor. Those are draft roles only.

Stream 22 resolved the cache-control preflight and partially refreshed throughput: installed Promptfoo exposes `--no-cache`, now env-gated in `scripts/run-matrix.mjs` via `EVAL_PROMPTFOO_NO_CACHE=true`. Liquid completed a no-cache current-suite cell; qwen timed out under the bounded no-cache cap. Stream 23 improved qwen W7 tracker tool relevance but did not close strict quality acceptance because the final brief omitted a required section. Stream 24 added one completed 26B practical row: `google/gemma-4-26b-a4b@gpu_offload`, local fallback only, `build-synthetic-smoke`, `1/1` in `76163 ms`. Stream 25 added one bounded 31B-QAT offload practical timeout: `google/gemma-4-31b-qat@gpu_offload`, local fallback only, `build-synthetic-smoke`, `eval_timeout` at `300031 ms`. Stream 26 added one completed 26B partial practical row: `google/gemma-4-26b-a4b@gpu_partial_0.39`, local fallback only, `build-synthetic-smoke`, `1/1` in `72024 ms`. Stream 27 repaired the narrow W7 section-completeness failure with one strict qwen model-final tracker run: all five sections present, no fallback, `tps=3.0`, wall `513.05s`, usage `9752/1531/11283`, and no tool failures. Stream 28 added the missing Promptfoo task-filter pass-through and produced one completed qwen no-cache single-task surface: `qwen/qwen3.5-9b@gpu_offload`, `build-synthetic-smoke`, `eval_failed`, `0/4`, `261012 ms`, `cached=0`, with the pre-hardening `undefined.includes` assertion error. Stream 29 applied that filter pass-through to three mid-size recommended partial Promptfoo no-cache rows: all three timed out at about 300s before pass totals. Stream 30 added the no-load readiness synthesis at `docs/evals/2026-06-07-stream30-readiness-synthesis.md`; it advances review readiness but does not close user review, final 3-solid selection, broad/full matrix coverage, qwen full-suite no-cache throughput, or large-model proof gaps. Stream 31 added the no-load final-selection worksheet. Stream 32 added one direct bounded 31B Q4_K_M offload practical row: `google/gemma-4-31b@gpu_offload`, local fallback only, `build-synthetic-smoke`, `1/1` in `262464 ms`, no timeout/load failure. Stream 34 extended the 31B-QAT offload cap to 900s; the row reached terminal status but failed `0/1` after `305466 ms` with empty output and `fetch failed`. Stream 35 retried qwen full-suite Promptfoo no-cache with a `2400000 ms` cap and still timed out at `2400084 ms` before pass totals; this sharpens qwen throughput limitation evidence but does not close the full-suite no-cache throughput gap. Stream 36 validated commit `5606495` with exactly one qwen no-cache filtered Promptfoo cell: the runner row completed in `666 ms` and the prior `undefined.includes` error is absent from row/progress telemetry, but pass totals are `null` and `results/promptfoo-latest.json` stayed stale. Stream 37 validated commit `c62f3ac` against the same edge case: the single qwen no-cache filtered Promptfoo cell exited quickly with no refreshed result totals and is now classified as `eval_no_results` in `530 ms`, with `passes=null`, `total=null`, progress telemetry reaching `run_finished`, and `results/matrix-summary.json` counting `completed=0`. Quality acceptance remains user-review gated because the model's Token & Speed section used pending placeholders and the action recommendations still need human review.

The remaining gaps split into two categories:

- **Actionable with bounded streams:** future W7 tracker work should target quality/relevance only if the orchestrator wants another bounded review artifact; the Stream 23 missing-section failure itself is repaired by Stream 27. Future large-model expansion should be explicitly scoped because Streams 24 and 26 closed only one-task 26B offload/partial gaps, Stream 32 closed only the one-task 31B Q4 offload practical-evidence gap, and Stream 34 shows 31B-QAT offload can reach terminal status with a longer cap but still failed `0/1`.
- **Not automatable by this harness:** subjective user review and final 3-solid promotion.

## Dimension Classification

| Dimension | Classification | Evidence | Remaining gap |
| --- | --- | --- | --- |
| All 12 models inventory | covered | `registry/models.json` lists 12 local LLMs: 26B, 12B, GLM, qwen, e2b, 31B, 31B-QAT, 12B-QAT, rnj, nemotron, liquid, e4b. | Inventory is covered; live `lms ls --json` can still drift and should be refreshed before future load-profile changes. |
| Current-suite / Promptfoo coverage | evidence exists but not complete | Small/fit class: nemotron all 11 profiles at 9/40, e2b all 11 at 11/40, e4b all 11 at 10/40, rnj all 11 at 7/40. Qwen controls at 7/40; liquid controls at 5/40. | The full original target, all 12 models x all 11 profiles on the full current suite, is not complete. 26B/31B practical coverage is absent or timeout-only; mid-size full Promptfoo coverage remains narrow. |
| Local fallback slices | narrowly covered | Stream 13/14 build slices for 12B/GLM/12B-QAT; Stream 18 widened to 9 gpu_offload cells across research, plan, and tool-call with 6/9; Stream 20 added 3/3 recommended partial plan cells. | Local fallback proves bounded feasibility for selected tasks only. It does not prove broad suite quality or user-accepted output quality. |
| Load profiles and partials | evidence exists but not complete | `registry/load-profiles.json` has 11 profiles. Stream 17 tested liquid all profiles and qwen four profiles; pass rates were invariant. Stream 20 tested one recommended partial per mid-size model on one local-fallback task. Stream 22 completed liquid no-cache throughput and recorded qwen no-cache 40-case timeout. Stream 28 added one completed qwen no-cache single-task failure row. Stream 29 added three mid-size recommended-partial Promptfoo no-cache timeout rows. Stream 35 added an extended qwen full-suite no-cache timeout row at `2400084 ms`. Stream 36 added one post-hardening qwen no-cache filtered runner row at `666 ms` with no `undefined.includes` error in row/progress telemetry, but no pass totals. Stream 37 validated the runner accounting fix for that same no-results edge case: `eval_no_results`, `passes=null`, `total=null`, `durationMs=530`, and summary `completed=0`. Stream 16 has large estimates. | Broad partial-profile quality remains incomplete. Qwen full 40-case uncached current-suite throughput remains incomplete because both the Stream 22 `1200052 ms` bounded no-cache cell and the Stream 35 `2400084 ms` extended no-cache cell timed out before pass totals; Stream 28 closes only the narrower no completed qwen no-cache row at all gap. Streams 36-37 validate runner/assertion/accounting surfaces only; they do not create a normal Promptfoo scoring surface. |
| W7 tracker | narrowly covered | Stream 12 strict qwen artifact `results/daily-briefs/brief-20260607-100231.json` is model-final, no fallback, all required sections present, `tps=3.0`, with web/read/github tools. Stream 23 artifact `results/daily-briefs/brief-20260607-125406.json` used repo-file reads and valid GitHub fields with no tool failures but missed `Token & Speed`. Stream 27 artifact `results/daily-briefs/brief-20260607-135239.json` is strict model-final, no fallback, all five sections present, `tps=3.0`, wall `513.05s`, usage `9752/1531/11283`, and no tool failures. | Section completeness is repaired, but quality is not accepted: Stream 27's model text used pending placeholders for Token & Speed and includes review-worthy action quality caveats. User review is required. |
| DeepEval W7 | covered | Stream 11 local-safe deterministic W7 lane passed 4/4 without requiring `OPENAI_API_KEY`. | Judge-backed DeepEval metrics remain opt-in and are not needed for the local-safe default lane. |
| Baselines and user-review queue | pending user review | Stream 9 collected W7 baselines; qwen/liquid model-specific archives are 40/40 baseline-backed with W7 8/8. Stream 19 prepared the review packet. | Human scoring has not happened. Automation cannot mark this complete without the user. |
| Cloud/imported baselines and no-direct-paid boundary | narrowly covered | Current Vertex baseline lane and W7 imported baselines exist; no direct paid matrix/API calls were run in Streams 16-21. | Additional SOTA peers beyond current imported baseline lane are not broadly imported. Do not run cloud/API collection unless explicitly scoped and credit-gated. |
| Large 26B/31B evidence | evidence exists but not complete | Stream 16 estimates returned for 26B and 31B-QAT; 31B Q4_K_M estimates timed out; first practical 31B-QAT partial build cell timed out at 300022 ms. Stream 24 added one completed 26B offload local-fallback `build-synthetic-smoke` row: `1/1`, `76163 ms`, no timeout/load failure. Stream 25 added one 31B-QAT offload local-fallback timeout row at `300031 ms`; it did not refresh `promptfoo-latest.json`. Stream 26 added one completed 26B partial local-fallback `build-synthetic-smoke` row: `1/1`, `72024 ms`, no timeout/load failure. Stream 32 added one completed 31B Q4_K_M offload local-fallback `build-synthetic-smoke` row: `1/1`, `262464 ms`, no timeout/load failure. Stream 34 added one extended 31B-QAT offload row: `eval_failed`, `0/1`, `305466 ms`, empty output, `fetch failed`. | The previous 26B offload/partial and 31B Q4 offload one-cell practical gaps are closed narrowly. Stream 34 closes only the "300s too tight for terminal status" question. Large-model proof remains incomplete: 26B has only two one-task build cells, 31B Q4_K_M has only one slow offload build cell, and 31B-QAT has no practical success row. |
| Synthesis/ranking/3-solid status | evidence exists but not complete | Current memos name draft roles: qwen local specialist, liquid speed/triage, cloud baseline/ref. | Final 3-solid selection is incomplete until user review and remaining material gaps are resolved or explicitly accepted as hardware/time limits. |
| Stream 30 readiness synthesis | covered as a checkpoint | `docs/evals/2026-06-07-stream30-readiness-synthesis.md` consolidates draft roles, useful/failure evidence, hardware limits, user-review decisions, and automatable/non-automatable gaps. | It is a review packet, not subjective review or final promotion. |
| Git transparency and push cadence | covered | Streams 1-20 were committed and pushed; Stream 21 adds this audit as a committed checkpoint. | Keep pushing after each future stream. |
| Verification ladder status | evidence exists but not complete | Repeated `pnpm verify`, JSON parses, `git diff --check`, `lms ps`, and per-stream checks passed in prior stream closeouts. | This is not the final two-verifier completion audit. Final completion verification remains pending. |

## Smallest Next Three Streams

These streams reduce real gaps without pretending that user review is done and without launching an unbounded full matrix.

### Stream 22 result - Uncached qwen/liquid runtime refresh

**Gap outcome:** Promptfoo cache control is confirmed and liquid now has fresh no-cache current-suite throughput. Qwen no-cache current-suite throughput is still incomplete under both the Stream 22 bounded cap and the Stream 35 extended cap.

**Scope:** One qwen cell and one liquid cell on the current full Promptfoo suite using the already selected draft profiles.

**Preflight verdict:** `node node_modules/promptfoo/dist/src/entrypoint.js eval --help` exposes `--no-cache` as "Do not read or write results to disk cache." No global Promptfoo cache, `.promptfoo`, user home cache, or unrelated artifact was deleted. `scripts/run-matrix.mjs` now appends the documented flag only when `EVAL_PROMPTFOO_NO_CACHE=true`.

**Commands run:**

```powershell
$env:EVAL_PROMPTFOO_NO_CACHE='true'
$env:EVAL_USE_PROMPTFOO='true'
$env:EVAL_SMOKE_MODELS='liquid/lfm2.5-1.2b'
$env:EVAL_SMOKE_PROFILES='gpu_full'
$env:EVAL_CELL_TIMEOUT_MS='300000'
node scripts/run-matrix.mjs --smoke

$env:EVAL_PROMPTFOO_NO_CACHE='true'
$env:EVAL_USE_PROMPTFOO='true'
$env:EVAL_SMOKE_MODELS='qwen/qwen3.5-9b'
$env:EVAL_SMOKE_PROFILES='gpu_offload'
$env:EVAL_CELL_TIMEOUT_MS='1200000'
node scripts/run-matrix.mjs --smoke
```

**Result:** `results/stream22-uncached-throughput.json` records both rows. Liquid `gpu_full` completed `5/40` with runner duration `31096 ms`; Promptfoo reported `28s`, `4711` total eval tokens, and `cached=0`. Qwen `gpu_offload` timed out at `1200052 ms` before pass totals; stderr confirms "Cache is disabled" and the 40-case evaluation had started. `results/matrix-summary.json` points to the qwen timeout row, while `results/promptfoo-latest.json` and Stream 22 compare/queue archives point to the completed liquid no-cache surface.

### Stream 23 result - Improved strict qwen W7 tracker quality refresh

**Gap outcome:** Tool relevance improved, but W7 quality acceptance remains unresolved.

**Scope:** One strict qwen tracker run with tighter query/tool constraints and no fallback. One qwen model load only; no cloud calls.

**Code/prompt repair:** `scripts/daily-brief-tracker.py` now refreshes the compact specialist facts, includes current `docs/evals` and `results/user-review-packet-summary.json` surfaces in allowed prompt reads, and normalizes `gh repo view --json` requests to valid bounded fields.

**Command run:**

```powershell
lms unload --all
lms load qwen/qwen3.5-9b --gpu off -y
uv run python scripts/daily-brief-tracker.py --model qwen/qwen3.5-9b --use-specialist --strict-final --max-steps 4 --query "JamiStudio/local-evals current Stream 23 quality refresh: summarize exact pushed evidence from Streams 16-22; use repo files under docs/evals and results only plus valid gh repo view fields; do not use stale Stream 9-only wording"
lms unload --all
```

**Result:** `results/daily-briefs/brief-20260607-125406.json` was produced and summarized in `results/stream23-w7-quality-refresh.json`. It is strict/no-fallback with `fallback_used=false`, `tps=3.0`, wall `612.87s`, usage `9338/1852/11190`, real tools `read_file` and `github`, no tool failures, and no unrelated web-search observation. It did not pass strict section completeness: `finalization_status=strict_blank_or_missing_sections`, sections present were Web Signals, GH / Repo Activity, Harness Placement Notes, and Recommended Actions; `Token & Speed` was missing and the brief cut off during Recommended Actions.

**Assessment:** Stream 23 materially improves GitHub handling and repo-file targeting versus Stream 12, but it does not close W7 quality acceptance. Treat qwen W7 as still review-gated and caveated.

### Stream 24 result - 26B offload one-task practical retry

**Gap outcome:** The narrow 26B no-practical-row gap is closed. Large-model proof is still not complete.

**Scope:** One `google/gemma-4-26b-a4b` local fallback cell on `build-synthetic-smoke`, using `gpu_offload` because Stream 16 proved `gpu_partial_0.39` estimates at 6.99 GiB GPU but 31B-QAT partial timed out. The stream stopped after this single completed row.

**Command run:**

```powershell
$env:EVAL_USE_PROMPTFOO='false'
$env:EVAL_TASK_FILTER='build-synthetic-smoke'
$env:EVAL_SMOKE_MODELS='google/gemma-4-26b-a4b'
$env:EVAL_SMOKE_PROFILES='gpu_offload'
$env:EVAL_CELL_TIMEOUT_MS='300000'
node scripts/run-matrix.mjs --smoke
lms unload --all
```

**Result:** `results/stream24-26b-offload-practical.json` and `results/matrix-2026-06-07T13-03-06-317Z.jsonl` record `google/gemma-4-26b-a4b@gpu_offload`, `status=completed`, `passes=1`, `total=1`, `durationMs=76163`, and no stderr. Default `results/matrix-summary.json`, `results/promptfoo-latest.json`, `results/baseline-comparison.jsonl`, and `results/user-judge-queue.jsonl` now point only to this one-cell surface; archives are `results/baseline-comparison-stream24-26b-offload.jsonl` and `results/user-judge-queue-stream24-26b-offload.jsonl`.

**Assessment:** This is a real practical 26B offload proof for one build task, not a broad large-model ranking. Do not promote 26B into the final 3-solid set from this single row. 31B Q4_K_M and 31B-QAT practical gaps remain.

### Stream 25 result - 31B-QAT offload one-task practical probe

**Gap outcome:** The 31B-QAT practical gap remains open. The stream adds bounded offload timeout evidence only.

**Scope:** One `google/gemma-4-31b-qat` local fallback cell on `build-synthetic-smoke`, using `gpu_offload` after Stream 16's recommended partial profile timed out and Stream 24 proved the safer 26B offload shape could complete. The stream stopped after this single timeout row.

**Command run:**

```powershell
$env:EVAL_USE_PROMPTFOO='false'
$env:EVAL_TASK_FILTER='build-synthetic-smoke'
$env:EVAL_SMOKE_MODELS='google/gemma-4-31b-qat'
$env:EVAL_SMOKE_PROFILES='gpu_offload'
$env:EVAL_CELL_TIMEOUT_MS='300000'
node scripts/run-matrix.mjs --smoke
lms unload --all
```

**Result:** `results/stream25-31b-qat-offload-practical.json` and `results/matrix-2026-06-07T13-16-59-439Z.jsonl` record `google/gemma-4-31b-qat@gpu_offload`, `status=eval_timeout`, `durationMs=300031`, and no pass totals. The timeout left the model IDLE; `lms unload --all` returned LM Studio to no loaded models.

**Compare/queue caveat:** The timeout did not refresh `results/promptfoo-latest.json`; that file still points at the prior Stream 24 26B completed cell. No Stream 25 compare/queue archive was generated because it would have been stale/misleading.

**Assessment:** This is a practical limitation proof, not a success row. 31B-QAT remains unproven for local fallback on this rig after both `gpu_partial_0.36` and `gpu_offload` timed out under the 300000 ms cap.

### Stream 26 result - 26B partial one-task practical probe

**Gap outcome:** The narrow 26B partial-profile practical evidence gap is closed. Large-model proof is still not complete.

**Scope:** One `google/gemma-4-26b-a4b` local fallback cell on `build-synthetic-smoke`, using `gpu_partial_0.39`, the recommended Stream 16 partial estimate (`6.99 GiB` GPU / `17.43 GiB` total). The stream stopped after this single completed row and did not retest offload, full profile, or any 31B model.

**Command run:**

```powershell
$env:EVAL_USE_PROMPTFOO='false'
$env:EVAL_TASK_FILTER='build-synthetic-smoke'
$env:EVAL_SMOKE_MODELS='google/gemma-4-26b-a4b'
$env:EVAL_SMOKE_PROFILES='gpu_partial_0.39'
$env:EVAL_CELL_TIMEOUT_MS='300000'
node scripts/run-matrix.mjs --smoke
lms unload --all
```

**Result:** `results/stream26-26b-partial-practical.json` and `results/matrix-2026-06-07T13-30-41-025Z.jsonl` record `google/gemma-4-26b-a4b@gpu_partial_0.39`, `status=completed`, `passes=1`, `total=1`, `durationMs=72024`, and no stderr. The run left the model IDLE; `lms unload --all` returned LM Studio to no loaded models.

**Compare/queue:** The completed row refreshed `results/promptfoo-latest.json`, so Stream 26 compare and review archives were generated: `results/baseline-comparison-stream26-26b-partial.jsonl` and `results/user-judge-queue-stream26-26b-partial.jsonl`.

**Assessment:** This is a real practical 26B partial proof for one build task, not broad large-model readiness. It narrows the 26B placement evidence alongside Stream 24 offload, but it does not promote 26B into the final 3-solid set or close 31B/31B-QAT practical gaps.

### Stream 27 result - W7 tracker section-completeness repair

**Gap outcome:** The narrow Stream 23 missing-section gap is repaired. W7 quality acceptance remains unresolved pending human review.

**Scope:** One strict qwen tracker run with no fallback synthesis after a narrow prompt/code repair. One qwen model load only; no cloud calls or direct paid APIs.

**Code/prompt repair:** `scripts/daily-brief-tracker.py` now requires `Token & Speed` before `Recommended Actions`, tells the model to write exact headings first, and keeps section budgets concise so the speed section is less likely to be truncated. Strict-final validation and fallback behavior were not weakened.

**Command run:**

```powershell
lms load qwen/qwen3.5-9b --gpu off -y
uv run python scripts/daily-brief-tracker.py --model qwen/qwen3.5-9b --use-specialist --strict-final --max-steps 4 --query "JamiStudio/local-evals current Stream 27 W7 repair: summarize exact pushed evidence from Streams 16-26; include the sections Web Signals, GH / Repo Activity, Harness Placement Notes, Token & Speed, Recommended Actions; use repo files under docs/evals and results plus valid gh repo view fields; do not use stale Stream 9-only wording"
lms unload --all
```

**Result:** `results/daily-briefs/brief-20260607-135239.json` was produced and summarized in `results/stream27-w7-section-repair.json`. It is strict/no-fallback with `fallback_used=false`, `finalization_status=model_final`, all five sections present, no missing sections, `tps=3.0`, wall `513.05s`, usage `9752/1531/11283`, tools `read_file`, `web_search`, and `github`, no tool failures, and valid `gh repo view` fields.

**Assessment:** Stream 27 closes the section-completeness gap left by Stream 23. It does not close W7 quality acceptance: the model's own `Token & Speed` text uses pending placeholders even though the artifact records exact metrics, and the recommended actions include review-worthy scope issues. Treat qwen W7 as still review-gated.

### Stream 28 result - Qwen no-cache single-task probe

**Gap outcome:** The narrow "no completed qwen no-cache row at all" gap is closed. The full 40-case qwen no-cache current-suite throughput gap remains open.

**Scope:** One Promptfoo-backed qwen cell on `build-synthetic-smoke`, using `gpu_offload`, `EVAL_PROMPTFOO_NO_CACHE=true`, `EVAL_TASK_FILTER=build-synthetic-smoke`, and `EVAL_CELL_TIMEOUT_MS=300000`.

**Runner repair:** The first command showed `EVAL_TASK_FILTER` was only logged on rows and not passed to Promptfoo: `results/matrix-2026-06-07T14-02-10-218Z.jsonl` timed out at `300052 ms` after Promptfoo started 40 cases. `scripts/run-matrix.mjs` now passes the filter as `--filter-metadata taskId=<taskFilter>`.

**Command run after repair:**

```powershell
$env:EVAL_PROMPTFOO_NO_CACHE='true'
$env:EVAL_TASK_FILTER='build-synthetic-smoke'
$env:EVAL_SMOKE_MODELS='qwen/qwen3.5-9b'
$env:EVAL_SMOKE_PROFILES='gpu_offload'
$env:EVAL_CELL_TIMEOUT_MS='300000'
node scripts/run-matrix.mjs --smoke
lms unload --all
```

**Result:** `results/stream28-qwen-uncached-single-task.json` and `results/matrix-2026-06-07T14-08-47-000Z.jsonl` record `qwen/qwen3.5-9b@gpu_offload`, `taskFilter=build-synthetic-smoke`, `status=eval_failed`, `passes=0`, `total=4`, `durationMs=261012`. `results/promptfoo-latest.json` contains 4 filtered cases with `metadata.taskId=build-synthetic-smoke`, `tokenUsage.cached=0`, and empty/error local outputs. Compare and queue archives are `results/baseline-comparison-stream28-qwen-uncached-single-task.jsonl` and `results/user-judge-queue-stream28-qwen-uncached-single-task.jsonl`, each with 4 rows.

**Assessment:** This is concrete qwen no-cache latency/failure evidence for a single filtered task. It is not successful output evidence, not full current-suite throughput, and not a profile or 3-solid promotion.

### Stream 32 result - 31B Q4 offload one-task practical probe

**Gap outcome:** The 31B Q4_K_M estimate-timeout-only practical evidence gap is closed narrowly. Broad 31B readiness remains open.

**Scope:** One `google/gemma-4-31b` local fallback cell on `build-synthetic-smoke`, using `gpu_offload`, `EVAL_USE_PROMPTFOO=false`, `EVAL_TASK_FILTER=build-synthetic-smoke`, and `EVAL_CELL_TIMEOUT_MS=300000`. No 31B partial/full profile, no 31B-QAT, no 26B or mid-size model, and no retry was run.

**Command run:**

```powershell
$env:EVAL_USE_PROMPTFOO='false'
$env:EVAL_TASK_FILTER='build-synthetic-smoke'
$env:EVAL_SMOKE_MODELS='google/gemma-4-31b'
$env:EVAL_SMOKE_PROFILES='gpu_offload'
$env:EVAL_CELL_TIMEOUT_MS='300000'
node scripts/run-matrix.mjs --smoke
lms unload --all
```

**Result:** `results/stream32-31b-q4-offload-practical.json` and `results/matrix-2026-06-07T15-01-50-563Z.jsonl` record `google/gemma-4-31b@gpu_offload`, `taskFilter=build-synthetic-smoke`, `status=completed`, `passes=1`, `total=1`, `durationMs=262464`, and empty stderr. The row refreshed `results/promptfoo-latest.json`, so `results/baseline-comparison-stream32-31b-q4-offload.jsonl` and `results/user-judge-queue-stream32-31b-q4-offload.jsonl` were generated.

**Assessment:** Stream 32 moves 31B Q4_K_M from Stream 16 estimate-timeout-only status to one direct bounded offload local-fallback success row. It does not prove 31B partial/full placement, Promptfoo no-cache throughput, broad current-suite quality, final 3-solid selection, or user-accepted quality. Later Stream 34 shows 31B-QAT can reach terminal offload status with a longer cap, but still has no practical success row.

### Stream 34 result - 31B-QAT extended offload one-task probe

**Gap outcome:** The Stream 25 300s offload cap was slightly too tight to reach a terminal row, but 31B-QAT practical success remains open.

**Scope:** One `google/gemma-4-31b-qat` local fallback cell on `build-synthetic-smoke`, using `gpu_offload`, `EVAL_USE_PROMPTFOO=false`, `EVAL_TASK_FILTER=build-synthetic-smoke`, and `EVAL_CELL_TIMEOUT_MS=900000`. No 31B-QAT partial/full profile, no non-QAT 31B rerun, no 26B/qwen/liquid/mid-size model, no extra task, and no retry was run.

**Command run:**

```powershell
$env:EVAL_USE_PROMPTFOO='false'
$env:EVAL_TASK_FILTER='build-synthetic-smoke'
$env:EVAL_SMOKE_MODELS='google/gemma-4-31b-qat'
$env:EVAL_SMOKE_PROFILES='gpu_offload'
$env:EVAL_CELL_TIMEOUT_MS='900000'
node scripts/run-matrix.mjs --smoke
lms unload --all
```

**Result:** `results/stream34-31b-qat-extended-offload.json` and `results/matrix-2026-06-07T15-22-52-975Z.jsonl` record `google/gemma-4-31b-qat@gpu_offload`, `taskFilter=build-synthetic-smoke`, `status=eval_failed`, `passes=0`, `total=1`, `durationMs=305466`, empty output, and `fetch failed`. The row refreshed `results/promptfoo-latest.json`, but no compare/queue archive was generated because there was no completed model output to review.

**Assessment:** Stream 34 answers the narrow timeout-cap question: extending the cap allowed terminal status just past 300 seconds. It does not create 31B-QAT practical success evidence. 31B-QAT remains hardware/runtime-limited on this rig after partial timeout, 300s offload timeout, and extended offload failure.

### Stream 35 result - Qwen full-suite no-cache extended retry

**Gap outcome:** The qwen full 40-case no-cache throughput gap remains open. Stream 35 sharpens the limitation evidence with a longer timeout row.

**Scope:** One Promptfoo-backed qwen cell on the full current suite, using `gpu_offload`, `EVAL_PROMPTFOO_NO_CACHE=true`, no `EVAL_TASK_FILTER`, and `EVAL_CELL_TIMEOUT_MS=2400000`. No alternate qwen profile, no other model, no filtered task, and no retry was run.

**Command run:**

```powershell
$env:EVAL_PROMPTFOO_NO_CACHE='true'
$env:EVAL_SMOKE_MODELS='qwen/qwen3.5-9b'
$env:EVAL_SMOKE_PROFILES='gpu_offload'
$env:EVAL_CELL_TIMEOUT_MS='2400000'
Remove-Item Env:\EVAL_TASK_FILTER -ErrorAction SilentlyContinue
node scripts/run-matrix.mjs --smoke
lms unload --all
```

**Result:** `results/stream35-qwen-full-no-cache-extended.json` and `results/matrix-2026-06-07T15-55-23-224Z.jsonl` record `qwen/qwen3.5-9b@gpu_offload`, `taskFilter=null`, `status=eval_timeout`, `passes=null`, `total=null`, `durationMs=2400084`. The earlier crashed Stream 35 artifact `results/matrix-2026-06-07T15-42-34-484Z.jsonl` remains 0 bytes and is documented as abandoned crash evidence only. The timeout did not refresh `results/promptfoo-latest.json`, so no Stream 35 compare/queue archive was generated.

**Assessment:** Stream 35 roughly doubled the Stream 22 qwen full-suite no-cache cap (`1200052 ms`) and still timed out before pass totals. It confirms this rig is not producing a completed qwen full-suite no-cache throughput row under a 40-minute cell cap. Do not treat this as qwen throughput success, quality acceptance, or final-selection evidence beyond hardware/runtime limitation.

### Stream 36 result - Qwen assertion hardening validation

**Gap outcome:** The specific pre-hardening `undefined.includes` assertion crash is absent from the single requested post-hardening row/progress surface. Normal Promptfoo scoring and qwen throughput remain unresolved.

**Scope:** Exactly one LM Studio local Promptfoo cell on `qwen/qwen3.5-9b@gpu_offload`, filtered to `build-synthetic-smoke`, with `EVAL_PROMPTFOO_NO_CACHE=true` and `EVAL_CELL_TIMEOUT_MS=300000`. No other model, profile, task, baseline collection, cloud/API call, or retry was run.

**Command run:**

```powershell
$env:EVAL_PROMPTFOO_NO_CACHE='true'
$env:EVAL_TASK_FILTER='build-synthetic-smoke'
$env:EVAL_SMOKE_MODELS='qwen/qwen3.5-9b'
$env:EVAL_SMOKE_PROFILES='gpu_offload'
$env:EVAL_CELL_TIMEOUT_MS='300000'
node scripts/run-matrix.mjs --smoke
lms unload --all
```

**Result:** `results/stream36-qwen-assertion-hardening-validation.json` and `results/matrix-2026-06-07T16-48-17-033Z.jsonl` record `qwen/qwen3.5-9b@gpu_offload`, `taskFilter=build-synthetic-smoke`, `status=completed`, `passes=null`, `total=null`, `durationMs=666`, and empty stderr. Progress telemetry was produced at `results/matrix-2026-06-07T16-48-17-033Z.progress.jsonl` and `results/matrix-latest-progress.json`.

**Comparison:** Stream 28's filtered no-cache qwen row failed `0/4` in `261012 ms` and `results/promptfoo-latest.json` captured `TypeError: Cannot read properties of undefined (reading 'includes')`. Stream 35's timeout stderr tail repeated the same error. Stream 36 contains no `undefined.includes` error in the matrix row or progress telemetry, validating the assertion-hardening surface for this narrow cell.

**Caveat:** `results/promptfoo-latest.json` did not refresh for Stream 36 and still points at the Stream 34 31B-QAT surface, so no Stream 36 compare/queue archive was generated. `node scripts/summarize-matrix.mjs` also selected the new `.progress.jsonl` sidecar before `results/matrix-summary.json` was corrected to the actual Stream 36 matrix JSONL. Treat Stream 36 as assertion-hardening validation only, not pass-rate, quality, or throughput evidence.

## Explicitly Not Next

- Do not run the final two-verifier completion audit yet. The objective is not complete.
- Do not mark final 3-solid selection complete. Current roles are draft evidence roles only.
- Do not claim user review complete. The packet exists, but subjective scoring is pending.
- Do not launch an unbounded full matrix. It would recreate the uninterpretable long-run problem the contained-stream plan was built to avoid.

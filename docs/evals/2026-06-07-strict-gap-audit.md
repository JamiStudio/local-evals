# Strict Gap Audit - Stream 21 (2026-06-07)

**Status:** Internal remaining-gap audit after Streams 1-20, updated with Streams 22-24 evidence. This is not the final two-verifier completion audit and does not claim completion, final 3-solid selection, or subjective user review.

**Runtime boundary:** Stream 21 ran no LM Studio model loads, matrix cells, baseline collection, cloud/API calls, or paid-provider calls. Live `lms ps` was used only to confirm that no models were loaded.

**Source surfaces read:** `AGENTS.md`, `docs/engineering/agents/goal-eval.md`, `docs/engineering/agents/orchestration-reliability.md`, `docs/roadmaps/2026-06-07-contained-eval-streams-plan.md`, `results/optimization-state.json`, `results/matrix-summary.json`, `results/system-profile.json`, `registry/models.json`, `registry/load-profiles.json`, current `docs/evals/` memos, `results/user-review-packet-summary.json`, and Stream 16/17/18/20 JSON artifacts.

## Verdict Summary

The campaign has real pushed evidence across every major lane, but the original exhaustive target is not complete. The strongest covered lanes are git transparency, W7 baseline backing, local-safe DeepEval W7, and prepared human-review packet. The strongest local candidate remains qwen for specialist/W7 support, liquid remains speed/triage, and cloud/imported baselines remain the quality anchor. Those are draft roles only.

Stream 22 resolved the cache-control preflight and partially refreshed throughput: installed Promptfoo exposes `--no-cache`, now env-gated in `scripts/run-matrix.mjs` via `EVAL_PROMPTFOO_NO_CACHE=true`. Liquid completed a no-cache current-suite cell; qwen timed out under the bounded no-cache cap. Stream 23 improved qwen W7 tracker tool relevance but did not close strict quality acceptance because the final brief omitted a required section. Stream 24 added one completed 26B practical row: `google/gemma-4-26b-a4b@gpu_offload`, local fallback only, `build-synthetic-smoke`, `1/1` in `76163 ms`.

The remaining gaps split into two categories:

- **Actionable with bounded streams:** any future W7 tracker repair only if the orchestrator wants to address Stream 23's missing-section failure before user review; future large-model expansion should be explicitly scoped because Stream 24 closed only the "26B has no practical row" gap.
- **Not automatable by this harness:** subjective user review and final 3-solid promotion.

## Dimension Classification

| Dimension | Classification | Evidence | Remaining gap |
| --- | --- | --- | --- |
| All 12 models inventory | covered | `registry/models.json` lists 12 local LLMs: 26B, 12B, GLM, qwen, e2b, 31B, 31B-QAT, 12B-QAT, rnj, nemotron, liquid, e4b. | Inventory is covered; live `lms ls --json` can still drift and should be refreshed before future load-profile changes. |
| Current-suite / Promptfoo coverage | evidence exists but not complete | Small/fit class: nemotron all 11 profiles at 9/40, e2b all 11 at 11/40, e4b all 11 at 10/40, rnj all 11 at 7/40. Qwen controls at 7/40; liquid controls at 5/40. | The full original target, all 12 models x all 11 profiles on the full current suite, is not complete. 26B/31B practical coverage is absent or timeout-only; mid-size full Promptfoo coverage remains narrow. |
| Local fallback slices | narrowly covered | Stream 13/14 build slices for 12B/GLM/12B-QAT; Stream 18 widened to 9 gpu_offload cells across research, plan, and tool-call with 6/9; Stream 20 added 3/3 recommended partial plan cells. | Local fallback proves bounded feasibility for selected tasks only. It does not prove broad suite quality or user-accepted output quality. |
| Load profiles and partials | evidence exists but not complete | `registry/load-profiles.json` has 11 profiles. Stream 17 tested liquid all profiles and qwen four profiles; pass rates were invariant. Stream 20 tested one recommended partial per mid-size model on one task. Stream 22 completed liquid no-cache throughput and recorded qwen no-cache timeout. Stream 16 has large estimates. | Broad partial-profile quality remains incomplete. Qwen uncached current-suite throughput remains incomplete because the bounded no-cache cell timed out before pass totals. |
| W7 tracker | narrowly covered | Stream 12 strict qwen artifact `results/daily-briefs/brief-20260607-100231.json` is model-final, no fallback, all required sections present, `tps=3.0`, with web/read/github tools. Stream 23 artifact `results/daily-briefs/brief-20260607-125406.json` used repo-file reads and valid GitHub fields with no tool failures. | Quality is not accepted: Stream 12 has stale/weak tool relevance caveats, and Stream 23 improved those but failed strict section completeness by omitting `Token & Speed`. User review is required. |
| DeepEval W7 | covered | Stream 11 local-safe deterministic W7 lane passed 4/4 without requiring `OPENAI_API_KEY`. | Judge-backed DeepEval metrics remain opt-in and are not needed for the local-safe default lane. |
| Baselines and user-review queue | pending user review | Stream 9 collected W7 baselines; qwen/liquid model-specific archives are 40/40 baseline-backed with W7 8/8. Stream 19 prepared the review packet. | Human scoring has not happened. Automation cannot mark this complete without the user. |
| Cloud/imported baselines and no-direct-paid boundary | narrowly covered | Current Vertex baseline lane and W7 imported baselines exist; no direct paid matrix/API calls were run in Streams 16-21. | Additional SOTA peers beyond current imported baseline lane are not broadly imported. Do not run cloud/API collection unless explicitly scoped and credit-gated. |
| Large 26B/31B evidence | evidence exists but not complete | Stream 16 estimates returned for 26B and 31B-QAT; 31B Q4_K_M estimates timed out; first practical 31B-QAT partial build cell timed out at 300022 ms. Stream 24 added one completed 26B offload local-fallback `build-synthetic-smoke` row: `1/1`, `76163 ms`, no timeout/load failure. | The previous "26B has no practical cell" gap is closed narrowly. Large-model proof remains incomplete: 26B has only one offload build cell, 26B partial is untested practically, 31B Q4_K_M has estimate-timeout only, and 31B-QAT has timeout-only practical evidence. |
| Synthesis/ranking/3-solid status | evidence exists but not complete | Current memos name draft roles: qwen local specialist, liquid speed/triage, cloud baseline/ref. | Final 3-solid selection is incomplete until user review and remaining material gaps are resolved or explicitly accepted as hardware/time limits. |
| Git transparency and push cadence | covered | Streams 1-20 were committed and pushed; Stream 21 adds this audit as a committed checkpoint. | Keep pushing after each future stream. |
| Verification ladder status | evidence exists but not complete | Repeated `pnpm verify`, JSON parses, `git diff --check`, `lms ps`, and per-stream checks passed in prior stream closeouts. | This is not the final two-verifier completion audit. Final completion verification remains pending. |

## Smallest Next Three Streams

These streams reduce real gaps without pretending that user review is done and without launching an unbounded full matrix.

### Stream 22 result - Uncached qwen/liquid runtime refresh

**Gap outcome:** Promptfoo cache control is confirmed and liquid now has fresh no-cache current-suite throughput. Qwen no-cache current-suite throughput is still incomplete under the bounded cap.

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

## Explicitly Not Next

- Do not run the final two-verifier completion audit yet. The objective is not complete.
- Do not mark final 3-solid selection complete. Current roles are draft evidence roles only.
- Do not claim user review complete. The packet exists, but subjective scoring is pending.
- Do not launch an unbounded full matrix. It would recreate the uninterpretable long-run problem the contained-stream plan was built to avoid.

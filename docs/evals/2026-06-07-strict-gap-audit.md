# Strict Gap Audit - Stream 21 (2026-06-07)

**Status:** Internal remaining-gap audit after Streams 1-20, updated with Stream 22 evidence. This is not the final two-verifier completion audit and does not claim completion, final 3-solid selection, or subjective user review.

**Runtime boundary:** Stream 21 ran no LM Studio model loads, matrix cells, baseline collection, cloud/API calls, or paid-provider calls. Live `lms ps` was used only to confirm that no models were loaded.

**Source surfaces read:** `AGENTS.md`, `docs/engineering/agents/goal-eval.md`, `docs/engineering/agents/orchestration-reliability.md`, `docs/roadmaps/2026-06-07-contained-eval-streams-plan.md`, `results/optimization-state.json`, `results/matrix-summary.json`, `results/system-profile.json`, `registry/models.json`, `registry/load-profiles.json`, current `docs/evals/` memos, `results/user-review-packet-summary.json`, and Stream 16/17/18/20 JSON artifacts.

## Verdict Summary

The campaign has real pushed evidence across every major lane, but the original exhaustive target is not complete. The strongest covered lanes are git transparency, W7 baseline backing, local-safe DeepEval W7, and prepared human-review packet. The strongest local candidate remains qwen for specialist/W7 support, liquid remains speed/triage, and cloud/imported baselines remain the quality anchor. Those are draft roles only.

Stream 22 resolved the cache-control preflight and partially refreshed throughput: installed Promptfoo exposes `--no-cache`, now env-gated in `scripts/run-matrix.mjs` via `EVAL_PROMPTFOO_NO_CACHE=true`. Liquid completed a no-cache current-suite cell; qwen timed out under the bounded no-cache cap.

The remaining gaps split into two categories:

- **Actionable with bounded streams:** uncached qwen/liquid runtime refresh, one improved strict qwen W7 tracker refresh, and one safer large-model 26B offload or lower-GPU retry.
- **Not automatable by this harness:** subjective user review and final 3-solid promotion.

## Dimension Classification

| Dimension | Classification | Evidence | Remaining gap |
| --- | --- | --- | --- |
| All 12 models inventory | covered | `registry/models.json` lists 12 local LLMs: 26B, 12B, GLM, qwen, e2b, 31B, 31B-QAT, 12B-QAT, rnj, nemotron, liquid, e4b. | Inventory is covered; live `lms ls --json` can still drift and should be refreshed before future load-profile changes. |
| Current-suite / Promptfoo coverage | evidence exists but not complete | Small/fit class: nemotron all 11 profiles at 9/40, e2b all 11 at 11/40, e4b all 11 at 10/40, rnj all 11 at 7/40. Qwen controls at 7/40; liquid controls at 5/40. | The full original target, all 12 models x all 11 profiles on the full current suite, is not complete. 26B/31B practical coverage is absent or timeout-only; mid-size full Promptfoo coverage remains narrow. |
| Local fallback slices | narrowly covered | Stream 13/14 build slices for 12B/GLM/12B-QAT; Stream 18 widened to 9 gpu_offload cells across research, plan, and tool-call with 6/9; Stream 20 added 3/3 recommended partial plan cells. | Local fallback proves bounded feasibility for selected tasks only. It does not prove broad suite quality or user-accepted output quality. |
| Load profiles and partials | evidence exists but not complete | `registry/load-profiles.json` has 11 profiles. Stream 17 tested liquid all profiles and qwen four profiles; pass rates were invariant. Stream 20 tested one recommended partial per mid-size model on one task. Stream 22 completed liquid no-cache throughput and recorded qwen no-cache timeout. Stream 16 has large estimates. | Broad partial-profile quality remains incomplete. Qwen uncached current-suite throughput remains incomplete because the bounded no-cache cell timed out before pass totals. |
| W7 tracker | narrowly covered | Stream 12 strict qwen artifact `results/daily-briefs/brief-20260607-100231.json` is model-final, no fallback, all required sections present, `tps=3.0`, with web/read/github tools. | Quality is not accepted: stale wording, weak web-search relevance, and one invalid GitHub field request remain. User review is required. |
| DeepEval W7 | covered | Stream 11 local-safe deterministic W7 lane passed 4/4 without requiring `OPENAI_API_KEY`. | Judge-backed DeepEval metrics remain opt-in and are not needed for the local-safe default lane. |
| Baselines and user-review queue | pending user review | Stream 9 collected W7 baselines; qwen/liquid model-specific archives are 40/40 baseline-backed with W7 8/8. Stream 19 prepared the review packet. | Human scoring has not happened. Automation cannot mark this complete without the user. |
| Cloud/imported baselines and no-direct-paid boundary | narrowly covered | Current Vertex baseline lane and W7 imported baselines exist; no direct paid matrix/API calls were run in Streams 16-21. | Additional SOTA peers beyond current imported baseline lane are not broadly imported. Do not run cloud/API collection unless explicitly scoped and credit-gated. |
| Large 26B/31B evidence | not complete | Stream 16 estimates returned for 26B and 31B-QAT; 31B Q4_K_M estimates timed out; first practical 31B-QAT partial build cell timed out at 300022 ms. | No large model has a completed practical pass. 26B has no practical cell; 31B Q4_K_M has estimate-timeout only; 31B-QAT has timeout-only practical evidence. |
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

### Recommended Stream 23 - Improved strict qwen W7 tracker quality refresh

**Gap closed:** W7 no-fallback behavior is proven, but the quality caveats are unresolved.

**Scope:** One strict qwen tracker run with tighter query/tool constraints and no fallback. Keep one model loaded at a time; no cloud calls.

**Proposed command:**

```powershell
lms unload --all
lms load qwen/qwen3.5-9b --gpu off -y
uv run python scripts/daily-brief-tracker.py --model qwen/qwen3.5-9b --use-specialist --strict-final --max-steps 4 --query "JamiStudio/local-evals Stream 21 gap audit qwen liquid mid-size large model evidence June 7 2026; use repo files and valid gh repo view only"
lms unload --all
```

**Risk:** Medium. Prior strict run took 457.92 seconds and may still produce stale or weak tool output. A better artifact materially helps W7 review; a worse artifact is still honest evidence.

### Recommended Stream 24 - 26B offload or lower-partial one-task practical retry

**Gap closed:** Large-model evidence is currently estimate/timeout only. A single 26B practical cell would be materially better than another 31B-QAT timeout.

**Scope:** One `google/gemma-4-26b-a4b` local fallback cell on `build-synthetic-smoke`, starting with `gpu_offload` because Stream 16 proved `gpu_partial_0.39` estimates at 6.99 GiB GPU but 31B-QAT partial timed out. Stop after one timeout or one completed row.

**Proposed command:**

```powershell
$env:EVAL_USE_PROMPTFOO='false'
$env:EVAL_TASK_FILTER='build-synthetic-smoke'
$env:EVAL_SMOKE_MODELS='google/gemma-4-26b-a4b'
$env:EVAL_SMOKE_PROFILES='gpu_offload'
$env:EVAL_CELL_TIMEOUT_MS='300000'
node scripts/run-matrix.mjs --smoke
lms unload --all
```

**Risk:** High. It may timeout or be too slow. It is still bounded and safer than broad 26B/31B partial/full matrix. Do not chain to another large cell unless this single cell completes quickly with clean runtime closeout.

## Explicitly Not Next

- Do not run the final two-verifier completion audit yet. The objective is not complete.
- Do not mark final 3-solid selection complete. Current roles are draft evidence roles only.
- Do not claim user review complete. The packet exists, but subjective scoring is pending.
- Do not launch an unbounded full matrix. It would recreate the uninterpretable long-run problem the contained-stream plan was built to avoid.

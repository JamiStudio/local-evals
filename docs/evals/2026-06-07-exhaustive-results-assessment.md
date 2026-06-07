# Exhaustive Results Assessment — Current Addendum (2026-06-07)

**Status:** Current synthesis after Streams 9-20. This report corrects older pre-Stream-9 language. It does not claim final exhaustive completion.

**Boundary:** Stream 15 was docs/report/state synthesis only. Stream 16 added large-model estimate-only probes and one bounded practical timeout cell. Stream 17 added qwen/liquid current-suite profile-sensitivity cells only. Stream 18 added a bounded mid-size local fallback task slice only. Stream 19 prepared the human review packet only. Stream 20 added one bounded mid-size partial-profile task slice only. No cloud runs or baseline collection were performed in these streams.

## Current Coverage

### Fit-Class And Small Controls

- **Stream 2:** `nvidia/nemotron-3-nano-4b` across all 11 profiles, 11 cells, `9/40` on every profile, 0 load failures. Profile differences affected duration only.
- **Stream 3:** fit-class all-profile slice, 33 cells, 0 load failures: `google/gemma-4-e2b` `11/40`, `google/gemma-4-e4b` `10/40`, `essentialai/rnj-1` `7/40` on every profile. Profile differences affected duration only.
- **Stream 7:** qwen current-suite control, `qwen/qwen3.5-9b@gpu_offload`, `7/40` (17.5%, rounded 18%).
- **Stream 8 / 10 archive:** liquid current-suite control, `liquid/lfm2.5-1.2b@gpu_full`, `5/40` (12.5%, rounded 13%).
- **Stream 17:** qwen/liquid current-suite profile-sensitivity slice. Liquid ran all 11 current profiles in `results/matrix-2026-06-07T11-05-50-387Z.jsonl`; every profile was `5/40`, `eval_partial`, with no load failures or timeouts. Qwen ran `gpu_offload`, `gpu_partial_0.95`, `gpu_partial_0.7`, and `gpu_full` across four one-cell JSONLs; every tested profile was `7/40`, `eval_partial`, with no timeouts. The qwen Stream 17 durations are cached Promptfoo reruns, not fresh uncached throughput.

### Baseline And Review Queues

- **Stream 9:** W7 baselines were collected for `daily-brief-synthetic-smoke` and `interest-tracker-tool-use`. Refreshed compare/queue reported 40 comparisons, 40 baseline-backed, W7 8/8 backed.
- **Stream 10:** Model-specific evidence was preserved:
  - `results/baseline-comparison-liquid-stream8.jsonl` and `results/user-judge-queue-liquid-stream8.jsonl`: 40 rows, 40 backed, W7 8/8.
  - `results/baseline-comparison-qwen-stream10.jsonl` and `results/user-judge-queue-qwen-stream10.jsonl`: 40 rows, 40 backed, W7 8/8.
- **Stream 17 archives:** `results/baseline-comparison-liquid-stream17.jsonl`, `results/user-judge-queue-liquid-stream17.jsonl`, `results/baseline-comparison-qwen-stream17.jsonl`, and `results/user-judge-queue-qwen-stream17.jsonl` each contain 40 rows / 40 baseline-backed comparisons for the final promptfoo surface of that model's Stream 17 slice.
- **Important:** latest default compare/queue files are last-cell surfaces. After Stream 17 they point to the final qwen `gpu_full` promptfoo output, while the full profile-sensitivity evidence lives in `results/stream17-profile-sensitivity.json` and the raw Stream 17 JSONLs.
- **Stream 18 default-surface caveat:** after Stream 18, default compare/queue point only to the final 12B-QAT `tool-call-search-docs` cell. The archived last-cell surfaces are `results/baseline-comparison-stream18-last-cell.jsonl` and `results/user-judge-queue-stream18-last-cell.jsonl`; the full Stream 18 evidence is `results/stream18-mid-size-task-slice.json` plus its raw JSONLs.
- **Stream 19 review packet:** `docs/evals/2026-06-07-user-review-packet.md` and `results/user-review-packet-summary.json` gather qwen/liquid Stream 17 queue counts, Stream 18 last-cell/full-slice caveats, W7 strict qwen tracker, DeepEval W7, and Stream 16 large-model timeout context for human review. The packet does not record subjective scores.
- **Stream 20 default-surface caveat:** after Stream 20, default compare/queue point only to the final 12B-QAT `plan-synthetic-smoke` partial-profile cell. The archived last-cell surfaces are `results/baseline-comparison-stream20-last-cell.jsonl` and `results/user-judge-queue-stream20-last-cell.jsonl`; the full Stream 20 evidence is `results/stream20-mid-size-partial-profile.json` plus its raw JSONLs.

### W7 Daily-Briefs / Tracker

- **Stream 11:** DeepEval W7 local-safe lane passed 4/4 after deterministic tool, plan, and brief assertions replaced default direct OpenAI metric construction unless explicitly env-gated.
- **Stream 12:** `results/daily-briefs/brief-20260607-100231.json` is strict, model-final, no-fallback qwen evidence: all five required sections present, `web_search`/`read_file`/`github` observed, `tps=3.0`, wall `457.92s`, usage `5141/1393/6534`.
- **Caveat:** the strict brief has quality/freshness issues: one invalid GitHub JSON-field request, unrelated web results, and stale wording about W7 status. It proves finalization behavior, not final quality acceptance.

### Mid-Size Stream 4 Target Set

- **Stream 4:** earlier broad mid-size attempts produced zero-row timeout/abort evidence only.
- **Stream 13:** bounded local fallback proof for `google/gemma-4-12b@gpu_offload`, `build-synthetic-smoke`, `1/1`, `71342 ms`.
- **Stream 14:** bounded local fallback proof for `zai-org/glm-4.6v-flash@gpu_offload`, `1/1`, `97743 ms`, and `google/gemma-4-12b-qat@gpu_offload`, `1/1`, `70425 ms`.
- **Stream 18:** wider bounded local fallback task slice for `google/gemma-4-12b`, `zai-org/glm-4.6v-flash`, and `google/gemma-4-12b-qat` at `gpu_offload` on `research-harness-tools`, `plan-synthetic-smoke`, and `tool-call-search-docs`. Artifacts: `results/matrix-2026-06-07T11-18-54-078Z.jsonl`, `results/matrix-2026-06-07T11-24-51-998Z.jsonl`, `results/matrix-2026-06-07T11-31-25-946Z.jsonl`, and `results/stream18-mid-size-task-slice.json`. Result: 9 cells, 6/9 passed, 0 timeouts, 0 load failures.
- **Stream 20:** recommended partial-profile comparison on the best-behaved Stream 18 task, `plan-synthetic-smoke`. Artifacts: `results/matrix-2026-06-07T11-50-34-088Z.jsonl`, `results/matrix-2026-06-07T11-53-01-973Z.jsonl`, `results/matrix-2026-06-07T11-54-53-937Z.jsonl`, and `results/stream20-mid-size-partial-profile.json`. Results: `google/gemma-4-12b@gpu_partial_0.9` 1/1 in 132311 ms, `zai-org/glm-4.6v-flash@gpu_partial_0.88` 1/1 in 96438 ms, and `google/gemma-4-12b-qat@gpu_partial_0.95` 1/1 in 126922 ms, with 0 timeouts and 0 load failures.
- **Caveat:** this proves only a small local fallback task slice and one recommended partial per mid-size model. It does not prove Promptfoo full-suite behavior, partial GPU profiles across other tasks, broad task subsets, or quality ranking.

### Large 26B / 31B Practical Slice

- **Stream 16 estimates:** `results/stream16-large-estimates.json` records fresh large-model gates. `google/gemma-4-26b-a4b` returned estimates for full, `gpu_partial_0.39`, and offload; the recommended partial estimate was 6.99 GiB GPU / 17.43 GiB total. `google/gemma-4-31b-qat` returned estimates for full, `gpu_partial_0.36`, and offload; the recommended partial estimate was 6.89 GiB GPU / 18.66 GiB total. `google/gemma-4-31b` estimate-only probes for full, `gpu_partial_0.35`, and offload each timed out at 120000 ms.
- **Stream 16 practical attempt:** the first practical large cell was `google/gemma-4-31b-qat@gpu_partial_0.36`, local fallback only, `build-synthetic-smoke`, with `EVAL_CELL_TIMEOUT_MS=300000`. It wrote `results/matrix-2026-06-07T10-52-18-029Z.jsonl` with `status=eval_timeout`, `durationMs=300022`, and no pass count.
- **Caveat:** this narrows the large-model evidence gap but does not prove practical large-model quality. The run stopped after the first practical timeout, so 26B and 31B Q4_K_M have no completed practical cells.

## What Is No Longer Accurate

- W7 baselines are not 0 imports anymore.
- W7 tracker evidence is not dry-only or fallback-only anymore.
- DeepEval W7 default local smoke is not broken by missing direct paid API credentials anymore.
- The mid-size set is not zero-row only anymore; it has bounded one-task fallback proof.
- The old `qwen 5/8` smoke-leader sentence is stale for current ranking. Current qwen/liquid controls are 40-assertion evidence: qwen 7/40, liquid 5/40.
- Qwen/liquid current-suite profile sensitivity is no longer completely unmeasured: Stream 17 found invariant pass rates across the tested qwen profiles and all 11 liquid profiles.

## Still Missing

- Subjective user review for the qwen/liquid baseline-backed queues. Use `docs/evals/2026-06-07-user-review-packet.md` as the prepared packet; review is not complete.
- Full/broad local matrix completion across all models and all relevant profiles.
- Large 26B/31B completed practical proof beyond Stream 16 estimate/timeout evidence.
- Broad partial GPU profile measurements remain open: Stream 17 covers qwen/liquid profile sensitivity, and Stream 20 covers one mid-size task on recommended partials only. Stream 17 qwen timings are cached rather than fresh throughput.
- Wider mid-size task coverage beyond `build-synthetic-smoke` is narrowed by Stream 18, and one-task mid-size partial-profile coverage is narrowed by Stream 20, but broad mid-size suite/profile coverage remains open.
- SOTA peer imports beyond the current Vertex baseline lane where policy requires them.
- Final evidence-backed 3-solid selection and strict completion verification.

## Current Assessment

The campaign has progressed from stale smoke-only/W7-dry evidence to a much stronger but still incomplete state:

- qwen is the local specialist candidate with strict W7 finalization and baseline-backed review evidence, but weak 40-assertion deterministic score and quality caveats. Stream 17 did not show a pass-rate win for full or partial profiles over offload.
- liquid is the speed/triage control with fully backed review archives, but weaker deterministic score. Stream 17 did not show a pass-rate win for any liquid profile, so `gpu_full` remains speed/fit driven.
- cloud baselines remain the review ceiling and comparison anchor.
- mid-size models have a repaired bounded local-fallback path for one build task, a small non-build task slice, and a one-task recommended-partial slice. This supports cautious incremental expansion, not broad quality claims.

Do not promote final completion or final 3-solid decisions from this state.

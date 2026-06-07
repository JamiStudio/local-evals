# Exhaustive Results Assessment — Current Addendum (2026-06-07)

**Status:** Current synthesis after Streams 9-16. This report corrects older pre-Stream-9 language. It does not claim final exhaustive completion.

**Boundary:** Stream 15 was docs/report/state synthesis only. Stream 16 added large-model estimate-only probes and one bounded practical timeout cell. No cloud runs or baseline collection were performed in either stream.

## Current Coverage

### Fit-Class And Small Controls

- **Stream 2:** `nvidia/nemotron-3-nano-4b` across all 11 profiles, 11 cells, `9/40` on every profile, 0 load failures. Profile differences affected duration only.
- **Stream 3:** fit-class all-profile slice, 33 cells, 0 load failures: `google/gemma-4-e2b` `11/40`, `google/gemma-4-e4b` `10/40`, `essentialai/rnj-1` `7/40` on every profile. Profile differences affected duration only.
- **Stream 7:** qwen current-suite control, `qwen/qwen3.5-9b@gpu_offload`, `7/40` (17.5%, rounded 18%).
- **Stream 8 / 10 archive:** liquid current-suite control, `liquid/lfm2.5-1.2b@gpu_full`, `5/40` (12.5%, rounded 13%).

### Baseline And Review Queues

- **Stream 9:** W7 baselines were collected for `daily-brief-synthetic-smoke` and `interest-tracker-tool-use`. Refreshed compare/queue reported 40 comparisons, 40 baseline-backed, W7 8/8 backed.
- **Stream 10:** Model-specific evidence was preserved:
  - `results/baseline-comparison-liquid-stream8.jsonl` and `results/user-judge-queue-liquid-stream8.jsonl`: 40 rows, 40 backed, W7 8/8.
  - `results/baseline-comparison-qwen-stream10.jsonl` and `results/user-judge-queue-qwen-stream10.jsonl`: 40 rows, 40 backed, W7 8/8.
- **Important:** latest default compare/queue files currently reflect the Stream 14 last-cell local fallback surface, not the qwen/liquid 40-row archives.

### W7 Daily-Briefs / Tracker

- **Stream 11:** DeepEval W7 local-safe lane passed 4/4 after deterministic tool, plan, and brief assertions replaced default direct OpenAI metric construction unless explicitly env-gated.
- **Stream 12:** `results/daily-briefs/brief-20260607-100231.json` is strict, model-final, no-fallback qwen evidence: all five required sections present, `web_search`/`read_file`/`github` observed, `tps=3.0`, wall `457.92s`, usage `5141/1393/6534`.
- **Caveat:** the strict brief has quality/freshness issues: one invalid GitHub JSON-field request, unrelated web results, and stale wording about W7 status. It proves finalization behavior, not final quality acceptance.

### Mid-Size Stream 4 Target Set

- **Stream 4:** earlier broad mid-size attempts produced zero-row timeout/abort evidence only.
- **Stream 13:** bounded local fallback proof for `google/gemma-4-12b@gpu_offload`, `build-synthetic-smoke`, `1/1`, `71342 ms`.
- **Stream 14:** bounded local fallback proof for `zai-org/glm-4.6v-flash@gpu_offload`, `1/1`, `97743 ms`, and `google/gemma-4-12b-qat@gpu_offload`, `1/1`, `70425 ms`.
- **Caveat:** this proves only a narrow one-task `gpu_offload` local fallback path. It does not prove Promptfoo full-suite behavior, partial GPU profiles, wider task subsets, or quality ranking.

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

## Still Missing

- Subjective user review for the qwen/liquid baseline-backed queues.
- Full/broad local matrix completion across all models and all relevant profiles.
- Large 26B/31B completed practical proof beyond Stream 16 estimate/timeout evidence.
- Broad partial GPU profile measurements.
- Wider mid-size task coverage beyond `build-synthetic-smoke`.
- SOTA peer imports beyond the current Vertex baseline lane where policy requires them.
- Final evidence-backed 3-solid selection and strict completion verification.

## Current Assessment

The campaign has progressed from stale smoke-only/W7-dry evidence to a much stronger but still incomplete state:

- qwen is the local specialist candidate with strict W7 finalization and baseline-backed review evidence, but weak 40-assertion deterministic score and quality caveats.
- liquid is the speed/triage control with fully backed review archives, but weaker deterministic score.
- cloud baselines remain the review ceiling and comparison anchor.
- mid-size models have a repaired bounded local-fallback path for one build task, which supports cautious incremental expansion.

Do not promote final completion or final 3-solid decisions from this state.

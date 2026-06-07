# Exhaustive Assessment — Current Snapshot (2026-06-07)

**Status:** Current snapshot aligned to Streams 9-34. This is a synthesis aid, not a completion certificate.

**Strict gap audit:** See `docs/evals/2026-06-07-strict-gap-audit.md` for the Stream 21 classification table and recommended next bounded streams.

**Readiness synthesis:** See `docs/evals/2026-06-07-stream30-readiness-synthesis.md` for the current review-ready candidate/status packet, with later Stream 32/34 large-model evidence reflected in the large-model lanes.

## Current Facts

- W7 baselines exist for both registered W7 tasks; qwen and liquid archived queues are 40/40 baseline-backed with W7 8/8 backed.
- Qwen strict real W7 tracker artifact exists at `results/daily-briefs/brief-20260607-100231.json`: model-final, no fallback, all sections present, `tps=3.0`, with tool-quality caveats.
- Stream 27 repaired the later Stream 23 section-completeness gap: `results/daily-briefs/brief-20260607-135239.json` is strict, model-final, no fallback, all five sections present, `tps=3.0`, wall `513.05s`, usage `9752/1531/11283`, and no tool failures. Quality acceptance remains user-review gated.
- DeepEval W7 local-safe tests pass 4/4.
- Small/fit-class all-profile data exists for nemotron, e2b, e4b, and rnj; qwen/liquid have current-suite controls.
- Stream 4 mid-size targets have bounded one-task local fallback proof on `build-synthetic-smoke`: 12B, GLM, and 12B-QAT completed 1/1 on `gpu_offload`.
- Stream 16 added large-model estimate/timeout evidence: 26B and 31B-QAT recommended partial estimates returned, 31B Q4_K_M estimate probes timed out, and the first practical 31B-QAT partial local fallback cell timed out at `300022 ms`.
- Stream 24 added one completed 26B offload practical row: `google/gemma-4-26b-a4b@gpu_offload`, `build-synthetic-smoke`, `1/1`, `76163 ms`, no timeout or load failure.
- Stream 25 added one bounded 31B-QAT offload practical timeout row: `google/gemma-4-31b-qat@gpu_offload`, `build-synthetic-smoke`, `eval_timeout`, `300031 ms`, no pass totals.
- Stream 26 added one completed 26B recommended-partial practical row: `google/gemma-4-26b-a4b@gpu_partial_0.39`, `build-synthetic-smoke`, `1/1`, `72024 ms`, no timeout or load failure.
- Stream 32 added one completed non-QAT 31B Q4 offload practical row: `google/gemma-4-31b@gpu_offload`, `build-synthetic-smoke`, `1/1`, `262464 ms`, no timeout or load failure.
- Stream 34 extended the 31B-QAT offload cap to 900s and reached terminal status, but failed `0/1` in `305466 ms` with empty output and `fetch failed`.
- Stream 17 added qwen/liquid current-suite profile-sensitivity evidence: liquid ran all 11 profiles at `5/40`; qwen ran `gpu_offload`, `gpu_partial_0.95`, `gpu_partial_0.7`, and `gpu_full` at `7/40`. No final placement winner changed.
- Stream 18 added bounded mid-size local fallback task coverage beyond `build-synthetic-smoke`: 12B, GLM, and 12B-QAT ran `research-harness-tools`, `plan-synthetic-smoke`, and `tool-call-search-docs` on `gpu_offload`, with 9 cells, 6/9 passed, 0 timeouts, and 0 load failures.
- Stream 20 added bounded mid-size recommended-partial coverage for the best-behaved Stream 18 task: 12B `gpu_partial_0.9`, GLM `gpu_partial_0.88`, and 12B-QAT `gpu_partial_0.95` each passed `plan-synthetic-smoke` 1/1 with no timeout.
- Stream 28 added one qwen no-cache filtered Promptfoo row on `build-synthetic-smoke`: `0/4`, `261012 ms`, `cached=0`; this is failure/latency evidence, not full-suite throughput.
- Stream 29 added three mid-size recommended-partial Promptfoo no-cache filtered timeout rows on `build-synthetic-smoke`; all timed out at about 300s before pass totals.
- Stream 30 added `docs/evals/2026-06-07-stream30-readiness-synthesis.md`, a no-load review-ready synthesis that keeps qwen/liquid/cloud roles draft and user-review gated.

## Current Non-Completion Facts

- User review is pending.
- Broad/full matrix coverage remains incomplete.
- Large 26B/31B practical proof is still narrow: Streams 24 and 26 prove one 26B offload build cell and one 26B partial build cell only, Stream 32 proves one slow non-QAT 31B Q4 offload build cell, and 31B-QAT has no success row after partial timeout, 300s offload timeout, and extended offload failure.
- Partial GPU profiles are not broadly measured outside contained slices; Stream 17 qwen/liquid quality was invariant and qwen durations were cached reruns, not uncached throughput. Stream 22 closes liquid no-cache throughput only; qwen no-cache current-suite throughput timed out before pass totals. Stream 20 covers only one mid-size task on one recommended partial profile per model.
- Mid-size coverage is not broad; it is one build proof, a small three-task local fallback slice on `gpu_offload`, and one recommended-partial plan-task slice only.
- Final 3-solid model selection is not complete.
- Stream 30 does not change that boundary; it recommends user review of the packet, or a no-load scoring worksheet stream, before any final 3-solid promotion.

Use `docs/evals/2026-06-07-exhaustive-results-assessment.md`, `docs/evals/2026-06-07-placement-decisions.md`, and `docs/evals/2026-06-07-3-solid-models.md` for the current detailed draft evidence.

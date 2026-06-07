# Exhaustive Assessment — Current Snapshot (2026-06-07)

**Status:** Current snapshot aligned to Streams 9-24. This is a synthesis aid, not a completion certificate.

**Strict gap audit:** See `docs/evals/2026-06-07-strict-gap-audit.md` for the Stream 21 classification table and recommended next bounded streams.

## Current Facts

- W7 baselines exist for both registered W7 tasks; qwen and liquid archived queues are 40/40 baseline-backed with W7 8/8 backed.
- Qwen strict real W7 tracker artifact exists at `results/daily-briefs/brief-20260607-100231.json`: model-final, no fallback, all sections present, `tps=3.0`, with tool-quality caveats.
- DeepEval W7 local-safe tests pass 4/4.
- Small/fit-class all-profile data exists for nemotron, e2b, e4b, and rnj; qwen/liquid have current-suite controls.
- Stream 4 mid-size targets have bounded one-task local fallback proof on `build-synthetic-smoke`: 12B, GLM, and 12B-QAT completed 1/1 on `gpu_offload`.
- Stream 16 added large-model estimate/timeout evidence: 26B and 31B-QAT recommended partial estimates returned, 31B Q4_K_M estimate probes timed out, and the first practical 31B-QAT partial local fallback cell timed out at `300022 ms`.
- Stream 24 added one completed 26B offload practical row: `google/gemma-4-26b-a4b@gpu_offload`, `build-synthetic-smoke`, `1/1`, `76163 ms`, no timeout or load failure.
- Stream 17 added qwen/liquid current-suite profile-sensitivity evidence: liquid ran all 11 profiles at `5/40`; qwen ran `gpu_offload`, `gpu_partial_0.95`, `gpu_partial_0.7`, and `gpu_full` at `7/40`. No final placement winner changed.
- Stream 18 added bounded mid-size local fallback task coverage beyond `build-synthetic-smoke`: 12B, GLM, and 12B-QAT ran `research-harness-tools`, `plan-synthetic-smoke`, and `tool-call-search-docs` on `gpu_offload`, with 9 cells, 6/9 passed, 0 timeouts, and 0 load failures.
- Stream 20 added bounded mid-size recommended-partial coverage for the best-behaved Stream 18 task: 12B `gpu_partial_0.9`, GLM `gpu_partial_0.88`, and 12B-QAT `gpu_partial_0.95` each passed `plan-synthetic-smoke` 1/1 with no timeout.

## Current Non-Completion Facts

- User review is pending.
- Broad/full matrix coverage remains incomplete.
- Large 26B/31B practical proof is still narrow: Stream 24 proves one 26B offload build cell, while 26B partial, 31B Q4_K_M, and 31B-QAT practical usefulness remain unresolved.
- Partial GPU profiles are not broadly measured outside contained slices; Stream 17 qwen/liquid quality was invariant and qwen durations were cached reruns, not uncached throughput. Stream 22 closes liquid no-cache throughput only; qwen no-cache current-suite throughput timed out before pass totals. Stream 20 covers only one mid-size task on one recommended partial profile per model.
- Mid-size coverage is not broad; it is one build proof, a small three-task local fallback slice on `gpu_offload`, and one recommended-partial plan-task slice only.
- Final 3-solid model selection is not complete.

Use `docs/evals/2026-06-07-exhaustive-results-assessment.md`, `docs/evals/2026-06-07-placement-decisions.md`, and `docs/evals/2026-06-07-3-solid-models.md` for the current detailed draft evidence.

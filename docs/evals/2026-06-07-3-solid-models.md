# 3 Solid Models — Current Evidence Memo (2026-06-07)

**Status:** Draft evidence memo, not final completion. Streams 9-20 materially refreshed the evidence base and prepared a human review packet, but subjective user review, broad/full matrix coverage, completed large-model proofs, broad uncached partial-profile measurements, and final selection remain open.

**Scope boundary:** This memo covers the `evals` harness only. Automated model runs are LM Studio local; cloud outputs are imported/credit-funded baselines and review anchors, not direct paid API calls from the matrix harness.

## Current Evidence Inputs

- **Qwen current-suite control:** Stream 10 archived qwen review evidence at `results/baseline-comparison-qwen-stream10.jsonl` and `results/user-judge-queue-qwen-stream10.jsonl`: 40 rows, 40 baseline-backed, W7 8/8 backed. The qwen cell is `qwen/qwen3.5-9b@gpu_offload`, `7/40` (17.5%, rounded 18%). Promptfoo reported `7 passed`, `25 failed`, `8 errors`; the run used cached eval tokens, so it is review evidence more than fresh runtime evidence.
- **Liquid current-suite control:** Stream 10 preserved Stream 8 liquid archives at `results/baseline-comparison-liquid-stream8.jsonl` and `results/user-judge-queue-liquid-stream8.jsonl`: 40 rows, 40 baseline-backed, W7 8/8 backed. Liquid is `liquid/lfm2.5-1.2b@gpu_full`, `5/40` (12.5%, rounded 13%), much faster than the uncached Stream 7 qwen cell but weaker on deterministic outcome.
- **Stream 17 profile-sensitivity slice:** `results/stream17-profile-sensitivity.json` records the bounded current-suite profile check. Liquid ran all 11 current load profiles and tied at `5/40` on every profile. Qwen ran `gpu_offload`, `gpu_partial_0.95`, `gpu_partial_0.7`, and `gpu_full`; all four tied at `7/40`. Stream 17 archives are `results/baseline-comparison-liquid-stream17.jsonl`, `results/user-judge-queue-liquid-stream17.jsonl`, `results/baseline-comparison-qwen-stream17.jsonl`, and `results/user-judge-queue-qwen-stream17.jsonl`. The qwen timings in this stream are cached Promptfoo reruns, not fresh uncached throughput evidence.
- **W7 baselines:** Stream 9 imported W7 baselines for `daily-brief-synthetic-smoke` and `interest-tracker-tool-use`. The qwen and liquid model-specific queues are now 40/40 baseline-backed with W7 8/8 backed. User review is still pending.
- **W7 real tracker:** Stream 12 produced strict qwen artifact `results/daily-briefs/brief-20260607-100231.json`: `strict_final=true`, `finalization_status=model_final`, `fallback_used=false`, all five required sections present, tools used `web_search`, `read_file`, and `github`, usage `5141/1393/6534`, wall `457.92s`, `tps=3.0`. Caveats: one invalid GitHub JSON-field request, poor web-search relevance, and stale wording inside the model-generated brief.
- **DeepEval W7 lane:** Stream 11 repaired the local-safe W7 DeepEval lane. `uv run deepeval test run suites\deepeval\test_workflows.py -v` passed 4/4 without requiring `OPENAI_API_KEY`; judge-backed metrics remain opt-in.
- **Mid-size fallback proof:** Streams 13-14 proved a narrow local fallback path on `build-synthetic-smoke`, `gpu_offload`, `EVAL_USE_PROMPTFOO=false`: `google/gemma-4-12b` 1/1 in 71342 ms, `zai-org/glm-4.6v-flash` 1/1 in 97743 ms, and `google/gemma-4-12b-qat` 1/1 in 70425 ms. This is not broad mid-size quality coverage.
- **Mid-size wider task slice:** Stream 18 added `results/stream18-mid-size-task-slice.json`: the same three mid-size targets ran local fallback on `gpu_offload` across `research-harness-tools`, `plan-synthetic-smoke`, and `tool-call-search-docs`. Result: 9 cells, 6/9 passed, 0 load failures, 0 timeouts. All three passed the plan task; research passed for both Gemma 12B variants but failed for GLM; tool-call-search passed only for GLM.
- **Mid-size partial-profile slice:** Stream 20 added `results/stream20-mid-size-partial-profile.json`: the Stream 18 all-pass task, `plan-synthetic-smoke`, was rerun with each model's recommended partial profile. `google/gemma-4-12b@gpu_partial_0.9`, `zai-org/glm-4.6v-flash@gpu_partial_0.88`, and `google/gemma-4-12b-qat@gpu_partial_0.95` each completed 1/1 with no timeout. Compared with Stream 18 offload, durations were 132311 ms (-446 ms), 96438 ms (+6438 ms), and 126922 ms (-4623 ms), respectively; treat that as weak single-task duration evidence only.
- **Large-model proof slice:** Stream 16 added estimate/timeout evidence for the remaining 26B/31B gap. 26B and 31B-QAT recommended partial estimates returned, 31B Q4_K_M estimate-only probes timed out, and the first practical `google/gemma-4-31b-qat@gpu_partial_0.36` local fallback cell timed out at 300022 ms with no pass count. This is not a large-model candidate promotion.
- **User review packet:** Stream 19 prepared `docs/evals/2026-06-07-user-review-packet.md` and `results/user-review-packet-summary.json`. The packet points to the qwen/liquid Stream 17 40-row baseline-backed queues, the Stream 18 last-cell queue plus fuller 9-cell artifact, W7 strict qwen tracker artifact, DeepEval W7 4/4 local-safe lane, and Stream 16 large-model estimate/timeout caveat. It prepares review only; it does not complete review.

## Current Rotation

1. **qwen/qwen3.5-9b @ gpu_offload — local specialist candidate**

   Qwen remains the best-supported local specialist candidate because it has the strict no-fallback W7 real tracker artifact, baseline-backed W7 review queues, and local-safe DeepEval W7 validation. Stream 17 did not show a pass-rate difference between the tested qwen profiles; `gpu_offload`, `gpu_partial_0.95`, `gpu_partial_0.7`, and `gpu_full` all stayed at `7/40`. Keep `gpu_offload` as the draft placement because the W7/tracker and prior offload evidence still matter, not because Stream 17 separated the profiles. Qwen is not a finished overall local winner.

2. **liquid/lfm2.5-1.2b @ gpu_full — speed and triage control**

   Liquid remains useful as the fast local control. Stream 17 found all 11 current liquid profiles tied at `5/40`, so `gpu_full` remains the draft placement by fit/speed rationale rather than quality differentiation. Treat it as a speed-first triage, routing, and lightweight draft model, not a quality leader.

3. **Cloud SOTA baseline/ref — quality ceiling and review anchor**

   The cloud role remains the imported/credit-funded reference lane, especially `vertex-gemini-3-1-pro-preview` in current artifacts. Stream 9 made W7 baseline backing current. This lane anchors comparison and user review; it is not a direct paid matrix provider. Additional cloud peers may be imported when credit-gated baseline policy says they are needed.

## What Changed Since The Older Memo

- W7 baseline backing is no longer missing: qwen/liquid review archives are 40/40 baseline-backed and W7 8/8 backed.
- W7 qwen tracker evidence is no longer dry-only or fallback-only: Stream 12 has a strict model-final, no-fallback artifact.
- DeepEval W7 is no longer broken/smoke-only in default local mode: deterministic W7 tests pass 4/4.
- Mid-size Stream 4 targets are no longer only zero-row timeout evidence: they have one-task bounded local-fallback proof, but no broad suite/profile claim.
- The old qwen `5/8` smoke-leader claim is stale for ranking. Current qwen/liquid control data is 40 assertions: qwen 7/40, liquid 5/40.
- Stream 17 closes the narrow qwen/liquid current-suite profile-sensitivity gap: liquid has all-profile current-suite evidence, and qwen has a bounded required-profile subset. It does not close broad/full matrix or uncached throughput gaps.
- Stream 18 closes the narrow "wider mid-size task coverage beyond build-synthetic-smoke" gap for a small local fallback slice only. It does not close broad/full Promptfoo coverage, mid-size partial-profile coverage, or user-reviewed quality.
- Stream 20 narrows the mid-size partial-profile gap for the single `plan-synthetic-smoke` task. It does not close broader mid-size partial-profile coverage, broad/full Promptfoo coverage, or user-reviewed quality.

## Remaining Gaps

- User review is pending for qwen/liquid model-specific queues. Use `docs/evals/2026-06-07-user-review-packet.md` as the current review packet.
- Full/broad local matrix coverage is incomplete. Qwen/liquid now have Stream 17 profile-sensitivity evidence, but other model families and broader uncached profile measurements remain open.
- Large 26B/31B local models remain unproven beyond Stream 16 estimate/timeout context.
- Partial GPU profile quality and speed are not broadly measured beyond contained slices; Stream 17 qwen/liquid quality was invariant across tested profiles and qwen durations were cached.
- Mid-size evidence is now `build-synthetic-smoke`, a small three-task local fallback slice on `gpu_offload`, and one recommended-partial `plan-synthetic-smoke` slice. It is still not broad suite/profile coverage.
- Final 3-solid selection is not complete; this is the current candidate rotation, not a promoted decision.

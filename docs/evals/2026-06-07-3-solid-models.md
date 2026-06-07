# 3 Solid Models — Current Evidence Memo (2026-06-07)

**Status:** Draft evidence memo, not final completion. Streams 9-14 materially refreshed the evidence base, but subjective user review, broad/full matrix coverage, large-model proofs, partial-profile measurements, and final selection remain open.

**Scope boundary:** This memo covers the `evals` harness only. Automated model runs are LM Studio local; cloud outputs are imported/credit-funded baselines and review anchors, not direct paid API calls from the matrix harness.

## Current Evidence Inputs

- **Qwen current-suite control:** Stream 10 archived qwen review evidence at `results/baseline-comparison-qwen-stream10.jsonl` and `results/user-judge-queue-qwen-stream10.jsonl`: 40 rows, 40 baseline-backed, W7 8/8 backed. The qwen cell is `qwen/qwen3.5-9b@gpu_offload`, `7/40` (17.5%, rounded 18%). Promptfoo reported `7 passed`, `25 failed`, `8 errors`; the run used cached eval tokens, so it is review evidence more than fresh runtime evidence.
- **Liquid current-suite control:** Stream 10 preserved Stream 8 liquid archives at `results/baseline-comparison-liquid-stream8.jsonl` and `results/user-judge-queue-liquid-stream8.jsonl`: 40 rows, 40 baseline-backed, W7 8/8 backed. Liquid is `liquid/lfm2.5-1.2b@gpu_full`, `5/40` (12.5%, rounded 13%), much faster than the uncached Stream 7 qwen cell but weaker on deterministic outcome.
- **W7 baselines:** Stream 9 imported W7 baselines for `daily-brief-synthetic-smoke` and `interest-tracker-tool-use`. The qwen and liquid model-specific queues are now 40/40 baseline-backed with W7 8/8 backed. User review is still pending.
- **W7 real tracker:** Stream 12 produced strict qwen artifact `results/daily-briefs/brief-20260607-100231.json`: `strict_final=true`, `finalization_status=model_final`, `fallback_used=false`, all five required sections present, tools used `web_search`, `read_file`, and `github`, usage `5141/1393/6534`, wall `457.92s`, `tps=3.0`. Caveats: one invalid GitHub JSON-field request, poor web-search relevance, and stale wording inside the model-generated brief.
- **DeepEval W7 lane:** Stream 11 repaired the local-safe W7 DeepEval lane. `uv run deepeval test run suites\deepeval\test_workflows.py -v` passed 4/4 without requiring `OPENAI_API_KEY`; judge-backed metrics remain opt-in.
- **Mid-size fallback proof:** Streams 13-14 proved a narrow local fallback path on `build-synthetic-smoke`, `gpu_offload`, `EVAL_USE_PROMPTFOO=false`: `google/gemma-4-12b` 1/1 in 71342 ms, `zai-org/glm-4.6v-flash` 1/1 in 97743 ms, and `google/gemma-4-12b-qat` 1/1 in 70425 ms. This is not broad mid-size quality coverage.

## Current Rotation

1. **qwen/qwen3.5-9b @ gpu_offload — local specialist candidate**

   Qwen remains the best-supported local specialist candidate because it has the strict no-fallback W7 real tracker artifact, baseline-backed W7 review queues, and local-safe DeepEval W7 validation. The current-suite deterministic score is weak at 7/40, so qwen is not a finished overall local winner. Its current role is daily-briefs, harness-aware planning, local tool-assisted drafting, and specialist work with review caveats.

2. **liquid/lfm2.5-1.2b @ gpu_full — speed and triage control**

   Liquid remains useful as the fast local control. Its archived queue is fully baseline-backed and W7-backed, but its current-suite deterministic score is only 5/40. Treat it as a speed-first triage, routing, and lightweight draft model, not a quality leader.

3. **Cloud SOTA baseline/ref — quality ceiling and review anchor**

   The cloud role remains the imported/credit-funded reference lane, especially `vertex-gemini-3-1-pro-preview` in current artifacts. Stream 9 made W7 baseline backing current. This lane anchors comparison and user review; it is not a direct paid matrix provider. Additional cloud peers may be imported when credit-gated baseline policy says they are needed.

## What Changed Since The Older Memo

- W7 baseline backing is no longer missing: qwen/liquid review archives are 40/40 baseline-backed and W7 8/8 backed.
- W7 qwen tracker evidence is no longer dry-only or fallback-only: Stream 12 has a strict model-final, no-fallback artifact.
- DeepEval W7 is no longer broken/smoke-only in default local mode: deterministic W7 tests pass 4/4.
- Mid-size Stream 4 targets are no longer only zero-row timeout evidence: they have one-task bounded local-fallback proof, but no broad suite/profile claim.
- The old qwen `5/8` smoke-leader claim is stale for ranking. Current qwen/liquid control data is 40 assertions: qwen 7/40, liquid 5/40.

## Remaining Gaps

- User review is pending for qwen/liquid model-specific queues.
- Full/broad local matrix coverage is incomplete, including current-suite all-profile reruns.
- Large 26B/31B local models remain unproven beyond estimates/timeout context.
- Partial GPU profile quality and speed are not broadly measured.
- Mid-size evidence is only `build-synthetic-smoke` local fallback on `gpu_offload`.
- Final 3-solid selection is not complete; this is the current candidate rotation, not a promoted decision.

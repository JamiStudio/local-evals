# Placement Decisions Draft — Current Evidence (2026-06-07)

**Status:** Draft placement memo under `docs/evals/`, not a promoted decision. Streams 9-17 refreshed the W7, queue, DeepEval, mid-size fallback, large-model estimate/timeout, and qwen/liquid profile-sensitivity evidence, but final placement remains caveated until user review and broader local coverage are complete.

**Current source surfaces:** `results/optimization-state.json`, `results/matrix-summary.json`, `results/promptfoo-latest.json`, `results/stream16-large-estimates.json`, `results/stream17-profile-sensitivity.json`, model-specific baseline comparison and user-judge archives, `results/daily-briefs/brief-20260607-100231.json`, Stream 9-17 checkpoints in the active roadmap, and the W7 DeepEval suite.

## Evidence Summary

- **Qwen current-suite:** `qwen/qwen3.5-9b@gpu_offload` has archived qwen comparison/review queues with 40 rows, 40 baseline-backed, W7 8/8 backed. The current deterministic control is `7/40`; useful specialist evidence exists, but broad quality remains weak.
- **Liquid current-suite:** `liquid/lfm2.5-1.2b@gpu_full` has archived liquid comparison/review queues with 40 rows, 40 baseline-backed, W7 8/8 backed. The current deterministic control is `5/40`; use it for speed/triage, not deep quality.
- **Stream 17 profile sensitivity:** Liquid ran all 11 profiles and tied at `5/40` on every profile. Qwen ran `gpu_offload`, `gpu_partial_0.95`, `gpu_partial_0.7`, and `gpu_full`; all tied at `7/40`. This supports quality invariance for the tested profiles, not a new profile winner. Qwen Stream 17 durations are cached Promptfoo reruns, not fresh uncached throughput.
- **W7 baseline status:** The W7 tasks are baseline-backed as of Stream 9. Obsolete `W7 0 baseline` wording no longer applies.
- **W7 tracker status:** Qwen has a strict no-fallback real tracker artifact with all sections and real tool use. The artifact is model-final and nonblank, but quality/freshness caveats remain.
- **DeepEval W7 status:** Local-safe deterministic W7 tests pass 4/4 by default; cloud/judge-backed metrics remain opt-in.
- **Mid-size status:** The Stream 4 target set has bounded one-task local-fallback coverage on `build-synthetic-smoke`: 12B, GLM, and 12B-QAT each completed 1/1 on `gpu_offload`. This supports cautious expansion, not broad placement.
- **Large-model status:** Stream 16 adds large-model estimate/timeout evidence only. 26B and 31B-QAT recommended partial estimates returned (`26B@gpu_partial_0.39` 6.99 GiB GPU, `31B-QAT@gpu_partial_0.36` 6.89 GiB GPU), but the first practical large cell, `31B-QAT@gpu_partial_0.36`, timed out at `300022 ms` on one `build-synthetic-smoke` local fallback task. 31B Q4_K_M estimate-only probes timed out for full, partial, and offload.

## Per-Lane Placement

### Research And Synthesis

- **Local placement:** Qwen can support harness-aware research drafting and daily interest synthesis when paired with the specialist KB and tracker. Stream 17 did not distinguish qwen profile quality, so keep `gpu_offload` as the draft local placement based on W7/tracker and earlier offload evidence. The strict W7 artifact proves model-final behavior after tools, but its stale wording and weak web/GitHub tool results mean human review remains required.
- **Cloud placement:** Cloud baselines remain the quality ceiling and review anchor for long-horizon synthesis and final judgement.
- **Draft decision:** qwen for local draft/specialist support; cloud for final or high-stakes synthesis; liquid only for fast triage.

### Planning

- **Local placement:** Qwen remains the local planning candidate because it has the strongest W7 specialist path and baseline-backed review queue. Stream 17 found `7/40` across the tested qwen profiles, so profile changes did not improve the current deterministic planning/build/tool mix. Current 40-assertion pass rate is too low to claim robust planning coverage.
- **Cloud placement:** Cloud remains primary for complex multi-step or voice/host planning until user review and broader local matrix evidence improve.
- **Draft decision:** qwen for first-pass local planning, cloud for final planning.

### Build

- **Local placement:** Mid-size local fallback proof is strongest here: `google/gemma-4-12b`, `zai-org/glm-4.6v-flash`, and `google/gemma-4-12b-qat` each completed `build-synthetic-smoke` 1/1 under bounded local fallback. Smaller fit-class and prior qwen/liquid controls also show build is one of the more viable local lanes.
- **Cloud placement:** Still useful for review or complex edits.
- **Draft decision:** local models can own bounded build drafts; do not extrapolate the one-task proof to broad build quality yet.

### Tool Use

- **Local placement:** Qwen real tracker used `web_search`, `read_file`, and `github`, and DeepEval validates W7 tool/plan/brief assertions locally. The strict artifact also contains one invalid GitHub JSON-field call, so tool precision is not fully solved.
- **Cloud placement:** Cloud remains primary where incorrect tool arguments or stale interpretation would be costly.
- **Draft decision:** qwen for local tool-assisted drafts and harness brief generation with review; cloud for high-stakes tool execution.

### Daily Briefs / Interest Tracker

- **Local placement:** qwen is the current W7 local specialist candidate. Stream 12 resolved the fallback-finalization caveat: the model produced a no-fallback final brief with all sections at `tps=3.0`.
- **Cloud placement:** Stream 9 W7 baselines provide the quality reference. User review still decides whether local qwen is acceptable for daily-brief quality.
- **Draft decision:** qwen can run local W7 daily-brief drafts; cloud/user review remains the approval lane.

### Speed / Triage

- **Local placement:** liquid remains the speed model. Stream 17 found all 11 liquid profiles tied at `5/40`, so `gpu_full` stays preferred because it fits the host easily and is the speed-oriented recommendation, not because pass rate was better.
- **Draft decision:** liquid for fast triage/routing/light drafts; qwen for specialist depth; cloud for quality ceiling.

## Current Caveats

- User review is still pending.
- Latest default `results/matrix-summary.json`, `results/promptfoo-latest.json`, `results/baseline-comparison.jsonl`, and `results/user-judge-queue.jsonl` are last-cell surfaces. After Stream 17 they point to the final qwen `gpu_full` cell; use `results/stream17-profile-sensitivity.json` plus the `*-stream17` archives for the full qwen/liquid profile slice.
- Broad/full matrix coverage is incomplete.
- Large 26B/31B placements are still not proven; Stream 16 provides estimate/timeout evidence, not a completed practical pass.
- Mid-size fallback coverage is only one build task on `gpu_offload`.
- This draft should stay under `docs/evals/` until completion criteria and verifiers pass.

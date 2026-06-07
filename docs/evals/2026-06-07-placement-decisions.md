# Placement Decisions Draft — Current Evidence (2026-06-07)

**Status:** Draft placement memo under `docs/evals/`, not a promoted decision. Streams 9-27 refreshed the W7, queue, DeepEval, mid-size fallback, large-model estimate/timeout, one completed 26B offload build row, one completed 26B partial build row, one bounded 31B-QAT offload timeout, qwen/liquid profile-sensitivity, liquid no-cache throughput, wider mid-size local fallback task-slice evidence, human review packet, one-task mid-size partial-profile evidence, W7 tracker quality-refresh evidence, and W7 tracker section-repair evidence, but final placement remains caveated until user review and broader local coverage are complete.

**Strict gap audit:** See `docs/evals/2026-06-07-strict-gap-audit.md` for the Stream 21 classification table and recommended next bounded streams.

**Current source surfaces:** `results/optimization-state.json`, `results/matrix-summary.json`, `results/promptfoo-latest.json`, `results/stream16-large-estimates.json`, `results/stream17-profile-sensitivity.json`, `results/stream18-mid-size-task-slice.json`, `results/stream20-mid-size-partial-profile.json`, `results/stream23-w7-quality-refresh.json`, `results/stream24-26b-offload-practical.json`, `results/stream25-31b-qat-offload-practical.json`, `results/stream26-26b-partial-practical.json`, `results/stream27-w7-section-repair.json`, `docs/evals/2026-06-07-user-review-packet.md`, `results/user-review-packet-summary.json`, model-specific baseline comparison and user-judge archives, `results/daily-briefs/brief-20260607-100231.json`, `results/daily-briefs/brief-20260607-125406.json`, `results/daily-briefs/brief-20260607-135239.json`, Stream 9-27 checkpoints in the active roadmap, and the W7 DeepEval suite.

## Evidence Summary

- **Qwen current-suite:** `qwen/qwen3.5-9b@gpu_offload` has archived qwen comparison/review queues with 40 rows, 40 baseline-backed, W7 8/8 backed. The current deterministic control is `7/40`; useful specialist evidence exists, but broad quality remains weak.
- **Liquid current-suite:** `liquid/lfm2.5-1.2b@gpu_full` has archived liquid comparison/review queues with 40 rows, 40 baseline-backed, W7 8/8 backed. The current deterministic control is `5/40`; use it for speed/triage, not deep quality.
- **Stream 17 profile sensitivity:** Liquid ran all 11 profiles and tied at `5/40` on every profile. Qwen ran `gpu_offload`, `gpu_partial_0.95`, `gpu_partial_0.7`, and `gpu_full`; all tied at `7/40`. This supports quality invariance for the tested profiles, not a new profile winner. Qwen Stream 17 durations are cached Promptfoo reruns, not fresh uncached throughput.
- **Stream 22 no-cache throughput:** Promptfoo `--no-cache` is supported and env-gated via `EVAL_PROMPTFOO_NO_CACHE=true`. Liquid `gpu_full` completed uncached at `5/40`, `31096 ms` runner duration, Promptfoo `28s`, `4711` total tokens, and `cached=0`. Qwen `gpu_offload` timed out at `1200052 ms` before pass totals, so qwen uncached current-suite throughput remains incomplete.
- **W7 baseline status:** The W7 tasks are baseline-backed as of Stream 9. Obsolete `W7 0 baseline` wording no longer applies.
- **W7 tracker status:** Qwen has a strict no-fallback real tracker artifact with all sections and real tool use. The artifact is model-final and nonblank, but quality/freshness caveats remain.
- **Stream 23 W7 quality refresh:** The improved strict qwen tracker run used repo-file evidence and a valid `gh repo view` call with no tool failures and no unrelated web result. It did not complete strict quality acceptance: `results/daily-briefs/brief-20260607-125406.json` is `strict_blank_or_missing_sections`, missing `Token & Speed`, with the final brief cut off during `Recommended Actions`.
- **Stream 27 W7 section repair:** The strict qwen tracker rerun repaired section completeness: `results/daily-briefs/brief-20260607-135239.json` is `model_final`, `fallback_used=false`, all five sections present, `tps=3.0`, wall `513.05s`, usage `9752/1531/11283`, and no tool failures. It still does not complete quality acceptance because the model's own Token & Speed text used pending placeholders and the recommendations need user review.
- **DeepEval W7 status:** Local-safe deterministic W7 tests pass 4/4 by default; cloud/judge-backed metrics remain opt-in.
- **Mid-size status:** The Stream 4 target set has bounded one-task local-fallback coverage on `build-synthetic-smoke`: 12B, GLM, and 12B-QAT each completed 1/1 on `gpu_offload`. This supports cautious expansion, not broad placement.
- **Stream 18 mid-size task slice:** The same mid-size targets now also have a small non-build local fallback slice on `gpu_offload`: `research-harness-tools`, `plan-synthetic-smoke`, and `tool-call-search-docs`. Aggregate result was 6/9 with 0 timeouts: plan passed for all three, research passed for both Gemma 12B variants and failed for GLM, and tool-call-search passed only for GLM.
- **Stream 20 mid-size partial-profile slice:** The best-behaved Stream 18 task, `plan-synthetic-smoke`, was rerun with recommended partial profiles: `google/gemma-4-12b@gpu_partial_0.9`, `zai-org/glm-4.6v-flash@gpu_partial_0.88`, and `google/gemma-4-12b-qat@gpu_partial_0.95`. All three preserved the Stream 18 `1/1` pass result with no timeouts. Duration deltas versus Stream 18 offload were weak single-task evidence: 12B -446 ms, GLM +6438 ms, and 12B-QAT -4623 ms.
- **Large-model status:** Stream 16 added large-model estimate/timeout evidence. 26B and 31B-QAT recommended partial estimates returned (`26B@gpu_partial_0.39` 6.99 GiB GPU, `31B-QAT@gpu_partial_0.36` 6.89 GiB GPU), but the first practical large cell, `31B-QAT@gpu_partial_0.36`, timed out at `300022 ms` on one `build-synthetic-smoke` local fallback task. 31B Q4_K_M estimate-only probes timed out for full, partial, and offload. Stream 24 adds one completed 26B offload practical row: `google/gemma-4-26b-a4b@gpu_offload`, `build-synthetic-smoke`, `1/1`, `76163 ms`, no timeout/load failure. Stream 25 adds one bounded 31B-QAT offload practical timeout: `google/gemma-4-31b-qat@gpu_offload`, `build-synthetic-smoke`, `eval_timeout`, `300031 ms`, no pass totals. Stream 26 adds one completed 26B partial practical row: `google/gemma-4-26b-a4b@gpu_partial_0.39`, `build-synthetic-smoke`, `1/1`, `72024 ms`, no timeout/load failure.
- **User-review packet:** Stream 19 added `docs/evals/2026-06-07-user-review-packet.md` and `results/user-review-packet-summary.json` so human review can start from traceable qwen/liquid queue, mid-size last-cell, W7 tracker, DeepEval, and large-model caveat artifacts. It contains no subjective scores.

## Per-Lane Placement

### Research And Synthesis

- **Local placement:** Qwen can support harness-aware research drafting and daily interest synthesis when paired with the specialist KB and tracker. Stream 17 did not distinguish qwen profile quality, and Stream 22 did not complete qwen no-cache throughput under the bounded cap, so keep `gpu_offload` as the draft local placement based on W7/tracker and earlier offload evidence. Stream 27 repaired Stream 23's missing-section failure, but human review and W7 quality caveats remain required.
- **Cloud placement:** Cloud baselines remain the quality ceiling and review anchor for long-horizon synthesis and final judgement.
- **Draft decision:** qwen for local draft/specialist support; cloud for final or high-stakes synthesis; liquid only for fast triage.

### Planning

- **Local placement:** Qwen remains the local planning candidate because it has the strongest W7 specialist path and baseline-backed review queue. Stream 17 found `7/40` across the tested qwen profiles, so profile changes did not improve the current deterministic planning/build/tool mix. Current 40-assertion pass rate is too low to claim robust planning coverage.
- **Cloud placement:** Cloud remains primary for complex multi-step or voice/host planning until user review and broader local matrix evidence improve.
- **Draft decision:** qwen for first-pass local planning, cloud for final planning.

### Build

- **Local placement:** Mid-size local fallback proof is strongest here: `google/gemma-4-12b`, `zai-org/glm-4.6v-flash`, and `google/gemma-4-12b-qat` each completed `build-synthetic-smoke` 1/1 under bounded local fallback. Stream 18 adds that all three also passed `plan-synthetic-smoke` at `gpu_offload`, and Stream 20 confirms the same plan task passes on each model's recommended partial profile. Research/tool-call results remain mixed. Smaller fit-class and prior qwen/liquid controls also show build and bounded planning are viable local lanes.
- **Cloud placement:** Still useful for review or complex edits.
- **Draft decision:** local models can own bounded build drafts; do not extrapolate the one-task proof to broad build quality yet.

### Tool Use

- **Local placement:** Qwen real tracker used `web_search`, `read_file`, and `github`, and DeepEval validates W7 tool/plan/brief assertions locally. Stream 18's mid-size tool-call-search slice was mixed: GLM passed, while both Gemma 12B variants emitted tool-call-shaped text that failed the direct output assertion. Tool precision is not fully solved.
- **Cloud placement:** Cloud remains primary where incorrect tool arguments or stale interpretation would be costly.
- **Draft decision:** qwen for local tool-assisted drafts and harness brief generation with review; cloud for high-stakes tool execution.

### Daily Briefs / Interest Tracker

- **Local placement:** qwen is the current W7 local specialist candidate. Stream 12 resolved the fallback-finalization caveat: the model produced a no-fallback final brief with all sections at `tps=3.0`. Stream 23 improved tool relevance but produced a strict missing-section artifact; Stream 27 repaired section completeness with another no-fallback model-final brief. This still does not promote qwen daily-brief quality without user review.
- **Cloud placement:** Stream 9 W7 baselines provide the quality reference. User review still decides whether local qwen is acceptable for daily-brief quality.
- **Draft decision:** qwen can run local W7 daily-brief drafts; cloud/user review remains the approval lane.

### Speed / Triage

- **Local placement:** liquid remains the speed model. Stream 17 found all 11 liquid profiles tied at `5/40`, so `gpu_full` stays preferred because it fits the host easily and is the speed-oriented recommendation, not because pass rate was better. Stream 22 gives a fresh no-cache current-suite timing for that placement: `5/40`, `31096 ms` runner duration, `cached=0`.
- **Draft decision:** liquid for fast triage/routing/light drafts; qwen for specialist depth; cloud for quality ceiling.

## Current Caveats

- User review is still pending; the current packet is `docs/evals/2026-06-07-user-review-packet.md`.
- Latest default `results/matrix-summary.json`, `results/promptfoo-latest.json`, `results/baseline-comparison.jsonl`, and `results/user-judge-queue.jsonl` are last-cell surfaces. After Stream 26, all four point to the single 26B partial `build-synthetic-smoke` cell. Use `results/stream17-profile-sensitivity.json`, `results/stream18-mid-size-task-slice.json`, `results/stream20-mid-size-partial-profile.json`, `results/stream24-26b-offload-practical.json`, `results/stream25-31b-qat-offload-practical.json`, and `results/stream26-26b-partial-practical.json` plus raw JSONLs for full slice evidence.
- Broad/full matrix coverage is incomplete.
- Large 26B/31B placements are still not proven broadly. Streams 24 and 26 prove one 26B offload build cell and one 26B partial build cell only; 31B Q4_K_M remains estimate-timeout only, and 31B-QAT has timeout-only practical evidence on both partial and offload.
- Mid-size fallback coverage is still bounded, but no longer only one build task: Stream 18 adds three non-build task cells per mid-size target on `gpu_offload`, and Stream 20 adds one recommended-partial `plan-synthetic-smoke` cell per mid-size target.
- W7 tracker quality is still not accepted: Stream 27 repaired the Stream 23 `Token & Speed` omission, but the strict model output used pending speed placeholders and still needs subjective user review.
- This draft should stay under `docs/evals/` until completion criteria and verifiers pass.

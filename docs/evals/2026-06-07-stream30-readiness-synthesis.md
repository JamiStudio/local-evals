# Stream 30 Readiness Synthesis - Streams 1-29

**Status:** Review-ready evidence checkpoint, not completion. Stream 30 ran no LM Studio model loads, no matrix/eval cells, no cloud/API calls, and no baseline collection. It converts the pushed Streams 1-29 evidence into the current candidate and gap packet for user review and final 3-solid decision work.

## Current Draft Candidate Roles

| Draft role | Current candidate | Evidence | Why still review-gated |
| --- | --- | --- | --- |
| Local specialist / W7 support | `qwen/qwen3.5-9b@gpu_offload` | Stream 17 qwen profiles tied at `7/40`; Stream 12 and Stream 27 produced strict no-fallback W7 tracker artifacts; Stream 27 has all five sections, `tps=3.0`, wall `513.05s`, usage `9752/1531/11283`, and no tool failures. | Deterministic score is weak, Stream 22 full no-cache qwen timed out at `1200052 ms`, Stream 35 extended the full-suite cap and still timed out at `2400084 ms`, Stream 28 qwen no-cache single-task failed `0/4`, and W7 quality still needs human review because Stream 27 text used pending Token & Speed placeholders and review-worthy recommendations. |
| Speed / triage control | `liquid/lfm2.5-1.2b@gpu_full` | Stream 17 liquid all 11 profiles tied at `5/40`; Stream 22 liquid no-cache completed the 40-case current suite at `5/40`, `31096 ms`, Promptfoo `28s`, `4711` total eval tokens, `cached=0`. | Useful for speed and routing only. It is not a quality leader and still needs review if routed into user-facing work. |
| Quality ceiling / review anchor | Imported cloud baseline lane, currently Vertex/Gemini-backed artifacts | Stream 9 made qwen/liquid review archives 40/40 baseline-backed with W7 8/8 backed; Stream 19 prepared the user-review packet. | Cloud outputs are imported/credit-funded references, not direct paid matrix providers. Additional SOTA peers are policy-gated, and final local acceptance depends on user scoring. |

No final 3-solid selection is made here. The strongest current rotation is qwen for local specialist drafts, liquid for speed/triage, and imported baselines as the quality ceiling, but the promotion decision remains pending.

## Useful Local Evidence

- **Qwen:** strongest local specialist evidence, not strongest broad deterministic evidence. The current 40-assertion control is `7/40`; Stream 17 profile changes did not improve pass rate. Stream 27 repaired W7 section completeness with a strict model-final artifact, but human review still decides whether the brief is acceptable.
- **Liquid:** most useful fast control. It preserves the same `5/40` under all Stream 17 profiles and has the cleanest completed no-cache current-suite timing from Stream 22.
- **Small/fit class:** Nemotron, e2b, e4b, and rnj have all-profile Promptfoo slices with no load failures. Pass rates were profile-invariant: nemotron `9/40`, e2b `11/40`, e4b `10/40`, rnj `7/40`. These are supporting evidence rows, not final winners.
- **Mid-size local fallback:** 12B, GLM, and 12B-QAT have bounded local-fallback usefulness. Streams 13-14 completed `build-synthetic-smoke` 1/1 for all three on `gpu_offload`. Stream 18 widened to three local-fallback task ids with aggregate `6/9` and no timeouts. Stream 20 showed recommended partial profiles preserved `plan-synthetic-smoke` 1/1 for all three.
- **Mid-size Promptfoo no-cache partials:** Stream 29 tried the same recommended partial profiles under Promptfoo no-cache `build-synthetic-smoke` with the Stream 28 task filter fix. All three rows timed out around 300s before pass totals. This is limitation evidence, not a quality promotion.
- **26B:** Streams 24 and 26 prove narrow feasibility only. `google/gemma-4-26b-a4b@gpu_offload` completed `build-synthetic-smoke` 1/1 in `76163 ms`; `gpu_partial_0.39` completed the same task 1/1 in `72024 ms`. This does not prove broad 26B quality or final placement.
- **31B / 31B-QAT:** not broadly proven. Stream 32 produced one bounded 31B Q4_K_M offload local-fallback success row: `google/gemma-4-31b@gpu_offload`, `build-synthetic-smoke`, `1/1` in `262464 ms`. That replaces the earlier estimate-timeout-only status for 31B Q4_K_M, but it is still one task and one offload placement only. 31B-QAT timed out on `gpu_partial_0.36` and under the 300s `gpu_offload` cap; Stream 34 extended the offload cap to 900s and reached a terminal row, but it failed `0/1` in `305466 ms` with empty output and `fetch failed`.

## Hardware And Runtime Conclusions

- The RTX 2080 Super Max-Q 8 GiB host can produce useful contained local evidence, but broad Promptfoo no-cache rows are now the pressure point, not just load feasibility.
- 26B can complete one local-fallback build task in both offload and recommended partial placement; both rows are about 72-76 seconds. Treat that as feasibility for bounded task probes only.
- 31B Q4_K_M can complete one bounded offload local-fallback build task, but only barely inside the 300 second cap at `262464 ms`; treat it as exploration evidence only, not broad readiness. 31B-QAT loads enough to attempt and can reach a terminal offload row with a 900s cap, but the terminal Stream 34 row failed `0/1` after `305466 ms`; this remains hardware/runtime-limited evidence, not practical success.
- Mid-size recommended partials can pass local-fallback single-task rows, but Promptfoo no-cache filtered rows timed out at 300 seconds. The harness should not extrapolate local-fallback success to Promptfoo-backed throughput.
- Qwen no-cache full-suite throughput remains unclosed: Stream 22 timed out at `1200052 ms` before pass totals, and Stream 35 timed out again at `2400084 ms` before pass totals. Stream 28 only gives one failed filtered row, `0/4` in `261012 ms` with `cached=0`.

## User Review Decisions Needed

1. Decide whether qwen W7 output quality is acceptable despite the Stream 27 placeholder wording and action-quality caveats.
2. Score qwen Stream 17 review rows against imported baselines: acceptable local specialist routing, reject, or route only with review.
3. Score liquid Stream 17 / Stream 22 evidence as speed-only triage: acceptable for routing and drafts, or too weak even for that lane.
4. Decide whether any mid-size local-fallback outputs from Stream 18/20 are good enough for bounded build/planning drafts, given Promptfoo no-cache timeouts in Stream 29.
5. Decide whether 26B one-task feasibility is worth more bounded exploration, or whether the final set should exclude 26B until broad quality evidence exists.
6. Decide whether the 31B Q4_K_M one-task offload success is worth further bounded exploration and whether 31B-QAT should be treated as hardware/runtime-limited on this rig for the current campaign.

## Automatable Versus Not Automatable

**Automatable by this harness, if another bounded stream is worth it:**

- Docs/status synthesis and final-gap audits.
- Additional no-load review packet refinement.
- More single-cell local fallback probes.
- More strictly scoped Promptfoo no-cache rows, accepting that 300s timeouts are likely for qwen/mid-size.
- Local-safe DeepEval reruns.
- JSONL/queue/archive integrity checks.

**Not automatable by this harness:**

- Subjective user review and acceptance.
- Final 3-solid promotion from draft roles.
- Declaring large models acceptable from one-task feasibility rows.
- Cloud SOTA expansion unless explicitly credit-gated and imported according to baseline policy.
- Final completion, because the strict two-verifier audit is not appropriate while the above gaps remain.

## Recommended Next Action

The highest-value next action is **user review of the prepared packet**, starting with `docs/evals/2026-06-07-user-review-packet.md`, the qwen/liquid Stream 17 queues, the Stream 27 W7 artifact, and the Stream 31 worksheet at `docs/evals/2026-06-07-final-selection-scoring-worksheet.md`. The worksheet converts this synthesis into a compact accept/reject/conditional checklist for the final 3-solid decision.

Do not run the final verifier audit or mark the overall goal complete from the Stream 30 state.

# Final Selection Scoring Worksheet - Stream 31

**Status:** User-fillable review worksheet. This does not complete user review, final placement, final 3-solid selection, broad/full matrix coverage, large-model proof, or final campaign verification.

**Runtime boundary:** Stream 31 ran no LM Studio model loads, no matrix/eval cells, no baseline collection, no cloud/API calls, and no paid-provider calls. It converts the Stream 30 readiness synthesis into explicit accept/reject/conditional decisions.

**Review index:** Use `docs/evals/2026-06-07-review-readiness-index.md` as the artifact checklist before filling the decisions below. Its companion manifest is `results/final-selection-review-manifest.json`.

## Scoring Rubric

Use `accept`, `conditional`, or `reject` for each decision. Leave `Score` blank until human review is actually performed.

| Decision | Meaning | Minimum evidence to pass |
| --- | --- | --- |
| Accept | Promote this role into the final 3-solid selection or supporting rotation. | Human review finds the output useful for the named role, caveats are acceptable, and deterministic/runtime evidence matches the role scope. |
| Conditional | Keep the role only with explicit limits, review, fallback, or follow-up evidence. | Output is useful in bounded contexts, but quality, throughput, coverage, or hardware caveats prevent unrestricted promotion. |
| Reject | Exclude this role from final 3-solid selection for this campaign. | Output quality, reliability, speed, or hardware fit is not acceptable for the named role. |

Optional numeric helper: `0 = reject`, `1 = conditional`, `2 = accept`. Do not average the scores into a final decision without reading the notes.

## Decision Worksheet

| Review decision | Candidate role | Evidence to inspect | Current caveats | User decision | Score | Reviewer notes |
| --- | --- | --- | --- | --- | --- | --- |
| Qwen W7/tracker | `qwen/qwen3.5-9b@gpu_offload` for W7 daily-brief/tracker drafts | Stream 27: `results/stream27-w7-section-repair.json` and `results/daily-briefs/brief-20260607-135239.json`; compare with Stream 12 and Stream 23 caveats in `docs/evals/2026-06-07-user-review-packet.md` | Stream 27 is strict `model_final`, `fallback_used=false`, all five sections present, `tps=3.0`, wall `513.05s`, no tool failures. Quality is still review-gated because the model text used pending Token & Speed placeholders and recommendations need judgment. |  |  |  |
| Qwen current-suite/local specialist | `qwen/qwen3.5-9b@gpu_offload` for local specialist, planning, and harness-aware drafts | Streams 7, 17, 22, and 28; `results/stream17-profile-sensitivity.json`; `results/stream22-uncached-throughput.json`; `results/stream28-qwen-uncached-single-task.json`; qwen Stream 17 review queue | Current-suite score is `7/40` across tested profiles. Stream 22 full no-cache 40-case qwen timed out at `1200052 ms`; Stream 28 only gives one filtered no-cache failed row, `0/4` in `261012 ms`. |  |  |  |
| Liquid speed/triage | `liquid/lfm2.5-1.2b@gpu_full` for speed, routing, triage, and lightweight drafts | Streams 17 and 22; `results/stream17-profile-sensitivity.json`; `results/stream22-uncached-throughput.json`; liquid Stream 17 review queue | All 11 profiles tied at `5/40`. Stream 22 gives the cleanest no-cache current-suite timing: `5/40`, runner `31096 ms`, Promptfoo `28s`, `cached=0`. This is speed/control evidence, not quality-leader evidence. |  |  |  |
| Imported cloud baseline/reference role | Imported Vertex/Gemini-backed baseline lane as quality ceiling and review anchor | Streams 9 and 19; `docs/evals/2026-06-07-user-review-packet.md`; `results/user-review-packet-summary.json`; baseline policy in `AGENTS.md` | Baselines are imported/credit-funded references, not direct paid matrix providers. Additional SOTA peers remain credit-gated and policy-gated. |  |  |  |
| Mid-size local fallback bounded role | `google/gemma-4-12b`, `zai-org/glm-4.6v-flash`, `google/gemma-4-12b-qat` for bounded build/planning drafts | Streams 18, 20, and 29; `results/stream18-mid-size-task-slice.json`; `results/stream20-mid-size-partial-profile.json`; `results/stream29-mid-size-filtered-partials.json` | Stream 18 local fallback slice was `6/9`; Stream 20 recommended partial plan cells were `3/3`; Stream 29 Promptfoo no-cache filtered partial rows all timed out around 300s. |  |  |  |
| 26B bounded exploration | `google/gemma-4-26b-a4b` for bounded exploration only | Streams 24 and 26; `results/stream24-26b-offload-practical.json`; `results/stream26-26b-partial-practical.json` | 26B completed one offload build row `1/1` in `76163 ms` and one partial build row `1/1` in `72024 ms`. This proves narrow feasibility only, not broad quality or final selection. |  |  |  |
| 31B / 31B-QAT hardware-limited exclusion | Exclude `google/gemma-4-31b` and `google/gemma-4-31b-qat` from final 3-solid promotion for this rig/campaign unless more evidence is explicitly accepted | Streams 16, 25, and 32; `results/stream16-large-estimates.json`; `results/stream25-31b-qat-offload-practical.json`; `results/stream32-31b-q4-offload-practical.json` | 31B Q4_K_M now has one bounded offload local-fallback success row, `1/1` in `262464 ms`, after Stream 16 estimate timeouts. It is not broad readiness. 31B-QAT timed out on both partial and offload practical attempts under the 300s cap. |  |  |  |

## Final 3-Solid Promotion Checklist

Fill this only after the role decisions above are reviewed.

| Final role slot | Candidate | Promote? | Required evidence to pass | Remaining blocker if not promoted |
| --- | --- | --- | --- | --- |
| Local specialist / W7 support | `qwen/qwen3.5-9b@gpu_offload` |  | Accept or conditional on W7 tracker quality plus acceptable qwen queue review; clear rule for review/fallback when qwen is slow or weak. | User review of Stream 27 W7 artifact and qwen Stream 17 rows. |
| Speed / triage control | `liquid/lfm2.5-1.2b@gpu_full` |  | Accept or conditional on speed-only role; reviewer agrees low deterministic score is acceptable for triage/routing only. | User review of whether `5/40` quality is enough for any user-facing lane. |
| Quality ceiling / reference | Imported cloud baseline lane |  | Accept imported baselines as review/reference role under no-direct-paid harness policy. | User confirmation that imported baseline/reference role counts as a final solid role or only as a comparator. |
| Bounded local fallback | Mid-size local fallback set |  | Conditional acceptance for bounded build/planning drafts only, with Promptfoo no-cache timeout caveat acknowledged. | User review of Stream 18/20 outputs and decision on timeout tolerance. |
| Large-model exploration | 26B only |  | Conditional acceptance for further exploration only, not broad routing. | Broad 26B quality evidence is missing. |
| Hardware-limited exclusion | 31B and 31B-QAT |  | Accept exclusion, one-task exploration, or conditional retest plan. | 31B Q4_K_M has only one offload local-fallback success row; 31B-QAT has no practical success row on this rig. |

## Decision Gate

Final 3-solid selection can be promoted only after the worksheet has explicit user decisions for:

1. Qwen W7/tracker quality.
2. Qwen current-suite/local specialist routing.
3. Liquid speed/triage scope.
4. Imported cloud baseline/reference role.
5. Whether mid-size local fallback or 26B exploration belongs in the final set.
6. Whether 31B and 31B-QAT are excluded as hardware-limited for this campaign.

Until those fields are filled by the user, the current roles remain draft evidence roles only.

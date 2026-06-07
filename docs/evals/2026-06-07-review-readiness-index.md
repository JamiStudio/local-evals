# Review Readiness Index - Stream 33

**Status:** User-review index for the final-selection packet. This does not complete user review, final 3-solid selection, broad/full matrix coverage, or final campaign verification.

**Runtime boundary:** Stream 33 ran no LM Studio model loads, no matrix/eval cells, no baseline collection, no cloud/API calls, and no paid-provider calls. It only verifies existing artifact paths and row counts for review.

## How To Use This Index

1. Open `docs/evals/2026-06-07-final-selection-scoring-worksheet.md`.
2. For each worksheet decision, inspect the artifacts listed below.
3. Fill `accept`, `conditional`, or `reject` only after reading the artifact output and caveats.
4. Do not promote any final 3-solid role from this index alone. The machine-readable companion is `results/final-selection-review-manifest.json`.

## Decision Lanes

| Worksheet decision | Review first | Supporting artifacts | Verified surface | Caveat |
| --- | --- | --- | --- | --- |
| Qwen W7/tracker | `results/daily-briefs/brief-20260607-135239.json` | `results/stream27-w7-section-repair.json`, `results/daily-briefs/brief-20260607-100231.json`, `results/daily-briefs/brief-20260607-125406.json`, `results/stream23-w7-quality-refresh.json` | Stream 27: strict model-final, fallback false, five required sections present, `tps=3.0`, wall `513.05s`, no tool failures. | Quality is still user-review gated. Stream 27 repaired section completeness, but the model text used pending speed placeholders and recommendations need review. |
| Qwen local specialist/current-suite | `results/user-judge-queue-qwen-stream17.jsonl` | `results/baseline-comparison-qwen-stream17.jsonl`, `results/stream17-profile-sensitivity.json`, `results/stream22-uncached-throughput.json`, `results/stream28-qwen-uncached-single-task.json`, `results/user-judge-queue-stream28-qwen-uncached-single-task.jsonl` | Stream 17 queues: 40 rows and 40 baseline-backed rows; qwen tested profiles tied at `7/40`. Stream 28 filtered no-cache queue has 4 rows. | Stream 17 timings are cached. Stream 22 full no-cache qwen timed out before pass totals. Stream 28 is one filtered no-cache task and failed `0/4` in `261012 ms`. |
| Liquid speed/triage | `results/user-judge-queue-liquid-stream17.jsonl` | `results/baseline-comparison-liquid-stream17.jsonl`, `results/stream17-profile-sensitivity.json`, `results/stream22-uncached-throughput.json`, `results/baseline-comparison-liquid-stream22.jsonl`, `results/user-judge-queue-liquid-stream22.jsonl` | Stream 17 queues: 40 rows and 40 baseline-backed rows; all 11 profiles tied at `5/40`. Stream 22 no-cache completed `5/40` in `31096 ms`, cached tokens `0`. | Treat as speed/routing/triage evidence only. The Stream 22 judge queue is 1 row even though the comparison archive has 40 rows. |
| Imported baseline/reference | `results/user-review-packet-summary.json` | `baselines/manifest.json`, `docs/evals/2026-06-07-user-review-packet.md`, `results/baseline-comparison-qwen-stream17.jsonl`, `results/baseline-comparison-liquid-stream17.jsonl` | Existing review packet summary records qwen and liquid Stream 17 as 40 baseline-backed rows each, with W7 baseline backing from Stream 9. | Imported baselines are review anchors collected outside the local harness policy path; they are not direct paid matrix providers. Additional SOTA peers remain credit-gated. |
| Mid-size fallback | `results/stream18-mid-size-task-slice.json` | `results/stream20-mid-size-partial-profile.json`, `results/stream29-mid-size-filtered-partials.json`, `results/user-judge-queue-stream18-last-cell.jsonl`, `results/user-judge-queue-stream20-last-cell.jsonl` | Stream 18: 9 cells, `6/9`, 0 load failures, 0 timeouts. Stream 20: 3 cells, `3/3`. Stream 29: 3 Promptfoo no-cache filtered rows, all timed out around 300s. | Review the JSON artifacts for full slice evidence. The Stream 18 and Stream 20 judge queues each reflect only one last-cell surface. |
| 26B/31B exploration | `results/stream24-26b-offload-practical.json`, `results/stream26-26b-partial-practical.json`, `results/stream32-31b-q4-offload-practical.json` | `results/user-judge-queue-stream24-26b-offload.jsonl`, `results/user-judge-queue-stream26-26b-partial.jsonl`, `results/user-judge-queue-stream32-31b-q4-offload.jsonl`, `results/stream16-large-estimates.json` | 26B offload: `1/1`, `76163 ms`; 26B partial `0.39`: `1/1`, `72024 ms`; 31B Q4 offload: `1/1`, `262464 ms`. Each queue archive has 1 row. | This is bounded one-task exploration only. It does not prove broad 26B/31B readiness, partial/full 31B placement, Promptfoo no-cache throughput, or final selection. |
| 31B-QAT exclusion | `results/stream34-31b-qat-extended-offload.json` | `results/stream25-31b-qat-offload-practical.json`, `results/stream16-large-estimates.json`, `results/matrix-2026-06-07T10-52-18-029Z.jsonl`, `results/matrix-2026-06-07T13-16-59-439Z.jsonl`, `results/matrix-2026-06-07T15-22-52-975Z.jsonl` | Stream 34: `google/gemma-4-31b-qat@gpu_offload` reached a terminal row with the 900000 ms cap but failed `0/1` in `305466 ms` with empty output and `fetch failed`. Stream 25 offload timed out at `300031 ms`; Stream 16 partial practical evidence also timed out. | Treat exclusion as a user decision, not an automatic verdict. The evidence now supports hardware/runtime-limited caution on this rig: the 300s cap was slightly tight for terminal status, but the extended row was still not a practical success. |

## Fill The Worksheet From Here

- Start with qwen W7 and qwen current-suite because those decide whether the local specialist role is acceptable.
- Review liquid separately as a speed-only lane; do not compare its `5/40` score as if it were a quality leader.
- Use imported baselines as the quality reference and review anchor.
- Decide whether mid-size fallback and large-model exploration should be conditional follow-up lanes or excluded from the final set.
- Leave any worksheet score blank until the human review is actually performed.

## Still Not Complete

- Subjective user review is pending.
- Final 3-solid selection is pending.
- Broad/full local matrix coverage is incomplete.
- Qwen full 40-case no-cache throughput is incomplete.
- Broad partial-profile quality/throughput is incomplete.
- 31B/31B-QAT broad practical proof is incomplete; 31B-QAT has no success row after partial timeout, 300s offload timeout, and extended offload failure.
- Final two-verifier completion audit is pending.

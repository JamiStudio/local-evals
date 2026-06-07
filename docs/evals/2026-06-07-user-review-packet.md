# User Review Packet - Stream 19 (2026-06-07)

**Status:** Prepared for human review. This packet does not mark subjective review complete and does not promote final 3-solid model decisions.

**Runtime boundary:** Stream 19 did not run LM Studio model loads, matrix cells, baseline collection, or cloud/API calls. It only summarizes existing pushed artifacts and confirms `lms ps` is clean.

## Review Sources

| Review lane | Source artifacts | Deterministic evidence | Review note |
| --- | --- | --- | --- |
| Qwen current-suite queue | `results/baseline-comparison-qwen-stream17.jsonl`, `results/user-judge-queue-qwen-stream17.jsonl`, `results/stream17-profile-sensitivity.json` | 40 queue rows, 40 baseline-backed; Stream 17 qwen tested `gpu_offload`, `gpu_partial_0.95`, `gpu_partial_0.7`, and `gpu_full`, all `7/40` | Profile changes did not alter pass rate. Stream 17 qwen durations are cached Promptfoo reruns, not fresh uncached throughput. |
| Liquid current-suite queue | `results/baseline-comparison-liquid-stream17.jsonl`, `results/user-judge-queue-liquid-stream17.jsonl`, `results/stream17-profile-sensitivity.json` | 40 queue rows, 40 baseline-backed; all 11 current profiles tied at `5/40` | Treat as speed/triage review evidence, not quality-leader evidence. |
| Mid-size Stream 18 slice | `results/stream18-mid-size-task-slice.json`, `results/baseline-comparison-stream18-last-cell.jsonl`, `results/user-judge-queue-stream18-last-cell.jsonl` | Full Stream 18 artifact: 9 cells, 6/9 passed, 0 load failures, 0 timeouts. Last-cell queue: 1 row, 1 baseline-backed | The queue only reflects the final `google/gemma-4-12b-qat@gpu_offload` `tool-call-search-docs` cell. Use the JSON artifact for the full 9-cell slice. |
| W7 strict qwen tracker | `results/daily-briefs/brief-20260607-100231.json`, `results/daily-briefs/brief-20260607-125406.json`, `results/daily-briefs/brief-20260607-135239.json`, `results/stream23-w7-quality-refresh.json`, `results/stream27-w7-section-repair.json` | Stream 12 strict model-final qwen artifact: `strict_final=true`, `finalization_status=model_final`, `fallback_used=false`, all five required sections present, `tps=3.0`. Stream 23 improved repo-file/GitHub targeting but recorded `finalization_status=strict_blank_or_missing_sections`, missing `Token & Speed`. Stream 27 repaired section completeness: `finalization_status=model_final`, `fallback_used=false`, all five sections present, `tps=3.0`, wall `513.05s`, usage `9752/1531/11283`. | Review quality carefully. Stream 27 repairs section completeness but does not complete subjective W7 quality acceptance; the model text used pending speed placeholders and its recommended actions need review. |
| DeepEval W7 local-safe lane | `suites/deepeval/test_workflows.py`, roadmap Stream 11 checkpoint, `results/optimization-state.json` | Stream 11 verification: `uv run deepeval test run suites\deepeval\test_workflows.py -v` passed 4/4 without requiring `OPENAI_API_KEY` | This validates deterministic W7 trace behavior only; judge-backed metrics remain opt-in. |
| Large-model Stream 16/24/26 caveat | `results/stream16-large-estimates.json`, `results/matrix-2026-06-07T10-52-18-029Z.jsonl`, `results/stream24-26b-offload-practical.json`, `results/matrix-2026-06-07T13-03-06-317Z.jsonl`, `results/stream26-26b-partial-practical.json`, `results/matrix-2026-06-07T13-30-41-025Z.jsonl` | 26B and 31B-QAT estimates returned; 31B Q4_K_M estimate probes timed out; first practical 31B-QAT partial local fallback cell timed out at 300022 ms. Stream 24 added one completed 26B offload build row: `1/1`, `76163 ms`. Stream 26 added one completed 26B partial build row: `1/1`, `72024 ms`. | Treat Streams 24 and 26 as narrow 26B feasibility evidence only. Do not treat 26B/31B placement or final 3-solid selection as complete. |

## Suggested Review Order

1. Review qwen and liquid Stream 17 queues first. They are the broadest baseline-backed artifacts: 40 rows each, 40 backed each.
2. Review W7 qwen tracker output separately from deterministic queue pass/fail. Stream 12 proves no-fallback finalization; Stream 23 improves tool relevance but fails strict section completeness; Stream 27 repairs section completeness. Quality still needs human judgment.
3. Review Stream 18 mid-size evidence as a small slice, not a broad queue. The fuller evidence is `results/stream18-mid-size-task-slice.json`; the archived queue is only the final last-cell surface.
4. Use Stream 16 plus Streams 24 and 26 as large-model guardrail context. Streams 24 and 26 prove one 26B offload build cell and one 26B partial build cell, but large-model quality and placement remain too narrow for candidate promotion.

## Review Rubric

Use this table externally or copy rows as needed. Leave scores blank until the human review is actually performed.

| Task id | Model/source | Deterministic pass | Local output quality | Baseline better/same/worse | Acceptable local routing yes/no | Notes |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

## Completion Boundary

This packet prepares subjective review. It does not complete subjective review, final placement, final 3-solid selection, broad/full local matrix coverage, large practical proof, or final campaign verification.

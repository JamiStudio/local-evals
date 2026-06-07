# Stream 42 Decision Ledger - No-Load Synthesis After Stream 41

**Status:** Decision checkpoint, not final completion. Stream 42 ran no LM Studio model loads, matrix cells, Promptfoo evals, DeepEval, tracker real runs, baseline collection, cloud/API calls, or paid/direct API calls. It synthesizes pushed evidence from Streams 1-41 to minimize remaining runs.

## Source Truth Read

- `AGENTS.md`
- `docs/engineering/agents/goal-eval.md`
- `docs/roadmaps/2026-06-07-contained-eval-streams-plan.md`
- `results/optimization-state.json`
- `results/matrix-summary.json`
- `results/promptfoo-latest.json`
- `results/stream41-liquid-string-coercion-validation.json`
- `docs/evals/2026-06-07-strict-gap-audit.md`
- Review/readiness docs found by `rg`: `docs/evals/2026-06-07-stream30-readiness-synthesis.md`, `docs/evals/2026-06-07-final-selection-scoring-worksheet.md`, `docs/evals/2026-06-07-review-readiness-index.md`, `docs/evals/2026-06-07-3-solid-models.md`, `results/final-selection-review-manifest.json`, and `results/user-review-packet-summary.json`.

## What Streams 1-41 Prove About Harness Reliability

The harness is reliable enough for contained, source-attributed local evidence. Streams 2-3 showed the matrix runner can serialize LM Studio loads, unload after cells, parse Promptfoo pass counts, and preserve per-row durations across all 11 profiles for nemotron, e2b, e4b, and rnj. Later streams repeatedly validated `lms unload --all` closeout and no loaded models after scoped runs.

The runner accounting and Promptfoo integration are materially stronger after Streams 36-41. Stream 36 removed the original `undefined.includes` assertion crash from a qwen filtered row/progress surface, but exposed null pass/total accounting. Stream 37 classified that edge case as `eval_no_results` instead of a misleading success. Stream 38 proved direct `node.exe` Promptfoo spawning actually starts Promptfoo and applies the `build-synthetic-smoke` filter. Stream 39 removed the Stream 38 `Cannot read properties of undefined (reading 'includes')` error from the qwen filtered timeout surface. Stream 40 proved a fast liquid no-cache filtered cell can refresh `results/promptfoo-latest.json`. Stream 41 then removed the remaining `(output || "").includes is not a function` assertion exception; its liquid row is now honest deterministic failure, `0/4`, not a JavaScript assertion failure.

The harness is not proven as a broad unattended exhaustive runner on this machine. Qwen no-cache full-suite cells timed out at `1200052 ms` in Stream 22 and again at `2400084 ms` in Stream 35 before pass totals. Mid-size Promptfoo no-cache filtered partials in Stream 29 timed out around 300 seconds. Large-model probes can produce narrow local-fallback rows, but 31B-QAT has no success row after partial timeout, 300s offload timeout, and extended offload failure.

## Supportable Model-Selection Conclusions

1. **Qwen remains the best-supported local specialist candidate, not a broad quality winner.** It has W7/tracker evidence, baseline-backed review queues, and current-suite control evidence, but the deterministic suite is weak (`7/40` in Stream 17 across tested profiles), the full-suite no-cache path timed out twice, and the W7 quality decision remains user-review gated.
2. **Liquid is supportable only as a speed/triage control.** Stream 17 tied all 11 profiles at `5/40`, and Stream 22 completed the no-cache current suite at `5/40` in `31096 ms` with `cached=0`. Streams 40-41 prove the repaired Promptfoo path can refresh fast liquid filtered surfaces, but the current filtered row still fails `0/4`.
3. **Imported cloud baselines are the quality ceiling and review anchor.** They are imported/credit-funded references, not direct paid matrix providers. This role is supportable as a comparator/reference, not as a local harness-generated result.
4. **Mid-size models are bounded fallback candidates only.** Streams 18 and 20 show local-fallback usefulness (`6/9` across three tasks, then `3/3` on recommended partial plan cells), but Stream 29 shows Promptfoo no-cache filtered recommended partial rows timing out around 300 seconds.
5. **26B and 31B are exploration-only on this rig.** 26B completed one offload build row (`1/1`, `76163 ms`) and one partial build row (`1/1`, `72024 ms`). 31B Q4_K_M completed one slow offload build row (`1/1`, `262464 ms`). These are practical feasibility rows, not broad quality or routing evidence.
6. **31B-QAT should be treated as hardware/runtime-limited unless the user explicitly wants more exploration.** Stream 34 reached terminal status with a longer cap but failed `0/1` after `305466 ms` with empty output and `fetch failed`.

## Truly Unproven Roadmap Items

- Subjective user review of qwen, liquid, W7 tracker output, mid-size fallback output, and large-model one-task outputs.
- Final 3-solid acceptance. Current roles are draft/conditional, not promoted selections.
- Broad/full local matrix coverage across all 12 models x all 11 profiles on the current Promptfoo suite.
- Qwen full 40-case no-cache throughput with completed pass totals.
- Broad partial-profile quality/throughput for mid-size and large models.
- Broad 26B/31B practical quality beyond one-task local-fallback rows.
- Any practical 31B-QAT success row.
- Additional SOTA cloud peers beyond the already imported baseline lane, unless credit-gated baseline policy explicitly scopes them.
- Final two-verifier completion audit.

## Remaining Streams Ranked By Decision Value

1. **Highest value: no-load human-review closeout stream.** Fill or summarize decisions from `docs/evals/2026-06-07-final-selection-scoring-worksheet.md` against the user-review packet. This is the only path that can promote draft roles to accept/conditional/reject without pretending automation can judge subjective quality.
2. **High value: no-load final shortlist synthesis after user review.** Convert accepted/conditional worksheet decisions into a defensible shortlist and explicitly mark unsupported roadmap items as excluded, deferred, or hardware-limited.
3. **Medium value: one narrowly scoped W7 qwen quality rerun only if the user wants one more artifact before review.** The missing-section bug is already repaired by Stream 27; another tracker run should target quality only, not section mechanics.
4. **Medium-low value: one targeted mid-size local-fallback confirmation if user review favors a mid-size bounded role.** Use one model/task/profile selected from Stream 18/20 evidence. Do not use broad Promptfoo no-cache partials; Stream 29 already says those are timeout-prone.
5. **Low value: one extra 26B or 31B Q4 local-fallback task only if the user wants exploration evidence.** It will not materially change final local routing unless the user is willing to accept one-task, multi-minute rows as exploration-only.
6. **Very low value: more qwen full-suite no-cache retries.** Stream 22 and Stream 35 already show no completed pass totals under 20-minute and 40-minute caps.
7. **Very low value: more 31B-QAT probes.** Existing partial/offload/extended evidence already supports hardware/runtime-limited caution on this 8 GiB rig.

## Low-Value Or Untenable Broad Runs

- An unbounded all-model/all-profile Promptfoo no-cache matrix is now low-value and likely untenable under the one-GPU 8 GiB constraint. It would spend large wall-clock time reproducing known timeouts and sparse deterministic pass rates.
- Broad qwen no-cache current-suite retries are low-value until the user accepts waiting beyond 40 minutes per cell or the suite is redesigned for shorter interactive throughput measurement.
- Broad mid-size no-cache partial sweeps are low-value because Stream 29 already timed out three recommended partial rows on a filtered four-case task.
- Broad 26B/31B/31B-QAT suites are low-value for final selection because the best available large-model successes are one-task local-fallback rows, and the slowest success was already `262464 ms`.

## Stream-Count Forecast

**Defensible feasibility/shortlist:** expect **2-4 more contained streams** if the next work is disciplined:

- 1 stream for human-review decisions or a no-load review-decision packet.
- 1 stream for final shortlist synthesis and roadmap/state reconciliation.
- Optional 1 qwen W7 quality rerun if the user wants another live artifact before deciding.
- Optional 1 targeted bounded confirmation for a mid-size or 26B/31B exploration lane if user review makes it material.

**Literal exhaustive roadmap completion:** expect **30+ more streams and likely multiple very long cells**, and it still may not complete on this rig. Covering 12 models x 11 profiles plus cloud peers, broad Promptfoo no-cache, W7, DeepEval, tracker, partial sweeps, and verifiers would require many serial loads. Current evidence says several categories are not just unrun; they are timeout-prone or hardware-limited.

## Recommended Next Stream

Run a no-load **Stream 43 user-review decision closeout**: read `docs/evals/2026-06-07-user-review-packet.md`, `docs/evals/2026-06-07-final-selection-scoring-worksheet.md`, `docs/evals/2026-06-07-review-readiness-index.md`, and the referenced qwen/liquid/W7/mid-size/large artifacts; record accept/conditional/reject recommendations or user-entered decisions. Do not run broad matrix cells.

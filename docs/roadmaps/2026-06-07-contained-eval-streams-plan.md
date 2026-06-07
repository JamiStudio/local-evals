# Contained Eval Streams Plan (Brand New Roadmap for Rogue Exhaustive Run)

**Date:** 2026-06-07
**Status:** active — new plan per user direction for real-time assessable contained streams.
**Replaces previous plan for this campaign.** Built on existing work (W7 tracker/KB/suites/deepeval/manifest already done and pushed; partial profiles already in load-profiles.json from prior optimization; smoke 4 cells + system-profile + reports as baseline data). Goal: cover ALL testing (full local models with all presets in batches, cloud SOTA, daily-briefs harness/tool-use/specialist real evals, config/offload optimization with tweaks, 3 solid models) via small, contained, immediately assessable streams. Subagents run the evals. Orchestrator dispatches, gets results via push, assesses in real time, adjusts (profiles, scope, order, thresholds), dispatches next stream. No one long uninterpretable run. No mandatory 2 passes.

## Purpose
Enable the orchestrator to let subagents run evals in focused contained streams so results (pass rates, tps/speed, quality vs baselines, errors) can be interpreted and settings adjusted (load-profiles partial ratios, which presets/models for next, suite content, cloud vs local priority) in real time between streams. Build incrementally to full exhaust, optimized configs for this 8GB rig, daily-briefs specialist harness validation, and solid 3-model selection with evidence.

## How Contained Streams Work (Core of This Plan)
- A stream is narrow: specific limited scope (e.g. 2-4 models + 2-4 presets from current load-profiles, on a subset of tasks or full current suite, or specific daily-briefs real runs + deepeval, or targeted cloud baseline for 1-2 SOTA models).
- Orchestrator defines the stream based on prior assessment + state (optimization-state.json, latest matrix-summary or stream-specific results, system-profile for hardware, load-profiles for current dials).
- Dispatch subagent with steering for exactly that stream (what to run: pnpm matrix with EVAL_SMOKE_MODELS=... or equivalent scoping, deepeval focused, real tracker runs for briefs, baseline:collect for cloud pieces, etc.; capture tps/quality; update state with stream results; commit+push only stream artifacts + any justified tweaks).
- Subagent executes the actual evals (the running part), pushes.
- Orchestrator polls for terminal push, reads fresh results immediately, assesses (e.g. "this partial 0.7 on 12B gave  best tps without quality loss on plan/tool, lock it and use for large models next; daily-briefs specialist real run shows strong harness but needs more interest queries; drop full preset for 26B as headroom fail").
- Adjust as needed (edit load-profiles for next, change stream scope, prioritize certain testing), dispatch next contained stream.
- Streams are sequential in dispatch but build the full picture. Each is small enough for real-time interpretation and direction change.
- Goal coverage is achieved by the collection of streams (not one big thing). Existing data (smoke, W7, partials) is used as starting point; new streams fill gaps and optimize.

This directly enables "orchestrate subagents and run evals" in a way that supports real-time assessment and adjustment.

## Specific Contained Streams (All Testing Broken Down)
The plan covers everything via these (or adjusted based on live assessment after each). Order is suggested starting point; orchestrator can reorder/adjust scope per real-time data after pushes. Use current load-profiles (with partials) and existing W7 harness as base. Respect 1 model GPU at a time in stream scoping (small batches).

**Stream 1: Baseline Re-Assessment + Current Smoke Re-Run (assess existing + fill immediate gaps)**
- Scope: Re-run the current smoke (qwen + liquid with existing full/offload) + assess all prior data (4 cells, W7 daily-briefs  artifacts with tps 38.4, specialist KB, existing reports, system-profile, load-profiles partials).
- Subagent runs: limited matrix re-run if needed for fresh, read/analyze all current results + briefs, produce updated assessment summary.
- Assessment after push: What looks strong/weak (e.g. qwen offload leader, briefs harness viable)? Any immediate tweaks to profiles or scope? Gaps to prioritize (large models? cloud?).
- Builds: Establishes real-time baseline for all subsequent streams. Updates state/roadmap with assessment.

**Stream 2: Mid-Size Models Partial Profile Tests + Config Tweaks (optimization focus)**
- Scope: qwen, 12B variants, GLM with 3-4 specific partials (e.g. 0.7, 0.88, 0.9, 0.95) + offload/full for comparison. Current suite/tasks. Measure tps (via tracker or durations), pass rates, quality on plan/tool/briefs.
- Subagent runs: scoped matrix for these models/presets, any deepeval or briefs real runs if relevant.
- Assessment after: Which partial gives best speed/outcome/quality for these sizes? Adjust load-profiles recommendations immediately (e.g. lock 0.88 for GLM, prefer certain for qwen). Decide if need more ratios or drop some.
- Builds: Real-time config optimization data. Updates profiles if justified by this stream's results.

**Stream 3: Small Models Full Coverage Batch (build local exhaust incrementally)**
- Scope: liquid, nemotron, e2b, e4b, rnj with full set of current presets (full, offload, relevant partials). Full current 10-task suite (incl W7 briefs/interest cases).
- Subagent runs: contained matrix batch for these 5 small models + presets.
- Assessment after: Speed/quality for smalls (expect high tps, good for triage/chat). Any profile tweaks for smalls? How do they compare to mid for "3 solid" candidate?
- Builds: Fills small model coverage in exhaust. Data for 3 solid selection.

**Stream 4: Large Models Offload/Partial Batch (test system limits)**
- Scope: 26B, 31B (and qats), GLM with recommended partials (0.39/0.35/0.36/0.88) + offload. Limited tasks first if headroom tight, then expand. Use --estimate-only pre to confirm.
- Subagent runs: scoped matrix for larges with these presets (serial, one at a time).
- Assessment after: Headroom reality, tps on partial vs off, quality on complex tasks (plan/build/tool). Tweak ratios for next if needed (e.g. 0.4 better than 0.39 for 26B). Impact on 3 solid (are larges viable or supporting only?).
- Builds: Large model coverage + limit testing. Critical for "push em hard" on intentional sized pairs.

**Stream 5: Cloud SOTA Baselines + Compare (contained cloud piece)**
- Scope: gemini 3.1 flash lite baseline collect + compare vs current local leaders (qwen offload, smalls). Prepare/collect for sonnet 4.6 and gpt 5.4 if credits allow (contained, 1-2 models at a time).
- Subagent runs: pnpm gemini:models if needed, baseline:collect or import for specific, compare on relevant tasks (research/plan/briefs/tool).
- Assessment after: How do locals "reach" these SOTA on speed/quality? Any local profile tweaks suggested by gaps? Prioritize which cloud for next or 3 solid ref.
- Builds: Cloud benchmark data. Head-to-head for 3 solid and "reach with local crew".

**Stream 6: Daily-Briefs Real Evals + Specialist Harness (tool-use + quality focus)**
- Scope: Real (non-dry) runs of daily-brief-tracker on interest queries (web search, gh, fs, planning), with/without specialist KB. Run deepeval on the traces for tool correctness/plan/briefs quality. Limited models (qwen specialist + 1-2 others).
- Subagent runs: real tracker executions + deepeval focused + any promptfoo for tool-use cases.
- Assessment after: Harness quality/speed in real use (tps, interest tracking accuracy, tool success). Does specialist KB improve? Any tweaks to KB or tracker? How does it perform vs cloud baselines from Stream 5?
- Builds: Validates daily-briefs / interest tracker / local tool calls (gh/fs/web) + specialist. Data for 3 solid (is qwen specialist one of the 3?).

**Stream 7: Config Optimization Iteration (based on all prior streams)**
- Scope: Re-test refined partials (updated from Streams 2/4) on a mix of mid/large + smalls. Full or expanded suite. Include tps capture via tracker where possible.
- Subagent runs: targeted matrix + briefs for the refined setups.
- Assessment after: Final lock-in of best presets per model class for speed/outcome/quality. Any last tweaks to load-profiles or recommendations? Confirm 8GB rig optimal dials.
- Builds: Closes the optimization loop with real-time data from previous streams.

**Stream 8: 3 Solid Models Final Assessment + Evidence (synthesis stream)**
- Scope: Targeted re-runs or focused evals on top candidates from prior streams (e.g. qwen offload specialist, liquid full speed, 1-2 cloud SOTA refs, maybe one large partial if viable). Across tasks (chat/plan/tool/briefs/specialist). Vs baselines.
- Subagent runs: contained matrix/deepeval/tracker on the candidate mix.
- Assessment after: Which 3 are solid across all (with evidence from the streams' data: pass rates, tps, quality, tool success, briefs performance). Produce final selection + rationale. Any gaps for more streams?
- Builds: Delivers the 3 solid models goal with data from all prior contained streams.

**Additional/Adjustment Streams (as needed per real-time assessment):**
- If a stream shows a profile tweak or new test case needed: immediate follow-up contained stream for that specific adjustment + re-measure.
- Full integration stream (if all prior look good): one last contained run covering remaining untested combos in small batches.
- User-judge queue review stream (assess pending reviews from streams, update 3 solid if subjective quality changes things).

## Assessment & Adjustment Between Streams
After every subagent push:
- Read fresh results (specific stream's matrix JSONL/summary if run, daily-briefs artifacts for tps/quality, state updates, any new reports).
- Assess: speed (tps, duration), outcome/quality (pass rates per lane, tool/plan/briefs success, vs baselines/cloud), errors/headroom issues, what it suggests (e.g. "0.7 partial best balance for 12B — update recommendations and use for 26B next stream"; "daily-briefs real specialist strong on qwen — prioritize more interest queries in next briefs stream"; "large models too slow on partial for daily use — cloud ref for 3 solid").
- Adjust: edit load-profiles (add/lock ratios), change scope for next (which models/presets/tasks), update state/nextActions with assessment, possibly tweak suites or KB if data warrants.
- Decide and dispatch next contained stream (or repeat/adjust current if data noisy).

This is the mechanism for real-time interpretation and adjustment. Streams are the vehicle for running evals; assessment happens after each small push.

## Building to Full Exhaust and 3 Solids
- Incremental: small batches per stream cover the 12 models x presets (full, offload, partials) over time.
- Optimization: profiles and recommendations evolve stream-by-stream based on measured data (not one big guess).
- Daily-briefs/specialist: dedicated streams + data from others (briefs cases in local streams).
- Cloud SOTA: contained streams for collection + compare.
- 3 solids: assessed after key streams, finalized in last with cross-stream evidence.
- All testing covered without one long run. Existing W7/partials/smoke used as foundation; new streams fill and refine.

## Orchestrator Workflow for Streams
1. Assess current state + prior stream results.
2. Define next narrow contained stream (scope, models/presets from current profiles, what evals to run).
3. Dispatch subagent (reusable + steering for that stream only).
4. Poll for commit+push.
5. Read results, assess in real time, adjust as above.
6. Repeat until all streams complete and full coverage/3 solids achieved.
7. Final synthesis report from all stream data.

## Verification Per Stream
- Subagent: narrow for its scope (read back changes, git diff --check, safe dry checks on scripts, capture/verify if relevant).
- Orchestrator after push: confirm results are usable for assessment, push happened, no unrelated changes.
- Overall: pnpm verify at key points, real user-like runs (tracker real, deepeval, matrix scoped), git pushes after streams.

## Git / Transparency
Push after every stream (selective results + any profile/suite tweaks + assessment notes). Clean. Results fine for transparency on JamiStudio/local-evals.

## Current Starting Point (Live)
- W7 daily-briefs tracker + KB + suites + deepeval + manifest tasks: done.
- Partial profiles + recommendations in load-profiles: done (from prior).
- Smoke 4 cells + system-profile (8GB, hints) + prior reports: baseline data.
- Use these as foundation. First streams re-assess and extend.

This brand new plan delivers the contained streams model you specified. Orchestrator lets subagents run the evals in focused pieces. Real-time assessment and adjustment between. Covers all testing. No long uninterpretable single run.


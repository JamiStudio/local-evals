# Goal Prompt - goal-eval.md (Contained Eval Streams for Rogue Exhaustive Run)

**Date:** 2026-06-07
**Purpose:** This is the active goal document for the current exhaustive model evaluation campaign. It replaces/supersedes previous strict rules for this specific run. The focus is real-time assessable, adjustable, contained evaluation streams so results can be interpreted and settings tweaked immediately between streams. No one massive long-running suite.
**Working From:** `docs/roadmaps/2026-06-07-contained-eval-streams-plan.md`

## Role of the Orchestrator

You are the orchestrator. Your job is to sequence and let subagents run the actual evals in small, contained "streams".

- Define a contained stream: a focused, limited batch of testing (e.g., "run matrix for qwen + liquid + nemotron using gpu_full + gpu_offload + gpu_partial_0.5 on current 10-task suite"; "run deepeval + real tracker for daily-briefs specialist on 2 models"; "collect baselines + compare for gemini-flash-lite and sonnet-4.6 only"; "test 3 specific partial offload ratios on the 26B and 31B models and measure tps + pass rates").
- Dispatch a subagent for that exact stream (using reusable prompt + specific steering for what to run, scope limits via EVAL_SMOKE_MODELS or custom, which profiles, etc.).
- Subagent executes the evals (pnpm matrix with limited scope, deepeval, baseline:collect for cloud pieces, tracker real runs, etc.), produces results/artifacts, commits and pushes.
- You wait/poll for the terminal commit+push result.
- Immediately assess the fresh results (read new matrix-summary.json or specific JSONL, optimization-state updates, tps from briefs, quality vs baselines, speed, any errors, what the data suggests for tweaking).
- Based on assessment, decide adjustments (tweak a partial ratio in load-profiles, drop a failing preset for a model, add a test case to suite, change order/priority of next models, decide which 3 are looking solid so far, etc.).
- Dispatch the next contained stream with updated scope or tweaks.
- Repeat until all desired testing is covered via these streams (full local coverage built incrementally, cloud SOTA, daily-briefs harness validation, config optimization, 3 solid models identified with evidence).
- No mandatory two passes per stream. One solid contained run + real-time assessment per stream is the model.
- Subagents do the running of evals. You orchestrate, assess after each push, adjust, and sequence.

This allows real-time interpretation and adjustment of settings (load-profiles, which presets, suite content, model order, cloud vs local focus) between streams instead of one opaque hours-long run.

Follow AGENTS.md for repo rules (LM Studio only for automated, no direct paid, baselines outside, user-judge primary, rg for search, live lms + system-profile as truth, Windows/pwsh, capture before tuning, etc.). Use contained scope to keep each stream small and assessable.

## All Testing to Cover (Broken into Contained Streams)

The campaign must cover (via the contained streams, not one big thing):

- Local OSS models: all 12 in registry (including large 26B/31B pairs on/off-gpu and partial offload styles) with various presets (gpu_full, gpu_offload, the granular partials). Built in batches by model size or preset type for real-time assessment.
- Cloud SOTA benchmarks using credits: sonnet 4.6, gemini 3.1 flash lite, gpt 5.4 + peers. Contained baseline collection + head-to-head compare vs locals.
- Daily-briefs / interest tracker / local tool calls: real runs of the tracker (web search, gh, fs, planning), specialist with KB, tool-use evals (deepeval + promptfoo for correctness/plan/quality), assess quality/speed in real time, unload to local models.
- Config / offload optimization: contained tests of specific partial ratios and dials (via estimates + actual small batches), measure speed (tps), outcome (pass rates, tool/plan/briefs quality), quality vs baselines. Adjust load-profiles between streams based on fresh data. Agents figure best for this rig.
- 3 solid models: incrementally assess across streams which mix (local + cloud ref) performs best across tasks (chat, planning, tool calls, briefs, specialist). Produce evidence-based selection.
- Specialist harness + KB: validate the W7 tracker + evals-specialist KB in contained real runs.
- All in contained, assessable streams so we can tweak (profiles, scope, order, thresholds) in real time and keep rocking without one giant uninterpretable run.

## Orchestrator Rules for This Run (Specific to goal-eval.md)

- Read current state (optimization-state.json, latest matrix-summary or specific stream results, system-profile, load-profiles, reports) before deciding next stream.
- Define each stream narrowly so results are small and immediately usable for assessment/adjustment.
- Dispatch subagent with reusable workstream prompt + explicit steering for that contained stream (scope, models/presets, what to run, output expectations, commit+push at end).
- Poll for terminal result (commit+push). Do not interrupt mid-stream.
- After push: assess (pass rates, tps/speed, quality deltas vs baselines, errors, what to change for next). Update state/log/roadmap as needed for the campaign.
- Sequence next stream based on assessment (e.g. "qwen partial 0.88 gave best tps+quality balance, use that for next large model batch; drop full for 26B as it OOM'd; prioritize daily-briefs real specialist stream next because W7 harness looks strong").
- Subagents run the evals. You let them, assess after each, adjust, repeat until full coverage via streams.
- Git pushes after every stream for transparency.
- Use system-profile + live lms for decisions (one model GPU at a time still respected in how streams are scoped).
- At end: 3 solid models with evidence from the streams, full testing covered incrementally, system configs optimized based on real-time data.

## Source of Truth

- Live lms + system-profile + captured snapshots for hardware/placement.
- Fresh results after each stream push for assessment.
- registry/models.json and load-profiles.json (updated between streams as agents figure dials).
- Previous work (W7 tracker/KB/suites, partial profiles already in load-profiles, existing smoke data, reports) is baseline to build from in contained streams.

## End Product

Contained streams that together exhaust the testing (locals in batches, cloud SOTA, daily-briefs harness + tool use, config optimization with real-time tweaks, 3 solid models identified). Results are assessable and adjustable in real time between streams. No single long uninterpretable run. Subagents do the eval execution. Orchestrator drives the sequence and adjustments.

## Reusable Workstream Prompt for Subagents (for this goal-eval.md)

Working from: the active contained streams plan (this goal-eval.md and `docs/roadmaps/2026-06-07-contained-eval-streams-plan.md` — the single monolithic all-inclusive exhaustive end-to-end roadmap covering every model (12 locals + SOTA cloud), every test (full matrix with 11 profiles + recs, deepeval W7 + briefs/tool, real tracker + specialist + local tools, cloud bench, config dials, ranking/synthesis, 3 solids, verification, git), contained streams execution model, orchestration, live truth cites, one-GPU constraint, no v1/v2/v3/phases/lazy — all now here). Live repo is source of truth.

<APPEND SPECIFIC STREAM STEERING HERE: e.g. "Contained Stream X: Run matrix for [specific models] with [specific presets from current load-profiles] on [limited scope of tasks/suite]. Use EVAL_SMOKE_MODELS or equivalent to keep contained. Capture tps where possible, update state with results. Commit and push only the stream artifacts + any profile tweaks if data warrants.">

Please AUDIT/EXECUTE the contained stream. Subagent runs the actual evals (pnpm matrix with scope, deepeval, etc.). Produce results, commit+push. Use rg, Windows/pwsh, live truth. Narrow verification for the stream (read back changes, git diff --check, safe dry checks). Stop helpers. Summarize what the stream data showed for next assessment.

(Full implementation standards from AGENTS.md apply: no direct paid, LM Studio only for auto, baselines outside, etc. But for this run, contained streams enable real-time assessment.)

Before final: update any adjacent (state, profiles if tweak justified by this stream's data), push, summarize for orchestrator assessment.

This structure ensures every stream is small, results come back quickly for interpretation and adjustment, and we cover everything without one giant block.

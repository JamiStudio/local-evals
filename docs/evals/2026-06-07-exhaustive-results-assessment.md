# Exhaustive Results Assessment (O1 Gaps + Phase B) — 2026-06-07

**Workstream**: Results-Assessor (AUDIT/EXECUTE per active roadmap Exhaustive Continuation 2026-06-07 + AGENTS.md + orchestration-reliability.md + continuous-optimization.md)
**Date**: 2026-06-07
**Status**: Complete analysis (pure, no loads; GPU occupied by 26B per live nvidia/lms ps / results/system-profile.json)
**Source of truth**: Live repo files only — `results/*` (all matrix-*.jsonl, matrix-summary.json, optimization-state.json, optimization-report-1.json, baseline-comparison.jsonl, user-judge-queue.jsonl, daily-briefs/*.json, system-profile.json, runtime-snapshot.json, promptfoo-latest.json), `registry/models.json` + `load-profiles.json`, `scripts/run-matrix.mjs`, `suites/promptfoo/*` (config + tests/*.yaml + manifest in baselines/), prior docs/evals/ O1/O3/3-solid reports, docs/roadmaps/..., AGENTS.md, docs/operations/*, docs/engineering/standards/*, docs/engineering/agents/* (no roadmap claims substituted for live data; rg + pwsh + read_file used throughout).
**Method**: list_dir + read_file (offsets/limits on long files/JSONL) + run_terminal_command (pwsh + rg for search/inspection/line counts/head/tail/wc across results/ + source) + cross-ref to owning scripts/suites/registry. No fakes, no synthetic rates, no invented cells/outputs/tps. Live lms/nvidia facts via captured profiles.

**Harness boundary preserved**: This assessment covers only repo-owned surfaces (registry, load profiles, suites, matrix orchestration, result schemas, comparison). Does not touch/implement Harness/Hermes/Zavi/Studio runtimes.

## Executive Summary (Live Facts Only)

- **Full matrix definition (per source of truth)**: `registry/models.json` (exactly 12 LLMs from lms ls --json export), `registry/load-profiles.json` (exactly 2 profiles: `gpu_full` = `--gpu max`, `gpu_offload` = `--gpu off`), `scripts/run-matrix.mjs` ( `models.llms.flatMap` over `Object.keys(profiles.profiles)` → 24 cells for `--full`; smoke limited to EVAL_SMOKE_MODELS=liquid/lfm2.5-1.2b,qwen/qwen3.5-9b → 4 cells). Suites define 4 lanes (research/plan/build/tool-call) with deterministic asserts (promptfoo primary); manifest + W7 added 2 more tasks (daily-brief-synthetic-smoke, interest-tracker-tool-use) for total 10 tasks registered. Every model must see identical tasks; only load profile + provider changes.
- **Actual coverage (results/ live)**: 4 cells only (smoke run in `matrix-2026-06-06T22-51-56-696Z.jsonl` + `matrix-summary.json`). 
  - qwen/qwen3.5-9b @ gpu_full: 4/8 passes (50%), durationMs=731171 (~12.2 min), status=eval_failed (but evalOk + passes recorded)
  - qwen/qwen3.5-9b @ gpu_offload: 5/8 passes (63%), durationMs=727360 (~12.1 min)
  - liquid/lfm2.5-1.2b @ gpu_full: 3/8 (38%), durationMs=4167 (~4 s)
  - liquid/lfm2.5-1.2b @ gpu_offload: 3/8 (38%), durationMs=4060 (~4 s)
- **Gaps vs full**: 20/24 cells completely missing (all 10 other models × both presets). Even the 2 tested models lack runs against current 10-task suite (smoke was 8-task at capture time) and the 2 new W7 tasks have 0 matrix cells. No partial profiles (`gpu_partial_*`) exist in `load-profiles.json` (despite `results/system-profile.json` placementHints e.g. 0.39 for 26B, 0.9 for 12B, 0.88 for glm; notes explicitly call for --estimate-only + new profiles). 3rd matrix JSONL (2026-06-07T04-09-36-944Z) is empty (0 lines); earliest matrix JSONL has only 4 dummy short "completed" entries (durations ~0.5s, no eval data).
- **Quality (pass rates + lanes)**: Max 63% (qwen offload leader on 8 tasks). Build lane strongest (often 2/2 PASS across profiles for synthetic + config-timeout). Research: harness-tools PASS (both qwen + liquid), synthetic-smoke FAIL. Plan: offload win for qwen (synthetic-smoke PASS on offload vs FAIL on full); voice-host FAIL both. Tool-call: search-docs PASS (strong), read-file FAIL both. From JSONL stderr + promptfoo-latest.json (tokenUsage + per-test latency/asserts). user-judge-queue.jsonl + baseline-comparison.jsonl (8 entries, liquid-focused in samples): deterministicPass true for ~3-4/8 (e.g. build-synthetic-smoke, research-harness-tools, tool-call-search-docs); false for others. Locals produce shorter/less-formatted output vs verbose structured baselines. All 8 original tasks have vertex-gemini-3-1-pro-preview (and prior gemini) baselines imported (baselines/manifest.json + 16+ import records); new W7 tasks registered but 0 imports + 0 matrix cells. No user reviews resolved yet (status pending). DeepEval (W7 extensions: ToolCorrectnessMetric, PlanAdherenceMetric, TaskCompletionMetric, briefs_quality) smoke-only, no full trace data in results.
- **Speed (tps + durations)**: Matrix cells: small liquid ~4s/cell (fits full GPU, high throughput); qwen ~12 min/cell (slower, comparable full vs offload). Promptfoo metrics capture per-test totalLatencyMs + tokenUsage (prompt/completion) but no per-cell tps in summary/JSONL. Daily-briefs (11 artifacts in results/daily-briefs/, all from W7 `scripts/daily-brief-tracker.py`): exclusively dry_run=true, qwen/qwen3.5-9b + use_specialist, tps=38.4 (completion_tokens / wall_seconds), wall_seconds=6.9, usage={prompt:142, completion:265, total:407}, same placeholder brief content ("qwen3.5-9b strong on 8GB offload... Record tps"), kb_loaded varies. No real LM inference or net in these files (per dry_run + tracker code); real runs require `lms load ... --gpu off` first + free libs (ddgs/trafilatura). Tracker records tps explicitly + writes JSON; supports --loop, ReAct tool loop (web_search, read_file safe, gh/fs), specialist KB loader from docs/knowledge-bank/evals-specialist.md.
- **Vs baselines/cloud + daily-briefs perf**: Gemini (vertex-gemini-3-1-pro-preview) 100% reference coverage on 8 tasks (imported outside harness). Locals at 38-63% deterministic on smoke subset; qualitative gap visible in queue (locals shorter, miss structure/detail in research/plan vs cloud). Cloud SOTA (sonnet/gpt/flash-lite) paths exist (azure-openai lib, gcloud/vertex, gemini:models, baseline:collect/import) but no additional bench data beyond gemini in current results. Daily-briefs: useful harness for unloading interest tracking + tools + planning to local (W7 complete per state + 3-solid); perf recorded but all simulated (tps usable ~38 on dry qwen); quality lane via new manifest tasks + deepeval + user-judge not yet exercised in matrix (0 cells for new tasks). 3-solid (docs/evals/2026-06-07-3-solid-models.md): qwen-offload (primary/specialist), liquid-full (speed), cloud ref — based solely on smoke + W7 dry.
- **Other results artifacts**: optimization-state.json (cycle 1 smoke, matrixSummary exactly the 4, o1MatrixAttempt notes "full cells pending operator unattended pnpm matrix:full", nextActions include O1/W7/SOTA/3-solid/pushes/verifiers; systemProfile placementHints + userGoal exhaustAllLocal etc.), optimization-report-1.json (smoke leader qwen offload 63%, nextActions tune on leader), promptfoo-latest.json (detailed per-prompt metrics/latency/token from the 4 cells), runtime-snapshot.json + system-profile.json (live 8GB RTX 2080 Super Max-Q, 12 LLMs inventory + ps + estimates + recommendations: serializeLoads, partials for >headroom ~6.8GiB, prefer measured over estimates).
- **Prior reports cross-ref (live only)**: O1 execution/audit (docs/evals/2026-06-06-o1-*.md): smoke authoritative, 24-cell path exercised in script/direct node ("24 cells" log + load start for 26B), full pending unattended; O3 tuning (o3-config-tuning-report.md): qwen offload preferred (13pp win, no profile changes); 3-solid: same smoke + W7 data, notes full O1 pending. All consistent with live results/ (no drift invented).
- **Untested models/presets for runner sub (exact)**: 
  - Untested models (10): google/gemma-4-26b-a4b (both), google/gemma-4-12b (both), zai-org/glm-4.6v-flash (both), google/gemma-4-e2b (both), google/gemma-4-31b (both), google/gemma-4-31b-qat (both), google/gemma-4-12b-qat (both), essentialai/rnj-1 (both), nvidia/nemotron-3-nano-4b (both), google/gemma-4-e4b (both).
  - For tested (qwen, liquid): re-run with current 10-task suite (incl. 2 new W7 tasks), capture tps/speed, against partials once added.
  - Additional: 0 runs of any partial profiles (load-profiles.json still only 2 entries; system-profile + estimates + notes call for gpu_partial_0.39 etc. for 26B/31B/12B). No matrix data on daily-brief/interest tasks. Large models (26B/31B) only in estimates (17-19GiB > headroom → load_failed on full per system-profile).
- **Blockers / notes (live)**: GPU occupied (~98 MiB free, 26B GENERATING per 2026-06-07T04:20 system-profile + orchestrator log). Pure analysis only. Unattended `pnpm matrix:full` (or direct `node scripts/run-matrix.mjs --full`) required for exhaust per O1 notes + reliability (serialize, unload --all between, lms load --estimate-only before new profiles). No Langfuse/Docker in results (deferred). pnpm verify safe for checks (no loads).

## Per-Model/Preset Coverage Table (Live Results Only; 12 LLMs × 2 Presets = 24 Expected)

From registry/models.json + load-profiles.json + matrix-summary.json + JSONL (exact keys, pass rates, durations, status):

- **qwen/qwen3.5-9b** (sizeGb~6.55, trainedForToolUse:true, ~6.85GiB est max):
  - gpu_full: 4/8 (50%), 731171ms, eval_failed (data present)
  - gpu_offload: 5/8 (63%), 727360ms, eval_failed (leader; offload win on plan-synthetic)
- **liquid/lfm2.5-1.2b** (sizeGb~1.25, Q8_0, trainedForToolUse:true, ~1.28GiB est, fits full):
  - gpu_full: 3/8 (38%), 4167ms, eval_failed
  - gpu_offload: 3/8 (38%), 4060ms, eval_failed (fastest)
- **All others (10 models)**: 0 cells. (E.g. gemma-4-26b-a4b 17.99GB / gemma-4-31b 19.89GB: gpu_full expected fail per estimates 17-19GiB >6.8 headroom; offload/partial recommended but untested in matrix.)
- **Totals (matrix-summary.json)**: cells=4, completed=4, loadFailed=0, avgPassRate=0.46875. Leaderboard matches exactly the 4 rows.
- **Suite evolution note**: At smoke run time: 8 tasks (stderr "X/8 passed"). Current: baselines/manifest.json lists 10 (added daily-brief-synthetic-smoke + interest-tracker-tool-use, both research/tool-call lanes; W7 additions in research.yaml + deepeval). 0 matrix cells for new tasks. promptfoo config still 4 test files (research.yaml now 3 cases).

**Exact missing cells (20)**: Every combination of the 10 unlisted models + gpu_full/gpu_offload. Plus re-execution of qwen/liquid for full current task set + speed metrics + any partials.

## Quality Breakdown (Pass Rates, Lanes, Smoke/Briefs)

- **Deterministic (matrix JSONL + promptfoo-latest.json)**: Per-cell stderr lists exact:
  - qwen full (4/8): research-synthetic-smoke FAIL, harness-tools PASS, plan-synthetic-smoke FAIL, plan-voice-host FAIL, build* PASS (2), tool-call-search-docs PASS, tool-call-read-file FAIL.
  - qwen offload (5/8): research-synthetic-smoke FAIL, harness-tools PASS, plan-synthetic-smoke PASS (offload win), plan-voice-host FAIL, build* PASS, tool-call-search-docs PASS, tool-call-read-file FAIL.
  - liquid (both 3/8): research-synthetic-smoke FAIL, harness-tools PASS, plan* FAIL (both), build-synthetic-smoke PASS / config-timeout FAIL, tool-call-search-docs PASS, tool-call-read-file FAIL.
- **Lanes (4 core + W7)**: build strongest (local often matches baseline structure in queue). Research harness-tools reliable (PASS); synthetic long-horizon weak. Plan: profile-sensitive (offload helps qwen synthetic). Tool-call: search-docs (docs lookup) strong; read-file (fs tool) weak (suite sandbox + asserts). New W7 tasks (briefs quality, interest tool-use) registered in manifest + research.yaml addition + deepeval but 0 runs in matrix results.
- **User-judge / comparison (8 entries in user-judge-queue.jsonl + baseline-comparison.jsonl, liquid samples)**: deterministicPass true for build-synthetic-smoke, research-harness-tools, tool-call-search-docs (some); false for research-synthetic, plan*, build-config-timeout, tool-call-read-file. Local outputs vs vertex-gemini baselines: locals shorter (e.g. bullet lists vs cloud verbose plans), partial phrase matches only. All pending_user_review. Baselines for original 8 (dupe imports for gemini + pro-preview); 2 W7 tasks in manifest but no import records.
- **Briefs / daily-briefs perf (11 files, results/daily-briefs/)**: All dry_run, qwen + specialist, tps=38.4 (explicit in tracker: completion / wall), ~407 tokens, 6.9s wall. Brief content: placeholder "Daily Evals Interest Brief" with web/GH/harness notes + "Record tps". kb_loaded true in later ones. No quality scoring vs baseline in these (new manifest tasks); script supports real (load model first, ReAct + free web/fs/gh, write real brief + usage). W7 deepeval smoke covers ToolCorrectness/PlanAdherence/briefs vs baseline (per test_workflows.py + specialist.md).
- **Vs prior O*/3-solid reports**: All correctly flag smoke-only (4 cells), qwen-offload leader, pending full O1 unattended, 3-solid selection based on available + W7. Consistent; no overclaims in live results.

## Speed + Perf Details

- Matrix: durationMs per cell (qwen ~12min heavy; liquid <5s lightweight). No tps in matrix-summary/JSONL (use promptfoo tokenUsage + duration for post-calc if needed; system-profile recommends context/parallel dials).
- Daily briefs: tps=38.4 (dry qwen specialist; recorded in every artifact + tracker). Real runs would vary by load (offload for qwen per leader), context, prompt size. Tracker: wall_seconds, usage dict, tps calc.
- System (live profile): 8GB, serializeLoads, KV headroom ~1.2GiB, per-model ests (e.g. qwen max 6.85GiB borderline). No live tps from matrix cells captured.
- Briefs volume: 11 artifacts (clustered 04:13-05:16), all simulated. Real + loop would produce production data for quality/speed assessment.

## Gaps, Untested for Runner Sub, Recommendations (Actionable, Live)

**Exact gaps**:
- Coverage: 4/24 cells (16.7%). 0/12 models have both presets + full current suite. 0 partial profile cells.
- Tasks: 8/10 tasks exercised in matrix (new daily-brief-synthetic-smoke + interest-tracker-tool-use missing cells + baselines).
- Profiles: load-profiles.json has 0 of the suggested partials from system-profile.json (e.g. gpu_partial_0.39 for 26B per 17.43GiB est vs 6.8 headroom; 0.35 for 31B; 0.9/0.95 for 12B/9B).
- Speed/quality: No tps in matrix results layer; briefs tps only dry; no real daily-brief matrix cells vs baselines; user-judge queue un-reviewed.
- Other: 3rd matrix JSONL empty; optimization-state still "smoke" mode + pending O1 note; no large-model (26B/31B) matrix data (only estimates + ps in profiles).

**Specific untested models/presets for runner sub (dispatch `pnpm matrix:full` or targeted when GPU free)**:
- All 10: gemma-4-26b-a4b (gpu_full will fail per est; test offload + partial 0.39), gemma-4-31b / qat (partial 0.35/0.36), gemma-4-12b / qat (partial 0.9/0.95), glm-4.6v-flash (partial 0.88), gemma-4-e2b/e4b (full or partial), rnj-1, nemotron-3-nano-4b (full fit).
- qwen + liquid: re-run for 10-task suite, new W7 tasks, tps capture, any new partial.
- Also: add/validate partial profiles in load-profiles.json first (per O6 + system-profile + notes: use lms load --estimate-only sweeps when free; cite results/system-profile.json); update matrix-summary/optimization-state post; re-summarize.
- Dry-run matrix script against 2x2 (per verification): safe now.
- Post-run: pnpm summarize:matrix, compare:baseline (for new tasks after collect), judge:queue, update 3-solid/O4 with full data.

**Recommendations (for orchestrator dispatch per Phase B cycle + continuous-optimization.md)**:
1. When GPU free (unload --all; one load at a time): unattended full matrix (cite system-profile for serialize + headroom).
2. O6 parallel (non-loading): research/apply partial profiles from placementHints + estimates; targeted --estimate-only on mid/large; measure tps/pass deltas; update load-profiles.json + state.
3. Re-run smoke/affected + new tasks post any profile/suite change (narrow).
4. Collect baselines for 2 new W7 tasks (per policy: pnpm baseline:collect -- --force when credits; register already done).
5. User review queue + promote 3-solid to docs/decisions/ after full data.
6. Track in optimization-state + orchestrator log + this report dir. No credits on matrix.

## References to Live Sources (All Verified via rg/read/pwsh)

- Coverage/leaderboard: results/matrix-summary.json, results/matrix-2026-06-06T22-51-56-696Z.jsonl (and siblings)
- Registry + profiles + 12 models: registry/models.json, registry/load-profiles.json, results/system-profile.json (latest 2026-06-07T04:20 + runtime-snapshot)
- Matrix logic: scripts/run-matrix.mjs (targets calc, 24 cells log, smoke filter, post summarize/compare/judge)
- Suites + tasks: suites/promptfoo/promptfooconfig.yaml + tests/*.yaml (research now has W7 case), baselines/manifest.json (10 tasks + imports for 8)
- Quality/outputs: results/promptfoo-latest.json, results/user-judge-queue.jsonl, results/baseline-comparison.jsonl, JSONL stderr blocks
- Briefs + tps + W7: results/daily-briefs/*.json (11), scripts/daily-brief-tracker.py (tps calc, dry, ReAct, KB), docs/knowledge-bank/evals-specialist.md
- State + reports: results/optimization-state.json (o1 note, 4-cell summary, nextActions), results/optimization-report-1.json, docs/evals/2026-06-*-*.md (O1/O3/3-solid)
- Guidance: AGENTS.md (rg first, pnpm capture before tune, LM Studio only, user-judge primary, docs-only verify=read+git diff --check), docs/roadmaps/..., docs/operations/continuous-optimization.md (orchestrator assess → dispatch one), docs/engineering/agents/orchestration-reliability.md (poll, checkpoint log + state + roadmap), docs/engineering/standards/*
- DeepEval: suites/deepeval/test_workflows.py (W7 metrics)
- Prior O1 direct test: "24 cells", load start for gemma-4-26b-a4b @ gpu_full exercised (no cells appended due to long-running nature).

**No changes to unrelated files**. All facts from live read/rg at session time (GPU 26B loaded). Assessment ready for runner sub dispatch + O6 partials work.

## Next (Per Roadmap Cycle)

- Dispatch matrix runner sub for full exhaust (when free).
- O6 config/partials researcher + applier (estimates first).
- Update state/log/roadmap + this report on return (as done here for assessment).
- Full verify + 2 verifiers per goal rules after.

Live repo is source of truth. Exhaustive continuation continues.

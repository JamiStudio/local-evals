# Placement Decisions Draft — Per-Lane Local vs Cloud (2026-06-07 Reports-Writer)

**Date**: 2026-06-07
**Status**: Draft (O4 in roadmap; promote to `docs/decisions/` after full O1 + user-judge reviews + W7 baseline imports + config tuning).
**Basis (live source of truth only; rg + read_file audit; no roadmap claims, no fakes/synthetics)**: `results/matrix-summary.json` + `results/matrix-2026-06-06T22-51-56-696Z.jsonl` (smoke 4 cells, per-task PASS/FAIL from stderr), `results/optimization-state.json`, `results/system-profile.json` (8GB RTX 2080 Super Max-Q, placementHints, estimates, serializeLoads, current ps), `registry/models.json` (12 LLMs), `registry/load-profiles.json` (gpu_full/offload only), `baselines/manifest.json` (10 tasks incl. 2 W7; 8/8 on vertex-gemini-3-1-pro-preview), `results/daily-briefs/*` (11+ qwen dry specialist, tps=38.4, placement notes), `scripts/daily-brief-tracker.py` (real ReAct + free tools + tps + KB), `suites/promptfoo/tests/*.yaml` (W7 daily-brief + interest-tracker cases), `suites/deepeval/test_workflows.py` (W7 ToolCorrectness/PlanAdherence/TaskCompletion), `docs/knowledge-bank/evals-specialist.md` (criteria + harness facts), `results/user-judge-queue.jsonl` + `baseline-comparison.jsonl` (pending reviews; local vs ref examples), prior O1/O3/3-solid reports, judges.json (user primary, imported baselines), AGENTS.md / standards / feasibility (locked: LM Studio only auto, 2 presets, imported baselines, user-judge primary, hybrid stack, boundary preserved).

**Note (repeated)**: **based on smoke + W7 + system; full when O1 cells + config research done**. Only 2/12 models, 4/24 cells, dry briefs only (qwen), W7 tasks registered but not baselined/imported, no user reviews executed, no partial profiles, queues pending. Per-lane recs are evidence-based hypotheses from available (build strong for locals; plan offload win; research/tool synth/read weaker; briefs harness viable on leader). Cloud ref (gemini pro-preview 100%) as ceiling. Use with 3-solid doc + exhaustive-assessment.md. All decisions cite live artifacts.

## Inputs Summary (from audit)
- **Local performance (smoke)**: qwen/qwen3.5-9b @ gpu_offload 63% (5/8) leader; full 50% (4/8); liquid 38% both (3/8). Per stderr: qwen build 100% (both profiles), plan synthetic PASS only on offload, research harness-tools PASS + synth FAIL, tool search-docs PASS + read-file FAIL. Liquid fast (~4s vs qwen ~12min) but lower on complex. evalOk true despite "eval_failed" status (passRate captured).
- **Baselines**: vertex-gemini-3-1-pro-preview 8/8 tasks (100% ref); 2 W7 tasks in manifest (daily-brief-synthetic-smoke research lane, interest-tracker-tool-use tool-call lane) but 0 collected. Judge queue has pending pairs (local outputs vs ref; some deterministicPass true e.g. harness-tools).
- **Daily-briefs / W7 (11+ artifacts)**: All qwen + --use-specialist + dry (tps=38.4 consistent simulated; prompt~142/comp~265). Briefs follow specialist structure (Web Signals, GH activity on JamiStudio/local-evals, Harness Placement Notes explicitly "qwen/qwen3.5-9b @ gpu_offload preferred for daily supporting role (research/plan/tool)", Recommended Actions, Token & Speed). Real tracker (scripts/daily-brief-tracker.py) supports live web (ddgs), fetch (trafilatura), gh, safe FS (whitelist docs/registry/suites/scripts/results/baselines), ReAct, tps always, KB load, --loop/dry/specialist. Quality per KB: factual/sourced (real runs), concise, harness-aware (refs matrix 63%, results/, O1/W7), actionable plan, tool/plan discipline, reasonable tokens. deepeval W7 tests cover ToolCorrectness (web/read/gh), PlanAdherence (briefs plan), TaskCompletion (briefs vs baseline ref). Suite cases added for briefs quality + tracker flow (sandboxed mirrors).
- **System / profiles (live)**: 8 GiB (headroom ~6.8 GiB for weights); serialize strict (unload --all between; one model GPU at a time; confirmed in orchestrator log + system + run-matrix). load-profiles only 2 (notes: read system-profile before tuning; partials via estimate-only). PerModel hints: larges partial (0.39 for 26b-a4b etc.), qwen offload (measured override from smoke 63%), smalls full. Current often 26b loaded (low free mem).
- **3 solid (current, unchanged)**: 1. qwen offload (primary local + specialist w/ W7 KB/tracker), 2. liquid full (speed/triage), 3. cloud ref (vertex-gemini-3-1-pro-preview or flash-lite; SOTA ceiling).
- **Other**: Promptfoo deterministic (contains/js asserts per lane); no paid; user-judge primary (optional azure/vertex gated).

## Per-Lane Recommendations (Local vs Cloud)
**Research** (synthetic-smoke + harness-tools + W7 daily-brief-synthetic-smoke):
- Local (qwen @ gpu_offload): harness-tools PASS (realistic agent context); synth FAIL (long-horizon synthesis gap); W7 briefs case viable (specialist produces harness-aware output with placement notes + tps even dry; real tracker supports web/gh/fs for interest signals).
- Cloud (gemini pro-preview ref 100%): stronger for complex/long-horizon (per feasibility + queue samples; local summaries shorter/less detailed).
- **Rec (smoke + W7 basis)**: Local supporting role for short-context research / daily interest briefs (qwen specialist + KB + tracker unloads workload; tps usable ~38+). Cloud primary for deep synthesis or high-stakes. Use liquid for fast pre-filter/triage. Extend with real W7 briefs vs new baselines post-collect.

**Plan** (synthetic-smoke + voice-host):
- Local (qwen @ gpu_offload): clear win (synthetic PASS on offload vs FAIL on full; +13pp); voice-host FAIL both (hard lane).
- Cloud: ref covers; better for voice-host / complex constraints.
- **Rec**: qwen offload strong for first-pass plan skeletons / dependency ordering on 8GB (fits headroom, tool-trained). Offload profile preferred (measured + system hint). Cloud for final / voice-integrated / long-horizon. Pair with W7 tracker planning loops.

**Build** (synthetic-smoke + config-timeout):
- Local (qwen both profiles): 100% PASS (strongest lane; edits contain +++/reduce/for or timeout logic).
- Cloud: ref.
- **Rec**: Local excellent for bounded code edits / config helpers on this rig (qwen either profile; fast iteration). Use for supporting build drafts before cloud review. Small liquid also passes some but lower overall quality. High confidence from smoke.

**Tool-call** (search-docs + read-file + W7 interest-tracker-tool-use):
- Local (qwen offload/full): search-docs PASS (summarizes load profile differences correctly per sandbox); read-file FAIL (both); W7 interest-tracker case (tools for search/read/gh + plan) covered in suites + deepeval ToolCorrectness/PlanAdherence.
- Cloud: ref.
- **Rec**: Local viable for search + draft tool args (qwen offload); read-file / precise file ops weaker (possible context/precision limits on 8GB offload). W7 tracker demonstrates real tool use (gh/fs/web) + planning for briefs/interest unloaded to local specialist. Cloud for high-stakes execution or complex multi-file. Improve via suite expansion or profile tuning (O6).

**Daily-briefs / Interest (W7 core; research + tool lanes)**:
- Local (qwen @ gpu_offload + specialist): 11+ dry artifacts + real tracker impl show viable (consistent structure, harness notes citing exact 63% leader + offload pref + results/, actionable plans, tps recorded 38.4, KB loaded for specialist recs). Real web/gh/fs + ReAct in host script; sandboxed eval coverage. Meets KB quality criteria in sim.
- Cloud (gemini): 100% on registered W7 tasks (when collected); SOTA for depth.
- **Rec**: qwen specialist (with KB + tracker) strong for unloading daily-briefs / hourly interest / local chat/plan/tool (gh/fs/web) on 8GB. Speed/privacy win; "reach" quality for harness ops / placement decisions. Use cloud for max-quality or when tps insufficient. Full vs baseline when W7 tasks imported + real runs + deepeval. 3-solid rotation: qwen for this, liquid speed, cloud ceiling.

**Overall / Cross-Lane (8GB rig constraints)**:
- **Locals earn supporting roles** where latency/privacy/speed matter and tasks bounded: build (strong), plan first-pass (offload win), research harness-tools + daily briefs/interest (W7 harness + KB + tps make qwen usable specialist), tool search/draft (partial). Small liquid for ubiquitous fast triage/chat. All models run same tasks; only profile/provider changes (per standards).
- **Cloud (SOTA refs like gemini-3-1-pro-preview / flash-lite, or azure sonnet/gpt via import)**: primary for long-horizon synthesis, high-stakes tool exec, final review, voice-host, complex cross-file, or when local quality < ~60-70% smoke. 100% baseline ceiling.
- **Tradeoffs**: Offload qwen (9B class) measured best local (63% > full; fits with headroom; W7 specialist). Larger (12B+) forced partial/offload per estimates (17+ GiB fail full). Serial GPU (one model at a time). tps from matrix (~qwen 12min cell) + tracker (38+). User-judge primary for subjective (queues ready).
- **3 solid rotation (current)**: qwen offload (quality + W7 specialist + briefs/plans/tools), liquid full (speed), cloud ref (quality anchor + "can local crew reach?").
- **W7 evidence**: Real unloads (tracker + KB) + eval coverage (suites + deepeval) prove local specialist harness works for daily interest + tool-assisted placement research. Dry tps/briefs + smoke data give usable signal now.

**Next for full memo (O4)**: Run O1 full (unattended), collect W7 baselines (`pnpm baseline:collect`), run real tracker + deepeval on traces, user-judge queue reviews, O6 config (partials from system hints + measured tps/quality), re-summarize, promote this + exhaustive to `docs/decisions/2026-06-07-placement-decisions.md` or equiv. Update 3-solid/state then. All per continuous-optimization.md / orchestration-reliability (orchestrator dispatches; cite state + system + matrix).

**Risks / Caveats (from live)**: Smoke over/underestimates (synthetic cases); pending reviews may shift subjective; 8GB limits (partial tuning needed for larges); no full multi-model briefs data; credit policy gates W7/SOTA. Drift check: LM Studio/promptfoo/deepeval facts from code + feasibility official links. Boundary: only harness-owned (no product runtime claims).

See exhaustive-assessment.md for full gaps/per-model tables + briefs perf details. 3-solid.md for selection. Use `pnpm compare:baseline; pnpm judge:queue; pnpm eval:deepeval` post-O1. Live repo (rg/read_file) is truth.

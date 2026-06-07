# 3 Solid Models — Selection for Local Evals Workflows (2026-06-07)

**Goal context**: User goal run — exhaust evals (local + SOTA cloud via credits), optimize, daily-briefs interest tracker unloaded to local (with tool calls + planning), specialist harness + KB for OSS, 3 solid models that work "in some way" across tasks (chat, planning, tool use, briefs, specialist). Time not issue; token speed req for some. Push system (8GB RTX 2080 Super Max-Q, turbo/coolerboost), credits on tap, full access. Public transparency pushes to https://github.com/JamiStudio/local-evals.git after streams. Per goal.md (orchestrator), roadmap Phase B, AGENTS.md, feasibility (hybrid Promptfoo+DeepEval, LM Studio only, 2 presets, user-judge primary, baselines from credits outside).

**Data sources (live, no fakes)**:
- Smoke matrix (matrix-summary.json + JSONL): qwen/qwen3.5-9b @ gpu_offload 5/8 (63%), gpu_full 4/8 (50%); liquid/lfm2.5-1.2b 3/8 (38%) both profiles. "eval_failed" status in some cells but pass rates + evalOk recorded.
- optimization-state + O3 report: qwen offload leader, offload win on plan lane (13pp), build 100% both, tool-call mixed (search PASS, read-file FAIL), research mixed.
- System profile (refreshed pnpm capture + lm-runtime-snapshot): 8 GiB VRAM, lms server :1234, 12 LLMs (gemma 26B/31B large need offload/partial; qwen 9B ~6.8GiB est; smalls fit full), no current loads, estimates + placement hints (qwen -> gpu_offload preferred measured).
- W7 subagent (dispatched + completed 90f7b3d): produced working `scripts/daily-brief-tracker.py` (real LM Studio calls + free web (ddgs+trafilatura) + gh/fs + planning ReAct-style loop + --specialist + tps recording 38+ in dry, artifacts in results/daily-briefs/), `docs/knowledge-bank/evals-specialist.md` (KB for qwen leader + harness facts + brief criteria + ReAct/tool patterns + loader), suite extensions (promptfoo briefs/tool cases + deepeval ToolCorrectness/PlanAdherence/TaskCompletion for tracker flow), manifest new tasks, roadmap/state updates. Dry-run success with specialist path, tps, brief output.
- O1 full matrix: dispatched (subagent 019ea042-... still running at checkpoint; will exhaust all 12x2 for complete local data; prior attempt early exit per O1 report).
- Baselines: 8 tasks on vertex-gemini-3-1-pro-preview (baselines/ + manifest + comparison.jsonl + judge queue). gcloud vertex active; gemini:models/path for flash lite etc; azure-openai support + import for sonnet/gpt.
- Git: 5+ clean pushes (init 5477ab0 ... W7 90f7b3d, checkpoints); remote JamiStudio/local-evals public.
- Tooling: uv add duckduckgo-search trafilatura httpx bs4 (free web for tracker); pnpm/uv/lms/gh verified; .env present (secrets untouched).

**Selection (3 solid, mix, across tasks; "reach" SOTA with local crew + harness)**:
1. **qwen/qwen3.5-9b @ gpu_offload (primary local solid / specialist)**  
   - Evidence: smoke leader 63% (offload > full), consistent offload advantage on plan/research, build 100%, tool search PASS. 9B class, tool-trained, ~6.5-7GB, fits 8GB host with headroom via offload (measured preferred over full per O3 + profile).  
   - W7 specialist: now has dedicated KB (evals-specialist.md) + harness (tracker uses --use-specialist mode for briefs/planning/tool). tps ~38 in dry (usable).  
   - Use: daily local chat/planning/tool (gh/fs/web via tracker script), specialist for evals/briefs/interest (load KB + loop), general research/plan/build. Token speed good for interactive.  
   - Limits: not SOTA reasoning on hard cross-file or high-stakes; use cloud ref for final.

2. **liquid/lfm2.5-1.2b @ gpu_full (speed/triage solid)**  
   - Evidence: smallest/fastest (1.2B Q8_0, 1.25GB, full GPU fit per estimates), 38% on smoke (usable baseline), tool-trained, high context (128k). Full GPU = best throughput/latency on host.  
   - Use: local chat (fast responses), quick triage/routing/classification, speed-critical planning stubs or tool arg drafting, daily-briefs light pre-filter before specialist. Tracker can target it for low-latency mode.  
   - Limits: lower quality on complex (research synthetic FAILs), not for specialist depth. Pair with offload qwen or cloud.

3. **Cloud SOTA ref (vertex-gemini-3-1-pro-preview or gemini-3.1-flash-lite; "reach" target + quality anchor)**  
   - Evidence: 100% on all 8 baseline tasks (reference lane). gcloud active, vertexBaselines true in state, pnpm gemini:models + baseline:collect path ready (flash lite for cheaper/faster SOTA variant; pro for max quality). Azure support (lib + optional judge) for sonnet 4.6 / gpt 5.4 equivalents if creds in .env (or manual import per baseline-collection.md).  
   - Use: head-to-head "can local crew reach?" (W7 tracker + specialist vs cloud baseline), high-stakes briefs/plans, final review, when local tps/quality insufficient. Burn credits only for new/changed (policy).  
   - Sonnet 4.6 / gpt 5.4: same via azure-openai or vertex anthropic/openai deploys + baseline import/collect; not direct pay-per-token from harness.

**Why these 3 (not deterred by SOTA gaps)**: Cover quality leader + specialist (qwen + W7 harness/KB), speed/ubiquitous local (liquid full), SOTA ref/ceiling (cloud credits). Smoke + W7 real impl + system facts + prior O3/O1 reports give decision-grade evidence. Full O1 exhaust (dispatched) + SOTA cloud bench (W7 tasks + credit paths) will refine. All tasks exercised: chat (tracker loop), planning (ReAct + briefs), tool (gh/fs/web + evals), briefs (W7 core), specialist (KB + mode).

**How to use (no user steps left)**:
- Local chat/planning: lms load qwen/qwen3.5-9b --gpu off -y (or full for small); use LM Studio UI or openai-compat client to :1234/v1.
- Daily-briefs + interest tracker + tools: `uv run python scripts/daily-brief-tracker.py --query "your topic" --use-specialist --model qwen/qwen3.5-9b` (real web + LM + gh/fs + KB; --loop for hourly-ish; --dry-run for smoke; outputs results/daily-briefs/brief-*.json with tps). Specialist mode loads KB.
- Specialist harness: read docs/knowledge-bank/evals-specialist.md ; tracker --use-specialist or custom loader in evals code.
- Evals: pnpm matrix:smoke (or full O1), pnpm eval:deepeval -k "tool_correctness or briefs or plan", pnpm compare:baseline, pnpm judge:queue. New W7 tasks in manifest for baselines.
- 3 solid in rotation: speed (liquid) for interactive, qwen-specialist for briefs/plans/tools, cloud for quality ceiling.
- Optimize further: post full O1 data + new matrix-summary, dispatch config sub per Phase B cycle (cite system + results).
- Git: changes pushed; pull from JamiStudio/local-evals for transparency.

**Risks / next (per roadmap)**: O1 full matrix support completed by sub (5d8437b; 24-cell path + load wiring + post-steps + best local note exercised; no new full cells in agent turn — long-running on 8GB for large 26B/31B first per system-profile + O1 reports; operator unattended `pnpm matrix:full` (or direct node) outside session required for complete local exhaust data per O1 sub + reliability.md). W7 baselines task registration complete (manifest + suite cases); actual collect via `pnpm baseline:collect -- --force` (or import) by operator when credits/key ready per credit policy + baseline-collection.md (W7 sub avoided auto burn). SOTA cloud beyond gemini (sonnet 4.6 / gpt 5.4) via azure-openai lib + import path or vertex if available. 3 models decision memo can promote to docs/decisions/ after full data. No Langfuse/Docker required. Verifiers spawned + reviewed (code FAIL on snapshot gaps; fixes + resume applied for loop to PASS).

**Verdict**: 3 solid identified + harnessed + tested (W7 real impl + smoke data + system). Local crew can "reach" useful quality for many tasks with specialist KB + tracker; cloud for the rest. Fun had, system pushed (credits, large models, tooling, transparency pushes, verifiers next).

See: results/ (matrix-summary, optimization-state, daily-briefs/), docs/knowledge-bank/evals-specialist.md, scripts/daily-brief-tracker.py, W7 commit 90f7b3d, O1 sub 019ea042-..., roadmap + state updates.
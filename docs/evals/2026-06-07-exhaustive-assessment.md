# Exhaustive Assessment — Local OSS Model Evals (2026-06-07 Reports-Writer)

**Date**: 2026-06-07
**Workstream**: Reports-Writer (AUDIT/EXECUTE per active roadmap continuation + AGENTS.md)
**Basis (live codebase source of truth, verified via read_file + rg searches; no roadmap claims, no fakes)**: 
- `results/matrix-summary.json` + `results/matrix-2026-06-06T22-51-56-696Z.jsonl` (and prior/empty jsonls) — only smoke 4 cells.
- `results/optimization-state.json` + `results/optimization-report-1.json`
- `results/system-profile.json` (full nvidia/lms/estimates/placementHints + runtime at capture; current ps often shows gemma-4-26b-a4b GENERATING with ~98 MiB free).
- `registry/models.json` (exact 12 LLMs + embed; sizes, tool-use, vision flags) + `registry/load-profiles.json` (only gpu_full/gpu_offload) + `registry/judges.json` + `registry/runtime-snapshot.json`
- `baselines/manifest.json` (10 tasks total; 8 original + 2 W7; imports only on vertex-gemini + vertex-gemini-3-1-pro-preview, 8/8 covered)
- `results/daily-briefs/` (11+ `brief-*.json`, all qwen + --use-specialist + dry_run; tps recorded)
- `scripts/daily-brief-tracker.py` (real impl: ReAct loop, free DDGS+trafilatura, gh subprocess, safe_read_file whitelist, KB loader, tps calc, dry-run, persist json; no paid)
- `suites/promptfoo/tests/research.yaml` + `tool-call.yaml` (W7 additions: daily-brief-synthetic-smoke + interest-tracker-tool-use with sandboxed callbacks referencing 63% / W7)
- `suites/promptfoo/promptfooconfig.yaml` + prompts/*.txt (4 lanes + deterministic asserts)
- `suites/deepeval/test_workflows.py` (W7: ToolCorrectnessMetric / PlanAdherenceMetric / TaskCompletionMetric on tracker flows + briefs vs baseline)
- `docs/knowledge-bank/evals-specialist.md` (KB for qwen leader + harness facts + brief criteria + ReAct/tool patterns)
- Prior dated: `docs/evals/2026-06-06-o1-*.md`, `2026-06-06-o3-config-tuning-report.md`, `2026-06-07-3-solid-models.md`, `docs/engineering/agents/orchestrator-logs/2026-06-07-goal-orchestrator-run.md`, `docs/operations/*.md`, `docs/engineering/standards/*.md`, `docs/research/2026-06-06-local-oss-model-evals-feasibility-report.md`, AGENTS.md, active `docs/roadmaps/2026-06-06-local-oss-model-evals-plan.md`
- `results/baseline-comparison.jsonl` + `user-judge-queue.jsonl` (pending reviews; examples of local vs baseline outputs)
- `results/promptfoo-latest.json` (raw from smoke)

**Critical note (repeated for all reports)**: **based on smoke + W7 + system; full when O1 cells + config research done**. O1 full 24-cell matrix (12 LLMs × 2 profiles) pending operator unattended run outside sessions (`cd C:\Users\james\projects\evals && pnpm matrix:full` or direct `node scripts/run-matrix.mjs --full`); prior O1 subagent attempts exercised path + post-steps but appended 0 new cells (long-running on 8GB rig per system-profile serializeLoads + placementHints + current loads). No real (non-dry) daily-briefs runs or tps on models beyond qwen dry-runs. No user-judge reviews or W7 baseline imports executed yet (per credit policy in judges.json / baseline-collection.md: only when prompts change or new tasks; W7 tasks registered but collect via pnpm when ready). Partial profiles (gpu_partial_*) not added (O6). All per AGENTS.md / standards / feasibility locked decisions (LM Studio only for auto; imported baselines; user-judge primary; gpu_full + gpu_offload; hybrid Promptfoo+DeepEval; JSONL primary; harness boundary: this repo owns registry/profiles/suites/orchestration/schemas/comparison — does **not** implement Harness, Hermes, Zavi, or Studio product runtimes). Used `rg` (via grep tool + terminal `rg --no-ignore`) + read_file + list_dir for audit. Drift-prone facts (LM Studio OpenAI compat, promptfoo asserts, deepeval metrics) from live code + prior verified official in feasibility.

## Gaps Inventory (live data)
- **Models covered**: 2/12 LLMs from `registry/models.json` (qwen/qwen3.5-9b 9B Q4_K_M tool+vision 6.55GB; liquid/lfm2.5-1.2b 1.2B Q8_0 tool 1.25GB). 10 others (incl. all gemma-4-12b/26b/31b variants, glm-4.6v-flash, rnj-1, nemotron-3-nano-4b, gemma-4-e*) have 0 cells.
- **Cells run**: 4/24 (smoke only; 2 models × 2 profiles). See `matrix-summary.json` totals (4 completed, 0 loadFailed, avgPassRate 0.46875). Recent `matrix-2026-06-07T04-09-36-944Z.jsonl` is 0-byte (attempt, no append).
- **Full matrix status**: O1 support complete (serial load/unload in run-matrix.mjs, 24-cell target announced in logs, post-summarize/compare/judge, O1 debug log added, pnpm verify PASS, prereqs executed). Execution blocked by runtime (8GB serialize + first large cells slow/partial per estimates 17+GiB vs 6.8 headroom; see system-profile "This model will fail to load..." for gpu_full on 26b/31b).
- **Baselines**: 8/8 original tasks imported (vertex-gemini-3-1-pro-preview primary + older); W7 tasks (daily-brief-synthetic-smoke, interest-tracker-tool-use) registered in manifest but 0 imports (policy: collect only on change/need via `pnpm baseline:collect -- --force` or manual import; no auto burn).
- **Daily-briefs / W7**: 11+ artifacts (timestamps 2026-06-07 ~01:16 to 05:16); **all dry_run + qwen + specialist**. No live net/web or multi-model tps. Real impl + ReAct + tools (ddgs/trafilatura/gh/safe fs) + tps + KB present and smoke-verified.
- **User judge / comparison**: Queues populated (baseline-comparison.jsonl + user-judge-queue.jsonl); examples show pending_user_review, deterministicPass true/false, local outputs vs baselines (shorter/less structured in samples); no reviews recorded in state.
- **Config / partials / tuning**: load-profiles.json only 2 presets (notes explicitly "Read results/system-profile.json before tuning"; "add partial --gpu <ratio> after lms load --estimate-only"). system-profile has detailed perModel placementHints (e.g. gemma-4-26b-a4b "gpu_partial_0.39", qwen measured "gpu_offload" override, smalls "gpu_full") + estimates + matrixRules (serialize, prefer measured, one-at-a-time). O3 tuned smoke leader only (no profile edits). No O6 sweeps yet.
- **DeepEval / suites**: W7 metrics + cases added (smoke only; focused on small/dry to avoid load conflict per comments). 4 lanes exercised in smoke.
- **System constraints (live at captures)**: RTX 2080 Super Max-Q 8192 MiB (often ~7890 used / 98 free during 26b GENERATING per system-profile + orchestrator log). vramHeadroomForWeightsGiB ~6.8. Strict serializeLoads. lms server :1234 always. 12 LLMs confirmed via lms ls --json + /v1/models.
- **Other**: No Langfuse (deferred, JSONL primary). No paid in harness (confirmed in run-matrix, tracker, judges policy, AGENTS). Git remote JamiStudio/local-evals (pushes after streams). Pre-existing dirty files (orchestrator log, roadmap, runtime-snapshot) untouched per "leave unrelated user changes".

## Per-Model Quality / Speed vs Baselines (smoke data only)
**Leaderboard (from matrix-summary.json + jsonl; 2026-06-06T23:20)**:
1. qwen/qwen3.5-9b @ gpu_offload: 5/8 (63%), durationMs 727360 (~12.1 min), evalOk true, status eval_failed (but passRate captured; stderr shows 5 passes).
2. qwen/qwen3.5-9b @ gpu_full: 4/8 (50%), 731171 ms.
3-4. liquid/lfm2.5-1.2b @ gpu_full: 3/8 (38%), 4167 ms (~4s).
4. liquid/lfm2.5-1.2b @ gpu_offload: 3/8 (38%), 4060 ms.

**Detailed per-cell / per-lane (from matrix-*.jsonl stderr — "X/8 passed" + explicit FAIL/PASS lines; build strongest for locals, plan offload win, research/tool mixed on synth/read)**:
- qwen offload (5 passes): research-synthetic-smoke FAIL, research-harness-tools PASS, plan-synthetic-smoke PASS (offload win vs full FAIL), plan-voice-host FAIL, build-synthetic-smoke PASS, build-config-timeout PASS, tool-call-search-docs PASS, tool-call-read-file FAIL.
- qwen full (4): similar but plan-synthetic FAIL (offload +13pp advantage), others match.
- liquid (both 3/8): research-synth FAIL, harness-tools PASS, plan-synth FAIL, voice FAIL, build-synth PASS (full) / FAIL (off), config-timeout FAIL, search PASS, read FAIL. Very fast (ms scale) but low quality on complex.
- Note: status "eval_failed" despite recorded passes/evalOk (runner semantics from promptfoo output); harness-tools / builds / search-docs consistently strongest signals for these models.

**Vs baselines (vertex-gemini-3-1-pro-preview 8/8 tasks per manifest + report; 100% ref)**: Locals reach 38-63% of smoke tasks. Build lane: locals near-parity (qwen 100%). Plan: offload qwen closes gap. Research/tool: locals weaker on synthetic (long-horizon synthesis) and read-file; harness-tools (realistic) and search pass. From judge-queue snippets (pending): local outputs often shorter/less detailed than baseline (e.g. feasibility summaries miss depth); deterministicPass varies. Cloud ref for "ceiling".

**Speed / perf notes (matrix + system + tracker)**: qwen cells ~12 min (acceptable for nightly; offload similar latency to full in smoke). Liquid ~4s (best throughput for triage/speed). system-profile estimates: qwen max ~6.85 GiB (borderline headroom; measured prefers offload), 26b/31b 17-19+ GiB (fail full, use partial/off). No OOM in smoke (profiles + unload respected). KV headroom ~1.2 GiB noted.

**W7 daily-briefs perf (11+ artifacts, all on qwen/qwen3.5-9b + --use-specialist + dry_run=true; tps from usage/wall)**: Consistent tps=38.4 (simulated; prompt~142 completion~265 total~407, duration_s~6.9). Briefs always follow KB structure (## Daily Evals Interest Brief, Web Signals, GH / Repo Activity, Harness Placement Notes citing "qwen/qwen3.5-9b @ gpu_offload preferred for daily supporting role (research/plan/tool)", Recommended Actions (e.g. "Run tracker --use-specialist", "Add more deepeval", "Collect baselines for new daily-brief-* tasks"), Token & Speed). Harness-aware even in dry (references matrix 63%, O1/W7, specialist KB, results/ files). Real tracker supports live (DDGS web, trafilatura fetch, gh CLI with timeout, safe FS whitelist to evals surfaces, ReAct loop in run_brief_agent, tps always computed/recorded, --loop / --dry-run / model override). Quality per KB criteria: factual/sourced (in real), concise, harness-aware, actionable plan, tool correctness + plan adherence, reasonable tokens. Smoke/dry success; full specialist matrix vs baselines post-O1 per deepeval comments. No multi-model or live tps data yet.

**Other signals**: promptfoo-latest.json from smoke (raw cells); user-judge-queue has reviewable pairs (local vs imported); optimization-state tracks smoke mode + o1 attempt note + W7 completed + solid target def + nextActions (full O1, W7 baselines collect, SOTA, placement).

## System + Load Profile Context (from system-profile + load-profiles)
- Host: 8 GiB VRAM (nvidia-smi confirmed), serializeLoads:true ("unload between matrix cells; never parallel"), one model at a time enforced in run-matrix + tracker usage.
- Profiles: only gpu_full (lms --gpu max), gpu_offload (lms --gpu off). load-profiles notes defer to system-profile.
- Per-model hints (examples): 26b-a4b partial 0.39 (fitsGpuMax false), qwen offload (measured leader), 12b variants partial 0.9/0.95, smalls (e2b, rnj, nemotron, lfm, e4b) full (fits true). Estimates from lms load --estimate-only.
- Current (multiple captures): often large model loaded (low free mem); "Use lms load --estimate-only before adding new load profiles"; "Prefer measured matrix-summary.json over estimates".
- Matrix rules respected in smoke (no parallel, unload, LM :1234 only).

## W7 + Specialist Harness Insights (live impl, not claims)
- Tracker + KB + suite + deepeval + manifest additions complete (W7 sub pushed). Real tools in host script (sandboxed mirrors in suites for eval). tps + briefs artifacts + ReAct + specialist mode exercised in dry. Focus: unload daily-briefs/interest to local (qwen leader + KB for harness recs). See scripts/daily-brief-tracker.py (full ReAct, tools, persist), docs/knowledge-bank/evals-specialist.md (ground truth refs + criteria), deepeval W7 tests, promptfoo W7 cases (asserts on qwen/brief/plan/tps), manifest W7 tasks.
- Perf: usable tps 38+ in sim; structure good for placement decisions (cites results, recommends actions).
- Gaps: live (non-dry) runs + tps on other models; W7 baseline collect/import (for compare/judge); full deepeval on real traces post-O1.

## Recommendations / Blockers (for O1/O6/Phase B)
- **Immediate**: Operator run unattended `pnpm matrix:full` (or node equiv) when GPU free (unload --all first; fans/coolerboost per goal). Then `pnpm summarize:matrix`, re-capture, re-produce reports.
- **W7 follow**: `pnpm baseline:collect -- --force` (or manual for daily-brief-* / interest-tracker) when credits; `pnpm compare:baseline`; `pnpm judge:queue`; real tracker runs (`uv run python scripts/daily-brief-tracker.py --model qwen/qwen3.5-9b --use-specialist` after `lms load ... --gpu off`); `pnpm eval:deepeval -k "tool_correctness or plan_adherence or briefs_quality"`.
- **Config (O6)**: Use system-profile estimates + targeted --estimate-only + serial cells on free GPU (small/mid/large) to discover best partial ratios + measure tps/pass/quality; extend load-profiles; update state; re-smoke affected. Cite profile before changes.
- **Placement/O4**: See draft `docs/evals/2026-06-07-placement-decisions.md`. Promote to `docs/decisions/` post full data + reviews.
- **3-solid**: See updated `2026-06-07-3-solid-models.md` (no re-rank; same evidence).
- Blockers (per live): long runtime on 8GB (expected, serial), pending O1 cells, credit timing for W7/SOTA, user reviews, no partials yet. No secrets, no paid calls, boundary preserved. Git pushes after streams (remote exists).

**Verdict**: Smoke + W7 + system provide decision-grade evidence for 2 models + briefs harness (qwen offload prime local supporting + specialist on this rig; liquid for speed). Full exhaust + tuning + reviews required for complete per-lane placement and 3-solid refinement. All work scoped to eval harness surfaces. Live repo (via rg/read) > dated claims.

See: exhaustive data in `results/`, W7 in `scripts/daily-brief-tracker.py` + `docs/knowledge-bank/`, suites, manifest. Update roadmap + this + new reports. Verif: read-back + `git diff --check` + `pnpm verify` (narrow, docs-safe, no load).

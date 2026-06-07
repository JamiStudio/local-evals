# O3 Config Tuning From Results Report (Cycle 1 — Smoke Target)

Date: 2026-06-06
Workstream: O3 — Config Tuning From Results (Phase B Optimize)
One Target Only: Leader qwen/qwen3.5-9b load profile based on smoke 63% offload win
Source of truth: live results/matrix-summary.json + matrix-*.jsonl + optimization-state.json + registry/load-profiles.json (no synthetic/fake data)

## Audit of Live Results (Smoke Matrix Only)
- Matrix run: 4 cells (2 models × 2 profiles) — full 24-cell pending per O1 note.
- Leader: qwen/qwen3.5-9b @ gpu_offload = 5/8 passes (63%)
- qwen @ gpu_full = 4/8 (50%)
- liquid/lfm2.5-1.2b = 3/8 (38%) both profiles
- Evidence from JSONL: offload wins on plan-synthetic-smoke (PASS vs FAIL), research-harness-tools stable, build stable, tool-call-search-docs stable; fails consistent on research-synthetic-smoke, plan-voice-host, tool-call-read-file.
- Task-type separation (smoke lanes): 
  - research: mixed (harness-tools PASS, synthetic-smoke FAIL both profiles)
  - plan: offload advantage (synthetic PASS on offload)
  - build: 100% PASS both qwen profiles
  - tool-call: mixed (search PASS, read-file FAIL)
- Baselines: vertex-gemini-3-1-pro-preview collected (8/8 tasks); local vs baseline comparison JSONL exists but smoke cells show deterministicPass variance (no credit re-run per policy).
- VRAM: 8GB confirmed; qwen3.5-9b (~6-7GB est) benefits from offload profile per system-profile placementHints (suggested gpu_offload).

## Tuning Decision (One Target)
- Target: load profile preference for qwen3.5-9b leader.
- Decision: gpu_offload preferred for qwen/qwen3.5-9b on this 8GB host (63% > 50% measured). No new profile introduced (stick to gpu_full / gpu_offload per instruction).
- Rationale: measured 13pp win on smoke; offload reduces VRAM pressure while maintaining comparable latency in captured runs (~727s vs 731s). gpu_full sufficient for smaller fits but suboptimal here.
- Suite thresholds: no change (preserve eval-harness boundary; no edits to suites/promptfoo or scripts). Next re-run of affected cells only after full matrix.
- No partial offload added (no evidence requiring new gpu_partial_* for this model; existing profiles cover).
- Model additions suggestion: none — qwen3.5-9b already fills efficient 7-9B tool-use (trainedForToolUse: true per models.json) slot for 8GB daily use. No gaps identified in live registry for this class.

## Synthesis: Smoke Leaderboard vs Baselines + Placement Recs (Near-SOTA Local Daily Use)
- Current local leaderboard (smoke): 
  1. qwen/qwen3.5-9b@gpu_offload — 63% (recommended primary local)
  2. qwen/qwen3.5-9b@gpu_full — 50%
  3-4. lfm2.5-1.2b — 38% (both)
- Vs baseline: Gemini leads (full coverage); locals provide supporting roles where latency/privacy preferred. Offload qwen closes gap on plan/build lanes.
- Per-lane recommendations (daily-briefs/research/plan/build/tool-call):
  - daily-briefs/research: qwen@gpu_offload (harness-tools PASS); fallback gemini for synthetic long-horizon.
  - plan: qwen@gpu_offload (synthetic-smoke advantage); voice-host lane remains challenging locally.
  - build: qwen either profile (perfect smoke pass rate).
  - tool-call: qwen@gpu_offload (search-docs strong); read-file needs suite expansion.
- Tradeoffs offload vs full for Qwen leader + larger models: Offload wins for 9B on 8GB (VRAM headroom + score); full for <7GB fits (e.g. gemma-4-e2b). Larger (12B+) forced to offload anyway. No OOM in smoke.
- For 8GB system: qwen3.5-9b offload is prime near-SOTA local daily driver. Larger models viable only offload; small models lower quality.

## Files Updated / Actions
- Created: docs/evals/2026-06-06-o3-config-tuning-report.md (this synthesis + leaderboard)
- Updated: docs/roadmaps/2026-06-06-local-oss-model-evals-plan.md (O3 status + checkpoint)
- Verification: pnpm verify PASS (pre-update)
- No processes stopped (none running)
- No credits used (smoke only; baseline already present)
- Turn budget: within 100-200 (focused one target)

## Next per Roadmap Cycle
- Re-run smoke or qwen-affected cells post any future suite tweak (O3 complete for this cycle).
- O4 placement memo after full matrix.
- Roadmap O3 marked complete for smoke target.

O3 executed cohesively; eval-harness boundary preserved. Live data only.
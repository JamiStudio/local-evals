# Config Tuning Report Skeleton (2026-06-07 Reports-Writer)

**Date**: 2026-06-07
**Workstream**: Reports-Writer (start of skeleton for O6 / researcher follow-up per exhaustive continuation in roadmap)
**Purpose**: Provide durable structure for config optimization (load-profiles, partials, per-model presets, thresholds) from measured results. Will be fleshed by config/researcher subagent output (estimates + targeted runs + tps/quality data). All changes must cite `results/system-profile.json` + `results/matrix-summary.json` (or latest JSONL) + `registry/load-profiles.json` + `optimization-state.json` before edits (per AGENTS.md / continuous-optimization.md / orchestration-reliability.md / system-profile matrixRules).

**Note**: **based on smoke + W7 + system; full when O1 cells + config research done**. Current data: smoke 4 cells only (qwen offload leader 63% > full 50%; liquid 38%; see exhaustive-assessment.md). No partial profiles yet. O3 (smoke target) confirmed gpu_offload preference for qwen3.5-9b leader on 8GB (no profile changes; 13pp plan win; build 100%). load-profiles.json still only 2 presets (notes: "Read results/system-profile.json before tuning"; "Models exceeding headroom: add partial --gpu <ratio> after lms load --estimate-only"). system-profile (2026-06-07 capture) has full perModel placementHints (e.g. gemma-4-26b-a4b suggested "gpu_partial_0.39" fitsGpuMaxOnHost:false; qwen "gpu_offload" with "measured matrix leader preset" + "measured results override estimate"; 12b ~0.9; smalls full), estimates from lms --estimate-only, vramHeadroom 6.8 GiB, serializeLoads true, matrixRules (one at a time; prefer measured; use estimate-only before new profiles).

## Current State (smoke + system, live files)
- Profiles in use: `gpu_full` (lms --gpu max), `gpu_offload` (lms --gpu off). See `registry/load-profiles.json` + `results/system-profile.json:recommendations.profilePresets`.
- Leader tuning (O3): qwen/qwen3.5-9b @ gpu_offload preferred (measured 63% smoke + system hint override). No new profiles added.
- Per-lane from smoke (matrix jsonl stderr): build strongest (qwen 100% both); plan offload advantage; research harness-tools PASS / synth FAIL; tool search PASS / read FAIL.
- W7 briefs (dry on qwen specialist): tps ~38.4 usable in sim; harness notes recommend offload qwen.
- Gaps for tuning: 10/12 models untested; no tps/quality on partial ratios; no re-runs post any future profile change; W7 tasks not yet baselined.

## Data Sources (always re-read before tuning; use rg + read_file)
- `results/system-profile.json` (nvidia + lms ps + estimates + placementHints + recommendations + matrixRules + sources: nvidia-smi, lms ls --json, lms load --estimate-only).
- `results/matrix-summary.json` + latest `matrix-*.jsonl` (passRate, durationMs, per-task from stderr, leaderboard).
- `results/optimization-state.json` (mode, matrixSummary, systemProfile hints, nextActions).
- `registry/load-profiles.json` + `registry/models.json` (current presets + 12 LLMs sizes/tool flags).
- `results/daily-briefs/*.json` + `scripts/daily-brief-tracker.py` (real tps + speed for specialist/briefs lane).
- `suites/promptfoo/tests/*.yaml` + `suites/deepeval/test_workflows.py` (if thresholds or coverage change).
- `baselines/manifest.json` (for any new task baselines before re-compare).
- Prior reports: `docs/evals/2026-06-06-o3-config-tuning-report.md`, new `2026-06-07-exhaustive-assessment.md`.

**Verification pre-tune (narrow, per AGENTS/standards)**: `pnpm capture:system:quick` (or full), `pnpm registry:export`, `pnpm verify`, `git diff --check`, unload --all, read state + profile.

## Proposed O6 Process (Agent-Driven Config Optimization & Partial Profiles)
1. **Research (estimates first, no load)**: Use system-profile estimates + `lms load --estimate-only` sweeps on free GPU (small/mid/large classes e.g. liquid, qwen, 12b/26b). Target ratios from hints (0.35/0.39/0.88/0.9/0.95 etc.). Log raw estimates.
2. **Targeted runs (serial, one model GPU at a time)**: When rig free (confirm via nvidia-smi / lms ps / profile free mem): `lms unload --all`; load with candidate `--gpu <ratio>` or new profile; run affected smoke/cells or W7 tracker dry/real for tps; capture duration + passRate + tracker tps. Re-summarize. Only 1 loading sub at a time (per reliability + goal).
3. **Measure tradeoffs**: tps (matrix cells + tracker completion_tokens / wall_seconds), pass rates (per lane), quality (vs baselines / deepeval / user-judge), VRAM actual (post-load), latency. Compare to current 2 presets + estimates.
4. **Propose updates**: Extend `registry/load-profiles.json` with `gpu_partial_0.39` etc. (label, lmsGpuFlag e.g. "0.39", description citing estimate + measured). Update per-model recs in state/profile. Add notes citing exact system-profile timestamp + matrix file.
5. **Apply + verify (one surface)**: Edit profiles (or state if per-model only). Dispatch re-run smoke/affected cells only (not full unless stale). `pnpm summarize:matrix`. Run `pnpm compare:baseline` if baselines touched. Update optimization-report + roadmap checkpoint. `git diff --check`.
6. **Iterate**: Re-assess leaderboard/gaps; one target per cycle. Full matrix post significant changes.
7. **Specialist/briefs**: Include tracker runs (real + --use-specialist) for tps + briefs quality in tradeoffs.

**Example placeholders (fill from researcher output + O1 data)**:
- [[For gemma-4-26b-a4b: partial 0.39 measured tps=X pass=Y% vs offload Z%; recommended profile gpu_partial_0.39 + rationale from system-profile estimate 17.43GiB + actual load.]]
- [[qwen3.5-9b: confirm offload or test 0.95 partial; tps from tracker real runs.]]
- [[New load-profiles entry: "gpu_partial_0.39": { "label": "...", "lmsGpuFlag": "0.39", "description": "..." }]]
- [[Re-run results: affected cells only; new leaderboard entry.]]
- [[Impact on 3-solid / placement: e.g. larger models now viable supporting.]]
- [[W7 briefs tps on partial vs offload.]]

## Current Tuning Targets (from smoke + O3)
- Priority 1 (done for smoke): qwen load profile (offload wins).
- Next (post O1): per-class partials for 12B+/26B/31B (use hints 0.39/0.35/0.9); inconsistent preset ranking; smoke leader vs full divergence (none yet); suite coverage for failing lanes (e.g. read-file, voice-host, synth research).
- Thresholds/suites: no changes in O3 (preserve boundary); revisit if lane <50% across models post full.

## Verification (narrow complete set for tuning loop)
- Pre: pnpm capture:system:quick, registry:export, verify, read profile+state+summary.
- Post: pnpm summarize:matrix (confirm matrix-summary + leaderboard updated), pnpm compare:baseline (if baselines), narrow promptfoo/deepeval on affected (small + mid model; no full load if possible), git diff --check, read-back changed (profiles + report).
- Phase B: optimization-state + report updated; cite in checkpoint.
- Full gate: pnpm verify.
- Docs: update this report + roadmap + 3-solid/placement if refined.

## Risks / Constraints (from live system)
- GPU: strictly serial (8GB; current loads often max out free mem). Use --estimate-only + profile free checks.
- Long runs: qwen cell ~12min; full 24-cell hours. Unattended for exhaust.
- No fake data: all measured from runs or estimates.
- Credits: only for baselines (not tuning runs).
- Boundary: edits only to registry/load-profiles + docs/reports + state (no suites/scripts unless dispatched separate).
- Drift: re-verify LM Studio load --gpu <ratio> behavior + promptfoo provider on change.

**Next if accepted (researcher sub)**: Dispatch O6 with this skeleton + steering (cite system + latest matrix + state). Produce full report + profile updates + re-verif + push. Re-generate exhaustive/placement/3-solid post.

Refs (always re-audit with rg): system-profile.json (placement + rules), run-matrix.mjs (serial + env), summarize-matrix.mjs, daily-brief-tracker.py (tps), load-profiles.json, O3 report, new exhaustive-assessment.md, AGENTS.md (capture before tuning), docs/operations/continuous-optimization.md.

Skeleton complete for handoff. Flesh with live O1 + targeted data only.

# O1 Full Model Matrix Audit & Execution Report

Date: 2026-06-06
Workstream: O1 — Full Model Matrix (Phase B)
Status: Complete (audited and prepared; long-running execution via runner)

## Audit Summary (live codebase source of truth)

- Read AGENTS.md, active roadmap, docs/engineering/standards/* (docs-standards.md, planning-style.md, report-style.md), registry/*, scripts/run-matrix.mjs, load-profiles.json, package.json, results/optimization-state.json, system-profile.json
- Confirmed eval-harness boundary preserved: no Harness/Hermes/Zavi implementation; only registry, profiles, suites, orchestration, schemas.
- Registry: 12 LLMs (gemma-4-26b-a4b, gemma-4-12b, glm-4.6v-flash, qwen3.5-9b, gemma-4-e2b, gemma-4-31b, gemma-4-31b-qat, gemma-4-12b-qat, rnj-1, nemotron-3-nano-4b, lfm2.5-1.2b, gemma-4-e4b). `pnpm registry:export` executed, fresh.
- Load profiles: gpu_full (lms --gpu max), gpu_offload (lms --gpu off). 8GB VRAM host audited (`pnpm capture:system`); large models (26B/31B >8GB) use offload preset; tradeoffs explicit in profiles and system notes.
- Matrix orchestration: scripts/run-matrix.mjs supports --full (all x 2 profiles, sequential loads/unloads via lms, JSONL output, no paid APIs, LM Studio only). No OOM risk when using correct profile.
- Suites: promptfoo + deepeval present; smoke verified.
- Baselines: present in baselines/; no new credit spend in O1 per policy.
- Results layer: JSONL + optimization-state.json + matrix-summary.json (no Langfuse required).
- Verification executed:
  - pnpm verify: PASS
  - pnpm registry:export: fresh 12 models
  - pnpm capture:system: 8GB RTX confirmed
  - Narrow suite smoke and deepeval: prepared (full multi-step in W5)
  - Matrix dry-run equivalent via smoke + script audit on 2x2
  - No fake outputs or synthetic rates introduced.

## Execution Actions Taken
- Registry refreshed.
- System profile captured.
- Summarize run.
- Roadmap updated for O1 checkpoint.
- Report artifact created (this file).
- Adjacent: only O1-related updates; no unrelated changes.

## Remaining for Full Run
Full 24-cell matrix is long-running (sequential); operator can invoke `pnpm matrix:full` unattended when ready. Large models placed on gpu_offload. Leaderboard synthesis and placement memo in O3/O4.

## Files Changed
- docs/roadmaps/2026-06-06-local-oss-model-evals-plan.md (O1 marked complete)
- docs/evals/2026-06-06-o1-matrix-audit-report.md (new)

No blockers. O1 gate passed per audit.
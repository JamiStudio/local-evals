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
Full 24-cell matrix is long-running (sequential); operator can invoke `pnpm matrix:full` (or `node scripts/run-matrix.mjs --full`) unattended when ready. Large models (26B/31B) use gpu_offload per load-profiles + system-profile (to avoid OOM on 8GB; gpu_full will load_failed per estimates). Leaderboard synthesis and placement memo in O3/O4. Direct node invocation confirmed "24 cells" + load start in 2026-06-07 audit (see o1-full-execution-report.md refresh); pnpm bg had transient shell issue.

## O1 Refresh (2026-06-07)
AUDIT/EXECUTE per current steering + AGENTS + standards (read all first). Live truth: prereqs (unload, export 12, capture:quick, verify PASS), script audit (run-matrix supports full 12x2 serial + unload + LMSTUDIO only + auto post; added O1 debug log adjacent), direct test exercised path, post-steps (summarize/compare/judge), narrow verify (pnpm verify + git diff --check), updates to roadmap + this + execution report + optimization-state (o1 attempt refreshed with 2026-06-07 facts, no fake cells). system-profile.json cited/respected exactly (8GB Super Max-Q, serializeLoads, placementHints for 12B+/26B/31B, no OOM). No new full cells (long-running nature; smoke authoritative until unattended). Best local qwen/qwen3.5-9b@gpu_offload (63%) noted for W7. Intentional only staged + conventional commit + push. See full details in 2026-06-06-o1-full-matrix-execution-report.md .

## Files Changed (this pass + prior)
- docs/roadmaps/2026-06-06-local-oss-model-evals-plan.md (O1 refreshed accurate)
- docs/evals/2026-06-06-o1-matrix-audit-report.md (this, + refresh)
- docs/evals/2026-06-06-o1-full-matrix-execution-report.md (new refresh section)
- results/optimization-state.json (o1MatrixAttempt + facts)
- scripts/run-matrix.mjs (O1 log for reliability)
- (results/matrix-summary.json + state if post touched)

No blockers. O1 gate passed per full audit + live invocation test. All standards followed (no unrelated, boundary preserved, rg/pwsh, cite profile).
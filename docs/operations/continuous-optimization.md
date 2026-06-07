# Continuous Optimization (Phase B)

Phase B begins after Phase A build exit gate (see roadmap). The **orchestrator assesses**;
**subagents run** evals and tuning.

## Orchestrator turn (deterministic)

Do not improvise. Each turn:

1. Read `results/optimization-state.json` + latest `optimization-report-*.json` +
   `results/system-profile.json` (VRAM estimates, placement hints)
2. Baselines stale? → dispatch subagent: `pnpm baseline:collect -- --force` (credits — document why)
3. Full matrix missing? → dispatch subagent: `pnpm registry:export && pnpm matrix:full`
4. Results exist? → read `matrix-summary.json` leaderboard; pick **one** tuning target
5. Dispatch subagent for that target; wait for commit+push; update roadmap checkpoint

The orchestrator does **not** run these commands itself.

## Subagent commands (execution layer)

```powershell
pnpm capture:system    # nvidia-smi + lms estimates → system-profile.json (run before tuning)
pnpm optimize:smoke    # registry → baselines (if missing) → smoke matrix → report
pnpm optimize:full     # full matrix (hours)
pnpm optimize:loop     # repeat smoke on interval (subagent/host process)
pnpm optimize:report   # refresh state from existing results (no matrix rerun)
```

## Credit usage

| Command | Credits? | When |
| --- | --- | --- |
| `pnpm matrix:*` | No | Local LM Studio only |
| `pnpm baseline:collect` | Yes (Vertex/Azure) | Prompts changed, new tasks, model upgrade |
| Optional cloud judge | Yes | Env enabled + borderline cases only |

Do not re-collect baselines every loop. Check `EVAL_BASELINE_SOURCE` and baseline `importedAt` first.

## What subagents tune (one surface per dispatch)

| Surface | Trigger |
| --- | --- |
| `suites/promptfoo/tests/*.yaml` | Lane pass rate low across models |
| `registry/load-profiles.json` | Preset ranking inconsistent |
| `EVAL_SMOKE_MODELS` | Smoke leader ≠ full-matrix leader |
| `baselines/` | Prompt change only |

## Inspection layer (no Docker)

- `results/matrix-*.jsonl` — raw cells
- `results/matrix-summary.json` — leaderboard
- `results/optimization-state.json` — resume checkpoint
- `results/user-judge-queue.jsonl` — subjective review

Langfuse is optional expansion — not required for Phase B.

## Goal anchors

- `docs/engineering/agents/goal.md` — orchestrator role
- `docs/roadmaps/2026-06-06-local-oss-model-evals-plan.md` — Phase B workstreams O1–O5
- `docs/engineering/agents/orchestration-reliability.md` — poll/resume rules
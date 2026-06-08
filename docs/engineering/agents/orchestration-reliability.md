# Orchestration Reliability

Use this guidance when a goal run coordinates work through subagents in the `evals`
repository.

## Failure Mode

Recent goal runs have stopped while the coordinator was waiting on subagents. The goal records stayed `active`, with no token budget and no completed or blocked status. The session logs ended immediately after `wait_agent` calls with long timeouts, which means the coordinator did not receive the wait result and resume.

Treat this as a tool-session reliability risk, not a product or repository blocker.

## Coordinator Rules

- Do not use one long `wait_agent` call as the only coordination point.
- Poll subagents in short intervals, normally 60-120 seconds.
- The coordinator stays active while subagents run. Dispatching a subagent is not a pause, final handoff, or reason to stop the goal session.
- Keep polling until every dispatched subagent has a terminal result, has been explicitly closed, or has been replaced by a new checkpointed dispatch. A timed-out poll is not a stopping condition.
- Do not send a final handoff while any checkpointed subagent is still running unless the user explicitly pauses the run.
- After every subagent dispatch, write a compact checkpoint into the active roadmap before waiting:
  - agent id
  - workstream and pass
  - expected ownership boundary
  - dispatch timestamp
  - next coordinator action
- After every returned subagent result, update the same checkpoint with:
  - status
  - changed files
  - verification
  - unresolved blockers
  - next pass needed
- If a wait call does not return, a later coordinator must resume from the roadmap checkpoints and visible git state, not from memory.
- After a coordinator resume, first try `resume_agent` for checkpointed agent ids before replacing them. If resumed handles repeatedly time out without status, record them as stale in the roadmap and dispatch a replacement agent with a new checkpoint.
- If the platform supports direct status nudges, ask long-running subagents for a compact status before another wait.
- Never leave the only source of orchestration state inside the coordinator context window.

## Practical Loop

1. Dispatch one workstream agent.
2. Immediately checkpoint the dispatch in the active roadmap.
3. Poll with short waits until a terminal result returns.
4. On return, checkpoint the result.
5. Dispatch the next pass or next independent stream only after the roadmap reflects the current state.

This keeps goal runs resumable even if the coordinator session is interrupted at the subagent wait boundary.

## Eval Harness Additions

These rules extend the coordinator loop for `evals` goal runs. They do not replace the rules above.

### Orchestrator vs subagent roles

- The **orchestrator assesses and dispatches**; **subagents execute** (code, `pnpm` runs, commits).
- Do not run matrix/eval/baseline commands in the orchestrator context. Dispatch a subagent.
- Do not interrupt subagents mid-task. Poll until commit+push; then judge.
- While a GPU-bound eval stream is running, do not dispatch another GPU-bound model-serving stream. Only one LM Studio / llama.cpp local model load may be active at a time.
- Parallel subagents are allowed only for non-GPU analysis, docs, artifact review, or prep work that cannot contend with the active model server.
- If work is not on the active roadmap phase, do not dispatch it. Unspecified orchestrators invent misaligned tasks.

### Phase discipline

| Phase | Passes | Orchestrator judges |
| --- | --- | --- |
| **A — Build** (W1–W6) | Two fresh-context passes per workstream | After pass-2 commit only (`git show --stat`, A/B/C) |
| **B — Optimize** (O1–O5) | One subagent per ordered cycle step | After each commit; read `optimization-state.json` |

Phase B ordered cycle (orchestrator reads state, subagent executes):

1. Check baselines stale → baseline subagent if needed
2. Check full matrix done → matrix subagent if needed
3. Read leaderboard → one tuning subagent
4. Update roadmap checkpoint

### Eval-run checkpoints

Checkpoint in the active roadmap and `results/optimization-state.json`:

- phase (A or B) and current workstream / optimization step
- `EVAL_BASELINE_SOURCE` and whether baselines are current
- latest `matrix-*.jsonl` and `matrix-summary.json` leaderboard
- credit spend this cycle (baseline collect / optional judge — note reason)
- next **single** explicit dispatch (not a wish list)

Subagents running matrix record: model key, preset, partial JSONL path. Orchestrator reads files after push — does not watch LM Studio live.

### Credits (Vertex / Azure)

- Use credits for **text baselines** when prompts/tasks/model change (`pnpm baseline:collect -- --force`).
- Use optional cloud judge only when env-gated and deterministic scores are insufficient.
- Do **not** re-baseline every `optimize:loop` iteration.
- Matrix runs are LM Studio only — zero credit cost.
- Never use voice/realtime deployments (`gpt-realtime-*`, `VERTEX_REALTIME_MODEL`) for eval baselines.

### Results layer (no Docker required)

- JSONL + `optimization-report-*.json` + `optimization-state.json` are source of truth.
- Langfuse OSS is deferred. Do not block progress on Docker.

### GPU and comparison rules

- Serialize GPU-bound local inference: one LM Studio-loading subagent at a time per host.
- Do not treat a timed-out matrix eval as complete. Resume from checkpointed cell.
- Record baseline completion before comparison; flag `missing-baseline` explicitly if absent.
- User-judge queue is a separate lane; do not fold subjective overrides into automated pass/fail.
- Stop LM Studio in closeout unless roadmap marks intentional matrix continuation.

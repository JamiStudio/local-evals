# Fresh Session Handoff: Large MoE Focused Eval/Tune Run

You are continuing `C:\Users\james\projects\evals`.

Read first:

1. `AGENTS.md`
2. `docs/roadmaps/2026-06-07-contained-eval-streams-plan.md`
3. `docs/roadmaps/2026-06-08-large-moe-focused-eval-roadmap.md`
4. `docs/operations/llama-cmoe-sidecar.md`
5. `docs/operations/large-moe-focused-evals.md`
6. `registry/large-moe-pairs.json`
7. Current `results/large-moe-*`, `results/llama-cmoe-*`, and `results/promptfoo-latest.json`

Goal:

Run a focused, incremental large Gemma 4 MoE/QAT comparison campaign. Compare
CPU-MoE sidecar candidates against nearby dense or standard single-host
counterparts. Tune one config variable at a time only when the previous artifact
identifies a concrete failure.

Hard boundaries:

- LM Studio local and llama.cpp local only.
- No direct paid APIs.
- One model loaded at a time.
- Stop `llama-server` before LM Studio load tests.
- Run `lms unload --all` before sidecar tests.
- Archive every meaningful output under `results/large-moe-*`.
- Do not claim final promotion without user-review evidence.

Execution loop:

1. Confirm runtime: `lms ps`, `nvidia-smi`, sidecar `/v1/models` if applicable.
2. Run smoke for one candidate.
3. If smoke passes, run full direct suite.
4. If full suite is competitive, run pressure tasks.
5. Inspect failures before tuning.
6. Tune exactly one variable.
7. Repeat only while the result changes a concrete decision.
8. Write a concise decision artifact under `docs/evals/`.

Start with:

```powershell
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:8080/v1"
pnpm large-moe:smoke -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-26b-a4b-qat-cpu-moe
pnpm large-moe:full -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-26b-a4b-qat-cpu-moe
```

Then test LM Studio counterparts one at a time after stopping sidecar:

```powershell
Stop-Process -Name llama-server -Force
lms unload --all
```

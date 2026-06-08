# Large MoE Focused Evals

This lane compares large Gemma 4 MoE/QAT CPU-MoE candidates against nearby
dense or standard single-host counterparts. It is separate from the broad matrix
so tuning can stay incremental and reviewable.

## Pair Registry

Pair metadata lives in:

```text
registry/large-moe-pairs.json
```

Primary pair:

- `gemma4-26b-a4b-qat-cpu-moe` via llama.cpp sidecar
- `google/gemma-4-12b` via LM Studio
- `google/gemma-4-12b-qat` via LM Studio
- optional HF sidecar: `unsloth/gemma-4-12B-it-qat-GGUF`

Secondary pair:

- optional HF sidecar: `unsloth/gemma-4-31B-it-qat-GGUF`
- `google/gemma-4-31b` via LM Studio
- `google/gemma-4-31b-qat` via LM Studio

Control pair:

- `google/gemma-4-e4b`
- `google/gemma-4-e2b`

## Commands

List pairs:

```powershell
pnpm large-moe:list
```

Smoke the already-running sidecar candidate:

```powershell
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:8080/v1"
pnpm large-moe:smoke -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-26b-a4b-qat-cpu-moe
```

Run the full direct suite for the already-running sidecar candidate:

```powershell
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:8080/v1"
pnpm large-moe:full -- --pair=gemma4-26b-a4b-vs-12b --candidate=gemma4-26b-a4b-qat-cpu-moe
```

Include optional HF downloads only in the long-running tuning session:

```powershell
$env:EVAL_INCLUDE_OPTIONAL_DOWNLOADS = "1"
```

## Tuning Rules

- Start with `build-synthetic-smoke`, then full direct suite, then pressure tasks.
- Change one variable per round: context, reasoning, KV cache, chat template,
  `max_tokens`, CPU-MoE, or GPU layers.
- Archive every result under `results/large-moe-*`.
- Do not run LM Studio and llama-server model loads at the same time.
- Do not promote a candidate from one filtered task. Require full direct suite
  plus reviewable pressure evidence.

## Fresh-Session Handoff

Use `docs/operations/large-moe-long-run-handoff.md` as the prompt for a fresh
single-agent long-running test/tweak session.

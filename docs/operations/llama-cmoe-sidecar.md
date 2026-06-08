# llama.cpp CPU-MoE Sidecar

Use this path when testing llama.cpp flags that LM Studio's `lms load` CLI does
not expose, especially `-cmoe` / `--cpu-moe` for large MoE GGUF models.

Default LM Studio evals remain unchanged. The sidecar serves an
OpenAI-compatible API on `http://127.0.0.1:8080/v1`; existing direct eval scripts
can target it by setting `LMSTUDIO_BASE_URL`.

## Runtime

Installed CUDA runtime:

```powershell
C:\Users\james\tools\llama.cpp-b9544-cuda12.4\llama-server.exe
```

Model cached by `llama-server -hf`:

```text
C:\Users\james\.cache\huggingface\hub\models--unsloth--gemma-4-26B-A4B-it-qat-GGUF\snapshots\df8f95ac194275cab887832cca126da33616b425\gemma-4-26B-A4B-it-qat-UD-Q4_K_XL.gguf
```

## Start

Conservative:

```powershell
pnpm llama:cmoe:server -- -Context 32768
```

Near-native context used in the first verification:

```powershell
pnpm llama:cmoe:server -- -Context 248000 -Parallel 1 -Reasoning off
```

The wrapper defaults to:

- `-cmoe`
- `-ngl auto`
- `-ctk q4_0 -ctv q4_0`
- `-np 1`
- `--cache-ram 0`
- `--reasoning off`
- `--host 127.0.0.1 --port 8080`

Reasoning is off by default because the Gemma 4 chat template otherwise returns
visible answer text in `reasoning_content` for ordinary probes.

## Probe

```powershell
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:8080/v1"
$env:EVAL_SUBJECT_MODEL = "unsloth/gemma-4-26B-A4B-it-qat-GGUF"
pnpm llama:cmoe:probe
```

Generated long-prompt probe:

```powershell
$env:EVAL_PROBE_REPEAT_WORDS = "20000"
$env:EVAL_PROBE_MAX_TOKENS = "32"
pnpm llama:cmoe:probe
```

## Direct Eval

```powershell
$env:LMSTUDIO_BASE_URL = "http://127.0.0.1:8080/v1"
$env:EVAL_SUBJECT_MODEL = "unsloth/gemma-4-26B-A4B-it-qat-GGUF"
$env:EVAL_LOAD_PROFILE = "llama_cmoe_ctx248k_q4kv"
$env:EVAL_TASK_FILTER = "build-synthetic-smoke"
node scripts/run-local-eval.mjs
```

## First Verification

Host: RTX 2080 Super Max-Q 8GB VRAM, 32GB system RAM.

| Context | Server status | Probe decode | Direct eval |
| --- | --- | --- | --- |
| 32,768 | loaded, one slot | 95 completion tokens, llama timing 16.9 tok/s | `build-synthetic-smoke` 1/1 PASS in 5.3s |
| 65,536 | loaded, one slot | 86 completion tokens, llama timing 17.2 tok/s | `build-synthetic-smoke` 1/1 PASS in 12.9s |
| 131,072 | loaded, one slot | 87 completion tokens, llama timing 16.9 tok/s | `build-synthetic-smoke` 1/1 PASS in 13.2s |
| 248,064 | loaded, one slot | 91 completion tokens, llama timing 16.9 tok/s | `build-synthetic-smoke` 1/1 PASS in 13.5s |

Large prompt at 248,064 context:

- Generated prompt: 20,000 repeated words.
- Tokenized prompt: 58,023 prompt tokens.
- Prompt processing: 46,141 uncached prompt tokens at 404.7 tok/s.
- Decode: 32 completion tokens at 16.6 tok/s.
- VRAM after test: about 5,952 MiB used / 2,036 MiB free.

This confirms the technique is viable on the 8GB host, but the X-post's
20+ tok/s decode claim was not reproduced in this first controlled smoke. The
observed stable decode band was about 16-17 tok/s with reasoning off and Q4 KV.

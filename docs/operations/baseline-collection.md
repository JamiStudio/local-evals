# Baseline Collection (Outside the Harness)

The automated eval matrix runs **LM Studio only** — no paid API calls. Reference
outputs come from you, running the same tasks through a subscription or
credit-funded endpoint separately.

## Vertex model selection (June 2026+)

Do **not** reuse voice-project vars (`VERTEX_TEXT_MODEL`, `VERTEX_REALTIME_MODEL`) for eval
baselines. Those are realtime/TTS lanes.

```powershell
pnpm gemini:models          # live list from your GEMINI_API_KEY
```

Set in `.env`:

- `VERTEX_BASELINE_MODEL` — text model for reference outputs (e.g. `gemini-3.1-pro-preview`)
- `VERTEX_JUDGE_MODEL` — optional rubric judge (e.g. `gemini-3.5-flash`)
- `EVAL_BASELINE_SOURCE` — label matching files under `baselines/<task>/` (auto-derived if unset)

After changing the model, re-collect:

```powershell
pnpm baseline:collect -- --force
```

## Allowed baseline sources

| Source id | How you run it |
| --- | --- |
| `chatgpt-sub` | ChatGPT subscription UI |
| `claude-sub` | Claude subscription UI |
| `grok-sub` | Grok subscription UI |
| `gemini-sub` | Gemini subscription UI |
| `azure-openai` | Azure OpenAI deployment (credit-funded) |
| `vertex-gemini-*` | Vertex Gemini text model (e.g. `vertex-gemini-3-1-pro-preview`) |
| `other-sub` | Any other already-paid lane |

**Not allowed in the harness:** direct `api.openai.com` or other pay-per-token API
keys billed outside your subs/credits.

## Workflow

### 1. Print prompts

```powershell
pnpm baseline:prompts
```

Copy each task block into your chosen sub or Azure/Vertex chat.

### 2. Save the answer

Save the model's full response to a text file, e.g. `answers/research-smoke-chatgpt.txt`.

### 3. Import into the harness

```powershell
pnpm baseline:import -- --task research-synthetic-smoke --source chatgpt-sub --file answers/research-smoke-chatgpt.txt
```

Repeat per task × source. You can import multiple sources for the same task
(e.g. Claude + Azure) to compare placement across references.

### 4. Run local matrix

```powershell
pnpm matrix:smoke
```

This produces deterministic local scores, then:

```powershell
pnpm compare:baseline
pnpm judge:queue
```

Review `results/user-judge-queue.jsonl` — compare local output side-by-side with
imported baselines in your sub UI or a spreadsheet.

## Optional: Azure credit judge (automated rubric)

Only if you want automated LLM rubric scoring on **Azure credits** (not direct API):

```powershell
# .env: EVAL_ENABLE_AZURE_JUDGE=true + Azure endpoint vars
pnpm eval:azure-judge
```

Default matrix runs use deterministic assertions only.
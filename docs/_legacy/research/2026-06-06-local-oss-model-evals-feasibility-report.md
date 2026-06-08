# Local OSS Model Evaluation Harness Feasibility Report

Date: 2026-06-06
Status: accepted
Request: Stand up a local eval harness to test all LM Studio OSS models (GPU-fit
and GPU-offload variants) through typical agent workflows (research, plan, build,
tool calling), compare results granularly, and determine where local models can
efficiently support production workflows.
Source scope: `evals/` repo, operator LM Studio inventory, Studio agent-harness
workflow references, official framework and LM Studio docs.
Owner: evals

## Executive Summary

A local eval harness is feasible and should be built on **existing open-source
frameworks**, not custom scoring infrastructure. The recommended shape is a
**hybrid stack**:

1. **Promptfoo** (primary) — matrix evaluation across all models and workflow
   suites, deterministic assertions, tool-calling tests, latency/token capture,
   YAML-driven reproducibility.
2. **DeepEval** (secondary) — agent-quality metrics (task completion, tool
   correctness, plan adherence) with trace-based scoring for multi-step runs.
3. **Langfuse OSS** — durable trace/result storage and run comparison UI from day one,
   alongside JSONL exports (not deferred).
4. **Imported baseline lane** — operator runs tasks through subs (ChatGPT, Claude,
   Grok, Gemini) or Azure/Vertex credits outside the harness; no direct paid API calls.
5. **User judge lane** — primary scoring via comparison of local output vs imported baseline.
6. **Optional Azure credit judge** — automated rubric only when explicitly enabled (off by default).

LM Studio is the right local inference surface: it already hosts **13 models**
(~106 GB on disk), exposes an **OpenAI-compatible API**, and supports per-load
GPU/offload configuration via `lms load`.

On this host (**RTX 2080 Super Max-Q, 8 GB VRAM**), expect a clean split:
models ≤ ~5 GB can run fully on GPU; 6–8 GB models are borderline; 12B+ models
require offload and will show materially different latency/quality tradeoffs —
which is exactly what the eval should measure.

**Verdict:** Feasible and accepted. Build the hybrid stack, cloud baseline, dual
judge, two load presets, mixed suites, and Langfuse OSS together in the first
implementation wave — not as follow-up phases.

## Question Being Answered

Where can locally hosted OSS models (served through LM Studio) reliably support
Studio-style agent workflows, and which model/quant/offload profiles are worth
keeping as efficient supporting roles versus leaving to cloud models?

Sub-questions:

- Which open-source eval framework best fits matrix comparison across many local
  models?
- How do we test research, planning, build, and tool-calling workflows uniformly?
- What tasks are realistic for 8 GB VRAM local models?
- How do we record comparable, granular results (quality, latency, tokens, tool
  accuracy, offload mode)?

## Source Scope And Method

Checked locally:

- `C:\Users\james\projects\evals\` — greenfield repo; engineering standards and
  agent orchestration docs present; no harness implementation yet.
- `lms ls --json` — 12 LLMs + 1 embedding model, quant variants, tool-use flags.
- `nvidia-smi` — NVIDIA GeForce RTX 2080 Super Max-Q, 8192 MiB total VRAM.
- `C:\Users\james\projects\zavi\AGENTS.md` and agent-harness owned-core docs —
  typical workflow surfaces (research, tools, orchestration).
- `C:\Users\james\projects\evals\docs\engineering\standards\report-style.md` —
  report format.

Checked externally (official docs, 2026-06-06):

- [DeepEval evaluation introduction](https://deepeval.com/docs/evaluation-introduction)
- [DeepEval LM Studio integration](https://deepeval.com/integrations/models/lmstudio)
- [DeepEval Task Completion metric](https://deepeval.com/docs/metrics-task-completion)
- [Promptfoo configuration guide](https://www.promptfoo.dev/docs/configuration/guide/)
- [Promptfoo OpenAI provider (apiBaseUrl)](https://www.promptfoo.dev/docs/providers/openai/)
- [Promptfoo tools configuration](https://www.promptfoo.dev/docs/configuration/tools/)
- [LM Studio OpenAI-compatible endpoints](https://lmstudio.ai/docs/developer/openai-compat)
- [Langfuse Promptfoo integration](https://langfuse.com/integrations/other/promptfoo)

Commands run:

- `lms ls`, `lms ls --json`, `lms ps`
- `nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version --format=csv`

Not checked live:

- End-to-end Promptfoo/DeepEval runs against LM Studio (harness not scaffolded yet).
- LM Studio server tool-calling behavior per model (planned first implementation
  verification).

## Current Project State

### `evals` repository

The repo is documentation-first today:

- `docs/engineering/standards/` — planning, docs, and report style (refreshed for
  this codebase).
- `docs/engineering/agents/` — orchestration guidance and goal prompt (unchanged
  goal document from prior codebase import).
- No `suites/`, `providers/`, `datasets/`, `results/`, or `AGENTS.md` yet.

### Operator LM Studio inventory (verified)

| Model key                 | Params  | Quant        | Size     | Tool-trained | Vision | Variants |
| ------------------------- | ------- | ------------ | -------- | ------------ | ------ | -------- |
| liquid/lfm2.5-1.2b        | 1.2B    | Q8_0         | 1.25 GB  | yes          | no     | 1        |
| nvidia/nemotron-3-nano-4b | 4.0B    | Q4_K_M, Q8_0 | 2.84 GB  | yes          | no     | 2        |
| google/gemma-4-e2b        | 4.6B    | Q4_K_M, Q8_0 | 4.41 GB  | yes          | yes    | 2        |
| essentialai/rnj-1         | 8.3B    | Q4_K_M       | 5.11 GB  | yes          | no     | 1        |
| google/gemma-4-e4b        | 7.5B    | Q4_K_M       | 6.33 GB  | yes          | yes    | 1        |
| qwen/qwen3.5-9b           | 9B      | Q4_K_M       | 6.55 GB  | yes          | yes    | 1        |
| google/gemma-4-12b        | 12B     | Q4_K_M       | 7.56 GB  | yes          | yes    | 1        |
| google/gemma-4-12b-qat    | 12B     | Q4_0         | 7.15 GB  | yes          | yes    | 1        |
| zai-org/glm-4.6v-flash    | 9.4B    | Q4_K_M       | 7.95 GB  | yes          | yes    | 1        |
| google/gemma-4-26b-a4b    | 26B-A4B | Q4_K_M       | 17.99 GB | yes          | yes    | 1        |
| google/gemma-4-31b        | 31B     | Q4_K_M       | 19.89 GB | yes          | yes    | 1        |
| google/gemma-4-31b-qat    | 31B     | Q4_0         | 18.85 GB | yes          | yes    | 1        |

Embedding: `text-embedding-nomic-embed-text-v1.5` (84 MB, local).

**Total:** 13 models, ~106 GB disk. No model currently loaded (`lms ps` empty).

### Hardware constraint

- GPU: RTX 2080 Super Max-Q — **8 GB VRAM**
- Implication: large models cannot run fully on GPU; eval must record load
  profile (GPU layers vs CPU offload) alongside quality scores.

### Workflow reference (Studio ecosystem)

From agent-harness owned-core docs and Zavi/Hermes integration patterns, typical
workflows to mirror in eval suites:

1. **Research** — gather context, summarize sources, produce structured findings.
2. **Plan** — turn findings into scoped implementation steps with dependencies.
3. **Build** — generate bounded code/doc edits from a plan and file context.
4. **Tool call** — select and invoke tools (search, read_file, write_file,
   run_command, approval checkpoint) with schema-valid arguments.
5. **Orchestrate** — route subtasks, maintain checkpoints, report blockers
   (lighter-weight eval lane).

## Official / External Findings

### LM Studio as eval backend

- LM Studio exposes OpenAI-compatible HTTP endpoints (`/v1/chat/completions`,
  etc.), so frameworks that speak OpenAI can target local models without custom
  adapters.
- `lms` CLI supports listing models, loading with config, and server management —
  suitable for scripted per-model eval orchestration.
- Models declare `trainedForToolUse` in inventory; actual tool-call reliability
  still needs per-model empirical testing.

### DeepEval

- Open-source, runs locally; cloud (Confident AI) is optional.
- Strong for **agent evals**: trace-based metrics (`TaskCompletionMetric`,
  `ToolCorrectnessMetric`, `PlanAdherenceMetric`), pytest-style `deepeval test
run`, dataset/golden workflows.
- Documents LM Studio integration for using local models as **evaluator** or
  **subject** model.
- Best when scoring multi-step agent outcomes and component-level behavior.

### Promptfoo

- Open-source, strong for **matrix evals**: same test suite × many providers.
- YAML config, assertions (`contains-json`, `javascript`, `similar`,
  `llm-rubric`), tool/function calling via provider `tools` and
  `functionToolCallbacks`.
- OpenAI provider supports `apiBaseUrl` / `OPENAI_BASE_URL` for local endpoints.
- Captures per-test latency and cost metadata; good for granular model/quant
  comparison tables.
- Recently joined OpenAI (2026); project remains open source, but long-term
  governance is a mild vendor-risk to note.

### Langfuse (optional)

- OSS/self-hostable trace and eval result store.
- Official Promptfoo integration for prompt versioning + run logging.
- Useful after suites exist; not required for day-one local runs.

### Less fitting as primary harness

| Framework                           | Why not primary here                                             |
| ----------------------------------- | ---------------------------------------------------------------- |
| lm-evaluation-harness / OpenCompass | Academic benchmarks (MMLU, etc.), not agent workflow fit         |
| RAGAS                               | RAG-quality focused; partial overlap only                        |
| Braintrust                          | Strong product, but not fully free/local-first for this use case |
| Custom runner                       | Higher maintenance; worse than composing Promptfoo + DeepEval    |

## Industry Standard Shape

Modern local model evaluation for agent products usually layers:

```text
┌─────────────────────────────────────────────────────────────┐
│ Workflow suites (research / plan / build / tools / route)   │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────┐                 ┌────────────────────┐
│ Matrix runner      │                 │ Agent-trace scorer  │
│ (Promptfoo)        │                 │ (DeepEval)          │
│ - assertions       │                 │ - task completion   │
│ - tool callbacks   │                 │ - tool correctness  │
│ - latency/tokens   │                 │ - plan adherence    │
└─────────┬─────────┘                 └──────────┬─────────┘
          │                                      │
          └──────────────────┬───────────────────┘
                             ▼
                 ┌───────────────────────┐
                 │ LM Studio OpenAI API   │
                 │ + per-model load config│
                 └───────────────────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Normalized results DB  │
                 │ (JSONL/SQLite/Langfuse)│
                 └───────────────────────┘
```

Key conventions:

- **Same tasks for every model** — only provider/load profile changes.
- **Record run metadata** — model id, quant, context length, GPU offload preset,
  prompt version, suite version, timestamp, host GPU.
- **Separate deterministic checks from LLM-judge scores** — both are valuable.
- **Keep cloud judge optional** — use a fixed local or cloud judge for
  cross-run comparability.

## Implementation Options

### Option A: Promptfoo-only

**Description:** YAML suites + OpenAI provider pointed at LM Studio for all models.

**When it fits:** Fastest path to matrix comparison and workflow assertions.

**Tradeoffs:**

- Technical: excellent multi-model matrix; good tool tests; weaker native agent
  trace analytics.
- Practical: single Node-based toolchain; easy result diffing.
- Cost: free/local.
- Reversibility: high.

### Option B: DeepEval-only

**Description:** Python test cases with agent metrics and LM Studio-backed models.

**When it fits:** Agent-outcome scoring is the only priority.

**Tradeoffs:**

- Technical: strong agent metrics and tracing; more effort for large model-matrix
  UX.
- Practical: Python-first; better for CI pytest than interactive matrix review.
- Cost: free/local.
- Reversibility: high.

### Option C: Promptfoo + DeepEval hybrid (recommended)

**Description:** Promptfoo runs workflow suites across all models; DeepEval
scores selected multi-step traces and agent-quality metrics. Shared result schema.

**When it fits:** This project — many models, workflow lanes, tool calling, and
agent-style outcomes.

**Tradeoffs:**

- Technical: two frameworks, but complementary; minimal custom code (orchestrator
  - schema only).
- Practical: slightly more setup; best coverage per engineering hour.
- Cost: free/local.
- Reversibility: high — each layer replaceable.

### Option D: Custom harness + academic benchmarks

**Description:** Build runner from scratch; prioritize MMLU/HumanEval-style scores.

**When it fits:** Foundation model research, not product workflow placement.

**Tradeoffs:**

- Technical: high build cost; poor mapping to research/plan/build/tool workflows.
- Practical: slow to maintain.
- Cost: free but expensive in time.
- Reversibility: low.

## Technical Implications

### Architecture

- Thin repo-owned orchestration script (`scripts/run-matrix.mjs` or `.py`) that:
  1. Reads model registry exported from `lms ls --json`
  2. Loads model with named GPU/offload presets
  3. Runs Promptfoo suite(s)
  4. Optionally runs DeepEval trace suite
  5. Writes normalized JSONL results

### Data model (result record)

Minimum fields per test × model:

- `run_id`, `suite_id`, `task_id`, `model_key`, `variant`, `quant`
- `load_profile` (`gpu_full`, `gpu_partial`, `gpu_minimal`)
- `pass` (deterministic), `judge_score`, `metric_scores` (DeepEval)
- `latency_ms`, `prompt_tokens`, `completion_tokens`
- `tool_calls_expected`, `tool_calls_valid`
- `failure_reason`, `raw_output_path` (optional)

### Providers

- LM Studio OpenAI-compatible base URL (default `http://localhost:1234/v1`).
- Separate **judge** provider config (fixed model) for LLM-rubric consistency.

### Security

- Local-only evals; no secrets in tracked configs.
- Tool-call tests must use sandboxed callbacks — no real shell/network by default.

### Tests

- Golden workflow cases with deterministic assertions.
- Agent trace cases with DeepEval metrics.
- Smoke test per model: loads, responds, schema-valid JSON.

### Performance / observability

- Expect long total runtime across 13 models × N tasks × variants.
- Serialize model runs (single GPU); record wall-clock per model.
- Store per-suite breakdown to compare GPU-fit vs offload profiles.

## Project Implications

### Scope

Phase 1 (first implementation wave — all accepted decisions):

- Model registry + two load-profile presets (`gpu_full`, `gpu_offload`)
- 4 workflow suites: research, plan, build, tool-call (mixed synthetic + real templates)
- Promptfoo matrix runner + DeepEval agent-trace metrics
- Cloud baseline lane on a fixed cloud model per task
- Cloud judge + user-judge review hooks
- JSONL results + Langfuse OSS from day one
- Comparison script and per-lane decision memo template

Phase 2:

- Full matrix run across all LM Studio models and quant variants
- Hook best local candidates into Studio agent routing policy (supporting roles only)

### Sequencing

1. Scaffold repo structure and `AGENTS.md`
2. Define workflow suites from real Studio tasks
3. Promptfoo + LM Studio smoke run on 2 small models
4. Full matrix run with offload presets
5. DeepEval trace metrics on top candidates
6. Feasibility decision memo per workflow lane

### Ownership surfaces

- `suites/promptfoo/` — matrix configs and assertions
- `suites/deepeval/` — agent metric tests
- `registry/models.json` — exported LM Studio inventory
- `registry/load-profiles.json` — GPU/offload presets
- `results/` — gitignored JSONL run artifacts
- `scripts/` — orchestration and comparison

## Risks And Constraints

| Risk                        | Impact                                        | Mitigation                                                        |
| --------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| 8 GB VRAM limits            | Large models slow or fail                     | Record offload presets; compare fairly within same profile        |
| Tool-calling variance       | Some GGUF models weak at tools                | Dedicated tool suite; don't assume `trainedForToolUse` = reliable |
| LLM-judge drift             | Scores vary by judge model                    | Fix judge provider; log judge version                             |
| Long runtimes               | Full matrix may take hours                    | Smoke + nightly full matrix modes                                 |
| Promptfoo governance change | Post-OpenAI acquisition uncertainty           | Keep result schema framework-agnostic                             |
| Eval ≠ production           | Harness tasks may not match live Hermes loops | Derive tasks from real workflow templates                         |
| Greenfield repo             | No CI gates yet                               | Add after first successful suite                                  |

## Recommended Direction

**Option C: Promptfoo + DeepEval hybrid**, with LM Studio as the sole local
inference backend and a thin custom orchestrator for model/load-profile matrix
execution.

Why:

- Promptfoo is the best fit for **all-models, same-tasks** comparison with
  useful built-in assertions and tool simulation.
- DeepEval is the best fit for **agent workflow quality** scoring (task
  completion, tool correctness, plan adherence) without writing custom metrics.
- Together they avoid a custom eval framework while covering both matrix and
  agent lenses.
- LM Studio is already provisioned with the full model stable.

### Preliminary task placement hypothesis

Tasks likely **worthy** of local models (supporting roles):

| Lane                   | Rationale                                                         |
| ---------------------- | ----------------------------------------------------------------- |
| Research summarization | Short-context synthesis; quality acceptable at 9–12B with offload |
| Structured extraction  | JSON/schema tasks testable with deterministic assertions          |
| Plan outline drafts    | First-pass plan skeleton before cloud refinement                  |
| Routing/classification | Small models (1–4B) for lane selection and triage                 |
| Embedding retrieval    | Already local (`nomic-embed-text-v1.5`)                           |
| Tool argument drafting | Bounded schemas; validate with callbacks                          |

Tasks likely **not worthy** as primary local roles (cloud/coordinator preferred):

| Lane                              | Rationale                                                           |
| --------------------------------- | ------------------------------------------------------------------- |
| Multi-step orchestration          | Reliability and checkpoint discipline tested poorly on small locals |
| Long-horizon build/refactor       | Quality and context discipline lag cloud coding models              |
| High-stakes tool execution        | Needs stronger guardrails and error recovery                        |
| Final review/security             | Judge-quality reasoning benefits from larger cloud models           |
| Cross-file architectural planning | Requires broader context + stronger reasoning                       |

**This hypothesis must be validated by the eval matrix — not assumed.**

## Decision Points

### Eval framework stack

Options:

- Option A: Promptfoo-only
- Option B: DeepEval-only
- Option C: Promptfoo + DeepEval hybrid
- Option D: Custom harness

Tradeoffs:

- Option A: fastest matrix; weaker agent trace scoring.
- Option B: best agent metrics; weaker matrix UX.
- Option C: slightly more setup; best coverage.
- Option D: maximum maintenance; poor workflow fit.

Recommendation: **Option C**

Why: Matches the dual need — granular model comparison and agent workflow
scoring — with minimal custom code.

Implication if different: Promptfoo-only loses trace-level agent metrics;
DeepEval-only slows model-matrix iteration UI.

### Judge model policy

Options:

- Option A: Local fixed judge (one LM Studio model)
- Option B: Cloud fixed judge (small cheap cloud model)
- Option C: No LLM judge — deterministic assertions only
- Option D: Cloud judge + user judge (dual lane)

Tradeoffs:

- Option A: fully local; judge quality capped by 8 GB VRAM.
- Option B: more consistent rubric scores; introduces cloud dependency/cost.
- Option C: cheap/reproducible; misses nuanced quality scoring.
- Option D: best rubric consistency plus human override on borderline cases; more
  operator overhead.

Recommendation: **Option D (cloud judge + user judge)** — accepted.

Why: Cloud judge gives stable rubric scores across the full local matrix; user
judge catches subjective quality gaps automation misses. Pair with cloud baseline
outputs so locals are scored against a known reference, not in isolation.

Implication: Every result row records `cloud_baseline_output`, `cloud_judge_score`,
`user_judge_score` (nullable until reviewed), and judge model versions.

### Load profile matrix

Options:

- Option A: Test each model at one "best effort" load preset
- Option B: Test each model at `gpu_full` and `gpu_offload` presets
- Option C: Test every quant variant × load preset (full factorial)

Tradeoffs:

- Option A: fastest; hides offload effects.
- Option B: captures the main GPU-fit vs offload question.
- Option C: most complete; very long runtimes.

Recommendation: **Option B**

Why: Directly answers the stated GPU-fit vs offload comparison without
combinatorial explosion.

Implication if different: A needs less orchestration; C needs overnight scheduling.

### Workflow suite source

Options:

- Option A: Synthetic tasks crafted for eval
- Option B: Anonymized real Studio workflow templates
- Option C: Mix — synthetic smoke + real templates for core suites

Tradeoffs:

- Option A: easy; lower external validity.
- Option B: highest validity; needs sanitization.
- Option C: balanced.

Recommendation: **Option C** — accepted.

Implication if different: Pure synthetic may overestimate local model utility.

### Cloud baseline lane

Options:

- Option A: No baseline — judge locals on absolute rubric only
- Option B: Cloud baseline per task — locals compared against fixed cloud output
- Option C: Cloud baseline + local self-run only on pass/fail gate

Tradeoffs:

- Option A: simpler; harder to interpret relative quality.
- Option B: clearest placement signal; adds cloud cost per task.
- Option C: cheaper; loses full output comparison.

Recommendation: **Option B** — accepted.

Why: Baseline cloud outputs give locals a concrete reference for delta scoring
and make "supporting role" decisions evidence-based.

### Result store

Options:

- Option A: JSONL only
- Option B: Langfuse OSS only
- Option C: JSONL + Langfuse OSS together from day one

Tradeoffs:

- Option A: portable; weak UI for run comparison.
- Option B: strong UI; harder to diff offline.
- Option C: best of both; slightly more setup.

Recommendation: **Option C** — accepted.

Why: No reason to defer what the project wants eventually; JSONL remains the
portable source of truth, Langfuse is the inspection layer.

## Locked Decisions

| Decision            | Choice                                                                           |
| ------------------- | -------------------------------------------------------------------------------- |
| Framework stack     | **Hybrid** — Promptfoo + DeepEval                                                |
| Billing policy      | **No direct paid API calls** — automated runs LM Studio only                     |
| Baseline comparison | **Imported baselines** — subs or Azure/Vertex credits, collected outside harness |
| Judge policy        | **User judge primary**; optional Azure credit judge (off by default)             |
| Load profiles       | **Two presets** — `gpu_full` and `gpu_offload`                                   |
| Suite content       | **Mixed** — synthetic smoke + real Studio templates                              |
| Result store        | **JSONL + Langfuse OSS** from day one                                            |

## Next Step If Accepted

1. Write implementation plan at
   `docs/roadmaps/2026-06-06-local-oss-model-evals-plan.md` reflecting locked
   decisions above
2. Scaffold repo: `AGENTS.md`, `registry/`, `suites/promptfoo/`, `suites/deepeval/`,
   `langfuse/`, `scripts/`, `.env.example`
3. Export `lms ls --json` → `registry/models.json` + `registry/load-profiles.json`
4. Implement 4 mixed workflow suites + cloud baseline provider config
5. Wire Langfuse OSS + JSONL dual-write in orchestration script
6. Smoke-run: 2 local models × 2 load presets + cloud baseline + cloud judge
7. Full matrix run; queue user-judge review for borderline cases
8. Promote per-lane placement decisions into `docs/decisions/` after review

## Sources

### Local

- `C:\Users\james\projects\evals\docs\engineering\standards\report-style.md`
- `C:\Users\james\projects\evals\docs\engineering\standards\planning-style.md`
- `C:\Users\james\projects\evals\docs\engineering\standards\docs-standards.md`
- `C:\Users\james\projects\references\rebuild\agent-primitives\agent-harness\docs\owned-core\workflow-execution.md`
- `C:\Users\james\projects\references\rebuild\agent-primitives\agent-harness\docs\owned-core\tools-and-integrations.md`
- `C:\Users\james\projects\zavi\AGENTS.md`
- `lms ls --json` output (operator machine, 2026-06-06)
- `nvidia-smi` output (operator machine, 2026-06-06)

### Official / external

- <https://deepeval.com/docs/evaluation-introduction>
- <https://deepeval.com/integrations/models/lmstudio>
- <https://deepeval.com/docs/metrics-task-completion>
- <https://www.promptfoo.dev/docs/configuration/guide/>
- <https://www.promptfoo.dev/docs/providers/openai/>
- <https://www.promptfoo.dev/docs/configuration/tools/>
- <https://lmstudio.ai/docs/developer/openai-compat>
- <https://langfuse.com/integrations/other/promptfoo>

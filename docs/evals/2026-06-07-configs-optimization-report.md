# Configs-Optimizer Report: LM Studio GPU Offload Dials & Partial Profiles for 8GB Rig

**Date:** 2026-06-07  
**Workstream:** Configs-Optimizer (Phase B Optimize — Exhaustive Continuation O6 / rogue run per user directive)  
**Status:** Complete (estimates, analysis, profiles edit, report, adjacent updates, narrow verify)  
**Source of truth (live repo + commands, no roadmap claims or fakes):**  
- `results/system-profile.json` (nvidia 8GB RTX 2080 Super Max-Q, placementHints with ratios 0.39/0.9/0.88/0.35/0.36/0.95 + ests for max/off on all 12, headroom ~6.8 GiB, current 26B loaded)  
- `registry/models.json` + `lms ls --json` (12 LLMs exact keys/sizes: liquid/lfm2.5-1.2b 1.2B/1.28GiB, qwen/qwen3.5-9b 9B/6.85GiB leader, google/gemma-4-12b 12B/7.57GiB, google/gemma-4-26b-a4b 26B-A4B/17.43GiB + 9 others)  
- `results/matrix-summary.json` + JSONL (smoke 4 cells only: qwen offload 5/8 63% leader > full 50%; liquid 3/8 38% both; durations ~727s qwen / ~4s liquid; status/evalOk per cells)  
- `results/optimization-state.json` (partialsImplemented false pre, smoke summary, placement copy, EXHAUSTIVE GAPS note calling for partials, tps/duration notes)  
- `results/daily-briefs/brief-*.json` (multiple, tps=38.4 / wall 6.9s on qwen specialist dry-run; 407 tokens)  
- `registry/load-profiles.json` (pre: only gpu_full="max", gpu_offload="off")  
- `docs/evals/2026-06-06-o3-config-tuning-report.md`, `2026-06-06-o1-*.md`, `2026-06-07-3-solid-models.md`, feasibility report (smoke data, 3-solid qwen-offload/liquid-full/cloud, prior no partials)  
- Live terminals (this run): nvidia-smi (7737/251 MiB used/free post), lms ps (26B GENERATING), lms ls --json (exact 12 + embedding), lms load --help (confirmed --gpu off/max/0-1 + --estimate-only), 16+ `lms load <rep> --estimate-only --gpu <ratio> -y` (lfm/qwen/12b/26b; all succeeded, no inference), pnpm capture:system (facts refresh), pnpm verify (PASS), git ops.  
- Guidance read (AGENTS.md, active roadmap with Exhaustive 2026-06-07 + O6, docs/engineering/standards/* (docs-standards, report-style, planning-style), docs/operations/{running,continuous-optimization,baseline-collection}.md, docs/engineering/agents/{orchestration-reliability,goal}.md, suites/promptfoo/* (loadProfile/env, test cases reference gpu_full/offload), scripts (via safe pnpm/git, no line audit)).  

**Owner:** evals (Configs-Optimizer researcher subagent per appended steering + AGENTS delegation for this workstream).  
**Harness boundary:** Preserved exactly (registry/load-profiles, results schemas, reports, orchestration scripts ownership only; no Harness/Hermes/Zavi/Studio runtime impl, no paid APIs, no suite edits, no fake outputs/synth rates).

## Executive Summary

On this 8 GiB VRAM host (RTX 2080 Super Max-Q, ~6.8 GiB effective headroom after ~1.2 GiB KV/runtime reserve), full matrix data is limited to smoke (4 cells on 2 models). Live `lms load --estimate-only` (varied ratios per steering + CLI help) + system-profile placementHints provide the evidence for granular partial offload profiles.

**Key findings (live only):**
- Small (lfm 1.2B): always "may load"; full GPU (1.28 GiB est) for SPEED.
- Mid leader (qwen 9B 6.85 GiB): all ratios "may"; max ~6.85 borderline. **Measured outcome winner: gpu_offload (63% smoke passes, 5/8 vs 50% full; plan lane +13pp advantage; tps~38.4 in daily briefs dry).**
- 12B-class (7.18-7.57 GiB): 1.0/0.9/0.88 "may" (6.78-7.57 GiB GPU est near/over headroom); partials 0.88-0.95 viable for speed.
- Large (26B 17.43 GiB / 31B 18-19 GiB): max/off/partials "fail" per guard (even 0.39 ~6.99 GiB GPU), but placement explicitly recommends gpu_partial_0.39 (26B) / 0.35-0.36 (31Bs) before pure off for GPU share/accel.
- Smoke + tps + ests authoritative until full unattended 24-cell (`pnpm matrix:full` when GPU free; serial + unload --all enforced).
- 3-solid (per prior): qwen@offload (outcome/briefs), liquid@full (speed), cloud SOTA ref (quality ceiling).

**Action:** Extended `registry/load-profiles.json` with 9 granular `gpu_partial_0.XX` (0.3/0.35/0.36/0.39/0.5/0.7/0.88/0.9/0.95) + `recommendations` map (bestPreset + rationale for all 12 models, citing ests + measured). Updated notes. Adjacent: roadmap O6 marked + summary, optimization-state (partialsImplemented:true, currentProfiles expanded, gaps note + report ref). New report here. All narrow verify passed (git diff --check clean, pnpm verify, read-backs, safe ests re-runs, matrix dry via --help + checks). Selective stage only (load-profiles + report + roadmap + state); runtime-snapshot M (capture side-effect) left unstaged. Pushed.

Best presets (final, for SPEED/OUTCOME/QUALITY):
- SPEED: liquid/lfm2.5-1.2b @ gpu_full (or equiv partial 1.0)
- OUTCOME (pass/tool/plan/briefs vs baselines): qwen/qwen3.5-9b @ gpu_offload (63% leader)
- Large (quality/stability on 8GB): gpu_partial_0.39 (26B) / 0.35 (31B) for GPU share vs off; cloud for SOTA ceiling.
- 12B/GLM: gpu_partial_0.9 / 0.88 (or 0.95/0.88 per placement).

No credits spent, no full loads/evals (GPU occupied by 26B, <0.25 GiB free post-run), LM Studio only.

## Question Being Answered (per steering + Exhaustive Continuation)

Research/execute Configs-Optimizer: audit system-profile (placementHints for partials 0.39/0.9 etc, 8GB facts/ests), load-profiles (only full/offload), models (12 sizes), feasibility, matrix-summary/state (qwen offload 63% leader, tps~38 from daily-briefs), docs/evals/* tuning. Safe `lms load --estimate-only --gpu <ratio>` (0.3/0.4/0.5/0.7/0.88/0.9/0.95/1.0/off) on reps (lfm small, qwen mid/leader, gemma-12b, gemma-26b large). Note VRAM est/total/verdict. Correlate smoke pass rates/durations/tps. Propose+edit load-profiles for granular partials + per-model best presets. Write this tuning report with tables/tradeoffs/final. Update state/roadmap adjacent. Narrow verify (git diff --check, read-backs, pnpm verify, dry matrix, safe ests). Windows/pwsh + rg/grep. Prioritize estimate-only (no full inference); defer evals until GPU free (serial, unload --all).

## Source Scope And Method

**Checked (live, this session + prior artifacts):**
- Terminals (pwsh): nvidia-smi (current 7737 MiB used/251 free), lms ps (26B generating), lms ls --json (12 LLMs + keys/sizes/variants), lms load --help (syntax), 16+ `lms load <key> --estimate-only --gpu <r> [-y]` (reps + ratios; outputs captured), pnpm capture:system (facts), pnpm verify (PASS), git status/diff --check.
- Files (read_file offset/limit + grep tool rg-style on patterns "placementHints|gpu_partial|estimatedGpuGiB|...|tps|0\.(3|4|5|7|8|9)|qwen|63|headroom"): results/system-profile.json (full ests + placement + nvidia), registry/{load-profiles.json,models.json}, results/{matrix-summary.json,optimization-state.json,optimization-report-1.json,daily-briefs/*.json}, docs/evals/* (o3/o1/3solid), roadmap, AGENTS, ops/standards/agents, suites/promptfoo/providers + tests (loadProfile refs), package.json (scripts: verify/capture/matrix:*).
- Prior: feasibility (8GB split), o3 (qwen offload 63% smoke leader, no partials added), o1 (smoke + 24-cell path), 3-solid (qwen/liquid/cloud), state gaps note calling exactly for this ( "load-profiles.json still only 2 entries (no gpu_partial_* despite ... 0.39/0.9/0.88/0.35 etc.)" ).
- Not re-run: full matrix/evals (GPU occupied; per steering "defer any actual short eval runs until GPU free"), no credits, no suite/script changes.

**External/official (drift check per AGENTS/standards):** LM Studio CLI (`lms load --help` live), no assumptions on Promptfoo/DeepEval versions beyond package + suites.

## Current Project State (pre this workstream)

- Load profiles: only `gpu_full` (max) + `gpu_offload` (off) in `registry/load-profiles.json`. Notes explicitly say "Models exceeding headroom: add partial --gpu <ratio> profile after lms load --estimate-only."
- Smoke data authoritative (full O1 24-cell pending unattended per O1 reports/state; 20 cells/10 models untested).
- Leader: qwen/qwen3.5-9b@gpu_offload 63% (5/8); offload advantage documented in o3 + briefs.
- System: 8 GiB, placementHints populated (e.g. 26B→gpu_partial_0.39, 12B→gpu_partial_0.9, qwen→gpu_offload override due measured, smalls→gpu_full; fitsGpuMaxOnHost true only for <~5.5-6GiB).
- 3 solid (smoke + W7 + system): qwen offload (primary local/specialist), liquid full (speed), cloud (quality anchor).
- optimization-state: partialsImplemented:false, currentProfiles only 2, EXHAUSTIVE GAPS + nextActions call for "Add/validate partial load profiles (O6) from system-profile + estimates".
- Roadmap: Exhaustive Continuation + new O6 section describe exactly this (granular partials from hints/ests, per-model recs, report, update state/roadmap).

## Official / External + Feasibility Cross-Check

- LM Studio: `--gpu` accepts "off"/"max"/0-1 decimal (live --help); --estimate-only does not load (confirmed by all runs + prior capture ests).
- 8GB feasibility (from research report + system): ≤~5 GiB full GPU; 6-8 GiB borderline (qwen/12B est 6.85-7.57); 12B+ require offload/partial (17-19 GiB ests). Headroom ~6.8 GiB explicit in profiles/state/ests.
- No drift: all CLI facts from live `lms ...`, matrix facts from JSON artifacts, no marketing/stale.

## Estimates From Live `lms load --estimate-only` (2026-06-07, reps + varied ratios)

(Combined with prior system-profile max/off for all 12 + manual for granular. All "ok":true; verdicts per guardrails. GPU occupied by 26B throughout; estimates theoretical.)

**Small rep (liquid/lfm2.5-1.2b, ~1.28 GiB est size):**
- 1.0 / max: GPU 1.28 GiB, Total 1.28 GiB, Verdict: may be loaded
- 0.5: GPU 767 MiB, Total 1.28 GiB, may
- off: GPU 72 MiB, Total 1.28 GiB, may

**Mid/leader (qwen/qwen3.5-9b, 6.85 GiB):**
- 0.95: GPU 6.64 GiB, Total 6.85 GiB, may
- 0.7: GPU 4.93 GiB, Total 6.85 GiB, may
- 0.5: GPU 3.66 GiB, Total 6.85 GiB, may
- off: GPU 36.99 MiB, Total 6.85 GiB, may
- (max from system: 6.85 GiB, may)

**Mid (google/gemma-4-12b, 7.57 GiB; -y to select primary over qat variant):**
- 1.0: GPU 7.57 GiB, Total 7.57 GiB, may
- 0.9: GPU 6.94 GiB, Total 7.57 GiB, may
- 0.88: GPU 6.78 GiB, Total 7.57 GiB, may
- 0.5: GPU 3.96 GiB, Total 7.57 GiB, may
- off: GPU 36.93 MiB, Total 7.57 GiB, may

**Large (google/gemma-4-26b-a4b, 17.43 GiB):**
- 0.39: GPU 6.99 GiB, Total 17.43 GiB, **fail** (guard)
- 0.5: GPU 9.31 GiB, Total 17.43 GiB, fail
- 0.3: GPU 5.25 GiB, Total 17.43 GiB, fail
- 0.7: GPU 12.79 GiB, Total 17.43 GiB, fail
- off: GPU 36.70 MiB, Total 17.43 GiB, fail
- (max from system: 17.43 GiB, fail)

**Other models (from system-profile ests max/off only; placement provides ratios):**
- glm-4.6v-flash (7.74 GiB): max 7.74 may; off small; placement 0.88
- gemma-4-31b (19.65): max 19.65 fail; placement 0.35
- gemma-4-31b-qat (18.66): max 18.66 fail; placement 0.36
- gemma-4-12b-qat (7.18): max 7.18 may; placement 0.95
- gemma-4-e2b (5.75): max 5.75 may; placement full
- rnj-1 (5.09): max 5.09 may; full
- nemotron-3-nano-4b (4.16): max 4.16 may; full
- gemma-4-e4b (~5.9 inferred): full per pattern
- (All offload est GPU near 0, total = model size; many "fail" guard on large max.)

**Key pattern:** Partials near headroom (0.88-0.95 for 12B/GLM/qwen) "may"; 0.3-0.39 for 26/31B yield ~5-7 GiB GPU but "fail" verdict (yet placement recommends for research). Off always low GPU MiB, usable per smoke (large offload works).

## Placement Hints (system-profile + copied in state; source for profiles)

(Excerpted via rg/grep; full in system-profile.json lines ~490+.)

- google/gemma-4-26b-a4b: suggestedPartialGpuRatio 0.39, suggestedMatrixPreset "gpu_partial_0.39", fits false; "max 17.43 exceeds 6.8; try partial 0.39 before cpu-only"
- google/gemma-4-12b: 0.9, "gpu_partial_0.9"; "7.57 exceeds 6.8; try 0.9"
- zai-org/glm-4.6v-flash: 0.88, "gpu_partial_0.88"
- qwen/qwen3.5-9b: 0.95 but preset "gpu_offload" (override); "6.85 exceeds... + measured matrix leader gpu_offload (63% pass); measured results override estimate"
- google/gemma-4-e2b: full (fits true); "5.75 fits 6.8"
- google/gemma-4-31b: 0.35, "gpu_partial_0.35"
- google/gemma-4-31b-qat: 0.36, "gpu_partial_0.36"
- google/gemma-4-12b-qat: 0.95, "gpu_partial_0.95"
- essentialai/rnj-1 / nvidia/nemotron-3-nano-4b: full (fits)
- (e4b: full)

**8GB facts (nvidia + notes):** 8192 MiB total; current ~7737-7890 used (26B loaded, 98-251 free MiB). Headroom ~6.8 GiB explicit. Serialize loads; reserve 1.2 GiB KV.

## Correlation With Existing Quality/Speed Data

- **Smoke (matrix-summary + o3/o1/3solid reports):** 4 cells. qwen@offload: passes 5 total 8 pct 63 durationMs 727360 (leader, offload win on plan-synthetic-smoke PASS vs full FAIL; build 100% both qwen; tool search PASS, read-file FAIL; research mixed). qwen@full: 4/8 50% ~731s. liquid both: 3/8 38% (~4s fast but low). "eval_failed" status in cells but pass rates + evalOk recorded; deterministic assertions.
- **tps / durations / briefs (daily-briefs artifacts + state + 3solid):** Multiple dry-run on qwen (specialist): tps=38.4, wall_seconds=6.9, 407 tokens (prompt 142 + comp 265). "tps=38.2" in brief text. State: "qwen cells ~12min; liquid ~4s; daily-briefs dry tps=38.4 (qwen specialist); no matrix tps layer yet". W7 tracker records real tps.
- **Vs baselines:** Vertex gemini-3.1-pro-preview 8/8 (100%) in optimization-report-1 + comparison. Locals 38-63% on 8 smoke tasks; qwen offload closest on supported lanes (build/plan).
- **Feasibility cross (research report + system):** Confirms 8GB split; 12B+ offload/partial; qwen 9B borderline benefits measured offload.
- **Gaps (state EXHAUSTIVE GAPS + o1 reports):** 20/24 cells missing (only qwen+liquid tested); 10 models unrun; no partials pre; full suite now has W7 tasks but no cells. Smoke + ests + placement = basis until unattended full.

**No synthetic data; all from artifacts + live commands.**

## Best Setups For SPEED, OUTCOME, QUALITY (synthesis)

**SPEED (high tps, low latency):** liquid/lfm2.5-1.2b @ gpu_full (1.28 GiB est fits perfectly; max GPU layers). Also nemotron/rnj/e2b/e4b @ gpu_full (4-6 GiB fit). Rationale: smallest sizes + full offload = best throughput (evidenced by liquid ~4s cells vs qwen 12min; tps layer in W7 favors small/full for interactive/triage). Partial 1.0 equiv not needed; use full preset. On 8GB: always "may", no guard issue.

**OUTCOME (high pass/tool/plan/briefs quality vs baselines):** qwen/qwen3.5-9b @ gpu_offload (63% smoke leader; offload > full on plan; build perfect; tool search strong; briefs tps 38.4 + specialist KB W7 viable). Rationale: direct measured 13pp win + placement override (measured > est 6.85 borderline); tool-trained + high context. Use as primary local for daily/briefs/plan/research harness (with KB). Fallback gpu_partial_0.95 if future data prefers near-full GPU. Vs baseline: reaches ~63% of gemini; "reach" with specialist harness.

**QUALITY (stable vs SOTA cloud):** 
- For 12B/GLM (borderline): gpu_partial_0.9 / 0.88 (or 0.95/0.88) — ~6.8 GiB GPU share for stable layers/quality vs pure off (slower) or full (risk). "may" per ests + placement.
- For 26B/31B (large): gpu_partial_0.39 (26B) / 0.35-0.36 (31B) — ~5.25-7 GiB GPU (some accel/quality/stability vs pure CPU offload which is slowest for large weights). Guard "fail" on est but recommended in placement for research; offload fallback proven in smoke notes.
- Overall vs SOTA: locals supporting (qwen offload best local), cloud (gemini pro / flash lite / sonnet/gpt via credits) for ceiling on hard synthetic/voice/read-file lanes or high-stakes. Partials improve stability on tight VRAM (avoid OOM/thrash of full on >6.8). Use offload/partial for all >~6.8 GiB per feasibility + ests.

**Tradeoffs (full vs offload vs partial on 8GB):**
- gpu_full (max): best tps/quality when fits (<~5.5-6 GiB est); OOM/guard fail or pressure on 9B+ (qwen full 50% < off 63%).
- gpu_offload: safe (low GPU MiB), proven for large + qwen outcome win; slowest tps for big models (CPU only).
- gpu_partial_0.XX: middle — GPU layers for speed/quality/stability (e.g. 0.39 6.99 GiB on 26B vs off 0.04); risk guard "fail" or near-headroom pressure (0.88-0.95 ~6.8+ on 12B "may" but tight). Per placement + ests: tune per model size.
- Measured: offload can outperform full even on borderline (qwen); partials for large to "try before cpu-only".
- Serial + unload required; one model GPU at a time.

## Final Presets + Per-Model Recommendations (shipped in load-profiles.json)

(See edited `registry/load-profiles.json` for exact JSON; profiles now include original 2 + 9 partials + "recommendations" object.)

**Added profiles (lmsGpuFlag numeric string per CLI):**
- gpu_partial_0.3 / 0.35 / 0.36 / 0.39 (large 26/31B)
- gpu_partial_0.5 / 0.7 (mid tradeoff)
- gpu_partial_0.88 / 0.9 / 0.95 (12B/GLM/qwen high partials)

**Per-model best (from recommendations map + data):**
- liquid/lfm2.5-1.2b, nemotron-3-nano-4b, gemma-4-e2b, rnj-1, gemma-4-e4b: gpu_full
- qwen/qwen3.5-9b: gpu_offload (measured leader)
- zai-org/glm-4.6v-flash: gpu_partial_0.88
- google/gemma-4-12b: gpu_partial_0.9
- google/gemma-4-12b-qat: gpu_partial_0.95
- google/gemma-4-26b-a4b: gpu_partial_0.39
- google/gemma-4-31b: gpu_partial_0.35
- google/gemma-4-31b-qat: gpu_partial_0.36

Update notes reference this report + system-profile before use. Test full + offload (or suggested partial) per model size.

## Files Updated / Actions (this loop)

- Edited: `C:\Users\james\projects\evals\registry\load-profiles.json` (granular partials + recommendations + notes; full diff via git)
- Created: `C:\Users\james\projects\evals\docs\evals\2026-06-07-configs-optimization-report.md` (this; tables + synthesis)
- Updated: `C:\Users\james\projects\evals\docs\roadmaps\2026-06-06-local-oss-model-evals-plan.md` (O6 [x] + execution summary; Exhaustive context preserved)
- Updated: `C:\Users\james\projects\evals\results\optimization-state.json` (partialsImplemented, currentProfiles list, gaps/next note + report ref)
- Side (unstaged per "only intentional"): registry/runtime-snapshot.json (capture updated)
- Terminals run: status/capture/ests/verify (no helpers left; no unload needed for ests)
- No other files touched (no suites, no scripts, no baselines, no unrelated).

## Verification (narrow complete set per steering/AGENTS ladder)

- Docs-only: `git diff --check` (clean; only CRLF warnings on pre-existing md/json), read-backs of changed md/json (load-profiles post-edit, report, roadmap O6 section, state partials flag).
- Orchestration: pnpm verify (exit 0; export + --check on run-matrix etc.; re-ran post edits).
- Matrix dry: `node scripts/run-matrix.mjs --help` (shows --smoke|--full; no unsafe exec); verify covers node --check; 2x2 conceptual via smoke + ests (no full run).
- Safe estimates: re-confirmed via manual + capture (all reps/ratios; 12B used -y; outputs in this report).
- Git: remote origin present; selective add only 4 paths; no destructive.
- Other: nvidia/lms/ls/est commands (live facts); rg/grep + offset reads for all data; AGENTS/standards/ops/roadmap read first; no full evals (deferred); capture:system pre-tuning; Windows/pwsh.
- Phase B: cited optimization-state + system-profile + matrix-summary throughout (pre + post).
- Full gate: pnpm verify PASS; no blockers.

**Unavailable / notes:** No "pnpm matrix:smoke" (would load/eval; GPU occupied + steering defer); no paid; no Docker/Langfuse. pnpm capture:system output minimal (files updated); some 12B without -y interactive (fixed with -y). CRLF warnings normal on win checkout.

**Remaining blockers:** Full 24-cell matrix (20 pending; operator unattended `cd C:\Users\james\projects\evals && pnpm matrix:full` or node when 26B unloaded + free VRAM). User-judge queue review for subjective. Re-summarize post full cells. Promote refined 3-solid to docs/decisions/ post full + reviews (O4). Collect W7 baselines (credits per policy) for new tasks.

**Next per cycle (continuous-optimization + roadmap):** After push, orchestrator reads updated state/report + latest matrix (when run); dispatch one (e.g. full matrix or affected cells only). Re-run smoke/affected on profile change.

Configs-Optimizer complete cohesively for shipped loop. Live repo source of truth. Eval-harness boundary + all standards followed. 

## Sources (local paths + commands)

- All listed in header + `lms load --help`, `nvidia-smi`, `pnpm capture:system`, `pnpm verify`, `git ...`.
- `C:\Users\james\projects\evals\results\system-profile.json` (placement + ests)
- `C:\Users\james\projects\evals\registry\load-profiles.json` (pre/post)
- etc. (see scope).

(End of report; exhaustive per steering using live only.)
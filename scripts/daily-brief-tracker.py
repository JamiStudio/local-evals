#!/usr/bin/env python3
"""
W7 Daily Briefs + Hourly Web Search Interest Tracker + Specialist Harness.

Real host script (uses installed free libs + LM Studio OpenAI compat).
Sandbox NOT applied here — real tools (gh, fs limited, ddg+trafilatura) for tracker.
Suites use sandboxed equivalents for evals.

- On-demand (default): single run.
- --loop: recurring (real deployments; test with --max-loops N).
- --dry-run: full working simulation (no LM call, no net) for smoke verification / no LM conflict.
- --use-specialist: load docs/knowledge-bank/evals-specialist.md into system.
- --strict-final: record blank/missing-section model output without fallback synthesis.
- Records token usage + tps (completion tokens / wall seconds).
- Writes results/daily-briefs/brief-*.json (gitignored raw; summaries allowed in .gitignore exceptions).
- Reusable simple ReAct-style tool-calling agent loop (see run_brief_agent).

Usage (uv):
  uv run python scripts/daily-brief-tracker.py --help
  uv run python scripts/daily-brief-tracker.py --model qwen/qwen3.5-9b --use-specialist
  uv run python scripts/daily-brief-tracker.py --dry-run
  EVAL_SUBJECT_MODEL=liquid/lfm2.5-1.2b uv run python scripts/daily-brief-tracker.py --dry-run

LM Studio: server must be running (lms server start); load model first for real runs:
  lms load qwen/qwen3.5-9b --gpu off -y

Free libs only (from pyproject.toml): openai, duckduckgo-search, trafilatura, beautifulsoup4 (optional), httpx (transitive).
No paid search/APIs.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from openai import OpenAI

# Optional free web libs (present in pyproject)
try:
    from duckduckgo_search import DDGS
except Exception:  # pragma: no cover
    DDGS = None  # type: ignore

try:
    import trafilatura
except Exception:  # pragma: no cover
    trafilatura = None  # type: ignore


ROOT = Path(__file__).resolve().parents[1]
RESULTS_DIR = ROOT / "results" / "daily-briefs"
KB_PATH = ROOT / "docs" / "knowledge-bank" / "evals-specialist.md"
REQUIRED_SECTIONS = [
    "Web Signals",
    "GH / Repo Activity",
    "Harness Placement Notes",
    "Token & Speed",
    "Recommended Actions",
]
MODEL_OBSERVATION_CHARS = 360


def load_evals_specialist_kb() -> str:
    """Simple loader for the specialist knowledge bank (RAG-lite style)."""
    if KB_PATH.exists():
        try:
            return KB_PATH.read_text(encoding="utf-8")
        except Exception as e:
            return f"[KB load error: {e}]"
    return (
        "Evals harness specialist defaults (KB not found on disk): "
        "local OSS only via LM Studio; 4 lanes (research/plan/build/tool-call); "
        "gpu_full vs gpu_offload profiles; qwen/qwen3.5-9b smoke leader preferring offload on 8GB; "
        "use sandboxed tools in suites, real (timeout, safe) tools in host scripts like this; "
        "record tps + usage; baselines imported only; primary judge user review vs baselines."
    )


def compact_specialist_kb(kb: str) -> str:
    """Keep qwen's 4096-token context focused on durable W7 facts."""
    if not kb:
        return ""
    return (
        "Evals Specialist Knowledge Bank (compact): local OSS eval harness only; "
        "automated runs use LM Studio/local models, no direct paid APIs; baselines are imported; "
        "real tracker tools are host-script web_search/fetch/read_file/github with safe timeouts; "
        "suite tool calls stay sandboxed; primary judging is user review vs baselines; "
        "record prompt/completion/total tokens, wall seconds, tps, tool observations, and failure modes; "
        "current qwen Promptfoo evidence is 7/40 on the 40-assertion suite across tested profiles, "
        "with qwen no-cache full-suite throughput still incomplete after a 1200000 ms timeout; "
        "liquid is speed/triage evidence at 5/40 with a completed no-cache cell; "
        "Stream 9 collected W7 baselines, Stream 11 DeepEval W7 passed 4/4 locally, "
        "Stream 12 proved strict qwen model-final/no-fallback behavior but had stale wording, weak web relevance, "
        "and one invalid GitHub JSON-field request; Streams 18/20 added bounded mid-size task/profile slices; "
        "remaining gaps are subjective user review, final 3-solid selection, broad/full matrix, and large practical proof."
    )


def safe_read_file(path: str) -> str:
    """Real fs read for tracker (sandboxed version lives in Promptfoo callbacks)."""
    p = (ROOT / path).resolve()
    try:
        root_res = ROOT.resolve()
        if not str(p).startswith(str(root_res)):
            return "ERROR: path escapes repo root (blocked for safety)"
        # Whitelist key evals surfaces only
        allowed = {"docs", "registry", "suites", "scripts", "results", "baselines"}
        if p.relative_to(root_res).parts[0] not in allowed:
            return "ERROR: path not in allowed evals surfaces"
        if not p.exists() or not p.is_file():
            return "FILE_NOT_FOUND"
        content = p.read_text(encoding="utf-8", errors="replace")
        return content[:1500]  # bound for context
    except Exception as e:
        return f"READ_ERROR: {e}"


def web_search(query: str, max_results: int = 5) -> str:
    """Free web interest search via duckduckgo-search (no key, no paid)."""
    if DDGS is None:
        return "WEB_SEARCH_UNAVAILABLE (duckduckgo-search not importable)"
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return "No web results."
        lines = []
        for r in results:
            title = r.get("title", "")
            href = r.get("href", "")
            body = r.get("body", "")[:200]
            lines.append(f"- {title} | {href}\n  {body}")
        return "\n".join(lines)
    except Exception as e:
        return f"WEB_SEARCH_ERROR: {e}"


def fetch_page(url: str) -> str:
    """Free page fetch + extract via trafilatura."""
    if trafilatura is None:
        return "FETCH_UNAVAILABLE (trafilatura not importable)"
    try:
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return "FETCH_EMPTY"
        text = trafilatura.extract(downloaded, include_comments=False, include_tables=False) or ""
        return text[:2500]
    except Exception as e:
        return f"FETCH_ERROR: {e}"


def github_tool(args: list[str]) -> str:
    """Real github via gh CLI (assumed installed per W7 steering). Public repo only."""
    if not args:
        return "GITHUB_ERROR: no args"
    args = normalize_github_args(args)
    try:
        # Timeout + capture; no shell for safety on Windows
        proc = subprocess.run(
            ["gh"] + args,
            capture_output=True,
            text=True,
            timeout=12,
            cwd=str(ROOT),
        )
        if proc.returncode != 0:
            return f"GITHUB_CLI_ERROR (rc={proc.returncode}): {proc.stderr.strip()[:300]}"
        out = (proc.stdout or proc.stderr or "").strip()
        return out[:2000] if out else "GITHUB_NO_OUTPUT"
    except FileNotFoundError:
        return "GITHUB_UNAVAILABLE (gh CLI not on PATH — install from https://cli.github.com/)"
    except subprocess.TimeoutExpired:
        return "GITHUB_TIMEOUT"
    except Exception as e:
        return f"GITHUB_ERROR: {e}"


def normalize_github_args(args: list[str]) -> list[str]:
    """Map common model-invented gh search forms to valid bounded repo commands."""
    cleaned = [str(a) for a in args if str(a).strip()]
    if not cleaned:
        return ["repo", "view", "JamiStudio/local-evals", "--json", "name,description,updatedAt"]

    if cleaned[:2] == ["repo", "view"]:
        normalized = cleaned[:]
        if len(normalized) < 3 or normalized[2].startswith("-"):
            normalized = ["repo", "view", "JamiStudio/local-evals"] + normalized[2:]
        if normalized[2] != "JamiStudio/local-evals":
            normalized[2] = "JamiStudio/local-evals"
        if "--json" in normalized:
            json_index = normalized.index("--json")
            allowed_fields = {
                "description",
                "stargazerCount",
                "updatedAt",
                "url",
                "name",
                "owner",
                "isPrivate",
                "pushedAt",
                "defaultBranchRef",
            }
            if json_index == len(normalized) - 1 or normalized[json_index + 1].startswith("-"):
                fields = ["name", "description", "stargazerCount", "updatedAt", "url"]
            else:
                requested = [
                    field.strip()
                    for field in normalized[json_index + 1].split(",")
                    if field.strip() in allowed_fields
                ]
                fields = requested or ["name", "description", "stargazerCount", "updatedAt", "url"]
            return normalized[: json_index + 1] + [",".join(fields)]
        return normalized

    # Stream 5 showed qwen may emit: gh search issues:state:open,qwen,local-evals --json
    # That is not a valid gh command. Use a repo-scoped issue list instead.
    if cleaned[0] == "search" and len(cleaned) > 1 and cleaned[1].startswith("issues:"):
        query = cleaned[1].replace("issues:", "").replace(",", " ")
        return [
            "issue",
            "list",
            "--repo",
            "JamiStudio/local-evals",
            "--state",
            "open",
            "--search",
            query,
            "--limit",
            "5",
            "--json",
            "number,title,state,updatedAt,url",
        ]

    if cleaned[:2] == ["search", "issues"]:
        query_terms = [a for a in cleaned[2:] if not a.startswith("-")]
        query = " ".join(query_terms).strip() or "qwen local-evals"
        return [
            "issue",
            "list",
            "--repo",
            "JamiStudio/local-evals",
            "--state",
            "open",
            "--search",
            query,
            "--limit",
            "5",
            "--json",
            "number,title,state,updatedAt,url",
        ]

    if cleaned[0] in {"issue", "pr"} and len(cleaned) > 1 and cleaned[1] == "list" and "--repo" not in cleaned:
        return cleaned[:2] + ["--repo", "JamiStudio/local-evals"] + cleaned[2:]

    if cleaned[:2] == ["repo", "list"] and "--json" in cleaned:
        json_index = cleaned.index("--json")
        if json_index == len(cleaned) - 1 or cleaned[json_index + 1].startswith("-"):
            cleaned = cleaned[: json_index + 1] + ["name,description,updatedAt,url"] + cleaned[json_index + 1 :]

    return cleaned


def section_presence(brief: str) -> list[str]:
    return [section for section in REQUIRED_SECTIONS if f"### {section}" in brief or section in brief]


def tool_failures(steps_log: list[dict[str, Any]]) -> list[str]:
    failures: list[str] = []
    markers = ("ERROR", "TIMEOUT", "UNAVAILABLE", "UNKNOWN", "FILE_NOT_FOUND")
    for step in steps_log:
        preview = str(step.get("observation_preview", ""))
        if any(marker in preview.upper() for marker in markers):
            failures.append(f"{step.get('tool', 'tool')}: {preview[:180]}")
    return failures


def build_fallback_brief(
    *,
    model: str,
    interest_query: str,
    steps_log: list[dict[str, Any]],
    usage: dict[str, Any],
    wall: float,
    tps: float,
    reason: str,
) -> str:
    """Honest deterministic synthesis from recorded tool observations."""
    web_notes: list[str] = []
    gh_notes: list[str] = []
    harness_notes: list[str] = []

    for step in steps_log:
        tool = step.get("tool")
        args = step.get("args", {})
        preview = str(step.get("observation_preview", "")).strip() or "No observation preview recorded."
        if tool == "web_search":
            query = args.get("query", interest_query) if isinstance(args, dict) else interest_query
            web_notes.append(f"- `{query}`: {preview[:320]}")
        elif tool == "github":
            gh_notes.append(f"- `gh {' '.join(normalize_github_args(args.get('args', []))) if isinstance(args, dict) else 'github'}`: {preview[:320]}")
        elif tool == "read_file":
            path = args.get("path", "unknown") if isinstance(args, dict) else "unknown"
            harness_notes.append(f"- `{path}`: {preview[:320]}")

    if not web_notes:
        web_notes.append("- No successful web_search observation was recorded in this bounded run.")
    if not gh_notes:
        gh_notes.append("- No successful GitHub observation was recorded in this bounded run.")
    if not harness_notes:
        harness_notes.append("- No read_file harness observation was recorded in this bounded run.")

    failures = tool_failures(steps_log)
    failure_note = "\n".join(f"- {f}" for f in failures) if failures else "- No tool failures recorded in this artifact."
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return (
        f"## Daily Evals Interest Brief - {today}\n\n"
        "### Web Signals\n"
        + "\n".join(web_notes[:3])
        + "\n\n### GH / Repo Activity\n"
        + "\n".join(gh_notes[:3])
        + "\n\n### Harness Placement Notes\n"
        f"- Fallback synthesis used because `{reason}`; this section is built from recorded tool observations and harness notes, not hidden model output.\n"
        "- qwen/qwen3.5-9b remains the current local W7 candidate from prior smoke evidence: gpu_offload 5/8 (63%) vs qwen full 4/8, with dry specialist controls at tps=38.4.\n"
        "- Stream 5 proved real read_file/web_search/github tool behavior but exposed blank finalization and invalid gh search syntax; Stream 6 repaired those paths.\n"
        + "\n".join(harness_notes[:4])
        + "\n\n### Recommended Actions (plan)\n"
        "1. Treat this artifact as usable W7 real-tool evidence only if `fallback_used=true` is considered acceptable by the orchestrator.\n"
        "2. Keep qwen offload as the daily-brief specialist candidate while collecting a second non-fallback real brief or W7 baseline comparison.\n"
        "3. Continue matrix coverage on qwen/liquid current 40-assertion suite or repair mid-size timeout behavior before another unbounded 12B/GLM attempt.\n"
        "4. Collect W7 baselines and queue user review before promoting qwen daily-brief quality into final 3-solid selection.\n"
        "\n\n### Token & Speed\n"
        f"prompt={usage.get('prompt_tokens', 0)} completion={usage.get('completion_tokens', 0)} "
        f"total={usage.get('total_tokens', 0)} tps={tps} duration_s={round(wall, 2)} "
        f"fallback_used=true model={model}\n\n"
        "Tool failures:\n"
        + failure_note
        + "\n"
    )


def _get_client(model_hint: str | None = None) -> tuple[OpenAI, str]:
    base_url = os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234/v1").rstrip("/")
    api_key = os.getenv("LMSTUDIO_API_KEY", "lm-studio")
    client = OpenAI(base_url=base_url, api_key=api_key)
    model = model_hint or os.getenv("EVAL_SUBJECT_MODEL", "qwen/qwen3.5-9b")
    return client, model


def run_brief_agent(
    client: OpenAI,
    model: str,
    interest_query: str,
    *,
    use_specialist: bool = False,
    max_steps: int = 4,
    dry_run: bool = False,
    strict_final: bool = False,
) -> dict[str, Any]:
    """
    Simple reusable ReAct-style tool-calling agent loop.
    Think (model) → tool call or final → observe → loop.
    Records full trace, usage, wall time, computed tps.
    """
    kb = load_evals_specialist_kb() if use_specialist else ""
    kb_for_prompt = compact_specialist_kb(kb) if use_specialist else ""
    specialist_prefix = (
        "You are an evals-specialist agent. You produce concise, sourced, actionable daily interest briefs "
        "for the local OSS model evaluation harness. Use tools to gather fresh signals. "
        "Respect tool schemas exactly. When you have enough, output ONLY the final brief in the required structure. "
        f"Specialist KB loaded:\n{kb_for_prompt}\n\n"
        if use_specialist
        else "You are a helpful agent for daily briefs on local OSS model evals. Use tools. Final output = the brief only.\n\n"
    )

    system = (
        specialist_prefix
        + "Available tools (call via function calls):\n"
        "- web_search(query: str, max_results?: int)\n"
        "- fetch_page(url: str)\n"
        "- read_file(path: str)  # relative to evals repo root, whitelisted surfaces only\n"
        "- github(args: list[str])  # e.g. ['repo', 'view', 'JamiStudio/local-evals', '--json', 'description,stargazerCount']\n\n"
        "Interest focus: " + interest_query + "\n"
        "Output structure when ready (markdown, exact headings in this order):\n"
        "## Daily Evals Interest Brief — YYYY-MM-DD\n\n"
        "### Web Signals\n...\n\n### GH / Repo Activity\n...\n\n### Harness Placement Notes\n...\n\n"
        "### Token & Speed\nprompt=pending completion=pending tps=pending duration_s=pending\n\n"
        "### Recommended Actions (plan)\n1. ...\n"
        "Write the five section headings first, then fill each section concisely. "
        "Keep Web/GH/Harness to at most 2 bullets each and Recommended Actions to at most 4 numbered items. "
        "Do not postpone Token & Speed until after Recommended Actions; it must appear before the action list even if metrics are pending.\n"
        "Keep tool calls targeted: prefer one repo file read, one web_search, and one valid repo-scoped GitHub query. "
        "Allowed repo file reads include docs/roadmaps/2026-06-07-contained-eval-streams-plan.md, "
        "docs/evals/2026-06-07-strict-gap-audit.md, docs/evals/2026-06-07-user-review-packet.md, "
        "results/optimization-state.json, results/user-review-packet-summary.json, baselines/manifest.json, "
        "registry/models.json, registry/load-profiles.json, and suites/promptfoo/tests/tool-call.yaml. "
        "For GitHub, use only repo-scoped commands such as "
        "['repo','view','JamiStudio/local-evals','--json','name,description,stargazerCount,updatedAt,url']; "
        "do not request file contents through gh repo view JSON fields. "
        "If the user query asks for repo-file evidence, prioritize read_file observations over public web search snippets. "
        "After observations, finalize; do not leave the brief blank. If this is the final step, stop calling tools "
        "and return the complete markdown brief with all five required sections.\n"
    )

    messages: list[dict[str, Any]] = [
        {"role": "system", "content": system},
        {
            "role": "user",
            "content": (
                "Build the daily evals interest brief for this focus. "
                f"Use tools when useful, then return the required brief structure.\n\nFocus: {interest_query}"
            ),
        },
    ]
    steps_log: list[dict[str, Any]] = []
    tools_schema = [
        {
            "type": "function",
            "function": {
                "name": "web_search",
                "description": "Search the web (free) for interest signals.",
                "parameters": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}, "max_results": {"type": "integer"}},
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "fetch_page",
                "description": "Fetch and extract clean text from a URL (trafilatura).",
                "parameters": {"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"]},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "read_file",
                "description": "Read a whitelisted file inside the evals repo.",
                "parameters": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "github",
                "description": "Run gh CLI for repo signals (public JamiStudio/local-evals etc). Pass argv list.",
                "parameters": {
                    "type": "object",
                    "properties": {"args": {"type": "array", "items": {"type": "string"}}},
                    "required": ["args"],
                },
            },
        },
    ]

    started = time.perf_counter()
    final_brief = ""
    usage: dict[str, Any] = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    fallback_used = False
    fallback_reason = ""
    finalization_status = "not_started"

    if dry_run:
        # Full working simulation path (no LM, no network) — used for smoke/dry verif
        final_brief = (
            "## Daily Evals Interest Brief — 2026-06-06 (DRY-RUN)\n\n"
            "### Web Signals\n"
            "- qwen3.5-9b strong on 8GB offload (simulated from knowledge).\n"
            "- Local evals harness progressing on W7 tracker + specialist KB.\n\n"
            "### GH / Repo Activity\n"
            "- JamiStudio/local-evals: transparency repo, recent pushes for O1/W7.\n\n"
            "### Harness Placement Notes\n"
            "qwen/qwen3.5-9b @ gpu_offload preferred for daily supporting role (research/plan/tool). "
            "Use this tracker for briefs. Record tps.\n\n"
            "### Recommended Actions (plan)\n"
            "1. Run tracker --use-specialist after lms load.\n"
            "2. Add more deepeval coverage for briefs quality.\n"
            "3. Collect baselines for new daily-brief-* tasks.\n\n"
            "### Token & Speed (simulated)\n"
            "prompt=142 completion=265 total=407 tps=38.2 duration_s=6.9\n"
        )
        usage = {"prompt_tokens": 142, "completion_tokens": 265, "total_tokens": 407}
        wall = 6.9
        finalization_status = "dry_run"
    else:
        for step in range(1, max_steps + 1):
            if step == max_steps and any("tool" in item for item in steps_log):
                messages.append({
                    "role": "user",
                    "content": (
                        "This is the final allowed step. Do not call another tool. Return the complete final "
                        "markdown brief now. First write these exact headings in order, then fill them concisely: "
                        "Web Signals; GH / Repo Activity; Harness Placement Notes; Token & Speed; Recommended Actions (plan). "
                        "Token & Speed may use pending placeholders because artifact metrics are recorded after completion. "
                        "Do not call another tool and do not omit any heading."
                    ),
                })
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    tools=tools_schema,
                    tool_choice="auto",
                    temperature=0.2,
                    max_tokens=1536,
                )
            except Exception as e:
                final_brief = f"[LM ERROR after {step} steps: {e}]"
                finalization_status = "lm_error"
                break

            msg = resp.choices[0].message
            u = getattr(resp, "usage", None)
            if u:
                usage["prompt_tokens"] += getattr(u, "prompt_tokens", 0) or 0
                usage["completion_tokens"] += getattr(u, "completion_tokens", 0) or 0
                usage["total_tokens"] += getattr(u, "total_tokens", 0) or 0

            if msg.tool_calls:
                messages.append(msg.model_dump() if hasattr(msg, "model_dump") else {"role": "assistant", "tool_calls": msg.tool_calls})
                for tc in msg.tool_calls:
                    name = tc.function.name
                    raw_args = tc.function.arguments or "{}"
                    try:
                        args = json.loads(raw_args)
                    except Exception:
                        args = {}
                    obs = "TOOL_UNKNOWN"
                    if name == "web_search":
                        obs = web_search(args.get("query", interest_query), args.get("max_results", 4))
                    elif name == "fetch_page":
                        obs = fetch_page(args.get("url", ""))
                    elif name == "read_file":
                        obs = safe_read_file(args.get("path", "README.md"))
                    elif name == "github":
                        obs = github_tool(args.get("args", ["repo", "view", "JamiStudio/local-evals", "--json", "name,description,stargazerCount,updatedAt"]))
                    steps_log.append({
                        "step": step,
                        "tool": name,
                        "args": args,
                        "observation_preview": str(obs)[:400],
                    })
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "name": name,
                        "content": str(obs)[:MODEL_OBSERVATION_CHARS],
                    })
            else:
                final_brief = (msg.content or "").strip()
                steps_log.append({"step": step, "final": True})
                finalization_status = "model_final"
                break
        else:
            fallback_reason = "max_steps reached without model finalization"
            finalization_status = "max_steps_without_final"
        wall = time.perf_counter() - started

    comp_tokens = int(usage.get("completion_tokens", 0) or 0)
    tps = round(comp_tokens / max(wall, 0.001), 1) if comp_tokens > 0 else 0.0
    sections_present = section_presence(final_brief)
    if not dry_run and (not final_brief.strip() or len(sections_present) < len(REQUIRED_SECTIONS)):
        if not fallback_reason:
            fallback_reason = "model returned blank or missing required sections"
        if strict_final:
            finalization_status = (
                "strict_blank_or_missing_sections"
                if finalization_status == "model_final"
                else f"strict_{finalization_status}"
            )
        else:
            fallback_used = True
            final_brief = build_fallback_brief(
                model=model,
                interest_query=interest_query,
                steps_log=steps_log,
                usage=usage,
                wall=wall,
                tps=tps,
                reason=fallback_reason,
            )
            sections_present = section_presence(final_brief)
            finalization_status = "fallback_synthesized"

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": model,
        "use_specialist": use_specialist,
        "interest_query": interest_query,
        "dry_run": dry_run,
        "brief": final_brief,
        "steps": steps_log,
        "usage": usage,
        "wall_seconds": round(wall, 2),
        "tps": tps,
        "max_steps": max_steps,
        "kb_loaded": bool(use_specialist and ("Evals Specialist Knowledge Bank" in kb or "evals-specialist" in kb.lower())),
        "strict_final": strict_final,
        "finalization_status": finalization_status,
        "fallback_used": fallback_used,
        "fallback_reason": fallback_reason if fallback_used else "",
        "model_failure_reason": fallback_reason if strict_final and not fallback_used else "",
        "final_brief_nonempty": bool(final_brief.strip()),
        "sections_present": sections_present,
        "tool_failures": tool_failures(steps_log),
        "model_observation_chars": MODEL_OBSERVATION_CHARS,
    }

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = RESULTS_DIR / f"brief-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    out_path.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")

    return {"brief": final_brief, "record_path": str(out_path), "tps": tps, "usage": usage, "wall_s": round(wall, 2)}


def main() -> None:
    parser = argparse.ArgumentParser(description="W7 daily-briefs + interest tracker (real + specialist + tps).")
    parser.add_argument("--model", default=None, help="LM Studio model key (default from EVAL_SUBJECT_MODEL or qwen/qwen3.5-9b)")
    parser.add_argument("--query", default="local OSS model evals qwen3.5-9b interest tracker harness daily brief progress on 8GB", help="Interest query for the brief")
    parser.add_argument("--use-specialist", action="store_true", help="Load evals-specialist KB for specialist mode")
    parser.add_argument("--max-steps", type=int, default=4, help="ReAct max tool/loop steps")
    parser.add_argument("--dry-run", action="store_true", help="Simulate full run (no LM/net calls) — for smoke verification")
    parser.add_argument("--strict-final", action="store_true", help="Disable deterministic fallback synthesis; record model finalization failures as evidence")
    parser.add_argument("--loop", action="store_true", help="Recurring mode (hourly). For test use --max-loops")
    parser.add_argument("--max-loops", type=int, default=1, help="Safety cap for --loop in tests (default 1)")
    args = parser.parse_args()

    client, model = _get_client(args.model)

    if args.loop:
        print(f"[W7 tracker] Starting loop (max {args.max_loops} iterations for safety, 3600s sleep between). Dry={args.dry_run}")
        for i in range(args.max_loops):
            print(f"\n=== Loop iteration {i+1}/{args.max_loops} ===")
            res = run_brief_agent(
                client, model, args.query,
                use_specialist=args.use_specialist,
                max_steps=args.max_steps,
                dry_run=args.dry_run,
                strict_final=args.strict_final,
            )
            print(f"Brief written: {res['record_path']}")
            print(f"TPS: {res['tps']} | wall={res['wall_s']}s | usage={res['usage']}")
            if i < args.max_loops - 1:
                time.sleep(3600)
        return

    # Default: on-demand single execution
    res = run_brief_agent(
        client, model, args.query,
        use_specialist=args.use_specialist,
        max_steps=args.max_steps,
        dry_run=args.dry_run,
        strict_final=args.strict_final,
    )
    print("\n" + "=" * 72)
    print("W7 DAILY BRIEF + INTEREST TRACKER (specialist harness)")
    print("=" * 72)
    print(res["brief"])
    print("\n--- Metrics (token speed recorded) ---")
    print(f"Record: {res['record_path']}")
    print(f"TPS: {res['tps']} (completion tokens / wall seconds)")
    print(f"Usage: {res['usage']}")
    print(f"Wall time: {res['wall_s']}s")
    print(f"Specialist KB: {args.use_specialist}")
    print(f"Dry-run (smoke safe): {args.dry_run}")
    print(f"Strict final (no fallback): {args.strict_final}")


if __name__ == "__main__":
    main()


# =============================================================================
# Windows Task Scheduler example for "hourly-ish" interest tracker (W7 daily-briefs)
# =============================================================================
# Since the user rig can only run one local model on GPU at a time, schedule this
# when the rig is free (or use --dry-run for smoke/safe runs any time).
#
# 1. Create a .bat wrapper (e.g. run-daily-brief.bat next to this script):
#    @echo off
#    cd /d C:\Users\james\projects\evals
#    uv run python scripts\daily-brief-tracker.py --query "daily evals interest scan" --use-specialist --model qwen/qwen3.5-9b >> logs\daily-brief.log 2>&1
#
# 2. schtasks example (run as current user, hourly, only when idle if desired):
#    schtasks /Create /TN "EvalsDailyBrief" /TR "C:\Users\james\projects\evals\run-daily-brief.bat" /SC HOURLY /ST 09:00 /RU %USERNAME%
#
#    To run only when the rig is free / on AC power / etc., add conditions in Task Scheduler GUI
#    or use /IT (interactive) + power settings.
#
# 3. View / delete:
#    schtasks /Query /TN "EvalsDailyBrief"
#    schtasks /Delete /TN "EvalsDailyBrief" /F
#
# The tracker itself supports --loop (internal 3600s sleep) for long-running sessions,
# but Task Scheduler + the .bat is more robust for "set and forget" on Windows.
# Always respect the one-GPU-model-at-a-time rule — do not schedule while another
# model is loaded (check `lms ps` or nvidia-smi in the wrapper if you want extra guardrails).
# =============================================================================

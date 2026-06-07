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
        return content[:3000]  # bound for context
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
) -> dict[str, Any]:
    """
    Simple reusable ReAct-style tool-calling agent loop.
    Think (model) → tool call or final → observe → loop.
    Records full trace, usage, wall time, computed tps.
    """
    kb = load_evals_specialist_kb() if use_specialist else ""
    specialist_prefix = (
        "You are an evals-specialist agent. You produce concise, sourced, actionable daily interest briefs "
        "for the local OSS model evaluation harness. Use tools to gather fresh signals. "
        "Respect tool schemas exactly. When you have enough, output ONLY the final brief in the required structure. "
        f"Specialist KB loaded:\n{kb}\n\n"
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
        "Output structure when ready (markdown):\n"
        "## Daily Evals Interest Brief — YYYY-MM-DD\n\n"
        "### Web Signals\n...\n\n### GH / Repo Activity\n...\n\n### Harness Placement Notes\n...\n\n"
        "### Recommended Actions (plan)\n1. ...\n\n### Token & Speed\nprompt=.. completion=.. tps=.. duration_s=..\n"
    )

    messages: list[dict[str, Any]] = [{"role": "system", "content": system}]
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
    else:
        for step in range(1, max_steps + 1):
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
                        "content": str(obs)[:1800],
                    })
            else:
                final_brief = (msg.content or "").strip()
                steps_log.append({"step": step, "final": True})
                break
        else:
            final_brief = final_brief or "[MAX_STEPS reached without finalize]"
        wall = time.perf_counter() - started

    comp_tokens = int(usage.get("completion_tokens", 0) or 0)
    tps = round(comp_tokens / max(wall, 0.001), 1) if comp_tokens > 0 else 0.0

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
        "kb_loaded": bool(use_specialist and "Evals harness specialist" in kb[:100]),
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


if __name__ == "__main__":
    main()

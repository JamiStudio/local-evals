"""Agent workflow smoke tests — LM Studio only, no paid API judge."""

from __future__ import annotations

import os

import pytest
from openai import OpenAI


def _subject_client() -> OpenAI:
    return OpenAI(
        base_url=os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234/v1"),
        api_key=os.getenv("LMSTUDIO_API_KEY", "lm-studio"),
    )


def _subject_model() -> str:
    return os.getenv("EVAL_SUBJECT_MODEL", "liquid/lfm2.5-1.2b")


@pytest.mark.skipif(
    not os.getenv("LMSTUDIO_BASE_URL"),
    reason="LM Studio base URL not configured",
)
def test_research_lane_returns_substantive_output():
    client = _subject_client()
    query = "Evaluate local OSS models for research summarization on 8GB VRAM."
    response = client.chat.completions.create(
        model=_subject_model(),
        messages=[
            {
                "role": "system",
                "content": "Summarize research findings with risks and next steps.",
            },
            {"role": "user", "content": query},
        ],
        temperature=0.2,
        max_tokens=1024,
    )
    output = response.choices[0].message.content or ""
    assert len(output) > 100
    assert any(token in output.lower() for token in ("vram", "model", "local", "gpu", "research"))
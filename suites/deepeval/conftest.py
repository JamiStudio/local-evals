import os

import pytest
from dotenv import load_dotenv

load_dotenv()


@pytest.fixture(scope="session")
def cloud_judge_model() -> str:
    return os.getenv("EVAL_CLOUD_JUDGE_MODEL", "gpt-4.1-mini")


@pytest.fixture(scope="session")
def lmstudio_base_url() -> str:
    return os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234/v1")
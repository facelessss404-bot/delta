from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv


# Never read the application's backend .env here: it may hold production access.
load_dotenv(Path(__file__).resolve().parents[1] / ".env.test")


def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes"}


@dataclass(frozen=True)
class Settings:
    base_url: str
    api_base_url: str
    database_url: str
    expected_database_name: str
    expected_schema: str
    commander_email: str
    commander_password: str
    admin_email: str
    admin_password: str
    cadet_email: str
    cadet_password: str
    headless: bool
    chrome_binary: str | None

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            base_url=os.getenv("TEST_BASE_URL", "").rstrip("/"),
            api_base_url=os.getenv("TEST_API_BASE_URL", "").rstrip("/"),
            database_url=os.getenv("TEST_DATABASE_URL", ""),
            expected_database_name=os.getenv("TEST_DATABASE_EXPECTED_NAME", ""),
            expected_schema=os.getenv("TEST_DATABASE_EXPECTED_SCHEMA", ""),
            commander_email=os.getenv("TEST_COMMANDER_EMAIL", ""),
            commander_password=os.getenv("TEST_COMMANDER_PASSWORD", ""),
            admin_email=os.getenv("TEST_ADMIN_EMAIL", ""),
            admin_password=os.getenv("TEST_ADMIN_PASSWORD", ""),
            cadet_email=os.getenv("TEST_CADET_EMAIL", ""),
            cadet_password=os.getenv("TEST_CADET_PASSWORD", ""),
            headless=_truthy(os.getenv("HEADLESS")),
            chrome_binary=os.getenv("CHROME_BINARY") or None,
        )

    def safety_problem(self) -> str | None:
        if not self.base_url or not self.api_base_url or not self.database_url:
            return "TEST_BASE_URL, TEST_API_BASE_URL, and TEST_DATABASE_URL are required."
        if not _truthy(os.getenv("TEST_DATABASE_ISOLATED")):
            return "TEST_DATABASE_ISOLATED=true is required before tests can run."
        if not _truthy(os.getenv("TEST_ALLOW_DESTRUCTIVE")):
            return "TEST_ALLOW_DESTRUCTIVE=true is required; the suite creates and cleans up test data."
        database_name = urlparse(self.database_url).path.strip("/").lower()
        if not self.expected_database_name:
            return "TEST_DATABASE_EXPECTED_NAME is required to prove the database target."
        if database_name != self.expected_database_name.lower():
            return "TEST_DATABASE_URL database name does not match TEST_DATABASE_EXPECTED_NAME."
        database_isolated = any(token in database_name for token in ("test", "qa", "sandbox", "e2e"))
        schema_name = self.expected_schema.lower()
        schema_isolated = schema_name != "public" and any(token in schema_name for token in ("test", "qa", "sandbox", "e2e"))
        if not database_isolated and not schema_isolated:
            return "Use an isolated test/qa/sandbox/e2e database name or TEST_DATABASE_EXPECTED_SCHEMA."
        if not self.commander_email or not self.commander_password:
            return "TEST_COMMANDER_EMAIL and TEST_COMMANDER_PASSWORD are required."
        return None

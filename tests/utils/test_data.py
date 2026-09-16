from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4


@dataclass(frozen=True)
class TestData:
    __test__ = False
    run_id: str
    password: str

    @classmethod
    def create(cls) -> "TestData":
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        return cls(run_id=f"AUTO_TEST_{stamp}_{uuid4().hex[:8]}", password="AutoTest!9Pass")

    @property
    def slug(self) -> str:
        return self.run_id.lower()

    @property
    def admin_name(self) -> str:
        return f"{self.run_id} Admin"

    @property
    def admin_email(self) -> str:
        return f"{self.slug}.admin@example.test"

    @property
    def cadet_name(self) -> str:
        return f"{self.run_id} Cadet"

    @property
    def cadet_email(self) -> str:
        return f"{self.slug}.cadet@example.test"

    @property
    def subject_name(self) -> str:
        return f"{self.run_id} Subject"

    @property
    def assessment_title(self) -> str:
        return f"{self.run_id} Assessment"

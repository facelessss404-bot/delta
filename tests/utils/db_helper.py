from __future__ import annotations

from typing import Any

import psycopg
from psycopg.rows import dict_row


class DbHelper:
    """Read/write verification helper for the explicitly isolated test DB only."""

    def __init__(self, database_url: str, schema: str | None = None):
        self.connection = psycopg.connect(database_url, row_factory=dict_row)
        if schema:
            if not schema.replace("_", "").isalnum() or schema[0].isdigit():
                self.connection.close()
                raise ValueError("Test schema must be a simple PostgreSQL identifier")
            self.connection.execute(f"SET search_path TO {schema}")

    def scalar(self, query: str, parameters: tuple[Any, ...] = ()) -> Any:
        with self.connection.cursor() as cursor:
            cursor.execute(query, parameters)
            row = cursor.fetchone()
            return next(iter(row.values())) if row else None

    def one(self, query: str, parameters: tuple[Any, ...] = ()) -> dict[str, Any] | None:
        with self.connection.cursor() as cursor:
            cursor.execute(query, parameters)
            return cursor.fetchone()

    def insert_subject(self, name: str) -> int:
        with self.connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO subjects (name, code, category, active) VALUES (%s, %s, 'academic', true) RETURNING id",
                (name, name[-36:]),
            )
            subject_id = cursor.fetchone()["id"]
        self.connection.commit()
        return subject_id

    def cleanup_run(self, run_id: str) -> None:
        """Delete only records tagged with this exact generated run identifier."""
        with self.connection.cursor() as cursor:
            cursor.execute("DELETE FROM audit_logs WHERE after_data::text LIKE %s OR before_data::text LIKE %s", (f"%{run_id}%", f"%{run_id}%"))
            cursor.execute("DELETE FROM counselling_registrations WHERE additional_notes LIKE %s", (f"%{run_id}%",))
            cursor.execute("DELETE FROM notes WHERE title LIKE %s", (f"{run_id}%",))
            cursor.execute("DELETE FROM notices WHERE title LIKE %s", (f"{run_id}%",))
            cursor.execute("DELETE FROM results WHERE exam_id IN (SELECT id FROM exams WHERE name LIKE %s)", (f"{run_id}%",))
            cursor.execute("DELETE FROM exams WHERE name LIKE %s", (f"{run_id}%",))
            cursor.execute("DELETE FROM attendance_sessions WHERE subject_id IN (SELECT id FROM subjects WHERE name LIKE %s)", (f"{run_id}%",))
            cursor.execute("DELETE FROM assessments WHERE title LIKE %s", (f"{run_id}%",))
            cursor.execute("DELETE FROM leaves WHERE reason LIKE %s", (f"{run_id}%",))
            cursor.execute("DELETE FROM users WHERE email LIKE %s", (f"%{run_id.lower()}%@example.test",))
            cursor.execute("DELETE FROM subjects WHERE name LIKE %s", (f"{run_id}%",))
        self.connection.commit()

    def close(self) -> None:
        self.connection.close()

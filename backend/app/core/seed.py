"""Seed service: populates the database with seed data from seed_data.json."""

import json
from pathlib import Path

from sqlalchemy import text

from app.core.database.session import engine as db_engine
from app.core.utils.responses import success_response

SEED_FILE = Path(__file__).resolve().parent.parent.parent / "seed_data.json"

SEQUENCE_TABLES = [
    "organizations",
    "roles",
    "permissions",
    "users",
    "loads",
    "vehicles",
]

TRUNCATE_ORDER = [
    "user_preferences",
    "loads",
    "vehicles",
    "users",
    "role_permissions",
    "roles",
    "permissions",
    "organizations",
]


class SeedDataService:
    def __init__(self) -> None:
        self._data: dict | None = None

    def _load_data(self) -> dict:
        if self._data is not None:
            return self._data
        if not SEED_FILE.exists():
            raise FileNotFoundError(f"Seed file not found at {SEED_FILE}")
        with open(SEED_FILE, encoding="utf-8") as f:
            self._data = json.load(f)
        return self._data

    def run_seed(self) -> dict:
        data = self._load_data()
        with db_engine.connect() as conn:
            with conn.begin():
                conn.execute(text("SET session_replication_role = 'replica'"))

                truncate_list = ", ".join(f'"{t}"' for t in TRUNCATE_ORDER)
                conn.execute(text(f"TRUNCATE TABLE {truncate_list} RESTART IDENTITY CASCADE"))

                table_counts = {}
                for table in TRUNCATE_ORDER:
                    rows = data.get(table, [])
                    if not rows:
                        table_counts[table] = 0
                        continue

                    columns = list(rows[0].keys())
                    col_list = ", ".join(f'"{c}"' for c in columns)
                    placeholders = ", ".join(f":{c}" for c in columns)

                    for row in rows:
                        prepared = {
                            k: json.dumps(v) if isinstance(v, (dict, list)) else v
                            for k, v in row.items()
                        }
                        stmt = text(f'INSERT INTO "{table}" ({col_list}) VALUES ({placeholders})')
                        conn.execute(stmt, prepared)

                    table_counts[table] = len(rows)

                for table in SEQUENCE_TABLES:
                    if table not in TRUNCATE_ORDER:
                        continue
                    result = conn.execute(text(f'SELECT MAX(id) FROM "{table}"'))
                    max_id = result.scalar()
                    if max_id is not None:
                        conn.execute(text(f"SELECT setval('{table}_id_seq', {max_id})"))

                conn.execute(text("SET session_replication_role = 'origin'"))

            return success_response({
                "tables_seeded": len(table_counts),
                "total_rows": sum(table_counts.values()),
                "details": table_counts,
            })

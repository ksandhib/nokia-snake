"""SQLite storage for high scores (stdlib only, parameterized queries)."""
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "snake.db"


@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect() as c:
        c.execute(
            """CREATE TABLE IF NOT EXISTS high_scores (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   score INTEGER NOT NULL CHECK (score >= 0),
                   created_at TEXT NOT NULL)"""
        )
        c.execute("CREATE INDEX IF NOT EXISTS idx_score ON high_scores(score DESC)")


def add_score(score: int) -> dict:
    """Insert a score; return its row plus its rank among all scores."""
    created = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    with connect() as c:
        cur = c.execute(
            "INSERT INTO high_scores (score, created_at) VALUES (?, ?)", (score, created)
        )
        new_id = cur.lastrowid
        # Earlier entries with an equal score outrank the new one.
        rank = c.execute(
            "SELECT COUNT(*) FROM high_scores WHERE score >= ? AND id != ?", (score, new_id)
        ).fetchone()[0] + 1
    return {"score": score, "created_at": created, "rank": rank, "top10": rank <= 10}


def top_scores(limit: int = 10) -> list[dict]:
    with connect() as c:
        rows = c.execute(
            "SELECT score, created_at FROM high_scores ORDER BY score DESC, id ASC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]

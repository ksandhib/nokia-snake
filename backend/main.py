"""Nokia Snake - FastAPI app. Serves the frontend and the high-score API."""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from . import database
from .models import ScoreIn, ScoreOut, ScoreResult

FRONTEND = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(_: FastAPI):
    database.init_db()
    yield


# Docs/OpenAPI disabled: nothing unnecessary is exposed. Same-origin, so no CORS.
app = FastAPI(title="Nokia Snake", docs_url=None, redoc_url=None,
              openapi_url=None, lifespan=lifespan)


@app.middleware("http")
async def security_headers(request, call_next):
    resp = await call_next(request)
    resp.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:"
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Cache-Control"] = "no-cache"
    return resp


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/highscores", response_model=list[ScoreOut])
def get_scores():
    return database.top_scores(10)


@app.post("/api/highscores", response_model=ScoreResult, status_code=201)
def post_score(body: ScoreIn):
    return database.add_score(body.score)


# Mounted last so /api/* routes win.
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")

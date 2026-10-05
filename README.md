# Nokia Snake - Classic 1997

A monochrome-LCD Nokia Snake clone. Runs 100% locally: Python + FastAPI + SQLite on the back, HTML/CSS/JS canvas on the front. No cloud, no external APIs, no internet after installation.

## Features
- Menu, game, pause, game over, high scores, how to play, settings (state machine)
- Keyboard-first controls, optional touch D-pad on touch devices
- No instant reversal, buffered turns, exact tail-aware self-collision
- +10 per apple, level up every 5 apples, speed increases per level (capped)
- Top-10 high scores in SQLite, validated server-side
- Retro beeps synthesized with WebAudio (no audio files needed; toggle in Settings)
- Settings in localStorage: sound, game speed, grid size (15/20/25), reduced motion
- Accessible UI: focus states, ARIA labels, reduced-motion support

## Technology Stack
Python 3.9+, FastAPI, Uvicorn, SQLite (`sqlite3` stdlib), HTML5 Canvas, CSS3, vanilla JS (ES modules).

## Project Structure
```text
nokia-snake/
  backend/   main.py (routes), database.py (SQLite), models.py (validation)
  frontend/  index.html, css/style.css, js/{app,game,input,api,sound}.js, assets/
  data/      snake.db (created on first run)
  requirements.txt  README.md  start.bat  .gitignore
```

## Installation
Install Python 3.9+ (tick "Add Python to PATH"). The first run needs internet once, to download `fastapi` and `uvicorn`.

## Running the Application
**Easy way:** double-click `start.bat`. It checks Python, creates `.venv` if missing, installs requirements once, starts the server, and opens http://localhost:8000. Close the console window to stop.

**Manual:**
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```
Run these from the `nokia-snake` folder. (macOS/Linux: `source .venv/bin/activate`.)

## Keyboard Controls
| Key | Action |
|---|---|
| Arrow keys (or WASD) | Move / navigate menus |
| P | Pause / resume |
| R | Restart |
| ENTER | Start / select / play again |
| ESC | Back to menu |

## Game Rules
Eat apples to grow (+10 each). Hitting a wall or your own body ends the game. Every 5 apples raises the level and speed. Filling the whole board also ends the game.

## API Documentation
| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | `{"status":"ok"}` |
| GET | `/api/highscores` | Top 10: `[{"score":520,"created_at":"2026-10-03"}]` |
| POST | `/api/highscores` | Body `{"score":120}`; integer, multiple of 10, 10-10000, no extra fields. Returns `{score, created_at, rank, top10}` (201). Invalid input returns 422. |

## Database
`data/snake.db`, table `high_scores(id, score, created_at)`. Created automatically. Delete the file to reset scores. All queries are parameterized.

## Troubleshooting
- **"Python was not found"**: reinstall Python with "Add Python to PATH".
- **Port 8000 busy**: change `--port 8000` in `start.bat`.
- **Scores not saving / HUD shows 0**: confirm the server console is open and `/api/health` responds.
- **No sound**: check Settings, and click once in the page (browsers block audio before a gesture).
- **Page looks stale**: hard refresh with Ctrl+F5.

## Future Improvements
Player initials, swipe controls, wall-wrap mode, obstacles, bonus food, real WAV assets in `frontend/assets/`.

## License
MIT

@echo off
setlocal
cd /d "%~dp0"
title Nokia Snake

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python 3.9+ from https://www.python.org
  echo and tick "Add Python to PATH" during setup.
  pause & exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo Creating virtual environment...
  python -m venv .venv || (echo Could not create .venv & pause & exit /b 1)
)

call ".venv\Scripts\activate.bat"

if not exist ".venv\.deps_installed" (
  echo Installing requirements...
  python -m pip install -r requirements.txt || (echo Install failed - internet is needed for first setup only. & pause & exit /b 1)
  echo ok> ".venv\.deps_installed"
)

echo Starting Nokia Snake at http://localhost:8000  (close this window to stop)
start "" /b cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8000"
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
pause

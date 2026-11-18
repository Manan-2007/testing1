@echo off
setlocal
rem Start Parlance and open it in your default browser.
rem
rem   start.bat
rem
rem Optional: also start the sign recognition service (the VOX backend):
rem   set VOX_DIR=C:\path\to\vox
rem   start.bat

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is required ^(version 20 or newer^): https://nodejs.org
  pause
  exit /b 1
)

if not "%VOX_DIR%"=="" (
  if exist "%VOX_DIR%\venv\Scripts\activate.bat" (
    echo Starting the recognition service from %VOX_DIR% on port 8000...
    start "Parlance recognition service" /D "%VOX_DIR%" cmd /k "call venv\Scripts\activate.bat && uvicorn backend.main:app --host 127.0.0.1 --port 8000"
  ) else (
    echo VOX_DIR is set but no venv was found there; skipping the recognition service.
  )
)

cd /d "%~dp0frontend"

if not exist node_modules (
  echo Installing dependencies ^(first run only^)...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

echo Starting Parlance. Your browser will open automatically; press Ctrl+C to stop.
call npm run dev -- --open

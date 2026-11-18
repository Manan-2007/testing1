#!/usr/bin/env bash
# Start Parlance and open it in your default browser.
#
#   ./start.sh
#
# Optional: also start the sign recognition service (the VOX backend) by
# pointing VOX_DIR at the VOX project folder:
#
#   VOX_DIR="/path/to/vox" ./start.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND_PID=""

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is required (version 20 or newer): https://nodejs.org" >&2
  exit 1
fi

cleanup() {
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Stopping the recognition service…"
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if [ -n "${VOX_DIR:-}" ]; then
  if [ -f "$VOX_DIR/venv/bin/activate" ] && [ -f "$VOX_DIR/backend/main.py" ]; then
    echo "Starting the recognition service from $VOX_DIR on port 8000…"
    (
      cd "$VOX_DIR"
      # shellcheck disable=SC1091
      source venv/bin/activate
      exec uvicorn backend.main:app --host 127.0.0.1 --port 8000
    ) &
    BACKEND_PID=$!
  else
    echo "VOX_DIR is set but no venv/backend was found there; skipping the recognition service." >&2
  fi
fi

cd "$FRONTEND"
if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run only)…"
  npm install
fi

echo "Starting Parlance. Your browser will open automatically; press Ctrl+C to stop."
npm run dev -- --open

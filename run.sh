#!/usr/bin/env bash
set -euo pipefail

export PORT=5000

npm run worker:loop &
WORKER_PID=$!

cleanup() {
  kill "$WORKER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

npm start

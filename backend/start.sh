#!/usr/bin/env sh
set -e

PORT_TO_BIND="${PORT:-8000}"
WORKERS="${WEB_CONCURRENCY:-4}"

exec gunicorn main:app \
  -w "$WORKERS" \
  -k uvicorn.workers.UvicornWorker \
  -b 0.0.0.0:"$PORT_TO_BIND"
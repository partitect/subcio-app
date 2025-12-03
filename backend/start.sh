#!/bin/sh
set -e

PORT_TO_BIND="${PORT:-8000}"
# Use fewer workers to save memory (each worker loads the ML model separately)
WORKERS="${WEB_CONCURRENCY:-2}"

echo "Starting gunicorn on port $PORT_TO_BIND with $WORKERS workers..."

exec gunicorn main:app \
  -w "$WORKERS" \
  -k uvicorn.workers.UvicornWorker \
  -b "0.0.0.0:$PORT_TO_BIND" \
  --timeout 300
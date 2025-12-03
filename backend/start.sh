#!/bin/sh
set -e

PORT_TO_BIND="${PORT:-8000}"
WORKERS="${WEB_CONCURRENCY:-4}"

echo "Starting gunicorn on port $PORT_TO_BIND with $WORKERS workers..."

exec gunicorn main:app \
  -w "$WORKERS" \
  -k uvicorn.workers.UvicornWorker \
  -b "0.0.0.0:$PORT_TO_BIND"
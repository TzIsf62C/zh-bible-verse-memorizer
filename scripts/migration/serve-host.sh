#!/usr/bin/env bash
set -euo pipefail

HOST_DIR="${1:-/tmp/zbvm-migration-host}"
PORT="${2:-8000}"

if [[ ! -d "$HOST_DIR" ]]; then
  echo "Host directory not found: $HOST_DIR"
  echo "Run one of:"
  echo "  npm run migration:stage:legacy"
  echo "  npm run migration:stage:refactor"
  exit 1
fi

if [[ -n "$(ls -A "$HOST_DIR")" ]]; then
  echo "Serving migration host from: $HOST_DIR"
else
  echo "Host directory is empty: $HOST_DIR"
  echo "Stage files first before serving."
  exit 1
fi

echo "Origin: http://localhost:$PORT"
if [[ -n "${CODESPACE_NAME:-}" && -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]]; then
  echo "Codespaces URL: https://${CODESPACE_NAME}-${PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/"
  echo "If this shows 404, open the Ports panel and ensure port ${PORT} is forwarded and visible to your browser session."
fi
cd "$HOST_DIR"
python3 -m http.server "$PORT" --bind 0.0.0.0

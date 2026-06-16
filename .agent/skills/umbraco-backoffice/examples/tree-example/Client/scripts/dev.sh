#!/bin/bash
# Development server helper script
# Usage: ./scripts/dev.sh [mode]
#   mode: mock-repo | msw | real (default: real)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env if it exists
if [ -f "$CLIENT_DIR/.env" ]; then
  export $(grep -v '^#' "$CLIENT_DIR/.env" | xargs)
fi

# Check required env var
if [ -z "$UMBRACO_CLIENT_PATH" ]; then
  echo "Error: UMBRACO_CLIENT_PATH is not set"
  echo "Create a .env file from .env.example and set UMBRACO_CLIENT_PATH"
  exit 1
fi

if [ ! -d "$UMBRACO_CLIENT_PATH" ]; then
  echo "Error: UMBRACO_CLIENT_PATH does not exist: $UMBRACO_CLIENT_PATH"
  exit 1
fi

MODE="${1:-real}"

echo "Starting dev server in '$MODE' mode..."
echo "Extension path: $CLIENT_DIR"
echo "Umbraco client: $UMBRACO_CLIENT_PATH"
echo ""

case "$MODE" in
  mock-repo)
    echo "Mode: Mock Repository (in-memory data, no API calls)"
    cd "$UMBRACO_CLIENT_PATH"
    VITE_EXAMPLE_PATH="$CLIENT_DIR" \
    VITE_USE_MOCK_REPO=true \
    npm run dev
    ;;
  msw)
    echo "Mode: MSW (network interception)"
    cd "$UMBRACO_CLIENT_PATH"
    VITE_EXAMPLE_PATH="$CLIENT_DIR" \
    VITE_UMBRACO_USE_MSW=on \
    npm run dev
    ;;
  real)
    echo "Mode: Real (extension only, connect to real Umbraco)"
    cd "$UMBRACO_CLIENT_PATH"
    VITE_EXAMPLE_PATH="$CLIENT_DIR" \
    npm run dev
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: ./scripts/dev.sh [mock-repo|msw|real]"
    exit 1
    ;;
esac

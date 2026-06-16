#!/bin/bash
# Test runner helper script
# Usage: ./scripts/test.sh [suite]
#   suite: mock-repo | msw | e2e | all (default: all)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env if it exists
if [ -f "$CLIENT_DIR/.env" ]; then
  export $(grep -v '^#' "$CLIENT_DIR/.env" | xargs)
fi

# Check required env var for mock-repo and msw tests
check_umbraco_path() {
  if [ -z "$UMBRACO_CLIENT_PATH" ]; then
    echo "Error: UMBRACO_CLIENT_PATH is not set"
    echo "Create a .env file from .env.example and set UMBRACO_CLIENT_PATH"
    exit 1
  fi
  if [ ! -d "$UMBRACO_CLIENT_PATH" ]; then
    echo "Error: UMBRACO_CLIENT_PATH does not exist: $UMBRACO_CLIENT_PATH"
    exit 1
  fi
}

# Check E2E requirements
check_e2e_config() {
  if [ -z "$URL" ] || [ -z "$UMBRACO_USER_LOGIN" ] || [ -z "$UMBRACO_USER_PASSWORD" ]; then
    echo "Error: E2E tests require URL, UMBRACO_USER_LOGIN, and UMBRACO_USER_PASSWORD"
    echo "Set these in your .env file"
    exit 1
  fi
}

cd "$CLIENT_DIR"

SUITE="${1:-all}"

case "$SUITE" in
  mock-repo)
    check_umbraco_path
    echo "Running mock-repo tests..."
    npm run test:mock-repo
    ;;
  msw)
    check_umbraco_path
    echo "Running MSW tests..."
    npm run test:msw
    ;;
  e2e)
    check_e2e_config
    echo "Running E2E tests..."
    npm run test:e2e
    ;;
  all)
    check_umbraco_path
    echo "Running all tests..."
    echo ""
    echo "=== Mock Repository Tests ==="
    npm run test:mock-repo
    echo ""
    echo "=== MSW Tests ==="
    npm run test:msw
    echo ""
    echo "=== E2E Tests ==="
    check_e2e_config
    npm run test:e2e
    ;;
  *)
    echo "Unknown suite: $SUITE"
    echo "Usage: ./scripts/test.sh [mock-repo|msw|e2e|all]"
    exit 1
    ;;
esac

echo ""
echo "Done!"

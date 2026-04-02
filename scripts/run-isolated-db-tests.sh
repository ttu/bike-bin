#!/usr/bin/env bash
# Run RLS and/or E2E tests from a disposable git worktree so local Supabase
# uses a separate Docker Compose project (isolated DB volumes) from your main clone.
#
# Usage (from repo root):
#   bash scripts/run-isolated-db-tests.sh [--dry-run] [rls|e2e|both]
#
# Picks the first free API port (PostgREST/Kong) such that the full Supabase local host
# layout is free: shadow, db, studio, inbucket (Mailpit), analytics, edge inspector — all
# shifted by (apiPort - 54321). Override with BIKE_BIN_ISOLATED_API_PORT (default 55421) or
# legacy BIKE_BIN_ISOLATED_PORT_BASE (shadow port; api = base + 1). Patches supabase/config.toml,
# then after `supabase start` merges `supabase status -o env` into .env.local (URL +
# PUBLISHABLE_KEY or ANON_KEY) and sources exports for BIKE_BIN_TEST_* / EXPO_PUBLIC_*.
#
# Requires: Docker, git, Supabase CLI on PATH, Node/npm.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

DRY_RUN=0
MODE="rls"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    rls) MODE="rls" ;;
    e2e) MODE="e2e" ;;
    both) MODE="both" ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: $0 [--dry-run] [rls|e2e|both]" >&2
      exit 1
      ;;
  esac
done

STAMP="$(date +%s)-$$"
BRANCH="chore/isolated-db-test-${STAMP}"
WT="${ROOT}/.worktrees/db-isolated-${STAMP}"

port_in_use() {
  local port="$1"
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" 2>/dev/null
  else
    (echo >/dev/tcp/127.0.0.1/"$port") 2>/dev/null
  fi
}

# Default Supabase CLI host map (see scripts/patch-supabase-ports.mjs): api=54321, shadow=54320,
# db=54322, studio=54323, inbucket=54324, analytics=54327, inspector=8083; pooler=54329 if enabled.
find_isolated_api_port() {
  local start="${BIKE_BIN_ISOLATED_API_PORT:-}"
  if [[ -z "$start" && -n "${BIKE_BIN_ISOLATED_PORT_BASE:-}" ]]; then
    start="$((BIKE_BIN_ISOLATED_PORT_BASE + 1))"
  fi
  [[ -z "$start" ]] && start=55421

  local api="$start"
  local max=56000
  while (( api < max )); do
    local d=$((api - 54321))
    local shadow=$((54320 + d))
    local db=$((54322 + d))
    local studio=$((54323 + d))
    local inb=$((54324 + d))
    local analytics=$((54327 + d))
    local pooler=$((54329 + d))
    local inspector=$((8083 + d))
    if ! port_in_use "$shadow" && ! port_in_use "$api" && ! port_in_use "$db" &&
      ! port_in_use "$studio" && ! port_in_use "$inb" && ! port_in_use "$analytics" &&
      ! port_in_use "$pooler" && ! port_in_use "$inspector"; then
      echo "$api"
      return 0
    fi
    api=$((api + 1))
  done
  echo "No free Supabase host port set up to $max; free ports or set BIKE_BIN_ISOLATED_API_PORT" >&2
  return 1
}

CLEANUP_RAN=0
cleanup() {
  (( CLEANUP_RAN )) && return 0
  CLEANUP_RAN=1
  local exit_code=$?
  if [[ -n "${WT:-}" && -d "$WT" ]]; then
    echo "Stopping Supabase in worktree..."
    (cd "$WT" && supabase stop --no-backup 2>/dev/null) || true
    echo "Removing worktree..."
    git worktree remove --force "$WT" 2>/dev/null || true
    if [[ -n "${BRANCH:-}" ]]; then
      git branch -D "$BRANCH" 2>/dev/null || true
    fi
  fi
  exit "$exit_code"
}

if [[ "$DRY_RUN" -eq 1 ]]; then
  if api_p="$(find_isolated_api_port)"; then
    echo "Dry run: worktree $WT branch $BRANCH mode=$MODE"
    echo "  Supabase host ports (delta $((api_p - 54321)) from defaults): api=$api_p shadow=$((api_p - 1)) db=$((api_p + 1)) studio=$((api_p + 2)) inbucket=$((api_p + 3)) analytics=$((api_p + 6)) pooler=$((api_p + 8)) inspector=$((8083 + api_p - 54321))"
  else
    echo "Dry run: worktree $WT branch $BRANCH mode=$MODE (no free port set found)"
    exit 1
  fi
  exit 0
fi

trap cleanup EXIT INT TERM

mkdir -p "${ROOT}/.worktrees"
echo "Creating worktree at $WT (branch $BRANCH)..."
git worktree add -b "$BRANCH" "$WT" HEAD

if [[ -f "${ROOT}/.env.local" ]]; then
  cp "${ROOT}/.env.local" "${WT}/.env.local"
elif [[ -f "${ROOT}/.env" ]]; then
  cp "${ROOT}/.env" "${WT}/.env.local"
else
  touch "${WT}/.env.local"
  echo "Warning: no .env.local or .env in repo root — empty .env.local; merge-supabase will fill URL + keys after start." >&2
fi

API_PORT="$(find_isolated_api_port)"
SHADOW_PORT="$((API_PORT - 1))"
DB_PORT="$((API_PORT + 1))"
STUDIO_PORT="$((API_PORT + 2))"
INBUCKET_PORT="$((API_PORT + 3))"
ANALYTICS_PORT="$((API_PORT + 6))"
INSPECTOR_PORT="$((8083 + API_PORT - 54321))"

echo "Using Supabase host ports: api=$API_PORT shadow=$SHADOW_PORT db=$DB_PORT studio=$STUDIO_PORT inbucket=$INBUCKET_PORT analytics=$ANALYTICS_PORT inspector=$INSPECTOR_PORT"

node "${ROOT}/scripts/patch-supabase-ports.mjs" "${WT}/supabase/config.toml" "$API_PORT"

PG_URL="postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres"

cd "$WT"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "Starting Supabase (isolated Docker project for this worktree path)..."
# Fresh worktree path → new Compose project/volumes; `supabase start` already runs
# migrations and seed.sql. Skip `db reset` to avoid an extra recreate/restart cycle
# (can 502 Kong/gateway right after start).
supabase start

echo "Syncing EXPO_PUBLIC_* and test env from supabase status..."
node "${ROOT}/scripts/merge-supabase-status-into-env-local.mjs" "$WT" "$PG_URL"
# shellcheck source=/dev/null
source "${WT}/.bike-bin-isolated-exports.sh"

run_rls() {
  echo "Running RLS tests..."
  npm run test:rls
}

run_e2e() {
  local pw="${BIKE_BIN_ISOLATED_PLAYWRIGHT_PORT:-8091}"
  echo "Running E2E tests (isolated: port ${pw}, PLAYWRIGHT_ISOLATED=1, fresh Metro in this worktree)..."
  # Prefix env so npm/npx definitely forwards vars (export alone can be flaky in some shells/wrappers).
  env PLAYWRIGHT_ISOLATED=1 \
    PLAYWRIGHT_WEB_PORT="${pw}" \
    RCT_METRO_PORT="${pw}" \
    BIKE_BIN_TEST_PG_URL="${BIKE_BIN_TEST_PG_URL}" \
    BIKE_BIN_TEST_SUPABASE_URL="${BIKE_BIN_TEST_SUPABASE_URL}" \
    EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL}" \
    EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
    npm run test:e2e
}

case "$MODE" in
  rls) run_rls ;;
  e2e) run_e2e ;;
  both)
    run_rls
    run_e2e
    ;;
esac

echo "Tests finished; cleaning up worktree and Supabase..."

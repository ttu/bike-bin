#!/usr/bin/env bash
# Apply supabase/seed.sql to a linked hosted Supabase project (staging or preview branch).
# `npm run db:seed:remote` runs `seed-remote-images.mjs` unconditionally after this script; that step uploads seed images when
# SUPABASE_SERVICE_ROLE_KEY is set (required for uploads in CI). On GitHub Actions without the key it exits with an error
# and blocks the chain; locally without the key it logs and exits successfully so the chain continues. The key is required
# for image uploads in CI but optional locally.
# Used by CI and locally: PROJECT_REF=xxx SUPABASE_ACCESS_TOKEN=... SUPABASE_DB_PASSWORD=... [SUPABASE_SERVICE_ROLE_KEY=...] npm run db:seed:remote
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ -z "${PROJECT_REF:-}" ]]; then
  echo "seed-remote-sql.sh: PROJECT_REF is required (Supabase project ref)" >&2
  exit 1
fi
if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "seed-remote-sql.sh: SUPABASE_ACCESS_TOKEN is required" >&2
  exit 1
fi
if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "seed-remote-sql.sh: SUPABASE_DB_PASSWORD is required for supabase link to hosted Postgres" >&2
  exit 1
fi
SEED_FILE="$ROOT/supabase/seed.sql"
if [[ ! -f "$SEED_FILE" ]]; then
  echo "seed-remote-sql.sh: seed file not found: supabase/seed.sql (expected at $SEED_FILE)" >&2
  exit 1
fi
supabase link --project-ref "$PROJECT_REF" --yes
supabase db query --linked -f supabase/seed.sql

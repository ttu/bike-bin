#!/usr/bin/env bash
# Seed the App Store / Play Store review account against the database in
# $SUPABASE_DB_URL. Idempotent — safe to re-run to refresh the password
# and sample data.
#
# Required env:
#   SUPABASE_DB_URL      Postgres connection string (e.g. the pooler URL for prod)
#   APPREVIEW_PASSWORD   Password to set on appreview@bikebin.app

set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "ERROR: SUPABASE_DB_URL is not set." >&2
  echo "       Set it to the Postgres connection string for the target environment." >&2
  exit 1
fi

if [[ -z "${APPREVIEW_PASSWORD:-}" ]]; then
  echo "ERROR: APPREVIEW_PASSWORD is not set." >&2
  echo "       Set it to the password to provision for appreview@bikebin.app." >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
SQL_FILE="$SCRIPT_DIR/../supabase/seed-appreview.sql"

echo "Seeding appreview@bikebin.app against $(echo "$SUPABASE_DB_URL" | sed -E 's|(postgres(ql)?://)[^@]*@|\1***@|')"
psql "$SUPABASE_DB_URL" -v appreview_password="$APPREVIEW_PASSWORD" -f "$SQL_FILE"
echo "Done."

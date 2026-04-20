import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { FullConfig } from '@playwright/test';

import { loadBikeBinTestEnvFromEnvLocal } from './load-test-env-from-env-local';

const DEFAULT_PG_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

/** Default local Supabase API URL (see `supabase status`). */
const DEFAULT_SUPABASE_URL = 'http://127.0.0.1:54321';

/** Same default service role JWT as local `supabase start` (dev only). */
const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

function resolvePsqlExecutable(): string {
  const common = ['/opt/homebrew/bin/psql', '/usr/local/bin/psql'];
  for (const p of common) {
    if (existsSync(p)) return p;
  }
  try {
    const w = execFileSync('which', ['psql'], { encoding: 'utf8' }).trim();
    if (w.length > 0) return w;
  } catch {
    // fall through
  }
  throw new Error(
    'psql not found. Install a PostgreSQL client (e.g. brew install libpq) and ensure psql is on PATH.',
  );
}

function resolveDbUrl(projectRoot: string): string {
  loadBikeBinTestEnvFromEnvLocal(process.cwd());
  loadBikeBinTestEnvFromEnvLocal(projectRoot);
  return process.env.BIKE_BIN_TEST_PG_URL ?? DEFAULT_PG_URL;
}

/**
 * Re-seed the local Supabase database before each E2E test run
 * so that tests always start with known, clean data.
 *
 * Instead of `supabase db reset` (which drops schema, re-runs all migrations,
 * and restarts containers), this truncates user-data tables and re-runs
 * seed.sql. It's fast (~1s), avoids container restarts, and doesn't disrupt
 * a running dev instance.
 *
 * After SQL seed, runs `scripts/seed-images.mjs` so `item-photos` storage and
 * `item_photos` / `bike_photos` rows exist (same as `npm run db:seed` after SQL).
 */
export default function globalSetup(config: FullConfig) {
  const projectRoot =
    config.configFile !== undefined && config.configFile.length > 0
      ? dirname(config.configFile)
      : process.cwd();

  // Skip local DB seeding when running against a remote deployment.
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? '';
  if (baseURL.length > 0) {
    let isLocal = false;
    try {
      const { hostname } = new URL(baseURL);
      isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
    } catch {
      // Unparseable URL — treat as remote to be safe
    }
    if (!isLocal) return;
  }

  const dbUrl = resolveDbUrl(projectRoot);
  const psqlPath = resolvePsqlExecutable();
  const env = { ...process.env, PGPASSWORD: 'postgres' };

  const psql = (sql: string) =>
    execFileSync(psqlPath, [dbUrl, '-c', sql], {
      cwd: projectRoot,
      stdio: 'inherit',
      timeout: 15_000,
      env,
    });

  // Truncate all user-data tables (CASCADE handles FK order)
  psql(`
    TRUNCATE
      notifications,
      ratings,
      borrow_requests,
      messages,
      conversation_participants,
      conversations,
      item_photos,
      bike_photos,
      item_groups,
      items,
      bikes,
      group_members,
      groups,
      saved_locations,
      reports,
      support_requests,
      profiles
    CASCADE;
  `);

  // Re-run seed.sql via -f flag (avoids argument length limits)
  const seedPath = resolve(projectRoot, 'supabase', 'seed.sql');
  execFileSync(psqlPath, [dbUrl, '-f', seedPath], {
    cwd: projectRoot,
    stdio: 'inherit',
    timeout: 60_000,
    env,
  });

  loadBikeBinTestEnvFromEnvLocal(process.cwd());
  loadBikeBinTestEnvFromEnvLocal(projectRoot);

  const supabaseUrl =
    process.env.BIKE_BIN_TEST_SUPABASE_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    DEFAULT_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? DEFAULT_SUPABASE_SERVICE_ROLE_KEY;

  const seedImagesScript = resolve(projectRoot, 'scripts', 'seed-images.mjs');
  execFileSync(process.execPath, [seedImagesScript], {
    cwd: projectRoot,
    stdio: 'inherit',
    timeout: 120_000,
    env: {
      ...process.env,
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    },
  });
}

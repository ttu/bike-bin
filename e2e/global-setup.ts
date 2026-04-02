import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { FullConfig } from '@playwright/test';

import { loadBikeBinTestEnvFromEnvLocal } from './load-test-env-from-env-local';

const DEFAULT_PG_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

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
 */
export default function globalSetup(config: FullConfig) {
  const projectRoot =
    config.configFile !== undefined && config.configFile.length > 0
      ? dirname(config.configFile)
      : process.cwd();
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
}

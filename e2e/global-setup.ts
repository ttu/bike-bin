import { execFileSync, execSync } from 'child_process';
import { resolve } from 'path';

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const PSQL = execSync('which psql', { encoding: 'utf-8' }).trim();

/**
 * Re-seed the local Supabase database before each E2E test run
 * so that tests always start with known, clean data.
 *
 * Instead of `supabase db reset` (which drops schema, re-runs all migrations,
 * and restarts containers), this truncates user-data tables and re-runs
 * seed.sql. It's fast (~1s), avoids container restarts, and doesn't disrupt
 * a running dev instance.
 */
export default function globalSetup() {
  const env = { ...process.env, PGPASSWORD: 'postgres' };

  const psql = (sql: string) =>
    execFileSync(PSQL, [DB_URL, '-c', sql], {
      cwd: process.cwd(),
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
  const seedPath = resolve(process.cwd(), 'supabase', 'seed.sql');
  execFileSync(PSQL, [DB_URL, '-f', seedPath], {
    cwd: process.cwd(),
    stdio: 'inherit',
    timeout: 15_000,
    env,
  });
}

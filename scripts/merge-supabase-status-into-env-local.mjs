#!/usr/bin/env node
/**
 * After `supabase start`, sync API URL and anon/publishable key from
 * `supabase status -o env` into .env.local, and write a small shell file to export
 * test-related variables (sourced by run-isolated-db-tests.sh).
 *
 * Usage: node scripts/merge-supabase-status-into-env-local.mjs <worktreeRoot> <bikeBinTestPgUrl>
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , worktreeRoot, bikeBinTestPgUrl] = process.argv;

if (!worktreeRoot || !bikeBinTestPgUrl) {
  console.error(
    'Usage: node scripts/merge-supabase-status-into-env-local.mjs <worktreeRoot> <bikeBinTestPgUrl>',
  );
  process.exit(1);
}

const envLocalPath = join(worktreeRoot, '.env.local');
const exportsPath = join(worktreeRoot, '.bike-bin-isolated-exports.sh');

/** Safe single-quoted literal for POSIX sh. */
function shellSingleQuote(value) {
  return `'${String(value).replaceAll("'", `'\\''`)}'`;
}

let statusOut;
try {
  statusOut = execFileSync('supabase', ['status', '-o', 'env'], {
    cwd: worktreeRoot,
    encoding: 'utf8',
  });
} catch (e) {
  console.error('merge-supabase-status-into-env-local: supabase status -o env failed');
  console.error(e);
  process.exit(1);
}

/** @type {Record<string, string>} */
const fromStatus = {};
for (const line of statusOut.trim().split('\n')) {
  const eq = line.indexOf('=');
  if (eq === -1) continue;
  fromStatus[line.slice(0, eq)] = line.slice(eq + 1);
}

const apiUrl = fromStatus.API_URL;
const anonForExpo =
  fromStatus.PUBLISHABLE_KEY || fromStatus.ANON_KEY || fromStatus.SUPABASE_ANON_KEY;

let dotenv = '';
try {
  dotenv = readFileSync(envLocalPath, 'utf8');
} catch (_) {
  dotenv = '';
}

/**
 * @param {string} content
 * @param {string} key
 * @param {string} value
 */
function upsertLine(content, key, value) {
  if (!value) return content;
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=`, 'm').test(content)) {
    return content.replace(new RegExp(`^${key}=.*$`, 'm'), line);
  }
  const trimmed = content.trimEnd();
  return trimmed ? `${trimmed}\n${line}\n` : `${line}\n`;
}

const pgUrl = fromStatus.DB_URL || bikeBinTestPgUrl;

if (apiUrl) {
  dotenv = upsertLine(dotenv, 'EXPO_PUBLIC_SUPABASE_URL', apiUrl);
}
if (anonForExpo) {
  dotenv = upsertLine(dotenv, 'EXPO_PUBLIC_SUPABASE_ANON_KEY', anonForExpo);
}
if (apiUrl) {
  dotenv = upsertLine(dotenv, 'BIKE_BIN_TEST_SUPABASE_URL', apiUrl);
}
if (pgUrl) {
  dotenv = upsertLine(dotenv, 'BIKE_BIN_TEST_PG_URL', pgUrl);
}

writeFileSync(envLocalPath, dotenv, 'utf8');

if (!apiUrl) {
  console.error('merge-supabase-status-into-env-local: API_URL missing from supabase status -o env');
  process.exit(1);
}
if (!pgUrl) {
  console.error(
    'merge-supabase-status-into-env-local: DB_URL missing from status and no CLI pg URL passed',
  );
  process.exit(1);
}
if (!anonForExpo) {
  console.error(
    'merge-supabase-status-into-env-local: no PUBLISHABLE_KEY / ANON_KEY in supabase status -o env',
  );
  process.exit(1);
}

const exportsBody = [
  `export EXPO_PUBLIC_SUPABASE_URL=${shellSingleQuote(apiUrl)}`,
  `export EXPO_PUBLIC_SUPABASE_ANON_KEY=${shellSingleQuote(anonForExpo)}`,
  `export BIKE_BIN_TEST_SUPABASE_URL=${shellSingleQuote(apiUrl)}`,
  `export BIKE_BIN_TEST_PG_URL=${shellSingleQuote(pgUrl)}`,
  '',
].join('\n');

writeFileSync(exportsPath, exportsBody, 'utf8');

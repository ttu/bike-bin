import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const KEYS_TO_MERGE = ['BIKE_BIN_TEST_PG_URL', 'BIKE_BIN_TEST_SUPABASE_URL'] as const;

/**
 * Playwright globalSetup may not inherit shell exports (e.g. after `source` in a wrapper script).
 * Merge selected keys from repo-root `.env.local` into `process.env` so E2E DB URL matches isolated Supabase.
 */
export function loadBikeBinTestEnvFromEnvLocal(cwd: string = process.cwd()): void {
  const p = resolve(cwd, '.env.local');
  if (!existsSync(p)) return;

  let content: string;
  try {
    content = readFileSync(p, 'utf8');
  } catch {
    return;
  }

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!KEYS_TO_MERGE.includes(key as (typeof KEYS_TO_MERGE)[number])) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

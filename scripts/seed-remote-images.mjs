/**
 * After `seed-remote-sql.sh`, uploads files from `supabase/seed-images/` to Storage
 * and inserts `item_photos` / `bike_photos` rows (same as local `node scripts/seed-images.mjs`).
 *
 * Env:
 * - SUPABASE_SERVICE_ROLE_KEY — required on GitHub Actions; optional locally (skip if unset)
 * - SUPABASE_URL — optional; defaults to https://{PROJECT_REF}.supabase.co
 * - PROJECT_REF — required when SUPABASE_URL is not set
 */

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { supabaseHostedProjectUrl } = require('./hostedSupabaseUrl.cjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function main() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const onGithubActions = process.env.GITHUB_ACTIONS === 'true';

  if (onGithubActions && !serviceRole) {
    console.error(
      'seed-remote-images: Missing SUPABASE_SERVICE_ROLE_KEY. Add it to the GitHub Environment (preview / staging).',
    );
    process.exit(1);
  }

  if (!serviceRole) {
    console.log('seed-remote-images: SUPABASE_SERVICE_ROLE_KEY not set; skipping image upload.');
    process.exit(0);
  }

  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRole;

  const explicitUrl = process.env.SUPABASE_URL?.trim();
  const projectRef = process.env.PROJECT_REF?.trim();
  if (projectRef) {
    process.env.PROJECT_REF = projectRef;
  }

  if (!explicitUrl) {
    if (!projectRef) {
      console.error('seed-remote-images: Set SUPABASE_URL or PROJECT_REF for hosted seed images.');
      process.exit(1);
    }
    process.env.SUPABASE_URL = supabaseHostedProjectUrl(projectRef);
  } else {
    process.env.SUPABASE_URL = explicitUrl;
  }

  const script = path.join(__dirname, 'seed-images.mjs');
  execFileSync(process.execPath, [script], { stdio: 'inherit', env: process.env });
}

main();

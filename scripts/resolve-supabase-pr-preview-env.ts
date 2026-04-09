/**
 * CI helper: resolve EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for a
 * Supabase preview branch tied to the current GitHub PR (branching on the staging parent project).
 *
 * Reads Supabase Management API:
 * - GET /v1/projects/{parent_ref}/branches → match pr_number
 * - GET /v1/projects/{preview_ref}/api-keys?reveal=true → anon / publishable key
 *
 * Writes to GITHUB_ENV when set; otherwise prints JSON (for local debugging without secrets).
 * Always writes **.bike-bin-ci-supabase.json** in the cwd with
 * `{ "e2eRemoteSuite": "full" | "smoke", "previewProjectRef"?: string }`
 * so CI can default Playwright remote E2E (`full` only for isolated preview branches; `smoke` for staging/fallback).
 *
 * Env (CI):
 * - SUPABASE_ACCESS_TOKEN — required for API (repo secret SUPABASE_ACCESS_TOKEN)
 * - SUPABASE_STAGING_PROJECT_REF — parent project ref (GitHub Environment variable)
 * - SUPABASE_PREVIEW_PR_NUMBER — GitHub PR number
 * - GITHUB_ENV — path to env file (set by Actions)
 *
 * Fallback when SUPABASE_STAGING_PROJECT_REF is empty:
 * - FALLBACK_EXPO_PUBLIC_SUPABASE_URL, FALLBACK_EXPO_PUBLIC_SUPABASE_ANON_KEY — static preview secrets
 *
 * When a preview branch exists for the PR but is not found (branching lag or disabled):
 * - STAGING_EXPO_PUBLIC_SUPABASE_URL + STAGING_EXPO_PUBLIC_SUPABASE_ANON_KEY — preferred staging target
 * - else same FALLBACK_* pair as above (often set to staging URL + anon key on the preview environment)
 */

import { appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Written in CI so downstream jobs know whether the PR uses an isolated preview DB or shared staging. */
export const BIKE_BIN_CI_SUPABASE_METADATA_FILENAME = '.bike-bin-ci-supabase.json';

export type BikeBinCiSupabaseE2eRemoteSuite = 'full' | 'smoke';

export type BikeBinCiSupabaseMetadata = {
  e2eRemoteSuite: BikeBinCiSupabaseE2eRemoteSuite;
  /** Set when `e2eRemoteSuite` is `full` — Supabase preview branch project ref (for CI SQL seed). */
  previewProjectRef?: string;
};

/**
 * `full` — Management API resolved a Supabase **preview branch** for this PR (disposable DB).
 * `smoke` — static fallback / staging credentials (shared DB; do not run mutating remote E2E).
 */
export function writeBikeBinCiSupabaseMetadata(
  e2eRemoteSuite: BikeBinCiSupabaseE2eRemoteSuite,
  cwd: string = process.cwd(),
  options?: { previewProjectRef?: string },
): void {
  const path = join(cwd, BIKE_BIN_CI_SUPABASE_METADATA_FILENAME);
  const payload: BikeBinCiSupabaseMetadata = { e2eRemoteSuite };
  const ref = options?.previewProjectRef?.trim();
  if (ref) {
    payload.previewProjectRef = ref;
  }
  writeFileSync(path, `${JSON.stringify(payload)}\n`, 'utf8');
}

const API_BASE = 'https://api.supabase.com/v1';
/** Management API fetch timeout (per attempt). */
const API_TIMEOUT_MS = 30_000;
/** Initial attempt + retries for 429 / 5xx / timeout. */
const FETCH_MAX_ATTEMPTS = 4;
const FETCH_BASE_BACKOFF_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

function parseRetryAfterMs(header: string | null): number | undefined {
  if (!header) {
    return undefined;
  }
  const seconds = parseInt(header.trim(), 10);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, 60_000);
  }
  return undefined;
}

function isAbortOrTimeoutError(e: unknown): boolean {
  if (!(e instanceof Error)) {
    return false;
  }
  if (e.name === 'AbortError' || e.name === 'TimeoutError') {
    return true;
  }
  return e instanceof DOMException && e.name === 'TimeoutError';
}

export type SupabaseBranchRow = {
  /** Management API may return string or number. */
  pr_number?: number | string | null;
  project_ref?: string | null;
  git_branch?: string | null;
  status?: string | null;
};

export type SupabaseApiKeyRow = {
  api_key?: string | null;
  name?: string | null;
  type?: string | null;
};

/** Thrown when the parent project has no preview branch row for this PR (API succeeded, no match). */
export class NoPreviewBranchForPrError extends Error {
  override readonly name = 'NoPreviewBranchForPrError';
  readonly prNumber: number;
  readonly stagingParentRef: string;

  constructor(prNumber: number, stagingParentRef: string) {
    super(
      `No Supabase preview branch found for PR #${prNumber}. ` +
        `Confirm Supabase Branching created a branch for this PR (check parent project ${stagingParentRef}).`,
    );
    this.prNumber = prNumber;
    this.stagingParentRef = stagingParentRef;
  }
}

/**
 * When no per-PR preview DB exists, CI uses staging credentials: explicit STAGING_* first, else FALLBACK_*.
 */
export function selectStagingOrFallbackForNoPreviewBranch(
  env: Record<string, string | undefined>,
): { url: string; anonKey: string; reasonLabel: string } | undefined {
  const stagingUrl = env.STAGING_EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const stagingKey = env.STAGING_EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  if (stagingUrl && stagingKey) {
    return {
      url: stagingUrl,
      anonKey: stagingKey,
      reasonLabel: 'staging credentials (no Supabase preview branch for this PR)',
    };
  }
  const fbUrl = env.FALLBACK_EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const fbKey = env.FALLBACK_EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  if (fbUrl && fbKey) {
    return {
      url: fbUrl,
      anonKey: fbKey,
      reasonLabel: 'FALLBACK EXPO_PUBLIC_* (no Supabase preview branch for this PR)',
    };
  }
  return undefined;
}

export function findBranchForPr(
  branches: SupabaseBranchRow[],
  prNumber: number,
): SupabaseBranchRow | undefined {
  return branches.find((b) => b.pr_number === prNumber || String(b.pr_number) === String(prNumber));
}

export function buildPreviewApiUrl(projectRef: string): string {
  const ref = projectRef.trim();
  if (!ref) {
    throw new Error('buildPreviewApiUrl: empty project_ref');
  }
  return `https://${ref}.supabase.co`;
}

/**
 * Only accept legacy `anon`, new publishable keys, or `sb_publishable_*` secrets.
 * Rejects unknown names/types so we never embed arbitrary API keys in the client bundle.
 */
/** Service role key for Storage / admin API (seed images on preview branches). */
export function pickServiceRoleKey(keys: SupabaseApiKeyRow[]): string | undefined {
  if (!Array.isArray(keys) || keys.length === 0) {
    return undefined;
  }
  const row = keys.find(
    (k) => k.name === 'service_role' && typeof k.api_key === 'string' && k.api_key.length > 0,
  );
  const key = row?.api_key;
  return typeof key === 'string' && key.length > 0 ? key : undefined;
}

export function pickPublishableAnonKey(keys: SupabaseApiKeyRow[]): string | undefined {
  if (!Array.isArray(keys) || keys.length === 0) {
    return undefined;
  }

  const anon = keys.find(
    (k) => k.name === 'anon' && typeof k.api_key === 'string' && k.api_key.length > 0,
  );
  if (anon?.api_key) {
    return anon.api_key;
  }

  const publishable = keys.find((k) => {
    const key = k.api_key;
    if (typeof key !== 'string' || key.length === 0) {
      return false;
    }
    if (key.startsWith('sb_publishable_')) {
      return true;
    }
    return k.name === 'publishable' || k.type === 'publishable';
  });
  const pubKey = publishable?.api_key;
  return typeof pubKey === 'string' && pubKey.length > 0 ? pubKey : undefined;
}

async function fetchJson(
  url: string,
  token: string,
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  let lastThrown: unknown;

  for (let attempt = 0; attempt < FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
      const text = await res.text();
      let json: unknown;
      try {
        json = text ? JSON.parse(text) : undefined;
      } catch {
        json = undefined;
      }
      const out = { ok: res.ok, status: res.status, json, text };

      if (isRetryableHttpStatus(res.status) && attempt < FETCH_MAX_ATTEMPTS - 1) {
        const fromHeader = parseRetryAfterMs(res.headers.get('retry-after'));
        const backoff = Math.min(FETCH_BASE_BACKOFF_MS * 2 ** attempt, 10_000);
        await delay(fromHeader ?? backoff);
        continue;
      }

      return out;
    } catch (e) {
      lastThrown = e;
      if (isAbortOrTimeoutError(e) && attempt < FETCH_MAX_ATTEMPTS - 1) {
        await delay(Math.min(FETCH_BASE_BACKOFF_MS * 2 ** attempt, 10_000));
        continue;
      }
      throw e;
    }
  }

  throw lastThrown instanceof Error ? lastThrown : new Error(String(lastThrown));
}

export async function resolvePreviewSupabaseEnv(options: {
  accessToken: string;
  stagingProjectRef: string;
  prNumber: number;
}): Promise<{
  url: string;
  anonKey: string;
  serviceRoleKey: string | undefined;
  previewProjectRef: string;
}> {
  const { accessToken, stagingProjectRef, prNumber } = options;
  const parent = encodeURIComponent(stagingProjectRef.trim());

  const branchesUrl = `${API_BASE}/projects/${parent}/branches`;
  const branchesRes = await fetchJson(branchesUrl, accessToken);
  if (!branchesRes.ok) {
    throw new Error(
      `List branches failed: ${branchesRes.status} ${branchesRes.text.slice(0, 500)}`,
    );
  }

  const branches = branchesRes.json;
  if (!Array.isArray(branches)) {
    throw new Error('List branches: expected JSON array');
  }

  const branch = findBranchForPr(branches as SupabaseBranchRow[], prNumber);
  const previewRef = branch?.project_ref?.trim();
  if (!previewRef) {
    throw new NoPreviewBranchForPrError(prNumber, stagingProjectRef);
  }

  const url = buildPreviewApiUrl(previewRef);

  const keysUrl = `${API_BASE}/projects/${encodeURIComponent(previewRef)}/api-keys?reveal=true`;
  const keysRes = await fetchJson(keysUrl, accessToken);
  if (!keysRes.ok) {
    throw new Error(
      `List API keys failed for preview project ${previewRef}: ${keysRes.status} ${keysRes.text.slice(0, 500)}`,
    );
  }

  const keys = keysRes.json;
  if (!Array.isArray(keys)) {
    throw new Error('List API keys: expected JSON array');
  }

  const anonKey = pickPublishableAnonKey(keys as SupabaseApiKeyRow[]);
  if (!anonKey) {
    throw new Error(
      `Could not resolve anon or publishable key for preview project ${previewRef}. ` +
        'Check Management API token permissions (api_gateway_keys_read / secrets:read).',
    );
  }

  const serviceRoleKey = pickServiceRoleKey(keys as SupabaseApiKeyRow[]);

  return { url, anonKey, serviceRoleKey, previewProjectRef: previewRef };
}

function appendGithubEnv(githubEnvPath: string, name: string, value: string): void {
  const line = `${name}=${value}\n`;
  appendFileSync(githubEnvPath, line, 'utf8');
}

/** Register a value for GitHub Actions log masking before writing it to `GITHUB_ENV`. */
function appendGithubMask(value: string): void {
  console.log(`::add-mask::${value}`);
}

function writeFallback(
  githubEnv: string | undefined,
  fallbackUrl: string,
  fallbackKey: string,
  reason: string,
): void {
  writeBikeBinCiSupabaseMetadata('smoke');
  if (githubEnv) {
    appendGithubEnv(githubEnv, 'EXPO_PUBLIC_SUPABASE_URL', fallbackUrl);
    appendGithubEnv(githubEnv, 'EXPO_PUBLIC_SUPABASE_ANON_KEY', fallbackKey);
  }
  console.log(`resolve-supabase-pr-preview-env: using fallback EXPO_PUBLIC_* (${reason}).`);
}

async function main(): Promise<void> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? '';
  const parentRef = process.env.SUPABASE_STAGING_PROJECT_REF?.trim() ?? '';
  const prRaw = process.env.SUPABASE_PREVIEW_PR_NUMBER ?? '';
  const prNumber = parseInt(prRaw, 10);
  const githubEnv = process.env.GITHUB_ENV;
  const fallbackUrl = process.env.FALLBACK_EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const fallbackKey = process.env.FALLBACK_EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

  if (!parentRef) {
    if (fallbackUrl && fallbackKey) {
      writeFallback(githubEnv, fallbackUrl, fallbackKey, 'SUPABASE_STAGING_PROJECT_REF unset');
      return;
    }
    console.error(
      'resolve-supabase-pr-preview-env: set Environment variable SUPABASE_STAGING_PROJECT_REF ' +
        '(staging parent project ref) or provide FALLBACK_EXPO_PUBLIC_SUPABASE_URL and FALLBACK_EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
    process.exit(1);
  }

  if (!token) {
    if (fallbackUrl && fallbackKey) {
      writeFallback(githubEnv, fallbackUrl, fallbackKey, 'SUPABASE_ACCESS_TOKEN unset');
      return;
    }
    console.error('resolve-supabase-pr-preview-env: missing SUPABASE_ACCESS_TOKEN.');
    process.exit(1);
  }

  if (Number.isNaN(prNumber) || prNumber < 1) {
    console.error('resolve-supabase-pr-preview-env: invalid SUPABASE_PREVIEW_PR_NUMBER.');
    process.exit(1);
  }

  try {
    const resolved = await resolvePreviewSupabaseEnv({
      accessToken: token,
      stagingProjectRef: parentRef,
      prNumber,
    });

    writeBikeBinCiSupabaseMetadata('full', process.cwd(), {
      previewProjectRef: resolved.previewProjectRef,
    });
    if (githubEnv) {
      appendGithubEnv(githubEnv, 'EXPO_PUBLIC_SUPABASE_URL', resolved.url);
      appendGithubEnv(githubEnv, 'EXPO_PUBLIC_SUPABASE_ANON_KEY', resolved.anonKey);
      if (resolved.serviceRoleKey) {
        appendGithubMask(resolved.serviceRoleKey);
        appendGithubEnv(githubEnv, 'SUPABASE_SERVICE_ROLE_KEY', resolved.serviceRoleKey);
      }
      console.log(
        `resolve-supabase-pr-preview-env: OK → preview project ${resolved.previewProjectRef} (PR #${prNumber}).`,
      );
      if (!resolved.serviceRoleKey) {
        console.log(
          'resolve-supabase-pr-preview-env: no service_role in API keys response; set GitHub secret SUPABASE_SERVICE_ROLE_KEY on preview or ensure token can read service_role.',
        );
      }
    } else {
      console.log(
        JSON.stringify(
          {
            url: resolved.url,
            previewProjectRef: resolved.previewProjectRef,
            prNumber,
            source: 'management_api',
            e2eRemoteSuite: 'full' as const,
          },
          null,
          2,
        ),
      );
    }
  } catch (err) {
    if (err instanceof NoPreviewBranchForPrError) {
      const pick = selectStagingOrFallbackForNoPreviewBranch(process.env);
      if (pick) {
        writeFallback(githubEnv, pick.url, pick.anonKey, pick.reasonLabel);
        return;
      }
      console.error(
        'resolve-supabase-pr-preview-env: no preview branch for this PR and no staging/fallback credentials. ' +
          'Add secrets STAGING_EXPO_PUBLIC_SUPABASE_URL + STAGING_EXPO_PUBLIC_SUPABASE_ANON_KEY (staging), ' +
          'or EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY on the preview environment (often staging).',
      );
      process.exit(1);
    }
    throw err;
  }
}

if (!process.env.JEST_WORKER_ID) {
  void main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

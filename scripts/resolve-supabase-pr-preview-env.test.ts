import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  BIKE_BIN_CI_SUPABASE_METADATA_FILENAME,
  buildPreviewApiUrl,
  findBranchForPr,
  NoPreviewBranchForPrError,
  pickPublishableAnonKey,
  resolvePreviewSupabaseEnv,
  selectStagingOrFallbackForNoPreviewBranch,
  writeBikeBinCiSupabaseMetadata,
  type SupabaseApiKeyRow,
  type SupabaseBranchRow,
} from './resolve-supabase-pr-preview-env';

describe('findBranchForPr', () => {
  const branches: SupabaseBranchRow[] = [
    { pr_number: 1, project_ref: 'aaa' },
    { pr_number: 42, project_ref: 'bbb' },
  ];

  it('matches pr_number', () => {
    expect(findBranchForPr(branches, 42)?.project_ref).toBe('bbb');
  });

  it('matches string pr_number from API via String comparison', () => {
    expect(findBranchForPr([{ pr_number: '7', project_ref: 'x' }], 7)?.project_ref).toBe('x');
  });
});

describe('buildPreviewApiUrl', () => {
  it('builds https URL from project ref', () => {
    expect(buildPreviewApiUrl('abc123')).toBe('https://abc123.supabase.co');
  });

  it('throws on empty ref', () => {
    expect(() => buildPreviewApiUrl('')).toThrow('empty project_ref');
  });
});

describe('pickPublishableAnonKey', () => {
  it('prefers name anon', () => {
    const keys: SupabaseApiKeyRow[] = [
      { name: 'service_role', api_key: 'secret' },
      { name: 'anon', api_key: 'jwt-anon' },
    ];
    expect(pickPublishableAnonKey(keys)).toBe('jwt-anon');
  });

  it('uses publishable / sb_publishable when no anon', () => {
    const keys: SupabaseApiKeyRow[] = [
      { name: 'publishable', api_key: 'sb_publishable_xxx', type: 'publishable' },
    ];
    expect(pickPublishableAnonKey(keys)).toBe('sb_publishable_xxx');
  });

  it('returns undefined when only non-allowlisted keys exist', () => {
    const keys: SupabaseApiKeyRow[] = [
      { name: 'service_role', api_key: 'svc' },
      { name: 'other', api_key: 'unsafe' },
    ];
    expect(pickPublishableAnonKey(keys)).toBeUndefined();
  });

  it('returns undefined when empty', () => {
    expect(pickPublishableAnonKey([])).toBeUndefined();
  });
});

describe('resolvePreviewSupabaseEnv', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('loads branch and anon key from Management API', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            { pr_number: 99, project_ref: 'preview99', status: 'FUNCTIONS_DEPLOYED' },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ name: 'anon', api_key: 'eyJhbGciOiJIUzI1NiJ9.test' }]),
      });

    const out = await resolvePreviewSupabaseEnv({
      accessToken: 'token',
      stagingProjectRef: 'stagingparent',
      prNumber: 99,
    });

    expect(out.url).toBe('https://preview99.supabase.co');
    expect(out.anonKey).toBe('eyJhbGciOiJIUzI1NiJ9.test');
    expect(out.previewProjectRef).toBe('preview99');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(String((global.fetch as jest.Mock).mock.calls[0][0])).toContain(
      '/v1/projects/stagingparent/branches',
    );
    expect(String((global.fetch as jest.Mock).mock.calls[1][0])).toContain(
      '/v1/projects/preview99/api-keys?reveal=true',
    );
  });

  it('throws NoPreviewBranchForPrError when no branch for PR', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ pr_number: 1, project_ref: 'x' }]),
    });

    await expect(
      resolvePreviewSupabaseEnv({
        accessToken: 't',
        stagingProjectRef: 'p',
        prNumber: 999,
      }),
    ).rejects.toBeInstanceOf(NoPreviewBranchForPrError);
  });
});

describe('selectStagingOrFallbackForNoPreviewBranch', () => {
  it('prefers STAGING_* over FALLBACK_*', () => {
    const out = selectStagingOrFallbackForNoPreviewBranch({
      STAGING_EXPO_PUBLIC_SUPABASE_URL: 'https://stg.supabase.co',
      STAGING_EXPO_PUBLIC_SUPABASE_ANON_KEY: 'stg-key',
      FALLBACK_EXPO_PUBLIC_SUPABASE_URL: 'https://fb.supabase.co',
      FALLBACK_EXPO_PUBLIC_SUPABASE_ANON_KEY: 'fb-key',
    });
    expect(out?.url).toBe('https://stg.supabase.co');
    expect(out?.anonKey).toBe('stg-key');
    expect(out?.reasonLabel).toContain('staging credentials');
  });

  it('uses FALLBACK_* when STAGING_* incomplete', () => {
    const out = selectStagingOrFallbackForNoPreviewBranch({
      STAGING_EXPO_PUBLIC_SUPABASE_URL: '',
      STAGING_EXPO_PUBLIC_SUPABASE_ANON_KEY: 'only-key',
      FALLBACK_EXPO_PUBLIC_SUPABASE_URL: 'https://fb.supabase.co',
      FALLBACK_EXPO_PUBLIC_SUPABASE_ANON_KEY: 'fb-key',
    });
    expect(out?.url).toBe('https://fb.supabase.co');
    expect(out?.anonKey).toBe('fb-key');
  });

  it('returns undefined when neither pair is complete', () => {
    expect(selectStagingOrFallbackForNoPreviewBranch({})).toBeUndefined();
  });
});

describe('writeBikeBinCiSupabaseMetadata', () => {
  it('writes e2eRemoteSuite for smoke and full', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-ci-supabase-'));
    try {
      const path = join(dir, BIKE_BIN_CI_SUPABASE_METADATA_FILENAME);
      writeBikeBinCiSupabaseMetadata('smoke', dir);
      expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({ e2eRemoteSuite: 'smoke' });
      writeBikeBinCiSupabaseMetadata('full', dir);
      expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual({ e2eRemoteSuite: 'full' });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

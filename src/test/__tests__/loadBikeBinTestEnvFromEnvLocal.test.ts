import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadBikeBinTestEnvFromEnvLocal } from '../../../e2e/load-test-env-from-env-local';

describe('loadBikeBinTestEnvFromEnvLocal', () => {
  it('merges BIKE_BIN_TEST_PG_URL from .env.local into process.env', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bb-e2e-env-'));
    writeFileSync(
      join(dir, '.env.local'),
      'BIKE_BIN_TEST_PG_URL=postgresql://postgres:postgres@127.0.0.1:59999/postgres\n',
      'utf8',
    );
    const prev = process.env.BIKE_BIN_TEST_PG_URL;
    delete process.env.BIKE_BIN_TEST_PG_URL;
    loadBikeBinTestEnvFromEnvLocal(dir);
    expect(process.env.BIKE_BIN_TEST_PG_URL).toBe(
      'postgresql://postgres:postgres@127.0.0.1:59999/postgres',
    );
    if (prev === undefined) {
      delete process.env.BIKE_BIN_TEST_PG_URL;
    } else {
      process.env.BIKE_BIN_TEST_PG_URL = prev;
    }
  });

  it('later load from another directory overwrites BIKE_BIN_TEST_PG_URL (Playwright project root after cwd)', () => {
    const a = mkdtempSync(join(tmpdir(), 'bb-e2e-env-a-'));
    const b = mkdtempSync(join(tmpdir(), 'bb-e2e-env-b-'));
    writeFileSync(
      join(a, '.env.local'),
      'BIKE_BIN_TEST_PG_URL=postgresql://postgres:postgres@127.0.0.1:11111/postgres\n',
      'utf8',
    );
    writeFileSync(
      join(b, '.env.local'),
      'BIKE_BIN_TEST_PG_URL=postgresql://postgres:postgres@127.0.0.1:22222/postgres\n',
      'utf8',
    );
    const prev = process.env.BIKE_BIN_TEST_PG_URL;
    delete process.env.BIKE_BIN_TEST_PG_URL;
    loadBikeBinTestEnvFromEnvLocal(a);
    loadBikeBinTestEnvFromEnvLocal(b);
    expect(process.env.BIKE_BIN_TEST_PG_URL).toBe(
      'postgresql://postgres:postgres@127.0.0.1:22222/postgres',
    );
    if (prev === undefined) {
      delete process.env.BIKE_BIN_TEST_PG_URL;
    } else {
      process.env.BIKE_BIN_TEST_PG_URL = prev;
    }
  });
});

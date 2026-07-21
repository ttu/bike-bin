import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..', '..');

/** Absolute path so the shell cannot be shadowed via a writable PATH entry. */
const BASH = '/bin/bash';

describe('run-isolated-db-tests.sh', () => {
  it('exists', () => {
    const script = join(repoRoot, 'scripts', 'run-isolated-db-tests.sh');
    expect(existsSync(script)).toBe(true);
  });

  /** `execFileSync` throws on a non-zero exit, so "does not throw" is the exit-0 assertion. */
  const runDryRun = (...args: string[]) =>
    execFileSync(BASH, ['scripts/run-isolated-db-tests.sh', '--dry-run', ...args], {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

  it('exits 0 for --dry-run', () => {
    expect(() => runDryRun()).not.toThrow();
  });

  it('exits 0 for --dry-run both', () => {
    expect(() => runDryRun('both')).not.toThrow();
  });
});

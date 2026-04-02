import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..', '..');

describe('run-isolated-db-tests.sh', () => {
  it('exists', () => {
    const script = join(repoRoot, 'scripts', 'run-isolated-db-tests.sh');
    expect(existsSync(script)).toBe(true);
  });

  it('exits 0 for --dry-run', () => {
    execFileSync('bash', ['scripts/run-isolated-db-tests.sh', '--dry-run'], {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  });

  it('exits 0 for --dry-run both', () => {
    execFileSync('bash', ['scripts/run-isolated-db-tests.sh', '--dry-run', 'both'], {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  });
});

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..', '..');
const script = join(repoRoot, 'scripts', 'patch-supabase-ports.mjs');

describe('patch-supabase-ports.mjs', () => {
  it('shifts default Supabase host port layout from apiPort (delta from 54321)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sb-port-'));
    const cfg = join(dir, 'config.toml');
    writeFileSync(
      cfg,
      `[api]
enabled = true
port = 54321

[db]
port = 54322
shadow_port = 54320

[studio]
enabled = true
port = 54323
api_url = "http://127.0.0.1"
`,
      'utf8',
    );
    execFileSync('node', [script, cfg, '55421'], { cwd: repoRoot, encoding: 'utf-8' });
    const out = readFileSync(cfg, 'utf8');
    expect(out).toContain('port = 55421');
    expect(out).toContain('port = 55422');
    expect(out).toContain('shadow_port = 55420');
    expect(out).toMatch(/\[studio\][\s\S]*port = 55423/);
    expect(out).toMatch(/\[inbucket\][\s\S]*port = 55424/);
    expect(out).toMatch(/\[analytics\][\s\S]*port = 55427/);
    expect(out).toContain('inspector_port = 9183');
  });
});

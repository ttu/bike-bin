import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('marketing site (Astro)', () => {
  const indexPath = join(__dirname, '../../sites/marketing/src/pages/index.astro');

  it('includes Bike Bin and app URL in landing source', () => {
    expect(existsSync(indexPath)).toBe(true);
    const text = readFileSync(indexPath, 'utf8');
    expect(text).toContain('Bike Bin');
    expect(text).toContain('app.bikebin.app');
  });

  it('mentions open source and community contribution paths', () => {
    const text = readFileSync(indexPath, 'utf8');
    expect(text).toContain('id="open-source"');
    expect(text.toLowerCase()).toContain('open source');
    expect(text).toContain('feature requests');
    expect(text).toContain('report bugs');
    expect(text).toContain('github.com/ttu/bike-bin/issues');
  });
});

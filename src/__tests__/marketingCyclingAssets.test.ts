import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('marketing site assets (cycling-only policy)', () => {
  const indexPath = join(__dirname, '../../sites/marketing/src/pages/index.astro');
  const src = readFileSync(indexPath, 'utf8');

  it('does not embed non-cycling demo video (e.g. MDN flower clip)', () => {
    expect(src).not.toMatch(/interactive-examples\.mdn\.mozilla\.net/i);
    expect(src).not.toMatch(/flower\.mp4/i);
  });

  it('allows local captures; any Unsplash rasters must use images.unsplash.com only', () => {
    expect(src).not.toMatch(/picsum\.photos/i);
    const urlMatches = src.matchAll(/https:\/\/images\.unsplash\.com\/[^\s'"`]+/g);
    const urls = [...urlMatches].map((m) => m[0]);
    // Zero Unsplash URLs is valid (page can rely entirely on local captures).
    for (const url of urls) {
      expect(url.startsWith('https://images.unsplash.com/')).toBe(true);
    }
  });
});

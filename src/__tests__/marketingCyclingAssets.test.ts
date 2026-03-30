import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('marketing site assets (cycling-only policy)', () => {
  const indexPath = join(__dirname, '../../sites/marketing/src/pages/index.astro');
  const src = readFileSync(indexPath, 'utf8');

  it('does not embed non-cycling demo video (e.g. MDN flower clip)', () => {
    expect(src).not.toMatch(/interactive-examples\.mdn\.mozilla\.net/i);
    expect(src).not.toMatch(/flower\.mp4/i);
  });

  it('loads raster placeholders only from images.unsplash.com', () => {
    const urlMatches = src.matchAll(/https:\/\/images\.unsplash\.com\/[^\s'"`]+/g);
    const urls = [...urlMatches].map((m) => m[0]);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith('https://images.unsplash.com/')).toBe(true);
    }
    expect(src).not.toMatch(/picsum\.photos/i);
  });
});

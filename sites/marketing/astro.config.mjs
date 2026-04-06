// @ts-check
import { defineConfig } from 'astro/config';

// CI (e.g. GitHub Pages) can set ASTRO_SITE_URL / ASTRO_BASE_PATH; local defaults match production.
const site = process.env.ASTRO_SITE_URL?.trim() || 'https://bikebin.app';
let base = process.env.ASTRO_BASE_PATH?.trim() || '/';
if (base !== '/' && !base.startsWith('/')) {
  base = `/${base}`;
}
if (base !== '/' && !base.endsWith('/')) {
  base = `${base}/`;
}

// https://astro.build/config
export default defineConfig({
  site,
  base,
  build: {
    // Default `_astro/` is omitted by GitHub Pages Jekyll; `.nojekyll` was also dropped from the
    // Pages artifact until upload-pages-artifact `include-hidden-files` (dotfiles excluded by default).
    assets: 'astro',
  },
});

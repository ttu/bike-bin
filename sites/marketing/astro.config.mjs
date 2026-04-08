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
    // Emit build assets under `_astro/` (underscore) so they are not treated as Jekyll partials on
    // legacy branch-based Pages. GitHub Actions → deploy-pages serves the artifact as static files
    // without Jekyll; upload-pages-artifact@v4 excludes dotfiles from the tarball (no `.nojekyll` needed there).
    assets: 'astro',
  },
});

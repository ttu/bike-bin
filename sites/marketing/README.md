# Bike Bin — marketing site (Astro)

Static marketing site for **https://bikebin.app**. The product web app lives at **https://app.bikebin.app**.

**Workflow:** Implement and commit this tree **only** from the git worktree (e.g. `.worktrees/marketing-site` on `feat/marketing-site`), not from the primary clone’s `main`, until the branch is merged. See `CLAUDE.md` / `AGENTS.md`.

## Commands (from repo root)

- `npm run marketing:dev` — Astro dev server
- `npm run marketing:build` — production build → `sites/marketing/dist/`
- `npm run marketing:test` — `astro check`

## Media placeholders

All raster imagery is **Unsplash** cycling/bicycle photography (see `pics` in `src/pages/index.astro`). The phone mock and “How it works” cards use **still images** plus subtle CSS pan/zoom (no unrelated stock video). Replace URLs or add screen captures when you have product assets.

## Deploy

**Production:** GitHub Pages — `.github/workflows/deploy-marketing-pages.yml` builds `dist/` and deploys on push to `main` when this directory changes (enable **Settings → Pages → GitHub Actions**). See [docs/development.md](../../docs/development.md) (Marketing site — GitHub Pages).

For a generic static host, point it at `sites/marketing` with build `npm run build` and output `dist`.

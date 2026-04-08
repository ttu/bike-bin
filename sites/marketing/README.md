# Bike Bin — marketing site (Astro)

Static marketing site for **https://bikebin.app**. The product web app lives at **https://app.bikebin.app**.

**Workflow:** Implement and commit this tree **only** from the git worktree (e.g. `.worktrees/marketing-site` on `feat/marketing-site`), not from the primary clone’s `main`, until the branch is merged via **PR** to `main`. See `CLAUDE.md` / `AGENTS.md`.

## Commands (from repo root)

- `npm run marketing:dev` — Astro dev server
- `npm run marketing:build` — production build → `sites/marketing/dist/`
- `npm run marketing:test` — `astro check`

## Media placeholders

Raster imagery is primarily **captured app screenshots** checked in under `public/captures/` (see `src/pages/index.astro` and `npm run capture:media`). The hero and feature sections use those stills (and optional screen recordings) inside the phone frame. If you reintroduce external stock photos later, prefer **Unsplash** cycling/bicycle URLs only (see `src/__tests__/marketingCyclingAssets.test.ts`); avoid unrelated hosts such as picsum.

## Deploy

**Production:** GitHub Pages — `.github/workflows/deploy-marketing-pages.yml` builds `dist/` and deploys on push to `main` when this directory changes (enable **Settings → Pages → GitHub Actions**). See [docs/development.md](../../docs/development.md) (Marketing site — GitHub Pages).

For a generic static host, point it at `sites/marketing` with build `npm run build` and output `dist`.

# Generated app captures

PNG, WebM, and GIF files in `raw/`, `framed/`, `video/`, and `gif/` are produced by:

```bash
npm run capture:media
```

Requirements match E2E: local Supabase, seeded DB (`e2e/global-setup.ts`), and `.env.local`.

- **raw/** — 1290×2796 PNGs suitable for App Store screenshot slots (6.7" portrait).
- **framed/** — same shots inside a simple CSS “phone” shell for the marketing site.

Typical filenames after a run:

| Base name                | Screen                               |
| ------------------------ | ------------------------------------ |
| `01-login`               | Login                                |
| `02-inventory-signed-in` | Inventory (Dev Login, seeded items)  |
| `03-item-detail`         | Item detail (seeded item)            |
| `04-item-edit`           | Edit item                            |
| `05-search-results`      | Search with results                  |
| `06-messages-inbox`      | Messages list (seeded conversations) |

- **video/** — WebM screen recording from Playwright.
- **gif/** — optional; created when `ffmpeg` is installed (`brew install ffmpeg`).

You may add this folder’s binaries to `.gitignore` if you store assets elsewhere, or commit them for the site.

# Generated app captures

PNG, WebM, and GIF files in `raw/`, `framed/`, `video/`, and `gif/` are produced by:

```bash
npm run capture:media
```

Requirements match E2E: local Supabase, seeded DB (`e2e/global-setup.ts`), and `.env.local`.

- **raw/** — 1290×2796 PNGs suitable for App Store screenshot slots (6.7" portrait).
- **framed/** — same shots inside a simple CSS “phone” shell for the marketing site. The canvas outside the device is **transparent** (no gradient backdrop); place on any site background.

Typical filenames after a run:

| Base name                | Screen                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `01-login`               | Login                                                                                       |
| `02-inventory-signed-in` | Inventory — same flow as `e2e/inventory-gallery.spec.ts` (switch + Components + Maxxis row) |
| `03-item-detail`         | Item detail (tap Maxxis row like `e2e/inventory-authenticated.spec.ts`)                     |
| `04-item-edit`           | Edit item                                                                                   |
| `05-search-results`      | Search with results                                                                         |
| `06-messages-inbox`      | Messages list (seeded conversations)                                                        |
| `07-messages-thread`     | Conversation thread with Kai R. (seed messages)                                             |

- **video/** — WebM screen recording from Playwright (`browse-flow.webm`): login (held) → Dev Login → inventory → collection search → open **Maxxis** row → **Edit item** (header pencil).
- **gif/** — optional; created when `ffmpeg` is installed (`brew install ffmpeg`).

The marketing homepage hero uses **`video/browse-flow.webm`** inside the phone frame (with **`raw/02-inventory-signed-in.png`** as the `poster`, same 430×932 viewport as the recording).

You may add this folder’s binaries to `.gitignore` if you store assets elsewhere, or commit them for the site.

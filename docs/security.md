# Bike Bin — Security

> **Purpose:** Comprehensive security plan covering authentication, authorization, data privacy, infrastructure, and compliance. Referenced by all other planning docs for security decisions.  
> **Context:** See [functional-specs.md](functional-specs.md) for trust & safety (§14), [technical-specs.md](technical-specs.md) §6 for security summary, [system-architecture.md](system-architecture.md) for secrets management.

---

## 1. Authentication

### 1.1 Login methods

- **OAuth only:** Google and Apple via Supabase Auth. No email+password or magic link for MVP.
- **Email verification:** Handled by the identity provider (Google/Apple verify the email address). No separate in-app email confirmation flow needed.
- **No password storage:** Since we use OAuth exclusively, we never store or manage passwords. Supabase Auth stores the OAuth identity link and session tokens.
- **Production web URLs:** The Expo web app is served at **https://app.bikebin.app**. The static marketing site is **https://bikebin.app** (Astro in `sites/marketing/`). Configure Supabase **Site URL** and **Redirect URLs** for the app origin; add the marketing origin only if the landing site embeds Supabase Auth. Register the same redirect URIs in Google and Apple OAuth consoles.

### 1.2 Session management

- **Tokens:** Supabase Auth issues a JWT access token + refresh token. The Supabase client SDK handles token storage, refresh, and expiry transparently.
- **Token storage:** Stored in secure device storage via Supabase client SDK (uses `expo-secure-store` on native, or AsyncStorage fallback).
- **Session lifetime:** Access token expires after 1 hour (Supabase default). Refresh token used to obtain a new access token automatically. Refresh token lifetime: 7 days (configurable in Supabase dashboard).
- **Session revocation:** User can log out (clears tokens). Admin can revoke sessions from Supabase dashboard.

### 1.3 Unauthenticated access

- Unauthenticated users can **browse public listings** (items marked as visible to "All users").
- Unauthenticated users **cannot**: create items, send messages, submit borrow requests, rate users, or join groups.
- Enforced via Supabase RLS policies (`auth.uid() IS NOT NULL` checks on write operations).

---

## 2. Authorization

### 2.1 Row Level Security (RLS)

RLS is enabled on **all tables**. No table is accessible without an explicit policy. Policies follow the principle of least privilege.

| Table               | SELECT                                                            | INSERT                                     | UPDATE                                                                                                        | DELETE                                     |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **users (profile)** | Public (username, avatar, rating)                                 | Own profile only                           | Own profile only                                                                                              | Own profile only (account deletion)        |
| **items**           | Public listings + group-scoped (via group membership) + own items | Authenticated, own items                   | Own items; not arbitrary edit while Loaned/Reserved except **release to stored** (RLS + trigger; see `00029`) | Own items only (not while Loaned/Reserved) |
| **bikes**           | Own bikes only                                                    | Authenticated, own bikes                   | Own bikes only                                                                                                | Own bikes only                             |
| **saved_locations** | Own locations only                                                | Authenticated, own locations               | Own locations only                                                                                            | Own locations only                         |
| **groups**          | Public groups: all. Private groups: members only                  | Authenticated                              | Admins only                                                                                                   | Admins only                                |
| **group_members**   | Members of the group                                              | Admins (invite) or self (join public)      | Admins (role change)                                                                                          | Admins (remove) or self (leave)            |
| **borrow_requests** | Requester or item owner                                           | Authenticated (requester)                  | Requester or item owner; **state transitions** enforced by DB trigger (`00030`)                               | Not allowed (soft delete / status change)  |
| **conversations**   | Participants only                                                 | Authenticated (item-context)               | Not allowed                                                                                                   | Not allowed                                |
| **messages**        | Conversation participants                                         | Conversation participants                  | Not allowed (messages are immutable)                                                                          | Not allowed                                |
| **ratings**         | Public (read)                                                     | Authenticated, after completed transaction | Not allowed (ratings are immutable)                                                                           | Not allowed                                |
| **item_photos**     | Same as parent item                                               | Item owner                                 | Item owner                                                                                                    | Item owner                                 |
| **notifications**   | Own notifications only                                            | System only (Edge Functions / triggers)    | Own (mark as read)                                                                                            | Own                                        |
| **subscriptions**   | Own subscription rows only                                        | Not via PostgREST (service role / SQL)     | Not via PostgREST (service role / SQL)                                                                        | Not via PostgREST (service role / SQL)     |

### 2.2 Role-based access (groups)

- **Admin:** Can invite/remove members, edit group details, promote/demote admins, delete group.
- **Member:** Can view group items, share own items to the group, leave the group.
- **Non-member:** Cannot see private group content or group-scoped items.
- Group creator is the first admin. At least one admin must remain (cannot demote the last admin).

### 2.3 API-level enforcement

- All data access goes through Supabase PostgREST, which enforces RLS automatically.
- Edge Functions use the **service role key** (bypasses RLS) only for system operations (notifications, geocoding, **subscription writes** from payment webhooks or automation). Service role key is never exposed to the client.
- No custom REST endpoints bypass RLS.

---

## 3. Data privacy

### 3.1 Location privacy

- **Coordinates are never sent to other clients.** User coordinates (`geography` type) are stored server-side for distance calculations only.
- **Only the area name** (postcode/ZIP level) is shown publicly on listings.
- **Exact address** is shared only when both parties agree (communicated in item-linked messaging).
- Distance filtering uses server-side PostGIS queries (`ST_DWithin`) — the client sends its own coordinates to the server for the query, but never receives other users' coordinates.

### 3.2 Personal Identifiable Information (PII)

| Data                    | Storage                                   | Visibility                                            |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Email address           | Supabase Auth only (not in public tables) | Never shown to other users                            |
| Username                | Public profile table                      | Public                                                |
| Profile photo           | Supabase Storage                          | Public                                                |
| Coordinates (lat/lng)   | `saved_locations` table (server-side)     | Never sent to clients; used for distance queries only |
| Area name (postcode)    | `saved_locations` table                   | Public (shown on listings)                            |
| OAuth provider ID       | Supabase Auth                             | Never shown                                           |
| Push notification token | User profile / device table               | Never shown to other users                            |
| Messages                | `messages` table                          | Conversation participants only                        |

### 3.3 Data minimization

- Collect only what's needed. No phone number, no real name required (username only).
- OAuth profile data: we store only username, email (in auth), and avatar URL. We do not request or store contacts, calendar, or other OAuth scopes beyond basic profile + email.

---

## 4. Realtime subscriptions

### 4.1 Security model

Supabase Realtime `postgres_changes` subscriptions **do not enforce RLS**. The subscription filter is applied as a plain column filter on the change stream — it is not authenticated against the user's identity or RLS policies.

All four Realtime subscriptions have been reviewed:

| Hook                         | Filter                      | Assessment                                                                                                          |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `useRealtimeMessages`        | `conversation_id=eq.<uuid>` | Low risk — IDs are UUIDs exposed only to participants via the RLS-guarded API                                       |
| `useRealtimeNotifications`   | `user_id=eq.<auth.uid()>`   | Safe — filter is the user's own JWT subject                                                                         |
| `useUnreadNotificationCount` | `user_id=eq.<auth.uid()>`   | Safe — filter is the user's own JWT subject                                                                         |
| `useUnreadCount`             | ~~no filter~~               | **Removed** — unfiltered subscription delivered every message row (including content) to every authenticated client |

### 4.2 `useUnreadCount` — removed subscription

The original implementation subscribed to all `messages` inserts with no filter to drive a badge counter. Because `postgres_changes` does not apply RLS, this delivered the full message row (body, sender, conversation) to every authenticated user's WebSocket connection regardless of conversation membership.

The subscription has been removed. The hook returns 0 (MVP placeholder). The `useRealtimeMessages` hook already invalidates the same query key when messages arrive in the currently-open conversation, so there is no regression for the active chat screen.

Full unread tracking across all conversations is a post-MVP feature and will require a `conversation_read_at` table and a per-conversation subscription scoped to the authenticated user's conversations.

### 4.3 `useRealtimeMessages` — residual risk

The subscription filter `conversation_id=eq.<uuid>` scopes events to one conversation but does not verify the subscriber is a participant. Any authenticated user who knows a conversation UUID can receive its messages in real time.

**Mitigations in place:**

- Conversation IDs are UUIDs (128-bit) — not guessable.
- The only way to discover a conversation UUID is via the REST API, which enforces RLS and only returns conversations where the requester is a participant.

**Future hardening** (post-MVP): Migrate to Supabase Realtime RLS or a server-sent broadcast pattern where the server verifies participation before joining the channel.

---

## 5. Encryption & transport

### 5.1 In transit

- **All communication over HTTPS/TLS.** Supabase enforces TLS for all API, Realtime, and Storage connections.
- **WebSocket connections** (Supabase Realtime) use WSS (TLS-encrypted).
- **Edge Function calls** to external services (Resend, Nominatim, Expo Push) use HTTPS.

### 5.2 At rest

- **Database:** Supabase PostgreSQL uses encryption at rest (AES-256, managed by the cloud provider — AWS).
- **Object storage:** Supabase Storage (S3-backed) uses server-side encryption at rest (SSE-S3).
- **Client-side cache:** TanStack Query cache in AsyncStorage is **not encrypted** on device. Sensitive data (coordinates, messages) may be cached. Acceptable for MVP; consider `expo-secure-store` for sensitive fields if needed later.
- **No field-level encryption** for MVP. Coordinates are protected by RLS (never exposed to other clients), not by encryption.

---

## 6. Secrets & key management

| Secret                            | Storage location                                       | Access                                      |
| --------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| **Supabase anon key**             | Expo config (`.env.*`), GitHub Actions secrets         | Client-side (safe — RLS enforces access)    |
| **Supabase service role key**     | Supabase Edge Function secrets, GitHub Actions secrets | Server-side only. **Never in client code.** |
| **Google OAuth client ID/secret** | Supabase Auth dashboard (per environment)              | Server-side (Supabase Auth)                 |
| **Apple OAuth credentials**       | Supabase Auth dashboard (per environment)              | Server-side (Supabase Auth)                 |
| **Resend API key**                | Supabase Edge Function secrets (per environment)       | Edge Functions only                         |
| **Expo Push access token**        | Supabase Edge Function secrets                         | Edge Functions only                         |
| **ADMIN_MODERATION_SECRET**       | Supabase Edge Function secrets (per environment)       | `admin-enforce-sanction` Edge Function only |

### 6.1 Key rotation

- OAuth client secrets: Rotate via provider dashboard + update Supabase Auth config.
- Resend API key: Rotate via Resend dashboard + update Edge Function secrets.
- Supabase keys: Rotate via Supabase dashboard (generates new anon key / service role key). Update all environment configs.
- **No secrets in source code.** `.env*` files are in `.gitignore`. CI secrets in GitHub Actions encrypted secrets.

---

## 7. Input validation & abuse prevention

### 7.1 Input validation

- **Client-side:** TypeScript types + form validation (required fields, length limits, format checks) before submission.
- **Server-side:** PostgreSQL constraints (NOT NULL, CHECK, UNIQUE) and RLS policies enforce data integrity regardless of client.
- **Image uploads:** Client-side resize/compress targeting ≤512 KB per photo (JPEG after processing). Supabase Storage bucket policy enforces max file size. Only allowed MIME types (image/jpeg, image/png, image/webp).
- **Text fields:** Max length constraints on name, description, messages (enforced in DB schema). Sanitize for display (no HTML injection in React Native, but be cautious with web views if added later).

### 7.2 Rate limiting

- **Supabase built-in:** PostgREST has configurable rate limits per IP / per user.
- **Auth:** Supabase Auth rate-limits login attempts automatically (protection against brute force — less relevant with OAuth, but still active).
- **Nominatim:** Max 1 request/sec (enforced by caching results in DB, calling via Edge Function).
- **Messaging:** Consider rate-limiting message sends per user (e.g., max 60 messages/minute) to prevent spam. Implement via database function or Edge Function if needed.
- **Listing creation:** Consider rate-limiting item creation (e.g., max 20 items/hour) to prevent automated spam.

### 7.3 Reporting & moderation

- **Report flow:** Users can report items, users, **item photos** (long-press in gallery), and **chat messages** (long-press in conversation). Reports stored in the `reports` table with `report_target_type` enum (`item`, `user`, `item_photo`, `message`).
- **Moderation queue:** Admin/moderator reviews reports. Actions: warn user, remove listing, suspend/ban user.
- **MVP scope:** Basic report submission + admin review (can use Supabase dashboard or a simple admin screen). Automated moderation (ML, keyword filters) is post-MVP.
- **Blocked users:** Users can block other users. Blocked users cannot message or see each other's listings.

### 7.4 Admin enforcement — `admin-enforce-sanction`

A secret-protected Edge Function (`supabase/functions/admin-enforce-sanction/index.ts`) performs hard purge of a sanctioned user's data. **Not callable from the app** — invoked by an admin via `curl` or dashboard.

**Authentication:** `x-admin-secret` header compared using `timingSafeEqual` against `ADMIN_MODERATION_SECRET` env var. No JWT or Supabase Auth involved.

**Ordered purge steps:**

1. Load OAuth identities via `supabase.auth.admin.getUserById()`
2. Upsert `blocked_oauth_identities` (prevents re-registration)
3. Collect storage paths (avatars, item photos, bike photos, data exports)
4. Delete storage objects (grouped by bucket, 404s handled gracefully)
5. Close reports targeting user and their content (items, item_photos, messages) — must run before data purge while target rows still exist
6. Data purge: item_photos → items → bike_photos → bikes → messages (DELETE, not anonymize) → conversation_participants → empty conversations (via `find_empty_conversations()` RPC) → ratings → borrow_requests → export_requests → subscriptions → support_requests → saved_locations → group_members → notifications → delete reports filed by user → delete profile
7. Insert `moderation_enforcement_log` row
8. Delete auth user (`auth.admin.deleteUser()`)

**Distinction from GDPR delete-account:** GDPR self-delete anonymizes messages (preserves conversation for other party). Admin enforcement **hard-deletes** messages and blocks re-registration via OAuth identity blocklist.

### 7.5 OAuth identity blocklist & auth hook

- **`blocked_oauth_identities`** table: records `(provider, provider_user_id)` pairs blocked during enforcement. RLS: service-role-only (no SELECT/INSERT for authenticated role).
- **`check_blocked_identity(event jsonb)`** — a `SECURITY DEFINER` Postgres function registered as a Supabase **Before Sign-In** auth hook. Extracts `provider` and `provider_id` from the hook event, checks `blocked_oauth_identities`. If found, returns `{"decision": "reject", "message": "..."}`. Otherwise returns `{"decision": "continue"}`.

---

## 8. GDPR & compliance

### 8.1 Data subject rights

| Right                            | Implementation                                                                                                                                                                                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Right to access**              | User can view all their data in the app (profile, items, messages, ratings). Export functionality TBD for MVP.                                                                                                                                                                         |
| **Right to rectification**       | User can edit their profile, items, saved locations at any time.                                                                                                                                                                                                                       |
| **Right to erasure**             | **Account deletion** — user can delete their account. Cascading delete: profile, items, bikes, saved locations, messages (or anonymize), conversations, ratings, group memberships, notifications, photos (Storage). Implemented via database cascade + Storage cleanup Edge Function. |
| **Right to data portability**    | Export user data as JSON. Post-MVP but the data model supports it (all data is in structured tables).                                                                                                                                                                                  |
| **Right to restrict processing** | User can set items to Private, leave groups, disable notifications.                                                                                                                                                                                                                    |

### 8.2 Consent

- **Account creation:** By signing up, users agree to Terms of Service and Privacy Policy (shown during onboarding).
- **Location:** Users explicitly choose to add saved locations. No background location tracking.
- **Push notifications:** Explicit OS-level permission prompt (standard iOS/Android flow via `expo-notifications`).
- **Email notifications:** Opt-in / configurable in profile settings. Default: enabled for new messages, disabled for marketing.

### 8.3 Data retention

| Data                      | Retention                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active accounts           | Retained while account exists                                                                                                                                 |
| Deleted accounts          | Hard delete within 30 days. Anonymize messages (replace sender with "Deleted User") rather than delete, to preserve conversation context for the other party. |
| Photos                    | Deleted with the item or account                                                                                                                              |
| Notifications             | Auto-expire after 90 days                                                                                                                                     |
| Reports / moderation logs | Retained for 1 year (for appeals and safety)                                                                                                                  |
| Geocoding cache           | Indefinite (public postcode data, not PII)                                                                                                                    |

### 8.4 Legal

- **Privacy Policy** and **Terms of Service** required before launch. Content TBD (legal review needed).
- **Cookie policy:** N/A (native mobile app, no cookies).
- **Data Processing Agreement (DPA):** Supabase provides a DPA for GDPR compliance. Resend/email provider: ensure DPA is in place.

---

## 9. Infrastructure security

### 9.1 Supabase platform

- Supabase runs on AWS. SOC 2 Type II compliant.
- Database connections encrypted (TLS). Database not directly accessible from the internet (accessed via PostgREST/Realtime APIs).
- Supabase dashboard access: use strong password + 2FA for team members.

### 9.2 CI/CD security

- **GitHub Actions:** Secrets stored as encrypted repository/environment secrets. No secrets in workflow logs.
- **Supabase Branching (PR previews):** Preview databases are isolated. Cleaned up when PR is closed.
- **EAS Build:** Expo EAS handles signing credentials (iOS certificates, Android keystores) securely.
- **Dependency scanning:** Use `npm audit` or Dependabot to detect vulnerable dependencies. Run in CI.

### 9.3 Client security

- **No secrets in client bundle.** Only the Supabase anon key is in the client (this is safe — it's a public key; RLS enforces access control).
- **Deep link validation:** Expo Router deep links should validate parameters to prevent open redirect or injection.
- **Certificate pinning:** Not required for MVP (Supabase uses standard CA certificates). Consider if high-security is needed later.

---

## 10. Security checklist (per feature)

When building a new feature, verify:

- [ ] RLS policies exist for any new tables
- [ ] RLS policies tested (both allow and deny cases)
- [ ] No server-side secrets exposed to the client
- [ ] Input validation on both client and server (DB constraints)
- [ ] Image uploads validated (size, MIME type)
- [ ] New API operations respect authentication requirements
- [ ] Sensitive data (coordinates, email) not leaked to unauthorized users
- [ ] Rate limiting considered for user-facing write operations
- [ ] Error messages don't expose internal details (stack traces, SQL errors)
- [ ] i18n: error messages use translation keys, not hardcoded strings

---

## 11. Security testing

- **RLS policy tests:** Write integration tests that verify RLS policies — test that user A cannot read/write user B's data. Use Supabase test helpers or direct SQL with different auth contexts.
- **Auth flow tests:** E2E tests for login, logout, session expiry, unauthenticated access restrictions.
- **Input validation tests:** Unit tests for validation functions. Integration tests for DB constraint enforcement.
- **Dependency audit:** `npm audit` in CI. Fail build on high/critical vulnerabilities.
- **Manual review:** Security review for new features touching auth, RLS, or PII before merge.

---

_Last updated: 2026-04-06_

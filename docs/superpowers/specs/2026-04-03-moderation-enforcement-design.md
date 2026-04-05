# Moderation reporting & admin enforcement (dashboard) — design

## Overview

Users can report unsuitable **items**, **item photos**, and **chat messages**. Platform enforcement (developer) runs through the **Supabase Dashboard** (SQL / service role) plus a **secured Edge Function** that performs a **hard purge** of the offending user's data—including **deleting their message rows** (not anonymizing)—and **blocks the same OAuth identity** from being used again after `auth.admin.deleteUser`.

This is intentionally **not** the same as **self-service GDPR account deletion** (`delete-account`), which is documented to preserve conversation continuity for the other party; enforcement prioritizes **removal of harmful content** and **account closure**.

## Decisions

| Decision                | Choice                                                                                                                                                  | Rationale                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Admin UX                | **Dashboard + curl** against a secret-protected Edge Function                                                                                           | Accepted for MVP; no in-app moderator UI                                                                                       |
| Reporting targets       | Extend `report_target_type` with **`item_photo`**, **`message`**; keep **`item`**, **`user`**                                                           | Photos and chat lines are first-class report targets                                                                           |
| `target_id`             | UUID of the reported row (`items.id`, `item_photos.id`, `messages.id`, or `profiles.id` for user)                                                       | Matches existing pattern; polymorphic (no FK) — dangling refs handled on enforcement (see purge steps)                         |
| Message handling        | **`DELETE` rows** where `sender_id =` sanctioned user                                                                                                   | Removes body content for other participants; differs from GDPR narrative in `docs/feature-design.md` for **enforcement only**  |
| Ratings on enforcement  | **Delete** ratings where `from_user_id` or `to_user_id` is the sanctioned user                                                                          | Strong removal; optional later policy to anonymize instead                                                                     |
| Re-login / re-register  | **`blocked_oauth_identities`** + **Auth Hook**                                                                                                          | Deleting Auth alone allows a **new** `user_id` on next Google/Apple sign-in; blocklist keys on **provider + provider subject** |
| Auth hook type          | **Before Sign-In** hook via **Postgres function** (not Edge Function, not Before User Created)                                                          | Simple blocklist query, rare event, no network hop needed; fires on every authentication attempt, not just first sign-up       |
| Audit                   | Optional `moderation_enforcement_log` (service-role-only insert)                                                                                        | Supports accountability without exposing PII in `reports` RLS                                                                  |
| Empty conversations     | **Delete** conversations with zero participants and zero messages after purge                                                                           | No user-facing value in empty shells; prevents orphan accumulation                                                             |
| Dangling report targets | **Close** reports whose `target_id` references the sanctioned user's content (set `status = 'closed'`), **delete** reports filed by the sanctioned user | Reports against the user's content are closed (not deleted) to preserve moderation audit trail                                 |
| Group ownership         | **Delete** `group_members` row; if user was sole admin, the group becomes admin-less (acceptable for MVP — future: reassign or archive)                 | Groups are community-managed; edge case is rare and can be handled manually via Dashboard                                      |
| Secret comparison       | Use **constant-time comparison** (`timingSafeEqual`) for `ADMIN_MODERATION_SECRET` validation                                                           | Prevents timing-based secret extraction attacks                                                                                |

## Distinction vs GDPR `delete-account`

| Aspect    | GDPR self-delete (`delete-account`)                                       | Admin enforcement (this spec)                                   |
| --------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Goal      | User-initiated privacy right                                              | Abuse / policy violation                                        |
| Messages  | Product intent: other party still sees thread with "deleted user" styling | **Remove** sanctioned user's messages entirely                  |
| Ratings   | Anonymize authors (scores may remain)                                     | **Delete** rows involving sanctioned user (per table above)     |
| Auth user | Deleted                                                                   | Deleted **after** identities recorded on blocklist              |
| Comeback  | Same person may sign up again as new user                                 | **Blocked** OAuth identities (plus optional email notes in log) |

**Schema constraint note:** `messages.sender_id` and `ratings.from_user_id` / `to_user_id` are nullable (with `ON DELETE CASCADE` from `profiles`). The GDPR `delete-account` path anonymizes these to `NULL`; enforcement deletes rows explicitly for logging/counting. CASCADE from profile deletion serves as a safety net.

## Database schema

### 1. Extend `report_target_type`

Add enum values (new migration):

- `item_photo` — `target_id` → `item_photos.id`
- `message` — `target_id` → `messages.id`

Existing: `item`, `user`.

No RLS change required for MVP: reporters keep **insert** + **select own**; admins use **service role** in Dashboard or via Edge Function.

### 2. New table: `blocked_oauth_identities`

| Column             | Type                                  | Notes                                                          |
| ------------------ | ------------------------------------- | -------------------------------------------------------------- |
| `id`               | uuid PK                               | `gen_random_uuid()`                                            |
| `provider`         | text NOT NULL                         | e.g. `google`, `apple` (match `auth.identities.provider`)      |
| `provider_user_id` | text NOT NULL                         | Provider's stable subject (`identity_id` / `sub` per Supabase) |
| `created_at`       | timestamptz                           | Default `now()`                                                |
| `notes`            | text, nullable                        | Internal: report id, reason code, ticket ref                   |
| **Constraint**     | `UNIQUE (provider, provider_user_id)` | Idempotent inserts                                             |

- **RLS:** Enable RLS; **no** policies for `authenticated` — rows managed only by service role / Edge Function.
- **Index:** Unique constraint already supports lookup by `(provider, provider_user_id)`.

### 3. Optional: `moderation_enforcement_log`

Service-role inserts only: `sanctioned_user_id`, `performed_by` (text: `edge_function`), `created_at`, `reason`, `report_ids` (uuid[] nullable). Not required for MVP if Dashboard discipline is enough.

## Edge Function: `admin-enforce-sanction` (name TBD)

**Not callable from the app.** Invoke from Dashboard, scripts, or internal tooling.

### Authentication

- Require header `x-admin-secret` (or `Authorization: Bearer <secret>`) matching env `ADMIN_MODERATION_SECRET` (long random value, stored in Supabase secrets).
- **Use `timingSafeEqual`** (from `crypto` / Deno `std`) for secret comparison to prevent timing attacks.

### Request body (example)

```json
{ "userId": "<uuid>", "reason": "policy_violation", "relatedReportIds": ["..."] }
```

### Ordered steps (service role)

1. **Validate** secret (constant-time comparison) and parse `userId`.
2. **Load identities** via Auth Admin API (`getUserById` / list identities) for `userId`.
3. **Upsert** `blocked_oauth_identities` for each `(provider, provider_user_id)` before deleting the auth user.
4. **Collect storage paths** — query all storage references before deleting rows:
   - `profiles.avatar_url` for the user → bucket `avatars`.
   - `item_photos.storage_path` for all items owned by user → bucket `item-photos` (path prefix `items/{ownerId}/`).
   - `bike_photos.storage_path` for all bikes owned by user → bucket `item-photos` (path prefix `bikes/{ownerId}/`).
   - `export_requests.storage_path` for the user → bucket `data-exports`.
5. **Delete storage objects** — remove collected paths from their respective buckets (`item-photos`, `avatars`, `data-exports`). Handle 404s gracefully (object may already be deleted on retry).
6. **Data purge** (explicit deletes for logging/counting; CASCADE from profile deletion would also handle most of these):
   - Delete `item_photos` for owned items, then **items** owned by user (cascades `borrow_requests` via FK).
   - Delete `bike_photos` for owned bikes, then **bikes** owned by user.
   - **Delete `messages`** where `sender_id = userId` (do not null out).
   - Delete `conversation_participants` for user, then **delete conversations** that have zero remaining participants and zero messages.
   - **Delete `ratings`** where `from_user_id = userId` OR `to_user_id = userId`.
   - Delete `borrow_requests` where `requester_id = userId` (owner-side requests already cascaded with items above).
   - Delete `export_requests` where `user_id = userId`.
   - Delete `subscriptions` where `user_id = userId`. _(If external payment provider integration exists in the future, cancel/revoke provider-side subscriptions before deleting rows.)_
   - Delete `support_requests`, `saved_locations`, `group_members`, `notifications` for user.
   - **Close reports** whose `target_id` references this user's profile (`target_type = 'user'` and `target_id = userId`): set `status = 'closed'`.
   - **Delete reports** where `reporter_id = userId`.
   - Delete `profiles` row for `userId`.
7. **`auth.admin.deleteUser(userId)`** last.

**Why explicit deletes instead of relying on CASCADE:** The Edge Function needs to (a) collect storage paths before rows are gone, (b) log per-table deletion counts in the response, and (c) handle conversation/report cleanup that CASCADE does not cover. CASCADE from `auth.admin.deleteUser` → `profiles` serves as a safety net for any rows missed above.

### Response

- `200` + summary counts (tables purged, storage objects removed, blocklist entries created) or `400/401/404/500` with safe error messages (no secret leakage).

### Idempotency

- Blocklist upsert is safe to retry (ON CONFLICT DO NOTHING).
- Row deletes no-op on second run (rows already gone).
- **Storage deletions** must handle 404s gracefully — a missing object on retry is not an error.

## Auth Hook

Register a **Before Sign-In** hook implemented as a **Postgres function** (`SECURITY DEFINER`) that queries `blocked_oauth_identities` for the incoming OAuth `provider` + subject.

- If matched, **reject** the session by returning `{ "decision": "reject", "message": "Sign-in not allowed" }` — generic error, no detail that reveals internal block state.
- **Why Postgres function** over Edge Function: the check is a single `SELECT EXISTS` query against a small table — no network hop, no cold-start latency, no additional deployment. Configured in Supabase Dashboard > Auth > Hooks.
- **Why Before Sign-In** over Before User Created: fires on every authentication attempt (not just first sign-up), catching re-auth after partial cleanup, account recreation via different flows, and any future auth method additions.

Without the hook, blocklist is still useful for **manual** processes and future automation, but **does not** stop a fresh OAuth sign-up.

## Client / app work (post-spec)

- **Report UI:** "Report photo" on item gallery, "Report message" on chat bubble, existing item/user flows—each calls `reports` insert with the correct `target_type` / `target_id`.
- **i18n:** Reasons and confirmation copy via `react-i18next`.
- **Tests:** Unit tests for mapping UI targets → report payload; RLS tests that reporters cannot read others' reports (unchanged).

## Documentation updates (when implementing)

- `docs/feature-design.md` — section contrasting **GDPR delete** vs **admin enforcement**.
- `docs/security.md` — moderation, blocklist, secret-handling for the Edge Function, constant-time comparison requirement.
- `docs/datamodel.md` — new enum values, `blocked_oauth_identities`, and `moderation_enforcement_log`.

## Testing

- **Edge Function:** Deno tests or integration test with local Supabase:
  - Secret rejection (wrong secret → 401).
  - Constant-time comparison (no timing variance observable in tests — implementation review).
  - Happy path purge — all tables cleaned, storage objects removed, blocklist written before auth delete.
  - Second invocation is idempotent (no errors on already-purged user).
  - Storage 404s handled gracefully on retry.
  - Empty conversations deleted after participant/message removal.
  - Reports against user's content closed (not deleted).
- **RLS:** Existing reporter policies still hold; no new client read of blocklist.
- **Auth Hook:** Integration test with blocked identity — sign-in rejected with generic error.

## Open points (non-blocking)

- **Apple / relay emails:** Prefer **provider + subject** over email for blocklist reliability.
- **Legal retention:** Whether to retain minimal audit rows for disputes (jurisdiction-dependent).
- **Group admin succession:** For MVP, groups losing their sole admin are acceptable (manual Dashboard fix). Future: auto-reassign or archive empty-admin groups.
- **Subscription provider sync:** If external payment providers are added later, enforce cancellation before row deletion.

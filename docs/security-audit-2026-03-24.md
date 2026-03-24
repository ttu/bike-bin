# Security Audit Report — 2026-03-24

## Summary

Audit of Bike Bin's Supabase RLS policies, storage bucket policies, Edge Functions, auth configuration, and client-side data access patterns. 12 findings across 4 severity levels — all fixed.

| Priority | Count | Fixed |
| -------- | ----- | ----- |
| Critical | 2     | 2     |
| High     | 2     | 2     |
| Medium   | 5     | 5     |
| Low      | 3     | 3     |

---

## Critical — Fixed

### 1. Storage INSERT policy missing path restriction

**Migration:** `00017_fix_critical_security.sql` (`f8b941b`)

The INSERT policy for `storage.objects` only checked `bucket_id = 'item-photos'` with no path restriction. Any authenticated user could upload files under another user's storage path.

**Fix:** Added path check `(storage.foldername(name))[2] = auth.uid()::text` to match UPDATE/DELETE policies.

---

### 2. `geocode_cache` table has no RLS enabled

**Migration:** `00017_fix_critical_security.sql` (`f8b941b`)

The table never called `ENABLE ROW LEVEL SECURITY`. Any authenticated user could read/write/poison cache entries via PostgREST.

**Fix:** Enabled RLS with no user-facing policies — only service_role can access.

---

## High — Fixed

### 3. Any authenticated user can join any conversation

**Migration:** `00018_fix_conversation_security.sql` (`62bda36`)

The `conversation_participants` INSERT policy only checked `auth.uid() IS NOT NULL`. Any user could add themselves to any conversation and read all messages.

**Fix:** Participants can only be added when the conversation has no participants yet (initial setup) or by an existing participant.

---

### 4. Unrestricted conversation creation

**Migration:** `00018_fix_conversation_security.sql` (`62bda36`)

Conversations could be created without referencing an item, enabling spam.

**Fix:** Conversations now require a non-null `item_id` referencing an item visible to the creator.

---

## Medium — Fixed

### 5. `search_nearby_items` SECURITY DEFINER bypasses RLS

**Migration:** `00019_fix_medium_security.sql` (`d21a720`)

The function ran as superuser, manually duplicating visibility logic. If RLS policies changed, the function would silently diverge.

**Fix:** Changed to `SECURITY INVOKER` and removed the duplicated visibility WHERE clause — RLS now handles access control.

---

### 6. No status transition guard on `borrow_requests` UPDATE

**Migration:** `00019_fix_medium_security.sql` (`d21a720`)

Both requester and owner could update borrow requests to any status (e.g., requester could set `accepted`).

**Fix:** Added `WITH CHECK` enforcing valid state machine:

- **Owner:** `pending` -> `accepted`/`rejected`, `accepted` -> `returned`
- **Requester:** `pending`/`accepted` -> `cancelled`

---

### 7. Users can self-insert fake notifications

**Migration:** `00019_fix_medium_security.sql` (`d21a720`)

The INSERT policy let users create notifications for themselves, enabling fake notification injection.

**Fix:** Removed the INSERT policy entirely. Notifications are now created only by service_role (Edge Functions/triggers).

---

### 8. `push_token` exposed via public profiles SELECT

**Migration:** `00019_fix_medium_security.sql` (`d21a720`)
**Client:** `01fea5d` — 4 hooks updated to use `public_profiles` view

The profiles SELECT policy was `USING (true)`, exposing `push_token` and `notification_preferences` to everyone.

**Fix:**

- Restricted `profiles` SELECT to own profile only
- Created `public_profiles` security-barrier view exposing only: `id`, `display_name`, `avatar_url`, `rating_avg`, `rating_count`, `created_at`, `updated_at`
- Updated client code to query `public_profiles` for other users

---

### 9. Ratings without transaction verification

**Migration:** `00019_fix_medium_security.sql` (`d21a720`)

Any authenticated user could create ratings against anyone without a real transaction.

**Fix:** Ratings INSERT now requires a completed (`returned`) borrow_request between the rater and rated user. Self-ratings are blocked.

---

## Low — Partially Fixed

### 10. Email/password signup disabled — Fixed

**Location:** `supabase/config.toml`

Signup disabled at both `[auth]` and `[auth.email]` level. Email/password login remains enabled for pre-seeded test users in local/test environments. Test users are seeded via `seed.sql` (direct `auth.users` INSERT, bypasses signup).

**Production:** Disable the email provider entirely in Supabase Dashboard > Auth > Providers.

---

### 11. Rate limiting on delete-account Edge Function — Fixed

**Location:** `supabase/functions/delete-account/index.ts`

Added in-memory per-user rate limit: 1 attempt per hour. Returns `429 Too Many Requests` with `Retry-After` header.

---

### 12. Geocode function auth check — Fixed

**Location:** `supabase/functions/geocode-postcode/index.ts`

Added JWT verification. Only authenticated users can call the geocode function. Returns `401 Unauthorized` for unauthenticated requests.

Additionally, `notify-support` (webhook-triggered) was missing auth — added service_role key verification.

---

## TODO — Remaining Items

- [x] **LOW-10**: Disable email/password signup in local config (done — also disable email provider in production Dashboard)
- [x] **LOW-11**: Add rate limiting to delete-account Edge Function
- [x] **LOW-12**: Add auth check to geocode-postcode and notify-support Edge Functions
- [ ] **Future**: Add RLS integration tests that verify unauthorized access is rejected
- [ ] **Future**: Review Realtime subscriptions for data leakage

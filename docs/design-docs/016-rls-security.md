# RLS & Security

## Overview

All database tables use Row Level Security (RLS) enforced at the PostgreSQL level. Security is not enforced on the client — the database is the single source of truth. Authentication uses Supabase Auth with Google and Apple OAuth. RLS policies use `auth.uid()` to identify the current user.

## Authentication Model

- **Providers:** Google OAuth, Apple OAuth (no email/password)
- **Session management:** Supabase client SDK handles tokens
- **User identity:** `auth.uid()` maps to `profiles.id`
- **Auto-profile creation:** Database trigger creates a `profiles` row on user signup

## RLS Policy Inventory

### profiles

| Policy                   | Operation | Rule                                                              |
| ------------------------ | --------- | ----------------------------------------------------------------- |
| `profiles_select_public` | SELECT    | All profiles readable by all authenticated users (`USING (true)`) |
| `profiles_select_own`    | SELECT    | Users can read own profile (added in migration 00019)             |
| `profiles_insert_own`    | INSERT    | `auth.uid() = id`                                                 |
| `profiles_update_own`    | UPDATE    | `auth.uid() = id`                                                 |
| `profiles_delete_own`    | DELETE    | `auth.uid() = id`                                                 |

### saved_locations

| Policy                       | Operation | Rule                   |
| ---------------------------- | --------- | ---------------------- |
| `saved_locations_select_own` | SELECT    | `auth.uid() = user_id` |
| `saved_locations_insert_own` | INSERT    | `auth.uid() = user_id` |
| `saved_locations_update_own` | UPDATE    | `auth.uid() = user_id` |
| `saved_locations_delete_own` | DELETE    | `auth.uid() = user_id` |

### items

| Policy                                   | Operation | Rule                                                                                                    |
| ---------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `items_select_public`                    | SELECT    | `visibility = 'all'` OR owner OR group member (via item_groups + group_members join)                    |
| `items_insert_own`                       | INSERT    | `auth.uid() = owner_id`                                                                                 |
| `items_update_own`                       | UPDATE    | `auth.uid() = owner_id` AND status NOT IN (loaned, reserved)                                            |
| `items_update_owner_release_borrow_lock` | UPDATE    | `auth.uid() = owner_id`; row currently loaned/reserved; **new** row status = `stored` (migration 00029) |
| `items_delete_own`                       | DELETE    | `auth.uid() = owner_id` AND status NOT IN (loaned, reserved)                                            |

**Borrow-locked edits (loaned / reserved):** Permissive RLS OR-combines `WITH CHECK` across policies, so an extra policy that only allows release to `stored` would still allow unrelated column changes while the row stays loaned. Migration **00029** adds trigger `trg_items_enforce_borrow_locked_update` (`enforce_item_no_edits_while_borrow_locked`) so that if status stays `loaned` or `reserved`, only `updated_at` may differ from the previous row.

### item_photos

| Policy                        | Operation | Rule                                                |
| ----------------------------- | --------- | --------------------------------------------------- |
| `item_photos_select_via_item` | SELECT    | Parent item is visible (mirrors items SELECT logic) |
| `item_photos_insert_own`      | INSERT    | Parent item owned by user                           |
| `item_photos_update_own`      | UPDATE    | Parent item owned by user                           |
| `item_photos_delete_own`      | DELETE    | Parent item owned by user                           |

### bikes

| Policy             | Operation | Rule                    |
| ------------------ | --------- | ----------------------- |
| `bikes_select_own` | SELECT    | `auth.uid() = owner_id` |
| `bikes_insert_own` | INSERT    | `auth.uid() = owner_id` |
| `bikes_update_own` | UPDATE    | `auth.uid() = owner_id` |
| `bikes_delete_own` | DELETE    | `auth.uid() = owner_id` |

### bike_photos

Follows same pattern as item_photos — parent bike must be owned by user.

### groups

| Policy                        | Operation | Rule                                 |
| ----------------------------- | --------- | ------------------------------------ |
| `groups_select`               | SELECT    | `is_public = true` OR user is member |
| `groups_insert_authenticated` | INSERT    | Any authenticated user               |
| `groups_update_admin`         | UPDATE    | User is admin member of the group    |
| `groups_delete_admin`         | DELETE    | User is admin member of the group    |

### group_members

| Policy                       | Operation | Rule                                    |
| ---------------------------- | --------- | --------------------------------------- |
| `group_members_select`       | SELECT    | Own row, public group, or co-member     |
| `group_members_insert`       | INSERT    | Self-join OR admin can add others       |
| `group_members_update_admin` | UPDATE    | Admin of the group                      |
| `group_members_delete`       | DELETE    | Self-removal OR admin can remove others |

### item_groups

| Policy                     | Operation | Rule                       |
| -------------------------- | --------- | -------------------------- |
| `item_groups_select`       | SELECT    | Item owner OR group member |
| `item_groups_insert_owner` | INSERT    | Item owner                 |
| `item_groups_delete_owner` | DELETE    | Item owner                 |

### borrow_requests

| Policy                   | Operation | Rule                                                             |
| ------------------------ | --------- | ---------------------------------------------------------------- |
| `borrow_requests_select` | SELECT    | Requester OR item owner                                          |
| `borrow_requests_insert` | INSERT    | `auth.uid() = requester_id` AND not own item                     |
| `borrow_requests_update` | UPDATE    | Requester OR item owner (same for `WITH CHECK`; migration 00030) |

**Status transitions:** Migration **00019** added a `WITH CHECK` that compared “old” status using column references that, in PostgreSQL, resolve to the **new** row — so every transition failed (403 from PostgREST). Migration **00030** replaces that with a simple owner/requester `WITH CHECK` and enforces the state machine in trigger `trg_borrow_requests_enforce_update_rules` (`borrow_requests_enforce_update_rules`): e.g. owner pending→accepted/rejected, requester pending→cancelled, owner accepted→returned, requester accepted→cancelled; `item_id` / `requester_id` immutable; terminal statuses cannot change.

### conversations

| Policy                               | Operation | Rule                                                |
| ------------------------------------ | --------- | --------------------------------------------------- |
| `conversations_select`               | SELECT    | User is participant (via conversation_participants) |
| `conversations_insert_authenticated` | INSERT    | Any authenticated user                              |

### conversation_participants

| Policy                                           | Operation | Rule                      |
| ------------------------------------------------ | --------- | ------------------------- |
| `conversation_participants_select`               | SELECT    | Own row OR co-participant |
| `conversation_participants_insert_authenticated` | INSERT    | Any authenticated user    |

### messages

| Policy            | Operation | Rule                                                          |
| ----------------- | --------- | ------------------------------------------------------------- |
| `messages_select` | SELECT    | User is conversation participant                              |
| `messages_insert` | INSERT    | `auth.uid() = sender_id` AND user is conversation participant |

### ratings

| Policy                         | Operation | Rule                                  |
| ------------------------------ | --------- | ------------------------------------- |
| `ratings_select_public`        | SELECT    | All ratings public (`USING (true)`)   |
| `ratings_insert_authenticated` | INSERT    | `auth.uid() = from_user_id`           |
| `ratings_update_own`           | UPDATE    | Own rating AND within editable window |
| `ratings_delete_own`           | DELETE    | Own rating                            |

### notifications

| Policy                     | Operation | Rule                   |
| -------------------------- | --------- | ---------------------- |
| `notifications_select_own` | SELECT    | `auth.uid() = user_id` |
| `notifications_insert_own` | INSERT    | `auth.uid() = user_id` |
| `notifications_update_own` | UPDATE    | `auth.uid() = user_id` |
| `notifications_delete_own` | DELETE    | `auth.uid() = user_id` |

### support_requests

| Policy                        | Operation | Rule                                                         |
| ----------------------------- | --------- | ------------------------------------------------------------ |
| `support_requests_insert`     | INSERT    | `user_id IS NULL OR auth.uid() = user_id` (allows anonymous) |
| `support_requests_select_own` | SELECT    | `auth.uid() = user_id`                                       |

### reports

| Policy                         | Operation | Rule                       |
| ------------------------------ | --------- | -------------------------- |
| `reports_insert_authenticated` | INSERT    | `auth.uid() = reporter_id` |
| `reports_select_own`           | SELECT    | `auth.uid() = reporter_id` |

## Security Patterns

### Ownership Pattern

Most tables use `auth.uid() = <owner_column>` for all CUD operations. Simple and effective.

### Visibility Pattern (Items)

Three-tier visibility: private (owner only) → groups (group members) → all (public). The SELECT policy uses OR logic with an EXISTS subquery for group membership.

### Delegated Access (Photos)

Photo policies delegate to parent entity (item/bike) ownership via EXISTS subqueries.

### Role-Based Access (Groups)

Admin operations check `role = 'admin'` in group_members via EXISTS subqueries.

### Status Guards (Items)

DELETE is blocked when status is `loaned` or `reserved`. **UPDATE** while loaned/reserved is limited: owners may set status to `stored` (return / release) via `items_update_owner_release_borrow_lock`; other edits while the row stays borrow-locked are blocked by `trg_items_enforce_borrow_locked_update` (see items table above).

## Integration Testing

### Architecture

- **Admin client:** bypasses RLS for setup/cleanup
- **User-scoped clients:** subject to RLS for assertions
- **Isolation:** each suite creates its own users and rows
- **Environment:** local Supabase only

### Test domains

7 security domains tested: ownership, inventory, groups, borrowing, messaging, community, infrastructure.

### Configuration

- `jest.rls.config.js` — dedicated Jest config
- `npm run test:rls` — separate npm script (not in default test run)
- Tests in `src/test/__tests__/rls/`

### Assertion patterns

- **Blocked read:** empty result set (RLS silently filters)
- **Blocked write:** PostgreSQL permission error
- **Allowed path:** data matches expected result for acting user

## Known Gaps & Limitations

- **Conversation creation chicken-and-egg:** INSERT requires authenticated user but SELECT requires being a participant — conversation creator can't see it until participants are added.
- **Tags privacy:** Tags column is technically readable via item SELECT policies even by non-owners. Privacy enforced by not exposing tags in search/public APIs.
- **Notification INSERT:** Currently allows users to insert their own notifications, but in practice notifications should be created by server-side triggers/functions.

## Current Status

- **Implemented:** RLS on all 17 tables, comprehensive policy set covering CRUD operations
- **Tested:** Integration tests across 7 security domains with local Supabase
- **Migrations:** Base policies in 00004, fixes in 00010 (item_groups recursion), 00019 (medium security fixes), 00029 (items release from loan + borrow-lock trigger), 00030 (borrow_requests update policy + transition trigger)

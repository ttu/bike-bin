# RLS integration tests — design

## Purpose

Verify **Row Level Security** policies by exercising the real database: an **admin-capable client** seeds and tears down data, while **user-scoped clients** (anon key + user JWT) attempt reads and writes. Tests assert that unauthorized access is **silent empty reads** or **permission errors** as appropriate for Postgres/PostgREST.

This closes the gap: “RLS exists” is not enough; we need evidence that cross-user access fails in practice.

## Architecture

- **Two client roles:** one bypasses RLS for setup and cleanup; the other is subject to RLS for assertions.
- **Isolation:** each suite creates its own users and rows and cleans up afterward so order independence holds.
- **Environment:** runs against **local Supabase** only; CI or developers start the stack before the RLS job.

## Coverage by domain

Group tests by **security domain**, not by file layout:

| Domain         | What to prove (examples)                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Ownership      | Users only see and mutate their own profile-adjacent rows (e.g. profile, bikes, saved locations).          |
| Inventory      | Public vs private vs group visibility; photos follow item visibility; cannot create items as another user. |
| Groups         | Public vs private groups; admin-only mutations; members see group-scoped items; non-members do not.        |
| Borrowing      | Only parties to a request see it; invalid transitions rejected.                                            |
| Messaging      | Only participants read/send; cannot attach conversations to invisible items.                               |
| Community      | Ratings eligibility; notifications/reports/support visible only as policy allows.                          |
| Infrastructure | Shared caches and storage paths deny cross-tenant access.                                                  |

## Assertion patterns

- **Blocked read:** result set empty where RLS filters rows out.
- **Blocked write:** operation fails with a permission-related error.
- **Allowed path:** data matches expectation for the acting user.

## Test harness (conceptual)

- Helpers create test identities and return authenticated clients; cleanup removes seeded data and users after the suite.

## Tooling

- **Dedicated npm script** for RLS tests so the default unit run does not require a live database.
- **Jest** excludes the RLS path from the default test glob so `npm test` stays usable without Supabase.
- **No new dependencies** beyond the existing Supabase client.

## Configuration drift

When `package.json` or Jest config gains a new RLS entry point, treat it as part of this design: same isolation rules, same local-only assumption.

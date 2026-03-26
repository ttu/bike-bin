# Exclude own items from search — feature design

## Problem

Search results list the current user’s own items alongside everyone else’s. For “find parts near me,” seeing your own listings is usually noise.

## Decision

Apply an **optional filter** on the search RPC so the caller can ask the database to **omit rows owned by a given user**. This is a **UX preference**, not a security boundary: owners can still open their items from Inventory or direct links.

## Behavior

- The search entry point accepts an optional **“exclude this owner”** argument. When set, results must not include items whose owner matches that id. When unset, behavior stays backward compatible (no exclusion).
- The app passes the **signed-in user’s id** when searching so their own listings disappear from Search. Anonymous search leaves exclusion unset.
- Cache keys for search must account for **which user** is searching so results do not leak across sessions.

## Alternatives considered

- **Client-side filter only:** Wastes bandwidth and complicates pagination; filtering at the source keeps result sets honest.

## Testing (intent)

- Verify the search integration passes the exclusion when a user is logged in and does not break anonymous search.

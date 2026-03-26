# Item tags — feature design

**Date:** 2026-03-24  
**Status:** Approved

## Overview

Owners can attach **private, free-text tags** to their items to organize personal inventory. Tags are **not** shown to other users and **not** included in marketplace search results. The inventory screen supports **filtering by tag** and **autocomplete** from tags the user has used before.

## Requirements

- Free-text tags on any item the user owns; casing and internal spaces preserved (e.g. `"My Oldie Stuff"`).
- Tags are private: never surfaced on public listing or search result payloads intended for other users.
- Inventory list can be filtered by one or more tags (OR within tags; combined with text search using AND).
- When typing a new tag, suggest previously used tags (distinct values from that user’s items).

## Technical decisions

### Storage model

- Store tags as an **array of strings on the item row** so existing item RLS and ownership rules apply without a separate tagging table.
- Enforce **maximum count** and **maximum length per tag** and **no empty strings** at the database layer so API clients cannot bypass limits.
- Use an **inverted index** suited to “array contains” filtering for owner-scoped inventory queries.

### Autocomplete

- The client needs a **distinct list of tags** for the current user. Exposing a small **RPC** scoped to `auth.uid()` avoids leaking other users’ tags and keeps the query expressible with standard policies.

### Privacy

- **Accepted trade-off:** the tags column may still be readable under generic item SELECT policies if those policies expose row data to non-owners in edge cases. The product contract is that **no client or search API** exposes tags to non-owners. If stricter isolation is required later, introduce a view or column-level exposure for public queries.

### Client behavior

- **Deduplication when adding:** reject duplicates case-insensitively while **storing** the user’s original casing.
- **Filtering:** OR across selected tag chips; AND with the existing text query. Filtering can be **client-side** on the owner’s inventory list if the dataset is already loaded for that screen.

### Internationalization

- User-visible labels and placeholders for tags live in the inventory namespace (no hardcoded strings in UI).

### Testing (intent)

- Cover deduplication rules, hook/RPC behavior for distinct tags, and inventory filtering UX at the level appropriate to the stack (unit vs integration).

## Out of scope

- Global tag management (rename/delete across all items).
- Public or shared tag taxonomies.
- Tag-based discovery in Search.
- Curated suggestions, colors, or icons for tags.

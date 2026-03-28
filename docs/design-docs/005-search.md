# Search

## Overview

Discovery feature for finding bike parts, tools, and bikes from nearby cyclists. Uses PostGIS distance-based search via a Supabase RPC (`search_nearby_items`), with filters for category, condition, offer type, price range, group, distance, and sort order. Own items are excluded from results at the database level. Search also includes a listing detail view with owner info, photos, and action buttons.

## Data Model

Search reads from existing tables — no dedicated search tables. Key database functions:

- **`search_nearby_items` RPC** — PostGIS proximity search with optional text query, category/condition filters, distance limit, and owner exclusion. Returns items with distance in meters.
- **`get_listing_detail` RPC** — Returns a single item with joined owner profile, location area name, and distance.

Search results join data from: `items`, `profiles` (owner info), `saved_locations` (area names), `item_photos` (thumbnails).

### Own-items exclusion

The `search_nearby_items` RPC accepts an optional "exclude owner" parameter. The app passes the signed-in user's ID so their own listings are excluded. Anonymous search leaves this unset. This is a UX preference, not a security boundary.

## Architecture

```
src/features/search/
├── components/
│   ├── FilterSheet/
│   │   └── FilterSheet.tsx          # Bottom sheet with filter controls
│   ├── ListingDetail/
│   │   └── ListingDetail.tsx        # Full listing view (detail screen)
│   ├── SearchBar/
│   │   └── SearchBar.tsx            # Search input with filter badge
│   ├── SearchResultCard/
│   │   └── SearchResultCard.tsx     # List-style result card
│   └── SearchResultGridCard/
│       └── SearchResultGridCard.tsx # Grid-style result card
├── hooks/
│   ├── useSearchItems.ts            # Main search query (RPC + client-side filtering)
│   ├── useSearchFilters.ts          # Filter state context + provider
│   └── useListingDetail.ts          # Single listing detail query
├── types.ts                          # SearchFilters, SearchResultItem, sort options, distance presets
└── index.ts                          # Public API
```

### SearchFilters type

```typescript
interface SearchFilters {
  query: string;
  maxDistanceKm: number; // Default: 25
  categories: ItemCategory[];
  conditions: ItemCondition[];
  offerTypes: AvailabilityType[];
  priceMin?: number;
  priceMax?: number;
  groupId?: GroupId;
  sortBy: SearchSortOption; // 'distance' | 'newest' | 'recently_available'
}
```

Distance presets: 5, 10, 25, 50, 100 km.

### useSearchItems

1. Calls `search_nearby_items` RPC with user's primary location coordinates
2. Fetches owner profiles for unique owner IDs (batch)
3. Fetches area names for pickup location IDs (batch)
4. Fetches thumbnail paths for result items (batch)
5. Applies client-side filters for multi-value category/condition, offer types, price range
6. Applies client-side sorting (distance is default from RPC, newest/recently_available sorted client-side)
7. Only fires when query is non-empty; stale time: 1 minute

### SearchFiltersProvider

React context managing filter state. Provides `updateFilters`, `resetFilters`, and `hasActiveFilters` (tracks whether any filter deviates from defaults, excluding query text).

## Screens & Navigation

| Route                     | Screen         | Purpose                                       |
| ------------------------- | -------------- | --------------------------------------------- |
| `(tabs)/search/index.tsx` | Search         | Main search with results grid/list            |
| `(tabs)/search/[id].tsx`  | Listing Detail | Full listing with photos, owner card, actions |

## Key Flows

### Searching for Items

1. User types in search bar → query updates in SearchFiltersContext
2. `useSearchItems` fires RPC with location + filters
3. Results displayed as grid/list cards with distance, price, availability chips
4. User can adjust filters via FilterSheet or quick filter chips (Borrow/Donate/Sell)
5. Sort: closest first (default), newest, recently available

### Viewing a Listing

1. User taps result card → navigates to `search/[id]`
2. `useListingDetail` calls `get_listing_detail` RPC
3. Shows photos, item details, owner card (name, avatar, rating)
4. Action buttons: "Request Borrow", "Contact" (starts conversation), sign-in prompt for guests

## RLS & Security

Search relies on item SELECT policies — only items with `visibility = 'all'` appear in public search results. Group-scoped items are visible to group members only.

Own-item exclusion is handled at the RPC level, not RLS — it's a UX filter, not a security boundary.

## i18n

Namespace: `search`

Key areas: `empty.*` / `noResults.*` (empty states), `results.*` (count, sort labels), `quickFilter.*` (chip labels), `filter.*` (filter sheet), `distance.*` (distance formatting), `category.*` / `condition.*` / `availability.*` (filter option labels), `listing.*` (detail screen, owner card, actions).

## Current Status

- **Implemented:** PostGIS proximity search, text query, category/condition/offer/price filters, distance presets, sort options, own-item exclusion, listing detail with photos and owner info, contact action, batch profile/location/thumbnail fetching
- **Working:** Full search flow with grid/list results, filter sheet, quick filter chips
- **Limitations:** Only single category/condition passed to RPC (multi-value filtered client-side), limit of 50 results per query (no pagination)

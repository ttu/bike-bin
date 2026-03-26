# Hide terminal items from inventory — feature design

**Date:** 2026-03-26  
**Status:** Approved

## Problem

Items in **terminal** lifecycle states (no longer actively in the user’s possession or available for normal actions) clutter the default inventory list.

## Definition

**Terminal statuses** are those that represent a closed or inactive row for list purposes: archived, sold, and donated (exact enum names follow the product model). Non-terminal statuses remain visible by default.

## Decision

- **Default:** hide terminal items in the inventory list.
- **Toggle:** when at least one terminal item exists in the current filtered set, show a filter control (e.g. chip) that reveals them, with a **count** in the label.
- **Reset:** if filters change such that no terminal items remain in the working set, turn the “show terminal” option off so the UI does not imply hidden items still exist.
- **Counts:** any “N items” hint on the screen should match what the user actually sees after status filtering.

**Where filtering runs:** **Client-side** on the full inventory payload for this screen. Personal inventory size is expected to stay small, so fetching terminal rows and hiding them in the UI avoids extra query variants and cache branches. Revisit server-side filtering if lists become large or pagination is introduced.

## User-facing copy

- Label communicates inactive items and includes the count (translated string with interpolation).

## Alternatives considered

- **Server-side only:** more moving parts for cache keys and little gain at current scale.
- **One chip per terminal status:** unnecessary; the three states share “no longer active” semantics.

## Testing (intent)

- Terminal rows hidden by default; chip reveals them; chip hidden when none apply; count matches; toggle resets when the filtered set no longer contains terminal items.

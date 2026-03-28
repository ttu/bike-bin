# Locations

## Overview

Users manage saved locations (pickup points) identified by postcode. Postcodes are geocoded to coordinates via Nominatim for PostGIS distance calculations. Each location has a label, area name, and a primary flag. The primary location is used as the center point for search distance calculations. Only the area name is shown publicly — exact coordinates are never exposed to other users.

## Data Model

### saved_locations table

| Column      | Type                   | Description                             |
| ----------- | ---------------------- | --------------------------------------- |
| id          | uuid (PK)              | LocationId branded type                 |
| user_id     | uuid (FK → profiles)   | Owner                                   |
| postcode    | text                   | Original postcode input                 |
| label       | text                   | User label (e.g., "Home", "Workshop")   |
| area_name   | text                   | Geocoded area name (displayed publicly) |
| coordinates | geography(Point, 4326) | PostGIS point for distance calc         |
| is_primary  | boolean                | Primary location flag                   |
| created_at  | timestamptz            | Creation timestamp                      |

### geocode_cache table

| Column     | Type             | Description        |
| ---------- | ---------------- | ------------------ |
| id         | uuid (PK)        | Cache entry ID     |
| postcode   | text             | Postcode key       |
| area_name  | text             | Resolved area name |
| latitude   | double precision | Latitude           |
| longitude  | double precision | Longitude          |
| created_at | timestamptz      | Cache timestamp    |

Server-side cache for Nominatim geocoding results to avoid repeated API calls.

## Architecture

```
src/features/locations/
├── components/
│   ├── LocationCard/
│   │   └── LocationCard.tsx        # Location list card with area, postcode, primary badge
│   └── LocationForm/
│       └── LocationForm.tsx        # Create/edit form with postcode geocoding
├── hooks/
│   ├── useLocations.ts             # List user's locations
│   ├── useCreateLocation.ts        # Create with geocoding
│   ├── useUpdateLocation.ts        # Update location
│   ├── useDeleteLocation.ts        # Delete (blocked if last or has items)
│   └── usePrimaryLocation.ts       # Get user's primary location
├── utils/
│   └── geocoding.ts                # geocodePostcode(), GeocodeError
├── types.ts                         # CreateLocationInput, UpdateLocationInput
└── index.ts                         # Public API
```

### Geocoding

`geocodePostcode(postcode)` resolves a postcode to `{ latitude, longitude, areaName }`. Uses the geocode cache (Supabase edge function or server-side) to avoid hitting Nominatim directly. Throws `GeocodeError` on failure.

### Delete guards

- Cannot delete the user's only saved location
- Cannot delete a location that has items assigned to it (via `pickup_location_id`)

## Screens & Navigation

| Route                          | Screen          | Purpose                                       |
| ------------------------------ | --------------- | --------------------------------------------- |
| `(tabs)/profile/locations.tsx` | Saved Locations | List of user's locations with add/edit/delete |

Also used in onboarding (`(onboarding)/location.tsx`).

## Key Flows

### Adding a Location

1. User enters postcode → auto-geocoded on blur
2. Area preview shown (e.g., "Your area: Kamppi, Helsinki")
3. User adds label → saves
4. `useCreateLocation` stores postcode, coordinates, area_name, label, is_primary

### Setting Primary Location

- Exactly one location is primary at a time
- Primary location determines the center for search distance calculations

## i18n

Namespace: `locations`

Key areas: `empty.*` (empty state), `form.*` (form labels, geocoding status), `card.*` (card labels), `delete.*` (delete confirmations, guards), `errors.*` (validation, geocode failure), `onboarding.*` (onboarding-specific labels).

## Current Status

- **Implemented:** Full CRUD, postcode geocoding, area name display, primary location, delete guards, privacy (coordinates hidden)
- **Working:** Geocoding with cache, primary location for search

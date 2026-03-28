# Bikes

## Overview

Users can register their bikes and track which parts (items) are mounted on each bike. Bikes have a type (road, gravel, MTB, city, touring, other), brand, model, year, and photos. Parts are attached/detached via the mounted parts system, which updates the item's `bike_id` and sets its status to "mounted".

## Data Model

### bikes table

| Column     | Type                 | Description                             |
| ---------- | -------------------- | --------------------------------------- |
| id         | uuid (PK)            | BikeId branded type                     |
| owner_id   | uuid (FK → profiles) | Bike owner                              |
| name       | text                 | Bike name                               |
| brand      | text                 | Manufacturer                            |
| model      | text                 | Model name                              |
| type       | bike_type enum       | road, gravel, mtb, city, touring, other |
| year       | integer              | Year of manufacture                     |
| created_at | timestamptz          | Creation timestamp                      |
| updated_at | timestamptz          | Last update timestamp                   |

### bike_photos table

| Column       | Type              | Description           |
| ------------ | ----------------- | --------------------- |
| id           | uuid (PK)         | Photo ID              |
| bike_id      | uuid (FK → bikes) | Parent bike           |
| storage_path | text              | Supabase Storage path |
| sort_order   | integer           | Display order         |
| created_at   | timestamptz       | Upload timestamp      |

### Relationship with items

Items have a `bike_id` FK to bikes (ON DELETE SET NULL). When a part is attached to a bike, `bike_id` is set and `status` changes to "mounted". Deleting a bike sets `bike_id = NULL` on all attached items.

## Architecture

```
src/features/bikes/
├── components/
│   ├── BikeCard/
│   │   └── BikeCard.tsx             # List card with thumbnail
│   ├── BikeForm/
│   │   └── BikeForm.tsx             # Create/edit form
│   └── MountedParts/
│       └── MountedParts.tsx         # Mounted parts list with attach/detach
├── hooks/
│   ├── useBikes.ts                  # CRUD queries + mutations
│   ├── useBikePhotoUpload.ts        # Photo upload to Storage
│   ├── useMountedParts.ts           # Query items where bike_id matches
│   ├── useAttachPart.ts             # Attach item to bike (set bike_id + status)
│   └── useDetachPart.ts             # Detach item from bike
├── utils/
│   ├── mapBikeRow.ts                # Row → Bike model mapper
│   └── mapBikePhotoRow.ts           # Row → BikePhoto model mapper
├── types.ts                          # BikeFormData interface
└── index.ts                          # Public API
```

### Key hooks

- **useBikes()** — fetches all user's bikes with thumbnails
- **useBike(id)** — fetches single bike
- **useBikePhotos(bikeId)** — fetches photos ordered by sort_order
- **useCreateBike() / useUpdateBike() / useDeleteBike()** — CRUD mutations
- **useMountedParts(bikeId)** — queries items where `bike_id` matches
- **useAttachPart()** — sets `bike_id` + status to "mounted" on an item
- **useDetachPart()** — clears `bike_id` on an item

## Screens & Navigation

| Route                                  | Screen      | Purpose                           |
| -------------------------------------- | ----------- | --------------------------------- |
| `(tabs)/inventory/bikes/index.tsx`     | Bike List   | Grid of user's bikes              |
| `(tabs)/inventory/bikes/[id].tsx`      | Bike Detail | Photos, specs, mounted parts list |
| `(tabs)/inventory/bikes/new.tsx`       | New Bike    | Bike creation form                |
| `(tabs)/inventory/bikes/edit/[id].tsx` | Edit Bike   | Bike edit form                    |

Bikes are nested under the inventory tab navigation.

## Key Flows

### Attaching a Part

1. User views bike detail → taps "Attach Part"
2. Modal shows stored items (not already mounted) available to attach
3. User selects item → `useAttachPart` sets `bike_id` and `status = mounted`
4. Part appears in mounted parts list, disappears from "stored" items

### Detaching a Part

1. User taps "Detach" on a mounted part
2. Confirmation dialog → `useDetachPart` clears `bike_id`
3. Item status reverts, part disappears from mounted list

### Deleting a Bike

- Bike deletion sets `bike_id = NULL` on all attached items (DB FK ON DELETE SET NULL)
- Invalidates both bikes and items query caches

## i18n

Namespace: `bikes`

Key areas: `bikeType.*` (type labels), `form.*` (field labels, validation), `detail.*` (detail screen), `confirm.*` (delete/detach confirmations).

## Current Status

- **Implemented:** Full CRUD, photo upload, mounted parts tracking with attach/detach, bike types, form validation
- **Working:** All flows including cascading detach on bike deletion

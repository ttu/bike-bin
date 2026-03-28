# Ratings

## Overview

Post-transaction rating system. After a borrow, donate, or sell transaction, users can rate each other with 1-5 stars and an optional text comment. Ratings have a 14-day edit window after creation. User ratings are aggregated (average + count) on the profile for trust signals.

## Data Model

### ratings table

| Column           | Type                  | Description            |
| ---------------- | --------------------- | ---------------------- |
| id               | uuid (PK)             | Rating ID              |
| rater_id         | uuid (FK → profiles)  | User giving the rating |
| rated_id         | uuid (FK → profiles)  | User being rated       |
| item_id          | uuid (FK → items)     | Transaction item       |
| transaction_type | transaction_type enum | borrow, donate, sell   |
| score            | integer               | 1-5 stars (required)   |
| comment          | text                  | Optional review text   |
| editable_until   | timestamptz           | Edit window expiry     |
| created_at       | timestamptz           | Rating creation        |

### Aggregates on profiles

- `rating_avg` — running average of received ratings
- `rating_count` — total ratings received

### Rating window

`RATING_WINDOW_DAYS = 14` — ratings can be edited or deleted within this window after creation.

## Architecture

```
src/features/ratings/
├── components/
│   ├── RatingPrompt/
│   │   └── RatingPrompt.tsx         # Star picker + comment form
│   └── ReviewCard/
│       └── ReviewCard.tsx           # Individual review display
├── hooks/
│   ├── useUserRatings.ts            # Query ratings for a user
│   ├── useCreateRating.ts           # Create rating mutation
│   ├── useUpdateRating.ts           # Update rating (within window)
│   └── useDeleteRating.ts           # Delete rating (within window)
├── utils/
│   └── ratingWindow.ts              # isWithinRatingWindow, canEditRating, canDeleteRating
├── types.ts                          # RatingWithReviewer, CreateRatingInput, etc.
└── index.ts                          # Public API
```

### Rating window utilities

- `isWithinRatingWindow(rating)` — checks if current time is before `editable_until`
- `canEditRating(rating, userId)` — within window + user is the rater
- `canDeleteRating(rating, userId)` — within window + user is the rater

## Screens & Navigation

Ratings are displayed on public profile screens (`(tabs)/profile/[userId].tsx`). The rating prompt is shown contextually after transactions.

## Key Flows

### Rating After Transaction

1. Transaction completes (borrow returned, item donated/sold)
2. Rating prompt notification sent
3. User opens prompt → selects stars (1-5) + optional comment
4. `useCreateRating` inserts rating with `editable_until = now + 14 days`
5. Profile aggregates updated

### Editing/Deleting a Rating

1. User views their review on a profile → "Edit" / "Delete" buttons shown if within window
2. `useUpdateRating` / `useDeleteRating` — only works within the 14-day window

### Star labels

| Stars | Label     |
| ----- | --------- |
| 1     | Terrible  |
| 2     | Poor      |
| 3     | Okay      |
| 4     | Good      |
| 5     | Excellent |

## i18n

Namespace: `ratings`

Key areas: `prompt.*` (rating form, star label, comment, window note), `review.*` (review card, edit/delete, transaction types), `profile.*` (profile ratings section, review count), `stars.*` (star labels).

## Current Status

- **Implemented:** CRUD for ratings, 14-day edit window, star picker, review cards, profile aggregates display
- **Working:** Create, edit, delete within window, ratings shown on public profiles
- **Known gaps:** Rating creation not yet auto-triggered after transactions (manual prompt only), profile aggregate recalculation relies on database triggers

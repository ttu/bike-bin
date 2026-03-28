# Notifications

## Overview

In-app notification system with real-time delivery via Supabase Realtime. Notifications cover messages, borrow activity, and reminders. Users can configure per-category, per-channel preferences (push, email). In-app notifications are always on.

## Data Model

### notifications table

| Column     | Type                 | Description                |
| ---------- | -------------------- | -------------------------- |
| id         | uuid (PK)            | Notification ID            |
| user_id    | uuid (FK → profiles) | Recipient                  |
| type       | text                 | Notification type key      |
| title      | text                 | Notification title         |
| body       | text                 | Notification body          |
| data       | jsonb                | Additional structured data |
| is_read    | boolean              | Read status                |
| created_at | timestamptz          | Creation timestamp         |

### Notification types

- `new_message` — New message received
- `borrow_request_received` — Someone wants to borrow your item
- `borrow_request_accepted` — Your borrow request was accepted
- `borrow_request_declined` — Your borrow request was declined
- `return_reminder` — Reminder to return a borrowed item
- `rating_prompt` — Prompt to rate a transaction

### Preference categories

- **Messages** — push, email toggles
- **Borrow Activity** — push, email toggles
- **Reminders** — push, email toggles

## Architecture

```
src/features/notifications/
├── components/
│   ├── NotificationCard/
│   │   └── NotificationCard.tsx     # Notification list item
│   └── NotificationBell/
│       └── NotificationBell.tsx     # Bell icon with unread badge
├── hooks/
│   ├── useNotifications.ts          # List notifications query
│   ├── useMarkNotificationRead.ts   # Mark single as read
│   ├── useUnreadNotificationCount.ts # Unread count for badge
│   ├── useRealtimeNotifications.ts  # Supabase Realtime subscription
│   └── useNotificationPreferences.ts # User preference settings
├── types.ts                          # NotificationCategoryPreferences, NotificationPreferences
└── index.ts                          # Public API
```

### Realtime

`useRealtimeNotifications` subscribes to the `notifications` table filtered by `user_id`. New notifications are injected into the TanStack Query cache immediately.

### NotificationBell

Icon component with unread count badge, placed in the inventory tab header.

## Screens & Navigation

| Route                                      | Screen                | Purpose                                   |
| ------------------------------------------ | --------------------- | ----------------------------------------- |
| `(tabs)/inventory/notifications.tsx`       | Notifications List    | All notifications with read/unread status |
| `(tabs)/profile/notification-settings.tsx` | Notification Settings | Per-category, per-channel toggles         |

## Key Flows

### Receiving a Notification

1. Event triggers notification creation (e.g., new borrow request)
2. Supabase Realtime delivers to connected client
3. `useRealtimeNotifications` injects into cache → badge updates
4. User opens notifications screen → sees notification card
5. Tapping marks as read via `useMarkNotificationRead`

### Configuring Preferences

1. User navigates to notification settings
2. Per-category toggles for push and email
3. Saved to user preferences

## i18n

Namespace: `notifications`

Key areas: `types.*` (notification type labels), `timeAgo.*` (relative timestamps), `settings.*` (preferences screen, category names, channel names).

## Current Status

- **Implemented:** Notification list, realtime delivery, unread count/badge, mark as read, notification preferences, notification cards
- **Working:** Realtime subscription, badge on bell icon
- **Known gaps:** Push notifications not yet wired to native (push token stored but delivery mechanism pending)

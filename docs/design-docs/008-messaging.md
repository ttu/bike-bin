# Messaging

## Overview

Item-linked conversations between users. When a user contacts a listing owner, a conversation is created tied to the specific item. Messages are delivered in real-time via Supabase Realtime subscriptions. The messages tab shows all conversations with unread counts, last message preview, and item reference.

## Data Model

### conversations table

| Column        | Type                 | Description                     |
| ------------- | -------------------- | ------------------------------- |
| id            | uuid (PK)            | ConversationId branded type     |
| item_id       | uuid (FK → items)    | Item this conversation is about |
| participant_1 | uuid (FK → profiles) | First participant               |
| participant_2 | uuid (FK → profiles) | Second participant              |
| created_at    | timestamptz          | Creation timestamp              |

### messages table

| Column          | Type                      | Description            |
| --------------- | ------------------------- | ---------------------- |
| id              | uuid (PK)                 | MessageId branded type |
| conversation_id | uuid (FK → conversations) | Parent conversation    |
| sender_id       | uuid (FK → profiles)      | Message sender         |
| body            | text                      | Message content        |
| created_at      | timestamptz               | Send timestamp         |

### Key types

- **ConversationListItem** — conversation with joined item info, other participant details, last message, unread count
- **MessageWithSender** — message with `isOwn` flag for bubble alignment

## Architecture

```
src/features/messaging/
├── components/
│   ├── ChatBubble/
│   │   └── ChatBubble.tsx           # Message bubble (own vs other styling)
│   ├── ConversationCard/
│   │   └── ConversationCard.tsx     # Conversation list item
│   └── ItemReferenceCard/
│       └── ItemReferenceCard.tsx    # Item card shown at top of conversation
├── hooks/
│   ├── useConversations.ts          # List all user's conversations
│   ├── useConversation.ts           # Single conversation detail
│   ├── useMessages.ts               # Messages for a conversation
│   ├── useSendMessage.ts            # Send message mutation
│   ├── useCreateConversation.ts     # Create new conversation (from listing)
│   ├── useRealtimeMessages.ts       # Supabase Realtime subscription
│   └── useUnreadCount.ts            # Total unread message count
├── utils/
│   └── mapMessageRow.ts             # Row → MessageWithSender mapper
├── types.ts                          # ConversationListItem, MessageWithSender
└── index.ts                          # Public API
```

### Realtime

`useRealtimeMessages` subscribes to the `messages` table via Supabase Realtime, filtering by `conversation_id`. New messages are appended to the TanStack Query cache in real-time without polling.

### Unread count

`useUnreadCount` provides a total unread message count across all conversations, used for the tab badge on the messages tab.

## Screens & Navigation

| Route                       | Screen              | Purpose                                        |
| --------------------------- | ------------------- | ---------------------------------------------- |
| `(tabs)/messages/index.tsx` | Conversation List   | All conversations with last message preview    |
| `(tabs)/messages/[id].tsx`  | Conversation Detail | Chat view with messages, item reference, input |

## Key Flows

### Starting a Conversation

1. User taps "Contact" on a listing detail
2. `useCreateConversation` creates a conversation linked to the item
3. User is navigated to the conversation detail screen
4. If a conversation for this item+user pair already exists, navigates to existing one

### Sending Messages

1. User types message → taps send
2. `useSendMessage` inserts message row
3. Supabase Realtime delivers to other participant
4. Conversation list updates with new last message

### Unread Badge

- `useUnreadCount` queries unread messages across all conversations
- Badge shown on messages tab in bottom navigation

## RLS & Security

- Conversations are only visible to their two participants
- Messages are only visible to conversation participants
- Users can only send messages to conversations they belong to
- **Known issue:** Conversation INSERT policies may block direct creation (chicken-and-egg with SELECT); workaround implemented in tests

## i18n

Namespace: `messages`

Key areas: `empty.*` (empty state), `conversation.*` (list card labels, item reference), `detail.*` (chat input, item availability labels), `time.*` (relative timestamps).

## Current Status

- **Implemented:** Full messaging with conversations, real-time delivery, unread counts, item reference cards, conversation list with previews
- **Working:** Realtime subscriptions, unread badge, conversation creation from listings
- **Known gaps:** No message pagination (load older), no message deletion, no typing indicators

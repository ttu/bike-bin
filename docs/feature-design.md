# Bike Bin — Feature Design & UX Specification

> **Purpose:** Consolidated design decisions, resolved ambiguities, and screen-level UX flows that complement the functional and technical specs.
> **Context:** See [functional-specs.md](functional-specs.md) for product scope, [technical-specs.md](technical-specs.md) for stack/patterns, [system-architecture.md](system-architecture.md) for system design.

---

## 1. Design Decisions (resolved during brainstorming)

### 1.1 Auth & Identity

| Decision                | Resolution                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Username → Display name | **Display name + internal ID.** Display names are not unique. Users are identified internally by UUID. No "taken" errors during onboarding. **Note:** The functional spec uses "username" — this design supersedes that terminology. All references to "username" in the functional spec should be read as "display name." |
| OAuth providers         | Google + Apple only. No email/password or magic link.                                                                                                                                                                                                                                                                      |
| Email verification      | Handled by OAuth provider. No in-app verification.                                                                                                                                                                                                                                                                         |

### 1.2 Account Deletion (GDPR)

| Data type        | On deletion                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Listings (items) | **Deleted immediately.** Removed from search, conversations about them closed with notification.                           |
| Conversations    | **Preserved.** Messages remain visible to the other party. Author shown as "[Deleted user]".                               |
| Ratings given    | **Anonymized.** Scores remain (affects recipient's average). Author shown as "[Deleted user]". Admin can remove if needed. |
| Account data     | Fully deleted from Supabase Auth and profile tables.                                                                       |

### 1.3 Inventory

| Decision                                   | Resolution                                                                                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Bike" as item category vs Bike Management | **Both coexist.** "Bike" item category = listing a complete bike for borrow/donate/sell. Bike Management = tracking your own builds with mounted parts. Different use cases. |
| Max photos per item                        | **5.** First photo is primary (shown in lists/search). User can reorder to change primary.                                                                                   |
| Item categories                            | Component, Tool, Accessory, Bike.                                                                                                                                            |

### 1.4 Search & Discovery

| Decision                | Resolution                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| Default search behavior | **Empty state with search prompt.** No auto-feed or browsing. Intentional search only.                  |
| Default max distance    | **25 km.**                                                                                              |
| Search origin           | **Primary saved location.** User designates one saved location as primary. Can switch before searching. |
| Distance presets        | 5, 10, 25, 50, 100 km.                                                                                  |

### 1.5 Borrow Workflow

| Decision               | Resolution                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Borrow duration expiry | **Reminder notification only.** No automatic status change. Owner manually marks item as returned.        |
| Return flow            | Owner marks returned → item status back to Stored → both parties prompted to rate (14-day window starts). |

### 1.6 Messaging

| Decision                       | Resolution                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Conversation after transaction | **Stays open.** Conversations remain open after item is marked Donated/Sold for last-minute coordination. |
| Scope                          | Text only in initial release. No image sharing in chat.                                                   |
| Conversation creation          | Initiated from listing detail via "Contact" button. Always linked to a specific item.                     |

### 1.7 Notifications

| Decision            | Resolution                                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuration model | **Granular per-event, per-channel.** Three categories (Messages, Borrow Activity, Reminders) with per-channel toggles (push, email) for each. In-app notifications always on. |
| Push on web         | No push on web. In-app notifications only (shown when logged in).                                                                                                             |

### 1.8 Groups

| Decision             | Resolution                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Public group joining | **Admin approval required.** User requests to join, admin approves/declines.                                 |
| Group discovery      | Users can **search/browse public groups.**                                                                   |
| Private groups       | **Main focus.** Invite-only (via link or username). Not shown in search.                                     |
| Roles                | Admin (invite/remove/edit/promote) + Member (view/share). Creator is first admin. Multiple admins supported. |

### 1.9 Ratings & Reviews

| Decision      | Resolution                                               |
| ------------- | -------------------------------------------------------- |
| Rating window | **14 days** after transaction completion.                |
| Editability   | **Editable within the 14-day window.**                   |
| Deletability  | **Deletable anytime** by the person who left the rating. |
| Rating scale  | 1–5 stars + optional short text.                         |

### 1.10 Help & Support

| Decision | Resolution                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format   | **Contact form only.** No FAQ/knowledge base. Subject + message + optional screenshot. Auto-included context (app version, device info, user ID). |

### 1.11 Unauthenticated Experience

| Decision        | Resolution                                                                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browsing        | Can browse public listings via Search tab (read-only).                                                                                                                                                                 |
| Local inventory | **Can create inventory items locally** (stored on device only, not synced). Clear banner: "Your items are saved on this device only. Sign in to sync and share them." On sign-in, local items upload to their account. |
| Blocked actions | Contact seller, request borrow, messages, groups → login prompt modal.                                                                                                                                                 |

---

## 2. Navigation Structure

### 2.1 App Launch Flow

```
App Launch
    │
    ├─ No session ──────────► Welcome Screen
    │                              │
    │                         ┌────┴────┐
    │                         │ Sign in │
    │                         │Google/Apple│
    │                         └────┬────┘
    │                              │
    │                    Profile complete?
    │                      │           │
    │                     Yes          No
    │                      │           │
    │                      │     Onboarding (skippable)
    │                      │      │  1. Display name + photo
    │                      │      │  2. Add primary location
    │                      │      │
    │                      ▼      ▼
    │               ┌──────────────────┐
    ├─ Has session ►│   Main App       │
    │               │   (4-tab layout)  │
    ├─ Browse only ►│   (limited)      │
                    └──────────────────┘
```

### 2.2 Tab Structure

| Tab           | Icon                     | Purpose                                      |
| ------------- | ------------------------ | -------------------------------------------- |
| **Inventory** | Home                     | User's own items and bikes                   |
| **Search**    | Search                   | Discover nearby items — borrow, donate, sell |
| **Messages**  | Chat (with unread badge) | Item-linked conversations                    |
| **Profile**   | Person                   | Settings, groups, locations, help            |

### 2.3 Screen Tree

#### Inventory Tab

```
Item List (home)
  ├─► Add Item
  ├─► Item Detail [id]
  │     ├─► Edit Item (includes delete)
  │     └─► Photo Gallery (fullscreen)
  └─► Bikes
        ├─► Bike List
        ├─► Add Bike
        └─► Bike Detail [id]
              ├─► Edit Bike
              └─► Mounted Parts (attach/detach)
```

#### Search Tab

```
Search (empty state)
  ├─► Search Results
  │     └─► Listing Detail [id]
  │           ├─► Contact (→ Messages tab)
  │           ├─► Request Borrow (confirmation)
  │           └─► Owner Profile (→ Profile tab)
  └─► Filter Sheet (bottom sheet modal)
```

#### Messages Tab

```
Conversation List
  └─► Conversation Detail [id]
        ├─ Chat messages (realtime)
        ├─ Item reference card (tappable)
        └─ Actions: Mark Donated/Sold, Accept/Reject borrow
```

#### Profile Tab

```
My Profile & Settings
  ├─► Edit Profile (name, photo, delete account)
  ├─► Saved Locations
  │     ├─► Add Location
  │     └─► Edit Location (set primary, delete)
  ├─► Groups
  │     ├─► My Groups list
  │     ├─► Search Public Groups
  │     ├─► Create Group
  │     └─► Group Detail [id]
  │           ├─► Members (admin: manage roles, remove)
  │           ├─► Invite Members
  │           └─► Group Settings (admin: edit, delete)
  ├─► Borrow Requests
  │     ├─ Incoming (accept/decline)
  │     ├─ Outgoing (status, cancel)
  │     └─ Active (mark returned)
  ├─► Notification Settings
  ├─► Appearance (system/light/dark)
  ├─► Help & Support (form)
  ├─► About & Legal
  └─► [User Profile] (other user, from anywhere)
        ├─ Public listings
        └─ Ratings & reviews
```

### 2.4 Cross-Tab Navigation

| From                    | Action          | To                                             |
| ----------------------- | --------------- | ---------------------------------------------- |
| Search → Listing Detail | "Contact"       | Messages tab → Conversation                    |
| Search → Listing Detail | Owner name      | Profile tab → User Profile                     |
| Messages → Conversation | Item card tap   | Item/Listing Detail                            |
| Messages → Conversation | User avatar tap | Profile tab → User Profile                     |
| Push notification tap   | Deep link       | Relevant screen (conversation, borrow request) |

---

## 3. Screen Specifications

### 3.1 Welcome Screen

- App logo + tagline ("From bikers to bikers")
- "Continue with Apple" button (dark, prominent)
- "Continue with Google" button (outlined)
- "Browse without signing in →" text link (→ limited main app)

### 3.2 Onboarding — Profile Setup (Step 1/2)

- Progress dots (2 steps)
- Photo upload (circular, dashed border placeholder). Pre-filled from OAuth provider avatar if available.
- Display name field. Pre-filled from OAuth provider name if available.
- "Skip for now" / "Continue" buttons
- Skipping: reminder banner when user tries to list an item

### 3.3 Onboarding — Location Setup (Step 2/2)

- Progress dots
- Postcode/ZIP input field
- Private label field (e.g. "Home", "Workshop")
- Privacy callout: "Only the area name is visible to others. Your exact address is never shared."
- Area name preview (appears after postcode geocoded via Nominatim)
- This becomes the **primary saved location** for search
- "Skip for now" / "Done" buttons
- Skipping: search will prompt for location when first used

### 3.4 Unauthenticated Banners

- **Inventory tab sync banner** (amber): "Your items are saved on this device only. Sign in to sync and share them."
- **Action blocked modal**: Lock icon + "Sign in to continue" + explanation + sign-in button

### 3.5 Item List (Inventory Home)

- Header: "Inventory" title + "Bikes →" link
- Category filter chips: All / Components / Tools / Accessories (horizontal scroll, active = filled teal). Donated/Sold/Archived items shown dimmed at the bottom or behind an "Archived" filter chip.
- Item cards: primary photo thumbnail (80×60), name, category + condition, availability chips (Borrowable/Donatable/Sellable with colors), status badge
- Status badge colors: Stored (neutral gray), Mounted (neutral gray), Loaned (amber), Reserved (amber), Donated (green), Sold (green), Archived (neutral gray, dimmed)
- FAB (+): opens Add Item
- Pull-to-refresh
- Empty state: centered icon + "Add your first item" + CTA

### 3.6 Item Detail (Own Item)

- Header: back arrow + "Edit" action
- Photo gallery: swipeable carousel, dot indicator, tap for fullscreen. 4:3 aspect ratio.
- Title + status badge
- Category · Brand · Model subtitle
- Availability chips (with price for sellable)
- Detail grid: Condition, Age, Usage (km), Storage location
- Pickup area: area name from saved location
- Notes/description
- Visibility scope ("All users" / group names / "Only me")
- Actions (when status allows):
  - "Mark as Donated" / "Mark as Sold" → confirmation dialog → status change + notification to conversation partners
  - **"Remove from inventory"** → in-app **modal** (Material dialog): choose **Archive** and/or **Delete item** when allowed; each choice runs a **second confirmation** (native `Alert` or web `confirm`). Archive hides the item from the default list; delete removes the row when status permits (not Loaned/Reserved).
  - **"Restore to inventory"** (archived only) → confirmation → status **Stored** (back in default list).
  - When Loaned: show borrower info + "Mark as Returned" instead
  - When Donated/Sold/Archived: item remains findable via terminal filter where applicable; archived items see **Restore** + **Remove from inventory** (delete path inside modal when allowed).

### 3.7 Add / Edit Item Form

- **Photos section**: up to 5, first = primary, drag to reorder
- **Required fields**: Name, Category (chip selector, single), Condition (chip selector, single: New/Good/Worn/Broken)
- **Optional fields**: Brand, Model
- **Availability** (checkboxes, multi-select):
  - Borrowable → reveals optional: deposit amount, suggested duration
  - Donatable (free)
  - Sellable → reveals: price input
  - Private (exclusive — deselects others)
- **Pickup location**: defaults to primary saved location, "Change" opens picker
- **Visible to**: Only me / Groups... (multi-select) / All users
- **Collapsed optional section**: Age, km/miles, purchase date, storage location, description/notes
- **Save button**
- **Edit mode**: same form pre-filled. Delete button at bottom (red, with confirmation). Delete blocked if Loaned/Reserved. Availability changes blocked if Loaned/Reserved.

### 3.8 Bike Management

- **Bike List**: simple list with name, type, brand. "+" to add.
- **Add/Edit Bike form**: Name, Brand, Model, Type (road/gravel/MTB/etc.), Year.
- **Bike Detail**: bike info header + mounted parts list
  - Each part: name, category, condition. Tap → item detail. "Detach" action.
  - "Attach part from inventory" → picker showing Stored items. Attaching changes item status to Mounted.
  - Detaching returns item status to Stored.

### 3.9 Search (Empty State)

- Header: "Search"
- Search bar: placeholder "Parts, tools, bikes..."
- Below search bar: location line ("📍 Berlin Mitte Change") + distance ("within 25 km ▾")
- Distance dropdown: preset options (5, 10, 25, 50, 100 km)
- Location "Change": opens picker with saved locations
- Empty state illustration: "Find what you need — Search for parts, tools, or bikes from cyclists nearby"
- Search triggers on submit (not live-as-you-type)

### 3.10 Search Results

- Search bar with current query + clear (✕)
- Quick filter chips: Borrow / Donate / Sell (toggleable, filled when active). "Filters ▾" opens filter sheet.
- Result count + sort indicator: "3 results within 25 km · Closest first". Tappable to change sort (Closest / Newest / Recently available).
- Result cards: primary photo (88×66), item name, condition, owner display name (tappable → profile, teal colored), availability chips (price shown for sellable), area name + distance
- Empty results: "No items found nearby. Try increasing your distance or changing filters."

### 3.11 Filter Sheet (Bottom Sheet)

- Title + "Reset" link
- **Category**: chip multi-select (Component / Tool / Accessory / Bike)
- **Condition**: chip multi-select (New / Good / Worn / Broken)
- **Offer type**: chip multi-select (Borrow / Donate / Sell)
- **Price range**: min/max inputs (shown when Sell is selected)
- **Group**: dropdown (All groups / specific group)
- "Show results" button

### 3.12 Listing Detail (Other User's Item)

- Header: back arrow + "⚑ Report" action
- Photo gallery (same as item detail)
- Title + category/brand/condition subtitle
- Availability chips with price
- **Owner card**: avatar (40px), display name, average rating + count, "View profile →"
- Location: area name + distance from user
- Description
- Detail grid (condition, age, usage)
- **Action buttons**:
  - Borrowable only → "Request Borrow" (filled, primary)
  - Donatable/Sellable only → "Contact" (filled, primary)
  - Mixed availability → "Contact" (filled, primary) + "Request Borrow" (outlined, secondary)
- Unauthenticated: buttons replaced with "Sign in to contact" prompt

### 3.13 Conversation List (Messages Home)

- Header: "Messages"
- Each row: other user's avatar (44px, unread dot = teal), display name, linked item name ("Re: Shimano XT Derailleur"), last message preview (truncated), timestamp
- Completed transactions: item name shows status suffix "(Sold) ✓". Row slightly dimmed.
- Sorted by most recent message
- Tab badge: unread count on Messages tab icon
- Empty state: "No conversations yet. Start one by contacting a listing owner."

### 3.14 Conversation Detail

- Header: back arrow, other user's avatar (32px) + name, item name subtitle
- **Pinned item reference card** at top: item thumbnail, name, availability, "View →" link
- Chat bubbles: outgoing (teal, right-aligned), incoming (light gray, left-aligned), timestamps on each
- Realtime via Supabase Realtime subscription
- Input bar: text field (rounded) + send button (teal circle)
- **Owner actions** (via header menu):
  - Mark as Sold / Mark as Donated → confirmation → status change → notification
  - For borrow: Accept/Reject request if pending
- Text only. No image sharing.

### 3.15 My Profile & Settings

- **Profile header**: avatar (64px), display name, rating summary. "Edit" link.
- **Menu items**:
  - 📍 Saved Locations →
  - 👥 Groups →
  - 🔄 Borrow Requests → (with pending count badge)
  - 🔔 Notification Settings →
  - 🌙 Appearance (inline: System / Light / Dark)
  - ❓ Help & Support →
  - ℹ️ About & Legal →
- **Sign Out** (red text, bottom)
- **Account deletion**: accessible from Edit Profile screen (bottom, red text, confirmation dialog explaining consequences)

### 3.16 Borrow Requests

- **Three sub-tabs**: Incoming / Outgoing / Active
- **Incoming**: cards showing requester avatar + name, item name, request time. Accept (filled teal) / Decline (outlined) buttons.
  - When a borrow request is submitted → item status changes to **Reserved** (prevents other requests)
  - Accept → item status = Loaned → conversation auto-created → borrower notified
  - Decline → item status back to Stored → optional reason text (inline input or small modal) → requester notified. Reason shown in requester's Outgoing tab as "Declined: [reason]".
- **Outgoing**: cards showing item name, owner, status (Pending / Accepted / Declined). Cancel option for pending.
- **Active**: currently loaned items. Borrower info, item, loan date. "Mark as Returned" action.
  - Returned → item status = Stored → both parties prompted to rate (14-day window starts)

### 3.17 Saved Locations

- Location cards: label, area name, postcode. Primary badge on primary location.
- "Add location" dashed card
- **Edit screen**: change label, postcode. "Set as primary" toggle. Delete (blocked if only location or items reference it).
- Label is private. Area name is public (derived from postcode via geocoding).

### 3.18 Groups

- **My Groups list**: group cards with name, private/public, member count, role
- **Search bar**: for discovering public groups
- **"+ Create"** action
- **Group Detail**: name, description, member list (avatar + name + role)
  - Admin actions: "Invite Members" (link or username), "Settings" (edit details, delete group)
  - Admin can promote members, remove members
  - Member view: member list (no admin actions), "Leave group"
- **Public group search results**: show group name, description, member count, "Request to Join" button

### 3.19 Public User Profile

- Avatar (80px), display name, average rating + count
- **Recent reviews**: reviewer name, star rating, text, item context, date
- **Public listings**: item cards (thumbnail, name, availability)
- Tapping a listing → listing detail
- "⚑ Report" in header
- No private info shown (no email, no exact location, no group memberships)

### 3.20 Notification Settings

- **Per-category toggles** with push + email per category:
  - Messages: push ○/● · email ○/●
  - Borrow Activity: push ○/● · email ○/●
  - Reminders: push ○/● · email ○/●
- In-app notifications always on (not configurable)
- Push not available on web (noted if on web)

### 3.21 Help & Support

- Subject field (required)
- Message body (required, multiline)
- Optional screenshot attachment
- Auto-included context note: "App version, device info, and your user ID will be included automatically."
- "Send" button → stored in `support_requests` table → email notification to support team
- **Unauthenticated access:** Simplified form accessible from the Welcome screen (small "Help" link). No user ID context included. User provides an optional email address for follow-up.

### 3.22 Rating Prompt (Bottom Sheet / Modal)

- Shown after transaction completion (borrow returned, donate/sell completed)
- Context: item name + transaction type + other party name
- 1–5 star selector (tappable)
- Optional comment text field
- "Skip" / "Submit" buttons
- Note: "You have 14 days to leave a rating"
- Editable within window, deletable anytime

---

## 4. Interaction Patterns

### 4.1 Confirmation Dialogs

Used for irreversible or significant actions:

- Mark as Donated/Sold
- Delete item
- Delete account
- Accept/Decline borrow request
- Cancel outgoing borrow request
- Leave group
- Delete group

### 4.2 Empty States

Every list screen has a dedicated empty state with:

- Centered icon (xl size, onSurfaceVariant color)
- Headline text
- Body text explaining what the screen shows
- Primary CTA button (when applicable)

| Screen          | Empty state CTA                                    |
| --------------- | -------------------------------------------------- |
| Inventory       | "Add your first item"                              |
| Search results  | "Try increasing your distance or changing filters" |
| Messages        | "Start one by contacting a listing owner"          |
| Borrow requests | "No requests yet"                                  |
| Groups          | "Create or join a group"                           |
| Bike parts      | "Attach a part from your inventory"                |

### 4.3 Loading States

- **Initial page loads**: skeleton placeholders matching content shape (no spinners)
- **Short actions** (button submit, pull-to-refresh): inline spinner
- **Offline**: banner at top of screen, cached/stale data shown

### 4.4 Error States

- **Network/server errors**: inline error banner at top, retry button, dismissible
- **Form field errors**: inline below the field in error color
- **Offline writes**: "pending sync" indicator on items created offline

---

## 5. Notification Center

In-app notifications are surfaced via a **bell icon** in the Inventory tab header (home screen). Tapping opens a notification list screen.

- **Notification list**: reverse-chronological. Each item shows: icon (type-based), title, body text, timestamp, read/unread state.
- **Notification types**: new message, borrow request received, request accepted/declined, return reminder, rating prompt.
- **Tapping a notification**: navigates to the relevant screen (conversation, borrow request, rating prompt). Marks as read.
- **Unread badge**: count shown on bell icon. Clears as notifications are read.
- **No separate tab** — notifications are a screen within the Inventory tab, accessed via the bell icon.

---

## 6. Open Items for Implementation

These items can be decided during development:

- Exact empty state illustrations/icons per screen
- Custom font decision (system font vs Inter vs Plus Jakarta Sans)
- "Use my current location" feature for location setup (GPS-based alternative to manual postcode)
- Image sharing in chat (post-initial release)
- Invite link format and deep link handling for groups
- Exact report form categories and form layout (inappropriate content, spam, stolen goods, etc.)
- Image cropping UX during photo upload (crop tool vs auto-crop to 4:3)
- Bike photos (same pattern as item photos — up to 5, primary photo)
- Distance unit setting (km default; user-configurable to miles in Profile > Settings)
- "Recently available" sort definition (recently listed vs recently changed status back to available)
- "Suggested contribution" field for Donatable items (scoped out — Donatable means free; Sellable is for priced items)

---

_Last updated: 2026-03-17_

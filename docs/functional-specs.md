# Bike Bin — Functional Specifications

> **Purpose:** What the app does from a user and product perspective. Updated as we define scope.

---

## 1. Overview

**Tagline:** From bikers to bikers.

**One-sentence pitch:** A **personal bike parts inventory** app—track what you own with photos, condition, and status. **Secondary:** list items for borrow, donation, or sale; discover nearby gear; use groups for visibility; coordinate with privacy-friendly locations and messaging.

The primary use case is **own inventory**: cyclists catalog parts, tools, and equipment (and link items to bike builds). **Sharing and commerce are optional:** users may make items available for **borrowing, donation, or sale**, scope visibility to **groups** or the public, and use **search** to find nearby listings. When something moves between people, listings show a **general area** (not an exact address) for pickup so handoffs stay practical and safe.

**Platforms:** iOS, Android, and Web — full feature parity across all three. The web version enables continuous deployment (features go live immediately on merge), while mobile releases go through App Store / Play Store review. See [technical-specs.md §1](technical-specs.md) for platform details.

**Discovery angle (secondary):** When users want to acquire or move gear, someone looking for a specific item (e.g. a tool, a handlebar) can **search** and see **who nearby** is offering it — **borrow**, **donate**, or **sell**. The user sets a **max distance** (e.g. 5 km, 20 km). This complements the **primary** workflow of maintaining an accurate personal inventory.

The goal is to:

- **Primary:** Help cyclists **keep track of their parts, tools, and builds** with trustworthy detail
- **Secondary:** Encourage reuse when people **choose to list**—borrow, donate, or sell locally, filtered by **max distance**
- **Secondary:** Let small communities (e.g. local ride groups) **optionally** scope visibility to shared gear

---

## 2. Core Concepts

### 2.1 Users

Users represent individual cyclists who maintain their inventory.

**User capabilities:**

- Create and manage inventory items
- Upload photos and descriptions
- Track item usage and condition
- Offer items for borrow, donation, or sale
- Communicate with other users

**User data:**

- Username
- Profile photo
- Membership in groups
- Contact preferences
- Saved pickup locations (0..n) — see §3.2

**Public profile (visible to other users):**

- Username and profile photo
- Public listings (items marked as available)
- **Ratings and reviews** — after completing a borrow, donate, or sell transaction, both parties can rate the other (e.g. 1–5 stars + optional short text). Average rating shown on profile.

### 2.2 Authentication

- Users must **log in** to create listings or contact others.
- **Social login** supported: **Google** and **Apple** (OAuth). No email+password or magic link for MVP.
- **Email verification:** Handled by the identity provider (Google/Apple verify the email). No separate in-app email verification required.
- Unauthenticated users may browse public listings only (no contact, no create).

### 2.3 Onboarding

After signup, users go through a **short guided setup**:

1. Set username and profile photo
2. Add at least one saved pickup location (see §3.2)
3. Then enter the main app

Users can skip and complete setup later, but the app should encourage completing the profile before listing items.

### 2.4 Navigation Structure

The app uses a **4-tab layout**:

| Tab           | Purpose                                                         |
| ------------- | --------------------------------------------------------------- |
| **Inventory** | User's own items and bikes (home screen)                        |
| **Search**    | Discover nearby items — borrow, donate, sell                    |
| **Messages**  | Item-linked conversations                                       |
| **Profile**   | User profile, settings, groups, saved locations, help & support |

---

## 3. Inventory Management

Users can create and manage items they own.

### 3.1 Item Fields

Each item includes:

**Basic information:**

- Name
- Category (component, tool, accessory, bike)
- Brand
- Model
- Description
- Photos

**Usage & condition:**

- Condition (new, good, worn, broken, etc.)
- Age
- Kilometers / miles used
- Purchase date (optional)

**Inventory state:**

- Status
- Storage location (garage, storage, mounted) — where the item is kept
- **Pickup area** — general area for handoff (see §3.3); not an exact address

**Optional:**

- Notes (e.g. compatibility, measurements)

### 3.2 Pickup location / area

To protect privacy and support discovery, listings use a **general area** for pickup rather than an exact address.

- **Saved locations:** A user can define 0..n saved locations (e.g. “Home”, “Workshop”) with:
  - Label (private)
  - **Area name** (public; **postcode / ZIP level** for MVP — balances privacy and discoverability)
  - Approximate coordinates (for distance filtering only; not shown to others)
  - Visibility: only the area name is shown publicly; exact address shared only when both parties agree (e.g. in messaging).
- **Listing** references one saved location as the pickup location; only the area name is shown to others until agreed otherwise.

### 3.3 Item Status

Items can have the following states:

| Status       | Description                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| **Stored**   | Item is available in inventory                                                                            |
| **Mounted**  | Installed on a bike                                                                                       |
| **Loaned**   | Currently borrowed by someone                                                                             |
| **Reserved** | Someone requested the item                                                                                |
| **Donated**  | Given away                                                                                                |
| **Sold**     | Item sold                                                                                                 |
| **Archived** | Hidden from the default inventory list; can be **restored** to active inventory or **deleted** (see §3.4) |

### 3.4 Editing and Deleting Items

- Items can be **edited** at any time (name, description, photos, condition, etc.).
- **Availability type** can be changed unless the item is currently **Loaned** or **Reserved** (active transaction must be completed or cancelled first).
- **Remove from inventory** (item detail): user chooses **archive** and/or **delete** when allowed — each action is confirmed separately. **Archive** moves the item to **Archived**; **delete** permanently removes the row when permitted.
- **Restore to inventory** (item detail, archived items only): returns the item to **Stored** so it appears in the default list again and can be edited like other active items.
- Items can be **deleted** (permanently removed) only when status is Stored, Mounted, Donated, Sold, or Archived — not while Loaned or Reserved.
- Deleting an item removes it from search results and closes any open conversations about it (with a notification to the other party).

---

## 4. Bike Management _(MVP)_

Users can add bikes and track mounted parts.

**Bike fields:**

- Name
- Brand
- Model
- Type (road, gravel, MTB, etc.)
- Year

**Features:**

- Attach parts to bikes
- Track currently mounted components
- View complete bike build

---

## 5. Borrow / Donate / Sell System

Users can make items available to others.

### 5.1 Availability Types

Each item can be marked with **one or more** availability types simultaneously:

- **Borrowable**
- **Donatable** (free)
- **Sellable** (small fee)
- **Private** (inventory only — no availability; cannot be combined with others)

Optional:

- Deposit required (borrow)
- Borrow duration (borrow)
- Price or suggested contribution (sell / donate) — **no in-app payments** in MVP; payment or handoff is coordinated directly at pickup.

### 5.2 Visibility Scope

Users can choose who can see the item:

- Only me
- Selected groups
- All users

Example groups: local ride club, friends, workshop community.

---

## 6. Borrow Workflow _(MVP)_

Typical flow:

1. User lists item as borrowable
2. Another user requests the item
3. Owner accepts or rejects request
4. Item status becomes **Loaned**
5. When returned, status returns to **Stored**

## 6.1 Donate / Sell Workflow _(MVP)_

Unlike borrowing, donate and sell use **direct messaging** rather than a formal request/accept flow:

1. User lists item as donatable and/or sellable
2. Interested user taps "Contact" on the listing — opens an **item-linked conversation** (see §7)
3. Owner and interested user coordinate in chat (agree on price if selling, arrange pickup)
4. Owner marks item as **Donated** or **Sold** when the handoff is complete

---

## 7. Messaging System _(MVP — in-app)_

Users can communicate regarding items. All conversations are **linked to a specific listing** — there are no general direct messages. This keeps conversations focused and reduces spam.

**Messaging features:**

- **Item-specific chat** (real-time, in-app) — initiated from a listing via "Contact" button
- Borrow request coordination (after request is accepted)
- Donation and sale arrangements
- Conversation list view (Messages tab) showing all active conversations
- Notifications for new messages (see §9)

**Constraints:**

- Users must be authenticated to start or participate in conversations
- Each conversation is tied to one listing; multiple users can each have separate conversations with the same owner about the same item

---

## 8. Search & Discovery

Users search for **what they need** (e.g. “crank puller”, “handlebar”, “pump”) and the app shows **offers nearby** — whether someone is **borrowing**, **donating**, or **selling** that item. Results are limited by a **user-defined max distance** (e.g. 5 km, 10 km, 20 km) so only relevant, reachable listings appear.

**Filters:**

- **Search query** — part name, category, or keyword
- **Max distance** — radius from user’s location (or chosen area); only show listings within this distance
- Category
- Condition
- **Offer type** — borrow, donate, sell (one or more)
- Price range (when offer type includes sell)
- Group (if applicable)

**Sorting:**

- Closest first (default for “nearby” use case)
- Newest
- Recently available

---

## 9. Notifications _(MVP — in-app + push + email)_

Users receive notifications for:

- Borrow requests
- Request approvals or rejections
- **New messages** (listing owner gets email and/or push when someone contacts them)
- Item return reminders

**Delivery methods:**

- In-app notifications
- Push notifications
- **Email** (e.g. when there is a new message; optional for other events)

---

## 10. Photos & Media

Users can attach photos to:

- Items
- Bikes

**Features:**

- Multiple images per item
- Image cropping
- Camera upload from mobile

---

## 11. Groups _(MVP)_

Groups represent communities where items can be shared.

**Examples:** Local cycling club, friends, bike workshop.

**Group capabilities:**

- Private or public
- Invite members (by link or username)
- Share items only within group

**Roles:**

- **Admin** — can invite/remove members, edit group details, promote members to admin. The creator is the first admin.
- **Member** — can view group items, share own items to the group.
- Multiple admins are supported; creator can promote other members.

---

## 12. Mobile First Experience

Primary use case is mobile.

**Mobile features:**

- Quick item entry
- Camera-based photo capture
- Barcode / QR scanning (future feature)

---

## 13. Future Enhancements

Potential later features:

- Maintenance tracking
- Service history
- Mileage tracking
- Compatibility suggestions
- Part lifecycle analytics
- Integration with Strava or ride tracking
- Marketplace features

---

## 14. Trust and safety

- **Location:** Default to **area-level** only (neighborhood / district). Allow more precise location only when both parties agree (e.g. in messaging).
- **Report and moderation:** Basic flow for reporting listings or users; moderation for abuse, prohibited items, or misleading condition. See [security.md](security.md) §6.3 for details.
- **Community rules:** Clear rules communicated in-app — e.g. no stolen goods, accurate condition description, respectful communication. Violations can lead to removal or account action.

---

## 14.1 Help & Support

Users can contact the app maintainers directly from within the app without needing to send a separate email.

- **Location:** Profile tab → **Help & Support** menu item.
- **In-app feedback form:** Subject + message body. Optionally attach a screenshot.
- **Auto-included context:** App version, device info, user ID (for follow-up). User does not need to fill these in manually.
- **Submission:** Stored in a `support_requests` table in Supabase. Triggers an email notification to the maintainer/support team via Edge Function.
- **Response:** Maintainers can respond via email (sent to the user's auth email). In-app response thread is post-MVP.
- **Unauthenticated users:** Can access a simplified version (no user ID context). Or redirect to a web-based contact form.

---

## 15. Assumptions and resolved decisions

- **Donate vs sell:** ~~Two explicit types vs single type with optional contribution?~~ **Resolved:** Two separate availability types — **Donate** (free) and **Sell** (optional fee). "Sell" = fee paid directly at pickup, **not** processed by the platform.
- **Payments:** No in-app payments in MVP; buyers and sellers coordinate payment at pickup.
- **Area granularity:** ~~City only, district, or postcode?~~ **Resolved:** **Postcode / ZIP level** for MVP. Balances privacy and discoverability.
- **Shipping:** Pickup-only for MVP; support for shipping may be considered later.
- **MVP scope:** All features in this spec are **in scope for MVP**, including: bike management, groups, borrowing workflow, in-app messaging, full notification stack (in-app + push + email), and anonymous browsing of public listings.

---

## 16. Non-Functional Requirements (summary)

| Area         | Requirement                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Platforms    | **iOS, Android, Web** — full feature parity. Single React Native codebase.                                                              |
| Performance  | Fast item browsing, low-latency messaging                                                                                               |
| Security     | Authenticated users only, privacy controls                                                                                              |
| Scalability  | Growing user communities, efficient image storage                                                                                       |
| Localization | **i18n-ready from start** — English as default language; internationalization framework in place so adding languages is straightforward |
| Units        | Distance displayed in **km** (metric default); user-configurable to miles if needed later                                               |

_(Detailed NFRs live in [technical-specs.md](technical-specs.md).)_

_(Sections 14–15 informed by marketplace/pitch description: tagline, pitch, auth, pickup area, trust & safety, resolved decisions.)_

---

_Last updated: 2026-03-17_

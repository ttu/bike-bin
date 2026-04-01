# Bike Bin — App Description

> **Purpose:** High-level app description, audience, and feature summary aligned with the shipped product.  
> **Full product spec:** [functional-specs.md](functional-specs.md).

---

## Tagline

**From bikers to bikers.**

## One-line pitch

Bike Bin is primarily a **personal inventory** app for bike parts, tools, and builds—photos, condition, usage, and status in one place. **Secondary:** when you choose to, you can **list** items for borrow, donation, or sale, **search** nearby offers, use **groups** to limit visibility, and **coordinate** handoffs with privacy-friendly area-level locations and messaging.

## Who it is for

- Cyclists who want to **know what they own**—workshop inventory, spares, and mounted parts—without spreadsheets.
- Riders who sometimes **share or move** gear: borrow, donate, or sell within a **maximum distance**, with clear pickup context.
- Clubs or crews who want **optional** group-scoped visibility for listings—not the core workflow.

## Platforms

iOS, Android, and Web — one codebase (Expo + React Native), aiming for feature parity. Web can be deployed continuously; mobile goes through store review.

## Navigation (main app)

Signed-in and browse-in users use a **bottom tab bar** with five areas: **Inventory**, **Bikes**, **Search**, **Messages**, and **Profile**. Details and screen trees: [functional-specs.md](functional-specs.md) §2.4, [feature-design.md](feature-design.md) §2.2–2.3.

## Core capabilities

| Area                        | What users get                                                                                                                                                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inventory (primary)**     | Items with photos, condition, usage, status, optional availability (borrow / donate / sell), visibility (private, groups, or public). Optional tags and link to a bike build. Item detail: **Remove from inventory** (archive or delete, with confirmations), **Restore to inventory** for archived items. |
| **Bikes**                   | Named bikes with type, brand, model; optional photos; items can be associated with a bike.                                                                                                                                                                                                                 |
| **Search & discovery**      | **Secondary:** find others’ listings near the user (PostGIS distance), filtered by availability and other criteria.                                                                                                                                                                                        |
| **Groups**                  | **Secondary:** create or join groups; scope item visibility to selected groups when needed.                                                                                                                                                                                                                |
| **Borrowing**               | **Secondary:** borrow requests on listed items; statuses from pending through returned or cancelled.                                                                                                                                                                                                       |
| **Messaging**               | **Secondary:** item-linked conversations when coordinating with others.                                                                                                                                                                                                                                    |
| **Ratings**                 | Post-transaction ratings (e.g. stars + optional text) tied to transaction type.                                                                                                                                                                                                                            |
| **Locations**               | Saved pickup areas (label, area name, postcode, coordinates) — public-facing handoff context without exposing full address by default.                                                                                                                                                                     |
| **Profile & notifications** | Profile fields, ratings summary, in-app notifications; push and email are part of the broader stack (see technical specs).                                                                                                                                                                                 |
| **Support & safety**        | Support requests and reporting flows exist in the data model for feedback and moderation.                                                                                                                                                                                                                  |

## Authentication (product-level)

Users sign in with **social OAuth** (e.g. Google and Apple) as described in the functional specs. Unauthenticated users may browse public discovery depending on product rules; creating listings and contacting others requires sign-in.

## Privacy

Listings emphasize **general area** for pickup. Exact coordinates and sensitive PII are handled per [security.md](security.md) and Row Level Security in the database.

## Related docs

- [development.md](development.md) — run the app locally.
- [architecture.md](architecture.md) — how the app is structured in code.
- [datamodel.md](datamodel.md) — entities and database tables.

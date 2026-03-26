# Bike Bin — App Description

> **Purpose:** High-level app description, audience, and feature summary aligned with the shipped product.  
> **Full product spec:** [functional-specs.md](functional-specs.md).

---

## Tagline

**From bikers to bikers.**

## One-line pitch

Bike Bin is a peer-to-peer bike parts exchange: riders donate, sell, or lend spare parts locally, with privacy-friendly location (area-level pickup, not exact addresses) and messaging to coordinate handoffs.

## Who it is for

- Cyclists who want to **track** parts, tools, and accessories they own.
- People who want to **find** nearby gear (borrow, donate, or buy) within a **maximum distance**.
- Groups (clubs, friends, workshops) who want to **share listings** within a community.

## Platforms

iOS, Android, and Web — one codebase (Expo + React Native), aiming for feature parity. Web can be deployed continuously; mobile goes through store review.

## Core capabilities

| Area                        | What users get                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inventory**               | Items with photos, condition, usage, status, availability (borrow / donate / sell), visibility (private, groups, or public). Optional tags and link to a bike build. |
| **Bikes**                   | Named bikes with type, brand, model; optional photos; items can be associated with a bike.                                                                           |
| **Search & discovery**      | Find listings near the user (PostGIS distance), filtered by availability and other criteria.                                                                         |
| **Groups**                  | Create or join groups; scope item visibility to selected groups when needed.                                                                                         |
| **Borrowing**               | Borrow requests on items; statuses from pending through returned or cancelled.                                                                                       |
| **Messaging**               | Item-linked conversations between participants.                                                                                                                      |
| **Ratings**                 | Post-transaction ratings (e.g. stars + optional text) tied to transaction type.                                                                                      |
| **Locations**               | Saved pickup areas (label, area name, postcode, coordinates) — public-facing handoff context without exposing full address by default.                               |
| **Profile & notifications** | Profile fields, ratings summary, in-app notifications; push and email are part of the broader stack (see technical specs).                                           |
| **Support & safety**        | Support requests and reporting flows exist in the data model for feedback and moderation.                                                                            |

## Authentication (product-level)

Users sign in with **social OAuth** (e.g. Google and Apple) as described in the functional specs. Unauthenticated users may browse public discovery depending on product rules; creating listings and contacting others requires sign-in.

## Privacy

Listings emphasize **general area** for pickup. Exact coordinates and sensitive PII are handled per [security.md](security.md) and Row Level Security in the database.

## Related docs

- [development.md](development.md) — run the app locally.
- [architecture.md](architecture.md) — how the app is structured in code.
- [datamodel.md](datamodel.md) — entities and database tables.

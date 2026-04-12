# Group Inventory Ownership

Items can be owned by groups in addition to individuals. Group admins manage group inventory, and communication about group items flows through a shared inbox visible to all group admins.

## Problem

Items are strictly owned by individual users (`owner_id` FK to `profiles`). Groups exist for visibility scoping but cannot own items. There is no way for a group to maintain shared inventory managed collectively by its admins.

## Decisions

| Decision                   | Choice                                                    | Rationale                                                               |
| -------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Ownership model            | Exclusive-arc (two nullable FKs + CHECK)                  | Real FK constraints on both columns; schema enforces exactly one owner  |
| Group item listing         | Separate "Group Inventory" tab in group detail            | Clean separation from personal inventory                                |
| Messaging model            | Shared inbox (all admins + requester in one thread)       | Admins collaborate transparently; requester has single point of contact |
| Who creates group items    | Admins only                                               | Keeps management authority clear                                        |
| Transfer direction         | Bidirectional (personal <-> group)                        | Flexibility; admin must be involved on both sides                       |
| Borrow handling            | Any admin can act at any step; system tracks who          | Prevents bottlenecks while maintaining accountability                   |
| Borrow-lock on group items | Same rules as personal items                              | Consistency; prevents edits during active borrows                       |
| Transfer preconditions     | No active borrows; conversations close; visibility resets | Clean handoff with no ambiguous state                                   |
| Group member borrowing     | Members can borrow; admins cannot                         | Members are users of the inventory; admins are managers                 |
| Ratings                    | Group gets its own rating aggregate                       | Ratings reflect group stewardship, not individual admins                |
| Group deletion             | CASCADE deletes group items (no orphan transfer)          | Simple; admins should transfer valuable items before deleting group     |

## Schema Changes

No new migration files. Edit existing migration scripts directly (project can start from scratch with `db:reset`).

### Items table (`00004_groups_items.sql`)

Edit the existing `CREATE TABLE items` to make `owner_id` nullable, add `group_id` and `created_by`, and add the exclusive-arc constraint:

- `owner_id uuid REFERENCES profiles(id)` — nullable, set for personal items
- `group_id uuid REFERENCES groups(id) ON DELETE CASCADE` — nullable, set for group items
- `created_by uuid REFERENCES profiles(id)` — which admin created or transferred the item
- `CONSTRAINT items_exclusive_owner CHECK (num_nonnulls(owner_id, group_id) = 1)`

Add index: `CREATE INDEX idx_items_group ON items(group_id) WHERE group_id IS NOT NULL;`

### Groups table (`00004_groups_items.sql`)

Add rating columns to the existing `CREATE TABLE groups`:

- `rating_avg numeric DEFAULT 0`
- `rating_count integer DEFAULT 0`

### Ratings table (`00007_ratings.sql`)

Edit `CREATE TABLE ratings` to make `to_user_id` nullable and add `to_group_id` with exclusive-arc:

- `to_user_id uuid REFERENCES profiles(id)` — nullable
- `to_group_id uuid REFERENCES groups(id)` — nullable
- `CONSTRAINT ratings_exclusive_target CHECK (num_nonnulls(to_user_id, to_group_id) = 1)`

Add index: `CREATE INDEX idx_ratings_to_group ON ratings(to_group_id) WHERE to_group_id IS NOT NULL;`

### Borrow requests table (`00005_borrow_requests.sql`)

Add to existing `CREATE TABLE borrow_requests`:

- `acted_by uuid REFERENCES profiles(id)` — which admin performed each status transition, NULL for personal item transactions

### Storage path convention for group item photos

Group item photos use path `group-{group_id}/{item_id}/{filename}` instead of `{user_id}/{item_id}/{filename}`. Storage policies must allow any group admin to manage photos under the group prefix.

## RLS Policy Changes

### Items

```sql
-- SELECT: personal owner OR group member OR public
items_select:
  (owner_id = auth.uid())
  OR (group_id IS NOT NULL AND is_group_member(group_id, auth.uid()))
  OR (visibility = 'all')

-- INSERT: personal (own) OR group admin (created_by must be caller)
items_insert:
  (owner_id = auth.uid() AND group_id IS NULL)
  OR (group_id IS NOT NULL AND owner_id IS NULL
      AND created_by = auth.uid()
      AND is_group_admin(group_id, auth.uid()))

-- UPDATE: personal owner OR group admin (borrow-lock still applies)
items_update:
  (owner_id = auth.uid())
  OR (group_id IS NOT NULL AND is_group_admin(group_id, auth.uid()))

-- DELETE: same branching + existing status guards
items_delete:
  ((owner_id = auth.uid())
    OR (group_id IS NOT NULL AND is_group_admin(group_id, auth.uid())))
  AND status NOT IN ('loaned', 'reserved')
```

### Item photos (`00004_groups_items.sql`)

All four policies (SELECT, INSERT, UPDATE, DELETE) must add the group admin branch:

```sql
-- Existing: items.owner_id = auth.uid()
-- Add:      OR (items.group_id IS NOT NULL AND is_group_admin(items.group_id, auth.uid()))
```

### Item groups (`00004_groups_items.sql`)

INSERT and DELETE policies must add group admin branch alongside the existing `items.owner_id = auth.uid()` check.

### Borrow requests (`00005_borrow_requests.sql`)

```sql
-- INSERT: not the owner (personal) or not an admin (group)
borrow_requests_insert:
  requester_id = auth.uid()
  AND (
    (item.owner_id IS NOT NULL AND requester_id != item.owner_id)
    OR (item.group_id IS NOT NULL
        AND NOT is_group_admin(item.group_id, auth.uid()))
  )

-- SELECT: requester OR personal owner OR group admin
borrow_requests_select:
  requester_id = auth.uid()
  OR item.owner_id = auth.uid()
  OR (item.group_id IS NOT NULL AND is_group_admin(item.group_id, auth.uid()))

-- UPDATE: requester OR personal owner OR group admin
borrow_requests_update:
  requester_id = auth.uid()
  OR item.owner_id = auth.uid()
  OR (item.group_id IS NOT NULL AND is_group_admin(item.group_id, auth.uid()))
```

### Borrow requests trigger (`00005_borrow_requests.sql`)

The existing `borrow_requests_enforce_update_rules()` trigger checks `items.owner_id = auth.uid()` to authorize accept/reject/returned transitions. This must be updated:

```sql
-- Replace: v_item.owner_id = (select auth.uid())
-- With:    v_item.owner_id = (select auth.uid())
--          OR (v_item.group_id IS NOT NULL
--              AND is_group_admin(v_item.group_id, (select auth.uid())))
```

The trigger must also set `acted_by = auth.uid()` on status transitions for group items.

### Ratings (`00007_ratings.sql`)

```sql
-- INSERT: update existing policy to handle exclusive-arc
-- Replace: from_user_id != to_user_id
-- With:    (to_user_id IS NOT NULL AND from_user_id != to_user_id)
--          OR (to_group_id IS NOT NULL)
--
-- Replace: items.owner_id = to_user_id (transaction verification)
-- With:    (items.owner_id IS NOT NULL AND items.owner_id = to_user_id)
--          OR (items.group_id IS NOT NULL AND items.group_id = to_group_id)
```

### Ratings trigger (`00007_ratings.sql`)

The existing `update_user_rating_avg` trigger must branch:

- When `to_user_id IS NOT NULL`: existing behavior (update `profiles.rating_avg`)
- When `to_group_id IS NOT NULL`: update `groups.rating_avg` and `groups.rating_count`

### Storage policies (`00014_storage_item_photos.sql`)

Current policies check `(storage.foldername(name))[2] = auth.uid()::text`. Must add:

```sql
-- For group items: path starts with 'group-{group_id}'
-- Allow if user is admin of that group
OR (
  (storage.foldername(name))[2] LIKE 'group-%'
  AND is_group_admin(
    replace((storage.foldername(name))[2], 'group-', '')::uuid,
    auth.uid()
  )
)
```

Note: path format for group photos is `items/group-{group_id}/{item_id}/{filename}`. The `replace()` strips the `group-` prefix before casting to uuid.

## Helper Function Changes

### `can_see_item` (`00004_groups_items.sql`)

Rewrite the function to handle both personal and group items. The complete logic:

```sql
-- User can see item if:
RETURN
  -- Personal item: owner can always see
  (v_item.owner_id = p_user_id)
  -- Group item: any group member can see
  OR (v_item.group_id IS NOT NULL AND is_group_member(v_item.group_id, p_user_id))
  -- Public visibility
  OR (v_item.visibility = 'all')
  -- Groups visibility (personal items shared with specific groups)
  OR (v_item.visibility = 'groups' AND v_item.owner_id IS NOT NULL
      AND user_shares_group_with_item(v_item.id, p_user_id));
```

This is critical — it gates conversation creation in `00006_messaging.sql`. The top-level `group_id IS NOT NULL` branch ensures group admins and members can see their group's items regardless of visibility setting.

### `search_nearby_items` (`00013_functions_search_listing.sql`)

Current filter `i.owner_id != auth.uid()` excludes all group items (NULL owner_id). Replace with:

```sql
-- Exclude own items and items from groups where user is admin
(i.owner_id IS NOT NULL AND i.owner_id != (select auth.uid()))
OR (i.group_id IS NOT NULL
    AND NOT is_group_admin(i.group_id, (select auth.uid())))
```

Also update the visibility filter: for group-owned items, `visibility = 'groups'` means "visible to members of the owning group" — check `is_group_member(i.group_id, auth.uid())` instead of using the `item_groups` junction. The `item_groups` junction path only applies to personal items.

### `get_listing_detail` (`00013_functions_search_listing.sql`)

Currently returns `owner_display_name`, `owner_avatar_url`, etc. by joining profiles. Must add group context:

- When `group_id IS NOT NULL`: return group name, group rating_avg, group rating_count instead of owner profile fields
- Add output columns: `group_name text`, `group_rating_avg numeric`, `group_rating_count integer`
- Update WHERE clauses that check `i.owner_id = auth.uid()` (for "owner can see archived items" and visibility gating) to also accept group admins: `OR (i.group_id IS NOT NULL AND is_group_admin(i.group_id, (select auth.uid())))`
- LEFT JOIN `groups g ON g.id = i.group_id` to populate group output columns

Group-owned items use `visibility` the same way personal items do (`private`, `groups`, `all`), but `visibility = 'groups'` for a group-owned item means "visible to members of the owning group" — it does NOT use the `item_groups` junction table. The `item_groups` junction is only for personal items shared with specific groups.

### `get_user_tags` (`00012_functions_business.sql`)

Extend to include tags from group items where user is admin:

```sql
WHERE owner_id = auth.uid()
   OR (group_id IS NOT NULL AND is_group_admin(group_id, auth.uid()))
```

### `transition_borrow_request` (`00012_functions_business.sql`)

This `SECURITY DEFINER` function must:

1. Accept group admin callers (not just item owner)
2. Set `acted_by = auth.uid()` when the item is group-owned

## Transfer Mechanism

Database function for atomic ownership transfer:

```sql
CREATE FUNCTION transfer_item_ownership(
  p_item_id uuid,
  p_to_owner_id uuid DEFAULT NULL,
  p_to_group_id uuid DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_item items%ROWTYPE;
BEGIN
  -- Validate exclusive target
  IF num_nonnulls(p_to_owner_id, p_to_group_id) != 1 THEN
    RAISE EXCEPTION 'Exactly one target required';
  END IF;

  -- Lock and fetch current item
  SELECT * INTO v_item FROM items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  -- Authorization: caller must be current owner or admin of current group
  IF v_item.owner_id IS NOT NULL THEN
    IF v_item.owner_id != (SELECT auth.uid()) THEN
      RAISE EXCEPTION 'Not authorized: not the item owner';
    END IF;
  ELSIF v_item.group_id IS NOT NULL THEN
    IF NOT is_group_admin(v_item.group_id, (SELECT auth.uid())) THEN
      RAISE EXCEPTION 'Not authorized: not a group admin';
    END IF;
  END IF;

  -- For personal→group: caller must be admin of target group
  IF p_to_group_id IS NOT NULL THEN
    IF NOT is_group_admin(p_to_group_id, (SELECT auth.uid())) THEN
      RAISE EXCEPTION 'Not authorized: not admin of target group';
    END IF;
  END IF;

  -- For group→personal: can only transfer to self
  IF p_to_owner_id IS NOT NULL THEN
    IF p_to_owner_id != (SELECT auth.uid()) THEN
      RAISE EXCEPTION 'Can only transfer group items to yourself';
    END IF;
  END IF;

  -- Check no active borrows
  IF EXISTS (SELECT 1 FROM borrow_requests
             WHERE item_id = p_item_id
             AND status IN ('pending', 'accepted')) THEN
    RAISE EXCEPTION 'Cannot transfer item with active borrows';
  END IF;

  -- Update ownership atomically
  UPDATE items SET
    owner_id = p_to_owner_id,
    group_id = p_to_group_id,
    created_by = CASE WHEN p_to_group_id IS NOT NULL
                      THEN (SELECT auth.uid()) ELSE NULL END,
    visibility = 'private',
    updated_at = now()
  WHERE id = p_item_id;

  -- Clear item_groups junction (no longer relevant after transfer)
  DELETE FROM item_groups WHERE item_id = p_item_id;

  -- Close open conversations: insert system-style marker then remove participants
  -- (conversations become inaccessible but message history is preserved in DB)
  DELETE FROM conversation_participants
  WHERE conversation_id IN (
    SELECT id FROM conversations WHERE item_id = p_item_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Key behaviors:

- Authorization enforced inside the function (caller must own or admin the source, and admin the target group)
- `SELECT ... FOR UPDATE` prevents race conditions during transfer
- Group→personal: admin can only transfer to themselves
- Visibility resets to `private` — must re-list after transfer
- `item_groups` entries cleared on transfer
- Existing photos, tags, and metadata carry over
- Borrow history (completed requests) remains linked to the item
- Conversation participants removed (conversations effectively closed)

## Messaging: Shared Inbox for Group Items

### Conversation creation

When a user contacts about a group item:

1. Create conversation with `item_id`
2. Insert participants: requester + all current group admins
3. Any admin can reply; messages show individual admin names

### Admin roster sync

Trigger on `group_members` to keep conversation participants in sync:

```sql
CREATE FUNCTION sync_group_conversation_participants()
RETURNS trigger AS $$
BEGIN
  -- Promoted to admin: add to all open group item conversations
  IF TG_OP = 'UPDATE' AND NEW.role = 'admin' AND OLD.role = 'member' THEN
    INSERT INTO conversation_participants (conversation_id, user_id)
    SELECT c.id, NEW.user_id
    FROM conversations c
    JOIN items i ON i.id = c.item_id
    WHERE i.group_id = NEW.group_id
    ON CONFLICT DO NOTHING;
  END IF;

  -- Demoted or removed: remove from group item conversations
  -- BUT preserve if user is the requester (non-admin participant)
  IF (TG_OP = 'UPDATE' AND NEW.role = 'member' AND OLD.role = 'admin')
     OR TG_OP = 'DELETE' THEN
    DELETE FROM conversation_participants cp
    WHERE cp.user_id = COALESCE(OLD.user_id, NEW.user_id)
    AND cp.conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN items i ON i.id = c.item_id
      WHERE i.group_id = OLD.group_id
    )
    -- Don't remove if this user is the original requester (non-admin participant)
    AND NOT EXISTS (
      SELECT 1 FROM borrow_requests br
      WHERE br.item_id = (SELECT c2.item_id FROM conversations c2 WHERE c2.id = cp.conversation_id)
      AND br.requester_id = COALESCE(OLD.user_id, NEW.user_id)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Trigger definition:

```sql
CREATE TRIGGER trg_sync_group_conversation_participants
  AFTER INSERT OR UPDATE OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION sync_group_conversation_participants();
```

Note: the NOT EXISTS guard prevents removing a demoted admin from conversations where they are the requester/borrower (not an admin participant).

### Concurrency note

Concurrent admin actions on the same borrow request (e.g., two admins accepting and rejecting simultaneously) are serialized by the borrow request trigger's state machine — invalid transitions raise exceptions. The `transition_borrow_request` function uses `UPDATE ... RETURNING` which implicitly locks the row. This is sufficient; explicit `SELECT FOR UPDATE` is not needed.

## TypeScript Types

```typescript
// models.ts — updated
interface Item {
  id: ItemId;
  ownerId: UserId | undefined; // undefined for group items
  groupId: GroupId | undefined; // undefined for personal items
  createdBy: UserId | undefined; // which admin created/transferred
  // ... rest unchanged
}

interface BorrowRequest {
  // ... existing fields
  actedBy: UserId | undefined; // which admin acted on this request
}

interface Group {
  // ... existing fields
  ratingAvg: number;
  ratingCount: number;
}
```

## New Hooks

```typescript
// src/features/inventory/hooks/useGroupItems.ts
useGroupItems(groupId: GroupId)       // items where group_id = groupId
useCreateGroupItem(groupId: GroupId)  // insert with group_id, created_by
useTransferItem()                      // RPC call to transfer_item_ownership

// src/features/groups/hooks/useGroupRating.ts
useGroupRating(groupId: GroupId)      // group rating aggregate
```

## Modified Hooks

- `useUpdateItem` — branch on group admin permission for group items
- `useDeleteItem` — same admin check branching
- `useCreateConversation` — for group items, insert all admins as participants
- `useBorrowTransition` — set `acted_by` on status changes for group items
- `useConversations` — enrich group conversations with group name, handle multi-party display
- `usePhotoUpload` / `useRemoveItemPhoto` — use group storage path for group items

## Permission Utilities

```typescript
// src/features/inventory/utils/itemPermissions.ts
canEditItem(item: Item, userId: UserId, groupRole?: GroupRole): boolean
canDeleteItem(item: Item, userId: UserId, groupRole?: GroupRole): boolean
canTransferItem(item: Item, userId: UserId, groupRole?: GroupRole): boolean
canBorrowItem(item: Item, userId: UserId, groupRole?: GroupRole): boolean
```

Centralizes "is this my item or am I admin of the owning group" logic.

## UI Changes

### Group detail screen — new Inventory tab

- List of group-owned items using existing `ItemCard`
- "Add Item" FAB for admins only
- Borrow requests section showing all requests on group items

### Item detail — group context

- "Owned by [Group Name]" header instead of owner profile
- Edit/Delete visible to any group admin
- "Transfer to me" action for admins
- "Contact" opens shared inbox conversation

### Personal item detail — transfer action

- "Transfer to group" in actions menu
- Group picker (groups where user is admin)
- Disabled when item has active borrows
- Confirmation dialog: visibility resets, conversations close

### Conversation list

- Group conversations show group avatar + group name
- Item name as subtitle
- Visual distinction from personal conversations

### Conversation detail (group items)

- Messages show individual admin names
- Header: group name + item (for requester), requester name + item (for admins)

### Borrow requests (group items)

- Within group inventory tab
- All admins see all requests
- Actions attributed: "Accepted by [Admin Name]"

## Files Requiring Changes

| File                                                     | Changes                                                                                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/00004_groups_items.sql`             | Items table schema, groups rating columns, items RLS, item_photos RLS, item_groups RLS, `can_see_item` function                     |
| `supabase/migrations/00005_borrow_requests.sql`          | `acted_by` column, all three RLS policies, `borrow_requests_enforce_update_rules` trigger                                           |
| `supabase/migrations/00006_messaging.sql`                | `sync_group_conversation_participants` trigger (new)                                                                                |
| `supabase/migrations/00007_ratings.sql`                  | `to_group_id` column, exclusive-arc constraint, INSERT policy, `update_user_rating_avg` trigger (branch for groups)                 |
| `supabase/migrations/00012_functions_business.sql`       | `get_user_tags`, `transition_borrow_request`                                                                                        |
| `supabase/migrations/00013_functions_search_listing.sql` | `search_nearby_items`, `get_listing_detail`                                                                                         |
| `supabase/migrations/00014_storage_item_photos.sql`      | All storage policies (group path support)                                                                                           |
| `src/shared/types/models.ts`                             | Item, BorrowRequest, Group type updates                                                                                             |
| `src/features/inventory/hooks/`                          | New: useGroupItems, useCreateGroupItem, useTransferItem. Modified: useUpdateItem, useDeleteItem, usePhotoUpload, useRemoveItemPhoto |
| `src/features/inventory/utils/`                          | New: itemPermissions.ts. Modified: validation.ts                                                                                    |
| `src/features/groups/hooks/`                             | New: useGroupRating                                                                                                                 |
| `src/features/messaging/hooks/`                          | Modified: useCreateConversation, useConversations                                                                                   |
| `src/features/borrow/hooks/`                             | Modified: useBorrowTransition                                                                                                       |

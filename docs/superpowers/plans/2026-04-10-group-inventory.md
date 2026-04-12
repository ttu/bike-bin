# Group Inventory Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable groups to own inventory items managed collectively by group admins, with shared-inbox messaging and bidirectional transfer between personal and group ownership.

**Architecture:** Exclusive-arc ownership (`items.owner_id` XOR `items.group_id`) enforced via CHECK constraint. Existing migration files edited directly (project can `db:reset`). RLS policies branch on owner type; helper functions centralize group-admin checks. Shared-inbox messaging by inserting all current admins as conversation participants; admin roster sync via trigger on `group_members`.

**Tech Stack:** PostgreSQL + Supabase (RLS, triggers, RPCs), TypeScript strict mode, TanStack Query, React Native (Expo Router), React Native Paper (MD3), Jest + React Native Testing Library, react-i18next.

**Reference spec:** [docs/superpowers/specs/2026-04-09-group-inventory-design.md](../specs/2026-04-09-group-inventory-design.md)

---

## File Structure

### Migration files (edit existing)

| File                                                       | Responsibility                                           | Changes                                                                                                                                                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/00004_groups_items.sql`               | Items, groups, item_groups schema, helper functions, RLS | items table schema (nullable owner_id, group_id, created_by, CHECK), groups rating columns, items/item_photos/item_groups RLS with admin branches, `can_see_item` rewrite, `idx_items_group` index |
| `supabase/migrations/00005_borrow_requests.sql`            | Borrow request state machine                             | Add `acted_by` column, update all 3 RLS policies, update trigger for group admin auth + set `acted_by`                                                                                             |
| `supabase/migrations/00006_messaging.sql`                  | Conversation/messaging schema                            | Add `sync_group_conversation_participants` function and trigger                                                                                                                                    |
| `supabase/migrations/00007_ratings.sql`                    | Ratings + aggregate triggers                             | Nullable `to_user_id`, add `to_group_id` with exclusive-arc, update INSERT policy, branch rating aggregate trigger for groups, `idx_ratings_to_group` index                                        |
| `supabase/migrations/00012_functions_business.sql`         | Business RPCs                                            | Update `get_user_tags`, update `transition_borrow_request` to accept group admins + set acted_by                                                                                                   |
| `supabase/migrations/00013_functions_search_listing.sql`   | Search / listing RPCs                                    | Update `search_nearby_items` + `get_listing_detail` for group items                                                                                                                                |
| `supabase/migrations/00014_storage_item_photos.sql`        | Storage policies                                         | Add `group-<id>` path branch                                                                                                                                                                       |
| `supabase/migrations/00015_group_inventory_rpcs.sql` (NEW) | New RPCs                                                 | `transfer_item_ownership` function                                                                                                                                                                 |

### TypeScript source changes

| File                                                                      | Responsibility             | Changes                                                                                                                            |
| ------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/types/models.ts`                                              | Domain model types         | `Item.ownerId` → optional, add `Item.groupId` + `Item.createdBy`, add `BorrowRequest.actedBy`, add `Group.ratingAvg`/`ratingCount` |
| `src/shared/utils/mapItemRow.ts`                                          | DB row → model mapping     | Map `group_id`, `created_by`                                                                                                       |
| `src/shared/utils/mapBorrowRequestRow.ts`                                 | DB row → model mapping     | Map `acted_by` (check if file exists, else inline)                                                                                 |
| `src/shared/utils/mapGroupRow.ts` (NEW or extend)                         | DB row → model mapping     | Map rating columns                                                                                                                 |
| `src/features/inventory/utils/itemPermissions.ts` (NEW)                   | Permission helpers         | `canEditItem`, `canDeleteItem`, `canTransferItem`, `canBorrowItem`                                                                 |
| `src/features/inventory/utils/groupItemPath.ts` (NEW)                     | Storage path helper        | Compute `group-<groupId>` path prefix for group items                                                                              |
| `src/features/inventory/hooks/useGroupItems.ts` (NEW)                     | Query group items          | `useGroupItems(groupId)`, `useCreateGroupItem(groupId)`                                                                            |
| `src/features/inventory/hooks/useTransferItem.ts` (NEW)                   | RPC wrapper                | Call `transfer_item_ownership`                                                                                                     |
| `src/features/inventory/hooks/useItems.ts`                                | Items query/mutation hooks | Branch for group admin on update/delete                                                                                            |
| `src/features/inventory/hooks/useItemPhotoManagement.ts`                  | Photo mgmt hooks           | Use group path for group items                                                                                                     |
| `src/features/inventory/hooks/usePhotoUpload.ts`                          | Upload hook                | Accept owner descriptor (user or group) for path                                                                                   |
| `src/features/groups/hooks/useGroupRating.ts` (NEW)                       | Group rating query         | `useGroupRating(groupId)`                                                                                                          |
| `src/features/groups/hooks/useGroups.ts`                                  | Groups query               | Include rating columns in select                                                                                                   |
| `src/features/messaging/hooks/useCreateConversation.ts` (new or existing) | Create conversation        | For group items, insert all admins                                                                                                 |
| `src/features/messaging/hooks/useConversations.ts`                        | Conversation list          | Enrich with group name when item is group-owned                                                                                    |
| `src/features/borrow/hooks/useBorrowTransition.ts`                        | Borrow status transitions  | Set `acted_by` when item is group-owned                                                                                            |

### UI changes (screens + components)

| File                                                                               | Responsibility         | Changes                               |
| ---------------------------------------------------------------------------------- | ---------------------- | ------------------------------------- |
| `app/(tabs)/groups/[id]/index.tsx` or equivalent group detail screen               | Group detail with tabs | Add "Inventory" tab                   |
| `src/features/groups/components/GroupInventoryTab/` (NEW)                          | Group inventory UI     | List + FAB + borrow requests section  |
| `src/features/groups/components/GroupInventoryTab/GroupInventoryTab.tsx`           | Component              | Lists group items with ItemCard       |
| `src/features/groups/components/GroupInventoryTab/GroupInventoryTab.test.tsx`      | Component tests        | Rendering + admin-only FAB visibility |
| `src/features/inventory/components/TransferItemDialog/` (NEW)                      | Transfer dialog        | Group picker + confirmation           |
| `src/features/inventory/components/TransferItemDialog/TransferItemDialog.tsx`      | Component              | Transfer flow                         |
| `src/features/inventory/components/TransferItemDialog/TransferItemDialog.test.tsx` | Component tests        | Disabled states, confirmation copy    |
| `app/(tabs)/inventory/[id].tsx` or ItemDetailScreen                                | Item detail            | Show group context / transfer actions |
| i18n files per feature                                                             | Translations           | Add new keys (en.json at minimum)     |

---

## Phase 1: Database Schema & RLS

Phase scope: update SQL migration files, run `db:reset`, write RLS integration tests.

### Task 1.1: Reorder tables and add `items` group ownership columns

**Files:**

- Modify: `supabase/migrations/00004_groups_items.sql`

**Context:** `items` currently references `groups(id)` via the new FK; `groups` must be created first. This task reorders table definitions AND edits `items` schema in one step so the migration loads correctly on first run.

- [ ] **Step 1: Move `groups`, `group_members`, `item_groups` above `items`**

Cut the three blocks (`CREATE TABLE groups` lines 73-80, `CREATE TABLE group_members` 83-89, `CREATE TABLE item_groups` 92-96) and paste them above `CREATE TABLE items` (currently lines 11-48). Leave helper functions, policies, and triggers in their existing order.

- [ ] **Step 2: Edit items CREATE TABLE**

Make `owner_id` nullable, add `group_id`, `created_by`, and the exclusive-arc constraint:

```sql
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,        -- now nullable
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,           -- new
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,      -- new
  name text NOT NULL,
  -- ... (keep all other columns as-is) ...
  CONSTRAINT items_tags_max_count
    CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 20),
  CONSTRAINT items_tags_no_empty
    CHECK ('' != ALL(tags)),
  CONSTRAINT items_quantity_positive
    CHECK (quantity >= 1),
  CONSTRAINT items_exclusive_owner
    CHECK (num_nonnulls(owner_id, group_id) = 1)
);
```

- [ ] **Step 3: Add partial index on `group_id`**

After the existing items indexes (`CREATE INDEX idx_items_tags ON items USING GIN (tags);`), add:

```sql
CREATE INDEX idx_items_group ON items(group_id) WHERE group_id IS NOT NULL;
```

- [ ] **Step 4: Verify migration loads**

Run: `npm run db:reset`
Expected: completes without errors (no FK forward-reference failures, no CHECK violations on seed data)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/00004_groups_items.sql
git commit -m "feat: add exclusive-arc group ownership to items schema"
```

### Task 1.2: Add rating columns to groups

**Files:**

- Modify: `supabase/migrations/00004_groups_items.sql`

- [ ] **Step 1: Edit groups CREATE TABLE**

Add `rating_avg` and `rating_count` columns:

```sql
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT true NOT NULL,
  rating_avg numeric(3, 2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

- [ ] **Step 2: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00004_groups_items.sql
git commit -m "feat: add rating aggregate columns to groups table"
```

### Task 1.3: Rewrite `can_see_item` helper

**Files:**

- Modify: `supabase/migrations/00004_groups_items.sql` (function at lines 159-178)

- [ ] **Step 1: Replace the function body**

```sql
CREATE OR REPLACE FUNCTION public.can_see_item(p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM items
    WHERE id = p_item_id
      AND (
        visibility = 'all'
        -- Personal item: owner can see
        OR (owner_id IS NOT NULL AND owner_id = p_user_id)
        -- Group item: any group member can see
        OR (group_id IS NOT NULL AND public.is_group_member(group_id, p_user_id))
        -- Personal item shared with groups: groups visibility
        OR (
          owner_id IS NOT NULL
          AND visibility = 'groups'
          AND public.user_shares_group_with_item(id, p_user_id)
        )
      )
  );
$$;
```

- [ ] **Step 2: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00004_groups_items.sql
git commit -m "feat: extend can_see_item to account for group-owned items"
```

### Task 1.4: Update items RLS policies

**Files:**

- Modify: `supabase/migrations/00004_groups_items.sql` (policies at lines 187-213)

- [ ] **Step 1: Replace four items policies**

```sql
CREATE POLICY "items_select_public"
  ON items FOR SELECT
  USING (
    visibility = 'all'
    OR (owner_id IS NOT NULL AND owner_id = (select auth.uid()))
    OR (group_id IS NOT NULL AND public.is_group_member(group_id, (select auth.uid())))
    OR (
      owner_id IS NOT NULL
      AND visibility = 'groups'
      AND public.user_shares_group_with_item(id, (select auth.uid()))
    )
  );

CREATE POLICY "items_insert_own"
  ON items FOR INSERT
  WITH CHECK (
    -- Personal item: caller is the owner
    (owner_id = (select auth.uid()) AND group_id IS NULL)
    -- Group item: caller is admin of the group AND sets created_by to themselves
    OR (
      group_id IS NOT NULL
      AND owner_id IS NULL
      AND created_by = (select auth.uid())
      AND public.is_group_admin(group_id, (select auth.uid()))
    )
  );

CREATE POLICY "items_update_owner"
  ON items FOR UPDATE
  USING (
    (owner_id IS NOT NULL AND owner_id = (select auth.uid()))
    OR (group_id IS NOT NULL AND public.is_group_admin(group_id, (select auth.uid())))
  )
  WITH CHECK (
    (owner_id IS NOT NULL AND owner_id = (select auth.uid()))
    OR (group_id IS NOT NULL AND public.is_group_admin(group_id, (select auth.uid())))
  );

CREATE POLICY "items_delete_own"
  ON items FOR DELETE
  USING (
    (
      (owner_id IS NOT NULL AND owner_id = (select auth.uid()))
      OR (group_id IS NOT NULL AND public.is_group_admin(group_id, (select auth.uid())))
    )
    AND status NOT IN ('loaned', 'reserved')
  );
```

- [ ] **Step 2: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00004_groups_items.sql
git commit -m "feat: items RLS policies support group admin ownership"
```

### Task 1.5: Update item_photos and item_groups RLS

**Files:**

- Modify: `supabase/migrations/00004_groups_items.sql` (policies at lines 219-345)

- [ ] **Step 1: Replace item_photos policies**

```sql
CREATE POLICY "item_photos_select_via_item"
  ON item_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id
        AND (
          items.visibility = 'all'
          OR (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_member(items.group_id, (select auth.uid())))
          OR (
            items.owner_id IS NOT NULL
            AND items.visibility = 'groups'
            AND public.user_shares_group_with_item(items.id, (select auth.uid()))
          )
        )
    )
  );

CREATE POLICY "item_photos_insert_own"
  ON item_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );

CREATE POLICY "item_photos_update_own"
  ON item_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );

CREATE POLICY "item_photos_delete_own"
  ON item_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );
```

- [ ] **Step 2: Replace item_groups INSERT/DELETE policies**

```sql
CREATE POLICY "item_groups_insert_owner"
  ON item_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_groups.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );

CREATE POLICY "item_groups_delete_owner"
  ON item_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_groups.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );
```

- [ ] **Step 3: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/00004_groups_items.sql
git commit -m "feat: item_photos and item_groups RLS support group admins"
```

### Task 1.6: Update borrow_requests schema, policies, and trigger

**Files:**

- Modify: `supabase/migrations/00005_borrow_requests.sql`

- [ ] **Step 1: Add `acted_by` column**

Add to CREATE TABLE:

```sql
acted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
```

- [ ] **Step 2: Replace all 3 policies**

```sql
CREATE POLICY "borrow_requests_select"
  ON borrow_requests FOR SELECT
  USING (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM items
      WHERE items.id = borrow_requests.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );

CREATE POLICY "borrow_requests_insert"
  ON borrow_requests FOR INSERT
  WITH CHECK (
    (select auth.uid()) = requester_id
    AND NOT EXISTS (
      SELECT 1 FROM items
      WHERE items.id = borrow_requests.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );

CREATE POLICY "borrow_requests_update"
  ON borrow_requests FOR UPDATE
  USING (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM items
      WHERE items.id = borrow_requests.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  )
  WITH CHECK (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM items
      WHERE items.id = borrow_requests.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );
```

- [ ] **Step 3: Update `borrow_requests_enforce_update_rules` trigger**

Replace the owner check blocks in the trigger function so they also accept group admins. Key idea: `EXISTS owner OR group admin`. Also set `NEW.acted_by = auth.uid()` when the item is group-owned AND the status is changing. Rewrite the function:

```sql
CREATE OR REPLACE FUNCTION borrow_requests_enforce_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_item items%ROWTYPE;
  v_is_owner_or_admin boolean;
BEGIN
  IF OLD.item_id IS DISTINCT FROM NEW.item_id
     OR OLD.requester_id IS DISTINCT FROM NEW.requester_id THEN
    RAISE EXCEPTION 'borrow_requests: cannot change item_id or requester_id';
  END IF;

  IF OLD.status IN ('rejected', 'returned', 'cancelled') AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'borrow_requests: cannot change status from terminal state %', OLD.status;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_item FROM items WHERE id = NEW.item_id;

  v_is_owner_or_admin :=
    (v_item.owner_id IS NOT NULL AND v_item.owner_id = (select auth.uid()))
    OR (v_item.group_id IS NOT NULL AND public.is_group_admin(v_item.group_id, (select auth.uid())));

  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    IF NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only item owner or group admin may accept or reject';
    END IF;
    IF v_item.group_id IS NOT NULL THEN
      NEW.acted_by := (select auth.uid());
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
    IF OLD.requester_id IS DISTINCT FROM (select auth.uid()) THEN
      RAISE EXCEPTION 'borrow_requests: only requester may cancel a pending request';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'accepted' AND NEW.status = 'returned' THEN
    IF NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only item owner or group admin may mark returned';
    END IF;
    IF v_item.group_id IS NOT NULL THEN
      NEW.acted_by := (select auth.uid());
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'accepted' AND NEW.status = 'cancelled' THEN
    IF OLD.requester_id IS DISTINCT FROM (select auth.uid()) THEN
      RAISE EXCEPTION 'borrow_requests: only requester may cancel an accepted request';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'borrow_requests: invalid status transition from % to %', OLD.status, NEW.status;
END;
$$;
```

- [ ] **Step 4: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/00005_borrow_requests.sql
git commit -m "feat: borrow requests support group admin actions with acted_by tracking"
```

### Task 1.7: Update ratings schema, policies, and trigger

**Files:**

- Modify: `supabase/migrations/00007_ratings.sql`

- [ ] **Step 1: Edit CREATE TABLE ratings**

Make `to_user_id` nullable, add `to_group_id`, exclusive-arc constraint:

```sql
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  to_group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  text text,
  editable_until timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT ratings_exclusive_target
    CHECK (num_nonnulls(to_user_id, to_group_id) = 1)
);

CREATE INDEX idx_ratings_to_user ON ratings(to_user_id) WHERE to_user_id IS NOT NULL;
CREATE INDEX idx_ratings_to_group ON ratings(to_group_id) WHERE to_group_id IS NOT NULL;
```

- [ ] **Step 2: Replace `ratings_insert_verified` policy**

```sql
CREATE POLICY "ratings_insert_verified"
  ON ratings FOR INSERT
  WITH CHECK (
    (select auth.uid()) = from_user_id
    AND (
      -- User-to-user rating: existing rules
      (
        to_user_id IS NOT NULL
        AND from_user_id != to_user_id
        AND EXISTS (
          SELECT 1 FROM borrow_requests br
          JOIN items ON items.id = br.item_id
          WHERE br.status = 'returned'
            AND (
              (br.requester_id = from_user_id AND items.owner_id = to_user_id)
              OR (items.owner_id = from_user_id AND br.requester_id = to_user_id)
            )
            AND (item_id IS NULL OR br.item_id = item_id)
        )
      )
      -- User-to-group rating: requester rated the group after returning
      OR (
        to_group_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM borrow_requests br
          JOIN items ON items.id = br.item_id
          WHERE br.status = 'returned'
            AND br.requester_id = from_user_id
            AND items.group_id = to_group_id
            AND (item_id IS NULL OR br.item_id = item_id)
        )
      )
    )
  );
```

- [ ] **Step 3: Add group rating aggregate function + branch trigger**

Add below `recalc_user_rating_aggregate`:

```sql
CREATE OR REPLACE FUNCTION public.recalc_group_rating_aggregate(target_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF target_group_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE groups
  SET
    rating_avg = COALESCE(
      (SELECT AVG(score) FROM ratings WHERE to_group_id = target_group_id),
      0
    ),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE to_group_id = target_group_id)
  WHERE id = target_group_id;
END;
$$;
```

Replace the `update_user_rating_avg` trigger function to branch:

```sql
CREATE OR REPLACE FUNCTION public.update_user_rating_avg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_user_rating_aggregate(OLD.to_user_id);
    PERFORM public.recalc_group_rating_aggregate(OLD.to_group_id);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.recalc_user_rating_aggregate(NEW.to_user_id);
    PERFORM public.recalc_group_rating_aggregate(NEW.to_group_id);
    RETURN NEW;
  ELSE
    IF OLD.to_user_id IS DISTINCT FROM NEW.to_user_id THEN
      PERFORM public.recalc_user_rating_aggregate(OLD.to_user_id);
      PERFORM public.recalc_user_rating_aggregate(NEW.to_user_id);
    END IF;
    IF OLD.to_group_id IS DISTINCT FROM NEW.to_group_id THEN
      PERFORM public.recalc_group_rating_aggregate(OLD.to_group_id);
      PERFORM public.recalc_group_rating_aggregate(NEW.to_group_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;
```

- [ ] **Step 4: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/00007_ratings.sql
git commit -m "feat: ratings support group targets with own aggregate trigger"
```

### Task 1.8: Add conversation participant sync trigger

**Files:**

- Modify: `supabase/migrations/00006_messaging.sql`

- [ ] **Step 1: Append trigger function and trigger at end of file**

```sql
-- ============================================================
-- Trigger: sync conversation participants with group admin roster
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_group_conversation_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
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
        WHERE i.group_id = COALESCE(OLD.group_id, NEW.group_id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM borrow_requests br
        WHERE br.item_id = (
          SELECT c2.item_id FROM conversations c2 WHERE c2.id = cp.conversation_id
        )
        AND br.requester_id = COALESCE(OLD.user_id, NEW.user_id)
      );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_group_conversation_participants
  AFTER UPDATE OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_group_conversation_participants();
```

- [ ] **Step 2: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00006_messaging.sql
git commit -m "feat: sync conversation participants with group admin roster changes"
```

### Task 1.9: Update business functions (get_user_tags, transition_borrow_request)

**Files:**

- Modify: `supabase/migrations/00012_functions_business.sql`

- [ ] **Step 1: Inspect current file**

Read the file to find `get_user_tags` and `transition_borrow_request`.

Run: (read the file in the editor)

- [ ] **Step 2: Update `get_user_tags`**

Replace the WHERE clause:

```sql
-- Old: WHERE owner_id = (select auth.uid())
-- New:
WHERE (owner_id IS NOT NULL AND owner_id = (select auth.uid()))
   OR (group_id IS NOT NULL AND public.is_group_admin(group_id, (select auth.uid())))
```

- [ ] **Step 3: Update `transition_borrow_request`**

This function performs status transitions via UPDATE on `borrow_requests`. Since the trigger (Task 1.6) already handles authorization and setting `acted_by`, no changes may be needed here unless the function has its own duplicate auth check. Read the function. If it has explicit `owner_id = auth.uid()` checks, extend them. Otherwise document that the trigger handles it.

- [ ] **Step 4: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/00012_functions_business.sql
git commit -m "feat: business functions support group-owned items"
```

### Task 1.10: Update search/listing functions

**Files:**

- Modify: `supabase/migrations/00013_functions_search_listing.sql`

- [ ] **Step 1: Inspect current file**

Read the file to locate `search_nearby_items` and `get_listing_detail`.

- [ ] **Step 2: Update `search_nearby_items` filters**

Replace the exclude-own filter and add group item visibility via membership:

```sql
-- Old: i.owner_id != (select auth.uid())
-- New:
(
  (i.owner_id IS NOT NULL AND i.owner_id != (select auth.uid()))
  OR (i.group_id IS NOT NULL AND NOT public.is_group_admin(i.group_id, (select auth.uid())))
)
```

And the visibility filter. If the existing logic checks `visibility = 'groups' AND item_groups-based share`, add a parallel branch for group-owned items where `visibility = 'groups'` means `is_group_member(i.group_id, auth.uid())`:

```sql
(
  i.visibility = 'all'
  OR (i.visibility = 'groups' AND i.owner_id IS NOT NULL AND public.user_shares_group_with_item(i.id, (select auth.uid())))
  OR (i.visibility = 'groups' AND i.group_id IS NOT NULL AND public.is_group_member(i.group_id, (select auth.uid())))
)
```

- [ ] **Step 3: Update `get_listing_detail`**

Required changes:

1. `LEFT JOIN groups g ON g.id = i.group_id`
2. Add to `RETURNS TABLE` (keep existing owner columns intact, append new ones at the end):
   ```
   group_id uuid,
   group_name text,
   group_rating_avg numeric,
   group_rating_count integer
   ```
3. Add to the SELECT list: `i.group_id, g.name, g.rating_avg, g.rating_count`.
4. Replace the visibility/access filter so group members can see group items:
   ```sql
   WHERE i.id = p_item_id
     AND (
       i.visibility = 'all'
       OR (i.owner_id IS NOT NULL AND i.owner_id = (select auth.uid()))
       OR (i.group_id IS NOT NULL AND public.is_group_member(i.group_id, (select auth.uid())))
       OR (
         i.owner_id IS NOT NULL
         AND i.visibility = 'groups'
         AND public.user_shares_group_with_item(i.id, (select auth.uid()))
       )
     )
   ```

- [ ] **Step 4: Update listing-detail callsite(s) in the client**

Because the RPC signature changes, any client hook consuming `get_listing_detail` needs updating. Search first:

Run: `rg "get_listing_detail" src`

Most likely hits:

- `src/features/listing/hooks/useListingDetail.ts` (or nearest equivalent)
- Any mapper or type describing the row shape

For each callsite:

- Extend the return type with the new group fields.
- Where the UI shows owner name, fall back to `group_name` when `group_id` is present (defer UI wiring to Phase 7; here just widen the type so the code still compiles).

- [ ] **Step 5: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 6: Type-check and commit**

Run: `npm run type-check`
Expected: passes

```bash
git add supabase/migrations/00013_functions_search_listing.sql src
git commit -m "feat: search and listing functions support group-owned items"
```

### Task 1.11: Update storage policies for group item photo paths

**Files:**

- Modify: `supabase/migrations/00014_storage_item_photos.sql`

- [ ] **Step 1: Inspect the file**

Read it to understand current policy structure (INSERT, UPDATE, DELETE on `storage.objects`).

- [ ] **Step 2: Add group path branch to each policy**

Append to the USING/WITH CHECK of write policies:

```sql
-- NOTE: storage.objects uses `bucket_id` (not `bucket`) — match the column name
-- already used in the existing policy when adding this OR-branch.
-- Existing shape:
--   bucket_id = 'item-photos' AND (storage.foldername(name))[1] = auth.uid()::text
-- Add OR-branch to accept group-owned photo paths:
OR (
  bucket_id = 'item-photos'
  AND (storage.foldername(name))[1] LIKE 'group-%'
  AND public.is_group_admin(
    replace((storage.foldername(name))[1], 'group-', '')::uuid,
    (select auth.uid())
  )
)
```

Note: the `foldername` array index depends on the path layout. If paths are `<user-id>/<item-id>/<file>`, index `[1]` is the first segment. Verify by reading the file, adjust accordingly.

- [ ] **Step 3: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/00014_storage_item_photos.sql
git commit -m "feat: storage policies accept group-<id> path for group item photos"
```

### Task 1.12: Create `transfer_item_ownership` RPC

**Files:**

- Create: `supabase/migrations/00015_group_inventory_rpcs.sql`

- [ ] **Step 1: Create new migration file**

```sql
-- ============================================================
-- Group inventory RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.transfer_item_ownership(
  p_item_id uuid,
  p_to_owner_id uuid DEFAULT NULL,
  p_to_group_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_item items%ROWTYPE;
  v_caller uuid := (select auth.uid());
BEGIN
  IF num_nonnulls(p_to_owner_id, p_to_group_id) != 1 THEN
    RAISE EXCEPTION 'transfer_item_ownership: exactly one of p_to_owner_id / p_to_group_id required';
  END IF;

  SELECT * INTO v_item FROM items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer_item_ownership: item % not found', p_item_id;
  END IF;

  -- Authorization: caller must own the item (personal) or be admin of the current group
  IF v_item.owner_id IS NOT NULL THEN
    IF v_item.owner_id != v_caller THEN
      RAISE EXCEPTION 'transfer_item_ownership: not authorized (not the item owner)';
    END IF;
  ELSIF v_item.group_id IS NOT NULL THEN
    IF NOT public.is_group_admin(v_item.group_id, v_caller) THEN
      RAISE EXCEPTION 'transfer_item_ownership: not authorized (not a group admin)';
    END IF;
  END IF;

  -- Personal -> Group: caller must be admin of target group
  IF p_to_group_id IS NOT NULL THEN
    IF NOT public.is_group_admin(p_to_group_id, v_caller) THEN
      RAISE EXCEPTION 'transfer_item_ownership: not authorized for target group';
    END IF;
  END IF;

  -- Group -> Personal: can only transfer to self
  IF p_to_owner_id IS NOT NULL THEN
    IF p_to_owner_id != v_caller THEN
      RAISE EXCEPTION 'transfer_item_ownership: can only transfer group items to yourself';
    END IF;
  END IF;

  -- No active borrows
  IF EXISTS (
    SELECT 1 FROM borrow_requests
    WHERE item_id = p_item_id AND status IN ('pending', 'accepted')
  ) THEN
    RAISE EXCEPTION 'transfer_item_ownership: cannot transfer item with active borrows';
  END IF;

  UPDATE items SET
    owner_id = p_to_owner_id,
    group_id = p_to_group_id,
    created_by = CASE WHEN p_to_group_id IS NOT NULL THEN v_caller ELSE NULL END,
    visibility = 'private',
    updated_at = now()
  WHERE id = p_item_id;

  DELETE FROM item_groups WHERE item_id = p_item_id;

  DELETE FROM conversation_participants
  WHERE conversation_id IN (
    SELECT id FROM conversations WHERE item_id = p_item_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_item_ownership(uuid, uuid, uuid) TO authenticated;
```

- [ ] **Step 2: Run db:reset**

Run: `npm run db:reset`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00015_group_inventory_rpcs.sql
git commit -m "feat: add transfer_item_ownership RPC with full authorization"
```

### Task 1.13: RLS integration tests

**Files:**

- Create: `supabase/tests/rls/group_inventory.test.ts` (or wherever existing RLS tests live — check `npm run test:rls` output)

- [ ] **Step 1: Inspect existing RLS test structure**

Look at existing tests in `supabase/tests/` or similar. Find how tests create users, assign roles, insert items. Use that pattern.

- [ ] **Step 2: Write failing tests covering these scenarios**

```typescript
describe('group inventory RLS', () => {
  test('admin can create item with group_id', async () => {
    /* expect success */
  });
  test('non-admin member cannot create group item', async () => {
    /* expect error */
  });
  test('admin can update group item', async () => {
    /* expect success */
  });
  test('member cannot update group item', async () => {
    /* expect error */
  });
  test('admin cannot delete loaned group item', async () => {
    /* expect error */
  });
  test('member can see group item', async () => {
    /* expect row returned */
  });
  test('non-member cannot see private group item', async () => {
    /* expect empty */
  });
  test('non-member can see public (visibility=all) group item', async () => {
    /* expect returned */
  });
  test('CHECK constraint rejects item with both owner_id and group_id', async () => {
    /* expect error */
  });
  test('CHECK constraint rejects item with neither owner_id nor group_id', async () => {
    /* expect error */
  });
  test('member can create borrow request on group item', async () => {
    /* expect success */
  });
  test('admin cannot create borrow request on own group item', async () => {
    /* expect error */
  });
  test('admin can accept borrow request and acted_by is set', async () => {
    /* expect success */
  });
  test('transfer personal→group: admin of target, sets group_id, clears visibility', async () => {
    /* expect success */
  });
  test('transfer group→personal: self only', async () => {
    /* expect success */
  });
  test('transfer blocked when active borrow exists', async () => {
    /* expect error */
  });
  test('rating a group after returned borrow succeeds', async () => {
    /* expect success */
  });
  test('rating a group updates groups.rating_avg', async () => {
    /* expect value */
  });
  test('demoting admin removes them from group item conversations', async () => {
    /* expect removed */
  });
  test('demoting admin keeps them in conversations where they are requester', async () => {
    /* expect retained */
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail (not yet passing)**

Run: `npm run test:rls`
Expected: new tests fail

- [ ] **Step 4: Fix any issues in the migration work to make them pass**

Iterate on migrations/policies until all new tests pass.

Run: `npm run test:rls`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add supabase/tests/rls/group_inventory.test.ts
git commit -m "test: add RLS integration tests for group inventory"
```

---

## Phase 2: TypeScript types + mappers

### Task 2.1: Update `Item` interface

**Files:**

- Modify: `src/shared/types/models.ts:56-88`

- [ ] **Step 1: Edit Item interface**

```typescript
export interface Item {
  id: ItemId;
  ownerId: UserId | undefined; // undefined for group items
  groupId: GroupId | undefined; // undefined for personal items
  createdBy: UserId | undefined; // which admin created/transferred (group items only)
  bikeId: BikeId | undefined;
  // ... rest of the existing fields unchanged
}
```

- [ ] **Step 2: Update mapItemRow to include new fields**

Edit `src/shared/utils/mapItemRow.ts`:

```typescript
// In mapItemRow:
ownerId: row.owner_id ?? undefined,
groupId: row.group_id ?? undefined,
createdBy: row.created_by ?? undefined,
```

- [ ] **Step 3: Run type-check**

Run: `npm run lint && npm run type-check`

Check what the project uses:

```bash
grep -E '"type-check"|"tsc"' package.json
```

Use the appropriate script. Expect new type errors in places that reference `item.ownerId` assuming non-null.

- [ ] **Step 4: Fix or annotate all `item.ownerId` usages**

Each callsite must either:

- Check `if (item.ownerId) { ... }` or `if (item.groupId) { ... }`
- Or use a helper from `itemPermissions.ts` (Task 3.1) if relevant

Fix them one file at a time as type-check flags them. Keep commits small.

- [ ] **Step 5: Run type-check again**

Run: `npm run type-check`
Expected: no errors

- [ ] **Step 6: Run unit tests**

Run: `npm run test:unit`
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add src/shared/types/models.ts src/shared/utils/mapItemRow.ts
git commit -m "feat: Item type supports group ownership via exclusive ownerId/groupId"
```

### Task 2.2: Update `BorrowRequest` interface

**Files:**

- Modify: `src/shared/types/models.ts:141-149`

- [ ] **Step 1: Add actedBy**

```typescript
export interface BorrowRequest {
  id: BorrowRequestId;
  itemId: ItemId;
  requesterId: UserId;
  status: BorrowRequestStatus;
  message: string | undefined;
  actedBy: UserId | undefined; // new — admin who acted on group item transitions
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Find and update the BorrowRequest mapper**

Grep for where `borrow_requests` rows are mapped to the model. Add `actedBy: row.acted_by ?? undefined`.

Run: `grep -rn "borrow_requests" src/ --include="*.ts" | grep -i "map\|row"`

- [ ] **Step 3: Type-check + tests**

Run: `npm run type-check && npm run test:unit`
Expected: clean

- [ ] **Step 4: Commit**

```bash
git add src/shared/types/models.ts src/features/borrow
git commit -m "feat: BorrowRequest tracks acting admin via actedBy"
```

### Task 2.3: Update `Group` interface with rating fields

**Files:**

- Modify: `src/shared/types/models.ts:126-132`

- [ ] **Step 1: Edit Group interface**

```typescript
export interface Group {
  id: GroupId;
  name: string;
  description: string | undefined;
  isPublic: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}
```

- [ ] **Step 2: Find the group row mapper**

Grep for where `groups` rows are mapped. Usually in `src/features/groups/hooks/useGroups.ts` or a shared mapper. Add `ratingAvg` / `ratingCount`.

- [ ] **Step 3: Ensure the select includes the new columns**

If `useGroups` / `useGroup` use `select('*')`, nothing to change. If explicit column lists, add `rating_avg, rating_count`.

- [ ] **Step 4: Type-check + tests**

Run: `npm run type-check && npm run test:unit`
Expected: clean

- [ ] **Step 5: Commit**

```bash
git add src/shared/types/models.ts src/features/groups
git commit -m "feat: Group type includes rating aggregate fields"
```

---

## Phase 3: Inventory feature — hooks + utilities

### Task 3.1: Create `itemPermissions.ts` utility

**Files:**

- Create: `src/features/inventory/utils/itemPermissions.ts`
- Create: `src/features/inventory/utils/__tests__/itemPermissions.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { canEditItem, canDeleteItem, canTransferItem, canBorrowItem } from '../itemPermissions';
import type { Item } from '@/shared/types';
import { GroupRole, ItemStatus } from '@/shared/types';

const personalItem = (ownerId: string) =>
  ({ ownerId, groupId: undefined, status: ItemStatus.Stored }) as unknown as Item;
const groupItem = (groupId: string) =>
  ({ ownerId: undefined, groupId, status: ItemStatus.Stored }) as unknown as Item;

describe('itemPermissions', () => {
  describe('canEditItem', () => {
    test('owner can edit personal item', () => {
      expect(canEditItem(personalItem('u1'), 'u1', undefined)).toBe(true);
    });
    test('non-owner cannot edit personal item', () => {
      expect(canEditItem(personalItem('u1'), 'u2', undefined)).toBe(false);
    });
    test('group admin can edit group item', () => {
      expect(canEditItem(groupItem('g1'), 'u1', GroupRole.Admin)).toBe(true);
    });
    test('group member cannot edit group item', () => {
      expect(canEditItem(groupItem('g1'), 'u1', GroupRole.Member)).toBe(false);
    });
  });

  describe('canBorrowItem', () => {
    test('non-owner can borrow personal item', () => {
      expect(canBorrowItem(personalItem('u1'), 'u2', undefined)).toBe(true);
    });
    test('owner cannot borrow own personal item', () => {
      expect(canBorrowItem(personalItem('u1'), 'u1', undefined)).toBe(false);
    });
    test('group member can borrow group item', () => {
      expect(canBorrowItem(groupItem('g1'), 'u1', GroupRole.Member)).toBe(true);
    });
    test('group admin cannot borrow group item', () => {
      expect(canBorrowItem(groupItem('g1'), 'u1', GroupRole.Admin)).toBe(false);
    });
  });

  describe('canTransferItem', () => {
    test('owner can transfer personal item in stored state', () => {
      expect(canTransferItem(personalItem('u1'), 'u1', undefined)).toBe(true);
    });
    test('cannot transfer loaned item', () => {
      const item = {
        ownerId: 'u1',
        groupId: undefined,
        status: ItemStatus.Loaned,
      } as unknown as Item;
      expect(canTransferItem(item, 'u1', undefined)).toBe(false);
    });
    test('group admin can transfer group item', () => {
      expect(canTransferItem(groupItem('g1'), 'u1', GroupRole.Admin)).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- itemPermissions`
Expected: module not found error

- [ ] **Step 3: Implement itemPermissions.ts**

```typescript
import type { Item } from '@/shared/types';
import { GroupRole, ItemStatus } from '@/shared/types';

const ACTIVE_BORROW_STATUSES: ItemStatus[] = [ItemStatus.Loaned, ItemStatus.Reserved];

export function canEditItem(item: Item, userId: string, groupRole: GroupRole | undefined): boolean {
  if (item.ownerId !== undefined) return item.ownerId === userId;
  if (item.groupId !== undefined) return groupRole === GroupRole.Admin;
  return false;
}

export function canDeleteItem(
  item: Item,
  userId: string,
  groupRole: GroupRole | undefined,
): boolean {
  if (ACTIVE_BORROW_STATUSES.includes(item.status)) return false;
  return canEditItem(item, userId, groupRole);
}

export function canTransferItem(
  item: Item,
  userId: string,
  groupRole: GroupRole | undefined,
): boolean {
  if (ACTIVE_BORROW_STATUSES.includes(item.status)) return false;
  return canEditItem(item, userId, groupRole);
}

export function canBorrowItem(
  item: Item,
  userId: string,
  groupRole: GroupRole | undefined,
): boolean {
  if (item.ownerId !== undefined) return item.ownerId !== userId;
  if (item.groupId !== undefined) return groupRole !== GroupRole.Admin;
  return false;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:unit -- itemPermissions`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/features/inventory/utils/itemPermissions.ts src/features/inventory/utils/__tests__/itemPermissions.test.ts
git commit -m "feat: add itemPermissions utility for owner/group admin checks"
```

### Task 3.2: Create `useGroupItems` / `useCreateGroupItem` hooks

**Files:**

- Create: `src/features/inventory/hooks/useGroupItems.ts`
- Create: `src/features/inventory/hooks/__tests__/useGroupItems.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// Mock supabase from '@/shared/api/supabase'
// Mock useAuth from '@/features/auth'
// Test:
// - useGroupItems calls supabase.from('items').select('*').eq('group_id', groupId)
// - useCreateGroupItem inserts { group_id: groupId, owner_id: null, created_by: user.id, ... }
```

Follow the pattern from existing tests in `src/features/inventory/hooks/__tests__/`.

- [ ] **Step 2: Run test**

Run: `npm run test:unit -- useGroupItems`
Expected: fails

- [ ] **Step 3: Implement useGroupItems.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import type { Item, GroupId } from '@/shared/types';
import { ItemCategory, ItemStatus } from '@/shared/types';
import { mapItemRow } from '@/shared/utils/mapItemRow';
import { fetchThumbnailPaths } from '@/shared/utils/fetchThumbnailPaths';
import type { ItemFormData } from '../utils/validation';

export function useGroupItems(groupId: GroupId | undefined) {
  return useQuery({
    queryKey: ['group-items', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('group_id', groupId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const items = (data ?? []).map((row) => mapItemRow(row));
      const thumbMap = await fetchThumbnailPaths(items.map((i) => i.id));
      return items.map((item) => ({ ...item, thumbnailStoragePath: thumbMap.get(item.id) }));
    },
    enabled: !!groupId,
  });
}

export function useCreateGroupItem(groupId: GroupId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (formData: ItemFormData) => {
      const { data, error } = await supabase
        .from('items')
        .insert({
          owner_id: null,
          group_id: groupId,
          created_by: user!.id,
          name: formData.name,
          category: formData.category,
          subcategory: formData.subcategory,
          condition: formData.condition,
          brand: formData.brand,
          model: formData.model,
          description: formData.description,
          status: ItemStatus.Stored,
          availability_types: formData.availabilityTypes,
          price: formData.price,
          deposit: formData.deposit,
          borrow_duration: formData.borrowDuration,
          storage_location: formData.storageLocation,
          age: formData.age,
          usage_km: formData.usageKm,
          remaining_fraction:
            formData.category === ItemCategory.Consumable ? formData.remainingFraction : null,
          purchase_date: formData.purchaseDate,
          mounted_date: formData.mountedDate,
          pickup_location_id: formData.pickupLocationId,
          // Group items default to 'groups' visibility so all members can see them.
          // Admins can still flip this to 'all' (publicly listable) via the form;
          // 'private' is not a meaningful state for group-owned items, so we skip it as a default.
          visibility: formData.visibility ?? 'groups',
          tags: formData.tags ?? [],
          quantity: formData.quantity ?? 1,
        })
        .select()
        .single();
      if (error) throw error;
      return mapItemRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-items', groupId] });
      queryClient.invalidateQueries({ queryKey: ['user-tags'] });
    },
  });
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:unit -- useGroupItems`
Expected: pass

- [ ] **Step 5: Commit**

```bash
git add src/features/inventory/hooks/useGroupItems.ts src/features/inventory/hooks/__tests__/useGroupItems.test.ts
git commit -m "feat: add useGroupItems and useCreateGroupItem hooks"
```

### Task 3.3: Create `useTransferItem` hook

**Files:**

- Create: `src/features/inventory/hooks/useTransferItem.ts`
- Create: `src/features/inventory/hooks/__tests__/useTransferItem.test.ts`

- [ ] **Step 1: Write failing test**

Test that calling `mutate({ itemId, toOwnerId })` or `mutate({ itemId, toGroupId })` calls `supabase.rpc('transfer_item_ownership', {...})` with the right arguments, and invalidates `items`, `group-items`, `conversations` queries.

- [ ] **Step 2: Run test**

Run: `npm run test:unit -- useTransferItem`
Expected: fails

- [ ] **Step 3: Implement useTransferItem.ts**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { ItemId, UserId, GroupId } from '@/shared/types';

type TransferParams =
  | { itemId: ItemId; toOwnerId: UserId; toGroupId?: never }
  | { itemId: ItemId; toOwnerId?: never; toGroupId: GroupId };

export function useTransferItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: TransferParams) => {
      const { error } = await supabase.rpc('transfer_item_ownership', {
        p_item_id: params.itemId,
        p_to_owner_id: params.toOwnerId ?? null,
        p_to_group_id: params.toGroupId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['group-items'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:unit -- useTransferItem`
Expected: pass

- [ ] **Step 5: Commit**

```bash
git add src/features/inventory/hooks/useTransferItem.ts src/features/inventory/hooks/__tests__/useTransferItem.test.ts
git commit -m "feat: add useTransferItem hook wrapping transfer_item_ownership RPC"
```

### Task 3.4: Update photo upload for group item path

**Files:**

- Create: `src/features/inventory/utils/groupItemPath.ts`
- Modify: `src/features/inventory/hooks/usePhotoUpload.ts`

- [ ] **Step 1: Inspect usePhotoUpload.ts**

Read the file to understand the current path construction.

- [ ] **Step 2: Add helper**

```typescript
// src/features/inventory/utils/groupItemPath.ts
import type { Item } from '@/shared/types';

/** Returns the storage path prefix for an item's photos. */
export function getItemPhotoPathPrefix(item: Pick<Item, 'ownerId' | 'groupId'>): string {
  if (item.groupId !== undefined) return `group-${item.groupId}`;
  if (item.ownerId !== undefined) return item.ownerId;
  throw new Error('Item has neither ownerId nor groupId');
}
```

- [ ] **Step 3: Update `usePhotoUpload` to use helper when passed an item**

Minimal invasive change: accept an optional `pathPrefix` parameter, default to user id for back-compat. Group item screens pass `pathPrefix = getItemPhotoPathPrefix(item)`.

- [ ] **Step 4: Add test for helper**

```typescript
// src/features/inventory/utils/__tests__/groupItemPath.test.ts
import { getItemPhotoPathPrefix } from '../groupItemPath';

test('returns group prefix for group item', () => {
  expect(getItemPhotoPathPrefix({ ownerId: undefined, groupId: 'g1' as any })).toBe('group-g1');
});

test('returns user id for personal item', () => {
  expect(getItemPhotoPathPrefix({ ownerId: 'u1' as any, groupId: undefined })).toBe('u1');
});

test('throws for invalid item', () => {
  expect(() => getItemPhotoPathPrefix({ ownerId: undefined, groupId: undefined })).toThrow();
});
```

- [ ] **Step 5: Run tests**

Run: `npm run test:unit -- groupItemPath usePhotoUpload`
Expected: pass

- [ ] **Step 6: Commit**

```bash
git add src/features/inventory
git commit -m "feat: photo upload uses group-prefixed path for group items"
```

---

## Phase 4: Groups feature — rating hook

### Task 4.1: Create `useGroupRating` hook

**Files:**

- Create: `src/features/groups/hooks/useGroupRating.ts`
- Create: `src/features/groups/hooks/__tests__/useGroupRating.test.ts`

- [ ] **Step 1: Write failing test**

Test that `useGroupRating(groupId)` queries `groups.select('rating_avg, rating_count')` and returns `{ ratingAvg, ratingCount }`.

- [ ] **Step 2: Implement**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { GroupId } from '@/shared/types';

export function useGroupRating(groupId: GroupId | undefined) {
  return useQuery({
    queryKey: ['group-rating', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('rating_avg, rating_count')
        .eq('id', groupId!)
        .single();
      if (error) throw error;
      return { ratingAvg: data.rating_avg as number, ratingCount: data.rating_count as number };
    },
    enabled: !!groupId,
  });
}
```

- [ ] **Step 3: Run tests + commit**

```bash
npm run test:unit -- useGroupRating
git add src/features/groups/hooks/useGroupRating.ts src/features/groups/hooks/__tests__/useGroupRating.test.ts
git commit -m "feat: add useGroupRating hook"
```

---

## Phase 5: Messaging — shared inbox for group items

### Task 5.0: Inspect messaging RLS for owner-based assumptions

**Files:**

- Read only: `supabase/migrations/00006_messaging.sql`

Before touching client code, verify that the `conversations`, `conversation_participants`, and `messages` RLS policies do not hardcode `item.owner_id = auth.uid()` anywhere. Any such check will block group admins who are not the item's personal owner (group items have `owner_id IS NULL`).

- [ ] **Step 1: Read the messaging migration**

Run: `rg "owner_id" supabase/migrations/00006_messaging.sql`

For each hit inside a policy USING/WITH CHECK clause, decide whether the policy needs to accept group admins. Typical fix pattern:

```sql
-- Replace: items.owner_id = (select auth.uid())
-- With:
(
  (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
  OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
)
```

Alternatively, rely on `conversation_participants` membership (INSERT is already scoped per-user; SELECT is typically participant-scoped). Most policies should already work because Task 1.8's trigger keeps participant rows in sync with the admin roster.

- [ ] **Step 2: Patch any owner-only policies**

Apply the admin-branch pattern above to any policy that used a direct owner check.

- [ ] **Step 3: Run db:reset + rls tests**

Run: `npm run db:reset && npm run test:rls -- messaging`
Expected: no regressions

- [ ] **Step 4: Commit (only if changes were made)**

```bash
git add supabase/migrations/00006_messaging.sql
git commit -m "feat: messaging RLS policies accept group admins for group-owned items"
```

If no policies needed changes, skip the commit and document the inspection result in the PR description.

### Task 5.1: Update `useCreateConversation` to insert all admins

**Files:**

- Modify: `src/features/messaging/hooks/useCreateConversation.ts` (or equivalent)

- [ ] **Step 1: Inspect the existing hook**

Read `src/features/messaging/hooks/` to find the create-conversation logic. If it does not exist as a standalone hook, it may live inside another hook (e.g. the contact button handler).

- [ ] **Step 2: Write failing test**

For a group-owned item, creating a conversation should:

1. Insert conversation with `item_id`
2. Insert `conversation_participants` for requester + all group admins (fetched via `group_members` select)

- [ ] **Step 3: Implement**

```typescript
// Pseudocode; adapt to the existing hook shape
async function createConversation(item: Item, requesterId: UserId) {
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ item_id: item.id })
    .select()
    .single();
  if (error) throw error;

  const participants: { conversation_id: string; user_id: string }[] = [
    { conversation_id: conv.id, user_id: requesterId },
  ];

  if (item.groupId !== undefined) {
    const { data: admins, error: adminErr } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', item.groupId)
      .eq('role', 'admin');
    if (adminErr) throw adminErr;
    for (const a of admins ?? []) {
      participants.push({ conversation_id: conv.id, user_id: a.user_id });
    }
  } else if (item.ownerId !== undefined) {
    participants.push({ conversation_id: conv.id, user_id: item.ownerId });
  }

  const { error: pErr } = await supabase.from('conversation_participants').insert(participants);
  if (pErr) throw pErr;

  return conv;
}
```

- [ ] **Step 4: Run tests + commit**

```bash
npm run test:unit -- useCreateConversation
git add src/features/messaging
git commit -m "feat: create conversation inserts all group admins for group items"
```

### Task 5.2: Enrich `useConversations` with group context

**Files:**

- Modify: `src/features/messaging/hooks/useConversations.ts`

- [ ] **Step 1: Inspect current hook**

Understand how the conversation list is constructed (item join, participant enrichment).

- [ ] **Step 2: Add group join**

Extend the select to include `items.group_id`, and when `group_id` is set, fetch `groups.name` and treat the "other side" as the group rather than a specific user.

- [ ] **Step 3: Update `ConversationListItem` shape**

Add `groupId`, `groupName`, `isGroupConversation` fields (undefined when personal).

- [ ] **Step 4: Update tests**

Update existing `useConversations` tests for the new enrichment, add tests for group item conversations.

- [ ] **Step 5: Run tests + commit**

```bash
npm run test:unit -- useConversations
git add src/features/messaging
git commit -m "feat: useConversations enriches group item conversations with group name"
```

---

## Phase 6: Borrow flow — acted_by and permission branching

### Task 6.1: Update `useBorrowTransition` to handle group items

**Files:**

- Modify: `src/features/borrow/hooks/useBorrowTransition.ts`

- [ ] **Step 1: Inspect the hook**

Read the current implementation.

- [ ] **Step 2: Update query invalidations**

Ensure that after a status transition, `['group-items', item.groupId]` is invalidated (in addition to `['items']`).

- [ ] **Step 3: Verify the server-side trigger sets `acted_by`**

Per Task 1.6, the trigger sets `acted_by = auth.uid()` for group items — the client does not need to pass it. Document this in a code comment.

- [ ] **Step 4: Run tests + commit**

```bash
npm run test:unit -- useBorrowTransition
git add src/features/borrow
git commit -m "feat: borrow transitions invalidate group-items cache for group-owned items"
```

---

## Phase 7: UI — Group Inventory tab + transfer dialog + item detail updates

### Task 7.1: Create GroupInventoryTab component

**Files:**

- Create: `src/features/groups/components/GroupInventoryTab/GroupInventoryTab.tsx`
- Create: `src/features/groups/components/GroupInventoryTab/GroupInventoryTab.test.tsx`
- Create: `src/features/groups/components/GroupInventoryTab/index.ts`

- [ ] **Step 1: Write failing test**

```typescript
// Rendering: lists items from useGroupItems mock
// Admin: FAB visible
// Non-admin: FAB not visible
// Empty state: shows empty message (i18n key)
```

- [ ] **Step 2: Implement**

Use `useGroupItems` for data and the existing `useGroupMembers` hook (`src/features/groups/hooks/useGroupMembers.ts`) to determine the current user's role. Render the list via `ItemCard`. FAB guarded by `role === 'admin'`.

Before wiring, confirm the shape returned by `useGroupMembers` (array of `{ userId, role }` or similar) and adapt the role lookup accordingly.

- [ ] **Step 3: Run tests + commit**

```bash
npm run test:unit -- GroupInventoryTab
git add src/features/groups/components/GroupInventoryTab
git commit -m "feat: add GroupInventoryTab component for group detail screen"
```

### Task 7.2: Wire GroupInventoryTab into group detail screen

**Files:**

- Modify: `app/(tabs)/groups/[id]/...` (find the group detail screen via `grep -rn "useGroup(" app/`)

- [ ] **Step 1: Locate the group detail screen file**

Run: `grep -rn "useGroup\b" app/`

- [ ] **Step 2: Add Inventory tab**

If the screen already uses Paper's `SegmentedButtons` or a tab bar, add a new option. Otherwise introduce one.

- [ ] **Step 3: Manual smoke check**

Run the app via `npm run dev`, navigate to a group, verify the tab appears.

- [ ] **Step 4: Commit**

```bash
git add app/
git commit -m "feat: add Inventory tab to group detail screen"
```

### Task 7.3: Create TransferItemDialog

**Files:**

- Create: `src/features/inventory/components/TransferItemDialog/TransferItemDialog.tsx`
- Create: `src/features/inventory/components/TransferItemDialog/TransferItemDialog.test.tsx`

- [ ] **Step 1: Write failing test**

- Dialog shows list of groups where user is admin
- Confirms: "Visibility will reset to private. Open conversations will close."
- Disabled when `canTransferItem(item, user, role) === false`
- Calls `useTransferItem().mutate` with `{ itemId, toGroupId }` on confirm

- [ ] **Step 2: Implement**

Use `useGroups()` filtered by admin role, Paper `Dialog`, `List` for group picker.

- [ ] **Step 3: Run tests + commit**

```bash
npm run test:unit -- TransferItemDialog
git add src/features/inventory/components/TransferItemDialog
git commit -m "feat: add TransferItemDialog for personal→group transfer"
```

### Task 7.4: Wire transfer actions into item detail screens

**Files:**

- Modify: `app/(tabs)/inventory/[id]/...` (find via grep)
- Modify: group item detail if a separate route exists

- [ ] **Step 1: Find item detail screen**

Run: `grep -rn "useItem\b" app/`

- [ ] **Step 2: Add menu items**

- Personal item screen: "Transfer to group" menu option opening `TransferItemDialog`
- Group item screen: "Transfer to me" menu option calling `useTransferItem` with `toOwnerId: user.id`
- Both disabled when `canTransferItem` returns false

Use `itemPermissions` utility for gating.

- [ ] **Step 3: Commit**

```bash
git add app/
git commit -m "feat: item detail screens expose transfer actions"
```

### Task 7.5: Update ItemDetailScreen to show group ownership context

**Files:**

- Modify: item detail screen(s) located in Task 7.4
- Modify: any header component that displays "owned by"

- [ ] **Step 1: Branch owner display**

When `item.groupId !== undefined`, fetch group via `useGroup(item.groupId)` and show "Owned by [group.name]" with group rating stars (from `useGroupRating`). When `item.ownerId !== undefined`, existing behavior.

- [ ] **Step 2: Branch edit/delete visibility**

Use `canEditItem` / `canDeleteItem` with current user + group role.

- [ ] **Step 3: Commit**

```bash
git add app/ src/features/inventory/components
git commit -m "feat: item detail shows group ownership and admin actions"
```

### Task 7.6: Update conversation list to show group conversations

**Files:**

- Modify: `src/features/messaging/components/ConversationCard/ConversationCard.tsx` or equivalent

- [ ] **Step 1: Branch card rendering**

When `isGroupConversation` is true, show group avatar (placeholder) + group name as title, item name as subtitle. Otherwise existing behavior.

- [ ] **Step 2: Update tests**

Add cases for group conversation rendering.

- [ ] **Step 3: Commit**

```bash
git add src/features/messaging
git commit -m "feat: conversation card distinguishes group conversations"
```

### Task 7.7: Conversation detail header for group items

**Files:**

- Modify: `app/(tabs)/messages/[id]/...` or the messaging screen

- [ ] **Step 1: Branch header**

For requester's view: show group name + item name. For admin's view: show requester name + item name. Both use the data already in `ConversationListItem` / message hooks.

- [ ] **Step 2: Commit**

```bash
git add app/
git commit -m "feat: conversation detail header reflects group context"
```

---

## Phase 8: i18n, validation, and finalization

### Task 8.1: Add i18n keys

**Files:**

- Modify: `src/features/groups/i18n/en.json` (or equivalent)
- Modify: `src/features/inventory/i18n/en.json`
- Modify: other locale files if present (mirror)

- [ ] **Step 1: Add keys**

Suggested keys:

```json
{
  "inventory": {
    "groupOwnedBy": "Owned by {{groupName}}",
    "transferToGroup": "Transfer to group",
    "transferToMe": "Transfer to me",
    "transferConfirm": "Visibility will reset to private and open conversations will close. Continue?",
    "transferBlockedActiveBorrow": "Cannot transfer: item has an active borrow"
  },
  "groups": {
    "inventoryTab": "Inventory",
    "inventoryEmpty": "No items in this group yet",
    "addItem": "Add item"
  }
}
```

- [ ] **Step 2: Use keys in components**

Replace any hardcoded English strings from Phase 7 with `t()` calls.

- [ ] **Step 3: Run validate:i18n**

Run: `npm run validate:i18n`
Expected: no missing/unused keys

- [ ] **Step 4: Commit**

```bash
git add src/features/groups/i18n src/features/inventory/i18n src/features/groups/components src/features/inventory/components app/
git commit -m "feat: add i18n keys for group inventory feature"
```

### Task 8.2: Run full validate

- [ ] **Step 1: Run full validation**

Run: `npm run validate`
Expected: format + lint + type-check + test + build all pass

- [ ] **Step 2: Fix any remaining issues**

Iterate until clean.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore: final fixes from npm run validate"
```

### Task 8.3: Update documentation

**Files:**

- Modify: `docs/datamodel.md`
- Modify: `docs/functional-specs.md` (group inventory section)
- Modify: `docs/feature-design.md` (group inventory UX)

- [ ] **Step 1: Update datamodel.md**

Add `Item.groupId`, `Item.createdBy`, `BorrowRequest.actedBy`, `Group.ratingAvg/Count`, and document the exclusive-arc invariant.

- [ ] **Step 2: Update functional-specs.md**

Document group inventory feature: who can create, how borrow flow works, rating target, transfer rules.

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "docs: document group inventory feature"
```

### Task 8.4: Finishing branch

- [ ] **Step 1: Rebase on main**

Run:

```bash
git fetch origin
git rebase origin/main
```

- [ ] **Step 2: Squash all commits into one**

```bash
git reset --soft origin/main
git commit -m "feat: group inventory ownership with shared admin inbox

- Items can be owned by groups via exclusive-arc (owner_id XOR group_id)
- Group admins create/edit/delete group items; members can borrow
- Shared inbox: all admins participate in group item conversations
- Bidirectional transfer via transfer_item_ownership RPC
- Group rating aggregate separate from user ratings
- RLS, triggers, RPCs updated across 7 migration files
- New hooks: useGroupItems, useTransferItem, useGroupRating
- New UI: GroupInventoryTab, TransferItemDialog

Refs: docs/superpowers/specs/2026-04-09-group-inventory-design.md"
```

- [ ] **Step 3: Run validate one more time**

Run: `npm run validate`
Expected: pass

- [ ] **Step 4: Push and open PR**

```bash
git push -u origin feat/group-inventory
gh pr create --title "feat: group inventory ownership" --body "$(cat <<'EOF'
## Summary
- Enables groups to own inventory items managed collectively by group admins
- Shared inbox messaging where all admins participate in conversations about group items
- Bidirectional transfer between personal and group ownership

## Test plan
- [ ] `npm run validate` passes
- [ ] `npm run test:rls` passes
- [ ] Manual: create group item as admin, verify visibility
- [ ] Manual: borrow group item as member, verify shared inbox
- [ ] Manual: transfer personal → group and back
- [ ] Manual: promote/demote admin, verify conversation participants sync

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Notes for the implementing agent

- **YAGNI**: Do not add group editing/creation of items from arbitrary members. Admins only.
- **DRY**: Reuse `ItemCard`, `ItemForm`, existing photo pickers — do not fork for group inventory.
- **TDD**: Every new hook and utility starts with a failing test.
- **Commit frequency**: each Task's step 5/6 commits — don't bundle multiple tasks.
- **Type safety**: after Task 2.1, a wave of type errors will appear across the codebase wherever `item.ownerId` is assumed non-null. Fix them incrementally — many are in hook tests and UI screens. Use `itemPermissions` helpers where the code needs to branch on owner/admin.
- **RLS tests are the source of truth for permission correctness.** If an RLS test fails, fix the migration, not the test.
- **No `--no-verify`** on commits; fix hook failures.
- **Reference spec:** [docs/superpowers/specs/2026-04-09-group-inventory-design.md](../specs/2026-04-09-group-inventory-design.md)

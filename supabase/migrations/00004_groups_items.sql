-- ============================================================
-- Groups + items + item_groups: tables, RLS helpers (group/item), RLS
-- ============================================================

CREATE TYPE item_category AS ENUM ('component', 'tool', 'accessory', 'consumable', 'clothing', 'bike');
CREATE TYPE item_status AS ENUM ('stored', 'mounted', 'loaned', 'reserved', 'donated', 'sold', 'archived');
CREATE TYPE item_visibility AS ENUM ('private', 'groups', 'all');
CREATE TYPE group_role AS ENUM ('admin', 'member');

-- Items
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category item_category NOT NULL,
  subcategory text,
  brand text,
  model text,
  description text,
  condition item_condition NOT NULL DEFAULT 'good',
  status item_status NOT NULL DEFAULT 'stored',
  availability_types text[] DEFAULT '{}',
  price numeric(10, 2),
  deposit numeric(10, 2),
  borrow_duration text,
  storage_location text,
  age text,
  usage integer,
  usage_unit text,
  purchase_date date,
  mounted_date date,
  pickup_location_id uuid REFERENCES saved_locations(id) ON DELETE SET NULL,
  bike_id uuid REFERENCES bikes(id) ON DELETE SET NULL,
  visibility item_visibility NOT NULL DEFAULT 'private',
  tags text[] NOT NULL DEFAULT '{}',
  remaining_fraction numeric(5, 4) CHECK (
    remaining_fraction IS NULL
    OR (remaining_fraction >= 0 AND remaining_fraction <= 1)
  ),
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT items_tags_max_count
    CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 20),
  CONSTRAINT items_tags_no_empty
    CHECK ('' != ALL(tags)),
  CONSTRAINT items_quantity_positive
    CHECK (quantity >= 1)
);

COMMENT ON COLUMN items.visibility IS 'Default private; items are not listed until the owner sets visibility (see docs/datamodel.md).';

COMMENT ON COLUMN items.remaining_fraction IS 'For consumables: fraction remaining (0–1). NULL for other categories or unspecified.';
COMMENT ON COLUMN items.mounted_date IS 'Optional date the part was mounted on a bike; independent of lifecycle status.';
COMMENT ON COLUMN items.quantity IS 'Count of identical units represented by this row; minimum 1.';

CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_bike_id ON items(bike_id) WHERE bike_id IS NOT NULL;
CREATE INDEX idx_items_tags ON items USING GIN (tags);

-- Item photos
CREATE TABLE item_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_item_photos_item ON item_photos(item_id);

-- Groups
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Group members
CREATE TABLE group_members (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role group_role NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

-- Item-group junction (for group-scoped visibility)
CREATE TABLE item_groups (
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, group_id)
);

-- ============================================================
-- HELPER FUNCTIONS (used by RLS policies, must be created first)
-- ============================================================

-- Check if a user shares a group with an item (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_shares_group_with_item(p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM item_groups ig
    JOIN group_members gm ON gm.group_id = ig.group_id
    WHERE ig.item_id = p_item_id AND gm.user_id = p_user_id
  );
$$;

-- Check if a user is a member of a group (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- Check if a group is public (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_public_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM groups WHERE id = p_group_id AND is_public = true
  );
$$;

-- Check if a user is an admin of a group (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'admin'
  );
$$;

-- Check if a user can see an item (same logic as items RLS)
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
        OR owner_id = p_user_id
        OR (
          visibility = 'groups'
          AND public.user_shares_group_with_item(id, p_user_id)
        )
      )
  );
$$;


ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_select_public"
  ON items FOR SELECT
  USING (
    visibility = 'all'
    OR owner_id = (select auth.uid())
    OR (
      visibility = 'groups'
      AND public.user_shares_group_with_item(id, (select auth.uid()))
    )
  );

CREATE POLICY "items_insert_own"
  ON items FOR INSERT
  WITH CHECK ((select auth.uid()) = owner_id);

-- Owners can update their own rows (borrow-lock rules: trigger above).
CREATE POLICY "items_update_owner"
  ON items FOR UPDATE
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "items_delete_own"
  ON items FOR DELETE
  USING (
    (select auth.uid()) = owner_id
    AND status NOT IN ('loaned', 'reserved')
  );

-- ============================================================
-- RLS POLICIES: item_photos
-- ============================================================

CREATE POLICY "item_photos_select_via_item"
  ON item_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id
        AND (
          items.visibility = 'all'
          OR items.owner_id = (select auth.uid())
          OR (
            items.visibility = 'groups'
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
      WHERE items.id = item_photos.item_id AND items.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "item_photos_update_own"
  ON item_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id AND items.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "item_photos_delete_own"
  ON item_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id AND items.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "groups_select"
  ON groups FOR SELECT
  USING (
    is_public = true
    OR public.is_group_member(id, (select auth.uid()))
  );

CREATE POLICY "groups_insert_authenticated"
  ON groups FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "groups_update_admin"
  ON groups FOR UPDATE
  USING (public.is_group_admin(id, (select auth.uid())));

CREATE POLICY "groups_delete_admin"
  ON groups FOR DELETE
  USING (public.is_group_admin(id, (select auth.uid())));

-- ============================================================
-- RLS POLICIES: group_members
-- ============================================================

CREATE POLICY "group_members_select"
  ON group_members FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR public.is_public_group(group_id)
    OR public.is_group_member(group_id, (select auth.uid()))
  );

CREATE POLICY "group_members_insert"
  ON group_members FOR INSERT
  WITH CHECK (
    user_id = (select auth.uid())
    OR public.is_group_admin(group_id, (select auth.uid()))
  );

CREATE POLICY "group_members_update_admin"
  ON group_members FOR UPDATE
  USING (public.is_group_admin(group_id, (select auth.uid())));

CREATE POLICY "group_members_delete"
  ON group_members FOR DELETE
  USING (
    user_id = (select auth.uid())
    OR public.is_group_admin(group_id, (select auth.uid()))
  );

-- ============================================================
-- RLS POLICIES: item_groups
-- ============================================================

CREATE POLICY "item_groups_select"
  ON item_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = item_groups.group_id
        AND group_members.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_groups.item_id
        AND items.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "item_groups_insert_owner"
  ON item_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = item_groups.item_id AND items.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "item_groups_delete_owner"
  ON item_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = item_groups.item_id AND items.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- Triggers: items (tags length, borrow-lock edits)
-- ============================================================

CREATE OR REPLACE FUNCTION check_tags_max_length()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY NEW.tags LOOP
    IF length(t) > 50 THEN
      RAISE EXCEPTION 'tag too long: max 50 characters';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Enforce no edits on borrow-locked items (only status change to stored allowed).
-- Borrow→non-stored status changes are enforced here so `items` needs only one UPDATE policy (linter performance).
CREATE OR REPLACE FUNCTION enforce_item_no_edits_while_borrow_locked()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  old_j jsonb;
  new_j jsonb;
BEGIN
  IF OLD.status IN ('loaned', 'reserved') AND NEW.status = OLD.status THEN
    old_j := to_jsonb(OLD) - 'updated_at';
    new_j := to_jsonb(NEW) - 'updated_at';
    IF old_j IS DISTINCT FROM new_j THEN
      RAISE EXCEPTION 'Borrow-locked items may only change when releasing to stored';
    END IF;
  ELSIF OLD.status IN ('loaned', 'reserved') AND NEW.status IS DISTINCT FROM 'stored' THEN
    RAISE EXCEPTION 'Borrow-locked items may only be released to stored';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_items_tags_max_length
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION check_tags_max_length();

CREATE TRIGGER trg_items_enforce_borrow_locked_update
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION enforce_item_no_edits_while_borrow_locked();



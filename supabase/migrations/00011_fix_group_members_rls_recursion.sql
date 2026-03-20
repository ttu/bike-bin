-- Fix infinite recursion in group_members SELECT policy.
-- The policy self-references group_members to check if the current user
-- is a member of the same group, which triggers the same policy again.
-- Solution: use a SECURITY DEFINER function to bypass RLS for the membership check.

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- Helper: check if a group is public (bypasses RLS on groups)
CREATE OR REPLACE FUNCTION public.is_public_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM groups WHERE id = p_group_id AND is_public = true
  );
$$;

-- Fix group_members SELECT policy: avoid direct queries to groups or self
DROP POLICY "group_members_select" ON group_members;

CREATE POLICY "group_members_select"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_public_group(group_id)
    OR public.is_group_member(group_id, auth.uid())
  );

-- Fix groups SELECT policy which references group_members directly,
-- creating a cycle when group_members_select references groups.
DROP POLICY "groups_select" ON groups;

CREATE POLICY "groups_select"
  ON groups FOR SELECT
  USING (
    is_public = true
    OR public.is_group_member(id, auth.uid())
  );

-- Fix groups UPDATE/DELETE policies which also reference group_members directly.
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'admin'
  );
$$;

DROP POLICY "groups_update_admin" ON groups;

CREATE POLICY "groups_update_admin"
  ON groups FOR UPDATE
  USING (public.is_group_admin(id, auth.uid()));

DROP POLICY "groups_delete_admin" ON groups;

CREATE POLICY "groups_delete_admin"
  ON groups FOR DELETE
  USING (public.is_group_admin(id, auth.uid()));

-- Also fix group_members INSERT/UPDATE/DELETE policies that self-reference.
DROP POLICY IF EXISTS "group_members_insert" ON group_members;

CREATE POLICY "group_members_insert"
  ON group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "group_members_update_admin" ON group_members;

CREATE POLICY "group_members_update_admin"
  ON group_members FOR UPDATE
  USING (public.is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS "group_members_delete" ON group_members;

CREATE POLICY "group_members_delete"
  ON group_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  );

-- Also fix item_photos SELECT policy which duplicates the item visibility logic
-- and can trigger the same recursion through group_members.
-- Use the existing SECURITY DEFINER function instead.
DROP POLICY "item_photos_select_via_item" ON item_photos;

CREATE POLICY "item_photos_select_via_item"
  ON item_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id
        AND (
          items.visibility = 'all'
          OR items.owner_id = auth.uid()
          OR (
            items.visibility = 'groups'
            AND public.user_shares_group_with_item(items.id, auth.uid())
          )
        )
    )
  );

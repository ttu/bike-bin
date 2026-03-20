-- Fix infinite recursion: items SELECT policy references item_groups,
-- and item_groups SELECT policy references items, creating a cycle.
-- Solution: item_groups SELECT only checks group membership.
-- Item owners already see their items via the items policy's owner_id check,
-- so item_groups doesn't need to verify item ownership separately.

DROP POLICY "item_groups_select" ON item_groups;

CREATE POLICY "item_groups_select"
  ON item_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = item_groups.group_id
        AND group_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_groups.item_id
        AND items.owner_id = auth.uid()
    )
  );

-- Also fix the items policy to avoid the recursion by using a security definer function
CREATE OR REPLACE FUNCTION public.user_shares_group_with_item(p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM item_groups ig
    JOIN group_members gm ON gm.group_id = ig.group_id
    WHERE ig.item_id = p_item_id AND gm.user_id = p_user_id
  );
$$;

DROP POLICY "items_select_public" ON items;

CREATE POLICY "items_select_public"
  ON items FOR SELECT
  USING (
    visibility = 'all'
    OR owner_id = auth.uid()
    OR (
      visibility = 'groups'
      AND public.user_shares_group_with_item(id, auth.uid())
    )
  );

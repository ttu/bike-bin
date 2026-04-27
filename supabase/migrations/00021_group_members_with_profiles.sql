-- ============================================================
-- RPC: list group members with safe profile fields
--
-- Profiles RLS only exposes the caller's own row. To render the
-- members list with each member's display name and avatar, we need
-- a SECURITY DEFINER function that returns just the safe columns
-- (no push_token).
--
-- Authorization: caller must be a member of the group.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_group_members_with_profiles(p_group_id uuid)
RETURNS TABLE (
  group_id uuid,
  user_id uuid,
  role text,
  joined_at timestamptz,
  display_name text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_caller uuid := (select auth.uid());
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'get_group_members_with_profiles: authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = p_group_id AND gm.user_id = v_caller
  ) THEN
    RAISE EXCEPTION 'get_group_members_with_profiles: caller is not a member of group %', p_group_id;
  END IF;

  RETURN QUERY
  SELECT
    gm.group_id,
    gm.user_id,
    gm.role::text,
    gm.joined_at,
    p.display_name,
    p.avatar_url
  FROM group_members gm
  LEFT JOIN profiles p ON p.id = gm.user_id
  WHERE gm.group_id = p_group_id
  ORDER BY gm.role ASC, gm.joined_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_members_with_profiles(uuid) TO authenticated;

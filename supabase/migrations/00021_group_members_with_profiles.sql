-- ============================================================
-- RPC: list group members with safe profile fields
--
-- Profiles RLS only exposes the caller's own row. To render the
-- members list with each member's display name and avatar, we need
-- a SECURITY DEFINER function that returns just the safe columns
-- (no push_token).
--
-- Authorization mirrors the group_members SELECT RLS policy: caller may
-- read members of a group they belong to, or any public group. Private
-- groups remain hidden from non-members.
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

  IF NOT (
    private.is_group_member(p_group_id, v_caller)
    OR private.is_public_group(p_group_id)
  ) THEN
    RAISE EXCEPTION 'get_group_members_with_profiles: caller cannot view group %', p_group_id;
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

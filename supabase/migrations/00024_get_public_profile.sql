-- ============================================================
-- get_public_profile
-- Returns safe profile fields for any user id. SECURITY DEFINER
-- so callers can read other users' public data without exposing
-- push_token (RLS on profiles only allows SELECT own row).
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  rating_avg numeric,
  rating_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.rating_avg,
    p.rating_count,
    p.created_at
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated, anon;

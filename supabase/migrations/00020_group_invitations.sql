-- ============================================================
-- Group invitations: pending invitations from admins to users
-- ============================================================

CREATE TYPE group_invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

CREATE TABLE group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invitee_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inviter_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status group_invitation_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT group_invitations_responded_at_consistency
    CHECK ((status = 'pending' AND responded_at IS NULL)
        OR (status <> 'pending' AND responded_at IS NOT NULL))
);

-- Only one pending invitation per (group, invitee) at a time
CREATE UNIQUE INDEX group_invitations_unique_pending
  ON group_invitations (group_id, invitee_user_id)
  WHERE status = 'pending';

CREATE INDEX idx_group_invitations_invitee_pending
  ON group_invitations (invitee_user_id)
  WHERE status = 'pending';

CREATE INDEX idx_group_invitations_group ON group_invitations (group_id);

ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS
-- ============================================================

-- SELECT: invitee sees own invitations; admins see invitations for their group
CREATE POLICY "group_invitations_select"
  ON group_invitations FOR SELECT
  USING (
    invitee_user_id = (select auth.uid())
    OR private.is_group_admin(group_id, (select auth.uid()))
  );

-- INSERT: caller must be admin of target group, set themselves as inviter, and
-- status stays pending on insert. Invitee must not already be a member.
CREATE POLICY "group_invitations_insert_admin"
  ON group_invitations FOR INSERT
  WITH CHECK (
    private.is_group_admin(group_id, (select auth.uid()))
    AND inviter_user_id = (select auth.uid())
    AND status = 'pending'
    AND NOT private.is_group_member(group_id, invitee_user_id)
  );

-- UPDATE:
--  * invitee may transition their own pending invitation to rejected
--  * admin may transition pending to cancelled
-- Accepting goes through the SECURITY DEFINER RPC below (atomic with membership insert)
CREATE POLICY "group_invitations_update_invitee_reject"
  ON group_invitations FOR UPDATE
  USING (
    invitee_user_id = (select auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    invitee_user_id = (select auth.uid())
    AND status = 'rejected'
    AND responded_at IS NOT NULL
  );

CREATE POLICY "group_invitations_update_admin_cancel"
  ON group_invitations FOR UPDATE
  USING (
    private.is_group_admin(group_id, (select auth.uid()))
    AND status = 'pending'
  )
  WITH CHECK (
    private.is_group_admin(group_id, (select auth.uid()))
    AND status = 'cancelled'
    AND responded_at IS NOT NULL
  );

-- DELETE: not exposed; rows remain for audit.

-- ============================================================
-- RPC: accept_group_invitation
-- Atomically marks the invitation accepted and inserts the group membership.
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_group_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_group_id uuid;
  v_invitee uuid;
  v_caller uuid := auth.uid();
  err_not_authenticated constant text := 'Not authenticated';
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION '%', err_not_authenticated USING ERRCODE = '42501';
  END IF;

  SELECT group_id, invitee_user_id
    INTO v_group_id, v_invitee
    FROM group_invitations
    WHERE id = p_invitation_id
      AND status = 'pending'
    FOR UPDATE;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or not pending' USING ERRCODE = 'P0002';
  END IF;

  IF v_invitee <> v_caller THEN
    RAISE EXCEPTION 'Only the invitee may accept this invitation' USING ERRCODE = '42501';
  END IF;

  UPDATE group_invitations
    SET status = 'accepted', responded_at = now()
    WHERE id = p_invitation_id;

  INSERT INTO group_members (group_id, user_id, role)
    VALUES (v_group_id, v_caller, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_group_invitation(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_group_invitation(uuid) TO authenticated;

-- ============================================================
-- RPC: search_invitable_users
-- Case-insensitive prefix match on display_name for users who are neither
-- already members nor have a pending invitation for the given group.
-- Only admins of the group may call this RPC.
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_invitable_users(
  p_group_id uuid,
  p_query text,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_escaped text;
  err_not_authenticated constant text := 'Not authenticated';
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION '%', err_not_authenticated USING ERRCODE = '42501';
  END IF;

  IF NOT private.is_group_admin(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only group admins may search invitable users' USING ERRCODE = '42501';
  END IF;

  IF p_query IS NULL OR length(btrim(p_query)) < 1 THEN
    RETURN;
  END IF;

  -- Escape LIKE metacharacters so literal % and _ in user input match as characters.
  v_escaped := replace(
    replace(
      replace(btrim(p_query), E'\\', E'\\\\'),
      '%', E'\\%'
    ),
    '_', E'\\_'
  );

  RETURN QUERY
    SELECT p.id, p.display_name, p.avatar_url
    FROM public.profiles p
    WHERE p.display_name ILIKE (v_escaped || '%') ESCAPE E'\\'
      AND p.id <> auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = p_group_id AND gm.user_id = p.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.group_invitations gi
        WHERE gi.group_id = p_group_id
          AND gi.invitee_user_id = p.id
          AND gi.status = 'pending'
      )
    ORDER BY p.display_name
    LIMIT GREATEST(1, LEAST(p_limit, 50));
END;
$$;

REVOKE ALL ON FUNCTION public.search_invitable_users(uuid, text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.search_invitable_users(uuid, text, integer) TO authenticated;

-- ============================================================
-- Moderation: extend report targets, blocked identities, audit log, auth hook
-- ============================================================

-- 1. Extend report_target_type enum
ALTER TYPE report_target_type ADD VALUE IF NOT EXISTS 'item_photo';
ALTER TYPE report_target_type ADD VALUE IF NOT EXISTS 'message';

-- 2. Blocked OAuth identities (service-role only)
CREATE TABLE blocked_oauth_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

ALTER TABLE blocked_oauth_identities ENABLE ROW LEVEL SECURITY;
-- No authenticated policies — managed by service role only

-- 3. Moderation enforcement log (service-role only)
CREATE TABLE moderation_enforcement_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sanctioned_user_id uuid NOT NULL,
  performed_by text NOT NULL DEFAULT 'edge_function',
  reason text,
  report_ids uuid[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE moderation_enforcement_log ENABLE ROW LEVEL SECURITY;
-- No authenticated policies — service-role only

-- 4. Helper: find conversations with zero participants and zero messages
CREATE OR REPLACE FUNCTION find_empty_conversations()
RETURNS TABLE(id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT c.id
  FROM conversations c
  LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
  LEFT JOIN messages m ON m.conversation_id = c.id
  GROUP BY c.id
  HAVING COUNT(cp.conversation_id) = 0 AND COUNT(m.id) = 0;
$$;

-- Grant/revoke for find_empty_conversations (service-role only, not callable by app users)
REVOKE EXECUTE ON FUNCTION public.find_empty_conversations() FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.find_empty_conversations() TO service_role;

-- 5. Before Sign-In auth hook: reject blocked identities
-- Called by Supabase Auth with event jsonb; returns decision jsonb.
-- Registered in Supabase Dashboard > Authentication > Hooks > Before Sign-In.
CREATE OR REPLACE FUNCTION public.check_blocked_identity(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  _identities jsonb;
  is_blocked boolean;
  decision_continue jsonb := jsonb_build_object('decision', 'continue');
BEGIN
  _identities := event->'user'->'identities';

  -- If no identities array, allow sign-in (don't block legitimate users)
  IF _identities IS NULL OR jsonb_array_length(_identities) = 0 THEN
    RETURN decision_continue;
  END IF;

  -- Check if ANY identity matches a blocked entry
  SELECT EXISTS(
    SELECT 1
    FROM jsonb_array_elements(_identities) AS identity
    JOIN blocked_oauth_identities b
      ON b.provider = identity->>'provider'
     AND b.provider_user_id = identity->>'provider_id'
  ) INTO is_blocked;

  IF is_blocked THEN
    RETURN jsonb_build_object(
      'decision', 'reject',
      'message', 'Sign-in not allowed'
    );
  END IF;

  RETURN decision_continue;
END;
$$;

-- Grant supabase_auth_admin (the role used for auth hooks) execute permission
GRANT EXECUTE ON FUNCTION public.check_blocked_identity(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.check_blocked_identity(jsonb) FROM authenticated, anon, public;

-- Grant supabase_auth_admin access to read the blocklist for the hook
GRANT SELECT ON public.blocked_oauth_identities TO supabase_auth_admin;

-- Fix HIGH security issues: unrestricted conversation creation and participant joining
--
-- Problem 1: Any authenticated user can add themselves to any conversation,
--            gaining access to all its messages.
-- Problem 2: Conversations can be created without referencing an item,
--            enabling spam/abuse.

-- ============================================================
-- Helper: check if a conversation has no participants yet
-- (i.e., it was just created and is being set up)
-- ============================================================

CREATE OR REPLACE FUNCTION public.conversation_has_no_participants(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
  );
$$;

-- ============================================================
-- Helper: check if user can see the item (same logic as items RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_see_item(p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
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

-- ============================================================
-- 1. Fix conversations INSERT: require a visible item
-- ============================================================

DROP POLICY "conversations_insert_authenticated" ON conversations;

CREATE POLICY "conversations_insert_authenticated"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND item_id IS NOT NULL
    AND public.can_see_item(item_id, auth.uid())
  );

-- ============================================================
-- 2. Fix conversation_participants INSERT
--
-- Allowed cases:
--   a) The conversation has no participants yet (just created)
--      — the inserter is setting up the initial participants
--   b) The inserter is already a participant
--      — they're adding someone to their conversation
-- ============================================================

DROP POLICY "conversation_participants_insert_authenticated" ON conversation_participants;

CREATE POLICY "conversation_participants_insert"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Case a: conversation is brand new (no participants yet)
      public.conversation_has_no_participants(conversation_id)
      -- Case b: inserter is already a participant
      OR public.is_conversation_participant(conversation_id, auth.uid())
    )
  );

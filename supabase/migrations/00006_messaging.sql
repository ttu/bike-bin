-- ============================================================
-- Messaging: tables, conversation RLS helpers, RLS
-- ============================================================

-- Conversations
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Conversation participants
CREATE TABLE conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages
-- sender_id is NULL after GDPR account deletion (anonymized sender); app shows a deleted-user label.
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);


-- Check if a user is a participant in a conversation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
$$;

-- Check if a conversation has no participants yet (just created)
CREATE OR REPLACE FUNCTION public.conversation_has_no_participants(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
  );
$$;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select"
  ON conversations FOR SELECT
  USING (
    public.is_conversation_participant(id, (select auth.uid()))
  );

CREATE POLICY "conversations_insert_authenticated"
  ON conversations FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND item_id IS NOT NULL
    AND public.can_see_item(item_id, (select auth.uid()))
  );

-- ============================================================
-- RLS POLICIES: conversation_participants
-- ============================================================

CREATE POLICY "conversation_participants_select"
  ON conversation_participants FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR public.is_conversation_participant(conversation_id, (select auth.uid()))
  );

CREATE POLICY "conversation_participants_insert"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (
      -- Conversation is brand new (no participants yet)
      public.conversation_has_no_participants(conversation_id)
      -- Inserter is already a participant
      OR public.is_conversation_participant(conversation_id, (select auth.uid()))
    )
  );

-- ============================================================
-- RLS POLICIES: messages
-- ============================================================

CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (
    public.is_conversation_participant(conversation_id, (select auth.uid()))
  );

CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (
    (select auth.uid()) = sender_id
    AND public.is_conversation_participant(conversation_id, (select auth.uid()))
  );

-- ============================================================
-- RPC: conversation list batch (DISTINCT ON; item_photos exists in 00004)
-- ============================================================

CREATE OR REPLACE FUNCTION public.latest_messages_for_conversations(p_conversation_ids uuid[])
RETURNS TABLE (
  conversation_id uuid,
  body text,
  sender_id uuid,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SET search_path TO public
AS $$
  SELECT DISTINCT ON (m.conversation_id)
    m.conversation_id,
    m.body,
    m.sender_id,
    m.created_at
  FROM public.messages m
  WHERE m.conversation_id = ANY(p_conversation_ids)
  ORDER BY m.conversation_id, m.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.primary_photos_for_items(p_item_ids uuid[])
RETURNS TABLE (
  item_id uuid,
  storage_path text
)
LANGUAGE sql
STABLE
SET search_path TO public
AS $$
  SELECT DISTINCT ON (p.item_id)
    p.item_id,
    p.storage_path
  FROM public.item_photos p
  WHERE p.item_id = ANY(p_item_ids)
  ORDER BY p.item_id, p.sort_order ASC;
$$;

GRANT EXECUTE ON FUNCTION public.latest_messages_for_conversations(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.primary_photos_for_items(uuid[]) TO authenticated;

-- ============================================================
-- Realtime: replicate messages to Supabase Realtime clients
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================
-- Trigger: sync conversation participants with group admin roster
-- ============================================================
-- When a user is promoted to admin of a group, they are added to all conversations
-- about that group's items. When demoted or removed, they are removed unless they
-- still have a reason to stay (e.g. they are the requester of a borrow request).

CREATE OR REPLACE FUNCTION public.sync_group_conversation_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Promoted to admin: add to all group item conversations
  IF TG_OP = 'UPDATE' AND NEW.role = 'admin' AND OLD.role = 'member' THEN
    INSERT INTO conversation_participants (conversation_id, user_id)
    SELECT c.id, NEW.user_id
    FROM conversations c
    JOIN items i ON i.id = c.item_id
    WHERE i.group_id = NEW.group_id
    ON CONFLICT DO NOTHING;
  END IF;

  -- Demoted or removed: remove from group item conversations,
  -- but preserve rows where the user is still the requester of a borrow_request.
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



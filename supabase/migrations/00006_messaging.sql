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
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
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

-- Check if a user can join a conversation as the first participant:
-- the conversation must exist and its item must be visible to the user.
-- SECURITY DEFINER so the caller can read the conversations table despite RLS.
CREATE OR REPLACE FUNCTION public.can_join_conversation(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations c
    JOIN items i ON i.id = c.item_id
    WHERE c.id = p_conversation_id
      AND public.can_see_item(i.id, p_user_id)
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
      -- Users can add themselves to a conversation they can access
      (
        user_id = (select auth.uid())
        AND (
          -- First participant: must also be able to see the underlying item
          (
            public.conversation_has_no_participants(conversation_id)
            AND public.can_join_conversation(conversation_id, (select auth.uid()))
          )
          OR public.is_conversation_participant(conversation_id, (select auth.uid()))
        )
      )
      OR (
        -- An existing participant may add the item owner as the other party
        -- (prevents adding arbitrary third parties to conversations)
        public.is_conversation_participant(conversation_id, (select auth.uid()))
        AND EXISTS (
          SELECT 1 FROM conversations c
          JOIN items i ON i.id = c.item_id
          WHERE c.id = conversation_id AND i.owner_id = user_id
        )
      )
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



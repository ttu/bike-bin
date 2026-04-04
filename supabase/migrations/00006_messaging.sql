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
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
-- Realtime: replicate messages to Supabase Realtime clients
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;



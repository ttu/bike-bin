-- Fix infinite recursion in conversation_participants SELECT policy.
-- Same pattern as group_members: policy self-references via cp2 alias.
-- Also fixes conversations and messages policies that cross-reference conversation_participants.

CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
$$;

-- Fix conversation_participants SELECT policy (self-referencing)
DROP POLICY "conversation_participants_select" ON conversation_participants;

CREATE POLICY "conversation_participants_select"
  ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_conversation_participant(conversation_id, auth.uid())
  );

-- Fix conversations SELECT policy (references conversation_participants)
DROP POLICY "conversations_select" ON conversations;

CREATE POLICY "conversations_select"
  ON conversations FOR SELECT
  USING (
    public.is_conversation_participant(id, auth.uid())
  );

-- Fix messages SELECT policy (references conversation_participants)
DROP POLICY "messages_select" ON messages;

CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (
    public.is_conversation_participant(conversation_id, auth.uid())
  );

-- Fix messages INSERT policy (references conversation_participants)
DROP POLICY "messages_insert" ON messages;

CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conversation_participant(conversation_id, auth.uid())
  );

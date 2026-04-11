-- Align find_empty_conversations with NOT EXISTS anti-joins (replaces JOIN/GROUP BY from 00016 on existing DBs).
CREATE OR REPLACE FUNCTION find_empty_conversations()
RETURNS TABLE(id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
  SELECT c.id
  FROM conversations c
  WHERE NOT EXISTS (
    SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = c.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.id
  );
$$;

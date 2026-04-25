-- Align find_empty_conversations with LEFT JOIN … IS NULL anti-joins
-- (replaces JOIN/GROUP BY from 00016 on existing DBs).
CREATE OR REPLACE FUNCTION find_empty_conversations()
RETURNS TABLE(id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
  SELECT DISTINCT c.id
  FROM conversations c
  LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
  LEFT JOIN messages m ON m.conversation_id = c.id
  WHERE cp.conversation_id IS NULL
    AND m.conversation_id IS NULL;
$$;

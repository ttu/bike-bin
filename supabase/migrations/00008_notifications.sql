-- ============================================================
-- Notifications: table, RLS
-- ============================================================

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING ((select auth.uid()) = user_id);

-- No INSERT policy: only service_role (Edge Functions/triggers) can insert

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- Realtime: replicate notifications to Supabase Realtime clients
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;


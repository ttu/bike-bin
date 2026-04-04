-- ============================================================
-- Support requests + reports: tables, RLS
-- ============================================================

CREATE TYPE support_status AS ENUM ('open', 'closed');
CREATE TYPE report_target_type AS ENUM ('item', 'user');
CREATE TYPE report_status AS ENUM ('open', 'reviewed', 'closed');

-- Support requests
CREATE TABLE support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  email text,
  subject text NOT NULL,
  body text NOT NULL,
  screenshot_path text,
  app_version text,
  device_info text,
  status support_status NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Reports
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type report_target_type NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  text text,
  status report_status NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_requests_insert"
  ON support_requests FOR INSERT
  WITH CHECK (
    user_id IS NULL OR (select auth.uid()) = user_id
  );

CREATE POLICY "support_requests_select_own"
  ON support_requests FOR SELECT
  USING ((select auth.uid()) = user_id);

-- ============================================================
-- RLS POLICIES: reports
-- ============================================================

CREATE POLICY "reports_insert_authenticated"
  ON reports FOR INSERT
  WITH CHECK ((select auth.uid()) = reporter_id);

CREATE POLICY "reports_select_own"
  ON reports FOR SELECT
  USING ((select auth.uid()) = reporter_id);



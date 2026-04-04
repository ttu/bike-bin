-- Export request status enum
CREATE TYPE export_request_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Export requests table
CREATE TABLE export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status export_request_status NOT NULL DEFAULT 'pending',
  storage_path text,
  error_message text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_export_requests_user_id ON export_requests(user_id);

-- RLS
ALTER TABLE export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "export_requests_select_own"
  ON export_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "export_requests_insert_own"
  ON export_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for data exports (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('data-exports', 'data-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: only service role uploads, user can read own exports
CREATE POLICY "data_exports_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'data-exports'
    AND auth.uid()::text = (string_to_array(name, '/'))[2]
  );

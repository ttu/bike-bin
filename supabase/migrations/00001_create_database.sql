-- ============================================================
-- Bike Bin – Complete Database Schema
-- Combined migration: represents the final state of all tables,
-- types, functions, policies, triggers, storage, and realtime.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
-- Schema `extensions` is created by Supabase before migrations (avoid CREATE SCHEMA here — it duplicates and emits NOTICE 42P06).

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE item_category AS ENUM ('component', 'tool', 'accessory', 'consumable', 'clothing', 'bike');
CREATE TYPE item_condition AS ENUM ('new', 'good', 'worn', 'broken');
CREATE TYPE item_status AS ENUM ('stored', 'mounted', 'loaned', 'reserved', 'donated', 'sold', 'archived');
CREATE TYPE item_visibility AS ENUM ('private', 'groups', 'all');
CREATE TYPE bike_type AS ENUM ('road', 'gravel', 'mtb', 'city', 'touring', 'other');
CREATE TYPE group_role AS ENUM ('admin', 'member');
CREATE TYPE borrow_request_status AS ENUM ('pending', 'accepted', 'rejected', 'returned', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('borrow', 'donate', 'sell');
CREATE TYPE support_status AS ENUM ('open', 'closed');
CREATE TYPE report_target_type AS ENUM ('item', 'user');
CREATE TYPE report_status AS ENUM ('open', 'reviewed', 'closed');
CREATE TYPE subscription_plan AS ENUM ('free', 'paid');
CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'expired'
);
CREATE TYPE export_request_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  rating_avg numeric(3, 2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  notification_preferences jsonb DEFAULT '{}',
  push_token text,
  distance_unit text DEFAULT 'km' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Subscriptions (entitlements; insert/update/delete via service_role or SQL — not end users)
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  provider text,
  provider_subscription_id text,
  provider_customer_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE subscriptions IS 'Per-user subscription rows (current and historical); clients may SELECT own rows only; writes are service_role, Edge Functions, or SQL.';
COMMENT ON COLUMN subscriptions.current_period_end IS 'End of current paid/access period when applicable; used with status for entitlement checks.';

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_provider_sub
  ON subscriptions (provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

CREATE UNIQUE INDEX idx_subscriptions_one_entitled_per_user
  ON subscriptions (user_id)
  WHERE status = ANY (
    ARRAY[
      'trialing'::subscription_status,
      'active'::subscription_status,
      'past_due'::subscription_status
    ]
  );

-- Saved locations
CREATE TABLE saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  area_name text,
  postcode text,
  coordinates geography(Point, 4326),
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_saved_locations_user ON saved_locations(user_id);
CREATE INDEX idx_saved_locations_coordinates ON saved_locations USING GIST(coordinates);

-- Bikes
CREATE TABLE bikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  model text,
  type bike_type NOT NULL DEFAULT 'other',
  year integer,
  distance_km numeric,
  usage_hours numeric,
  condition item_condition NOT NULL DEFAULT 'good',
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON COLUMN bikes.distance_km IS 'Total distance ridden (kilometers), optional';
COMMENT ON COLUMN bikes.usage_hours IS 'Total usage hours (e.g. e-bike / suspension service tracking), optional';
COMMENT ON COLUMN bikes.condition IS 'Overall bike condition (same enum as items)';
COMMENT ON COLUMN bikes.notes IS 'Free-form owner notes';

CREATE INDEX idx_bikes_owner ON bikes(owner_id);

-- Items
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category item_category NOT NULL,
  subcategory text,
  brand text,
  model text,
  description text,
  condition item_condition NOT NULL DEFAULT 'good',
  status item_status NOT NULL DEFAULT 'stored',
  availability_types text[] DEFAULT '{}',
  price numeric(10, 2),
  deposit numeric(10, 2),
  borrow_duration text,
  storage_location text,
  age text,
  usage integer,
  usage_unit text,
  purchase_date date,
  mounted_date date,
  pickup_location_id uuid REFERENCES saved_locations(id) ON DELETE SET NULL,
  bike_id uuid REFERENCES bikes(id) ON DELETE SET NULL,
  visibility item_visibility NOT NULL DEFAULT 'private',
  tags text[] NOT NULL DEFAULT '{}',
  remaining_fraction numeric(5, 4) CHECK (
    remaining_fraction IS NULL
    OR (remaining_fraction >= 0 AND remaining_fraction <= 1)
  ),
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT items_tags_max_count
    CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 20),
  CONSTRAINT items_tags_no_empty
    CHECK ('' != ALL(tags)),
  CONSTRAINT items_quantity_positive
    CHECK (quantity >= 1)
);

COMMENT ON COLUMN items.visibility IS 'Default private; items are not listed until the owner sets visibility (see docs/datamodel.md).';

COMMENT ON COLUMN items.remaining_fraction IS 'For consumables: fraction remaining (0–1). NULL for other categories or unspecified.';
COMMENT ON COLUMN items.mounted_date IS 'Optional date the part was mounted on a bike; independent of lifecycle status.';
COMMENT ON COLUMN items.quantity IS 'Count of identical units represented by this row; minimum 1.';

CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_bike_id ON items(bike_id) WHERE bike_id IS NOT NULL;
CREATE INDEX idx_items_tags ON items USING GIN (tags);

-- Item photos
CREATE TABLE item_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_item_photos_item ON item_photos(item_id);

-- Bike photos
CREATE TABLE bike_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id uuid NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_bike_photos_bike ON bike_photos(bike_id);

-- Groups
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Group members
CREATE TABLE group_members (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role group_role NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

-- Item-group junction (for group-scoped visibility)
CREATE TABLE item_groups (
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, group_id)
);

-- Borrow requests
CREATE TABLE borrow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status borrow_request_status NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_borrow_requests_item ON borrow_requests(item_id);
CREATE INDEX idx_borrow_requests_requester ON borrow_requests(requester_id);

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

-- Ratings
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  text text,
  editable_until timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_ratings_to_user ON ratings(to_user_id);

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

-- Export requests (GDPR data exports)
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

-- Geocode cache (server-only; explicit deny policies for anon/authenticated below)
CREATE TABLE geocode_cache (
  postcode TEXT PRIMARY KEY,
  country TEXT NOT NULL DEFAULT '',
  area_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE geocode_cache IS 'Cache for geocoded postcode results from Nominatim API';

-- ============================================================
-- VIEWS
-- ============================================================

-- Security-barrier view: exposes safe profile fields without push_token
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_barrier = true, security_invoker = true)
AS
SELECT
  id,
  display_name,
  avatar_url,
  rating_avg,
  rating_count,
  created_at,
  updated_at
FROM profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bike_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS (used by RLS policies, must be created first)
-- ============================================================

-- Check if a user shares a group with an item (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_shares_group_with_item(p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM item_groups ig
    JOIN group_members gm ON gm.group_id = ig.group_id
    WHERE ig.item_id = p_item_id AND gm.user_id = p_user_id
  );
$$;

-- Check if a user is a member of a group (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- Check if a group is public (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_public_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM groups WHERE id = p_group_id AND is_public = true
  );
$$;

-- Check if a user is an admin of a group (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'admin'
  );
$$;

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

-- Check if a user can see an item (same logic as items RLS)
CREATE OR REPLACE FUNCTION public.can_see_item(p_item_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO public
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
-- RLS POLICIES: profiles
-- ============================================================

-- Own profile: full access (includes push_token)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================
-- RLS POLICIES: saved_locations
-- ============================================================

CREATE POLICY "saved_locations_select_own"
  ON saved_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_locations_insert_own"
  ON saved_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_locations_update_own"
  ON saved_locations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_locations_delete_own"
  ON saved_locations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: items
-- ============================================================

CREATE POLICY "items_select_public"
  ON items FOR SELECT
  USING (
    visibility = 'all'
    OR owner_id = auth.uid()
    OR (
      visibility = 'groups'
      AND public.user_shares_group_with_item(id, auth.uid())
    )
  );

CREATE POLICY "items_insert_own"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their items (but not while loaned or reserved)
CREATE POLICY "items_update_own"
  ON items FOR UPDATE
  USING (
    auth.uid() = owner_id
    AND status NOT IN ('loaned', 'reserved')
  )
  WITH CHECK (auth.uid() = owner_id);

-- Allow owners to release borrow-locked items back to stored
CREATE POLICY "items_update_owner_release_borrow_lock"
  ON items FOR UPDATE
  USING (auth.uid() = owner_id AND status IN ('loaned', 'reserved'))
  WITH CHECK (auth.uid() = owner_id AND status = 'stored');

CREATE POLICY "items_delete_own"
  ON items FOR DELETE
  USING (
    auth.uid() = owner_id
    AND status NOT IN ('loaned', 'reserved')
  );

-- ============================================================
-- RLS POLICIES: item_photos
-- ============================================================

CREATE POLICY "item_photos_select_via_item"
  ON item_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id
        AND (
          items.visibility = 'all'
          OR items.owner_id = auth.uid()
          OR (
            items.visibility = 'groups'
            AND public.user_shares_group_with_item(items.id, auth.uid())
          )
        )
    )
  );

CREATE POLICY "item_photos_insert_own"
  ON item_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "item_photos_update_own"
  ON item_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "item_photos_delete_own"
  ON item_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_photos.item_id AND items.owner_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: bikes
-- ============================================================

CREATE POLICY "bikes_select_own"
  ON bikes FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "bikes_insert_own"
  ON bikes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "bikes_update_own"
  ON bikes FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "bikes_delete_own"
  ON bikes FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================
-- RLS POLICIES: bike_photos
-- ============================================================

CREATE POLICY "bike_photos_select_own"
  ON bike_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = auth.uid()
    )
  );

CREATE POLICY "bike_photos_insert_own"
  ON bike_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = auth.uid()
    )
  );

CREATE POLICY "bike_photos_update_own"
  ON bike_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = auth.uid()
    )
  );

CREATE POLICY "bike_photos_delete_own"
  ON bike_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: groups
-- ============================================================

CREATE POLICY "groups_select"
  ON groups FOR SELECT
  USING (
    is_public = true
    OR public.is_group_member(id, auth.uid())
  );

CREATE POLICY "groups_insert_authenticated"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "groups_update_admin"
  ON groups FOR UPDATE
  USING (public.is_group_admin(id, auth.uid()));

CREATE POLICY "groups_delete_admin"
  ON groups FOR DELETE
  USING (public.is_group_admin(id, auth.uid()));

-- ============================================================
-- RLS POLICIES: group_members
-- ============================================================

CREATE POLICY "group_members_select"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_public_group(group_id)
    OR public.is_group_member(group_id, auth.uid())
  );

CREATE POLICY "group_members_insert"
  ON group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  );

CREATE POLICY "group_members_update_admin"
  ON group_members FOR UPDATE
  USING (public.is_group_admin(group_id, auth.uid()));

CREATE POLICY "group_members_delete"
  ON group_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_group_admin(group_id, auth.uid())
  );

-- ============================================================
-- RLS POLICIES: item_groups
-- ============================================================

CREATE POLICY "item_groups_select"
  ON item_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = item_groups.group_id
        AND group_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_groups.item_id
        AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "item_groups_insert_owner"
  ON item_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = item_groups.item_id AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "item_groups_delete_owner"
  ON item_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM items WHERE items.id = item_groups.item_id AND items.owner_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: borrow_requests
-- ============================================================

CREATE POLICY "borrow_requests_select"
  ON borrow_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
    )
  );

CREATE POLICY "borrow_requests_insert"
  ON borrow_requests FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
    AND NOT EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
    )
  );

-- Borrow request update: status transition rules enforced by trigger
CREATE POLICY "borrow_requests_update"
  ON borrow_requests FOR UPDATE
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: conversations
-- ============================================================

CREATE POLICY "conversations_select"
  ON conversations FOR SELECT
  USING (
    public.is_conversation_participant(id, auth.uid())
  );

CREATE POLICY "conversations_insert_authenticated"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND item_id IS NOT NULL
    AND public.can_see_item(item_id, auth.uid())
  );

-- ============================================================
-- RLS POLICIES: conversation_participants
-- ============================================================

CREATE POLICY "conversation_participants_select"
  ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "conversation_participants_insert"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Conversation is brand new (no participants yet)
      public.conversation_has_no_participants(conversation_id)
      -- Inserter is already a participant
      OR public.is_conversation_participant(conversation_id, auth.uid())
    )
  );

-- ============================================================
-- RLS POLICIES: messages
-- ============================================================

CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (
    public.is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conversation_participant(conversation_id, auth.uid())
  );

-- ============================================================
-- RLS POLICIES: ratings
-- ============================================================

CREATE POLICY "ratings_select_public"
  ON ratings FOR SELECT
  USING (true);

-- Require a completed borrow transaction to create a rating
CREATE POLICY "ratings_insert_verified"
  ON ratings FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id
    AND from_user_id != to_user_id
    AND EXISTS (
      SELECT 1 FROM borrow_requests br
      JOIN items ON items.id = br.item_id
      WHERE br.status = 'returned'
        AND (
          (br.requester_id = from_user_id AND items.owner_id = to_user_id)
          OR
          (items.owner_id = from_user_id AND br.requester_id = to_user_id)
        )
        AND (item_id IS NULL OR br.item_id = item_id)
    )
  );

CREATE POLICY "ratings_update_own"
  ON ratings FOR UPDATE
  USING (
    auth.uid() = from_user_id
    AND (editable_until IS NULL OR editable_until > now())
  )
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "ratings_delete_own"
  ON ratings FOR DELETE
  USING (auth.uid() = from_user_id);

-- ============================================================
-- RLS POLICIES: notifications
-- ============================================================

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT policy: only service_role (Edge Functions/triggers) can insert

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: subscriptions
-- ============================================================

CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies: service_role / dashboard SQL only

-- ============================================================
-- RLS POLICIES: export_requests
-- ============================================================

CREATE POLICY "export_requests_select_own"
  ON export_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "export_requests_insert_own"
  ON export_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: support_requests
-- ============================================================

CREATE POLICY "support_requests_insert"
  ON support_requests FOR INSERT
  WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

CREATE POLICY "support_requests_select_own"
  ON support_requests FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: reports
-- ============================================================

CREATE POLICY "reports_insert_authenticated"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_own"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- ============================================================
-- RLS POLICIES: geocode_cache
-- ============================================================

-- Server-only cache; explicit deny for API roles (lint 0008); service_role bypasses RLS
CREATE POLICY "geocode_cache_deny_authenticated_and_anon"
  ON public.geocode_cache
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- FUNCTIONS: Business Logic
-- ============================================================

-- Tags validation trigger: enforce per-element max length
CREATE OR REPLACE FUNCTION check_tags_max_length()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY NEW.tags LOOP
    IF length(t) > 50 THEN
      RAISE EXCEPTION 'tag too long: max 50 characters';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Recalculate rating_avg and rating_count on profiles
CREATE OR REPLACE FUNCTION update_user_rating_avg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.to_user_id;
  ELSE
    target_user_id := NEW.to_user_id;
  END IF;

  UPDATE profiles
  SET
    rating_avg = COALESCE(
      (SELECT AVG(score) FROM ratings WHERE to_user_id = target_user_id),
      0
    ),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE to_user_id = target_user_id),
    updated_at = now()
  WHERE id = target_user_id;

  RETURN NULL;
END;
$$;

-- Auto-create a profiles row on user sign-up
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Enforce no edits on borrow-locked items (only status change to stored allowed)
CREATE OR REPLACE FUNCTION enforce_item_no_edits_while_borrow_locked()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  old_j jsonb;
  new_j jsonb;
BEGIN
  IF OLD.status IN ('loaned', 'reserved') AND NEW.status = OLD.status THEN
    old_j := to_jsonb(OLD) - 'updated_at';
    new_j := to_jsonb(NEW) - 'updated_at';
    IF old_j IS DISTINCT FROM new_j THEN
      RAISE EXCEPTION 'Borrow-locked items may only change when releasing to stored';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Enforce borrow request status transition rules
CREATE OR REPLACE FUNCTION borrow_requests_enforce_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF OLD.item_id IS DISTINCT FROM NEW.item_id
     OR OLD.requester_id IS DISTINCT FROM NEW.requester_id THEN
    RAISE EXCEPTION 'borrow_requests: cannot change item_id or requester_id';
  END IF;

  IF OLD.status IN ('rejected', 'returned', 'cancelled') AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'borrow_requests: cannot change status from terminal state %', OLD.status;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    IF NOT EXISTS (SELECT 1 FROM items WHERE id = NEW.item_id AND owner_id = auth.uid()) THEN
      RAISE EXCEPTION 'borrow_requests: only item owner may accept or reject';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
    IF OLD.requester_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'borrow_requests: only requester may cancel a pending request';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'accepted' AND NEW.status = 'returned' THEN
    IF NOT EXISTS (SELECT 1 FROM items WHERE id = NEW.item_id AND owner_id = auth.uid()) THEN
      RAISE EXCEPTION 'borrow_requests: only item owner may mark returned';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'accepted' AND NEW.status = 'cancelled' THEN
    IF OLD.requester_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'borrow_requests: only requester may cancel an accepted request';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'borrow_requests: invalid status transition from % to %', OLD.status, NEW.status;
END;
$$;

-- Tag autocomplete RPC
CREATE OR REPLACE FUNCTION get_user_tags()
RETURNS SETOF text AS $$
  SELECT DISTINCT unnest(tags) FROM items WHERE owner_id = auth.uid()
  ORDER BY 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public;

-- Get public profile (safe fields only, bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  rating_avg numeric,
  rating_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.rating_avg,
    p.rating_count,
    p.created_at
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated, anon;

-- Atomically transition a borrow request and its associated item status
CREATE OR REPLACE FUNCTION transition_borrow_request(
  p_request_id UUID,
  p_new_request_status TEXT,
  p_new_item_status TEXT
) RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
BEGIN
  UPDATE borrow_requests
  SET status = p_new_request_status::borrow_request_status, updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrow request % not found', p_request_id;
  END IF;

  UPDATE items
  SET status = p_new_item_status::item_status
  WHERE id = v_request.item_id;

  RETURN to_jsonb(v_request);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

-- ============================================================
-- FUNCTIONS: Search and Listing RPCs
-- ============================================================

-- Listing detail: single item with owner profile, area name, distance
CREATE OR REPLACE FUNCTION get_listing_detail(
  p_item_id uuid
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  category item_category,
  brand text,
  model text,
  description text,
  condition item_condition,
  status item_status,
  availability_types text[],
  price numeric,
  deposit numeric,
  borrow_duration text,
  visibility item_visibility,
  pickup_location_id uuid,
  quantity integer,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters float,
  area_name text,
  owner_display_name text,
  owner_avatar_url text,
  owner_rating_avg numeric,
  owner_rating_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.owner_id,
    i.name,
    i.category,
    i.brand,
    i.model,
    i.description,
    i.condition,
    i.status,
    i.availability_types,
    i.price,
    i.deposit,
    i.borrow_duration,
    i.visibility,
    i.pickup_location_id,
    i.quantity,
    i.created_at,
    i.updated_at,
    CASE
      WHEN sl.coordinates IS NOT NULL AND caller_loc.coordinates IS NOT NULL
      THEN ST_Distance(sl.coordinates, caller_loc.coordinates)
      ELSE NULL
    END AS distance_meters,
    sl.area_name,
    p.display_name AS owner_display_name,
    p.avatar_url AS owner_avatar_url,
    COALESCE(p.rating_avg, 0) AS owner_rating_avg,
    COALESCE(p.rating_count, 0) AS owner_rating_count
  FROM items i
  LEFT JOIN saved_locations sl ON sl.id = i.pickup_location_id
  LEFT JOIN public_profiles p ON p.id = i.owner_id
  LEFT JOIN LATERAL (
    SELECT loc.coordinates
    FROM saved_locations loc
    WHERE loc.user_id = auth.uid() AND loc.is_primary = true
    LIMIT 1
  ) caller_loc ON true
  WHERE i.id = p_item_id
    -- Non-owners cannot view archived, donated, or sold items
    AND (i.owner_id = auth.uid() OR i.status NOT IN ('archived', 'donated', 'sold'))
    AND (
      i.visibility = 'all'
      OR i.owner_id = auth.uid()
      OR (
        i.visibility = 'groups'
        AND EXISTS (
          SELECT 1 FROM item_groups ig
          JOIN group_members gm ON gm.group_id = ig.group_id
          WHERE ig.item_id = i.id AND gm.user_id = auth.uid()
        )
      )
    );
END;
$$;

-- Search nearby items (authenticated only)
CREATE OR REPLACE FUNCTION search_nearby_items(
  query text DEFAULT NULL,
  lat float DEFAULT NULL,
  lng float DEFAULT NULL,
  max_distance_meters int DEFAULT 10000,
  p_categories item_category[] DEFAULT NULL,
  p_conditions item_condition[] DEFAULT NULL,
  p_status item_status DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  category item_category,
  brand text,
  model text,
  description text,
  condition item_condition,
  status item_status,
  availability_types text[],
  price numeric,
  deposit numeric,
  borrow_duration text,
  visibility item_visibility,
  pickup_location_id uuid,
  quantity integer,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters float
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'search requires authentication'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.owner_id,
    i.name,
    i.category,
    i.brand,
    i.model,
    i.description,
    i.condition,
    i.status,
    i.availability_types,
    i.price,
    i.deposit,
    i.borrow_duration,
    i.visibility,
    i.pickup_location_id,
    i.quantity,
    i.created_at,
    i.updated_at,
    CASE
      WHEN lat IS NOT NULL AND lng IS NOT NULL AND sl.coordinates IS NOT NULL
      THEN ST_Distance(
        sl.coordinates,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      )
      ELSE NULL
    END AS distance_meters
  FROM items i
  LEFT JOIN saved_locations sl ON sl.id = i.pickup_location_id
  WHERE
    i.owner_id != auth.uid()
    AND i.status NOT IN ('archived', 'donated', 'sold')
    AND (
      i.visibility = 'all'
      OR (
        i.visibility = 'groups'
        AND EXISTS (
          SELECT 1 FROM item_groups ig
          JOIN group_members gm ON gm.group_id = ig.group_id
          WHERE ig.item_id = i.id AND gm.user_id = auth.uid()
        )
      )
    )
    AND (
      query IS NULL
      OR i.name ILIKE '%' || query || '%'
      OR i.brand ILIKE '%' || query || '%'
      OR i.model ILIKE '%' || query || '%'
      OR i.description ILIKE '%' || query || '%'
    )
    AND (p_categories IS NULL OR i.category = ANY(p_categories))
    AND (p_conditions IS NULL OR i.condition = ANY(p_conditions))
    AND (p_status IS NULL OR i.status = p_status)
    AND (
      lat IS NULL OR lng IS NULL
      OR sl.coordinates IS NULL
      OR ST_DWithin(
        sl.coordinates,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        max_distance_meters
      )
    )
  ORDER BY
    CASE
      WHEN lat IS NOT NULL AND lng IS NOT NULL AND sl.coordinates IS NOT NULL
      THEN ST_Distance(
        sl.coordinates,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      )
      ELSE 0
    END ASC,
    i.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Restrict search to authenticated users only
REVOKE ALL ON FUNCTION public.search_nearby_items(text, float, float, int, item_category[], item_condition[], item_status, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_nearby_items(text, float, float, int, item_category[], item_condition[], item_status, int, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_nearby_items(text, float, float, int, item_category[], item_condition[], item_status, int, int) TO authenticated;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER trg_items_tags_max_length
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION check_tags_max_length();

CREATE TRIGGER trg_items_enforce_borrow_locked_update
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION enforce_item_no_edits_while_borrow_locked();

CREATE TRIGGER trg_update_user_rating_avg
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_avg();

CREATE TRIGGER trg_create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_on_signup();

CREATE TRIGGER trg_borrow_requests_enforce_update_rules
  BEFORE UPDATE ON borrow_requests
  FOR EACH ROW
  EXECUTE FUNCTION borrow_requests_enforce_update_rules();

-- ============================================================
-- STORAGE
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: enforce user-owned paths
CREATE POLICY "item_photos_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "item_photos_storage_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'item-photos');

CREATE POLICY "item_photos_storage_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'item-photos' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "item_photos_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'item-photos' AND (storage.foldername(name))[2] = auth.uid()::text);

INSERT INTO storage.buckets (id, name, public)
VALUES ('data-exports', 'data-exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "data_exports_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'data-exports'
    AND auth.uid()::text = (string_to_array(name, '/'))[2]
  );

-- ============================================================
-- REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

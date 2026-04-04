-- ============================================================
-- SCHEMA: profiles, subscriptions, saved_locations + public_profiles view
-- RLS for these tables is in this file (same pattern as bikes).
-- ============================================================

CREATE TYPE subscription_plan AS ENUM ('free', 'paid');
CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'expired'
);

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


-- ============================================================
-- RLS: profiles, saved_locations, subscriptions
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================

-- Own profile: full access (includes push_token)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING ((select auth.uid()) = id);

-- ============================================================
-- RLS POLICIES: saved_locations
-- ============================================================

CREATE POLICY "saved_locations_select_own"
  ON saved_locations FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "saved_locations_insert_own"
  ON saved_locations FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "saved_locations_update_own"
  ON saved_locations FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "saved_locations_delete_own"
  ON saved_locations FOR DELETE
  USING ((select auth.uid()) = user_id);


-- ============================================================
-- RLS POLICIES: subscriptions
-- ============================================================

CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING ((select auth.uid()) = user_id);

-- No INSERT/UPDATE/DELETE policies: service_role / dashboard SQL only

-- ============================================================
-- View: safe profile fields (no push_token) for listings / public display
-- ============================================================

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
-- Trigger: auto-create profile on auth.users insert
-- ============================================================

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

CREATE TRIGGER trg_create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_on_signup();

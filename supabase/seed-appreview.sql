-- =============================================================
-- App Store / Play Store Review Account Seed (idempotent)
-- =============================================================
-- Creates or refreshes the appreview@bikebin.app account plus a
-- small set of sample listings so store reviewers see a populated
-- app when they sign in with the credentials we put in App Store
-- Connect / Play Console.
--
-- Run (production or any environment):
--   psql "$SUPABASE_DB_URL" \
--     -v appreview_password="$APPREVIEW_PASSWORD" \
--     -f supabase/seed-appreview.sql
--
-- Or via npm:
--   npm run seed:appreview
--
-- Re-running refreshes the password and sample data; nothing else
-- in the database is touched.
-- =============================================================

\set ON_ERROR_STOP on

-- The wrapper script (scripts/seed-appreview.sh) verifies APPREVIEW_PASSWORD
-- is set and non-empty before invoking psql, so we don't re-validate here.

-- ── Auth User ───────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
) VALUES (
  'a1b2c3d4-0008-4000-8000-000000000008',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'appreview@bikebin.app',
  crypt(:'appreview_password', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '', '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  '{}',
  false, false
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now()),
  updated_at = now();

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0008-4000-8000-000000000008',
  'a1b2c3d4-0008-4000-8000-000000000008',
  jsonb_build_object(
    'sub', 'a1b2c3d4-0008-4000-8000-000000000008',
    'email', 'appreview@bikebin.app',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(), now(), now()
)
ON CONFLICT (provider_id, provider) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = now(),
  updated_at = now();

-- ── Profile ─────────────────────────────────────────────────
-- The auth.users insert trigger creates a profile row; upsert to set our values.
INSERT INTO profiles (id, display_name, avatar_url, rating_avg, rating_count, created_at, updated_at) VALUES
  ('a1b2c3d4-0008-4000-8000-000000000008', 'App Reviewer', NULL, 4.80, 5, now() - interval '60 days', now())
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  rating_avg = EXCLUDED.rating_avg,
  rating_count = EXCLUDED.rating_count,
  updated_at = now();

-- ── Saved Location ──────────────────────────────────────────
INSERT INTO saved_locations (id, user_id, label, area_name, postcode, coordinates, is_primary, created_at) VALUES
  ('b0000001-0001-4000-8000-000000000008', 'a1b2c3d4-0008-4000-8000-000000000008', 'Home', 'Mitte, Berlin', '10115', ST_Point(13.3830, 52.5320)::geography, true, now() - interval '60 days')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  area_name = EXCLUDED.area_name,
  postcode = EXCLUDED.postcode,
  coordinates = EXCLUDED.coordinates,
  is_primary = EXCLUDED.is_primary;

-- ── Bike ────────────────────────────────────────────────────
INSERT INTO bikes (id, owner_id, name, brand, model, type, year, created_at, updated_at) VALUES
  ('c0000001-0001-4000-8000-000000000008', 'a1b2c3d4-0008-4000-8000-000000000008', 'Trek Marlin 7', 'Trek', 'Marlin 7', 'mtb', 2024, now() - interval '60 days', now() - interval '5 days')
ON CONFLICT (id) DO UPDATE SET
  owner_id = EXCLUDED.owner_id,
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  type = EXCLUDED.type,
  year = EXCLUDED.year,
  updated_at = now();

-- ── Items ───────────────────────────────────────────────────
INSERT INTO items (
  id, owner_id, bike_id, name, category, subcategory, brand, model, description,
  condition, status, availability_types, price, deposit, borrow_duration,
  storage_location, age, usage_km, purchase_date, pickup_location_id, visibility,
  created_at, updated_at
) VALUES
  ('d0000001-0001-4000-8000-000000000008', 'a1b2c3d4-0008-4000-8000-000000000008', 'c0000001-0001-4000-8000-000000000008', 'Park Tool MTB-7 Multi-tool', 'tool',      'multi_tools', 'Park Tool',   'MTB-7',               'Trail multi-tool with chain breaker. Used a few times.',                  'good', 'stored', '{borrowable}',         NULL, 5,    '1_week', 'Tool box',     '1_to_2_years',   NULL, (now() - interval '300 days')::date, 'b0000001-0001-4000-8000-000000000008', 'all', now() - interval '40 days', now() - interval '5 days'),
  ('d0000001-0002-4000-8000-000000000008', 'a1b2c3d4-0008-4000-8000-000000000008', NULL,                                   'Continental Race King Tire', 'component', 'tires_tubes', 'Continental', 'Race King 29x2.2',    'Used XC tire, plenty of tread left. Switching to a faster rolling tire.', 'good', 'stored', '{sellable,donatable}', 25,   NULL, NULL,     'Garage shelf', '6_to_12_months', 600,  (now() - interval '180 days')::date, 'b0000001-0001-4000-8000-000000000008', 'all', now() - interval '20 days', now() - interval '3 days'),
  ('d0000001-0003-4000-8000-000000000008', 'a1b2c3d4-0008-4000-8000-000000000008', NULL,                                   'Lezyne Classic Floor Pump',  'tool',      'pumps',       'Lezyne',      'Classic Floor Drive', 'Steel-barrel floor pump with analog gauge. Reliable.',                    'good', 'stored', '{borrowable}',         NULL, 8,    '1_week', 'Garage',       '2_to_3_years',   NULL, (now() - interval '700 days')::date, 'b0000001-0001-4000-8000-000000000008', 'all', now() - interval '30 days', now() - interval '4 days')
ON CONFLICT (id) DO UPDATE SET
  owner_id = EXCLUDED.owner_id,
  bike_id = EXCLUDED.bike_id,
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  description = EXCLUDED.description,
  condition = EXCLUDED.condition,
  status = EXCLUDED.status,
  availability_types = EXCLUDED.availability_types,
  price = EXCLUDED.price,
  deposit = EXCLUDED.deposit,
  borrow_duration = EXCLUDED.borrow_duration,
  storage_location = EXCLUDED.storage_location,
  age = EXCLUDED.age,
  usage_km = EXCLUDED.usage_km,
  purchase_date = EXCLUDED.purchase_date,
  pickup_location_id = EXCLUDED.pickup_location_id,
  visibility = EXCLUDED.visibility,
  updated_at = now();

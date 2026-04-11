-- =============================================================
-- Test Data Seed
-- =============================================================
-- Populates the local Supabase instance with realistic test data.
-- Run via: supabase db reset (auto-executes seed.sql)
--
-- All test users share password: testpass123
-- UUIDs match src/shared/constants/testUsers.ts
-- =============================================================

-- Clean up existing test data (idempotent re-seed)
-- Conversations have no FK to profiles/auth.users so they survive user deletion;
-- delete them explicitly (cascades to conversation_participants + messages).
DELETE FROM conversations
WHERE id = ANY (
  ARRAY[
    'f0000001-0001-4000-8000-000000000001',
    'f0000001-0002-4000-8000-000000000001',
    'f0000001-0003-4000-8000-000000000001',
    'f0000001-0004-4000-8000-000000000001',
    'f0000001-0005-4000-8000-000000000001'
  ]::uuid[]
);
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@bikebin.dev');
DELETE FROM auth.users WHERE email LIKE '%@bikebin.dev';

-- ── Auth Users ──────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test@bikebin.dev',    crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', false, false),
  ('a1b2c3d4-0002-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcus@bikebin.dev',  crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', false, false),
  ('a1b2c3d4-0003-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah@bikebin.dev',   crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', false, false),
  ('a1b2c3d4-0004-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jonas@bikebin.dev',   crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', false, false),
  ('a1b2c3d4-0005-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lisa@bikebin.dev',    crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', false, false),
  ('a1b2c3d4-0006-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kai@bikebin.dev',     crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', false, false),
  ('a1b2c3d4-0007-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nina@bikebin.dev',    crypt('testpass123', gen_salt('bf')), now(), now(), now(), '', '', '', '', '', '', '', '', '{"provider":"email","providers":["email"]}', '{}', false, false);

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'a1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', jsonb_build_object('sub', 'a1b2c3d4-0001-4000-8000-000000000001', 'email', 'test@bikebin.dev',   'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
  (gen_random_uuid(), 'a1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', jsonb_build_object('sub', 'a1b2c3d4-0002-4000-8000-000000000002', 'email', 'marcus@bikebin.dev', 'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
  (gen_random_uuid(), 'a1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-0003-4000-8000-000000000003', jsonb_build_object('sub', 'a1b2c3d4-0003-4000-8000-000000000003', 'email', 'sarah@bikebin.dev',  'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
  (gen_random_uuid(), 'a1b2c3d4-0004-4000-8000-000000000004', 'a1b2c3d4-0004-4000-8000-000000000004', jsonb_build_object('sub', 'a1b2c3d4-0004-4000-8000-000000000004', 'email', 'jonas@bikebin.dev',  'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
  (gen_random_uuid(), 'a1b2c3d4-0005-4000-8000-000000000005', 'a1b2c3d4-0005-4000-8000-000000000005', jsonb_build_object('sub', 'a1b2c3d4-0005-4000-8000-000000000005', 'email', 'lisa@bikebin.dev',   'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
  (gen_random_uuid(), 'a1b2c3d4-0006-4000-8000-000000000006', 'a1b2c3d4-0006-4000-8000-000000000006', jsonb_build_object('sub', 'a1b2c3d4-0006-4000-8000-000000000006', 'email', 'kai@bikebin.dev',    'email_verified', false, 'phone_verified', false), 'email', now(), now(), now()),
  (gen_random_uuid(), 'a1b2c3d4-0007-4000-8000-000000000007', 'a1b2c3d4-0007-4000-8000-000000000007', jsonb_build_object('sub', 'a1b2c3d4-0007-4000-8000-000000000007', 'email', 'nina@bikebin.dev',   'email_verified', false, 'phone_verified', false), 'email', now(), now(), now());

-- ── Profiles ────────────────────────────────────────────────
-- Note: auth.users trigger auto-creates profiles, so we use ON CONFLICT to set our values
INSERT INTO profiles (id, display_name, avatar_url, rating_avg, rating_count, created_at, updated_at) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Test User',  NULL, 4.70, 12, now() - interval '180 days', now() - interval '2 days'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Marcus B.',  NULL, 4.80, 23, now() - interval '200 days', now() - interval '5 days'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Sarah K.',   NULL, 4.50,  8, now() - interval '150 days', now() - interval '3 days'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'Jonas W.',   NULL, 4.90, 31, now() - interval '300 days', now() - interval '1 day'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'Lisa M.',    NULL, 4.60, 15, now() - interval '120 days', now() - interval '4 days'),
  ('a1b2c3d4-0006-4000-8000-000000000006', 'Kai R.',     NULL, 4.40, 10, now() - interval '160 days', now() - interval '6 days'),
  ('a1b2c3d4-0007-4000-8000-000000000007', 'Nina T.',    NULL, 4.75, 18, now() - interval '140 days', now() - interval '3 days')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  rating_avg = EXCLUDED.rating_avg,
  rating_count = EXCLUDED.rating_count,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

-- ── Saved Locations ─────────────────────────────────────────
INSERT INTO saved_locations (id, user_id, label, area_name, postcode, coordinates, is_primary, created_at) VALUES
  ('b0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Home',   'Kreuzberg, Berlin',       '10997', ST_Point(13.4282, 52.4997)::geography, true,  now() - interval '180 days'),
  ('b0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Office', 'Mitte, Berlin',           '10115', ST_Point(13.3830, 52.5320)::geography, false, now() - interval '90 days'),
  ('b0000001-0001-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', 'Home',   'Friedrichshain, Berlin',  '10245', ST_Point(13.4540, 52.5150)::geography, true,  now() - interval '200 days'),
  ('b0000001-0001-4000-8000-000000000003', 'a1b2c3d4-0003-4000-8000-000000000003', 'Home',   'Prenzlauer Berg, Berlin', '10405', ST_Point(13.4234, 52.5388)::geography, true,  now() - interval '150 days'),
  ('b0000001-0001-4000-8000-000000000004', 'a1b2c3d4-0004-4000-8000-000000000004', 'Home',   'Neukoelln, Berlin',       '12043', ST_Point(13.4350, 52.4810)::geography, true,  now() - interval '300 days'),
  ('b0000001-0002-4000-8000-000000000004', 'a1b2c3d4-0004-4000-8000-000000000004', 'Garage', 'Tempelhof, Berlin',       '12101', ST_Point(13.3850, 52.4680)::geography, false, now() - interval '200 days'),
  ('b0000001-0001-4000-8000-000000000005', 'a1b2c3d4-0005-4000-8000-000000000005', 'Home',   'Charlottenburg, Berlin',  '10585', ST_Point(13.3040, 52.5160)::geography, true,  now() - interval '120 days'),
  ('b0000001-0001-4000-8000-000000000006', 'a1b2c3d4-0006-4000-8000-000000000006', 'Home',   'Wedding, Berlin',         '13347', ST_Point(13.3650, 52.5510)::geography, true,  now() - interval '160 days'),
  ('b0000001-0001-4000-8000-000000000007', 'a1b2c3d4-0007-4000-8000-000000000007', 'Home',   'Schoeneberg, Berlin',     '10823', ST_Point(13.3530, 52.4890)::geography, true,  now() - interval '140 days');

-- ── Bikes ───────────────────────────────────────────────────
INSERT INTO bikes (id, owner_id, name, brand, model, type, year, created_at, updated_at) VALUES
  ('c0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Santa Cruz Hightower',      'Santa Cruz',  'Hightower C S',      'mtb',     2024, now() - interval '90 days',  now() - interval '10 days'),
  ('c0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Commencal Meta HT AM',      'Commencal',   'Meta HT AM',         'mtb',     2021, now() - interval '400 days', now() - interval '60 days'),
  ('c0000001-0001-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', 'Canyon Endurace CF 7',      'Canyon',      'Endurace CF 7',      'road',    2023, now() - interval '120 days', now() - interval '30 days'),
  ('c0000001-0002-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', 'Specialized Tarmac SL7',    'Specialized', 'Tarmac SL7',         'road',    2022, now() - interval '300 days', now() - interval '90 days'),
  ('c0000001-0001-4000-8000-000000000003', 'a1b2c3d4-0003-4000-8000-000000000003', 'Brompton C Line',           'Brompton',    'C Line Explore',     'city',    2023, now() - interval '100 days', now() - interval '20 days'),
  ('c0000001-0001-4000-8000-000000000004', 'a1b2c3d4-0004-4000-8000-000000000004', 'Surly Long Haul Trucker',   'Surly',       'Long Haul Trucker',  'touring', 2020, now() - interval '500 days', now() - interval '15 days'),
  ('c0000001-0001-4000-8000-000000000005', 'a1b2c3d4-0005-4000-8000-000000000005', 'Canyon Grail CF SL',        'Canyon',      'Grail CF SL 8',      'gravel',  2024, now() - interval '60 days',  now() - interval '5 days'),
  ('c0000001-0002-4000-8000-000000000005', 'a1b2c3d4-0005-4000-8000-000000000005', 'Ridley Kanzo Fast',         'Ridley',      'Kanzo Fast',         'gravel',  2022, now() - interval '250 days', now() - interval '40 days'),
  ('c0000001-0001-4000-8000-000000000006', 'a1b2c3d4-0006-4000-8000-000000000006', 'YT Capra MX',               'YT',          'Capra MX Core 3',    'mtb',     2024, now() - interval '80 days',  now() - interval '7 days'),
  ('c0000001-0002-4000-8000-000000000006', 'a1b2c3d4-0006-4000-8000-000000000006', 'Canyon Spectral 125',       'Canyon',      'Spectral 125 CF 7',  'mtb',     2023, now() - interval '200 days', now() - interval '30 days'),
  ('c0000001-0001-4000-8000-000000000007', 'a1b2c3d4-0007-4000-8000-000000000007', 'Specialized Epic EVO',      'Specialized', 'Epic EVO Expert',    'mtb',     2024, now() - interval '70 days',  now() - interval '5 days'),
  ('c0000001-0002-4000-8000-000000000007', 'a1b2c3d4-0007-4000-8000-000000000007', 'Trek Fuel EX 8',            'Trek',        'Fuel EX 8 Gen 6',    'mtb',     2023, now() - interval '180 days', now() - interval '20 days');

-- ── Items ───────────────────────────────────────────────────

-- Test User items (MTB rider)
INSERT INTO items (id, owner_id, bike_id, name, category, subcategory, brand, model, description, condition, status, availability_types, price, deposit, borrow_duration, storage_location, age, usage_km, purchase_date, pickup_location_id, visibility, created_at, updated_at) VALUES
  ('d0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'c0000001-0001-4000-8000-000000000001', 'Fox 36 Float Fork',            'component', 'suspension',        'Fox',          '36 Float Performance',   '160mm travel, 29er boost. Serviced 200km ago.',                                             'good',  'mounted', '{borrowable}',              NULL, 50,   '1_week',       NULL,           '6_to_12_months', 1200, (now() - interval '250 days')::date, 'b0000001-0001-4000-8000-000000000001', 'all', now() - interval '90 days',  now() - interval '10 days'),
  ('d0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', NULL,                                   'Maxxis Minion DHF/DHR Combo',  'component', 'tires_tubes',       'Maxxis',       'Minion DHF/DHR II 29x2.5', 'Front DHF + rear DHR II set. EXO+ casing, MaxxTerra. About 60% tread left.',               'worn',  'stored',  '{sellable,donatable}',      40,   NULL,  NULL,           'Garage shelf', '1_to_2_years', 2000, (now() - interval '400 days')::date, 'b0000001-0001-4000-8000-000000000001', 'all', now() - interval '30 days',  now() - interval '5 days'),
  ('d0000001-0003-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', NULL,                                   'Park Tool Chain Checker',      'tool',      'chain_tools',       'Park Tool',    'CC-3.2',                 'Chain wear indicator. Essential for bike maintenance.',                                      'good',  'stored',  '{borrowable}',              NULL, 5,    '1_week',       'Tool box',     '2_to_3_years', NULL, (now() - interval '730 days')::date, 'b0000001-0001-4000-8000-000000000001', 'all', now() - interval '90 days',  now() - interval '15 days'),
  ('d0000001-0004-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', NULL,                                   'Topeak Alien II Multi-tool',   'tool',      'multi_tools',       'Topeak',       'Alien II',               '26-function multi-tool. Great for trailside repairs.',                                      'good',  'stored',  '{borrowable}',              NULL, 5,    '1_week',       'Backpack',     '2_to_3_years', NULL, (now() - interval '600 days')::date, 'b0000001-0001-4000-8000-000000000001', 'all', now() - interval '60 days',  now() - interval '8 days'),
  ('d0000001-0005-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', NULL,                                   'Troy Lee Designs A3 Helmet',   'clothing',  'helmets',           'Troy Lee',     'A3 MIPS',                'Trail helmet, size M/L. MIPS, good ventilation. Got a new one.',                            'good',  'stored',  '{sellable}',                60,   NULL,  NULL,           'Closet',       '1_to_2_years', NULL, (now() - interval '350 days')::date, 'b0000001-0001-4000-8000-000000000001', 'all', now() - interval '25 days',  now() - interval '5 days'),
  ('d0000001-0006-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', NULL,                                   'Park Tool PCS-10.3 Stand',     'tool',      'stands',            'Park Tool',    'PCS-10.3',               'Portable repair stand. Folds flat, holds bikes up to 36kg.',                                'good',  'loaned',  '{borrowable}',              NULL, 30,   '2_3_days',     'Garage',       '3_to_5_years', NULL, (now() - interval '900 days')::date, 'b0000001-0001-4000-8000-000000000001', 'all', now() - interval '40 days',  now() - interval '3 days'),
  ('d0000001-0007-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'c0000001-0002-4000-8000-000000000001', 'RaceFace Turbine R Cranks',    'component', 'drivetrain',        'RaceFace',     'Turbine R 175mm',        'Alloy cranks, 30T direct mount ring. Swapped for carbon set.',                              'good',  'stored',  '{sellable,borrowable}',     65,   20,   '2_weeks',      'Garage shelf', '2_to_3_years', 3500, (now() - interval '600 days')::date, 'b0000001-0001-4000-8000-000000000001', 'all', now() - interval '20 days',  now() - interval '8 days'),
  ('d0000001-0008-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', NULL,                                   'Muc-Off Chain Lube',           'consumable','chain_lube',        'Muc-Off',      'Wet Lube 120ml',         'About half bottle left. Works great in wet conditions.',                                    'good',  'stored',  '{donatable}',               NULL, NULL,  NULL,           'Shelf',        '6_to_12_months', NULL, (now() - interval '200 days')::date, 'b0000001-0001-4000-8000-000000000001', 'all', now() - interval '10 days',  now() - interval '3 days'),
  -- Second active loan (Marcus): used by E2E "Mark as Returned" from item detail — keeps Kai + PCS-10 for borrow-requests tab tests.
  ('d0000001-0009-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', NULL,                                   'Lezyne Digital Floor Drive',   'tool',      'pumps',             'Lezyne',       'Digital Floor Drive',  'Compact floor pump with digital gauge.',                                                   'good',  'loaned',  '{borrowable}',              NULL, 10,   '1_week',       'Garage',       '1_to_2_years', NULL, (now() - interval '400 days')::date, 'b0000001-0001-4000-8000-000000000001', 'all', now() - interval '90 days',  now() - interval '10 days'),
  -- Dedicated stored item for E2E archive flow (avoids Chain Checker, which has Nina's pending borrow).
  ('d0000001-000a-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', NULL,                                   'Park Tool P-Handle Hex Set',   'tool',      'multi_tools',       'Park Tool',    'PH-1.2',                 'Full set of P-handle hex keys.',                                                            'good',  'stored',  '{borrowable}',              NULL, 5,    '1_week',       'Tool box',     '2_to_3_years', NULL, (now() - interval '500 days')::date, 'b0000001-0001-4000-8000-000000000001', 'all', now() - interval '90 days',  now() - interval '10 days');

-- Marcus items (road cyclist)
INSERT INTO items (id, owner_id, bike_id, name, category, subcategory, brand, model, description, condition, status, availability_types, price, deposit, borrow_duration, storage_location, age, usage_km, purchase_date, pickup_location_id, visibility, created_at, updated_at) VALUES
  ('d0000001-0001-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', 'c0000001-0001-4000-8000-000000000002', 'Shimano 105 Cassette',         'component', 'drivetrain',        'Shimano',      '105 CS-R7000',           '11-speed cassette, 11-28T. Lightly used for one season.',                                   'good',  'mounted', '{borrowable}',              NULL, 20,   '2_weeks',      NULL,           '1_to_2_years', 3200, (now() - interval '365 days')::date, 'b0000001-0001-4000-8000-000000000002', 'all', now() - interval '120 days', now() - interval '30 days'),
  ('d0000001-0002-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', NULL,                                   'Continental GP5000 Tires',     'component', 'tires_tubes',       'Continental',  'Grand Prix 5000',        'Set of two 700x25mm clincher tires. ~500 km on them, plenty of tread left.',                'good',  'stored',  '{sellable,donatable}',      35,   NULL,  NULL,           'Garage shelf', '6_to_12_months', 500, (now() - interval '180 days')::date, 'b0000001-0001-4000-8000-000000000002', 'all', now() - interval '60 days',  now() - interval '5 days'),
  ('d0000001-0003-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', NULL,                                   'Lezyne Micro Floor Drive',     'tool',      'pumps',             'Lezyne',       'Micro Floor Drive HVG',  'Compact floor pump with gauge. Works with presta and schrader.',                            'good',  'stored',  '{borrowable}',              NULL, 10,   '1_week',       'Hallway',      '1_to_2_years', NULL, (now() - interval '365 days')::date, 'b0000001-0001-4000-8000-000000000002', 'all', now() - interval '45 days',  now() - interval '3 days'),
  ('d0000001-0004-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', 'c0000001-0001-4000-8000-000000000002', 'Fizik Antares R5 Saddle',      'component', 'seatposts_saddles', 'Fizik',        'Antares R5',             'Replaced with a different width. This is 143mm, regular flex.',                             'worn',  'stored',  '{donatable}',               NULL, NULL,  NULL,           'Garage shelf', '3_to_5_years', 8000, (now() - interval '1095 days')::date, 'b0000001-0001-4000-8000-000000000002', 'all', now() - interval '30 days', now() - interval '1 day'),
  ('d0000001-0005-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', NULL,                                   'Shimano SPD-SL Cleats',        'component', 'pedals',            'Shimano',      'SM-SH11',                'Yellow 6-degree float cleats, brand new in package. Bought extra pair by mistake.',         'new',   'stored',  '{sellable}',                12,   NULL,  NULL,           'Drawer',       NULL,           0,(now() - interval '14 days')::date,  'b0000001-0001-4000-8000-000000000002', 'all', now() - interval '10 days', now() - interval '10 days'),
  ('d0000001-0006-4000-8000-000000000002', 'a1b2c3d4-0002-4000-8000-000000000002', 'c0000001-0002-4000-8000-000000000002', 'Zipp Service Course Handlebar','component', 'handlebars_stems',  'Zipp',         'Service Course SL-70',   '42cm compact drop bar. Alloy, 31.8mm clamp. Removed during fit change.',                    'good',  'stored',  '{sellable,borrowable}',     40,   15,   '2_weeks',      'Garage shelf', '2_to_3_years', 5000, (now() - interval '800 days')::date, 'b0000001-0001-4000-8000-000000000002', 'all', now() - interval '20 days', now() - interval '8 days');

-- Sarah items (commuter)
INSERT INTO items (id, owner_id, bike_id, name, category, subcategory, brand, model, description, condition, status, availability_types, price, deposit, borrow_duration, storage_location, age, usage_km, purchase_date, pickup_location_id, visibility, created_at, updated_at) VALUES
  ('d0000001-0001-4000-8000-000000000003', 'a1b2c3d4-0003-4000-8000-000000000003', 'c0000001-0001-4000-8000-000000000003', 'Brompton Front Carrier Block', 'accessory', 'bags_racks',        'Brompton',     'Front Carrier Block',    'Standard front carrier block for Brompton bags. Came with bike, switched to aftermarket.',  'good',  'stored',  '{sellable,donatable}',      8,    NULL,  NULL,           'Drawer',       '1_to_2_years', NULL, (now() - interval '365 days')::date, 'b0000001-0001-4000-8000-000000000003', 'all', now() - interval '50 days', now() - interval '8 days'),
  ('d0000001-0002-4000-8000-000000000003', 'a1b2c3d4-0003-4000-8000-000000000003', NULL,                                   'Kryptonite Evolution Mini-7',  'accessory', 'locks',             'Kryptonite',   'Evolution Mini-7',       'Compact U-lock with flex cable. Sold Secure Gold rated.',                                   'good',  'stored',  '{borrowable}',              NULL, 20,   '1_week',       'Hallway',      '2_to_3_years', NULL, (now() - interval '600 days')::date, 'b0000001-0001-4000-8000-000000000003', 'all', now() - interval '35 days', now() - interval '5 days'),
  ('d0000001-0003-4000-8000-000000000003', 'a1b2c3d4-0003-4000-8000-000000000003', NULL,                                   'Busch+Mueller IQ-X Light',     'accessory', 'lights',            'Busch+Mueller','IQ-X',                   '100 lux dynamo front light. Amazing beam pattern. Upgrading to IQ-X E.',                    'good',  'stored',  '{sellable}',                45,   NULL,  NULL,           'Shelf',        '2_to_3_years', NULL, (now() - interval '500 days')::date, 'b0000001-0001-4000-8000-000000000003', 'all', now() - interval '20 days', now() - interval '3 days'),
  ('d0000001-0004-4000-8000-000000000003', 'a1b2c3d4-0003-4000-8000-000000000003', 'c0000001-0001-4000-8000-000000000003', 'SKS Bluemels Fenders',         'accessory', 'fenders',           'SKS',          'Bluemels 45mm',          'Full-length clip-on fenders. Fit 700c wheels with tires up to 42mm.',                       'good',  'stored',  '{borrowable,donatable}',    NULL, 5,    '2_weeks',      'Basement',     '1_to_2_years', NULL, (now() - interval '300 days')::date, 'b0000001-0001-4000-8000-000000000003', 'all', now() - interval '15 days', now() - interval '2 days'),
  ('d0000001-0005-4000-8000-000000000003', 'a1b2c3d4-0003-4000-8000-000000000003', NULL,                                   'Schwalbe Marathon Plus Tire',  'component', 'tires_tubes',       'Schwalbe',     'Marathon Plus 700x28',   'Puncture-resistant touring tire. Used for one tour, still has good tread.',                  'good',  'stored',  '{sellable,donatable}',      18,   NULL,  NULL,           'Shelf',        '6_to_12_months', 800, (now() - interval '200 days')::date, 'b0000001-0001-4000-8000-000000000003', 'all', now() - interval '7 days', now() - interval '1 day');

-- Jonas items (touring cyclist)
INSERT INTO items (id, owner_id, bike_id, name, category, subcategory, brand, model, description, condition, status, availability_types, price, deposit, borrow_duration, storage_location, age, usage_km, purchase_date, pickup_location_id, visibility, created_at, updated_at) VALUES
  ('d0000001-0001-4000-8000-000000000004', 'a1b2c3d4-0004-4000-8000-000000000004', 'c0000001-0001-4000-8000-000000000004', 'Tubus Logo Rear Rack',         'accessory', 'bags_racks',        'Tubus',        'Logo Classic',           'Stainless steel rear rack. Rated for 40kg. Bombproof.',                                     'good',  'mounted', '{borrowable}',              NULL, 25,   '1_month',      NULL,           '3_to_5_years', 15000, (now() - interval '1200 days')::date, 'b0000001-0001-4000-8000-000000000004', 'all', now() - interval '60 days', now() - interval '20 days'),
  ('d0000001-0002-4000-8000-000000000004', 'a1b2c3d4-0004-4000-8000-000000000004', NULL,                                   'Ortlieb Back-Roller Classic',  'accessory', 'bags_racks',        'Ortlieb',      'Back-Roller Classic',    'Pair of waterproof panniers. 40L total. Some scratches but fully waterproof.',              'worn',  'stored',  '{borrowable,sellable}',     50,   15,   '2_weeks',      'Garage',       '3_to_5_years', NULL, (now() - interval '1000 days')::date, 'b0000001-0001-4000-8000-000000000004', 'all', now() - interval '30 days', now() - interval '5 days'),
  ('d0000001-0003-4000-8000-000000000004', 'a1b2c3d4-0004-4000-8000-000000000004', NULL,                                   'Wahoo ELEMNT Bolt V2',         'accessory', 'computers_gps',     'Wahoo',        'ELEMNT Bolt V2',         'GPS bike computer with color screen. Selling because I upgraded to Roam.',                  'good',  'stored',  '{sellable}',                120,  NULL,  NULL,           'Desk',         '1_to_2_years', NULL, (now() - interval '400 days')::date, 'b0000001-0001-4000-8000-000000000004', 'all', now() - interval '3 days',  now() - interval '3 days'),
  ('d0000001-0004-4000-8000-000000000004', 'a1b2c3d4-0004-4000-8000-000000000004', 'c0000001-0001-4000-8000-000000000004', 'Brooks B17 Saddle',            'component', 'seatposts_saddles', 'Brooks',       'B17 Standard',           'Broken in perfectly over 10000km. Leather is supple but still supportive.',                 'worn',  'mounted', '{private}',                 NULL, NULL,  NULL,           NULL,           '5_to_10_years', 10000, (now() - interval '1800 days')::date, 'b0000001-0001-4000-8000-000000000004', 'private', now() - interval '90 days', now() - interval '30 days'),
  ('d0000001-0005-4000-8000-000000000004', 'a1b2c3d4-0004-4000-8000-000000000004', NULL,                                   'Topeak Joe Blow Sport III',    'tool',      'pumps',             'Topeak',       'Joe Blow Sport III',     'Floor pump with TwinHead. Up to 160psi. Gauge works perfectly.',                            'good',  'stored',  '{borrowable}',              NULL, 10,   '1_week',       'Garage',       '3_to_5_years', NULL, (now() - interval '900 days')::date, 'b0000001-0001-4000-8000-000000000004', 'all', now() - interval '45 days', now() - interval '15 days');

-- Lisa items (gravel racer)
INSERT INTO items (id, owner_id, bike_id, name, category, subcategory, brand, model, description, condition, status, availability_types, price, deposit, borrow_duration, storage_location, age, usage_km, purchase_date, pickup_location_id, visibility, created_at, updated_at) VALUES
  ('d0000001-0001-4000-8000-000000000005', 'a1b2c3d4-0005-4000-8000-000000000005', 'c0000001-0001-4000-8000-000000000005', 'Shimano GRX RD-RX812',         'component', 'drivetrain',        'Shimano',      'GRX RX812',              'GRX rear derailleur, 1x11 clutch type. Low mileage, upgrading to Di2.',                     'good',  'stored',  '{sellable}',                85,   NULL,  NULL,           'Workbench',    '6_to_12_months', 1200, (now() - interval '250 days')::date, 'b0000001-0001-4000-8000-000000000005', 'all', now() - interval '12 days', now() - interval '2 days'),
  ('d0000001-0002-4000-8000-000000000005', 'a1b2c3d4-0005-4000-8000-000000000005', NULL,                                   'Vittoria Terreno Dry Tires',   'component', 'tires_tubes',       'Vittoria',     'Terreno Dry 700x38',     'Fast-rolling gravel tires. Used for one race season.',                                      'good',  'stored',  '{sellable,borrowable}',     30,   10,   '2_weeks',      'Shelf',        '6_to_12_months', 1500, (now() - interval '200 days')::date, 'b0000001-0001-4000-8000-000000000005', 'all', now() - interval '8 days',  now() - interval '3 days'),
  ('d0000001-0003-4000-8000-000000000005', 'a1b2c3d4-0005-4000-8000-000000000005', NULL,                                   'Silca T-Ratchet Torque Kit',   'tool',      'torque_wrenches',   'Silca',        'T-Ratchet',              'Compact torque wrench with Ti bits. Essential for carbon components.',                      'good',  'stored',  '{borrowable}',              NULL, 20,   '2_3_days',     'Tool case',    '1_to_2_years', NULL, (now() - interval '350 days')::date, 'b0000001-0001-4000-8000-000000000005', 'all', now() - interval '18 days', now() - interval '6 days'),
  ('d0000001-0004-4000-8000-000000000005', 'a1b2c3d4-0005-4000-8000-000000000005', 'c0000001-0002-4000-8000-000000000005', 'Shimano Ultegra RD-R8000',     'component', 'drivetrain',        'Shimano',      'Ultegra R8000 SS',       'Short cage rear derailleur. Works perfectly, upgrading to Di2.',                             'good',  'stored',  '{sellable}',                55,   NULL,  NULL,           'Workbench',    '2_to_3_years', 4000, (now() - interval '600 days')::date, 'b0000001-0001-4000-8000-000000000005', 'all', now() - interval '5 days',  now() - interval '5 days');

-- Kai items (MTB enduro)
INSERT INTO items (id, owner_id, bike_id, name, category, subcategory, brand, model, description, condition, status, availability_types, price, deposit, borrow_duration, storage_location, age, usage_km, purchase_date, pickup_location_id, visibility, created_at, updated_at) VALUES
  ('d0000001-0001-4000-8000-000000000006', 'a1b2c3d4-0006-4000-8000-000000000006', 'c0000001-0001-4000-8000-000000000006', 'Fox DHX2 Rear Shock',          'component', 'suspension',        'Fox',          'DHX2 Factory',           '230x65mm coil shock. Tuned for 75-85kg rider. Selling because switched to air.',            'good',  'stored',  '{sellable}',                200,  NULL,  NULL,           'Garage',       '1_to_2_years', 1500, (now() - interval '300 days')::date, 'b0000001-0001-4000-8000-000000000006', 'all', now() - interval '14 days', now() - interval '2 days'),
  ('d0000001-0002-4000-8000-000000000006', 'a1b2c3d4-0006-4000-8000-000000000006', NULL,                                   'Crankbrothers Stamp 7 Pedals', 'component', 'pedals',            'Crankbrothers','Stamp 7 Large',          'Large platform pedals. Great grip, thin profile. Some scratches from rocks.',                'worn',  'stored',  '{sellable,donatable}',      35,   NULL,  NULL,           'Workbench',    '1_to_2_years', NULL, (now() - interval '350 days')::date, 'b0000001-0001-4000-8000-000000000006', 'all', now() - interval '20 days', now() - interval '7 days'),
  ('d0000001-0003-4000-8000-000000000006', 'a1b2c3d4-0006-4000-8000-000000000006', NULL,                                   'Leatt DBX 4.0 Knee Pads',     'clothing',  'knee_pads',         'Leatt',        'DBX 4.0',                'Slim knee pads with 3DF AirFit impact foam. Size L. Very breathable.',                      'good',  'stored',  '{borrowable}',              NULL, 10,   '1_week',       'Closet',       '1_to_2_years', NULL, (now() - interval '300 days')::date, 'b0000001-0001-4000-8000-000000000006', 'all', now() - interval '12 days', now() - interval '4 days'),
  ('d0000001-0004-4000-8000-000000000006', 'a1b2c3d4-0006-4000-8000-000000000006', 'c0000001-0002-4000-8000-000000000006', 'Maxxis Assegai Tire',          'component', 'tires_tubes',       'Maxxis',       'Assegai 29x2.5 WT',     'DH casing, MaxxGrip compound. Mega grip in wet. Heavy but worth it.',                       'good',  'mounted', '{private}',                 NULL, NULL,  NULL,           NULL,           '6_to_12_months', 800, (now() - interval '180 days')::date, 'b0000001-0001-4000-8000-000000000006', 'groups', now() - interval '8 days', now() - interval '2 days'),
  ('d0000001-0005-4000-8000-000000000006', 'a1b2c3d4-0006-4000-8000-000000000006', NULL,                                   'Stan''s NoTubes Sealant',      'consumable','tubeless_sealant',  'Stan''s',      'NoTubes 32oz',           'About 2/3 bottle remaining. Fresh batch from last month.',                                  'good',  'stored',  '{donatable}',               NULL, NULL,  NULL,           'Shelf',        'less_than_6_months', NULL, (now() - interval '60 days')::date, 'b0000001-0001-4000-8000-000000000006', 'all', now() - interval '5 days', now() - interval '2 days');

-- Nina items (MTB trail/XC)
INSERT INTO items (id, owner_id, bike_id, name, category, subcategory, brand, model, description, condition, status, availability_types, price, deposit, borrow_duration, storage_location, age, usage_km, purchase_date, pickup_location_id, visibility, created_at, updated_at) VALUES
  ('d0000001-0001-4000-8000-000000000007', 'a1b2c3d4-0007-4000-8000-000000000007', 'c0000001-0001-4000-8000-000000000007', 'RockShox SID Ultimate Fork',   'component', 'suspension',        'RockShox',     'SID Ultimate 120mm',     '29er, 120mm travel. Charger Race Day damper. Switching to longer travel.',                   'good',  'stored',  '{sellable}',                350,  NULL,  NULL,           'Garage',       '6_to_12_months', 2000, (now() - interval '200 days')::date, 'b0000001-0001-4000-8000-000000000007', 'all', now() - interval '10 days', now() - interval '2 days'),
  ('d0000001-0002-4000-8000-000000000007', 'a1b2c3d4-0007-4000-8000-000000000007', NULL,                                   'SRAM Eagle XX1 Cassette',      'component', 'drivetrain',        'SRAM',         'XX1 Eagle 10-52T',       '12-speed XD cassette. Some wear on smaller cogs but shifts perfectly.',                      'worn',  'stored',  '{sellable}',                80,   NULL,  NULL,           'Workbench',    '1_to_2_years', 3000, (now() - interval '400 days')::date, 'b0000001-0001-4000-8000-000000000007', 'all', now() - interval '15 days', now() - interval '5 days'),
  ('d0000001-0003-4000-8000-000000000007', 'a1b2c3d4-0007-4000-8000-000000000007', NULL,                                   'Wolf Tooth Pompon',            'tool',      'chain_tools',       'Wolf Tooth',   'Pack Pliers Master Link', 'Master link pliers. Compact, fits in jersey pocket. Essential trail tool.',                 'good',  'stored',  '{borrowable}',              NULL, 3,    '1_week',       'Tool bag',     '2_to_3_years', NULL, (now() - interval '500 days')::date, 'b0000001-0001-4000-8000-000000000007', 'all', now() - interval '22 days', now() - interval '8 days'),
  ('d0000001-0004-4000-8000-000000000007', 'a1b2c3d4-0007-4000-8000-000000000007', 'c0000001-0002-4000-8000-000000000007', 'OneUp Components Dropper Post','component', 'seatposts_saddles', 'OneUp',        'Dropper Post V2 180mm',  'Internal routing, 180mm travel. Smooth action. Selling with bike upgrade.',                 'good',  'stored',  '{sellable,borrowable}',     90,   25,   '2_weeks',      'Garage',       '1_to_2_years', 2500, (now() - interval '350 days')::date, 'b0000001-0001-4000-8000-000000000007', 'all', now() - interval '8 days', now() - interval '3 days');

-- ── Groups ──────────────────────────────────────────────────
-- ON CONFLICT: remote re-seed deletes auth users (profiles cascade) but groups rows persist (no FK from groups to users).
INSERT INTO groups (id, name, description, is_public, created_at) VALUES
  ('e0000001-0001-4000-8000-000000000001', 'Berlin Bike Co-op', 'Community bike parts exchange for Berlin cyclists. Share tools, swap components, help each other out.', true, now() - interval '365 days'),
  ('e0000001-0002-4000-8000-000000000001', 'Berlin MTB Crew',   'Mountain bikers in Berlin. Trail info, group rides, parts sharing.', true, now() - interval '200 days')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public;

INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES
  ('e0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'admin',  now() - interval '365 days'),
  ('e0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'member', now() - interval '300 days'),
  ('e0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0003-4000-8000-000000000003', 'member', now() - interval '250 days'),
  ('e0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0004-4000-8000-000000000004', 'member', now() - interval '200 days'),
  ('e0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0005-4000-8000-000000000005', 'member', now() - interval '150 days'),
  ('e0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'admin',  now() - interval '200 days'),
  ('e0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006', 'member', now() - interval '180 days'),
  ('e0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0007-4000-8000-000000000007', 'member', now() - interval '160 days')
ON CONFLICT (group_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  joined_at = EXCLUDED.joined_at;

INSERT INTO item_groups (item_id, group_id) VALUES
  ('d0000001-0004-4000-8000-000000000006', 'e0000001-0002-4000-8000-000000000001')
ON CONFLICT (item_id, group_id) DO NOTHING;

-- ── Consumable Remaining Fractions ─────────────────────────
UPDATE items SET remaining_fraction = 0.5  WHERE id = 'd0000001-0008-4000-8000-000000000001'; -- Muc-Off Chain Lube: ~half bottle
UPDATE items SET remaining_fraction = 0.67 WHERE id = 'd0000001-0005-4000-8000-000000000006'; -- Stan's Sealant: ~2/3 bottle

-- ── Conversations ───────────────────────────────────────────

-- Conv 1: Kai borrowing Test User's repair stand (MTB crew)
INSERT INTO conversations (id, item_id, created_at) VALUES
  ('f0000001-0001-4000-8000-000000000001', 'd0000001-0006-4000-8000-000000000001', now() - interval '5 days');
INSERT INTO conversation_participants (conversation_id, user_id) VALUES
  ('f0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('f0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006');
INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES
  ('f1000001-0001-4000-8000-000000000001', 'f0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006', 'Hey! Saw the PCS-10 in the MTB crew group. Could I borrow it this weekend for a fork service?', now() - interval '5 days'),
  ('f1000001-0002-4000-8000-000000000001', 'f0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Sure thing! When do you need it?', now() - interval '5 days' + interval '30 minutes'),
  ('f1000001-0003-4000-8000-000000000001', 'f0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006', 'Saturday morning would be great. I can pick it up in Kreuzberg.', now() - interval '4 days'),
  ('f1000001-0004-4000-8000-000000000001', 'f0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Works for me. I will be home after 10am.', now() - interval '4 days' + interval '2 hours'),
  ('f1000001-0005-4000-8000-000000000001', 'f0000001-0001-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006', 'Thanks! I will bring it back Monday.', now() - interval '2 hours');

-- Conv 2: Marcus interested in Test User's Minion tires
INSERT INTO conversations (id, item_id, created_at) VALUES
  ('f0000001-0002-4000-8000-000000000001', 'd0000001-0002-4000-8000-000000000001', now() - interval '2 days');
INSERT INTO conversation_participants (conversation_id, user_id) VALUES
  ('f0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('f0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002');
INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES
  ('f1000001-0001-4000-8000-000000000002', 'f0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'Hi! Are the Minion tires still available? Thinking of trying them on my road bike... just kidding, for a friend with an MTB!', now() - interval '2 days'),
  ('f1000001-0002-4000-8000-000000000002', 'f0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Haha! Yes they are. About 60% tread, should be good for another season.', now() - interval '2 days' + interval '1 hour'),
  ('f1000001-0003-4000-8000-000000000002', 'f0000001-0002-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'Would you take 30 for the pair?', now() - interval '8 hours');

-- Conv 3: Nina interested in Test User's helmet
INSERT INTO conversations (id, item_id, created_at) VALUES
  ('f0000001-0003-4000-8000-000000000001', 'd0000001-0005-4000-8000-000000000001', now() - interval '3 days');
INSERT INTO conversation_participants (conversation_id, user_id) VALUES
  ('f0000001-0003-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001'),
  ('f0000001-0003-4000-8000-000000000001', 'a1b2c3d4-0007-4000-8000-000000000007');
INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES
  ('f1000001-0001-4000-8000-000000000003', 'f0000001-0003-4000-8000-000000000001', 'a1b2c3d4-0007-4000-8000-000000000007', 'Is the Troy Lee A3 still available? I have been looking for one!', now() - interval '1 day'),
  ('f1000001-0002-4000-8000-000000000003', 'f0000001-0003-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Yes! Great helmet, just got a new one so letting this go. Want to come try it on?', now() - interval '1 day' + interval '3 hours'),
  ('f1000001-0003-4000-8000-000000000003', 'f0000001-0003-4000-8000-000000000001', 'a1b2c3d4-0007-4000-8000-000000000007', 'That would be perfect! Can I come by this weekend?', now() - interval '20 hours');

-- Conv 4: Lisa asking Jonas about the Wahoo
INSERT INTO conversations (id, item_id, created_at) VALUES
  ('f0000001-0004-4000-8000-000000000001', 'd0000001-0003-4000-8000-000000000004', now() - interval '10 days');
INSERT INTO conversation_participants (conversation_id, user_id) VALUES
  ('f0000001-0004-4000-8000-000000000001', 'a1b2c3d4-0005-4000-8000-000000000005'),
  ('f0000001-0004-4000-8000-000000000001', 'a1b2c3d4-0004-4000-8000-000000000004');
INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES
  ('f1000001-0001-4000-8000-000000000004', 'f0000001-0004-4000-8000-000000000001', 'a1b2c3d4-0005-4000-8000-000000000005', 'Hey Jonas, is the Wahoo Bolt still available? Does it come with the mount?', now() - interval '10 days'),
  ('f1000001-0002-4000-8000-000000000004', 'f0000001-0004-4000-8000-000000000001', 'a1b2c3d4-0004-4000-8000-000000000004', 'Hi Lisa! Yes it is, and yes it includes the out-front mount. Want to see it?', now() - interval '10 days' + interval '4 hours'),
  ('f1000001-0003-4000-8000-000000000004', 'f0000001-0004-4000-8000-000000000001', 'a1b2c3d4-0005-4000-8000-000000000005', 'Sounds good. Let me check if it works with my Grail mount and I will get back to you.', now() - interval '9 days');

-- Conv 5: Kai and Nina talking about suspension (MTB crew members)
INSERT INTO conversations (id, item_id, created_at) VALUES
  ('f0000001-0005-4000-8000-000000000001', 'd0000001-0001-4000-8000-000000000007', now() - interval '7 days');
INSERT INTO conversation_participants (conversation_id, user_id) VALUES
  ('f0000001-0005-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006'),
  ('f0000001-0005-4000-8000-000000000001', 'a1b2c3d4-0007-4000-8000-000000000007');
INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES
  ('f1000001-0001-4000-8000-000000000005', 'f0000001-0005-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006', 'Nina! The SID Ultimate fork - would it fit my Spectral? I know it is 120mm but tempted for XC days.', now() - interval '7 days'),
  ('f1000001-0002-4000-8000-000000000005', 'f0000001-0005-4000-8000-000000000001', 'a1b2c3d4-0007-4000-8000-000000000007', 'Hmm, the Spectral is designed for 140-160mm so 120mm would change the geo quite a bit. Maybe for the Commencal?', now() - interval '7 days' + interval '2 hours'),
  ('f1000001-0003-4000-8000-000000000005', 'f0000001-0005-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006', 'Good point! Let me think about it. What are you replacing it with?', now() - interval '6 days'),
  ('f1000001-0004-4000-8000-000000000005', 'f0000001-0005-4000-8000-000000000001', 'a1b2c3d4-0007-4000-8000-000000000007', 'Going to a Fox 34 Factory 140mm for the new Epic build. More travel for the Berlin trails.', now() - interval '6 days' + interval '1 hour');

-- ── Borrow Requests ─────────────────────────────────────────

INSERT INTO borrow_requests (id, item_id, requester_id, status, message, created_at, updated_at) VALUES
  ('f2000001-0001-4000-8000-000000000001', 'd0000001-0006-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006', 'accepted', 'Need the stand for a fork service this weekend.', now() - interval '5 days', now() - interval '4 days'),
  ('f2000001-0002-4000-8000-000000000001', 'd0000001-0003-4000-8000-000000000001', 'a1b2c3d4-0007-4000-8000-000000000007', 'pending', 'Hi! I need to check my chain wear before the race this weekend. Can I borrow it for a day?', now() - interval '45 minutes', now() - interval '45 minutes'),
  ('f2000001-0003-4000-8000-000000000001', 'd0000001-0002-4000-8000-000000000003', 'a1b2c3d4-0004-4000-8000-000000000004', 'returned', 'Need to borrow for a week-long trip. Will take good care of it!', now() - interval '14 days', now() - interval '6 days'),
  ('f2000001-0004-4000-8000-000000000001', 'd0000001-0009-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'accepted', 'Need accurate pressure for race wheels.', now() - interval '3 days', now() - interval '2 days');

-- ── Ratings ─────────────────────────────────────────────────

INSERT INTO ratings (id, from_user_id, to_user_id, item_id, transaction_type, score, text, created_at, updated_at) VALUES
  ('f3000001-0001-4000-8000-000000000001', 'a1b2c3d4-0004-4000-8000-000000000004', 'a1b2c3d4-0003-4000-8000-000000000003', 'd0000001-0002-4000-8000-000000000003', 'borrow', 5, 'Sarah was super friendly and flexible with pickup times. Lock was in great condition.', now() - interval '5 days', now() - interval '5 days'),
  ('f3000001-0002-4000-8000-000000000001', 'a1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-0004-4000-8000-000000000004', 'd0000001-0002-4000-8000-000000000003', 'borrow', 5, 'Jonas returned the lock right on time and in perfect condition. Highly recommend!', now() - interval '5 days', now() - interval '5 days'),
  ('f3000001-0003-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006', NULL, 'borrow', 4, 'Kai returned the tools on time. Good communication.', now() - interval '30 days', now() - interval '30 days'),
  ('f3000001-0004-4000-8000-000000000001', 'a1b2c3d4-0006-4000-8000-000000000006', 'a1b2c3d4-0001-4000-8000-000000000001', NULL, 'borrow', 5, 'Test User is a great lender. Bike tools were well-maintained and easy to use.', now() - interval '30 days', now() - interval '30 days');

-- ── Notifications ───────────────────────────────────────────

INSERT INTO notifications (id, user_id, type, title, body, data, is_read, created_at) VALUES
  ('f4000001-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'borrow_request_received', 'New borrow request',        'Nina T. wants to borrow your Park Tool Chain Checker', jsonb_build_object('itemId', 'd0000001-0003-4000-8000-000000000001', 'requestId', 'f2000001-0002-4000-8000-000000000001'), false, now() - interval '45 minutes'),
  ('f4000001-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'new_message',             'New message from Kai R.',   'Thanks! I will bring it back Monday.', jsonb_build_object('conversationId', 'f0000001-0001-4000-8000-000000000001'), false, now() - interval '2 hours'),
  ('f4000001-0003-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'new_message',             'New message from Marcus B.','Would you take 30 for the pair?', jsonb_build_object('conversationId', 'f0000001-0002-4000-8000-000000000001'), true,  now() - interval '8 hours');

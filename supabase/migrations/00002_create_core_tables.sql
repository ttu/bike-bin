-- Enum types
CREATE TYPE item_category AS ENUM ('component', 'tool', 'accessory', 'bike');
CREATE TYPE item_condition AS ENUM ('new', 'good', 'worn', 'broken');
CREATE TYPE item_status AS ENUM ('stored', 'mounted', 'loaned', 'reserved', 'donated', 'sold', 'archived');
CREATE TYPE item_visibility AS ENUM ('private', 'groups', 'all');
CREATE TYPE bike_type AS ENUM ('road', 'gravel', 'mtb', 'city', 'touring', 'other');

-- Profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  rating_avg numeric(3, 2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  notification_preferences jsonb DEFAULT '{}',
  push_token text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
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

-- Items
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category item_category NOT NULL,
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
  usage_km integer,
  purchase_date date,
  pickup_location_id uuid REFERENCES saved_locations(id) ON DELETE SET NULL,
  visibility item_visibility NOT NULL DEFAULT 'all',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_category ON items(category);

-- Item photos
CREATE TABLE item_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_item_photos_item ON item_photos(item_id);

-- Bikes
CREATE TABLE bikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  model text,
  type bike_type NOT NULL DEFAULT 'other',
  year integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_bikes_owner ON bikes(owner_id);

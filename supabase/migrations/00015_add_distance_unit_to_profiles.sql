-- Add distance unit preference to profiles
ALTER TABLE profiles ADD COLUMN distance_unit text DEFAULT 'km' NOT NULL;

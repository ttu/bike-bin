-- Add subcategory column (free text, UI provides suggestions)
ALTER TABLE items ADD COLUMN subcategory text;

-- Add usage_unit column (km or mi, defaults to km)
ALTER TABLE items ADD COLUMN usage_unit text DEFAULT 'km';

-- Change default visibility from 'all' to 'private'
ALTER TABLE items ALTER COLUMN visibility SET DEFAULT 'private';

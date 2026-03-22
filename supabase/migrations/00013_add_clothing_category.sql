-- Add 'clothing' to the item_category enum
ALTER TYPE item_category ADD VALUE IF NOT EXISTS 'clothing' BEFORE 'bike';

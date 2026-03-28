-- Usage distance is optional; avoid defaulting usage_unit when usage_km is unset.
ALTER TABLE items ALTER COLUMN usage_unit DROP DEFAULT;

UPDATE items SET usage_unit = NULL WHERE usage_km IS NULL;

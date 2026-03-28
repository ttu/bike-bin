-- Approximate fraction of product remaining for consumables (0 = empty, 1 = full). NULL when not applicable.
ALTER TABLE items
  ADD COLUMN remaining_fraction numeric(5, 4)
  CHECK (
    remaining_fraction IS NULL
    OR (remaining_fraction >= 0 AND remaining_fraction <= 1)
  );

COMMENT ON COLUMN items.remaining_fraction IS 'For consumables: fraction remaining (0–1). NULL for other categories or unspecified.';

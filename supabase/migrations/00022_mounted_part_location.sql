-- Mounted-part location rule (see docs/datamodel.md):
-- While an item is mounted on a bike, items.storage_location is the bike's name.
-- Set on attach, kept in sync on bike rename, cleared on detach / bike deletion.

-- Invariant: a mounted item must reference a bike. The triggers below never
-- produce a mounted row without a bike, but this enforces it for any direct
-- write path too.
ALTER TABLE public.items
  ADD CONSTRAINT items_mounted_requires_bike_id
  CHECK (status <> 'mounted' OR bike_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.sync_item_storage_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'mounted' AND NEW.bike_id IS NOT NULL THEN
    -- attach, or any write while mounted: lock location to the bike name
    SELECT name INTO NEW.storage_location FROM bikes WHERE id = NEW.bike_id;
  ELSIF TG_OP = 'UPDATE'
        AND OLD.status = 'mounted' AND OLD.bike_id IS NOT NULL THEN
    -- was mounted, now isn't (detached, or bike deleted via ON DELETE SET NULL)
    NEW.storage_location := NULL;
    IF NEW.status = 'mounted' THEN
      NEW.status := 'stored';  -- orphaned mount: bike removed, status stale
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_item_storage_location() IS
  'Keeps items.storage_location equal to the mounted bike name; clears it on detach.';

REVOKE ALL ON FUNCTION public.sync_item_storage_location() FROM PUBLIC;

CREATE TRIGGER trg_items_sync_storage_location
BEFORE INSERT OR UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.sync_item_storage_location();

CREATE OR REPLACE FUNCTION public.sync_mounted_parts_on_bike_rename()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  UPDATE items
  SET storage_location = NEW.name
  WHERE bike_id = NEW.id AND status = 'mounted';
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_mounted_parts_on_bike_rename() IS
  'Re-syncs storage_location of mounted parts when a bike is renamed.';

REVOKE ALL ON FUNCTION public.sync_mounted_parts_on_bike_rename() FROM PUBLIC;

CREATE TRIGGER trg_bikes_sync_mounted_parts
AFTER UPDATE OF name ON public.bikes
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION public.sync_mounted_parts_on_bike_rename();

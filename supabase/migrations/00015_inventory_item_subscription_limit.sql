-- Subscription caps (see docs/datamodel.md). Row counts only; `items.quantity` is ignored.
-- Free tier: 500 item rows, 15 bike rows, 100 photo rows (item_photos + bike_photos) per owner.
-- Paid: entitled plan = paid AND status IN (trialing, active, past_due) → high caps.

CREATE OR REPLACE FUNCTION public.subscription_has_entitled_paid(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.plan = 'paid'
      AND s.status = ANY (
        ARRAY['trialing', 'active', 'past_due']::subscription_status[]
      )
  );
$$;

COMMENT ON FUNCTION public.subscription_has_entitled_paid(uuid) IS
  'True when the user has an entitled paid subscription row.';

REVOKE ALL ON FUNCTION public.subscription_has_entitled_paid(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.inventory_item_limit_for_user(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.subscription_has_entitled_paid(p_user_id) THEN 10000
    ELSE 500
  END;
$$;

COMMENT ON FUNCTION public.inventory_item_limit_for_user(uuid) IS
  'Maximum item rows per owner.';

REVOKE ALL ON FUNCTION public.inventory_item_limit_for_user(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.bike_limit_for_user(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.subscription_has_entitled_paid(p_user_id) THEN 10000
    ELSE 15
  END;
$$;

COMMENT ON FUNCTION public.bike_limit_for_user(uuid) IS
  'Maximum bike rows per owner.';

REVOKE ALL ON FUNCTION public.bike_limit_for_user(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.photo_limit_for_user(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.subscription_has_entitled_paid(p_user_id) THEN 10000
    ELSE 100
  END;
$$;

COMMENT ON FUNCTION public.photo_limit_for_user(uuid) IS
  'Maximum combined item_photos + bike_photos rows for an owner.';

REVOKE ALL ON FUNCTION public.photo_limit_for_user(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.user_photo_count(p_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(
      (
        SELECT COUNT(*)::bigint
        FROM public.item_photos ip
        INNER JOIN public.items i ON i.id = ip.item_id
        WHERE i.owner_id = p_user_id
      ),
      0::bigint
    )
    + COALESCE(
      (
        SELECT COUNT(*)::bigint
        FROM public.bike_photos bp
        INNER JOIN public.bikes b ON b.id = bp.bike_id
        WHERE b.owner_id = p_user_id
      ),
      0::bigint
    );
$$;

REVOKE ALL ON FUNCTION public.user_photo_count(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_my_inventory_item_limit()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.inventory_item_limit_for_user(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_my_inventory_item_limit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_inventory_item_limit() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_bike_limit()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.bike_limit_for_user(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_my_bike_limit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_bike_limit() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_photo_limit()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.photo_limit_for_user(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_my_photo_limit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_photo_limit() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_photo_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_photo_count(auth.uid())::integer;
$$;

COMMENT ON FUNCTION public.get_my_photo_count() IS
  'Current combined item + bike photo rows for the authenticated user.';

REVOKE ALL ON FUNCTION public.get_my_photo_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_photo_count() TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_items_inventory_row_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim integer;
  cnt bigint;
BEGIN
  lim := public.inventory_item_limit_for_user(NEW.owner_id);
  SELECT COUNT(*) INTO cnt FROM public.items WHERE owner_id = NEW.owner_id;
  IF cnt >= lim THEN
    RAISE EXCEPTION 'inventory_limit_exceeded'
      USING ERRCODE = '23514',
      HINT = 'Remove items or upgrade your subscription to add more.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_items_inventory_row_limit() FROM PUBLIC;

CREATE TRIGGER trg_items_enforce_inventory_row_limit
  BEFORE INSERT ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_items_inventory_row_limit();

CREATE OR REPLACE FUNCTION public.enforce_bikes_row_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim integer;
  cnt bigint;
BEGIN
  lim := public.bike_limit_for_user(NEW.owner_id);
  SELECT COUNT(*) INTO cnt FROM public.bikes WHERE owner_id = NEW.owner_id;
  IF cnt >= lim THEN
    RAISE EXCEPTION 'bike_limit_exceeded'
      USING ERRCODE = '23514',
      HINT = 'Remove bikes or upgrade your subscription to add more.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_bikes_row_limit() FROM PUBLIC;

CREATE TRIGGER trg_bikes_enforce_row_limit
  BEFORE INSERT ON public.bikes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_bikes_row_limit();

CREATE OR REPLACE FUNCTION public.enforce_item_photos_account_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner uuid;
  lim integer;
  cnt bigint;
BEGIN
  SELECT i.owner_id INTO owner FROM public.items i WHERE i.id = NEW.item_id;
  IF owner IS NULL THEN
    RETURN NEW;
  END IF;
  lim := public.photo_limit_for_user(owner);
  cnt := public.user_photo_count(owner);
  IF cnt >= lim THEN
    RAISE EXCEPTION 'photo_limit_exceeded'
      USING ERRCODE = '23514',
      HINT = 'Remove photos or upgrade your subscription to add more.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_item_photos_account_limit() FROM PUBLIC;

CREATE TRIGGER trg_item_photos_enforce_account_limit
  BEFORE INSERT ON public.item_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_item_photos_account_limit();

CREATE OR REPLACE FUNCTION public.enforce_bike_photos_account_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner uuid;
  lim integer;
  cnt bigint;
BEGIN
  SELECT b.owner_id INTO owner FROM public.bikes b WHERE b.id = NEW.bike_id;
  IF owner IS NULL THEN
    RETURN NEW;
  END IF;
  lim := public.photo_limit_for_user(owner);
  cnt := public.user_photo_count(owner);
  IF cnt >= lim THEN
    RAISE EXCEPTION 'photo_limit_exceeded'
      USING ERRCODE = '23514',
      HINT = 'Remove photos or upgrade your subscription to add more.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_bike_photos_account_limit() FROM PUBLIC;

CREATE TRIGGER trg_bike_photos_enforce_account_limit
  BEFORE INSERT ON public.bike_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_bike_photos_account_limit();

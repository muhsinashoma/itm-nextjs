BEGIN;

/*
   ITM master-data normalization
   -----------------------------
   Canonical relationship columns are numeric IDs.
   Existing text columns remain as readable/audit snapshots during migration.
*/

ALTER TABLE public.asset_devices
    ADD COLUMN IF NOT EXISTS category_id BIGINT,
    ADD COLUMN IF NOT EXISTS brand_id BIGINT,
    ADD COLUMN IF NOT EXISTS model_id BIGINT;

ALTER TABLE public.stack_inventory
    ADD COLUMN IF NOT EXISTS category_id BIGINT,
    ADD COLUMN IF NOT EXISTS brand_id BIGINT,
    ADD COLUMN IF NOT EXISTS model_id BIGINT,
    ADD COLUMN IF NOT EXISTS vendor_id BIGINT;

ALTER TABLE public.tt_reasons
    ADD COLUMN IF NOT EXISTS category_id BIGINT,
    ADD COLUMN IF NOT EXISTS brand_id BIGINT,
    ADD COLUMN IF NOT EXISTS model_id BIGINT;

ALTER TABLE public.trouble_tickets
    ADD COLUMN IF NOT EXISTS query_type_id BIGINT;

/* ---------- Asset-device backfill: numeric legacy IDs first ---------- */
UPDATE public.asset_devices ad
SET category_id = ic.id
FROM public.inventory_categories ic
WHERE ad.category_id IS NULL
  AND ic.id = CASE WHEN BTRIM(COALESCE(ad.category, '')) ~ '^[0-9]+$' THEN BTRIM(ad.category)::BIGINT END
  AND LOWER(BTRIM(COALESCE(ic.type, ''))) = 'category';

UPDATE public.asset_devices ad
SET brand_id = ic.id
FROM public.inventory_categories ic
WHERE ad.brand_id IS NULL
  AND ic.id = CASE WHEN BTRIM(COALESCE(ad.brand, '')) ~ '^[0-9]+$' THEN BTRIM(ad.brand)::BIGINT END
  AND LOWER(BTRIM(COALESCE(ic.type, ''))) = 'brand';

UPDATE public.asset_devices ad
SET model_id = ic.id
FROM public.inventory_categories ic
WHERE ad.model_id IS NULL
  AND ic.id = CASE WHEN BTRIM(COALESCE(ad.model, '')) ~ '^[0-9]+$' THEN BTRIM(ad.model)::BIGINT END
  AND LOWER(BTRIM(COALESCE(ic.type, ''))) = 'model';

/* ---------- Asset-device backfill: text snapshots ---------- */
UPDATE public.asset_devices ad
SET category_id = ic.id
FROM public.inventory_categories ic
WHERE ad.category_id IS NULL
  AND LOWER(BTRIM(COALESCE(ic.type, ''))) = 'category'
  AND COALESCE(ic.status, 1) = 1
  AND LOWER(BTRIM(ic.inventory_category_list)) = LOWER(BTRIM(COALESCE(ad.category, '')));

UPDATE public.asset_devices ad
SET brand_id = ic.id
FROM public.inventory_categories ic
WHERE ad.brand_id IS NULL
  AND LOWER(BTRIM(COALESCE(ic.type, ''))) = 'brand'
  AND COALESCE(ic.status, 1) = 1
  AND LOWER(BTRIM(ic.inventory_category_list)) = LOWER(BTRIM(COALESCE(ad.brand, '')))
  AND (ad.category_id IS NULL OR COALESCE(ic.parent_id, 0) = ad.category_id);

UPDATE public.asset_devices ad
SET model_id = ic.id
FROM public.inventory_categories ic
WHERE ad.model_id IS NULL
  AND LOWER(BTRIM(COALESCE(ic.type, ''))) = 'model'
  AND COALESCE(ic.status, 1) = 1
  AND LOWER(BTRIM(ic.inventory_category_list)) = LOWER(BTRIM(COALESCE(ad.model, '')))
  AND (ad.brand_id IS NULL OR COALESCE(ic.parent_id, 0) = ad.brand_id);

/* ---------- Stock backfill ---------- */
UPDATE public.stack_inventory s
SET category_id = ic.id
FROM public.inventory_categories ic
WHERE s.category_id IS NULL
  AND (
      ic.id = CASE WHEN BTRIM(COALESCE(s.category, '')) ~ '^[0-9]+$' THEN BTRIM(s.category)::BIGINT END
      OR LOWER(BTRIM(ic.inventory_category_list)) = LOWER(BTRIM(COALESCE(s.category, '')))
  )
  AND LOWER(BTRIM(COALESCE(ic.type, ''))) = 'category';

UPDATE public.stack_inventory s
SET brand_id = ic.id
FROM public.inventory_categories ic
WHERE s.brand_id IS NULL
  AND (
      ic.id = CASE WHEN BTRIM(COALESCE(s.brand, '')) ~ '^[0-9]+$' THEN BTRIM(s.brand)::BIGINT END
      OR LOWER(BTRIM(ic.inventory_category_list)) = LOWER(BTRIM(COALESCE(s.brand, '')))
  )
  AND LOWER(BTRIM(COALESCE(ic.type, ''))) = 'brand'
  AND (s.category_id IS NULL OR COALESCE(ic.parent_id, 0) = s.category_id);

UPDATE public.stack_inventory s
SET model_id = ic.id
FROM public.inventory_categories ic
WHERE s.model_id IS NULL
  AND (
      ic.id = CASE WHEN BTRIM(COALESCE(s.model, '')) ~ '^[0-9]+$' THEN BTRIM(s.model)::BIGINT END
      OR LOWER(BTRIM(ic.inventory_category_list)) = LOWER(BTRIM(COALESCE(s.model, '')))
  )
  AND LOWER(BTRIM(COALESCE(ic.type, ''))) = 'model'
  AND (s.brand_id IS NULL OR COALESCE(ic.parent_id, 0) = s.brand_id);

UPDATE public.stack_inventory s
SET vendor_id = v.id
FROM public.vendors v
WHERE s.vendor_id IS NULL
  AND COALESCE(v.status, 1) = 1
  AND (
      v.id = CASE WHEN BTRIM(COALESCE(s.vendor_name, '')) ~ '^[0-9]+$' THEN BTRIM(s.vendor_name)::BIGINT END
      OR LOWER(BTRIM(v.vendor_name)) = LOWER(BTRIM(COALESCE(s.vendor_name, '')))
      OR LOWER(BTRIM(COALESCE(v.vendor_key, ''))) = LOWER(BTRIM(COALESCE(s.vendor_name, '')))
  );

/* ---------- Asset vendor backfill ---------- */
UPDATE public.asset_devices ad
SET vendor_id = v.id
FROM public.vendors v
WHERE ad.vendor_id IS NULL
  AND COALESCE(v.status, 1) = 1
  AND (
      v.id = CASE WHEN BTRIM(COALESCE(ad.vendor_name, '')) ~ '^[0-9]+$' THEN BTRIM(ad.vendor_name)::BIGINT END
      OR LOWER(BTRIM(v.vendor_name)) = LOWER(BTRIM(COALESCE(ad.vendor_name, '')))
      OR LOWER(BTRIM(COALESCE(v.vendor_key, ''))) = LOWER(BTRIM(COALESCE(ad.vendor_name, '')))
  );

/* ---------- Approved TT requisition category normalization ---------- */
UPDATE public.tt_reasons r
SET category_id = ic.id
FROM public.inventory_categories ic
WHERE r.category_id IS NULL
  AND LOWER(BTRIM(COALESCE(ic.type, ''))) = 'category'
  AND COALESCE(ic.status, 1) = 1
  AND (
      ic.id = CASE WHEN BTRIM(COALESCE(r.category, '')) ~ '^[0-9]+$' THEN BTRIM(r.category)::BIGINT END
      OR LOWER(BTRIM(ic.inventory_category_list)) = LOWER(BTRIM(COALESCE(r.category, '')))
  );

/* ---------- Trouble-ticket query/fault type normalization ---------- */
UPDATE public.trouble_tickets t
SET query_type_id = f.id
FROM public.tt_faults f
WHERE t.query_type_id IS NULL
  AND COALESCE(f.status, 1) = 1
  AND (
      f.id = CASE WHEN BTRIM(COALESCE(t.query_type, '')) ~ '^[0-9]+$' THEN BTRIM(t.query_type)::BIGINT END
      OR LOWER(BTRIM(f.fault_name)) = LOWER(BTRIM(COALESCE(t.query_type, '')))
  );

/*
   Compatibility triggers let remaining legacy code submit labels while the
   database stores/maintains canonical IDs. New code should send IDs directly.
*/
CREATE OR REPLACE FUNCTION public.itm_sync_asset_master_ids()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_id BIGINT;
    v_name TEXT;
    v_parent BIGINT;
BEGIN
    IF NEW.category_id IS NOT NULL THEN
        SELECT id, inventory_category_list INTO v_id, v_name
        FROM public.inventory_categories
        WHERE id = NEW.category_id
          AND LOWER(BTRIM(COALESCE(type, ''))) = 'category'
          AND COALESCE(status, 1) = 1;
        IF NOT FOUND THEN RAISE EXCEPTION 'invalid category_id %', NEW.category_id; END IF;
        NEW.category := v_name;
    ELSIF NULLIF(BTRIM(COALESCE(NEW.category, '')), '') IS NOT NULL THEN
        SELECT id, inventory_category_list INTO v_id, v_name
        FROM public.inventory_categories
        WHERE LOWER(BTRIM(COALESCE(type, ''))) = 'category'
          AND COALESCE(status, 1) = 1
          AND (
              id = CASE WHEN BTRIM(NEW.category) ~ '^[0-9]+$' THEN BTRIM(NEW.category)::BIGINT END
              OR LOWER(BTRIM(inventory_category_list)) = LOWER(BTRIM(NEW.category))
          )
        ORDER BY id LIMIT 1;
        IF FOUND THEN NEW.category_id := v_id; NEW.category := v_name; END IF;
    END IF;

    IF NEW.brand_id IS NOT NULL THEN
        SELECT id, inventory_category_list, COALESCE(parent_id, 0) INTO v_id, v_name, v_parent
        FROM public.inventory_categories
        WHERE id = NEW.brand_id
          AND LOWER(BTRIM(COALESCE(type, ''))) = 'brand'
          AND COALESCE(status, 1) = 1;
        IF NOT FOUND THEN RAISE EXCEPTION 'invalid brand_id %', NEW.brand_id; END IF;
        IF NEW.category_id IS NOT NULL AND v_parent <> NEW.category_id THEN
            RAISE EXCEPTION 'brand_id % does not belong to category_id %', NEW.brand_id, NEW.category_id;
        END IF;
        NEW.brand := v_name;
    ELSIF NULLIF(BTRIM(COALESCE(NEW.brand, '')), '') IS NOT NULL THEN
        SELECT id, inventory_category_list, COALESCE(parent_id, 0) INTO v_id, v_name, v_parent
        FROM public.inventory_categories
        WHERE LOWER(BTRIM(COALESCE(type, ''))) = 'brand'
          AND COALESCE(status, 1) = 1
          AND LOWER(BTRIM(inventory_category_list)) = LOWER(BTRIM(NEW.brand))
          AND (NEW.category_id IS NULL OR COALESCE(parent_id, 0) = NEW.category_id)
        ORDER BY id LIMIT 1;
        IF FOUND THEN NEW.brand_id := v_id; NEW.brand := v_name; END IF;
    END IF;

    IF NEW.model_id IS NOT NULL THEN
        SELECT id, inventory_category_list, COALESCE(parent_id, 0) INTO v_id, v_name, v_parent
        FROM public.inventory_categories
        WHERE id = NEW.model_id
          AND LOWER(BTRIM(COALESCE(type, ''))) = 'model'
          AND COALESCE(status, 1) = 1;
        IF NOT FOUND THEN RAISE EXCEPTION 'invalid model_id %', NEW.model_id; END IF;
        IF NEW.brand_id IS NOT NULL AND v_parent <> NEW.brand_id THEN
            RAISE EXCEPTION 'model_id % does not belong to brand_id %', NEW.model_id, NEW.brand_id;
        END IF;
        NEW.model := v_name;
    ELSIF NULLIF(BTRIM(COALESCE(NEW.model, '')), '') IS NOT NULL THEN
        SELECT id, inventory_category_list, COALESCE(parent_id, 0) INTO v_id, v_name, v_parent
        FROM public.inventory_categories
        WHERE LOWER(BTRIM(COALESCE(type, ''))) = 'model'
          AND COALESCE(status, 1) = 1
          AND LOWER(BTRIM(inventory_category_list)) = LOWER(BTRIM(NEW.model))
          AND (NEW.brand_id IS NULL OR COALESCE(parent_id, 0) = NEW.brand_id)
        ORDER BY id LIMIT 1;
        IF FOUND THEN NEW.model_id := v_id; NEW.model := v_name; END IF;
    END IF;

    IF NEW.vendor_id IS NOT NULL THEN
        SELECT id, vendor_name INTO v_id, v_name
        FROM public.vendors
        WHERE id = NEW.vendor_id AND COALESCE(status, 1) = 1;
        IF NOT FOUND THEN RAISE EXCEPTION 'invalid vendor_id %', NEW.vendor_id; END IF;
        NEW.vendor_name := v_name;
    ELSIF NULLIF(BTRIM(COALESCE(NEW.vendor_name, '')), '') IS NOT NULL THEN
        SELECT id, vendor_name INTO v_id, v_name
        FROM public.vendors
        WHERE COALESCE(status, 1) = 1
          AND (
              LOWER(BTRIM(vendor_name)) = LOWER(BTRIM(NEW.vendor_name))
              OR LOWER(BTRIM(COALESCE(vendor_key, ''))) = LOWER(BTRIM(NEW.vendor_name))
          )
        ORDER BY id LIMIT 1;
        IF FOUND THEN NEW.vendor_id := v_id; NEW.vendor_name := v_name; END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_asset_devices_master_ids ON public.asset_devices;
CREATE TRIGGER trg_asset_devices_master_ids
BEFORE INSERT OR UPDATE OF category, brand, model, vendor_name, category_id, brand_id, model_id, vendor_id
ON public.asset_devices
FOR EACH ROW EXECUTE FUNCTION public.itm_sync_asset_master_ids();

DROP TRIGGER IF EXISTS trg_stack_inventory_master_ids ON public.stack_inventory;
CREATE TRIGGER trg_stack_inventory_master_ids
BEFORE INSERT OR UPDATE OF category, brand, model, vendor_name, category_id, brand_id, model_id, vendor_id
ON public.stack_inventory
FOR EACH ROW EXECUTE FUNCTION public.itm_sync_asset_master_ids();

CREATE OR REPLACE FUNCTION public.itm_sync_tt_reason_category_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_id BIGINT;
    v_name TEXT;
BEGIN
    IF NEW.category_id IS NOT NULL THEN
        SELECT id, inventory_category_list INTO v_id, v_name
        FROM public.inventory_categories
        WHERE id = NEW.category_id
          AND LOWER(BTRIM(COALESCE(type, ''))) = 'category'
          AND COALESCE(status, 1) = 1;
        IF NOT FOUND THEN RAISE EXCEPTION 'invalid requisition category_id %', NEW.category_id; END IF;
        NEW.category := v_name;
    ELSIF NULLIF(BTRIM(COALESCE(NEW.category, '')), '') IS NOT NULL THEN
        SELECT id, inventory_category_list INTO v_id, v_name
        FROM public.inventory_categories
        WHERE LOWER(BTRIM(COALESCE(type, ''))) = 'category'
          AND COALESCE(status, 1) = 1
          AND (
              id = CASE WHEN BTRIM(NEW.category) ~ '^[0-9]+$' THEN BTRIM(NEW.category)::BIGINT END
              OR LOWER(BTRIM(inventory_category_list)) = LOWER(BTRIM(NEW.category))
          )
        ORDER BY id LIMIT 1;
        IF FOUND THEN NEW.category_id := v_id; NEW.category := v_name; END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tt_reasons_category_id ON public.tt_reasons;
CREATE TRIGGER trg_tt_reasons_category_id
BEFORE INSERT OR UPDATE OF category, category_id
ON public.tt_reasons
FOR EACH ROW EXECUTE FUNCTION public.itm_sync_tt_reason_category_id();

CREATE OR REPLACE FUNCTION public.itm_sync_query_type_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_id BIGINT;
    v_name TEXT;
BEGIN
    IF NEW.query_type_id IS NOT NULL THEN
        SELECT id, fault_name INTO v_id, v_name
        FROM public.tt_faults
        WHERE id = NEW.query_type_id AND COALESCE(status, 1) = 1;
        IF NOT FOUND THEN RAISE EXCEPTION 'invalid query_type_id %', NEW.query_type_id; END IF;
        NEW.query_type := v_name;
    ELSIF NULLIF(BTRIM(COALESCE(NEW.query_type, '')), '') IS NOT NULL THEN
        SELECT id, fault_name INTO v_id, v_name
        FROM public.tt_faults
        WHERE COALESCE(status, 1) = 1
          AND (
              id = CASE WHEN BTRIM(NEW.query_type) ~ '^[0-9]+$' THEN BTRIM(NEW.query_type)::BIGINT END
              OR LOWER(BTRIM(fault_name)) = LOWER(BTRIM(NEW.query_type))
          )
        ORDER BY id LIMIT 1;
        IF FOUND THEN NEW.query_type_id := v_id; NEW.query_type := v_name; END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trouble_tickets_query_type_id ON public.trouble_tickets;
CREATE TRIGGER trg_trouble_tickets_query_type_id
BEFORE INSERT OR UPDATE OF query_type, query_type_id
ON public.trouble_tickets
FOR EACH ROW EXECUTE FUNCTION public.itm_sync_query_type_id();

/* ---------- Foreign keys; nullable unresolved legacy rows stay valid ---------- */
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_devices_category_id') THEN
        ALTER TABLE public.asset_devices ADD CONSTRAINT fk_asset_devices_category_id FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_devices_brand_id') THEN
        ALTER TABLE public.asset_devices ADD CONSTRAINT fk_asset_devices_brand_id FOREIGN KEY (brand_id) REFERENCES public.inventory_categories(id) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_devices_model_id') THEN
        ALTER TABLE public.asset_devices ADD CONSTRAINT fk_asset_devices_model_id FOREIGN KEY (model_id) REFERENCES public.inventory_categories(id) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_devices_vendor_id') THEN
        ALTER TABLE public.asset_devices ADD CONSTRAINT fk_asset_devices_vendor_id FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) NOT VALID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stack_inventory_category_id') THEN
        ALTER TABLE public.stack_inventory ADD CONSTRAINT fk_stack_inventory_category_id FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stack_inventory_brand_id') THEN
        ALTER TABLE public.stack_inventory ADD CONSTRAINT fk_stack_inventory_brand_id FOREIGN KEY (brand_id) REFERENCES public.inventory_categories(id) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stack_inventory_model_id') THEN
        ALTER TABLE public.stack_inventory ADD CONSTRAINT fk_stack_inventory_model_id FOREIGN KEY (model_id) REFERENCES public.inventory_categories(id) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_stack_inventory_vendor_id') THEN
        ALTER TABLE public.stack_inventory ADD CONSTRAINT fk_stack_inventory_vendor_id FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) NOT VALID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tt_reasons_category_id') THEN
        ALTER TABLE public.tt_reasons ADD CONSTRAINT fk_tt_reasons_category_id FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tt_reasons_brand_id') THEN
        ALTER TABLE public.tt_reasons ADD CONSTRAINT fk_tt_reasons_brand_id FOREIGN KEY (brand_id) REFERENCES public.inventory_categories(id) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tt_reasons_model_id') THEN
        ALTER TABLE public.tt_reasons ADD CONSTRAINT fk_tt_reasons_model_id FOREIGN KEY (model_id) REFERENCES public.inventory_categories(id) NOT VALID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trouble_tickets_query_type_id') THEN
        ALTER TABLE public.trouble_tickets ADD CONSTRAINT fk_trouble_tickets_query_type_id FOREIGN KEY (query_type_id) REFERENCES public.tt_faults(id) NOT VALID;
    END IF;
END;
$$;

/*
   FKs are added NOT VALID so unresolved historical rows do not block rollout.
   PostgreSQL still enforces them for new/changed rows. After legacy cleanup,
   validate each constraint explicitly with ALTER TABLE ... VALIDATE CONSTRAINT.
*/

CREATE INDEX IF NOT EXISTS idx_asset_devices_category_id ON public.asset_devices(category_id);
CREATE INDEX IF NOT EXISTS idx_asset_devices_brand_id ON public.asset_devices(brand_id);
CREATE INDEX IF NOT EXISTS idx_asset_devices_model_id ON public.asset_devices(model_id);
CREATE INDEX IF NOT EXISTS idx_stack_inventory_category_id ON public.stack_inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_tt_reasons_allocatable_ids ON public.tt_reasons(category_id, approved_val, delivered_val, dev_assigned_val) WHERE COALESCE(status, 1) = 1;
CREATE INDEX IF NOT EXISTS idx_trouble_tickets_query_type_id ON public.trouble_tickets(query_type_id);

COMMIT;

/*
   Review unresolved legacy rows after migration:

   SELECT id, device_serial, category, brand, model
   FROM public.asset_devices
   WHERE row_status = 1
     AND (category_id IS NULL OR (NULLIF(BTRIM(COALESCE(brand,'')),'') IS NOT NULL AND brand_id IS NULL));

   SELECT id, tt_no, category
   FROM public.tt_reasons
   WHERE COALESCE(status,1)=1 AND category_id IS NULL;
*/

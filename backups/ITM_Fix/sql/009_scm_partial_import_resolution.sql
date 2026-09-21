BEGIN;

/*
  SCM partial-import / serial-conflict resolution support.

  Goal:
  - every SCM row can be committed to stack_inventory;
  - asset_devices still keeps one physical row per normalized serial;
  - a conflicting serial is recorded as a stock-level conflict, not duplicated;
  - retry after SCM serial correction updates the SAME stock row by MR + source index.
*/

ALTER TABLE public.stack_inventory
    ADD COLUMN IF NOT EXISTS scm_source_index INTEGER,
    ADD COLUMN IF NOT EXISTS asset_device_id BIGINT,
    ADD COLUMN IF NOT EXISTS asset_resolution VARCHAR(32),
    ADD COLUMN IF NOT EXISTS asset_conflict_asset_id BIGINT,
    ADD COLUMN IF NOT EXISTS asset_resolution_note TEXT;

/* Existing linked stock rows can be backfilled safely from legacy_stack_id. */
WITH linked AS (
    SELECT DISTINCT ON (ad.legacy_stack_id)
        ad.legacy_stack_id AS stock_id,
        ad.id AS asset_id
    FROM public.asset_devices ad
    WHERE ad.legacy_stack_id IS NOT NULL
      AND COALESCE(ad.row_status, 1) = 1
    ORDER BY ad.legacy_stack_id, ad.id DESC
)
UPDATE public.stack_inventory s
SET asset_device_id = linked.asset_id,
    asset_resolution = COALESCE(NULLIF(BTRIM(s.asset_resolution), ''), 'linked_legacy')
FROM linked
WHERE linked.stock_id = s.id
  AND s.asset_device_id IS NULL;

/* New SCM imports are idempotent by the stable row index returned by SCM. */
CREATE UNIQUE INDEX IF NOT EXISTS uq_stack_inventory_scm_mr_source
ON public.stack_inventory (mr_id, scm_source_index)
WHERE scm_source_index IS NOT NULL
  AND COALESCE(status, 1) = 1;

CREATE INDEX IF NOT EXISTS idx_stack_inventory_asset_device_id
ON public.stack_inventory(asset_device_id)
WHERE asset_device_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stack_inventory_conflict_asset_id
ON public.stack_inventory(asset_conflict_asset_id)
WHERE asset_conflict_asset_id IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_stack_inventory_asset_device_id'
    ) THEN
        ALTER TABLE public.stack_inventory
        ADD CONSTRAINT fk_stack_inventory_asset_device_id
        FOREIGN KEY (asset_device_id)
        REFERENCES public.asset_devices(id)
        NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_stack_inventory_conflict_asset_id'
    ) THEN
        ALTER TABLE public.stack_inventory
        ADD CONSTRAINT fk_stack_inventory_conflict_asset_id
        FOREIGN KEY (asset_conflict_asset_id)
        REFERENCES public.asset_devices(id)
        NOT VALID;
    END IF;
END $$;

COMMIT;

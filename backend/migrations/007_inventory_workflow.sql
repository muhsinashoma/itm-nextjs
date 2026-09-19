-- Professional SCM stock -> requisition -> asset assignment workflow.
-- Safe to run repeatedly.
BEGIN;

-- Keep the existing stack_inventory table as the stock-receipt ledger.
CREATE INDEX IF NOT EXISTS idx_stack_inventory_available
    ON public.stack_inventory (device_assigned_status, status, id DESC);
CREATE INDEX IF NOT EXISTS idx_stack_inventory_serial
    ON public.stack_inventory (UPPER(BTRIM(serial_no)));
CREATE INDEX IF NOT EXISTS idx_stack_inventory_mr
    ON public.stack_inventory (mr_id);

-- Current asset registry. Existing installations already have this table;
-- CREATE IF NOT EXISTS keeps fresh environments compatible.
CREATE TABLE IF NOT EXISTS public.asset_devices (
    id                  BIGSERIAL PRIMARY KEY,
    legacy_stack_id     BIGINT,
    legacy_equipment_id BIGINT,
    device_serial       VARCHAR(120),
    device_serial_key   VARCHAR(120),
    category            VARCHAR(120),
    brand               VARCHAR(120),
    model               VARCHAR(180),
    device_type         VARCHAR(80),
    mr_number           VARCHAR(120),
    pr_number           VARCHAR(120),
    vendor_name         VARCHAR(200),
    purchase_date       TIMESTAMPTZ,
    warranty_date       TIMESTAMPTZ,
    asset_status        SMALLINT NOT NULL DEFAULT 0,
    row_status          SMALLINT NOT NULL DEFAULT 1,
    emp_id              VARCHAR(24),
    emp_name            VARCHAR(128),
    department          VARCHAR(128),
    designation         VARCHAR(128),
    assigned_date       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    vendor_id           BIGINT,
    damage_inventory_id BIGINT,
    damage_remarks      TEXT,
    damaged_at          TIMESTAMPTZ
);

ALTER TABLE public.asset_devices ADD COLUMN IF NOT EXISTS legacy_stack_id BIGINT;
ALTER TABLE public.asset_devices ADD COLUMN IF NOT EXISTS device_serial_key VARCHAR(120);
ALTER TABLE public.asset_devices ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(200);
CREATE INDEX IF NOT EXISTS idx_asset_devices_stack ON public.asset_devices (legacy_stack_id);
CREATE INDEX IF NOT EXISTS idx_asset_devices_serial_key ON public.asset_devices (device_serial_key);
CREATE INDEX IF NOT EXISTS idx_asset_devices_status ON public.asset_devices (row_status, asset_status);

-- Requisition stores the exact stock row allocated to it.  Existing legacy
-- columns are preserved because other modules already depend on them.
ALTER TABLE public.tt_reasons ADD COLUMN IF NOT EXISTS stock_inventory_id BIGINT;
ALTER TABLE public.tt_reasons ADD COLUMN IF NOT EXISTS assignment_remarks TEXT;
ALTER TABLE public.tt_reasons ADD COLUMN IF NOT EXISTS delivery_remarks TEXT;
CREATE INDEX IF NOT EXISTS idx_tt_reasons_stock_inventory ON public.tt_reasons (stock_inventory_id);
CREATE INDEX IF NOT EXISTS idx_tt_reasons_allocatable
    ON public.tt_reasons (status, approved_val, dev_assigned_val, delivered_val);

-- Asset lifecycle audit. Existing environments may already have this table.
CREATE TABLE IF NOT EXISTS public.asset_device_history (
    id                  BIGSERIAL PRIMARY KEY,
    asset_device_id     BIGINT NOT NULL,
    legacy_equipment_id BIGINT NOT NULL DEFAULT 0,
    device_serial       VARCHAR(120),
    status_code         SMALLINT,
    raw_status          VARCHAR(80),
    previous_status     INT,
    return_status       SMALLINT,
    transfer_status     SMALLINT,
    emp_id              VARCHAR(24),
    emp_name            VARCHAR(128),
    department          VARCHAR(128),
    designation         VARCHAR(128),
    mr_number           VARCHAR(120),
    pr_number           VARCHAR(120),
    vendor              VARCHAR(200),
    assigned_date       TIMESTAMPTZ,
    transferred_at      TIMESTAMPTZ,
    returned_at         TIMESTAMPTZ,
    history_reason      TEXT NOT NULL DEFAULT '',
    created_at_source   TIMESTAMPTZ,
    updated_at_source   TIMESTAMPTZ,
    migrated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_asset_device_history_asset
    ON public.asset_device_history (asset_device_id, id DESC);

-- Least-privilege permissions for the new workflow.
INSERT INTO public.auth_permissions (code, name, active)
VALUES
    ('inventory.stock.view', 'View IT Stock', TRUE),
    ('inventory.stock.import', 'Import IT Stock from SCM', TRUE),
    ('inventory.asset.assign', 'Assign Stock to Approved Requisition', TRUE),
    ('inventory.asset.deliver', 'Confirm Asset Handover', TRUE)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, active = TRUE;

INSERT INTO public.auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.auth_roles r
CROSS JOIN public.auth_permissions p
WHERE r.code IN ('ROOT', 'IT_ADMIN', 'IT_PERSONNEL')
  AND r.active = TRUE
  AND p.active = TRUE
  AND p.code IN (
      'inventory.stock.view',
      'inventory.stock.import',
      'inventory.asset.assign',
      'inventory.asset.deliver'
  )
ON CONFLICT DO NOTHING;

COMMIT;

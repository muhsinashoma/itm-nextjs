-- Read-only diagnostics for SCM / asset serial conflicts.
-- IMPORTANT: do NOT drop uq_asset_devices_serial_key.

-- 1) Confirm the unique physical-device identity constraint.
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'uq_asset_devices_serial_key';

-- 2) Existing table should not contain duplicate normalized serial keys.
SELECT device_serial_key, COUNT(*) AS rows_with_key
FROM public.asset_devices
WHERE NULLIF(BTRIM(device_serial_key), '') IS NOT NULL
GROUP BY device_serial_key
HAVING COUNT(*) > 1
ORDER BY rows_with_key DESC, device_serial_key;

-- 3) Current reported conflict. Replace the literal for another serial.
WITH incoming AS (
    SELECT UPPER(
        REGEXP_REPLACE(
            BTRIM('2521APR2B2M9'),
            '[^A-Za-z0-9]+',
            '',
            'g'
        )
    ) AS serial_key
)
SELECT
    a.id,
    a.legacy_stack_id,
    a.device_serial,
    a.device_serial_key,
    a.mr_number,
    a.pr_number,
    a.category,
    a.brand,
    a.model,
    a.asset_status,
    a.row_status,
    a.emp_id,
    a.emp_name,
    a.assigned_date,
    a.created_at
FROM public.asset_devices a
JOIN incoming i ON i.serial_key = a.device_serial_key;

-- 4) Show every stock receipt carrying the same normalized serial.
SELECT
    s.id AS stock_id,
    s.mr_id,
    s.pr_id,
    s.serial_no,
    s.category,
    s.brand,
    s.model,
    s.item_group,
    s.item_name,
    s.status,
    s.device_assigned_status,
    s.created_at
FROM public.stack_inventory s
WHERE UPPER(
    REGEXP_REPLACE(
        BTRIM(COALESCE(s.serial_no, '')),
        '[^A-Za-z0-9]+',
        '',
        'g'
    )
) = UPPER(
    REGEXP_REPLACE(
        BTRIM('2521APR2B2M9'),
        '[^A-Za-z0-9]+',
        '',
        'g'
    )
)
ORDER BY s.id;

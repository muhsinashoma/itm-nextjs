-- Verify the urgent MR after import.
SELECT
    id,
    mr_id,
    scm_source_index,
    serial_no,
    asset_device_id,
    asset_resolution,
    asset_conflict_asset_id,
    asset_resolution_note,
    status,
    device_assigned_status
FROM public.stack_inventory
WHERE BTRIM(COALESCE(mr_id, '')) = BTRIM('FAHSC02-22972026-07-30MR146993')
ORDER BY scm_source_index NULLS LAST, id;

-- Expected after first import when one serial is already assigned elsewhere:
-- 13 stock rows total
-- 12 rows: asset_resolution = created, asset_device_id IS NOT NULL
--  1 row : asset_resolution = serial_conflict, asset_conflict_asset_id = 119

SELECT
    COUNT(*) AS stock_rows,
    COUNT(*) FILTER (WHERE asset_resolution = 'created') AS assets_created,
    COUNT(*) FILTER (WHERE asset_resolution = 'synchronized') AS assets_synchronized,
    COUNT(*) FILTER (WHERE asset_resolution = 'serial_conflict') AS serial_conflicts
FROM public.stack_inventory
WHERE BTRIM(COALESCE(mr_id, '')) = BTRIM('FAHSC02-22972026-07-30MR146993')
  AND COALESCE(status, 1) = 1;

-- Existing Asset #119 must remain unchanged and unique.
SELECT
    id, legacy_stack_id, device_serial, device_serial_key,
    mr_number, pr_number, asset_status, row_status, emp_id, emp_name
FROM public.asset_devices
WHERE id = 119
   OR device_serial_key = '2521APR2B2M9'
ORDER BY id;

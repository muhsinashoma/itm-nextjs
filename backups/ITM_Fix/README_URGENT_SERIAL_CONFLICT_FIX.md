# ITM urgent SCM partial import / duplicate serial fix

## Problem solved
MR `FAHSC02-22972026-07-30MR146993` contains 13 SCM rows, but serial `2521APR2B2M9` already belongs to Asset #119 / stock #288 under MR `FAHSC02-22972026-02-08MR134557`.

The unique physical-device serial constraint remains in place. The patch changes the workflow so one cross-MR serial conflict no longer rolls back the whole MR.

Expected first import result for this case:
- 13 stock rows committed under the new MR
- 12 new `asset_devices` rows created
- 1 stock row marked `serial_conflict`
- no duplicate `asset_devices` row for `2521APR2B2M9`
- existing Asset #119 is not overwritten

## IMPORTANT install order
1. Back up the database.
2. Run `sql/009_scm_partial_import_resolution.sql` in pgAdmin **before restarting the patched backend**.
3. Replace the three application files in this ZIP.
4. Run `gofmt -w backend/internal/handler/inventory_workflow.go`.
5. Restart the Go backend.
6. Hard refresh the frontend.
7. Import MR `FAHSC02-22972026-07-30MR146993` again.
8. Run `sql/verify_mr_146993.sql` to verify the result.

## Why the migration is required
It adds SCM row identity and resolution metadata to `stack_inventory`:
- `scm_source_index`
- `asset_device_id`
- `asset_resolution`
- `asset_conflict_asset_id`
- `asset_resolution_note`

`MR + scm_source_index` makes retries safe. If SCM later corrects the duplicate serial, the same stock row is updated instead of creating a 14th row.

## Resolution states
- `created`: stock row created a new physical asset
- `synchronized`: stock row synchronized an existing same-MR asset
- `serial_conflict`: stock row is committed, but asset creation is intentionally blocked because that serial already belongs to another physical asset
- `linked_legacy`: migration backfill for previously linked stock rows

## Do not do this
Do NOT drop `uq_asset_devices_serial_key` and do NOT overwrite Asset #119's MR/employee/status just to make the new MR pass. The unique constraint is preserving physical-device identity.

## Device Operations UX
The included devices page keeps Status and Action permanently visible as sticky right-side columns. After a partial import, the success banner shows stock rows committed, assets created, and serial conflicts separately.

## Validation performed
- backend Go file passed `gofmt` syntax/format parsing
- modified TSX files were parsed by TypeScript; isolated checking reported only expected missing project-module resolution because this ZIP does not contain node_modules/project aliases
- ZIP integrity is tested before delivery

# Dynamic Trouble Ticket implementation

This package updates the user's current Dashboard implementation.

## Files to apply

1. `backend/migrations/0000xx_create_trouble_ticket_reduced.sql`
2. `scripts/validate_tt_csv.py`
3. `scripts/import_tt_reduced.py`
4. `backend/internal/handler/trouble_ticket.go`
5. `frontend/lib/trouble-ticket-api.patch.ts`
6. `frontend/components/overview-chart.tsx`
7. `frontend/components/tt-columns.tsx`
8. `frontend/app/dashboard/page.tsx`

After the API works, delete `frontend/components/tt-data.ts`.

## Current CSV warning

The attached master `tbl_trouble_input.csv` has 7,663 valid rows, 7 malformed rows, and stops at 2020-01-08. Other files contain 2026 records. This means the attached archive is incomplete for a correct 2026 dashboard.

Use `--allow-partial` only to verify the dynamic integration in development. Re-export the master table from MySQL before production.

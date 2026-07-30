# Reduced Trouble Ticket CSV → PostgreSQL Import

This package imports the legacy Trouble Ticket CSV files into only two core
PostgreSQL tables:

- `public.trouble_tickets`
- `public.trouble_ticket_history`

It also creates:

- `public.v_trouble_ticket_dashboard`

## Current attached archive

The supplied archive is not production-complete:

- `tbl_trouble_input.csv`: 7 malformed records; latest valid ticket date is
  2020-01-08.
- `tbl_tt_update.csv`: 189 malformed records.
- `tbl_tt_reason.csv`: 1 malformed record.
- `tbl_track_tt.csv`: valid records extend into 2026.

Re-export `tbl_trouble_input` and `tbl_tt_update` from MySQL with correct CSV
quoting before a production import.

## Commands

```bash
python -m venv .venv
source .venv/bin/activate
pip install "psycopg[binary]"
```

Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install "psycopg[binary]"
```

Validate:

```bash
python scripts/validate_tt_csv.py \
  --dir "/path/to/Trouble Ticket Overview"
```

Create tables:

```bash
psql "$DATABASE_URL" \
  -f backend/migrations/0000xx_create_trouble_ticket_reduced.sql
```

Production import:

```bash
python scripts/import_tt_reduced.py \
  --dir "/path/to/Trouble Ticket Overview"
```

Development-only partial import:

```bash
python scripts/import_tt_reduced.py \
  --dir "/path/to/Trouble Ticket Overview" \
  --allow-partial
```

Do not use `--allow-partial` for production.

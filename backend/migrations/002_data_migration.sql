-- ============================================================
-- MySQL → PostgreSQL Data Migration
-- Run AFTER 001_schema.sql and after pgloader import
-- ============================================================

-- Step 1: pgloader command (run from terminal, NOT in psql)
-- ============================================================
-- sudo apt install pgloader   (Ubuntu)
-- brew install pgloader       (macOS)
--
-- pgloader \
--   mysql://root:PASSWORD@localhost/itm \
--   postgresql://itm_user:PASSWORD@localhost/itm_prod \
--   --with "batch rows = 5000" \
--   --with "workers = 4, concurrency = 2" \
--   --cast "type tinytext to text" \
--   --cast "type datetime to timestamptz" \
--   --cast "type date when default is '0000-00-00' to date default null" \
--   --cast "type timestamp when default is '0000-00-00 00:00:00' to timestamptz default null"

-- Step 2: Table name mapping for pgloader (use --include-drop or manual)
-- MySQL table → PostgreSQL table
-- admin_user_info                         → (skip, use users table)
-- tbl_personal_info                       → employee_personal_info
-- tbl_office_info                         → employee_office_info
-- tbl_inventory_category                  → inventory_categories
-- tbl_fault_type1                         → fault_types
-- tbl_trouble_input                       → trouble_tickets
-- tbl_tt_update                           → tbl_tt_update (keep name!)
-- tbl_track_tt                            → tt_track
-- tbl_it_equipment_requisition_form       → it_equipment
-- tbl_it_equipment_status_history         → equipment_status_history (manual map)
-- tbl_it_equipment_requisition_stack_info → stack_inventory
-- tbl_device_claim                        → device_claims
-- tbl_device_clamin_history               → (keep in device_claim_history)
-- tbl_inventory_damage                    → damage_inventory
-- tbl_device_warrenty_vendor_list         → warranty_vendors
-- tbl_device_ownership_transfer_form      → ownership_transfers
-- tbl_tt_reason                           → tt_reasons

-- Step 3: Fix zero-dates after import
UPDATE it_equipment SET assign_date = NULL WHERE assign_date = '1970-01-01';
UPDATE it_equipment SET device_warranty_date = NULL WHERE device_warranty_date = '1970-01-01';
UPDATE it_equipment SET transfer_date_time = NULL WHERE transfer_date_time = '1970-01-01';
UPDATE it_equipment SET delete_date_time = NULL WHERE delete_date_time = '1970-01-01';
UPDATE stack_inventory SET purchase_date = NULL WHERE purchase_date = '1970-01-01';
UPDATE stack_inventory SET warranty_date = NULL WHERE warranty_date = '1970-01-01';
UPDATE device_claims SET received_date = NULL WHERE received_date = '1970-01-01';
UPDATE device_claims SET return_date = NULL WHERE return_date = '1970-01-01';
UPDATE trouble_tickets SET requis_date = NULL WHERE requis_date = '1970-01-01';

-- Step 4: Build users table from admin_user_info
-- The old passwords are SHA256 hex - cannot be reversed
-- Users must reset passwords. Set a temporary bcrypt password for all.
-- Run: go run cmd/migrate_passwords/main.go
-- This sets password to "ChangeMe@123" for all non-bcrypt users

-- Step 5: Verify counts
SELECT 'trouble_tickets' AS tbl, COUNT(*) FROM trouble_tickets
UNION ALL SELECT 'it_equipment', COUNT(*) FROM it_equipment
UNION ALL SELECT 'employee_office_info', COUNT(*) FROM employee_office_info
UNION ALL SELECT 'employee_personal_info', COUNT(*) FROM employee_personal_info
UNION ALL SELECT 'device_claims', COUNT(*) FROM device_claims
UNION ALL SELECT 'tbl_tt_update', COUNT(*) FROM tbl_tt_update
UNION ALL SELECT 'stack_inventory', COUNT(*) FROM stack_inventory
UNION ALL SELECT 'warranty_vendors', COUNT(*) FROM warranty_vendors
UNION ALL SELECT 'inventory_categories', COUNT(*) FROM inventory_categories
UNION ALL SELECT 'fault_types', COUNT(*) FROM fault_types
ORDER BY 1;

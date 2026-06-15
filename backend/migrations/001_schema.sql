--backend/migrations/001_schema.sql
-- ============================================================
-- ITM PostgreSQL Schema
-- Exactly mirrors MySQL dump column names for easy migration
-- Run: psql $DATABASE_URL -f migrations/001_schema.sql
-- ============================================================

SET client_encoding = 'UTF8';
SET timezone = 'Asia/Dhaka';

-- Helper trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ── users (merged admin_user_info + tbl_user_info) ──────────
-- NOTE: We create a NEW users table with bcrypt passwords
-- Original tables are kept as-is after migration for reference
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,          -- bcrypt, NOT original hash
    employee_id   VARCHAR(35),
    full_name     VARCHAR(100),
    email         VARCHAR(100),
    mobile        VARCHAR(20),
    user_type     SMALLINT DEFAULT 0,
    active        BOOLEAN DEFAULT TRUE,
    otp_verify    SMALLINT DEFAULT 0,
    app_token     TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_emp_id ON users(employee_id) WHERE employee_id IS NOT NULL;

-- ── login_logs (was tbl_login_log) ──────────────────────────
CREATE TABLE IF NOT EXISTS login_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(35),
    login_at    TIMESTAMPTZ DEFAULT NOW(),
    logout_at   TIMESTAMPTZ,
    ip_address  INET,
    mac_address VARCHAR(128),
    user_type   SMALLINT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_login_logs_uid ON login_logs(user_id);

-- ── employee_personal_info (= tbl_personal_info) ────────────
-- Keep ALL original column names
CREATE TABLE IF NOT EXISTS employee_personal_info (
    id                   SERIAL PRIMARY KEY,
    employee_id          VARCHAR(50) NOT NULL UNIQUE,
    employee_name        VARCHAR(80) NOT NULL,
    fathers_name         VARCHAR(80),
    mothers_name         VARCHAR(85),
    national_id          VARCHAR(80),
    blood_group          VARCHAR(25),
    religion             VARCHAR(30),
    date_of_birth        VARCHAR(50),
    gender               VARCHAR(50),
    marital_status       VARCHAR(30),
    record_of_police_case VARCHAR(50),
    reason_of_police_case VARCHAR(85),
    employed_through     VARCHAR(85),
    personal_cell_no     VARCHAR(20),
    official_cell_no     VARCHAR(20),
    official_land_phone_no VARCHAR(20),
    email                VARCHAR(50),
    official_email       VARCHAR(50),
    present_address      TEXT,
    postal_code_1        INT,
    police_station_1     VARCHAR(50),
    city_1               VARCHAR(50),
    country_1            VARCHAR(50),
    permanent_address    TEXT,
    postal_code_2        INT,
    police_station_2     VARCHAR(50),
    city_2               VARCHAR(50),
    country_2            VARCHAR(50),
    picture              VARCHAR(50),
    input_by             VARCHAR(25),
    date                 DATE,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ep_emp_id ON employee_personal_info(employee_id);
CREATE INDEX IF NOT EXISTS idx_ep_emp_name ON employee_personal_info(employee_name);

-- ── employee_office_info (= tbl_office_info) ────────────────
CREATE TABLE IF NOT EXISTS employee_office_info (
    id                 SERIAL PRIMARY KEY,
    emp_id             INT UNIQUE,
    employee_id        VARCHAR(24) UNIQUE,
    employee_name      VARCHAR(64),
    designation        VARCHAR(50),
    work_field         VARCHAR(50),
    department_name    VARCHAR(50),
    dept_short_name    VARCHAR(8),
    sub_function       VARCHAR(64),
    active             VARCHAR(25),
    separation_mode    VARCHAR(25),
    separation_date    VARCHAR(50),
    joining_date       VARCHAR(50),
    provision_period   VARCHAR(50),
    confirmation_date  VARCHAR(50),
    posting_district   VARCHAR(50),
    area_of_posting    VARCHAR(85),
    last_posting       VARCHAR(50),
    promotion_status   VARCHAR(25),
    medical_test_status VARCHAR(25),
    performance_rating VARCHAR(50),
    transport_facilities VARCHAR(50),
    increment_status   VARCHAR(35),
    input_by           VARCHAR(25),
    date               DATE,
    change_date        VARCHAR(50),
    emp_status         SMALLINT DEFAULT 1,
    employee_type      VARCHAR(64),
    level              SMALLINT,
    elg_status         SMALLINT,
    elg_status1        SMALLINT,
    job_rule           VARCHAR(32),
    co_name            VARCHAR(128),
    zone_id            INT,
    region_id          INT,
    mbr_level          VARCHAR(150),
    contract_type      SMALLINT DEFAULT 1,
    mbr_level_numeric  INT,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eo_active ON employee_office_info(active);
CREATE INDEX IF NOT EXISTS idx_eo_name ON employee_office_info(employee_name);

-- ── inventory_categories (= tbl_inventory_category) ─────────
CREATE TABLE IF NOT EXISTS inventory_categories (
    id                     SERIAL PRIMARY KEY,
    inventory_category_list VARCHAR(100),
    status                 SMALLINT DEFAULT 1,
    created_by             VARCHAR(20) DEFAULT 'null',
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    edited_by              VARCHAR(12) DEFAULT 'null',
    edited_at              TIMESTAMPTZ,
    parent_id              INT DEFAULT 0,
    sub_parent_id          INT DEFAULT 0,
    type                   VARCHAR(100),
    modified_at            TIMESTAMPTZ
);

-- ── fault_types (= tbl_fault_type1) ─────────────────────────
CREATE TABLE IF NOT EXISTS fault_types (
    id             SERIAL PRIMARY KEY,
    fault_name     VARCHAR(255) NOT NULL,
    fault_register VARCHAR(128),
    fault_desc     TEXT,
    date           DATE,
    status         SMALLINT DEFAULT 1,
    edited_by      VARCHAR(16),
    edited_at      TIMESTAMPTZ
);

-- ── trouble_tickets (= tbl_trouble_input) ───────────────────
-- CRITICAL: Keep original column names, especially status_progess (typo in original!)
CREATE TABLE IF NOT EXISTS trouble_tickets (
    id                     BIGSERIAL PRIMARY KEY,
    tt_no                  DOUBLE PRECISION NOT NULL UNIQUE,
    fault_date_time        TIMESTAMPTZ,
    client_name            VARCHAR(30),
    client_impl_id         INT,
    client_fault_type      INT,
    fault_requested_by     VARCHAR(30),
    fault_registered_at_cc VARCHAR(30),
    fault_forwarded_to     VARCHAR(255),
    dept_person_name       VARCHAR(30),
    reason_of_problem      VARCHAR(1024),
    date                   DATE,
    status                 SMALLINT DEFAULT 1,
    fault_forward_logical  VARCHAR(255),
    forward_logical_person VARCHAR(128),
    from_zone              VARCHAR(128),
    to_zone                VARCHAR(128),
    problem_owner          VARCHAR(255),
    ring_chain             SMALLINT DEFAULT 1,
    down_time              TIMESTAMPTZ,
    restoration_date_time  TIMESTAMPTZ,
    fft_third_party        VARCHAR(256),
    route_cause            VARCHAR(255),
    "user"                 VARCHAR(128),
    close_ticket_by        VARCHAR(128),
    ticket_close_date      TIMESTAMPTZ,
    closing_description    TEXT,
    client_from_address    VARCHAR(512),
    client_to_address      VARCHAR(512),
    link_type              VARCHAR(256),
    from_site_id           VARCHAR(512),
    to_site_id             VARCHAR(512),
    tt_close_time          TIMESTAMPTZ,
    core_capacity          VARCHAR(128),
    employee_id            VARCHAR(32),
    designation            VARCHAR(128),
    depertment             VARCHAR(128),   -- Original typo preserved!
    phone                  VARCHAR(16),
    email                  VARCHAR(32),
    cordination            VARCHAR(64),
    attach_file            VARCHAR(128),
    prev_fault             INT,
    device_requis_val      SMALLINT NOT NULL DEFAULT 0,
    requis_by              VARCHAR(10) NOT NULL DEFAULT '',
    requis_date            TIMESTAMPTZ,
    status_progess         SMALLINT NOT NULL DEFAULT 2,  -- Original typo preserved!
    status_update_by       VARCHAR(10) NOT NULL DEFAULT '',
    status_update_date     TIMESTAMPTZ DEFAULT NOW(),
    active                 BOOLEAN DEFAULT TRUE,
    delete_by              VARCHAR(10),
    delete_at              TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_tt_tt_no ON trouble_tickets(tt_no);
CREATE INDEX IF NOT EXISTS idx_tt_emp_id ON trouble_tickets(employee_id);
CREATE INDEX IF NOT EXISTS idx_tt_status ON trouble_tickets(status_progess, active);
CREATE INDEX IF NOT EXISTS idx_tt_date ON trouble_tickets(status_update_date DESC);

-- ── tbl_tt_update (keep original name for easy migration) ────
CREATE TABLE IF NOT EXISTS tbl_tt_update (
    id                     BIGSERIAL PRIMARY KEY,
    tt_no                  DOUBLE PRECISION NOT NULL,
    client_name            VARCHAR(255),
    client_scr_id          INT,
    fault_start_date_time  TIMESTAMPTZ,
    fault_update_date_time TIMESTAMPTZ,
    fault_registered_at_cc VARCHAR(30),
    fault_update_at_cc     VARCHAR(30),
    client_fault_type      INT,
    tt_note                TEXT,
    date                   DATE,
    cc_id                  INT,
    status                 SMALLINT,
    client_fault_forward_to VARCHAR(128),
    forward_parson         VARCHAR(128),
    fault_requested_by     VARCHAR(128),
    from_zone              VARCHAR(255),
    to_zone                VARCHAR(255),
    "user"                 VARCHAR(255),
    logical_team           VARCHAR(255),
    logical_team_person    VARCHAR(255),
    required_access_time   TIMESTAMPTZ,
    getting_accesstime_time TIMESTAMPTZ,
    department             VARCHAR(128),
    file_link              VARCHAR(256)
);
CREATE INDEX IF NOT EXISTS idx_tt_update_tt_no ON tbl_tt_update(tt_no);

-- ── tt_track (= tbl_track_tt) ────────────────────────────────
CREATE TABLE IF NOT EXISTS tt_track (
    id          BIGSERIAL PRIMARY KEY,
    tt_no       DOUBLE PRECISION NOT NULL UNIQUE,
    create_date DATE,
    date        TIMESTAMPTZ,
    mail_to     VARCHAR(128),
    mail_cc     VARCHAR(512)
);

-- ── it_equipment (= tbl_it_equipment_requisition_form) ───────
-- Keep ALL original column names exactly
CREATE TABLE IF NOT EXISTS it_equipment (
    id                       BIGSERIAL PRIMARY KEY,
    emp_id                   VARCHAR(10),
    emp_name                 VARCHAR(100),
    department               VARCHAR(100),
    designation              VARCHAR(50),
    category                 VARCHAR(50),
    brand                    VARCHAR(50),
    device_s_or_n            VARCHAR(100),  -- serial number column
    model_no                 VARCHAR(50),
    ip_address               VARCHAR(50),
    lan_mac_address          VARCHAR(100),
    wan_mac_address          VARCHAR(100),
    hdd                      VARCHAR(50),
    ram                      VARCHAR(50),
    cpu                      VARCHAR(50),
    removal_drive            VARCHAR(50),
    monitor                  VARCHAR(50),
    agp                      VARCHAR(50),
    lan                      VARCHAR(50),
    wan                      VARCHAR(50),
    ups_or_adapter           VARCHAR(50),
    battary_or_monitor       VARCHAR(50),
    os                       VARCHAR(128),
    remarks                  TEXT,
    status                   VARCHAR(100),
    sl                       VARCHAR(20),
    user_name                VARCHAR(100),
    date                     TIMESTAMPTZ,
    adapter                  VARCHAR(255),
    transfer_by              VARCHAR(32),
    transfer_date_time       TIMESTAMPTZ,
    assign_date              TIMESTAMPTZ,
    pr_number                VARCHAR(32),
    delete_by                VARCHAR(32),
    delete_date_time         TIMESTAMPTZ,
    delete_reason            TEXT,
    update_by                VARCHAR(64),
    update_date              TIMESTAMPTZ,
    vendor                   VARCHAR(150),
    return_due               VARCHAR(200),
    return_by                VARCHAR(20),
    return_date              DATE,
    return_input_date        TIMESTAMPTZ DEFAULT NOW(),
    bag                      VARCHAR(45),
    mouse                    VARCHAR(45),
    active                   SMALLINT NOT NULL DEFAULT 1,
    return_status            SMALLINT NOT NULL DEFAULT 0,
    transfer_status          SMALLINT NOT NULL DEFAULT 0,
    tbl_it_equipment_new_id  VARCHAR(11) NOT NULL DEFAULT '0',
    device_type              INT DEFAULT 0,
    previous_status          INT DEFAULT 0,
    device_warranty_date     TIMESTAMPTZ,
    os_key                   VARCHAR(64),
    tt_reason_id             INT NOT NULL DEFAULT 0,
    tt_no                    VARCHAR(20) NOT NULL DEFAULT '',
    dev_assigned_val         SMALLINT NOT NULL DEFAULT 0,
    mr_number                VARCHAR(100),
    stock_status             INT
);
CREATE INDEX IF NOT EXISTS idx_eq_emp_id ON it_equipment(emp_id);
CREATE INDEX IF NOT EXISTS idx_eq_serial ON it_equipment(device_s_or_n);
CREATE INDEX IF NOT EXISTS idx_eq_active ON it_equipment(active);
CREATE INDEX IF NOT EXISTS idx_eq_category ON it_equipment(category);
CREATE INDEX IF NOT EXISTS idx_eq_status ON it_equipment(status);
CREATE INDEX IF NOT EXISTS idx_eq_warranty ON it_equipment(device_warranty_date);

-- ── equipment_status_history (= tbl_it_equipment_status_history)
CREATE TABLE IF NOT EXISTS equipment_status_history (
    id                      BIGSERIAL PRIMARY KEY,
    equipment_id            BIGINT,
    device_serial           VARCHAR(100),
    prev_status             SMALLINT,
    current_status          SMALLINT,
    user_return_id          VARCHAR(10),
    user_transfer_id        VARCHAR(10),
    return_comment          TEXT,
    transfer_comment        TEXT,
    changed_by              VARCHAR(10),
    changed_at              TIMESTAMPTZ DEFAULT NOW(),
    active                  BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_eqh_equip ON equipment_status_history(equipment_id);

-- ── stack_inventory (= tbl_it_equipment_requisition_stack_info)
CREATE TABLE IF NOT EXISTS stack_inventory (
    id                    BIGSERIAL PRIMARY KEY,
    employee_id           VARCHAR(10),
    mr_id                 VARCHAR(100),
    pr_id                 VARCHAR(100),
    vendor_name           VARCHAR(100),
    serial_no             VARCHAR(70),
    purchase_date         TIMESTAMPTZ,
    category              VARCHAR(50),
    brand                 VARCHAR(50),
    model                 VARCHAR(100),
    cpu                   VARCHAR(100),
    ram                   VARCHAR(100),
    ssd                   VARCHAR(100),
    monitor               VARCHAR(100),
    warranty_date         TIMESTAMPTZ,
    item_group            VARCHAR(100),
    item_name             VARCHAR(100),
    gr_id                 VARCHAR(100),
    total_item            INT DEFAULT 0,
    remarks               TEXT,
    status                INT NOT NULL DEFAULT 1,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_by             VARCHAR(10),
    edited_at             TIMESTAMPTZ,
    device_assigned_status INT DEFAULT 0,
    refno_tbl_it_equipment_requisition VARCHAR(255),
    device_assiged_date   TIMESTAMPTZ,
    device_assiged_by     VARCHAR(10),
    device_type           VARCHAR(45),
    inventory_type        VARCHAR(45)
);
CREATE INDEX IF NOT EXISTS idx_stack_status ON stack_inventory(status);

-- ── device_claims (= tbl_device_claim) ──────────────────────
CREATE TABLE IF NOT EXISTS device_claims (
    id                   SERIAL PRIMARY KEY,
    reference_no_claim   INT NOT NULL,
    category             VARCHAR(60),
    brand                VARCHAR(70),
    model_no             VARCHAR(70),
    attach_file          VARCHAR(128),
    device_sl_no         VARCHAR(100),
    claim_status         INT,
    previous_status      SMALLINT,
    vendor               INT,
    remarks              TEXT,
    problems             TEXT,
    designated_email_to  VARCHAR(150),
    designated_email_cc  VARCHAR(200),
    vendor_receiver      VARCHAR(100),
    vndr_receiver_mobile VARCHAR(16),
    received_date        TIMESTAMPTZ,
    received_by          VARCHAR(10),
    gate_pass_date       TIMESTAMPTZ,
    unit                 INT,
    quantity             INT,
    return_issue         TEXT,
    return_date          TIMESTAMPTZ,
    return_by_it_person  VARCHAR(10),
    gate_pass_remarks    TEXT,
    created_by           VARCHAR(15),
    created_at           TIMESTAMPTZ,
    edited_by            VARCHAR(15),
    edited_at            TIMESTAMPTZ,
    status               INT NOT NULL DEFAULT 1,
    tbl_it_inventory_device_id INT NOT NULL DEFAULT 0,
    service_type         INT NOT NULL DEFAULT 0,
    approved_val         INT NOT NULL DEFAULT 0,
    approved_by          VARCHAR(10),
    approved_date        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_claims_status ON device_claims(status, service_type);
CREATE INDEX IF NOT EXISTS idx_claims_serial ON device_claims(device_sl_no);

-- ── damage_inventory (= tbl_inventory_damage) ────────────────
CREATE TABLE IF NOT EXISTS damage_inventory (
    id              BIGSERIAL PRIMARY KEY,
    department      VARCHAR(20),
    function_name   VARCHAR(20),
    device_category VARCHAR(50),
    device_status   SMALLINT DEFAULT 0,
    device_sl_no    VARCHAR(100),
    model           VARCHAR(50),
    remarks         TEXT,
    created_by      VARCHAR(10),
    created_at      TIMESTAMPTZ,
    updated_by      VARCHAR(10),
    updated_at      TIMESTAMPTZ,
    status          SMALLINT NOT NULL DEFAULT 1,
    previous_status SMALLINT NOT NULL DEFAULT 0
);

-- ── warranty_vendors (= tbl_device_warrenty_vendor_list) ─────
CREATE TABLE IF NOT EXISTS warranty_vendors (
    id              SERIAL PRIMARY KEY,
    vendor_name     VARCHAR(150) NOT NULL UNIQUE,
    vendor_address  VARCHAR(200),
    vendor_mobile   VARCHAR(11),
    vendor_others   VARCHAR(255),
    vendor_email    VARCHAR(200),
    created_by      VARCHAR(15),
    created_at      TIMESTAMPTZ,
    edited_by       VARCHAR(45),
    edited_at       TIMESTAMPTZ,
    status          SMALLINT NOT NULL DEFAULT 1
);

-- ── ownership_transfers (= tbl_device_ownership_transfer_form)
CREATE TABLE IF NOT EXISTS ownership_transfers (
    id                  SERIAL PRIMARY KEY,
    employee_id         VARCHAR(10),
    deducted_amount     BIGINT,
    device_age          TEXT,
    sepecification      TEXT,
    receiver_id         VARCHAR(10),
    gate_pass_date      DATE,
    item_name           VARCHAR(100),
    item_description    TEXT,
    unit                TEXT,
    quantity            INT,
    device_sl_no        VARCHAR(100),
    remarks             TEXT,
    created_by          VARCHAR(10),
    created_at          TIMESTAMPTZ,
    edited_by           VARCHAR(10),
    edited_at           TIMESTAMPTZ,
    status              INT DEFAULT 1,
    company_material    INT,
    non_refundable      INT,
    receiver_address    VARCHAR(100),
    device_assigned_id  INT NOT NULL DEFAULT 0,
    owst_category       SMALLINT,
    vendor_name         VARCHAR(200),
    vendor_address      VARCHAR(200),
    vendor_mobile       VARCHAR(16),
    vendor_deducted_amount INT,
    vendor_others       TEXT,
    attach_file         VARCHAR(128)
);

-- ── tt_reasons (= tbl_tt_reason) ────────────────────────────
CREATE TABLE IF NOT EXISTS tt_reasons (
    id               SERIAL PRIMARY KEY,
    category         VARCHAR(50),
    tt_no            VARCHAR(15),
    employee_id      VARCHAR(10),
    reason_details   TEXT,
    status           INT DEFAULT 1,
    created_by       VARCHAR(10),
    created_at       TIMESTAMPTZ,
    approved_val     INT,
    approved_by      VARCHAR(10),
    approved_date    TIMESTAMPTZ,
    edited_by        VARCHAR(10),
    edited_at        TIMESTAMPTZ,
    device_sl_no     VARCHAR(100),
    delivered_val    SMALLINT,
    delivered_by     VARCHAR(10),
    delivered_date   TIMESTAMPTZ,
    dev_assigned_val SMALLINT,
    dev_assinged_by  VARCHAR(10),   -- original typo
    dev_assigned_date TIMESTAMPTZ
);

-- ── audit_log (new table for tracking changes) ───────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(20) NOT NULL,
    table_name  VARCHAR(100) NOT NULL,
    record_id   BIGINT,
    action      VARCHAR(20) NOT NULL,
    old_data    JSONB,
    new_data    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ── Default admin user (password: Admin@1234 — CHANGE IMMEDIATELY)
INSERT INTO users (username, password_hash, employee_id, full_name, email, user_type, active)
VALUES ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0oHqnFnL4y', 'ADMIN-001', 'System Administrator', 'admin@itm.local', 2, true)
ON CONFLICT (username) DO NOTHING;


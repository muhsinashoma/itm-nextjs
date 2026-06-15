-- ============================================================
-- Create users from admin_user_info after migration
-- Old system had SHA-256 hashed passwords (not reversible)
-- This inserts all admin users with a temporary bcrypt password
-- Users MUST change password on first login
-- Run this after pgloader has imported admin_user_info
-- ============================================================

-- Create a temporary table from admin_user_info if it was imported
-- (pgloader imports it as admin_user_info)
INSERT INTO users (username, password_hash, employee_id, full_name, email, mobile, user_type, active)
SELECT
    user_name,
    -- Temp bcrypt hash for "ChangeMe@123"
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0oHqnFnL4y',
    employee_id,
    full_name,
    email,
    mobile,
    CASE user_type
        WHEN 1 THEN 1
        WHEN 2 THEN 2
        WHEN 3 THEN 3
        WHEN 10 THEN 2
        ELSE 0
    END,
    TRUE
FROM admin_user_info
WHERE user_name IS NOT NULL
ON CONFLICT (username) DO NOTHING;

SELECT 'Created ' || COUNT(*) || ' users from admin_user_info' FROM users;

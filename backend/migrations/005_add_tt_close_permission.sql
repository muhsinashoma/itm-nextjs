-- TT_Close permission for Trouble Ticket closing
-- Allowed roles from auth_roles:
--   1 ROOT
--   2 IT_ADMIN
--   3 IT_PERSONNEL
-- GENERAL_USER (4) intentionally does not receive this permission.

BEGIN;

INSERT INTO public.auth_permissions (
    code,
    name,
    active
)
VALUES (
    'TT_Close',
    'Close Trouble Ticket',
    TRUE
)
ON CONFLICT (code)
DO UPDATE SET
    name = EXCLUDED.name,
    active = TRUE;

INSERT INTO public.auth_role_permissions (
    role_id,
    permission_id
)
SELECT
    r.id,
    p.id
FROM public.auth_roles AS r
CROSS JOIN public.auth_permissions AS p
WHERE r.code IN ('ROOT', 'IT_ADMIN', 'IT_PERSONNEL')
  AND r.active = TRUE
  AND p.code = 'TT_Close'
  AND p.active = TRUE
ON CONFLICT DO NOTHING;

-- Safety: General User must not inherit TT_Close directly.
DELETE FROM public.auth_role_permissions AS rp
USING public.auth_roles AS r,
      public.auth_permissions AS p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.code = 'GENERAL_USER'
  AND p.code = 'TT_Close';

COMMIT;

-- Verification
SELECT
    r.id AS role_id,
    r.code AS role_code,
    r.name AS role_name,
    p.code AS permission_code
FROM public.auth_role_permissions rp
JOIN public.auth_roles r
  ON r.id = rp.role_id
JOIN public.auth_permissions p
  ON p.id = rp.permission_id
WHERE p.code = 'TT_Close'
ORDER BY r.id;

BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.urgent_task_reference_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.urgent_tasks (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(32) NOT NULL UNIQUE DEFAULT (
        'UT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.urgent_task_reference_seq')::text, 6, '0')
    ),
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority VARCHAR(16) NOT NULL DEFAULT 'High',
    status VARCHAR(24) NOT NULL DEFAULT 'Pending',
    due_date DATE NOT NULL,

    assigned_to VARCHAR(64) NOT NULL,
    assigned_to_name VARCHAR(180) NOT NULL,

    generated_by VARCHAR(64) NOT NULL,
    generated_by_name VARCHAR(180) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(64),

    completed_at TIMESTAMPTZ,
    completed_by VARCHAR(64),

    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(64),

    CONSTRAINT urgent_tasks_priority_chk
        CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    CONSTRAINT urgent_tasks_status_chk
        CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    CONSTRAINT urgent_tasks_title_not_blank_chk
        CHECK (length(btrim(title)) >= 3),
    CONSTRAINT urgent_tasks_assigned_to_not_blank_chk
        CHECK (length(btrim(assigned_to)) > 0),
    CONSTRAINT urgent_tasks_generated_by_not_blank_chk
        CHECK (length(btrim(generated_by)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_urgent_tasks_active_due
    ON public.urgent_tasks (status, due_date, priority)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_urgent_tasks_assigned_to
    ON public.urgent_tasks (assigned_to)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_urgent_tasks_generated_by
    ON public.urgent_tasks (generated_by)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_urgent_tasks_created_at
    ON public.urgent_tasks (created_at DESC)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE public.urgent_tasks IS 'Operational urgent-task register. Creator identity is resolved server-side from authenticated user context.';
COMMENT ON COLUMN public.urgent_tasks.generated_by IS 'Authenticated employee_id captured by backend. Never trusted from browser payload.';
COMMENT ON COLUMN public.urgent_tasks.generated_by_name IS 'Employee name snapshot at task creation time.';
COMMENT ON COLUMN public.urgent_tasks.assigned_to_name IS 'Assigned employee name snapshot at task creation/update time.';

COMMIT;

SELECT
    id,
    reference,
    title,
    priority,
    status,
    due_date,
    assigned_to,
    assigned_to_name,
    generated_by,
    generated_by_name,
    created_at
FROM public.urgent_tasks
ORDER BY id DESC
LIMIT 20;

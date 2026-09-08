CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trouble_ticket_events (
    id BIGSERIAL PRIMARY KEY,

    event_uuid UUID NOT NULL DEFAULT gen_random_uuid(),

    trouble_ticket_id BIGINT NOT NULL,

    event_type VARCHAR(50) NOT NULL,

    previous_assigned_id VARCHAR(24),

    new_assigned_id VARCHAR(24),

    note TEXT,

    performed_by VARCHAR(24),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_trouble_ticket_events_event_uuid
        UNIQUE (event_uuid),

    CONSTRAINT fk_trouble_ticket_events_ticket
        FOREIGN KEY (trouble_ticket_id)
        REFERENCES trouble_tickets(id),

    CONSTRAINT chk_trouble_ticket_events_event_type
        CHECK (
            event_type IN (
                'ASSIGNED',
                'REASSIGNED',
                'UNASSIGNED',
                'STATUS_CHANGED',
                'NOTE_ADDED',
                'REQUISITION_CREATED',
                'REQUISITION_APPROVED',
                'REQUISITION_REJECTED',
                'DELIVERED',
                'CLOSED'
            )
        )
    );

CREATE INDEX IF NOT EXISTS idx_tt_events_ticket_created
    ON trouble_ticket_events (
        trouble_ticket_id,
        created_at DESC
    );

CREATE INDEX IF NOT EXISTS idx_tt_events_type
    ON trouble_ticket_events (
        event_type
    );

CREATE INDEX IF NOT EXISTS idx_tt_events_performed_by
    ON trouble_ticket_events (
        performed_by
    );

CREATE INDEX IF NOT EXISTS idx_tt_events_new_assigned
    ON trouble_ticket_events (
        new_assigned_id,
        created_at DESC
    );
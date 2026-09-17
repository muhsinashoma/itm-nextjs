package handler

import (
	"context"
	"fmt"
	"strings"

	"itm-api/internal/mailqueue"

	"github.com/jackc/pgx/v5"
)

type ttCommunicationSnapshot struct {
	ID           int64
	TTNo         string
	EmployeeID   string
	EmployeeName string
	Designation  string
	Department   string
	FunctionName string
	MobileNo     string
	Email        string
	QueryType    string
	Description  string
	Status       string
	AssignedID   string
	AssignedName string
	CreatedAt    string
}

type employeeCommunicationContact struct {
	EmployeeID   string
	EmployeeName string
	Email        string
	Mobile       string
}

// loadTTCommunicationSnapshotForUpdate returns the ticket data used by both the
// business transaction and outbound communication. FOR UPDATE prevents an email
// from being generated from stale assignment/closure state.
func loadTTCommunicationSnapshotForUpdate(
	ctx context.Context,
	tx pgx.Tx,
	ticketID int64,
) (ttCommunicationSnapshot, error) {
	var item ttCommunicationSnapshot

	err := tx.QueryRow(
		ctx,
		`
        SELECT
            id,
            COALESCE(tt_no::text, ''),
            COALESCE(employee_id, ''),
            COALESCE(employee_name, ''),
            COALESCE(designation, ''),
            COALESCE(department, ''),
            COALESCE(function_name, ''),
            COALESCE(mobile_no, ''),
            COALESCE(email, ''),
            COALESCE(query_type, ''),
            COALESCE(description, ''),
            COALESCE(status, ''),
            COALESCE(assigned_id, ''),
            COALESCE(assigned_name, ''),
            COALESCE(created_at::text, '')
        FROM public.trouble_tickets
        WHERE id = $1
        FOR UPDATE
        `,
		ticketID,
	).Scan(
		&item.ID,
		&item.TTNo,
		&item.EmployeeID,
		&item.EmployeeName,
		&item.Designation,
		&item.Department,
		&item.FunctionName,
		&item.MobileNo,
		&item.Email,
		&item.QueryType,
		&item.Description,
		&item.Status,
		&item.AssignedID,
		&item.AssignedName,
		&item.CreatedAt,
	)

	return item, err
}

func loadActiveITCommunicationContact(
	ctx context.Context,
	tx pgx.Tx,
	employeeID string,
) (employeeCommunicationContact, error) {
	employeeID = strings.TrimSpace(employeeID)

	var contact employeeCommunicationContact
	err := tx.QueryRow(
		ctx,
		`
        SELECT
            BTRIM(COALESCE(o.employee_id, '')),
            BTRIM(COALESCE(o.employee_name, '')),
            COALESCE(
                NULLIF(BTRIM(COALESCE(p.official_email, '')), ''),
                NULLIF(BTRIM(COALESCE(p.email, '')), ''),
                ''
            ),
            COALESCE(
                NULLIF(BTRIM(COALESCE(p.official_cell_no, '')), ''),
                NULLIF(BTRIM(COALESCE(p.personal_cell_no, '')), ''),
                ''
            )
        FROM public.employee_office_info AS o
        LEFT JOIN public.employee_personal_info AS p
            ON BTRIM(COALESCE(p.employee_id, '')) = BTRIM(COALESCE(o.employee_id, ''))
        WHERE BTRIM(COALESCE(o.employee_id, '')) = $1
          AND BTRIM(COALESCE(o.work_field, '')) = 'IT'
          AND BTRIM(COALESCE(o.active, '')) = 'Yes'
        LIMIT 1
        `,
		employeeID,
	).Scan(
		&contact.EmployeeID,
		&contact.EmployeeName,
		&contact.Email,
		&contact.Mobile,
	)

	return contact, err
}

func loadEmployeeCommunicationContact(
	ctx context.Context,
	tx pgx.Tx,
	employeeID string,
) (employeeCommunicationContact, error) {
	employeeID = strings.TrimSpace(employeeID)

	var contact employeeCommunicationContact
	err := tx.QueryRow(
		ctx,
		`
        SELECT
            BTRIM(COALESCE(o.employee_id, '')),
            BTRIM(COALESCE(o.employee_name, '')),
            COALESCE(
                NULLIF(BTRIM(COALESCE(p.official_email, '')), ''),
                NULLIF(BTRIM(COALESCE(p.email, '')), ''),
                ''
            ),
            COALESCE(
                NULLIF(BTRIM(COALESCE(p.official_cell_no, '')), ''),
                NULLIF(BTRIM(COALESCE(p.personal_cell_no, '')), ''),
                ''
            )
        FROM public.employee_office_info AS o
        LEFT JOIN public.employee_personal_info AS p
            ON BTRIM(COALESCE(p.employee_id, '')) = BTRIM(COALESCE(o.employee_id, ''))
        WHERE BTRIM(COALESCE(o.employee_id, '')) = $1
        LIMIT 1
        `,
		employeeID,
	).Scan(
		&contact.EmployeeID,
		&contact.EmployeeName,
		&contact.Email,
		&contact.Mobile,
	)

	return contact, err
}

func resolveActorName(
	ctx context.Context,
	tx pgx.Tx,
	actorEmployeeID string,
) string {
	actorEmployeeID = strings.TrimSpace(actorEmployeeID)
	if actorEmployeeID == "" {
		return "ITM User"
	}

	actorName := actorEmployeeID
	_ = tx.QueryRow(
		ctx,
		`
        SELECT COALESCE(NULLIF(BTRIM(employee_name), ''), $1)
        FROM public.employee_office_info
        WHERE BTRIM(COALESCE(employee_id, '')) = $1
        LIMIT 1
        `,
		actorEmployeeID,
	).Scan(&actorName)

	return strings.TrimSpace(actorName)
}

func enqueueTTAppNotification(
	ctx context.Context,
	tx pgx.Tx,
	recipientEmployeeID string,
	actorEmployeeID string,
	notificationType string,
	title string,
	message string,
	ticket ttCommunicationSnapshot,
	actionURL string,
) error {
	recipientEmployeeID = strings.TrimSpace(recipientEmployeeID)
	if recipientEmployeeID == "" {
		return nil
	}

	_, err := tx.Exec(
		ctx,
		`
        INSERT INTO public.app_notifications (
            recipient_employee_id,
            actor_employee_id,
            notification_type,
            title,
            message,
            entity_type,
            entity_id,
            entity_reference,
            action_url
        )
        VALUES (
            $1,
            NULLIF($2, ''),
            $3,
            $4,
            $5,
            'trouble_ticket',
            $6,
            $7,
            $8
        )
        `,
		recipientEmployeeID,
		strings.TrimSpace(actorEmployeeID),
		notificationType,
		title,
		message,
		ticket.ID,
		ticket.TTNo,
		actionURL,
	)

	return err
}

func enqueueTTAssignmentCommunications(
	ctx context.Context,
	tx pgx.Tx,
	ticket ttCommunicationSnapshot,
	assignee employeeCommunicationContact,
	actorEmployeeID string,
	actorName string,
	eventType string,
	eventID int64,
	assignmentNote string,
	sessionIP string,
) (int64, string, error) {
	reassigned := strings.EqualFold(eventType, "REASSIGNED")

	notificationType := "TT_ASSIGNED"
	notificationTitle := fmt.Sprintf("TT %s assigned", ticket.TTNo)
	notificationMessage := fmt.Sprintf(
		"Your Trouble Ticket %s (%s) has been assigned to %s (%s).",
		ticket.TTNo,
		fallbackText(ticket.QueryType, "IT Support"),
		fallbackText(assignee.EmployeeName, "IT Personnel"),
		assignee.EmployeeID,
	)

	if reassigned {
		notificationType = "TT_REASSIGNED"
		notificationTitle = fmt.Sprintf("TT %s reassigned", ticket.TTNo)
		notificationMessage = fmt.Sprintf(
			"Your Trouble Ticket %s (%s) has been reassigned to %s (%s).",
			ticket.TTNo,
			fallbackText(ticket.QueryType, "IT Support"),
			fallbackText(assignee.EmployeeName, "IT Personnel"),
			assignee.EmployeeID,
		)
	}

	if err := enqueueTTAppNotification(
		ctx,
		tx,
		ticket.EmployeeID,
		actorEmployeeID,
		notificationType,
		notificationTitle,
		notificationMessage,
		ticket,
		"/dashboard/user",
	); err != nil {
		return 0, "", err
	}

	label := "Trouble Ticket Assigned"
	if reassigned {
		label = "Trouble Ticket Reassigned"
	}

	body, err := mailqueue.RenderAssignmentEmail(
		mailqueue.AssignmentTemplateData{
			EventLabel:       label,
			TTNo:             ticket.TTNo,
			QueryType:        fallbackText(ticket.QueryType, "IT Support"),
			IssueDescription: fallbackText(ticket.Description, "No issue description was recorded."),
			RequesterName:    fallbackText(ticket.EmployeeName, ticket.EmployeeID),
			RequesterID:      ticket.EmployeeID,
			Department:       fallbackText(ticket.Department, "—"),
			Mobile:           fallbackText(ticket.MobileNo, "—"),
			AssignedName:     fallbackText(assignee.EmployeeName, assignee.EmployeeID),
			AssignedID:       assignee.EmployeeID,
			AssignedByName:   fallbackText(actorName, actorEmployeeID),
			AssignedByID:     actorEmployeeID,
			AssignmentNote:   strings.TrimSpace(assignmentNote),
			ActionURL:        mailqueue.AppURL("/dashboard"),
		},
	)
	if err != nil {
		return 0, "", err
	}

	entityID := ticket.ID
	return mailqueue.EnqueueTx(
		ctx,
		tx,
		mailqueue.Message{
			To:              assignee.Email,
			ToName:          assignee.EmployeeName,
			Subject:         mailqueue.AssignmentSubject(ticket.TTNo, reassigned),
			HTMLBody:        body,
			SessionUser:     actorEmployeeID,
			SessionIP:       strings.TrimSpace(sessionIP),
			EventType:       notificationType,
			EntityType:      "trouble_ticket",
			EntityID:        &entityID,
			EntityReference: ticket.TTNo,
			DedupeKey:       fmt.Sprintf("tt:%d:assignment-event:%d", ticket.ID, eventID),
		},
	)
}

func enqueueTTClosedCommunications(
	ctx context.Context,
	tx pgx.Tx,
	ticket ttCommunicationSnapshot,
	actorEmployeeID string,
	actorName string,
	closingDescription string,
	closedAt string,
	sessionIP string,
) (int64, string, error) {
	if err := enqueueTTAppNotification(
		ctx,
		tx,
		ticket.EmployeeID,
		actorEmployeeID,
		"TT_CLOSED",
		fmt.Sprintf("TT %s closed", ticket.TTNo),
		fmt.Sprintf(
			"Your Trouble Ticket %s (%s) has been closed by %s.",
			ticket.TTNo,
			fallbackText(ticket.QueryType, "IT Support"),
			fallbackText(actorName, actorEmployeeID),
		),
		ticket,
		"/dashboard/user",
	); err != nil {
		return 0, "", err
	}

	// Prefer the requester's current directory email so closure notices follow
	// employee master-data changes. The ticket snapshot remains a safe fallback.
	requesterEmail := strings.TrimSpace(ticket.Email)
	requesterName := strings.TrimSpace(ticket.EmployeeName)

	if ticket.EmployeeID != "" {
		contact, err := loadEmployeeCommunicationContact(ctx, tx, ticket.EmployeeID)
		if err == nil {
			if strings.TrimSpace(contact.Email) != "" {
				requesterEmail = contact.Email
			}
			if strings.TrimSpace(contact.EmployeeName) != "" {
				requesterName = contact.EmployeeName
			}
		} else if err != pgx.ErrNoRows {
			return 0, "", err
		}
	}

	body, err := mailqueue.RenderClosedEmail(
		mailqueue.ClosedTemplateData{
			TTNo:               ticket.TTNo,
			QueryType:          fallbackText(ticket.QueryType, "IT Support"),
			IssueDescription:   fallbackText(ticket.Description, "No issue description was recorded."),
			RequesterName:      fallbackText(requesterName, ticket.EmployeeID),
			RequesterID:        ticket.EmployeeID,
			Department:         fallbackText(ticket.Department, "—"),
			AssignedName:       fallbackText(ticket.AssignedName, "IT Team"),
			AssignedID:         ticket.AssignedID,
			ClosedByName:       fallbackText(actorName, actorEmployeeID),
			ClosedByID:         actorEmployeeID,
			ClosingDescription: strings.TrimSpace(closingDescription),
			ClosedAt:           fallbackText(closedAt, "Current time"),
			ActionURL:          mailqueue.AppURL("/dashboard/user"),
		},
	)
	if err != nil {
		return 0, "", err
	}

	entityID := ticket.ID
	return mailqueue.EnqueueTx(
		ctx,
		tx,
		mailqueue.Message{
			To:              requesterEmail,
			ToName:          requesterName,
			Subject:         mailqueue.ClosedSubject(ticket.TTNo),
			HTMLBody:        body,
			SessionUser:     actorEmployeeID,
			SessionIP:       strings.TrimSpace(sessionIP),
			EventType:       "TT_CLOSED",
			EntityType:      "trouble_ticket",
			EntityID:        &entityID,
			EntityReference: ticket.TTNo,
			DedupeKey:       fmt.Sprintf("tt:%d:closed", ticket.ID),
		},
	)
}

func fallbackText(value string, fallback string) string {
	value = strings.TrimSpace(value)
	if value != "" {
		return value
	}
	return fallback
}

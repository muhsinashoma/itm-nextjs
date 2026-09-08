// itm/backend/internal/handler/trouble_ticket_assignment.go
package handler

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

/*
============================================================
REQUEST / RESPONSE TYPES
============================================================
*/

type AssignTroubleTicketRequest struct {
	AssignedID string `json:"assigned_id" binding:"required"`
	Note       string `json:"note"`
}

type AssignTroubleTicketResponse struct {
	ID           int64  `json:"id"`
	TTNo         string `json:"tt_no"`
	PreviousID   string `json:"previous_assigned_id,omitempty"`
	AssignedID   string `json:"assigned_id"`
	AssignedName string `json:"assigned_name"`
	EventType    string `json:"event_type"`
	Note         string `json:"note,omitempty"`
	PerformedBy  string `json:"performed_by"`
	CreatedAt    string `json:"created_at"`
}

/*
============================================================
ASSIGN / REASSIGN TROUBLE TICKET
============================================================

POST /api/v1/dashboard/trouble-tickets/:id/assignment

Request:

{
    "assigned_id": "02-2181",
    "note": "Assigned to IT Personnel"
}

Behavior:

1. Authenticate current employee.
2. Validate ticket ID.
3. Validate request.
4. Begin transaction.
5. Validate target IT Personnel.
6. Lock ticket row.
7. Determine ASSIGNED / REASSIGNED.
8. Update trouble_tickets.
9. Insert trouble_ticket_events.
10. Commit both operations together.
============================================================
*/

func (h *DashboardHandler) AssignTroubleTicket(c *gin.Context) {

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		20*time.Second,
	)
	defer cancel()

	/*
		========================================================
		AUTHENTICATED USER
		========================================================
	*/

	performedBy := strings.TrimSpace(
		c.GetString("employee_id"),
	)

	if performedBy == "" {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "authenticated employee id not found",
			},
		)
		return
	}

	/*
		========================================================
		TICKET ID
		========================================================
	*/

	ticketID, err := strconv.ParseInt(
		strings.TrimSpace(c.Param("id")),
		10,
		64,
	)

	if err != nil || ticketID <= 0 {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "invalid ticket id",
			},
		)
		return
	}

	/*
		========================================================
		REQUEST BODY
		========================================================
	*/

	var req AssignTroubleTicketRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "invalid request body",
			},
		)
		return
	}

	assignedID := strings.TrimSpace(req.AssignedID)

	if assignedID == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"success": false,
				"error":   "assigned_id is required",
			},
		)
		return
	}

	note := strings.TrimSpace(req.Note)

	/*
		========================================================
		BEGIN TRANSACTION
		========================================================
	*/

	tx, err := h.db.Begin(ctx)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "failed to begin transaction",
			},
		)
		return
	}

	defer tx.Rollback(ctx)

	/*
		========================================================
		VALIDATE TARGET IT PERSONNEL
		========================================================

		The existing IT Personnel endpoint uses:

		work_field = 'IT'
		active = 'Yes'
		========================================================
	*/

	var assignedName string

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			TRIM(employee_id),
			TRIM(employee_name)
		FROM public.employee_office_info
		WHERE TRIM(employee_id) = TRIM($1)
		  AND work_field = 'IT'
		  AND active = 'Yes'
		LIMIT 1
		`,
		assignedID,
	).Scan(
		&assignedID,
		&assignedName,
	)

	if err != nil {

		if err == pgx.ErrNoRows {
			c.JSON(
				http.StatusBadRequest,
				gin.H{
					"success": false,
					"error":   "selected employee is not an active IT Personnel",
				},
			)
			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "failed to validate assigned employee",
			},
		)
		return
	}

	/*
		========================================================
		LOCK TICKET
		========================================================

		FOR UPDATE prevents concurrent assignment changes
		on the same ticket.
		========================================================
	*/

	var (
		ttNo             string
		previousAssigned string
	)

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			tt_no,
			COALESCE(TRIM(assigned_id), '')
		FROM public.trouble_tickets
		WHERE id = $1
		FOR UPDATE
		`,
		ticketID,
	).Scan(
		&ttNo,
		&previousAssigned,
	)

	if err != nil {

		if err == pgx.ErrNoRows {
			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"error":   "ticket not found",
				},
			)
			return
		}

		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "failed to load ticket",
			},
		)
		return
	}

	/*
		========================================================
		NO-OP PROTECTION
		========================================================
	*/

	if previousAssigned == assignedID {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "ticket is already assigned to this employee",
			},
		)
		return
	}

	/*
		========================================================
		DETERMINE EVENT TYPE
		========================================================
	*/

	eventType := "ASSIGNED"

	if previousAssigned != "" {
		eventType = "REASSIGNED"
	}

	/*
		========================================================
		UPDATE TROUBLE TICKET
		========================================================
	*/

	_, err = tx.Exec(
		ctx,
		`
		UPDATE public.trouble_tickets
		SET
			assigned_id = $1,
			assigned_name = $2,
			updated_at = NOW()
		WHERE id = $3
		`,
		assignedID,
		assignedName,
		ticketID,
	)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "failed to assign ticket",
			},
		)
		return
	}

	/*
		========================================================
		INSERT EVENT HISTORY
		========================================================
	*/

	var (
		eventID   int64
		createdAt time.Time
	)

	err = tx.QueryRow(
		ctx,
		`
		INSERT INTO public.trouble_ticket_events (
			trouble_ticket_id,
			event_type,
			previous_assigned_id,
			new_assigned_id,
			note,
			performed_by
		)
		VALUES (
			$1,
			$2,
			NULLIF($3, ''),
			$4,
			NULLIF($5, ''),
			$6
		)
		RETURNING
			id,
			created_at
		`,
		ticketID,
		eventType,
		previousAssigned,
		assignedID,
		note,
		performedBy,
	).Scan(
		&eventID,
		&createdAt,
	)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "failed to create assignment history",
			},
		)
		return
	}

	/*
		========================================================
		COMMIT
		========================================================
	*/

	if err := tx.Commit(ctx); err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "failed to commit assignment",
			},
		)
		return
	}

	/*
		========================================================
		RESPONSE
		========================================================
	*/

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"message": "trouble ticket assigned successfully",
			"data": AssignTroubleTicketResponse{
				ID:           eventID,
				TTNo:         ttNo,
				PreviousID:   previousAssigned,
				AssignedID:   assignedID,
				AssignedName: assignedName,
				EventType:    eventType,
				Note:         note,
				PerformedBy:  performedBy,
				CreatedAt:    createdAt.Format(time.RFC3339),
			},
		},
	)
}

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

type TroubleTicketEventResponse struct {
	ID                   int64  `json:"id"`
	EventUUID            string `json:"event_uuid"`
	TroubleTicketID      int64  `json:"trouble_ticket_id"`
	EventType            string `json:"event_type"`
	PreviousAssignedID   string `json:"previous_assigned_id,omitempty"`
	NewAssignedID        string `json:"new_assigned_id,omitempty"`
	PreviousAssignedName string `json:"previous_assigned_name,omitempty"`
	NewAssignedName      string `json:"new_assigned_name,omitempty"`
	Note                 string `json:"note,omitempty"`
	PerformedBy          string `json:"performed_by"`
	CreatedAt            string `json:"created_at"`
}

func (h *DashboardHandler) TroubleTicketEvents(c *gin.Context) {
	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		20*time.Second,
	)
	defer cancel()

	/*
		============================================================
		VALIDATE TICKET ID
		============================================================
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
		============================================================
		VERIFY TICKET EXISTS
		============================================================
	*/

	var ttNo string

	err = h.db.QueryRow(
		ctx,
		`
		SELECT tt_no
		FROM public.trouble_tickets
		WHERE id = $1
		`,
		ticketID,
	).Scan(&ttNo)

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
		============================================================
		LOAD EVENT HISTORY
		============================================================
	*/

	rows, err := h.db.Query(
		ctx,
		`
		SELECT
			e.id,
			e.event_uuid,
			e.trouble_ticket_id,
			e.event_type,
			COALESCE(e.previous_assigned_id, ''),
			COALESCE(e.new_assigned_id, ''),
			COALESCE(prev_emp.employee_name, ''),
			COALESCE(new_emp.employee_name, ''),
			COALESCE(e.note, ''),
			COALESCE(e.performed_by, ''),
			e.created_at
		FROM public.trouble_ticket_events e

		LEFT JOIN public.employee_office_info prev_emp
			ON TRIM(prev_emp.employee_id)
			 = TRIM(e.previous_assigned_id)

		LEFT JOIN public.employee_office_info new_emp
			ON TRIM(new_emp.employee_id)
			 = TRIM(e.new_assigned_id)

		WHERE e.trouble_ticket_id = $1

		ORDER BY e.created_at DESC, e.id DESC
		`,
		ticketID,
	)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "failed to load ticket history",
			},
		)
		return
	}

	defer rows.Close()

	events := make(
		[]TroubleTicketEventResponse,
		0,
	)

	for rows.Next() {

		var event TroubleTicketEventResponse
		var createdAt time.Time

		err := rows.Scan(
			&event.ID,
			&event.EventUUID,
			&event.TroubleTicketID,
			&event.EventType,
			&event.PreviousAssignedID,
			&event.NewAssignedID,
			&event.PreviousAssignedName,
			&event.NewAssignedName,
			&event.Note,
			&event.PerformedBy,
			&createdAt,
		)

		if err != nil {
			c.JSON(
				http.StatusInternalServerError,
				gin.H{
					"success": false,
					"error":   "failed to read ticket history",
				},
			)
			return
		}

		event.CreatedAt = createdAt.Format(time.RFC3339)

		events = append(events, event)
	}

	if err := rows.Err(); err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"success": false,
				"error":   "failed to read ticket history",
			},
		)
		return
	}

	/*
		============================================================
		RESPONSE
		============================================================
	*/

	c.JSON(
		http.StatusOK,
		gin.H{
			"success": true,
			"data": gin.H{
				"ticket_id": ticketID,
				"tt_no":     ttNo,
				"events":    events,
			},
		},
	)
}

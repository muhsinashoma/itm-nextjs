package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"itm-api/internal/middleware"
	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

// UpdateUrgentTaskAdmin updates editable urgent-task fields.
//
// Industrial workflow rule:
//   - only active IT_ADMIN users may update an urgent task;
//   - Completed is NOT accepted through this endpoint;
//   - completion must use CompleteUrgentTask so completed_by/completed_at
//     are controlled by the dedicated auditable state transition;
//   - completed tasks are immutable through this endpoint.
func (h *DashboardHandler) UpdateUrgentTaskAdmin(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "authentication required",
			},
		)
		return
	}

	employeeID, ok := middleware.GetCurrentEmployeeID(c)
	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "authenticated employee identity is missing",
			},
		)
		return
	}

	var allowed bool

	err := h.db.QueryRow(
		ctx,
		`
		SELECT EXISTS (
			SELECT 1
			FROM public.auth_user_roles AS ur
			JOIN public.auth_roles AS r
				ON r.id = ur.role_id
				AND r.active = TRUE
			WHERE ur.user_id = $1::bigint
			  AND ur.active = TRUE
			  AND (
					ur.expires_at IS NULL
					OR ur.expires_at > CURRENT_TIMESTAMP
			  )
			  AND r.code = 'IT_ADMIN'
		)
		`,
		userID,
	).Scan(&allowed)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if !allowed {
		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"error":   "only an IT Administrator can update an urgent task",
			},
		)
		return
	}

	taskID, err := strconv.ParseInt(
		strings.TrimSpace(c.Param("id")),
		10,
		64,
	)
	if err != nil || taskID <= 0 {
		response.BadRequest(c, "invalid urgent task id")
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Priority    string `json:"priority"`
		Status      string `json:"status"`
		DueDate     string `json:"due_date"`
		AssignedTo  string `json:"assigned_to"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	req.AssignedTo = strings.TrimSpace(req.AssignedTo)

	if len(req.Title) < 3 || len(req.Title) > 180 {
		response.BadRequest(c, "title must be between 3 and 180 characters")
		return
	}

	if len(req.Description) > 5000 {
		response.BadRequest(c, "description cannot exceed 5000 characters")
		return
	}

	if req.AssignedTo == "" {
		response.BadRequest(c, "assigned_to is required")
		return
	}

	priority, ok := normalizeUrgentPriority(req.Priority)
	if !ok {
		response.BadRequest(c, "invalid priority")
		return
	}

	status, ok := normalizeUrgentStatus(req.Status)
	if !ok {
		response.BadRequest(c, "invalid status")
		return
	}

	if status == "Completed" {
		response.BadRequest(
			c,
			"use the dedicated complete action to complete an urgent task",
		)
		return
	}

	dueDate, err := time.Parse(
		"2006-01-02",
		req.DueDate,
	)
	if err != nil {
		response.BadRequest(c, "due_date must use YYYY-MM-DD")
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var currentStatus string

	err = tx.QueryRow(
		ctx,
		`
		SELECT status
		FROM public.urgent_tasks
		WHERE id = $1::bigint
		  AND deleted_at IS NULL
		FOR UPDATE
		`,
		taskID,
	).Scan(&currentStatus)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,
					"error":   "urgent task not found",
				},
			)
			return
		}

		response.ServerError(c, err)
		return
	}

	if strings.EqualFold(
		strings.TrimSpace(currentStatus),
		"Completed",
	) {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "completed urgent tasks cannot be updated",
			},
		)
		return
	}

	var assignedName string

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			BTRIM(
				COALESCE(
					employee_name,
					''
				)
			)
		FROM public.employee_office_info
		WHERE employee_id = $1::text
		  AND LOWER(
				BTRIM(
					COALESCE(
						work_field,
						''
					)
				)
		  ) = 'it'
		  AND LOWER(
				BTRIM(
					COALESCE(
						active,
						''
					)
				)
		  ) IN ('active', 'yes')
		LIMIT 1
		`,
		req.AssignedTo,
	).Scan(&assignedName)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.BadRequest(
				c,
				"selected employee is not an active IT personnel or does not exist",
			)
			return
		}

		response.ServerError(c, err)
		return
	}

	_, err = tx.Exec(
		ctx,
		`
		UPDATE public.urgent_tasks
		SET
			title = $1::text,
			description = NULLIF(
				BTRIM($2::text),
				''
			),
			priority = $3::text,
			status = $4::text,
			due_date = $5::date,
			assigned_to = $6::text,
			assigned_to_name = $7::text,
			updated_by = $8::text,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $9::bigint
		  AND deleted_at IS NULL
		`,
		req.Title,
		req.Description,
		priority,
		status,
		dueDate,
		req.AssignedTo,
		assignedName,
		employeeID,
		taskID,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		gin.H{
			"id":         taskID,
			"updated":    true,
			"updated_by": employeeID,
			"status":     status,
		},
	)
}

package handler

import (
	"net/http"
	"strconv"
	"strings"

	"itm-api/internal/middleware"
	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

// CompleteUrgentTask marks an urgent task as Completed.
//
// Authorization rule:
//   - only the active IT_ADMIN role may complete an urgent task.
//
// The frontend hides the action for other roles, but this handler performs
// the authoritative database-backed role check so a user cannot bypass the
// restriction with DevTools, curl, or Postman.
func (h *DashboardHandler) CompleteUrgentTask(c *gin.Context) {
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

	taskID, err := strconv.ParseInt(
		strings.TrimSpace(c.Param("id")),
		10,
		64,
	)
	if err != nil || taskID <= 0 {
		response.BadRequest(c, "invalid urgent task id")
		return
	}

	// Database-backed role verification.
	// This intentionally permits IT_ADMIN only.
	var allowed bool

	err = h.db.QueryRow(
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
				"error":   "only an IT Administrator can complete an urgent task",
			},
		)
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var (
		reference     string
		currentStatus string
	)

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			reference,
			status
		FROM public.urgent_tasks
		WHERE id = $1::bigint
		  AND deleted_at IS NULL
		FOR UPDATE
		`,
		taskID,
	).Scan(
		&reference,
		&currentStatus,
	)
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
				"error":   "urgent task is already completed",
			},
		)
		return
	}

	var completedAt string

	err = tx.QueryRow(
		ctx,
		`
		UPDATE public.urgent_tasks
		SET
			status = 'Completed',
			completed_at = CURRENT_TIMESTAMP,
			completed_by = $1::text,
			updated_at = CURRENT_TIMESTAMP,
			updated_by = $1::text
		WHERE id = $2::bigint
		  AND deleted_at IS NULL
		RETURNING completed_at::text
		`,
		employeeID,
		taskID,
	).Scan(&completedAt)
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
			"id":           taskID,
			"reference":    reference,
			"status":       "Completed",
			"completed_by": employeeID,
			"completed_at": completedAt,
		},
	)
}

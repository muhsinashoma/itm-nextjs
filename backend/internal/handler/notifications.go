package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
)

type appNotificationRecord struct {
	ID              int64      `json:"id"`
	Type            string     `json:"type"`
	Title           string     `json:"title"`
	Message         string     `json:"message"`
	EntityType      string     `json:"entity_type"`
	EntityID        *int64     `json:"entity_id,omitempty"`
	EntityReference string     `json:"entity_reference"`
	ActionURL       string     `json:"action_url"`
	ReadAt          *time.Time `json:"read_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

func (h *DashboardHandler) NotificationList(c *gin.Context) {
	ctx := c.Request.Context()
	employeeID := strings.TrimSpace(c.GetString("employee_id"))

	if employeeID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "authenticated employee identity is missing",
		})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	rows, err := h.db.Query(
		ctx,
		`
		SELECT
			n.id,
			n.notification_type,
			n.title,
			COALESCE(n.message, ''),
			COALESCE(n.entity_type, ''),
			n.entity_id,
			COALESCE(n.entity_reference, ''),
			COALESCE(n.action_url, ''),
			n.read_at,
			n.created_at
		FROM public.app_notifications n
		WHERE n.recipient_employee_id = $1::text
		ORDER BY n.created_at DESC, n.id DESC
		LIMIT $2::int
		`,
		employeeID,
		limit,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]appNotificationRecord, 0, limit)

	for rows.Next() {
		var item appNotificationRecord

		if err := rows.Scan(
			&item.ID,
			&item.Type,
			&item.Title,
			&item.Message,
			&item.EntityType,
			&item.EntityID,
			&item.EntityReference,
			&item.ActionURL,
			&item.ReadAt,
			&item.CreatedAt,
		); err != nil {
			response.ServerError(c, err)
			return
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	var unreadCount int
	if err := h.db.QueryRow(
		ctx,
		`
		SELECT COUNT(*)
		FROM public.app_notifications
		WHERE recipient_employee_id = $1::text
		  AND read_at IS NULL
		`,
		employeeID,
	).Scan(&unreadCount); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, gin.H{
		"items":        items,
		"unread_count": unreadCount,
	})
}

func (h *DashboardHandler) MarkNotificationRead(c *gin.Context) {
	ctx := c.Request.Context()
	employeeID := strings.TrimSpace(c.GetString("employee_id"))

	if employeeID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "authenticated employee identity is missing",
		})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid notification id")
		return
	}

	cmd, err := h.db.Exec(
		ctx,
		`
		UPDATE public.app_notifications
		SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
		WHERE id = $1::bigint
		  AND recipient_employee_id = $2::text
		`,
		id,
		employeeID,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if cmd.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "notification not found",
		})
		return
	}

	response.OK(c, gin.H{"updated": true})
}

func (h *DashboardHandler) MarkAllNotificationsRead(c *gin.Context) {
	ctx := c.Request.Context()
	employeeID := strings.TrimSpace(c.GetString("employee_id"))

	if employeeID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "authenticated employee identity is missing",
		})
		return
	}

	cmd, err := h.db.Exec(
		ctx,
		`
		UPDATE public.app_notifications
		SET read_at = CURRENT_TIMESTAMP
		WHERE recipient_employee_id = $1::text
		  AND read_at IS NULL
		`,
		employeeID,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, gin.H{
		"updated": cmd.RowsAffected(),
	})
}

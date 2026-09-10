package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

// RaiseTroubleTicketRequisition creates the legacy-compatible tt_reasons row
// and updates the Trouble Ticket requisition metadata in one transaction.
//
// Security note: created_by/source_requisition_by always come from the
// authenticated request context. The client is never allowed to choose them.
func (h *DashboardHandler) RaiseTroubleTicketRequisition(c *gin.Context) {
	ctx := c.Request.Context()

	ticketID, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || ticketID <= 0 {
		response.BadRequest(c, "invalid Trouble Ticket ID")
		return
	}

	actorEmployeeID := strings.TrimSpace(c.GetString("employee_id"))
	if actorEmployeeID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "authenticated employee identity is missing",
		})
		return
	}

	var req struct {
		CategoryID    int64  `json:"category_id" binding:"required"`
		BrandID       *int64 `json:"brand_id"`
		ModelID       *int64 `json:"model_id"`
		DeviceSerial  string `json:"device_serial"`
		ReasonDetails string `json:"reason_details" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "category and reason details are required")
		return
	}

	req.DeviceSerial = strings.TrimSpace(req.DeviceSerial)
	req.ReasonDetails = strings.TrimSpace(req.ReasonDetails)

	if req.CategoryID <= 0 {
		response.BadRequest(c, "please select a valid category")
		return
	}
	if len(req.ReasonDetails) < 3 {
		response.BadRequest(c, "reason details must contain at least 3 characters")
		return
	}
	if len(req.ReasonDetails) > 5000 {
		response.BadRequest(c, "reason details cannot exceed 5000 characters")
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var ttNo string
	var employeeID string
	var ticketStatus string

	err = tx.QueryRow(ctx, `
        SELECT
            COALESCE(tt_no::text, ''),
            COALESCE(employee_id, ''),
            COALESCE(status, '')
        FROM public.trouble_tickets
        WHERE id = $1
        FOR UPDATE
    `, ticketID).Scan(&ttNo, &employeeID, &ticketStatus)

	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "Trouble Ticket not found")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if strings.EqualFold(strings.TrimSpace(ticketStatus), "closed") {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"error":   "a closed Trouble Ticket cannot create a requisition",
		})
		return
	}

	var existingID int64
	duplicateErr := tx.QueryRow(ctx, `
        SELECT id
        FROM public.tt_reasons
        WHERE trouble_ticket_id = $1
          AND COALESCE(status, 1) = 1
        ORDER BY id DESC
        LIMIT 1
    `, ticketID).Scan(&existingID)

	if duplicateErr == nil {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"error":   "an active requisition already exists for this Trouble Ticket",
			"data": gin.H{
				"requisition_id": existingID,
			},
		})
		return
	}
	if duplicateErr != nil && !errors.Is(duplicateErr, pgx.ErrNoRows) {
		response.ServerError(c, duplicateErr)
		return
	}

	var categoryName string
	err = tx.QueryRow(ctx, `
        SELECT inventory_category_list
        FROM public.inventory_categories
        WHERE id = $1
          AND COALESCE(status, 0) = 1
          AND (
                COALESCE(parent_id, 0) = 0
                OR LOWER(COALESCE(type, '')) = 'category'
              )
    `, req.CategoryID).Scan(&categoryName)
	if errors.Is(err, pgx.ErrNoRows) {
		response.BadRequest(c, "selected category is invalid or inactive")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}

	brandName := ""
	if req.BrandID != nil && *req.BrandID > 0 {
		err = tx.QueryRow(ctx, `
            SELECT inventory_category_list
            FROM public.inventory_categories
            WHERE id = $1
              AND parent_id = $2
              AND COALESCE(status, 0) = 1
              AND LOWER(COALESCE(type, '')) = 'brand'
        `, *req.BrandID, req.CategoryID).Scan(&brandName)
		if errors.Is(err, pgx.ErrNoRows) {
			response.BadRequest(c, "selected brand does not belong to the selected category")
			return
		}
		if err != nil {
			response.ServerError(c, err)
			return
		}
	}

	modelName := ""
	if req.ModelID != nil && *req.ModelID > 0 {
		if req.BrandID == nil || *req.BrandID <= 0 {
			response.BadRequest(c, "select a brand before selecting a model")
			return
		}

		err = tx.QueryRow(ctx, `
            SELECT inventory_category_list
            FROM public.inventory_categories
            WHERE id = $1
              AND parent_id = $2
              AND COALESCE(status, 0) = 1
              AND LOWER(COALESCE(type, '')) = 'model'
        `, *req.ModelID, *req.BrandID).Scan(&modelName)
		if errors.Is(err, pgx.ErrNoRows) {
			response.BadRequest(c, "selected model does not belong to the selected brand")
			return
		}
		if err != nil {
			response.ServerError(c, err)
			return
		}
	}

	// If an existing device is selected, ensure it actually belongs to the TT owner.
	if req.DeviceSerial != "" {
		var deviceExists bool
		err = tx.QueryRow(ctx, `
            SELECT EXISTS (
                SELECT 1
                FROM public.it_equipment
                WHERE BTRIM(COALESCE(emp_id, '')) = BTRIM($1)
                  AND BTRIM(COALESCE(device_s_or_n, '')) = BTRIM($2)
                  AND COALESCE(active, 0) > 0
            )
        `, employeeID, req.DeviceSerial).Scan(&deviceExists)
		if err != nil {
			response.ServerError(c, err)
			return
		}
		if !deviceExists {
			response.BadRequest(c, "selected device is not assigned to the Trouble Ticket employee")
			return
		}
	}

	var requisitionID int64
	err = tx.QueryRow(ctx, `
        INSERT INTO public.tt_reasons (
            category,
            tt_no,
            employee_id,
            reason_details,
            status,
            created_by,
            created_at,
            approved_val,
            device_sl_no,
            delivered_val,
            dev_assigned_val,
            trouble_ticket_id
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            1,
            $5,
            NOW(),
            0,
            NULLIF($6, ''),
            0,
            0,
            $7
        )
        RETURNING id
    `,
		strings.TrimSpace(categoryName),
		strings.TrimSpace(ttNo),
		strings.TrimSpace(employeeID),
		req.ReasonDetails,
		actorEmployeeID,
		req.DeviceSerial,
		ticketID,
	).Scan(&requisitionID)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	_, err = tx.Exec(ctx, `
        UPDATE public.trouble_tickets
        SET
            requisition_type = 'Raised',
            delivered_status = 'Pending',
            source_device_requisition = 3,
            source_requisition_by = $2,
            source_requisition_date = NOW(),
            updated_at = NOW()
        WHERE id = $1
    `, ticketID, actorEmployeeID)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	actorName := actorEmployeeID
	_ = h.db.QueryRow(ctx, `
        SELECT COALESCE(NULLIF(BTRIM(employee_name), ''), $1)
        FROM public.employee_office_info
        WHERE employee_id = $1
        LIMIT 1
    `, actorEmployeeID).Scan(&actorName)

	response.Created(c, gin.H{
		"id":                 requisitionID,
		"trouble_ticket_id":  ticketID,
		"tt_no":              ttNo,
		"category":           categoryName,
		"brand":              brandName,
		"model":              modelName,
		"device_serial":      req.DeviceSerial,
		"raised_by":          actorEmployeeID,
		"raised_by_name":     actorName,
		"requisition_status": "Raised",
		"delivery_status":    "Pending",
	})
}

// CloseTroubleTicket closes a Trouble Ticket in one atomic update.
// closed_by is always the authenticated employee ID from middleware context.
func (h *DashboardHandler) CloseTroubleTicket(c *gin.Context) {
	ctx := c.Request.Context()

	ticketID, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || ticketID <= 0 {
		response.BadRequest(c, "invalid Trouble Ticket ID")
		return
	}

	actorEmployeeID := strings.TrimSpace(c.GetString("employee_id"))
	if actorEmployeeID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "authenticated employee identity is missing",
		})
		return
	}

	var req struct {
		ClosingDescription string `json:"closing_description" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "closing description is required")
		return
	}

	req.ClosingDescription = strings.TrimSpace(req.ClosingDescription)
	if len(req.ClosingDescription) < 3 {
		response.BadRequest(c, "closing description must contain at least 3 characters")
		return
	}
	if len(req.ClosingDescription) > 2000 {
		response.BadRequest(c, "closing description cannot exceed 2000 characters")
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var ttNo string
	var currentStatus string
	err = tx.QueryRow(ctx, `
        SELECT COALESCE(tt_no::text, ''), COALESCE(status, '')
        FROM public.trouble_tickets
        WHERE id = $1
        FOR UPDATE
    `, ticketID).Scan(&ttNo, &currentStatus)

	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "Trouble Ticket not found")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if strings.EqualFold(strings.TrimSpace(currentStatus), "closed") {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"error":   "Trouble Ticket is already closed",
		})
		return
	}

	var closedAt string
	err = tx.QueryRow(ctx, `
        UPDATE public.trouble_tickets
        SET
            status = 'Closed',
            source_status = 0,
            source_progress = 3,
            closed_at = NOW(),
            closed_by = $2,
            closing_description = $3,
            updated_at = NOW()
        WHERE id = $1
        RETURNING COALESCE(closed_at::text, '')
    `, ticketID, actorEmployeeID, req.ClosingDescription).Scan(&closedAt)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	actorName := actorEmployeeID
	_ = h.db.QueryRow(ctx, `
        SELECT COALESCE(NULLIF(BTRIM(employee_name), ''), $1)
        FROM public.employee_office_info
        WHERE employee_id = $1
        LIMIT 1
    `, actorEmployeeID).Scan(&actorName)

	response.OK(c, gin.H{
		"id":                  ticketID,
		"tt_no":               ttNo,
		"status":              "Closed",
		"closed_at":           closedAt,
		"closed_by":           actorEmployeeID,
		"closed_by_name":      actorName,
		"closing_description": req.ClosingDescription,
	})
}

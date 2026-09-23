//backend/internal/handler/asset_device_maintenance_routes.go

// Example drop-in route module for the ITM Go/Gin backend.
//
// Place this file in the backend package that owns your Gin routes, change the
// package name if required, and call RegisterAssetDeviceMaintenanceRoutes(api, db)
// on the same authenticated *gin.RouterGroup used by the other /assets routes.
//
// Routes added:
//
//	PUT /assets/devices/:id/full-update
//	GET /assets/devices/:id/history
//	GET /assets/devices/:id/status-history   (compatibility alias)
package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AssetDeviceMaintenanceHandler struct {
	db *pgxpool.Pool
}

func RegisterAssetDeviceMaintenanceRoutes(rg *gin.RouterGroup, db *pgxpool.Pool) {
	h := &AssetDeviceMaintenanceHandler{db: db}
	g := rg.Group("/assets/devices")
	g.PUT("/:id/full-update", h.FullUpdate)
	g.GET("/:id/history", h.History)
	g.GET("/:id/status-history", h.History)
}

type fullUpdateRequest struct {
	Master struct {
		DeviceSerial string `json:"device_serial"`
		Category     string `json:"category"`
		Brand        string `json:"brand"`
		Model        string `json:"model"`
		DeviceType   string `json:"device_type"`
		VendorName   string `json:"vendor_name"`
		PurchaseDate string `json:"purchase_date"`
		WarrantyDate string `json:"warranty_date"`
	} `json:"master"`
	Stock struct {
		CPU     string `json:"cpu"`
		RAM     string `json:"ram"`
		Storage string `json:"storage"`
		Monitor string `json:"monitor"`
	} `json:"stock"`
	TechnicalDetails struct {
		AGP                  string `json:"agp"`
		Battery              string `json:"battery"`
		RemovalDrive         string `json:"removal_drive"`
		OperatingSystem      string `json:"operating_system"`
		OSKey                string `json:"os_key"`
		IPAddress            string `json:"ip_address"`
		LANMACAddress        string `json:"lan_mac_address"`
		WLANMACAddress       string `json:"wlan_mac_address"`
		Adapter              string `json:"adapter"`
		Mouse                string `json:"mouse"`
		UPS                  string `json:"ups"`
		Bag                  string `json:"bag"`
		AssignmentDeviceType any    `json:"assignment_device_type"`
	} `json:"technical_details"`
}

func assignmentDeviceTypeValue(value any) (any, error) {
	switch v := value.(type) {
	case nil:
		return nil, nil
	case float64:
		n := int(v)
		if n == 0 {
			return nil, nil
		}
		if n != 1 && n != 2 {
			return nil, errors.New("assignment_device_type must be 1, 2 or null")
		}
		return n, nil
	case string:
		s := strings.TrimSpace(v)
		if s == "" {
			return nil, nil
		}
		n, err := strconv.Atoi(s)
		if err != nil || (n != 1 && n != 2) {
			return nil, errors.New("assignment_device_type must be 1, 2 or null")
		}
		return n, nil
	default:
		return nil, errors.New("assignment_device_type must be 1, 2 or null")
	}
}

func (h *AssetDeviceMaintenanceHandler) FullUpdate(c *gin.Context) {
	ctx := c.Request.Context()
	assetID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || assetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid asset id"})
		return
	}

	var req fullUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	req.Master.DeviceSerial = strings.TrimSpace(req.Master.DeviceSerial)
	req.Master.Category = strings.TrimSpace(req.Master.Category)
	if req.Master.DeviceSerial == "" || req.Master.Category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "device_serial and category are required"})
		return
	}

	assignmentDeviceType, err := assignmentDeviceTypeValue(req.TechnicalDetails.AssignmentDeviceType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer tx.Rollback(ctx)

	var legacyStackID *int64
	err = tx.QueryRow(ctx, `
        SELECT legacy_stack_id
        FROM public.asset_devices
        WHERE id = $1 AND row_status = 1
        FOR UPDATE
    `, assetID).Scan(&legacyStackID)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "asset device not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	actor := strings.TrimSpace(c.GetString("employee_id"))

	_, err = tx.Exec(ctx, `
        UPDATE public.asset_devices
        SET
            device_serial = NULLIF($2, ''),
            device_serial_key = UPPER(REGEXP_REPLACE(COALESCE($2, ''), '[^A-Za-z0-9]+', '', 'g')),
            category = NULLIF($3, ''),
            brand = NULLIF($4, ''),
            model = NULLIF($5, ''),
            device_type = NULLIF($6, ''),
            vendor_name = NULLIF($7, ''),
            purchase_date = NULLIF($8, '')::timestamptz,
            warranty_date = NULLIF($9, '')::timestamptz,
            agp = NULLIF($10, ''),
            battery = NULLIF($11, ''),
            removal_drive = NULLIF($12, ''),
            operating_system = NULLIF($13, ''),
            os_key = NULLIF($14, ''),
            ip_address = NULLIF($15, ''),
            lan_mac_address = NULLIF($16, ''),
            wlan_mac_address = NULLIF($17, ''),
            adapter = NULLIF($18, ''),
            mouse = NULLIF($19, ''),
            ups = NULLIF($20, ''),
            bag = NULLIF($21, ''),
            assignment_device_type = $22::smallint,
            updated_at = NOW()
        WHERE id = $1
    `,
		assetID,
		req.Master.DeviceSerial,
		strings.TrimSpace(req.Master.Category),
		strings.TrimSpace(req.Master.Brand),
		strings.TrimSpace(req.Master.Model),
		strings.TrimSpace(req.Master.DeviceType),
		strings.TrimSpace(req.Master.VendorName),
		strings.TrimSpace(req.Master.PurchaseDate),
		strings.TrimSpace(req.Master.WarrantyDate),
		strings.TrimSpace(req.TechnicalDetails.AGP),
		strings.TrimSpace(req.TechnicalDetails.Battery),
		strings.TrimSpace(req.TechnicalDetails.RemovalDrive),
		strings.TrimSpace(req.TechnicalDetails.OperatingSystem),
		strings.TrimSpace(req.TechnicalDetails.OSKey),
		strings.TrimSpace(req.TechnicalDetails.IPAddress),
		strings.TrimSpace(req.TechnicalDetails.LANMACAddress),
		strings.TrimSpace(req.TechnicalDetails.WLANMACAddress),
		strings.TrimSpace(req.TechnicalDetails.Adapter),
		strings.TrimSpace(req.TechnicalDetails.Mouse),
		strings.TrimSpace(req.TechnicalDetails.UPS),
		strings.TrimSpace(req.TechnicalDetails.Bag),
		assignmentDeviceType,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			c.JSON(http.StatusConflict, gin.H{"success": false, "message": "serial or unique device field already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	// Keep the linked SCM stock snapshot synchronized when this asset came from stock.
	if legacyStackID != nil && *legacyStackID > 0 {
		_, err = tx.Exec(ctx, `
            UPDATE public.stack_inventory
            SET
                serial_no = NULLIF($2, ''),
                category = NULLIF($3, ''),
                brand = NULLIF($4, ''),
                model = NULLIF($5, ''),
                device_type = NULLIF($6, ''),
                vendor_name = NULLIF($7, ''),
                purchase_date = NULLIF($8, '')::timestamp,
                warranty_date = NULLIF($9, '')::timestamp,
                cpu = NULLIF($10, ''),
                ram = NULLIF($11, ''),
                ssd = NULLIF($12, ''),
                monitor = NULLIF($13, ''),
                edited_by = NULLIF($14, ''),
                edited_at = NOW()
            WHERE id = $1
        `,
			*legacyStackID,
			req.Master.DeviceSerial,
			strings.TrimSpace(req.Master.Category),
			strings.TrimSpace(req.Master.Brand),
			strings.TrimSpace(req.Master.Model),
			strings.TrimSpace(req.Master.DeviceType),
			strings.TrimSpace(req.Master.VendorName),
			strings.TrimSpace(req.Master.PurchaseDate),
			strings.TrimSpace(req.Master.WarrantyDate),
			strings.TrimSpace(req.Stock.CPU),
			strings.TrimSpace(req.Stock.RAM),
			strings.TrimSpace(req.Stock.Storage),
			strings.TrimSpace(req.Stock.Monitor),
			actor,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":                 assetID,
			"stock_inventory_id": legacyStackID,
			"updated":            true,
		},
	})
}

func statusForEndReason(reason *string, active bool) *int {
	if active {
		v := 1
		return &v
	}
	if reason == nil {
		return nil
	}
	var v int
	switch strings.ToUpper(strings.TrimSpace(*reason)) {
	case "TRANSFERRED":
		v = 3
	case "RETURNED":
		v = 4
	case "OWST":
		v = 7
	case "DAMAGED":
		v = 5
	default:
		return nil
	}
	return &v
}

func (h *AssetDeviceMaintenanceHandler) History(c *gin.Context) {
	ctx := c.Request.Context()
	assetID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || assetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid asset id"})
		return
	}

	rows, err := h.db.Query(ctx, `
        SELECT
            a.id,
            a.assignment_source,
            a.assigned_at,
            a.ended_at,
            a.end_reason,
            a.emp_id,
            a.emp_name,
            n.emp_id,
            n.emp_name,
            COALESCE(NULLIF(a.end_remarks, ''), NULLIF(a.assignment_remarks, ''), ''),
            a.created_by,
            a.ended_by
        FROM public.asset_device_assignments a
        LEFT JOIN public.asset_device_assignments n
          ON n.previous_assignment_id = a.id
        WHERE a.asset_device_id = $1
        ORDER BY COALESCE(a.ended_at, a.assigned_at) DESC, a.id DESC
    `, assetID)
	if err != nil {
		// 42P01 = table does not exist: deploy the SQL migration first.
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "42P01" {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"success": false,
				"message": "asset_device_assignments table is not installed; run the assignment-history migration",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]gin.H, 0)
	for rows.Next() {
		var (
			id          int64
			source      string
			assignedAt  any
			endedAt     any
			endReason   *string
			fromEmpID   string
			fromEmpName *string
			toEmpID     *string
			toEmpName   *string
			remarks     string
			createdBy   *string
			endedBy     *string
		)
		if err := rows.Scan(
			&id, &source, &assignedAt, &endedAt, &endReason,
			&fromEmpID, &fromEmpName, &toEmpID, &toEmpName,
			&remarks, &createdBy, &endedBy,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
			return
		}

		active := endedAt == nil
		event := source
		if endReason != nil && strings.TrimSpace(*endReason) != "" {
			event = *endReason
		}
		changedBy := createdBy
		changedAt := assignedAt
		if !active {
			changedBy = endedBy
			changedAt = endedAt
		}

		item := gin.H{
			"id":              id,
			"event":           event,
			"assignment_type": source,
			"current_status":  statusForEndReason(endReason, active),
			"from_emp_id":     fromEmpID,
			"from_emp_name":   fromEmpName,
			"to_emp_id":       toEmpID,
			"to_emp_name":     toEmpName,
			"emp_id":          fromEmpID,
			"emp_name":        fromEmpName,
			"remarks":         remarks,
			"changed_by":      changedBy,
			"changed_at":      changedAt,
			"assigned_at":     assignedAt,
			"ended_at":        endedAt,
			"active":          active,
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": items})
}

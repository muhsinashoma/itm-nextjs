package handler

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AssetDeviceAssignmentHandler owns the direct employee-assignment transaction.
// Keep the route inside the same authenticated API group used by the other
// inventory handlers so middleware has already populated employee_id.
type AssetDeviceAssignmentHandler struct {
	db *pgxpool.Pool
}

func NewAssetDeviceAssignmentHandler(db *pgxpool.Pool) *AssetDeviceAssignmentHandler {
	return &AssetDeviceAssignmentHandler{db: db}
}

func (h *AssetDeviceAssignmentHandler) Register(rg *gin.RouterGroup) {
	rg.GET("/assets/devices/:id/assignment-context", h.AssignmentContext)
	rg.POST("/assets/devices/:id/assignment", h.AssignDirect)
}

type assetAssignmentTechnicalDetails struct {
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
	AssignmentDeviceType *int16 `json:"assignment_device_type"`
}

type assetDirectAssignmentRequest struct {
	EmployeeID       string                          `json:"employee_id" binding:"required"`
	Remarks          string                          `json:"remarks"`
	TechnicalDetails assetAssignmentTechnicalDetails `json:"technical_details"`
}

func normalizeAssignmentTechnicalDetails(
	value assetAssignmentTechnicalDetails,
) assetAssignmentTechnicalDetails {
	return assetAssignmentTechnicalDetails{
		AGP:                  strings.TrimSpace(value.AGP),
		Battery:              strings.TrimSpace(value.Battery),
		RemovalDrive:         strings.TrimSpace(value.RemovalDrive),
		OperatingSystem:      strings.TrimSpace(value.OperatingSystem),
		OSKey:                strings.TrimSpace(value.OSKey),
		IPAddress:            strings.TrimSpace(value.IPAddress),
		LANMACAddress:        strings.TrimSpace(value.LANMACAddress),
		WLANMACAddress:       strings.TrimSpace(value.WLANMACAddress),
		Adapter:              strings.TrimSpace(value.Adapter),
		Mouse:                strings.TrimSpace(value.Mouse),
		UPS:                  strings.TrimSpace(value.UPS),
		Bag:                  strings.TrimSpace(value.Bag),
		AssignmentDeviceType: value.AssignmentDeviceType,
	}
}

func validateAssignmentTechnicalDetails(value assetAssignmentTechnicalDetails) string {
	fields := []struct {
		label string
		value string
	}{
		{"AGP", value.AGP},
		{"Battery", value.Battery},
		{"Removal Drive", value.RemovalDrive},
		{"OS", value.OperatingSystem},
		{"OS Key", value.OSKey},
		{"IP Address", value.IPAddress},
		{"LAN-MAC", value.LANMACAddress},
		{"WLAN-MAC Address", value.WLANMACAddress},
		{"Adapter", value.Adapter},
		{"Mouse", value.Mouse},
		{"UPS", value.UPS},
		{"Bag", value.Bag},
	}

	for _, field := range fields {
		if len(field.value) > 255 {
			return field.label + " cannot exceed 255 characters"
		}
	}

	if value.AssignmentDeviceType != nil &&
		*value.AssignmentDeviceType != 1 &&
		*value.AssignmentDeviceType != 2 {
		return "Device Type must be 1 (Permanent), 2 (Temporary), or blank"
	}

	return ""
}

func normalizeMACAddress(value string) (string, error) {
	raw := strings.ToUpper(strings.TrimSpace(value))
	if raw == "" {
		return "", nil
	}

	var compact strings.Builder
	for _, r := range raw {
		switch {
		case r >= '0' && r <= '9':
			compact.WriteRune(r)
		case r >= 'A' && r <= 'F':
			compact.WriteRune(r)
		case r == ':' || r == '-' || r == '.' || r == ' ' || r == '\t':
			// Accepted separator.
		default:
			return "", fmt.Errorf("contains invalid character %q", r)
		}
	}

	normalized := compact.String()
	if len(normalized) != 12 {
		return "", fmt.Errorf("must contain exactly 12 hexadecimal characters")
	}

	parts := make([]string, 0, 6)
	for index := 0; index < 12; index += 2 {
		parts = append(parts, normalized[index:index+2])
	}

	return strings.Join(parts, ":"), nil
}

func isMACUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return false
	}

	return pgErr.Code == "23505" &&
		(pgErr.ConstraintName == "asset_device_mac_unique" ||
			strings.Contains(strings.ToLower(pgErr.Message), "mac address"))
}

// AssignmentContext returns the device information needed only when the
// assignment modal is opened. This keeps the main device list lightweight.
func (h *AssetDeviceAssignmentHandler) AssignmentContext(c *gin.Context) {
	ctx := c.Request.Context()

	assetID, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || assetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid asset device id",
		})
		return
	}

	var (
		deviceSerial         string
		category             string
		brand                string
		model                string
		vendorName           string
		mrNumber             string
		prNumber             string
		purchaseDate         sql.NullTime
		warrantyDate         sql.NullTime
		assetStatus          int
		stockInventoryID     sql.NullInt64
		cpu                  string
		ram                  string
		storage              string
		monitor              string
		agp                  string
		battery              string
		removalDrive         string
		operatingSystem      string
		osKey                string
		ipAddress            string
		lanMACAddress        string
		wlanMACAddress       string
		adapter              string
		mouse                string
		ups                  string
		bag                  string
		assignmentDeviceType sql.NullInt16
	)

	err = h.db.QueryRow(
		ctx,
		`
		SELECT
			COALESCE(ad.device_serial, ''),
			COALESCE(ad.category, ''),
			COALESCE(ad.brand, ''),
			COALESCE(ad.model, ''),
			COALESCE(ad.vendor_name, ''),
			COALESCE(ad.mr_number, ''),
			COALESCE(ad.pr_number, ''),
			ad.purchase_date,
			ad.warranty_date,
			COALESCE(ad.asset_status, 0),
			si.id,
			COALESCE(si.cpu, ''),
			COALESCE(si.ram, ''),
			COALESCE(si.ssd, ''),
			COALESCE(si.monitor, ''),
			COALESCE(ad.agp, ''),
			COALESCE(ad.battery, ''),
			COALESCE(ad.removal_drive, ''),
			COALESCE(ad.operating_system, ''),
			COALESCE(ad.os_key, ''),
			COALESCE(ad.ip_address, ''),
			COALESCE(ad.lan_mac_address, ''),
			COALESCE(ad.wlan_mac_address, ''),
			COALESCE(ad.adapter, ''),
			COALESCE(ad.mouse, ''),
			COALESCE(ad.ups, ''),
			COALESCE(ad.bag, ''),
			ad.assignment_device_type
		FROM public.asset_devices AS ad
		LEFT JOIN LATERAL (
			SELECT
				s.id,
				s.cpu,
				s.ram,
				s.ssd,
				s.monitor
			FROM public.stack_inventory AS s
			WHERE s.asset_device_id = ad.id
			   OR (
					s.asset_device_id IS NULL
					AND ad.legacy_stack_id IS NOT NULL
					AND s.id = ad.legacy_stack_id
			   )
			ORDER BY
				CASE WHEN s.asset_device_id = ad.id THEN 0 ELSE 1 END,
				s.id DESC
			LIMIT 1
		) AS si ON TRUE
		WHERE ad.id = $1
		  AND COALESCE(ad.row_status, 1) = 1
		LIMIT 1
		`,
		assetID,
	).Scan(
		&deviceSerial,
		&category,
		&brand,
		&model,
		&vendorName,
		&mrNumber,
		&prNumber,
		&purchaseDate,
		&warrantyDate,
		&assetStatus,
		&stockInventoryID,
		&cpu,
		&ram,
		&storage,
		&monitor,
		&agp,
		&battery,
		&removalDrive,
		&operatingSystem,
		&osKey,
		&ipAddress,
		&lanMACAddress,
		&wlanMACAddress,
		&adapter,
		&mouse,
		&ups,
		&bag,
		&assignmentDeviceType,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "asset device not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "unable to load assignment context",
		})
		return
	}

	var stockID any
	if stockInventoryID.Valid {
		stockID = stockInventoryID.Int64
	}

	var purchaseDateValue any
	if purchaseDate.Valid {
		purchaseDateValue = purchaseDate.Time
	}

	var warrantyDateValue any
	if warrantyDate.Valid {
		warrantyDateValue = warrantyDate.Time
	}

	var assignmentDeviceTypeValue any
	if assignmentDeviceType.Valid {
		assignmentDeviceTypeValue = assignmentDeviceType.Int16
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"asset": gin.H{
				"id":            assetID,
				"device_serial": deviceSerial,
				"category":      category,
				"brand":         brand,
				"model":         model,
				"vendor_name":   vendorName,
				"mr_number":     mrNumber,
				"pr_number":     prNumber,
				"purchase_date": purchaseDateValue,
				"warranty_date": warrantyDateValue,
				"asset_status":  assetStatus,
			},
			"stock": gin.H{
				"stock_inventory_id": stockID,
				"cpu":                cpu,
				"ram":                ram,
				"storage":            storage,
				"monitor":            monitor,
			},
			"technical": gin.H{
				"agp":                    agp,
				"battery":                battery,
				"removal_drive":          removalDrive,
				"operating_system":       operatingSystem,
				"os_key":                 osKey,
				"ip_address":             ipAddress,
				"lan_mac_address":        lanMACAddress,
				"wlan_mac_address":       wlanMACAddress,
				"adapter":                adapter,
				"mouse":                  mouse,
				"ups":                    ups,
				"bag":                    bag,
				"assignment_device_type": assignmentDeviceTypeValue,
			},
		},
	})
}

// AssignDirect assigns an Available asset to an active employee. The same
// endpoint also supports Returned -> Assigned for the existing reassign action.
//
// Current asset state, linked stock state and the immutable assignment event are
// written in one transaction. The target employee and assigning IT person are
// never trusted from display-only client fields.
func (h *AssetDeviceAssignmentHandler) AssignDirect(c *gin.Context) {
	ctx := c.Request.Context()

	assetID, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || assetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid asset device id",
		})
		return
	}

	var req assetDirectAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "employee_id is required",
		})
		return
	}

	req.EmployeeID = strings.TrimSpace(req.EmployeeID)
	req.Remarks = strings.TrimSpace(req.Remarks)
	req.TechnicalDetails = normalizeAssignmentTechnicalDetails(req.TechnicalDetails)

	if req.EmployeeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "employee_id is required",
		})
		return
	}

	if len(req.Remarks) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "remarks cannot exceed 1000 characters",
		})
		return
	}

	if validationError := validateAssignmentTechnicalDetails(req.TechnicalDetails); validationError != "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   validationError,
		})
		return
	}

	normalizedLAN, macErr := normalizeMACAddress(req.TechnicalDetails.LANMACAddress)
	if macErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "LAN-MAC " + macErr.Error(),
		})
		return
	}

	normalizedWLAN, macErr := normalizeMACAddress(req.TechnicalDetails.WLANMACAddress)
	if macErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "WLAN-MAC " + macErr.Error(),
		})
		return
	}

	if normalizedLAN != "" &&
		normalizedWLAN != "" &&
		normalizedLAN == normalizedWLAN {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "LAN-MAC and WLAN-MAC must be different addresses",
		})
		return
	}

	req.TechnicalDetails.LANMACAddress = normalizedLAN
	req.TechnicalDetails.WLANMACAddress = normalizedWLAN

	assignedByEmployeeID := strings.TrimSpace(c.GetString("employee_id"))
	if assignedByEmployeeID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "authenticated IT employee context is required",
		})
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "unable to start assignment transaction",
		})
		return
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var (
		deviceSerial         string
		category             string
		previousStatus       int
		rowStatus            int
		previousEmployeeID   string
		previousEmployeeName string
		legacyStackID        sql.NullInt64
	)

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			COALESCE(device_serial, ''),
			COALESCE(category, ''),
			COALESCE(asset_status, 0),
			COALESCE(row_status, 1),
			COALESCE(emp_id, ''),
			COALESCE(emp_name, ''),
			legacy_stack_id
		FROM public.asset_devices
		WHERE id = $1
		FOR UPDATE
		`,
		assetID,
	).Scan(
		&deviceSerial,
		&category,
		&previousStatus,
		&rowStatus,
		&previousEmployeeID,
		&previousEmployeeName,
		&legacyStackID,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "asset device not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "unable to lock asset device",
		})
		return
	}

	if rowStatus != 1 {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"error":   "asset device is not active",
		})
		return
	}

	// 0 = Available. 4 = Returned and is eligible for the existing reassign flow.
	if previousStatus != 0 && previousStatus != 4 {
		c.JSON(http.StatusConflict, gin.H{
			"success":        false,
			"error":          "only Available or Returned devices can be assigned",
			"current_status": previousStatus,
		})
		return
	}

	var (
		employeeID   string
		employeeName string
		department   string
		designation  string
	)

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			BTRIM(COALESCE(o.employee_id, '')),
			BTRIM(COALESCE(o.employee_name, '')),
			BTRIM(COALESCE(o.department_name, '')),
			BTRIM(COALESCE(o.designation, ''))
		FROM public.employee_office_info AS o
		WHERE LOWER(BTRIM(COALESCE(o.employee_id, ''))) =
		      LOWER(BTRIM($1::text))
		  AND LOWER(BTRIM(COALESCE(o.active, ''))) IN ('active', 'yes')
		LIMIT 1
		`,
		req.EmployeeID,
	).Scan(
		&employeeID,
		&employeeName,
		&department,
		&designation,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "selected employee does not exist or is not active",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "unable to validate employee",
		})
		return
	}

	var assignedByName string
	actorErr := tx.QueryRow(
		ctx,
		`
		SELECT BTRIM(COALESCE(employee_name, ''))
		FROM public.employee_office_info
		WHERE LOWER(BTRIM(COALESCE(employee_id, ''))) =
		      LOWER(BTRIM($1::text))
		LIMIT 1
		`,
		assignedByEmployeeID,
	).Scan(&assignedByName)
	if actorErr != nil || strings.TrimSpace(assignedByName) == "" {
		assignedByName = assignedByEmployeeID
	}

	var assignedAt time.Time
	updateResult, err := tx.Exec(
		ctx,
		`
		UPDATE public.asset_devices
		SET
			agp = COALESCE(NULLIF($1, ''), agp),
			battery = COALESCE(NULLIF($2, ''), battery),
			removal_drive = COALESCE(NULLIF($3, ''), removal_drive),
			operating_system = COALESCE(NULLIF($4, ''), operating_system),
			os_key = COALESCE(NULLIF($5, ''), os_key),
			ip_address = COALESCE(NULLIF($6, ''), ip_address),
			lan_mac_address = COALESCE(NULLIF($7, ''), lan_mac_address),
			wlan_mac_address = COALESCE(NULLIF($8, ''), wlan_mac_address),
			adapter = COALESCE(NULLIF($9, ''), adapter),
			mouse = COALESCE(NULLIF($10, ''), mouse),
			ups = COALESCE(NULLIF($11, ''), ups),
			bag = COALESCE(NULLIF($12, ''), bag),
			assignment_device_type = COALESCE($13::smallint, assignment_device_type),
			emp_id = $14,
			emp_name = $15,
			department = $16,
			designation = $17,
			assigned_date = CURRENT_TIMESTAMP,
			asset_status = 1,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $18
		  AND asset_status = $19
		  AND COALESCE(row_status, 1) = 1
		`,
		req.TechnicalDetails.AGP,
		req.TechnicalDetails.Battery,
		req.TechnicalDetails.RemovalDrive,
		req.TechnicalDetails.OperatingSystem,
		req.TechnicalDetails.OSKey,
		req.TechnicalDetails.IPAddress,
		req.TechnicalDetails.LANMACAddress,
		req.TechnicalDetails.WLANMACAddress,
		req.TechnicalDetails.Adapter,
		req.TechnicalDetails.Mouse,
		req.TechnicalDetails.UPS,
		req.TechnicalDetails.Bag,
		req.TechnicalDetails.AssignmentDeviceType,
		employeeID,
		employeeName,
		department,
		designation,
		assetID,
		previousStatus,
	)
	if err != nil {
		if isMACUniqueViolation(err) {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error":   "LAN-MAC or WLAN-MAC is already assigned to another asset device",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "unable to update asset assignment",
		})
		return
	}
	if updateResult.RowsAffected() != 1 {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"error":   "asset assignment state changed; refresh and try again",
		})
		return
	}

	if err := tx.QueryRow(
		ctx,
		`SELECT assigned_date FROM public.asset_devices WHERE id = $1`,
		assetID,
	).Scan(&assignedAt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "unable to read assignment timestamp",
		})
		return
	}

	var legacyStackArg any
	if legacyStackID.Valid {
		legacyStackArg = legacyStackID.Int64
	}

	var (
		stockInventoryID int64
		hasStockRow      bool
		stockRowsUpdated int64
	)

	stockErr := tx.QueryRow(
		ctx,
		`
		SELECT id
		FROM public.stack_inventory
		WHERE asset_device_id = $1
		   OR (
				asset_device_id IS NULL
				AND $2::bigint IS NOT NULL
				AND id = $2::bigint
		   )
		ORDER BY
			CASE WHEN asset_device_id = $1 THEN 0 ELSE 1 END,
			id DESC
		LIMIT 1
		`,
		assetID,
		legacyStackArg,
	).Scan(&stockInventoryID)

	if stockErr != nil && stockErr != pgx.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "unable to resolve linked stock row",
		})
		return
	}

	if stockErr == nil {
		hasStockRow = true

		stockResult, updateStockErr := tx.Exec(
			ctx,
			`
			UPDATE public.stack_inventory
			SET
				device_assigned_status = 1,
				device_assiged_date = $1,
				device_assiged_by = $2,
				edited_by = $2,
				edited_at = $1
			WHERE id = $3
			`,
			assignedAt,
			assignedByEmployeeID,
			stockInventoryID,
		)
		if updateStockErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "unable to synchronize linked stock assignment",
			})
			return
		}

		stockRowsUpdated = stockResult.RowsAffected()
	}

	action := "ASSIGNED"
	if previousStatus == 4 {
		action = "REASSIGNED"
	}

	var stockEventID any
	if hasStockRow {
		stockEventID = stockInventoryID
	}

	_, err = tx.Exec(
		ctx,
		`
		INSERT INTO public.asset_device_assignment_events (
			asset_device_id,
			stock_inventory_id,
			action,
			device_serial,
			category,
			previous_employee_id,
			previous_employee_name,
			employee_id,
			employee_name,
			department,
			designation,
			previous_asset_status,
			new_asset_status,
			assigned_at,
			assigned_by_employee_id,
			assigned_by_name,
			remarks,
			ip_address,
			user_agent
		)
		VALUES (
			$1, $2, $3, $4, $5,
			NULLIF($6, ''), NULLIF($7, ''),
			$8, $9, NULLIF($10, ''), NULLIF($11, ''),
			$12, 1, $13, $14, $15,
			NULLIF($16, ''), NULLIF($17, ''), NULLIF($18, '')
		)
		`,
		assetID,
		stockEventID,
		action,
		deviceSerial,
		category,
		previousEmployeeID,
		previousEmployeeName,
		employeeID,
		employeeName,
		department,
		designation,
		previousStatus,
		assignedAt,
		assignedByEmployeeID,
		assignedByName,
		req.Remarks,
		strings.TrimSpace(c.ClientIP()),
		strings.TrimSpace(c.Request.UserAgent()),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "unable to write assignment audit event",
		})
		return
	}

	if err := tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "unable to commit device assignment",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"assigned":                true,
			"action":                  action,
			"asset_device_id":         assetID,
			"device_serial":           deviceSerial,
			"employee_id":             employeeID,
			"employee_name":           employeeName,
			"department":              department,
			"designation":             designation,
			"assigned_at":             assignedAt,
			"assigned_by_employee_id": assignedByEmployeeID,
			"assigned_by_name":        assignedByName,
			"stock_inventory_id":      stockEventID,
			"stock_rows_updated":      stockRowsUpdated,
			"asset_status":            1,
			"status_label":            "Assigned",
		},
	})
}

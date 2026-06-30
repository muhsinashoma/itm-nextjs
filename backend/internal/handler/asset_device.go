//backend/interbal/handler/asset_device.go

package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AssetDeviceHandler struct {
	db *pgxpool.Pool
}

func NewAssetDeviceHandler(db *pgxpool.Pool) *AssetDeviceHandler {
	return &AssetDeviceHandler{db: db}
}

// func (h *AssetDeviceHandler) Register(rg *gin.RouterGroup) {
// 	g := rg.Group("/assets")

// 	// Keep history route before :id route.
// 	g.GET("/devices", h.List)

// 	// Non-operational asset dashboard summary
// 	g.GET("/non-operational/summary", h.NonOperationalSummary)

// 	g.GET("/devices/:id/history", h.History)
// 	g.GET("/devices/:id", h.GetByID)
// }

func (h *AssetDeviceHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/assets")

	g.GET("/devices", h.List)

	g.GET("/non-operational/summary", h.NonOperationalSummary)
	g.GET("/non-operational", h.NonOperationalList)

	g.GET("/devices/:id/history", h.History)
	g.GET("/devices/:id", h.GetByID)
}

type AssetDevice struct {
	ID           int64   `json:"id"`
	DeviceSerial *string `json:"device_serial"`
	Category     *string `json:"category"`
	Brand        *string `json:"brand"`
	Model        *string `json:"model"`
	DeviceType   *string `json:"device_type"`

	AssetStatus int16  `json:"asset_status"`
	StatusLabel string `json:"status_label"`

	EmpID         *string `json:"emp_id"`
	EmpName       *string `json:"emp_name"`
	EmployeeImage *string `json:"employee_image"`
	Department    *string `json:"department"`
	Designation   *string `json:"designation"`
	AssignedDate  *string `json:"assigned_date"`

	VendorID   *int64  `json:"vendor_id"`
	VendorName *string `json:"vendor_name"`
	VendorFlag *int16  `json:"vendor_flag"`

	MRNumber *string `json:"mr_number"`
	PRNumber *string `json:"pr_number"`

	PurchaseDate *string `json:"purchase_date"`
	WarrantyDate *string `json:"warranty_date"`

	CreatedAt *string `json:"created_at"`
	UpdatedAt *string `json:"updated_at"`
}

type AssetDeviceHistory struct {
	ID                int64 `json:"id"`
	AssetDeviceID     int64 `json:"asset_device_id"`
	LegacyEquipmentID int64 `json:"legacy_equipment_id"`

	DeviceSerial *string `json:"device_serial"`
	StatusCode   *int16  `json:"status_code"`
	StatusLabel  string  `json:"status_label"`
	RawStatus    *string `json:"raw_status"`

	PreviousStatus *int   `json:"previous_status"`
	ReturnStatus   *int16 `json:"return_status"`
	TransferStatus *int16 `json:"transfer_status"`

	EmpID       *string `json:"emp_id"`
	EmpName     *string `json:"emp_name"`
	Department  *string `json:"department"`
	Designation *string `json:"designation"`

	MRNumber *string `json:"mr_number"`
	PRNumber *string `json:"pr_number"`
	Vendor   *string `json:"vendor"`

	AssignedDate  *string `json:"assigned_date"`
	TransferredAt *string `json:"transferred_at"`
	ReturnedAt    *string `json:"returned_at"`

	HistoryReason   string  `json:"history_reason"`
	CreatedAtSource *string `json:"created_at_source"`
	UpdatedAtSource *string `json:"updated_at_source"`
	MigratedAt      *string `json:"migrated_at"`
}

// type NonOperationalSummary struct {
// 	Ownership           int64 `json:"ownership"`
// 	Damaged             int64 `json:"damaged"`
// 	Lost                int64 `json:"lost"`
// 	TotalNonOperational int64 `json:"total_non_operational"`

// 	MainTableDamaged       int64 `json:"main_table_damaged"`
// 	DamageInventoryDamaged int64 `json:"damage_inventory_damaged"`
// 	DuplicateInBothTables  int64 `json:"duplicate_in_both_tables"`
// 	DamageInventoryOnly    int64 `json:"damage_inventory_only"`
// }

type NonOperationalSummary struct {
	Ownership           int64 `json:"ownership"`
	Damaged             int64 `json:"damaged"`
	Lost                int64 `json:"lost"`
	TotalNonOperational int64 `json:"total_non_operational"`

	MainTableDamaged       int64 `json:"main_table_damaged"`
	DamageInventoryDamaged int64 `json:"damage_inventory_damaged"`
	DuplicateInBothTables  int64 `json:"duplicate_in_both_tables"`
	DamageInventoryOnly    int64 `json:"damage_inventory_only"`
}

type NonOperationalDevice struct {
	ID       int64  `json:"id"`
	Source   string `json:"source"`
	SourceID int64  `json:"source_id"`

	DeviceSerial *string `json:"device_serial"`
	Category     *string `json:"category"`
	Brand        *string `json:"brand"`
	Model        *string `json:"model"`

	EmpID       *string `json:"emp_id"`
	EmpName     *string `json:"emp_name"`
	Department  *string `json:"department"`
	Designation *string `json:"designation"`

	MRNumber *string `json:"mr_number"`
	PRNumber *string `json:"pr_number"`

	AssignedDate *string `json:"assigned_date"`
	PurchaseDate *string `json:"purchase_date"`
	WarrantyDate *string `json:"warranty_date"`

	AssetStatus int16   `json:"asset_status"`
	StatusLabel string  `json:"status_label"`
	Remarks     *string `json:"remarks"`
	CreatedAt   *string `json:"created_at"`
	UpdatedAt   *string `json:"updated_at"`
}

func (h *AssetDeviceHandler) NonOperationalSummary(c *gin.Context) {
	const query = `
		WITH raw_damage_source AS (
			SELECT
				di.id,
				di.created_at,
				UPPER(
					REGEXP_REPLACE(
						BTRIM(di.device_sl_no),
						'[^A-Za-z0-9]+',
						'',
						'g'
					)
				) AS normalized_serial_key
			FROM public.damage_inventory di
			WHERE di.device_status = 0
			  AND di.status = 1
			  AND NULLIF(BTRIM(di.device_sl_no), '') IS NOT NULL
		),

		damage_source AS (
			SELECT DISTINCT ON (normalized_serial_key)
				normalized_serial_key
			FROM raw_damage_source
			ORDER BY
				normalized_serial_key,
				created_at DESC NULLS LAST,
				id DESC
		),

		main_summary AS (
			SELECT
				COUNT(*) FILTER (
					WHERE asset_status = 7
				) AS ownership,

				COUNT(*) FILTER (
					WHERE asset_status = 2
				) AS main_table_damaged,

				COUNT(*) FILTER (
					WHERE asset_status = 5
				) AS lost
			FROM public.asset_devices
		),

		damage_inventory_summary AS (
			SELECT
				COUNT(*) AS damage_inventory_damaged,

				COUNT(ad.id) AS duplicate_in_both_tables,

				COUNT(*) - COUNT(ad.id) AS damage_inventory_only
			FROM damage_source ds
			LEFT JOIN public.asset_devices ad
				ON ad.device_serial_key = ds.normalized_serial_key
		)

		SELECT
			ms.ownership,

			(
				ms.main_table_damaged +
				dis.damage_inventory_only
			) AS damaged,

			ms.lost,

			ms.main_table_damaged,
			dis.damage_inventory_damaged,
			dis.duplicate_in_both_tables,
			dis.damage_inventory_only

		FROM main_summary ms
		CROSS JOIN damage_inventory_summary dis
	`

	var summary NonOperationalSummary

	err := h.db.QueryRow(
		c.Request.Context(),
		query,
	).Scan(
		&summary.Ownership,
		&summary.Damaged,
		&summary.Lost,
		&summary.MainTableDamaged,
		&summary.DamageInventoryDamaged,
		&summary.DuplicateInBothTables,
		&summary.DamageInventoryOnly,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Unable to load non-operational summary",
			"error":   err.Error(),
		})
		return
	}

	summary.TotalNonOperational =
		summary.Ownership +
			summary.Damaged +
			summary.Lost

	c.JSON(http.StatusOK, gin.H{
		"data": summary,
	})
}

// Add New

func (h *AssetDeviceHandler) NonOperationalList(c *gin.Context) {
	status := strings.ToLower(
		strings.TrimSpace(c.DefaultQuery("status", "all")),
	)

	switch status {
	case "all", "damaged", "lost":
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "status must be one of: all, damaged, lost",
		})
		return
	}

	const query = `
		WITH raw_damage_source AS (
			SELECT
				di.id,
				di.device_sl_no,
				di.device_category,
				di.model,
				di.department,
				di.function_name,
				di.remarks,
				di.created_at,
				UPPER(
					REGEXP_REPLACE(
						BTRIM(di.device_sl_no),
						'[^A-Za-z0-9]+',
						'',
						'g'
					)
				) AS normalized_serial_key
			FROM public.damage_inventory di
			WHERE di.device_status = 0
			  AND di.status = 1
			  AND NULLIF(BTRIM(di.device_sl_no), '') IS NOT NULL
		),

		damage_source AS (
			SELECT DISTINCT ON (normalized_serial_key)
				id,
				device_sl_no,
				device_category,
				model,
				department,
				function_name,
				remarks,
				created_at,
				normalized_serial_key
			FROM raw_damage_source
			ORDER BY
				normalized_serial_key,
				created_at DESC NULLS LAST,
				id DESC
		),

		non_operational_rows AS (
			SELECT
				ad.id,
				'asset_devices'::text AS source,
				ad.id AS source_id,

				ad.device_serial,
				ad.category,
				ad.brand,
				ad.model,

				ad.emp_id,
				ad.emp_name,
				ad.department,
				ad.designation,

				ad.mr_number,
				ad.pr_number,

				ad.assigned_date::text,
				ad.purchase_date::text,
				ad.warranty_date::text,

				ad.asset_status,

				CASE ad.asset_status
					WHEN 2 THEN 'Damaged'
					WHEN 5 THEN 'Lost'
					ELSE 'Unknown'
				END AS status_label,

				NULL::text AS remarks,
				ad.created_at::text,
				ad.updated_at::text

			FROM public.asset_devices ad
			WHERE
				($1 = 'all' AND ad.asset_status IN (2, 5))
				OR ($1 = 'damaged' AND ad.asset_status = 2)
				OR ($1 = 'lost' AND ad.asset_status = 5)

			UNION ALL

			SELECT
				-ds.id AS id,
				'damage_inventory'::text AS source,
				ds.id AS source_id,

				ds.device_sl_no,
				ds.device_category,
				NULL::text AS brand,
				ds.model,

				NULL::text AS emp_id,
				NULL::text AS emp_name,
				ds.department,
				ds.function_name,

				NULL::text AS mr_number,
				NULL::text AS pr_number,

				NULL::text AS assigned_date,
				NULL::text AS purchase_date,
				NULL::text AS warranty_date,

				2::smallint AS asset_status,
				'Damaged'::text AS status_label,

				ds.remarks,
				ds.created_at::text,
				ds.created_at::text

			FROM damage_source ds
			LEFT JOIN public.asset_devices ad
				ON ad.device_serial_key = ds.normalized_serial_key
			WHERE
				$1 IN ('all', 'damaged')
				AND ad.id IS NULL
		)

		SELECT
			id,
			source,
			source_id,

			device_serial,
			category,
			brand,
			model,

			emp_id,
			emp_name,
			department,
			designation,

			mr_number,
			pr_number,

			assigned_date,
			purchase_date,
			warranty_date,

			asset_status,
			status_label,
			remarks,
			created_at,
			updated_at

		FROM non_operational_rows
		ORDER BY
			status_label,
			device_serial NULLS LAST,
			id DESC
	`

	rows, err := h.db.Query(
		c.Request.Context(),
		query,
		status,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Unable to load non-operational devices",
			"error":   err.Error(),
		})
		return
	}
	defer rows.Close()

	items := make([]NonOperationalDevice, 0)

	for rows.Next() {
		var item NonOperationalDevice

		err := rows.Scan(
			&item.ID,
			&item.Source,
			&item.SourceID,

			&item.DeviceSerial,
			&item.Category,
			&item.Brand,
			&item.Model,

			&item.EmpID,
			&item.EmpName,
			&item.Department,
			&item.Designation,

			&item.MRNumber,
			&item.PRNumber,

			&item.AssignedDate,
			&item.PurchaseDate,
			&item.WarrantyDate,

			&item.AssetStatus,
			&item.StatusLabel,
			&item.Remarks,
			&item.CreatedAt,
			&item.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Unable to read non-operational devices",
				"error":   err.Error(),
			})
			return
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Unable to read non-operational devices",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    items,
	})
}

func (h *AssetDeviceHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))

	limitText := c.DefaultQuery("limit", c.DefaultQuery("page_size", "50"))
	limit, _ := strconv.Atoi(limitText)

	if page < 1 {
		page = 1
	}

	if limit < 1 {
		limit = 50
	}

	if limit > 200 {
		limit = 200
	}

	offset := (page - 1) * limit

	args := make([]any, 0)
	whereParts := []string{
		"WHERE ad.row_status = 1",
	}

	placeholder := 1

	// Optional: ?category=Laptop
	if category := strings.TrimSpace(c.Query("category")); category != "" {
		args = append(args, category)

		whereParts = append(
			whereParts,
			fmt.Sprintf(
				"AND LOWER(COALESCE(ad.category, '')) = LOWER($%d)",
				placeholder,
			),
		)

		placeholder++
	}

	// Optional: ?status=1
	if statusText := strings.TrimSpace(c.Query("status")); statusText != "" {
		status, err := strconv.Atoi(statusText)
		if err != nil {
			response.BadRequest(c, "status must be a valid number")
			return
		}

		args = append(args, status)

		whereParts = append(
			whereParts,
			fmt.Sprintf("AND ad.asset_status = $%d", placeholder),
		)

		placeholder++
	}

	// Optional: ?vendor_id=12
	if vendorIDText := strings.TrimSpace(c.Query("vendor_id")); vendorIDText != "" {
		vendorID, err := strconv.ParseInt(vendorIDText, 10, 64)
		if err != nil {
			response.BadRequest(c, "vendor_id must be a valid number")
			return
		}

		args = append(args, vendorID)

		whereParts = append(
			whereParts,
			fmt.Sprintf("AND ad.vendor_id = $%d", placeholder),
		)

		placeholder++
	}

	// Optional:
	// ?search=DELL
	// Searches serial, employee, category, brand, model and vendor.
	if search := strings.TrimSpace(c.Query("search")); search != "" {
		args = append(args, "%"+search+"%")

		whereParts = append(
			whereParts,
			fmt.Sprintf(`
				AND (
					ad.device_serial ILIKE $%d
					OR ad.emp_id ILIKE $%d
					OR ad.emp_name ILIKE $%d
					OR ad.category ILIKE $%d
					OR ad.brand ILIKE $%d
					OR ad.model ILIKE $%d
					OR v.vendor_name ILIKE $%d
				)
			`,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
			),
		)

		placeholder++
	}

	where := strings.Join(whereParts, "\n")

	// Count query does not require employee image join.
	countSQL := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM public.asset_devices ad
		LEFT JOIN public.vendors v
			ON v.id = ad.vendor_id
		%s
	`, where)

	var total int

	if err := h.db.QueryRow(
		c.Request.Context(),
		countSQL,
		args...,
	).Scan(&total); err != nil {
		response.ServerError(c, err)
		return
	}

	// Add pagination arguments after count query.
	args = append(args, limit, offset)

	listSQL := fmt.Sprintf(`
		SELECT
			ad.id,
			ad.device_serial,
			ad.category,
			ad.brand,
			ad.model,
			ad.device_type,

			ad.asset_status,

			CASE ad.asset_status
	WHEN 0 THEN 'Available'
	WHEN 1 THEN 'Assigned'
	WHEN 2 THEN 'Damaged'
	WHEN 3 THEN 'Transferred'
	WHEN 4 THEN 'Returned'
	WHEN 5 THEN 'Lost'
	WHEN 7 THEN 'Ownership Transfer'
	WHEN 8 THEN 'Claim Raised'
	WHEN 15 THEN 'Service Request'
	ELSE 'Unknown'
END AS status_label,

			ad.emp_id,
			ad.emp_name,
			ep.picture AS employee_image,
			ad.department,
			ad.designation,
			ad.assigned_date::text,

			ad.vendor_id,
			COALESCE(v.vendor_name, NULLIF(BTRIM(ad.vendor_name), '')) AS vendor_name,
			v.vendor_flag,

			ad.mr_number,
			ad.pr_number,

			ad.purchase_date::text,
			ad.warranty_date::text,

			ad.created_at::text,
			ad.updated_at::text

		FROM public.asset_devices ad

		LEFT JOIN public.vendors v
			ON v.id = ad.vendor_id

		LEFT JOIN public.employee_personal_info ep
			ON BTRIM(ep.employee_id) = BTRIM(ad.emp_id)

		%s

		ORDER BY ad.updated_at DESC NULLS LAST, ad.id DESC

		LIMIT $%d OFFSET $%d
	`, where, placeholder, placeholder+1)

	rows, err := h.db.Query(
		c.Request.Context(),
		listSQL,
		args...,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	assets := make([]AssetDevice, 0)

	for rows.Next() {
		var asset AssetDevice

		err := rows.Scan(
			&asset.ID,
			&asset.DeviceSerial,
			&asset.Category,
			&asset.Brand,
			&asset.Model,
			&asset.DeviceType,

			&asset.AssetStatus,
			&asset.StatusLabel,

			&asset.EmpID,
			&asset.EmpName,
			&asset.EmployeeImage,
			&asset.Department,
			&asset.Designation,
			&asset.AssignedDate,

			&asset.VendorID,
			&asset.VendorName,
			&asset.VendorFlag,

			&asset.MRNumber,
			&asset.PRNumber,

			&asset.PurchaseDate,
			&asset.WarrantyDate,

			&asset.CreatedAt,
			&asset.UpdatedAt,
		)

		if err != nil {
			response.ServerError(c, err)
			return
		}

		assets = append(assets, asset)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.Paginated(c, assets, total, page, limit)
}

func (h *AssetDeviceHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		c.JSON(400, gin.H{
			"success": false,
			"error":   "invalid asset device id",
		})
		return
	}

	const sqlQuery = `
		SELECT
			ad.id,
			ad.device_serial,
			ad.category,
			ad.brand,
			ad.model,
			ad.device_type,

			ad.asset_status,

			CASE ad.asset_status
	WHEN 0 THEN 'Available'
	WHEN 1 THEN 'Assigned'
	WHEN 2 THEN 'Damaged'
	WHEN 3 THEN 'Transferred'
	WHEN 4 THEN 'Returned'
	WHEN 5 THEN 'Lost'
	WHEN 7 THEN 'Ownership Transfer'
	WHEN 8 THEN 'Claim Raised'
	WHEN 15 THEN 'Service Request'
	ELSE 'Unknown'
END AS status_label,

			ad.emp_id,
			ad.emp_name,
			ep.picture AS employee_image,
			ad.department,
			ad.designation,
			ad.assigned_date::text,

			ad.vendor_id,
			COALESCE(v.vendor_name, NULLIF(BTRIM(ad.vendor_name), '')) AS vendor_name,
			v.vendor_flag,

			ad.mr_number,
			ad.pr_number,

			ad.purchase_date::text,
			ad.warranty_date::text,

			ad.created_at::text,
			ad.updated_at::text

		FROM public.asset_devices ad

		LEFT JOIN public.vendors v
			ON v.id = ad.vendor_id

		LEFT JOIN public.employee_personal_info ep
			ON BTRIM(ep.employee_id) = BTRIM(ad.emp_id)

		WHERE ad.id = $1
			AND ad.row_status = 1
	`

	var asset AssetDevice

	err = h.db.QueryRow(
		c.Request.Context(),
		sqlQuery,
		id,
	).Scan(
		&asset.ID,
		&asset.DeviceSerial,
		&asset.Category,
		&asset.Brand,
		&asset.Model,
		&asset.DeviceType,

		&asset.AssetStatus,
		&asset.StatusLabel,

		&asset.EmpID,
		&asset.EmpName,
		&asset.EmployeeImage,
		&asset.Department,
		&asset.Designation,
		&asset.AssignedDate,

		&asset.VendorID,
		&asset.VendorName,
		&asset.VendorFlag,

		&asset.MRNumber,
		&asset.PRNumber,

		&asset.PurchaseDate,
		&asset.WarrantyDate,

		&asset.CreatedAt,
		&asset.UpdatedAt,
	)

	if err != nil {
		c.JSON(404, gin.H{
			"success": false,
			"error":   "asset device not found",
		})
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    asset,
	})
}

func (h *AssetDeviceHandler) History(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		c.JSON(400, gin.H{
			"success": false,
			"error":   "invalid asset device id",
		})
		return
	}

	const sqlQuery = `
		SELECT
			h.id,
			h.asset_device_id,
			h.legacy_equipment_id,

			h.device_serial,

			h.status_code,
		CASE h.status_code
			WHEN 0 THEN 'Available'
			WHEN 1 THEN 'Assigned'
			WHEN 2 THEN 'Damaged'
			WHEN 3 THEN 'Transferred'
			WHEN 4 THEN 'Returned'
			WHEN 5 THEN 'Lost'
			WHEN 7 THEN 'Ownership Transfer'
			WHEN 8 THEN 'Claim Raised'
			WHEN 15 THEN 'Service Request'
			ELSE COALESCE(NULLIF(BTRIM(h.raw_status), ''), 'Unknown')
		END AS status_label,


			h.raw_status,

			h.previous_status,
			h.return_status,
			h.transfer_status,

			h.emp_id,
			h.emp_name,
			h.department,
			h.designation,

			h.mr_number,
			h.pr_number,
			h.vendor,

			h.assigned_date::text,
			h.transferred_at::text,
			h.returned_at::text,

			h.history_reason,
			h.created_at_source::text,
			h.updated_at_source::text,
			h.migrated_at::text

		FROM public.asset_device_history h

		WHERE h.asset_device_id = $1

		ORDER BY
			h.updated_at_source DESC NULLS LAST,
			h.created_at_source DESC NULLS LAST,
			h.id DESC
	`

	rows, err := h.db.Query(
		c.Request.Context(),
		sqlQuery,
		id,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	history := make([]AssetDeviceHistory, 0)

	for rows.Next() {
		var item AssetDeviceHistory

		err := rows.Scan(
			&item.ID,
			&item.AssetDeviceID,
			&item.LegacyEquipmentID,

			&item.DeviceSerial,

			&item.StatusCode,
			&item.StatusLabel,
			&item.RawStatus,

			&item.PreviousStatus,
			&item.ReturnStatus,
			&item.TransferStatus,

			&item.EmpID,
			&item.EmpName,
			&item.Department,
			&item.Designation,

			&item.MRNumber,
			&item.PRNumber,
			&item.Vendor,

			&item.AssignedDate,
			&item.TransferredAt,
			&item.ReturnedAt,

			&item.HistoryReason,
			&item.CreatedAtSource,
			&item.UpdatedAtSource,
			&item.MigratedAt,
		)

		if err != nil {
			response.ServerError(c, err)
			return
		}

		history = append(history, item)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	c.JSON(200, gin.H{
		"success": true,
		"data":    history,
	})
}

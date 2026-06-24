//backend/interbal/handler/asset_device.go

package handler

import (
	"fmt"
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
// 	g.GET("/devices", h.List)
// }

func (h *AssetDeviceHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/assets")

	g.GET("/devices", h.List)
	g.GET("/devices/:id", h.GetByID)
}

type AssetDevice struct {
	ID            int64   `json:"id"`
	DeviceSerial  *string `json:"device_serial"`
	Category      *string `json:"category"`
	Brand         *string `json:"brand"`
	Model         *string `json:"model"`
	DeviceType    *string `json:"device_type"`

	AssetStatus   int16   `json:"asset_status"`
	StatusLabel   string  `json:"status_label"`

	EmpID         *string `json:"emp_id"`
	EmpName       *string `json:"emp_name"`
	Department    *string `json:"department"`
	Designation   *string `json:"designation"`
	AssignedDate  *string `json:"assigned_date"`

	VendorID       *int64  `json:"vendor_id"`
	VendorName     *string `json:"vendor_name"`
	VendorFlag     *int16  `json:"vendor_flag"`

	MRNumber       *string `json:"mr_number"`
	PRNumber       *string `json:"pr_number"`

	PurchaseDate   *string `json:"purchase_date"`
	WarrantyDate   *string `json:"warranty_date"`

	CreatedAt      *string `json:"created_at"`
	UpdatedAt      *string `json:"updated_at"`
}

func (h *AssetDeviceHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))

	// Supports both:
	// ?limit=50
	// ?page_size=50
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
			fmt.Sprintf("AND LOWER(COALESCE(ad.category, '')) = LOWER($%d)", placeholder),
		)
		placeholder++
	}

	// Optional: ?status=1
	// 0=Damaged, 1=Assigned, 2=Available, 3=Transferred,
	// 4=Returned, 5=Lost, 7=Ownership Transfer,
	// 8=Claim Raised, 15=Service Request
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
	// searches serial, employee, category, brand, model and vendor
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
			`, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder, placeholder),
		)

		placeholder++
	}

	where := strings.Join(whereParts, "\n")

	// Total count before pagination
	countSQL := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM public.asset_devices ad
		LEFT JOIN public.vendors v
			ON v.id = ad.vendor_id
		%s
	`, where)

	var total int
	if err := h.db.QueryRow(c.Request.Context(), countSQL, args...).Scan(&total); err != nil {
		response.ServerError(c, err)
		return
	}

	// LIMIT and OFFSET placeholders
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
				WHEN 0 THEN 'Damaged'
				WHEN 1 THEN 'Assigned'
				WHEN 2 THEN 'Available'
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
		%s
		ORDER BY ad.updated_at DESC NULLS LAST, ad.id DESC
		LIMIT $%d OFFSET $%d
	`, where, placeholder, placeholder+1)

	rows, err := h.db.Query(c.Request.Context(), listSQL, args...)
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
				WHEN 0 THEN 'Damaged'
				WHEN 1 THEN 'Assigned'
				WHEN 2 THEN 'Available'
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
		WHERE ad.id = $1
		  AND ad.row_status = 1
	`

	var asset AssetDevice

	err = h.db.QueryRow(c.Request.Context(), sqlQuery, id).Scan(
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
//backend/internal/handler/asset_device.go

package handler

import (
	"context"
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

//Add to route group
//for asset device handler for individual routes for asset devices, non-operational assets, ownership, warranty, and service requests.

func (h *AssetDeviceHandler) Register(
	rg *gin.RouterGroup,
) {
	g := rg.Group("/assets")

	// Asset devices.
	g.GET("/devices", h.List)

	// Non-operational assets.
	g.GET(
		"/non-operational/summary",
		h.NonOperationalSummary,
	)
	g.GET(
		"/non-operational",
		h.NonOperationalList,
	)

	// Ownership.
	g.GET(
		"/ownership/summary",
		h.OwnershipSummary,
	)
	g.GET(
		"/ownership",
		h.OwnershipList,
	)

	// Warranty.
	g.GET(
		"/warranty/summary",
		h.WarrantyOverviewSummary,
	)
	g.GET(
		"/warranty/claims",
		h.WarrantyClaimsList,
	)

	// Service Requests.
	g.GET(
		"/service-requests/summary",
		h.ServiceRequestsSummary,
	)
	g.GET(
		"/service-requests/claims",
		h.ServiceRequestsList,
	)

	// Keep parameter routes last.
	g.GET(
		"/devices/:id/history",
		h.History,
	)
	g.GET(
		"/devices/:id",
		h.GetByID,
	)
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

	// Main asset employee assignment information.
	// For damage_inventory-only rows these remain null.
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

	// This belongs only to damage_inventory.
	// It means the person who created the damage report,
	// not the employee assigned to the device.
	DamageCreatedBy *string `json:"damage_created_by"`

	CreatedAt *string `json:"created_at"`
	UpdatedAt *string `json:"updated_at"`
}

type OwnershipSummary struct {
	UserOwnership   int64 `json:"user_ownership"`
	VendorOwnership int64 `json:"vendor_ownership"`
	TotalOwnership  int64 `json:"total_ownership"`

	// Current ownership assets from asset_devices.
	CurrentAssetCount int64 `json:"current_asset_count"`
}

type ClaimModuleCounts struct {
	WarrantyClaimed   int64
	WarrantyToVendor  int64
	WarrantyRecovered int64
	WarrantyExpired   int64

	ServiceRequest  int64
	ServiceToVendor int64
	ServiceClosed   int64
}

type ServiceRequestSummary struct {
	ServiceRequest int64 `json:"service_request"`
	ToVendor       int64 `json:"to_vendor"`
	Closed         int64 `json:"closed"`
	Total          int64 `json:"total"`
}

func (h *AssetDeviceHandler) loadClaimModuleCounts(
	ctx context.Context,
) (ClaimModuleCounts, error) {
	const query = `
		WITH year_bounds AS (
			SELECT
				DATE_TRUNC('year', CURRENT_DATE)::date AS year_start,
				(
					DATE_TRUNC('year', CURRENT_DATE)
					+ INTERVAL '1 year'
				)::date AS next_year_start
		),

		origin_history AS (
			SELECT DISTINCT ON (
				BTRIM(h.claim_reference_no)
			)
				BTRIM(h.claim_reference_no) AS reference_key,

				CASE
					WHEN h.previous_status IN (8, 15)
						THEN h.previous_status

					WHEN h.current_status IN (8, 15)
						THEN h.current_status

					ELSE NULL
				END AS origin_status,

				h.created_at AS opened_at

			FROM public.device_claim_histories h

			WHERE h.claim_reference_no IS NOT NULL
			  AND (
					h.previous_status IN (8, 15)
					OR h.current_status IN (8, 15)
			  )
			  AND COALESCE(h.status, 1) = 1

			ORDER BY
				BTRIM(h.claim_reference_no),
				h.created_at ASC NULLS LAST,
				h.id ASC
		),

		latest_claims AS (
			SELECT DISTINCT ON (
				BTRIM(dc.reference_no_claim::text)
			)
				BTRIM(
					dc.reference_no_claim::text
				) AS reference_key,

				dc.claim_status,
				dc.created_at

			FROM public.device_claims dc

			WHERE dc.reference_no_claim IS NOT NULL
			  AND dc.claim_status IN (8, 9, 10, 15)

			ORDER BY
				BTRIM(dc.reference_no_claim::text),
				dc.created_at DESC NULLS LAST,
				dc.id DESC
		),

		classified_claims AS (
			SELECT
				latest.reference_key,
				latest.claim_status,

				COALESCE(
					origin.origin_status,

					CASE
						WHEN latest.claim_status IN (8, 15)
							THEN latest.claim_status
						ELSE NULL
					END
				) AS origin_status,

				COALESCE(
					origin.opened_at,
					latest.created_at
				) AS opened_at

			FROM latest_claims latest

			LEFT JOIN origin_history origin
				ON origin.reference_key =
				   latest.reference_key
		),

		expired_summary AS (
			SELECT
				COUNT(*)::BIGINT AS expired

			FROM public.asset_devices ad
			CROSS JOIN year_bounds bounds

			WHERE ad.row_status = 1
			  AND ad.warranty_date IS NOT NULL
			  AND ad.warranty_date::date >=
				  bounds.year_start
			  AND ad.warranty_date::date <
				  bounds.next_year_start
			  AND ad.warranty_date::date <
				  CURRENT_DATE
		)

		SELECT
			COUNT(classified.reference_key) FILTER (
				WHERE classified.origin_status = 8
				  AND classified.claim_status = 8
			)::BIGINT AS warranty_claimed,

			COUNT(classified.reference_key) FILTER (
				WHERE classified.origin_status = 8
				  AND classified.claim_status = 9
			)::BIGINT AS warranty_to_vendor,

			COUNT(classified.reference_key) FILTER (
				WHERE classified.origin_status = 8
				  AND classified.claim_status = 10
			)::BIGINT AS warranty_recovered,

			expired.expired AS warranty_expired,

			COUNT(classified.reference_key) FILTER (
				WHERE classified.origin_status = 15
				  AND classified.claim_status = 15
			)::BIGINT AS service_request,

			COUNT(classified.reference_key) FILTER (
				WHERE classified.origin_status = 15
				  AND classified.claim_status = 9
			)::BIGINT AS service_to_vendor,

			COUNT(classified.reference_key) FILTER (
				WHERE classified.origin_status = 15
				  AND classified.claim_status = 10
			)::BIGINT AS service_closed

		FROM year_bounds bounds

		CROSS JOIN expired_summary expired

		LEFT JOIN classified_claims classified
			ON classified.opened_at::date >=
			   bounds.year_start
		   AND classified.opened_at::date <
			   bounds.next_year_start

		GROUP BY expired.expired
	`

	var counts ClaimModuleCounts

	err := h.db.QueryRow(
		ctx,
		query,
	).Scan(
		&counts.WarrantyClaimed,
		&counts.WarrantyToVendor,
		&counts.WarrantyRecovered,
		&counts.WarrantyExpired,
		&counts.ServiceRequest,
		&counts.ServiceToVendor,
		&counts.ServiceClosed,
	)

	return counts, err
}

//Warranty Overview Summary

func (h *AssetDeviceHandler) WarrantyOverviewSummary(
	c *gin.Context,
) {
	counts, err := h.loadClaimModuleCounts(
		c.Request.Context(),
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	summary := WarrantyOverviewSummary{
		Claimed:   counts.WarrantyClaimed,
		ToVendor:  counts.WarrantyToVendor,
		Recovered: counts.WarrantyRecovered,
		Expired:   counts.WarrantyExpired,
	}

	summary.Total =
		summary.Claimed +
			summary.ToVendor +
			summary.Recovered +
			summary.Expired

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total": summary.Total,
			"items": []gin.H{
				{
					"label": "Claimed",
					"value": summary.Claimed,
				},
				{
					"label": "To Vendor",
					"value": summary.ToVendor,
				},
				{
					"label": "Recovered",
					"value": summary.Recovered,
				},
				{
					"label": "Expired",
					"value": summary.Expired,
				},
			},
			"raw": summary,
		},
	})
}

//Service Request Summary

func (h *AssetDeviceHandler) ServiceRequestsSummary(
	c *gin.Context,
) {
	counts, err := h.loadClaimModuleCounts(
		c.Request.Context(),
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	summary := ServiceRequestSummary{
		ServiceRequest: counts.ServiceRequest,
		ToVendor:       counts.ServiceToVendor,
		Closed:         counts.ServiceClosed,
	}

	summary.Total =
		summary.ServiceRequest +
			summary.ToVendor +
			summary.Closed

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total": summary.Total,
			"items": []gin.H{
				{
					"label": "Service Request",
					"value": summary.ServiceRequest,
				},
				{
					"label": "Transferred to Vendor",
					"value": summary.ToVendor,
				},
				{
					"label": "Closed",
					"value": summary.Closed,
				},
			},
			"raw": summary,
		},
	})
}

// ServiceRequestsList returns current-year Service Request rows.
//
// Module classification is based on the first workflow status found in
// device_claim_histories:
//
//	15 = Service Request origin
//
// Current status is read from the latest device_claims row:
//
//	15 = Service Request
//	9  = Transferred to Vendor
//	10 = Closed
func (h *AssetDeviceHandler) ServiceRequestsList(c *gin.Context) {
	status := strings.ToLower(
		strings.TrimSpace(c.DefaultQuery("status", "all")),
	)
	search := strings.TrimSpace(c.Query("search"))

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	switch status {
	case "all",
		"service request",
		"servicerequest",
		"transferred to vendor",
		"transferred",
		"closed":
	default:
		response.BadRequest(
			c,
			"status must be one of: all, Service Request, Transferred to Vendor, Closed",
		)
		return
	}

	switch status {
	case "servicerequest":
		status = "service request"
	case "transferred":
		status = "transferred to vendor"
	}

	offset := (page - 1) * limit

	const baseCTE = `
		WITH year_bounds AS (
			SELECT
				DATE_TRUNC('year', CURRENT_DATE)::date AS year_start,
				(
					DATE_TRUNC('year', CURRENT_DATE)
					+ INTERVAL '1 year'
				)::date AS next_year_start
		),

		origin_history AS (
			SELECT DISTINCT ON (
				BTRIM(h.claim_reference_no)
			)
				BTRIM(h.claim_reference_no) AS reference_key,

				CASE
					WHEN h.previous_status IN (8, 15)
						THEN h.previous_status
					WHEN h.current_status IN (8, 15)
						THEN h.current_status
					ELSE NULL
				END AS origin_status,

				h.created_at AS opened_at

			FROM public.device_claim_histories h

			WHERE h.claim_reference_no IS NOT NULL
			  AND (
					h.previous_status IN (8, 15)
					OR h.current_status IN (8, 15)
			  )
			  AND COALESCE(h.status, 1) = 1

			ORDER BY
				BTRIM(h.claim_reference_no),
				h.created_at ASC NULLS LAST,
				h.id ASC
		),

		status_dates AS (
			SELECT
				BTRIM(h.claim_reference_no) AS reference_key,

				MIN(h.created_at) FILTER (
					WHERE h.current_status = 9
				) AS transferred_at,

				MIN(h.created_at) FILTER (
					WHERE h.current_status = 10
				) AS closed_at

			FROM public.device_claim_histories h

			WHERE h.claim_reference_no IS NOT NULL
			  AND COALESCE(h.status, 1) = 1

			GROUP BY BTRIM(h.claim_reference_no)
		),

		latest_claims AS (
			SELECT DISTINCT ON (
				BTRIM(dc.reference_no_claim::text)
			)
				dc.id,
				BTRIM(dc.reference_no_claim::text) AS reference_key,
				dc.reference_no_claim::text AS reference,
				dc.category,
				dc.brand,
				dc.model_no,
				dc.device_sl_no,
				dc.problems,
				dc.vendor,
				dc.claim_status,
				dc.return_date,
				dc.created_at

			FROM public.device_claims dc

			WHERE dc.reference_no_claim IS NOT NULL
			  AND dc.claim_status IN (8, 9, 10, 15)

			ORDER BY
				BTRIM(dc.reference_no_claim::text),
				dc.created_at DESC NULLS LAST,
				dc.id DESC
		),

		classified_claims AS (
			SELECT
				latest.*,

				COALESCE(
					origin.origin_status,
					CASE
						WHEN latest.claim_status IN (8, 15)
							THEN latest.claim_status
						ELSE NULL
					END
				) AS origin_status,

				COALESCE(
					origin.opened_at,
					latest.created_at
				) AS opened_at,

				dates.transferred_at,
				dates.closed_at

			FROM latest_claims latest

			LEFT JOIN origin_history origin
				ON origin.reference_key = latest.reference_key

			LEFT JOIN status_dates dates
				ON dates.reference_key = latest.reference_key
		),

		service_rows AS (
			SELECT
				cc.id,
				cc.reference,

				NULLIF(BTRIM(ad.emp_name), '') AS employee,
				NULLIF(BTRIM(ad.emp_id), '') AS emp_id,
				NULLIF(BTRIM(ad.department), '') AS department,
				NULLIF(BTRIM(ad.designation), '') AS designation,

				COALESCE(
					NULLIF(BTRIM(cc.category), ''),
					NULLIF(BTRIM(ad.category), '')
				) AS category,

				COALESCE(
					NULLIF(BTRIM(cc.brand), ''),
					NULLIF(BTRIM(ad.brand), '')
				) AS brand,

				COALESCE(
					NULLIF(BTRIM(cc.model_no), ''),
					NULLIF(BTRIM(ad.model), '')
				) AS model,

				COALESCE(
					NULLIF(BTRIM(cc.device_sl_no), ''),
					NULLIF(BTRIM(ad.device_serial), '')
				) AS device_serial,

				ad.warranty_date::text AS warranty_date,

				CASE cc.claim_status
					WHEN 15 THEN 'Service Request'
					WHEN 9 THEN 'Transferred to Vendor'
					WHEN 10 THEN 'Closed'
				END::text AS status,

				COALESCE(
					NULLIF(BTRIM(wv.vendor_name), ''),
					NULLIF(BTRIM(ad.vendor_name), ''),
					cc.vendor::text
				) AS vendor,

				NULLIF(BTRIM(cc.problems), '') AS problems,

				CASE cc.claim_status
					WHEN 15 THEN cc.opened_at
					WHEN 9 THEN COALESCE(
						cc.transferred_at,
						cc.created_at
					)
					WHEN 10 THEN COALESCE(
						cc.closed_at,
						cc.return_date,
						cc.created_at
					)
					ELSE cc.created_at
				END AS sort_at

			FROM classified_claims cc
			CROSS JOIN year_bounds yb

			LEFT JOIN LATERAL (
				SELECT
					ad.emp_name,
					ad.emp_id,
					ad.department,
					ad.designation,
					ad.category,
					ad.brand,
					ad.model,
					ad.device_serial,
					ad.warranty_date,
					ad.vendor_name
				FROM public.asset_devices ad
				WHERE ad.row_status = 1
				  AND ad.device_serial_key = UPPER(
						REGEXP_REPLACE(
							BTRIM(cc.device_sl_no),
							'[^A-Za-z0-9]+',
							'',
							'g'
						)
				  )
				ORDER BY ad.id DESC
				LIMIT 1
			) ad ON TRUE

			LEFT JOIN public.warranty_vendors wv
				ON wv.id = cc.vendor

			WHERE cc.origin_status = 15
			  AND cc.claim_status IN (15, 9, 10)
			  AND cc.opened_at IS NOT NULL
			  AND cc.opened_at::date >= yb.year_start
			  AND cc.opened_at::date < yb.next_year_start
		)
	`

	args := make([]any, 0)
	whereParts := []string{"WHERE 1 = 1"}
	placeholder := 1

	if status != "all" {
		args = append(args, status)
		whereParts = append(
			whereParts,
			fmt.Sprintf(
				"AND LOWER(sr.status) = $%d",
				placeholder,
			),
		)
		placeholder++
	}

	if search != "" {
		args = append(args, "%"+search+"%")
		whereParts = append(
			whereParts,
			fmt.Sprintf(`
				AND (
					COALESCE(sr.reference, '') ILIKE $%d
					OR COALESCE(sr.employee, '') ILIKE $%d
					OR COALESCE(sr.emp_id, '') ILIKE $%d
					OR COALESCE(sr.department, '') ILIKE $%d
					OR COALESCE(sr.designation, '') ILIKE $%d
					OR COALESCE(sr.category, '') ILIKE $%d
					OR COALESCE(sr.brand, '') ILIKE $%d
					OR COALESCE(sr.model, '') ILIKE $%d
					OR COALESCE(sr.device_serial, '') ILIKE $%d
					OR COALESCE(sr.vendor, '') ILIKE $%d
					OR COALESCE(sr.problems, '') ILIKE $%d
				)
			`,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
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

	whereClause := strings.Join(whereParts, "\n")

	countSQL := fmt.Sprintf(`
		%s

		SELECT COUNT(*)
		FROM service_rows sr
		%s
	`, baseCTE, whereClause)

	var total int
	if err := h.db.QueryRow(
		c.Request.Context(),
		countSQL,
		args...,
	).Scan(&total); err != nil {
		response.ServerError(c, err)
		return
	}

	listArgs := append(
		append([]any{}, args...),
		limit,
		offset,
	)

	listSQL := fmt.Sprintf(`
		%s

		SELECT
			sr.id,
			sr.reference,
			sr.employee,
			sr.emp_id,
			sr.department,
			sr.designation,
			sr.category,
			sr.brand,
			sr.model,
			sr.device_serial,
			sr.warranty_date,
			sr.status,
			sr.vendor,
			sr.problems,
			sr.sort_at::text AS created_at

		FROM service_rows sr
		%s

		ORDER BY
			CASE sr.status
				WHEN 'Service Request' THEN 1
				WHEN 'Transferred to Vendor' THEN 2
				WHEN 'Closed' THEN 3
				ELSE 4
			END,
			sr.sort_at DESC NULLS LAST,
			sr.id DESC

		LIMIT $%d
		OFFSET $%d
	`,
		baseCTE,
		whereClause,
		placeholder,
		placeholder+1,
	)

	rows, err := h.db.Query(
		c.Request.Context(),
		listSQL,
		listArgs...,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]WarrantyClaimItem, 0)

	for rows.Next() {
		var item WarrantyClaimItem

		if err := rows.Scan(
			&item.ID,
			&item.Reference,
			&item.Employee,
			&item.EmpID,
			&item.Department,
			&item.Designation,
			&item.Category,
			&item.Brand,
			&item.Model,
			&item.DeviceSerial,
			&item.WarrantyDate,
			&item.Status,
			&item.Vendor,
			&item.Problems,
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

	response.Paginated(
		c,
		items,
		total,
		page,
		limit,
	)
}

//Warranty Claims List

func (h *AssetDeviceHandler) WarrantyClaimsList(c *gin.Context) {
	status := strings.ToLower(
		strings.TrimSpace(
			c.DefaultQuery("status", "all"),
		),
	)

	search := strings.TrimSpace(c.Query("search"))

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit < 1 {
		limit = 20
	}

	if limit > 100 {
		limit = 100
	}

	switch status {
	case "all", "claimed", "to vendor", "tovendor", "recovered", "expired":
	default:
		response.BadRequest(
			c,
			"status must be one of: all, Claimed, To Vendor, Recovered, Expired",
		)
		return
	}

	if status == "tovendor" {
		status = "to vendor"
	}

	offset := (page - 1) * limit

	const baseCTE = `
		WITH year_bounds AS (
			SELECT
				DATE_TRUNC('year', CURRENT_DATE)::date AS year_start,
				(DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year')::date AS next_year_start
		),

		claimed_rows AS (
			SELECT
				ad.id,
				ad.id::text AS reference,

				NULLIF(BTRIM(ad.emp_name), '') AS employee,
				NULLIF(BTRIM(ad.emp_id), '') AS emp_id,
				NULLIF(BTRIM(ad.department), '') AS department,
				NULLIF(BTRIM(ad.designation), '') AS designation,

				NULLIF(BTRIM(ad.category), '') AS category,
				NULLIF(BTRIM(ad.brand), '') AS brand,
				NULLIF(BTRIM(ad.model), '') AS model,
				NULLIF(BTRIM(ad.device_serial), '') AS device_serial,

				ad.warranty_date::text AS warranty_date,

				'Claimed'::text AS status,

				NULLIF(BTRIM(ad.vendor_name), '') AS vendor,
				NULL::text AS problems,

				COALESCE(ad.updated_at, ad.created_at) AS sort_at

			FROM public.asset_devices ad
			WHERE ad.asset_status = 8
			  AND ad.row_status = 1
		),

	to_vendor_rows AS (
    SELECT DISTINCT ON (dc.reference_no_claim)
        dc.id,
        dc.reference_no_claim::text AS reference,

        NULLIF(BTRIM(ad.emp_name), '') AS employee,
        NULLIF(BTRIM(ad.emp_id), '') AS emp_id,
        NULLIF(BTRIM(ad.department), '') AS department,
        NULLIF(BTRIM(ad.designation), '') AS designation,

        COALESCE(
            NULLIF(BTRIM(dc.category), ''),
            NULLIF(BTRIM(ad.category), '')
        ) AS category,

        COALESCE(
            NULLIF(BTRIM(dc.brand), ''),
            NULLIF(BTRIM(ad.brand), '')
        ) AS brand,

        COALESCE(
            NULLIF(BTRIM(dc.model_no), ''),
            NULLIF(BTRIM(ad.model), '')
        ) AS model,

        COALESCE(
            NULLIF(BTRIM(dc.device_sl_no), ''),
            NULLIF(BTRIM(ad.device_serial), '')
        ) AS device_serial,

        ad.warranty_date::text AS warranty_date,

        'To Vendor'::text AS status,

        COALESCE(
            NULLIF(BTRIM(wv.vendor_name), ''),
            NULLIF(BTRIM(ad.vendor_name), ''),
            dc.vendor::text
        ) AS vendor,

        NULLIF(BTRIM(dc.problems), '') AS problems,

        dc.created_at AS sort_at

    FROM public.device_claims dc

    CROSS JOIN year_bounds yb

    LEFT JOIN LATERAL (
        SELECT
            ad.emp_name,
            ad.emp_id,
            ad.department,
            ad.designation,
            ad.category,
            ad.brand,
            ad.model,
            ad.device_serial,
            ad.warranty_date,
            ad.vendor_name
        FROM public.asset_devices ad
        WHERE ad.row_status = 1
          AND ad.device_serial_key = UPPER(
              REGEXP_REPLACE(
                  BTRIM(dc.device_sl_no),
                  '[^A-Za-z0-9]+',
                  '',
                  'g'
              )
          )
        ORDER BY ad.id DESC
        LIMIT 1
    ) ad ON TRUE

    LEFT JOIN public.warranty_vendors wv
        ON wv.id = dc.vendor

    WHERE dc.claim_status = 9
      AND dc.reference_no_claim IS NOT NULL
      AND dc.created_at IS NOT NULL
      AND dc.created_at::date >= yb.year_start
      AND dc.created_at::date < yb.next_year_start

    ORDER BY
        dc.reference_no_claim,
        dc.created_at DESC NULLS LAST,
        dc.id DESC
),

	recovered_rows AS (
    SELECT DISTINCT ON (dc.reference_no_claim)
        dc.id,
        dc.reference_no_claim::text AS reference,

        NULLIF(BTRIM(ad.emp_name), '') AS employee,
        NULLIF(BTRIM(ad.emp_id), '') AS emp_id,
        NULLIF(BTRIM(ad.department), '') AS department,
        NULLIF(BTRIM(ad.designation), '') AS designation,

        COALESCE(
            NULLIF(BTRIM(dc.category), ''),
            NULLIF(BTRIM(ad.category), '')
        ) AS category,

        COALESCE(
            NULLIF(BTRIM(dc.brand), ''),
            NULLIF(BTRIM(ad.brand), '')
        ) AS brand,

        COALESCE(
            NULLIF(BTRIM(dc.model_no), ''),
            NULLIF(BTRIM(ad.model), '')
        ) AS model,

        COALESCE(
            NULLIF(BTRIM(dc.device_sl_no), ''),
            NULLIF(BTRIM(ad.device_serial), '')
        ) AS device_serial,

        ad.warranty_date::text AS warranty_date,

        'Recovered'::text AS status,

        COALESCE(
            NULLIF(BTRIM(wv.vendor_name), ''),
            NULLIF(BTRIM(ad.vendor_name), ''),
            dc.vendor::text
        ) AS vendor,

        NULLIF(BTRIM(dc.problems), '') AS problems,

        dc.return_date AS sort_at

    FROM public.device_claims dc

    CROSS JOIN year_bounds yb

    LEFT JOIN LATERAL (
        SELECT
            ad.emp_name,
            ad.emp_id,
            ad.department,
            ad.designation,
            ad.category,
            ad.brand,
            ad.model,
            ad.device_serial,
            ad.warranty_date,
            ad.vendor_name
        FROM public.asset_devices ad
        WHERE ad.row_status = 1
          AND ad.device_serial_key = UPPER(
              REGEXP_REPLACE(
                  BTRIM(dc.device_sl_no),
                  '[^A-Za-z0-9]+',
                  '',
                  'g'
              )
          )
        ORDER BY ad.id DESC
        LIMIT 1
    ) ad ON TRUE

    LEFT JOIN public.warranty_vendors wv
        ON wv.id = dc.vendor

    WHERE dc.claim_status = 10
      AND dc.reference_no_claim IS NOT NULL
      AND dc.return_date IS NOT NULL
      AND dc.return_date::date >= yb.year_start
      AND dc.return_date::date < yb.next_year_start

    ORDER BY
        dc.reference_no_claim,
        dc.return_date DESC NULLS LAST,
        dc.id DESC
),
		expired_rows AS (
			SELECT
				ad.id,
				ad.id::text AS reference,

				NULLIF(BTRIM(ad.emp_name), '') AS employee,
				NULLIF(BTRIM(ad.emp_id), '') AS emp_id,
				NULLIF(BTRIM(ad.department), '') AS department,
				NULLIF(BTRIM(ad.designation), '') AS designation,

				NULLIF(BTRIM(ad.category), '') AS category,
				NULLIF(BTRIM(ad.brand), '') AS brand,
				NULLIF(BTRIM(ad.model), '') AS model,
				NULLIF(BTRIM(ad.device_serial), '') AS device_serial,

				ad.warranty_date::text AS warranty_date,

				'Expired'::text AS status,

				NULLIF(BTRIM(ad.vendor_name), '') AS vendor,
				NULL::text AS problems,

				ad.warranty_date::timestamp AS sort_at

			FROM public.asset_devices ad

			CROSS JOIN year_bounds yb

			WHERE ad.row_status = 1
			  AND ad.warranty_date IS NOT NULL
			  AND ad.warranty_date::date >= yb.year_start
			  AND ad.warranty_date::date < yb.next_year_start
			  AND ad.warranty_date::date < CURRENT_DATE
		),

		warranty_rows AS (
			SELECT
				id,
				reference,
				employee,
				emp_id,
				department,
				designation,
				category,
				brand,
				model,
				device_serial,
				warranty_date,
				status,
				vendor,
				problems,
				sort_at
			FROM claimed_rows

			UNION ALL

			SELECT
				id,
				reference,
				employee,
				emp_id,
				department,
				designation,
				category,
				brand,
				model,
				device_serial,
				warranty_date,
				status,
				vendor,
				problems,
				sort_at
			FROM to_vendor_rows

			UNION ALL

			SELECT
				id,
				reference,
				employee,
				emp_id,
				department,
				designation,
				category,
				brand,
				model,
				device_serial,
				warranty_date,
				status,
				vendor,
				problems,
				sort_at
			FROM recovered_rows

			UNION ALL

			SELECT
				id,
				reference,
				employee,
				emp_id,
				department,
				designation,
				category,
				brand,
				model,
				device_serial,
				warranty_date,
				status,
				vendor,
				problems,
				sort_at
			FROM expired_rows
		)
	`

	args := make([]any, 0)
	whereParts := []string{"WHERE 1 = 1"}
	placeholder := 1

	if status != "all" {
		args = append(args, status)

		whereParts = append(
			whereParts,
			fmt.Sprintf(
				"AND LOWER(wr.status) = $%d",
				placeholder,
			),
		)

		placeholder++
	}

	if search != "" {
		args = append(args, "%"+search+"%")

		whereParts = append(
			whereParts,
			fmt.Sprintf(`
				AND (
					COALESCE(wr.reference, '') ILIKE $%d
					OR COALESCE(wr.employee, '') ILIKE $%d
					OR COALESCE(wr.emp_id, '') ILIKE $%d
					OR COALESCE(wr.department, '') ILIKE $%d
					OR COALESCE(wr.designation, '') ILIKE $%d
					OR COALESCE(wr.category, '') ILIKE $%d
					OR COALESCE(wr.brand, '') ILIKE $%d
					OR COALESCE(wr.model, '') ILIKE $%d
					OR COALESCE(wr.device_serial, '') ILIKE $%d
					OR COALESCE(wr.vendor, '') ILIKE $%d
				)
			`,
				placeholder,
				placeholder,
				placeholder,
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

	whereClause := strings.Join(whereParts, "\n")

	countSQL := fmt.Sprintf(`
		%s

		SELECT COUNT(*)
		FROM warranty_rows wr

		%s
	`, baseCTE, whereClause)

	var total int

	if err := h.db.QueryRow(
		c.Request.Context(),
		countSQL,
		args...,
	).Scan(&total); err != nil {
		response.ServerError(c, err)
		return
	}

	listArgs := append(
		append([]any{}, args...),
		limit,
		offset,
	)

	listSQL := fmt.Sprintf(`
		%s

		SELECT
			wr.id,
			wr.reference,
			wr.employee,
			wr.emp_id,
			wr.department,
			wr.designation,
			wr.category,
			wr.brand,
			wr.model,
			wr.device_serial,
			wr.warranty_date,
			wr.status,
			wr.vendor,
			wr.problems,
			wr.sort_at::text AS created_at

		FROM warranty_rows wr

		%s

		ORDER BY
			CASE wr.status
				WHEN 'Claimed' THEN 1
				WHEN 'To Vendor' THEN 2
				WHEN 'Recovered' THEN 3
				WHEN 'Expired' THEN 4
				ELSE 5
			END,

			wr.sort_at DESC NULLS LAST,
			wr.id DESC

		LIMIT $%d
		OFFSET $%d
	`,
		baseCTE,
		whereClause,
		placeholder,
		placeholder+1,
	)

	rows, err := h.db.Query(
		c.Request.Context(),
		listSQL,
		listArgs...,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]WarrantyClaimItem, 0)

	for rows.Next() {
		var item WarrantyClaimItem

		if err := rows.Scan(
			&item.ID,
			&item.Reference,
			&item.Employee,
			&item.EmpID,
			&item.Department,
			&item.Designation,
			&item.Category,
			&item.Brand,
			&item.Model,
			&item.DeviceSerial,
			&item.WarrantyDate,
			&item.Status,
			&item.Vendor,
			&item.Problems,
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

	response.Paginated(
		c,
		items,
		total,
		page,
		limit,
	)
}

type OwnershipAsset struct {
	ID int64 `json:"id"`

	Reference string `json:"reference"`

	OwnershipCategory int16  `json:"ownership_category"`
	OwnershipType     string `json:"ownership_type"`

	DeviceSerial *string `json:"device_serial"`
	Category     *string `json:"category"`
	Brand        *string `json:"brand"`
	Model        *string `json:"model"`

	EmpID       *string `json:"emp_id"`
	EmpName     *string `json:"emp_name"`
	Department  *string `json:"department"`
	Designation *string `json:"designation"`

	AssignedDate *string `json:"assigned_date"`
	PurchaseDate *string `json:"purchase_date"`
	WarrantyDate *string `json:"warranty_date"`

	TransferDate *string `json:"transfer_date"`
	Remarks      *string `json:"remarks"`

	AssetStatus int16  `json:"asset_status"`
	StatusLabel string `json:"status_label"`

	CreatedAt *string `json:"created_at"`
	UpdatedAt *string `json:"updated_at"`
}

type WarrantyOverviewSummary struct {
	Claimed   int64 `json:"claimed"`
	ToVendor  int64 `json:"to_vendor"`
	Recovered int64 `json:"recovered"`
	Expired   int64 `json:"expired"`
	Total     int64 `json:"total"`
}

type WarrantyClaimItem struct {
	ID           int64   `json:"id"`
	Reference    string  `json:"reference"`
	Employee     *string `json:"employee"`
	EmpID        *string `json:"emp_id"`
	Department   *string `json:"department"`
	Designation  *string `json:"designation"`
	Category     *string `json:"category"`
	Brand        *string `json:"brand"`
	Model        *string `json:"model"`
	DeviceSerial *string `json:"device_serial"`
	WarrantyDate *string `json:"warranty_date"`
	Status       string  `json:"status"`
	Vendor       *string `json:"vendor"`
	Problems     *string `json:"problems"`
	CreatedAt    *string `json:"created_at"`
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
					  AND row_status = 1
				) AS ownership,

				COUNT(*) FILTER (
					WHERE asset_status = 2
					  AND row_status = 1
				) AS main_table_damaged,

				COUNT(*) FILTER (
					WHERE asset_status = 5
					  AND row_status = 1
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
			   AND ad.row_status = 1
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

func (h *AssetDeviceHandler) OwnershipSummary(c *gin.Context) {
	const query = `
		SELECT
			COUNT(*) FILTER (
				WHERE owst_category = 1
				  AND status = 1
			) AS user_ownership,

			COUNT(*) FILTER (
				WHERE owst_category = 2
				  AND status = 1
			) AS vendor_ownership,

			COUNT(*) FILTER (
				WHERE owst_category IN (1, 2)
				  AND status = 1
			) AS total_ownership,

			(
				SELECT COUNT(*)
				FROM public.asset_devices
				WHERE asset_status = 7
				  AND row_status = 1
			) AS current_asset_count

		FROM public.ownership_transfers
	`

	var summary OwnershipSummary

	err := h.db.QueryRow(
		c.Request.Context(),
		query,
	).Scan(
		&summary.UserOwnership,
		&summary.VendorOwnership,
		&summary.TotalOwnership,
		&summary.CurrentAssetCount,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}

func (h *AssetDeviceHandler) OwnershipList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}

	if limit < 1 {
		limit = 20
	}

	if limit > 100 {
		limit = 100
	}

	category := strings.ToLower(
		strings.TrimSpace(c.DefaultQuery("category", "all")),
	)

	var categoryValue *int16

	switch category {
	case "all":
		categoryValue = nil

	case "user":
		value := int16(1)
		categoryValue = &value

	case "vendor":
		value := int16(2)
		categoryValue = &value

	default:
		response.BadRequest(c, "category must be one of: all, user, vendor")
		return
	}

	search := strings.TrimSpace(c.Query("search"))
	offset := (page - 1) * limit

	args := make([]any, 0)

	whereParts := []string{
		"WHERE ot.status = 1",
		"AND ot.owst_category IN (1, 2)",
		"AND NULLIF(BTRIM(ot.device_sl_no), '') IS NOT NULL",
	}

	placeholder := 1

	if categoryValue != nil {
		args = append(args, *categoryValue)

		whereParts = append(
			whereParts,
			fmt.Sprintf("AND ot.owst_category = $%d", placeholder),
		)

		placeholder++
	}

	if search != "" {
		args = append(args, "%"+search+"%")

		whereParts = append(
			whereParts,
			fmt.Sprintf(`
				AND (
					ot.device_sl_no ILIKE $%d
					OR ot.employee_id ILIKE $%d
					OR ot.item_name ILIKE $%d
					OR COALESCE(ad.emp_id, '') ILIKE $%d
					OR COALESCE(ad.emp_name, '') ILIKE $%d
					OR COALESCE(ad.department, '') ILIKE $%d
					OR COALESCE(ad.designation, '') ILIKE $%d
					OR COALESCE(ad.category, '') ILIKE $%d
					OR COALESCE(ad.brand, '') ILIKE $%d
					OR COALESCE(ad.model, '') ILIKE $%d
				)
			`,
				placeholder,
				placeholder,
				placeholder,
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

	ownershipRowsCTE := `
		WITH ownership_rows AS (
			SELECT
				ot.*,

				UPPER(
					REGEXP_REPLACE(
						BTRIM(ot.device_sl_no),
						'[^A-Za-z0-9]+',
						'',
						'g'
					)
				) AS serial_key

			FROM public.ownership_transfers ot
		)
	`

	countQuery := fmt.Sprintf(`
		%s

		SELECT COUNT(*)

		FROM ownership_rows ot
		LEFT JOIN public.asset_devices ad
			ON ad.device_serial_key = ot.serial_key
		   AND ad.row_status = 1

		%s
	`, ownershipRowsCTE, where)

	var total int

	if err := h.db.QueryRow(
		c.Request.Context(),
		countQuery,
		args...,
	).Scan(&total); err != nil {
		response.ServerError(c, err)
		return
	}

	listArgs := append(args, limit, offset)

	listQuery := fmt.Sprintf(`
		%s

		SELECT
			ot.id,
			ot.id::text AS reference,

			ot.owst_category,

			CASE ot.owst_category
				WHEN 1 THEN 'User'
				WHEN 2 THEN 'Vendor'
				ELSE 'Unknown'
			END AS ownership_type,

			COALESCE(
				NULLIF(BTRIM(ad.device_serial), ''),
				NULLIF(BTRIM(ot.device_sl_no), '')
			) AS device_serial,

			COALESCE(
				NULLIF(BTRIM(ad.category), ''),
				NULLIF(BTRIM(ot.item_name), '')
			) AS category,

			NULLIF(BTRIM(ad.brand), '') AS brand,
			NULLIF(BTRIM(ad.model), '') AS model,

			COALESCE(
				NULLIF(BTRIM(ad.emp_id), ''),
				NULLIF(BTRIM(ot.employee_id), '')
			) AS emp_id,

			NULLIF(BTRIM(ad.emp_name), '') AS emp_name,
			NULLIF(BTRIM(ad.department), '') AS department,
			NULLIF(BTRIM(ad.designation), '') AS designation,

			ad.assigned_date::text,
			ad.purchase_date::text,
			ad.warranty_date::text,

			ot.gate_pass_date::text AS transfer_date,
			NULLIF(BTRIM(ot.remarks), '') AS remarks,

			COALESCE(ad.asset_status, 7)::smallint AS asset_status,

			CASE ot.owst_category
				WHEN 1 THEN 'User Ownership'
				WHEN 2 THEN 'Vendor Ownership'
				ELSE 'Ownership'
			END AS status_label,

			ot.created_at::text,
			COALESCE(ad.updated_at::text, ot.created_at::text) AS updated_at

		FROM ownership_rows ot
		LEFT JOIN public.asset_devices ad
			ON ad.device_serial_key = ot.serial_key
		   AND ad.row_status = 1

		%s

		ORDER BY
			ot.gate_pass_date DESC NULLS LAST,
			ot.id DESC

		LIMIT $%d OFFSET $%d
	`, ownershipRowsCTE, where, placeholder, placeholder+1)

	rows, err := h.db.Query(
		c.Request.Context(),
		listQuery,
		listArgs...,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]OwnershipAsset, 0)

	for rows.Next() {
		var item OwnershipAsset

		if err := rows.Scan(
			&item.ID,
			&item.Reference,

			&item.OwnershipCategory,
			&item.OwnershipType,

			&item.DeviceSerial,
			&item.Category,
			&item.Brand,
			&item.Model,

			&item.EmpID,
			&item.EmpName,
			&item.Department,
			&item.Designation,

			&item.AssignedDate,
			&item.PurchaseDate,
			&item.WarrantyDate,

			&item.TransferDate,
			&item.Remarks,

			&item.AssetStatus,
			&item.StatusLabel,

			&item.CreatedAt,
			&item.UpdatedAt,
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

	response.Paginated(c, items, total, page, limit)
}

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

	// detail is used only for damaged reconciliation cards.
	detail := strings.ToLower(
		strings.TrimSpace(c.DefaultQuery("detail", "all")),
	)

	switch detail {
	case "all", "main_table", "damage_inventory", "duplicates", "inventory_only":
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "detail must be one of: all, main_table, damage_inventory, duplicates, inventory_only",
		})
		return
	}

	// Lost and general all-page do not use damaged detail filtering.
	if status != "damaged" {
		detail = "all"
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
				di.created_by,
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
				created_by,
				created_at,
				normalized_serial_key
			FROM raw_damage_source
			ORDER BY
				normalized_serial_key,
				created_at DESC NULLS LAST,
				id DESC
		),

		non_operational_rows AS (
			/*
				Main/current assets.

				For asset_status = 2:
				Employee information comes directly from asset_devices.

				For asset_status = 5:
				Employee information also comes directly from asset_devices.
			*/
			SELECT
				ad.id,
				'asset_devices'::text AS source,
				ad.id AS source_id,

				ad.device_serial,
				ad.category,
				ad.brand,
				ad.model,

				NULLIF(BTRIM(ad.emp_id), '') AS emp_id,
				NULLIF(BTRIM(ad.emp_name), '') AS emp_name,
				NULLIF(BTRIM(ad.department), '') AS department,
				NULLIF(BTRIM(ad.designation), '') AS designation,

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
				NULL::text AS damage_created_by,

				ad.created_at::text,
				ad.updated_at::text
FROM public.asset_devices ad
WHERE ad.row_status = 1
  AND (
        /*
            Default non-operational page:
            damaged main assets + lost assets.
        */
        (
            $1 = 'all'
            AND $2 = 'all'
            AND ad.asset_status IN (2, 5)
        )

        /*
            Lost page.
        */
        OR (
            $1 = 'lost'
            AND ad.asset_status = 5
        )

        /*
            Main Table Damaged:
            only asset_devices rows where asset_status = 2.
        */
        OR (
            $1 = 'damaged'
            AND $2 IN ('all', 'main_table')
            AND ad.asset_status = 2
        )
  )

			UNION ALL

			/*
				Damage-inventory-only records.

				These do not have a confirmed assigned employee.
				created_by is returned as damage_created_by only.
			*/
			SELECT
				-ds.id AS id,
				'damage_inventory'::text AS source,
				ds.id AS source_id,

				ds.device_sl_no AS device_serial,
				ds.device_category AS category,
				NULL::text AS brand,
				ds.model,

				NULL::text AS emp_id,
				NULL::text AS emp_name,
				NULLIF(BTRIM(ds.department), '') AS department,
				NULL::text AS designation,

				NULL::text AS mr_number,
				NULL::text AS pr_number,

				NULL::text AS assigned_date,
				NULL::text AS purchase_date,
				NULL::text AS warranty_date,

				2::smallint AS asset_status,
				'Damaged'::text AS status_label,

				NULLIF(BTRIM(ds.remarks), '') AS remarks,
				NULLIF(BTRIM(ds.created_by), '') AS damage_created_by,

				ds.created_at::text AS created_at,
				ds.created_at::text AS updated_at

			FROM damage_source ds
			LEFT JOIN public.asset_devices ad
				ON ad.device_serial_key = ds.normalized_serial_key
			   AND ad.row_status = 1

			WHERE (
    /*
        Normal damaged page:
        Main Table Damaged + Inventory Only.
    */
    (
        $1 = 'damaged'
        AND $2 IN ('all', 'inventory_only')
        AND ad.id IS NULL
    )

    /*
        Damage Inventory:
        all 265 damage inventory records,
        including duplicate and inventory-only records.
    */
    OR (
        $1 = 'damaged'
        AND $2 = 'damage_inventory'
    )

    /*
        Duplicate Devices:
        only damage inventory serials already existing
        somewhere in asset_devices.
    */
    OR (
        $1 = 'damaged'
        AND $2 = 'duplicates'
        AND ad.id IS NOT NULL
    )

    /*
        General all non-operational page:
        show only inventory-only damage rows.
    */
    OR (
        $1 = 'all'
        AND $2 = 'all'
        AND ad.id IS NULL
    )
)
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
			damage_created_by,
			created_at,
			updated_at

		FROM non_operational_rows

		ORDER BY
			CASE
				WHEN source = 'asset_devices' THEN 0
				WHEN source = 'damage_inventory' THEN 1
				ELSE 2
			END,

			status_label,
			emp_name NULLS LAST,
			device_serial NULLS LAST,
			id DESC
	`

	rows, err := h.db.Query(
		c.Request.Context(),
		query,
		status,
		detail,
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
			&item.DamageCreatedBy,
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
		c.JSON(http.StatusBadRequest, gin.H{
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
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "asset device not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    asset,
	})
}

func (h *AssetDeviceHandler) History(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{
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

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    history,
	})
}

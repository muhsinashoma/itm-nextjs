package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type assetReassignRequestV21 struct {
	EmployeeID       string                          `json:"employee_id" binding:"required"`
	Remarks          string                          `json:"remarks"`
	TechnicalDetails assetAssignmentTechnicalDetails `json:"technical_details"`
}

func assetStatusActionLabelV21(status int) string {
	switch status {
	case 0:
		return "Available Date"
	case 1:
		return "Assigned Date"
	case 2:
		return "Damaged Date"
	case 3:
		return "Transferred Date"
	case 4:
		return "Returned Date"
	case 5:
		return "Lost Date"
	case 7:
		return "Ownership Transfer Date"
	case 8:
		return "Claim Raised Date"
	case 15:
		return "Service Request Date"
	default:
		return "Action Date"
	}
}

// ActivityPageV21 returns the current asset table already ordered by the
// latest date that produced each asset's current status. This makes the
// "All Status" view globally latest-first instead of sorting only one page
// after pagination.
func (h *AssetDeviceAssignmentHandler) ActivityPageV21(c *gin.Context) {
	page, _ := strconv.Atoi(strings.TrimSpace(c.DefaultQuery("page", "1")))
	limit, _ := strconv.Atoi(strings.TrimSpace(c.DefaultQuery("limit", "50")))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	var statusArg any
	if rawStatus := strings.TrimSpace(c.Query("status")); rawStatus != "" {
		statusValue, err := strconv.Atoi(rawStatus)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid asset status"})
			return
		}
		statusArg = statusValue
	}

	category := strings.TrimSpace(c.Query("category"))
	search := strings.TrimSpace(c.Query("search"))
	offset := (page - 1) * limit

	const whereSQL = `
		WHERE COALESCE(ad.row_status, 1) = 1
		  AND ($1::int IS NULL OR ad.asset_status = $1::int)
		  AND (
				BTRIM($2::text) = ''
				OR BTRIM(COALESCE(ad.category, '')) ILIKE '%' || BTRIM($2::text) || '%'
		  )
		  AND (
				BTRIM($3::text) = ''
				OR BTRIM(COALESCE(ad.mr_number, '')) ILIKE '%' || BTRIM($3::text) || '%'
				OR BTRIM(COALESCE(ad.pr_number, '')) ILIKE '%' || BTRIM($3::text) || '%'
				OR BTRIM(COALESCE(ad.emp_id, '')) ILIKE '%' || BTRIM($3::text) || '%'
				OR BTRIM(COALESCE(ad.device_serial, '')) ILIKE '%' || BTRIM($3::text) || '%'
		  )
	`

	var total int
	countSQL := `SELECT COUNT(*) FROM public.asset_devices AS ad ` + whereSQL
	if err := h.db.QueryRow(
		c.Request.Context(),
		countSQL,
		statusArg,
		category,
		search,
	).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	query := `
		SELECT
			to_jsonb(ad)
			|| jsonb_build_object(
				'status_label',
					CASE COALESCE(ad.asset_status, 0)
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
					END,
				'stock_inventory_id', stock_row.id,
				'employee_image', COALESCE(current_personal.picture, ''),
				'status_action_date', action_info.action_at,
				'status_action_label',
					CASE COALESCE(ad.asset_status, 0)
						WHEN 0 THEN 'Available Date'
						WHEN 1 THEN 'Assigned Date'
						WHEN 2 THEN 'Damaged Date'
						WHEN 3 THEN 'Transferred Date'
						WHEN 4 THEN 'Returned Date'
						WHEN 5 THEN 'Lost Date'
						WHEN 7 THEN 'Ownership Transfer Date'
						WHEN 8 THEN 'Claim Raised Date'
						WHEN 15 THEN 'Service Request Date'
						ELSE 'Action Date'
					END,
				'history_reason',
					CASE
						WHEN ad.asset_status = 1 THEN
							COALESCE(NULLIF(BTRIM(active_assignment.assignment_remarks), ''), status_history.history_reason, '')
						ELSE COALESCE(status_history.history_reason, '')
					END,
				'previous_assignment',
					CASE
						WHEN previous_assignment.id IS NULL THEN NULL
						ELSE jsonb_build_object(
							'id', previous_assignment.id,
							'employee_id', COALESCE(previous_assignment.emp_id, ''),
							'employee_name',
								COALESCE(
									NULLIF(BTRIM(previous_office.employee_name), ''),
									previous_assignment.emp_name,
									''
								),
							'employee_image', COALESCE(previous_personal.picture, ''),
							'department',
								COALESCE(
									NULLIF(BTRIM(previous_office.department_name), ''),
									previous_assignment.department,
									''
								),
							'designation',
								COALESCE(
									NULLIF(BTRIM(previous_office.designation), ''),
									previous_assignment.designation,
									''
								),
							'status_code', COALESCE(previous_assignment.status_code, 1),
							'status_label',
								CASE COALESCE(previous_assignment.status_code, 1)
									WHEN 1 THEN 'Assigned'
									WHEN 2 THEN 'Damaged'
									WHEN 3 THEN 'Transferred'
									WHEN 4 THEN 'Returned'
									WHEN 5 THEN 'Lost'
									WHEN 7 THEN 'Ownership Transfer'
									WHEN 8 THEN 'Claim Raised'
									WHEN 15 THEN 'Service Request'
									ELSE 'Previous'
								END,
							'assigned_at', previous_assignment.assigned_at,
							'ended_at', previous_assignment.ended_at,
							'assignment_remarks', COALESCE(previous_assignment.assignment_remarks, ''),
							'end_remarks', COALESCE(previous_assignment.end_remarks, ''),
							'end_reason', COALESCE(previous_assignment.end_reason, '')
						)
					END,
				'last_emp_id',
					CASE
						WHEN ad.asset_status = 4 THEN COALESCE(previous_assignment.emp_id, '')
						ELSE ''
					END,
				'last_emp_name',
					CASE
						WHEN ad.asset_status = 4 THEN
							COALESCE(
								NULLIF(BTRIM(previous_office.employee_name), ''),
								previous_assignment.emp_name,
								''
							)
						ELSE ''
					END,
				'last_employee_image',
					CASE
						WHEN ad.asset_status = 4 THEN COALESCE(previous_personal.picture, '')
						ELSE ''
					END,
				'last_department',
					CASE
						WHEN ad.asset_status = 4 THEN
							COALESCE(
								NULLIF(BTRIM(previous_office.department_name), ''),
								previous_assignment.department,
								''
							)
						ELSE ''
					END,
				'last_designation',
					CASE
						WHEN ad.asset_status = 4 THEN
							COALESCE(
								NULLIF(BTRIM(previous_office.designation), ''),
								previous_assignment.designation,
								''
							)
						ELSE ''
					END
			) AS item_json,
			action_info.action_at
		FROM public.asset_devices AS ad

		LEFT JOIN LATERAL (
			SELECT s.id
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
		) AS stock_row ON TRUE

		LEFT JOIN LATERAL (
			SELECT p.picture
			FROM public.employee_personal_info AS p
			WHERE LOWER(BTRIM(COALESCE(p.employee_id, ''))) =
			      LOWER(BTRIM(COALESCE(ad.emp_id, '')))
			LIMIT 1
		) AS current_personal ON TRUE

		LEFT JOIN LATERAL (
			SELECT aa.assigned_at, COALESCE(aa.assignment_remarks, '') AS assignment_remarks
			FROM public.asset_device_assignments AS aa
			WHERE aa.asset_device_id = ad.id
			  AND aa.ended_at IS NULL
			ORDER BY aa.assigned_at DESC, aa.id DESC
			LIMIT 1
		) AS active_assignment ON TRUE

		LEFT JOIN LATERAL (
			SELECT aa.ended_at
			FROM public.asset_device_assignments AS aa
			WHERE aa.asset_device_id = ad.id
			  AND aa.ended_at IS NOT NULL
			  AND COALESCE(aa.status_code, 1) = COALESCE(ad.asset_status, 0)
			ORDER BY aa.ended_at DESC, aa.id DESC
			LIMIT 1
		) AS status_assignment ON TRUE

		LEFT JOIN LATERAL (
			SELECT
				COALESCE(
					CASE WHEN ad.asset_status = 4 THEN h.returned_at END,
					CASE WHEN ad.asset_status = 3 THEN h.transferred_at END,
					h.updated_at_source,
					h.created_at_source,
					h.migrated_at
				) AS action_at,
				COALESCE(h.history_reason, '') AS history_reason
			FROM public.asset_device_history AS h
			WHERE h.asset_device_id = ad.id
			  AND h.status_code = ad.asset_status
			ORDER BY
				COALESCE(
					CASE WHEN ad.asset_status = 4 THEN h.returned_at END,
					CASE WHEN ad.asset_status = 3 THEN h.transferred_at END,
					h.updated_at_source,
					h.created_at_source,
					h.migrated_at
				) DESC NULLS LAST,
				h.id DESC
			LIMIT 1
		) AS status_history ON TRUE

		LEFT JOIN LATERAL (
			SELECT
				aa.id,
				aa.emp_id,
				aa.emp_name,
				aa.department,
				aa.designation,
				COALESCE(aa.status_code, 1) AS status_code,
				aa.assigned_at,
				aa.ended_at,
				aa.assignment_remarks,
				aa.end_remarks,
				aa.end_reason
			FROM public.asset_device_assignments AS aa
			WHERE aa.asset_device_id = ad.id
			  AND aa.ended_at IS NOT NULL
			ORDER BY aa.ended_at DESC, aa.id DESC
			LIMIT 1
		) AS previous_assignment ON TRUE

		LEFT JOIN LATERAL (
			SELECT
				o.employee_name,
				o.department_name,
				o.designation
			FROM public.employee_office_info AS o
			WHERE LOWER(BTRIM(COALESCE(o.employee_id, ''))) =
			      LOWER(BTRIM(COALESCE(previous_assignment.emp_id, '')))
			LIMIT 1
		) AS previous_office ON TRUE

		LEFT JOIN LATERAL (
			SELECT p.picture
			FROM public.employee_personal_info AS p
			WHERE LOWER(BTRIM(COALESCE(p.employee_id, ''))) =
			      LOWER(BTRIM(COALESCE(previous_assignment.emp_id, '')))
			LIMIT 1
		) AS previous_personal ON TRUE

		CROSS JOIN LATERAL (
			SELECT COALESCE(
				CASE WHEN ad.asset_status = 1 THEN active_assignment.assigned_at END,
				CASE WHEN ad.asset_status IN (3, 4) THEN status_assignment.ended_at END,
				status_history.action_at,
				CASE WHEN ad.asset_status = 1 THEN ad.assigned_date END,
				ad.updated_at,
				ad.created_at,
				NOW()
			) AS action_at
		) AS action_info
	` + whereSQL + `
		ORDER BY action_info.action_at DESC NULLS LAST, ad.id DESC
		LIMIT $4 OFFSET $5
	`

	rows, err := h.db.Query(
		c.Request.Context(),
		query,
		statusArg,
		category,
		search,
		limit,
		offset,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]json.RawMessage, 0, limit)
	for rows.Next() {
		var payload []byte
		var actionAt time.Time
		if err := rows.Scan(&payload, &actionAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}
		items = append(items, json.RawMessage(payload))
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	totalPages := 1
	if total > 0 {
		totalPages = (total + limit - 1) / limit
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"data":        items,
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
	})
}

// ReassignV21 closes the prior holder as Transferred (3) and creates one
// new active assignment as Assigned (1). Return history stays immutable in
// asset_device_history even when a Returned assignment is later reclassified
// as the previous Transferred assignment during reassignment.
func (h *AssetDeviceAssignmentHandler) ReassignV21(c *gin.Context) {
	ctx := c.Request.Context()

	assetID, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || assetID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid asset device id"})
		return
	}

	var req assetReassignRequestV21
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "employee_id is required"})
		return
	}

	req.EmployeeID = strings.TrimSpace(req.EmployeeID)
	req.Remarks = strings.TrimSpace(req.Remarks)
	req.TechnicalDetails = normalizeAssignmentTechnicalDetails(req.TechnicalDetails)

	if req.EmployeeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "employee_id is required"})
		return
	}
	if len(req.Remarks) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "remarks cannot exceed 1000 characters"})
		return
	}
	if validationError := validateAssignmentTechnicalDetails(req.TechnicalDetails); validationError != "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": validationError})
		return
	}

	normalizedLAN, macErr := normalizeMACAddress(req.TechnicalDetails.LANMACAddress)
	if macErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "LAN-MAC " + macErr.Error()})
		return
	}
	normalizedWLAN, macErr := normalizeMACAddress(req.TechnicalDetails.WLANMACAddress)
	if macErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "WLAN-MAC " + macErr.Error()})
		return
	}
	if normalizedLAN != "" && normalizedWLAN != "" && normalizedLAN == normalizedWLAN {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "LAN-MAC and WLAN-MAC must be different addresses"})
		return
	}
	req.TechnicalDetails.LANMACAddress = normalizedLAN
	req.TechnicalDetails.WLANMACAddress = normalizedWLAN

	actor := strings.TrimSpace(c.GetString("employee_id"))
	if actor == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "authenticated IT employee context is required"})
		return
	}

	tx, err := h.db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "unable to start reassignment transaction"})
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var (
		deviceSerial         string
		previousStatus       int
		rowStatus            int
		previousEmployeeID   string
		previousEmployeeName string
		previousDepartment   string
		previousDesignation  string
		previousAssignedAt   sql.NullTime
		legacyStackID        sql.NullInt64
		mrNumber             string
		prNumber             string
		vendorName           string
	)

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			COALESCE(device_serial, ''),
			COALESCE(asset_status, 0),
			COALESCE(row_status, 1),
			COALESCE(emp_id, ''),
			COALESCE(emp_name, ''),
			COALESCE(department, ''),
			COALESCE(designation, ''),
			assigned_date,
			legacy_stack_id,
			COALESCE(mr_number, ''),
			COALESCE(pr_number, ''),
			COALESCE(vendor_name, '')
		FROM public.asset_devices
		WHERE id = $1
		FOR UPDATE
		`,
		assetID,
	).Scan(
		&deviceSerial,
		&previousStatus,
		&rowStatus,
		&previousEmployeeID,
		&previousEmployeeName,
		&previousDepartment,
		&previousDesignation,
		&previousAssignedAt,
		&legacyStackID,
		&mrNumber,
		&prNumber,
		&vendorName,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "asset device not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}
	if rowStatus != 1 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": "asset device is not active"})
		return
	}
	if previousStatus != 1 && previousStatus != 3 && previousStatus != 4 {
		c.JSON(http.StatusConflict, gin.H{
			"success":        false,
			"error":          "only Assigned, Transferred or Returned devices can be reassigned",
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
			BTRIM(COALESCE(employee_id, '')),
			BTRIM(COALESCE(employee_name, '')),
			BTRIM(COALESCE(department_name, '')),
			BTRIM(COALESCE(designation, ''))
		FROM public.employee_office_info
		WHERE LOWER(BTRIM(COALESCE(employee_id, ''))) = LOWER(BTRIM($1::text))
		  AND LOWER(BTRIM(COALESCE(active, ''))) IN ('active', 'yes')
		LIMIT 1
		`,
		req.EmployeeID,
	).Scan(&employeeID, &employeeName, &department, &designation)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "selected employee does not exist or is not active"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	var (
		previousAssignmentID         int64
		previousAssignmentStatusCode int
	)

	activeErr := tx.QueryRow(
		ctx,
		`
		SELECT
			id,
			COALESCE(emp_id, ''),
			COALESCE(emp_name, ''),
			COALESCE(department, ''),
			COALESCE(designation, ''),
			assigned_at,
			COALESCE(status_code, 1)
		FROM public.asset_device_assignments
		WHERE asset_device_id = $1
		  AND ended_at IS NULL
		ORDER BY assigned_at DESC, id DESC
		LIMIT 1
		FOR UPDATE
		`,
		assetID,
	).Scan(
		&previousAssignmentID,
		&previousEmployeeID,
		&previousEmployeeName,
		&previousDepartment,
		&previousDesignation,
		&previousAssignedAt,
		&previousAssignmentStatusCode,
	)
	if activeErr != nil && !errors.Is(activeErr, pgx.ErrNoRows) {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": activeErr.Error()})
		return
	}

	if activeErr == nil {
		if strings.EqualFold(strings.TrimSpace(previousEmployeeID), employeeID) {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error":   "select a different employee; this employee already holds the device",
			})
			return
		}

		_, err = tx.Exec(
			ctx,
			`
			UPDATE public.asset_device_assignments
			SET
				ended_at = NOW(),
				end_reason = 'TRANSFERRED',
				status_code = 3,
				end_remarks = COALESCE(NULLIF($1, ''), end_remarks),
				ended_by = $2,
				updated_at = NOW()
			WHERE id = $3
			`,
			req.Remarks,
			actor,
			previousAssignmentID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}
		previousAssignmentStatusCode = 3
	} else {
		// Returned/Transferred rows often have no active holder. Reuse the
		// latest ended assignment as the previous holder and explicitly mark
		// that previous record as Transferred for the new reassignment chain.
		latestErr := tx.QueryRow(
			ctx,
			`
			SELECT
				id,
				COALESCE(emp_id, ''),
				COALESCE(emp_name, ''),
				COALESCE(department, ''),
				COALESCE(designation, ''),
				assigned_at,
				COALESCE(status_code, 1)
			FROM public.asset_device_assignments
			WHERE asset_device_id = $1
			  AND ended_at IS NOT NULL
			ORDER BY ended_at DESC, id DESC
			LIMIT 1
			FOR UPDATE
			`,
			assetID,
		).Scan(
			&previousAssignmentID,
			&previousEmployeeID,
			&previousEmployeeName,
			&previousDepartment,
			&previousDesignation,
			&previousAssignedAt,
			&previousAssignmentStatusCode,
		)
		if latestErr != nil && !errors.Is(latestErr, pgx.ErrNoRows) {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": latestErr.Error()})
			return
		}

		if latestErr == nil {
			if strings.EqualFold(strings.TrimSpace(previousEmployeeID), employeeID) {
				c.JSON(http.StatusConflict, gin.H{
					"success": false,
					"error":   "select a different employee; this employee was the previous holder",
				})
				return
			}

			_, err = tx.Exec(
				ctx,
				`
				UPDATE public.asset_device_assignments
				SET
					ended_at = NOW(),
					end_reason = 'TRANSFERRED',
					status_code = 3,
					end_remarks = COALESCE(NULLIF($1, ''), end_remarks),
					ended_by = $2,
					updated_at = NOW()
				WHERE id = $3
				`,
				req.Remarks,
				actor,
				previousAssignmentID,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
				return
			}
			previousAssignmentStatusCode = 3
		}
	}

	if previousAssignmentID == 0 && strings.TrimSpace(previousEmployeeID) == "" {
		// Compatibility fallback for Returns completed before the assignment
		// ledger was synchronized. Recover the previous holder from immutable
		// asset_device_history, then create the Transferred ledger row below.
		var historyAssignedAt sql.NullTime
		historyErr := tx.QueryRow(
			ctx,
			`
			SELECT
				COALESCE(emp_id, ''),
				COALESCE(emp_name, ''),
				COALESCE(department, ''),
				COALESCE(designation, ''),
				assigned_date
			FROM public.asset_device_history
			WHERE asset_device_id = $1
			  AND NULLIF(BTRIM(COALESCE(emp_id, '')), '') IS NOT NULL
			ORDER BY
				COALESCE(
					returned_at,
					transferred_at,
					updated_at_source,
					created_at_source,
					migrated_at
				) DESC NULLS LAST,
				id DESC
			LIMIT 1
			`,
			assetID,
		).Scan(
			&previousEmployeeID,
			&previousEmployeeName,
			&previousDepartment,
			&previousDesignation,
			&historyAssignedAt,
		)
		if historyErr != nil && !errors.Is(historyErr, pgx.ErrNoRows) {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": historyErr.Error()})
			return
		}
		if historyErr == nil && historyAssignedAt.Valid {
			previousAssignedAt = historyAssignedAt
		}
	}

	if previousAssignmentID == 0 && strings.TrimSpace(previousEmployeeID) != "" {
		assignedAt := time.Now()
		if previousAssignedAt.Valid {
			assignedAt = previousAssignedAt.Time
		}

		err = tx.QueryRow(
			ctx,
			`
			INSERT INTO public.asset_device_assignments (
				asset_device_id,
				emp_id,
				emp_name,
				department,
				designation,
				assignment_source,
				status_code,
				assigned_at,
				ended_at,
				end_reason,
				end_remarks,
				created_by,
				ended_by,
				created_at,
				updated_at
			)
			VALUES (
				$1,$2,$3,$4,$5,
				'LEGACY',3,$6,NOW(),'TRANSFERRED',NULLIF($7,''),$8,$8,NOW(),NOW()
			)
			RETURNING id
			`,
			assetID,
			previousEmployeeID,
			previousEmployeeName,
			previousDepartment,
			previousDesignation,
			assignedAt,
			req.Remarks,
			actor,
		).Scan(&previousAssignmentID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}
		previousAssignmentStatusCode = 3
	}

	if strings.TrimSpace(previousEmployeeID) != "" {
		transferReason := "Previous assignment closed as Transferred during reassignment"
		if req.Remarks != "" {
			transferReason += ": " + req.Remarks
		}

		_, err = tx.Exec(
			ctx,
			`
			INSERT INTO public.asset_device_history (
				asset_device_id, legacy_equipment_id, device_serial,
				status_code, raw_status, previous_status,
				emp_id, emp_name, department, designation,
				mr_number, pr_number, vendor, assigned_date, transferred_at,
				history_reason, created_at_source, updated_at_source, migrated_at
			)
			VALUES (
				$1, NULL, $2,
				3, 'Transferred', $3,
				$4, $5, $6, $7,
				$8, $9, $10, $11, NOW(),
				$12, NOW(), NOW(), NOW()
			)
			`,
			assetID,
			deviceSerial,
			previousStatus,
			previousEmployeeID,
			previousEmployeeName,
			previousDepartment,
			previousDesignation,
			mrNumber,
			prNumber,
			vendorName,
			previousAssignedAt,
			transferReason,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}
	}

	_, err = tx.Exec(
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
			asset_status = 1,
			emp_id = $14,
			emp_name = $15,
			department = $16,
			designation = $17,
			assigned_date = NOW(),
			updated_at = NOW()
		WHERE id = $18
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
	)
	if err != nil {
		if isMACUniqueViolation(err) {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"error":   "LAN-MAC or WLAN-MAC is already assigned to another asset device",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	var previousAssignmentArg any
	if previousAssignmentID > 0 {
		previousAssignmentArg = previousAssignmentID
	}

	var newAssignmentID int64
	err = tx.QueryRow(
		ctx,
		`
		INSERT INTO public.asset_device_assignments (
			asset_device_id,
			emp_id,
			emp_name,
			department,
			designation,
			assignment_source,
			status_code,
			assigned_at,
			assignment_remarks,
			previous_assignment_id,
			created_by,
			created_at,
			updated_at
		)
		VALUES (
			$1,$2,$3,$4,$5,
			'REASSIGN',1,NOW(),NULLIF($6,''),$7,$8,NOW(),NOW()
		)
		RETURNING id
		`,
		assetID,
		employeeID,
		employeeName,
		department,
		designation,
		req.Remarks,
		previousAssignmentArg,
		actor,
	).Scan(&newAssignmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	assignedReason := "Device assigned to new employee after transfer"
	if req.Remarks != "" {
		assignedReason += ": " + req.Remarks
	}
	assignedPreviousStatus := previousStatus
	if previousAssignmentStatusCode == 3 || strings.TrimSpace(previousEmployeeID) != "" {
		assignedPreviousStatus = 3
	}

	_, err = tx.Exec(
		ctx,
		`
		INSERT INTO public.asset_device_history (
			asset_device_id, legacy_equipment_id, device_serial,
			status_code, raw_status, previous_status,
			emp_id, emp_name, department, designation,
			mr_number, pr_number, vendor, assigned_date,
			history_reason, created_at_source, updated_at_source, migrated_at
		)
		VALUES (
			$1, NULL, $2,
			1, 'Assigned', $3,
			$4, $5, $6, $7,
			$8, $9, $10, NOW(),
			$11, NOW(), NOW(), NOW()
		)
		`,
		assetID,
		deviceSerial,
		assignedPreviousStatus,
		employeeID,
		employeeName,
		department,
		designation,
		mrNumber,
		prNumber,
		vendorName,
		assignedReason,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	var legacyStackArg any
	if legacyStackID.Valid {
		legacyStackArg = legacyStackID.Int64
	}

	var stockInventoryID int64
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
	if stockErr != nil && !errors.Is(stockErr, pgx.ErrNoRows) {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": stockErr.Error()})
		return
	}
	if stockErr == nil {
		_, err = tx.Exec(
			ctx,
			`
			UPDATE public.stack_inventory
			SET
				device_assigned_status = 1,
				device_assiged_date = NOW(),
				device_assiged_by = $1,
				edited_by = $1,
				edited_at = NOW()
			WHERE id = $2
			`,
			actor,
			stockInventoryID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}
	}

	if err = tx.Commit(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	_, _ = h.db.Exec(
		ctx,
		`INSERT INTO public.audit_log (user_id, table_name, record_id, action, new_data)
		 VALUES ($1, 'asset_devices', $2, 'REASSIGN_ASSET',
		 jsonb_build_object(
			'employee_id',$3,
			'previous_status',$4,
			'previous_assignment_id',$5,
			'new_assignment_id',$6
		 ))`,
		actor,
		assetID,
		employeeID,
		previousStatus,
		previousAssignmentArg,
		newAssignmentID,
	)

	c.JSON(http.StatusOK, gin.H{
		"success":                true,
		"asset_id":               assetID,
		"asset_status":           1,
		"status_label":           "Assigned",
		"employee_id":            employeeID,
		"employee_name":          employeeName,
		"new_assignment_id":      newAssignmentID,
		"previous_assignment_id": previousAssignmentArg,
		"previous_status":        previousStatus,
		"previous_employee_id":   previousEmployeeID,
		"device_serial":          deviceSerial,
		"previous_record_status": 3,
		"new_record_status":      1,
	})
}

package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type assetDeviceConditionHandler struct {
	db *pgxpool.Pool
}

type assetDeviceConditionRequest struct {
	Remarks string `json:"remarks"`
}

type assetDeviceConditionSnapshot struct {
	AssetStatus  int
	DeviceSerial string
	EmpID        string
	EmpName      string
	Department   string
	Designation  string
	MRNumber     string
	PRNumber     string
	VendorName   string
	AssignedDate *time.Time
}

func RegisterAssetDeviceConditionRoutes(
	rg *gin.RouterGroup,
	db *pgxpool.Pool,
) {
	handler := &assetDeviceConditionHandler{db: db}

	rg.POST(
		"/assets/devices/:id/damaged",
		handler.MarkDamaged,
	)
	rg.POST(
		"/assets/devices/:id/lost",
		handler.MarkLost,
	)
}

func (h *assetDeviceConditionHandler) MarkDamaged(
	c *gin.Context,
) {
	h.setCondition(c, 2, "Damaged", "DAMAGED")
}

func (h *assetDeviceConditionHandler) MarkLost(
	c *gin.Context,
) {
	h.setCondition(c, 5, "Lost", "LOST")
}

func (h *assetDeviceConditionHandler) setCondition(
	c *gin.Context,
	statusCode int,
	statusLabel string,
	endReason string,
) {
	id, err := strconv.ParseInt(
		strings.TrimSpace(c.Param("id")),
		10,
		64,
	)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid asset device id")
		return
	}

	var req assetDeviceConditionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid condition request")
		return
	}

	req.Remarks = strings.TrimSpace(req.Remarks)
	if req.Remarks == "" {
		response.BadRequest(
			c,
			fmt.Sprintf("%s remarks are required", strings.ToLower(statusLabel)),
		)
		return
	}

	ctx := c.Request.Context()

	tx, err := h.db.BeginTx(
		ctx,
		pgx.TxOptions{IsoLevel: pgx.Serializable},
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var asset assetDeviceConditionSnapshot

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			COALESCE(asset_status, 0),
			COALESCE(device_serial, ''),
			COALESCE(emp_id, ''),
			COALESCE(emp_name, ''),
			COALESCE(department, ''),
			COALESCE(designation, ''),
			COALESCE(mr_number, ''),
			COALESCE(pr_number, ''),
			COALESCE(vendor_name, ''),
			assigned_date
		FROM public.asset_devices
		WHERE id = $1
		  AND COALESCE(row_status, 1) = 1
		FOR UPDATE
		`,
		id,
	).Scan(
		&asset.AssetStatus,
		&asset.DeviceSerial,
		&asset.EmpID,
		&asset.EmpName,
		&asset.Department,
		&asset.Designation,
		&asset.MRNumber,
		&asset.PRNumber,
		&asset.VendorName,
		&asset.AssignedDate,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "asset device not found")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if asset.AssetStatus == statusCode {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error": fmt.Sprintf(
					"device is already %s",
					statusLabel,
				),
			},
		)
		return
	}

	switch asset.AssetStatus {
	case 0, 1, 3, 4:
		// Supported operational source states.
	default:
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error": fmt.Sprintf(
					"cannot mark a %s device as %s from this workflow",
					conditionStatusLabel(asset.AssetStatus),
					statusLabel,
				),
			},
		)
		return
	}

	actor := strings.TrimSpace(
		c.GetString("employee_id"),
	)

	if statusCode == 2 {
		_, err = tx.Exec(
			ctx,
			`
			UPDATE public.asset_devices
			SET
				asset_status = $2,
				damage_remarks = NULLIF($3, ''),
				updated_at = NOW()
			WHERE id = $1
			`,
			id,
			statusCode,
			req.Remarks,
		)
	} else {
		_, err = tx.Exec(
			ctx,
			`
			UPDATE public.asset_devices
			SET
				asset_status = $2,
				updated_at = NOW()
			WHERE id = $1
			`,
			id,
			statusCode,
		)
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}

	// If an active employee assignment exists, close it with the same
	// lifecycle status. Employee fields on asset_devices are intentionally
	// retained so the responsible holder remains visible for accountability.
	assignmentResult, err := tx.Exec(
		ctx,
		`
		UPDATE public.asset_device_assignments
		SET
			ended_at = NOW(),
			end_reason = $1,
			status_code = $2,
			end_remarks = NULLIF($3, ''),
			ended_by = NULLIF($4, ''),
			updated_at = NOW()
		WHERE asset_device_id = $5
		  AND ended_at IS NULL
		`,
		endReason,
		statusCode,
		req.Remarks,
		actor,
		id,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	// Compatibility for older Assigned rows that have an employee snapshot
	// but no assignment-ledger record.
	if assignmentResult.RowsAffected() == 0 &&
		asset.AssetStatus == 1 &&
		strings.TrimSpace(asset.EmpID) != "" {

		assignedAt := time.Now()
		if asset.AssignedDate != nil {
			assignedAt = *asset.AssignedDate
		}

		_, err = tx.Exec(
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
				'LEGACY',$6,$7,NOW(),$8,
				NULLIF($9,''),NULLIF($10,''),NULLIF($10,''),
				NOW(),NOW()
			)
			`,
			id,
			asset.EmpID,
			asset.EmpName,
			asset.Department,
			asset.Designation,
			statusCode,
			assignedAt,
			endReason,
			req.Remarks,
			actor,
		)
		if err != nil {
			response.ServerError(c, err)
			return
		}
	}

	historyReason := fmt.Sprintf(
		"Device marked as %s: %s",
		statusLabel,
		req.Remarks,
	)

	_, err = tx.Exec(
		ctx,
		`
		INSERT INTO public.asset_device_history (
			asset_device_id,
			legacy_equipment_id,
			device_serial,
			status_code,
			raw_status,
			previous_status,
			emp_id,
			emp_name,
			department,
			designation,
			mr_number,
			pr_number,
			vendor,
			assigned_date,
			history_reason,
			created_at_source,
			updated_at_source,
			migrated_at,
			source_snapshot
		)
		SELECT
			$1,
			NULL,
			$2,
			$3,
			$4,
			$5,
			$6,
			$7,
			$8,
			$9,
			$10,
			$11,
			$12,
			$13,
			$14,
			NOW(),
			NOW(),
			NOW(),
			to_jsonb(ad)
		FROM public.asset_devices ad
		WHERE ad.id = $1
		`,
		id,
		asset.DeviceSerial,
		statusCode,
		statusLabel,
		asset.AssetStatus,
		asset.EmpID,
		asset.EmpName,
		asset.Department,
		asset.Designation,
		asset.MRNumber,
		asset.PRNumber,
		asset.VendorName,
		asset.AssignedDate,
		historyReason,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if err = tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		gin.H{
			"asset_id":     id,
			"asset_status": statusCode,
			"status_label": statusLabel,
			"remarks":      req.Remarks,
		},
	)
}

func conditionStatusLabel(
	status int,
) string {
	switch status {
	case 0:
		return "Available"
	case 1:
		return "Assigned"
	case 2:
		return "Damaged"
	case 3:
		return "Transferred"
	case 4:
		return "Returned"
	case 5:
		return "Lost"
	case 7:
		return "OWST"
	case 8:
		return "Claim Raised"
	case 15:
		return "Service Request"
	default:
		return fmt.Sprintf("Status %d", status)
	}
}

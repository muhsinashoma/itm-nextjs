package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type assetDeviceOWSTPrintHandler struct {
	db *pgxpool.Pool
}

func RegisterAssetDeviceOWSTPrintRoutes(
	rg *gin.RouterGroup,
	db *pgxpool.Pool,
) {
	handler := &assetDeviceOWSTPrintHandler{db: db}

	rg.GET(
		"/assets/devices/:id/owst/print-data",
		handler.GetLatestOWSTPrintData,
	)
}

func (h *assetDeviceOWSTPrintHandler) GetLatestOWSTPrintData(
	c *gin.Context,
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

	ctx := c.Request.Context()

	type owstPrintData struct {
		ID                   int64  `json:"id"`
		ReferenceNo          int64  `json:"reference_no"`
		OWSTCategory         int    `json:"owst_category"`
		EmployeeID           string `json:"employee_id"`
		DeductedAmount       string `json:"deducted_amount"`
		DeviceAge            string `json:"device_age"`
		ReceiverID           string `json:"receiver_id"`
		GatePassDate         string `json:"gate_pass_date"`
		ItemName             string `json:"item_name"`
		ItemDescription      string `json:"item_description"`
		Unit                 string `json:"unit"`
		Quantity             string `json:"quantity"`
		DeviceSerialNo       string `json:"device_sl_no"`
		Remarks              string `json:"remarks"`
		CreatedBy            string `json:"created_by"`
		CreatedAt            string `json:"created_at"`
		CompanyMaterial      int    `json:"company_material"`
		NonRefundable        int    `json:"non_refundable"`
		ReceiverAddress      string `json:"receiver_address"`
		VendorName           string `json:"vendor_name"`
		VendorAddress        string `json:"vendor_address"`
		VendorMobile         string `json:"vendor_mobile"`
		VendorDeductedAmount string `json:"vendor_deducted_amount"`
		VendorOthers         string `json:"vendor_others"`
		AttachFile           string `json:"attach_file"`
	}

	var item owstPrintData

	err = h.db.QueryRow(
		ctx,
		`
		WITH asset AS (
			SELECT
				id,
				COALESCE(device_serial, '') AS device_serial
			FROM public.asset_devices
			WHERE id = $1
			  AND row_status = 1
		)
		SELECT
			ot.id,
			ot.id AS reference_no,
			COALESCE(ot.owst_category, 0),
			COALESCE(ot.employee_id, ''),
			COALESCE(ot.deducted_amount, 0)::text,
			COALESCE(ot.device_age, ''),
			COALESCE(ot.receiver_id, ''),
			COALESCE(
				TO_CHAR(ot.gate_pass_date, 'YYYY-MM-DD'),
				''
			),
			COALESCE(ot.item_name, ''),
			COALESCE(ot.item_description, ''),
			COALESCE(ot.unit, ''),
			COALESCE(ot.quantity, 0)::text,
			COALESCE(ot.device_sl_no, ''),
			COALESCE(ot.remarks, ''),
			COALESCE(ot.created_by, ''),
			COALESCE(
				TO_CHAR(
					ot.created_at,
					'YYYY-MM-DD"T"HH24:MI:SS'
				),
				''
			),
			COALESCE(ot.company_material, 0),
			COALESCE(ot.non_refundable, 0),
			COALESCE(ot.receiver_address, ''),
			COALESCE(ot.vendor_name, ''),
			COALESCE(ot.vendor_address, ''),
			COALESCE(ot.vendor_mobile, ''),
			COALESCE(ot.vendor_deducted_amount, 0)::text,
			COALESCE(ot.vendor_others, ''),
			COALESCE(ot.attach_file, '')
		FROM public.ownership_transfers ot
		CROSS JOIN asset a
		WHERE
			COALESCE(ot.status, 1) = 1
			AND (
				ot.device_assigned_id = a.id
				OR (
					NULLIF(BTRIM(ot.device_sl_no), '') IS NOT NULL
					AND BTRIM(ot.device_sl_no) = BTRIM(a.device_serial)
				)
			)
		ORDER BY
			CASE
				WHEN ot.device_assigned_id = a.id THEN 0
				ELSE 1
			END,
			ot.id DESC
		LIMIT 1
		`,
		id,
	).Scan(
		&item.ID,
		&item.ReferenceNo,
		&item.OWSTCategory,
		&item.EmployeeID,
		&item.DeductedAmount,
		&item.DeviceAge,
		&item.ReceiverID,
		&item.GatePassDate,
		&item.ItemName,
		&item.ItemDescription,
		&item.Unit,
		&item.Quantity,
		&item.DeviceSerialNo,
		&item.Remarks,
		&item.CreatedBy,
		&item.CreatedAt,
		&item.CompanyMaterial,
		&item.NonRefundable,
		&item.ReceiverAddress,
		&item.VendorName,
		&item.VendorAddress,
		&item.VendorMobile,
		&item.VendorDeductedAmount,
		&item.VendorOthers,
		&item.AttachFile,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(
			http.StatusNotFound,
			gin.H{
				"success": false,
				"error":   "OWST record not found for this asset",
			},
		)
		return
	}

	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, item)
}

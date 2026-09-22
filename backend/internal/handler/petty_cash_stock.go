package handler

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type pettyCashInputItem struct {
	CategoryID     int64  `json:"category_id"`
	BrandID        int64  `json:"brand_id"`
	ModelID        int64  `json:"model_id"`
	SerialNo       string `json:"serial_no"`
	PurchaseDate   string `json:"purchase_date"`
	WarrantyMonths int    `json:"warranty_months"`
	VendorID       int64  `json:"vendor_id"`

	CPU        string `json:"cpu"`
	RAM        string `json:"ram"`
	SSD        string `json:"ssd"`
	Monitor    string `json:"monitor"`
	Remarks    string `json:"remarks"`
	DeviceType string `json:"device_type"`
}

type pettyCashRequest struct {
	Items []pettyCashInputItem `json:"items"`
}

type pettyCashValidationRow struct {
	RowNo       int      `json:"row_no"`
	SerialNo    string   `json:"serial_no"`
	Status      string   `json:"status"`
	Reason      string   `json:"reason,omitempty"`
	ExistingMRs []string `json:"existing_mrs,omitempty"`
	ExistingPRs []string `json:"existing_prs,omitempty"`
}

type pettyCashValidationResult struct {
	Total                 int                      `json:"total"`
	NewCount              int                      `json:"new_count"`
	ExistingCount         int                      `json:"existing_count"`
	DuplicateRequestCount int                      `json:"duplicate_request_count"`
	SkippedCount          int                      `json:"skipped_count"`
	CanImport             bool                     `json:"can_import"`
	Rows                  []pettyCashValidationRow `json:"rows"`
}

type pettyCashQueryer interface {
	QueryRow(context.Context, string, ...any) pgx.Row
	Query(context.Context, string, ...any) (pgx.Rows, error)
}

type pettyCashMasterData struct {
	CategoryName string
	BrandName    string
	ModelName    string
	VendorName   string
}

func normalizePettyCashSerial(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func parsePettyCashPurchaseDate(value string) (time.Time, error) {
	value = strings.TrimSpace(value)

	if value == "" {
		return time.Time{}, fmt.Errorf("purchase date is required")
	}

	date, err := time.Parse("2006-01-02", value)
	if err != nil {
		return time.Time{}, fmt.Errorf("purchase date must be YYYY-MM-DD")
	}

	now := time.Now()
	today := time.Date(
		now.Year(),
		now.Month(),
		now.Day(),
		0, 0, 0, 0,
		now.Location(),
	)

	if date.After(today) {
		return time.Time{}, fmt.Errorf("purchase date cannot be in the future")
	}

	return date, nil
}

func addPettyCashWarrantyMonths(date time.Time, months int) time.Time {
	rawMonth := int(date.Month()) - 1 + months
	targetYear := date.Year() + rawMonth/12
	targetMonth := time.Month(rawMonth%12 + 1)

	firstNextMonth := time.Date(
		targetYear,
		targetMonth+1,
		1,
		0, 0, 0, 0,
		date.Location(),
	)

	lastDay := firstNextMonth.AddDate(0, 0, -1).Day()
	day := date.Day()

	if day > lastDay {
		day = lastDay
	}

	return time.Date(
		targetYear,
		targetMonth,
		day,
		0, 0, 0, 0,
		date.Location(),
	)
}

func validatePettyCashMasterData(
	ctx context.Context,
	q pettyCashQueryer,
	item pettyCashInputItem,
	rowNo int,
) (pettyCashMasterData, time.Time, time.Time, error) {
	var master pettyCashMasterData

	serial := normalizePettyCashSerial(item.SerialNo)

	if item.CategoryID <= 0 {
		return master, time.Time{}, time.Time{}, fmt.Errorf("Row #%d: category is required", rowNo)
	}
	if item.BrandID <= 0 {
		return master, time.Time{}, time.Time{}, fmt.Errorf("Row #%d: brand is required", rowNo)
	}
	if item.ModelID <= 0 {
		return master, time.Time{}, time.Time{}, fmt.Errorf("Row #%d: model is required", rowNo)
	}
	if serial == "" {
		return master, time.Time{}, time.Time{}, fmt.Errorf("Row #%d: serial number is required", rowNo)
	}
	if item.VendorID <= 0 {
		return master, time.Time{}, time.Time{}, fmt.Errorf("Row #%d: vendor is required", rowNo)
	}
	if item.WarrantyMonths <= 0 {
		return master, time.Time{}, time.Time{}, fmt.Errorf("Row #%d: warranty duration is required", rowNo)
	}

	purchaseDate, err := parsePettyCashPurchaseDate(item.PurchaseDate)
	if err != nil {
		return master, time.Time{}, time.Time{}, fmt.Errorf("Row #%d: %v", rowNo, err)
	}

	warrantyDate := addPettyCashWarrantyMonths(
		purchaseDate,
		item.WarrantyMonths,
	)

	err = q.QueryRow(ctx, `
		SELECT
			COALESCE(c.inventory_category_list, ''),
			COALESCE(b.inventory_category_list, ''),
			COALESCE(m.inventory_category_list, '')
		FROM public.inventory_categories c
		JOIN public.inventory_categories b
		  ON b.id = $2
		 AND b.parent_id = c.id
		 AND COALESCE(b.status, 1) = 1
		JOIN public.inventory_categories m
		  ON m.id = $3
		 AND m.parent_id = b.id
		 AND COALESCE(m.status, 1) = 1
		WHERE c.id = $1
		  AND COALESCE(c.status, 1) = 1
		LIMIT 1
	`,
		item.CategoryID,
		item.BrandID,
		item.ModelID,
	).Scan(
		&master.CategoryName,
		&master.BrandName,
		&master.ModelName,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return master, time.Time{}, time.Time{}, fmt.Errorf(
				"Row #%d: selected Category / Brand / Model relationship is invalid",
				rowNo,
			)
		}

		return master, time.Time{}, time.Time{}, err
	}

	err = q.QueryRow(ctx, `
		SELECT COALESCE(v.vendor_name, '')
		FROM public.vendors v
		LEFT JOIN public.vendor_master_profiles p
		  ON p.vendor_id = v.id
		WHERE v.id = $1
		  AND COALESCE(p.status, 1) = 1
		LIMIT 1
	`, item.VendorID).Scan(&master.VendorName)
	if err != nil {
		if err == pgx.ErrNoRows {
			return master, time.Time{}, time.Time{}, fmt.Errorf(
				"Row #%d: selected vendor is inactive or missing",
				rowNo,
			)
		}

		return master, time.Time{}, time.Time{}, err
	}

	return master, purchaseDate, warrantyDate, nil
}

func lookupExistingPettyCashSerial(
	ctx context.Context,
	q pettyCashQueryer,
	serial string,
) (bool, []string, []string, error) {
	rows, err := q.Query(ctx, `
		SELECT
			COALESCE(mr_number, ''),
			COALESCE(pr_number, '')
		FROM public.asset_devices
		WHERE UPPER(BTRIM(COALESCE(device_serial, ''))) = $1

		UNION ALL

		SELECT
			COALESCE(mr_id, ''),
			COALESCE(pr_id, '')
		FROM public.stack_inventory
		WHERE UPPER(BTRIM(COALESCE(serial_no, ''))) = $1
	`, serial)
	if err != nil {
		return false, nil, nil, err
	}
	defer rows.Close()

	exists := false
	mrSet := map[string]struct{}{}
	prSet := map[string]struct{}{}

	for rows.Next() {
		exists = true

		var mr string
		var pr string

		if err := rows.Scan(&mr, &pr); err != nil {
			return false, nil, nil, err
		}

		mr = strings.TrimSpace(mr)
		pr = strings.TrimSpace(pr)

		if mr != "" {
			mrSet[mr] = struct{}{}
		}

		if pr != "" {
			prSet[pr] = struct{}{}
		}
	}

	if err := rows.Err(); err != nil {
		return false, nil, nil, err
	}

	mrs := make([]string, 0, len(mrSet))
	for value := range mrSet {
		mrs = append(mrs, value)
	}
	sort.Strings(mrs)

	prs := make([]string, 0, len(prSet))
	for value := range prSet {
		prs = append(prs, value)
	}
	sort.Strings(prs)

	return exists, mrs, prs, nil
}

func buildPettyCashValidation(
	ctx context.Context,
	q pettyCashQueryer,
	req pettyCashRequest,
) (pettyCashValidationResult, error) {
	result := pettyCashValidationResult{
		Total: len(req.Items),
		Rows:  make([]pettyCashValidationRow, 0, len(req.Items)),
	}

	if len(req.Items) < 1 || len(req.Items) > 10 {
		return result, fmt.Errorf("Petty Cash quantity must be between 1 and 10")
	}

	seen := map[string]struct{}{}

	for index, item := range req.Items {
		rowNo := index + 1
		serial := normalizePettyCashSerial(item.SerialNo)

		if _, _, _, err := validatePettyCashMasterData(
			ctx,
			q,
			item,
			rowNo,
		); err != nil {
			return result, err
		}

		if _, already := seen[serial]; already {
			result.DuplicateRequestCount++

			result.Rows = append(
				result.Rows,
				pettyCashValidationRow{
					RowNo:    rowNo,
					SerialNo: serial,
					Status:   "DUPLICATE_IN_REQUEST",
					Reason:   "Repeated inside this Petty Cash batch",
				},
			)

			continue
		}

		seen[serial] = struct{}{}

		exists, mrs, prs, err :=
			lookupExistingPettyCashSerial(
				ctx,
				q,
				serial,
			)
		if err != nil {
			return result, err
		}

		if exists {
			result.ExistingCount++

			result.Rows = append(
				result.Rows,
				pettyCashValidationRow{
					RowNo:       rowNo,
					SerialNo:    serial,
					Status:      "EXISTING",
					Reason:      "Serial already exists",
					ExistingMRs: mrs,
					ExistingPRs: prs,
				},
			)

			continue
		}

		result.NewCount++

		result.Rows = append(
			result.Rows,
			pettyCashValidationRow{
				RowNo:    rowNo,
				SerialNo: serial,
				Status:   "NEW",
			},
		)
	}

	result.SkippedCount =
		result.ExistingCount +
			result.DuplicateRequestCount

	result.CanImport =
		result.NewCount > 0

	return result, nil
}

// ValidatePettyCash powers the review modal.
// Existing serials are not treated as a fatal error:
// they are returned as skipped rows.
func (h *StockHandler) ValidatePettyCash(c *gin.Context) {
	ctx := c.Request.Context()

	var req pettyCashRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err :=
		buildPettyCashValidation(
			ctx,
			h.db,
			req,
		)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.OK(c, result)
}

// ImportPettyCash performs the authoritative second serial check
// inside one PostgreSQL transaction.
//
// inventory_type convention:
//
//	1 = MR Type
//	2 = Petty Cash
func (h *StockHandler) ImportPettyCash(c *gin.Context) {
	ctx := c.Request.Context()

	createdBy := strings.TrimSpace(
		c.GetString("employee_id"),
	)

	if createdBy == "" {
		response.BadRequest(c, "authenticated employee ID is missing")
		return
	}

	var req pettyCashRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if len(req.Items) < 1 || len(req.Items) > 10 {
		response.BadRequest(c, "Petty Cash quantity must be between 1 and 10")
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var batchSequence int64

	if err := tx.QueryRow(
		ctx,
		`SELECT nextval('public.petty_cash_batch_seq')`,
	).Scan(&batchSequence); err != nil {
		response.ServerError(c, err)
		return
	}

	batchNo := fmt.Sprintf(
		"PC-%s-%06d",
		time.Now().Format("20060102"),
		batchSequence,
	)

	var batchID int64

	if err := tx.QueryRow(ctx, `
		INSERT INTO public.petty_cash_stock_batches (
			batch_no,
			employee_id,
			requested_items,
			inserted_items,
			skipped_items,
			created_by,
			created_at,
			status
		)
		VALUES ($1, $2, $3, 0, 0, $2, NOW(), 1)
		RETURNING id
	`,
		batchNo,
		createdBy,
		len(req.Items),
	).Scan(&batchID); err != nil {
		response.ServerError(c, err)
		return
	}

	insertedSerials := make([]string, 0)
	skippedSerials := make([]string, 0)

	seen := map[string]struct{}{}

	for index, item := range req.Items {
		rowNo := index + 1
		serial := normalizePettyCashSerial(
			item.SerialNo,
		)

		if serial == "" {
			response.BadRequest(
				c,
				fmt.Sprintf(
					"Row #%d: serial number is required",
					rowNo,
				),
			)
			return
		}

		if _, already := seen[serial]; already {
			skippedSerials = append(
				skippedSerials,
				serial,
			)
			continue
		}
		seen[serial] = struct{}{}

		// Prevent two concurrent requests from creating the same
		// normalized serial at the same time.
		if _, err := tx.Exec(ctx, `
			SELECT pg_advisory_xact_lock(
				hashtextextended($1, 0)
			)
		`, serial); err != nil {
			response.ServerError(c, err)
			return
		}

		exists, _, _, err :=
			lookupExistingPettyCashSerial(
				ctx,
				tx,
				serial,
			)
		if err != nil {
			response.ServerError(c, err)
			return
		}

		if exists {
			skippedSerials = append(
				skippedSerials,
				serial,
			)
			continue
		}

		master, purchaseDate, warrantyDate, err :=
			validatePettyCashMasterData(
				ctx,
				tx,
				item,
				rowNo,
			)
		if err != nil {
			response.BadRequest(c, err.Error())
			return
		}

		deviceType := strings.TrimSpace(
			item.DeviceType,
		)

		if deviceType == "" {
			deviceType = "IT Device"
		}

		// Petty Cash has NO MR / PR.
		// Store source type in the existing inventory_type field:
		// 1 = MR Type
		// 2 = Petty Cash
		var stockID int64

		if err := tx.QueryRow(ctx, `
			INSERT INTO public.stack_inventory (
				employee_id,
				mr_id,
				pr_id,
				vendor_name,
				serial_no,
				purchase_date,
				category,
				brand,
				model,
				cpu,
				ram,
				ssd,
				monitor,
				warranty_date,
				item_group,
				item_name,
				total_item,
				remarks,
				status,
				created_at,
				device_assigned_status,
				device_type,
				inventory_type,
				vendor_id,
				category_id,
				brand_id,
				model_id,
				asset_device_id,
				petty_cash_batch_id
			)
			VALUES (
				$1,
				NULL,
				NULL,
				$2,
				$3,
				$4,
				$5,
				$6,
				$7,
				NULLIF($8, ''),
				NULLIF($9, ''),
				NULLIF($10, ''),
				NULLIF($11, ''),
				$12,
				$5,
				$7,
				1,
				NULLIF($13, ''),
				1,
				NOW(),
				0,
				$14,
				'2',
				$15,
				$16,
				$17,
				$18,
				NULL,
				$19
			)
			RETURNING id
		`,
			createdBy,
			master.VendorName,
			serial,
			purchaseDate,
			master.CategoryName,
			master.BrandName,
			master.ModelName,
			strings.TrimSpace(item.CPU),
			strings.TrimSpace(item.RAM),
			strings.TrimSpace(item.SSD),
			strings.TrimSpace(item.Monitor),
			warrantyDate,
			strings.TrimSpace(item.Remarks),
			deviceType,
			item.VendorID,
			item.CategoryID,
			item.BrandID,
			item.ModelID,
			batchID,
		).Scan(&stockID); err != nil {
			response.ServerError(c, err)
			return
		}

		// Current ITM schema links stock to asset through:
		// stack_inventory.asset_device_id -> asset_devices.id
		var assetID int64

		if err := tx.QueryRow(ctx, `
			INSERT INTO public.asset_devices (
				device_serial,
				device_type,
				asset_status,
				vendor_id,
				mr_number,
				pr_number,
				purchase_date,
				warranty_date,
				category_id,
				brand_id,
				model_id
			)
			VALUES (
				$1,
				$2,
				0,
				$3,
				NULL,
				NULL,
				$4,
				$5,
				$6,
				$7,
				$8
			)
			RETURNING id
		`,
			serial,
			deviceType,
			item.VendorID,
			purchaseDate,
			warrantyDate,
			item.CategoryID,
			item.BrandID,
			item.ModelID,
		).Scan(&assetID); err != nil {
			response.ServerError(c, err)
			return
		}

		if _, err := tx.Exec(ctx, `
			UPDATE public.stack_inventory
			SET asset_device_id = $1
			WHERE id = $2
		`, assetID, stockID); err != nil {
			response.ServerError(c, err)
			return
		}

		insertedSerials = append(
			insertedSerials,
			serial,
		)
	}

	if _, err := tx.Exec(ctx, `
		UPDATE public.petty_cash_stock_batches
		SET
			inserted_items = $1,
			skipped_items = $2
		WHERE id = $3
	`,
		len(insertedSerials),
		len(skippedSerials),
		batchID,
	); err != nil {
		response.ServerError(c, err)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.Created(
		c,
		gin.H{
			"batch_id":         batchID,
			"batch_no":         batchNo,
			"requested":        len(req.Items),
			"inserted":         len(insertedSerials),
			"skipped":          len(skippedSerials),
			"inserted_serials": insertedSerials,
			"skipped_serials":  skippedSerials,
			"inventory_type":   2,
		},
	)
}

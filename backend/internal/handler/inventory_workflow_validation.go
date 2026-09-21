package handler

import (
	"sort"
	"strings"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
)

// ValidateStockImport provides a read-only database preflight for SCM stock intake.
// It does not insert/update anything. The frontend uses this response to show the
// duplicate/conflict modal before calling the real import endpoint.
func (h *StockHandler) ValidateStockImport(c *gin.Context) {
	ctx := c.Request.Context()

	var req struct {
		MRNumber string   `json:"mr_number"`
		Serials  []string `json:"serials"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid validation request")
		return
	}

	mrNumber := strings.TrimSpace(req.MRNumber)
	if mrNumber == "" {
		response.BadRequest(c, "mr_number is required")
		return
	}

	// Preserve the original serial for display, but use uppercase+trimmed keys
	// for all uniqueness checks.
	serialDisplay := make(map[string]string)
	serialCount := make(map[string]int)
	serialOrder := make([]string, 0, len(req.Serials))
	seenOrder := make(map[string]bool)

	for _, raw := range req.Serials {
		serial := strings.TrimSpace(raw)
		if serial == "" {
			continue
		}

		key := strings.ToUpper(serial)
		serialCount[key]++
		if _, ok := serialDisplay[key]; !ok {
			serialDisplay[key] = serial
		}
		if !seenOrder[key] {
			seenOrder[key] = true
			serialOrder = append(serialOrder, key)
		}
	}

	if len(serialOrder) == 0 {
		response.BadRequest(c, "at least one non-empty serial is required")
		return
	}

	type incomingDuplicate struct {
		SerialNumber string `json:"serial_number"`
		Occurrences  int    `json:"occurrences"`
	}

	incomingDuplicates := make([]incomingDuplicate, 0)
	for _, key := range serialOrder {
		if serialCount[key] > 1 {
			incomingDuplicates = append(incomingDuplicates, incomingDuplicate{
				SerialNumber: serialDisplay[key],
				Occurrences:  serialCount[key],
			})
		}
	}

	type dbRef struct {
		AssetID     *int64
		StockID     *int64
		Serial      string
		ExistingMR  string
		PRNumber    string
		AssetStatus *int
	}

	refsBySerial := make(map[string][]dbRef)

	// Return every matching asset/stock reference for the incoming serial set.
	// A serial linked to several historical stock rows will therefore be detected
	// as one logical conflict in the response, while retaining all MR/stock IDs.
	rows, err := h.db.Query(ctx, `
		WITH incoming AS (
			SELECT DISTINCT UPPER(BTRIM(value)) AS serial_key
			FROM UNNEST($1::text[]) AS value
			WHERE BTRIM(value) <> ''
		),
		asset_refs AS (
			SELECT
				i.serial_key,
				ad.id::bigint AS asset_id,
				NULL::bigint AS stock_id,
				BTRIM(COALESCE(ad.device_serial, '')) AS serial_number,
				BTRIM(COALESCE(ad.mr_number, '')) AS existing_mr,
				''::text AS pr_number,
				ad.asset_status::int AS asset_status
			FROM incoming i
			JOIN asset_devices ad
			  ON UPPER(BTRIM(COALESCE(ad.device_serial, ''))) = i.serial_key
		),
		stock_refs AS (
			SELECT
				i.serial_key,
				si.asset_device_id::bigint AS asset_id,
				si.id::bigint AS stock_id,
				BTRIM(COALESCE(NULLIF(si.serial_no, ''), ad.device_serial, '')) AS serial_number,
				BTRIM(COALESCE(NULLIF(si.mr_id, ''), ad.mr_number, '')) AS existing_mr,
				BTRIM(COALESCE(si.pr_id, '')) AS pr_number,
				ad.asset_status::int AS asset_status
			FROM incoming i
			JOIN stack_inventory si
			  ON UPPER(BTRIM(COALESCE(si.serial_no, ''))) = i.serial_key
			LEFT JOIN asset_devices ad
			  ON ad.id = si.asset_device_id
		),
		linked_stock_refs AS (
			SELECT
				i.serial_key,
				ad.id::bigint AS asset_id,
				si.id::bigint AS stock_id,
				BTRIM(COALESCE(NULLIF(si.serial_no, ''), ad.device_serial, '')) AS serial_number,
				BTRIM(COALESCE(NULLIF(si.mr_id, ''), ad.mr_number, '')) AS existing_mr,
				BTRIM(COALESCE(si.pr_id, '')) AS pr_number,
				ad.asset_status::int AS asset_status
			FROM incoming i
			JOIN asset_devices ad
			  ON UPPER(BTRIM(COALESCE(ad.device_serial, ''))) = i.serial_key
			JOIN stack_inventory si
			  ON si.asset_device_id = ad.id
		)
		SELECT DISTINCT
			serial_key,
			asset_id,
			stock_id,
			serial_number,
			existing_mr,
			pr_number,
			asset_status
		FROM (
			SELECT * FROM asset_refs
			UNION ALL
			SELECT * FROM stock_refs
			UNION ALL
			SELECT * FROM linked_stock_refs
		) refs
		ORDER BY serial_key, stock_id NULLS LAST, asset_id NULLS LAST
	`, serialOrder)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var (
			key         string
			assetID     *int64
			stockID     *int64
			serial      string
			existingMR  string
			prNumber    string
			assetStatus *int
		)

		if err := rows.Scan(
			&key,
			&assetID,
			&stockID,
			&serial,
			&existingMR,
			&prNumber,
			&assetStatus,
		); err != nil {
			response.ServerError(c, err)
			return
		}

		key = strings.ToUpper(strings.TrimSpace(key))
		refsBySerial[key] = append(refsBySerial[key], dbRef{
			AssetID:     assetID,
			StockID:     stockID,
			Serial:      strings.TrimSpace(serial),
			ExistingMR:  strings.TrimSpace(existingMR),
			PRNumber:    strings.TrimSpace(prNumber),
			AssetStatus: assetStatus,
		})
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	type existingMRRow struct {
		StockID      int64  `json:"stock_id"`
		AssetID      *int64 `json:"asset_id"`
		SerialNumber string `json:"serial_number"`
		PRNumber     string `json:"pr_number,omitempty"`
		AssetStatus  *int   `json:"asset_status"`
		StatusLabel  string `json:"status_label,omitempty"`
	}

	type serialConflict struct {
		SerialNumber      string   `json:"serial_number"`
		AssetID           *int64   `json:"asset_id,omitempty"`
		StockID           *int64   `json:"stock_id,omitempty"`
		ExistingMR        string   `json:"existing_mr,omitempty"`
		AssetIDs          []int64  `json:"asset_ids"`
		StockIDs          []int64  `json:"stock_ids"`
		ExistingMRs       []string `json:"existing_mrs"`
		PRNumbers         []string `json:"pr_numbers"`
		MultipleMRWarning bool     `json:"multiple_mr_warning"`
		AssetStatus       *int     `json:"asset_status"`
		StatusLabel       string   `json:"status_label,omitempty"`
	}

	existingRows := make([]existingMRRow, 0)
	conflicts := make([]serialConflict, 0)
	newSerialCount := 0
	existingSerialCount := 0

	for _, key := range serialOrder {
		refs := refsBySerial[key]
		if len(refs) == 0 {
			newSerialCount++
			continue
		}

		hasSameMR := false
		hasOtherOrUnknownMR := false

		for _, ref := range refs {
			if strings.EqualFold(strings.TrimSpace(ref.ExistingMR), mrNumber) {
				hasSameMR = true
			} else {
				// Existing serial with another MR OR no MR at all is unsafe.
				hasOtherOrUnknownMR = true
			}
		}

		// Conflict takes precedence when the same serial is tied to both the
		// requested MR and another historical/unknown MR.
		if hasOtherOrUnknownMR {
			assetSet := map[int64]struct{}{}
			stockSet := map[int64]struct{}{}
			mrSet := map[string]struct{}{}
			prSet := map[string]struct{}{}
			var firstAssetID *int64
			var firstStockID *int64
			var status *int

			for _, ref := range refs {
				if ref.AssetID != nil {
					assetSet[*ref.AssetID] = struct{}{}
					if firstAssetID == nil {
						v := *ref.AssetID
						firstAssetID = &v
					}
				}
				if ref.StockID != nil {
					stockSet[*ref.StockID] = struct{}{}
					if firstStockID == nil {
						v := *ref.StockID
						firstStockID = &v
					}
				}
				mr := strings.TrimSpace(ref.ExistingMR)
				if mr == "" {
					mr = "Unknown / no MR"
				}
				mrSet[mr] = struct{}{}
				if ref.PRNumber != "" {
					prSet[ref.PRNumber] = struct{}{}
				}
				if status == nil && ref.AssetStatus != nil {
					v := *ref.AssetStatus
					status = &v
				}
			}

			assetIDs := make([]int64, 0, len(assetSet))
			for id := range assetSet {
				assetIDs = append(assetIDs, id)
			}
			sort.Slice(assetIDs, func(i, j int) bool { return assetIDs[i] < assetIDs[j] })

			stockIDs := make([]int64, 0, len(stockSet))
			for id := range stockSet {
				stockIDs = append(stockIDs, id)
			}
			sort.Slice(stockIDs, func(i, j int) bool { return stockIDs[i] < stockIDs[j] })

			existingMRs := make([]string, 0, len(mrSet))
			for mr := range mrSet {
				existingMRs = append(existingMRs, mr)
			}
			sort.Strings(existingMRs)

			prNumbers := make([]string, 0, len(prSet))
			for pr := range prSet {
				prNumbers = append(prNumbers, pr)
			}
			sort.Strings(prNumbers)

			firstMR := ""
			if len(existingMRs) > 0 {
				firstMR = existingMRs[0]
			}

			conflicts = append(conflicts, serialConflict{
				SerialNumber:      serialDisplay[key],
				AssetID:           firstAssetID,
				StockID:           firstStockID,
				ExistingMR:        firstMR,
				AssetIDs:          assetIDs,
				StockIDs:          stockIDs,
				ExistingMRs:       existingMRs,
				PRNumbers:         prNumbers,
				MultipleMRWarning: len(existingMRs) > 1,
				AssetStatus:       status,
			})
			continue
		}

		if hasSameMR {
			existingSerialCount++
			added := false
			for _, ref := range refs {
				if !strings.EqualFold(strings.TrimSpace(ref.ExistingMR), mrNumber) {
					continue
				}

				stockID := int64(0)
				if ref.StockID != nil {
					stockID = *ref.StockID
				}

				existingRows = append(existingRows, existingMRRow{
					StockID:      stockID,
					AssetID:      ref.AssetID,
					SerialNumber: serialDisplay[key],
					PRNumber:     ref.PRNumber,
					AssetStatus:  ref.AssetStatus,
				})
				added = true
			}

			// Asset can exist under this MR before a stock link is available.
			if !added {
				existingRows = append(existingRows, existingMRRow{
					StockID:      0,
					SerialNumber: serialDisplay[key],
				})
			}
		}
	}

	allRowsExisting :=
		newSerialCount == 0 &&
			len(conflicts) == 0 &&
			len(incomingDuplicates) == 0 &&
			existingSerialCount == len(serialOrder)

	response.OK(c, gin.H{
		"mr_number":           mrNumber,
		"incoming_count":      len(serialOrder),
		"existing_mr_count":   existingSerialCount,
		"new_serial_count":    newSerialCount,
		"all_rows_existing":   allRowsExisting,
		"existing_mr_rows":    existingRows,
		"serial_conflicts":    conflicts,
		"incoming_duplicates": incomingDuplicates,
	})
}

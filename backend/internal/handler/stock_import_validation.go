package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// ValidateImport performs a read-only preflight check before the existing
// SCM import endpoint is called. It does not insert, update, or delete data.
//
// Rules:
//   - same MR + same serial  => EXISTING_SAME_MR (skip automatically)
//   - other MR + same serial => CONFLICT_OTHER_MR (skip automatically; show existing references)
//   - serial exists without a usable MR => CONFLICT_OTHER_MR (skip automatically)
//   - duplicate non-empty serial in incoming payload => DUPLICATE_IN_PAYLOAD (skip automatically)
//   - no database reference => NEW (eligible for final import)
//
// Existing/conflicting rows do NOT block other NEW rows from being imported.
func (h *StockHandler) ValidateImport(c *gin.Context) {
	var req struct {
		MRNumber string   `json:"mr_number"`
		Serials  []string `json:"serials"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "invalid validation request",
		})
		return
	}

	mrNumber := strings.TrimSpace(req.MRNumber)
	if mrNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "mr_number is required",
		})
		return
	}

	if len(req.Serials) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "at least one incoming row is required",
		})
		return
	}

	if len(req.Serials) > 5000 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "too many incoming rows for one validation request",
		})
		return
	}

	const query = `
		WITH incoming_raw AS (
			SELECT
				ordinality::int AS row_no,
				BTRIM(value) AS serial_number,
				UPPER(BTRIM(value)) AS serial_key
			FROM UNNEST($2::text[]) WITH ORDINALITY AS t(value, ordinality)
		),
		incoming AS (
			SELECT
				MIN(row_no)::int AS row_no,
				MIN(serial_number) AS serial_number,
				MIN(serial_key) AS serial_key,
				COUNT(*)::int AS payload_count
			FROM incoming_raw
			GROUP BY
				CASE
					WHEN serial_key = '' THEN '__EMPTY_ROW__:' || row_no::text
					ELSE serial_key
				END
		),
		refs AS (
			SELECT
				i.serial_key,
				ad.id::bigint AS asset_id,
				NULL::bigint AS stock_id,
				NULL::text AS pr_number,
				NULLIF(BTRIM(ad.mr_number), '') AS existing_mr,
				COALESCE(ad.asset_status, 0)::int AS asset_status
			FROM incoming i
			JOIN public.asset_devices ad
				ON i.serial_key <> ''
				AND UPPER(BTRIM(ad.device_serial)) = i.serial_key

			UNION ALL

			SELECT
				i.serial_key,
				si.asset_device_id::bigint AS asset_id,
				si.id::bigint AS stock_id,
				si.pr_id::text AS pr_number,
				NULLIF(BTRIM(si.mr_id), '') AS existing_mr,
				COALESCE(ad.asset_status, 0)::int AS asset_status
			FROM incoming i
			JOIN public.stack_inventory si
				ON i.serial_key <> ''
				AND UPPER(BTRIM(si.serial_no)) = i.serial_key
			LEFT JOIN public.asset_devices ad
				ON ad.id = si.asset_device_id
		),
		classified AS (
			SELECT
				i.row_no,
				i.serial_number,
				i.serial_key,
				i.payload_count,

				COALESCE(
					array_to_json(
						ARRAY_AGG(DISTINCT r.asset_id)
						FILTER (WHERE r.asset_id IS NOT NULL)
					)::text,
					'[]'
				) AS asset_ids_json,

				COALESCE(
					array_to_json(
						ARRAY_AGG(DISTINCT r.stock_id)
						FILTER (WHERE r.stock_id IS NOT NULL)
					)::text,
					'[]'
				) AS stock_ids_json,

				COALESCE(
					array_to_json(
						ARRAY_AGG(DISTINCT r.existing_mr)
						FILTER (WHERE r.existing_mr IS NOT NULL)
					)::text,
					'[]'
				) AS existing_mrs_json,

				COALESCE(
					array_to_json(
						ARRAY_AGG(DISTINCT r.pr_number)
						FILTER (WHERE NULLIF(BTRIM(r.pr_number), '') IS NOT NULL)
					)::text,
					'[]'
				) AS pr_numbers_json,

				COALESCE(MAX(r.asset_status), 0)::int AS asset_status,

				COALESCE(
					BOOL_OR(COALESCE(r.existing_mr, '') = BTRIM($1)),
					FALSE
				) AS exists_same_mr,

				COALESCE(
					BOOL_OR(
						COALESCE(r.existing_mr, '') <> ''
						AND COALESCE(r.existing_mr, '') <> BTRIM($1)
					),
					FALSE
				) AS exists_other_mr,

				COALESCE(
					BOOL_OR(r.asset_id IS NOT NULL OR r.stock_id IS NOT NULL),
					FALSE
				) AS has_database_reference,

				COUNT(DISTINCT r.existing_mr)
					FILTER (WHERE r.existing_mr IS NOT NULL) > 1
					AS multiple_mr_warning

			FROM incoming i
			LEFT JOIN refs r
				ON r.serial_key = i.serial_key
			GROUP BY
				i.row_no,
				i.serial_number,
				i.serial_key,
				i.payload_count
		)
		SELECT
			row_no,
			serial_number,
			payload_count,
			asset_ids_json,
			stock_ids_json,
			existing_mrs_json,
			pr_numbers_json,
			asset_status,
			multiple_mr_warning,
			CASE
				WHEN serial_key <> '' AND payload_count > 1
					THEN 'DUPLICATE_IN_PAYLOAD'
				WHEN exists_other_mr
					THEN 'CONFLICT_OTHER_MR'
				WHEN has_database_reference AND NOT exists_same_mr
					THEN 'CONFLICT_OTHER_MR'
				WHEN exists_same_mr
					THEN 'EXISTING_SAME_MR'
				ELSE 'NEW'
			END AS validation_status
		FROM classified
		ORDER BY row_no;
	`

	type validationRow struct {
		RowNo             int      `json:"row_no"`
		SerialNumber      string   `json:"serial_number"`
		AssetIDs          []int64  `json:"asset_ids"`
		StockIDs          []int64  `json:"stock_ids"`
		ExistingMRs       []string `json:"existing_mrs"`
		PRNumbers         []string `json:"pr_numbers"`
		AssetStatus       *int     `json:"asset_status"`
		PayloadCount      int      `json:"payload_count"`
		ValidationStatus  string   `json:"validation_status"`
		MultipleMRWarning bool     `json:"multiple_mr_warning"`
	}

	rows, err := h.db.Query(
		c.Request.Context(),
		query,
		mrNumber,
		req.Serials,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}
	defer rows.Close()

	items := make([]validationRow, 0, len(req.Serials))
	newCount := 0
	existingSameMRCount := 0
	conflictCount := 0
	duplicatePayloadCount := 0
	skippedRowCount := 0

	for rows.Next() {
		var item validationRow
		var assetIDsJSON string
		var stockIDsJSON string
		var existingMRsJSON string
		var prNumbersJSON string
		var assetStatus int

		if err := rows.Scan(
			&item.RowNo,
			&item.SerialNumber,
			&item.PayloadCount,
			&assetIDsJSON,
			&stockIDsJSON,
			&existingMRsJSON,
			&prNumbersJSON,
			&assetStatus,
			&item.MultipleMRWarning,
			&item.ValidationStatus,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		if err := json.Unmarshal([]byte(assetIDsJSON), &item.AssetIDs); err != nil {
			item.AssetIDs = []int64{}
		}
		if err := json.Unmarshal([]byte(stockIDsJSON), &item.StockIDs); err != nil {
			item.StockIDs = []int64{}
		}
		if err := json.Unmarshal([]byte(existingMRsJSON), &item.ExistingMRs); err != nil {
			item.ExistingMRs = []string{}
		}
		if err := json.Unmarshal([]byte(prNumbersJSON), &item.PRNumbers); err != nil {
			item.PRNumbers = []string{}
		}

		if len(item.AssetIDs) > 0 {
			status := assetStatus
			item.AssetStatus = &status
		}

		switch item.ValidationStatus {
		case "NEW":
			newCount++
		case "EXISTING_SAME_MR":
			existingSameMRCount++
			skippedRowCount += item.PayloadCount
		case "CONFLICT_OTHER_MR":
			conflictCount++
			skippedRowCount += item.PayloadCount
		case "DUPLICATE_IN_PAYLOAD":
			duplicatePayloadCount++
			skippedRowCount += item.PayloadCount
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Partial import is allowed: existing/conflicting/duplicate serials are
	// read-only skipped rows, while NEW rows can continue to the existing
	// authoritative import endpoint.
	canImport := newCount > 0

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"mr_number":               mrNumber,
			"incoming_count":          len(req.Serials),
			"unique_row_count":        len(items),
			"new_count":               newCount,
			"existing_same_mr_count":  existingSameMRCount,
			"conflict_count":          conflictCount,
			"duplicate_payload_count": duplicatePayloadCount,
			"skipped_count":           skippedRowCount,
			"can_import":              canImport,
			"rows":                    items,
		},
	})
}

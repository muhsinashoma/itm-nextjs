package handler

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"itm-api/internal/config"
	"itm-api/internal/middleware"
	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// InventoryWorkflowHandler owns the transactional boundary between:
// SCM receipt -> local stock -> approved requisition -> employee asset -> delivery.
type InventoryWorkflowHandler struct {
	db     *pgxpool.Pool
	cfg    *config.Config
	client *http.Client
}

func NewInventoryWorkflowHandler(db *pgxpool.Pool, cfg *config.Config) *InventoryWorkflowHandler {
	timeout := 15 * time.Second
	if cfg != nil && cfg.SCMTimeoutSeconds > 0 {
		timeout = time.Duration(cfg.SCMTimeoutSeconds) * time.Second
	}
	return &InventoryWorkflowHandler{db: db, cfg: cfg, client: &http.Client{Timeout: timeout}}
}

func (h *InventoryWorkflowHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/inventory-workflow")

	g.GET("/scm/mr/:mr",
		middleware.RequirePermission(h.db, "inventory.stock.view"),
		h.SCMPreview,
	)
	g.POST("/scm/import",
		middleware.RequirePermission(h.db, "inventory.stock.import"),
		h.ImportSCMStock,
	)
	g.GET("/available-stock",
		middleware.RequirePermission(h.db, "inventory.stock.view"),
		h.AvailableStock,
	)
	g.GET("/allocatable-requisitions",
		middleware.RequirePermission(h.db, "inventory.asset.assign"),
		h.AllocatableRequisitions,
	)
	g.POST("/requisitions/:id/assign",
		middleware.RequirePermission(h.db, "inventory.asset.assign"),
		h.AssignStockToRequisition,
	)
	g.POST("/requisitions/:id/deliver",
		middleware.RequirePermission(h.db, "inventory.asset.deliver"),
		h.ConfirmRequisitionDelivery,
	)
}

type scmPreviewItem struct {
	SourceIndex    int    `json:"source_index"`
	PRID           string `json:"pr_id"`
	VendorName     string `json:"vendor_name"`
	GRID           string `json:"gr_id"`
	SerialNumber   string `json:"serial_number"`
	PurchaseDate   string `json:"purchase_date"`
	ItemGroup      string `json:"item_group"`
	ItemName       string `json:"item_name"`
	WarrantyMonths int    `json:"warranty_months"`
}

type scmPreview struct {
	MRID  string           `json:"mr_id"`
	Items []scmPreviewItem `json:"items"`
}

func valueString(v any) string {
	if v == nil {
		return ""
	}
	switch x := v.(type) {
	case string:
		return strings.TrimSpace(x)
	case json.Number:
		return strings.TrimSpace(x.String())
	case float64:
		if x == float64(int64(x)) {
			return strconv.FormatInt(int64(x), 10)
		}
		return strconv.FormatFloat(x, 'f', -1, 64)
	default:
		return strings.TrimSpace(fmt.Sprint(x))
	}
}

func mapString(m map[string]any, keys ...string) string {
	for _, key := range keys {
		if v, ok := m[key]; ok {
			if s := valueString(v); s != "" {
				return s
			}
		}
	}
	return ""
}

func parsePositiveInt(value string) int {
	n, _ := strconv.Atoi(strings.TrimSpace(value))
	if n < 0 {
		return 0
	}
	return n
}

func (h *InventoryWorkflowHandler) fetchSCMMR(ctx context.Context, mr string) (scmPreview, error) {
	mr = strings.TrimSpace(mr)
	if mr == "" {
		return scmPreview{}, errors.New("MR number is required")
	}
	if h.cfg == nil || strings.TrimSpace(h.cfg.SCMAPIURL) == "" || strings.TrimSpace(h.cfg.SCMAPIToken) == "" {
		return scmPreview{}, errors.New("SCM integration is not configured. Add SCM_API_TOKEN (and optional SCM_API_URL) to backend/.env or backend/.env.inventory, then restart the backend")
	}

	form := url.Values{}
	form.Set("token", h.cfg.SCMAPIToken)
	form.Set("mr_id", mr)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, h.cfg.SCMAPIURL, strings.NewReader(form.Encode()))
	if err != nil {
		return scmPreview{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	res, err := h.client.Do(req)
	if err != nil {
		return scmPreview{}, fmt.Errorf("SCM request failed: %w", err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(io.LimitReader(res.Body, 4<<20))
	if err != nil {
		return scmPreview{}, err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return scmPreview{}, fmt.Errorf("SCM returned HTTP %d", res.StatusCode)
	}

	decoder := json.NewDecoder(strings.NewReader(string(body)))
	decoder.UseNumber()
	var raw struct {
		Status bool             `json:"status"`
		Data   []map[string]any `json:"data"`
	}
	if err := decoder.Decode(&raw); err != nil {
		return scmPreview{}, fmt.Errorf("invalid SCM response: %w", err)
	}
	if !raw.Status || len(raw.Data) == 0 {
		return scmPreview{}, errors.New("no SCM items found for this MR")
	}

	result := scmPreview{MRID: mapString(raw.Data[0], "mr_id")}
	if result.MRID == "" {
		result.MRID = mr
	}
	rawItems, _ := raw.Data[0]["items"].([]any)
	result.Items = make([]scmPreviewItem, 0, len(rawItems))
	for i, rawItem := range rawItems {
		item, ok := rawItem.(map[string]any)
		if !ok {
			continue
		}
		result.Items = append(result.Items, scmPreviewItem{
			SourceIndex:    i,
			PRID:           mapString(item, "pr_id"),
			VendorName:     mapString(item, "vendor_name", "vendor"),
			GRID:           mapString(item, "gr_id", "received_date"),
			SerialNumber:   mapString(item, "serial_number", "serial_no"),
			PurchaseDate:   mapString(item, "purchase_date"),
			ItemGroup:      mapString(item, "item_group"),
			ItemName:       mapString(item, "item_name"),
			WarrantyMonths: parsePositiveInt(mapString(item, "warranty", "warranty_months")),
		})
	}
	if len(result.Items) == 0 {
		return scmPreview{}, errors.New("SCM MR contains no usable items")
	}
	return result, nil
}

func (h *InventoryWorkflowHandler) SCMPreview(c *gin.Context) {
	preview, err := h.fetchSCMMR(c.Request.Context(), c.Param("mr"))
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, preview)
}

type scmImportMapping struct {
	SourceIndex    int    `json:"source_index"`
	SerialNumber   string `json:"serial_number"`
	Category       string `json:"category"`
	Brand          string `json:"brand"`
	Model          string `json:"model"`
	CPU            string `json:"cpu"`
	RAM            string `json:"ram"`
	SSD            string `json:"ssd"`
	Monitor        string `json:"monitor"`
	WarrantyMonths int    `json:"warranty_months"`
	DeviceType     string `json:"device_type"`
	Remarks        string `json:"remarks"`
}

type scmImportRequest struct {
	MRID  string             `json:"mr_id"`
	Items []scmImportMapping `json:"items"`
}

func stableInternalAssetTag(mr string, index int) string {
	sum := sha1.Sum([]byte(strings.ToUpper(strings.TrimSpace(mr))))
	return fmt.Sprintf("ITM-%s-%03d", strings.ToUpper(hex.EncodeToString(sum[:4])), index+1)
}

func parseSCMTime(value string) *time.Time {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	loc, _ := time.LoadLocation("Asia/Dhaka")
	layouts := []string{
		time.RFC3339, "2006-01-02 15:04:05", "2006-01-02T15:04:05", "2006-01-02",
	}
	for _, layout := range layouts {
		var t time.Time
		var err error
		if layout == time.RFC3339 {
			t, err = time.Parse(layout, value)
		} else {
			t, err = time.ParseInLocation(layout, value, loc)
		}
		if err == nil {
			return &t
		}
	}
	return nil
}

func (h *InventoryWorkflowHandler) ImportSCMStock(c *gin.Context) {
	var req scmImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	req.MRID = strings.TrimSpace(req.MRID)
	if req.MRID == "" || len(req.Items) == 0 {
		response.BadRequest(c, "mr_id and items are required")
		return
	}

	preview, err := h.fetchSCMMR(c.Request.Context(), req.MRID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	sourceByIndex := map[int]scmPreviewItem{}
	for _, item := range preview.Items {
		sourceByIndex[item.SourceIndex] = item
	}

	tx, err := h.db.BeginTx(c.Request.Context(), pgx.TxOptions{IsoLevel: pgx.Serializable})
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(c.Request.Context())

	// One import per MR at a time, even before unique indexes are cleaned up.
	if _, err := tx.Exec(c.Request.Context(), `SELECT pg_advisory_xact_lock(hashtext($1))`, req.MRID); err != nil {
		response.ServerError(c, err)
		return
	}

	currentEmployee := c.GetString("employee_id")
	imported, updated := 0, 0
	ids := make([]int64, 0, len(req.Items))

	for _, mapping := range req.Items {
		source, ok := sourceByIndex[mapping.SourceIndex]
		if !ok {
			response.BadRequest(c, fmt.Sprintf("invalid SCM source_index %d", mapping.SourceIndex))
			return
		}
		if strings.TrimSpace(mapping.Category) == "" {
			response.BadRequest(c, fmt.Sprintf("category is required for row %d", mapping.SourceIndex+1))
			return
		}

		serial := strings.TrimSpace(source.SerialNumber)
		if serial == "" {
			serial = stableInternalAssetTag(req.MRID, mapping.SourceIndex)
		}
		if mapping.SerialNumber != "" && !strings.EqualFold(strings.TrimSpace(mapping.SerialNumber), strings.TrimSpace(source.SerialNumber)) {
			response.BadRequest(c, fmt.Sprintf("SCM serial changed for row %d; reload MR before importing", mapping.SourceIndex+1))
			return
		}
		serialKey := strings.ToUpper(strings.TrimSpace(serial))
		purchaseDate := parseSCMTime(source.PurchaseDate)
		warrantyMonths := mapping.WarrantyMonths
		if warrantyMonths <= 0 {
			warrantyMonths = source.WarrantyMonths
		}
		var warrantyDate *time.Time
		if purchaseDate != nil && warrantyMonths > 0 {
			w := purchaseDate.AddDate(0, warrantyMonths, 0)
			warrantyDate = &w
		}
		deviceType := strings.TrimSpace(mapping.DeviceType)
		if deviceType == "" {
			if strings.Contains(strings.ToLower(source.ItemGroup), "accessor") {
				deviceType = "IT Accessory"
			} else {
				deviceType = "IT Device"
			}
		}

		var stockID int64
		err := tx.QueryRow(c.Request.Context(), `
            SELECT id
            FROM public.stack_inventory
            WHERE status = 1
              AND BTRIM(COALESCE(mr_id,'')) = BTRIM($1)
              AND UPPER(BTRIM(COALESCE(serial_no,''))) = $2
            ORDER BY id DESC
            LIMIT 1
            FOR UPDATE`, req.MRID, serialKey).Scan(&stockID)

		if errors.Is(err, pgx.ErrNoRows) {
			err = tx.QueryRow(c.Request.Context(), `
                INSERT INTO public.stack_inventory (
                    employee_id, mr_id, pr_id, vendor_name, serial_no, purchase_date,
                    category, brand, model, cpu, ram, ssd, monitor, warranty_date,
                    item_group, item_name, gr_id, total_item, remarks, status,
                    created_at, device_assigned_status, device_type, inventory_type
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
                    $15,$16,$17,$18,$19,1,NOW(),0,$20,'SCM'
                ) RETURNING id`,
				currentEmployee, req.MRID, source.PRID, source.VendorName, serial, purchaseDate,
				strings.TrimSpace(mapping.Category), strings.TrimSpace(mapping.Brand), strings.TrimSpace(mapping.Model),
				strings.TrimSpace(mapping.CPU), strings.TrimSpace(mapping.RAM), strings.TrimSpace(mapping.SSD), strings.TrimSpace(mapping.Monitor), warrantyDate,
				source.ItemGroup, source.ItemName, source.GRID, len(preview.Items), strings.TrimSpace(mapping.Remarks), deviceType,
			).Scan(&stockID)
			if err != nil {
				response.ServerError(c, err)
				return
			}
			imported++
		} else if err != nil {
			response.ServerError(c, err)
			return
		} else {
			_, err = tx.Exec(c.Request.Context(), `
                UPDATE public.stack_inventory SET
                    pr_id=$1, vendor_name=$2, purchase_date=$3, category=$4, brand=$5,
                    model=$6, cpu=$7, ram=$8, ssd=$9, monitor=$10, warranty_date=$11,
                    item_group=$12, item_name=$13, gr_id=$14, total_item=$15,
                    remarks=$16, device_type=$17, edited_by=$18, edited_at=NOW()
                WHERE id=$19`,
				source.PRID, source.VendorName, purchaseDate, strings.TrimSpace(mapping.Category), strings.TrimSpace(mapping.Brand),
				strings.TrimSpace(mapping.Model), strings.TrimSpace(mapping.CPU), strings.TrimSpace(mapping.RAM), strings.TrimSpace(mapping.SSD), strings.TrimSpace(mapping.Monitor), warrantyDate,
				source.ItemGroup, source.ItemName, source.GRID, len(preview.Items), strings.TrimSpace(mapping.Remarks), deviceType, currentEmployee, stockID,
			)
			if err != nil {
				response.ServerError(c, err)
				return
			}
			updated++
		}

		var assetID int64
		assetErr := tx.QueryRow(c.Request.Context(), `
            SELECT id FROM public.asset_devices
            WHERE legacy_stack_id=$1
            ORDER BY id DESC LIMIT 1 FOR UPDATE`, stockID).Scan(&assetID)
		if errors.Is(assetErr, pgx.ErrNoRows) {
			assetErr = tx.QueryRow(c.Request.Context(), `
                INSERT INTO public.asset_devices (
                    legacy_stack_id, device_serial, device_serial_key, category, brand, model,
                    device_type, mr_number, pr_number, vendor_name, purchase_date, warranty_date,
                    asset_status, row_status, created_at, updated_at
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,1,NOW(),NOW())
                RETURNING id`,
				stockID, serial, serialKey, strings.TrimSpace(mapping.Category), strings.TrimSpace(mapping.Brand), strings.TrimSpace(mapping.Model),
				deviceType, req.MRID, source.PRID, source.VendorName, purchaseDate, warrantyDate,
			).Scan(&assetID)
		} else if assetErr == nil {
			_, assetErr = tx.Exec(c.Request.Context(), `
                UPDATE public.asset_devices SET
                    device_serial=$1, device_serial_key=$2, category=$3, brand=$4, model=$5,
                    device_type=$6, mr_number=$7, pr_number=$8, vendor_name=$9,
                    purchase_date=$10, warranty_date=$11, updated_at=NOW()
                WHERE id=$12`, serial, serialKey, strings.TrimSpace(mapping.Category), strings.TrimSpace(mapping.Brand), strings.TrimSpace(mapping.Model),
				deviceType, req.MRID, source.PRID, source.VendorName, purchaseDate, warrantyDate, assetID)
		}
		if assetErr != nil {
			response.ServerError(c, assetErr)
			return
		}
		ids = append(ids, stockID)
	}

	if err := tx.Commit(c.Request.Context()); err != nil {
		response.ServerError(c, err)
		return
	}
	response.Created(c, gin.H{"mr_id": req.MRID, "imported": imported, "updated": updated, "stock_ids": ids})
}

type availableStockItem struct {
	ID           int64  `json:"id"`
	AssetID      *int64 `json:"asset_id"`
	SerialNo     string `json:"serial_no"`
	Category     string `json:"category"`
	Brand        string `json:"brand"`
	Model        string `json:"model"`
	DeviceType   string `json:"device_type"`
	MRID         string `json:"mr_id"`
	PRID         string `json:"pr_id"`
	VendorName   string `json:"vendor_name"`
	PurchaseDate string `json:"purchase_date"`
	WarrantyDate string `json:"warranty_date"`
	ItemGroup    string `json:"item_group"`
	ItemName     string `json:"item_name"`
}

const resolvedStockCategorySQL = `COALESCE((SELECT ic.inventory_category_list FROM public.inventory_categories ic WHERE ic.id::text = BTRIM(COALESCE(s.category,'')) LIMIT 1), NULLIF(BTRIM(COALESCE(s.category,'')), ''), 'Uncategorized')`

func (h *InventoryWorkflowHandler) AvailableStock(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "25"))
	if limit < 1 {
		limit = 25
	}
	if limit > 100 {
		limit = 100
	}
	category := strings.TrimSpace(c.Query("category"))
	search := strings.TrimSpace(c.Query("search"))
	where := `WHERE s.status=1 AND COALESCE(s.device_assigned_status,0)=0`
	args := []any{}
	n := 1
	if category != "" {
		where += fmt.Sprintf(` AND LOWER(%s)=LOWER($%d)`, resolvedStockCategorySQL, n)
		args = append(args, category)
		n++
	}
	if search != "" {
		where += fmt.Sprintf(` AND (COALESCE(s.serial_no,'') ILIKE $%d OR COALESCE(s.brand,'') ILIKE $%d OR COALESCE(s.model,'') ILIKE $%d OR COALESCE(s.item_name,'') ILIKE $%d OR COALESCE(s.mr_id,'') ILIKE $%d OR COALESCE(s.pr_id,'') ILIKE $%d)`, n, n, n, n, n, n)
		args = append(args, "%"+search+"%")
		n++
	}
	var total int
	countSQL := fmt.Sprintf(`SELECT COUNT(*) FROM public.stack_inventory s %s`, where)
	if err := h.db.QueryRow(c.Request.Context(), countSQL, args...).Scan(&total); err != nil {
		response.ServerError(c, err)
		return
	}
	listArgs := append(append([]any{}, args...), limit, (page-1)*limit)
	query := fmt.Sprintf(`
        SELECT s.id, ad.id, COALESCE(s.serial_no,''), %s,
               COALESCE(s.brand,''), COALESCE(s.model,''), COALESCE(s.device_type,''),
               COALESCE(s.mr_id,''), COALESCE(s.pr_id,''), COALESCE(s.vendor_name,''),
               COALESCE(s.purchase_date::text,''), COALESCE(s.warranty_date::text,''),
               COALESCE(s.item_group,''), COALESCE(s.item_name,'')
        FROM public.stack_inventory s
        LEFT JOIN LATERAL (
            SELECT a.id FROM public.asset_devices a
            WHERE a.legacy_stack_id=s.id AND a.row_status=1
            ORDER BY a.id DESC LIMIT 1
        ) ad ON TRUE
        %s
        ORDER BY s.id DESC LIMIT $%d OFFSET $%d`, resolvedStockCategorySQL, where, n, n+1)
	rows, err := h.db.Query(c.Request.Context(), query, listArgs...)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	items := make([]availableStockItem, 0, limit)
	for rows.Next() {
		var item availableStockItem
		if err := rows.Scan(&item.ID, &item.AssetID, &item.SerialNo, &item.Category, &item.Brand, &item.Model, &item.DeviceType, &item.MRID, &item.PRID, &item.VendorName, &item.PurchaseDate, &item.WarrantyDate, &item.ItemGroup, &item.ItemName); err != nil {
			response.ServerError(c, err)
			return
		}
		items = append(items, item)
	}
	response.Paginated(c, items, total, page, limit)
}

func (h *InventoryWorkflowHandler) AllocatableRequisitions(c *gin.Context) {
	category := strings.TrimSpace(c.Query("category"))
	search := strings.TrimSpace(c.Query("search"))
	args := []any{}
	n := 1
	where := `WHERE COALESCE(r.status,1)=1 AND r.approved_val IN (1,3) AND COALESCE(r.dev_assigned_val,0)=0 AND COALESCE(r.delivered_val,0)=0`
	if category != "" {
		where += fmt.Sprintf(` AND LOWER(BTRIM(COALESCE(r.category,'')))=LOWER($%d)`, n)
		args = append(args, category)
		n++
	}
	if search != "" {
		where += fmt.Sprintf(` AND (COALESCE(r.tt_no,'') ILIKE $%d OR COALESCE(r.employee_id,'') ILIKE $%d OR COALESCE(e.employee_name,'') ILIKE $%d OR COALESCE(r.category,'') ILIKE $%d)`, n, n, n, n)
		args = append(args, "%"+search+"%")
		n++
	}
	rows, err := h.db.Query(c.Request.Context(), fmt.Sprintf(`SELECT r.id,COALESCE(r.tt_no,''),COALESCE(r.category,''),COALESCE(r.employee_id,''),COALESCE(e.employee_name,''),COALESCE(r.reason_details,''),r.approved_val FROM public.tt_reasons r LEFT JOIN public.employee_office_info e ON BTRIM(e.employee_id)=BTRIM(COALESCE(r.employee_id,'')) %s ORDER BY r.approved_date DESC NULLS LAST,r.id DESC LIMIT 100`, where), args...)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	result := []gin.H{}
	for rows.Next() {
		var id int64
		var tt, cat, emp, name, reason string
		var approved int
		if err := rows.Scan(&id, &tt, &cat, &emp, &name, &reason, &approved); err != nil {
			response.ServerError(c, err)
			return
		}
		result = append(result, gin.H{"id": id, "tt_no": tt, "category": cat, "employee_id": emp, "employee_name": name, "reason_details": reason, "approved_val": approved})
	}
	response.OK(c, result)
}

func normalizedCategory(value string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(strings.TrimSpace(value)) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		}
	}
	return b.String()
}

type assignStockRequest struct {
	StockID int64  `json:"stock_id"`
	Remarks string `json:"remarks"`
}

func (h *InventoryWorkflowHandler) AssignStockToRequisition(c *gin.Context) {
	requisitionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || requisitionID < 1 {
		response.BadRequest(c, "invalid requisition id")
		return
	}
	var req assignStockRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.StockID < 1 {
		response.BadRequest(c, "stock_id is required")
		return
	}
	ctx := c.Request.Context()
	tx, err := h.db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var category, employeeID, ttNo string
	var approved, delivered, assigned int
	err = tx.QueryRow(ctx, `SELECT COALESCE(category,''),COALESCE(employee_id,''),COALESCE(tt_no,''),COALESCE(approved_val,0),COALESCE(delivered_val,0),COALESCE(dev_assigned_val,0) FROM public.tt_reasons WHERE id=$1 AND COALESCE(status,1)=1 FOR UPDATE`, requisitionID).Scan(&category, &employeeID, &ttNo, &approved, &delivered, &assigned)
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "requisition not found")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if approved != 1 && approved != 3 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": "requisition must be approved before asset allocation"})
		return
	}
	if assigned == 1 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": "requisition already has an assigned asset"})
		return
	}
	if delivered == 1 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": "requisition is already delivered"})
		return
	}

	var serial, stockCategory, brand, model, deviceType, mr, pr, vendor string
	var purchase, warranty *time.Time
	err = tx.QueryRow(ctx, fmt.Sprintf(`SELECT COALESCE(s.serial_no,''),%s,COALESCE(s.brand,''),COALESCE(s.model,''),COALESCE(s.device_type,''),COALESCE(s.mr_id,''),COALESCE(s.pr_id,''),COALESCE(s.vendor_name,''),s.purchase_date,s.warranty_date FROM public.stack_inventory s WHERE s.id=$1 AND s.status=1 AND COALESCE(s.device_assigned_status,0)=0 FOR UPDATE`, resolvedStockCategorySQL), req.StockID).Scan(&serial, &stockCategory, &brand, &model, &deviceType, &mr, &pr, &vendor, &purchase, &warranty)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": "selected stock is no longer available"})
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if normalizedCategory(category) != "" && normalizedCategory(stockCategory) != "" && normalizedCategory(category) != normalizedCategory(stockCategory) {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": fmt.Sprintf("requested category %q does not match stock category %q", category, stockCategory)})
		return
	}

	var empName, department, designation string
	_ = tx.QueryRow(ctx, `SELECT COALESCE(employee_name,''),COALESCE(department_name,''),COALESCE(designation,'') FROM public.employee_office_info WHERE BTRIM(employee_id)=BTRIM($1) LIMIT 1`, employeeID).Scan(&empName, &department, &designation)
	currentEmployee := c.GetString("employee_id")

	var assetID int64
	var currentAssetStatus int
	assetErr := tx.QueryRow(ctx, `SELECT id,asset_status FROM public.asset_devices WHERE legacy_stack_id=$1 AND row_status=1 ORDER BY id DESC LIMIT 1 FOR UPDATE`, req.StockID).Scan(&assetID, &currentAssetStatus)
	if errors.Is(assetErr, pgx.ErrNoRows) {
		assetErr = tx.QueryRow(ctx, `INSERT INTO public.asset_devices (legacy_stack_id,device_serial,device_serial_key,category,brand,model,device_type,mr_number,pr_number,vendor_name,purchase_date,warranty_date,asset_status,row_status,emp_id,emp_name,department,designation,assigned_date,created_at,updated_at) VALUES ($1,$2,UPPER(BTRIM($2)),$3,$4,$5,$6,$7,$8,$9,$10,$11,1,1,$12,$13,$14,$15,NOW(),NOW(),NOW()) RETURNING id`, req.StockID, serial, stockCategory, brand, model, deviceType, mr, pr, vendor, purchase, warranty, employeeID, empName, department, designation).Scan(&assetID)
	} else if assetErr == nil {
		if currentAssetStatus != 0 {
			c.JSON(http.StatusConflict, gin.H{"success": false, "error": "asset registry shows this stock is not available"})
			return
		}
		_, assetErr = tx.Exec(ctx, `UPDATE public.asset_devices SET asset_status=1,emp_id=$1,emp_name=$2,department=$3,designation=$4,assigned_date=NOW(),updated_at=NOW(),category=$5,brand=$6,model=$7,device_type=$8,mr_number=$9,pr_number=$10,vendor_name=$11,purchase_date=$12,warranty_date=$13 WHERE id=$14`, employeeID, empName, department, designation, stockCategory, brand, model, deviceType, mr, pr, vendor, purchase, warranty, assetID)
	}
	if assetErr != nil {
		response.ServerError(c, assetErr)
		return
	}

	if _, err = tx.Exec(ctx, `UPDATE public.stack_inventory SET device_assigned_status=1,refno_tbl_it_equipment_requisition=$1,device_assiged_date=NOW(),device_assiged_by=$2,edited_by=$2,edited_at=NOW() WHERE id=$3 AND COALESCE(device_assigned_status,0)=0`, strconv.FormatInt(requisitionID, 10), currentEmployee, req.StockID); err != nil {
		response.ServerError(c, err)
		return
	}
	// In this simplified operational workflow, selecting the physical stock item
	// means it is being handed to the employee now. Assignment and delivery are
	// therefore committed atomically in the same transaction.
	if _, err = tx.Exec(ctx, `UPDATE public.tt_reasons SET device_sl_no=$1,dev_assigned_val=1,dev_assinged_by=$2,dev_assigned_date=NOW(),stock_inventory_id=$3,assignment_remarks=$4,delivered_val=1,delivered_by=$2,delivered_date=NOW(),delivery_remarks=$4,edited_by=$2,edited_at=NOW() WHERE id=$5`, serial, currentEmployee, req.StockID, strings.TrimSpace(req.Remarks), requisitionID); err != nil {
		response.ServerError(c, err)
		return
	}
	_, _ = tx.Exec(ctx, `INSERT INTO public.asset_device_history (asset_device_id,legacy_equipment_id,device_serial,status_code,raw_status,previous_status,emp_id,emp_name,department,designation,mr_number,pr_number,vendor,assigned_date,history_reason,created_at_source,updated_at_source,migrated_at) VALUES ($1,0,$2,1,'Assigned & Delivered',0,$3,$4,$5,$6,$7,$8,$9,NOW(),$10,NOW(),NOW(),NOW())`, assetID, serial, employeeID, empName, department, designation, mr, pr, vendor, fmt.Sprintf("Assigned and delivered through approved requisition %s", ttNo))
	_, _ = tx.Exec(ctx, `INSERT INTO public.audit_log (user_id,table_name,record_id,action,new_data) VALUES ($1,'tt_reasons',$2,'ASSIGN_AND_DELIVER_ASSET',jsonb_build_object('stock_id',$3,'asset_id',$4,'serial',$5,'employee_id',$6,'delivered_val',1))`, currentEmployee, requisitionID, req.StockID, assetID, serial, employeeID)
	if err = tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}
	response.OK(c, gin.H{"requisition_id": requisitionID, "tt_no": ttNo, "stock_id": req.StockID, "asset_id": assetID, "device_serial": serial, "employee_id": employeeID, "employee_name": empName, "assigned_by": currentEmployee, "assigned_at": time.Now(), "delivered_val": 1, "delivered_by": currentEmployee, "delivered_at": time.Now()})
}

type deliverRequest struct {
	Remarks string `json:"remarks"`
}

func (h *InventoryWorkflowHandler) ConfirmRequisitionDelivery(c *gin.Context) {
	requisitionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || requisitionID < 1 {
		response.BadRequest(c, "invalid requisition id")
		return
	}
	var req deliverRequest
	_ = c.ShouldBindJSON(&req)
	ctx := c.Request.Context()
	tx, err := h.db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)
	var approved, assigned, delivered int
	var ttNo, serial string
	err = tx.QueryRow(ctx, `SELECT COALESCE(approved_val,0),COALESCE(dev_assigned_val,0),COALESCE(delivered_val,0),COALESCE(tt_no,''),COALESCE(device_sl_no,'') FROM public.tt_reasons WHERE id=$1 AND COALESCE(status,1)=1 FOR UPDATE`, requisitionID).Scan(&approved, &assigned, &delivered, &ttNo, &serial)
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "requisition not found")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if approved != 1 && approved != 3 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": "requisition must be approved before delivery"})
		return
	}
	if assigned != 1 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": "assign an available stock item before confirming delivery"})
		return
	}
	if delivered == 1 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "error": "delivery already confirmed"})
		return
	}
	currentEmployee := c.GetString("employee_id")
	if _, err = tx.Exec(ctx, `UPDATE public.tt_reasons SET delivered_val=1,delivered_by=$1,delivered_date=NOW(),delivery_remarks=$2,edited_by=$1,edited_at=NOW() WHERE id=$3`, currentEmployee, strings.TrimSpace(req.Remarks), requisitionID); err != nil {
		response.ServerError(c, err)
		return
	}
	_, _ = tx.Exec(ctx, `INSERT INTO public.audit_log (user_id,table_name,record_id,action,new_data) VALUES ($1,'tt_reasons',$2,'CONFIRM_DELIVERY',jsonb_build_object('tt_no',$3,'device_serial',$4))`, currentEmployee, requisitionID, ttNo, serial)
	if err = tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}
	response.OK(c, gin.H{"requisition_id": requisitionID, "tt_no": ttNo, "device_serial": serial, "delivered_val": 1, "delivered_by": currentEmployee, "delivered_at": time.Now()})
}

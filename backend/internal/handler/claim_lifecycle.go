package handler

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

// Legacy-compatible claim status codes.
const (
	claimOpen       = 8
	claimWithVendor = 9
	claimClosed     = 10
)

// RegisterLifecycleRoutes is called from ClaimHandler.Register after the
// existing /claims routes are created.
func (h *ClaimHandler) RegisterLifecycleRoutes(g *gin.RouterGroup) {
	g.GET("/device/:asset_id/active", h.ActiveByDevice)
	g.POST("/device/:asset_id/open", h.OpenForDevice)
	g.GET("/:id/lifecycle", h.Lifecycle)
	g.POST("/:id/send-vendor", h.SendToVendor)
	g.POST("/:id/receive", h.ReceiveFromVendor)
	g.POST("/:id/close", h.CloseLifecycle)
	g.GET("/vendor-recipients", h.VendorRecipients)
	g.POST("/:id/workflow", h.WarrantyWorkflow)
	g.GET("/:id/history/:history_id/attachment", h.DownloadClaimAttachment)
}

func parsePathID(c *gin.Context, key string) (int64, bool) {
	id, err := strconv.ParseInt(c.Param(key), 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid "+key)
		return 0, false
	}
	return id, true
}

func claimUploadName(original string) string {
	name := filepath.Base(strings.TrimSpace(original))
	if name == "" {
		return "attachment"
	}

	var b strings.Builder
	for _, r := range name {
		switch {
		case r >= 'a' && r <= 'z':
			b.WriteRune(r)
		case r >= 'A' && r <= 'Z':
			b.WriteRune(r)
		case r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == '.', r == '-', r == '_':
			b.WriteRune(r)
		default:
			b.WriteRune('_')
		}
	}

	cleaned := strings.Trim(b.String(), "._")
	if cleaned == "" {
		return "attachment"
	}
	return cleaned
}

func claimAttachmentAllowed(filename string) bool {
	switch strings.ToLower(filepath.Ext(filename)) {
	case ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".txt",
		".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx":
		return true
	default:
		return false
	}
}

func normalizeClaimMobile(value string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(value) {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func saveClaimAttachment(c *gin.Context, claimID int64) (string, func(), error) {
	header, err := c.FormFile("attachment")
	if err != nil {
		if err == http.ErrMissingFile {
			return "", func() {}, nil
		}
		return "", func() {}, err
	}

	if header.Size > 4*1024*1024 {
		return "", func() {}, fmt.Errorf("attachment must be 4 MB or smaller")
	}
	if !claimAttachmentAllowed(header.Filename) {
		return "", func() {}, fmt.Errorf("attachment type is not allowed")
	}

	now := time.Now()
	dir := filepath.Join("uploads", "claims")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", func() {}, err
	}

	filename := fmt.Sprintf(
		"%d_%d_%s",
		claimID,
		now.UnixNano(),
		claimUploadName(header.Filename),
	)
	fullPath := filepath.Join(dir, filename)

	if err := c.SaveUploadedFile(header, fullPath); err != nil {
		return "", func() {}, err
	}

	cleanup := func() {
		_ = os.Remove(fullPath)
	}

	return filepath.ToSlash(fullPath), cleanup, nil
}

func appendClaimAssetHistory(
	ctx context.Context,
	tx pgx.Tx,
	assetID int64,
	statusCode int,
	rawStatus string,
	previousStatus int,
	historyReason string,
) error {
	_, err := tx.Exec(
		ctx,
		`
		INSERT INTO public.asset_device_history (
			asset_device_id,
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
			source_snapshot,
			created_at_source,
			updated_at_source,
			migrated_at
		)
		SELECT
			a.id,
			a.device_serial,
			$2,
			$3,
			$4,
			a.emp_id,
			a.emp_name,
			a.department,
			a.designation,
			a.mr_number,
			a.pr_number,
			a.vendor_name,
			a.assigned_date,
			$5,
			to_jsonb(a),
			NOW(),
			NOW(),
			NOW()
		FROM public.asset_devices a
		WHERE a.id = $1
		`,
		assetID,
		statusCode,
		rawStatus,
		previousStatus,
		historyReason,
	)
	return err
}

func (h *ClaimHandler) ActiveByDevice(c *gin.Context) {
	assetID, ok := parsePathID(c, "asset_id")
	if !ok {
		return
	}
	var (
		id            int64
		claimNo       string
		serial        string
		problem       string
		remarks       string
		claimStatus   int
		lifecycle     string
		restoreStatus *int
		restoreEmp    *string
		vendorID      *int64
		vendorName    *string
		createdAt     *string
	)
	err := h.db.QueryRow(c.Request.Context(), `
        SELECT c.id, COALESCE(c.claim_no,'LEG-'||c.id::text), COALESCE(c.device_sl_no,''),
               COALESCE(c.problems,''), COALESCE(c.remarks,''), c.claim_status,
               COALESCE(c.lifecycle_state, CASE WHEN c.claim_status=8 THEN 'OPEN' WHEN c.claim_status=9 THEN 'WITH_VENDOR' WHEN c.claim_status=10 THEN 'CLOSED' ELSE 'LEGACY' END),
               c.restore_asset_status, c.restore_emp_id,
               COALESCE(c.vendor_id, c.vendor::bigint), v.vendor_name, c.created_at::text
        FROM public.device_claims c
        LEFT JOIN public.warranty_vendors v ON v.id = COALESCE(c.vendor_id, c.vendor::bigint)
        WHERE c.asset_device_id=$1 AND COALESCE(c.status,1)=1 AND c.claim_status<>10
        ORDER BY c.created_at DESC NULLS LAST, c.id DESC
        LIMIT 1`, assetID).Scan(&id, &claimNo, &serial, &problem, &remarks, &claimStatus, &lifecycle, &restoreStatus, &restoreEmp, &vendorID, &vendorName, &createdAt)
	if err == pgx.ErrNoRows {
		response.OK(c, gin.H{"active": false, "claim": nil})
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}
	response.OK(c, gin.H{"active": true, "claim": gin.H{
		"id": id, "claim_no": claimNo, "asset_device_id": assetID, "device_serial": serial,
		"problem": problem, "remarks": remarks, "claim_status": claimStatus, "lifecycle_state": lifecycle,
		"restore_asset_status": restoreStatus, "restore_emp_id": restoreEmp, "vendor_id": vendorID,
		"vendor_name": vendorName, "created_at": createdAt,
	}})
}

func (h *ClaimHandler) OpenForDevice(c *gin.Context) {
	assetID, ok := parsePathID(c, "asset_id")
	if !ok {
		return
	}
	var req struct {
		Problems string `json:"problems" binding:"required"`
		Remarks  string `json:"remarks"`
		VendorID *int64 `json:"vendor_id"`
		EmailTo  string `json:"designated_email_to"`
		EmailCC  string `json:"designated_email_cc"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	req.Problems = strings.TrimSpace(req.Problems)
	if req.Problems == "" {
		response.BadRequest(c, "problem / claim reason is required")
		return
	}
	ctx := c.Request.Context()
	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var serial, category, brand, model, empID string
	var assetStatus int
	var currentVendor *int64
	err = tx.QueryRow(ctx, `SELECT COALESCE(device_serial,''),COALESCE(category,''),COALESCE(brand,''),COALESCE(model,''),COALESCE(emp_id,''),asset_status,vendor_id FROM public.asset_devices WHERE id=$1 FOR UPDATE`, assetID).
		Scan(&serial, &category, &brand, &model, &empID, &assetStatus, &currentVendor)
	if err == pgx.ErrNoRows {
		response.NotFound(c, "asset device not found")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if assetStatus != 0 && assetStatus != 1 && assetStatus != 4 {
		response.BadRequest(c, "Warranty claim can be opened only from Available, Assigned, or Returned status.")
		return
	}

	var exists int
	err = tx.QueryRow(ctx, `SELECT COUNT(*) FROM public.device_claims WHERE asset_device_id=$1 AND COALESCE(status,1)=1 AND claim_status<>10`, assetID).Scan(&exists)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if exists > 0 {
		response.BadRequest(c, "This device already has an active warranty claim.")
		return
	}

	vendorID := req.VendorID
	if vendorID == nil {
		vendorID = currentVendor
	}
	actor := currentEmployeeID(c)
	var claimID int64
	err = tx.QueryRow(ctx, `
        INSERT INTO public.device_claims (
            asset_device_id, reference_no_claim, category, brand, model_no, device_sl_no,
            claim_status, previous_status, lifecycle_state, vendor, vendor_id,
            remarks, problems, designated_email_to, designated_email_cc,
            created_by, created_at, status, service_type,
            restore_asset_status, restore_emp_id
        ) VALUES ($1::bigint,$1::bigint::integer,$2,$3,$4,$5,8,8,'OPEN',$6::bigint::integer,$6::bigint,$7,$8,$9,$10,$11,NOW(),1,2,$12,NULLIF($13,''))
        RETURNING id`, assetID, category, brand, model, serial, vendorID, strings.TrimSpace(req.Remarks), req.Problems,
		strings.TrimSpace(req.EmailTo), strings.TrimSpace(req.EmailCC), actor, assetStatus, empID).Scan(&claimID)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	claimNo := fmt.Sprintf("WC-%s-%06d", strings.ReplaceAll(strings.Split(fmt.Sprint(c.Request.Context()), " ")[0], "-", ""), claimID)
	// Stable human ref; year comes from DB so server timezone is authoritative.
	err = tx.QueryRow(ctx, `UPDATE public.device_claims SET claim_no='WC-'||to_char(NOW(),'YYYY')||'-'||LPAD(id::text,6,'0') WHERE id=$1 RETURNING claim_no`, claimID).Scan(&claimNo)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	_, err = tx.Exec(ctx, `UPDATE public.asset_devices SET asset_status=8 WHERE id=$1`, assetID)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	_, err = tx.Exec(ctx, `INSERT INTO public.device_claim_histories (claim_id,asset_device_id,claim_reference_no,device_sl_no,previous_status,current_status,remarks,created_by,created_at,status,service_type,event_type) VALUES ($1,$2::bigint,$2::bigint::text,$3,$4,8,$5,$6,NOW(),1,2,'CLAIM_OPENED')`, claimID, assetID, serial, assetStatus, strings.TrimSpace(req.Remarks), actor)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if err = appendClaimAssetHistory(
		ctx,
		tx,
		assetID,
		claimOpen,
		"Claim Raised",
		assetStatus,
		fmt.Sprintf("Warranty claim %s raised: %s", claimNo, req.Problems),
	); err != nil {
		response.ServerError(c, err)
		return
	}
	if err = tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": gin.H{"id": claimID, "claim_no": claimNo, "claim_status": 8, "lifecycle_state": "OPEN", "restore_asset_status": assetStatus}})
}

func (h *ClaimHandler) SendToVendor(c *gin.Context) {
	claimID, ok := parsePathID(c, "id")
	if !ok {
		return
	}

	if err := c.Request.ParseMultipartForm(5 << 20); err != nil {
		response.BadRequest(c, "invalid multipart form: "+err.Error())
		return
	}

	vendorReceiver := strings.TrimSpace(c.PostForm("vendor_receiver"))
	vendorMobile := normalizeClaimMobile(c.PostForm("vendor_mobile"))
	gatePassDate := strings.TrimSpace(c.PostForm("gate_pass_date"))
	gatePassRemarks := strings.TrimSpace(c.PostForm("gate_pass_remarks"))
	remarks := strings.TrimSpace(c.PostForm("remarks"))
	companyMaterial := c.PostForm("company_material") == "1"
	returnable := c.PostForm("returnable") == "1"

	if vendorReceiver == "" {
		response.BadRequest(c, "vendor recipient name is required")
		return
	}
	if len(vendorMobile) != 11 {
		response.BadRequest(c, "vendor recipient mobile must contain exactly 11 digits")
		return
	}
	if gatePassDate == "" {
		response.BadRequest(c, "gate pass date is required")
		return
	}
	if _, err := time.Parse("2006-01-02", gatePassDate); err != nil {
		response.BadRequest(c, "gate pass date must be YYYY-MM-DD")
		return
	}
	if gatePassRemarks == "" {
		response.BadRequest(c, "gate pass remarks are required")
		return
	}

	ctx := c.Request.Context()
	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var assetID int64
	var serial string
	var status int
	var lifecycle string
	var claimNo string
	var vendorName string

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			c.asset_device_id,
			COALESCE(c.device_sl_no,''),
			c.claim_status,
			COALESCE(c.lifecycle_state,''),
			COALESCE(c.claim_no,'LEG-'||c.id::text),
			COALESCE(v.vendor_name,'')
		FROM public.device_claims c
		LEFT JOIN public.warranty_vendors v
			ON v.id = COALESCE(c.vendor_id, c.vendor::bigint)
		WHERE c.id=$1
		FOR UPDATE OF c
		`,
		claimID,
	).Scan(
		&assetID,
		&serial,
		&status,
		&lifecycle,
		&claimNo,
		&vendorName,
	)
	if err == pgx.ErrNoRows {
		response.NotFound(c, "claim not found")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if status != claimOpen || lifecycle != "OPEN" {
		response.BadRequest(
			c,
			"only an OPEN Claim Raised record can be transferred to the vendor",
		)
		return
	}

	attachmentPath, cleanupAttachment, err := saveClaimAttachment(c, claimID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	keepAttachment := false
	defer func() {
		if !keepAttachment {
			cleanupAttachment()
		}
	}()

	actor := currentEmployeeID(c)

	_, err = tx.Exec(
		ctx,
		`
		UPDATE public.device_claims
		SET
			previous_status = claim_status,
			claim_status = 9,
			lifecycle_state = 'WITH_VENDOR',
			vendor_receiver = $2,
			vndr_receiver_mobile = $3,
			gate_pass_date = $4::date,
			gate_pass_remarks = $5,
			remarks = COALESCE(NULLIF($6,''), remarks),
			attach_file = COALESCE(NULLIF($7,''), attach_file),
			received_date = NOW(),
			received_by = $8,
			edited_by = $8,
			edited_at = NOW()
		WHERE id = $1
		`,
		claimID,
		vendorReceiver,
		vendorMobile,
		gatePassDate,
		gatePassRemarks,
		remarks,
		attachmentPath,
		actor,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	metaCompany := "false"
	if companyMaterial {
		metaCompany = "true"
	}
	metaReturnable := "false"
	if returnable {
		metaReturnable = "true"
	}

	_, err = tx.Exec(
		ctx,
		`
		INSERT INTO public.device_claim_histories (
			claim_id,
			asset_device_id,
			claim_reference_no,
			device_sl_no,
			previous_status,
			current_status,
			remarks,
			vendor_personnel_name,
			vendor_mobile,
			attach_file,
			created_by,
			created_at,
			status,
			service_type,
			event_type,
			metadata
		)
		VALUES (
			$1,
			$2::bigint,
			$2::bigint::text,
			$3,
			$4,
			9,
			$5,
			$6,
			$7,
			NULLIF($8,''),
			$9,
			NOW(),
			1,
			2,
			'SENT_TO_VENDOR',
			jsonb_build_object(
				'claim_no',$10::text,
				'vendor_name',$11::text,
				'gate_pass_date',$12::text,
				'gate_pass_remarks',$13::text,
				'company_material',$14::boolean,
				'returnable',$15::boolean,
				'attachment',$8::text
			)
		)
		`,
		claimID,
		assetID,
		serial,
		status,
		remarks,
		vendorReceiver,
		vendorMobile,
		attachmentPath,
		actor,
		claimNo,
		vendorName,
		gatePassDate,
		gatePassRemarks,
		metaCompany,
		metaReturnable,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	historyReason := fmt.Sprintf(
		"Warranty claim %s transferred to vendor %s. Receiver: %s (%s). Gate pass: %s.",
		claimNo,
		vendorName,
		vendorReceiver,
		vendorMobile,
		gatePassRemarks,
	)
	if err = appendClaimAssetHistory(
		ctx,
		tx,
		assetID,
		claimOpen,
		"Claim: With Vendor",
		claimOpen,
		historyReason,
	); err != nil {
		response.ServerError(c, err)
		return
	}

	if err = tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	keepAttachment = true
	response.OK(c, gin.H{
		"claim_status":    9,
		"lifecycle_state": "WITH_VENDOR",
		"attachment":      attachmentPath,
		"vendor_receiver": vendorReceiver,
		"vendor_mobile":   vendorMobile,
	})
}

func (h *ClaimHandler) VendorRecipients(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))

	rows, err := h.db.Query(
		c.Request.Context(),
		`
		WITH recipient_source AS (
			SELECT
				BTRIM(COALESCE(vendor_personnel_name, '')) AS name,
				BTRIM(COALESCE(vendor_mobile::text, '')) AS mobile,
				created_at
			FROM public.device_claim_histories
			WHERE BTRIM(COALESCE(vendor_personnel_name, '')) <> ''

			UNION ALL

			SELECT
				BTRIM(COALESCE(vendor_receiver, '')) AS name,
				BTRIM(COALESCE(vndr_receiver_mobile::text, '')) AS mobile,
				COALESCE(edited_at, created_at)
			FROM public.device_claims
			WHERE BTRIM(COALESCE(vendor_receiver, '')) <> ''
		),
		latest AS (
			SELECT DISTINCT ON (LOWER(name))
				name,
				mobile,
				created_at
			FROM recipient_source
			WHERE $1::text = ''
			   OR name ILIKE '%' || $1::text || '%'
			ORDER BY
				LOWER(name),
				created_at DESC NULLS LAST
		)
		SELECT name, mobile
		FROM latest
		ORDER BY name
		LIMIT 100
		`,
		query,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]gin.H, 0)
	for rows.Next() {
		var name, mobile string
		if err := rows.Scan(&name, &mobile); err != nil {
			response.ServerError(c, err)
			return
		}
		items = append(items, gin.H{
			"name":   name,
			"mobile": mobile,
		})
	}
	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, items)
}

func (h *ClaimHandler) DownloadClaimAttachment(c *gin.Context) {
	claimID, ok := parsePathID(c, "id")
	if !ok {
		return
	}
	historyID, ok := parsePathID(c, "history_id")
	if !ok {
		return
	}

	var storedPath string
	err := h.db.QueryRow(
		c.Request.Context(),
		`SELECT COALESCE(attach_file,'')
		 FROM public.device_claim_histories
		 WHERE id=$1 AND claim_id=$2`,
		historyID,
		claimID,
	).Scan(&storedPath)
	if err == pgx.ErrNoRows {
		response.NotFound(c, "claim attachment not found")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}

	storedPath = filepath.ToSlash(strings.TrimSpace(storedPath))
	if storedPath == "" || !strings.HasPrefix(storedPath, "uploads/claims/") {
		response.NotFound(c, "claim attachment not found")
		return
	}

	fullPath := filepath.Clean(filepath.FromSlash(storedPath))
	claimsRoot := filepath.Clean(filepath.Join("uploads", "claims"))
	relative, err := filepath.Rel(claimsRoot, fullPath)
	if err != nil ||
		relative == ".." ||
		strings.HasPrefix(relative, ".."+string(os.PathSeparator)) {
		response.BadRequest(c, "invalid attachment path")
		return
	}

	if _, err := os.Stat(fullPath); err != nil {
		if os.IsNotExist(err) {
			response.NotFound(c, "claim attachment file is missing")
			return
		}
		response.ServerError(c, err)
		return
	}

	c.FileAttachment(fullPath, filepath.Base(fullPath))
}

func (h *ClaimHandler) WarrantyWorkflow(c *gin.Context) {
	claimID, ok := parsePathID(c, "id")
	if !ok {
		return
	}

	if err := c.Request.ParseMultipartForm(5 << 20); err != nil {
		response.BadRequest(c, "invalid multipart form: "+err.Error())
		return
	}

	targetStatus := strings.TrimSpace(c.PostForm("target_status"))
	feedback := strings.TrimSpace(c.PostForm("feedback"))
	vendorReceiver := strings.TrimSpace(c.PostForm("vendor_receiver"))
	vendorMobile := strings.TrimSpace(c.PostForm("vendor_mobile"))
	gatePassDate := strings.TrimSpace(c.PostForm("gate_pass_date"))
	gatePassRemarks := strings.TrimSpace(c.PostForm("gate_pass_remarks"))

	if targetStatus != "9" && targetStatus != "10" {
		response.BadRequest(c, "target_status must be 9 (Transferred to Vendor) or 10 (Closed)")
		return
	}
	if feedback == "" {
		response.BadRequest(c, "IT feedback is required")
		return
	}
	if len(feedback) > 1500 {
		response.BadRequest(c, "IT feedback cannot exceed 1500 characters")
		return
	}
	if vendorReceiver == "" {
		response.BadRequest(c, "vendor recipient / delivery-man name is required")
		return
	}
	if len(vendorReceiver) > 255 || len(vendorMobile) > 50 {
		response.BadRequest(c, "vendor recipient information is too long")
		return
	}
	mobileDigits := strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, vendorMobile)
	if len(mobileDigits) != 11 {
		response.BadRequest(c, "vendor recipient mobile must contain exactly 11 digits")
		return
	}
	ctx := c.Request.Context()
	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var (
		assetID    int64
		serial     string
		status     int
		lifecycle  string
		claimNo    string
		restore    *int
		restoreEmp *string
	)

	err = tx.QueryRow(
		ctx,
		`SELECT
			asset_device_id,
			COALESCE(device_sl_no,''),
			claim_status,
			COALESCE(lifecycle_state,''),
			COALESCE(claim_no,'LEG-'||id::text),
			restore_asset_status,
			restore_emp_id
		 FROM public.device_claims
		 WHERE id=$1
		 FOR UPDATE`,
		claimID,
	).Scan(
		&assetID,
		&serial,
		&status,
		&lifecycle,
		&claimNo,
		&restore,
		&restoreEmp,
	)
	if err == pgx.ErrNoRows {
		response.NotFound(c, "claim not found")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if status == claimClosed || lifecycle == "CLOSED" {
		response.BadRequest(c, "claim is already closed")
		return
	}
	if status != claimWithVendor && lifecycle != "WITH_VENDOR" {
		response.BadRequest(c, "Warranty Claim Workflow is available only after Transfer To Vendor")
		return
	}

	attachmentPath, cleanupAttachment, err := saveClaimAttachment(c, claimID)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	keepAttachment := false
	defer func() {
		if !keepAttachment {
			cleanupAttachment()
		}
	}()

	actor := currentEmployeeID(c)

	if targetStatus == "9" {
		_, err = tx.Exec(
			ctx,
			`
			UPDATE public.device_claims
			SET
				claim_status=9,
				lifecycle_state='WITH_VENDOR',
				remarks=$2,
				vendor_receiver=$3,
				vndr_receiver_mobile=$4,
				gate_pass_date=$5::date,
				gate_pass_remarks=$6,
				attach_file=COALESCE(NULLIF($7,''),attach_file),
				edited_by=$8,
				edited_at=NOW()
			WHERE id=$1
			`,
			claimID,
			feedback,
			vendorReceiver,
			mobileDigits,
			gatePassDate,
			gatePassRemarks,
			attachmentPath,
			actor,
		)
		if err != nil {
			response.ServerError(c, err)
			return
		}

		_, err = tx.Exec(
			ctx,
			`
			INSERT INTO public.device_claim_histories (
				claim_id,
				asset_device_id,
				claim_reference_no,
				device_sl_no,
				previous_status,
				current_status,
				remarks,
				vendor_personnel_name,
				vendor_mobile,
				attach_file,
				created_by,
				created_at,
				status,
				service_type,
				event_type,
				metadata
			)
			VALUES (
				$1,
				$2::bigint,
				$2::bigint::text,
				$3,
				9,
				9,
				$4,
				$5,
				$6,
				NULLIF($7,''),
				$8,
				NOW(),
				1,
				2,
				'VENDOR_FOLLOWUP',
				jsonb_build_object(
					'claim_no',$9::text,
					'workflow_status','WITH_VENDOR',
					'gate_pass_date',$10::text,
					'gate_pass_remarks',$11::text
				)
			)
			`,
			claimID,
			assetID,
			serial,
			feedback,
			vendorReceiver,
			mobileDigits,
			attachmentPath,
			actor,
			claimNo,
			gatePassDate,
			gatePassRemarks,
		)
		if err != nil {
			response.ServerError(c, err)
			return
		}

		if err = appendClaimAssetHistory(
			ctx,
			tx,
			assetID,
			claimOpen,
			"Claim: With Vendor",
			claimOpen,
			fmt.Sprintf(
				"Warranty workflow transferred to vendor recipient %s (%s): %s",
				vendorReceiver,
				mobileDigits,
				feedback,
			),
		); err != nil {
			response.ServerError(c, err)
			return
		}

		if err = tx.Commit(ctx); err != nil {
			response.ServerError(c, err)
			return
		}
		keepAttachment = true

		response.OK(c, gin.H{
			"claim_status":    9,
			"lifecycle_state": "WITH_VENDOR",
		})
		return
	}

	if restore == nil || (*restore != 0 && *restore != 1 && *restore != 4) {
		response.BadRequest(c, "restore asset status is missing for this claim")
		return
	}

	_, err = tx.Exec(
		ctx,
		`UPDATE public.device_claims
		 SET previous_status=claim_status,
		     claim_status=10,
		     lifecycle_state='CLOSED',
		     resolution=$2,
		     return_issue=$2,
		     return_date=NOW(),
		     return_by_it_person=$3,
		     vendor_receiver=$4,
		     vndr_receiver_mobile=$5,
		     closed_by=$3,
		     closed_at=NOW(),
		     attach_file=COALESCE(NULLIF($6,''),attach_file),
		     edited_by=$3,
		     edited_at=NOW()
		 WHERE id=$1`,
		claimID,
		feedback,
		actor,
		vendorReceiver,
		mobileDigits,
		attachmentPath,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if *restore == 1 {
		_, err = tx.Exec(
			ctx,
			`UPDATE public.asset_devices
			 SET asset_status=1,
			     emp_id=COALESCE(NULLIF(emp_id,''),NULLIF($2,'')),
			     updated_at=NOW()
			 WHERE id=$1`,
			assetID,
			restoreEmp,
		)
	} else {
		_, err = tx.Exec(
			ctx,
			`UPDATE public.asset_devices
			 SET asset_status=$2,
			     emp_id=NULL,
			     emp_name=NULL,
			     department=NULL,
			     designation=NULL,
			     updated_at=NOW()
			 WHERE id=$1`,
			assetID,
			*restore,
		)
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}

	_, err = tx.Exec(
		ctx,
		`INSERT INTO public.device_claim_histories (
			claim_id,
			asset_device_id,
			claim_reference_no,
			device_sl_no,
			previous_status,
			current_status,
			remarks,
			vendor_personnel_name,
			vendor_mobile,
			attach_file,
			created_by,
			created_at,
			status,
			service_type,
			event_type,
			metadata
		 ) VALUES (
			$1,
			$2::bigint,
			$2::bigint::text,
			$3,
			9,
			10,
			$4,
			$5,
			$6,
			NULLIF($7,''),
			$8,
			NOW(),
			1,
			2,
			'CLAIM_CLOSED',
			jsonb_build_object(
				'restored_asset_status',$9::integer,
				'claim_no',$10::text
			)
		 )`,
		claimID,
		assetID,
		serial,
		feedback,
		vendorReceiver,
		mobileDigits,
		attachmentPath,
		actor,
		*restore,
		claimNo,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	label := map[int]string{
		0: "Available",
		1: "Assigned",
		4: "Returned",
	}[*restore]

	if err = appendClaimAssetHistory(
		ctx,
		tx,
		assetID,
		*restore,
		"Warranty Claim Closed",
		claimOpen,
		fmt.Sprintf(
			"Warranty claim %s closed and device restored to %s. Vendor recipient: %s (%s) | IT feedback: %s",
			claimNo,
			label,
			vendorReceiver,
			mobileDigits,
			feedback,
		),
	); err != nil {
		response.ServerError(c, err)
		return
	}

	if err = tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}
	keepAttachment = true

	response.OK(c, gin.H{
		"claim_status":          10,
		"lifecycle_state":       "CLOSED",
		"restored_asset_status": *restore,
		"restored_status_label": label,
	})
}

func (h *ClaimHandler) ReceiveFromVendor(c *gin.Context) {
	claimID, ok := parsePathID(c, "id")
	if !ok {
		return
	}
	var req struct {
		Remarks string `json:"remarks" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	ctx := c.Request.Context()
	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)
	var assetID int64
	var serial string
	var status int
	err = tx.QueryRow(ctx, `SELECT asset_device_id,COALESCE(device_sl_no,''),claim_status FROM public.device_claims WHERE id=$1 FOR UPDATE`, claimID).Scan(&assetID, &serial, &status)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "claim not found")
		} else {
			response.ServerError(c, err)
		}
		return
	}
	if status == 10 {
		response.BadRequest(c, "claim is already closed")
		return
	}
	actor := currentEmployeeID(c)
	_, err = tx.Exec(ctx, `UPDATE public.device_claims SET lifecycle_state='RECEIVED',received_date=NOW(),received_by=$2,remarks=$3,edited_by=$2,edited_at=NOW() WHERE id=$1`, claimID, actor, strings.TrimSpace(req.Remarks))
	if err != nil {
		response.ServerError(c, err)
		return
	}
	_, err = tx.Exec(ctx, `INSERT INTO public.device_claim_histories (claim_id,asset_device_id,claim_reference_no,device_sl_no,previous_status,current_status,remarks,created_by,created_at,status,service_type,event_type) VALUES ($1,$2::bigint,$2::bigint::text,$3,$4,9,$5,$6,NOW(),1,2,'RECEIVED_FROM_VENDOR')`, claimID, assetID, serial, status, strings.TrimSpace(req.Remarks), actor)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if err = appendClaimAssetHistory(
		ctx,
		tx,
		assetID,
		claimOpen,
		"Claim: Received from Vendor",
		claimWithVendor,
		"Warranty device received from vendor: "+strings.TrimSpace(req.Remarks),
	); err != nil {
		response.ServerError(c, err)
		return
	}
	if err = tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}
	response.OK(c, gin.H{"claim_status": 9, "lifecycle_state": "RECEIVED"})
}

func (h *ClaimHandler) CloseLifecycle(c *gin.Context) {
	claimID, ok := parsePathID(c, "id")
	if !ok {
		return
	}
	var req struct {
		Resolution string `json:"resolution" binding:"required"`
		Remarks    string `json:"remarks"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	ctx := c.Request.Context()
	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)
	var assetID int64
	var serial string
	var status int
	var restore *int
	var restoreEmp *string
	err = tx.QueryRow(ctx, `SELECT asset_device_id,COALESCE(device_sl_no,''),claim_status,restore_asset_status,restore_emp_id FROM public.device_claims WHERE id=$1 FOR UPDATE`, claimID).Scan(&assetID, &serial, &status, &restore, &restoreEmp)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "claim not found")
		} else {
			response.ServerError(c, err)
		}
		return
	}
	if status == 10 {
		response.BadRequest(c, "claim is already closed")
		return
	}
	if restore == nil || (*restore != 0 && *restore != 1 && *restore != 4) {
		response.BadRequest(c, "restore asset status is missing for this legacy claim. Reconcile it before closing.")
		return
	}
	actor := currentEmployeeID(c)
	_, err = tx.Exec(ctx, `UPDATE public.device_claims SET previous_status=claim_status,claim_status=10,lifecycle_state='CLOSED',resolution=$2,return_issue=$2,return_date=NOW(),return_by_it_person=$3,closed_by=$3,closed_at=NOW(),edited_by=$3,edited_at=NOW() WHERE id=$1`, claimID, strings.TrimSpace(req.Resolution), actor)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if *restore == 1 {
		_, err = tx.Exec(ctx, `UPDATE public.asset_devices SET asset_status=1,emp_id=COALESCE(NULLIF(emp_id,''),$2) WHERE id=$1`, assetID, restoreEmp)
	} else {
		_, err = tx.Exec(ctx, `UPDATE public.asset_devices SET asset_status=$2,emp_id=NULL WHERE id=$1`, assetID, *restore)
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}
	_, err = tx.Exec(ctx, `INSERT INTO public.device_claim_histories (claim_id,asset_device_id,claim_reference_no,device_sl_no,previous_status,current_status,remarks,created_by,created_at,status,service_type,event_type,metadata) VALUES ($1,$2::bigint,$2::bigint::text,$3,$4,10,$5,$6,NOW(),1,2,'CLAIM_CLOSED',jsonb_build_object('restored_asset_status',$7))`, claimID, assetID, serial, status, strings.TrimSpace(req.Resolution), actor, *restore)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	label := map[int]string{0: "Available", 1: "Assigned", 4: "Returned"}[*restore]
	if err = appendClaimAssetHistory(
		ctx,
		tx,
		assetID,
		*restore,
		"Warranty Claim Closed",
		claimOpen,
		fmt.Sprintf("Warranty claim closed and device restored to %s: %s", label, strings.TrimSpace(req.Resolution)),
	); err != nil {
		response.ServerError(c, err)
		return
	}
	if err = tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}
	response.OK(c, gin.H{"claim_status": 10, "lifecycle_state": "CLOSED", "restored_asset_status": *restore, "restored_status_label": label})
}

func (h *ClaimHandler) Lifecycle(c *gin.Context) {
	claimID, ok := parsePathID(c, "id")
	if !ok {
		return
	}
	rows, err := h.db.Query(c.Request.Context(), `SELECT id,COALESCE(event_type,''),previous_status,current_status,COALESCE(remarks,''),COALESCE(vendor_personnel_name,''),COALESCE(vendor_mobile::text,''),COALESCE(created_by,''),created_at::text,COALESCE(attach_file,''),metadata FROM public.device_claim_histories WHERE claim_id=$1 ORDER BY created_at,id`, claimID)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	items := []gin.H{}
	for rows.Next() {
		var id int64
		var event, remarks, vendor, mobile, actor, at, attachFile string
		var prev, curr int
		var meta any
		if err := rows.Scan(&id, &event, &prev, &curr, &remarks, &vendor, &mobile, &actor, &at, &attachFile, &meta); err != nil {
			response.ServerError(c, err)
			return
		}
		items = append(items, gin.H{"id": id, "event": event, "previous_status": prev, "current_status": curr, "remarks": remarks, "vendor_personnel_name": vendor, "vendor_mobile": mobile, "changed_by": actor, "changed_at": at, "attach_file": attachFile, "metadata": meta})
	}
	response.OK(c, items)
}

// package handler

// import (
// 	"fmt"
// 	"net/http"
// 	"strconv"
// 	"strings"

// 	"itm-api/pkg/response"

// 	"github.com/gin-gonic/gin"
// 	"github.com/jackc/pgx/v5"
// )

// // Legacy-compatible claim status codes.
// const (
// 	claimOpen       = 8
// 	claimWithVendor = 9
// 	claimClosed     = 10
// )

// // RegisterLifecycleRoutes is called from ClaimHandler.Register after the
// // existing /claims routes are created.
// func (h *ClaimHandler) RegisterLifecycleRoutes(g *gin.RouterGroup) {
// 	g.GET("/device/:asset_id/active", h.ActiveByDevice)
// 	g.POST("/device/:asset_id/open", h.OpenForDevice)
// 	g.GET("/:id/lifecycle", h.Lifecycle)
// 	g.POST("/:id/send-vendor", h.SendToVendor)
// 	g.POST("/:id/receive", h.ReceiveFromVendor)
// 	g.POST("/:id/close", h.CloseLifecycle)
// }

// func parsePathID(c *gin.Context, key string) (int64, bool) {
// 	id, err := strconv.ParseInt(c.Param(key), 10, 64)
// 	if err != nil || id <= 0 {
// 		response.BadRequest(c, "invalid "+key)
// 		return 0, false
// 	}
// 	return id, true
// }

// func (h *ClaimHandler) ActiveByDevice(c *gin.Context) {
// 	assetID, ok := parsePathID(c, "asset_id")
// 	if !ok {
// 		return
// 	}
// 	var (
// 		id            int64
// 		claimNo       string
// 		serial        string
// 		problem       string
// 		remarks       string
// 		claimStatus   int
// 		lifecycle     string
// 		restoreStatus *int
// 		restoreEmp    *string
// 		vendorID      *int64
// 		vendorName    *string
// 		createdAt     *string
// 	)
// 	err := h.db.QueryRow(c.Request.Context(), `
//         SELECT c.id, COALESCE(c.claim_no,'LEG-'||c.id::text), COALESCE(c.device_sl_no,''),
//                COALESCE(c.problems,''), COALESCE(c.remarks,''), c.claim_status,
//                COALESCE(c.lifecycle_state, CASE WHEN c.claim_status=8 THEN 'OPEN' WHEN c.claim_status=9 THEN 'WITH_VENDOR' WHEN c.claim_status=10 THEN 'CLOSED' ELSE 'LEGACY' END),
//                c.restore_asset_status, c.restore_emp_id,
//                COALESCE(c.vendor_id, c.vendor::bigint), v.vendor_name, c.created_at::text
//         FROM public.device_claims c
//         LEFT JOIN public.warranty_vendors v ON v.id = COALESCE(c.vendor_id, c.vendor::bigint)
//         WHERE c.asset_device_id=$1 AND COALESCE(c.status,1)=1 AND c.claim_status<>10
//         ORDER BY c.created_at DESC NULLS LAST, c.id DESC
//         LIMIT 1`, assetID).Scan(&id, &claimNo, &serial, &problem, &remarks, &claimStatus, &lifecycle, &restoreStatus, &restoreEmp, &vendorID, &vendorName, &createdAt)
// 	if err == pgx.ErrNoRows {
// 		response.OK(c, gin.H{"active": false, "claim": nil})
// 		return
// 	}
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	response.OK(c, gin.H{"active": true, "claim": gin.H{
// 		"id": id, "claim_no": claimNo, "asset_device_id": assetID, "device_serial": serial,
// 		"problem": problem, "remarks": remarks, "claim_status": claimStatus, "lifecycle_state": lifecycle,
// 		"restore_asset_status": restoreStatus, "restore_emp_id": restoreEmp, "vendor_id": vendorID,
// 		"vendor_name": vendorName, "created_at": createdAt,
// 	}})
// }

// func (h *ClaimHandler) OpenForDevice(c *gin.Context) {
// 	assetID, ok := parsePathID(c, "asset_id")
// 	if !ok {
// 		return
// 	}
// 	var req struct {
// 		Problems string `json:"problems" binding:"required"`
// 		Remarks  string `json:"remarks"`
// 		VendorID *int64 `json:"vendor_id"`
// 		EmailTo  string `json:"designated_email_to"`
// 		EmailCC  string `json:"designated_email_cc"`
// 	}
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(c, err.Error())
// 		return
// 	}
// 	req.Problems = strings.TrimSpace(req.Problems)
// 	if req.Problems == "" {
// 		response.BadRequest(c, "problem / claim reason is required")
// 		return
// 	}
// 	ctx := c.Request.Context()
// 	tx, err := h.db.Begin(ctx)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	defer tx.Rollback(ctx)

// 	var serial, category, brand, model, empID string
// 	var assetStatus int
// 	var currentVendor *int64
// 	err = tx.QueryRow(ctx, `SELECT COALESCE(device_serial,''),COALESCE(category,''),COALESCE(brand,''),COALESCE(model,''),COALESCE(emp_id,''),asset_status,vendor_id FROM public.asset_devices WHERE id=$1 FOR UPDATE`, assetID).
// 		Scan(&serial, &category, &brand, &model, &empID, &assetStatus, &currentVendor)
// 	if err == pgx.ErrNoRows {
// 		response.NotFound(c, "asset device not found")
// 		return
// 	}
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if assetStatus != 0 && assetStatus != 1 && assetStatus != 4 {
// 		response.BadRequest(c, "Warranty claim can be opened only from Available, Assigned, or Returned status.")
// 		return
// 	}

// 	var exists int
// 	err = tx.QueryRow(ctx, `SELECT COUNT(*) FROM public.device_claims WHERE asset_device_id=$1 AND COALESCE(status,1)=1 AND claim_status<>10`, assetID).Scan(&exists)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if exists > 0 {
// 		response.BadRequest(c, "This device already has an active warranty claim.")
// 		return
// 	}

// 	vendorID := req.VendorID
// 	if vendorID == nil {
// 		vendorID = currentVendor
// 	}
// 	actor := currentEmployeeID(c)
// 	var claimID int64
// 	err = tx.QueryRow(ctx, `
//         INSERT INTO public.device_claims (
//             asset_device_id, reference_no_claim, category, brand, model_no, device_sl_no,
//             claim_status, previous_status, lifecycle_state, vendor, vendor_id,
//             remarks, problems, designated_email_to, designated_email_cc,
//             created_by, created_at, status, service_type,
//             restore_asset_status, restore_emp_id
//         ) VALUES ($1,$1,$2,$3,$4,$5,8,8,'OPEN',$6,$6,$7,$8,$9,$10,$11,NOW(),1,2,$12,NULLIF($13,''))
//         RETURNING id`, assetID, category, brand, model, serial, vendorID, strings.TrimSpace(req.Remarks), req.Problems,
// 		strings.TrimSpace(req.EmailTo), strings.TrimSpace(req.EmailCC), actor, assetStatus, empID).Scan(&claimID)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	claimNo := fmt.Sprintf("WC-%s-%06d", strings.ReplaceAll(strings.Split(fmt.Sprint(c.Request.Context()), " ")[0], "-", ""), claimID)
// 	// Stable human ref; year comes from DB so server timezone is authoritative.
// 	err = tx.QueryRow(ctx, `UPDATE public.device_claims SET claim_no='WC-'||to_char(NOW(),'YYYY')||'-'||LPAD(id::text,6,'0') WHERE id=$1 RETURNING claim_no`, claimID).Scan(&claimNo)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	_, err = tx.Exec(ctx, `UPDATE public.asset_devices SET asset_status=8 WHERE id=$1`, assetID)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	_, err = tx.Exec(ctx, `INSERT INTO public.device_claim_histories (claim_id,asset_device_id,claim_reference_no,device_sl_no,previous_status,current_status,remarks,created_by,created_at,status,service_type,event_type) VALUES ($1,$2,$2,$3,$4,8,$5,$6,NOW(),1,2,'CLAIM_OPENED')`, claimID, assetID, serial, assetStatus, strings.TrimSpace(req.Remarks), actor)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if err = tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	c.JSON(http.StatusCreated, gin.H{"success": true, "data": gin.H{"id": claimID, "claim_no": claimNo, "claim_status": 8, "lifecycle_state": "OPEN", "restore_asset_status": assetStatus}})
// }

// func (h *ClaimHandler) SendToVendor(c *gin.Context) {
// 	claimID, ok := parsePathID(c, "id")
// 	if !ok {
// 		return
// 	}
// 	var req struct {
// 		VendorReceiver  string `json:"vendor_receiver" binding:"required"`
// 		VendorMobile    string `json:"vendor_mobile" binding:"required"`
// 		GatePassRemarks string `json:"gate_pass_remarks" binding:"required"`
// 		Remarks         string `json:"remarks"`
// 	}
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(c, err.Error())
// 		return
// 	}
// 	ctx := c.Request.Context()
// 	tx, err := h.db.Begin(ctx)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	defer tx.Rollback(ctx)
// 	var assetID int64
// 	var serial string
// 	var status int
// 	err = tx.QueryRow(ctx, `SELECT asset_device_id,COALESCE(device_sl_no,''),claim_status FROM public.device_claims WHERE id=$1 FOR UPDATE`, claimID).Scan(&assetID, &serial, &status)
// 	if err == pgx.ErrNoRows {
// 		response.NotFound(c, "claim not found")
// 		return
// 	}
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if status == 10 {
// 		response.BadRequest(c, "claim is already closed")
// 		return
// 	}
// 	actor := currentEmployeeID(c)
// 	_, err = tx.Exec(ctx, `UPDATE public.device_claims SET previous_status=claim_status,claim_status=9,lifecycle_state='WITH_VENDOR',vendor_receiver=$2,vndr_receiver_mobile=$3,gate_pass_date=NOW(),gate_pass_remarks=$4,remarks=COALESCE(NULLIF($5,''),remarks),edited_by=$6,edited_at=NOW() WHERE id=$1`, claimID, strings.TrimSpace(req.VendorReceiver), strings.TrimSpace(req.VendorMobile), strings.TrimSpace(req.GatePassRemarks), strings.TrimSpace(req.Remarks), actor)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	_, err = tx.Exec(ctx, `INSERT INTO public.device_claim_histories (claim_id,asset_device_id,claim_reference_no,device_sl_no,previous_status,current_status,remarks,vendor_personnel_name,vendor_mobile,created_by,created_at,status,service_type,event_type) VALUES ($1,$2,$2,$3,$4,9,$5,$6,$7,$8,NOW(),1,2,'SENT_TO_VENDOR')`, claimID, assetID, serial, status, strings.TrimSpace(req.Remarks), strings.TrimSpace(req.VendorReceiver), strings.TrimSpace(req.VendorMobile), actor)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if err = tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	response.OK(c, gin.H{"claim_status": 9, "lifecycle_state": "WITH_VENDOR"})
// }

// func (h *ClaimHandler) ReceiveFromVendor(c *gin.Context) {
// 	claimID, ok := parsePathID(c, "id")
// 	if !ok {
// 		return
// 	}
// 	var req struct {
// 		Remarks string `json:"remarks" binding:"required"`
// 	}
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(c, err.Error())
// 		return
// 	}
// 	ctx := c.Request.Context()
// 	tx, err := h.db.Begin(ctx)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	defer tx.Rollback(ctx)
// 	var assetID int64
// 	var serial string
// 	var status int
// 	err = tx.QueryRow(ctx, `SELECT asset_device_id,COALESCE(device_sl_no,''),claim_status FROM public.device_claims WHERE id=$1 FOR UPDATE`, claimID).Scan(&assetID, &serial, &status)
// 	if err != nil {
// 		if err == pgx.ErrNoRows {
// 			response.NotFound(c, "claim not found")
// 		} else {
// 			response.ServerError(c, err)
// 		}
// 		return
// 	}
// 	if status == 10 {
// 		response.BadRequest(c, "claim is already closed")
// 		return
// 	}
// 	actor := currentEmployeeID(c)
// 	_, err = tx.Exec(ctx, `UPDATE public.device_claims SET lifecycle_state='RECEIVED',received_date=NOW(),received_by=$2,remarks=$3,edited_by=$2,edited_at=NOW() WHERE id=$1`, claimID, actor, strings.TrimSpace(req.Remarks))
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	_, err = tx.Exec(ctx, `INSERT INTO public.device_claim_histories (claim_id,asset_device_id,claim_reference_no,device_sl_no,previous_status,current_status,remarks,created_by,created_at,status,service_type,event_type) VALUES ($1,$2,$2,$3,$4,9,$5,$6,NOW(),1,2,'RECEIVED_FROM_VENDOR')`, claimID, assetID, serial, status, strings.TrimSpace(req.Remarks), actor)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if err = tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	response.OK(c, gin.H{"claim_status": 9, "lifecycle_state": "RECEIVED"})
// }

// func (h *ClaimHandler) CloseLifecycle(c *gin.Context) {
// 	claimID, ok := parsePathID(c, "id")
// 	if !ok {
// 		return
// 	}
// 	var req struct {
// 		Resolution string `json:"resolution" binding:"required"`
// 		Remarks    string `json:"remarks"`
// 	}
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(c, err.Error())
// 		return
// 	}
// 	ctx := c.Request.Context()
// 	tx, err := h.db.Begin(ctx)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	defer tx.Rollback(ctx)
// 	var assetID int64
// 	var serial string
// 	var status int
// 	var restore *int
// 	var restoreEmp *string
// 	err = tx.QueryRow(ctx, `SELECT asset_device_id,COALESCE(device_sl_no,''),claim_status,restore_asset_status,restore_emp_id FROM public.device_claims WHERE id=$1 FOR UPDATE`, claimID).Scan(&assetID, &serial, &status, &restore, &restoreEmp)
// 	if err != nil {
// 		if err == pgx.ErrNoRows {
// 			response.NotFound(c, "claim not found")
// 		} else {
// 			response.ServerError(c, err)
// 		}
// 		return
// 	}
// 	if status == 10 {
// 		response.BadRequest(c, "claim is already closed")
// 		return
// 	}
// 	if restore == nil || (*restore != 0 && *restore != 1 && *restore != 4) {
// 		response.BadRequest(c, "restore asset status is missing for this legacy claim. Reconcile it before closing.")
// 		return
// 	}
// 	actor := currentEmployeeID(c)
// 	_, err = tx.Exec(ctx, `UPDATE public.device_claims SET previous_status=claim_status,claim_status=10,lifecycle_state='CLOSED',resolution=$2,return_issue=$2,return_date=NOW(),return_by_it_person=$3,closed_by=$3,closed_at=NOW(),edited_by=$3,edited_at=NOW() WHERE id=$1`, claimID, strings.TrimSpace(req.Resolution), actor)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if *restore == 1 {
// 		_, err = tx.Exec(ctx, `UPDATE public.asset_devices SET asset_status=1,emp_id=COALESCE(NULLIF(emp_id,''),$2) WHERE id=$1`, assetID, restoreEmp)
// 	} else {
// 		_, err = tx.Exec(ctx, `UPDATE public.asset_devices SET asset_status=$2,emp_id=NULL WHERE id=$1`, assetID, *restore)
// 	}
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	_, err = tx.Exec(ctx, `INSERT INTO public.device_claim_histories (claim_id,asset_device_id,claim_reference_no,device_sl_no,previous_status,current_status,remarks,created_by,created_at,status,service_type,event_type,metadata) VALUES ($1,$2,$2,$3,$4,10,$5,$6,NOW(),1,2,'CLAIM_CLOSED',jsonb_build_object('restored_asset_status',$7))`, claimID, assetID, serial, status, strings.TrimSpace(req.Resolution), actor, *restore)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if err = tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	label := map[int]string{0: "Available", 1: "Assigned", 4: "Returned"}[*restore]
// 	response.OK(c, gin.H{"claim_status": 10, "lifecycle_state": "CLOSED", "restored_asset_status": *restore, "restored_status_label": label})
// }

// func (h *ClaimHandler) Lifecycle(c *gin.Context) {
// 	claimID, ok := parsePathID(c, "id")
// 	if !ok {
// 		return
// 	}
// 	rows, err := h.db.Query(c.Request.Context(), `SELECT id,COALESCE(event_type,''),previous_status,current_status,COALESCE(remarks,''),COALESCE(vendor_personnel_name,''),COALESCE(vendor_mobile::text,''),COALESCE(created_by,''),created_at::text,metadata FROM public.device_claim_histories WHERE claim_id=$1 ORDER BY created_at,id`, claimID)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	defer rows.Close()
// 	items := []gin.H{}
// 	for rows.Next() {
// 		var id int64
// 		var event, remarks, vendor, mobile, actor, at string
// 		var prev, curr int
// 		var meta any
// 		if err := rows.Scan(&id, &event, &prev, &curr, &remarks, &vendor, &mobile, &actor, &at, &meta); err != nil {
// 			response.ServerError(c, err)
// 			return
// 		}
// 		items = append(items, gin.H{"id": id, "event": event, "previous_status": prev, "current_status": curr, "remarks": remarks, "vendor_personnel_name": vendor, "vendor_mobile": mobile, "changed_by": actor, "changed_at": at, "metadata": meta})
// 	}
// 	response.OK(c, items)
// }

package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

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
}

func parsePathID(c *gin.Context, key string) (int64, bool) {
	id, err := strconv.ParseInt(c.Param(key), 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid "+key)
		return 0, false
	}
	return id, true
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
	var req struct {
		VendorReceiver  string `json:"vendor_receiver" binding:"required"`
		VendorMobile    string `json:"vendor_mobile" binding:"required"`
		GatePassRemarks string `json:"gate_pass_remarks" binding:"required"`
		Remarks         string `json:"remarks"`
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
	if err == pgx.ErrNoRows {
		response.NotFound(c, "claim not found")
		return
	}
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if status == 10 {
		response.BadRequest(c, "claim is already closed")
		return
	}
	actor := currentEmployeeID(c)
	_, err = tx.Exec(ctx, `UPDATE public.device_claims SET previous_status=claim_status,claim_status=9,lifecycle_state='WITH_VENDOR',vendor_receiver=$2,vndr_receiver_mobile=$3,gate_pass_date=NOW(),gate_pass_remarks=$4,remarks=COALESCE(NULLIF($5,''),remarks),edited_by=$6,edited_at=NOW() WHERE id=$1`, claimID, strings.TrimSpace(req.VendorReceiver), strings.TrimSpace(req.VendorMobile), strings.TrimSpace(req.GatePassRemarks), strings.TrimSpace(req.Remarks), actor)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	_, err = tx.Exec(ctx, `INSERT INTO public.device_claim_histories (claim_id,asset_device_id,claim_reference_no,device_sl_no,previous_status,current_status,remarks,vendor_personnel_name,vendor_mobile,created_by,created_at,status,service_type,event_type) VALUES ($1,$2::bigint,$2::bigint::text,$3,$4,9,$5,$6,$7,$8,NOW(),1,2,'SENT_TO_VENDOR')`, claimID, assetID, serial, status, strings.TrimSpace(req.Remarks), strings.TrimSpace(req.VendorReceiver), strings.TrimSpace(req.VendorMobile), actor)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if err = tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}
	response.OK(c, gin.H{"claim_status": 9, "lifecycle_state": "WITH_VENDOR"})
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
	if err = tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}
	label := map[int]string{0: "Available", 1: "Assigned", 4: "Returned"}[*restore]
	response.OK(c, gin.H{"claim_status": 10, "lifecycle_state": "CLOSED", "restored_asset_status": *restore, "restored_status_label": label})
}

func (h *ClaimHandler) Lifecycle(c *gin.Context) {
	claimID, ok := parsePathID(c, "id")
	if !ok {
		return
	}
	rows, err := h.db.Query(c.Request.Context(), `SELECT id,COALESCE(event_type,''),previous_status,current_status,COALESCE(remarks,''),COALESCE(vendor_personnel_name,''),COALESCE(vendor_mobile::text,''),COALESCE(created_by,''),created_at::text,metadata FROM public.device_claim_histories WHERE claim_id=$1 ORDER BY created_at,id`, claimID)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	items := []gin.H{}
	for rows.Next() {
		var id int64
		var event, remarks, vendor, mobile, actor, at string
		var prev, curr int
		var meta any
		if err := rows.Scan(&id, &event, &prev, &curr, &remarks, &vendor, &mobile, &actor, &at, &meta); err != nil {
			response.ServerError(c, err)
			return
		}
		items = append(items, gin.H{"id": id, "event": event, "previous_status": prev, "current_status": curr, "remarks": remarks, "vendor_personnel_name": vendor, "vendor_mobile": mobile, "changed_by": actor, "changed_at": at, "metadata": meta})
	}
	response.OK(c, items)
}

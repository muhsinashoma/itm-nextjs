//backend/internal/handler/handlers.go
package handler

import (
	"fmt"
	"strconv"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─── Employee ────────────────────────────────────────────────────────────────

type EmployeeHandler struct{ db *pgxpool.Pool }
func NewEmployeeHandler(db *pgxpool.Pool) *EmployeeHandler { return &EmployeeHandler{db: db} }

func (h *EmployeeHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/employees")
	g.GET("", h.List)
	g.GET("/:emp_id", h.Get)
	g.GET("/search", h.Search)
}

func (h *EmployeeHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))
	if page < 1 { page = 1 }
	if ps > 200 { ps = 200 }
	offset := (page - 1) * ps
	active := c.DefaultQuery("active", "Active")
	var total int
	h.db.QueryRow(c.Request.Context(), "SELECT COUNT(*) FROM employee_office_info WHERE active=$1", active).Scan(&total)
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT o.employee_id, o.employee_name, o.designation,
		       o.department_name, o.work_field, o.sub_function, o.active,
		       p.personal_cell_no, p.official_cell_no, p.email, p.official_email, p.picture
		FROM employee_office_info o
		LEFT JOIN employee_personal_info p ON p.employee_id=o.employee_id
		WHERE o.active=$1 ORDER BY o.employee_name LIMIT $2 OFFSET $3`, active, ps, offset)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	type Emp struct {
		EmpID    string  `json:"employee_id"`
		Name     string  `json:"employee_name"`
		Desig    *string `json:"designation"`
		Dept     *string `json:"department"`
		WorkField *string `json:"work_field"`
		SubFunc  *string `json:"sub_function"`
		Active   *string `json:"active"`
		PCell    *string `json:"personal_cell"`
		OCell    *string `json:"official_cell"`
		Email    *string `json:"email"`
		OEmail   *string `json:"official_email"`
		Picture  *string `json:"picture"`
	}
	var emps []Emp
	for rows.Next() {
		var e Emp
		rows.Scan(&e.EmpID, &e.Name, &e.Desig, &e.Dept, &e.WorkField,
			&e.SubFunc, &e.Active, &e.PCell, &e.OCell, &e.Email, &e.OEmail, &e.Picture)
		emps = append(emps, e)
	}
	if emps == nil { emps = []Emp{} }
	response.Paginated(c, emps, total, page, ps)
}

func (h *EmployeeHandler) Get(c *gin.Context) {
	type E struct {
		EmpID    string  `json:"employee_id"`
		Name     string  `json:"employee_name"`
		Desig    *string `json:"designation"`
		Dept     *string `json:"department"`
		Active   *string `json:"active"`
		PCell    *string `json:"personal_cell"`
		OCell    *string `json:"official_cell"`
		Email    *string `json:"email"`
		Picture  *string `json:"picture"`
		DevCount int     `json:"device_count"`
	}
	var e E
	err := h.db.QueryRow(c.Request.Context(), `
		SELECT o.employee_id, o.employee_name, o.designation, o.department_name, o.active,
		       p.personal_cell_no, p.official_cell_no, p.email, p.picture,
		       (SELECT COUNT(*) FROM it_equipment WHERE emp_id=o.employee_id AND active>0)
		FROM employee_office_info o
		LEFT JOIN employee_personal_info p ON p.employee_id=o.employee_id
		WHERE o.employee_id=$1`, c.Param("emp_id")).
		Scan(&e.EmpID, &e.Name, &e.Desig, &e.Dept, &e.Active,
			&e.PCell, &e.OCell, &e.Email, &e.Picture, &e.DevCount)
	if err != nil { response.NotFound(c, "employee not found"); return }
	response.OK(c, e)
}

func (h *EmployeeHandler) Search(c *gin.Context) {
	q := c.Query("q")
	if q == "" { response.BadRequest(c, "q required"); return }
	rows, _ := h.db.Query(c.Request.Context(), `
		SELECT employee_id, employee_name, designation, department_name
		FROM employee_office_info
		WHERE (employee_id ILIKE $1 OR employee_name ILIKE $1) AND active='Active'
		ORDER BY employee_name LIMIT 20`, "%"+q+"%")
	defer rows.Close()
	type R struct{ EmpID, Name string; Desig, Dept *string }
	var res []R
	for rows.Next() {
		var r R; rows.Scan(&r.EmpID, &r.Name, &r.Desig, &r.Dept); res = append(res, r)
	}
	if res == nil { res = []R{} }
	response.OK(c, res)
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

type DashboardHandler struct{ db *pgxpool.Pool }
func NewDashboardHandler(db *pgxpool.Pool) *DashboardHandler { return &DashboardHandler{db: db} }



func (h *DashboardHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/dashboard")
	g.GET("/stats", h.Stats)
	g.GET("/summary", h.Summary)
	g.GET("/ticket-trend", h.TicketTrend)
}

func (h *DashboardHandler) Stats(c *gin.Context) {
	ctx := c.Request.Context()
	type S struct {
		TotalDevices    int `json:"total_devices"`
		AssignedDevices int `json:"assigned_devices"`
		StockDevices    int `json:"stock_devices"`
		ActiveEmployees int `json:"active_employees"`
		OpenTickets     int `json:"open_tickets"`
		RunningTickets  int `json:"running_tickets"`
		ClosedTickets   int `json:"closed_tickets"`
		WarrantyExpiring int `json:"warranty_expiring_30d"`
	}
	var s S
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM it_equipment WHERE active>0").Scan(&s.TotalDevices)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM it_equipment WHERE active>0 AND status='Assigned'").Scan(&s.AssignedDevices)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM it_equipment WHERE active>0 AND status='Stored'").Scan(&s.StockDevices)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM employee_office_info WHERE active='Active'").Scan(&s.ActiveEmployees)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM trouble_tickets WHERE active=TRUE AND status_progess=1").Scan(&s.OpenTickets)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM trouble_tickets WHERE active=TRUE AND status_progess=2").Scan(&s.RunningTickets)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM trouble_tickets WHERE active=TRUE AND status_progess=3").Scan(&s.ClosedTickets)
	h.db.QueryRow(ctx, "SELECT COUNT(*) FROM it_equipment WHERE active>0 AND device_warranty_date BETWEEN NOW() AND NOW()+INTERVAL '30 days'").Scan(&s.WarrantyExpiring)
	response.OK(c, s)
}

//Adding New for Total Active Assets

func (h *DashboardHandler) Summary(c *gin.Context) {
	ctx := c.Request.Context()

	type Item struct {
		Label string `json:"label"`
		Value int   `json:"value"`
	}

	type Group struct {
		Total int    `json:"total"`
		Items []Item `json:"items"`
	}

	resp := gin.H{}
	var rows pgx.Rows
    var err error

var assigned int
var returned int
var transferred int
var available int

_ = h.db.QueryRow(ctx, `
	SELECT COUNT(*)
	FROM it_equipment
	WHERE COALESCE(active, 0) > 0
	AND (
		status = '1'
		OR LOWER(COALESCE(status, '')) = 'assigned'
	)
`).Scan(&assigned)

_ = h.db.QueryRow(ctx, `
	SELECT COUNT(*)
	FROM it_equipment
	WHERE COALESCE(active, 0) > 0
	AND (
		status = '4'
		OR LOWER(COALESCE(status, '')) = 'returned'
	)
`).Scan(&returned)

_ = h.db.QueryRow(ctx, `
	SELECT COUNT(*)
	FROM it_equipment
	WHERE COALESCE(active, 0) > 0
	AND (
		status = '3'
		OR LOWER(COALESCE(status, '')) IN ('transfer', 'transferred')
	)
`).Scan(&transferred)

_ = h.db.QueryRow(ctx, `
	SELECT COUNT(*)
	FROM stack_inventory
	WHERE COALESCE(status, 1) = 1
	AND COALESCE(device_assigned_status, 0) = 0
`).Scan(&available)

resp["active_assets"] = Group{
	Total: assigned + returned + transferred + available,
	Items: []Item{
		{Label: "Assigned", Value: assigned},
		{Label: "Returned", Value: returned},
		{Label: "Transferred", Value: transferred},
		{Label: "Available", Value: available},
	},
}

	
	// Non-operational assets
	var damaged int
	var ownership int

	_ = h.db.QueryRow(ctx, `SELECT COUNT(*) FROM damage_inventory`).Scan(&damaged)
	_ = h.db.QueryRow(ctx, `SELECT COUNT(*) FROM ownership_transfers`).Scan(&ownership)

	resp["non_operational"] = Group{
		Total: damaged + ownership,
		Items: []Item{
			{Label: "Damaged", Value: damaged},
			{Label: "Ownership", Value: ownership},
			{Label: "Lost", Value: 0},
		},
	}

	// Service requests
	
	rows, err = h.db.Query(ctx, `
	SELECT
		CASE
			WHEN claim_status IN (1, 0) THEN 'Service Request'
			WHEN claim_status IN (2, 4) THEN 'To Vendor'
			WHEN claim_status IN (3, 5) THEN 'Closed'
			ELSE 'Unknown'
		END AS label,
		COUNT(*)::int AS value
	FROM device_claims
	WHERE service_type = 1 AND COALESCE(status, 1) = 1
	GROUP BY label
	ORDER BY value DESC
`)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	serviceItems := []Item{}
	serviceTotal := 0

	for rows.Next() {
		var item Item
		if err := rows.Scan(&item.Label, &item.Value); err != nil {
			rows.Close()
			response.ServerError(c, err)
			return
		}
		serviceItems = append(serviceItems, item)
		serviceTotal += item.Value
	}
	rows.Close()

	resp["service_requests"] = Group{
		Total: serviceTotal,
		Items: serviceItems,
	}

	// Warranty claims
	rows, err = h.db.Query(ctx, `
		SELECT
			CASE
				WHEN claim_status = 1 THEN 'Claimed'
				WHEN claim_status = 2 THEN 'To Vendor'
				WHEN claim_status = 3 THEN 'Recovered'
				ELSE 'Expired'
			END AS label,
			COUNT(*)::int AS value
		FROM device_claims
		WHERE service_type = 0 AND COALESCE(status, 1) = 1
		GROUP BY label
		ORDER BY value DESC
	`)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	warrantyItems := []Item{}
	warrantyTotal := 0

	for rows.Next() {
		var item Item
		if err := rows.Scan(&item.Label, &item.Value); err != nil {
			rows.Close()
			response.ServerError(c, err)
			return
		}
		warrantyItems = append(warrantyItems, item)
		warrantyTotal += item.Value
	}
	rows.Close()

	resp["warranty"] = Group{
		Total: warrantyTotal,
		Items: warrantyItems,
	}

	response.OK(c, resp)
}

func (h *DashboardHandler) TicketTrend(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT to_char(DATE_TRUNC('day', status_update_date),'YYYY-MM-DD') AS day,
		       COUNT(*) FILTER (WHERE status_progess=1) AS open,
		       COUNT(*) FILTER (WHERE status_progess=2) AS running,
		       COUNT(*) FILTER (WHERE status_progess=3) AS closed,
		       COUNT(*) AS total
		FROM trouble_tickets
		WHERE active=TRUE AND status_update_date >= NOW()-INTERVAL '30 days'
		GROUP BY DATE_TRUNC('day', status_update_date)
		ORDER BY day`)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	type R struct {
		Day     string `json:"day"`
		Open    int    `json:"open"`
		Running int    `json:"running"`
		Closed  int    `json:"closed"`
		Total   int    `json:"total"`
	}
	var res []R
	for rows.Next() {
		var r R; rows.Scan(&r.Day, &r.Open, &r.Running, &r.Closed, &r.Total); res = append(res, r)
	}
	if res == nil { res = []R{} }
	response.OK(c, res)
}

// ─── Claim ───────────────────────────────────────────────────────────────────

type ClaimHandler struct{ db *pgxpool.Pool }
func NewClaimHandler(db *pgxpool.Pool) *ClaimHandler { return &ClaimHandler{db: db} }

func (h *ClaimHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/claims")
	g.GET("", h.List)
	g.GET("/:id", h.Get)
	g.POST("", h.Create)
	g.PUT("/:id/status", h.UpdateStatus)
}

func (h *ClaimHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 { page = 1 }
	offset := (page-1)*ps
	sType := c.Query("service_type")
	args := []any{}
	where := "WHERE cl.status=1"
	i := 1
	if sType != "" {
		args = append(args, sType); where += fmt.Sprintf(" AND cl.service_type::text=$%d", i); i++
	}
	var total int
	ca := make([]any, len(args)); copy(ca, args)
	h.db.QueryRow(c.Request.Context(), "SELECT COUNT(*) FROM device_claims cl "+where, ca...).Scan(&total)
	args = append(args, ps, offset)
	rows, err := h.db.Query(c.Request.Context(), fmt.Sprintf(`
		SELECT cl.id, cl.reference_no_claim, cl.category, cl.brand, cl.model_no,
		       cl.device_sl_no, cl.problems, cl.claim_status, cl.service_type,
		       cl.vendor, v.vendor_name, cl.received_date::text, cl.return_date::text,
		       cl.approved_val, cl.created_by, cl.created_at::text
		FROM device_claims cl
		LEFT JOIN warranty_vendors v ON v.id=cl.vendor
		%s ORDER BY cl.id DESC LIMIT $%d OFFSET $%d`, where, i, i+1), args...)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var claims []map[string]any
	for rows.Next() {
		var id, refNo, cs, st, av int; var vendorID *int
		var cat, brand, model, serial, probs, vname, rcd, retd, cb, ca *string
		rows.Scan(&id, &refNo, &cat, &brand, &model, &serial, &probs, &cs, &st,
			&vendorID, &vname, &rcd, &retd, &av, &cb, &ca)
		claims = append(claims, map[string]any{
			"id": id, "reference_no": refNo, "category": cat, "brand": brand,
			"model_no": model, "device_serial": serial, "problems": probs,
			"claim_status": cs, "service_type": st, "vendor_id": vendorID,
			"vendor_name": vname, "received_date": rcd, "return_date": retd,
			"approved_val": av, "created_by": cb, "created_at": ca,
		})
	}
	if claims == nil { claims = []map[string]any{} }
	response.Paginated(c, claims, total, page, ps)
}

func (h *ClaimHandler) Get(c *gin.Context) {
	var m map[string]any
	var id, refNo, cs, st, av int; var vendorID *int
	var cat, brand, model, serial, probs, vname, rcd, retd, cb, ca *string
	err := h.db.QueryRow(c.Request.Context(), `
		SELECT cl.id, cl.reference_no_claim, cl.category, cl.brand, cl.model_no,
		       cl.device_sl_no, cl.problems, cl.claim_status, cl.service_type,
		       cl.vendor, v.vendor_name, cl.received_date::text, cl.return_date::text,
		       cl.approved_val, cl.created_by, cl.created_at::text
		FROM device_claims cl
		LEFT JOIN warranty_vendors v ON v.id=cl.vendor
		WHERE cl.id=$1`, c.Param("id")).
		Scan(&id, &refNo, &cat, &brand, &model, &serial, &probs, &cs, &st,
			&vendorID, &vname, &rcd, &retd, &av, &cb, &ca)
	if err != nil { response.NotFound(c, "claim not found"); return }
	m = map[string]any{
		"id": id, "reference_no": refNo, "category": cat, "brand": brand,
		"model_no": model, "device_serial": serial, "problems": probs,
		"claim_status": cs, "service_type": st, "vendor_id": vendorID,
		"vendor_name": vname, "received_date": rcd, "return_date": retd,
		"approved_val": av, "created_by": cb, "created_at": ca,
	}
	response.OK(c, m)
}

func (h *ClaimHandler) Create(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req map[string]any
	if err := c.ShouldBindJSON(&req); err != nil { response.BadRequest(c, err.Error()); return }
	var refNo int
	h.db.QueryRow(c.Request.Context(), "SELECT COALESCE(MAX(reference_no_claim),0)+1 FROM device_claims").Scan(&refNo)
	var id int
	h.db.QueryRow(c.Request.Context(), `
		INSERT INTO device_claims
		  (reference_no_claim, category, brand, model_no, device_sl_no, problems,
		   claim_status, previous_status, vendor, service_type, received_date,
		   received_by, gate_pass_date, unit, quantity, return_issue, return_date,
		   return_by_it_person, gate_pass_remarks, created_by, created_at,
		   edited_by, edited_at, status, tbl_it_inventory_device_id, approved_val,
		   designated_email_to, designated_email_cc, vendor_receiver, vndr_receiver_mobile)
		VALUES ($1,$2,$3,$4,$5,$6,1,0,$7,$8,$9::timestamp,$10,NOW(),0,0,'',NOW(),'','','',
		        $10,NOW(),'',NOW(),1,0,0,'','','','')
		RETURNING id`,
		refNo, req["category"], req["brand"], req["model_no"], req["device_serial"],
		req["problems"], req["vendor_id"], req["service_type"], req["received_date"],
		empID).Scan(&id)
	response.Created(c, gin.H{"id": id, "reference_no": refNo})
}

func (h *ClaimHandler) UpdateStatus(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req struct{ ClaimStatus int `json:"claim_status" binding:"required"` }
	if err := c.ShouldBindJSON(&req); err != nil { response.BadRequest(c, err.Error()); return }
	h.db.Exec(c.Request.Context(),
		`UPDATE device_claims SET claim_status=$1, edited_by=$2, edited_at=NOW() WHERE id=$3`,
		req.ClaimStatus, empID, c.Param("id"))
	response.OK(c, gin.H{"updated": true})
}

// ─── Stock ───────────────────────────────────────────────────────────────────

type StockHandler struct{ db *pgxpool.Pool }
func NewStockHandler(db *pgxpool.Pool) *StockHandler { return &StockHandler{db: db} }

func (h *StockHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/stock")
	g.GET("", h.List)
	g.GET("/:id", h.Get)
	g.POST("", h.Create)
	g.PUT("/:id", h.Update)
}

func (h *StockHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 { page = 1 }
	offset := (page-1)*ps
	var total int
	h.db.QueryRow(c.Request.Context(), "SELECT COUNT(*) FROM stack_inventory WHERE status=1").Scan(&total)
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT id, mr_id, pr_id, vendor_name, serial_no, purchase_date::text,
		       category, brand, model, cpu, ram, ssd, monitor, warranty_date::text,
		       item_group, item_name, total_item, device_assigned_status,
		       device_type, inventory_type, created_at::text
		FROM stack_inventory WHERE status=1 ORDER BY id DESC LIMIT $1 OFFSET $2`, ps, offset)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var stocks []map[string]any
	for rows.Next() {
		var id, tot, as int
		var mr, pr, vn, sn, pd, cat, brand, model, cpu, ram, ssd, mon, wd, ig, iname, dt, invt, ca *string
		rows.Scan(&id, &mr, &pr, &vn, &sn, &pd, &cat, &brand, &model, &cpu, &ram, &ssd,
			&mon, &wd, &ig, &iname, &tot, &as, &dt, &invt, &ca)
		stocks = append(stocks, map[string]any{
			"id": id, "mr_id": mr, "pr_id": pr, "vendor_name": vn, "serial_no": sn,
			"purchase_date": pd, "category": cat, "brand": brand, "model": model,
			"cpu": cpu, "ram": ram, "ssd": ssd, "monitor": mon, "warranty_date": wd,
			"item_group": ig, "item_name": iname, "total_item": tot,
			"device_assigned_status": as, "device_type": dt, "inventory_type": invt, "created_at": ca,
		})
	}
	if stocks == nil { stocks = []map[string]any{} }
	response.Paginated(c, stocks, total, page, ps)
}

func (h *StockHandler) Get(c *gin.Context) {
	var id, tot, as int
	var mr, pr, vn, sn, pd, cat, brand, model, cpu, ram, ssd, mon, wd, ig, iname, dt, invt, ca *string
	err := h.db.QueryRow(c.Request.Context(), `
		SELECT id, mr_id, pr_id, vendor_name, serial_no, purchase_date::text,
		       category, brand, model, cpu, ram, ssd, monitor, warranty_date::text,
		       item_group, item_name, total_item, device_assigned_status,
		       device_type, inventory_type, created_at::text
		FROM stack_inventory WHERE id=$1`, c.Param("id")).
		Scan(&id, &mr, &pr, &vn, &sn, &pd, &cat, &brand, &model, &cpu, &ram, &ssd,
			&mon, &wd, &ig, &iname, &tot, &as, &dt, &invt, &ca)
	if err != nil { response.NotFound(c, "stock not found"); return }
	response.OK(c, map[string]any{
		"id": id, "mr_id": mr, "pr_id": pr, "vendor_name": vn, "serial_no": sn,
		"purchase_date": pd, "category": cat, "brand": brand, "model": model,
		"cpu": cpu, "ram": ram, "ssd": ssd, "monitor": mon, "warranty_date": wd,
		"item_group": ig, "item_name": iname, "total_item": tot,
		"device_assigned_status": as, "device_type": dt, "inventory_type": invt, "created_at": ca,
	})
}

func (h *StockHandler) Create(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req map[string]any
	if err := c.ShouldBindJSON(&req); err != nil { response.BadRequest(c, err.Error()); return }
	var id int
	h.db.QueryRow(c.Request.Context(), `
		INSERT INTO stack_inventory
		  (employee_id, mr_id, pr_id, vendor_name, serial_no, purchase_date,
		   category, brand, model, cpu, ram, ssd, monitor, warranty_date,
		   item_group, item_name, total_item, device_type, inventory_type,
		   device_assigned_status, created_at, status)
		VALUES ($1,$2,$3,$4,$5,$6::timestamp,$7,$8,$9,$10,$11,$12,$13,$14::timestamp,
		        $15,$16,$17,$18,$19,0,NOW(),1) RETURNING id`,
		empID, req["mr_id"], req["pr_id"], req["vendor_name"], req["serial_no"],
		req["purchase_date"], req["category"], req["brand"], req["model"],
		req["cpu"], req["ram"], req["ssd"], req["monitor"], req["warranty_date"],
		req["item_group"], req["item_name"], req["total_item"],
		req["device_type"], req["inventory_type"]).Scan(&id)
	response.Created(c, gin.H{"id": id})
}

func (h *StockHandler) Update(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req map[string]any
	c.ShouldBindJSON(&req)
	h.db.Exec(c.Request.Context(), `
		UPDATE stack_inventory SET
		  vendor_name=COALESCE($1::text,vendor_name),
		  category=COALESCE($2::text,category),
		  brand=COALESCE($3::text,brand),
		  model=COALESCE($4::text,model),
		  total_item=COALESCE($5::int,total_item),
		  edited_by=$6, edited_at=NOW()
		WHERE id=$7`,
		req["vendor_name"], req["category"], req["brand"], req["model"],
		req["total_item"], empID, c.Param("id"))
	response.OK(c, gin.H{"updated": true})
}

// ─── Vendor ──────────────────────────────────────────────────────────────────

type VendorHandler struct{ db *pgxpool.Pool }
func NewVendorHandler(db *pgxpool.Pool) *VendorHandler { return &VendorHandler{db: db} }

func (h *VendorHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/vendors")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.PUT("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
}

func (h *VendorHandler) List(c *gin.Context) {
	rows, _ := h.db.Query(c.Request.Context(), `
		SELECT id, vendor_name, vendor_address, vendor_mobile, vendor_email, status
		FROM warranty_vendors WHERE status=1 ORDER BY vendor_name`)
	defer rows.Close()
	type V struct{ ID int; Name, Addr, Mobile, Email *string; Status int }
	var vs []V
	for rows.Next() {
		var v V; rows.Scan(&v.ID, &v.Name, &v.Addr, &v.Mobile, &v.Email, &v.Status); vs = append(vs, v)
	}
	if vs == nil { vs = []V{} }
	response.OK(c, vs)
}

func (h *VendorHandler) Create(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req struct {
		Name   string  `json:"vendor_name" binding:"required"`
		Addr   *string `json:"vendor_address"`
		Mobile *string `json:"vendor_mobile"`
		Email  *string `json:"vendor_email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil { response.BadRequest(c, err.Error()); return }
	var id int
	h.db.QueryRow(c.Request.Context(), `
		INSERT INTO warranty_vendors (vendor_name, vendor_address, vendor_mobile, vendor_email,
		vendor_others, created_by, created_at, edited_by, edited_at, status)
		VALUES ($1,$2,$3,$4,'',  $5,NOW(),'',NOW(),1) RETURNING id`,
		req.Name, req.Addr, req.Mobile, req.Email, empID).Scan(&id)
	response.Created(c, gin.H{"id": id})
}

func (h *VendorHandler) Update(c *gin.Context) {
	var req map[string]any; c.ShouldBindJSON(&req)
	h.db.Exec(c.Request.Context(), `
		UPDATE warranty_vendors SET
		  vendor_name=COALESCE($1::text,vendor_name),
		  vendor_address=COALESCE($2::text,vendor_address),
		  vendor_mobile=COALESCE($3::text,vendor_mobile),
		  vendor_email=COALESCE($4::text,vendor_email), edited_at=NOW()
		WHERE id=$5`,
		req["vendor_name"], req["vendor_address"], req["vendor_mobile"], req["vendor_email"], c.Param("id"))
	response.OK(c, gin.H{"updated": true})
}

func (h *VendorHandler) Delete(c *gin.Context) {
	h.db.Exec(c.Request.Context(), "UPDATE warranty_vendors SET status=0 WHERE id=$1", c.Param("id"))
	response.NoContent(c)
}

// ─── Category ────────────────────────────────────────────────────────────────

type CategoryHandler struct{ db *pgxpool.Pool }
func NewCategoryHandler(db *pgxpool.Pool) *CategoryHandler { return &CategoryHandler{db: db} }

func (h *CategoryHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/categories")
	g.GET("", h.List)
	g.POST("", h.Create)
}

func (h *CategoryHandler) List(c *gin.Context) {
	rows, _ := h.db.Query(c.Request.Context(), `
		SELECT id, inventory_category_list, parent_id, sub_parent_id, type, status
		FROM inventory_categories WHERE status=1 ORDER BY inventory_category_list`)
	defer rows.Close()
	type Cat struct {
		ID       int     `json:"id"`
		Name     *string `json:"category_name"`
		ParentID int     `json:"parent_id"`
		SubParentID int  `json:"sub_parent_id"`
		Type     *string `json:"type"`
		Status   int     `json:"status"`
	}
	var cats []Cat
	for rows.Next() {
		var cat Cat
		rows.Scan(&cat.ID, &cat.Name, &cat.ParentID, &cat.SubParentID, &cat.Type, &cat.Status)
		cats = append(cats, cat)
	}
	if cats == nil { cats = []Cat{} }
	response.OK(c, cats)
}

func (h *CategoryHandler) Create(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req struct {
		Name     string  `json:"category_name" binding:"required"`
		ParentID int     `json:"parent_id"`
		Type     *string `json:"type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil { response.BadRequest(c, err.Error()); return }
	var id int
	h.db.QueryRow(c.Request.Context(), `
		INSERT INTO inventory_categories (inventory_category_list, parent_id, type, created_by, status)
		VALUES ($1,$2,$3,$4,1) RETURNING id`,
		req.Name, req.ParentID, req.Type, empID).Scan(&id)
	response.Created(c, gin.H{"id": id})
}

// ─── Reports ─────────────────────────────────────────────────────────────────

type ReportHandler struct{ db *pgxpool.Pool }
func NewReportHandler(db *pgxpool.Pool) *ReportHandler { return &ReportHandler{db: db} }


func (h *ReportHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/reports")

	g.GET("/assigned", h.Assigned)
	g.GET("/assets", h.Assigned) // frontend alias for /dashboard/reports/assets

	g.GET("/warranty", h.Warranty)
	g.GET("/service", h.Service)
	g.GET("/users", h.Users)
	g.GET("/disposal", h.Disposal)
	g.GET("/stock-status", h.StockStatus)
	g.GET("/resignation", h.Resignation)
	g.GET("/renewal", h.Renewal)
	g.GET("/non-operational", h.NonOperational)
}



// func (h *ReportHandler) Assigned(c *gin.Context) {
// 	rows, err := h.db.Query(c.Request.Context(), `
// 		SELECT d.id, d.emp_id,
// 		       COALESCE(e.employee_name, d.emp_name),
// 		       COALESCE(d.department, e.department_name),
// 		       e.designation, d.category, d.brand, d.device_s_or_n, d.model_no,
// 		       d.device_type, d.status, d.assign_date::text, d.device_warranty_date::text,
// 		       d.mr_number, d.pr_number, d.vendor,
// 		       to_char(NOW()-d.assign_date,'DD" days"'),
// 		       CASE WHEN d.device_warranty_date > NOW()
// 		            THEN to_char(d.device_warranty_date-NOW(),'DD" days"')
// 		            ELSE 'Expired' END
// 		FROM it_equipment d
// 		LEFT JOIN employee_office_info e ON e.employee_id=d.emp_id
// 		WHERE d.active>0 ORDER BY e.employee_name, d.category`)
// 	if err != nil { response.ServerError(c, err); return }
// 	defer rows.Close()
// 	var res []map[string]any
// 	for rows.Next() {
// 		var id int64; var dt *int
// 		var empID, empN, dept, desig, cat, brand, serial, model, status, ad, wd, mr, pr, vendor, age, wl *string
// 		rows.Scan(&id, &empID, &empN, &dept, &desig, &cat, &brand, &serial, &model,
// 			&dt, &status, &ad, &wd, &mr, &pr, &vendor, &age, &wl)
// 		res = append(res, map[string]any{
// 			"id": id, "emp_id": empID, "emp_name": empN, "department": dept, "designation": desig,
// 			"category": cat, "brand": brand, "device_serial": serial, "model_no": model,
// 			"device_type": dt, "status": status, "assign_date": ad, "warranty_date": wd,
// 			"mr_number": mr, "pr_number": pr, "vendor": vendor, "device_age": age, "warranty_left": wl,
// 		})
// 	}
// 	if res == nil { res = []map[string]any{} }
// 	response.OK(c, res)
// }


func (h *ReportHandler) Assigned(c *gin.Context) {
	status := c.Query("status")

	where := "WHERE d.active > 0"
	args := []any{}
	argNo := 1

	if status != "" {
		switch status {
		case "Assigned":
			where += fmt.Sprintf(" AND (d.status = $%d OR LOWER(COALESCE(d.status, '')) = 'assigned')", argNo)
			args = append(args, "1")
			argNo++

		case "Returned":
			where += fmt.Sprintf(" AND (d.status = $%d OR LOWER(COALESCE(d.status, '')) = 'returned')", argNo)
			args = append(args, "4")
			argNo++

		case "Transferred":
			where += fmt.Sprintf(" AND (d.status = $%d OR LOWER(COALESCE(d.status, '')) IN ('transfer', 'transferred'))", argNo)
			args = append(args, "3")
			argNo++

		default:
			where += fmt.Sprintf(" AND LOWER(COALESCE(d.status, '')) = LOWER($%d)", argNo)
			args = append(args, status)
			argNo++
		}
	}

	rows, err := h.db.Query(c.Request.Context(), fmt.Sprintf(`
		SELECT d.id, d.emp_id,
		       COALESCE(e.employee_name, d.emp_name),
		       COALESCE(d.department, e.department_name),
		       e.designation, d.category, d.brand, d.device_s_or_n, d.model_no,
		       d.device_type, d.status, d.assign_date::text, d.device_warranty_date::text,
		       d.mr_number, d.pr_number, d.vendor,
		       to_char(NOW()-d.assign_date,'DD" days"'),
		       CASE WHEN d.device_warranty_date > NOW()
		            THEN to_char(d.device_warranty_date-NOW(),'DD" days"')
		            ELSE 'Expired' END
		FROM it_equipment d
		LEFT JOIN employee_office_info e ON e.employee_id = d.emp_id
		%s
		ORDER BY e.employee_name, d.category
	`, where), args...)

	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	var res []map[string]any

	for rows.Next() {
		var id int64
		var dt *int
		var empID, empN, dept, desig, cat, brand, serial, model, statusValue, ad, wd, mr, pr, vendor, age, wl *string

		rows.Scan(
			&id, &empID, &empN, &dept, &desig, &cat, &brand, &serial, &model,
			&dt, &statusValue, &ad, &wd, &mr, &pr, &vendor, &age, &wl,
		)

		displayStatus := ""
		if statusValue != nil {
			switch *statusValue {
			case "1":
				displayStatus = "Assigned"
			case "4":
				displayStatus = "Returned"
			case "3":
				displayStatus = "Transferred"
			default:
				displayStatus = *statusValue
			}
		}

		res = append(res, map[string]any{
			"id": id,
			"emp_id": empID,
			"emp_name": empN,
			"department": dept,
			"designation": desig,
			"category": cat,
			"brand": brand,
			"device_serial": serial,
			"model_no": model,
			"device_type": dt,
			"status": displayStatus,
			"assign_date": ad,
			"warranty_date": wd,
			"mr_number": mr,
			"pr_number": pr,
			"vendor": vendor,
			"device_age": age,
			"warranty_left": wl,
		})
	}

	if res == nil {
		res = []map[string]any{}
	}

	response.OK(c, res)
}

func (h *ReportHandler) Warranty(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT cl.id, cl.reference_no_claim, cl.category, cl.brand, cl.model_no,
		       cl.device_sl_no, cl.claim_status, v.vendor_name,
		       cl.received_date::text, cl.return_date::text, cl.approved_val, cl.created_at::text
		FROM device_claims cl
		LEFT JOIN warranty_vendors v ON v.id=cl.vendor
		WHERE cl.service_type=0 AND cl.status=1 ORDER BY cl.id DESC`)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var id, ref, cs, av int; var cat, brand, model, serial, vn, rd, ret, ca *string
		rows.Scan(&id, &ref, &cat, &brand, &model, &serial, &cs, &vn, &rd, &ret, &av, &ca)
		res = append(res, map[string]any{
			"id": id, "reference_no": ref, "category": cat, "brand": brand, "model_no": model,
			"device_serial": serial, "claim_status": cs, "vendor_name": vn,
			"received_date": rd, "return_date": ret, "approved_val": av, "created_at": ca,
		})
	}
	if res == nil { res = []map[string]any{} }
	response.OK(c, res)
}

func (h *ReportHandler) Service(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT cl.id, cl.reference_no_claim, cl.category, cl.brand, cl.model_no,
		       cl.device_sl_no, cl.claim_status, v.vendor_name,
		       cl.received_date::text, cl.return_date::text, cl.approved_val, cl.created_at::text
		FROM device_claims cl
		LEFT JOIN warranty_vendors v ON v.id=cl.vendor
		WHERE cl.service_type=1 AND cl.status=1 ORDER BY cl.id DESC`)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var id, ref, cs, av int; var cat, brand, model, serial, vn, rd, ret, ca *string
		rows.Scan(&id, &ref, &cat, &brand, &model, &serial, &cs, &vn, &rd, &ret, &av, &ca)
		res = append(res, map[string]any{
			"id": id, "reference_no": ref, "category": cat, "brand": brand, "model_no": model,
			"device_serial": serial, "claim_status": cs, "vendor_name": vn,
			"received_date": rd, "return_date": ret, "approved_val": av, "created_at": ca,
		})
	}
	if res == nil { res = []map[string]any{} }
	response.OK(c, res)
}

func (h *ReportHandler) Users(c *gin.Context) {
	active := c.DefaultQuery("active", "Active")
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT o.employee_id, o.employee_name, o.designation,
		       o.work_field, o.department_name, o.active,
		       p.personal_cell_no, p.official_cell_no, p.email
		FROM employee_office_info o
		LEFT JOIN employee_personal_info p ON p.employee_id=o.employee_id
		WHERE o.active=$1 ORDER BY o.employee_name`, active)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var empID, empN string; var desig, wf, dept, act, pc, oc, em *string
		rows.Scan(&empID, &empN, &desig, &wf, &dept, &act, &pc, &oc, &em)
		res = append(res, map[string]any{
			"employee_id": empID, "employee_name": empN, "designation": desig,
			"work_field": wf, "department": dept, "active": act,
			"personal_cell": pc, "official_cell": oc, "email": em,
		})
	}
	if res == nil { res = []map[string]any{} }
	response.OK(c, res)
}

func (h *ReportHandler) Disposal(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT id, department, function_name, device_category, device_sl_no,
		       model, device_status, remarks, created_by, created_at::text
		FROM damage_inventory WHERE status=1 ORDER BY id DESC`)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var id, ds int; var dept, fn, cat, serial, model, remarks, cb, ca *string
		rows.Scan(&id, &dept, &fn, &cat, &serial, &model, &ds, &remarks, &cb, &ca)
		res = append(res, map[string]any{
			"id": id, "department": dept, "function": fn, "category": cat,
			"device_serial": serial, "model": model, "device_status": ds,
			"remarks": remarks, "created_by": cb, "created_at": ca,
		})
	}
	if res == nil { res = []map[string]any{} }
	response.OK(c, res)
}

func (h *ReportHandler) StockStatus(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT category, COUNT(*) AS total,
		       COUNT(*) FILTER (WHERE status='Assigned') AS assigned,
		       COUNT(*) FILTER (WHERE status='Stored') AS in_stock,
		       COUNT(*) FILTER (WHERE status='Returned') AS returned,
		       COUNT(*) FILTER (WHERE device_warranty_date < NOW()) AS warranty_expired
		FROM it_equipment WHERE active>0 GROUP BY category ORDER BY category`)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var cat *string; var tot, ass, ins, ret, exp int
		rows.Scan(&cat, &tot, &ass, &ins, &ret, &exp)
		res = append(res, map[string]any{
			"category": cat, "total": tot, "assigned": ass,
			"in_stock": ins, "returned": ret, "warranty_expired": exp,
		})
	}
	if res == nil { res = []map[string]any{} }
	response.OK(c, res)
}

func (h *ReportHandler) Resignation(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT o.employee_id, o.employee_name, o.designation,
		       o.department_name, o.separation_mode, o.separation_date,
		       COUNT(d.id) AS assigned_devices
		FROM employee_office_info o
		LEFT JOIN it_equipment d ON d.emp_id=o.employee_id AND d.active>0
		WHERE o.active != 'Active'
		GROUP BY o.employee_id, o.employee_name, o.designation,
		         o.department_name, o.separation_mode, o.separation_date
		ORDER BY o.separation_date DESC NULLS LAST`)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var empID, empN string; var desig, dept, sepMode, sepDate *string; var dc int
		rows.Scan(&empID, &empN, &desig, &dept, &sepMode, &sepDate, &dc)
		res = append(res, map[string]any{
			"employee_id": empID, "employee_name": empN, "designation": desig,
			"department": dept, "separation_mode": sepMode, "separation_date": sepDate,
			"assigned_devices": dc,
		})
	}
	if res == nil { res = []map[string]any{} }
	response.OK(c, res)
}

func (h *ReportHandler) Renewal(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT d.id, d.emp_id, COALESCE(e.employee_name, d.emp_name),
		       d.category, d.brand, d.device_s_or_n, d.model_no,
		       d.device_warranty_date::text, d.vendor,
		       to_char(d.device_warranty_date-NOW(),'DD" days"')
		FROM it_equipment d
		LEFT JOIN employee_office_info e ON e.employee_id=d.emp_id
		WHERE d.active>0 AND d.device_warranty_date BETWEEN NOW() AND NOW()+INTERVAL '90 days'
		ORDER BY d.device_warranty_date ASC`)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var id int64; var empID, empN, cat, brand, serial, model, wd, vendor, dl *string
		rows.Scan(&id, &empID, &empN, &cat, &brand, &serial, &model, &wd, &vendor, &dl)
		res = append(res, map[string]any{
			"id": id, "emp_id": empID, "emp_name": empN, "category": cat,
			"brand": brand, "device_serial": serial, "model_no": model,
			"warranty_date": wd, "vendor": vendor, "days_left": dl,
		})
	}
	if res == nil { res = []map[string]any{} }
	response.OK(c, res)
}

func (h *ReportHandler) NonOperational(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT d.id, d.emp_id, COALESCE(e.employee_name, d.emp_name),
		       d.category, d.brand, d.device_s_or_n, d.model_no, d.status,
		       d.assign_date::text, d.device_warranty_date::text, d.vendor
		FROM it_equipment d
		LEFT JOIN employee_office_info e ON e.employee_id=d.emp_id
		WHERE d.active>0 AND d.status IN ('Damaged','Lost','Stolen','Obsolete')
		ORDER BY d.id DESC`)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var id int64; var empID, empN, cat, brand, serial, model, status, ad, wd, vendor *string
		rows.Scan(&id, &empID, &empN, &cat, &brand, &serial, &model, &status, &ad, &wd, &vendor)
		res = append(res, map[string]any{
			"id": id, "emp_id": empID, "emp_name": empN, "category": cat,
			"brand": brand, "device_serial": serial, "model_no": model, "status": status,
			"assign_date": ad, "warranty_date": wd, "vendor": vendor,
		})
	}
	if res == nil { res = []map[string]any{} }
	response.OK(c, res)
}

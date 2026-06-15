package handler

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DeviceHandler struct{ db *pgxpool.Pool }

func NewDeviceHandler(db *pgxpool.Pool) *DeviceHandler { return &DeviceHandler{db: db} }

func (h *DeviceHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/devices")
	g.GET("", h.List)
	g.GET("/:id", h.Get)
	g.POST("", h.Create)
	g.PUT("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
	g.POST("/:id/transfer", h.Transfer)
	g.POST("/:id/return", h.Return)
	g.GET("/:id/history", h.History)
	g.GET("/employee/:emp_id", h.ByEmployee)
	g.GET("/serial/:serial", h.BySerial)
}

// Device maps to tbl_it_equipment_requisition_form exactly
type Device struct {
	ID             int64   `json:"id"`
	EmpID          *string `json:"emp_id"`
	EmpName        *string `json:"emp_name"`
	Department     *string `json:"department"`
	Designation    *string `json:"designation"`
	Category       *string `json:"category"`
	Brand          *string `json:"brand"`
	DeviceSerial   *string `json:"device_serial"`
	ModelNo        *string `json:"model_no"`
	DeviceType     *int    `json:"device_type"`
	Status         *string `json:"status"`
	AssignDate     *string `json:"assign_date"`
	WarrantyDate   *string `json:"warranty_date"`
	Vendor         *string `json:"vendor"`
	MRNumber       *string `json:"mr_number"`
	PRNumber       *string `json:"pr_number"`
	OS             *string `json:"os"`
	CPU            *string `json:"cpu"`
	RAM            *string `json:"ram"`
	HDD            *string `json:"hdd"`
	Monitor        *string `json:"monitor"`
	IPAddress      *string `json:"ip_address"`
	Active         int     `json:"active"`
	ReturnStatus   int     `json:"return_status"`
	TransferStatus int     `json:"transfer_status"`
	DeviceAge      *string `json:"device_age"`
	WarrantyLeft   *string `json:"warranty_left"`
	CreatedAt      *string `json:"created_at"`
}

func (h *DeviceHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 { page = 1 }
	if ps > 200 { ps = 200 }
	offset := (page - 1) * ps

	args := []any{}
	where := "WHERE d.active > 0"
	i := 1

	if cat := c.Query("category"); cat != "" {
		args = append(args, cat); where += fmt.Sprintf(" AND d.category=$%d", i); i++
	}
	if st := c.Query("status"); st != "" {
		args = append(args, st); where += fmt.Sprintf(" AND d.status=$%d", i); i++
	}
	if se := c.Query("search"); se != "" {
		args = append(args, "%"+se+"%")
		where += fmt.Sprintf(" AND (d.device_s_or_n ILIKE $%d OR d.emp_id ILIKE $%d OR d.emp_name ILIKE $%d)", i, i, i); i++
	}

	var total int
	ca := make([]any, len(args)); copy(ca, args)
	h.db.QueryRow(c.Request.Context(), "SELECT COUNT(*) FROM it_equipment d "+where, ca...).Scan(&total)

	args = append(args, ps, offset)
	q := fmt.Sprintf(`
		SELECT d.id, d.emp_id, COALESCE(e.employee_name, d.emp_name) AS emp_name,
		       COALESCE(d.department, e.department_name) AS dept,
		       e.designation, d.category, d.brand, d.device_s_or_n, d.model_no,
		       d.device_type, d.status, d.assign_date::text, d.device_warranty_date::text,
		       d.vendor, d.mr_number, d.pr_number, d.os, d.cpu, d.ram, d.hdd,
		       d.monitor, d.ip_address, d.active, d.return_status, d.transfer_status,
		       to_char(NOW()-d.assign_date,'DD" days"') AS device_age,
		       CASE WHEN d.device_warranty_date > NOW()
		            THEN to_char(d.device_warranty_date-NOW(),'DD" days"')
		            ELSE 'Expired' END,
		       d.date::text AS created_at
		FROM it_equipment d
		LEFT JOIN employee_office_info e ON e.employee_id=d.emp_id
		%s ORDER BY d.id DESC LIMIT $%d OFFSET $%d`, where, i, i+1)

	rows, err := h.db.Query(c.Request.Context(), q, args...)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()

	var devs []Device
	for rows.Next() {
		var d Device
		rows.Scan(&d.ID, &d.EmpID, &d.EmpName, &d.Department, &d.Designation,
			&d.Category, &d.Brand, &d.DeviceSerial, &d.ModelNo,
			&d.DeviceType, &d.Status, &d.AssignDate, &d.WarrantyDate,
			&d.Vendor, &d.MRNumber, &d.PRNumber, &d.OS, &d.CPU, &d.RAM,
			&d.HDD, &d.Monitor, &d.IPAddress, &d.Active, &d.ReturnStatus,
			&d.TransferStatus, &d.DeviceAge, &d.WarrantyLeft, &d.CreatedAt)
		devs = append(devs, d)
	}
	if devs == nil { devs = []Device{} }
	response.Paginated(c, devs, total, page, ps)
}

func (h *DeviceHandler) Get(c *gin.Context) {
	var d Device
	err := h.db.QueryRow(c.Request.Context(), `
		SELECT d.id, d.emp_id, COALESCE(e.employee_name, d.emp_name),
		       COALESCE(d.department, e.department_name), e.designation,
		       d.category, d.brand, d.device_s_or_n, d.model_no,
		       d.device_type, d.status, d.assign_date::text, d.device_warranty_date::text,
		       d.vendor, d.mr_number, d.pr_number, d.os, d.cpu, d.ram, d.hdd,
		       d.monitor, d.ip_address, d.active, d.return_status, d.transfer_status,
		       to_char(NOW()-d.assign_date,'DD" days"'),
		       CASE WHEN d.device_warranty_date > NOW()
		            THEN to_char(d.device_warranty_date-NOW(),'DD" days"')
		            ELSE 'Expired' END,
		       d.date::text
		FROM it_equipment d
		LEFT JOIN employee_office_info e ON e.employee_id=d.emp_id
		WHERE d.id=$1`, c.Param("id")).
		Scan(&d.ID, &d.EmpID, &d.EmpName, &d.Department, &d.Designation,
			&d.Category, &d.Brand, &d.DeviceSerial, &d.ModelNo,
			&d.DeviceType, &d.Status, &d.AssignDate, &d.WarrantyDate,
			&d.Vendor, &d.MRNumber, &d.PRNumber, &d.OS, &d.CPU, &d.RAM,
			&d.HDD, &d.Monitor, &d.IPAddress, &d.Active, &d.ReturnStatus,
			&d.TransferStatus, &d.DeviceAge, &d.WarrantyLeft, &d.CreatedAt)
	if err != nil { response.NotFound(c, "device not found"); return }
	response.OK(c, d)
}

func (h *DeviceHandler) Create(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req map[string]any
	if err := c.ShouldBindJSON(&req); err != nil { response.BadRequest(c, err.Error()); return }
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()
	var id int64
	err := h.db.QueryRow(ctx, `
		INSERT INTO it_equipment
		  (emp_id, emp_name, department, designation, category, brand, device_s_or_n,
		   model_no, device_type, status, os, cpu, ram, hdd, monitor, ip_address,
		   lan_mac_address, wan_mac_address, device_warranty_date, vendor, mr_number,
		   pr_number, assign_date, date, user_name, active, return_status, transfer_status,
		   dev_assigned_val, tt_reason_id, tt_no, removal_drive, agp, lan, wan,
		   ups_or_adapter, battary_or_monitor, remarks, sl)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
		        $19::timestamp,$20,$21,$22,$23::timestamp,NOW(),$24,1,0,0,0,0,'','','','','','','','','')
		RETURNING id`,
		req["emp_id"], req["emp_name"], req["department"], req["designation"],
		req["category"], req["brand"], req["device_serial"], req["model_no"],
		req["device_type"], req["status"], req["os"], req["cpu"], req["ram"],
		req["hdd"], req["monitor"], req["ip_address"], req["lan_mac"], req["wan_mac"],
		req["warranty_date"], req["vendor"], req["mr_number"], req["pr_number"],
		req["assign_date"], empID).Scan(&id)
	if err != nil { response.ServerError(c, err); return }
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": gin.H{"id": id}})
}

func (h *DeviceHandler) Update(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req map[string]any
	c.ShouldBindJSON(&req)
	h.db.Exec(c.Request.Context(), `
		UPDATE it_equipment SET
		  category=COALESCE($1::text,category),
		  status=COALESCE($2::text,status),
		  vendor=COALESCE($3::text,vendor),
		  update_by=$4, update_date=NOW()
		WHERE id=$5`,
		req["category"], req["status"], req["vendor"], empID, c.Param("id"))
	response.OK(c, gin.H{"updated": true})
}

func (h *DeviceHandler) Delete(c *gin.Context) {
	empID := c.GetString("employee_id")
	h.db.Exec(c.Request.Context(),
		`UPDATE it_equipment SET active=0, delete_by=$1, delete_date_time=NOW() WHERE id=$2`,
		empID, c.Param("id"))
	response.NoContent(c)
}

func (h *DeviceHandler) Transfer(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req struct {
		ToEmpID string `json:"to_emp_id" binding:"required"`
		Remarks string `json:"remarks"`
	}
	if err := c.ShouldBindJSON(&req); err != nil { response.BadRequest(c, err.Error()); return }
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()
	tx, _ := h.db.Begin(ctx)
	defer tx.Rollback(ctx)
	var prevEmpID, prevStatus string
	tx.QueryRow(ctx, "SELECT COALESCE(emp_id,''), COALESCE(status,'') FROM it_equipment WHERE id=$1", c.Param("id")).
		Scan(&prevEmpID, &prevStatus)
	tx.Exec(ctx, `UPDATE it_equipment SET emp_id=$1, status='Transferred', transfer_status=1,
		transfer_by=$2, transfer_date_time=NOW() WHERE id=$3`, req.ToEmpID, empID, c.Param("id"))
	tx.Exec(ctx, `INSERT INTO equipment_status_history
		(equipment_id, device_serial, prev_status, current_status, user_return_id, user_transfer_id, transfer_comment, changed_by)
		SELECT id, device_s_or_n, previous_status, 2, $1, $2, $3, $4 FROM it_equipment WHERE id=$5`,
		prevEmpID, req.ToEmpID, req.Remarks, empID, c.Param("id"))
	tx.Commit(ctx)
	response.OK(c, gin.H{"transferred": true})
}

func (h *DeviceHandler) Return(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req struct{ Remarks string `json:"remarks"` }
	c.ShouldBindJSON(&req)
	h.db.Exec(c.Request.Context(), `
		UPDATE it_equipment SET status='Returned', return_status=1,
		return_date=NOW(), return_by=$1, update_by=$1, update_date=NOW()
		WHERE id=$2`, empID, c.Param("id"))
	h.db.Exec(c.Request.Context(), `
		INSERT INTO equipment_status_history
		  (equipment_id, device_serial, prev_status, current_status, return_comment, changed_by)
		SELECT id, device_s_or_n, previous_status, 3, $1, $2 FROM it_equipment WHERE id=$3`,
		req.Remarks, empID, c.Param("id"))
	response.OK(c, gin.H{"returned": true})
}

func (h *DeviceHandler) History(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT id, device_serial, prev_status, current_status,
		       user_return_id, user_transfer_id, return_comment, transfer_comment,
		       changed_by, changed_at
		FROM equipment_status_history WHERE equipment_id=$1 ORDER BY changed_at DESC`, c.Param("id"))
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var hist []map[string]any
	for rows.Next() {
		var id int64
		var serial, rc, tc, cb *string
		var ps, cs int
		var ri, ti *string
		var ca time.Time
		rows.Scan(&id, &serial, &ps, &cs, &ri, &ti, &rc, &tc, &cb, &ca)
		hist = append(hist, map[string]any{
			"id": id, "device_serial": serial, "prev_status": ps, "current_status": cs,
			"user_return_id": ri, "user_transfer_id": ti,
			"return_comment": rc, "transfer_comment": tc,
			"changed_by": cb, "changed_at": ca,
		})
	}
	if hist == nil { hist = []map[string]any{} }
	response.OK(c, hist)
}

func (h *DeviceHandler) ByEmployee(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT id, category, brand, device_s_or_n, model_no, device_type, status,
		       assign_date::text, device_warranty_date::text,
		       CASE WHEN device_warranty_date > NOW()
		            THEN to_char(device_warranty_date-NOW(),'DD" days"')
		            ELSE 'Expired' END, vendor
		FROM it_equipment WHERE emp_id=$1 AND active>0 ORDER BY assign_date DESC`, c.Param("emp_id"))
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	var devs []map[string]any
	for rows.Next() {
		var id int64; var dt *int
		var cat, brand, serial, model, status, assignD, warrantyD, wl, vendor *string
		rows.Scan(&id, &cat, &brand, &serial, &model, &dt, &status, &assignD, &warrantyD, &wl, &vendor)
		devs = append(devs, map[string]any{
			"id": id, "category": cat, "brand": brand, "device_serial": serial,
			"model_no": model, "device_type": dt, "status": status,
			"assign_date": assignD, "warranty_date": warrantyD, "warranty_left": wl, "vendor": vendor,
		})
	}
	if devs == nil { devs = []map[string]any{} }
	response.OK(c, devs)
}

func (h *DeviceHandler) BySerial(c *gin.Context) {
	var d Device
	err := h.db.QueryRow(c.Request.Context(), `
		SELECT d.id, d.emp_id, COALESCE(e.employee_name, d.emp_name),
		       COALESCE(d.department, e.department_name), e.designation,
		       d.category, d.brand, d.device_s_or_n, d.model_no,
		       d.device_type, d.status, d.assign_date::text, d.device_warranty_date::text,
		       d.vendor, d.mr_number, d.pr_number, d.os, d.cpu, d.ram, d.hdd,
		       d.monitor, d.ip_address, d.active, d.return_status, d.transfer_status,
		       to_char(NOW()-d.assign_date,'DD" days"'),
		       CASE WHEN d.device_warranty_date > NOW()
		            THEN to_char(d.device_warranty_date-NOW(),'DD" days"')
		            ELSE 'Expired' END, d.date::text
		FROM it_equipment d
		LEFT JOIN employee_office_info e ON e.employee_id=d.emp_id
		WHERE d.device_s_or_n=$1 LIMIT 1`, c.Param("serial")).
		Scan(&d.ID, &d.EmpID, &d.EmpName, &d.Department, &d.Designation,
			&d.Category, &d.Brand, &d.DeviceSerial, &d.ModelNo,
			&d.DeviceType, &d.Status, &d.AssignDate, &d.WarrantyDate,
			&d.Vendor, &d.MRNumber, &d.PRNumber, &d.OS, &d.CPU, &d.RAM,
			&d.HDD, &d.Monitor, &d.IPAddress, &d.Active, &d.ReturnStatus,
			&d.TransferStatus, &d.DeviceAge, &d.WarrantyLeft, &d.CreatedAt)
	if err != nil { response.NotFound(c, "device not found"); return }
	response.OK(c, d)
}

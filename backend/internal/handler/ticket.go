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

type TicketHandler struct{ db *pgxpool.Pool }

func NewTicketHandler(db *pgxpool.Pool) *TicketHandler { return &TicketHandler{db: db} }

func (h *TicketHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/tickets")
	g.GET("", h.List)
	g.GET("/:id", h.Get)
	g.POST("", h.Create)
	g.PUT("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
	g.PATCH("/:id/close", h.Close)
	g.PATCH("/:id/status", h.UpdateStatus)
	g.GET("/:id/updates", h.GetUpdates)
	g.POST("/:id/updates", h.AddUpdate)
}

func (h *TicketHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 { page = 1 }
	if ps > 100 { ps = 100 }
	offset := (page - 1) * ps

	args := []any{}
	where := "WHERE t.active = TRUE"
	i := 1

	if s := c.Query("status"); s != "" {
		args = append(args, s); where += fmt.Sprintf(" AND t.status_progress::text=$%d", i); i++
	}
	if e := c.Query("emp_id"); e != "" {
		args = append(args, e); where += fmt.Sprintf(" AND t.employee_id=$%d", i); i++
	}
	if q := c.Query("search"); q != "" {
		args = append(args, "%"+q+"%")
		where += fmt.Sprintf(" AND (t.client_name ILIKE $%d OR t.reason_of_problem ILIKE $%d OR t.tt_no::text LIKE $%d)", i, i, i); i++
	}

	var total int
	ca := make([]any, len(args)); copy(ca, args)
	h.db.QueryRow(c.Request.Context(), "SELECT COUNT(*) FROM trouble_tickets t "+where, ca...).Scan(&total)

	args = append(args, ps, offset)
	q := fmt.Sprintf(`
		SELECT t.id, t.tt_no, t.employee_id,
		       COALESCE(e.employee_name, t.employee_id) AS emp_name,
		       COALESCE(t.depertment, e.department_name) AS department,
		       t.phone, t.email, t.client_name,
		       t.client_fault_type, f.fault_name,
		       t.reason_of_problem,
		       t.fault_date_time,
		       t.status_progess,
		       t.attach_file, t.user AS created_by, t.status_update_date AS created_at,
		       to_char(NOW()-t.status_update_date,'DD"d" HH24"h"') AS ticket_age
		FROM trouble_tickets t
		LEFT JOIN employee_office_info e ON e.employee_id=t.employee_id
		LEFT JOIN fault_types f ON f.id=t.client_fault_type
		%s ORDER BY t.id DESC LIMIT $%d OFFSET $%d`, where, i, i+1)

	rows, err := h.db.Query(c.Request.Context(), q, args...)
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()

	type Row struct {
		ID        int64   `json:"id"`
		TTNo      float64 `json:"tt_no"`
		EmpID     *string `json:"employee_id"`
		EmpName   *string `json:"employee_name"`
		Dept      *string `json:"department"`
		Phone     *string `json:"phone"`
		Email     *string `json:"email"`
		Client    *string `json:"client_name"`
		FaultType *int    `json:"fault_type"`
		FaultName *string `json:"fault_type_name"`
		Reason    *string `json:"reason_of_problem"`
		FaultDT   *string `json:"fault_date_time"`
		Status    int     `json:"status_progress"`
		Attach    *string `json:"attach_file"`
		CreatedBy *string `json:"created_by"`
		CreatedAt *string `json:"created_at"`
		Age       *string `json:"ticket_age"`
	}
	var result []Row
	for rows.Next() {
		var r Row
		rows.Scan(&r.ID, &r.TTNo, &r.EmpID, &r.EmpName, &r.Dept,
			&r.Phone, &r.Email, &r.Client, &r.FaultType, &r.FaultName,
			&r.Reason, &r.FaultDT, &r.Status, &r.Attach,
			&r.CreatedBy, &r.CreatedAt, &r.Age)
		result = append(result, r)
	}
	if result == nil { result = []Row{} }
	response.Paginated(c, result, total, page, ps)
}

func (h *TicketHandler) Get(c *gin.Context) {
	type Row struct {
		ID        int64   `json:"id"`
		TTNo      float64 `json:"tt_no"`
		EmpID     *string `json:"employee_id"`
		EmpName   *string `json:"employee_name"`
		Dept      *string `json:"department"`
		Phone     *string `json:"phone"`
		Email     *string `json:"email"`
		Client    *string `json:"client_name"`
		FaultType *int    `json:"fault_type"`
		FaultName *string `json:"fault_type_name"`
		Reason    *string `json:"reason_of_problem"`
		Status    int     `json:"status_progress"`
		CreatedAt *string `json:"created_at"`
		Age       *string `json:"ticket_age"`
	}
	var r Row
	err := h.db.QueryRow(c.Request.Context(), `
		SELECT t.id, t.tt_no, t.employee_id,
		       COALESCE(e.employee_name, t.employee_id),
		       COALESCE(t.depertment, e.department_name),
		       t.phone, t.email, t.client_name,
		       t.client_fault_type, f.fault_name,
		       t.reason_of_problem, t.status_progess,
		       t.status_update_date::text,
		       to_char(NOW()-t.status_update_date,'DD"d" HH24"h"')
		FROM trouble_tickets t
		LEFT JOIN employee_office_info e ON e.employee_id=t.employee_id
		LEFT JOIN fault_types f ON f.id=t.client_fault_type
		WHERE t.id=$1 AND t.active=TRUE`, c.Param("id")).
		Scan(&r.ID, &r.TTNo, &r.EmpID, &r.EmpName, &r.Dept,
			&r.Phone, &r.Email, &r.Client, &r.FaultType, &r.FaultName,
			&r.Reason, &r.Status, &r.CreatedAt, &r.Age)
	if err != nil { response.NotFound(c, "ticket not found"); return }
	response.OK(c, r)
}

func (h *TicketHandler) Create(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req struct {
		ReasonOfProblem string  `json:"reason_of_problem" binding:"required"`
		ClientName      string  `json:"client_name"`
		Department      *string `json:"department"`
		Phone           *string `json:"phone"`
		Email           *string `json:"email"`
		FaultType       *int    `json:"fault_type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error()); return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()
	tx, _ := h.db.Begin(ctx)
	defer tx.Rollback(ctx)

	var ttNo float64
	tx.QueryRow(ctx, "SELECT COALESCE(MAX(tt_no),0)+1 FROM trouble_tickets FOR UPDATE").Scan(&ttNo)

	var id int64
	err := tx.QueryRow(ctx, `
		INSERT INTO trouble_tickets
		  (tt_no, employee_id, client_name, reason_of_problem,
		   depertment, phone, email, client_fault_type, user, status_progess,
		   device_requis_val, requis_by, requis_date, status_update_by, active)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,0,$9,NOW(),$9,TRUE)
		RETURNING id`,
		ttNo, empID, req.ClientName, req.ReasonOfProblem,
		req.Department, req.Phone, req.Email, req.FaultType, empID).Scan(&id)
	if err != nil { response.ServerError(c, err); return }
	tx.Commit(ctx)
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": gin.H{"id": id, "tt_no": ttNo}})
}

func (h *TicketHandler) Update(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req map[string]any
	c.ShouldBindJSON(&req)
	h.db.Exec(c.Request.Context(), `
		UPDATE trouble_tickets SET
		  client_name=COALESCE($1::text,client_name),
		  reason_of_problem=COALESCE($2::text,reason_of_problem),
		  depertment=COALESCE($3::text,depertment),
		  phone=COALESCE($4::text,phone),
		  status_update_by=$5, status_update_date=NOW()
		WHERE id=$6 AND active=TRUE`,
		req["client_name"], req["reason_of_problem"],
		req["department"], req["phone"], empID, c.Param("id"))
	response.OK(c, gin.H{"updated": true})
}

func (h *TicketHandler) Delete(c *gin.Context) {
	empID := c.GetString("employee_id")
	h.db.Exec(c.Request.Context(),
		`UPDATE trouble_tickets SET active=FALSE, delete_by=$1, delete_at=NOW() WHERE id=$2`,
		empID, c.Param("id"))
	response.NoContent(c)
}

func (h *TicketHandler) Close(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req struct{ ClosingDescription string `json:"closing_description"` }
	c.ShouldBindJSON(&req)
	h.db.Exec(c.Request.Context(), `
		UPDATE trouble_tickets SET
		  status_progess=3, close_ticket_by=$1,
		  ticket_close_date=NOW(), closing_description=$2,
		  status_update_by=$1, status_update_date=NOW()
		WHERE id=$3 AND active=TRUE`,
		empID, req.ClosingDescription, c.Param("id"))
	response.OK(c, gin.H{"closed": true})
}

func (h *TicketHandler) UpdateStatus(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req struct{ Status int `json:"status" binding:"required"` }
	if err := c.ShouldBindJSON(&req); err != nil { response.BadRequest(c, err.Error()); return }
	h.db.Exec(c.Request.Context(), `
		UPDATE trouble_tickets SET status_progess=$1, status_update_by=$2, status_update_date=NOW()
		WHERE id=$3 AND active=TRUE`, req.Status, empID, c.Param("id"))
	response.OK(c, gin.H{"updated": true})
}

func (h *TicketHandler) GetUpdates(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT u.id, u.tt_no, u.tt_note, u.fault_update_date_time,
		       u.client_fault_forward_to, u.forward_parson,
		       u.from_zone, u.to_zone, u.logical_team, u.department, u.file_link, u.user, u.date
		FROM tbl_tt_update u
		JOIN trouble_tickets t ON t.tt_no=u.tt_no
		WHERE t.id=$1 ORDER BY u.id DESC`, c.Param("id"))
	if err != nil { response.ServerError(c, err); return }
	defer rows.Close()
	type U struct {
		ID            int64   `json:"id"`
		TTNo          float64 `json:"tt_no"`
		Note          *string `json:"tt_note"`
		UpdateDT      *string `json:"fault_update_date_time"`
		ForwardTo     *string `json:"forwarded_to"`
		ForwardPerson *string `json:"forward_person"`
		FromZone      *string `json:"from_zone"`
		ToZone        *string `json:"to_zone"`
		LogicalTeam   *string `json:"logical_team"`
		Dept          *string `json:"department"`
		FileLink      *string `json:"file_link"`
		User          *string `json:"created_by"`
		Date          *string `json:"date"`
	}
	var updates []U
	for rows.Next() {
		var u U
		rows.Scan(&u.ID, &u.TTNo, &u.Note, &u.UpdateDT,
			&u.ForwardTo, &u.ForwardPerson, &u.FromZone, &u.ToZone,
			&u.LogicalTeam, &u.Dept, &u.FileLink, &u.User, &u.Date)
		updates = append(updates, u)
	}
	if updates == nil { updates = []U{} }
	response.OK(c, updates)
}

func (h *TicketHandler) AddUpdate(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req struct {
		Note      string  `json:"tt_note" binding:"required"`
		ForwardTo *string `json:"forwarded_to"`
		FromZone  *string `json:"from_zone"`
		ToZone    *string `json:"to_zone"`
		LogTeam   *string `json:"logical_team"`
		Dept      *string `json:"department"`
		FileLink  *string `json:"file_link"`
	}
	if err := c.ShouldBindJSON(&req); err != nil { response.BadRequest(c, err.Error()); return }
	var ttNo float64
	h.db.QueryRow(c.Request.Context(), "SELECT tt_no FROM trouble_tickets WHERE id=$1", c.Param("id")).Scan(&ttNo)
	var uid int64
	h.db.QueryRow(c.Request.Context(), `
		INSERT INTO tbl_tt_update
		  (tt_no, client_name, client_scr_id, fault_start_date_time,
		   fault_update_date_time, fault_registered_at_cc, fault_update_at_cc,
		   client_fault_type, tt_note, date, from_zone, to_zone,
		   logical_team, department, file_link, user, client_fault_forward_to)
		VALUES ($1,'',0,NOW(),NOW(),'','',0,$2,NOW(),$3,$4,$5,$6,$7,$8,$9)
		RETURNING id`,
		ttNo, req.Note, req.FromZone, req.ToZone, req.LogTeam,
		req.Dept, req.FileLink, empID, req.ForwardTo).Scan(&uid)
	h.db.Exec(c.Request.Context(),
		`UPDATE trouble_tickets SET status_progess=GREATEST(status_progess,2),
		 status_update_by=$1, status_update_date=NOW() WHERE id=$2`, empID, c.Param("id"))
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": gin.H{"id": uid}})
}

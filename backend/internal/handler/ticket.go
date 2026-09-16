// // backend/internal/handler/ticket.go

// package handler

// import (
// 	"context"
// 	"encoding/json"
// 	"fmt"
// 	"net/http"
// 	"strconv"
// 	"strings"
// 	"time"
// 	"mime/multipart"
// 	"os"
// 	"path/filepath"

// 	"itm-api/pkg/response"

// 	"github.com/gin-gonic/gin"
// 	"github.com/jackc/pgx/v5"
// 	"github.com/jackc/pgx/v5/pgconn"
// 	"github.com/jackc/pgx/v5/pgxpool"
// )

// const (
// 	maxBulkTickets       = 10
// 	defaultCompanyName   = "Fiber@Home Global Ltd"
// 	ttNumberAdvisoryLock = int64(29585)
// )

// type TicketHandler struct {
// 	db *pgxpool.Pool
// }

// func NewTicketHandler(db *pgxpool.Pool) *TicketHandler {
// 	return &TicketHandler{
// 		db: db,
// 	}
// }

// /* ============================================================
//    ROUTES
// ============================================================ */

// func (h *TicketHandler) Register(rg *gin.RouterGroup) {
// 	g := rg.Group("/tickets")

// 	// Static route must be registered before /:id.
// 	g.GET("/fault-types", h.FaultTypes)

// 	g.GET("", h.List)

// 	g.POST("", h.Create)
// 	g.POST("/bulk", h.CreateBulk)

// 	g.GET("/:id", h.Get)

// 	g.PUT("/:id", h.Update)

// 	g.DELETE("/:id", h.Delete)

// 	g.PATCH("/:id/close", h.Close)
// 	g.PATCH("/:id/status", h.UpdateStatus)

// 	g.GET("/:id/updates", h.GetUpdates)
// 	g.POST("/:id/updates", h.AddUpdate)
// }

// /* ============================================================
//    INPUT TYPES
// ============================================================ */

// type ticketInput struct {
// 	ReasonOfProblem string `json:"reason_of_problem"`
// 	FaultType       int    `json:"fault_type"`
// }

// type employeeSnapshot struct {
// 	ID          string
// 	Name        string
// 	Designation string
// 	Department  string
// 	Function    string
// 	Phone       string
// 	Email       string
// }

// /* ============================================================
//    EMPLOYEE
// ============================================================ */

// func (h *TicketHandler) loadEmployeeSnapshot(
// 	ctx context.Context,
// 	employeeID string,
// ) (employeeSnapshot, error) {

// 	var employee employeeSnapshot

// 	employee.ID = employeeID

// 	err := h.db.QueryRow(
// 		ctx,
// 		`
// 		SELECT
// 			COALESCE(o.employee_name, ''),
// 			COALESCE(o.designation, ''),
// 			COALESCE(o.department_name, ''),
// 			COALESCE(o.sub_function, ''),
// 			COALESCE(
// 				p.official_cell_no,
// 				p.personal_cell_no,
// 				''
// 			),
// 			COALESCE(
// 				p.official_email,
// 				p.email,
// 				''
// 			)
// 		FROM public.employee_office_info AS o
// 		LEFT JOIN public.employee_personal_info AS p
// 			ON p.employee_id = o.employee_id
// 		WHERE BTRIM(o.employee_id) = BTRIM($1)
// 		LIMIT 1
// 		`,
// 		employeeID,
// 	).Scan(
// 		&employee.Name,
// 		&employee.Designation,
// 		&employee.Department,
// 		&employee.Function,
// 		&employee.Phone,
// 		&employee.Email,
// 	)

// 	if err != nil {

// 		if err == pgx.ErrNoRows {
// 			/*
// 				Authentication is already valid.

// 				Keep employee ID and allow ticket creation
// 				even when optional employee master data
// 				is temporarily unavailable.
// 			*/
// 			return employee, nil
// 		}

// 		return employee, err
// 	}

// 	return employee, nil
// }

// /* ============================================================
//    FAULT TYPE
//    Source:
//    public.tt_faults

//    Actual fields:

//    id
//    fault_name
//    fault_register
//    fault_desc
//    date
//    status
//    edited_by
//    edited_at

//    IMPORTANT:
//    trouble_tickets does NOT contain fault_type_id.

//    We use tt_faults.id only to resolve the selected
//    fault and save fault_name into trouble_tickets.query_type.
// ============================================================ */

// type faultSnapshot struct {
// 	ID   int64
// 	Name string
// }

// func (h *TicketHandler) getFault(
// 	ctx context.Context,
// 	tx pgx.Tx,
// 	faultID int,
// ) (faultSnapshot, error) {

// 	var fault faultSnapshot

// 	err := tx.QueryRow(
// 		ctx,
// 		`
// 		SELECT
// 			id,
// 			COALESCE(fault_name, '')
// 		FROM public.tt_faults
// 		WHERE id = $1
// 		  AND (
// 				status IS NULL
// 				OR status = 1
// 		  )
// 		`,
// 		faultID,
// 	).Scan(
// 		&fault.ID,
// 		&fault.Name,
// 	)

// 	return fault, err
// }

// /* ============================================================
//    FAULT TYPES API

//    GET /api/v1/tickets/fault-types

//    Reads directly from:

//    public.tt_faults
// ============================================================ */

// func (h *TicketHandler) FaultTypes(c *gin.Context) {

// 	ctx, cancel := context.WithTimeout(
// 		c.Request.Context(),
// 		10*time.Second,
// 	)
// 	defer cancel()

// 	type FaultType struct {
// 		ID            int64  `json:"id"`
// 		FaultName     string `json:"fault_name"`
// 		FaultRegister string `json:"fault_register"`
// 		FaultDesc     string `json:"fault_desc"`
// 		Status        int    `json:"status"`
// 	}

// 	rows, err := h.db.Query(
// 		ctx,
// 		`
// 		SELECT
// 			id,
// 			COALESCE(fault_name, ''),
// 			COALESCE(fault_register, ''),
// 			COALESCE(fault_desc, ''),
// 			COALESCE(status, 0)
// 		FROM public.tt_faults
// 		WHERE (
// 			status IS NULL
// 			OR status = 1
// 		)
// 		ORDER BY
// 			fault_name ASC,
// 			id ASC
// 		`,
// 	)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	defer rows.Close()

// 	items := make(
// 		[]FaultType,
// 		0,
// 	)

// 	for rows.Next() {

// 		var item FaultType

// 		if err := rows.Scan(
// 			&item.ID,
// 			&item.FaultName,
// 			&item.FaultRegister,
// 			&item.FaultDesc,
// 			&item.Status,
// 		); err != nil {

// 			response.ServerError(c, err)
// 			return
// 		}

// 		items = append(
// 			items,
// 			item,
// 		)
// 	}

// 	if err := rows.Err(); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.OK(
// 		c,
// 		items,
// 	)
// }

// /* ============================================================
//    TT NUMBER
// ============================================================ */

// func nextTTNumber(
// 	ctx context.Context,
// 	tx pgx.Tx,
// ) (string, error) {

// 	var next int64

// 	err := tx.QueryRow(
// 		ctx,
// 		`
// 		SELECT
// 			COALESCE(
// 				MAX(
// 					CASE
// 						WHEN BTRIM(tt_no) ~ '^[0-9]+$'
// 						THEN BTRIM(tt_no)::BIGINT
// 					END
// 				),
// 				0
// 			) + 1
// 		FROM public.trouble_tickets
// 		`,
// 	).Scan(&next)

// 	if err != nil {
// 		return "", err
// 	}

// 	return strconv.FormatInt(
// 		next,
// 		10,
// 	), nil
// }

// /* ============================================================
//    STATUS HELPERS
// ============================================================ */

// func normalizeStatus(
// 	value string,
// ) (string, bool) {

// 	switch strings.ToLower(
// 		strings.TrimSpace(value),
// 	) {

// 	case "1", "not started", "not_started":
// 		return "Not Started", true

// 	case "2", "open":
// 		return "Open", true

// 	case "3", "in progress", "in_progress", "running":
// 		return "In Progress", true

// 	case "4", "closed":
// 		return "Closed", true

// 	default:
// 		return "", false
// 	}
// }

// func parseStatusValue(
// 	raw any,
// ) (string, bool) {

// 	switch value := raw.(type) {

// 	case string:
// 		return normalizeStatus(value)

// 	case float64:
// 		return normalizeStatus(
// 			strconv.FormatInt(
// 				int64(value),
// 				10,
// 			),
// 		)

// 	case json.Number:
// 		return normalizeStatus(
// 			value.String(),
// 		)

// 	case int:
// 		return normalizeStatus(
// 			strconv.Itoa(value),
// 		)

// 	case int64:
// 		return normalizeStatus(
// 			strconv.FormatInt(
// 				value,
// 				10,
// 			),
// 		)

// 	default:
// 		return "", false
// 	}
// }

// /* ============================================================
//    AUTH
// ============================================================ */

// func currentEmployeeID(
// 	c *gin.Context,
// ) string {

// 	return strings.TrimSpace(
// 		c.GetString("employee_id"),
// 	)
// }

// func requireEmployee(
// 	c *gin.Context,
// ) (string, bool) {

// 	employeeID := currentEmployeeID(c)

// 	if employeeID == "" {

// 		c.JSON(
// 			http.StatusUnauthorized,
// 			gin.H{
// 				"success": false,
// 				"error":   "authenticated employee id not found",
// 			},
// 		)

// 		return "", false
// 	}

// 	return employeeID, true
// }

// /* ============================================================
//    LIST
// ============================================================ */

// func (h *TicketHandler) List(
// 	c *gin.Context,
// ) {

// 	page, err := strconv.Atoi(
// 		c.DefaultQuery("page", "1"),
// 	)

// 	if err != nil || page < 1 {
// 		page = 1
// 	}

// 	pageSize, err := strconv.Atoi(
// 		c.DefaultQuery("page_size", "20"),
// 	)

// 	if err != nil || pageSize < 1 {
// 		pageSize = 20
// 	}

// 	if pageSize > 100 {
// 		pageSize = 100
// 	}

// 	offset := (page - 1) * pageSize

// 	args := make([]any, 0)

// 	where := "WHERE TRUE"

// 	arg := 1

// 	/* --------------------------------------------------------
// 	   STATUS FILTER
// 	-------------------------------------------------------- */

// 	if status := strings.TrimSpace(
// 		c.Query("status"),
// 	); status != "" && status != "all" {

// 		normalized, ok := normalizeStatus(status)

// 		if !ok {
// 			response.BadRequest(
// 				c,
// 				"invalid ticket status",
// 			)
// 			return
// 		}

// 		args = append(
// 			args,
// 			normalized,
// 		)

// 		where += fmt.Sprintf(
// 			" AND t.status = $%d",
// 			arg,
// 		)

// 		arg++
// 	}

// 	/* --------------------------------------------------------
// 	   EMPLOYEE FILTER
// 	-------------------------------------------------------- */

// 	if employeeID := strings.TrimSpace(
// 		c.Query("emp_id"),
// 	); employeeID != "" {

// 		args = append(
// 			args,
// 			employeeID,
// 		)

// 		where += fmt.Sprintf(
// 			" AND BTRIM(t.employee_id) = BTRIM($%d)",
// 			arg,
// 		)

// 		arg++
// 	}

// 	/* --------------------------------------------------------
// 	   SEARCH
// 	-------------------------------------------------------- */

// 	if search := strings.TrimSpace(
// 		c.Query("search"),
// 	); search != "" {

// 		searchValue := "%" + search + "%"

// 		args = append(
// 			args,
// 			searchValue,
// 		)

// 		where += fmt.Sprintf(
// 			`
// 			AND (
// 				COALESCE(t.company_name, '') ILIKE $%d
// 				OR COALESCE(t.employee_name, '') ILIKE $%d
// 				OR COALESCE(t.tt_no, '') ILIKE $%d
// 				OR COALESCE(t.employee_id, '') ILIKE $%d
// 				OR COALESCE(t.query_type, '') ILIKE $%d
// 				OR COALESCE(t.description, '') ILIKE $%d
// 			)
// 			`,
// 			arg,
// 			arg,
// 			arg,
// 			arg,
// 			arg,
// 			arg,
// 		)

// 		arg++
// 	}

// 	/* --------------------------------------------------------
// 	   COUNT
// 	-------------------------------------------------------- */

// 	var total int

// 	err = h.db.QueryRow(
// 		c.Request.Context(),
// 		`
// 		SELECT COUNT(*)
// 		FROM public.trouble_tickets AS t
// 		`+where,
// 		args...,
// 	).Scan(&total)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	args = append(
// 		args,
// 		pageSize,
// 		offset,
// 	)

// 	query := fmt.Sprintf(
// 		`
// 		SELECT
// 			t.id,
// 			t.legacy_id,
// 			t.tt_no,
// 			COALESCE(t.employee_id, ''),
// 			COALESCE(t.employee_name, ''),
// 			COALESCE(t.designation, ''),
// 			COALESCE(t.department, ''),
// 			COALESCE(t.function_name, ''),
// 			COALESCE(t.company_name, ''),
// 			COALESCE(t.mobile_no, ''),
// 			COALESCE(t.email, ''),
// 			COALESCE(t.query_type, ''),
// 			COALESCE(t.description, ''),
// 			COALESCE(t.requested_by, ''),
// 			COALESCE(t.assigned_id, ''),
// 			COALESCE(t.assigned_name, ''),
// 			t.status,
// 			COALESCE(t.requisition_type, ''),
// 			COALESCE(t.delivered_status, ''),
// 			t.created_at::text,
// 			t.closed_at::text,
// 			t.closed_by,
// 			t.closing_description,
// 			t.source_status,
// 			t.source_progress,
// 			t.source_device_requisition,
// 			t.legacy_data,
// 			t.inserted_at::text,
// 			t.updated_at::text
// 		FROM public.trouble_tickets AS t
// 		%s
// 		ORDER BY t.id DESC
// 		LIMIT $%d
// 		OFFSET $%d
// 		`,
// 		where,
// 		arg,
// 		arg+1,
// 	)

// 	rows, err := h.db.Query(
// 		c.Request.Context(),
// 		query,
// 		args...,
// 	)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	defer rows.Close()

// 	type Row struct {
// 		ID                 int64          `json:"id"`
// 		LegacyID           *int64         `json:"legacy_id"`
// 		TTNo               string         `json:"tt_no"`
// 		EmployeeID         string         `json:"employee_id"`
// 		EmployeeName       string         `json:"employee_name"`
// 		Designation        string         `json:"designation"`
// 		Department         string         `json:"department"`
// 		FunctionName       string         `json:"function_name"`
// 		CompanyName        string         `json:"company_name"`
// 		MobileNo           string         `json:"mobile_no"`
// 		Email              string         `json:"email"`
// 		QueryType          string         `json:"query_type"`
// 		Description        string         `json:"description"`
// 		RequestedBy        string         `json:"requested_by"`
// 		AssignedID         string         `json:"assigned_id"`
// 		AssignedName       string         `json:"assigned_name"`
// 		Status             string         `json:"status"`
// 		RequisitionType    string         `json:"requisition_type"`
// 		DeliveredStatus    string         `json:"delivered_status"`
// 		CreatedAt          string         `json:"created_at"`
// 		ClosedAt           *string        `json:"closed_at"`
// 		ClosedBy           *string        `json:"closed_by"`
// 		ClosingDescription *string        `json:"closing_description"`
// 		SourceStatus       *int16         `json:"source_status"`
// 		SourceProgress     *int16         `json:"source_progress"`
// 		SourceDeviceRequis *int16         `json:"source_device_requisition"`
// 		LegacyData         map[string]any `json:"legacy_data"`
// 		InsertedAt         string         `json:"inserted_at"`
// 		UpdatedAt          string         `json:"updated_at"`
// 	}

// 	result := make(
// 		[]Row,
// 		0,
// 	)

// 	for rows.Next() {

// 		var row Row

// 		if err := rows.Scan(
// 			&row.ID,
// 			&row.LegacyID,
// 			&row.TTNo,
// 			&row.EmployeeID,
// 			&row.EmployeeName,
// 			&row.Designation,
// 			&row.Department,
// 			&row.FunctionName,
// 			&row.CompanyName,
// 			&row.MobileNo,
// 			&row.Email,
// 			&row.QueryType,
// 			&row.Description,
// 			&row.RequestedBy,
// 			&row.AssignedID,
// 			&row.AssignedName,
// 			&row.Status,
// 			&row.RequisitionType,
// 			&row.DeliveredStatus,
// 			&row.CreatedAt,
// 			&row.ClosedAt,
// 			&row.ClosedBy,
// 			&row.ClosingDescription,
// 			&row.SourceStatus,
// 			&row.SourceProgress,
// 			&row.SourceDeviceRequis,
// 			&row.LegacyData,
// 			&row.InsertedAt,
// 			&row.UpdatedAt,
// 		); err != nil {

// 			response.ServerError(c, err)
// 			return
// 		}

// 		result = append(
// 			result,
// 			row,
// 		)
// 	}

// 	if err := rows.Err(); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.Paginated(
// 		c,
// 		result,
// 		total,
// 		page,
// 		pageSize,
// 	)
// }

// /* ============================================================
//    GET SINGLE TT
// ============================================================ */

// func (h *TicketHandler) Get(
// 	c *gin.Context,
// ) {

// 	type TicketResponse struct {
// 		ID                 int64          `json:"id"`
// 		LegacyID           *int64         `json:"legacy_id"`
// 		TTNo               string         `json:"tt_no"`
// 		EmployeeID         string         `json:"employee_id"`
// 		EmployeeName       string         `json:"employee_name"`
// 		Designation        string         `json:"designation"`
// 		Department         string         `json:"department"`
// 		FunctionName       string         `json:"function_name"`
// 		CompanyName        string         `json:"company_name"`
// 		MobileNo           string         `json:"mobile_no"`
// 		Email              string         `json:"email"`
// 		QueryType          string         `json:"query_type"`
// 		Description        string         `json:"description"`
// 		RequestedBy        string         `json:"requested_by"`
// 		AssignedID         string         `json:"assigned_id"`
// 		AssignedName       string         `json:"assigned_name"`
// 		Status             string         `json:"status"`
// 		RequisitionType    string         `json:"requisition_type"`
// 		DeliveredStatus    string         `json:"delivered_status"`
// 		CreatedAt          string         `json:"created_at"`
// 		ClosedAt           *string        `json:"closed_at"`
// 		ClosedBy           *string        `json:"closed_by"`
// 		ClosingDescription *string        `json:"closing_description"`
// 		SourceStatus       *int16         `json:"source_status"`
// 		SourceProgress     *int16         `json:"source_progress"`
// 		SourceDeviceRequis *int16         `json:"source_device_requisition"`
// 		LegacyData         map[string]any `json:"legacy_data"`
// 		InsertedAt         string         `json:"inserted_at"`
// 		UpdatedAt          string         `json:"updated_at"`
// 	}

// 	var ticket TicketResponse

// 	err := h.db.QueryRow(
// 		c.Request.Context(),
// 		`
// 		SELECT
// 			id,
// 			legacy_id,
// 			tt_no,
// 			COALESCE(employee_id, ''),
// 			COALESCE(employee_name, ''),
// 			COALESCE(designation, ''),
// 			COALESCE(department, ''),
// 			COALESCE(function_name, ''),
// 			COALESCE(company_name, ''),
// 			COALESCE(mobile_no, ''),
// 			COALESCE(email, ''),
// 			COALESCE(query_type, ''),
// 			COALESCE(description, ''),
// 			COALESCE(requested_by, ''),
// 			COALESCE(assigned_id, ''),
// 			COALESCE(assigned_name, ''),
// 			status,
// 			COALESCE(requisition_type, ''),
// 			COALESCE(delivered_status, ''),
// 			created_at::text,
// 			closed_at::text,
// 			closed_by,
// 			closing_description,
// 			source_status,
// 			source_progress,
// 			source_device_requisition,
// 			legacy_data,
// 			inserted_at::text,
// 			updated_at::text
// 		FROM public.trouble_tickets
// 		WHERE id = $1
// 		`,
// 		c.Param("id"),
// 	).Scan(
// 		&ticket.ID,
// 		&ticket.LegacyID,
// 		&ticket.TTNo,
// 		&ticket.EmployeeID,
// 		&ticket.EmployeeName,
// 		&ticket.Designation,
// 		&ticket.Department,
// 		&ticket.FunctionName,
// 		&ticket.CompanyName,
// 		&ticket.MobileNo,
// 		&ticket.Email,
// 		&ticket.QueryType,
// 		&ticket.Description,
// 		&ticket.RequestedBy,
// 		&ticket.AssignedID,
// 		&ticket.AssignedName,
// 		&ticket.Status,
// 		&ticket.RequisitionType,
// 		&ticket.DeliveredStatus,
// 		&ticket.CreatedAt,
// 		&ticket.ClosedAt,
// 		&ticket.ClosedBy,
// 		&ticket.ClosingDescription,
// 		&ticket.SourceStatus,
// 		&ticket.SourceProgress,
// 		&ticket.SourceDeviceRequis,
// 		&ticket.LegacyData,
// 		&ticket.InsertedAt,
// 		&ticket.UpdatedAt,
// 	)

// 	if err != nil {

// 		if err == pgx.ErrNoRows {
// 			response.NotFound(
// 				c,
// 				"ticket not found",
// 			)
// 			return
// 		}

// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.OK(
// 		c,
// 		ticket,
// 	)
// }

// /* ============================================================
//    CREATE SINGLE

//    POST /api/v1/tickets

//    IMPORTANT:
//    Creation does NOT create history.

//    Flow:

//    frontend fault_type
//           ↓
//    public.tt_faults
//           ↓
//    fault_name
//           ↓
//    trouble_tickets.query_type
// ============================================================ */

// func (h *TicketHandler) Create(
// 	c *gin.Context,
// ) {

// 	employeeID, ok := requireEmployee(c)

// 	if !ok {
// 		return
// 	}

// 	var req ticketInput

// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(
// 			c,
// 			err.Error(),
// 		)
// 		return
// 	}

// 	req.ReasonOfProblem =
// 		strings.TrimSpace(
// 			req.ReasonOfProblem,
// 		)

// 	if err := validateTicketInput(req); err != nil {
// 		response.BadRequest(
// 			c,
// 			err.Error(),
// 		)
// 		return
// 	}

// 	ctx, cancel := context.WithTimeout(
// 		c.Request.Context(),
// 		20*time.Second,
// 	)
// 	defer cancel()

// 	tx, err := h.db.Begin(ctx)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	defer tx.Rollback(ctx)

// 	/*
// 		Prevent concurrent requests from generating
// 		the same TT number.
// 	*/
// 	if _, err := tx.Exec(
// 		ctx,
// 		`SELECT pg_advisory_xact_lock($1)`,
// 		ttNumberAdvisoryLock,
// 	); err != nil {

// 		response.ServerError(c, err)
// 		return
// 	}

// 	employee, err := h.loadEmployeeSnapshot(
// 		ctx,
// 		employeeID,
// 	)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	/*
// 		Resolve selected fault from public.tt_faults.
// 	*/
// 	fault, err := h.getFault(
// 		ctx,
// 		tx,
// 		req.FaultType,
// 	)

// 	if err != nil {

// 		if err == pgx.ErrNoRows {
// 			response.BadRequest(
// 				c,
// 				"selected fault type is not available",
// 			)
// 			return
// 		}

// 		response.ServerError(c, err)
// 		return
// 	}

// 	ttNo, err := nextTTNumber(
// 		ctx,
// 		tx,
// 	)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	var id int64

// 	/*
// 		IMPORTANT:

// 		There is NO fault_type_id column in
// 		trouble_tickets.

// 		Therefore:

// 		fault.ID   -> only used to validate selection
// 		fault.Name -> saved as query_type
// 	*/

// 	err = tx.QueryRow(
// 		ctx,
// 		`
// 		INSERT INTO public.trouble_tickets (
// 			tt_no,
// 			employee_id,
// 			employee_name,
// 			designation,
// 			department,
// 			function_name,
// 			company_name,
// 			mobile_no,
// 			email,
// 			query_type,
// 			description,
// 			requested_by,
// 			status,
// 			created_at,
// 			updated_at
// 		)
// 		VALUES (
// 			$1,
// 			$2,
// 			$3,
// 			$4,
// 			$5,
// 			$6,
// 			$7,
// 			$8,
// 			$9,
// 			$10,
// 			$11,
// 			$12,
// 			'Open',
// 			NOW(),
// 			NOW()
// 		)
// 		RETURNING id
// 		`,
// 		ttNo,
// 		employee.ID,
// 		employee.Name,
// 		employee.Designation,
// 		employee.Department,
// 		employee.Function,
// 		defaultCompanyName,
// 		employee.Phone,
// 		employee.Email,
// 		fault.Name,
// 		req.ReasonOfProblem,
// 		employee.Name,
// 	).Scan(&id)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	/*
// 		NO HISTORY INSERT HERE.

// 		Creation history is intentionally not generated.
// 	*/

// 	if err := tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	c.JSON(
// 		http.StatusCreated,
// 		gin.H{
// 			"success": true,
// 			"data": gin.H{
// 				"id":    id,
// 				"tt_no": ttNo,
// 			},
// 		},
// 	)
// }

// /* ============================================================
//    CREATE BULK

//    POST /api/v1/tickets/bulk

//    Maximum:
//    10 tickets.

//    Entire operation is atomic.

//    If ticket #3 fails:
//    ticket #1 and #2 are also rolled back.

//    NO creation history is inserted.
// ============================================================ */
// //3rd step To create multiple tickets at once, we will use the CreateBulk function. This function will read a JSON array of tickets from the request body, validate each ticket, and then insert them into the database in a single transaction. If any ticket fails validation or insertion, the entire operation will be rolled back.

// func (h *TicketHandler) CreateBulk(c *gin.Context) {
// 	employeeID, ok := requireEmployee(c)
// 	if !ok {
// 		return
// 	}

// 	/*
// 		========================================================
// 		READ MULTIPART FORM
// 		========================================================

// 		Frontend sends:

// 		tickets = {
// 			"tickets": [
// 				{
// 					"reason_of_problem": "...",
// 					"fault_type": 1
// 				},
// 				{
// 					"reason_of_problem": "...",
// 					"fault_type": 2
// 				}
// 			]
// 		}

// 		Files:

// 		ticket_0_file
// 		ticket_1_file
// 		ticket_2_file
// 		...
// 	*/

// 	ticketsJSON := c.PostForm("tickets")

// 	if strings.TrimSpace(ticketsJSON) == "" {
// 		response.BadRequest(
// 			c,
// 			"tickets field is required",
// 		)
// 		return
// 	}

// 	var req struct {
// 		Tickets []ticketInput `json:"tickets"`
// 	}

// 	if err := json.Unmarshal(
// 		[]byte(ticketsJSON),
// 		&req,
// 	); err != nil {
// 		response.BadRequest(
// 			c,
// 			"invalid tickets JSON",
// 		)
// 		return
// 	}

// 	if len(req.Tickets) < 1 {
// 		response.BadRequest(
// 			c,
// 			"at least one ticket is required",
// 		)
// 		return
// 	}

// 	if len(req.Tickets) > maxBulkTickets {
// 		response.BadRequest(
// 			c,
// 			"maximum 10 trouble tickets can be created at once",
// 		)
// 		return
// 	}

// 	/*
// 		========================================================
// 		VALIDATE TICKETS
// 		========================================================
// 	*/

// 	for i := range req.Tickets {
// 		req.Tickets[i].ReasonOfProblem =
// 			strings.TrimSpace(
// 				req.Tickets[i].ReasonOfProblem,
// 			)

// 		if err := validateTicketInput(
// 			req.Tickets[i],
// 		); err != nil {
// 			response.BadRequest(
// 				c,
// 				fmt.Sprintf(
// 					"ticket #%d: %s",
// 					i+1,
// 					err.Error(),
// 				),
// 			)
// 			return
// 		}
// 	}

// 	/*
// 		========================================================
// 		READ ONE FILE PER TT
// 		========================================================
// 	*/

// 	// type UploadedFile struct {
// 	// 	Header *multipart.FileHeader
// 	// }

// 	files := make(
// 		[]*multipart.FileHeader,
// 		len(req.Tickets),
// 	)

// 	for i := range req.Tickets {

// 		fieldName := fmt.Sprintf(
// 			"ticket_%d_file",
// 			i,
// 		)

// 		header, err := c.FormFile(
// 			fieldName,
// 		)

// 		if err != nil {

// 			/*
// 				No file is allowed.

// 				This is NOT an error.

// 				Example:

// 				TT #1 → file
// 				TT #2 → no file
// 				TT #3 → file
// 			*/
// 			files[i] = nil
// 			continue
// 		}

// 		if header.Size > 5*1024*1024 {
// 			response.BadRequest(
// 				c,
// 				fmt.Sprintf(
// 					"ticket #%d attachment must be 5 MB or smaller",
// 					i+1,
// 				),
// 			)
// 			return
// 		}

// 		files[i] = header
// 	}

// 	/*
// 		========================================================
// 		DATABASE TRANSACTION
// 		========================================================
// 	*/

// 	ctx, cancel := context.WithTimeout(
// 		c.Request.Context(),
// 		30*time.Second,
// 	)
// 	defer cancel()

// 	tx, err := h.db.Begin(ctx)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	defer tx.Rollback(ctx)

// 	/*
// 		Prevent duplicate TT numbers.
// 	*/

// 	if _, err := tx.Exec(
// 		ctx,
// 		`SELECT pg_advisory_xact_lock($1)`,
// 		ttNumberAdvisoryLock,
// 	); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	employee, err := h.loadEmployeeSnapshot(
// 		ctx,
// 		employeeID,
// 	)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	type CreatedTicket struct {
// 		ID           int64  `json:"id"`
// 		TTNo         string `json:"tt_no"`
// 		AttachedFile string `json:"attached_file,omitempty"`
// 	}

// 	created := make(
// 		[]CreatedTicket,
// 		0,
// 		len(req.Tickets),
// 	)

// 	/*
// 		========================================================
// 		CREATE EACH TT
// 		========================================================
// 	*/

// 	for i := range req.Tickets {

// 		item := req.Tickets[i]

// 		fault, err := h.getFault(
// 			ctx,
// 			tx,
// 			item.FaultType,
// 		)

// 		if err != nil {

// 			if err == pgx.ErrNoRows {
// 				response.BadRequest(
// 					c,
// 					fmt.Sprintf(
// 						"ticket #%d: selected fault type is not available",
// 						i+1,
// 					),
// 				)
// 				return
// 			}

// 			response.ServerError(c, err)
// 			return
// 		}

// 		ttNo, err := nextTTNumber(
// 			ctx,
// 			tx,
// 		)

// 		if err != nil {
// 			response.ServerError(c, err)
// 			return
// 		}

// 		/*
// 			====================================================
// 			FILE PATH
// 			====================================================
// 		*/

// 		attachedFile := ""

// 		if files[i] != nil {

// 			header := files[i]

// 			extension := filepath.Ext(
// 				header.Filename,
// 			)

// 			/*
// 				Generate unique filename.

// 				Example:

// 				20260902124530_12345.png
// 			*/

// 			filename := fmt.Sprintf(
// 				"%d_%d%s",
// 				time.Now().UnixNano(),
// 				i+1,
// 				extension,
// 			)

// 			relativePath := filepath.ToSlash(
// 				filepath.Join(
// 					"uploads",
// 					"tt",
// 					filename,
// 				),
// 			)

// 			absolutePath := filepath.Join(
// 				"uploads",
// 				"tt",
// 				filename,
// 			)

// 			/*
// 				IMPORTANT:

// 				If your backend is running from:

// 				D:\ITM-Data\itm\backend

// 				then:

// 				uploads\tt

// 				resolves to:

// 				D:\ITM-Data\itm\backend\uploads\tt
// 			*/

// 			if err := os.MkdirAll(
// 				filepath.Dir(absolutePath),
// 				0755,
// 			); err != nil {
// 				response.ServerError(c, err)
// 				return
// 			}

// 			if err := c.SaveUploadedFile(
// 				header,
// 				absolutePath,
// 			); err != nil {
// 				response.ServerError(c, err)
// 				return
// 			}

// 			attachedFile = relativePath
// 		}

// 		/*
// 			====================================================
// 			INSERT TT
// 			====================================================
// 		*/

// 		var id int64

// 		err = tx.QueryRow(
// 			ctx,
// 			`
// 			INSERT INTO public.trouble_tickets (
// 				tt_no,
// 				employee_id,
// 				employee_name,
// 				designation,
// 				department,
// 				function_name,
// 				company_name,
// 				mobile_no,
// 				email,
// 				query_type,
// 				description,
// 				requested_by,
// 				status,
// 				attached_file,
// 				created_at,
// 				updated_at
// 			)
// 			VALUES (
// 				$1,
// 				$2,
// 				$3,
// 				$4,
// 				$5,
// 				$6,
// 				$7,
// 				$8,
// 				$9,
// 				$10,
// 				$11,
// 				$12,
// 				'Open',
// 				NULLIF($13, ''),
// 				NOW(),
// 				NOW()
// 			)
// 			RETURNING id
// 			`,
// 			ttNo,
// 			employee.ID,
// 			employee.Name,
// 			employee.Designation,
// 			employee.Department,
// 			employee.Function,
// 			defaultCompanyName,
// 			employee.Phone,
// 			employee.Email,
// 			fault.Name,
// 			item.ReasonOfProblem,
// 			employee.Name,
// 			attachedFile,
// 		).Scan(&id)

// 		if err != nil {
// 			response.ServerError(c, err)
// 			return
// 		}

// 		created = append(
// 			created,
// 			CreatedTicket{
// 				ID:           id,
// 				TTNo:         ttNo,
// 				AttachedFile: attachedFile,
// 			},
// 		)
// 	}

// 	/*
// 		========================================================
// 		COMMIT
// 		========================================================
// 	*/

// 	if err := tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	c.JSON(
// 		http.StatusCreated,
// 		gin.H{
// 			"success": true,
// 			"data": gin.H{
// 				"created": created,
// 				"count":   len(created),
// 			},
// 		},
// 	)
// }
// /* ============================================================
//    VALIDATION
// ============================================================ */

// func validateTicketInput(
// 	req ticketInput,
// ) error {

// 	if strings.TrimSpace(
// 		req.ReasonOfProblem,
// 	) == "" {

// 		return fmt.Errorf(
// 			"reason_of_problem is required",
// 		)
// 	}

// 	if len([]rune(
// 		req.ReasonOfProblem,
// 	)) < 5 {

// 		return fmt.Errorf(
// 			"reason_of_problem must contain at least 5 characters",
// 		)
// 	}

// 	if len([]rune(
// 		req.ReasonOfProblem,
// 	)) > 5000 {

// 		return fmt.Errorf(
// 			"reason_of_problem cannot exceed 5000 characters",
// 		)
// 	}

// 	if req.FaultType <= 0 {

// 		return fmt.Errorf(
// 			"fault_type is required",
// 		)
// 	}

// 	return nil
// }

// /* ============================================================
//    UPDATE
// ============================================================ */

// func (h *TicketHandler) Update(
// 	c *gin.Context,
// ) {

// 	employeeID, ok := requireEmployee(c)

// 	if !ok {
// 		return
// 	}

// 	var req struct {
// 		ReasonOfProblem *string `json:"reason_of_problem"`
// 		FaultType       *int    `json:"fault_type"`
// 		Department      *string `json:"department"`
// 		Status          any     `json:"status"`
// 		Note            *string `json:"note"`
// 	}

// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(
// 			c,
// 			err.Error(),
// 		)
// 		return
// 	}

// 	ctx, cancel := context.WithTimeout(
// 		c.Request.Context(),
// 		20*time.Second,
// 	)
// 	defer cancel()

// 	tx, err := h.db.Begin(ctx)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	defer tx.Rollback(ctx)

// 	var (
// 		currentStatus  string
// 		oldDescription string
// 		oldDepartment  string
// 	)

// 	err = tx.QueryRow(
// 		ctx,
// 		`
// 		SELECT
// 			status,
// 			COALESCE(description, ''),
// 			COALESCE(department, '')
// 		FROM public.trouble_tickets
// 		WHERE id = $1
// 		`,
// 		c.Param("id"),
// 	).Scan(
// 		&currentStatus,
// 		&oldDescription,
// 		&oldDepartment,
// 	)

// 	if err != nil {

// 		if err == pgx.ErrNoRows {
// 			response.NotFound(
// 				c,
// 				"ticket not found",
// 			)
// 			return
// 		}

// 		response.ServerError(c, err)
// 		return
// 	}

// 	setParts := make(
// 		[]string,
// 		0,
// 	)

// 	args := make(
// 		[]any,
// 		0,
// 	)

// 	arg := 1

// 	var (
// 		newDescription *string
// 		newDepartment  *string
// 		newQueryType   *string
// 		newStatus      string
// 		statusChanged  bool
// 	)

// 	/* --------------------------------------------------------
// 	   DESCRIPTION
// 	-------------------------------------------------------- */

// 	if req.ReasonOfProblem != nil {

// 		value := strings.TrimSpace(
// 			*req.ReasonOfProblem,
// 		)

// 		if value == "" {

// 			response.BadRequest(
// 				c,
// 				"reason_of_problem cannot be empty",
// 			)
// 			return
// 		}

// 		if len([]rune(value)) > 5000 {

// 			response.BadRequest(
// 				c,
// 				"reason_of_problem cannot exceed 5000 characters",
// 			)
// 			return
// 		}

// 		newDescription = &value

// 		setParts = append(
// 			setParts,
// 			fmt.Sprintf(
// 				"description = $%d",
// 				arg,
// 			),
// 		)

// 		args = append(
// 			args,
// 			value,
// 		)

// 		arg++
// 	}

// 	/* --------------------------------------------------------
// 	   DEPARTMENT
// 	-------------------------------------------------------- */

// 	if req.Department != nil {

// 		value := strings.TrimSpace(
// 			*req.Department,
// 		)

// 		newDepartment = &value

// 		setParts = append(
// 			setParts,
// 			fmt.Sprintf(
// 				"department = $%d",
// 				arg,
// 			),
// 		)

// 		args = append(
// 			args,
// 			value,
// 		)

// 		arg++
// 	}

// 	/* --------------------------------------------------------
// 	   FAULT TYPE

// 	   Resolve through public.tt_faults.

// 	   Save fault_name into query_type.
// 	-------------------------------------------------------- */

// 	if req.FaultType != nil {

// 		fault, faultErr := h.getFault(
// 			ctx,
// 			tx,
// 			*req.FaultType,
// 		)

// 		if faultErr != nil {

// 			if faultErr == pgx.ErrNoRows {

// 				response.BadRequest(
// 					c,
// 					"selected fault type is not available",
// 				)

// 				return
// 			}

// 			response.ServerError(
// 				c,
// 				faultErr,
// 			)

// 			return
// 		}

// 		setParts = append(
// 			setParts,
// 			fmt.Sprintf(
// 				"query_type = $%d",
// 				arg,
// 			),
// 		)

// 		args = append(
// 			args,
// 			fault.Name,
// 		)

// 		newQueryType = &fault.Name

// 		arg++
// 	}

// 	/* --------------------------------------------------------
// 	   STATUS
// 	-------------------------------------------------------- */

// 	if req.Status != nil {

// 		status, valid := parseStatusValue(
// 			req.Status,
// 		)

// 		if !valid {

// 			response.BadRequest(
// 				c,
// 				"invalid ticket status",
// 			)

// 			return
// 		}

// 		newStatus = status

// 		if status != currentStatus {

// 			statusChanged = true

// 			setParts = append(
// 				setParts,
// 				fmt.Sprintf(
// 					"status = $%d",
// 					arg,
// 				),
// 			)

// 			args = append(
// 				args,
// 				status,
// 			)

// 			arg++
// 		}
// 	}

// 	if len(setParts) == 0 {

// 		response.BadRequest(
// 			c,
// 			"no ticket fields were supplied for update",
// 		)

// 		return
// 	}

// 	setParts = append(
// 		setParts,
// 		"updated_at = NOW()",
// 	)

// 	args = append(
// 		args,
// 		c.Param("id"),
// 	)

// 	query := `
// 		UPDATE public.trouble_tickets
// 		SET ` +
// 		strings.Join(
// 			setParts,
// 			", ",
// 		) +
// 		fmt.Sprintf(
// 			`
// 			WHERE id = $%d
// 			`,
// 			arg,
// 		)

// 	result, err := tx.Exec(
// 		ctx,
// 		query,
// 		args...,
// 	)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	if result.RowsAffected() == 0 {

// 		response.NotFound(
// 			c,
// 			"ticket not found",
// 		)

// 		return
// 	}

// 	/* --------------------------------------------------------
// 	   HISTORY

// 	   History is generated ONLY during update.
// 	-------------------------------------------------------- */

// 	historyNote := ""

// 	if newDescription != nil &&
// 		*newDescription != oldDescription {

// 		historyNote =
// 			"Ticket description updated."
// 	}

// 	if newDepartment != nil &&
// 		*newDepartment != oldDepartment {

// 		if historyNote != "" {
// 			historyNote += " "
// 		}

// 		historyNote +=
// 			"Department updated."
// 	}

// 	if newQueryType != nil {

// 		if historyNote != "" {
// 			historyNote += " "
// 		}

// 		historyNote +=
// 			"Fault type updated."
// 	}

// 	if req.Note != nil &&
// 		strings.TrimSpace(*req.Note) != "" {

// 		historyNote =
// 			strings.TrimSpace(*req.Note)
// 	}

// 	eventType := "comment"

// 	historyCurrentStatus :=
// 		currentStatus

// 	if statusChanged {

// 		eventType = "status_change"

// 		historyCurrentStatus =
// 			newStatus

// 		if historyNote == "" {

// 			historyNote =
// 				fmt.Sprintf(
// 					"Status changed to %s.",
// 					newStatus,
// 				)
// 		}
// 	}

// 	if historyNote != "" {

// 		if err := insertHistory(
// 			ctx,
// 			tx,
// 			parseInt64Param(
// 				c.Param("id"),
// 			),
// 			eventType,
// 			currentStatus,
// 			historyCurrentStatus,
// 			historyNote,
// 			employeeID,
// 			newDepartmentValue(
// 				newDepartment,
// 				oldDepartment,
// 			),
// 			"",
// 			"",
// 		); err != nil {

// 			response.ServerError(c, err)
// 			return
// 		}
// 	}

// 	if err := tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.OK(
// 		c,
// 		gin.H{
// 			"updated": true,
// 		},
// 	)
// }

// func newDepartmentValue(
// 	value *string,
// 	fallback string,
// ) string {

// 	if value != nil {
// 		return *value
// 	}

// 	return fallback
// }

// /* ============================================================
//    DELETE
// ============================================================ */

// func (h *TicketHandler) Delete(
// 	c *gin.Context,
// ) {

// 	if _, ok := requireEmployee(c); !ok {
// 		return
// 	}

// 	result, err := h.db.Exec(
// 		c.Request.Context(),
// 		`
// 		DELETE FROM public.trouble_tickets
// 		WHERE id = $1
// 		`,
// 		c.Param("id"),
// 	)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	if result.RowsAffected() == 0 {

// 		response.NotFound(
// 			c,
// 			"ticket not found",
// 		)

// 		return
// 	}

// 	response.NoContent(c)
// }

// /* ============================================================
//    CLOSE
// ============================================================ */

// func (h *TicketHandler) Close(
// 	c *gin.Context,
// ) {

// 	employeeID, ok := requireEmployee(c)

// 	if !ok {
// 		return
// 	}

// 	var req struct {
// 		ClosingDescription string `json:"closing_description"`
// 	}

// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(
// 			c,
// 			err.Error(),
// 		)
// 		return
// 	}

// 	req.ClosingDescription =
// 		strings.TrimSpace(
// 			req.ClosingDescription,
// 		)

// 	ctx, cancel := context.WithTimeout(
// 		c.Request.Context(),
// 		20*time.Second,
// 	)
// 	defer cancel()

// 	tx, err := h.db.Begin(ctx)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	defer tx.Rollback(ctx)

// 	var previousStatus string

// 	err = tx.QueryRow(
// 		ctx,
// 		`
// 		SELECT status
// 		FROM public.trouble_tickets
// 		WHERE id = $1
// 		`,
// 		c.Param("id"),
// 	).Scan(
// 		&previousStatus,
// 	)

// 	if err != nil {

// 		if err == pgx.ErrNoRows {

// 			response.NotFound(
// 				c,
// 				"ticket not found",
// 			)

// 			return
// 		}

// 		response.ServerError(c, err)
// 		return
// 	}

// 	result, err := tx.Exec(
// 		ctx,
// 		`
// 		UPDATE public.trouble_tickets
// 		SET
// 			status = 'Closed',
// 			closed_at = NOW(),
// 			closed_by = $1,
// 			closing_description = $2,
// 			updated_at = NOW()
// 		WHERE id = $3
// 		`,
// 		employeeID,
// 		req.ClosingDescription,
// 		c.Param("id"),
// 	)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	if result.RowsAffected() == 0 {

// 		response.NotFound(
// 			c,
// 			"ticket not found",
// 		)

// 		return
// 	}

// 	note := "Ticket closed."

// 	if req.ClosingDescription != "" {
// 		note = req.ClosingDescription
// 	}

// 	if err := insertHistory(
// 		ctx,
// 		tx,
// 		parseInt64Param(
// 			c.Param("id"),
// 		),
// 		"closed",
// 		previousStatus,
// 		"Closed",
// 		note,
// 		employeeID,
// 		"",
// 		"",
// 		"",
// 	); err != nil {

// 		response.ServerError(c, err)
// 		return
// 	}

// 	if err := tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.OK(
// 		c,
// 		gin.H{
// 			"closed": true,
// 		},
// 	)
// }

// /* ============================================================
//    UPDATE STATUS
// ============================================================ */

// func (h *TicketHandler) UpdateStatus(
// 	c *gin.Context,
// ) {

// 	employeeID, ok := requireEmployee(c)

// 	if !ok {
// 		return
// 	}

// 	var req struct {
// 		Status any `json:"status"`
// 	}

// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(
// 			c,
// 			err.Error(),
// 		)
// 		return
// 	}

// 	status, valid := parseStatusValue(
// 		req.Status,
// 	)

// 	if !valid {

// 		response.BadRequest(
// 			c,
// 			"status must be 1, 2, 3, 4 or a valid status name",
// 		)

// 		return
// 	}

// 	ctx, cancel := context.WithTimeout(
// 		c.Request.Context(),
// 		20*time.Second,
// 	)
// 	defer cancel()

// 	tx, err := h.db.Begin(ctx)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	defer tx.Rollback(ctx)

// 	var previousStatus string

// 	err = tx.QueryRow(
// 		ctx,
// 		`
// 		SELECT status
// 		FROM public.trouble_tickets
// 		WHERE id = $1
// 		`,
// 		c.Param("id"),
// 	).Scan(
// 		&previousStatus,
// 	)

// 	if err != nil {

// 		if err == pgx.ErrNoRows {

// 			response.NotFound(
// 				c,
// 				"ticket not found",
// 			)

// 			return
// 		}

// 		response.ServerError(c, err)
// 		return
// 	}

// 	var result pgconn.CommandTag

// 	if status == "Closed" {

// 		result, err = tx.Exec(
// 			ctx,
// 			`
// 			UPDATE public.trouble_tickets
// 			SET
// 				status = $1,
// 				closed_at = COALESCE(
// 					closed_at,
// 					NOW()
// 				),
// 				closed_by = $2,
// 				updated_at = NOW()
// 			WHERE id = $3
// 			`,
// 			status,
// 			employeeID,
// 			c.Param("id"),
// 		)

// 	} else {

// 		result, err = tx.Exec(
// 			ctx,
// 			`
// 			UPDATE public.trouble_tickets
// 			SET
// 				status = $1,
// 				updated_at = NOW()
// 			WHERE id = $2
// 			`,
// 			status,
// 			c.Param("id"),
// 		)
// 	}

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	if result.RowsAffected() == 0 {

// 		response.NotFound(
// 			c,
// 			"ticket not found",
// 		)

// 		return
// 	}

// 	/* --------------------------------------------------------
// 	   HISTORY ONLY IF STATUS ACTUALLY CHANGED
// 	-------------------------------------------------------- */

// 	if previousStatus != status {

// 		eventType := "status_change"

// 		if status == "Closed" {
// 			eventType = "closed"
// 		}

// 		if err := insertHistory(
// 			ctx,
// 			tx,
// 			parseInt64Param(
// 				c.Param("id"),
// 			),
// 			eventType,
// 			previousStatus,
// 			status,
// 			fmt.Sprintf(
// 				"Status changed to %s.",
// 				status,
// 			),
// 			employeeID,
// 			"",
// 			"",
// 			"",
// 		); err != nil {

// 			response.ServerError(c, err)
// 			return
// 		}
// 	}

// 	if err := tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.OK(
// 		c,
// 		gin.H{
// 			"updated": true,
// 			"status":  status,
// 		},
// 	)
// }

// /* ============================================================
//    HISTORY
// ============================================================ */

// func (h *TicketHandler) GetUpdates(
// 	c *gin.Context,
// ) {

// 	ticketID := parseInt64Param(
// 		c.Param("id"),
// 	)

// 	rows, err := h.db.Query(
// 		c.Request.Context(),
// 		`
// 		SELECT
// 			h.id,
// 			h.ticket_id,
// 			h.current_status,
// 			h.note,
// 			h.changed_by,
// 			h.department,
// 			h.attachment_url,
// 			h.created_at::text
// 		FROM public.trouble_ticket_history AS h
// 		WHERE h.ticket_id = $1
// 		ORDER BY
// 			h.created_at ASC,
// 			h.id ASC
// 		`,
// 		ticketID,
// 	)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	defer rows.Close()

// 	items := make(
// 		[]map[string]any,
// 		0,
// 	)

// 	for rows.Next() {

// 		var (
// 			id            int64
// 			ticketIDValue int64
// 			status        *string
// 			note          *string
// 			changedBy     *string
// 			department    *string
// 			attachmentURL *string
// 			createdAt     string
// 		)

// 		if err := rows.Scan(
// 			&id,
// 			&ticketIDValue,
// 			&status,
// 			&note,
// 			&changedBy,
// 			&department,
// 			&attachmentURL,
// 			&createdAt,
// 		); err != nil {

// 			response.ServerError(c, err)
// 			return
// 		}

// 		items = append(
// 			items,
// 			map[string]any{
// 				"id":             id,
// 				"ticket_id":      ticketIDValue,
// 				"status":         status,
// 				"note":           note,
// 				"updated_by":     changedBy,
// 				"department":     department,
// 				"attachment_url": attachmentURL,
// 				"created_at":     createdAt,
// 			},
// 		)
// 	}

// 	if err := rows.Err(); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.OK(
// 		c,
// 		items,
// 	)
// }

// /* ============================================================
//    ADD HISTORY UPDATE
// ============================================================ */

// func (h *TicketHandler) AddUpdate(
// 	c *gin.Context,
// ) {

// 	employeeID, ok := requireEmployee(c)

// 	if !ok {
// 		return
// 	}

// 	var req struct {
// 		Note          string  `json:"note"`
// 		LegacyNote    string  `json:"tt_note"`
// 		Department    *string `json:"department"`
// 		AttachmentURL *string `json:"attachment_url"`
// 	}

// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(
// 			c,
// 			err.Error(),
// 		)
// 		return
// 	}

// 	note := strings.TrimSpace(
// 		req.Note,
// 	)

// 	if note == "" {

// 		note = strings.TrimSpace(
// 			req.LegacyNote,
// 		)
// 	}

// 	if note == "" {

// 		response.BadRequest(
// 			c,
// 			"note is required",
// 		)

// 		return
// 	}

// 	ctx, cancel := context.WithTimeout(
// 		c.Request.Context(),
// 		20*time.Second,
// 	)
// 	defer cancel()

// 	tx, err := h.db.Begin(ctx)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	defer tx.Rollback(ctx)

// 	ticketID := parseInt64Param(
// 		c.Param("id"),
// 	)

// 	var currentStatus string

// 	err = tx.QueryRow(
// 		ctx,
// 		`
// 		SELECT status
// 		FROM public.trouble_tickets
// 		WHERE id = $1
// 		`,
// 		ticketID,
// 	).Scan(
// 		&currentStatus,
// 	)

// 	if err != nil {

// 		if err == pgx.ErrNoRows {

// 			response.NotFound(
// 				c,
// 				"ticket not found",
// 			)

// 			return
// 		}

// 		response.ServerError(c, err)
// 		return
// 	}

// 	var updateID int64

// 	err = tx.QueryRow(
// 		ctx,
// 		`
// 		INSERT INTO public.trouble_ticket_history (
// 			ticket_id,
// 			event_type,
// 			previous_status,
// 			current_status,
// 			note,
// 			department,
// 			attachment_url,
// 			changed_by,
// 			created_at
// 		)
// 		VALUES (
// 			$1,
// 			'comment',
// 			$2,
// 			$2,
// 			$3,
// 			$4,
// 			$5,
// 			$6,
// 			NOW()
// 		)
// 		RETURNING id
// 		`,
// 		ticketID,
// 		currentStatus,
// 		note,
// 		req.Department,
// 		req.AttachmentURL,
// 		employeeID,
// 	).Scan(
// 		&updateID,
// 	)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	/*
// 		If work starts on an Open ticket,
// 		move it to In Progress.
// 	*/
// 	if currentStatus == "Not Started" ||
// 		currentStatus == "Open" {

// 		_, err = tx.Exec(
// 			ctx,
// 			`
// 			UPDATE public.trouble_tickets
// 			SET
// 				status = 'In Progress',
// 				updated_at = NOW()
// 			WHERE id = $1
// 			`,
// 			ticketID,
// 		)

// 		if err != nil {
// 			response.ServerError(c, err)
// 			return
// 		}
// 	}

// 	if err := tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	c.JSON(
// 		http.StatusCreated,
// 		gin.H{
// 			"success": true,
// 			"data": gin.H{
// 				"id": updateID,
// 			},
// 		},
// 	)
// }

// /* ============================================================
//    HISTORY INSERT HELPER
// ============================================================ */

// func insertHistory(
// 	ctx context.Context,
// 	tx pgx.Tx,
// 	ticketID int64,
// 	eventType string,
// 	previousStatus string,
// 	currentStatus string,
// 	note string,
// 	changedBy string,
// 	department string,
// 	assignedTo string,
// 	attachmentURL string,
// ) error {

// 	var previous any

// 	if strings.TrimSpace(
// 		previousStatus,
// 	) != "" {

// 		previous =
// 			previousStatus
// 	}

// 	var current any

// 	if strings.TrimSpace(
// 		currentStatus,
// 	) != "" {

// 		current =
// 			currentStatus
// 	}

// 	_, err := tx.Exec(
// 		ctx,
// 		`
// 		INSERT INTO public.trouble_ticket_history (
// 			ticket_id,
// 			event_type,
// 			previous_status,
// 			current_status,
// 			note,
// 			assigned_to,
// 			department,
// 			attachment_url,
// 			changed_by,
// 			created_at
// 		)
// 		VALUES (
// 			$1,
// 			$2,
// 			$3,
// 			$4,
// 			$5,
// 			NULLIF($6, ''),
// 			NULLIF($7, ''),
// 			NULLIF($8, ''),
// 			NULLIF($9, ''),
// 			NOW()
// 		)
// 		`,
// 		ticketID,
// 		eventType,
// 		previous,
// 		current,
// 		strings.TrimSpace(note),
// 		strings.TrimSpace(assignedTo),
// 		strings.TrimSpace(department),
// 		strings.TrimSpace(attachmentURL),
// 		strings.TrimSpace(changedBy),
// 	)

// 	return err
// }

// /* ============================================================
//    ID PARAMETER
// ============================================================ */

// func parseInt64Param(
// 	value string,
// ) int64 {

// 	id, err := strconv.ParseInt(
// 		strings.TrimSpace(value),
// 		10,
// 		64,
// 	)

// 	if err != nil {
// 		return 0
// 	}

// 	return id
// }



// backend/internal/handler/ticket.go

package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"itm-api/internal/middleware"
	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	maxBulkTickets       = 10
	defaultCompanyName   = "Fiber@Home Global Ltd"
	ttNumberAdvisoryLock = int64(29585)
)

type TicketHandler struct {
	db *pgxpool.Pool
}

func NewTicketHandler(db *pgxpool.Pool) *TicketHandler {
	return &TicketHandler{
		db: db,
	}
}

/* ============================================================
   ROUTES
============================================================ */

func (h *TicketHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/tickets")

	// Static routes must be registered before /:id.
	g.GET("/requester-context", h.RequesterContext)
	g.GET("/requesters", h.SearchRequesters)
	g.GET("/fault-types", h.FaultTypes)

	g.GET("", h.List)

	g.POST("", h.Create)
	g.POST("/bulk", h.CreateBulk)

	g.GET("/:id", h.Get)

	g.PUT("/:id", h.Update)

	g.DELETE("/:id", h.Delete)

	g.PATCH("/:id/close", h.Close)
	g.PATCH("/:id/status", h.UpdateStatus)

	g.GET("/:id/updates", h.GetUpdates)
	g.POST("/:id/updates", h.AddUpdate)
}

/* ============================================================
   INPUT TYPES
============================================================ */

type ticketInput struct {
	ReasonOfProblem     string `json:"reason_of_problem"`
	FaultType           int    `json:"fault_type"`
	RequesterEmployeeID string `json:"requester_employee_id,omitempty"`
}

type employeeSnapshot struct {
	ID            string
	Name          string
	Designation   string
	Department    string
	WorkField     string
	Function      string
	Phone         string
	Email         string
	PersonalCell  string
	OfficialCell  string
	PersonalEmail string
	OfficialEmail string
	Active        string
	Found         bool
}

type ticketRequesterEmployee struct {
	EmployeeID    string `json:"employee_id"`
	EmployeeName  string `json:"employee_name"`
	Designation   string `json:"designation"`
	Department    string `json:"department"`
	WorkField     string `json:"work_field"`
	SubFunction   string `json:"sub_function"`
	Active        string `json:"active"`
	PersonalCell  string `json:"personal_cell"`
	OfficialCell  string `json:"official_cell"`
	Email         string `json:"email"`
	OfficialEmail string `json:"official_email"`
}

/* ============================================================
   EMPLOYEE
============================================================ */

func (h *TicketHandler) loadEmployeeSnapshot(
	ctx context.Context,
	employeeID string,
) (employeeSnapshot, error) {

	var employee employeeSnapshot

	employee.ID = employeeID

	err := h.db.QueryRow(
		ctx,
		`
		SELECT
			COALESCE(o.employee_name, ''),
			COALESCE(o.designation, ''),
			COALESCE(o.department_name, ''),
			COALESCE(o.work_field, ''),
			COALESCE(o.sub_function, ''),
			COALESCE(p.personal_cell_no, ''),
			COALESCE(p.official_cell_no, ''),
			COALESCE(p.email, ''),
			COALESCE(p.official_email, ''),
			COALESCE(o.active, '')
		FROM public.employee_office_info AS o
		LEFT JOIN public.employee_personal_info AS p
			ON p.employee_id = o.employee_id
		WHERE BTRIM(o.employee_id) = BTRIM($1)
		LIMIT 1
		`,
		employeeID,
	).Scan(
		&employee.Name,
		&employee.Designation,
		&employee.Department,
		&employee.WorkField,
		&employee.Function,
		&employee.PersonalCell,
		&employee.OfficialCell,
		&employee.PersonalEmail,
		&employee.OfficialEmail,
		&employee.Active,
	)

	if err != nil {

		if err == pgx.ErrNoRows {
			/*
				Authentication is already valid.

				Keep employee ID and allow ticket creation
				even when optional employee master data
				is temporarily unavailable.
			*/
			return employee, nil
		}

		return employee, err
	}

	employee.Found = true
	employee.Phone = strings.TrimSpace(employee.OfficialCell)
	if employee.Phone == "" {
		employee.Phone = strings.TrimSpace(employee.PersonalCell)
	}

	employee.Email = strings.TrimSpace(employee.OfficialEmail)
	if employee.Email == "" {
		employee.Email = strings.TrimSpace(employee.PersonalEmail)
	}

	return employee, nil
}

func requesterEmployeeFromSnapshot(employee employeeSnapshot) ticketRequesterEmployee {
	return ticketRequesterEmployee{
		EmployeeID:    employee.ID,
		EmployeeName:  employee.Name,
		Designation:   employee.Designation,
		Department:    employee.Department,
		WorkField:     employee.WorkField,
		SubFunction:   employee.Function,
		Active:        employee.Active,
		PersonalCell:  employee.PersonalCell,
		OfficialCell:  employee.OfficialCell,
		Email:         employee.PersonalEmail,
		OfficialEmail: employee.OfficialEmail,
	}
}

func (h *TicketHandler) canRaiseTicketForOthers(
	ctx context.Context,
	c *gin.Context,
) (bool, error) {
	userID, ok := middleware.GetCurrentUserID(c)
	if !ok {
		return false, nil
	}

	/*
		Do not trust a client flag or only a JWT role value for
		impersonation-style actions. Re-check the currently active
		account + role assignment in the database on every request.
	*/
	var allowed bool
	err := h.db.QueryRow(
		ctx,
		`
		SELECT EXISTS (
			SELECT 1
			FROM public.users AS u
			JOIN public.auth_user_roles AS ur
				ON ur.user_id = u.id
				AND ur.active = TRUE
				AND (
					ur.expires_at IS NULL
					OR ur.expires_at > CURRENT_TIMESTAMP
				)
			JOIN public.auth_roles AS r
				ON r.id = ur.role_id
				AND r.active = TRUE
				AND r.legacy_user_type = u.user_type
			WHERE u.id = $1
			  AND u.deleted_at IS NULL
			  AND u.active = TRUE
			  AND u.account_status = 'active'
			  AND r.code IN ('ROOT', 'IT_ADMIN', 'IT_PERSONNEL')
		)
		`,
		userID,
	).Scan(&allowed)
	if err != nil {
		return false, err
	}

	return allowed, nil
}

func ticketRequestedBy(c *gin.Context, actor employeeSnapshot) string {
	if strings.TrimSpace(actor.Name) != "" {
		return strings.TrimSpace(actor.Name)
	}

	if username := strings.TrimSpace(c.GetString("username")); username != "" {
		return username
	}

	return strings.TrimSpace(actor.ID)
}

func (h *TicketHandler) resolveTicketTarget(
	ctx context.Context,
	actor employeeSnapshot,
	requesterEmployeeID string,
	canRaiseForOthers bool,
) (employeeSnapshot, int, error) {
	requesterEmployeeID = strings.TrimSpace(requesterEmployeeID)

	if requesterEmployeeID == "" ||
		strings.EqualFold(requesterEmployeeID, actor.ID) {
		return actor, http.StatusOK, nil
	}

	if !canRaiseForOthers {
		return employeeSnapshot{}, http.StatusForbidden, fmt.Errorf(
			"you are not allowed to raise a trouble ticket on behalf of another employee",
		)
	}

	target, err := h.loadEmployeeSnapshot(ctx, requesterEmployeeID)
	if err != nil {
		return employeeSnapshot{}, http.StatusInternalServerError, err
	}

	if !target.Found {
		return employeeSnapshot{}, http.StatusBadRequest, fmt.Errorf(
			"selected requester employee was not found",
		)
	}

	if !strings.EqualFold(strings.TrimSpace(target.Active), "Active") &&
		!strings.EqualFold(strings.TrimSpace(target.Active), "Yes") {
		return employeeSnapshot{}, http.StatusBadRequest, fmt.Errorf(
			"selected requester employee is not active",
		)
	}

	return target, http.StatusOK, nil
}

/* ============================================================
   REQUESTER CONTEXT / SEARCH
============================================================ */

func (h *TicketHandler) RequesterContext(c *gin.Context) {
	employeeID, ok := requireEmployee(c)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	employee, err := h.loadEmployeeSnapshot(ctx, employeeID)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	userType, _ := middleware.GetCurrentUserType(c)

	canRaiseForOthers, err := h.canRaiseTicketForOthers(ctx, c)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, gin.H{
		"employee":             requesterEmployeeFromSnapshot(employee),
		"user_type":            userType,
		"role_code":            strings.TrimSpace(c.GetString("role_code")),
		"can_raise_for_others": canRaiseForOthers,
	})
}

func (h *TicketHandler) SearchRequesters(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	canRaiseForOthers, err := h.canRaiseTicketForOthers(ctx, c)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if !canRaiseForOthers {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "permission denied",
		})
		return
	}

	searchText := strings.TrimSpace(c.Query("q"))
	if len([]rune(searchText)) < 2 {
		response.OK(c, []ticketRequesterEmployee{})
		return
	}

	likeValue := "%" + searchText + "%"

	rows, err := h.db.Query(ctx, `
		SELECT
			BTRIM(COALESCE(o.employee_id, '')),
			BTRIM(COALESCE(o.employee_name, '')),
			BTRIM(COALESCE(o.designation, '')),
			BTRIM(COALESCE(o.department_name, '')),
			BTRIM(COALESCE(o.work_field, '')),
			BTRIM(COALESCE(o.sub_function, '')),
			BTRIM(COALESCE(o.active, '')),
			BTRIM(COALESCE(p.personal_cell_no, '')),
			BTRIM(COALESCE(p.official_cell_no, '')),
			BTRIM(COALESCE(p.email, '')),
			BTRIM(COALESCE(p.official_email, ''))
		FROM public.employee_office_info o
		LEFT JOIN public.employee_personal_info p
			ON BTRIM(COALESCE(p.employee_id, '')) =
			   BTRIM(COALESCE(o.employee_id, ''))
		WHERE (
			BTRIM(COALESCE(o.employee_id, '')) ILIKE $1
			OR BTRIM(COALESCE(o.employee_name, '')) ILIKE $1
		)
		AND LOWER(BTRIM(COALESCE(o.active, ''))) IN ('active', 'yes')
		ORDER BY o.employee_name, o.employee_id
		LIMIT 30
	`, likeValue)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]ticketRequesterEmployee, 0)
	for rows.Next() {
		var item ticketRequesterEmployee
		if err := rows.Scan(
			&item.EmployeeID,
			&item.EmployeeName,
			&item.Designation,
			&item.Department,
			&item.WorkField,
			&item.SubFunction,
			&item.Active,
			&item.PersonalCell,
			&item.OfficialCell,
			&item.Email,
			&item.OfficialEmail,
		); err != nil {
			response.ServerError(c, err)
			return
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, items)
}

/* ============================================================
   FAULT TYPE
   Source:
   public.tt_faults

   Actual fields:

   id
   fault_name
   fault_register
   fault_desc
   date
   status
   edited_by
   edited_at

   IMPORTANT:
   trouble_tickets does NOT contain fault_type_id.

   We use tt_faults.id only to resolve the selected
   fault and save fault_name into trouble_tickets.query_type.
============================================================ */

type faultSnapshot struct {
	ID   int64
	Name string
}

func (h *TicketHandler) getFault(
	ctx context.Context,
	tx pgx.Tx,
	faultID int,
) (faultSnapshot, error) {

	var fault faultSnapshot

	err := tx.QueryRow(
		ctx,
		`
		SELECT
			id,
			COALESCE(fault_name, '')
		FROM public.tt_faults
		WHERE id = $1
		  AND (
				status IS NULL
				OR status = 1
		  )
		`,
		faultID,
	).Scan(
		&fault.ID,
		&fault.Name,
	)

	return fault, err
}

/* ============================================================
   FAULT TYPES API

   GET /api/v1/tickets/fault-types

   Reads directly from:

   public.tt_faults
============================================================ */

func (h *TicketHandler) FaultTypes(c *gin.Context) {

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		10*time.Second,
	)
	defer cancel()

	type FaultType struct {
		ID            int64  `json:"id"`
		FaultName     string `json:"fault_name"`
		FaultRegister string `json:"fault_register"`
		FaultDesc     string `json:"fault_desc"`
		Status        int    `json:"status"`
	}

	rows, err := h.db.Query(
		ctx,
		`
		SELECT
			id,
			COALESCE(fault_name, ''),
			COALESCE(fault_register, ''),
			COALESCE(fault_desc, ''),
			COALESCE(status, 0)
		FROM public.tt_faults
		WHERE (
			status IS NULL
			OR status = 1
		)
		ORDER BY
			fault_name ASC,
			id ASC
		`,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer rows.Close()

	items := make(
		[]FaultType,
		0,
	)

	for rows.Next() {

		var item FaultType

		if err := rows.Scan(
			&item.ID,
			&item.FaultName,
			&item.FaultRegister,
			&item.FaultDesc,
			&item.Status,
		); err != nil {

			response.ServerError(c, err)
			return
		}

		items = append(
			items,
			item,
		)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		items,
	)
}

/* ============================================================
   TT NUMBER
============================================================ */

func nextTTNumber(
	ctx context.Context,
	tx pgx.Tx,
) (string, error) {

	var next int64

	err := tx.QueryRow(
		ctx,
		`
		SELECT
			COALESCE(
				MAX(
					CASE
						WHEN BTRIM(tt_no) ~ '^[0-9]+$'
						THEN BTRIM(tt_no)::BIGINT
					END
				),
				0
			) + 1
		FROM public.trouble_tickets
		`,
	).Scan(&next)

	if err != nil {
		return "", err
	}

	return strconv.FormatInt(
		next,
		10,
	), nil
}

/* ============================================================
   STATUS HELPERS
============================================================ */

func normalizeStatus(
	value string,
) (string, bool) {

	switch strings.ToLower(
		strings.TrimSpace(value),
	) {

	case "1", "not started", "not_started":
		return "Not Started", true

	case "2", "open":
		return "Open", true

	case "3", "in progress", "in_progress", "running":
		return "In Progress", true

	case "4", "closed":
		return "Closed", true

	default:
		return "", false
	}
}

func parseStatusValue(
	raw any,
) (string, bool) {

	switch value := raw.(type) {

	case string:
		return normalizeStatus(value)

	case float64:
		return normalizeStatus(
			strconv.FormatInt(
				int64(value),
				10,
			),
		)

	case json.Number:
		return normalizeStatus(
			value.String(),
		)

	case int:
		return normalizeStatus(
			strconv.Itoa(value),
		)

	case int64:
		return normalizeStatus(
			strconv.FormatInt(
				value,
				10,
			),
		)

	default:
		return "", false
	}
}

/* ============================================================
   AUTH
============================================================ */

func currentEmployeeID(
	c *gin.Context,
) string {

	return strings.TrimSpace(
		c.GetString("employee_id"),
	)
}

func requireEmployee(
	c *gin.Context,
) (string, bool) {

	employeeID := currentEmployeeID(c)

	if employeeID == "" {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "authenticated employee id not found",
			},
		)

		return "", false
	}

	return employeeID, true
}

/* ============================================================
   LIST
============================================================ */

func (h *TicketHandler) List(
	c *gin.Context,
) {

	page, err := strconv.Atoi(
		c.DefaultQuery("page", "1"),
	)

	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(
		c.DefaultQuery("page_size", "20"),
	)

	if err != nil || pageSize < 1 {
		pageSize = 20
	}

	if pageSize > 100 {
		pageSize = 100
	}

	offset := (page - 1) * pageSize

	args := make([]any, 0)

	where := "WHERE TRUE"

	arg := 1

	/* --------------------------------------------------------
	   STATUS FILTER
	-------------------------------------------------------- */

	if status := strings.TrimSpace(
		c.Query("status"),
	); status != "" && status != "all" {

		normalized, ok := normalizeStatus(status)

		if !ok {
			response.BadRequest(
				c,
				"invalid ticket status",
			)
			return
		}

		args = append(
			args,
			normalized,
		)

		where += fmt.Sprintf(
			" AND t.status = $%d",
			arg,
		)

		arg++
	}

	/* --------------------------------------------------------
	   EMPLOYEE FILTER
	-------------------------------------------------------- */

	if employeeID := strings.TrimSpace(
		c.Query("emp_id"),
	); employeeID != "" {

		args = append(
			args,
			employeeID,
		)

		where += fmt.Sprintf(
			" AND BTRIM(t.employee_id) = BTRIM($%d)",
			arg,
		)

		arg++
	}

	/* --------------------------------------------------------
	   SEARCH
	-------------------------------------------------------- */

	if search := strings.TrimSpace(
		c.Query("search"),
	); search != "" {

		searchValue := "%" + search + "%"

		args = append(
			args,
			searchValue,
		)

		where += fmt.Sprintf(
			`
			AND (
				COALESCE(t.company_name, '') ILIKE $%d
				OR COALESCE(t.employee_name, '') ILIKE $%d
				OR COALESCE(t.tt_no, '') ILIKE $%d
				OR COALESCE(t.employee_id, '') ILIKE $%d
				OR COALESCE(t.query_type, '') ILIKE $%d
				OR COALESCE(t.description, '') ILIKE $%d
			)
			`,
			arg,
			arg,
			arg,
			arg,
			arg,
			arg,
		)

		arg++
	}

	/* --------------------------------------------------------
	   COUNT
	-------------------------------------------------------- */

	var total int

	err = h.db.QueryRow(
		c.Request.Context(),
		`
		SELECT COUNT(*)
		FROM public.trouble_tickets AS t
		`+where,
		args...,
	).Scan(&total)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	args = append(
		args,
		pageSize,
		offset,
	)

	query := fmt.Sprintf(
		`
		SELECT
			t.id,
			t.legacy_id,
			t.tt_no,
			COALESCE(t.employee_id, ''),
			COALESCE(t.employee_name, ''),
			COALESCE(t.designation, ''),
			COALESCE(t.department, ''),
			COALESCE(t.function_name, ''),
			COALESCE(t.company_name, ''),
			COALESCE(t.mobile_no, ''),
			COALESCE(t.email, ''),
			COALESCE(t.query_type, ''),
			COALESCE(t.description, ''),
			COALESCE(t.requested_by, ''),
			COALESCE(t.assigned_id, ''),
			COALESCE(t.assigned_name, ''),
			t.status,
			COALESCE(t.requisition_type, ''),
			COALESCE(t.delivered_status, ''),
			t.created_at::text,
			t.closed_at::text,
			t.closed_by,
			t.closing_description,
			t.source_status,
			t.source_progress,
			t.source_device_requisition,
			t.legacy_data,
			t.inserted_at::text,
			t.updated_at::text
		FROM public.trouble_tickets AS t
		%s
		ORDER BY t.id DESC
		LIMIT $%d
		OFFSET $%d
		`,
		where,
		arg,
		arg+1,
	)

	rows, err := h.db.Query(
		c.Request.Context(),
		query,
		args...,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer rows.Close()

	type Row struct {
		ID                 int64          `json:"id"`
		LegacyID           *int64         `json:"legacy_id"`
		TTNo               string         `json:"tt_no"`
		EmployeeID         string         `json:"employee_id"`
		EmployeeName       string         `json:"employee_name"`
		Designation        string         `json:"designation"`
		Department         string         `json:"department"`
		FunctionName       string         `json:"function_name"`
		CompanyName        string         `json:"company_name"`
		MobileNo           string         `json:"mobile_no"`
		Email              string         `json:"email"`
		QueryType          string         `json:"query_type"`
		Description        string         `json:"description"`
		RequestedBy        string         `json:"requested_by"`
		AssignedID         string         `json:"assigned_id"`
		AssignedName       string         `json:"assigned_name"`
		Status             string         `json:"status"`
		RequisitionType    string         `json:"requisition_type"`
		DeliveredStatus    string         `json:"delivered_status"`
		CreatedAt          string         `json:"created_at"`
		ClosedAt           *string        `json:"closed_at"`
		ClosedBy           *string        `json:"closed_by"`
		ClosingDescription *string        `json:"closing_description"`
		SourceStatus       *int16         `json:"source_status"`
		SourceProgress     *int16         `json:"source_progress"`
		SourceDeviceRequis *int16         `json:"source_device_requisition"`
		LegacyData         map[string]any `json:"legacy_data"`
		InsertedAt         string         `json:"inserted_at"`
		UpdatedAt          string         `json:"updated_at"`
	}

	result := make(
		[]Row,
		0,
	)

	for rows.Next() {

		var row Row

		if err := rows.Scan(
			&row.ID,
			&row.LegacyID,
			&row.TTNo,
			&row.EmployeeID,
			&row.EmployeeName,
			&row.Designation,
			&row.Department,
			&row.FunctionName,
			&row.CompanyName,
			&row.MobileNo,
			&row.Email,
			&row.QueryType,
			&row.Description,
			&row.RequestedBy,
			&row.AssignedID,
			&row.AssignedName,
			&row.Status,
			&row.RequisitionType,
			&row.DeliveredStatus,
			&row.CreatedAt,
			&row.ClosedAt,
			&row.ClosedBy,
			&row.ClosingDescription,
			&row.SourceStatus,
			&row.SourceProgress,
			&row.SourceDeviceRequis,
			&row.LegacyData,
			&row.InsertedAt,
			&row.UpdatedAt,
		); err != nil {

			response.ServerError(c, err)
			return
		}

		result = append(
			result,
			row,
		)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.Paginated(
		c,
		result,
		total,
		page,
		pageSize,
	)
}

/* ============================================================
   GET SINGLE TT
============================================================ */

func (h *TicketHandler) Get(
	c *gin.Context,
) {

	type TicketResponse struct {
		ID                 int64          `json:"id"`
		LegacyID           *int64         `json:"legacy_id"`
		TTNo               string         `json:"tt_no"`
		EmployeeID         string         `json:"employee_id"`
		EmployeeName       string         `json:"employee_name"`
		Designation        string         `json:"designation"`
		Department         string         `json:"department"`
		FunctionName       string         `json:"function_name"`
		CompanyName        string         `json:"company_name"`
		MobileNo           string         `json:"mobile_no"`
		Email              string         `json:"email"`
		QueryType          string         `json:"query_type"`
		Description        string         `json:"description"`
		RequestedBy        string         `json:"requested_by"`
		AssignedID         string         `json:"assigned_id"`
		AssignedName       string         `json:"assigned_name"`
		Status             string         `json:"status"`
		RequisitionType    string         `json:"requisition_type"`
		DeliveredStatus    string         `json:"delivered_status"`
		CreatedAt          string         `json:"created_at"`
		ClosedAt           *string        `json:"closed_at"`
		ClosedBy           *string        `json:"closed_by"`
		ClosingDescription *string        `json:"closing_description"`
		SourceStatus       *int16         `json:"source_status"`
		SourceProgress     *int16         `json:"source_progress"`
		SourceDeviceRequis *int16         `json:"source_device_requisition"`
		LegacyData         map[string]any `json:"legacy_data"`
		InsertedAt         string         `json:"inserted_at"`
		UpdatedAt          string         `json:"updated_at"`
	}

	var ticket TicketResponse

	err := h.db.QueryRow(
		c.Request.Context(),
		`
		SELECT
			id,
			legacy_id,
			tt_no,
			COALESCE(employee_id, ''),
			COALESCE(employee_name, ''),
			COALESCE(designation, ''),
			COALESCE(department, ''),
			COALESCE(function_name, ''),
			COALESCE(company_name, ''),
			COALESCE(mobile_no, ''),
			COALESCE(email, ''),
			COALESCE(query_type, ''),
			COALESCE(description, ''),
			COALESCE(requested_by, ''),
			COALESCE(assigned_id, ''),
			COALESCE(assigned_name, ''),
			status,
			COALESCE(requisition_type, ''),
			COALESCE(delivered_status, ''),
			created_at::text,
			closed_at::text,
			closed_by,
			closing_description,
			source_status,
			source_progress,
			source_device_requisition,
			legacy_data,
			inserted_at::text,
			updated_at::text
		FROM public.trouble_tickets
		WHERE id = $1
		`,
		c.Param("id"),
	).Scan(
		&ticket.ID,
		&ticket.LegacyID,
		&ticket.TTNo,
		&ticket.EmployeeID,
		&ticket.EmployeeName,
		&ticket.Designation,
		&ticket.Department,
		&ticket.FunctionName,
		&ticket.CompanyName,
		&ticket.MobileNo,
		&ticket.Email,
		&ticket.QueryType,
		&ticket.Description,
		&ticket.RequestedBy,
		&ticket.AssignedID,
		&ticket.AssignedName,
		&ticket.Status,
		&ticket.RequisitionType,
		&ticket.DeliveredStatus,
		&ticket.CreatedAt,
		&ticket.ClosedAt,
		&ticket.ClosedBy,
		&ticket.ClosingDescription,
		&ticket.SourceStatus,
		&ticket.SourceProgress,
		&ticket.SourceDeviceRequis,
		&ticket.LegacyData,
		&ticket.InsertedAt,
		&ticket.UpdatedAt,
	)

	if err != nil {

		if err == pgx.ErrNoRows {
			response.NotFound(
				c,
				"ticket not found",
			)
			return
		}

		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		ticket,
	)
}

/* ============================================================
   CREATE SINGLE

   POST /api/v1/tickets

   IMPORTANT:
   Creation does NOT create history.

   Flow:

   frontend fault_type
          ↓
   public.tt_faults
          ↓
   fault_name
          ↓
   trouble_tickets.query_type
============================================================ */

func (h *TicketHandler) Create(
	c *gin.Context,
) {

	employeeID, ok := requireEmployee(c)

	if !ok {
		return
	}

	var req ticketInput

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(
			c,
			err.Error(),
		)
		return
	}

	req.ReasonOfProblem =
		strings.TrimSpace(
			req.ReasonOfProblem,
		)

	if err := validateTicketInput(req); err != nil {
		response.BadRequest(
			c,
			err.Error(),
		)
		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		20*time.Second,
	)
	defer cancel()

	tx, err := h.db.Begin(ctx)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer tx.Rollback(ctx)

	/*
		Prevent concurrent requests from generating
		the same TT number.
	*/
	if _, err := tx.Exec(
		ctx,
		`SELECT pg_advisory_xact_lock($1)`,
		ttNumberAdvisoryLock,
	); err != nil {

		response.ServerError(c, err)
		return
	}

	actor, err := h.loadEmployeeSnapshot(
		ctx,
		employeeID,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	canRaiseForOthers, err := h.canRaiseTicketForOthers(ctx, c)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	employee, requesterStatus, err := h.resolveTicketTarget(
		ctx,
		actor,
		req.RequesterEmployeeID,
		canRaiseForOthers,
	)
	if err != nil {
		if requesterStatus == http.StatusForbidden {
			c.JSON(requesterStatus, gin.H{
				"success": false,
				"error":   err.Error(),
			})
		} else if requesterStatus == http.StatusBadRequest {
			response.BadRequest(c, err.Error())
		} else {
			response.ServerError(c, err)
		}
		return
	}

	/*
		Resolve selected fault from public.tt_faults.
	*/
	fault, err := h.getFault(
		ctx,
		tx,
		req.FaultType,
	)

	if err != nil {

		if err == pgx.ErrNoRows {
			response.BadRequest(
				c,
				"selected fault type is not available",
			)
			return
		}

		response.ServerError(c, err)
		return
	}

	ttNo, err := nextTTNumber(
		ctx,
		tx,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	var id int64

	/*
		IMPORTANT:

		There is NO fault_type_id column in
		trouble_tickets.

		Therefore:

		fault.ID   -> only used to validate selection
		fault.Name -> saved as query_type
	*/

	err = tx.QueryRow(
		ctx,
		`
		INSERT INTO public.trouble_tickets (
			tt_no,
			employee_id,
			employee_name,
			designation,
			department,
			function_name,
			company_name,
			mobile_no,
			email,
			query_type,
			description,
			requested_by,
			status,
			created_at,
			updated_at
		)
		VALUES (
			$1,
			$2,
			$3,
			$4,
			$5,
			$6,
			$7,
			$8,
			$9,
			$10,
			$11,
			$12,
			'Open',
			NOW(),
			NOW()
		)
		RETURNING id
		`,
		ttNo,
		employee.ID,
		employee.Name,
		employee.Designation,
		employee.Department,
		employee.Function,
		defaultCompanyName,
		employee.Phone,
		employee.Email,
		fault.Name,
		req.ReasonOfProblem,
		ticketRequestedBy(c, actor),
	).Scan(&id)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	/*
		NO HISTORY INSERT HERE.

		Creation history is intentionally not generated.
	*/

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	c.JSON(
		http.StatusCreated,
		gin.H{
			"success": true,
			"data": gin.H{
				"id":    id,
				"tt_no": ttNo,
			},
		},
	)
}

/* ============================================================
   CREATE BULK

   POST /api/v1/tickets/bulk

   Maximum:
   10 tickets.

   Entire operation is atomic.

   If ticket #3 fails:
   ticket #1 and #2 are also rolled back.

   NO creation history is inserted.
============================================================ */
//3rd step To create multiple tickets at once, we will use the CreateBulk function. This function will read a JSON array of tickets from the request body, validate each ticket, and then insert them into the database in a single transaction. If any ticket fails validation or insertion, the entire operation will be rolled back.

func (h *TicketHandler) CreateBulk(c *gin.Context) {
	employeeID, ok := requireEmployee(c)
	if !ok {
		return
	}

	/*
		========================================================
		READ MULTIPART FORM
		========================================================

		Frontend sends:

		tickets = {
			"tickets": [
				{
					"reason_of_problem": "...",
					"fault_type": 1
				},
				{
					"reason_of_problem": "...",
					"fault_type": 2
				}
			]
		}

		Files:

		ticket_0_file
		ticket_1_file
		ticket_2_file
		...
	*/

	ticketsJSON := c.PostForm("tickets")

	if strings.TrimSpace(ticketsJSON) == "" {
		response.BadRequest(
			c,
			"tickets field is required",
		)
		return
	}

	var req struct {
		Tickets []ticketInput `json:"tickets"`
	}

	if err := json.Unmarshal(
		[]byte(ticketsJSON),
		&req,
	); err != nil {
		response.BadRequest(
			c,
			"invalid tickets JSON",
		)
		return
	}

	if len(req.Tickets) < 1 {
		response.BadRequest(
			c,
			"at least one ticket is required",
		)
		return
	}

	if len(req.Tickets) > maxBulkTickets {
		response.BadRequest(
			c,
			"maximum 10 trouble tickets can be created at once",
		)
		return
	}

	/*
		========================================================
		VALIDATE TICKETS
		========================================================
	*/

	for i := range req.Tickets {
		req.Tickets[i].ReasonOfProblem =
			strings.TrimSpace(
				req.Tickets[i].ReasonOfProblem,
			)

		if err := validateTicketInput(
			req.Tickets[i],
		); err != nil {
			response.BadRequest(
				c,
				fmt.Sprintf(
					"ticket #%d: %s",
					i+1,
					err.Error(),
				),
			)
			return
		}
	}

	/*
		========================================================
		READ ONE FILE PER TT
		========================================================
	*/

	// type UploadedFile struct {
	// 	Header *multipart.FileHeader
	// }

	files := make(
		[]*multipart.FileHeader,
		len(req.Tickets),
	)

	for i := range req.Tickets {

		fieldName := fmt.Sprintf(
			"ticket_%d_file",
			i,
		)

		header, err := c.FormFile(
			fieldName,
		)

		if err != nil {

			/*
				No file is allowed.

				This is NOT an error.

				Example:

				TT #1 → file
				TT #2 → no file
				TT #3 → file
			*/
			files[i] = nil
			continue
		}

		if header.Size > 5*1024*1024 {
			response.BadRequest(
				c,
				fmt.Sprintf(
					"ticket #%d attachment must be 5 MB or smaller",
					i+1,
				),
			)
			return
		}

		files[i] = header
	}

	/*
		========================================================
		DATABASE TRANSACTION
		========================================================
	*/

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		30*time.Second,
	)
	defer cancel()

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer tx.Rollback(ctx)

	/*
		Prevent duplicate TT numbers.
	*/

	if _, err := tx.Exec(
		ctx,
		`SELECT pg_advisory_xact_lock($1)`,
		ttNumberAdvisoryLock,
	); err != nil {
		response.ServerError(c, err)
		return
	}

	actor, err := h.loadEmployeeSnapshot(
		ctx,
		employeeID,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	canRaiseForOthers, err := h.canRaiseTicketForOthers(ctx, c)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	type CreatedTicket struct {
		ID           int64  `json:"id"`
		TTNo         string `json:"tt_no"`
		AttachedFile string `json:"attached_file,omitempty"`
	}

	created := make(
		[]CreatedTicket,
		0,
		len(req.Tickets),
	)

	/*
		========================================================
		CREATE EACH TT
		========================================================
	*/

	for i := range req.Tickets {

		item := req.Tickets[i]

		employee, requesterStatus, err := h.resolveTicketTarget(
			ctx,
			actor,
			item.RequesterEmployeeID,
			canRaiseForOthers,
		)
		if err != nil {
			message := fmt.Sprintf(
				"ticket #%d: %s",
				i+1,
				err.Error(),
			)

			if requesterStatus == http.StatusForbidden {
				c.JSON(requesterStatus, gin.H{
					"success": false,
					"error":   message,
				})
			} else if requesterStatus == http.StatusBadRequest {
				response.BadRequest(c, message)
			} else {
				response.ServerError(c, err)
			}
			return
		}

		fault, err := h.getFault(
			ctx,
			tx,
			item.FaultType,
		)

		if err != nil {

			if err == pgx.ErrNoRows {
				response.BadRequest(
					c,
					fmt.Sprintf(
						"ticket #%d: selected fault type is not available",
						i+1,
					),
				)
				return
			}

			response.ServerError(c, err)
			return
		}

		ttNo, err := nextTTNumber(
			ctx,
			tx,
		)

		if err != nil {
			response.ServerError(c, err)
			return
		}

		/*
			====================================================
			FILE PATH
			====================================================
		*/

		attachedFile := ""

		if files[i] != nil {

			header := files[i]

			extension := filepath.Ext(
				header.Filename,
			)

			/*
				Generate unique filename.

				Example:

				20260902124530_12345.png
			*/

			filename := fmt.Sprintf(
				"%d_%d%s",
				time.Now().UnixNano(),
				i+1,
				extension,
			)

			relativePath := filepath.ToSlash(
				filepath.Join(
					"uploads",
					"tt",
					filename,
				),
			)

			absolutePath := filepath.Join(
				"uploads",
				"tt",
				filename,
			)

			/*
				IMPORTANT:

				If your backend is running from:

				D:\ITM-Data\itm\backend

				then:

				uploads\tt

				resolves to:

				D:\ITM-Data\itm\backend\uploads\tt
			*/

			if err := os.MkdirAll(
				filepath.Dir(absolutePath),
				0755,
			); err != nil {
				response.ServerError(c, err)
				return
			}

			if err := c.SaveUploadedFile(
				header,
				absolutePath,
			); err != nil {
				response.ServerError(c, err)
				return
			}

			attachedFile = relativePath
		}

		/*
			====================================================
			INSERT TT
			====================================================
		*/

		var id int64

		err = tx.QueryRow(
			ctx,
			`
			INSERT INTO public.trouble_tickets (
				tt_no,
				employee_id,
				employee_name,
				designation,
				department,
				function_name,
				company_name,
				mobile_no,
				email,
				query_type,
				description,
				requested_by,
				status,
				attached_file,
				created_at,
				updated_at
			)
			VALUES (
				$1,
				$2,
				$3,
				$4,
				$5,
				$6,
				$7,
				$8,
				$9,
				$10,
				$11,
				$12,
				'Open',
				NULLIF($13, ''),
				NOW(),
				NOW()
			)
			RETURNING id
			`,
			ttNo,
			employee.ID,
			employee.Name,
			employee.Designation,
			employee.Department,
			employee.Function,
			defaultCompanyName,
			employee.Phone,
			employee.Email,
			fault.Name,
			item.ReasonOfProblem,
			ticketRequestedBy(c, actor),
			attachedFile,
		).Scan(&id)

		if err != nil {
			response.ServerError(c, err)
			return
		}

		created = append(
			created,
			CreatedTicket{
				ID:           id,
				TTNo:         ttNo,
				AttachedFile: attachedFile,
			},
		)
	}

	/*
		========================================================
		COMMIT
		========================================================
	*/

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	c.JSON(
		http.StatusCreated,
		gin.H{
			"success": true,
			"data": gin.H{
				"created": created,
				"count":   len(created),
			},
		},
	)
}

/* ============================================================
   VALIDATION
============================================================ */

func validateTicketInput(
	req ticketInput,
) error {

	if strings.TrimSpace(
		req.ReasonOfProblem,
	) == "" {

		return fmt.Errorf(
			"reason_of_problem is required",
		)
	}

	if len([]rune(
		req.ReasonOfProblem,
	)) < 5 {

		return fmt.Errorf(
			"reason_of_problem must contain at least 5 characters",
		)
	}

	if len([]rune(
		req.ReasonOfProblem,
	)) > 5000 {

		return fmt.Errorf(
			"reason_of_problem cannot exceed 5000 characters",
		)
	}

	if req.FaultType <= 0 {

		return fmt.Errorf(
			"fault_type is required",
		)
	}

	return nil
}

/* ============================================================
   UPDATE
============================================================ */

func (h *TicketHandler) Update(
	c *gin.Context,
) {

	employeeID, ok := requireEmployee(c)

	if !ok {
		return
	}

	var req struct {
		ReasonOfProblem *string `json:"reason_of_problem"`
		FaultType       *int    `json:"fault_type"`
		Department      *string `json:"department"`
		Status          any     `json:"status"`
		Note            *string `json:"note"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(
			c,
			err.Error(),
		)
		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		20*time.Second,
	)
	defer cancel()

	tx, err := h.db.Begin(ctx)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer tx.Rollback(ctx)

	var (
		currentStatus  string
		oldDescription string
		oldDepartment  string
	)

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			status,
			COALESCE(description, ''),
			COALESCE(department, '')
		FROM public.trouble_tickets
		WHERE id = $1
		`,
		c.Param("id"),
	).Scan(
		&currentStatus,
		&oldDescription,
		&oldDepartment,
	)

	if err != nil {

		if err == pgx.ErrNoRows {
			response.NotFound(
				c,
				"ticket not found",
			)
			return
		}

		response.ServerError(c, err)
		return
	}

	setParts := make(
		[]string,
		0,
	)

	args := make(
		[]any,
		0,
	)

	arg := 1

	var (
		newDescription *string
		newDepartment  *string
		newQueryType   *string
		newStatus      string
		statusChanged  bool
	)

	/* --------------------------------------------------------
	   DESCRIPTION
	-------------------------------------------------------- */

	if req.ReasonOfProblem != nil {

		value := strings.TrimSpace(
			*req.ReasonOfProblem,
		)

		if value == "" {

			response.BadRequest(
				c,
				"reason_of_problem cannot be empty",
			)
			return
		}

		if len([]rune(value)) > 5000 {

			response.BadRequest(
				c,
				"reason_of_problem cannot exceed 5000 characters",
			)
			return
		}

		newDescription = &value

		setParts = append(
			setParts,
			fmt.Sprintf(
				"description = $%d",
				arg,
			),
		)

		args = append(
			args,
			value,
		)

		arg++
	}

	/* --------------------------------------------------------
	   DEPARTMENT
	-------------------------------------------------------- */

	if req.Department != nil {

		value := strings.TrimSpace(
			*req.Department,
		)

		newDepartment = &value

		setParts = append(
			setParts,
			fmt.Sprintf(
				"department = $%d",
				arg,
			),
		)

		args = append(
			args,
			value,
		)

		arg++
	}

	/* --------------------------------------------------------
	   FAULT TYPE

	   Resolve through public.tt_faults.

	   Save fault_name into query_type.
	-------------------------------------------------------- */

	if req.FaultType != nil {

		fault, faultErr := h.getFault(
			ctx,
			tx,
			*req.FaultType,
		)

		if faultErr != nil {

			if faultErr == pgx.ErrNoRows {

				response.BadRequest(
					c,
					"selected fault type is not available",
				)

				return
			}

			response.ServerError(
				c,
				faultErr,
			)

			return
		}

		setParts = append(
			setParts,
			fmt.Sprintf(
				"query_type = $%d",
				arg,
			),
		)

		args = append(
			args,
			fault.Name,
		)

		newQueryType = &fault.Name

		arg++
	}

	/* --------------------------------------------------------
	   STATUS
	-------------------------------------------------------- */

	if req.Status != nil {

		status, valid := parseStatusValue(
			req.Status,
		)

		if !valid {

			response.BadRequest(
				c,
				"invalid ticket status",
			)

			return
		}

		newStatus = status

		if status != currentStatus {

			statusChanged = true

			setParts = append(
				setParts,
				fmt.Sprintf(
					"status = $%d",
					arg,
				),
			)

			args = append(
				args,
				status,
			)

			arg++
		}
	}

	if len(setParts) == 0 {

		response.BadRequest(
			c,
			"no ticket fields were supplied for update",
		)

		return
	}

	setParts = append(
		setParts,
		"updated_at = NOW()",
	)

	args = append(
		args,
		c.Param("id"),
	)

	query := `
		UPDATE public.trouble_tickets
		SET ` +
		strings.Join(
			setParts,
			", ",
		) +
		fmt.Sprintf(
			`
			WHERE id = $%d
			`,
			arg,
		)

	result, err := tx.Exec(
		ctx,
		query,
		args...,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	if result.RowsAffected() == 0 {

		response.NotFound(
			c,
			"ticket not found",
		)

		return
	}

	/* --------------------------------------------------------
	   HISTORY

	   History is generated ONLY during update.
	-------------------------------------------------------- */

	historyNote := ""

	if newDescription != nil &&
		*newDescription != oldDescription {

		historyNote =
			"Ticket description updated."
	}

	if newDepartment != nil &&
		*newDepartment != oldDepartment {

		if historyNote != "" {
			historyNote += " "
		}

		historyNote +=
			"Department updated."
	}

	if newQueryType != nil {

		if historyNote != "" {
			historyNote += " "
		}

		historyNote +=
			"Fault type updated."
	}

	if req.Note != nil &&
		strings.TrimSpace(*req.Note) != "" {

		historyNote =
			strings.TrimSpace(*req.Note)
	}

	eventType := "comment"

	historyCurrentStatus :=
		currentStatus

	if statusChanged {

		eventType = "status_change"

		historyCurrentStatus =
			newStatus

		if historyNote == "" {

			historyNote =
				fmt.Sprintf(
					"Status changed to %s.",
					newStatus,
				)
		}
	}

	if historyNote != "" {

		if err := insertHistory(
			ctx,
			tx,
			parseInt64Param(
				c.Param("id"),
			),
			eventType,
			currentStatus,
			historyCurrentStatus,
			historyNote,
			employeeID,
			newDepartmentValue(
				newDepartment,
				oldDepartment,
			),
			"",
			"",
		); err != nil {

			response.ServerError(c, err)
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		gin.H{
			"updated": true,
		},
	)
}

func newDepartmentValue(
	value *string,
	fallback string,
) string {

	if value != nil {
		return *value
	}

	return fallback
}

/* ============================================================
   DELETE
============================================================ */

func (h *TicketHandler) Delete(
	c *gin.Context,
) {

	if _, ok := requireEmployee(c); !ok {
		return
	}

	result, err := h.db.Exec(
		c.Request.Context(),
		`
		DELETE FROM public.trouble_tickets
		WHERE id = $1
		`,
		c.Param("id"),
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	if result.RowsAffected() == 0 {

		response.NotFound(
			c,
			"ticket not found",
		)

		return
	}

	response.NoContent(c)
}

/* ============================================================
   CLOSE
============================================================ */

func (h *TicketHandler) Close(
	c *gin.Context,
) {

	employeeID, ok := requireEmployee(c)

	if !ok {
		return
	}

	var req struct {
		ClosingDescription string `json:"closing_description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(
			c,
			err.Error(),
		)
		return
	}

	req.ClosingDescription =
		strings.TrimSpace(
			req.ClosingDescription,
		)

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		20*time.Second,
	)
	defer cancel()

	tx, err := h.db.Begin(ctx)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer tx.Rollback(ctx)

	var previousStatus string

	err = tx.QueryRow(
		ctx,
		`
		SELECT status
		FROM public.trouble_tickets
		WHERE id = $1
		`,
		c.Param("id"),
	).Scan(
		&previousStatus,
	)

	if err != nil {

		if err == pgx.ErrNoRows {

			response.NotFound(
				c,
				"ticket not found",
			)

			return
		}

		response.ServerError(c, err)
		return
	}

	result, err := tx.Exec(
		ctx,
		`
		UPDATE public.trouble_tickets
		SET
			status = 'Closed',
			closed_at = NOW(),
			closed_by = $1,
			closing_description = $2,
			updated_at = NOW()
		WHERE id = $3
		`,
		employeeID,
		req.ClosingDescription,
		c.Param("id"),
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	if result.RowsAffected() == 0 {

		response.NotFound(
			c,
			"ticket not found",
		)

		return
	}

	note := "Ticket closed."

	if req.ClosingDescription != "" {
		note = req.ClosingDescription
	}

	if err := insertHistory(
		ctx,
		tx,
		parseInt64Param(
			c.Param("id"),
		),
		"closed",
		previousStatus,
		"Closed",
		note,
		employeeID,
		"",
		"",
		"",
	); err != nil {

		response.ServerError(c, err)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		gin.H{
			"closed": true,
		},
	)
}

/* ============================================================
   UPDATE STATUS
============================================================ */

func (h *TicketHandler) UpdateStatus(
	c *gin.Context,
) {

	employeeID, ok := requireEmployee(c)

	if !ok {
		return
	}

	var req struct {
		Status any `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(
			c,
			err.Error(),
		)
		return
	}

	status, valid := parseStatusValue(
		req.Status,
	)

	if !valid {

		response.BadRequest(
			c,
			"status must be 1, 2, 3, 4 or a valid status name",
		)

		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		20*time.Second,
	)
	defer cancel()

	tx, err := h.db.Begin(ctx)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer tx.Rollback(ctx)

	var previousStatus string

	err = tx.QueryRow(
		ctx,
		`
		SELECT status
		FROM public.trouble_tickets
		WHERE id = $1
		`,
		c.Param("id"),
	).Scan(
		&previousStatus,
	)

	if err != nil {

		if err == pgx.ErrNoRows {

			response.NotFound(
				c,
				"ticket not found",
			)

			return
		}

		response.ServerError(c, err)
		return
	}

	var result pgconn.CommandTag

	if status == "Closed" {

		result, err = tx.Exec(
			ctx,
			`
			UPDATE public.trouble_tickets
			SET
				status = $1,
				closed_at = COALESCE(
					closed_at,
					NOW()
				),
				closed_by = $2,
				updated_at = NOW()
			WHERE id = $3
			`,
			status,
			employeeID,
			c.Param("id"),
		)

	} else {

		result, err = tx.Exec(
			ctx,
			`
			UPDATE public.trouble_tickets
			SET
				status = $1,
				updated_at = NOW()
			WHERE id = $2
			`,
			status,
			c.Param("id"),
		)
	}

	if err != nil {
		response.ServerError(c, err)
		return
	}

	if result.RowsAffected() == 0 {

		response.NotFound(
			c,
			"ticket not found",
		)

		return
	}

	/* --------------------------------------------------------
	   HISTORY ONLY IF STATUS ACTUALLY CHANGED
	-------------------------------------------------------- */

	if previousStatus != status {

		eventType := "status_change"

		if status == "Closed" {
			eventType = "closed"
		}

		if err := insertHistory(
			ctx,
			tx,
			parseInt64Param(
				c.Param("id"),
			),
			eventType,
			previousStatus,
			status,
			fmt.Sprintf(
				"Status changed to %s.",
				status,
			),
			employeeID,
			"",
			"",
			"",
		); err != nil {

			response.ServerError(c, err)
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		gin.H{
			"updated": true,
			"status":  status,
		},
	)
}

/* ============================================================
   HISTORY
============================================================ */

func (h *TicketHandler) GetUpdates(
	c *gin.Context,
) {

	ticketID := parseInt64Param(
		c.Param("id"),
	)

	rows, err := h.db.Query(
		c.Request.Context(),
		`
		SELECT
			h.id,
			h.ticket_id,
			h.current_status,
			h.note,
			h.changed_by,
			h.department,
			h.attachment_url,
			h.created_at::text
		FROM public.trouble_ticket_history AS h
		WHERE h.ticket_id = $1
		ORDER BY
			h.created_at ASC,
			h.id ASC
		`,
		ticketID,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer rows.Close()

	items := make(
		[]map[string]any,
		0,
	)

	for rows.Next() {

		var (
			id            int64
			ticketIDValue int64
			status        *string
			note          *string
			changedBy     *string
			department    *string
			attachmentURL *string
			createdAt     string
		)

		if err := rows.Scan(
			&id,
			&ticketIDValue,
			&status,
			&note,
			&changedBy,
			&department,
			&attachmentURL,
			&createdAt,
		); err != nil {

			response.ServerError(c, err)
			return
		}

		items = append(
			items,
			map[string]any{
				"id":             id,
				"ticket_id":      ticketIDValue,
				"status":         status,
				"note":           note,
				"updated_by":     changedBy,
				"department":     department,
				"attachment_url": attachmentURL,
				"created_at":     createdAt,
			},
		)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		items,
	)
}

/* ============================================================
   ADD HISTORY UPDATE
============================================================ */

func (h *TicketHandler) AddUpdate(
	c *gin.Context,
) {

	employeeID, ok := requireEmployee(c)

	if !ok {
		return
	}

	var req struct {
		Note          string  `json:"note"`
		LegacyNote    string  `json:"tt_note"`
		Department    *string `json:"department"`
		AttachmentURL *string `json:"attachment_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(
			c,
			err.Error(),
		)
		return
	}

	note := strings.TrimSpace(
		req.Note,
	)

	if note == "" {

		note = strings.TrimSpace(
			req.LegacyNote,
		)
	}

	if note == "" {

		response.BadRequest(
			c,
			"note is required",
		)

		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		20*time.Second,
	)
	defer cancel()

	tx, err := h.db.Begin(ctx)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer tx.Rollback(ctx)

	ticketID := parseInt64Param(
		c.Param("id"),
	)

	var currentStatus string

	err = tx.QueryRow(
		ctx,
		`
		SELECT status
		FROM public.trouble_tickets
		WHERE id = $1
		`,
		ticketID,
	).Scan(
		&currentStatus,
	)

	if err != nil {

		if err == pgx.ErrNoRows {

			response.NotFound(
				c,
				"ticket not found",
			)

			return
		}

		response.ServerError(c, err)
		return
	}

	var updateID int64

	err = tx.QueryRow(
		ctx,
		`
		INSERT INTO public.trouble_ticket_history (
			ticket_id,
			event_type,
			previous_status,
			current_status,
			note,
			department,
			attachment_url,
			changed_by,
			created_at
		)
		VALUES (
			$1,
			'comment',
			$2,
			$2,
			$3,
			$4,
			$5,
			$6,
			NOW()
		)
		RETURNING id
		`,
		ticketID,
		currentStatus,
		note,
		req.Department,
		req.AttachmentURL,
		employeeID,
	).Scan(
		&updateID,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	/*
		If work starts on an Open ticket,
		move it to In Progress.
	*/
	if currentStatus == "Not Started" ||
		currentStatus == "Open" {

		_, err = tx.Exec(
			ctx,
			`
			UPDATE public.trouble_tickets
			SET
				status = 'In Progress',
				updated_at = NOW()
			WHERE id = $1
			`,
			ticketID,
		)

		if err != nil {
			response.ServerError(c, err)
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	c.JSON(
		http.StatusCreated,
		gin.H{
			"success": true,
			"data": gin.H{
				"id": updateID,
			},
		},
	)
}

/* ============================================================
   HISTORY INSERT HELPER
============================================================ */

func insertHistory(
	ctx context.Context,
	tx pgx.Tx,
	ticketID int64,
	eventType string,
	previousStatus string,
	currentStatus string,
	note string,
	changedBy string,
	department string,
	assignedTo string,
	attachmentURL string,
) error {

	var previous any

	if strings.TrimSpace(
		previousStatus,
	) != "" {

		previous =
			previousStatus
	}

	var current any

	if strings.TrimSpace(
		currentStatus,
	) != "" {

		current =
			currentStatus
	}

	_, err := tx.Exec(
		ctx,
		`
		INSERT INTO public.trouble_ticket_history (
			ticket_id,
			event_type,
			previous_status,
			current_status,
			note,
			assigned_to,
			department,
			attachment_url,
			changed_by,
			created_at
		)
		VALUES (
			$1,
			$2,
			$3,
			$4,
			$5,
			NULLIF($6, ''),
			NULLIF($7, ''),
			NULLIF($8, ''),
			NULLIF($9, ''),
			NOW()
		)
		`,
		ticketID,
		eventType,
		previous,
		current,
		strings.TrimSpace(note),
		strings.TrimSpace(assignedTo),
		strings.TrimSpace(department),
		strings.TrimSpace(attachmentURL),
		strings.TrimSpace(changedBy),
	)

	return err
}

/* ============================================================
   ID PARAMETER
============================================================ */

func parseInt64Param(
	value string,
) int64 {

	id, err := strconv.ParseInt(
		strings.TrimSpace(value),
		10,
		64,
	)

	if err != nil {
		return 0
	}

	return id
}

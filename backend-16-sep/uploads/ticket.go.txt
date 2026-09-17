// backend/internal/handler/ticket.go

package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

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

	// Static route must be registered before /:id.
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
	ReasonOfProblem string `json:"reason_of_problem"`
	FaultType       int    `json:"fault_type"`
}

type employeeSnapshot struct {
	ID          string
	Name        string
	Designation string
	Department  string
	Function    string
	Phone       string
	Email       string
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
			COALESCE(o.sub_function, ''),
			COALESCE(
				p.official_cell_no,
				p.personal_cell_no,
				''
			),
			COALESCE(
				p.official_email,
				p.email,
				''
			)
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
		&employee.Function,
		&employee.Phone,
		&employee.Email,
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

	return employee, nil
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

	employee, err := h.loadEmployeeSnapshot(
		ctx,
		employeeID,
	)

	if err != nil {
		response.ServerError(c, err)
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
		employee.Name,
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

func (h *TicketHandler) CreateBulk(
	c *gin.Context,
) {

	employeeID, ok := requireEmployee(c)

	if !ok {
		return
	}

	var req struct {
		Tickets []ticketInput `json:"tickets"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(
			c,
			err.Error(),
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
		Validate every ticket before opening the transaction.
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
		Serialize TT number generation.
	*/
	if _, err := tx.Exec(
		ctx,
		`SELECT pg_advisory_xact_lock($1)`,
		ttNumberAdvisoryLock,
	); err != nil {

		response.ServerError(c, err)
		return
	}

	employee, err := h.loadEmployeeSnapshot(
		ctx,
		employeeID,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	type CreatedTicket struct {
		ID   int64  `json:"id"`
		TTNo string `json:"tt_no"`
	}

	created := make(
		[]CreatedTicket,
		0,
		len(req.Tickets),
	)

	for i := range req.Tickets {

		item := req.Tickets[i]

		/*
			Resolve fault from public.tt_faults.
		*/
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

		var id int64

		/*
			IMPORTANT:

			Do NOT insert fault_type_id.

			Actual trouble_tickets schema stores the
			selected fault name in query_type.
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
			item.ReasonOfProblem,
			employee.Name,
		).Scan(&id)

		if err != nil {
			response.ServerError(c, err)
			return
		}

		/*
			NO history record during creation.
		*/

		created = append(
			created,
			CreatedTicket{
				ID:   id,
				TTNo: ttNo,
			},
		)
	}

	/*
		Commit all tickets together.
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
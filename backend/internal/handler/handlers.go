// itm/backend/internal/handler/handlers.go
package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"itm-api/internal/middleware"
	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─── Employee ────────────────────────────────────────────────────────────────

type EmployeeHandler struct{ db *pgxpool.Pool }

func NewEmployeeHandler(db *pgxpool.Pool) *EmployeeHandler {
	return &EmployeeHandler{
		db: db,
	}
}

func (h *EmployeeHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/employees")

	g.GET("", h.List)

	/*
		Keep the static route before /:emp_id.
	*/
	g.GET("/search", h.Search)

	g.GET("/:emp_id", h.Get)
}

func (h *EmployeeHandler) List(c *gin.Context) {
	page, _ :=
		strconv.Atoi(
			c.DefaultQuery(
				"page",
				"1",
			),
		)

	pageSize, _ :=
		strconv.Atoi(
			c.DefaultQuery(
				"page_size",
				"50",
			),
		)

	if page < 1 {
		page = 1
	}

	if pageSize < 1 {
		pageSize = 50
	}

	if pageSize > 200 {
		pageSize = 200
	}

	offset :=
		(page - 1) *
			pageSize

	active :=
		strings.TrimSpace(
			c.Query("active"),
		)

	where :=
		`
		WHERE 1 = 1
		`

	args :=
		make(
			[]any,
			0,
		)

	argIndex := 1

	if active != "" {
		where +=
			fmt.Sprintf(
				`
				AND LOWER(
					BTRIM(
						COALESCE(
							o.active,
							''
						)
					)
				) = LOWER($%d)
				`,
				argIndex,
			)

		args =
			append(
				args,
				active,
			)

		argIndex++
	}

	var total int

	countQuery :=
		fmt.Sprintf(
			`
			SELECT COUNT(*)
			FROM public.employee_office_info o
			%s
			`,
			where,
		)

	if err :=
		h.db.QueryRow(
			c.Request.Context(),
			countQuery,
			args...,
		).Scan(
			&total,
		); err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	query :=
		fmt.Sprintf(
			`
			SELECT
				BTRIM(
					COALESCE(
						o.employee_id,
						''
					)
				),

				BTRIM(
					COALESCE(
						o.employee_name,
						''
					)
				),

				BTRIM(
					COALESCE(
						o.designation,
						''
					)
				),

				BTRIM(
					COALESCE(
						o.department_name,
						''
					)
				),

				BTRIM(
					COALESCE(
						o.work_field,
						''
					)
				),

				BTRIM(
					COALESCE(
						o.sub_function,
						''
					)
				),

				BTRIM(
					COALESCE(
						o.active,
						''
					)
				),

				BTRIM(
					COALESCE(
						p.personal_cell_no,
						''
					)
				),

				BTRIM(
					COALESCE(
						p.official_cell_no,
						''
					)
				),

				BTRIM(
					COALESCE(
						p.email,
						''
					)
				),

				BTRIM(
					COALESCE(
						p.official_email,
						''
					)
				),

				BTRIM(
					COALESCE(
						p.picture,
						''
					)
				)

			FROM public.employee_office_info o

			LEFT JOIN public.employee_personal_info p
				ON BTRIM(
					COALESCE(
						p.employee_id,
						''
					)
				) =
				BTRIM(
					COALESCE(
						o.employee_id,
						''
					)
				)

			%s

			ORDER BY
				o.employee_name,
				o.employee_id

			LIMIT $%d
			OFFSET $%d
			`,
			where,
			argIndex,
			argIndex+1,
		)

	queryArgs :=
		append(
			[]any{},
			args...,
		)

	queryArgs =
		append(
			queryArgs,
			pageSize,
			offset,
		)

	rows, err :=
		h.db.Query(
			c.Request.Context(),
			query,
			queryArgs...,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	defer rows.Close()

	type Employee struct {
		EmployeeID string `json:"employee_id"`

		EmployeeName string `json:"employee_name"`

		Designation string `json:"designation"`

		Department string `json:"department"`

		WorkField string `json:"work_field"`

		SubFunction string `json:"sub_function"`

		Active string `json:"active"`

		PersonalCell string `json:"personal_cell"`

		OfficialCell string `json:"official_cell"`

		Email string `json:"email"`

		OfficialEmail string `json:"official_email"`

		Picture string `json:"picture"`
	}

	items :=
		make(
			[]Employee,
			0,
			pageSize,
		)

	for rows.Next() {
		var item Employee

		if err :=
			rows.Scan(
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
				&item.Picture,
			); err != nil {
			response.ServerError(
				c,
				err,
			)
			return
		}

		items =
			append(
				items,
				item,
			)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	response.Paginated(
		c,
		items,
		total,
		page,
		pageSize,
	)
}

func (h *EmployeeHandler) Get(c *gin.Context) {
	ctx :=
		c.Request.Context()

	employeeID :=
		strings.TrimSpace(
			c.Param("emp_id"),
		)

	if employeeID == "" {
		response.BadRequest(
			c,
			"employee id required",
		)
		return
	}

	type Employee struct {
		EmployeeID string `json:"employee_id"`

		EmployeeName string `json:"employee_name"`

		Designation string `json:"designation"`

		Department string `json:"department"`

		WorkField string `json:"work_field"`

		SubFunction string `json:"sub_function"`

		Active string `json:"active"`

		PersonalCell string `json:"personal_cell"`

		OfficialCell string `json:"official_cell"`

		Email string `json:"email"`

		OfficialEmail string `json:"official_email"`

		Picture string `json:"picture"`

		SeparationMode string `json:"separation_mode"`

		SeparationDate string `json:"separation_date"`

		JoiningDate string `json:"joining_date"`

		DeviceCount int `json:"device_count"`
	}

	var item Employee

	err :=
		h.db.QueryRow(
			ctx,
			`
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
				BTRIM(COALESCE(p.official_email, '')),
				BTRIM(COALESCE(p.picture, '')),
				BTRIM(COALESCE(o.separation_mode, '')),
				COALESCE(o.separation_date::text, ''),
				COALESCE(o.joining_date::text, ''),
				(
					SELECT
						COUNT(*)::int
					FROM public.it_equipment d
					WHERE
						BTRIM(
							COALESCE(
								d.emp_id,
								''
							)
						) =
						BTRIM(
							COALESCE(
								o.employee_id,
								''
							)
						)
						AND COALESCE(
							d.active,
							0
						) > 0
				)

			FROM public.employee_office_info o

			LEFT JOIN public.employee_personal_info p
				ON BTRIM(
					COALESCE(
						p.employee_id,
						''
					)
				) =
				BTRIM(
					COALESCE(
						o.employee_id,
						''
					)
				)

			WHERE
				BTRIM(
					COALESCE(
						o.employee_id,
						''
					)
				) = $1

			LIMIT 1
			`,
			employeeID,
		).Scan(
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
			&item.Picture,
			&item.SeparationMode,
			&item.SeparationDate,
			&item.JoiningDate,
			&item.DeviceCount,
		)

	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(
				c,
				"employee not found",
			)
			return
		}

		response.ServerError(
			c,
			err,
		)
		return
	}

	response.OK(
		c,
		item,
	)
}

func (h *EmployeeHandler) Search(c *gin.Context) {
	ctx :=
		c.Request.Context()

	searchText :=
		strings.TrimSpace(
			c.Query("q"),
		)

	if len(searchText) < 2 {
		response.OK(
			c,
			[]any{},
		)
		return
	}

	type EmployeeSearchItem struct {
		EmployeeID string `json:"employee_id"`

		EmployeeName string `json:"employee_name"`

		Designation string `json:"designation"`

		Department string `json:"department"`

		WorkField string `json:"work_field"`

		SubFunction string `json:"sub_function"`

		Active string `json:"active"`

		PersonalCell string `json:"personal_cell"`

		OfficialCell string `json:"official_cell"`

		Email string `json:"email"`

		OfficialEmail string `json:"official_email"`

		Picture string `json:"picture"`
	}

	likeValue :=
		"%" +
			searchText +
			"%"

	rows, err :=
		h.db.Query(
			ctx,
			`
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
				BTRIM(COALESCE(p.official_email, '')),
				BTRIM(COALESCE(p.picture, ''))

			FROM public.employee_office_info o

			LEFT JOIN public.employee_personal_info p
				ON BTRIM(
					COALESCE(
						p.employee_id,
						''
					)
				) =
				BTRIM(
					COALESCE(
						o.employee_id,
						''
					)
				)

			WHERE
				(
					BTRIM(
						COALESCE(
							o.employee_id,
							''
						)
					) ILIKE $1

					OR

					BTRIM(
						COALESCE(
							o.employee_name,
							''
						)
					) ILIKE $1
				)

			/*
				Clearance may also be required for an employee
				who has already been separated in HRIS, therefore
				do not hide inactive employees from this search.
			*/
			ORDER BY
				CASE
					WHEN LOWER(
						BTRIM(
							COALESCE(
								o.active,
								''
							)
						)
					) IN (
						'active',
						'yes'
					)
					THEN 0
					ELSE 1
				END,

				o.employee_name,
				o.employee_id

			LIMIT 30
			`,
			likeValue,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	defer rows.Close()

	items :=
		make(
			[]EmployeeSearchItem,
			0,
		)

	for rows.Next() {
		var item EmployeeSearchItem

		if err :=
			rows.Scan(
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
				&item.Picture,
			); err != nil {
			response.ServerError(
				c,
				err,
			)
			return
		}

		items =
			append(
				items,
				item,
			)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	response.OK(
		c,
		items,
	)
}

// ─── Dashboard Route ───────────────────────────────────────────────────────────────

type DashboardHandler struct{ db *pgxpool.Pool }

func NewDashboardHandler(db *pgxpool.Pool) *DashboardHandler { return &DashboardHandler{db: db} }

func (h *DashboardHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/dashboard")

	// Device Clearance routes use the same authenticated API group as Dashboard.
	clearance := rg.Group("/device-clearances")
	clearance.POST("", h.CreateDeviceClearance)
	clearance.GET("", h.ListDeviceClearances)
	clearance.GET("/:id", h.GetDeviceClearance)
	clearance.PATCH("/:id/checklist", h.UpdateDeviceClearanceChecklist)
	clearance.PATCH("/:id/complete", h.CompleteDeviceClearance)

	g.GET(
		"/stats",
		h.Stats,
	)

	g.GET(
		"/summary",
		h.Summary,
	)

	g.GET(
		"/ticket-trend",
		h.TicketTrend,
	)

	g.GET(
		"/trouble-ticket-summary",
		h.TroubleTicketSummary,
	)

	g.GET(
		"/trouble-ticket-overview",
		h.TroubleTicketOverview,
	)

	g.GET(
		"/trouble-tickets",
		h.TroubleTicketList,
	)

	g.GET(
		"/trouble-tickets/:id/details",
		h.TroubleTicketDetails,
	)

	g.GET(
		"/trouble-tickets/:id/events",
		h.TroubleTicketEvents,
	)

	g.GET(
		"/trouble-ticket-it-personnel",
		h.TroubleTicketITPersonnel,
	)

	//Urgent Task List
	// g.GET(
	// 	"/urgent-tasks",
	// 	h.UrgentTaskList,
	//   )

	// g.GET(
	// 	"/urgent-tasks/sidebar",
	// 	h.UrgentTaskSidebar,
	// )

	// g.POST(
	// 	"/urgent-tasks",
	// 	h.CreateUrgentTask,
	// )

	// g.PUT(
	// 	"/urgent-tasks/:id",
	// 	h.UpdateUrgentTask,
	// )

	// g.DELETE(
	// 	"/urgent-tasks/:id",
	// 	h.DeleteUrgentTask,
	// )

	//Urgent Task List
	g.GET(
		"/urgent-tasks",
		h.UrgentTaskList,
	)

	g.GET(
		"/urgent-tasks/sidebar",
		h.UrgentTaskSidebar,
	)

	g.POST(
		"/urgent-tasks",
		h.CreateUrgentTask,
	)

	// IMPORTANT:
	// Replace the old `h.UpdateUrgentTask` route handler with the secure
	// IT-Administrator-only handler below.
	g.PUT(
		"/urgent-tasks/:id",
		h.UpdateUrgentTaskAdmin,
	)

	g.PATCH(
		"/urgent-tasks/:id/complete",
		h.CompleteUrgentTask,
	)

	g.DELETE(
		"/urgent-tasks/:id",
		h.DeleteUrgentTask,
	)

	// Database-backed notifications.
	g.GET(
		"/notifications",
		h.NotificationList,
	)

	g.PATCH(
		"/notifications/read-all",
		h.MarkAllNotificationsRead,
	)

	g.PATCH(
		"/notifications/:id/read",
		h.MarkNotificationRead,
	)

	g.POST(
		"/trouble-tickets/:id/assignment",
		middleware.RequirePermission(h.db, "TT_ASSIGN"),
		h.AssignTroubleTicket,
	)

	// Trouble Ticket requisition creation.
	g.POST(
		"/trouble-tickets/:id/requisition",
		middleware.RequirePermission(h.db, "TT_REQUISITION"),
		h.RaiseTroubleTicketRequisition,
	)

	// Trouble Ticket close action.
	// TT_Close is intentionally separate from TT_EDIT.
	g.PATCH(
		"/trouble-tickets/:id/close",
		middleware.RequirePermission(h.db, "TT_Close"),
		h.CloseTroubleTicket,
	)

	/* ============================================================
	   REQUISITION

	   Read:
	   requisition.view

	   Approval:
	   requisition.approve

	   Delivery:
	   requisition.deliver
	============================================================ */

	g.GET(
		"/requisition-dashboard-summary",
		middleware.RequirePermission(
			h.db,
			"requisition.view",
		),
		h.RequisitionDashboardSummary,
	)

	g.GET(
		"/requisition-summary",
		middleware.RequirePermission(
			h.db,
			"requisition.view",
		),
		h.RequisitionSummary,
	)

	g.GET(
		"/requisitions",
		middleware.RequirePermission(
			h.db,
			"requisition.view",
		),
		h.RequisitionList,
	)

	g.PATCH(
		"/requisitions/:id/approval",
		middleware.RequirePermission(
			h.db,
			"requisition.approve",
		),
		h.UpdateRequisitionApproval,
	)

	g.PATCH(
		"/requisitions/:id/delivery",
		middleware.RequirePermission(
			h.db,
			"requisition.deliver",
		),
		h.UpdateRequisitionDelivery,
	)
}

func (h *DashboardHandler) Stats(c *gin.Context) {
	ctx := c.Request.Context()
	type S struct {
		TotalDevices     int `json:"total_devices"`
		AssignedDevices  int `json:"assigned_devices"`
		StockDevices     int `json:"stock_devices"`
		ActiveEmployees  int `json:"active_employees"`
		OpenTickets      int `json:"open_tickets"`
		RunningTickets   int `json:"running_tickets"`
		ClosedTickets    int `json:"closed_tickets"`
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
		Value int    `json:"value"`
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
	if err != nil {
		response.ServerError(c, err)
		return
	}
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
		var r R
		rows.Scan(&r.Day, &r.Open, &r.Running, &r.Closed, &r.Total)
		res = append(res, r)
	}
	if res == nil {
		res = []R{}
	}
	response.OK(c, res)
}

// TroubleTicketSummary returns the four dashboard KPI counts.
//
// Current mappings:
// fault_date_time   -> trouble_tickets.created_at
// ticket_close_date -> trouble_tickets.closed_at
// status            -> trouble_tickets.source_status
// procurement       -> latest tt_reasons.approved_val
func (h *DashboardHandler) TroubleTicketSummary(c *gin.Context) {
	ctx := c.Request.Context()

	type Summary struct {
		OpenedToday      int64 `json:"opened_today"`
		ClosedToday      int64 `json:"closed_today"`
		TotalRunning     int64 `json:"total_running_tt"`
		TotalProcurement int64 `json:"total_procurement_tt"`
	}

	const query = `
		WITH normalized_tickets AS (
			SELECT
				ticket.created_at,
				ticket.closed_at,

				COALESCE(
					ticket.source_status,
					CASE
						WHEN LOWER(
							COALESCE(ticket.status, '')
						) = 'closed'
						THEN 0
						ELSE 1
					END
				)::int AS legacy_status,

				CASE
					WHEN COALESCE(
						ticket.source_device_requisition,
						0
					) = 3
						THEN 1

					WHEN reason.approved_val IS NOT NULL
						THEN 1

					WHEN NULLIF(
						BTRIM(
							COALESCE(
								ticket.requisition_type,
								''
							)
						),
						''
					) IS NOT NULL
						THEN 1

					ELSE 0
				END::int AS has_requisition

			FROM public.trouble_tickets AS ticket

			LEFT JOIN LATERAL (
				SELECT
					tt_reason.approved_val

				FROM public.tt_reasons AS tt_reason

				WHERE
					tt_reason.trouble_ticket_id = ticket.id

					OR (
						tt_reason.trouble_ticket_id IS NULL
						AND BTRIM(tt_reason.tt_no) =
							BTRIM(ticket.tt_no::text)
					)

				ORDER BY
					CASE
						WHEN tt_reason.trouble_ticket_id = ticket.id
							THEN 1
						ELSE 0
					END DESC,

					tt_reason.created_at DESC NULLS LAST,
					tt_reason.id DESC

				LIMIT 1
			) AS reason ON TRUE
		),

		dhaka_clock AS (
			SELECT
				(
					CURRENT_TIMESTAMP
					AT TIME ZONE 'Asia/Dhaka'
				)::date AS today
		)

		SELECT
			COUNT(*) FILTER (
				WHERE (
					ticket.created_at
					AT TIME ZONE 'Asia/Dhaka'
				)::date = clock.today
			)::bigint AS opened_today,

			COUNT(*) FILTER (
				WHERE (
					ticket.closed_at
					AT TIME ZONE 'Asia/Dhaka'
				)::date = clock.today
				AND ticket.legacy_status = 0
			)::bigint AS closed_today,

			COUNT(*) FILTER (
				WHERE ticket.has_requisition = 0
				AND ticket.legacy_status = 1
			)::bigint AS total_running_tt,

			COUNT(*) FILTER (
				WHERE ticket.has_requisition = 1
				AND ticket.legacy_status = 1
			)::bigint AS total_procurement_tt

		FROM normalized_tickets AS ticket
		CROSS JOIN dhaka_clock AS clock
	`

	var result Summary

	if err := h.db.QueryRow(ctx, query).Scan(
		&result.OpenedToday,
		&result.ClosedToday,
		&result.TotalRunning,
		&result.TotalProcurement,
	); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, result)
}

//Touble Ticket Overview

func (
	h *DashboardHandler,
) TroubleTicketOverview(
	c *gin.Context,
) {
	ctx := c.Request.Context()

	rangeKey := c.DefaultQuery(
		"range",
		"7d",
	)

	type OverviewItem struct {
		Label      string `json:"label"`
		Open       int    `json:"open"`
		InProgress int    `json:"in_progress"`
		Closed     int    `json:"closed"`
	}

	var (
		rows pgx.Rows
		err  error
	)

	switch rangeKey {
	case "7d", "30d":
		days := 7

		if rangeKey == "30d" {
			days = 30
		}

		rows, err = h.db.Query(
			ctx,
			`
			WITH date_buckets AS (
				SELECT generate_series(
					CURRENT_DATE
						- (
							($1::int - 1)
							* INTERVAL '1 day'
						),
					CURRENT_DATE,
					INTERVAL '1 day'
				) AS bucket
			),
			ticket_counts AS (
				SELECT
					DATE_TRUNC(
						'day',
						created_at
					) AS bucket,

					COUNT(*) FILTER (
						WHERE status IN (
							'Open',
							'Not Started'
						)
					)::int AS open_count,

					COUNT(*) FILTER (
						WHERE status = 'In Progress'
					)::int AS in_progress_count,

					COUNT(*) FILTER (
						WHERE status = 'Closed'
					)::int AS closed_count
				FROM public.trouble_tickets
				WHERE created_at >=
					CURRENT_DATE
					- (
						($1::int - 1)
						* INTERVAL '1 day'
					)
				GROUP BY
					DATE_TRUNC(
						'day',
						created_at
					)
			)
			SELECT
				TO_CHAR(
					date_buckets.bucket,
					'DD Mon'
				) AS label,

				COALESCE(
					ticket_counts.open_count,
					0
				)::int AS open_count,

				COALESCE(
					ticket_counts.in_progress_count,
					0
				)::int AS in_progress_count,

				COALESCE(
					ticket_counts.closed_count,
					0
				)::int AS closed_count
			FROM date_buckets
			LEFT JOIN ticket_counts
				ON ticket_counts.bucket =
					date_buckets.bucket
			ORDER BY
				date_buckets.bucket
			`,
			days,
		)

	case "3m":
		rows, err = h.db.Query(
			ctx,
			`
			WITH month_buckets AS (
				SELECT generate_series(
					DATE_TRUNC(
						'month',
						CURRENT_DATE
					) - INTERVAL '2 months',

					DATE_TRUNC(
						'month',
						CURRENT_DATE
					),

					INTERVAL '1 month'
				) AS bucket
			),
			ticket_counts AS (
				SELECT
					DATE_TRUNC(
						'month',
						created_at
					) AS bucket,

					COUNT(*) FILTER (
						WHERE status IN (
							'Open',
							'Not Started'
						)
					)::int AS open_count,

					COUNT(*) FILTER (
						WHERE status = 'In Progress'
					)::int AS in_progress_count,

					COUNT(*) FILTER (
						WHERE status = 'Closed'
					)::int AS closed_count
				FROM public.trouble_tickets
				WHERE created_at >=
					DATE_TRUNC(
						'month',
						CURRENT_DATE
					) - INTERVAL '2 months'
				GROUP BY
					DATE_TRUNC(
						'month',
						created_at
					)
			)
			SELECT
				TO_CHAR(
					month_buckets.bucket,
					'Mon YYYY'
				) AS label,

				COALESCE(
					ticket_counts.open_count,
					0
				)::int AS open_count,

				COALESCE(
					ticket_counts.in_progress_count,
					0
				)::int AS in_progress_count,

				COALESCE(
					ticket_counts.closed_count,
					0
				)::int AS closed_count
			FROM month_buckets
			LEFT JOIN ticket_counts
				ON ticket_counts.bucket =
					month_buckets.bucket
			ORDER BY
				month_buckets.bucket
			`,
		)

	default:
		response.BadRequest(
			c,
			"range must be 7d, 30d, or 3m",
		)
		return
	}

	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer rows.Close()

	items := make(
		[]OverviewItem,
		0,
	)

	total := 0

	for rows.Next() {
		var item OverviewItem

		if err := rows.Scan(
			&item.Label,
			&item.Open,
			&item.InProgress,
			&item.Closed,
		); err != nil {
			response.ServerError(c, err)
			return
		}

		total +=
			item.Open +
				item.InProgress +
				item.Closed

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
		gin.H{
			"range": rangeKey,
			"total": total,
			"items": items,
		},
	)
}

// TroubleTicketList returns a paginated Trouble Ticket list.
//
// Supported scopes:
//   - all
//   - opened_today
//   - closed_today
//   - running
//   - procurement
//
// Supported filters:
//   - from_date
//   - to_date
//   - employee_id
//   - it_personal
//   - status
//   - search
//
// All supplied filters are combined using AND.
func (h *DashboardHandler) TroubleTicketList(c *gin.Context) {
	ctx := c.Request.Context()

	/* =====================================================
	   PAGINATION
	===================================================== */

	page, err := strconv.Atoi(
		c.DefaultQuery(
			"page",
			"1",
		),
	)

	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(
		c.DefaultQuery(
			"limit",
			"10",
		),
	)

	if err != nil || limit < 1 {
		limit = 10
	}

	if limit > 1000 {
		limit = 1000
	}

	offset := (page - 1) * limit

	/* =====================================================
	   REQUEST FILTERS
	===================================================== */

	scope := strings.ToLower(
		strings.TrimSpace(
			c.DefaultQuery(
				"scope",
				"all",
			),
		),
	)

	status := strings.TrimSpace(
		c.DefaultQuery(
			"status",
			"all",
		),
	)

	search := strings.TrimSpace(
		c.Query(
			"search",
		),
	)

	fromDate := strings.TrimSpace(
		c.Query(
			"from_date",
		),
	)

	toDate := strings.TrimSpace(
		c.Query(
			"to_date",
		),
	)

	employeeID := strings.TrimSpace(
		c.Query(
			"employee_id",
		),
	)

	itPersonal := strings.TrimSpace(
		c.Query(
			"it_personal",
		),
	)

	/* =====================================================
	   SQL FILTER BUILDER

	   IMPORTANT:
	   These must be declared BEFORE we append any filters.
	===================================================== */

	where := `
		WHERE 1 = 1
	`

	args := make(
		[]any,
		0,
	)

	argNumber := 1

	/* =====================================================
	   STATUS NORMALIZATION

	   Legacy:
	   0 = Closed
	   1 = Open
	===================================================== */

	legacyStatusExpression := `
		COALESCE(
			ticket.source_status,

			CASE
				WHEN LOWER(
					COALESCE(
						dashboard.status,
						''
					)
				) = 'closed'
					THEN 0

				ELSE 1
			END
		)
	`

	/* =====================================================
	   REQUISITION EXISTS
	===================================================== */

	hasRequisitionExpression := `
		CASE
			WHEN COALESCE(
				ticket.source_device_requisition,
				0
			) = 3
				THEN 1

			WHEN reason.approved_val IS NOT NULL
				THEN 1

			WHEN NULLIF(
				BTRIM(
					COALESCE(
						dashboard.requisition_type,
						''
					)
				),
				''
			) IS NOT NULL
				THEN 1

			ELSE 0
		END
	`

	/* =====================================================
	   REQUISITION DISPLAY
	===================================================== */

	requisitionDisplayExpression := `
		CASE
			WHEN reason.approved_val = 1
				THEN 'Petty Cash (Approved)'

			WHEN reason.approved_val = 3
				THEN 'PR (Approved)'

			WHEN reason.approved_val = 2
				THEN 'Rejected'

			WHEN COALESCE(
				ticket.source_device_requisition,
				0
			) = 3
				THEN 'Raised'

			WHEN NULLIF(
				BTRIM(
					COALESCE(
						dashboard.requisition_type,
						''
					)
				),
				''
			) IS NOT NULL
				THEN dashboard.requisition_type

			ELSE ''
		END
	`

	/* =====================================================
	   DELIVERY DISPLAY
	===================================================== */

	deliveryDisplayExpression := `
		CASE
			WHEN reason.delivered_val = 1
				THEN 'Delivered'

			WHEN reason.delivered_val = 2
				THEN 'Rejected'

			WHEN reason.delivered_val = 0
				THEN 'Pending'

			WHEN NULLIF(
				BTRIM(
					COALESCE(
						dashboard.delivered_status,
						''
					)
				),
				''
			) IS NOT NULL
				THEN dashboard.delivered_status

			WHEN COALESCE(
				ticket.source_device_requisition,
				0
			) = 3
				THEN 'Pending'

			WHEN reason.approved_val IS NOT NULL
				THEN 'Pending'

			WHEN NULLIF(
				BTRIM(
					COALESCE(
						dashboard.requisition_type,
						''
					)
				),
				''
			) IS NOT NULL
				THEN 'Pending'

			ELSE ''
		END
	`

	/* =====================================================
	   COMMON JOIN
	===================================================== */

	reasonJoin := `
		FROM public.v_trouble_ticket_dashboard AS dashboard

		INNER JOIN public.trouble_tickets AS ticket
			ON ticket.id = dashboard.id

		LEFT JOIN LATERAL (
			SELECT
				tt_reason.approved_val,
				tt_reason.delivered_val

			FROM public.tt_reasons AS tt_reason

			WHERE
				tt_reason.trouble_ticket_id = ticket.id

				OR (
					tt_reason.trouble_ticket_id IS NULL

					AND BTRIM(
						tt_reason.tt_no
					) = BTRIM(
						ticket.tt_no::text
					)
				)

			ORDER BY
				CASE
					WHEN tt_reason.trouble_ticket_id = ticket.id
						THEN 1

					ELSE 0
				END DESC,

				tt_reason.created_at DESC NULLS LAST,

				tt_reason.id DESC

			LIMIT 1
		) AS reason
			ON TRUE
	`

	/* =====================================================
	   SCOPE FILTER
	===================================================== */

	switch scope {
	case "",
		"all":

		scope = "all"

	case "opened_today":

		where += `
			AND (
				ticket.created_at
				AT TIME ZONE 'Asia/Dhaka'
			)::date = (
				CURRENT_TIMESTAMP
				AT TIME ZONE 'Asia/Dhaka'
			)::date
		`

	case "closed_today":

		where += fmt.Sprintf(
			`
			AND (
				ticket.closed_at
				AT TIME ZONE 'Asia/Dhaka'
			)::date = (
				CURRENT_TIMESTAMP
				AT TIME ZONE 'Asia/Dhaka'
			)::date

			AND (%s) = 0
			`,
			legacyStatusExpression,
		)

	case "running":

		where += fmt.Sprintf(
			`
			AND (%s) = 0
			AND (%s) = 1
			`,
			hasRequisitionExpression,
			legacyStatusExpression,
		)

	case "procurement":

		where += fmt.Sprintf(
			`
			AND (%s) = 1
			AND (%s) = 1
			`,
			hasRequisitionExpression,
			legacyStatusExpression,
		)

	default:

		response.BadRequest(
			c,
			"scope must be all, opened_today, closed_today, running, or procurement",
		)

		return
	}

	/* =====================================================
	   FROM DATE
	===================================================== */

	if fromDate != "" {
		where += fmt.Sprintf(
			`
			AND (
				ticket.created_at
				AT TIME ZONE 'Asia/Dhaka'
			)::date >= $%d::date
			`,
			argNumber,
		)

		args = append(
			args,
			fromDate,
		)

		argNumber++
	}

	/* =====================================================
	   TO DATE
	===================================================== */

	if toDate != "" {
		where += fmt.Sprintf(
			`
			AND (
				ticket.created_at
				AT TIME ZONE 'Asia/Dhaka'
			)::date <= $%d::date
			`,
			argNumber,
		)

		args = append(
			args,
			toDate,
		)

		argNumber++
	}

	/* =====================================================
	   EMPLOYEE ID

	   This is the employee/requester of the TT.
	===================================================== */

	if employeeID != "" {
		where += fmt.Sprintf(
			`
			AND BTRIM(
				COALESCE(
					dashboard.employee_id,
					''
				)
			) = $%d
			`,
			argNumber,
		)

		args = append(
			args,
			employeeID,
		)

		argNumber++
	}

	/* =====================================================
	   IT PERSONNEL

	   Previous PHP:

	   tbl_trouble_input.forward_logical_person

	   Migrated field:

	   dashboard.assigned_name

	   Dropdown sends employee_id, e.g. 02-2181.
	===================================================== */

	if itPersonal != "" {
		where += fmt.Sprintf(
			`
			AND BTRIM(
				COALESCE(
					dashboard.assigned_name,
					''
				)
			) = $%d
			`,
			argNumber,
		)

		args = append(
			args,
			itPersonal,
		)

		argNumber++
	}

	/* =====================================================
	   STATUS
	===================================================== */

	if status != "" &&
		!strings.EqualFold(
			status,
			"all",
		) {

		var normalizedStatus int

		switch strings.ToLower(
			status,
		) {
		case "open",
			"not started",
			"in progress":

			normalizedStatus = 1

		case "closed":

			normalizedStatus = 0

		default:

			response.BadRequest(
				c,
				"status must be all, Open, or Closed",
			)

			return
		}

		where += fmt.Sprintf(
			`
			AND (%s) = $%d
			`,
			legacyStatusExpression,
			argNumber,
		)

		args = append(
			args,
			normalizedStatus,
		)

		argNumber++
	}

	/* =====================================================
	   GENERAL SEARCH
	===================================================== */

	if search != "" {
		searchValue :=
			"%" +
				search +
				"%"

		searchPlaceholder :=
			fmt.Sprintf(
				"$%d",
				argNumber,
			)

		where += fmt.Sprintf(
			`
			AND (
				COALESCE(
					dashboard.tt_no,
					''
				) ILIKE %s

				OR COALESCE(
					dashboard.employee_id,
					''
				) ILIKE %s

				OR COALESCE(
					dashboard.employee_name,
					''
				) ILIKE %s

				OR COALESCE(
					dashboard.assigned_id,
					''
				) ILIKE %s

				OR COALESCE(
					dashboard.assigned_name,
					''
				) ILIKE %s

				OR COALESCE(
					dashboard.query_type,
					''
				) ILIKE %s

				OR COALESCE(
					ticket.description,
					''
				) ILIKE %s

				OR COALESCE(
					dashboard.dept_name,
					''
				) ILIKE %s

				OR COALESCE(
					dashboard.func_name,
					''
				) ILIKE %s

				OR COALESCE(
					dashboard.mobile_no,
					''
				) ILIKE %s

				OR (%s) ILIKE %s

				OR (%s) ILIKE %s
			)
			`,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,

			requisitionDisplayExpression,
			searchPlaceholder,

			deliveryDisplayExpression,
			searchPlaceholder,
		)

		args = append(
			args,
			searchValue,
		)

		argNumber++
	}

	/* =====================================================
	   TOTAL COUNT
	===================================================== */

	var total int

	countQuery := fmt.Sprintf(
		`
		SELECT
			COUNT(*)

		%s

		%s
		`,
		reasonJoin,
		where,
	)

	if err := h.db.QueryRow(
		ctx,
		countQuery,
		args...,
	).Scan(
		&total,
	); err != nil {

		response.ServerError(
			c,
			err,
		)

		return
	}

	/* =====================================================
	   RESPONSE TYPE
	===================================================== */

	type TroubleTicketRow struct {
		ID int64 `json:"id"`

		TTNo string `json:"tt_no"`

		EmployeeID string `json:"employee_id"`

		EmployeeName string `json:"employee_name"`

		AssignedID string `json:"assigned_id"`

		AssignedName string `json:"assigned_name"`

		QueryType string `json:"query_type"`

		Description string `json:"description"`

		RequisitionType string `json:"requisition_type"`

		Status string `json:"status"`

		Department string `json:"dept_name"`

		FunctionName string `json:"func_name"`

		DeliveredStatus string `json:"delivered_status"`

		CreatedAt string `json:"created_at"`

		AgeSeconds int64 `json:"age_seconds"`

		MobileNo string `json:"mobile_no"`
	}

	/* =====================================================
	   LIST QUERY
	===================================================== */

	listQuery := fmt.Sprintf(
		`
		SELECT
			dashboard.id,

			COALESCE(
				dashboard.tt_no,
				''
			),

			COALESCE(
				dashboard.employee_id,
				''
			),

			COALESCE(
				dashboard.employee_name,
				''
			),

			COALESCE(
				dashboard.assigned_id,
				''
			),

			COALESCE(
				dashboard.assigned_name,
				''
			),

			COALESCE(
				dashboard.query_type,
				''
			),

			COALESCE(
				ticket.description,
				''
			),

			%s AS requisition_type,

			CASE
				WHEN (%s) = 0
					THEN 'Closed'

				ELSE 'Open'
			END AS status,

			COALESCE(
				dashboard.dept_name,
				''
			),

			COALESCE(
				dashboard.func_name,
				''
			),

			%s AS delivered_status,

			COALESCE(
				dashboard.created_at::text,
				''
			),

			COALESCE(
				dashboard.age_seconds,
				0
			)::bigint,

			COALESCE(
				dashboard.mobile_no,
				''
			)

		%s

		%s

		ORDER BY
			dashboard.created_at DESC NULLS LAST,
			dashboard.id DESC

		LIMIT $%d
		OFFSET $%d
		`,
		requisitionDisplayExpression,
		legacyStatusExpression,
		deliveryDisplayExpression,
		reasonJoin,
		where,
		argNumber,
		argNumber+1,
	)

	listArgs := append(
		[]any{},
		args...,
	)

	listArgs = append(
		listArgs,
		limit,
		offset,
	)

	rows, err := h.db.Query(
		ctx,
		listQuery,
		listArgs...,
	)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	defer rows.Close()

	/* =====================================================
	   SCAN
	===================================================== */

	items := make(
		[]TroubleTicketRow,
		0,
		limit,
	)

	for rows.Next() {
		var item TroubleTicketRow

		if err := rows.Scan(
			&item.ID,
			&item.TTNo,
			&item.EmployeeID,
			&item.EmployeeName,
			&item.AssignedID,
			&item.AssignedName,
			&item.QueryType,
			&item.Description,
			&item.RequisitionType,
			&item.Status,
			&item.Department,
			&item.FunctionName,
			&item.DeliveredStatus,
			&item.CreatedAt,
			&item.AgeSeconds,
			&item.MobileNo,
		); err != nil {

			response.ServerError(
				c,
				err,
			)

			return
		}

		items = append(
			items,
			item,
		)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	/* =====================================================
	   RESPONSE
	===================================================== */

	response.Paginated(
		c,
		items,
		total,
		page,
		limit,
	)
}

func (h *DashboardHandler) TroubleTicketDetails(c *gin.Context) {

	ctx := c.Request.Context()

	id := c.Param("id")

	type Ticket struct {
		ID int64 `json:"id"`

		TTNo string `json:"tt_no"`

		EmployeeID string `json:"employee_id"`

		EmployeeName string `json:"employee_name"`

		Department string `json:"department"`

		Function string `json:"function"`

		Mobile string `json:"mobile"`

		QueryType string `json:"query_type"`

		Reason string `json:"reason"`

		Status string `json:"status"`

		CreatedAt string `json:"created_at"`

		AssignedID string `json:"assigned_id"`

		AssignedName string `json:"assigned_name"`
	}

	var ticket Ticket

	err := h.db.QueryRow(
		ctx,
		`
		SELECT

			t.id,

			COALESCE(t.tt_no::text,''),

			COALESCE(t.employee_id,''),

			COALESCE(e.employee_name,''),

			COALESCE(e.department_name,''),

			COALESCE(e.work_field,''),

			COALESCE(e.employee_id,''),

			COALESCE(t.query_type,''),

			COALESCE(t.reason_of_problem,''),

			CASE
				WHEN t.status_progess = 3
				THEN 'Closed'
				ELSE 'Open'
			END,

			COALESCE(t.created_at::text,''),

			COALESCE(t.assigned_id,''),

			COALESCE(a.employee_name,'')


		FROM trouble_tickets t


		LEFT JOIN employee_office_info e

		ON e.employee_id=t.employee_id



		LEFT JOIN employee_office_info a

		ON a.employee_id=t.assigned_id



		WHERE t.id=$1

		`,
		id,
	).Scan(

		&ticket.ID,

		&ticket.TTNo,

		&ticket.EmployeeID,

		&ticket.EmployeeName,

		&ticket.Department,

		&ticket.Function,

		&ticket.Mobile,

		&ticket.QueryType,

		&ticket.Reason,

		&ticket.Status,

		&ticket.CreatedAt,

		&ticket.AssignedID,

		&ticket.AssignedName,
	)

	if err != nil {

		response.NotFound(
			c,
			"ticket not found",
		)

		return
	}

	type History struct {
		ID int64 `json:"id"`

		UserID string `json:"user_id"`

		UserName string `json:"user_name"`

		Team string `json:"team"`

		AssignedID string `json:"assigned_id"`

		AssignedName string `json:"assigned_name"`

		Note string `json:"note"`

		Date string `json:"date"`
	}

	history := []History{}

	rows, err := h.db.Query(
		ctx,
		`

		SELECT

			u.id,

			COALESCE(u.user,''),

			COALESCE(e.employee_name,''),

			COALESCE(u.logical_team,''),

			COALESCE(u.logical_team_person,''),

			COALESCE(a.employee_name,''),

			COALESCE(u.tt_note,''),

			COALESCE(u.date::text,'')


		FROM tbl_tt_update u


		LEFT JOIN employee_office_info e

		ON e.employee_id=u.user


		LEFT JOIN employee_office_info a

		ON a.employee_id=u.logical_team_person



		WHERE BTRIM(u.tt_no)=BTRIM(
			(
				SELECT tt_no::text
				FROM trouble_tickets
				WHERE id=$1
			)
		)


		ORDER BY u.id ASC


		`,
		id,
	)

	if err != nil {

		response.ServerError(c, err)

		return
	}

	defer rows.Close()

	for rows.Next() {

		var h History

		rows.Scan(

			&h.ID,

			&h.UserID,

			&h.UserName,

			&h.Team,

			&h.AssignedID,

			&h.AssignedName,

			&h.Note,

			&h.Date,
		)

		history = append(
			history,
			h,
		)
	}

	response.OK(
		c,
		gin.H{

			"ticket": ticket,

			"history": history,
		},
	)

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
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * ps
	sType := c.Query("service_type")
	args := []any{}
	where := "WHERE cl.status=1"
	i := 1
	if sType != "" {
		args = append(args, sType)
		where += fmt.Sprintf(" AND cl.service_type::text=$%d", i)
		i++
	}
	var total int
	ca := make([]any, len(args))
	copy(ca, args)
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
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	var claims []map[string]any
	for rows.Next() {
		var id, refNo, cs, st, av int
		var vendorID *int
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
	if claims == nil {
		claims = []map[string]any{}
	}
	response.Paginated(c, claims, total, page, ps)
}

func (h *ClaimHandler) Get(c *gin.Context) {
	var m map[string]any
	var id, refNo, cs, st, av int
	var vendorID *int
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
	if err != nil {
		response.NotFound(c, "claim not found")
		return
	}
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
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
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
	var req struct {
		ClaimStatus int `json:"claim_status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
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

	// Petty Cash stock entry.
	// Keep these static routes before /:id.
	g.POST("/petty-cash/validate", h.ValidatePettyCash)
	g.POST("/petty-cash/import", h.ImportPettyCash)

	// Existing stock routes remain unchanged.
	g.GET("", h.List)
	g.GET("/:id", h.Get)
	g.POST("", h.Create)
	g.PUT("/:id", h.Update)

	// Asset Device direct-assignment routes.
	// StockHandler is already registered on the authenticated API group,
	// so registering the assignment handler here guarantees these routes
	// use the same authentication middleware without another main/router edit.
	NewAssetDeviceAssignmentHandler(h.db).Register(rg)
}

func (h *StockHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	ps, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * ps
	var total int
	h.db.QueryRow(c.Request.Context(), "SELECT COUNT(*) FROM stack_inventory WHERE status=1").Scan(&total)
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT id, mr_id, pr_id, vendor_name, serial_no, purchase_date::text,
		       category, brand, model, cpu, ram, ssd, monitor, warranty_date::text,
		       item_group, item_name, total_item, device_assigned_status,
		       device_type, inventory_type, created_at::text
		FROM stack_inventory WHERE status=1 ORDER BY id DESC LIMIT $1 OFFSET $2`, ps, offset)
	if err != nil {
		response.ServerError(c, err)
		return
	}
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
	if stocks == nil {
		stocks = []map[string]any{}
	}
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
	if err != nil {
		response.NotFound(c, "stock not found")
		return
	}
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
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
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

	// Vendor Master extension. These routes reuse the existing
	// VendorHandler and warranty_vendors table.
	g.GET("/master/types", h.MasterTypes)
	g.GET("/master/ownerships", h.MasterOwnerships)
	g.GET("/master/options", h.MasterOptions)
	g.GET("/master", h.MasterList)
	g.POST("/master", h.MasterCreate)
	g.PUT("/master/:id", h.MasterUpdate)
	g.PATCH("/master/:id/status", h.MasterUpdateStatus)

	// Existing Service / Warranty vendor routes remain unchanged.
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
	type V struct {
		ID                        int
		Name, Addr, Mobile, Email *string
		Status                    int
	}
	var vs []V
	for rows.Next() {
		var v V
		rows.Scan(&v.ID, &v.Name, &v.Addr, &v.Mobile, &v.Email, &v.Status)
		vs = append(vs, v)
	}
	if vs == nil {
		vs = []V{}
	}
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
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	var id int
	h.db.QueryRow(c.Request.Context(), `
		INSERT INTO warranty_vendors (vendor_name, vendor_address, vendor_mobile, vendor_email,
		vendor_others, created_by, created_at, edited_by, edited_at, status)
		VALUES ($1,$2,$3,$4,'',  $5,NOW(),'',NOW(),1) RETURNING id`,
		req.Name, req.Addr, req.Mobile, req.Email, empID).Scan(&id)
	response.Created(c, gin.H{"id": id})
}

func (h *VendorHandler) Update(c *gin.Context) {
	var req map[string]any
	c.ShouldBindJSON(&req)
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
		ID          int     `json:"id"`
		Name        *string `json:"category_name"`
		ParentID    int     `json:"parent_id"`
		SubParentID int     `json:"sub_parent_id"`
		Type        *string `json:"type"`
		Status      int     `json:"status"`
	}
	var cats []Cat
	for rows.Next() {
		var cat Cat
		rows.Scan(&cat.ID, &cat.Name, &cat.ParentID, &cat.SubParentID, &cat.Type, &cat.Status)
		cats = append(cats, cat)
	}
	if cats == nil {
		cats = []Cat{}
	}
	response.OK(c, cats)
}

func (h *CategoryHandler) Create(c *gin.Context) {
	empID := c.GetString("employee_id")
	var req struct {
		Name     string  `json:"category_name" binding:"required"`
		ParentID int     `json:"parent_id"`
		Type     *string `json:"type"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
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

func (h *ReportHandler) Assigned(c *gin.Context) {
	status := strings.TrimSpace(c.Query("status"))

	// Available stock remains in stack_inventory until allocation.
	if strings.EqualFold(status, "Available") {
		availableRows, availableErr := h.db.Query(c.Request.Context(), `
			SELECT
				s.id,
				COALESCE(s.mr_id, ''),
				COALESCE(s.pr_id, ''),
				COALESCE(s.serial_no, ''),
				COALESCE(
					(
						SELECT ic.inventory_category_list
						FROM public.inventory_categories ic
						WHERE ic.id::text = BTRIM(COALESCE(s.category, ''))
						LIMIT 1
					),
					NULLIF(BTRIM(COALESCE(s.category, '')), ''),
					'Uncategorized'
				) AS category_name,
				COALESCE(s.brand, ''),
				COALESCE(s.model, ''),
				COALESCE(s.device_type, ''),
				COALESCE(s.vendor_name, ''),
				COALESCE(s.purchase_date::text, ''),
				COALESCE(s.warranty_date::text, '')
			FROM public.stack_inventory s
			WHERE s.status = 1
			  AND COALESCE(s.device_assigned_status, 0) = 0
			ORDER BY s.id DESC
		`)
		if availableErr != nil {
			response.ServerError(c, availableErr)
			return
		}
		defer availableRows.Close()

		result := []map[string]any{}
		for availableRows.Next() {
			var id int64
			var mrNumber, prNumber, serialNo, category, brand, model string
			var deviceType, vendor, purchaseDate, warrantyDate string

			if err := availableRows.Scan(
				&id, &mrNumber, &prNumber, &serialNo, &category, &brand, &model,
				&deviceType, &vendor, &purchaseDate, &warrantyDate,
			); err != nil {
				response.ServerError(c, err)
				return
			}

			result = append(result, map[string]any{
				"id": id, "emp_id": "", "emp_name": "", "department": "", "designation": "",
				"category": category, "brand": brand, "device_serial": serialNo, "model_no": model,
				"device_type": deviceType, "status": "Available", "assign_date": "",
				"purchase_date": purchaseDate, "warranty_date": warrantyDate,
				"mr_number": mrNumber, "pr_number": prNumber, "vendor": vendor,
				"device_age": "", "warranty_left": "", "assigned_by": "", "remarks": "",
			})
		}
		response.OK(c, result)
		return
	}

	// Assigned and lifecycle states are read from the current asset registry.
	where := "WHERE ad.row_status = 1"
	args := []any{}
	argNo := 1

	statusCode := map[string]int{
		"assigned":           1,
		"damaged":            2,
		"transferred":        3,
		"returned":           4,
		"lost":               5,
		"ownership transfer": 7,
		"claim raised":       8,
		"service request":    15,
	}
	if status != "" {
		if code, ok := statusCode[strings.ToLower(status)]; ok {
			where += fmt.Sprintf(" AND ad.asset_status = $%d", argNo)
			args = append(args, code)
			argNo++
		}
	}

	deviceRows, deviceErr := h.db.Query(
		c.Request.Context(),
		fmt.Sprintf(`
			SELECT
				ad.id,
				ad.emp_id,
				COALESCE(NULLIF(BTRIM(ad.emp_name), ''), e.employee_name),
				COALESCE(NULLIF(BTRIM(ad.department), ''), e.department_name),
				COALESCE(NULLIF(BTRIM(ad.designation), ''), e.designation),
				ad.category,
				ad.brand,
				ad.device_serial,
				ad.model,
				ad.device_type,
				CASE ad.asset_status
					WHEN 0 THEN 'Available'
					WHEN 1 THEN 'Assigned'
					WHEN 2 THEN 'Damaged'
					WHEN 3 THEN 'Transferred'
					WHEN 4 THEN 'Returned'
					WHEN 5 THEN 'Lost'
					WHEN 7 THEN 'Ownership Transfer'
					WHEN 8 THEN 'Claim Raised'
					WHEN 15 THEN 'Service Request'
					ELSE 'Unknown'
				END,
				ad.assigned_date::text,
				ad.warranty_date::text,
				ad.mr_number,
				ad.pr_number,
				COALESCE(v.vendor_name, NULLIF(BTRIM(ad.vendor_name), '')),
				CASE WHEN ad.assigned_date IS NULL THEN ''
					ELSE CONCAT(EXTRACT(DAY FROM (NOW() - ad.assigned_date))::int, ' days') END,
				CASE
					WHEN ad.warranty_date IS NULL THEN ''
					WHEN ad.warranty_date > NOW() THEN CONCAT(EXTRACT(DAY FROM (ad.warranty_date - NOW()))::int, ' days')
					ELSE 'Expired'
				END
			FROM public.asset_devices ad
			LEFT JOIN public.employee_office_info e
				ON BTRIM(e.employee_id) = BTRIM(COALESCE(ad.emp_id, ''))
			LEFT JOIN public.vendors v ON v.id = ad.vendor_id
			%s
			ORDER BY ad.updated_at DESC NULLS LAST, ad.id DESC
		`, where),
		args...,
	)
	if deviceErr != nil {
		response.ServerError(c, deviceErr)
		return
	}
	defer deviceRows.Close()

	result := []map[string]any{}
	for deviceRows.Next() {
		var id int64
		var empID, empName, department, designation *string
		var category, brand, serialNo, modelNo, deviceType *string
		var statusValue string
		var assignDate, warrantyDate, mrNumber, prNumber, vendor, deviceAge, warrantyLeft *string

		if err := deviceRows.Scan(
			&id, &empID, &empName, &department, &designation,
			&category, &brand, &serialNo, &modelNo, &deviceType, &statusValue,
			&assignDate, &warrantyDate, &mrNumber, &prNumber, &vendor, &deviceAge, &warrantyLeft,
		); err != nil {
			response.ServerError(c, err)
			return
		}

		result = append(result, map[string]any{
			"id": id, "emp_id": empID, "emp_name": empName, "department": department,
			"designation": designation, "category": category, "brand": brand,
			"device_serial": serialNo, "model_no": modelNo, "device_type": deviceType,
			"status": statusValue, "assign_date": assignDate, "warranty_date": warrantyDate,
			"mr_number": mrNumber, "pr_number": prNumber, "vendor": vendor,
			"device_age": deviceAge, "warranty_left": warrantyLeft,
			"assigned_by": "", "remarks": "",
		})
	}
	response.OK(c, result)
}

func (h *ReportHandler) Warranty(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT cl.id, cl.reference_no_claim, cl.category, cl.brand, cl.model_no,
		       cl.device_sl_no, cl.claim_status, v.vendor_name,
		       cl.received_date::text, cl.return_date::text, cl.approved_val, cl.created_at::text
		FROM device_claims cl
		LEFT JOIN warranty_vendors v ON v.id=cl.vendor
		WHERE cl.service_type=0 AND cl.status=1 ORDER BY cl.id DESC`)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var id, ref, cs, av int
		var cat, brand, model, serial, vn, rd, ret, ca *string
		rows.Scan(&id, &ref, &cat, &brand, &model, &serial, &cs, &vn, &rd, &ret, &av, &ca)
		res = append(res, map[string]any{
			"id": id, "reference_no": ref, "category": cat, "brand": brand, "model_no": model,
			"device_serial": serial, "claim_status": cs, "vendor_name": vn,
			"received_date": rd, "return_date": ret, "approved_val": av, "created_at": ca,
		})
	}
	if res == nil {
		res = []map[string]any{}
	}
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
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var id, ref, cs, av int
		var cat, brand, model, serial, vn, rd, ret, ca *string
		rows.Scan(&id, &ref, &cat, &brand, &model, &serial, &cs, &vn, &rd, &ret, &av, &ca)
		res = append(res, map[string]any{
			"id": id, "reference_no": ref, "category": cat, "brand": brand, "model_no": model,
			"device_serial": serial, "claim_status": cs, "vendor_name": vn,
			"received_date": rd, "return_date": ret, "approved_val": av, "created_at": ca,
		})
	}
	if res == nil {
		res = []map[string]any{}
	}
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
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var empID, empN string
		var desig, wf, dept, act, pc, oc, em *string
		rows.Scan(&empID, &empN, &desig, &wf, &dept, &act, &pc, &oc, &em)
		res = append(res, map[string]any{
			"employee_id": empID, "employee_name": empN, "designation": desig,
			"work_field": wf, "department": dept, "active": act,
			"personal_cell": pc, "official_cell": oc, "email": em,
		})
	}
	if res == nil {
		res = []map[string]any{}
	}
	response.OK(c, res)
}

func (h *ReportHandler) Disposal(c *gin.Context) {
	rows, err := h.db.Query(c.Request.Context(), `
		SELECT id, department, function_name, device_category, device_sl_no,
		       model, device_status, remarks, created_by, created_at::text
		FROM damage_inventory WHERE status=1 ORDER BY id DESC`)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var id, ds int
		var dept, fn, cat, serial, model, remarks, cb, ca *string
		rows.Scan(&id, &dept, &fn, &cat, &serial, &model, &ds, &remarks, &cb, &ca)
		res = append(res, map[string]any{
			"id": id, "department": dept, "function": fn, "category": cat,
			"device_serial": serial, "model": model, "device_status": ds,
			"remarks": remarks, "created_by": cb, "created_at": ca,
		})
	}
	if res == nil {
		res = []map[string]any{}
	}
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
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var cat *string
		var tot, ass, ins, ret, exp int
		rows.Scan(&cat, &tot, &ass, &ins, &ret, &exp)
		res = append(res, map[string]any{
			"category": cat, "total": tot, "assigned": ass,
			"in_stock": ins, "returned": ret, "warranty_expired": exp,
		})
	}
	if res == nil {
		res = []map[string]any{}
	}
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
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var empID, empN string
		var desig, dept, sepMode, sepDate *string
		var dc int
		rows.Scan(&empID, &empN, &desig, &dept, &sepMode, &sepDate, &dc)
		res = append(res, map[string]any{
			"employee_id": empID, "employee_name": empN, "designation": desig,
			"department": dept, "separation_mode": sepMode, "separation_date": sepDate,
			"assigned_devices": dc,
		})
	}
	if res == nil {
		res = []map[string]any{}
	}
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
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var id int64
		var empID, empN, cat, brand, serial, model, wd, vendor, dl *string
		rows.Scan(&id, &empID, &empN, &cat, &brand, &serial, &model, &wd, &vendor, &dl)
		res = append(res, map[string]any{
			"id": id, "emp_id": empID, "emp_name": empN, "category": cat,
			"brand": brand, "device_serial": serial, "model_no": model,
			"warranty_date": wd, "vendor": vendor, "days_left": dl,
		})
	}
	if res == nil {
		res = []map[string]any{}
	}
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
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()
	var res []map[string]any
	for rows.Next() {
		var id int64
		var empID, empN, cat, brand, serial, model, status, ad, wd, vendor *string
		rows.Scan(&id, &empID, &empN, &cat, &brand, &serial, &model, &status, &ad, &wd, &vendor)
		res = append(res, map[string]any{
			"id": id, "emp_id": empID, "emp_name": empN, "category": cat,
			"brand": brand, "device_serial": serial, "model_no": model, "status": status,
			"assign_date": ad, "warranty_date": wd, "vendor": vendor,
		})
	}
	if res == nil {
		res = []map[string]any{}
	}
	response.OK(c, res)
}

// Today from here

// TroubleTicketITPersonnel returns active IT personnel
// for the Trouble Ticket filter dropdown.
//
// Source:
// employee_office_info
// work_field = 'IT'
// active = 'Yes'
func (h *DashboardHandler) TroubleTicketITPersonnel(c *gin.Context) {
	ctx :=
		c.Request.Context()

	type Personnel struct {
		EmployeeID string `json:"employee_id"`

		EmployeeName string `json:"employee_name"`

		Designation string `json:"designation"`

		Department string `json:"department"`

		WorkField string `json:"work_field"`

		Picture string `json:"picture"`
	}

	rows, err :=
		h.db.Query(
			ctx,
			`
			SELECT
				BTRIM(COALESCE(o.employee_id, '')),
				BTRIM(COALESCE(o.employee_name, '')),
				BTRIM(COALESCE(o.designation, '')),
				BTRIM(COALESCE(o.department_name, '')),
				BTRIM(COALESCE(o.work_field, '')),
				BTRIM(COALESCE(p.picture, ''))

			FROM public.employee_office_info o

			LEFT JOIN public.employee_personal_info p
				ON BTRIM(
					COALESCE(
						p.employee_id,
						''
					)
				) =
				BTRIM(
					COALESCE(
						o.employee_id,
						''
					)
				)

			WHERE
				UPPER(
					BTRIM(
						COALESCE(
							o.work_field,
							''
						)
					)
				) = 'IT'

				AND LOWER(
					BTRIM(
						COALESCE(
							o.active,
							''
						)
					)
				) IN (
					'active',
					'yes'
				)

			ORDER BY
				o.employee_name,
				o.employee_id
			`,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	defer rows.Close()

	items :=
		make(
			[]Personnel,
			0,
		)

	for rows.Next() {
		var item Personnel

		if err :=
			rows.Scan(
				&item.EmployeeID,
				&item.EmployeeName,
				&item.Designation,
				&item.Department,
				&item.WorkField,
				&item.Picture,
			); err != nil {
			response.ServerError(
				c,
				err,
			)
			return
		}

		items =
			append(
				items,
				item,
			)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	response.OK(
		c,
		items,
	)
}

// RequisitionDashboardSummary returns KPI values for the
// Requisition Workflow section on the dashboard.
//
// Approval mapping:
//
//	approved_val NULL / 0 = Approval Pending
//	approved_val 1        = Petty Cash Approved
//	approved_val 2        = Rejected
//	approved_val 3        = PR Approved
//
// status = 1 means the requisition row is active.
func (
	h *DashboardHandler,
) RequisitionDashboardSummary(
	c *gin.Context,
) {
	ctx := c.Request.Context()

	type Summary struct {
		PendingCategories int64 `json:"pending_categories"`

		ApprovalPending int64 `json:"approval_pending"`

		Rejected int64 `json:"rejected"`

		Approved int64 `json:"approved"`

		TotalActive int64 `json:"total_active"`
	}

	const query = `
		SELECT
			/*
				Number of different categories that currently
				have at least one approval-pending requisition.
			*/
			COUNT(
				DISTINCT
				COALESCE(
					NULLIF(
						BTRIM(category),
						''
					),
					'Uncategorized'
				)
			) FILTER (
				WHERE
					COALESCE(
						approved_val,
						0
					) = 0
			)::bigint
				AS pending_categories,

			/*
				Individual requisitions waiting for approval.
			*/
			COUNT(*) FILTER (
				WHERE
					COALESCE(
						approved_val,
						0
					) = 0
			)::bigint
				AS approval_pending,

			/*
				Rejected requisitions.
			*/
			COUNT(*) FILTER (
				WHERE
					approved_val = 2
			)::bigint
				AS rejected,

			/*
				Petty Cash + PR approved.
			*/
			COUNT(*) FILTER (
				WHERE
					approved_val IN (
						1,
						3
					)
			)::bigint
				AS approved,

			/*
				All active requisition records.
			*/
			COUNT(*)::bigint
				AS total_active

		FROM public.tt_reasons

		WHERE
			COALESCE(
				status,
				1
			) = 1
	`

	var result Summary

	if err := h.db.QueryRow(
		ctx,
		query,
	).Scan(
		&result.PendingCategories,
		&result.ApprovalPending,
		&result.Rejected,
		&result.Approved,
		&result.TotalActive,
	); err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	response.OK(
		c,
		result,
	)
}

// RequisitionSummary returns category-wise pending
// requisition totals.
//
// Example:
//
//	Mouse          8
//	RAM-Laptop     3
//	Laptop Battery 1
//
// Only active requisitions waiting for approval are included.
func (
	h *DashboardHandler,
) RequisitionSummary(
	c *gin.Context,
) {
	ctx := c.Request.Context()

	type Item struct {
		Category string `json:"category"`

		PendingCount int64 `json:"pending_count"`
	}

	const query = `
		SELECT
			COALESCE(
				NULLIF(
					BTRIM(category),
					''
				),
				'Uncategorized'
			) AS category,

			COUNT(*)::bigint
				AS pending_count

		FROM public.tt_reasons

		WHERE
			/*
				Only active requisition rows.
			*/
			COALESCE(
				status,
				1
			) = 1

			AND

			/*
				NULL and 0 both mean Approval Pending.
			*/
			COALESCE(
				approved_val,
				0
			) = 0

		GROUP BY
			COALESCE(
				NULLIF(
					BTRIM(category),
					''
				),
				'Uncategorized'
			)

		ORDER BY
			pending_count DESC,

			category ASC
	`

	rows, err := h.db.Query(
		ctx,
		query,
	)

	if err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	defer rows.Close()

	items := make(
		[]Item,
		0,
	)

	for rows.Next() {
		var item Item

		if err := rows.Scan(
			&item.Category,
			&item.PendingCount,
		); err != nil {
			response.ServerError(
				c,
				err,
			)
			return
		}

		items = append(
			items,
			item,
		)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	response.OK(
		c,
		items,
	)
}

// RequisitionList returns detailed IT accessory requisition records.
//
// Supported views:
//
//	all
//	pending
//	rejected
//	approved
//
// Supported filters:
//
//	search
//	category
//	from_date
//	to_date
//
// Pagination:
//
//	page
//	limit
func (
	h *DashboardHandler,
) RequisitionList(
	c *gin.Context,
) {
	ctx := c.Request.Context()

	/* =====================================================
	   PAGINATION
	===================================================== */

	page, err := strconv.Atoi(
		c.DefaultQuery(
			"page",
			"1",
		),
	)

	if err != nil ||
		page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(
		c.DefaultQuery(
			"limit",
			"10",
		),
	)

	if err != nil ||
		limit < 1 {
		limit = 10
	}

	/*
		Prevent accidental huge responses.
	*/
	if limit > 200 {
		limit = 200
	}

	offset :=
		(page - 1) *
			limit

	/* =====================================================
	   REQUEST PARAMETERS
	===================================================== */

	view := strings.ToLower(
		strings.TrimSpace(
			c.DefaultQuery(
				"view",
				"pending",
			),
		),
	)

	search := strings.TrimSpace(
		c.Query(
			"search",
		),
	)

	category := strings.TrimSpace(
		c.Query(
			"category",
		),
	)

	fromDate := strings.TrimSpace(
		c.Query(
			"from_date",
		),
	)

	toDate := strings.TrimSpace(
		c.Query(
			"to_date",
		),
	)

	/* =====================================================
	   BASE WHERE
	===================================================== */

	where := `
		WHERE
			COALESCE(
				reason.status,
				1
			) = 1
	`

	args := make(
		[]any,
		0,
	)

	argNumber := 1

	/* =====================================================
	   VIEW FILTER

	   approved_val:
	   NULL / 0 = Pending
	   1        = Petty Cash
	   2        = Rejected
	   3        = PR
	===================================================== */

	switch view {
	case "",
		"all":

		view = "all"

	case "pending":

		where += `
			AND COALESCE(
				reason.approved_val,
				0
			) = 0
		`

	case "rejected":

		where += `
			AND reason.approved_val = 2
		`

	case "approved":

		where += `
			AND reason.approved_val IN (
				1,
				3
			)
		`

	default:

		response.BadRequest(
			c,
			"view must be all, pending, rejected, or approved",
		)

		return
	}

	/* =====================================================
	   CATEGORY FILTER
	===================================================== */

	if category != "" {
		where += fmt.Sprintf(
			`
			AND BTRIM(
				COALESCE(
					reason.category,
					''
				)
			) = $%d
			`,
			argNumber,
		)

		args = append(
			args,
			category,
		)

		argNumber++
	}

	/* =====================================================
	   FROM DATE

	   tt_reasons.created_at is timestamp without time zone
	   imported from the legacy system.

	   For this dataset direct ::date comparison preserves
	   the legacy calendar date.
	===================================================== */

	if fromDate != "" {
		where += fmt.Sprintf(
			`
			AND reason.created_at::date
				>= $%d::date
			`,
			argNumber,
		)

		args = append(
			args,
			fromDate,
		)

		argNumber++
	}

	/* =====================================================
	   TO DATE
	===================================================== */

	if toDate != "" {
		where += fmt.Sprintf(
			`
			AND reason.created_at::date
				<= $%d::date
			`,
			argNumber,
		)

		args = append(
			args,
			toDate,
		)

		argNumber++
	}

	/* =====================================================
	   SEARCH

	   Searches:
	   - TT No
	   - requester employee ID/name
	   - raised-by ID/name
	   - category
	   - reason
	   - device serial
	   - approved-by
	   - delivered-by
	===================================================== */

	if search != "" {
		searchPlaceholder :=
			fmt.Sprintf(
				"$%d",
				argNumber,
			)

		where += fmt.Sprintf(
			`
			AND (
				COALESCE(
					reason.tt_no,
					''
				) ILIKE %s

				OR COALESCE(
					reason.employee_id,
					''
				) ILIKE %s

				OR COALESCE(
					requester.employee_name,
					''
				) ILIKE %s

				OR COALESCE(
					reason.created_by,
					''
				) ILIKE %s

				OR COALESCE(
					raised_by_employee.employee_name,
					''
				) ILIKE %s

				OR COALESCE(
					reason.category,
					''
				) ILIKE %s

				OR COALESCE(
					reason.reason_details,
					''
				) ILIKE %s

				OR COALESCE(
					reason.device_sl_no,
					''
				) ILIKE %s

				OR COALESCE(
					reason.approved_by,
					''
				) ILIKE %s

				OR COALESCE(
					approved_by_employee.employee_name,
					''
				) ILIKE %s

				OR COALESCE(
					reason.delivered_by,
					''
				) ILIKE %s

				OR COALESCE(
					delivered_by_employee.employee_name,
					''
				) ILIKE %s
			)
			`,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
			searchPlaceholder,
		)

		args = append(
			args,
			"%"+search+"%",
		)

		argNumber++
	}

	/* =====================================================
	   COMMON FROM / JOIN
	===================================================== */

	fromJoin := `
		FROM public.tt_reasons
			AS reason

		/*
			User for whom the accessory is requested.
		*/
		LEFT JOIN public.employee_office_info
			AS requester
			ON BTRIM(
				requester.employee_id
			) =
			BTRIM(
				COALESCE(
					reason.employee_id,
					''
				)
			)

		/*
			Person who raised the requisition.
		*/
		LEFT JOIN public.employee_office_info
			AS raised_by_employee
			ON BTRIM(
				raised_by_employee.employee_id
			) =
			BTRIM(
				COALESCE(
					reason.created_by,
					''
				)
			)

		/*
			Person who approved/rejected the request.
		*/
		LEFT JOIN public.employee_office_info
			AS approved_by_employee
			ON BTRIM(
				approved_by_employee.employee_id
			) =
			BTRIM(
				COALESCE(
					reason.approved_by,
					''
				)
			)

		/*
			Person who delivered the accessory.
		*/
		LEFT JOIN public.employee_office_info
			AS delivered_by_employee
			ON BTRIM(
				delivered_by_employee.employee_id
			) =
			BTRIM(
				COALESCE(
					reason.delivered_by,
					''
				)
			)
	`
	/* =====================================================
	   TOTAL RECORD COUNT

	   Counts unique requisition records after applying:
	   - view filter
	   - category filter
	   - date filters
	   - search filter

	   COUNT(DISTINCT reason.id) is intentionally kept here.
	   It prevents duplicate requisition totals if any of the
	   employee lookup joins produce more than one matching row.
	===================================================== */

	var total int

	countQuery := fmt.Sprintf(
		`
	SELECT
		COUNT(
			DISTINCT reason.id
		)::int AS total

	%s

	%s
	`,
		fromJoin,
		where,
	)

	if err := h.db.QueryRow(
		ctx,
		countQuery,
		args...,
	).Scan(
		&total,
	); err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}
	/* =====================================================
	   RESPONSE STRUCTURE
	===================================================== */

	type RequisitionItem struct {
		ID int64 `json:"id"`

		TTNo string `json:"tt_no"`

		Category string `json:"category"`

		EmployeeID string `json:"employee_id"`

		EmployeeName string `json:"employee_name"`

		ReasonDetails string `json:"reason_details"`

		CreatedBy string `json:"created_by"`

		CreatedByName string `json:"created_by_name"`

		CreatedAt string `json:"created_at"`

		DeviceSerial string `json:"device_sl_no"`

		ApprovedVal int `json:"approved_val"`

		ApprovalStatus string `json:"approval_status"`

		ApprovedBy string `json:"approved_by"`

		ApprovedByName string `json:"approved_by_name"`

		ApprovedDate string `json:"approved_date"`

		DeliveredVal int `json:"delivered_val"`

		DeliveryStatus string `json:"delivery_status"`

		DeliveredBy string `json:"delivered_by"`

		DeliveredByName string `json:"delivered_by_name"`

		DeliveredDate string `json:"delivered_date"`

		DeviceAssignedVal int `json:"device_assigned_val"`

		DeviceAssignedBy string `json:"device_assigned_by"`

		DeviceAssignedDate string `json:"device_assigned_date"`
	}

	/* =====================================================
	   LIST QUERY
	===================================================== */

	listQuery :=
		fmt.Sprintf(
			`
			SELECT 
				reason.id,

				COALESCE(
					reason.tt_no,
					''
				) AS tt_no,

				COALESCE(
					NULLIF(
						BTRIM(
							reason.category
						),
						''
					),
					'Uncategorized'
				) AS category,

				COALESCE(
					reason.employee_id,
					''
				) AS employee_id,

				COALESCE(
					requester.employee_name,
					''
				) AS employee_name,

				COALESCE(
					reason.reason_details,
					''
				) AS reason_details,

				COALESCE(
					reason.created_by,
					''
				) AS created_by,

				COALESCE(
					raised_by_employee.employee_name,
					''
				) AS created_by_name,

				COALESCE(
					reason.created_at::text,
					''
				) AS created_at,

				COALESCE(
					reason.device_sl_no,
					''
				) AS device_sl_no,

				/*
					Null and zero are returned as zero.
				*/
				COALESCE(
					reason.approved_val,
					0
				)::int AS approved_val,

				CASE
					WHEN COALESCE(
						reason.approved_val,
						0
					) = 0
						THEN 'Approval Pending'

					WHEN reason.approved_val = 1
						THEN 'Petty Cash (Approved)'

					WHEN reason.approved_val = 2
						THEN 'Rejected'

					WHEN reason.approved_val = 3
						THEN 'PR (Approved)'

					ELSE 'Unknown'
				END AS approval_status,

				COALESCE(
					reason.approved_by,
					''
				) AS approved_by,

				COALESCE(
					approved_by_employee.employee_name,
					''
				) AS approved_by_name,

				COALESCE(
					reason.approved_date::text,
					''
				) AS approved_date,

				COALESCE(
					reason.delivered_val,
					0
				)::int AS delivered_val,

				CASE
					WHEN reason.delivered_val = 1
						THEN 'Delivered'

					WHEN reason.delivered_val = 2
						THEN 'Rejected'

					WHEN reason.delivered_val = 0
						THEN 'Pending'

					/*
						If not yet delivered but the requisition
						is active, present it as Pending.
					*/
					WHEN reason.delivered_val IS NULL
						THEN 'Pending'

					ELSE ''
				END AS delivery_status,

				COALESCE(
					reason.delivered_by,
					''
				) AS delivered_by,

				COALESCE(
					delivered_by_employee.employee_name,
					''
				) AS delivered_by_name,

				COALESCE(
					reason.delivered_date::text,
					''
				) AS delivered_date,

				COALESCE(
					reason.dev_assigned_val,
					0
				)::int AS device_assigned_val,

				COALESCE(
					reason.dev_assinged_by,
					''
				) AS device_assigned_by,

				COALESCE(
					reason.dev_assigned_date::text,
					''
				) AS device_assigned_date

			%s

			%s

			ORDER BY
				reason.created_at DESC NULLS LAST,

				reason.id DESC

			LIMIT $%d

			OFFSET $%d
			`,
			fromJoin,
			where,
			argNumber,
			argNumber+1,
		)

	listArgs := make(
		[]any,
		0,
		len(args)+2,
	)

	listArgs = append(
		listArgs,
		args...,
	)

	listArgs = append(
		listArgs,
		limit,
		offset,
	)

	rows, err := h.db.Query(
		ctx,
		listQuery,
		listArgs...,
	)

	if err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	defer rows.Close()

	/* =====================================================
	   SCAN RESULTS
	===================================================== */

	items := make(
		[]RequisitionItem,
		0,
		limit,
	)

	for rows.Next() {
		var item RequisitionItem

		if err := rows.Scan(
			&item.ID,

			&item.TTNo,

			&item.Category,

			&item.EmployeeID,

			&item.EmployeeName,

			&item.ReasonDetails,

			&item.CreatedBy,

			&item.CreatedByName,

			&item.CreatedAt,

			&item.DeviceSerial,

			&item.ApprovedVal,

			&item.ApprovalStatus,

			&item.ApprovedBy,

			&item.ApprovedByName,

			&item.ApprovedDate,

			&item.DeliveredVal,

			&item.DeliveryStatus,

			&item.DeliveredBy,

			&item.DeliveredByName,

			&item.DeliveredDate,

			&item.DeviceAssignedVal,

			&item.DeviceAssignedBy,

			&item.DeviceAssignedDate,
		); err != nil {

			response.ServerError(
				c,
				err,
			)

			return
		}

		items = append(
			items,
			item,
		)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(
			c,
			err,
		)
		return
	}

	/* =====================================================
	   RESPONSE
	===================================================== */

	response.Paginated(
		c,
		items,
		total,
		page,
		limit,
	)
}

// UpdateRequisitionApproval performs the final approval action
// for an active requisition.
//
// approved_val:
//
//	1 = Petty Cash (Approved)
//	2 = Rejected
//	3 = PR (Approved)
//
// A requisition can only be approved/rejected once.
func (
	h *DashboardHandler,
) UpdateRequisitionApproval(
	c *gin.Context,
) {
	ctx := c.Request.Context()

	requisitionID, err := strconv.ParseInt(
		strings.TrimSpace(
			c.Param("id"),
		),
		10,
		64,
	)
	if err != nil || requisitionID <= 0 {
		response.BadRequest(
			c,
			"invalid requisition id",
		)
		return
	}

	type Request struct {
		ApprovedVal int `json:"approved_val"`
	}

	var req Request

	if err := c.ShouldBindJSON(
		&req,
	); err != nil {
		response.BadRequest(
			c,
			err.Error(),
		)
		return
	}

	switch req.ApprovedVal {
	case 1, 2, 3:
		// valid
	default:
		response.BadRequest(
			c,
			"approved_val must be 1, 2, or 3",
		)
		return
	}

	userID, ok :=
		middleware.GetCurrentUserID(c)

	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "authentication required",
			},
		)
		return
	}

	employeeID, ok :=
		middleware.GetCurrentEmployeeID(c)

	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "authenticated employee id not found",
			},
		)
		return
	}

	username, ok :=
		middleware.GetCurrentUsername(c)

	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "authenticated username not found",
			},
		)
		return
	}

	roleCode, _ :=
		middleware.GetCurrentRoleCode(c)

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer tx.Rollback(ctx)

	var (
		currentApproved int
		currentStatus   int
	)

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			COALESCE(
				approved_val,
				0
			)::int,

			COALESCE(
				status,
				1
			)::int

		FROM public.tt_reasons

		WHERE id = $1::bigint

		FOR UPDATE
		`,
		requisitionID,
	).Scan(
		&currentApproved,
		&currentStatus,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(
				c,
				"requisition not found",
			)
			return
		}

		response.ServerError(c, err)
		return
	}

	if currentStatus != 1 {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "requisition is not active",
			},
		)
		return
	}

	if currentApproved != 0 {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "requisition approval has already been completed",
			},
		)
		return
	}

	type Result struct {
		ID int64 `json:"id"`

		ApprovedVal int `json:"approved_val"`

		ApprovalStatus string `json:"approval_status"`

		ApprovedBy string `json:"approved_by"`

		ApprovedDate string `json:"approved_date"`
	}

	var result Result

	err = tx.QueryRow(
		ctx,
		`
		UPDATE public.tt_reasons

		SET
			approved_val =
				$1::smallint,

			approved_by =
				$2::varchar(35),

			approved_date =
				CURRENT_TIMESTAMP
					AT TIME ZONE 'Asia/Dhaka',

			edited_by =
				$2::varchar(35),

			edited_at =
				CURRENT_TIMESTAMP
					AT TIME ZONE 'Asia/Dhaka'

		WHERE id = $3::bigint

		RETURNING
			id,

			approved_val::int,

			COALESCE(
				approved_by,
				''
			),

			COALESCE(
				approved_date::text,
				''
			)
		`,
		req.ApprovedVal,
		employeeID,
		requisitionID,
	).Scan(
		&result.ID,
		&result.ApprovedVal,
		&result.ApprovedBy,
		&result.ApprovedDate,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	switch result.ApprovedVal {
	case 1:
		result.ApprovalStatus =
			"Petty Cash (Approved)"

	case 2:
		result.ApprovalStatus =
			"Rejected"

	case 3:
		result.ApprovalStatus =
			"PR (Approved)"
	}

	auditAction :=
		"REQUISITION_APPROVED"

	if result.ApprovedVal == 2 {
		auditAction =
			"REQUISITION_REJECTED"
	}

	_, err = tx.Exec(
		ctx,
		`
		INSERT INTO public.auth_audit_logs (
			user_id,
			employee_id_snapshot,
			username_snapshot,
			action,
			module,
			entity_type,
			entity_id,
			ip_address,
			user_agent,
			success,
			metadata
		)
		VALUES (
			$1,
			$2,
			$3,
			$4,
			'requisition',
			'tt_reason',
			$5,
			NULLIF($6, '')::inet,
			NULLIF($7, ''),
			TRUE,
			jsonb_build_object(
				'approved_val',
				$8::int,

				'role_code',
				$9::text
			)
		)
		`,
		userID,
		employeeID,
		username,
		auditAction,
		strconv.FormatInt(
			requisitionID,
			10,
		),
		strings.TrimSpace(
			c.ClientIP(),
		),
		strings.TrimSpace(
			c.Request.UserAgent(),
		),
		req.ApprovedVal,
		roleCode,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		result,
	)
}

// UpdateRequisitionDelivery performs the final delivery action.
//
// delivered_val:
//
//	1 = Delivered
//	2 = Rejected
//
// Delivery is only allowed after approval:
//
//	1 = Petty Cash Approved
//	3 = PR Approved
//
// A delivery action can only be completed once.
func (
	h *DashboardHandler,
) UpdateRequisitionDelivery(
	c *gin.Context,
) {
	ctx := c.Request.Context()

	requisitionID, err := strconv.ParseInt(
		strings.TrimSpace(
			c.Param("id"),
		),
		10,
		64,
	)

	if err != nil ||
		requisitionID <= 0 {

		response.BadRequest(
			c,
			"invalid requisition id",
		)
		return
	}

	type Request struct {
		DeliveredVal int `json:"delivered_val"`
	}

	var req Request

	if err := c.ShouldBindJSON(
		&req,
	); err != nil {

		response.BadRequest(
			c,
			err.Error(),
		)
		return
	}

	switch req.DeliveredVal {
	case 1, 2:
		// valid
	default:
		response.BadRequest(
			c,
			"delivered_val must be 1 or 2",
		)
		return
	}

	userID, ok :=
		middleware.GetCurrentUserID(c)

	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "authentication required",
			},
		)
		return
	}

	employeeID, ok :=
		middleware.GetCurrentEmployeeID(c)

	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "authenticated employee id not found",
			},
		)
		return
	}

	username, ok :=
		middleware.GetCurrentUsername(c)

	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "authenticated username not found",
			},
		)
		return
	}

	roleCode, _ :=
		middleware.GetCurrentRoleCode(c)

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	defer tx.Rollback(ctx)

	var (
		currentApproved  int
		currentDelivered int
		currentStatus    int
	)

	err = tx.QueryRow(
		ctx,
		`
		SELECT
			COALESCE(
				approved_val,
				0
			)::int,

			COALESCE(
				delivered_val,
				0
			)::int,

			COALESCE(
				status,
				1
			)::int

		FROM public.tt_reasons

		WHERE id = $1::bigint

		FOR UPDATE
		`,
		requisitionID,
	).Scan(
		&currentApproved,
		&currentDelivered,
		&currentStatus,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(
				c,
				"requisition not found",
			)
			return
		}

		response.ServerError(c, err)
		return
	}

	if currentStatus != 1 {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "requisition is not active",
			},
		)
		return
	}

	if currentApproved != 1 &&
		currentApproved != 3 {

		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "requisition must be approved before delivery",
			},
		)
		return
	}

	if currentDelivered != 0 {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "requisition delivery has already been completed",
			},
		)
		return
	}

	type Result struct {
		ID int64 `json:"id"`

		DeliveredVal int `json:"delivered_val"`

		DeliveryStatus string `json:"delivery_status"`

		DeliveredBy string `json:"delivered_by"`

		DeliveredDate string `json:"delivered_date"`
	}

	var result Result

	err = tx.QueryRow(
		ctx,
		`
		UPDATE public.tt_reasons

		SET
			delivered_val =
				$1::smallint,

			delivered_by =
				$2::varchar(35),

			delivered_date =
				CURRENT_TIMESTAMP
					AT TIME ZONE 'Asia/Dhaka',

			edited_by =
				$2::varchar(35),

			edited_at =
				CURRENT_TIMESTAMP
					AT TIME ZONE 'Asia/Dhaka'

		WHERE id = $3::bigint

		RETURNING
			id,

			delivered_val::int,

			COALESCE(
				delivered_by,
				''
			),

			COALESCE(
				delivered_date::text,
				''
			)
		`,
		req.DeliveredVal,
		employeeID,
		requisitionID,
	).Scan(
		&result.ID,
		&result.DeliveredVal,
		&result.DeliveredBy,
		&result.DeliveredDate,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	switch result.DeliveredVal {
	case 1:
		result.DeliveryStatus =
			"Delivered"

	case 2:
		result.DeliveryStatus =
			"Rejected"
	}

	auditAction :=
		"REQUISITION_DELIVERED"

	if result.DeliveredVal == 2 {
		auditAction =
			"REQUISITION_DELIVERY_REJECTED"
	}

	_, err = tx.Exec(
		ctx,
		`
		INSERT INTO public.auth_audit_logs (
			user_id,
			employee_id_snapshot,
			username_snapshot,
			action,
			module,
			entity_type,
			entity_id,
			ip_address,
			user_agent,
			success,
			metadata
		)
		VALUES (
			$1,
			$2,
			$3,
			$4,
			'requisition',
			'tt_reason',
			$5,
			NULLIF($6, '')::inet,
			NULLIF($7, ''),
			TRUE,
			jsonb_build_object(
				'delivered_val',
				$8::int,

				'role_code',
				$9::text
			)
		)
		`,
		userID,
		employeeID,
		username,
		auditAction,
		strconv.FormatInt(
			requisitionID,
			10,
		),
		strings.TrimSpace(
			c.ClientIP(),
		),
		strings.TrimSpace(
			c.Request.UserAgent(),
		),
		req.DeliveredVal,
		roleCode,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		result,
	)
}

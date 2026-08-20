// backend/internal/handler/user_dashboard.go
package handler

import (
	"fmt"
	"strconv"
	"strings"

	"itm-api/internal/middleware"
	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserDashboardHandler struct {
	db *pgxpool.Pool
}

func NewUserDashboardHandler(
	db *pgxpool.Pool,
) *UserDashboardHandler {
	return &UserDashboardHandler{
		db: db,
	}
}

/*
	============================================================
	  ROUTES

	  Required permission:
	  dashboard.self.access

	  Allowed currently:
	  ROOT
	  IT_ADMIN
	  GENERAL_USER

	  Not allowed:
	  IT_PERSONNEL

============================================================
*/
func (
	h *UserDashboardHandler,
) Register(
	rg *gin.RouterGroup,
) {
	g := rg.Group("/user")

	g.Use(
		middleware.RequirePermission(
			h.db,
			"dashboard.self.access",
		),
	)

	g.GET(
		"/dashboard",
		h.Dashboard,
	)

	g.GET(
		"/sidebar-summary",
		h.SidebarSummary,
	)

	g.GET(
		"/trouble-tickets",
		h.TroubleTickets,
	)

	g.GET(
		"/downstream-summary",
		h.DownstreamSummary,
	)

	g.GET(
		"/devices",
		h.Devices,
	)

	g.GET(
		"/device-history",
		h.DeviceHistory,
	)

	g.GET(
		"/downstream-devices",
		h.DownstreamDevices,
	)

	// g.GET(
	// 	"/downstream-employees",
	// 	h.DownstreamEmployees,
	// )

}

/* ============================================================
   TYPES
============================================================ */

type OwnEmployeeProfile struct {
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

type OwnTicketSummary struct {
	Total int64 `json:"total"`

	Open int64 `json:"open"`

	Running int64 `json:"running"`

	Closed int64 `json:"closed"`
}

type OwnDashboardResponse struct {
	Employee OwnEmployeeProfile `json:"employee"`

	Tickets OwnTicketSummary `json:"tickets"`
}

type OwnTroubleTicketItem struct {
	ID int64 `json:"id"`

	TTNo string `json:"tt_no"`

	QueryType string `json:"query_type"`

	Description string `json:"description"`

	Department string `json:"department"`

	AssignedID string `json:"assigned_id"`

	AssignedName string `json:"assigned_name"`

	Status string `json:"status"`

	CreatedAt string `json:"created_at"`
}

type DownstreamEmployeeSummary struct {
	DirectEmployees int64 `json:"direct_employees"`

	AllEmployees int64 `json:"all_employees"`
}

type DownstreamDeviceSummary struct {
	AssignedDevices int64 `json:"assigned_devices"`
}

type DownstreamTicketSummary struct {
	Total int64 `json:"total"`

	Open int64 `json:"open"`

	Running int64 `json:"running"`

	Closed int64 `json:"closed"`
}

type DownstreamSummaryResponse struct {
	Employees DownstreamEmployeeSummary `json:"employees"`

	Devices DownstreamDeviceSummary `json:"devices"`

	Tickets DownstreamTicketSummary `json:"tickets"`
}

/* ============================================================
   STATUS NORMALIZATION

   Current source data contains:
   - status
   - source_status
   - source_progress

   UI requirement:
   - Open
   - Running
   - Closed
============================================================ */

const ownTicketStatusExpression = `
	CASE
		WHEN COALESCE(
			t.source_status,
			CASE
				WHEN LOWER(
					COALESCE(
						t.status,
						''
					)
				) = 'closed'
					THEN 0
				ELSE 1
			END
		) = 0
			THEN 'Closed'

		WHEN COALESCE(
			t.source_progress,
			0
		) = 2
			OR LOWER(
				COALESCE(
					t.status,
					''
				)
			) = 'in progress'
			THEN 'Running'

		ELSE 'Open'
	END
`

/* ============================================================
   GET /api/v1/user/dashboard

   IMPORTANT SECURITY RULE:

   employee_id is taken ONLY from authenticated context.

   The endpoint does NOT accept:
   ?employee_id=...

   Therefore the browser cannot request another employee's
   personal dashboard.
============================================================ */

func (
	h *UserDashboardHandler,
) Dashboard(
	c *gin.Context,
) {
	ctx :=
		c.Request.Context()

	employeeID,
		ok :=
		middleware.GetCurrentEmployeeID(
			c,
		)

	if !ok {
		response.BadRequest(
			c,
			"authenticated employee ID is missing",
		)

		return
	}

	/* ========================================================
	   EMPLOYEE PROFILE

	   The VALUES source guarantees one response row.

	   This is intentional because temporary/test authentication
	   accounts may not yet exist inside employee_office_info.

	   In that case:
	   - employee_id is still returned
	   - employee master fields are empty
	   - endpoint does not fail unnecessarily
	======================================================== */

	var profile OwnEmployeeProfile

	err :=
		h.db.QueryRow(
			ctx,
			`
			SELECT
				auth_employee.employee_id,

				COALESCE(
					office.employee_name,
					''
				),

				COALESCE(
					office.designation,
					''
				),

				COALESCE(
					office.department_name,
					''
				),

				COALESCE(
					office.work_field,
					''
				),

				COALESCE(
					office.sub_function,
					''
				),

				COALESCE(
					office.active,
					''
				),

				COALESCE(
					personal.personal_cell_no,
					''
				),

				COALESCE(
					personal.official_cell_no,
					''
				),

				COALESCE(
					personal.email,
					''
				),

				COALESCE(
					personal.official_email,
					''
				),

				COALESCE(
					personal.picture,
					''
				)

			FROM (
				VALUES (
					$1::text
				)
			) AS auth_employee(
				employee_id
			)

			LEFT JOIN
				public.employee_office_info
					AS office
				ON BTRIM(
					office.employee_id
				) =
				BTRIM(
					auth_employee.employee_id
				)

			LEFT JOIN
				public.employee_personal_info
					AS personal
				ON BTRIM(
					personal.employee_id
				) =
				BTRIM(
					auth_employee.employee_id
				)
			`,
			employeeID,
		).Scan(
			&profile.EmployeeID,
			&profile.EmployeeName,
			&profile.Designation,
			&profile.Department,
			&profile.WorkField,
			&profile.SubFunction,
			&profile.Active,
			&profile.PersonalCell,
			&profile.OfficialCell,
			&profile.Email,
			&profile.OfficialEmail,
			&profile.Picture,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	/* ========================================================
	   OWN TROUBLE TICKET SUMMARY
	======================================================== */

	var ticketSummary OwnTicketSummary

	summarySQL :=
		fmt.Sprintf(
			`
			WITH own_tickets AS (
				SELECT
					%s AS normalized_status

				FROM public.trouble_tickets t

				WHERE BTRIM(
					COALESCE(
						t.employee_id,
						''
					)
				) = BTRIM($1)
			)

			SELECT
				COUNT(*)::bigint,

				COUNT(*) FILTER (
					WHERE normalized_status = 'Open'
				)::bigint,

				COUNT(*) FILTER (
					WHERE normalized_status = 'Running'
				)::bigint,

				COUNT(*) FILTER (
					WHERE normalized_status = 'Closed'
				)::bigint

			FROM own_tickets
			`,
			ownTicketStatusExpression,
		)

	err =
		h.db.QueryRow(
			ctx,
			summarySQL,
			employeeID,
		).Scan(
			&ticketSummary.Total,
			&ticketSummary.Open,
			&ticketSummary.Running,
			&ticketSummary.Closed,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	response.OK(
		c,
		OwnDashboardResponse{
			Employee: profile,
			Tickets:  ticketSummary,
		},
	)
}

/* ============================================================
   GET /api/v1/user/trouble-tickets

   Query params:

   page=1
   limit=20
   status=all|open|running|closed
   search=...

   employee_id is intentionally NOT supported.
============================================================ */

func (
	h *UserDashboardHandler,
) TroubleTickets(
	c *gin.Context,
) {
	ctx :=
		c.Request.Context()

	employeeID,
		ok :=
		middleware.GetCurrentEmployeeID(
			c,
		)

	if !ok {
		response.BadRequest(
			c,
			"authenticated employee ID is missing",
		)

		return
	}

	page,
		err :=
		strconv.Atoi(
			c.DefaultQuery(
				"page",
				"1",
			),
		)

	if err != nil ||
		page < 1 {
		page = 1
	}

	limit,
		err :=
		strconv.Atoi(
			c.DefaultQuery(
				"limit",
				"20",
			),
		)

	if err != nil ||
		limit < 1 {
		limit = 20
	}

	if limit > 100 {
		limit = 100
	}

	status :=
		strings.ToLower(
			strings.TrimSpace(
				c.DefaultQuery(
					"status",
					"all",
				),
			),
		)

	switch status {
	case
		"all",
		"open",
		"running",
		"closed":

	default:
		response.BadRequest(
			c,
			"status must be one of: all, open, running, closed",
		)

		return
	}

	search :=
		strings.TrimSpace(
			c.Query(
				"search",
			),
		)

	offset :=
		(page - 1) *
			limit

	normalizedStatusFilter :=
		""

	args :=
		[]any{
			employeeID,
		}

	placeholder :=
		2

	if status != "all" {
		normalizedStatusFilter =
			fmt.Sprintf(
				`
				AND LOWER(
					own_ticket.normalized_status
				) = $%d
				`,
				placeholder,
			)

		args =
			append(
				args,
				status,
			)

		placeholder++
	}

	searchFilter :=
		""

	if search != "" {
		searchFilter =
			fmt.Sprintf(
				`
				AND (
					COALESCE(
						own_ticket.tt_no,
						''
					) ILIKE $%d

					OR COALESCE(
						own_ticket.query_type,
						''
					) ILIKE $%d

					OR COALESCE(
						own_ticket.description,
						''
					) ILIKE $%d

					OR COALESCE(
						own_ticket.assigned_name,
						''
					) ILIKE $%d
				)
				`,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
			)

		args =
			append(
				args,
				"%"+search+"%",
			)

		placeholder++
	}

	baseSQL :=
		fmt.Sprintf(
			`
			WITH own_ticket AS (
				SELECT
					t.id,

					COALESCE(
						t.tt_no::text,
						''
					) AS tt_no,

					COALESCE(
						t.query_type,
						''
					) AS query_type,

					COALESCE(
						t.description,
						''
					) AS description,

					COALESCE(
						t.department,
						''
					) AS department,

					COALESCE(
						t.assigned_id,
						''
					) AS assigned_id,

					COALESCE(
						t.assigned_name,
						''
					) AS assigned_name,

					%s AS normalized_status,

					COALESCE(
						t.created_at::text,
						''
					) AS created_at

				FROM public.trouble_tickets t

				WHERE BTRIM(
					COALESCE(
						t.employee_id,
						''
					)
				) = BTRIM($1)
			)
			`,
			ownTicketStatusExpression,
		)

	countSQL :=
		fmt.Sprintf(
			`
			%s

			SELECT
				COUNT(*)::bigint

			FROM own_ticket

			WHERE 1 = 1

			%s
			%s
			`,
			baseSQL,
			normalizedStatusFilter,
			searchFilter,
		)

	var total int64

	err =
		h.db.QueryRow(
			ctx,
			countSQL,
			args...,
		).Scan(
			&total,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	listArgs :=
		append(
			[]any{},
			args...,
		)

	listArgs =
		append(
			listArgs,
			limit,
			offset,
		)

	listSQL :=
		fmt.Sprintf(
			`
			%s

			SELECT
				own_ticket.id,
				own_ticket.tt_no,
				own_ticket.query_type,
				own_ticket.description,
				own_ticket.department,
				own_ticket.assigned_id,
				own_ticket.assigned_name,
				own_ticket.normalized_status,
				own_ticket.created_at

			FROM own_ticket

			WHERE 1 = 1

			%s
			%s

			ORDER BY
				own_ticket.created_at DESC,
				own_ticket.id DESC

			LIMIT $%d
			OFFSET $%d
			`,
			baseSQL,
			normalizedStatusFilter,
			searchFilter,
			placeholder,
			placeholder+1,
		)

	rows,
		err :=
		h.db.Query(
			ctx,
			listSQL,
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

	items :=
		make(
			[]OwnTroubleTicketItem,
			0,
		)

	for rows.Next() {
		var item OwnTroubleTicketItem

		if err :=
			rows.Scan(
				&item.ID,
				&item.TTNo,
				&item.QueryType,
				&item.Description,
				&item.Department,
				&item.AssignedID,
				&item.AssignedName,
				&item.Status,
				&item.CreatedAt,
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

	if err :=
		rows.Err(); err != nil {

		response.ServerError(
			c,
			err,
		)

		return
	}

	response.Paginated(
		c,
		items,
		int(total),
		page,
		limit,
	)
}

/* ============================================================
   GET /api/v1/user/downstream-summary

   SECURITY:
   employee_id comes only from authenticated JWT context.

   Downstream rules:
   direct employee:
   tr1 = logged-in employee

   all downstream:
   logged-in employee appears in tr1..tr6
============================================================ */

func (
	h *UserDashboardHandler,
) DownstreamSummary(
	c *gin.Context,
) {
	ctx :=
		c.Request.Context()

	employeeID,
		ok :=
		middleware.GetCurrentEmployeeID(
			c,
		)

	if !ok {
		response.BadRequest(
			c,
			"authenticated employee ID is missing",
		)

		return
	}

	/* ========================================================
	   DOWNSTREAM EMPLOYEES
	======================================================== */

	var employeeSummary DownstreamEmployeeSummary

	err :=
		h.db.QueryRow(
			ctx,
			`
            SELECT
                COUNT(
                    DISTINCT CASE
                        WHEN BTRIM(
                            COALESCE(
                                et.tr1,
                                ''
                            )
                        ) = BTRIM($1)
                        THEN et.employee_id
                    END
                )::bigint AS direct_employees,

                COUNT(
                    DISTINCT et.employee_id
                )::bigint AS all_employees

            FROM public.employee_tier et

            WHERE
                   BTRIM(COALESCE(et.tr1, '')) = BTRIM($1)
                OR BTRIM(COALESCE(et.tr2, '')) = BTRIM($1)
                OR BTRIM(COALESCE(et.tr3, '')) = BTRIM($1)
                OR BTRIM(COALESCE(et.tr4, '')) = BTRIM($1)
                OR BTRIM(COALESCE(et.tr5, '')) = BTRIM($1)
                OR BTRIM(COALESCE(et.tr6, '')) = BTRIM($1)
            `,
			employeeID,
		).Scan(
			&employeeSummary.DirectEmployees,
			&employeeSummary.AllEmployees,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	/* ========================================================
	   DOWNSTREAM ASSIGNED DEVICES

	   Count currently assigned devices owned by downstream
	   employees.

	   Current assigned device rule:
	   row_status = 1
	   asset_status = 1
	======================================================== */

	var deviceSummary DownstreamDeviceSummary

	err =
		h.db.QueryRow(
			ctx,
			`
            WITH downstream_employees AS (
                SELECT DISTINCT
                    BTRIM(
                        COALESCE(
                            et.employee_id,
                            ''
                        )
                    ) AS employee_id

                FROM public.employee_tier et

                WHERE
                       BTRIM(COALESCE(et.tr1, '')) = BTRIM($1)
                    OR BTRIM(COALESCE(et.tr2, '')) = BTRIM($1)
                    OR BTRIM(COALESCE(et.tr3, '')) = BTRIM($1)
                    OR BTRIM(COALESCE(et.tr4, '')) = BTRIM($1)
                    OR BTRIM(COALESCE(et.tr5, '')) = BTRIM($1)
                    OR BTRIM(COALESCE(et.tr6, '')) = BTRIM($1)
            )

            SELECT
                COUNT(*)::bigint

            FROM public.asset_devices ad

            INNER JOIN downstream_employees de
                ON BTRIM(
                    COALESCE(
                        ad.emp_id,
                        ''
                    )
                ) = de.employee_id

            WHERE
                ad.row_status = 1
                AND ad.asset_status = 1
            `,
			employeeID,
		).Scan(
			&deviceSummary.AssignedDevices,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	/* ========================================================
	   DOWNSTREAM TROUBLE TICKETS
	======================================================== */

	var ticketSummary DownstreamTicketSummary

	downstreamTicketSQL :=
		fmt.Sprintf(
			`
            WITH downstream_employees AS (
                SELECT DISTINCT
                    BTRIM(
                        COALESCE(
                            et.employee_id,
                            ''
                        )
                    ) AS employee_id

                FROM public.employee_tier et

                WHERE
                       BTRIM(COALESCE(et.tr1, '')) = BTRIM($1)
                    OR BTRIM(COALESCE(et.tr2, '')) = BTRIM($1)
                    OR BTRIM(COALESCE(et.tr3, '')) = BTRIM($1)
                    OR BTRIM(COALESCE(et.tr4, '')) = BTRIM($1)
                    OR BTRIM(COALESCE(et.tr5, '')) = BTRIM($1)
                    OR BTRIM(COALESCE(et.tr6, '')) = BTRIM($1)
            ),

            downstream_tickets AS (
                SELECT
                    %s AS normalized_status

                FROM public.trouble_tickets t

                INNER JOIN downstream_employees de
                    ON BTRIM(
                        COALESCE(
                            t.employee_id,
                            ''
                        )
                    ) = de.employee_id
            )

            SELECT
                COUNT(*)::bigint,

                COUNT(*) FILTER (
                    WHERE normalized_status = 'Open'
                )::bigint,

                COUNT(*) FILTER (
                    WHERE normalized_status = 'Running'
                )::bigint,

                COUNT(*) FILTER (
                    WHERE normalized_status = 'Closed'
                )::bigint

            FROM downstream_tickets
            `,
			ownTicketStatusExpression,
		)

	err =
		h.db.QueryRow(
			ctx,
			downstreamTicketSQL,
			employeeID,
		).Scan(
			&ticketSummary.Total,
			&ticketSummary.Open,
			&ticketSummary.Running,
			&ticketSummary.Closed,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	response.OK(
		c,
		DownstreamSummaryResponse{
			Employees: employeeSummary,
			Devices:   deviceSummary,
			Tickets:   ticketSummary,
		},
	)
}

type UserSidebarSummary struct {
	DeviceCount int64 `json:"device_count"`

	TicketCount int64 `json:"ticket_count"`
}

/* ============================================================
   GET /api/v1/user/sidebar-summary

   LEFT SIDEBAR ONLY.

   Returns information belonging to the authenticated user:

   - current assigned device count
   - own Trouble Ticket count

   SECURITY:
   employee_id comes only from JWT/context.
============================================================ */

func (
	h *UserDashboardHandler,
) SidebarSummary(
	c *gin.Context,
) {
	ctx :=
		c.Request.Context()

	employeeID,
		ok :=
		middleware.GetCurrentEmployeeID(
			c,
		)

	if !ok {
		response.BadRequest(
			c,
			"authenticated employee ID is missing",
		)

		return
	}

	var summary UserSidebarSummary

	err :=
		h.db.QueryRow(
			ctx,
			`
			SELECT
				(
					SELECT
						COUNT(*)::bigint

					FROM public.asset_devices ad

					WHERE
						ad.row_status = 1

						AND ad.asset_status = 1

						AND BTRIM(
							COALESCE(
								ad.emp_id,
								''
							)
						) = BTRIM($1)
				) AS device_count,

				(
					SELECT
						COUNT(*)::bigint

					FROM public.trouble_tickets t

					WHERE BTRIM(
						COALESCE(
							t.employee_id,
							''
						)
					) = BTRIM($1)
				) AS ticket_count
			`,
			employeeID,
		).Scan(
			&summary.DeviceCount,
			&summary.TicketCount,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	response.OK(
		c,
		summary,
	)
}

type OwnDeviceItem struct {
	ID int64 `json:"id"`

	DeviceSerial string `json:"device_serial"`

	Category string `json:"category"`

	Brand string `json:"brand"`

	Model string `json:"model"`

	EmployeeID string `json:"employee_id"`

	EmployeeName string `json:"employee_name"`

	Department string `json:"department"`

	Designation string `json:"designation"`

	MRNumber string `json:"mr_number"`

	PRNumber string `json:"pr_number"`

	AssignedDate string `json:"assigned_date"`

	PurchaseDate string `json:"purchase_date"`

	WarrantyDate string `json:"warranty_date"`

	Status string `json:"status"`
}

/* ============================================================
   GET /api/v1/user/devices

   Returns current assigned devices belonging ONLY
   to the authenticated employee.

   Query:
   page=1
   limit=20
   search=...

   SECURITY:
   employee_id comes from JWT/context only.
============================================================ */

func (
	h *UserDashboardHandler,
) Devices(
	c *gin.Context,
) {
	ctx :=
		c.Request.Context()

	employeeID,
		ok :=
		middleware.GetCurrentEmployeeID(
			c,
		)

	if !ok {
		response.BadRequest(
			c,
			"authenticated employee ID is missing",
		)

		return
	}

	page,
		err :=
		strconv.Atoi(
			c.DefaultQuery(
				"page",
				"1",
			),
		)

	if err != nil ||
		page < 1 {
		page = 1
	}

	limit,
		err :=
		strconv.Atoi(
			c.DefaultQuery(
				"limit",
				"20",
			),
		)

	if err != nil ||
		limit < 1 {
		limit = 20
	}

	if limit > 100 {
		limit = 100
	}

	search :=
		strings.TrimSpace(
			c.Query(
				"search",
			),
		)

	offset :=
		(page - 1) *
			limit

	args :=
		[]any{
			employeeID,
		}

	searchFilter :=
		""

	if search != "" {
		searchFilter = `
			AND (
				   COALESCE(ad.device_serial, '') ILIKE $2
				OR COALESCE(ad.category, '') ILIKE $2
				OR COALESCE(ad.brand, '') ILIKE $2
				OR COALESCE(ad.model, '') ILIKE $2
				OR COALESCE(ad.mr_number, '') ILIKE $2
				OR COALESCE(ad.pr_number, '') ILIKE $2
			)
		`

		args =
			append(
				args,
				"%"+search+"%",
			)
	}

	/* ========================================================
	   COUNT
	======================================================== */

	countSQL :=
		fmt.Sprintf(
			`
			SELECT
				COUNT(*)::bigint

			FROM public.asset_devices ad

			WHERE
				ad.row_status = 1

				AND ad.asset_status = 1

				AND BTRIM(
					COALESCE(
						ad.emp_id,
						''
					)
				) = BTRIM($1)

				%s
			`,
			searchFilter,
		)

	var total int64

	err =
		h.db.QueryRow(
			ctx,
			countSQL,
			args...,
		).Scan(
			&total,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	/* ========================================================
	   LIST
	======================================================== */

	listArgs :=
		append(
			[]any{},
			args...,
		)

	limitPlaceholder :=
		len(listArgs) + 1

	offsetPlaceholder :=
		len(listArgs) + 2

	listArgs =
		append(
			listArgs,
			limit,
			offset,
		)

	listSQL :=
		fmt.Sprintf(
			`
			SELECT
				ad.id,

				COALESCE(
					ad.device_serial,
					''
				),

				COALESCE(
					ad.category,
					''
				),

				COALESCE(
					ad.brand,
					''
				),

				COALESCE(
					ad.model,
					''
				),

				COALESCE(
					ad.emp_id,
					''
				),

				COALESCE(
					ad.emp_name,
					''
				),

				COALESCE(
					ad.department,
					''
				),

				COALESCE(
					ad.designation,
					''
				),

				COALESCE(
					ad.mr_number,
					''
				),

				COALESCE(
					ad.pr_number,
					''
				),

				COALESCE(
					ad.assigned_date::text,
					''
				),

				COALESCE(
					ad.purchase_date::text,
					''
				),

				COALESCE(
					ad.warranty_date::text,
					''
				),

				'Assigned'::text

			FROM public.asset_devices ad

			WHERE
				ad.row_status = 1

				AND ad.asset_status = 1

				AND BTRIM(
					COALESCE(
						ad.emp_id,
						''
					)
				) = BTRIM($1)

				%s

			ORDER BY
				ad.assigned_date DESC NULLS LAST,
				ad.id DESC

			LIMIT $%d
			OFFSET $%d
			`,
			searchFilter,
			limitPlaceholder,
			offsetPlaceholder,
		)

	rows,
		err :=
		h.db.Query(
			ctx,
			listSQL,
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

	items :=
		make(
			[]OwnDeviceItem,
			0,
		)

	for rows.Next() {
		var item OwnDeviceItem

		err :=
			rows.Scan(
				&item.ID,
				&item.DeviceSerial,
				&item.Category,
				&item.Brand,
				&item.Model,
				&item.EmployeeID,
				&item.EmployeeName,
				&item.Department,
				&item.Designation,
				&item.MRNumber,
				&item.PRNumber,
				&item.AssignedDate,
				&item.PurchaseDate,
				&item.WarrantyDate,
				&item.Status,
			)

		if err != nil {
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

	if err :=
		rows.Err(); err != nil {

		response.ServerError(
			c,
			err,
		)

		return
	}

	response.Paginated(
		c,
		items,
		int(total),
		page,
		limit,
	)
}

type UserDeviceHistoryItem struct {
	ID int64 `json:"id"`

	AssetDeviceID *int64 `json:"asset_device_id"`

	LegacyEquipmentID *int64 `json:"legacy_equipment_id"`

	DeviceSerial string `json:"device_serial"`

	Category string `json:"category"`

	Brand string `json:"brand"`

	Model string `json:"model"`

	DeviceType string `json:"device_type"`

	StatusCode int16 `json:"status_code"`

	StatusLabel string `json:"status_label"`

	RawStatus string `json:"raw_status"`

	PreviousStatus string `json:"previous_status"`

	ReturnStatus string `json:"return_status"`

	TransferStatus string `json:"transfer_status"`

	EmpID string `json:"emp_id"`

	EmpName string `json:"emp_name"`

	Department string `json:"department"`

	Designation string `json:"designation"`

	MRNumber string `json:"mr_number"`

	PRNumber string `json:"pr_number"`

	Vendor string `json:"vendor"`

	AssignedDate string `json:"assigned_date"`

	TransferredAt string `json:"transferred_at"`

	ReturnedAt string `json:"returned_at"`

	HistoryReason string `json:"history_reason"`

	CreatedAt string `json:"created_at"`

	UpdatedAt string `json:"updated_at"`
}

/* ============================================================
   GET /api/v1/user/device-history

   Returns device history ONLY for the authenticated employee.

   Query:
   page=1
   limit=20
   status=all|assigned|transferred|returned
   search=...

   SECURITY:
   employee_id is obtained only from JWT/context.
============================================================ */

func (
	h *UserDashboardHandler,
) DeviceHistory(
	c *gin.Context,
) {
	ctx :=
		c.Request.Context()

	employeeID,
		ok :=
		middleware.GetCurrentEmployeeID(
			c,
		)

	if !ok {
		response.BadRequest(
			c,
			"authenticated employee ID is missing",
		)

		return
	}

	/* ========================================================
	   PAGINATION
	======================================================== */

	page,
		err :=
		strconv.Atoi(
			c.DefaultQuery(
				"page",
				"1",
			),
		)

	if err != nil ||
		page < 1 {
		page = 1
	}

	limit,
		err :=
		strconv.Atoi(
			c.DefaultQuery(
				"limit",
				"20",
			),
		)

	if err != nil ||
		limit < 1 {
		limit = 20
	}

	if limit > 100 {
		limit = 100
	}

	offset :=
		(page - 1) *
			limit

	/* ========================================================
	   FILTERS
	======================================================== */

	status :=
		strings.ToLower(
			strings.TrimSpace(
				c.DefaultQuery(
					"status",
					"all",
				),
			),
		)

	switch status {
	case
		"all",
		"assigned",
		"transferred",
		"returned":

	default:
		response.BadRequest(
			c,
			"status must be one of: all, assigned, transferred, returned",
		)

		return
	}

	search :=
		strings.TrimSpace(
			c.Query(
				"search",
			),
		)

	/* ========================================================
	   BASE QUERY

	   asset_device_history stores historical state.

	   asset_devices is joined only to enrich history with:

	   category
	   brand
	   model
	   device_type
	======================================================== */

	baseSQL := `
		WITH own_history AS (
			SELECT
				h.id,

				h.asset_device_id,

				h.legacy_equipment_id,

				COALESCE(
					NULLIF(
						BTRIM(
							h.device_serial
						),
						''
					),
					NULLIF(
						BTRIM(
							ad.device_serial
						),
						''
					),
					''
				) AS device_serial,

				COALESCE(
					ad.category,
					''
				) AS category,

				COALESCE(
					ad.brand,
					''
				) AS brand,

				COALESCE(
					ad.model,
					''
				) AS model,

				COALESCE(
					ad.device_type,
					''
				) AS device_type,

				COALESCE(
					h.status_code,
					-1
				)::smallint AS status_code,

				CASE h.status_code
					WHEN 0 THEN 'Available'
					WHEN 1 THEN 'Assigned'
					WHEN 2 THEN 'Damaged'
					WHEN 3 THEN 'Transferred'
					WHEN 4 THEN 'Returned'
					WHEN 5 THEN 'Lost'
					WHEN 7 THEN 'Ownership Transfer'
					WHEN 8 THEN 'Claim Raised'
					WHEN 15 THEN 'Service Request'

					ELSE COALESCE(
						NULLIF(
							BTRIM(
								h.raw_status
							),
							''
						),
						'Unknown'
					)
				END AS status_label,

				COALESCE(
					h.raw_status,
					''
				) AS raw_status,

				COALESCE(
					h.previous_status::text,
					''
				) AS previous_status,

				COALESCE(
					h.return_status::text,
					''
				) AS return_status,

				COALESCE(
					h.transfer_status::text,
					''
				) AS transfer_status,

				COALESCE(
					h.emp_id,
					''
				) AS emp_id,

				COALESCE(
					h.emp_name,
					''
				) AS emp_name,

				COALESCE(
					h.department,
					''
				) AS department,

				COALESCE(
					h.designation,
					''
				) AS designation,

				COALESCE(
					h.mr_number,
					''
				) AS mr_number,

				COALESCE(
					h.pr_number,
					''
				) AS pr_number,

				COALESCE(
					h.vendor,
					''
				) AS vendor,

				COALESCE(
					h.assigned_date::text,
					''
				) AS assigned_date,

				COALESCE(
					h.transferred_at::text,
					''
				) AS transferred_at,

				COALESCE(
					h.returned_at::text,
					''
				) AS returned_at,

				COALESCE(
					h.history_reason,
					''
				) AS history_reason,

				COALESCE(
					h.created_at_source::text,
					''
				) AS created_at,

				COALESCE(
					h.updated_at_source::text,
					''
				) AS updated_at,

				h.updated_at_source AS sort_updated_at,

				h.created_at_source AS sort_created_at

			FROM public.asset_device_history h

			LEFT JOIN public.asset_devices ad
				ON ad.id =
					h.asset_device_id

			WHERE BTRIM(
				COALESCE(
					h.emp_id,
					''
				)
			) = BTRIM($1)
		)
	`

	/* ========================================================
	   DYNAMIC FILTERS
	======================================================== */

	args :=
		[]any{
			employeeID,
		}

	placeholder :=
		2

	statusFilter :=
		""

	if status != "all" {
		statusFilter =
			fmt.Sprintf(
				`
				AND LOWER(
					own_history.status_label
				) = $%d
				`,
				placeholder,
			)

		args =
			append(
				args,
				status,
			)

		placeholder++
	}

	searchFilter :=
		""

	if search != "" {
		searchFilter =
			fmt.Sprintf(
				`
				AND (
					   COALESCE(
							own_history.device_serial,
							''
						) ILIKE $%d

					OR COALESCE(
							own_history.category,
							''
						) ILIKE $%d

					OR COALESCE(
							own_history.brand,
							''
						) ILIKE $%d

					OR COALESCE(
							own_history.model,
							''
						) ILIKE $%d

					OR COALESCE(
							own_history.history_reason,
							''
						) ILIKE $%d

					OR COALESCE(
							own_history.pr_number,
							''
						) ILIKE $%d

					OR COALESCE(
							own_history.mr_number,
							''
						) ILIKE $%d
				)
				`,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
			)

		args =
			append(
				args,
				"%"+search+"%",
			)

		placeholder++
	}

	/* ========================================================
	   COUNT
	======================================================== */

	countSQL :=
		fmt.Sprintf(
			`
			%s

			SELECT
				COUNT(*)::bigint

			FROM own_history

			WHERE 1 = 1

			%s
			%s
			`,
			baseSQL,
			statusFilter,
			searchFilter,
		)

	var total int64

	err =
		h.db.QueryRow(
			ctx,
			countSQL,
			args...,
		).Scan(
			&total,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	/* ========================================================
	   LIST
	======================================================== */

	listArgs :=
		append(
			[]any{},
			args...,
		)

	limitPlaceholder :=
		len(listArgs) + 1

	offsetPlaceholder :=
		len(listArgs) + 2

	listArgs =
		append(
			listArgs,
			limit,
			offset,
		)

	listSQL :=
		fmt.Sprintf(
			`
			%s

			SELECT
				own_history.id,

				own_history.asset_device_id,

				own_history.legacy_equipment_id,

				own_history.device_serial,

				own_history.category,

				own_history.brand,

				own_history.model,

				own_history.device_type,

				own_history.status_code,

				own_history.status_label,

				own_history.raw_status,

				own_history.previous_status,

				own_history.return_status,

				own_history.transfer_status,

				own_history.emp_id,

				own_history.emp_name,

				own_history.department,

				own_history.designation,

				own_history.mr_number,

				own_history.pr_number,

				own_history.vendor,

				own_history.assigned_date,

				own_history.transferred_at,

				own_history.returned_at,

				own_history.history_reason,

				own_history.created_at,

				own_history.updated_at

			FROM own_history

			WHERE 1 = 1

			%s
			%s

			ORDER BY
				own_history.sort_updated_at DESC NULLS LAST,
				own_history.sort_created_at DESC NULLS LAST,
				own_history.id DESC

			LIMIT $%d
			OFFSET $%d
			`,
			baseSQL,
			statusFilter,
			searchFilter,
			limitPlaceholder,
			offsetPlaceholder,
		)

	rows,
		err :=
		h.db.Query(
			ctx,
			listSQL,
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

	items :=
		make(
			[]UserDeviceHistoryItem,
			0,
		)

	for rows.Next() {
		var item UserDeviceHistoryItem

		err :=
			rows.Scan(
				&item.ID,
				&item.AssetDeviceID,
				&item.LegacyEquipmentID,
				&item.DeviceSerial,
				&item.Category,
				&item.Brand,
				&item.Model,
				&item.DeviceType,
				&item.StatusCode,
				&item.StatusLabel,
				&item.RawStatus,
				&item.PreviousStatus,
				&item.ReturnStatus,
				&item.TransferStatus,
				&item.EmpID,
				&item.EmpName,
				&item.Department,
				&item.Designation,
				&item.MRNumber,
				&item.PRNumber,
				&item.Vendor,
				&item.AssignedDate,
				&item.TransferredAt,
				&item.ReturnedAt,
				&item.HistoryReason,
				&item.CreatedAt,
				&item.UpdatedAt,
			)

		if err != nil {
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

	if err :=
		rows.Err(); err != nil {

		response.ServerError(
			c,
			err,
		)

		return
	}

	response.Paginated(
		c,
		items,
		int(total),
		page,
		limit,
	)
}

type DownstreamDeviceItem struct {
	ID int64 `json:"id"`

	DeviceSerial string `json:"device_serial"`

	Category string `json:"category"`

	Brand string `json:"brand"`

	Model string `json:"model"`

	EmployeeID string `json:"employee_id"`

	EmployeeName string `json:"employee_name"`

	Department string `json:"department"`

	Designation string `json:"designation"`

	Relationship string `json:"relationship"`

	TierLevel int `json:"tier_level"`

	MRNumber string `json:"mr_number"`

	PRNumber string `json:"pr_number"`

	AssignedDate string `json:"assigned_date"`

	PurchaseDate string `json:"purchase_date"`

	WarrantyDate string `json:"warranty_date"`

	Status string `json:"status"`
}

/* ============================================================
   GET /api/v1/user/downstream-devices

   Returns currently assigned devices belonging to employees
   under the authenticated employee's hierarchy.

   Query:
   page=1
   limit=20
   search=...

   SECURITY:
   employee_id comes ONLY from JWT/context.

   Hierarchy:
   tr1     = Direct
   tr2-tr6 = Indirect
============================================================ */

func (
	h *UserDashboardHandler,
) DownstreamDevices(
	c *gin.Context,
) {
	ctx :=
		c.Request.Context()

	employeeID,
		ok :=
		middleware.GetCurrentEmployeeID(
			c,
		)

	if !ok {
		response.BadRequest(
			c,
			"authenticated employee ID is missing",
		)

		return
	}

	/* ========================================================
	   PAGINATION
	======================================================== */

	page,
		err :=
		strconv.Atoi(
			c.DefaultQuery(
				"page",
				"1",
			),
		)

	if err != nil ||
		page < 1 {
		page = 1
	}

	limit,
		err :=
		strconv.Atoi(
			c.DefaultQuery(
				"limit",
				"20",
			),
		)

	if err != nil ||
		limit < 1 {
		limit = 20
	}

	if limit > 100 {
		limit = 100
	}

	offset :=
		(page - 1) *
			limit

	search :=
		strings.TrimSpace(
			c.Query(
				"search",
			),
		)

	/* ========================================================
	   DOWNSTREAM BASE

	   Uses the same hierarchy rule as DownstreamSummary.

	   MIN(tier_level) is used in case legacy tier data contains
	   more than one hierarchy row for the same employee.
	======================================================== */

	baseSQL := `
		WITH downstream_employees AS (
			SELECT
				BTRIM(
					COALESCE(
						et.employee_id,
						''
					)
				) AS employee_id,

				MIN(
					CASE
						WHEN BTRIM(
							COALESCE(
								et.tr1,
								''
							)
						) = BTRIM($1)
							THEN 1

						WHEN BTRIM(
							COALESCE(
								et.tr2,
								''
							)
						) = BTRIM($1)
							THEN 2

						WHEN BTRIM(
							COALESCE(
								et.tr3,
								''
							)
						) = BTRIM($1)
							THEN 3

						WHEN BTRIM(
							COALESCE(
								et.tr4,
								''
							)
						) = BTRIM($1)
							THEN 4

						WHEN BTRIM(
							COALESCE(
								et.tr5,
								''
							)
						) = BTRIM($1)
							THEN 5

						WHEN BTRIM(
							COALESCE(
								et.tr6,
								''
							)
						) = BTRIM($1)
							THEN 6

						ELSE 99
					END
				)::int AS tier_level

			FROM public.employee_tier et

			WHERE
				NULLIF(
					BTRIM(
						COALESCE(
							et.employee_id,
							''
						)
					),
					''
				) IS NOT NULL

				AND (
					   BTRIM(COALESCE(et.tr1, '')) = BTRIM($1)
					OR BTRIM(COALESCE(et.tr2, '')) = BTRIM($1)
					OR BTRIM(COALESCE(et.tr3, '')) = BTRIM($1)
					OR BTRIM(COALESCE(et.tr4, '')) = BTRIM($1)
					OR BTRIM(COALESCE(et.tr5, '')) = BTRIM($1)
					OR BTRIM(COALESCE(et.tr6, '')) = BTRIM($1)
				)

			GROUP BY
				BTRIM(
					COALESCE(
						et.employee_id,
						''
					)
				)
		),

		downstream_devices AS (
			SELECT
				ad.id,

				COALESCE(
					ad.device_serial,
					''
				) AS device_serial,

				COALESCE(
					ad.category,
					''
				) AS category,

				COALESCE(
					ad.brand,
					''
				) AS brand,

				COALESCE(
					ad.model,
					''
				) AS model,

				COALESCE(
					ad.emp_id,
					''
				) AS employee_id,

				COALESCE(
					NULLIF(
						BTRIM(
							office.employee_name
						),
						''
					),
					NULLIF(
						BTRIM(
							ad.emp_name
						),
						''
					),
					''
				) AS employee_name,

				COALESCE(
					NULLIF(
						BTRIM(
							office.department_name
						),
						''
					),
					NULLIF(
						BTRIM(
							ad.department
						),
						''
					),
					''
				) AS department,

				COALESCE(
					NULLIF(
						BTRIM(
							office.designation
						),
						''
					),
					NULLIF(
						BTRIM(
							ad.designation
						),
						''
					),
					''
				) AS designation,

				CASE
					WHEN de.tier_level = 1
						THEN 'Direct'
					ELSE 'Indirect'
				END AS relationship,

				de.tier_level,

				COALESCE(
					ad.mr_number,
					''
				) AS mr_number,

				COALESCE(
					ad.pr_number,
					''
				) AS pr_number,

				COALESCE(
					ad.assigned_date::text,
					''
				) AS assigned_date,

				COALESCE(
					ad.purchase_date::text,
					''
				) AS purchase_date,

				COALESCE(
					ad.warranty_date::text,
					''
				) AS warranty_date,

				'Assigned'::text AS status,

				ad.assigned_date AS sort_assigned_date

			FROM public.asset_devices ad

			INNER JOIN downstream_employees de
				ON de.employee_id =
					BTRIM(
						COALESCE(
							ad.emp_id,
							''
						)
					)

			LEFT JOIN public.employee_office_info office
				ON BTRIM(
					COALESCE(
						office.employee_id,
						''
					)
				) =
				BTRIM(
					COALESCE(
						ad.emp_id,
						''
					)
				)

			WHERE
				ad.row_status = 1

				AND ad.asset_status = 1
		)
	`

	/* ========================================================
	   SEARCH
	======================================================== */

	args :=
		[]any{
			employeeID,
		}

	searchFilter :=
		""

	if search != "" {
		args =
			append(
				args,
				"%"+search+"%",
			)

		searchFilter = `
			AND (
				   COALESCE(
						downstream_devices.device_serial,
						''
					) ILIKE $2

				OR COALESCE(
						downstream_devices.category,
						''
					) ILIKE $2

				OR COALESCE(
						downstream_devices.brand,
						''
					) ILIKE $2

				OR COALESCE(
						downstream_devices.model,
						''
					) ILIKE $2

				OR COALESCE(
						downstream_devices.employee_id,
						''
					) ILIKE $2

				OR COALESCE(
						downstream_devices.employee_name,
						''
					) ILIKE $2

				OR COALESCE(
						downstream_devices.department,
						''
					) ILIKE $2

				OR COALESCE(
						downstream_devices.designation,
						''
					) ILIKE $2

				OR COALESCE(
						downstream_devices.pr_number,
						''
					) ILIKE $2

				OR COALESCE(
						downstream_devices.mr_number,
						''
					) ILIKE $2
			)
		`
	}

	/* ========================================================
	   COUNT
	======================================================== */

	countSQL :=
		fmt.Sprintf(
			`
			%s

			SELECT
				COUNT(*)::bigint

			FROM downstream_devices

			WHERE 1 = 1

			%s
			`,
			baseSQL,
			searchFilter,
		)

	var total int64

	err =
		h.db.QueryRow(
			ctx,
			countSQL,
			args...,
		).Scan(
			&total,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	/* ========================================================
	   LIST
	======================================================== */

	listArgs :=
		append(
			[]any{},
			args...,
		)

	limitPlaceholder :=
		len(listArgs) + 1

	offsetPlaceholder :=
		len(listArgs) + 2

	listArgs =
		append(
			listArgs,
			limit,
			offset,
		)

	listSQL :=
		fmt.Sprintf(
			`
			%s

			SELECT
				downstream_devices.id,

				downstream_devices.device_serial,

				downstream_devices.category,

				downstream_devices.brand,

				downstream_devices.model,

				downstream_devices.employee_id,

				downstream_devices.employee_name,

				downstream_devices.department,

				downstream_devices.designation,

				downstream_devices.relationship,

				downstream_devices.tier_level,

				downstream_devices.mr_number,

				downstream_devices.pr_number,

				downstream_devices.assigned_date,

				downstream_devices.purchase_date,

				downstream_devices.warranty_date,

				downstream_devices.status

			FROM downstream_devices

			WHERE 1 = 1

			%s

			ORDER BY
				downstream_devices.tier_level ASC,

				downstream_devices.employee_name ASC,

				downstream_devices.sort_assigned_date DESC NULLS LAST,

				downstream_devices.id DESC

			LIMIT $%d
			OFFSET $%d
			`,
			baseSQL,
			searchFilter,
			limitPlaceholder,
			offsetPlaceholder,
		)

	rows,
		err :=
		h.db.Query(
			ctx,
			listSQL,
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

	items :=
		make(
			[]DownstreamDeviceItem,
			0,
		)

	for rows.Next() {
		var item DownstreamDeviceItem

		err :=
			rows.Scan(
				&item.ID,
				&item.DeviceSerial,
				&item.Category,
				&item.Brand,
				&item.Model,
				&item.EmployeeID,
				&item.EmployeeName,
				&item.Department,
				&item.Designation,
				&item.Relationship,
				&item.TierLevel,
				&item.MRNumber,
				&item.PRNumber,
				&item.AssignedDate,
				&item.PurchaseDate,
				&item.WarrantyDate,
				&item.Status,
			)

		if err != nil {
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

	if err :=
		rows.Err(); err != nil {

		response.ServerError(
			c,
			err,
		)

		return
	}

	response.Paginated(
		c,
		items,
		int(total),
		page,
		limit,
	)
}

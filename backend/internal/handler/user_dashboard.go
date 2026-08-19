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

/* ============================================================
   ROUTES

   Required permission:
   dashboard.self.access

   Allowed currently:
   ROOT
   IT_ADMIN
   GENERAL_USER

   Not allowed:
   IT_PERSONNEL
============================================================ */

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
		"/trouble-tickets",
		h.TroubleTickets,
	)
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

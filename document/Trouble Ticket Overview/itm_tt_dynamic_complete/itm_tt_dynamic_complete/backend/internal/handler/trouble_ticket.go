package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TroubleTicketHandler struct {
	db *pgxpool.Pool
}

func NewTroubleTicketHandler(db *pgxpool.Pool) *TroubleTicketHandler {
	return &TroubleTicketHandler{db: db}
}

func (h *TroubleTicketHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/trouble-tickets")

	g.GET("/overview", h.Overview)
	g.GET("", h.List)
	g.GET("/:id/history", h.History)
}

type TroubleTicketOverviewPoint struct {
	Label      string `json:"label"`
	Open       int64  `json:"open"`
	InProgress int64  `json:"in_progress"`
	Closed     int64  `json:"closed"`
}

type TroubleTicketOverview struct {
	Range string                       `json:"range"`
	Total int64                        `json:"total"`
	Items []TroubleTicketOverviewPoint `json:"items"`
}

type TroubleTicketItem struct {
	ID              int64     `json:"id"`
	TTNo            string    `json:"tt_no"`
	EmployeeID      string    `json:"employee_id"`
	EmployeeName    string    `json:"employee_name"`
	AssignedID      string    `json:"assigned_id"`
	AssignedName    string    `json:"assigned_name"`
	QueryType       string    `json:"query_type"`
	RequisitionType string    `json:"requisition_type"`
	Status          string    `json:"status"`
	Department      string    `json:"dept_name"`
	FunctionName    string    `json:"func_name"`
	DeliveredStatus string    `json:"delivered_status"`
	CreatedAt       time.Time `json:"created_at"`
	AgeSeconds      int64     `json:"age_seconds"`
	MobileNo        string    `json:"mobile_no"`
	CompanyName     string    `json:"company_name"`
}

type TroubleTicketHistoryItem struct {
	ID             int64     `json:"id"`
	EventType      string    `json:"event_type"`
	PreviousStatus *string   `json:"previous_status"`
	CurrentStatus  *string   `json:"current_status"`
	Note           *string   `json:"note"`
	AssignedFrom   *string   `json:"assigned_from"`
	AssignedTo     *string   `json:"assigned_to"`
	Department     *string   `json:"department"`
	AttachmentURL  *string   `json:"attachment_url"`
	ChangedBy      *string   `json:"changed_by"`
	CreatedAt      time.Time `json:"created_at"`
}

func (h *TroubleTicketHandler) Overview(c *gin.Context) {
	rangeKey := strings.ToLower(strings.TrimSpace(c.DefaultQuery("range", "7d")))

	switch rangeKey {
	case "7d", "30d", "3m":
	default:
		response.BadRequest(c, "range must be one of: 7d, 30d, 3m")
		return
	}

	const query = `
        WITH config AS (
            SELECT
                CASE $1
                    WHEN '30d' THEN
                        DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')
                        - INTERVAL '29 days'
                    WHEN '3m' THEN
                        DATE_TRUNC('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')
                        - INTERVAL '11 weeks'
                    ELSE
                        DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')
                        - INTERVAL '6 days'
                END AS start_local,

                CASE
                    WHEN $1 = '3m' THEN
                        DATE_TRUNC('week', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')
                    ELSE
                        DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')
                END AS end_local,

                CASE
                    WHEN $1 = '3m' THEN INTERVAL '1 week'
                    ELSE INTERVAL '1 day'
                END AS bucket_step,

                CASE
                    WHEN $1 = '3m' THEN 'week'
                    ELSE 'day'
                END AS bucket_unit
        ),

        buckets AS (
            SELECT
                GENERATE_SERIES(
                    config.start_local,
                    config.end_local,
                    config.bucket_step
                ) AS bucket_start,
                config.bucket_unit,
                config.bucket_step
            FROM config
        ),

        ticket_counts AS (
            SELECT
                CASE
                    WHEN config.bucket_unit = 'week' THEN
                        DATE_TRUNC('week', ticket.created_at AT TIME ZONE 'Asia/Dhaka')
                    ELSE
                        DATE_TRUNC('day', ticket.created_at AT TIME ZONE 'Asia/Dhaka')
                END AS bucket_start,

                COUNT(*) FILTER (
                    WHERE ticket.status IN ('Not Started', 'Open')
                )::BIGINT AS open_count,

                COUNT(*) FILTER (
                    WHERE ticket.status = 'In Progress'
                )::BIGINT AS in_progress_count,

                COUNT(*) FILTER (
                    WHERE ticket.status = 'Closed'
                )::BIGINT AS closed_count

            FROM public.trouble_tickets AS ticket
            CROSS JOIN config

            WHERE ticket.created_at >= config.start_local AT TIME ZONE 'Asia/Dhaka'
              AND ticket.created_at <
                  (config.end_local + config.bucket_step) AT TIME ZONE 'Asia/Dhaka'

            GROUP BY 1
        )

        SELECT
            TO_CHAR(bucket.bucket_start, 'DD Mon') AS label,
            COALESCE(counts.open_count, 0)::BIGINT,
            COALESCE(counts.in_progress_count, 0)::BIGINT,
            COALESCE(counts.closed_count, 0)::BIGINT

        FROM buckets AS bucket

        LEFT JOIN ticket_counts AS counts
            ON counts.bucket_start = bucket.bucket_start

        ORDER BY bucket.bucket_start
    `

	rows, err := h.db.Query(c.Request.Context(), query, rangeKey)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	result := TroubleTicketOverview{
		Range: rangeKey,
		Items: make([]TroubleTicketOverviewPoint, 0),
	}

	for rows.Next() {
		var item TroubleTicketOverviewPoint

		if err := rows.Scan(
			&item.Label,
			&item.Open,
			&item.InProgress,
			&item.Closed,
		); err != nil {
			response.ServerError(c, err)
			return
		}

		result.Total += item.Open + item.InProgress + item.Closed
		result.Items = append(result.Items, item)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}

func (h *TroubleTicketHandler) List(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "100"))
	if err != nil || limit < 1 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}

	status := strings.TrimSpace(c.DefaultQuery("status", "all"))
	search := strings.TrimSpace(c.Query("search"))

	allowedStatus := map[string]bool{
		"all":         true,
		"Not Started": true,
		"Open":        true,
		"In Progress": true,
		"Closed":      true,
	}

	if !allowedStatus[status] {
		response.BadRequest(
			c,
			"status must be one of: all, Not Started, Open, In Progress, Closed",
		)
		return
	}

	offset := (page - 1) * limit

	const countSQL = `
        SELECT COUNT(*)::BIGINT
        FROM public.v_trouble_ticket_dashboard AS ticket
        WHERE ($1 = 'all' OR ticket.status = $1)
          AND (
              $2 = ''
              OR ticket.tt_no ILIKE '%' || $2 || '%'
              OR ticket.employee_id ILIKE '%' || $2 || '%'
              OR ticket.employee_name ILIKE '%' || $2 || '%'
              OR ticket.query_type ILIKE '%' || $2 || '%'
              OR ticket.dept_name ILIKE '%' || $2 || '%'
          )
    `

	var total int
	if err := h.db.QueryRow(
		c.Request.Context(),
		countSQL,
		status,
		search,
	).Scan(&total); err != nil {
		response.ServerError(c, err)
		return
	}

	const listSQL = `
        SELECT
            ticket.id,
            ticket.tt_no,
            ticket.employee_id,
            ticket.employee_name,
            ticket.assigned_id,
            ticket.assigned_name,
            ticket.query_type,
            ticket.requisition_type,
            ticket.status,
            ticket.dept_name,
            ticket.func_name,
            ticket.delivered_status,
            ticket.created_at,
            ticket.age_seconds,
            ticket.mobile_no,
            ticket.company_name

        FROM public.v_trouble_ticket_dashboard AS ticket

        WHERE ($1 = 'all' OR ticket.status = $1)
          AND (
              $2 = ''
              OR ticket.tt_no ILIKE '%' || $2 || '%'
              OR ticket.employee_id ILIKE '%' || $2 || '%'
              OR ticket.employee_name ILIKE '%' || $2 || '%'
              OR ticket.query_type ILIKE '%' || $2 || '%'
              OR ticket.dept_name ILIKE '%' || $2 || '%'
          )

        ORDER BY ticket.created_at DESC, ticket.id DESC
        LIMIT $3 OFFSET $4
    `

	rows, err := h.db.Query(
		c.Request.Context(),
		listSQL,
		status,
		search,
		limit,
		offset,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]TroubleTicketItem, 0)

	for rows.Next() {
		var item TroubleTicketItem

		if err := rows.Scan(
			&item.ID,
			&item.TTNo,
			&item.EmployeeID,
			&item.EmployeeName,
			&item.AssignedID,
			&item.AssignedName,
			&item.QueryType,
			&item.RequisitionType,
			&item.Status,
			&item.Department,
			&item.FunctionName,
			&item.DeliveredStatus,
			&item.CreatedAt,
			&item.AgeSeconds,
			&item.MobileNo,
			&item.CompanyName,
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

	response.Paginated(c, items, total, page, limit)
}

func (h *TroubleTicketHandler) History(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id < 1 {
		response.BadRequest(c, "invalid Trouble Ticket id")
		return
	}

	const query = `
        SELECT
            id,
            event_type,
            previous_status,
            current_status,
            note,
            assigned_from,
            assigned_to,
            department,
            attachment_url,
            changed_by,
            created_at
        FROM public.trouble_ticket_history
        WHERE ticket_id = $1
        ORDER BY created_at DESC, id DESC
    `

	rows, err := h.db.Query(c.Request.Context(), query, id)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]TroubleTicketHistoryItem, 0)

	for rows.Next() {
		var item TroubleTicketHistoryItem

		if err := rows.Scan(
			&item.ID,
			&item.EventType,
			&item.PreviousStatus,
			&item.CurrentStatus,
			&item.Note,
			&item.AssignedFrom,
			&item.AssignedTo,
			&item.Department,
			&item.AttachmentURL,
			&item.ChangedBy,
			&item.CreatedAt,
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

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    items,
	})
}

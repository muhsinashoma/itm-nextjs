// //backend/internal/handler/urgent_tasks.go


// package handler

// import (
// 	"fmt"
// 	"net/http"
// 	"strconv"
// 	"strings"
// 	"time"

// 	"itm-api/pkg/response"

// 	"github.com/gin-gonic/gin"
// 	"github.com/jackc/pgx/v5"
// )

// type urgentTaskRecord struct {
// 	ID              int64      `json:"id"`
// 	Reference       string     `json:"reference"`
// 	Title           string     `json:"title"`
// 	Description     string     `json:"description"`
// 	Priority        string     `json:"priority"`
// 	Status          string     `json:"status"`
// 	DueDate         string     `json:"due_date"`
// 	AssignedTo      string     `json:"assigned_to"`
// 	AssignedToName  string     `json:"assigned_to_name"`
// 	GeneratedBy     string     `json:"generated_by"`
// 	GeneratedByName string     `json:"generated_by_name"`
// 	CreatedAt       time.Time  `json:"created_at"`
// 	UpdatedAt       time.Time  `json:"updated_at"`
// 	CompletedAt     *time.Time `json:"completed_at,omitempty"`
// }

// func normalizeUrgentStatus(value string) (string, bool) {
// 	switch strings.ToLower(strings.TrimSpace(value)) {
// 	case "pending":
// 		return "Pending", true
// 	case "in progress", "inprogress", "in_progress":
// 		return "In Progress", true
// 	case "completed", "complete":
// 		return "Completed", true
// 	default:
// 		return "", false
// 	}
// }

// func normalizeUrgentPriority(value string) (string, bool) {
// 	switch strings.ToLower(strings.TrimSpace(value)) {
// 	case "critical":
// 		return "Critical", true
// 	case "high":
// 		return "High", true
// 	case "medium":
// 		return "Medium", true
// 	case "low":
// 		return "Low", true
// 	default:
// 		return "", false
// 	}
// }

// func (h *DashboardHandler) UrgentTaskList(c *gin.Context) {
// 	ctx := c.Request.Context()

// 	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
// 	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
// 	if page < 1 {
// 		page = 1
// 	}
// 	if limit < 1 {
// 		limit = 50
// 	}
// 	if limit > 200 {
// 		limit = 200
// 	}
// 	offset := (page - 1) * limit

// 	where := []string{"t.deleted_at IS NULL"}
// 	args := make([]any, 0, 8)
// 	arg := 1

// 	if q := strings.TrimSpace(c.Query("search")); q != "" {
// 		args = append(args, "%"+q+"%")
// 		where = append(where, fmt.Sprintf(`(
//             t.reference ILIKE $%d OR
//             t.title ILIKE $%d OR
//             t.description ILIKE $%d OR
//             t.assigned_to ILIKE $%d OR
//             t.assigned_to_name ILIKE $%d OR
//             t.generated_by_name ILIKE $%d
//         )`, arg, arg, arg, arg, arg, arg))
// 		arg++
// 	}

// 	if raw := strings.TrimSpace(c.Query("status")); raw != "" && !strings.EqualFold(raw, "all") {
// 		status, ok := normalizeUrgentStatus(raw)
// 		if !ok {
// 			response.BadRequest(c, "invalid urgent task status")
// 			return
// 		}
// 		args = append(args, status)
// 		where = append(where, fmt.Sprintf("t.status = $%d", arg))
// 		arg++
// 	}

// 	if raw := strings.TrimSpace(c.Query("priority")); raw != "" && !strings.EqualFold(raw, "all") {
// 		priority, ok := normalizeUrgentPriority(raw)
// 		if !ok {
// 			response.BadRequest(c, "invalid urgent task priority")
// 			return
// 		}
// 		args = append(args, priority)
// 		where = append(where, fmt.Sprintf("t.priority = $%d", arg))
// 		arg++
// 	}

// 	whereSQL := strings.Join(where, " AND ")

// 	var total int
// 	if err := h.db.QueryRow(
// 		ctx,
// 		"SELECT COUNT(*) FROM public.urgent_tasks t WHERE "+whereSQL,
// 		args...,
// 	).Scan(&total); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	args = append(args, limit, offset)
// 	limitPos := arg
// 	offsetPos := arg + 1

// 	rows, err := h.db.Query(ctx, fmt.Sprintf(`
//         SELECT
//             t.id,
//             t.reference,
//             t.title,
//             COALESCE(t.description, ''),
//             t.priority,
//             t.status,
//             t.due_date::text,
//             t.assigned_to,
//             t.assigned_to_name,
//             t.generated_by,
//             t.generated_by_name,
//             t.created_at,
//             t.updated_at,
//             t.completed_at
//         FROM public.urgent_tasks t
//         WHERE %s
//         ORDER BY
//             CASE t.status
//                 WHEN 'Pending' THEN 1
//                 WHEN 'In Progress' THEN 2
//                 ELSE 3
//             END,
//             CASE t.priority
//                 WHEN 'Critical' THEN 1
//                 WHEN 'High' THEN 2
//                 WHEN 'Medium' THEN 3
//                 ELSE 4
//             END,
//             t.due_date ASC,
//             t.id DESC
//         LIMIT $%d OFFSET $%d
//     `, whereSQL, limitPos, offsetPos), args...)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	defer rows.Close()

// 	items := make([]urgentTaskRecord, 0)
// 	for rows.Next() {
// 		var item urgentTaskRecord
// 		if err := rows.Scan(
// 			&item.ID,
// 			&item.Reference,
// 			&item.Title,
// 			&item.Description,
// 			&item.Priority,
// 			&item.Status,
// 			&item.DueDate,
// 			&item.AssignedTo,
// 			&item.AssignedToName,
// 			&item.GeneratedBy,
// 			&item.GeneratedByName,
// 			&item.CreatedAt,
// 			&item.UpdatedAt,
// 			&item.CompletedAt,
// 		); err != nil {
// 			response.ServerError(c, err)
// 			return
// 		}
// 		items = append(items, item)
// 	}

// 	if err := rows.Err(); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.Paginated(c, items, total, page, limit)
// }

// func (h *DashboardHandler) UrgentTaskSidebar(c *gin.Context) {
// 	ctx := c.Request.Context()
// 	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
// 	if limit < 1 {
// 		limit = 5
// 	}
// 	if limit > 10 {
// 		limit = 10
// 	}

// 	rows, err := h.db.Query(ctx, `
//         SELECT
//             t.id,
//             t.reference,
//             t.title,
//             COALESCE(t.description, ''),
//             t.priority,
//             t.status,
//             t.due_date::text,
//             t.assigned_to,
//             t.assigned_to_name,
//             t.generated_by,
//             t.generated_by_name,
//             t.created_at,
//             t.updated_at,
//             t.completed_at
//         FROM public.urgent_tasks t
//         WHERE
//             t.deleted_at IS NULL
//             AND t.status IN ('Pending', 'In Progress')
//         ORDER BY
//             CASE t.priority
//                 WHEN 'Critical' THEN 1
//                 WHEN 'High' THEN 2
//                 WHEN 'Medium' THEN 3
//                 ELSE 4
//             END,
//             t.due_date ASC,
//             t.id DESC
//         LIMIT $1
//     `, limit)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	defer rows.Close()

// 	items := make([]urgentTaskRecord, 0)
// 	for rows.Next() {
// 		var item urgentTaskRecord
// 		if err := rows.Scan(
// 			&item.ID,
// 			&item.Reference,
// 			&item.Title,
// 			&item.Description,
// 			&item.Priority,
// 			&item.Status,
// 			&item.DueDate,
// 			&item.AssignedTo,
// 			&item.AssignedToName,
// 			&item.GeneratedBy,
// 			&item.GeneratedByName,
// 			&item.CreatedAt,
// 			&item.UpdatedAt,
// 			&item.CompletedAt,
// 		); err != nil {
// 			response.ServerError(c, err)
// 			return
// 		}
// 		items = append(items, item)
// 	}

// 	if err := rows.Err(); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.OK(c, items)
// }

// func (h *DashboardHandler) CreateUrgentTask(c *gin.Context) {
// 	ctx := c.Request.Context()
// 	actorID := strings.TrimSpace(c.GetString("employee_id"))
// 	if actorID == "" {
// 		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "authenticated employee identity is missing"})
// 		return
// 	}

// 	var req struct {
// 		Title       string `json:"title"`
// 		Description string `json:"description"`
// 		Priority    string `json:"priority"`
// 		Status      string `json:"status"`
// 		DueDate     string `json:"due_date"`
// 		AssignedTo  string `json:"assigned_to"`
// 	}

// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(c, err.Error())
// 		return
// 	}

// 	req.Title = strings.TrimSpace(req.Title)
// 	req.Description = strings.TrimSpace(req.Description)
// 	req.AssignedTo = strings.TrimSpace(req.AssignedTo)

// 	if len(req.Title) < 3 || len(req.Title) > 180 {
// 		response.BadRequest(c, "title must be between 3 and 180 characters")
// 		return
// 	}
// 	if len(req.Description) > 5000 {
// 		response.BadRequest(c, "description cannot exceed 5000 characters")
// 		return
// 	}
// 	if req.AssignedTo == "" {
// 		response.BadRequest(c, "assigned_to is required")
// 		return
// 	}

// 	priority, ok := normalizeUrgentPriority(req.Priority)
// 	if !ok {
// 		response.BadRequest(c, "invalid priority")
// 		return
// 	}
// 	status, ok := normalizeUrgentStatus(req.Status)
// 	if !ok {
// 		response.BadRequest(c, "invalid status")
// 		return
// 	}

// 	dueDate, err := time.Parse("2006-01-02", req.DueDate)
// 	if err != nil {
// 		response.BadRequest(c, "due_date must use YYYY-MM-DD")
// 		return
// 	}

// 	tx, err := h.db.Begin(ctx)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	defer tx.Rollback(ctx)

// 	var assignedName string
// 	err = tx.QueryRow(ctx, `
//         SELECT BTRIM(COALESCE(employee_name, ''))
//         FROM public.employee_office_info
//         WHERE employee_id = $1
//           AND LOWER(BTRIM(COALESCE(work_field, ''))) = 'it'
//           AND LOWER(BTRIM(COALESCE(active, ''))) IN ('active', 'yes')
//         LIMIT 1
//     `, req.AssignedTo).Scan(&assignedName)
// 	if err != nil {
// 		if err == pgx.ErrNoRows {
// 			response.BadRequest(c, "selected employee is not an active IT personnel or does not exist")
// 			return
// 		}
// 		response.ServerError(c, err)
// 		return
// 	}

// 	var actorName string
// 	err = tx.QueryRow(ctx, `
//         SELECT BTRIM(COALESCE(employee_name, ''))
//         FROM public.employee_office_info
//         WHERE employee_id = $1
//         LIMIT 1
//     `, actorID).Scan(&actorName)
// 	if err != nil && err != pgx.ErrNoRows {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if actorName == "" {
// 		actorName = actorID
// 	}

// 	var created urgentTaskRecord
// 	err = tx.QueryRow(ctx, `
//         INSERT INTO public.urgent_tasks (
//             title,
//             description,
//             priority,
//             status,
//             due_date,
//             assigned_to,
//             assigned_to_name,
//             generated_by,
//             generated_by_name,
//             updated_by,
//             completed_at,
//             completed_by
//         ) VALUES (
//             $1::text,
//             NULLIF(BTRIM($2::text), ''),
//             $3::text,
//             $4::text,
//             $5::date,
//             $6::text,
//             $7::text,
//             $8::text,
//             $9::text,
//             $8::text,
//             CASE
//                 WHEN $4::text = 'Completed'
//                 THEN CURRENT_TIMESTAMP
//                 ELSE NULL::timestamptz
//             END,
//             CASE
//                 WHEN $4::text = 'Completed'
//                 THEN $8::text
//                 ELSE NULL::text
//             END
//         )
//         RETURNING
//             id,
//             reference,
//             title,
//             description,
//             priority,
//             status,
//             due_date::text,
//             assigned_to,
//             assigned_to_name,
//             generated_by,
//             generated_by_name,
//             created_at,
//             updated_at,
//             completed_at
//     `,
// 		req.Title,
// 		req.Description,
// 		priority,
// 		status,
// 		dueDate,
// 		req.AssignedTo,
// 		assignedName,
// 		actorID,
// 		actorName,
// 	).Scan(
// 		&created.ID,
// 		&created.Reference,
// 		&created.Title,
// 		&created.Description,
// 		&created.Priority,
// 		&created.Status,
// 		&created.DueDate,
// 		&created.AssignedTo,
// 		&created.AssignedToName,
// 		&created.GeneratedBy,
// 		&created.GeneratedByName,
// 		&created.CreatedAt,
// 		&created.UpdatedAt,
// 		&created.CompletedAt,
// 	)

// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	if err := tx.Commit(ctx); err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.Created(c, created)
// }

// func (h *DashboardHandler) UpdateUrgentTask(c *gin.Context) {
// 	ctx := c.Request.Context()
// 	actorID := strings.TrimSpace(c.GetString("employee_id"))
// 	if actorID == "" {
// 		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "authenticated employee identity is missing"})
// 		return
// 	}

// 	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
// 	if err != nil || id <= 0 {
// 		response.BadRequest(c, "invalid urgent task id")
// 		return
// 	}

// 	var req struct {
// 		Title       string `json:"title"`
// 		Description string `json:"description"`
// 		Priority    string `json:"priority"`
// 		Status      string `json:"status"`
// 		DueDate     string `json:"due_date"`
// 		AssignedTo  string `json:"assigned_to"`
// 	}
// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		response.BadRequest(c, err.Error())
// 		return
// 	}

// 	req.Title = strings.TrimSpace(req.Title)
// 	req.Description = strings.TrimSpace(req.Description)
// 	req.AssignedTo = strings.TrimSpace(req.AssignedTo)
// 	if len(req.Title) < 3 || len(req.Title) > 180 || req.AssignedTo == "" {
// 		response.BadRequest(c, "invalid task title or assignee")
// 		return
// 	}

// 	priority, ok := normalizeUrgentPriority(req.Priority)
// 	if !ok {
// 		response.BadRequest(c, "invalid priority")
// 		return
// 	}
// 	status, ok := normalizeUrgentStatus(req.Status)
// 	if !ok {
// 		response.BadRequest(c, "invalid status")
// 		return
// 	}
// 	dueDate, err := time.Parse("2006-01-02", req.DueDate)
// 	if err != nil {
// 		response.BadRequest(c, "due_date must use YYYY-MM-DD")
// 		return
// 	}

// 	var assignedName string
// 	err = h.db.QueryRow(ctx, `
//         SELECT BTRIM(COALESCE(employee_name, ''))
//         FROM public.employee_office_info
//         WHERE employee_id = $1
//           AND LOWER(BTRIM(COALESCE(work_field, ''))) = 'it'
//           AND LOWER(BTRIM(COALESCE(active, ''))) IN ('active', 'yes')
//         LIMIT 1
//     `, req.AssignedTo).Scan(&assignedName)
// 	if err != nil {
// 		if err == pgx.ErrNoRows {
// 			response.BadRequest(c, "selected employee is not an active IT personnel or does not exist")
// 			return
// 		}
// 		response.ServerError(c, err)
// 		return
// 	}

// 	cmd, err := h.db.Exec(ctx, `
//         UPDATE public.urgent_tasks
//         SET
//             title = $1::text,
//             description = NULLIF(BTRIM($2::text), ''),
//             priority = $3::text,
//             status = $4::text,
//             due_date = $5::date,
//             assigned_to = $6::text,
//             assigned_to_name = $7::text,
//             updated_by = $8::text,
//             updated_at = CURRENT_TIMESTAMP,
//             completed_at = CASE
//                 WHEN $4::text = 'Completed'
//                 THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
//                 ELSE NULL::timestamptz
//             END,
//             completed_by = CASE
//                 WHEN $4::text = 'Completed'
//                 THEN COALESCE(completed_by, $8::text)
//                 ELSE NULL::text
//             END
//         WHERE id = $9::bigint
//           AND deleted_at IS NULL
//     `,
// 		req.Title,
// 		req.Description,
// 		priority,
// 		status,
// 		dueDate,
// 		req.AssignedTo,
// 		assignedName,
// 		actorID,
// 		id,
// 	)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if cmd.RowsAffected() == 0 {
// 		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "urgent task not found"})
// 		return
// 	}

// 	response.OK(c, gin.H{"updated": true})
// }

// func (h *DashboardHandler) DeleteUrgentTask(c *gin.Context) {
// 	actorID := strings.TrimSpace(c.GetString("employee_id"))
// 	if actorID == "" {
// 		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "authenticated employee identity is missing"})
// 		return
// 	}

// 	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
// 	if err != nil || id <= 0 {
// 		response.BadRequest(c, "invalid urgent task id")
// 		return
// 	}

// 	cmd, err := h.db.Exec(c.Request.Context(), `
//         UPDATE public.urgent_tasks
//         SET deleted_at = CURRENT_TIMESTAMP,
//             deleted_by = $1,
//             updated_at = CURRENT_TIMESTAMP,
//             updated_by = $1
//         WHERE id = $2 AND deleted_at IS NULL
//     `, actorID, id)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}
// 	if cmd.RowsAffected() == 0 {
// 		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "urgent task not found"})
// 		return
// 	}

// 	response.NoContent(c)
// }

 //backend/internal/handler/urgent_tasks.go

package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type urgentTaskRecord struct {
	ID              int64      `json:"id"`
	Reference       string     `json:"reference"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Priority        string     `json:"priority"`
	Status          string     `json:"status"`
	DueDate         string     `json:"due_date"`
	AssignedTo      string     `json:"assigned_to"`
	AssignedToName  string     `json:"assigned_to_name"`
	GeneratedBy     string     `json:"generated_by"`
	GeneratedByName string     `json:"generated_by_name"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	CompletedAt     *time.Time `json:"completed_at,omitempty"`
}

func normalizeUrgentStatus(value string) (string, bool) {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "pending":
		return "Pending", true
	case "in progress", "inprogress", "in_progress":
		return "In Progress", true
	case "completed", "complete":
		return "Completed", true
	default:
		return "", false
	}
}

func normalizeUrgentPriority(value string) (string, bool) {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "critical":
		return "Critical", true
	case "high":
		return "High", true
	case "medium":
		return "Medium", true
	case "low":
		return "Low", true
	default:
		return "", false
	}
}

func (h *DashboardHandler) UrgentTaskList(c *gin.Context) {
	ctx := c.Request.Context()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	offset := (page - 1) * limit

	where := []string{"t.deleted_at IS NULL"}
	args := make([]any, 0, 8)
	arg := 1

	if q := strings.TrimSpace(c.Query("search")); q != "" {
		args = append(args, "%"+q+"%")
		where = append(where, fmt.Sprintf(`(
            t.reference ILIKE $%d OR
            t.title ILIKE $%d OR
            t.description ILIKE $%d OR
            t.assigned_to ILIKE $%d OR
            t.assigned_to_name ILIKE $%d OR
            t.generated_by_name ILIKE $%d
        )`, arg, arg, arg, arg, arg, arg))
		arg++
	}

	if raw := strings.TrimSpace(c.Query("status")); raw != "" && !strings.EqualFold(raw, "all") {
		status, ok := normalizeUrgentStatus(raw)
		if !ok {
			response.BadRequest(c, "invalid urgent task status")
			return
		}
		args = append(args, status)
		where = append(where, fmt.Sprintf("t.status = $%d", arg))
		arg++
	}

	if raw := strings.TrimSpace(c.Query("priority")); raw != "" && !strings.EqualFold(raw, "all") {
		priority, ok := normalizeUrgentPriority(raw)
		if !ok {
			response.BadRequest(c, "invalid urgent task priority")
			return
		}
		args = append(args, priority)
		where = append(where, fmt.Sprintf("t.priority = $%d", arg))
		arg++
	}

	whereSQL := strings.Join(where, " AND ")

	var total int
	if err := h.db.QueryRow(
		ctx,
		"SELECT COUNT(*) FROM public.urgent_tasks t WHERE "+whereSQL,
		args...,
	).Scan(&total); err != nil {
		response.ServerError(c, err)
		return
	}

	args = append(args, limit, offset)
	limitPos := arg
	offsetPos := arg + 1

	rows, err := h.db.Query(ctx, fmt.Sprintf(`
        SELECT
            t.id,
            t.reference,
            t.title,
            COALESCE(t.description, ''),
            t.priority,
            t.status,
            t.due_date::text,
            t.assigned_to,
            t.assigned_to_name,
            t.generated_by,
            t.generated_by_name,
            t.created_at,
            t.updated_at,
            t.completed_at
        FROM public.urgent_tasks t
        WHERE %s
        ORDER BY
            CASE t.status
                WHEN 'Pending' THEN 1
                WHEN 'In Progress' THEN 2
                ELSE 3
            END,
            CASE t.priority
                WHEN 'Critical' THEN 1
                WHEN 'High' THEN 2
                WHEN 'Medium' THEN 3
                ELSE 4
            END,
            t.due_date ASC,
            t.id DESC
        LIMIT $%d OFFSET $%d
    `, whereSQL, limitPos, offsetPos), args...)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]urgentTaskRecord, 0)
	for rows.Next() {
		var item urgentTaskRecord
		if err := rows.Scan(
			&item.ID,
			&item.Reference,
			&item.Title,
			&item.Description,
			&item.Priority,
			&item.Status,
			&item.DueDate,
			&item.AssignedTo,
			&item.AssignedToName,
			&item.GeneratedBy,
			&item.GeneratedByName,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.CompletedAt,
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

func (h *DashboardHandler) UrgentTaskSidebar(c *gin.Context) {
	ctx := c.Request.Context()
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "5"))
	if limit < 1 {
		limit = 5
	}
	if limit > 10 {
		limit = 10
	}

	rows, err := h.db.Query(ctx, `
        SELECT
            t.id,
            t.reference,
            t.title,
            COALESCE(t.description, ''),
            t.priority,
            t.status,
            t.due_date::text,
            t.assigned_to,
            t.assigned_to_name,
            t.generated_by,
            t.generated_by_name,
            t.created_at,
            t.updated_at,
            t.completed_at
        FROM public.urgent_tasks t
        WHERE
            t.deleted_at IS NULL
            AND t.status IN ('Pending', 'In Progress')
        ORDER BY
            CASE t.priority
                WHEN 'Critical' THEN 1
                WHEN 'High' THEN 2
                WHEN 'Medium' THEN 3
                ELSE 4
            END,
            t.due_date ASC,
            t.id DESC
        LIMIT $1
    `, limit)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]urgentTaskRecord, 0)
	for rows.Next() {
		var item urgentTaskRecord
		if err := rows.Scan(
			&item.ID,
			&item.Reference,
			&item.Title,
			&item.Description,
			&item.Priority,
			&item.Status,
			&item.DueDate,
			&item.AssignedTo,
			&item.AssignedToName,
			&item.GeneratedBy,
			&item.GeneratedByName,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.CompletedAt,
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

func (h *DashboardHandler) CreateUrgentTask(c *gin.Context) {
	ctx := c.Request.Context()
	actorID := strings.TrimSpace(c.GetString("employee_id"))
	if actorID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "authenticated employee identity is missing"})
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Priority    string `json:"priority"`
		Status      string `json:"status"`
		DueDate     string `json:"due_date"`
		AssignedTo  string `json:"assigned_to"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	req.AssignedTo = strings.TrimSpace(req.AssignedTo)

	if len(req.Title) < 3 || len(req.Title) > 180 {
		response.BadRequest(c, "title must be between 3 and 180 characters")
		return
	}
	if len(req.Description) > 5000 {
		response.BadRequest(c, "description cannot exceed 5000 characters")
		return
	}
	if req.AssignedTo == "" {
		response.BadRequest(c, "assigned_to is required")
		return
	}

	priority, ok := normalizeUrgentPriority(req.Priority)
	if !ok {
		response.BadRequest(c, "invalid priority")
		return
	}
	status, ok := normalizeUrgentStatus(req.Status)
	if !ok {
		response.BadRequest(c, "invalid status")
		return
	}

	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		response.BadRequest(c, "due_date must use YYYY-MM-DD")
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var assignedName string
	err = tx.QueryRow(ctx, `
        SELECT BTRIM(COALESCE(employee_name, ''))
        FROM public.employee_office_info
        WHERE employee_id = $1
          AND LOWER(BTRIM(COALESCE(work_field, ''))) = 'it'
          AND LOWER(BTRIM(COALESCE(active, ''))) IN ('active', 'yes')
        LIMIT 1
    `, req.AssignedTo).Scan(&assignedName)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.BadRequest(c, "selected employee is not an active IT personnel or does not exist")
			return
		}
		response.ServerError(c, err)
		return
	}

	var actorName string
	err = tx.QueryRow(ctx, `
        SELECT BTRIM(COALESCE(employee_name, ''))
        FROM public.employee_office_info
        WHERE employee_id = $1
        LIMIT 1
    `, actorID).Scan(&actorName)
	if err != nil && err != pgx.ErrNoRows {
		response.ServerError(c, err)
		return
	}
	if actorName == "" {
		actorName = actorID
	}

	var created urgentTaskRecord
	err = tx.QueryRow(ctx, `
        INSERT INTO public.urgent_tasks (
            title,
            description,
            priority,
            status,
            due_date,
            assigned_to,
            assigned_to_name,
            generated_by,
            generated_by_name,
            updated_by,
            completed_at,
            completed_by
        ) VALUES (
            $1::text,
            NULLIF(BTRIM($2::text), ''),
            $3::text,
            $4::text,
            $5::date,
            $6::text,
            $7::text,
            $8::text,
            $9::text,
            $8::text,
            CASE
                WHEN $4::text = 'Completed'
                THEN CURRENT_TIMESTAMP
                ELSE NULL::timestamptz
            END,
            CASE
                WHEN $4::text = 'Completed'
                THEN $8::text
                ELSE NULL::text
            END
        )
        RETURNING
            id,
            reference,
            title,
            description,
            priority,
            status,
            due_date::text,
            assigned_to,
            assigned_to_name,
            generated_by,
            generated_by_name,
            created_at,
            updated_at,
            completed_at
    `,
		req.Title,
		req.Description,
		priority,
		status,
		dueDate,
		req.AssignedTo,
		assignedName,
		actorID,
		actorName,
	).Scan(
		&created.ID,
		&created.Reference,
		&created.Title,
		&created.Description,
		&created.Priority,
		&created.Status,
		&created.DueDate,
		&created.AssignedTo,
		&created.AssignedToName,
		&created.GeneratedBy,
		&created.GeneratedByName,
		&created.CreatedAt,
		&created.UpdatedAt,
		&created.CompletedAt,
	)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	// Task creation and assignee notification are committed together.
	_, err = tx.Exec(
		ctx,
		`
		INSERT INTO public.app_notifications (
			recipient_employee_id,
			actor_employee_id,
			notification_type,
			title,
			message,
			entity_type,
			entity_id,
			entity_reference,
			action_url
		)
		VALUES (
			$1::text,
			$2::text,
			'URGENT_TASK_ASSIGNED',
			'New urgent task assigned',
			$3::text,
			'urgent_task',
			$4::bigint,
			$5::text,
			'/dashboard/urgent/list'
		)
		`,
		req.AssignedTo,
		actorID,
		created.Reference+" · "+created.Title,
		created.ID,
		created.Reference,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.Created(c, created)
}

func (h *DashboardHandler) UpdateUrgentTask(c *gin.Context) {
	ctx := c.Request.Context()
	actorID := strings.TrimSpace(c.GetString("employee_id"))
	if actorID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "authenticated employee identity is missing"})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid urgent task id")
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Priority    string `json:"priority"`
		Status      string `json:"status"`
		DueDate     string `json:"due_date"`
		AssignedTo  string `json:"assigned_to"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.Description = strings.TrimSpace(req.Description)
	req.AssignedTo = strings.TrimSpace(req.AssignedTo)
	if len(req.Title) < 3 || len(req.Title) > 180 || req.AssignedTo == "" {
		response.BadRequest(c, "invalid task title or assignee")
		return
	}

	priority, ok := normalizeUrgentPriority(req.Priority)
	if !ok {
		response.BadRequest(c, "invalid priority")
		return
	}
	status, ok := normalizeUrgentStatus(req.Status)
	if !ok {
		response.BadRequest(c, "invalid status")
		return
	}
	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		response.BadRequest(c, "due_date must use YYYY-MM-DD")
		return
	}

	var assignedName string
	err = h.db.QueryRow(ctx, `
        SELECT BTRIM(COALESCE(employee_name, ''))
        FROM public.employee_office_info
        WHERE employee_id = $1
          AND LOWER(BTRIM(COALESCE(work_field, ''))) = 'it'
          AND LOWER(BTRIM(COALESCE(active, ''))) IN ('active', 'yes')
        LIMIT 1
    `, req.AssignedTo).Scan(&assignedName)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.BadRequest(c, "selected employee is not an active IT personnel or does not exist")
			return
		}
		response.ServerError(c, err)
		return
	}

	cmd, err := h.db.Exec(ctx, `
        UPDATE public.urgent_tasks
        SET
            title = $1::text,
            description = NULLIF(BTRIM($2::text), ''),
            priority = $3::text,
            status = $4::text,
            due_date = $5::date,
            assigned_to = $6::text,
            assigned_to_name = $7::text,
            updated_by = $8::text,
            updated_at = CURRENT_TIMESTAMP,
            completed_at = CASE
                WHEN $4::text = 'Completed'
                THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
                ELSE NULL::timestamptz
            END,
            completed_by = CASE
                WHEN $4::text = 'Completed'
                THEN COALESCE(completed_by, $8::text)
                ELSE NULL::text
            END
        WHERE id = $9::bigint
          AND deleted_at IS NULL
    `,
		req.Title,
		req.Description,
		priority,
		status,
		dueDate,
		req.AssignedTo,
		assignedName,
		actorID,
		id,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if cmd.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "urgent task not found"})
		return
	}

	response.OK(c, gin.H{"updated": true})
}

func (h *DashboardHandler) DeleteUrgentTask(c *gin.Context) {
	actorID := strings.TrimSpace(c.GetString("employee_id"))
	if actorID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "authenticated employee identity is missing"})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid urgent task id")
		return
	}

	cmd, err := h.db.Exec(c.Request.Context(), `
        UPDATE public.urgent_tasks
        SET deleted_at = CURRENT_TIMESTAMP,
            deleted_by = $1,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $1
        WHERE id = $2 AND deleted_at IS NULL
    `, actorID, id)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	if cmd.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "urgent task not found"})
		return
	}

	response.NoContent(c)
}

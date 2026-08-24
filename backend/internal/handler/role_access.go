
//backend/internal/handler/role_access.go

package handler

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"itm-api/internal/middleware"
	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

/* ============================================================
   CONFIGURATION
============================================================ */

const (
	roleAccessTimeout         = 8 * time.Second
	roleAccessDefaultPageSize = 20
	roleAccessMaxPageSize     = 100
)

/* ============================================================
   HANDLER
============================================================ */

type RoleAccessHandler struct {
	db *pgxpool.Pool
}

func NewRoleAccessHandler(
	db *pgxpool.Pool,
) *RoleAccessHandler {
	return &RoleAccessHandler{
		db: db,
	}
}

/* ============================================================
   ROUTES

   All Role Access APIs require:
       roles.manage

   Final routes:

   GET
   /api/v1/admin/role-access/overview

   GET
   /api/v1/admin/role-access/roles

   GET
   /api/v1/admin/role-access/permissions

   GET
   /api/v1/admin/role-access/users

   PUT
   /api/v1/admin/role-access/users/:id/role

   PUT
   /api/v1/admin/role-access/roles/:id/permissions
============================================================ */

func (
	h *RoleAccessHandler,
) Register(
	rg *gin.RouterGroup,
) {
	g :=
		rg.Group(
			"/admin/role-access",
		)

	g.Use(
		middleware.RequirePermission(
			h.db,
			"roles.manage",
		),
	)

	g.GET(
		"/overview",
		h.Overview,
	)

	g.GET(
		"/roles",
		h.Roles,
	)

	g.GET(
		"/permissions",
		h.Permissions,
	)

	g.GET(
		"/users",
		h.Users,
	)

	g.PUT(
		"/users/:id/role",
		h.UpdateUserRole,
	)

	g.PUT(
		"/roles/:id/permissions",
		h.UpdateRolePermissions,
	)
}

/* ============================================================
   RESPONSE TYPES
============================================================ */

type RoleAccessOverview struct {
	TotalRoles       int64 `json:"total_roles"`
	TotalPermissions int64 `json:"total_permissions"`
	TotalUsers       int64 `json:"total_users"`
	PrivilegedUsers  int64 `json:"privileged_users"`
}

type RoleAccessPermission struct {
	ID     int    `json:"id"`
	Code   string `json:"code"`
	Name   string `json:"name"`
	Active bool   `json:"active"`
}

type RoleAccessRole struct {
	ID             int                    `json:"id"`
	Code           string                 `json:"code"`
	Name           string                 `json:"name"`
	LegacyUserType int                    `json:"legacy_user_type"`
	HierarchyLevel int                    `json:"hierarchy_level"`
	Active         bool                   `json:"active"`
	UserCount      int64                  `json:"user_count"`
	Protected      bool                   `json:"protected"`
	Permissions    []RoleAccessPermission `json:"permissions"`
}

type RoleAccessUser struct {
	ID            int    `json:"id"`
	Username      string `json:"username"`
	EmployeeID    string `json:"employee_id"`
	FullName      string `json:"full_name"`
	Email         string `json:"email"`
	UserType      int    `json:"user_type"`
	RoleID        int    `json:"role_id"`
	RoleCode      string `json:"role_code"`
	RoleName      string `json:"role_name"`
	AccountStatus string `json:"account_status"`
	Active        bool   `json:"active"`
	Protected     bool   `json:"protected"`
}

/* ============================================================
   HELPERS
============================================================ */

func normalizeRoleCode(
	value string,
) string {
	return strings.ToUpper(
		strings.TrimSpace(
			value,
		),
	)
}

func isRootRole(
	value string,
) bool {
	return normalizeRoleCode(
		value,
	) == "ROOT"
}

func requiredBaselinePermission(
	roleCode string,
) string {
	switch normalizeRoleCode(
		roleCode,
	) {
	case "IT_ADMIN":
		return "panel.admin.access"

	case "IT_PERSONNEL":
		return "panel.staff.access"

	case "GENERAL_USER":
		return "dashboard.self.access"

	default:
		return ""
	}
}

func deduplicatePositiveIDs(
	input []int,
) []int {
	result :=
		make(
			[]int,
			0,
			len(input),
		)

	seen :=
		make(
			map[int]struct{},
		)

	for _, id := range input {

		if id <= 0 {
			continue
		}

		if _, exists :=
			seen[id]; exists {
			continue
		}

		seen[id] =
			struct{}{}

		result =
			append(
				result,
				id,
			)
	}

	return result
}

func parseRoleAccessPagination(
	c *gin.Context,
) (
	page int,
	limit int,
) {
	page,
		_ =
		strconv.Atoi(
			c.DefaultQuery(
				"page",
				"1",
			),
		)

	if page < 1 {
		page = 1
	}

	limit,
		_ =
		strconv.Atoi(
			c.DefaultQuery(
				"limit",
				strconv.Itoa(
					roleAccessDefaultPageSize,
				),
			),
		)

	if limit < 1 {
		limit =
			roleAccessDefaultPageSize
	}

	if limit >
		roleAccessMaxPageSize {
		limit =
			roleAccessMaxPageSize
	}

	return
}

/* ============================================================
   OVERVIEW

   GET /api/v1/admin/role-access/overview
============================================================ */

func (
	h *RoleAccessHandler,
) Overview(
	c *gin.Context,
) {
	ctx,
		cancel :=
		context.WithTimeout(
			c.Request.Context(),
			roleAccessTimeout,
		)

	defer cancel()

	var result RoleAccessOverview

	err :=
		h.db.QueryRow(
			ctx,
			`
			SELECT

				/* ==============================
				   ACTIVE ROLES
				============================== */

				(
					SELECT
						COUNT(*)::bigint

					FROM public.auth_roles

					WHERE
						active = TRUE
				),

				/* ==============================
				   ACTIVE PERMISSIONS
				============================== */

				(
					SELECT
						COUNT(*)::bigint

					FROM public.auth_permissions

					WHERE
						active = TRUE
				),

				/* ==============================
				   VALID ACTIVE AUTH USERS

				   A user must have:
				   - active account
				   - non-deleted account
				   - active role assignment
				   - non-expired role assignment
				   - active role
				   - role/user_type match
				============================== */

				(
					SELECT
						COUNT(
							DISTINCT u.id
						)::bigint

					FROM public.users u

					JOIN public.auth_user_roles ur
						ON ur.user_id = u.id
						AND ur.active = TRUE
						AND (
							ur.expires_at IS NULL
							OR ur.expires_at >
								CURRENT_TIMESTAMP
						)

					JOIN public.auth_roles r
						ON r.id = ur.role_id
						AND r.active = TRUE
						AND r.legacy_user_type =
							u.user_type

					WHERE
						u.deleted_at IS NULL
						AND u.active = TRUE
						AND u.account_status =
							'active'
				),

				/* ==============================
				   PRIVILEGED USERS
				============================== */

				(
					SELECT
						COUNT(
							DISTINCT u.id
						)::bigint

					FROM public.users u

					JOIN public.auth_user_roles ur
						ON ur.user_id = u.id
						AND ur.active = TRUE
						AND (
							ur.expires_at IS NULL
							OR ur.expires_at >
								CURRENT_TIMESTAMP
						)

					JOIN public.auth_roles r
						ON r.id = ur.role_id
						AND r.active = TRUE
						AND r.legacy_user_type =
							u.user_type

					WHERE
						u.deleted_at IS NULL
						AND u.active = TRUE
						AND u.account_status =
							'active'

						AND r.code IN (
							'ROOT',
							'IT_ADMIN'
						)
				)
			`,
		).Scan(
			&result.TotalRoles,
			&result.TotalPermissions,
			&result.TotalUsers,
			&result.PrivilegedUsers,
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
		result,
	)
}

/* ============================================================
   PERMISSIONS

   GET /api/v1/admin/role-access/permissions

   Only active permissions are returned because inactive
   permissions must not be newly assigned through Role Access.
============================================================ */

func (
	h *RoleAccessHandler,
) Permissions(
	c *gin.Context,
) {
	ctx,
		cancel :=
		context.WithTimeout(
			c.Request.Context(),
			roleAccessTimeout,
		)

	defer cancel()

	rows,
		err :=
		h.db.Query(
			ctx,
			`
			SELECT
				id,
				code,
				name,
				active

			FROM public.auth_permissions

			WHERE
				active = TRUE

			ORDER BY
				code
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
			[]RoleAccessPermission,
			0,
		)

	for rows.Next() {
		var item RoleAccessPermission

		if err :=
			rows.Scan(
				&item.ID,
				&item.Code,
				&item.Name,
				&item.Active,
			); err != nil {

			response.ServerError(
				c,
				err,
			)

			return
		}

		item.Code =
			strings.TrimSpace(
				item.Code,
			)

		item.Name =
			strings.TrimSpace(
				item.Name,
			)

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

	response.OK(
		c,
		items,
	)
}

/* ============================================================
   ROLES

   GET /api/v1/admin/role-access/roles
============================================================ */

func (
	h *RoleAccessHandler,
) Roles(
	c *gin.Context,
) {
	ctx,
		cancel :=
		context.WithTimeout(
			c.Request.Context(),
			roleAccessTimeout,
		)

	defer cancel()

	rows,
		err :=
		h.db.Query(
			ctx,
			`
			SELECT
				r.id,
				r.code,
				r.name,
				r.legacy_user_type,
				r.hierarchy_level,
				r.active,

				COUNT(
					DISTINCT u.id
				)::bigint AS user_count

			FROM public.auth_roles r

			LEFT JOIN public.auth_user_roles ur
				ON ur.role_id = r.id
				AND ur.active = TRUE
				AND (
					ur.expires_at IS NULL
					OR ur.expires_at >
						CURRENT_TIMESTAMP
				)

			LEFT JOIN public.users u
				ON u.id = ur.user_id

				/* ===================================
				   IMPORTANT LOGIN INVARIANT
				=================================== */

				AND u.user_type =
					r.legacy_user_type

				AND u.deleted_at IS NULL
				AND u.active = TRUE
				AND u.account_status =
					'active'

			GROUP BY
				r.id,
				r.code,
				r.name,
				r.legacy_user_type,
				r.hierarchy_level,
				r.active

			ORDER BY
				r.hierarchy_level DESC,
				r.id
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

	roles :=
		make(
			[]RoleAccessRole,
			0,
		)

	for rows.Next() {
		var role RoleAccessRole

		if err :=
			rows.Scan(
				&role.ID,
				&role.Code,
				&role.Name,
				&role.LegacyUserType,
				&role.HierarchyLevel,
				&role.Active,
				&role.UserCount,
			); err != nil {

			response.ServerError(
				c,
				err,
			)

			return
		}

		role.Code =
			normalizeRoleCode(
				role.Code,
			)

		role.Name =
			strings.TrimSpace(
				role.Name,
			)

		role.Protected =
			isRootRole(
				role.Code,
			)

		role.Permissions =
			make(
				[]RoleAccessPermission,
				0,
			)

		roles =
			append(
				roles,
				role,
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

	/* ========================================================
	   LOAD PERMISSIONS FOR EACH ROLE

	   Only four roles currently exist, so a small role-by-role
	   query is simple and safe.
	======================================================== */

	for index := range roles {

		permissionRows,
			err :=
			h.db.Query(
				ctx,
				`
				SELECT
					p.id,
					p.code,
					p.name,
					p.active

				FROM public.auth_role_permissions rp

				JOIN public.auth_permissions p
					ON p.id =
						rp.permission_id

				WHERE
					rp.role_id = $1
					AND p.active = TRUE

				ORDER BY
					p.code
				`,
				roles[index].ID,
			)

		if err != nil {
			response.ServerError(
				c,
				err,
			)

			return
		}

		for permissionRows.Next() {
			var permission RoleAccessPermission

			if err :=
				permissionRows.Scan(
					&permission.ID,
					&permission.Code,
					&permission.Name,
					&permission.Active,
				); err != nil {

				permissionRows.Close()

				response.ServerError(
					c,
					err,
				)

				return
			}

			permission.Code =
				strings.TrimSpace(
					permission.Code,
				)

			permission.Name =
				strings.TrimSpace(
					permission.Name,
				)

			roles[index].Permissions =
				append(
					roles[index].Permissions,
					permission,
				)
		}

		if err :=
			permissionRows.Err(); err != nil {

			permissionRows.Close()

			response.ServerError(
				c,
				err,
			)

			return
		}

		permissionRows.Close()
	}

	response.OK(
		c,
		roles,
	)
}

/* ============================================================
   USERS

   GET /api/v1/admin/role-access/users

   Query parameters:

   page=1
   limit=20

   search=
       username
       employee_id
       full_name
       email

   role=
       ROOT
       IT_ADMIN
       IT_PERSONNEL
       GENERAL_USER
============================================================ */

func (
	h *RoleAccessHandler,
) Users(
	c *gin.Context,
) {
	ctx,
		cancel :=
		context.WithTimeout(
			c.Request.Context(),
			roleAccessTimeout,
		)

	defer cancel()

	page,
		limit :=
		parseRoleAccessPagination(
			c,
		)

	search :=
		strings.TrimSpace(
			c.Query(
				"search",
			),
		)

	roleCode :=
		normalizeRoleCode(
			c.Query(
				"role",
			),
		)

	/* ========================================================
	   DYNAMIC WHERE CLAUSE
	======================================================== */

	where :=
		`
		WHERE
			u.deleted_at IS NULL
		`

	args :=
		make(
			[]any,
			0,
		)

	if search != "" {
		args =
			append(
				args,
				"%"+search+"%",
			)

		placeholder :=
			len(args)

		where +=
			fmt.Sprintf(
				`
				AND (
					   COALESCE(u.username, '') ILIKE $%d
					OR COALESCE(u.employee_id, '') ILIKE $%d
					OR COALESCE(u.full_name, '') ILIKE $%d
					OR COALESCE(u.email, '') ILIKE $%d
				)
				`,
				placeholder,
				placeholder,
				placeholder,
				placeholder,
			)
	}

	if roleCode != "" &&
		roleCode != "ALL" {

		args =
			append(
				args,
				roleCode,
			)

		placeholder :=
			len(args)

		where +=
			fmt.Sprintf(
				`
				AND UPPER(
					BTRIM(
						r.code
					)
				) = $%d
				`,
				placeholder,
			)
	}

	/* ========================================================
	   TOTAL COUNT
	======================================================== */

	countSQL :=
		fmt.Sprintf(
			`
			SELECT
				COUNT(
					DISTINCT u.id
				)::bigint

			FROM public.users u

			JOIN public.auth_user_roles ur
				ON ur.user_id = u.id
				AND ur.active = TRUE
				AND (
					ur.expires_at IS NULL
					OR ur.expires_at >
						CURRENT_TIMESTAMP
				)

			JOIN public.auth_roles r
				ON r.id = ur.role_id
				AND r.active = TRUE
				AND r.legacy_user_type =
					u.user_type

			%s
			`,
			where,
		)

	var total int64

	if err :=
		h.db.QueryRow(
			ctx,
			countSQL,
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

	/* ========================================================
	   PAGINATED LIST
	======================================================== */

	listArgs :=
		append(
			[]any{},
			args...,
		)

	limitPlaceholder :=
		len(
			listArgs,
		) + 1

	listArgs =
		append(
			listArgs,
			limit,
		)

	offsetPlaceholder :=
		len(
			listArgs,
		) + 1

	offset :=
		(page - 1) *
			limit

	listArgs =
		append(
			listArgs,
			offset,
		)

	listSQL :=
		fmt.Sprintf(
			`
			SELECT
				u.id,
				u.username,
				COALESCE(
					u.employee_id,
					''
				),
				COALESCE(
					u.full_name,
					''
				),
				COALESCE(
					u.email,
					''
				),
				u.user_type,

				r.id,
				r.code,
				r.name,

				u.account_status,
				u.active

			FROM public.users u

			JOIN public.auth_user_roles ur
				ON ur.user_id = u.id
				AND ur.active = TRUE
				AND (
					ur.expires_at IS NULL
					OR ur.expires_at >
						CURRENT_TIMESTAMP
				)

			JOIN public.auth_roles r
				ON r.id = ur.role_id
				AND r.active = TRUE
				AND r.legacy_user_type =
					u.user_type

			%s

			ORDER BY

				CASE
					WHEN r.code = 'ROOT'
						THEN 1

					WHEN r.code = 'IT_ADMIN'
						THEN 2

					WHEN r.code = 'IT_PERSONNEL'
						THEN 3

					WHEN r.code = 'GENERAL_USER'
						THEN 4

					ELSE 5
				END,

				COALESCE(
					NULLIF(
						BTRIM(
							u.full_name
						),
						''
					),
					u.username
				),

				u.id

			LIMIT $%d
			OFFSET $%d
			`,
			where,
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
			[]RoleAccessUser,
			0,
			limit,
		)

	for rows.Next() {
		var item RoleAccessUser

		if err :=
			rows.Scan(
				&item.ID,
				&item.Username,
				&item.EmployeeID,
				&item.FullName,
				&item.Email,
				&item.UserType,
				&item.RoleID,
				&item.RoleCode,
				&item.RoleName,
				&item.AccountStatus,
				&item.Active,
			); err != nil {

			response.ServerError(
				c,
				err,
			)

			return
		}

		item.Username =
			strings.TrimSpace(
				item.Username,
			)

		item.EmployeeID =
			strings.TrimSpace(
				item.EmployeeID,
			)

		item.FullName =
			strings.TrimSpace(
				item.FullName,
			)

		item.Email =
			strings.TrimSpace(
				item.Email,
			)

		item.RoleCode =
			normalizeRoleCode(
				item.RoleCode,
			)

		item.RoleName =
			strings.TrimSpace(
				item.RoleName,
			)

		item.AccountStatus =
			strings.TrimSpace(
				item.AccountStatus,
			)

		item.Protected =
			isRootRole(
				item.RoleCode,
			)

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
   CHANGE USER ROLE

   PUT /api/v1/admin/role-access/users/:id/role

   Body:

   {
       "role_id": 4
   }

   BUSINESS POLICY

   - User cannot change own role.
   - ROOT cannot be demoted.
   - ROOT cannot be assigned through this UI.
   - Target role must be active.
   - users.user_type and auth_user_roles must change
     together in one transaction.
============================================================ */

func (
	h *RoleAccessHandler,
) UpdateUserRole(
	c *gin.Context,
) {
	actorID,
		ok :=
		middleware.GetCurrentUserID(
			c,
		)

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

	targetUserID,
		err :=
		strconv.Atoi(
			c.Param(
				"id",
			),
		)

	if err != nil ||
		targetUserID <= 0 {

		response.BadRequest(
			c,
			"invalid user id",
		)

		return
	}

	/* ========================================================
	   SELF ROLE CHANGE IS NOT ALLOWED
	======================================================== */

	if targetUserID ==
		actorID {

		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,
				"error":   "you cannot change your own role",
			},
		)

		return
	}

	var request struct {
		RoleID int `json:"role_id"`
	}

	if err :=
		c.ShouldBindJSON(
			&request,
		); err != nil {

		response.BadRequest(
			c,
			"valid role_id is required",
		)

		return
	}

	if request.RoleID <= 0 {
		response.BadRequest(
			c,
			"valid role_id is required",
		)

		return
	}

	ctx,
		cancel :=
		context.WithTimeout(
			c.Request.Context(),
			roleAccessTimeout,
		)

	defer cancel()

	tx,
		err :=
		h.db.Begin(
			ctx,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	defer func() {
		_ =
			tx.Rollback(
				ctx,
			)
	}()

	/* ========================================================
	   CURRENT ROLE

	   Lock the user row while changing its authorization.
	======================================================== */

	var (
		currentRoleID   int
		currentRoleCode string
		username        string
	)

	err =
		tx.QueryRow(
			ctx,
			`
			SELECT
				r.id,
				r.code,
				u.username

			FROM public.users u

			JOIN public.auth_user_roles ur
				ON ur.user_id = u.id
				AND ur.active = TRUE
				AND (
					ur.expires_at IS NULL
					OR ur.expires_at >
						CURRENT_TIMESTAMP
				)

			JOIN public.auth_roles r
				ON r.id = ur.role_id
				AND r.active = TRUE
				AND r.legacy_user_type =
					u.user_type

			WHERE
				u.id = $1
				AND u.deleted_at IS NULL

			ORDER BY
				r.hierarchy_level DESC

			LIMIT 1

			FOR UPDATE OF u
			`,
			targetUserID,
		).Scan(
			&currentRoleID,
			&currentRoleCode,
			&username,
		)

	if err != nil {
		if err ==
			pgx.ErrNoRows {

			response.NotFound(
				c,
				"user not found or user has no valid role",
			)

			return
		}

		response.ServerError(
			c,
			err,
		)

		return
	}

	currentRoleCode =
		normalizeRoleCode(
			currentRoleCode,
		)

	/* ========================================================
	   ROOT PROTECTION
	======================================================== */

	if isRootRole(
		currentRoleCode,
	) {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,

				"error": "ROOT account is protected and cannot be demoted",
			},
		)

		return
	}

	/* ========================================================
	   NO-OP ROLE CHANGE
	======================================================== */

	if request.RoleID ==
		currentRoleID {

		response.OK(
			c,
			gin.H{
				"updated": false,

				"user_id": targetUserID,

				"username": strings.TrimSpace(
					username,
				),

				"role_id": currentRoleID,

				"role_code": currentRoleCode,
			},
		)

		return
	}

	/* ========================================================
	   TARGET ROLE
	======================================================== */

	var (
		targetRoleCode   string
		targetRoleName   string
		targetUserType   int
		targetRoleActive bool
	)

	err =
		tx.QueryRow(
			ctx,
			`
			SELECT
				code,
				name,
				legacy_user_type,
				active

			FROM public.auth_roles

			WHERE
				id = $1
			`,
			request.RoleID,
		).Scan(
			&targetRoleCode,
			&targetRoleName,
			&targetUserType,
			&targetRoleActive,
		)

	if err != nil {
		if err ==
			pgx.ErrNoRows {

			response.BadRequest(
				c,
				"target role not found",
			)

			return
		}

		response.ServerError(
			c,
			err,
		)

		return
	}

	targetRoleCode =
		normalizeRoleCode(
			targetRoleCode,
		)

	targetRoleName =
		strings.TrimSpace(
			targetRoleName,
		)

	if !targetRoleActive {
		response.BadRequest(
			c,
			"target role is inactive",
		)

		return
	}

	/* ========================================================
	   ROOT CANNOT BE ASSIGNED THROUGH ROLE ACCESS
	======================================================== */

	if isRootRole(
		targetRoleCode,
	) {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,

				"error": "ROOT cannot be assigned from Role Access",
			},
		)

		return
	}

	/* ========================================================
	   UPDATE users.user_type

	   This is REQUIRED because login checks:

	   auth_roles.legacy_user_type = users.user_type
	======================================================== */

	result,
		err :=
		tx.Exec(
			ctx,
			`
			UPDATE public.users

			SET
				user_type = $2,
				updated_at =
					CURRENT_TIMESTAMP

			WHERE
				id = $1
				AND deleted_at IS NULL
			`,
			targetUserID,
			targetUserType,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	if result.RowsAffected() !=
		1 {

		response.NotFound(
			c,
			"user not found",
		)

		return
	}

	/* ========================================================
	   DEACTIVATE CURRENT ACTIVE ASSIGNMENTS
	======================================================== */

	_,
		err =
		tx.Exec(
			ctx,
			`
			UPDATE public.auth_user_roles

			SET
				active = FALSE

			WHERE
				user_id = $1
				AND active = TRUE
			`,
			targetUserID,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	/* ========================================================
	   REACTIVATE EXISTING TARGET ASSIGNMENT IF IT EXISTS
	======================================================== */

	tag,
		err :=
		tx.Exec(
			ctx,
			`
			UPDATE public.auth_user_roles

			SET
				assigned_by = $3,
				assigned_at =
					CURRENT_TIMESTAMP,
				expires_at = NULL,
				active = TRUE

			WHERE
				user_id = $1
				AND role_id = $2
			`,
			targetUserID,
			request.RoleID,
			actorID,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	/* ========================================================
	   OTHERWISE CREATE NEW ASSIGNMENT
	======================================================== */

	if tag.RowsAffected() ==
		0 {

		_,
			err =
			tx.Exec(
				ctx,
				`
				INSERT INTO public.auth_user_roles (
					user_id,
					role_id,
					assigned_by,
					assigned_at,
					expires_at,
					active
				)

				VALUES (
					$1,
					$2,
					$3,
					CURRENT_TIMESTAMP,
					NULL,
					TRUE
				)
				`,
				targetUserID,
				request.RoleID,
				actorID,
			)

		if err != nil {
			response.ServerError(
				c,
				err,
			)

			return
		}
	}

	if err :=
		tx.Commit(
			ctx,
		); err != nil {

		response.ServerError(
			c,
			err,
		)

		return
	}

	response.OK(
		c,
		gin.H{
			"updated": true,

			"user_id": targetUserID,

			"username": strings.TrimSpace(
				username,
			),

			"role_id": request.RoleID,

			"role_code": targetRoleCode,

			"role_name": targetRoleName,

			"user_type": targetUserType,
		},
	)
}

/* ============================================================
   UPDATE ROLE PERMISSIONS

   PUT /api/v1/admin/role-access/roles/:id/permissions

   Body:

   {
       "permission_ids": [1, 2, 3]
   }

   BUSINESS POLICY

   ROOT:
       Cannot be modified.

   IT_ADMIN:
       Must retain panel.admin.access.

   IT_PERSONNEL:
       Must retain panel.staff.access.

   GENERAL_USER:
       Must retain dashboard.self.access.

   Also:
       An administrator cannot remove roles.manage from
       their own currently active role while using this API.
============================================================ */

func (
	h *RoleAccessHandler,
) UpdateRolePermissions(
	c *gin.Context,
) {
	actorID,
		ok :=
		middleware.GetCurrentUserID(
			c,
		)

	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,

				"error": "authentication required",
			},
		)

		return
	}

	roleID,
		err :=
		strconv.Atoi(
			c.Param(
				"id",
			),
		)

	if err != nil ||
		roleID <= 0 {

		response.BadRequest(
			c,
			"invalid role id",
		)

		return
	}

	var request struct {
		PermissionIDs []int `json:"permission_ids"`
	}

	if err :=
		c.ShouldBindJSON(
			&request,
		); err != nil {

		response.BadRequest(
			c,
			"permission_ids is required",
		)

		return
	}

	permissionIDs :=
		deduplicatePositiveIDs(
			request.PermissionIDs,
		)

	ctx,
		cancel :=
		context.WithTimeout(
			c.Request.Context(),
			roleAccessTimeout,
		)

	defer cancel()

	tx,
		err :=
		h.db.Begin(
			ctx,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	defer func() {
		_ =
			tx.Rollback(
				ctx,
			)
	}()

	/* ========================================================
	   LOAD TARGET ROLE
	======================================================== */

	var (
		roleCode   string
		roleName   string
		roleActive bool
	)

	err =
		tx.QueryRow(
			ctx,
			`
			SELECT
				code,
				name,
				active

			FROM public.auth_roles

			WHERE
				id = $1

			FOR UPDATE
			`,
			roleID,
		).Scan(
			&roleCode,
			&roleName,
			&roleActive,
		)

	if err != nil {
		if err ==
			pgx.ErrNoRows {

			response.NotFound(
				c,
				"role not found",
			)

			return
		}

		response.ServerError(
			c,
			err,
		)

		return
	}

	roleCode =
		normalizeRoleCode(
			roleCode,
		)

	roleName =
		strings.TrimSpace(
			roleName,
		)

	if !roleActive {
		response.BadRequest(
			c,
			"role is inactive",
		)

		return
	}

	/* ========================================================
	   ROOT PERMISSIONS ARE IMMUTABLE
	======================================================== */

	if isRootRole(
		roleCode,
	) {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,

				"error": "ROOT permissions are protected and cannot be edited",
			},
		)

		return
	}

	/* ========================================================
	   VALIDATE PERMISSIONS
	======================================================== */

	permissionCodes :=
		make(
			map[string]bool,
		)

	validPermissionIDs :=
		make(
			map[int]bool,
		)

	if len(
		permissionIDs,
	) > 0 {

		rows,
			err :=
			tx.Query(
				ctx,
				`
				SELECT
					id,
					code

				FROM public.auth_permissions

				WHERE
					active = TRUE
					AND id =
						ANY(
							$1::int[]
						)
				`,
				permissionIDs,
			)

		if err != nil {
			response.ServerError(
				c,
				err,
			)

			return
		}

		for rows.Next() {
			var (
				permissionID   int
				permissionCode string
			)

			if err :=
				rows.Scan(
					&permissionID,
					&permissionCode,
				); err != nil {

				rows.Close()

				response.ServerError(
					c,
					err,
				)

				return
			}

			permissionCode =
				strings.TrimSpace(
					permissionCode,
				)

			validPermissionIDs[permissionID] = true

			permissionCodes[permissionCode] = true
		}

		if err :=
			rows.Err(); err != nil {

			rows.Close()

			response.ServerError(
				c,
				err,
			)

			return
		}

		rows.Close()

		if len(
			validPermissionIDs,
		) !=
			len(
				permissionIDs,
			) {

			response.BadRequest(
				c,
				"one or more permissions are invalid or inactive",
			)

			return
		}
	}

	/* ========================================================
	   REQUIRED BASELINE PERMISSION
	======================================================== */

	requiredPermission :=
		requiredBaselinePermission(
			roleCode,
		)

	if requiredPermission != "" &&
		!permissionCodes[requiredPermission] {

		c.JSON(
			http.StatusConflict,
			gin.H{
				"success": false,

				"error": fmt.Sprintf(
					"%s must retain %s",
					roleCode,
					requiredPermission,
				),
			},
		)

		return
	}

	/* ========================================================
	   PREVENT ADMIN SELF-LOCKOUT

	   If the actor is editing the permissions of their own
	   role, roles.manage must remain assigned.
	======================================================== */

	var actorRoleID int

	err =
		tx.QueryRow(
			ctx,
			`
			SELECT
				r.id

			FROM public.users u

			JOIN public.auth_user_roles ur
				ON ur.user_id = u.id
				AND ur.active = TRUE
				AND (
					ur.expires_at IS NULL
					OR ur.expires_at >
						CURRENT_TIMESTAMP
				)

			JOIN public.auth_roles r
				ON r.id = ur.role_id
				AND r.active = TRUE
				AND r.legacy_user_type =
					u.user_type

			WHERE
				u.id = $1
				AND u.deleted_at IS NULL

			ORDER BY
				r.hierarchy_level DESC

			LIMIT 1
			`,
			actorID,
		).Scan(
			&actorRoleID,
		)

	if err != nil &&
		err != pgx.ErrNoRows {

		response.ServerError(
			c,
			err,
		)

		return
	}

	if actorRoleID ==
		roleID {

		if !permissionCodes["roles.manage"] {
			c.JSON(
				http.StatusConflict,
				gin.H{
					"success": false,

					"error": "you cannot remove roles.manage from your own active role",
				},
			)

			return
		}
	}

	/* ========================================================
	   REPLACE ROLE PERMISSION SET
	======================================================== */

	_,
		err =
		tx.Exec(
			ctx,
			`
			DELETE FROM public.auth_role_permissions

			WHERE
				role_id = $1
			`,
			roleID,
		)

	if err != nil {
		response.ServerError(
			c,
			err,
		)

		return
	}

	for _, permissionID := range permissionIDs {

		_,
			err =
			tx.Exec(
				ctx,
				`
				INSERT INTO public.auth_role_permissions (
					role_id,
					permission_id
				)

				VALUES (
					$1,
					$2
				)
				`,
				roleID,
				permissionID,
			)

		if err != nil {
			response.ServerError(
				c,
				err,
			)

			return
		}
	}

	if err :=
		tx.Commit(
			ctx,
		); err != nil {

		response.ServerError(
			c,
			err,
		)

		return
	}

	response.OK(
		c,
		gin.H{
			"updated": true,

			"role_id": roleID,

			"role_code": roleCode,

			"role_name": roleName,

			"permission_count": len(
				permissionIDs,
			),
		},
	)
}

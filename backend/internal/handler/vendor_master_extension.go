package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type vendorMasterInput struct {
	VendorName    string  `json:"vendor_name"`
	ContactPerson string  `json:"contact_person"`
	Mobile        string  `json:"mobile"`
	Email         string  `json:"email"`
	Address       string  `json:"address"`
	VendorTypeIDs []int64 `json:"vendor_type_ids"`
}

func (h *VendorHandler) MasterOwnerships(c *gin.Context) {
	rows, err := h.db.Query(
		c.Request.Context(),
		`
		SELECT
			id,
			code,
			name,
			editable_by_it,
			status
		FROM public.vendor_ownership_categories
		WHERE status = 1
		ORDER BY sort_order, id
		`,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	result := []gin.H{}

	for rows.Next() {
		var id int64
		var code string
		var name string
		var editableByIT bool
		var status int

		if err := rows.Scan(
			&id,
			&code,
			&name,
			&editableByIT,
			&status,
		); err != nil {
			response.ServerError(c, err)
			return
		}

		result = append(
			result,
			gin.H{
				"id":             id,
				"code":           code,
				"name":           name,
				"editable_by_it": editableByIT,
				"status":         status,
			},
		)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, result)
}

func (h *VendorHandler) MasterTypes(c *gin.Context) {
	rows, err := h.db.Query(
		c.Request.Context(),
		`
		SELECT id, code, name, status
		FROM public.vendor_types
		WHERE status = 1
		ORDER BY name
		`,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	result := []gin.H{}

	for rows.Next() {
		var id int64
		var code string
		var name string
		var status int

		if err := rows.Scan(
			&id,
			&code,
			&name,
			&status,
		); err != nil {
			response.ServerError(c, err)
			return
		}

		result = append(
			result,
			gin.H{
				"id":     id,
				"code":   code,
				"name":   name,
				"status": status,
			},
		)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, result)
}

func (h *VendorHandler) MasterOptions(c *gin.Context) {
	rows, err := h.db.Query(
		c.Request.Context(),
		`
		SELECT
			v.id,
			COALESCE(
				p.vendor_code,
				'VND-' || LPAD(v.id::text, 6, '0')
			) AS vendor_code,
			COALESCE(v.vendor_name, '') AS vendor_name,
			vo.id AS vendor_ownership_id,
			vo.code AS vendor_ownership_code,
			vo.name AS vendor_ownership_name,
			vo.editable_by_it AS vendor_editable,
			COALESCE(
				ARRAY_AGG(
					DISTINCT vt.name
					ORDER BY vt.name
				) FILTER (
					WHERE vt.id IS NOT NULL
				),
				ARRAY[]::varchar[]
			) AS vendor_types
		FROM public.vendors v
		JOIN public.vendor_ownership_categories vo
		  ON vo.id = v.vendor_ownership_id
		 AND vo.status = 1
		LEFT JOIN public.vendor_master_profiles p
		  ON p.vendor_id = v.id
		LEFT JOIN public.vendor_master_type_assignments vmta
		  ON vmta.vendor_id = v.id
		LEFT JOIN public.vendor_types vt
		  ON vt.id = vmta.vendor_type_id
		 AND vt.status = 1
		WHERE COALESCE(p.status, 1) = 1
		GROUP BY
			v.id,
			v.vendor_name,
			vo.id,
			vo.code,
			vo.name,
			vo.editable_by_it,
			p.vendor_code
		ORDER BY v.vendor_name
		`,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	result := []gin.H{}

	for rows.Next() {
		var id int64
		var code string
		var name string
		var ownershipID int64
		var ownershipCode string
		var ownershipName string
		var editable bool
		var types []string

		if err := rows.Scan(
			&id,
			&code,
			&name,
			&ownershipID,
			&ownershipCode,
			&ownershipName,
			&editable,
			&types,
		); err != nil {
			response.ServerError(c, err)
			return
		}

		result = append(
			result,
			gin.H{
				"id":                    id,
				"vendor_code":           code,
				"vendor_name":           name,
				"vendor_ownership_id":   ownershipID,
				"vendor_ownership_code": ownershipCode,
				"vendor_ownership_name": ownershipName,
				"vendor_editable":       editable,
				"vendor_types":          types,
			},
		)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, result)
}

func (h *VendorHandler) MasterList(c *gin.Context) {
	search := strings.TrimSpace(
		c.Query("search"),
	)

	rows, err := h.db.Query(
		c.Request.Context(),
		`
		SELECT
			v.id,
			COALESCE(
				p.vendor_code,
				'VND-' || LPAD(v.id::text, 6, '0')
			) AS vendor_code,
			COALESCE(v.vendor_name, '') AS vendor_name,
			vo.id AS vendor_ownership_id,
			vo.code AS vendor_ownership_code,
			vo.name AS vendor_ownership_name,
			vo.editable_by_it AS vendor_editable,
			COALESCE(p.contact_person, '') AS contact_person,
			COALESCE(p.mobile, '') AS mobile,
			COALESCE(p.email, '') AS email,
			COALESCE(p.address, '') AS address,
			COALESCE(p.status, 1) AS status,
			COALESCE(
				ARRAY_AGG(
					DISTINCT vt.id
					ORDER BY vt.id
				) FILTER (
					WHERE vt.id IS NOT NULL
				),
				ARRAY[]::bigint[]
			) AS vendor_type_ids,
			COALESCE(
				ARRAY_AGG(
					DISTINCT vt.name
					ORDER BY vt.name
				) FILTER (
					WHERE vt.id IS NOT NULL
				),
				ARRAY[]::varchar[]
			) AS vendor_types
		FROM public.vendors v
		JOIN public.vendor_ownership_categories vo
		  ON vo.id = v.vendor_ownership_id
		 AND vo.status = 1
		LEFT JOIN public.vendor_master_profiles p
		  ON p.vendor_id = v.id
		LEFT JOIN public.vendor_master_type_assignments vmta
		  ON vmta.vendor_id = v.id
		LEFT JOIN public.vendor_types vt
		  ON vt.id = vmta.vendor_type_id
		WHERE (
			$1 = ''
			OR COALESCE(v.vendor_name, '') ILIKE '%' || $1 || '%'
			OR COALESCE(p.vendor_code, '') ILIKE '%' || $1 || '%'
			OR COALESCE(p.mobile, '') ILIKE '%' || $1 || '%'
			OR COALESCE(p.email, '') ILIKE '%' || $1 || '%'
			OR COALESCE(vo.code, '') ILIKE '%' || $1 || '%'
			OR COALESCE(vo.name, '') ILIKE '%' || $1 || '%'
		)
		GROUP BY
			v.id,
			v.vendor_name,
			vo.id,
			vo.code,
			vo.name,
			vo.editable_by_it,
			p.vendor_code,
			p.contact_person,
			p.mobile,
			p.email,
			p.address,
			p.status
		ORDER BY
			COALESCE(p.status, 1) DESC,
			v.vendor_name
		`,
		search,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	result := []gin.H{}

	for rows.Next() {
		var id int64
		var code string
		var name string
		var ownershipID int64
		var ownershipCode string
		var ownershipName string
		var editable bool
		var contact string
		var mobile string
		var email string
		var address string
		var status int
		var typeIDs []int64
		var typeNames []string

		if err := rows.Scan(
			&id,
			&code,
			&name,
			&ownershipID,
			&ownershipCode,
			&ownershipName,
			&editable,
			&contact,
			&mobile,
			&email,
			&address,
			&status,
			&typeIDs,
			&typeNames,
		); err != nil {
			response.ServerError(c, err)
			return
		}

		result = append(
			result,
			gin.H{
				"id":                    id,
				"vendor_code":           code,
				"vendor_name":           name,
				"vendor_ownership_id":   ownershipID,
				"vendor_ownership_code": ownershipCode,
				"vendor_ownership_name": ownershipName,
				"vendor_editable":       editable,
				"contact_person":        contact,
				"mobile":                mobile,
				"email":                 email,
				"address":               address,
				"status":                status,
				"vendor_type_ids":       typeIDs,
				"vendor_types":          typeNames,
			},
		)
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, result)
}

func (h *VendorHandler) MasterCreate(c *gin.Context) {
	ctx := c.Request.Context()

	var req vendorMasterInput

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	req.VendorName =
		strings.TrimSpace(req.VendorName)

	if req.VendorName == "" {
		response.BadRequest(c, "vendor_name is required")
		return
	}

	if len(req.VendorTypeIDs) == 0 {
		response.BadRequest(c, "at least one vendor type is required")
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var duplicate int

	if err := tx.QueryRow(
		ctx,
		`
		SELECT COUNT(*)
		FROM public.vendors
		WHERE UPPER(BTRIM(COALESCE(vendor_name, ''))) =
		      UPPER(BTRIM($1))
		`,
		req.VendorName,
	).Scan(&duplicate); err != nil {
		response.ServerError(c, err)
		return
	}

	if duplicate > 0 {
		response.BadRequest(
			c,
			"a vendor with this name already exists",
		)
		return
	}

	var itOwnershipID int64

	if err := tx.QueryRow(
		ctx,
		`
		SELECT id
		FROM public.vendor_ownership_categories
		WHERE code = 'IT'
		  AND status = 1
		LIMIT 1
		`,
	).Scan(&itOwnershipID); err != nil {
		response.ServerError(c, err)
		return
	}

	var id int64

	if err := tx.QueryRow(
		ctx,
		`
		INSERT INTO public.vendors (
			vendor_name,
			vendor_ownership,
			vendor_ownership_id
		)
		VALUES ($1, 'IT', $2)
		RETURNING id
		`,
		req.VendorName,
		itOwnershipID,
	).Scan(&id); err != nil {
		response.ServerError(c, err)
		return
	}

	vendorCode := fmt.Sprintf(
		"VND-%06d",
		id,
	)

	if _, err := tx.Exec(
		ctx,
		`
		INSERT INTO public.vendor_master_profiles (
			vendor_id,
			vendor_code,
			contact_person,
			mobile,
			email,
			address,
			status,
			created_by,
			created_at,
			updated_at
		)
		VALUES (
			$1,
			$2,
			NULLIF($3, ''),
			NULLIF($4, ''),
			NULLIF($5, ''),
			NULLIF($6, ''),
			1,
			NULLIF($7, ''),
			NOW(),
			NOW()
		)
		ON CONFLICT (vendor_id)
		DO UPDATE SET
			vendor_code = EXCLUDED.vendor_code,
			contact_person = EXCLUDED.contact_person,
			mobile = EXCLUDED.mobile,
			email = EXCLUDED.email,
			address = EXCLUDED.address,
			status = 1,
			updated_at = NOW()
		`,
		id,
		vendorCode,
		strings.TrimSpace(req.ContactPerson),
		strings.TrimSpace(req.Mobile),
		strings.TrimSpace(req.Email),
		strings.TrimSpace(req.Address),
		strings.TrimSpace(c.GetString("employee_id")),
	); err != nil {
		response.ServerError(c, err)
		return
	}

	for _, typeID := range req.VendorTypeIDs {
		if typeID <= 0 {
			continue
		}

		if _, err := tx.Exec(
			ctx,
			`
			INSERT INTO public.vendor_master_type_assignments (
				vendor_id,
				vendor_type_id
			)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
			`,
			id,
			typeID,
		); err != nil {
			response.ServerError(c, err)
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.Created(
		c,
		gin.H{
			"id":          id,
			"vendor_code": vendorCode,
		},
	)
}

func (h *VendorHandler) MasterUpdate(c *gin.Context) {
	ctx := c.Request.Context()

	id, err := strconv.ParseInt(
		strings.TrimSpace(
			c.Param("id"),
		),
		10,
		64,
	)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid vendor id")
		return
	}

	var req vendorMasterInput

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	req.VendorName =
		strings.TrimSpace(req.VendorName)

	if req.VendorName == "" {
		response.BadRequest(c, "vendor_name is required")
		return
	}

	if len(req.VendorTypeIDs) == 0 {
		response.BadRequest(c, "at least one vendor type is required")
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var ownershipCode string
	var ownershipName string
	var editableByIT bool

	if err := tx.QueryRow(
		ctx,
		`
		SELECT
			vo.code,
			vo.name,
			vo.editable_by_it
		FROM public.vendors v
		JOIN public.vendor_ownership_categories vo
		  ON vo.id = v.vendor_ownership_id
		WHERE v.id = $1
		  AND vo.status = 1
		`,
		id,
	).Scan(
		&ownershipCode,
		&ownershipName,
		&editableByIT,
	); err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "vendor not found")
			return
		}

		response.ServerError(c, err)
		return
	}

	if !editableByIT {
		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"message": fmt.Sprintf(
					"%s vendors are read-only in ITM.",
					ownershipName,
				),
				"ownership_code": ownershipCode,
			},
		)
		return
	}

	var duplicate int

	if err := tx.QueryRow(
		ctx,
		`
		SELECT COUNT(*)
		FROM public.vendors
		WHERE id <> $1
		  AND UPPER(BTRIM(COALESCE(vendor_name, ''))) =
		      UPPER(BTRIM($2))
		`,
		id,
		req.VendorName,
	).Scan(&duplicate); err != nil {
		response.ServerError(c, err)
		return
	}

	if duplicate > 0 {
		response.BadRequest(
			c,
			"another vendor with this name already exists",
		)
		return
	}

	result, err := tx.Exec(
		ctx,
		`
		UPDATE public.vendors
		SET vendor_name = $1
		WHERE id = $2
		`,
		req.VendorName,
		id,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	if result.RowsAffected() != 1 {
		response.NotFound(c, "vendor not found")
		return
	}

	vendorCode := fmt.Sprintf(
		"VND-%06d",
		id,
	)

	if _, err := tx.Exec(
		ctx,
		`
		INSERT INTO public.vendor_master_profiles (
			vendor_id,
			vendor_code,
			contact_person,
			mobile,
			email,
			address,
			status,
			created_by,
			created_at,
			updated_by,
			updated_at
		)
		VALUES (
			$1,
			$2,
			NULLIF($3, ''),
			NULLIF($4, ''),
			NULLIF($5, ''),
			NULLIF($6, ''),
			1,
			NULLIF($7, ''),
			NOW(),
			NULLIF($7, ''),
			NOW()
		)
		ON CONFLICT (vendor_id)
		DO UPDATE SET
			vendor_code = EXCLUDED.vendor_code,
			contact_person = EXCLUDED.contact_person,
			mobile = EXCLUDED.mobile,
			email = EXCLUDED.email,
			address = EXCLUDED.address,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
		`,
		id,
		vendorCode,
		strings.TrimSpace(req.ContactPerson),
		strings.TrimSpace(req.Mobile),
		strings.TrimSpace(req.Email),
		strings.TrimSpace(req.Address),
		strings.TrimSpace(c.GetString("employee_id")),
	); err != nil {
		response.ServerError(c, err)
		return
	}

	if _, err := tx.Exec(
		ctx,
		`
		DELETE FROM public.vendor_master_type_assignments
		WHERE vendor_id = $1
		`,
		id,
	); err != nil {
		response.ServerError(c, err)
		return
	}

	for _, typeID := range req.VendorTypeIDs {
		if typeID <= 0 {
			continue
		}

		if _, err := tx.Exec(
			ctx,
			`
			INSERT INTO public.vendor_master_type_assignments (
				vendor_id,
				vendor_type_id
			)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
			`,
			id,
			typeID,
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

func (h *VendorHandler) MasterUpdateStatus(c *gin.Context) {
	id, err := strconv.ParseInt(
		strings.TrimSpace(
			c.Param("id"),
		),
		10,
		64,
	)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid vendor id")
		return
	}

	var req struct {
		Status int `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	if req.Status != 0 && req.Status != 1 {
		response.BadRequest(c, "status must be 0 or 1")
		return
	}

	var ownershipCode string
	var ownershipName string
	var editableByIT bool

	if err := h.db.QueryRow(
		c.Request.Context(),
		`
		SELECT
			vo.code,
			vo.name,
			vo.editable_by_it
		FROM public.vendors v
		JOIN public.vendor_ownership_categories vo
		  ON vo.id = v.vendor_ownership_id
		WHERE v.id = $1
		  AND vo.status = 1
		`,
		id,
	).Scan(
		&ownershipCode,
		&ownershipName,
		&editableByIT,
	); err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "vendor not found")
			return
		}

		response.ServerError(c, err)
		return
	}

	if !editableByIT {
		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"message": fmt.Sprintf(
					"%s vendors are read-only in ITM.",
					ownershipName,
				),
				"ownership_code": ownershipCode,
			},
		)
		return
	}

	vendorCode := fmt.Sprintf(
		"VND-%06d",
		id,
	)

	_, err = h.db.Exec(
		c.Request.Context(),
		`
		INSERT INTO public.vendor_master_profiles (
			vendor_id,
			vendor_code,
			status,
			created_by,
			created_at,
			updated_by,
			updated_at
		)
		VALUES (
			$1,
			$2,
			$3,
			NULLIF($4, ''),
			NOW(),
			NULLIF($4, ''),
			NOW()
		)
		ON CONFLICT (vendor_id)
		DO UPDATE SET
			status = EXCLUDED.status,
			updated_by = EXCLUDED.updated_by,
			updated_at = NOW()
		`,
		id,
		vendorCode,
		req.Status,
		strings.TrimSpace(
			c.GetString("employee_id"),
		),
	)
	if err != nil {
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

package handler

import (
	"context"
	"strconv"
	"strings"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
)

/*
Master Data API

This file intentionally extends the existing CategoryHandler because that
handler is already registered on the authenticated /api/v1 router group.

Routes are registered from CategoryHandler.Register by the v46 apply script.

Existing authoritative tables:
  - public.tt_faults            -> Query Types
  - public.inventory_categories -> Category / Brand / Model

CPU/RAM/SSD/Monitor use a small dedicated master table:
  - public.inventory_components

This avoids putting reference/master data into public.stack_inventory, which is
an operational stock table.
*/

type masterQueryTypeItem struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      int    `json:"status"`
}

type masterDeviceCatalogItem struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	Status     int    `json:"status"`
	ParentID   *int64 `json:"parent_id"`
	ParentName string `json:"parent_name,omitempty"`
}

type masterComponentItem struct {
	ID     int64  `json:"id"`
	Type   string `json:"type"`
	Name   string `json:"name"`
	Status int    `json:"status"`
}

func normalizeMasterStatus(value int) int {
	if value == 0 {
		return 0
	}
	return 1
}

func validDeviceLevel(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "category", "brand", "model":
		return true
	default:
		return false
	}
}

func validComponentType(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "cpu", "ram", "ssd", "monitor":
		return true
	default:
		return false
	}
}

func parseMasterID(c *gin.Context) (int64, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid id")
		return 0, false
	}
	return id, true
}

/* ============================================================
   QUERY TYPES
   Source: public.tt_faults
============================================================ */

func (h *CategoryHandler) MasterQueryTypes(c *gin.Context) {
	rows, err := h.db.Query(
		c.Request.Context(),
		`
		SELECT
			id,
			COALESCE(fault_name, ''),
			COALESCE(fault_desc, ''),
			COALESCE(status, 1)
		FROM public.tt_faults
		ORDER BY
			LOWER(BTRIM(COALESCE(fault_name, ''))) ASC,
			id ASC
		`,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]masterQueryTypeItem, 0)

	for rows.Next() {
		var item masterQueryTypeItem

		if err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.Description,
			&item.Status,
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

func (h *CategoryHandler) MasterCreateQueryType(c *gin.Context) {
	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Status      int    `json:"status"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	body.Name = strings.TrimSpace(body.Name)
	body.Description = strings.TrimSpace(body.Description)
	body.Status = normalizeMasterStatus(body.Status)

	if body.Name == "" {
		response.BadRequest(c, "Query Type name is required")
		return
	}

	var exists bool

	if err := h.db.QueryRow(
		c.Request.Context(),
		`
		SELECT EXISTS (
			SELECT 1
			FROM public.tt_faults
			WHERE LOWER(BTRIM(COALESCE(fault_name, ''))) =
			      LOWER(BTRIM($1))
		)
		`,
		body.Name,
	).Scan(&exists); err != nil {
		response.ServerError(c, err)
		return
	}

	if exists {
		response.BadRequest(c, "Query Type already exists")
		return
	}

	var item masterQueryTypeItem

	err := h.db.QueryRow(
		c.Request.Context(),
		`
		INSERT INTO public.tt_faults (
			fault_name,
			fault_desc,
			fault_register,
			status
		)
		VALUES (
			$1,
			$2,
			$1,
			$3
		)
		RETURNING
			id,
			COALESCE(fault_name, ''),
			COALESCE(fault_desc, ''),
			COALESCE(status, 1)
		`,
		body.Name,
		body.Description,
		body.Status,
	).Scan(
		&item.ID,
		&item.Name,
		&item.Description,
		&item.Status,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.Created(c, item)
}

func (h *CategoryHandler) MasterUpdateQueryType(c *gin.Context) {
	id, ok := parseMasterID(c)
	if !ok {
		return
	}

	var body struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Status      int    `json:"status"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	body.Name = strings.TrimSpace(body.Name)
	body.Description = strings.TrimSpace(body.Description)
	body.Status = normalizeMasterStatus(body.Status)

	if body.Name == "" {
		response.BadRequest(c, "Query Type name is required")
		return
	}

	var duplicate bool

	if err := h.db.QueryRow(
		c.Request.Context(),
		`
		SELECT EXISTS (
			SELECT 1
			FROM public.tt_faults
			WHERE id <> $1
			  AND LOWER(BTRIM(COALESCE(fault_name, ''))) =
			      LOWER(BTRIM($2))
		)
		`,
		id,
		body.Name,
	).Scan(&duplicate); err != nil {
		response.ServerError(c, err)
		return
	}

	if duplicate {
		response.BadRequest(c, "Another Query Type with this name already exists")
		return
	}

	var item masterQueryTypeItem

	err := h.db.QueryRow(
		c.Request.Context(),
		`
		UPDATE public.tt_faults
		SET
			fault_name = $2,
			fault_desc = $3,
			fault_register = $2,
			status = $4
		WHERE id = $1
		RETURNING
			id,
			COALESCE(fault_name, ''),
			COALESCE(fault_desc, ''),
			COALESCE(status, 1)
		`,
		id,
		body.Name,
		body.Description,
		body.Status,
	).Scan(
		&item.ID,
		&item.Name,
		&item.Description,
		&item.Status,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, item)
}

/* ============================================================
   DEVICE CATALOG
   Source: public.inventory_categories
============================================================ */

func (h *CategoryHandler) masterDeviceCatalogQuery(
	ctx context.Context,
	where string,
	args ...any,
) ([]masterDeviceCatalogItem, error) {
	query := `
		SELECT
			ic.id,
			COALESCE(ic.inventory_category_list, ''),
			LOWER(
				BTRIM(
					COALESCE(
						NULLIF(ic.type, ''),
						CASE
							WHEN COALESCE(ic.parent_id, 0) = 0
								THEN 'category'
							ELSE 'model'
						END
					)
				)
			) AS item_type,
			COALESCE(ic.status, 1),
			NULLIF(COALESCE(ic.parent_id, 0), 0),
			COALESCE(parent.inventory_category_list, '')
		FROM public.inventory_categories ic
		LEFT JOIN public.inventory_categories parent
			ON parent.id = NULLIF(COALESCE(ic.parent_id, 0), 0)
	`

	if strings.TrimSpace(where) != "" {
		query += " WHERE " + where
	}

	query += `
		ORDER BY
			CASE
				WHEN LOWER(BTRIM(COALESCE(ic.type, ''))) = 'category' THEN 1
				WHEN LOWER(BTRIM(COALESCE(ic.type, ''))) = 'brand' THEN 2
				WHEN LOWER(BTRIM(COALESCE(ic.type, ''))) = 'model' THEN 3
				ELSE 4
			END,
			LOWER(BTRIM(COALESCE(ic.inventory_category_list, ''))) ASC,
			ic.id ASC
	`

	rows, err := h.db.Query(
		ctx,
		query,
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]masterDeviceCatalogItem, 0)

	for rows.Next() {
		var item masterDeviceCatalogItem

		if err := rows.Scan(
			&item.ID,
			&item.Name,
			&item.Type,
			&item.Status,
			&item.ParentID,
			&item.ParentName,
		); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (h *CategoryHandler) MasterDeviceCatalog(c *gin.Context) {
	items, err := h.masterDeviceCatalogQuery(
		c.Request.Context(),
		"",
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, items)
}

func (h *CategoryHandler) MasterCategories(c *gin.Context) {
	items, err := h.masterDeviceCatalogQuery(
		c.Request.Context(),
		`
		LOWER(BTRIM(COALESCE(ic.type, 'category'))) = 'category'
		AND COALESCE(ic.status, 1) = 1
		`,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, items)
}

func (h *CategoryHandler) MasterBrandsByCategory(c *gin.Context) {
	categoryID, err := strconv.ParseInt(
		c.Param("category_id"),
		10,
		64,
	)
	if err != nil || categoryID <= 0 {
		response.BadRequest(c, "invalid category id")
		return
	}

	items, err := h.masterDeviceCatalogQuery(
		c.Request.Context(),
		`
		LOWER(BTRIM(COALESCE(ic.type, ''))) = 'brand'
		AND COALESCE(ic.parent_id, 0) = $1
		AND COALESCE(ic.status, 1) = 1
		`,
		categoryID,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, items)
}

func (h *CategoryHandler) MasterCreateDeviceCatalog(c *gin.Context) {
	var body struct {
		Name     string `json:"name"`
		Type     string `json:"type"`
		Status   int    `json:"status"`
		ParentID *int64 `json:"parent_id"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	body.Name = strings.TrimSpace(body.Name)
	body.Type = strings.ToLower(strings.TrimSpace(body.Type))
	body.Status = normalizeMasterStatus(body.Status)

	if body.Name == "" {
		response.BadRequest(c, "Name is required")
		return
	}

	if !validDeviceLevel(body.Type) {
		response.BadRequest(c, "type must be category, brand or model")
		return
	}

	parentID := int64(0)

	if body.Type != "category" {
		if body.ParentID == nil || *body.ParentID <= 0 {
			response.BadRequest(c, "Parent is required for brand/model")
			return
		}

		parentID = *body.ParentID

		var parentType string

		err := h.db.QueryRow(
			c.Request.Context(),
			`
			SELECT LOWER(BTRIM(COALESCE(type, '')))
			FROM public.inventory_categories
			WHERE id = $1
			  AND COALESCE(status, 1) = 1
			`,
			parentID,
		).Scan(&parentType)
		if err != nil {
			response.BadRequest(c, "Selected parent does not exist or is inactive")
			return
		}

		expected := "category"
		if body.Type == "model" {
			expected = "brand"
		}

		if parentType != expected {
			response.BadRequest(c, "Invalid parent hierarchy")
			return
		}
	}

	var duplicate bool

	if err := h.db.QueryRow(
		c.Request.Context(),
		`
		SELECT EXISTS (
			SELECT 1
			FROM public.inventory_categories
			WHERE LOWER(BTRIM(COALESCE(inventory_category_list, ''))) =
			      LOWER(BTRIM($1))
			  AND LOWER(BTRIM(COALESCE(type, ''))) = $2
			  AND COALESCE(parent_id, 0) = $3
		)
		`,
		body.Name,
		body.Type,
		parentID,
	).Scan(&duplicate); err != nil {
		response.ServerError(c, err)
		return
	}

	if duplicate {
		response.BadRequest(c, "This master-data item already exists under the selected parent")
		return
	}

	employeeID := strings.TrimSpace(
		c.GetString("employee_id"),
	)

	var item masterDeviceCatalogItem

	err := h.db.QueryRow(
		c.Request.Context(),
		`
		INSERT INTO public.inventory_categories (
			inventory_category_list,
			parent_id,
			type,
			created_by,
			status
		)
		VALUES (
			$1,
			$2,
			$3,
			$4,
			$5
		)
		RETURNING
			id,
			COALESCE(inventory_category_list, ''),
			LOWER(BTRIM(COALESCE(type, ''))),
			COALESCE(status, 1),
			NULLIF(COALESCE(parent_id, 0), 0)
		`,
		body.Name,
		parentID,
		body.Type,
		employeeID,
		body.Status,
	).Scan(
		&item.ID,
		&item.Name,
		&item.Type,
		&item.Status,
		&item.ParentID,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.Created(c, item)
}

func (h *CategoryHandler) MasterUpdateDeviceCatalog(c *gin.Context) {
	id, ok := parseMasterID(c)
	if !ok {
		return
	}

	var body struct {
		Name     string `json:"name"`
		Type     string `json:"type"`
		Status   int    `json:"status"`
		ParentID *int64 `json:"parent_id"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	body.Name = strings.TrimSpace(body.Name)
	body.Type = strings.ToLower(strings.TrimSpace(body.Type))
	body.Status = normalizeMasterStatus(body.Status)

	if body.Name == "" {
		response.BadRequest(c, "Name is required")
		return
	}

	if !validDeviceLevel(body.Type) {
		response.BadRequest(c, "type must be category, brand or model")
		return
	}

	parentID := int64(0)

	if body.Type != "category" {
		if body.ParentID == nil || *body.ParentID <= 0 {
			response.BadRequest(c, "Parent is required for brand/model")
			return
		}

		parentID = *body.ParentID

		if parentID == id {
			response.BadRequest(c, "An item cannot be its own parent")
			return
		}
	}

	var duplicate bool

	if err := h.db.QueryRow(
		c.Request.Context(),
		`
		SELECT EXISTS (
			SELECT 1
			FROM public.inventory_categories
			WHERE id <> $1
			  AND LOWER(BTRIM(COALESCE(inventory_category_list, ''))) =
			      LOWER(BTRIM($2))
			  AND LOWER(BTRIM(COALESCE(type, ''))) = $3
			  AND COALESCE(parent_id, 0) = $4
		)
		`,
		id,
		body.Name,
		body.Type,
		parentID,
	).Scan(&duplicate); err != nil {
		response.ServerError(c, err)
		return
	}

	if duplicate {
		response.BadRequest(c, "Another item with this name already exists under the selected parent")
		return
	}

	var item masterDeviceCatalogItem

	err := h.db.QueryRow(
		c.Request.Context(),
		`
		UPDATE public.inventory_categories
		SET
			inventory_category_list = $2,
			parent_id = $3,
			type = $4,
			status = $5
		WHERE id = $1
		RETURNING
			id,
			COALESCE(inventory_category_list, ''),
			LOWER(BTRIM(COALESCE(type, ''))),
			COALESCE(status, 1),
			NULLIF(COALESCE(parent_id, 0), 0)
		`,
		id,
		body.Name,
		parentID,
		body.Type,
		body.Status,
	).Scan(
		&item.ID,
		&item.Name,
		&item.Type,
		&item.Status,
		&item.ParentID,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, item)
}

/* ============================================================
   COMPONENT MASTER
   Source: public.inventory_components

   A dedicated table is intentionally used instead of stack_inventory because
   stack_inventory contains stock transactions/serial identities, while this
   table stores reusable CPU/RAM/SSD/Monitor reference values.
============================================================ */

func (h *CategoryHandler) ensureMasterComponents(
	ctx context.Context,
) error {
	_, err := h.db.Exec(
		ctx,
		`
		CREATE TABLE IF NOT EXISTS public.inventory_components (
			id BIGSERIAL PRIMARY KEY,
			component_type VARCHAR(20) NOT NULL,
			component_name VARCHAR(255) NOT NULL,
			status INTEGER NOT NULL DEFAULT 1,
			created_by VARCHAR(100),
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			edited_by VARCHAR(100),
			edited_at TIMESTAMPTZ
		);

		CREATE INDEX IF NOT EXISTS idx_inventory_components_type_status
			ON public.inventory_components (
				component_type,
				status
			);
		`,
	)
	return err
}

func (h *CategoryHandler) MasterComponents(c *gin.Context) {
	ctx := c.Request.Context()

	if err := h.ensureMasterComponents(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	rows, err := h.db.Query(
		ctx,
		`
		SELECT
			id,
			LOWER(BTRIM(component_type)),
			COALESCE(component_name, ''),
			COALESCE(status, 1)
		FROM public.inventory_components
		WHERE LOWER(BTRIM(component_type)) IN (
			'cpu',
			'ram',
			'ssd',
			'monitor'
		)
		ORDER BY
			CASE LOWER(BTRIM(component_type))
				WHEN 'cpu' THEN 1
				WHEN 'ram' THEN 2
				WHEN 'ssd' THEN 3
				WHEN 'monitor' THEN 4
				ELSE 5
			END,
			LOWER(BTRIM(component_name)) ASC,
			id ASC
		`,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]masterComponentItem, 0)

	for rows.Next() {
		var item masterComponentItem

		if err := rows.Scan(
			&item.ID,
			&item.Type,
			&item.Name,
			&item.Status,
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

func (h *CategoryHandler) MasterCreateComponent(c *gin.Context) {
	ctx := c.Request.Context()

	if err := h.ensureMasterComponents(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	var body struct {
		Type   string `json:"type"`
		Name   string `json:"name"`
		Status int    `json:"status"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	body.Type = strings.ToLower(strings.TrimSpace(body.Type))
	body.Name = strings.TrimSpace(body.Name)
	body.Status = normalizeMasterStatus(body.Status)

	if !validComponentType(body.Type) {
		response.BadRequest(c, "type must be cpu, ram, ssd or monitor")
		return
	}

	if body.Name == "" {
		response.BadRequest(c, "Component specification is required")
		return
	}

	var duplicate bool

	if err := h.db.QueryRow(
		ctx,
		`
		SELECT EXISTS (
			SELECT 1
			FROM public.inventory_components
			WHERE LOWER(BTRIM(component_type)) = $1
			  AND LOWER(BTRIM(component_name)) = LOWER(BTRIM($2))
		)
		`,
		body.Type,
		body.Name,
	).Scan(&duplicate); err != nil {
		response.ServerError(c, err)
		return
	}

	if duplicate {
		response.BadRequest(c, "Component already exists")
		return
	}

	employeeID := strings.TrimSpace(
		c.GetString("employee_id"),
	)

	var item masterComponentItem

	err := h.db.QueryRow(
		ctx,
		`
		INSERT INTO public.inventory_components (
			component_type,
			component_name,
			status,
			created_by
		)
		VALUES (
			$1,
			$2,
			$3,
			$4
		)
		RETURNING
			id,
			LOWER(BTRIM(component_type)),
			component_name,
			status
		`,
		body.Type,
		body.Name,
		body.Status,
		employeeID,
	).Scan(
		&item.ID,
		&item.Type,
		&item.Name,
		&item.Status,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.Created(c, item)
}

func (h *CategoryHandler) MasterUpdateComponent(c *gin.Context) {
	ctx := c.Request.Context()

	if err := h.ensureMasterComponents(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	id, ok := parseMasterID(c)
	if !ok {
		return
	}

	var body struct {
		Type   string `json:"type"`
		Name   string `json:"name"`
		Status int    `json:"status"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	body.Type = strings.ToLower(strings.TrimSpace(body.Type))
	body.Name = strings.TrimSpace(body.Name)
	body.Status = normalizeMasterStatus(body.Status)

	if !validComponentType(body.Type) {
		response.BadRequest(c, "type must be cpu, ram, ssd or monitor")
		return
	}

	if body.Name == "" {
		response.BadRequest(c, "Component specification is required")
		return
	}

	var duplicate bool

	if err := h.db.QueryRow(
		ctx,
		`
		SELECT EXISTS (
			SELECT 1
			FROM public.inventory_components
			WHERE id <> $1
			  AND LOWER(BTRIM(component_type)) = $2
			  AND LOWER(BTRIM(component_name)) = LOWER(BTRIM($3))
		)
		`,
		id,
		body.Type,
		body.Name,
	).Scan(&duplicate); err != nil {
		response.ServerError(c, err)
		return
	}

	if duplicate {
		response.BadRequest(c, "Another component with this specification already exists")
		return
	}

	employeeID := strings.TrimSpace(
		c.GetString("employee_id"),
	)

	var item masterComponentItem

	err := h.db.QueryRow(
		ctx,
		`
		UPDATE public.inventory_components
		SET
			component_type = $2,
			component_name = $3,
			status = $4,
			edited_by = $5,
			edited_at = CURRENT_TIMESTAMP
		WHERE id = $1
		RETURNING
			id,
			LOWER(BTRIM(component_type)),
			component_name,
			status
		`,
		id,
		body.Type,
		body.Name,
		body.Status,
		employeeID,
	).Scan(
		&item.ID,
		&item.Type,
		&item.Name,
		&item.Status,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, item)
}

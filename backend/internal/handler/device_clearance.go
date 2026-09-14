package handler

import (
	"fmt"
	"strconv"
	"strings"

	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type clearanceEmployeeSnapshot struct {
	EmployeeID   string
	EmployeeName string
	Designation  string
	Department   string
	WorkField    string
	Phone        string
	Email        string
	Picture      string
	JoiningDate  string
}

type joiningRequirementSet struct {
	Device           bool
	VPN              bool
	IPPhone          bool
	Printer          bool
	EndpointSecurity bool
	CardAccess       bool
}

type joiningCompletionSet struct {
	Device           bool
	VPN              bool
	IPPhone          bool
	Printer          bool
	EndpointSecurity bool
	CardAccess       bool
}

type exitCompletionSet struct {
	DeviceReturned       bool
	VPNRemoved           bool
	IPPhoneDisabled      bool
	PrinterAccessRemoved bool
	PandaRemoved         bool
	CardAccessRemoved    bool
}

func normalizeLifecycleMode(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "joining":
		return "Joining"
	case "retirement":
		return "Retirement"
	case "contract end", "contract_end", "contract-end":
		return "Contract End"
	case "termination":
		return "Termination"
	case "other":
		return "Other"
	default:
		return "Resignation"
	}
}

func isJoiningMode(value string) bool {
	return normalizeLifecycleMode(value) == "Joining"
}

func joiningRequirementCount(r joiningRequirementSet) int {
	count := 0
	for _, value := range []bool{
		r.Device,
		r.VPN,
		r.IPPhone,
		r.Printer,
		r.EndpointSecurity,
		r.CardAccess,
	} {
		if value {
			count++
		}
	}
	return count
}

func joiningCompletedCount(r joiningRequirementSet, c joiningCompletionSet) int {
	count := 0

	if r.Device && c.Device {
		count++
	}
	if r.VPN && c.VPN {
		count++
	}
	if r.IPPhone && c.IPPhone {
		count++
	}
	if r.Printer && c.Printer {
		count++
	}
	if r.EndpointSecurity && c.EndpointSecurity {
		count++
	}
	if r.CardAccess && c.CardAccess {
		count++
	}

	return count
}

func joiningAllRequiredCompleted(r joiningRequirementSet, c joiningCompletionSet) bool {
	return joiningRequirementCount(r) > 0 &&
		(!r.Device || c.Device) &&
		(!r.VPN || c.VPN) &&
		(!r.IPPhone || c.IPPhone) &&
		(!r.Printer || c.Printer) &&
		(!r.EndpointSecurity || c.EndpointSecurity) &&
		(!r.CardAccess || c.CardAccess)
}

func exitCompletedCount(c exitCompletionSet) int {
	count := 0
	for _, value := range []bool{
		c.DeviceReturned,
		c.VPNRemoved,
		c.IPPhoneDisabled,
		c.PrinterAccessRemoved,
		c.PandaRemoved,
		c.CardAccessRemoved,
	} {
		if value {
			count++
		}
	}
	return count
}

func (h *DashboardHandler) getClearanceEmployee(c *gin.Context, employeeID string) (clearanceEmployeeSnapshot, error) {
	var e clearanceEmployeeSnapshot
	err := h.db.QueryRow(c.Request.Context(), `
        SELECT
            BTRIM(COALESCE(o.employee_id,'')),
            BTRIM(COALESCE(o.employee_name,'')),
            BTRIM(COALESCE(o.designation,'')),
            BTRIM(COALESCE(o.department_name,'')),
            BTRIM(COALESCE(o.work_field,'')),
            COALESCE(NULLIF(BTRIM(COALESCE(p.official_cell_no,'')),''), NULLIF(BTRIM(COALESCE(p.personal_cell_no,'')),''), ''),
            COALESCE(NULLIF(BTRIM(COALESCE(p.official_email,'')),''), NULLIF(BTRIM(COALESCE(p.email,'')),''), ''),
            BTRIM(COALESCE(p.picture,'')),
            COALESCE(o.joining_date::text,'')
        FROM public.employee_office_info o
        LEFT JOIN public.employee_personal_info p
            ON BTRIM(COALESCE(p.employee_id,'')) = BTRIM(COALESCE(o.employee_id,''))
        WHERE BTRIM(COALESCE(o.employee_id,'')) = $1
        LIMIT 1
    `, strings.TrimSpace(employeeID)).Scan(
		&e.EmployeeID,
		&e.EmployeeName,
		&e.Designation,
		&e.Department,
		&e.WorkField,
		&e.Phone,
		&e.Email,
		&e.Picture,
		&e.JoiningDate,
	)
	return e, err
}

func (h *DashboardHandler) CreateDeviceClearance(c *gin.Context) {
	ctx := c.Request.Context()

	var body struct {
		RequestType   string `json:"request_type"`
		EffectiveDate string `json:"effective_date"`

		EmployeeID      string `json:"employee_id"`
		AssignedTo      string `json:"assigned_to"`
		ResignationDate string `json:"resignation_date"`
		SeparationMode  string `json:"separation_mode"`
		Remarks         string `json:"remarks"`

		JoiningDeviceRequired           bool `json:"joining_device_required"`
		JoiningVPNRequired              bool `json:"joining_vpn_required"`
		JoiningIPPhoneRequired          bool `json:"joining_ip_phone_required"`
		JoiningPrinterRequired          bool `json:"joining_printer_required"`
		JoiningEndpointSecurityRequired bool `json:"joining_endpoint_security_required"`
		JoiningCardAccessRequired       bool `json:"joining_card_access_required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	body.EmployeeID = strings.TrimSpace(body.EmployeeID)
	body.AssignedTo = strings.TrimSpace(body.AssignedTo)
	body.ResignationDate = strings.TrimSpace(body.ResignationDate)
	body.EffectiveDate = strings.TrimSpace(body.EffectiveDate)
	body.SeparationMode = strings.TrimSpace(body.SeparationMode)
	body.RequestType = strings.TrimSpace(body.RequestType)
	body.Remarks = strings.TrimSpace(body.Remarks)

	mode := body.RequestType
	if mode == "" {
		mode = body.SeparationMode
	}
	mode = normalizeLifecycleMode(mode)

	effectiveDate := body.EffectiveDate
	if effectiveDate == "" {
		effectiveDate = body.ResignationDate
	}

	if body.EmployeeID == "" || body.AssignedTo == "" {
		response.BadRequest(c, "employee_id and assigned_to are required")
		return
	}

	if body.EmployeeID == body.AssignedTo {
		response.BadRequest(c, "the selected employee cannot complete their own IT lifecycle task")
		return
	}

	requirements := joiningRequirementSet{
		Device:           body.JoiningDeviceRequired,
		VPN:              body.JoiningVPNRequired,
		IPPhone:          body.JoiningIPPhoneRequired,
		Printer:          body.JoiningPrinterRequired,
		EndpointSecurity: body.JoiningEndpointSecurityRequired,
		CardAccess:       body.JoiningCardAccessRequired,
	}

	if isJoiningMode(mode) && joiningRequirementCount(requirements) == 0 {
		response.BadRequest(c, "select at least one joining IT preparation item")
		return
	}

	if !isJoiningMode(mode) {
		requirements = joiningRequirementSet{}
	}

	createdBy := strings.TrimSpace(c.GetString("employee_id"))
	if createdBy == "" {
		response.BadRequest(c, "authenticated employee ID is missing")
		return
	}

	employee, err := h.getClearanceEmployee(c, body.EmployeeID)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.BadRequest(c, "selected employee was not found")
			return
		}
		response.ServerError(c, err)
		return
	}

	/*
		Joining date is owned by HRIS / employee_office_info.
		Do not trust or duplicate a client-entered Joining date.

		For exit workflows, resignation_date remains the workflow-specific
		date stored in device_clearances.
	*/
	storedExitDate := effectiveDate

	if isJoiningMode(mode) {
		effectiveDate = strings.TrimSpace(employee.JoiningDate)
		storedExitDate = ""

		if effectiveDate == "" {
			response.BadRequest(c, "joining date is missing in employee_office_info")
			return
		}
	} else if effectiveDate == "" {
		response.BadRequest(c, "last working / effective date is required")
		return
	}

	assignee, err := h.getClearanceEmployee(c, body.AssignedTo)
	if err != nil {
		if err == pgx.ErrNoRows {
			response.BadRequest(c, "assigned IT employee was not found")
			return
		}
		response.ServerError(c, err)
		return
	}

	var validAssignee bool
	if err := h.db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM public.employee_office_info
			WHERE BTRIM(COALESCE(employee_id,''))=$1
			  AND UPPER(BTRIM(COALESCE(work_field,'')))='IT'
			  AND LOWER(BTRIM(COALESCE(active,''))) IN ('active','yes')
		)
	`, body.AssignedTo).Scan(&validAssignee); err != nil {
		response.ServerError(c, err)
		return
	}

	if !validAssignee {
		response.BadRequest(c, "assigned employee must be an active IT employee")
		return
	}

	var openID int64
	err = h.db.QueryRow(ctx, `
		SELECT id
		FROM public.device_clearances
		WHERE employee_id=$1
		  AND deleted_at IS NULL
		  AND status IN ('Pending Clearance','In Process')
		ORDER BY id DESC
		LIMIT 1
	`, body.EmployeeID).Scan(&openID)

	if err == nil {
		response.BadRequest(c, fmt.Sprintf("an open IT lifecycle task already exists for this employee (ID %d)", openID))
		return
	}

	if err != pgx.ErrNoRows {
		response.ServerError(c, err)
		return
	}

	createdByName := ""
	_ = h.db.QueryRow(ctx, `
		SELECT BTRIM(COALESCE(employee_name,''))
		FROM public.employee_office_info
		WHERE BTRIM(COALESCE(employee_id,''))=$1
		LIMIT 1
	`, createdBy).Scan(&createdByName)

	var id int64
	var ref string

	err = h.db.QueryRow(ctx, `
		INSERT INTO public.device_clearances (
			employee_id,
			employee_name,
			designation,
			department,
			work_field,
			phone,
			email,
			employee_picture,

			resignation_date,
			separation_mode,
			remarks,

			assigned_to,
			assigned_to_name,
			assigned_at,

			joining_device_required,
			joining_device_completed,
			joining_vpn_required,
			joining_vpn_completed,
			joining_ip_phone_required,
			joining_ip_phone_completed,
			joining_printer_required,
			joining_printer_completed,
			joining_endpoint_security_required,
			joining_endpoint_security_completed,
			joining_card_access_required,
			joining_card_access_completed,

			device_returned,
			vpn_removed,
			ip_phone_disabled,
			printer_access_removed,
			panda_removed,
			card_access_removed,

			ec_given,
			status,

			created_by,
			created_by_name,
			created_at,

			updated_by,
			updated_by_name,
			updated_at
		)
		VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,

			NULLIF($9,'')::date,
			$10,
			NULLIF($11,''),

			$12,
			$13,
			CURRENT_TIMESTAMP,

			$14,FALSE,
			$15,FALSE,
			$16,FALSE,
			$17,FALSE,
			$18,FALSE,
			$19,FALSE,

			FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,

			FALSE,
			'Pending Clearance',

			$20,
			NULLIF($21,''),
			CURRENT_TIMESTAMP,

			$20,
			NULLIF($21,''),
			CURRENT_TIMESTAMP
		)
		RETURNING id, reference_no
	`,
		employee.EmployeeID,
		employee.EmployeeName,
		employee.Designation,
		employee.Department,
		employee.WorkField,
		employee.Phone,
		employee.Email,
		employee.Picture,

		storedExitDate,
		mode,
		body.Remarks,

		assignee.EmployeeID,
		assignee.EmployeeName,

		requirements.Device,
		requirements.VPN,
		requirements.IPPhone,
		requirements.Printer,
		requirements.EndpointSecurity,
		requirements.CardAccess,

		createdBy,
		createdByName,
	).Scan(&id, &ref)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	requiredCount := 6
	if isJoiningMode(mode) {
		requiredCount = joiningRequirementCount(requirements)
	}

	response.Created(c, gin.H{
		"id":                       id,
		"reference_no":             ref,
		"status":                   "Pending Clearance",
		"separation_mode":          mode,
		"resignation_date":         effectiveDate,
		"checklist_required_count": requiredCount,
	})
}

func (h *DashboardHandler) ListDeviceClearances(c *gin.Context) {
	ctx := c.Request.Context()

	statusFilter := strings.TrimSpace(c.Query("status"))
	search := strings.TrimSpace(c.Query("search"))

	rows, err := h.db.Query(ctx, `
		SELECT
			dc.id,
			COALESCE(dc.reference_no,''),

			COALESCE(dc.employee_id,''),
			COALESCE(dc.employee_name,''),
			COALESCE(dc.designation,''),
			COALESCE(dc.department,''),

			COALESCE(dc.assigned_to,''),
			COALESCE(dc.assigned_to_name,''),

			CASE
				WHEN LOWER(BTRIM(COALESCE(dc.separation_mode,''))) = 'joining'
					THEN COALESCE(o.joining_date::text,'')
				ELSE COALESCE(dc.resignation_date::text,'')
			END,
			COALESCE(dc.separation_mode,'Resignation'),

			COALESCE(dc.joining_device_required,FALSE),
			COALESCE(dc.joining_device_completed,FALSE),
			COALESCE(dc.joining_vpn_required,FALSE),
			COALESCE(dc.joining_vpn_completed,FALSE),
			COALESCE(dc.joining_ip_phone_required,FALSE),
			COALESCE(dc.joining_ip_phone_completed,FALSE),
			COALESCE(dc.joining_printer_required,FALSE),
			COALESCE(dc.joining_printer_completed,FALSE),
			COALESCE(dc.joining_endpoint_security_required,FALSE),
			COALESCE(dc.joining_endpoint_security_completed,FALSE),
			COALESCE(dc.joining_card_access_required,FALSE),
			COALESCE(dc.joining_card_access_completed,FALSE),

			COALESCE(dc.device_returned,FALSE),
			COALESCE(dc.vpn_removed,FALSE),
			COALESCE(dc.ip_phone_disabled,FALSE),
			COALESCE(dc.printer_access_removed,FALSE),
			COALESCE(dc.panda_removed,FALSE),
			COALESCE(dc.card_access_removed,FALSE),

			COALESCE(dc.status,''),
			COALESCE(dc.created_at::text,''),
			COALESCE(dc.completed_at::text,'')

		FROM public.device_clearances dc

		LEFT JOIN public.employee_office_info o
			ON BTRIM(COALESCE(o.employee_id,'')) =
			   BTRIM(COALESCE(dc.employee_id,''))

		WHERE dc.deleted_at IS NULL
		  AND ($1='' OR dc.status=$1)
		  AND (
				$2=''
				OR dc.reference_no ILIKE '%' || $2 || '%'
				OR dc.employee_id ILIKE '%' || $2 || '%'
				OR dc.employee_name ILIKE '%' || $2 || '%'
				OR dc.assigned_to ILIKE '%' || $2 || '%'
				OR dc.assigned_to_name ILIKE '%' || $2 || '%'
		  )

		ORDER BY dc.id DESC
		LIMIT 500
	`, statusFilter, search)

	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	items := make([]gin.H, 0)

	for rows.Next() {
		var (
			id                                                      int64
			ref                                                     string
			employeeID, employeeName, designation, department       string
			assignedTo, assignedName, effectiveDate, separationMode string

			requirements joiningRequirementSet
			joiningDone  joiningCompletionSet
			exitDone     exitCompletionSet

			status, createdAt, completedAt string
		)

		if err := rows.Scan(
			&id,
			&ref,

			&employeeID,
			&employeeName,
			&designation,
			&department,

			&assignedTo,
			&assignedName,

			&effectiveDate,
			&separationMode,

			&requirements.Device,
			&joiningDone.Device,
			&requirements.VPN,
			&joiningDone.VPN,
			&requirements.IPPhone,
			&joiningDone.IPPhone,
			&requirements.Printer,
			&joiningDone.Printer,
			&requirements.EndpointSecurity,
			&joiningDone.EndpointSecurity,
			&requirements.CardAccess,
			&joiningDone.CardAccess,

			&exitDone.DeviceReturned,
			&exitDone.VPNRemoved,
			&exitDone.IPPhoneDisabled,
			&exitDone.PrinterAccessRemoved,
			&exitDone.PandaRemoved,
			&exitDone.CardAccessRemoved,

			&status,
			&createdAt,
			&completedAt,
		); err != nil {
			response.ServerError(c, err)
			return
		}

		requiredCount := 6
		completedCount := exitCompletedCount(exitDone)

		if isJoiningMode(separationMode) {
			requiredCount = joiningRequirementCount(requirements)
			completedCount = joiningCompletedCount(requirements, joiningDone)
		}

		items = append(items, gin.H{
			"id":           id,
			"reference_no": ref,

			"employee_id":   employeeID,
			"employee_name": employeeName,
			"designation":   designation,
			"department":    department,

			"assigned_to":      assignedTo,
			"assigned_to_name": assignedName,

			"resignation_date": effectiveDate,
			"effective_date":   effectiveDate,
			"separation_mode":  separationMode,
			"request_type":     separationMode,

			"joining_device_required":             requirements.Device,
			"joining_device_completed":            joiningDone.Device,
			"joining_vpn_required":                requirements.VPN,
			"joining_vpn_completed":               joiningDone.VPN,
			"joining_ip_phone_required":           requirements.IPPhone,
			"joining_ip_phone_completed":          joiningDone.IPPhone,
			"joining_printer_required":            requirements.Printer,
			"joining_printer_completed":           joiningDone.Printer,
			"joining_endpoint_security_required":  requirements.EndpointSecurity,
			"joining_endpoint_security_completed": joiningDone.EndpointSecurity,
			"joining_card_access_required":        requirements.CardAccess,
			"joining_card_access_completed":       joiningDone.CardAccess,

			"device_returned":        exitDone.DeviceReturned,
			"vpn_removed":            exitDone.VPNRemoved,
			"ip_phone_disabled":      exitDone.IPPhoneDisabled,
			"printer_access_removed": exitDone.PrinterAccessRemoved,
			"panda_removed":          exitDone.PandaRemoved,
			"card_access_removed":    exitDone.CardAccessRemoved,

			"checklist_required_count":  requiredCount,
			"checklist_completed_count": completedCount,

			"status":       status,
			"created_at":   createdAt,
			"completed_at": completedAt,
		})
	}

	if err := rows.Err(); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, items)
}

func (h *DashboardHandler) GetDeviceClearance(c *gin.Context) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid lifecycle task id")
		return
	}

	var item struct {
		Ref          string
		EmployeeID   string
		EmployeeName string
		Designation  string
		Department   string
		WorkField    string
		Phone        string
		Email        string
		Picture      string

		EffectiveDate  string
		SeparationMode string
		Remarks        string
		AssignedTo     string
		AssignedToName string

		Requirements joiningRequirementSet
		JoiningDone  joiningCompletionSet
		ExitDone     exitCompletionSet

		ECGiven bool
		Status  string

		CreatedBy       string
		CreatedByName   string
		CreatedAt       string
		CompletedBy     string
		CompletedByName string
		CompletedAt     string
	}

	err = h.db.QueryRow(c.Request.Context(), `
		SELECT
			COALESCE(dc.reference_no,''),

			COALESCE(dc.employee_id,''),
			COALESCE(dc.employee_name,''),
			COALESCE(dc.designation,''),
			COALESCE(dc.department,''),
			COALESCE(dc.work_field,''),
			COALESCE(dc.phone,''),
			COALESCE(dc.email,''),
			COALESCE(dc.employee_picture,''),

			CASE
				WHEN LOWER(BTRIM(COALESCE(dc.separation_mode,''))) = 'joining'
					THEN COALESCE(o.joining_date::text,'')
				ELSE COALESCE(dc.resignation_date::text,'')
			END,
			COALESCE(dc.separation_mode,'Resignation'),
			COALESCE(dc.remarks,''),
			COALESCE(dc.assigned_to,''),
			COALESCE(dc.assigned_to_name,''),

			COALESCE(dc.joining_device_required,FALSE),
			COALESCE(dc.joining_device_completed,FALSE),
			COALESCE(dc.joining_vpn_required,FALSE),
			COALESCE(dc.joining_vpn_completed,FALSE),
			COALESCE(dc.joining_ip_phone_required,FALSE),
			COALESCE(dc.joining_ip_phone_completed,FALSE),
			COALESCE(dc.joining_printer_required,FALSE),
			COALESCE(dc.joining_printer_completed,FALSE),
			COALESCE(dc.joining_endpoint_security_required,FALSE),
			COALESCE(dc.joining_endpoint_security_completed,FALSE),
			COALESCE(dc.joining_card_access_required,FALSE),
			COALESCE(dc.joining_card_access_completed,FALSE),

			COALESCE(dc.device_returned,FALSE),
			COALESCE(dc.vpn_removed,FALSE),
			COALESCE(dc.ip_phone_disabled,FALSE),
			COALESCE(dc.printer_access_removed,FALSE),
			COALESCE(dc.panda_removed,FALSE),
			COALESCE(dc.card_access_removed,FALSE),

			COALESCE(dc.ec_given,FALSE),
			COALESCE(dc.status,''),

			COALESCE(dc.created_by,''),
			COALESCE(dc.created_by_name,''),
			COALESCE(dc.created_at::text,''),

			COALESCE(dc.completed_by,''),
			COALESCE(dc.completed_by_name,''),
			COALESCE(dc.completed_at::text,'')

		FROM public.device_clearances dc

		LEFT JOIN public.employee_office_info o
			ON BTRIM(COALESCE(o.employee_id,'')) =
			   BTRIM(COALESCE(dc.employee_id,''))

		WHERE dc.id=$1
		  AND dc.deleted_at IS NULL
	`, id).Scan(
		&item.Ref,

		&item.EmployeeID,
		&item.EmployeeName,
		&item.Designation,
		&item.Department,
		&item.WorkField,
		&item.Phone,
		&item.Email,
		&item.Picture,

		&item.EffectiveDate,
		&item.SeparationMode,
		&item.Remarks,
		&item.AssignedTo,
		&item.AssignedToName,

		&item.Requirements.Device,
		&item.JoiningDone.Device,
		&item.Requirements.VPN,
		&item.JoiningDone.VPN,
		&item.Requirements.IPPhone,
		&item.JoiningDone.IPPhone,
		&item.Requirements.Printer,
		&item.JoiningDone.Printer,
		&item.Requirements.EndpointSecurity,
		&item.JoiningDone.EndpointSecurity,
		&item.Requirements.CardAccess,
		&item.JoiningDone.CardAccess,

		&item.ExitDone.DeviceReturned,
		&item.ExitDone.VPNRemoved,
		&item.ExitDone.IPPhoneDisabled,
		&item.ExitDone.PrinterAccessRemoved,
		&item.ExitDone.PandaRemoved,
		&item.ExitDone.CardAccessRemoved,

		&item.ECGiven,
		&item.Status,

		&item.CreatedBy,
		&item.CreatedByName,
		&item.CreatedAt,

		&item.CompletedBy,
		&item.CompletedByName,
		&item.CompletedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "lifecycle task not found")
			return
		}
		response.ServerError(c, err)
		return
	}

	var assignedDevices int
	_ = h.db.QueryRow(c.Request.Context(), `
		SELECT COUNT(*)::int
		FROM public.it_equipment
		WHERE BTRIM(COALESCE(emp_id,''))=$1
		  AND COALESCE(active,0)>0
		  AND (
				BTRIM(COALESCE(status,''))='1'
				OR LOWER(BTRIM(COALESCE(status,'')))='assigned'
		  )
	`, item.EmployeeID).Scan(&assignedDevices)

	requiredCount := 6
	completedCount := exitCompletedCount(item.ExitDone)

	if isJoiningMode(item.SeparationMode) {
		requiredCount = joiningRequirementCount(item.Requirements)
		completedCount = joiningCompletedCount(item.Requirements, item.JoiningDone)
	}

	currentEmployee := strings.TrimSpace(c.GetString("employee_id"))
	canEdit := currentEmployee != "" &&
		currentEmployee == item.AssignedTo &&
		item.Status != "Completed" &&
		item.Status != "Cancelled"

	response.OK(c, gin.H{
		"id":           id,
		"reference_no": item.Ref,

		"employee_id":      item.EmployeeID,
		"employee_name":    item.EmployeeName,
		"designation":      item.Designation,
		"department":       item.Department,
		"work_field":       item.WorkField,
		"phone":            item.Phone,
		"email":            item.Email,
		"employee_picture": item.Picture,

		"resignation_date": item.EffectiveDate,
		"effective_date":   item.EffectiveDate,
		"separation_mode":  item.SeparationMode,
		"request_type":     item.SeparationMode,
		"remarks":          item.Remarks,

		"assigned_to":      item.AssignedTo,
		"assigned_to_name": item.AssignedToName,

		"joining_device_required":             item.Requirements.Device,
		"joining_device_completed":            item.JoiningDone.Device,
		"joining_vpn_required":                item.Requirements.VPN,
		"joining_vpn_completed":               item.JoiningDone.VPN,
		"joining_ip_phone_required":           item.Requirements.IPPhone,
		"joining_ip_phone_completed":          item.JoiningDone.IPPhone,
		"joining_printer_required":            item.Requirements.Printer,
		"joining_printer_completed":           item.JoiningDone.Printer,
		"joining_endpoint_security_required":  item.Requirements.EndpointSecurity,
		"joining_endpoint_security_completed": item.JoiningDone.EndpointSecurity,
		"joining_card_access_required":        item.Requirements.CardAccess,
		"joining_card_access_completed":       item.JoiningDone.CardAccess,

		"device_returned":        item.ExitDone.DeviceReturned,
		"vpn_removed":            item.ExitDone.VPNRemoved,
		"ip_phone_disabled":      item.ExitDone.IPPhoneDisabled,
		"printer_access_removed": item.ExitDone.PrinterAccessRemoved,
		"panda_removed":          item.ExitDone.PandaRemoved,
		"card_access_removed":    item.ExitDone.CardAccessRemoved,

		"checklist_required_count":  requiredCount,
		"checklist_completed_count": completedCount,

		"ec_given": item.ECGiven,
		"status":   item.Status,
		"can_edit": canEdit,

		"created_by":        item.CreatedBy,
		"created_by_name":   item.CreatedByName,
		"created_at":        item.CreatedAt,
		"completed_by":      item.CompletedBy,
		"completed_by_name": item.CompletedByName,
		"completed_at":      item.CompletedAt,

		"currently_assigned_devices": assignedDevices,
	})
}

func (h *DashboardHandler) UpdateDeviceClearanceChecklist(c *gin.Context) {
	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid lifecycle task id")
		return
	}

	var body struct {
		JoiningDeviceCompleted           bool `json:"joining_device_completed"`
		JoiningVPNCompleted              bool `json:"joining_vpn_completed"`
		JoiningIPPhoneCompleted          bool `json:"joining_ip_phone_completed"`
		JoiningPrinterCompleted          bool `json:"joining_printer_completed"`
		JoiningEndpointSecurityCompleted bool `json:"joining_endpoint_security_completed"`
		JoiningCardAccessCompleted       bool `json:"joining_card_access_completed"`

		DeviceReturned       bool `json:"device_returned"`
		VPNRemoved           bool `json:"vpn_removed"`
		IPPhoneDisabled      bool `json:"ip_phone_disabled"`
		PrinterAccessRemoved bool `json:"printer_access_removed"`
		PandaRemoved         bool `json:"panda_removed"`
		CardAccessRemoved    bool `json:"card_access_removed"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "invalid request body")
		return
	}

	currentEmployee := strings.TrimSpace(c.GetString("employee_id"))
	if currentEmployee == "" {
		response.BadRequest(c, "authenticated employee ID is missing")
		return
	}

	var (
		assignedTo, currentStatus, separationMode string
		requirements                              joiningRequirementSet
	)

	err = h.db.QueryRow(c.Request.Context(), `
		SELECT
			COALESCE(assigned_to,''),
			COALESCE(status,''),
			COALESCE(separation_mode,'Resignation'),

			COALESCE(joining_device_required,FALSE),
			COALESCE(joining_vpn_required,FALSE),
			COALESCE(joining_ip_phone_required,FALSE),
			COALESCE(joining_printer_required,FALSE),
			COALESCE(joining_endpoint_security_required,FALSE),
			COALESCE(joining_card_access_required,FALSE)

		FROM public.device_clearances

		WHERE id=$1
		  AND deleted_at IS NULL
	`, id).Scan(
		&assignedTo,
		&currentStatus,
		&separationMode,

		&requirements.Device,
		&requirements.VPN,
		&requirements.IPPhone,
		&requirements.Printer,
		&requirements.EndpointSecurity,
		&requirements.CardAccess,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "lifecycle task not found")
			return
		}
		response.ServerError(c, err)
		return
	}

	if currentStatus == "Completed" || currentStatus == "Cancelled" {
		response.BadRequest(c, "completed or cancelled lifecycle task cannot be edited")
		return
	}

	if assignedTo != currentEmployee {
		response.BadRequest(c, "only the assigned IT employee can update this lifecycle task")
		return
	}

	updatedByName := ""
	_ = h.db.QueryRow(c.Request.Context(), `
		SELECT BTRIM(COALESCE(employee_name,''))
		FROM public.employee_office_info
		WHERE BTRIM(COALESCE(employee_id,''))=$1
		LIMIT 1
	`, currentEmployee).Scan(&updatedByName)

	status := "Pending Clearance"
	completedCount := 0
	requiredCount := 6

	if isJoiningMode(separationMode) {
		if joiningRequirementCount(requirements) == 0 {
			response.BadRequest(c, "this joining task has no selected checklist items")
			return
		}

		done := joiningCompletionSet{
			Device:           requirements.Device && body.JoiningDeviceCompleted,
			VPN:              requirements.VPN && body.JoiningVPNCompleted,
			IPPhone:          requirements.IPPhone && body.JoiningIPPhoneCompleted,
			Printer:          requirements.Printer && body.JoiningPrinterCompleted,
			EndpointSecurity: requirements.EndpointSecurity && body.JoiningEndpointSecurityCompleted,
			CardAccess:       requirements.CardAccess && body.JoiningCardAccessCompleted,
		}

		completedCount = joiningCompletedCount(requirements, done)
		requiredCount = joiningRequirementCount(requirements)

		if completedCount > 0 {
			status = "In Process"
		}

		_, err = h.db.Exec(c.Request.Context(), `
			UPDATE public.device_clearances
			SET
				joining_device_completed=$1,
				joining_vpn_completed=$2,
				joining_ip_phone_completed=$3,
				joining_printer_completed=$4,
				joining_endpoint_security_completed=$5,
				joining_card_access_completed=$6,

				status=$7,
				updated_by=$8,
				updated_by_name=NULLIF($9,''),
				updated_at=CURRENT_TIMESTAMP

			WHERE id=$10
			  AND deleted_at IS NULL
		`,
			done.Device,
			done.VPN,
			done.IPPhone,
			done.Printer,
			done.EndpointSecurity,
			done.CardAccess,

			status,
			currentEmployee,
			updatedByName,
			id,
		)
	} else {
		exitDone := exitCompletionSet{
			DeviceReturned:       body.DeviceReturned,
			VPNRemoved:           body.VPNRemoved,
			IPPhoneDisabled:      body.IPPhoneDisabled,
			PrinterAccessRemoved: body.PrinterAccessRemoved,
			PandaRemoved:         body.PandaRemoved,
			CardAccessRemoved:    body.CardAccessRemoved,
		}

		completedCount = exitCompletedCount(exitDone)

		if completedCount > 0 {
			status = "In Process"
		}

		_, err = h.db.Exec(c.Request.Context(), `
			UPDATE public.device_clearances
			SET
				device_returned=$1,
				vpn_removed=$2,
				ip_phone_disabled=$3,
				printer_access_removed=$4,
				panda_removed=$5,
				card_access_removed=$6,

				status=$7,
				updated_by=$8,
				updated_by_name=NULLIF($9,''),
				updated_at=CURRENT_TIMESTAMP

			WHERE id=$10
			  AND deleted_at IS NULL
		`,
			exitDone.DeviceReturned,
			exitDone.VPNRemoved,
			exitDone.IPPhoneDisabled,
			exitDone.PrinterAccessRemoved,
			exitDone.PandaRemoved,
			exitDone.CardAccessRemoved,

			status,
			currentEmployee,
			updatedByName,
			id,
		)
	}

	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, gin.H{
		"id":                        id,
		"status":                    status,
		"checklist_required_count":  requiredCount,
		"checklist_completed_count": completedCount,
	})
}

func (h *DashboardHandler) CompleteDeviceClearance(c *gin.Context) {
	ctx := c.Request.Context()

	id, err := strconv.ParseInt(strings.TrimSpace(c.Param("id")), 10, 64)
	if err != nil || id <= 0 {
		response.BadRequest(c, "invalid lifecycle task id")
		return
	}

	currentEmployee := strings.TrimSpace(c.GetString("employee_id"))
	if currentEmployee == "" {
		response.BadRequest(c, "authenticated employee ID is missing")
		return
	}

	tx, err := h.db.Begin(ctx)
	if err != nil {
		response.ServerError(c, err)
		return
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var (
		employeeID, assignedTo, status, separationMode string
		requirements                                   joiningRequirementSet
		joiningDone                                    joiningCompletionSet
		exitDone                                       exitCompletionSet
	)

	err = tx.QueryRow(ctx, `
		SELECT
			COALESCE(employee_id,''),
			COALESCE(assigned_to,''),
			COALESCE(status,''),
			COALESCE(separation_mode,'Resignation'),

			COALESCE(joining_device_required,FALSE),
			COALESCE(joining_device_completed,FALSE),
			COALESCE(joining_vpn_required,FALSE),
			COALESCE(joining_vpn_completed,FALSE),
			COALESCE(joining_ip_phone_required,FALSE),
			COALESCE(joining_ip_phone_completed,FALSE),
			COALESCE(joining_printer_required,FALSE),
			COALESCE(joining_printer_completed,FALSE),
			COALESCE(joining_endpoint_security_required,FALSE),
			COALESCE(joining_endpoint_security_completed,FALSE),
			COALESCE(joining_card_access_required,FALSE),
			COALESCE(joining_card_access_completed,FALSE),

			COALESCE(device_returned,FALSE),
			COALESCE(vpn_removed,FALSE),
			COALESCE(ip_phone_disabled,FALSE),
			COALESCE(printer_access_removed,FALSE),
			COALESCE(panda_removed,FALSE),
			COALESCE(card_access_removed,FALSE)

		FROM public.device_clearances

		WHERE id=$1
		  AND deleted_at IS NULL

		FOR UPDATE
	`, id).Scan(
		&employeeID,
		&assignedTo,
		&status,
		&separationMode,

		&requirements.Device,
		&joiningDone.Device,
		&requirements.VPN,
		&joiningDone.VPN,
		&requirements.IPPhone,
		&joiningDone.IPPhone,
		&requirements.Printer,
		&joiningDone.Printer,
		&requirements.EndpointSecurity,
		&joiningDone.EndpointSecurity,
		&requirements.CardAccess,
		&joiningDone.CardAccess,

		&exitDone.DeviceReturned,
		&exitDone.VPNRemoved,
		&exitDone.IPPhoneDisabled,
		&exitDone.PrinterAccessRemoved,
		&exitDone.PandaRemoved,
		&exitDone.CardAccessRemoved,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			response.NotFound(c, "lifecycle task not found")
			return
		}
		response.ServerError(c, err)
		return
	}

	if status == "Completed" {
		response.BadRequest(c, "lifecycle task is already completed")
		return
	}

	if status == "Cancelled" {
		response.BadRequest(c, "cancelled lifecycle task cannot be completed")
		return
	}

	if assignedTo != currentEmployee {
		response.BadRequest(c, "only the assigned IT employee can complete this lifecycle task")
		return
	}

	if isJoiningMode(separationMode) {
		if !joiningAllRequiredCompleted(requirements, joiningDone) {
			response.BadRequest(c, "all selected joining checklist items must be completed first")
			return
		}
	} else {
		if exitCompletedCount(exitDone) != 6 {
			response.BadRequest(c, "all six exit clearance checklist items must be completed first")
			return
		}

		var stillAssigned int
		if err := tx.QueryRow(ctx, `
			SELECT COUNT(*)::int
			FROM public.it_equipment
			WHERE BTRIM(COALESCE(emp_id,''))=$1
			  AND COALESCE(active,0)>0
			  AND (
					BTRIM(COALESCE(status,''))='1'
					OR LOWER(BTRIM(COALESCE(status,'')))='assigned'
			  )
		`, employeeID).Scan(&stillAssigned); err != nil {
			response.ServerError(c, err)
			return
		}

		if stillAssigned > 0 {
			response.BadRequest(
				c,
				fmt.Sprintf(
					"%d device(s) are still assigned; return or transfer them before completion",
					stillAssigned,
				),
			)
			return
		}
	}

	completedByName := ""
	_ = tx.QueryRow(ctx, `
		SELECT BTRIM(COALESCE(employee_name,''))
		FROM public.employee_office_info
		WHERE BTRIM(COALESCE(employee_id,''))=$1
		LIMIT 1
	`, currentEmployee).Scan(&completedByName)

	_, err = tx.Exec(ctx, `
		UPDATE public.device_clearances
		SET
			ec_given=TRUE,
			status='Completed',
			completed_by=$1,
			completed_by_name=NULLIF($2,''),
			completed_at=CURRENT_TIMESTAMP,
			updated_by=$1,
			updated_by_name=NULLIF($2,''),
			updated_at=CURRENT_TIMESTAMP
		WHERE id=$3
		  AND deleted_at IS NULL
	`, currentEmployee, completedByName, id)

	if err != nil {
		response.ServerError(c, err)
		return
	}

	if err := tx.Commit(ctx); err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, gin.H{
		"id":                id,
		"status":            "Completed",
		"ec_given":          true,
		"completed_by":      currentEmployee,
		"completed_by_name": completedByName,
	})
}

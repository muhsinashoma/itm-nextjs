package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/xuri/excelize/v2"
	"golang.org/x/crypto/bcrypt"
)

type options struct {
	File  string
	Sheet string
	Apply bool
}

type approvedRow struct {
	Row        int
	EmployeeID string
	Username   string
}

type sourceUser struct {
	Row            int
	Username       string
	Password       string
	EmployeeID     string
	FullName       string
	Email          string
	Mobile         string
	SourceUserType int
	TargetUserType int
	ActiveRaw      string
	StatusRaw      string
	DateRaw        string
}

type roleInfo struct {
	ID   int
	Code string
}

type dbUser struct {
	ID         int
	Username   string
	EmployeeID string
}

var approvedRows = []approvedRow{
	{Row: 159, EmployeeID: "02-2069", Username: "rabbani"},
	{Row: 165, EmployeeID: "02-2732", Username: "mdjahid.hasan"},
	{Row: 170, EmployeeID: "02-2730", Username: "minhazul"},
	{Row: 238, EmployeeID: "02-2666", Username: "mijanur"},
}

func main() {
	_ = godotenv.Load()

	var opts options
	flag.StringVar(&opts.File, "file", "", "path to legacy Excel workbook")
	flag.StringVar(&opts.Sheet, "sheet", "tbl_user_info", "Excel sheet name")
	flag.BoolVar(&opts.Apply, "apply", false, "write changes; default is dry-run")
	flag.Parse()

	if strings.TrimSpace(opts.File) == "" {
		log.Fatal("--file is required")
	}

	dbURL := firstNonEmpty(
		os.Getenv("DATABASE_URL"),
		os.Getenv("DB_URL"),
		os.Getenv("POSTGRES_DSN"),
	)
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not configured")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	db, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		log.Fatalf("ping database: %v", err)
	}

	roles, err := loadRoles(ctx, db)
	if err != nil {
		log.Fatalf("load roles: %v", err)
	}

	users, err := loadApprovedRows(opts.File, opts.Sheet)
	if err != nil {
		log.Fatalf("read approved rows: %v", err)
	}

	mode := "DRY RUN"
	if opts.Apply {
		mode = "APPLY"
	}

	fmt.Println("============================================================")
	fmt.Println("REVIEWED DUPLICATE USER RECOVERY")
	fmt.Println("============================================================")
	fmt.Printf("Mode: %s\n", mode)
	fmt.Println("Approved canonical rows:")
	for _, approved := range approvedRows {
		fmt.Printf("  row=%d employee_id=%s username=%s\n",
			approved.Row, approved.EmployeeID, approved.Username)
	}
	fmt.Println("True username conflicts are NOT touched.")
	fmt.Println("Passwords are never printed.")
	fmt.Println("============================================================")

	ready := 0
	created := 0
	skipped := 0

	for _, approved := range approvedRows {
		user, ok := users[approved.Row]
		if !ok {
			fmt.Printf("[SKIP] row=%d employee_id=%s username=%s reason=row not found\n",
				approved.Row, approved.EmployeeID, approved.Username)
			skipped++
			continue
		}

		if !strings.EqualFold(strings.TrimSpace(user.EmployeeID), approved.EmployeeID) ||
			!strings.EqualFold(strings.TrimSpace(user.Username), approved.Username) {
			fmt.Printf("[SKIP] row=%d reason=approved identity mismatch got employee_id=%s username=%s\n",
				approved.Row, user.EmployeeID, user.Username)
			skipped++
			continue
		}

		if !isEligible(user) {
			fmt.Printf("[SKIP] row=%d employee_id=%s username=%s reason=source row is not active/status=1\n",
				user.Row, user.EmployeeID, user.Username)
			skipped++
			continue
		}

		targetType, ok := mapLegacyUserType(user.SourceUserType)
		if !ok {
			fmt.Printf("[SKIP] row=%d employee_id=%s username=%s reason=unsupported source_user_type=%d\n",
				user.Row, user.EmployeeID, user.Username, user.SourceUserType)
			skipped++
			continue
		}
		user.TargetUserType = targetType

		role, ok := roles[user.TargetUserType]
		if !ok {
			fmt.Printf("[SKIP] row=%d employee_id=%s username=%s reason=no active role for target_user_type=%d\n",
				user.Row, user.EmployeeID, user.Username, user.TargetUserType)
			skipped++
			continue
		}

		existingByEmployee, err := findUserByEmployeeID(ctx, db, user.EmployeeID)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Fatalf("lookup employee_id=%s: %v", user.EmployeeID, err)
		}
		if existingByEmployee != nil {
			fmt.Printf("[SKIP] row=%d employee_id=%s username=%s reason=user already exists as user_id=%d username=%s\n",
				user.Row, user.EmployeeID, user.Username, existingByEmployee.ID, existingByEmployee.Username)
			skipped++
			continue
		}

		existingByUsername, err := findUserByUsername(ctx, db, user.Username)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Fatalf("lookup username=%s: %v", user.Username, err)
		}
		if existingByUsername != nil {
			fmt.Printf("[SKIP] row=%d employee_id=%s username=%s reason=username already belongs to user_id=%d employee_id=%s\n",
				user.Row, user.EmployeeID, user.Username, existingByUsername.ID, existingByUsername.EmployeeID)
			skipped++
			continue
		}

		ready++
		fmt.Printf(
			"[READY] row=%d employee_id=%s username=%s full_name=%q date=%q source_user_type=%d target_user_type=%d role=%s\n",
			user.Row,
			user.EmployeeID,
			user.Username,
			user.FullName,
			user.DateRaw,
			user.SourceUserType,
			user.TargetUserType,
			role.Code,
		)

		if !opts.Apply {
			continue
		}

		if err := createUser(context.Background(), db, user, role); err != nil {
			log.Fatalf("create row=%d employee_id=%s username=%s: %v",
				user.Row, user.EmployeeID, user.Username, err)
		}

		created++
		fmt.Printf("[CREATED] row=%d employee_id=%s username=%s role=%s\n",
			user.Row, user.EmployeeID, user.Username, role.Code)
	}

	fmt.Println()
	fmt.Println("============================================================")
	fmt.Println("REVIEWED DUPLICATE RECOVERY SUMMARY")
	fmt.Println("============================================================")
	fmt.Printf("Mode          : %s\n", mode)
	fmt.Printf("Approved rows : %d\n", len(approvedRows))
	fmt.Printf("Ready         : %d\n", ready)
	fmt.Printf("Created       : %d\n", created)
	fmt.Printf("Skipped       : %d\n", skipped)
	fmt.Println("============================================================")

	if !opts.Apply {
		fmt.Println("DRY RUN ONLY: no database rows were changed.")
	}
}

func loadApprovedRows(filePath, sheetName string) (map[int]sourceUser, error) {
	workbook, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, err
	}
	defer func() { _ = workbook.Close() }()

	rows, err := workbook.GetRows(sheetName)
	if err != nil {
		return nil, err
	}
	if len(rows) < 2 {
		return nil, errors.New("Excel sheet has no data rows")
	}

	headers := make(map[string]int)
	for i, raw := range rows[0] {
		headers[normalizeHeader(raw)] = i
	}

	required := []string{
		"user_name",
		"password",
		"employee_id",
		"user_type",
		"active",
		"status",
	}
	for _, column := range required {
		if _, ok := headers[column]; !ok {
			return nil, fmt.Errorf("required Excel column %q not found", column)
		}
	}

	approvedSet := make(map[int]approvedRow)
	for _, approved := range approvedRows {
		approvedSet[approved.Row] = approved
	}

	result := make(map[int]sourceUser)

	for i := 1; i < len(rows); i++ {
		excelRow := i + 1
		if _, ok := approvedSet[excelRow]; !ok {
			continue
		}

		row := rows[i]
		userTypeRaw := strings.TrimSpace(cell(row, headers, "user_type"))
		userType, err := strconv.Atoi(userTypeRaw)
		if err != nil {
			userType = -1
		}

		result[excelRow] = sourceUser{
			Row:        excelRow,
			Username:   strings.TrimSpace(cell(row, headers, "user_name")),
			Password:   cell(row, headers, "password"), // intentionally not trimmed
			EmployeeID: strings.TrimSpace(cell(row, headers, "employee_id")),
			FullName: strings.TrimSpace(firstNonEmpty(
				cell(row, headers, "full_name"),
				cell(row, headers, "employee_name"),
			)),
			Email:          strings.TrimSpace(cell(row, headers, "email")),
			Mobile:         strings.TrimSpace(cell(row, headers, "mobile")),
			SourceUserType: userType,
			ActiveRaw:      strings.TrimSpace(cell(row, headers, "active")),
			StatusRaw:      strings.TrimSpace(cell(row, headers, "status")),
			DateRaw:        strings.TrimSpace(cell(row, headers, "date")),
		}
	}

	return result, nil
}

func loadRoles(ctx context.Context, db *pgxpool.Pool) (map[int]roleInfo, error) {
	rows, err := db.Query(ctx, `
		SELECT id, code, legacy_user_type
		FROM public.auth_roles
		WHERE active = TRUE
		ORDER BY hierarchy_level DESC, id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[int]roleInfo)
	for rows.Next() {
		var role roleInfo
		var userType int
		if err := rows.Scan(&role.ID, &role.Code, &userType); err != nil {
			return nil, err
		}
		if _, exists := result[userType]; exists {
			return nil, fmt.Errorf("multiple active roles exist for legacy_user_type=%d", userType)
		}
		result[userType] = role
	}
	return result, rows.Err()
}

func createUser(ctx context.Context, db *pgxpool.Pool, user sourceUser, role roleInfo) error {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("bcrypt password: %w", err)
	}

	tx, err := db.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var userID int
	err = tx.QueryRow(ctx, `
		INSERT INTO public.users (
			username, password_hash, employee_id, full_name, email, mobile,
			user_type, active, otp_verify, app_token, created_at, updated_at,
			account_status, must_change_password, failed_login_attempts,
			locked_until, password_changed_at, last_login_at, last_login_ip,
			last_login_user_agent, deleted_at
		)
		VALUES (
			$1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''),
			$7, TRUE, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
			'active', FALSE, 0, NULL, NULL, NULL, NULL, NULL, NULL
		)
		RETURNING id
	`,
		strings.TrimSpace(user.Username),
		string(passwordHash),
		strings.TrimSpace(user.EmployeeID),
		strings.TrimSpace(user.FullName),
		strings.TrimSpace(user.Email),
		strings.TrimSpace(user.Mobile),
		user.TargetUserType,
	).Scan(&userID)
	if err != nil {
		return fmt.Errorf("insert users: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO public.auth_user_roles (
			user_id, role_id, assigned_by, assigned_at, expires_at, active
		)
		VALUES ($1, $2, NULL, CURRENT_TIMESTAMP, NULL, TRUE)
	`, userID, role.ID)
	if err != nil {
		return fmt.Errorf("insert auth_user_roles: %w", err)
	}

	return tx.Commit(ctx)
}

func findUserByEmployeeID(ctx context.Context, db *pgxpool.Pool, employeeID string) (*dbUser, error) {
	var user dbUser
	err := db.QueryRow(ctx, `
		SELECT id, username, COALESCE(employee_id, '')
		FROM public.users
		WHERE deleted_at IS NULL
		  AND BTRIM(COALESCE(employee_id, '')) = BTRIM($1)
		ORDER BY id
		LIMIT 1
	`, employeeID).Scan(&user.ID, &user.Username, &user.EmployeeID)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func findUserByUsername(ctx context.Context, db *pgxpool.Pool, username string) (*dbUser, error) {
	var user dbUser
	err := db.QueryRow(ctx, `
		SELECT id, username, COALESCE(employee_id, '')
		FROM public.users
		WHERE deleted_at IS NULL
		  AND LOWER(BTRIM(username)) = LOWER(BTRIM($1))
		ORDER BY id
		LIMIT 1
	`, username).Scan(&user.ID, &user.Username, &user.EmployeeID)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func mapLegacyUserType(sourceUserType int) (int, bool) {
	switch sourceUserType {
	case 0:
		return 3, true
	case 1:
		return 3, true
	case 2:
		return 2, true
	case 3:
		return 3, true
	default:
		return 0, false
	}
}

func isEligible(user sourceUser) bool {
	return strings.EqualFold(strings.TrimSpace(user.ActiveRaw), "yes") &&
		strings.TrimSpace(user.StatusRaw) == "1"
}

func cell(row []string, headers map[string]int, name string) string {
	index, ok := headers[name]
	if !ok || index < 0 || index >= len(row) {
		return ""
	}
	return row[index]
}

func normalizeHeader(value string) string {
	result := strings.TrimSpace(strings.ToLower(strings.TrimPrefix(value, "\uFEFF")))
	result = strings.ReplaceAll(result, " ", "_")
	result = strings.ReplaceAll(result, "-", "_")

	switch result {
	case "username":
		return "user_name"
	case "employeeid", "emp_id":
		return "employee_id"
	case "fullname":
		return "full_name"
	case "email_address":
		return "email"
	case "mobile_no", "mobile_number":
		return "mobile"
	default:
		return result
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

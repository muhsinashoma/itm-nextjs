package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"
	"sort"
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

type safeDuplicate struct {
	EmployeeID string
	Username   string
}

var safeDuplicates = []safeDuplicate{
	{EmployeeID: "02-2833", Username: "bashir.alam"},
	{EmployeeID: "02-2749", Username: "fahmid"},
	{EmployeeID: "02-2069", Username: "rabbani"},
	{EmployeeID: "02-2732", Username: "mdjahid.hasan"},
	{EmployeeID: "02-2730", Username: "minhazul"},
	{EmployeeID: "02-2666", Username: "mijanur"},
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

	rows, err := loadExcel(opts.File, opts.Sheet)
	if err != nil {
		log.Fatalf("read Excel: %v", err)
	}

	grouped := make(map[string][]sourceUser)

	for _, user := range rows {
		if !isEligible(user) {
			continue
		}
		for _, allowed := range safeDuplicates {
			if strings.EqualFold(strings.TrimSpace(user.EmployeeID), allowed.EmployeeID) &&
				strings.EqualFold(strings.TrimSpace(user.Username), allowed.Username) {
				targetType, ok := mapLegacyUserType(user.SourceUserType)
				if !ok {
					fmt.Printf(
						"[SKIP] employee_id=%s username=%s row=%d reason=unsupported source_user_type=%d\n",
						user.EmployeeID, user.Username, user.Row, user.SourceUserType,
					)
					continue
				}
				user.TargetUserType = targetType
				grouped[normalize(user.EmployeeID)] = append(grouped[normalize(user.EmployeeID)], user)
			}
		}
	}

	mode := "DRY RUN"
	if opts.Apply {
		mode = "APPLY"
	}

	fmt.Println("============================================================")
	fmt.Println("SAFE DUPLICATE USER RECOVERY")
	fmt.Println("============================================================")
	fmt.Printf("Mode: %s\n", mode)
	fmt.Println("Only these six employee IDs are eligible:")
	for _, allowed := range safeDuplicates {
		fmt.Printf("  %s -> %s\n", allowed.EmployeeID, allowed.Username)
	}
	fmt.Println("The true conflicts ahsan.sharif and md.arifulislam are NOT touched.")
	fmt.Println("============================================================")

	var readyCount, createdCount, skippedCount, missingCount int

	for _, allowed := range safeDuplicates {
		group := grouped[normalize(allowed.EmployeeID)]

		if len(group) < 2 {
			fmt.Printf(
				"[SKIP] employee_id=%s username=%s reason=expected duplicate rows but found %d eligible row(s)\n",
				allowed.EmployeeID, allowed.Username, len(group),
			)
			missingCount++
			continue
		}

		sort.Slice(group, func(i, j int) bool { return group[i].Row < group[j].Row })
		canonical := group[0]

		ok, reason := duplicatesEquivalent(group)
		if !ok {
			fmt.Printf(
				"[SKIP] employee_id=%s username=%s rows=%s reason=duplicate rows differ: %s\n",
				allowed.EmployeeID, allowed.Username, rowList(group), reason,
			)
			skippedCount++
			continue
		}

		existingByEmployee, err := findUserByEmployeeID(ctx, db, allowed.EmployeeID)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Fatalf("lookup employee_id=%s: %v", allowed.EmployeeID, err)
		}
		if existingByEmployee != nil {
			fmt.Printf(
				"[SKIP] employee_id=%s username=%s reason=user already exists as user_id=%d username=%s\n",
				allowed.EmployeeID, allowed.Username, existingByEmployee.ID, existingByEmployee.Username,
			)
			skippedCount++
			continue
		}

		existingByUsername, err := findUserByUsername(ctx, db, allowed.Username)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Fatalf("lookup username=%s: %v", allowed.Username, err)
		}
		if existingByUsername != nil {
			fmt.Printf(
				"[SKIP] employee_id=%s username=%s reason=username already belongs to user_id=%d employee_id=%s\n",
				allowed.EmployeeID, allowed.Username, existingByUsername.ID, existingByUsername.EmployeeID,
			)
			skippedCount++
			continue
		}

		role, ok := roles[canonical.TargetUserType]
		if !ok {
			fmt.Printf(
				"[SKIP] employee_id=%s username=%s reason=no active target role for user_type=%d\n",
				allowed.EmployeeID, allowed.Username, canonical.TargetUserType,
			)
			skippedCount++
			continue
		}

		readyCount++
		fmt.Printf(
			"[READY] employee_id=%s username=%s rows=%s source_user_type=%d target_user_type=%d role=%s password_match=true\n",
			allowed.EmployeeID, allowed.Username, rowList(group), canonical.SourceUserType, canonical.TargetUserType, role.Code,
		)

		if !opts.Apply {
			continue
		}

		if err := createUser(context.Background(), db, canonical, role); err != nil {
			log.Fatalf("create employee_id=%s username=%s: %v", allowed.EmployeeID, allowed.Username, err)
		}

		createdCount++
		fmt.Printf("[CREATED] employee_id=%s username=%s role=%s\n", allowed.EmployeeID, allowed.Username, role.Code)
	}

	fmt.Println()
	fmt.Println("============================================================")
	fmt.Println("SAFE DUPLICATE RECOVERY SUMMARY")
	fmt.Println("============================================================")
	fmt.Printf("Mode                     : %s\n", mode)
	fmt.Printf("Allowlisted employees    : %d\n", len(safeDuplicates))
	fmt.Printf("Ready                     : %d\n", readyCount)
	fmt.Printf("Created                   : %d\n", createdCount)
	fmt.Printf("Skipped                   : %d\n", skippedCount)
	fmt.Printf("Missing/insufficient rows : %d\n", missingCount)
	fmt.Println("============================================================")
	if !opts.Apply {
		fmt.Println("DRY RUN ONLY: no database rows were changed.")
	}
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

func loadExcel(filePath, sheetName string) ([]sourceUser, error) {
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
	for index, raw := range rows[0] {
		headers[normalizeHeader(raw)] = index
	}

	required := []string{"user_name", "password", "employee_id", "user_type", "active", "status"}
	for _, column := range required {
		if _, ok := headers[column]; !ok {
			return nil, fmt.Errorf("required Excel column %q not found", column)
		}
	}

	result := make([]sourceUser, 0, len(rows)-1)
	for index := 1; index < len(rows); index++ {
		row := rows[index]
		userTypeRaw := strings.TrimSpace(cell(row, headers, "user_type"))
		userType, err := strconv.Atoi(userTypeRaw)
		if err != nil {
			userType = -1
		}
		result = append(result, sourceUser{
			Row:        index + 1,
			Username:   strings.TrimSpace(cell(row, headers, "user_name")),
			Password:   cell(row, headers, "password"),
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
		})
	}
	return result, nil
}

func duplicatesEquivalent(group []sourceUser) (bool, string) {
	if len(group) < 2 {
		return false, "less than two rows"
	}
	base := group[0]
	for _, other := range group[1:] {
		if normalize(base.Username) != normalize(other.Username) {
			return false, "username differs"
		}
		if normalize(base.EmployeeID) != normalize(other.EmployeeID) {
			return false, "employee_id differs"
		}
		if base.Password != other.Password {
			return false, "password differs"
		}
		if normalize(base.FullName) != normalize(other.FullName) {
			return false, "full_name differs"
		}
		if normalize(base.Email) != normalize(other.Email) {
			return false, "email differs"
		}
		if normalize(base.Mobile) != normalize(other.Mobile) {
			return false, "mobile differs"
		}
		if base.SourceUserType != other.SourceUserType {
			return false, "source user_type differs"
		}
		if !strings.EqualFold(strings.TrimSpace(base.ActiveRaw), strings.TrimSpace(other.ActiveRaw)) {
			return false, "active differs"
		}
		if strings.TrimSpace(base.StatusRaw) != strings.TrimSpace(other.StatusRaw) {
			return false, "status differs"
		}
	}
	return true, ""
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

func rowList(group []sourceUser) string {
	parts := make([]string, 0, len(group))
	for _, user := range group {
		parts = append(parts, strconv.Itoa(user.Row))
	}
	return strings.Join(parts, ",")
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

func normalize(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

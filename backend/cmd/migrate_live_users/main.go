// //backend/cmd/migrate_live_users/main.go

// package main

// import (
// 	"context"
// 	"errors"
// 	"flag"
// 	"fmt"
// 	"log"
// 	"os"
// 	"sort"
// 	"strconv"
// 	"strings"
// 	"time"

// 	"github.com/jackc/pgx/v5"
// 	"github.com/jackc/pgx/v5/pgxpool"
// 	"github.com/joho/godotenv"
// 	"github.com/xuri/excelize/v2"
// 	"golang.org/x/crypto/bcrypt"
// )

// type options struct {
// 	File                       string
// 	Sheet                      string
// 	Apply                      bool
// 	Limit                      int
// 	MustChangePassword         bool
// 	OverwriteExistingPasswords bool
// }

// type sourceUser struct {
// 	Row        int
// 	Username   string
// 	Password   string
// 	EmployeeID string
// 	FullName   string
// 	Email      string
// 	Mobile     string
// 	UserType   int
// 	ActiveRaw  string
// 	StatusRaw  string
// }

// type dbUser struct {
// 	ID         int
// 	Username   string
// 	EmployeeID string
// 	Email      string
// }

// type roleInfo struct {
// 	ID             int
// 	Code           string
// 	LegacyUserType int
// }

// type counters struct {
// 	SourceRows          int
// 	EligibleRows        int
// 	WouldCreate         int
// 	WouldUpdate         int
// 	Created             int
// 	Updated             int
// 	InactiveSkipped     int
// 	ProtectedSkipped    int
// 	DuplicateUsername   int
// 	DuplicateEmployeeID int
// 	DuplicateEmail      int
// 	UnsupportedType     int
// 	InvalidSkipped      int
// 	DBConflictSkipped   int
// 	RoleMissingSkipped  int
// 	PasswordPreserved   int
// }

// var protectedUsers = map[string]bool{
// 	"admin":            true,
// 	"itm.root":         true,
// 	"test.general":     true,
// 	"test.itpersonnel": true,
// }

// func main() {
// 	if err := godotenv.Load(); err != nil {
// 		log.Printf(
// 			"warning: .env file was not loaded: %v",
// 			err,
// 		)
// 	}

// 	opts := parseFlags()

// 	if strings.TrimSpace(opts.File) == "" {
// 		log.Fatal("--file is required")
// 	}

// 	dbURL := firstNonEmpty(
// 		os.Getenv("DATABASE_URL"),
// 		os.Getenv("DB_URL"),
// 		os.Getenv("POSTGRES_DSN"),
// 	)

// 	if dbURL == "" {
// 		log.Fatal(
// 			"DATABASE_URL is not configured",
// 		)
// 	}

// 	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
// 	defer cancel()

// 	db, err := pgxpool.New(ctx, dbURL)
// 	if err != nil {
// 		log.Fatalf("connect database: %v", err)
// 	}
// 	defer db.Close()

// 	if err := db.Ping(ctx); err != nil {
// 		log.Fatalf("ping database: %v", err)
// 	}

// 	roles, err := loadRoles(ctx, db)
// 	if err != nil {
// 		log.Fatalf("load auth roles: %v", err)
// 	}

// 	fmt.Println("Role mapping found:")
// 	roleTypes := make([]int, 0, len(roles))
// 	for userType := range roles {
// 		roleTypes = append(roleTypes, userType)
// 	}
// 	sort.Ints(roleTypes)

// 	for _, userType := range roleTypes {
// 		role := roles[userType]
// 		fmt.Printf("  user_type=%d -> role_id=%d (%s)\n", userType, role.ID, role.Code)
// 	}

// 	users, sourceCounts, err := loadSourceUsers(opts.File, opts.Sheet)
// 	if err != nil {
// 		log.Fatalf("read Excel: %v", err)
// 	}

// 	counts := counters{SourceRows: sourceCounts.SourceRows}
// 	eligible := make([]sourceUser, 0, len(users))

// 	for _, user := range users {
// 		if !isEligible(user) {
// 			counts.InactiveSkipped++
// 			continue
// 		}

// 		counts.EligibleRows++

// 		if strings.TrimSpace(user.Username) == "" || strings.TrimSpace(user.EmployeeID) == "" || user.Password == "" {
// 			counts.InvalidSkipped++
// 			fmt.Printf("[SKIP] row=%d username=%q employee_id=%q reason=missing required username/employee_id/password\n", user.Row, user.Username, user.EmployeeID)
// 			continue
// 		}

// 		if user.UserType < 0 || user.UserType > 3 {
// 			counts.UnsupportedType++
// 			fmt.Printf("[SKIP] row=%d username=%s employee_id=%s reason=unsupported user_type=%d\n", user.Row, user.Username, user.EmployeeID, user.UserType)
// 			continue
// 		}

// 		if _, ok := roles[user.UserType]; !ok {
// 			counts.RoleMissingSkipped++
// 			fmt.Printf("[SKIP] row=%d username=%s employee_id=%s reason=no active role for user_type=%d\n", user.Row, user.Username, user.EmployeeID, user.UserType)
// 			continue
// 		}

// 		eligible = append(eligible, user)
// 	}

// 	usernameCounts := make(map[string]int)
// 	employeeCounts := make(map[string]int)
// 	emailCounts := make(map[string]int)

// 	for _, user := range eligible {
// 		usernameCounts[normalize(user.Username)]++
// 		employeeCounts[normalize(user.EmployeeID)]++
// 		if email := normalize(user.Email); email != "" {
// 			emailCounts[email]++
// 		}
// 	}

// 	actionCount := 0

// 	for _, user := range eligible {
// 		if opts.Limit > 0 && actionCount >= opts.Limit {
// 			break
// 		}

// 		usernameKey := normalize(user.Username)
// 		employeeKey := normalize(user.EmployeeID)

// 		if usernameCounts[usernameKey] > 1 {
// 			counts.DuplicateUsername++
// 			fmt.Printf("[SKIP] row=%d username=%s employee_id=%s reason=duplicate username in Excel\n", user.Row, user.Username, user.EmployeeID)
// 			continue
// 		}

// 		if employeeCounts[employeeKey] > 1 {
// 			counts.DuplicateEmployeeID++
// 			fmt.Printf("[SKIP] row=%d username=%s employee_id=%s reason=duplicate employee_id in Excel\n", user.Row, user.Username, user.EmployeeID)
// 			continue
// 		}

// 		if protectedUsers[usernameKey] {
// 			counts.ProtectedSkipped++
// 			fmt.Printf("[SKIP] row=%d username=%s employee_id=%s reason=protected account\n", user.Row, user.Username, user.EmployeeID)
// 			continue
// 		}

// 		email := strings.TrimSpace(user.Email)
// 		if email != "" && emailCounts[normalize(email)] > 1 {
// 			counts.DuplicateEmail++
// 			fmt.Printf("[WARN] row=%d username=%s employee_id=%s duplicate email in Excel; email will be stored as NULL\n", user.Row, user.Username, user.EmployeeID)
// 			email = ""
// 		}

// 		existingByEmployee, err := findUserByEmployeeID(ctx, db, user.EmployeeID)
// 		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
// 			log.Fatalf("lookup by employee_id row=%d: %v", user.Row, err)
// 		}

// 		existingByUsername, err := findUserByUsername(ctx, db, user.Username)
// 		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
// 			log.Fatalf("lookup by username row=%d: %v", user.Row, err)
// 		}

// 		var target *dbUser
// 		if existingByEmployee != nil {
// 			target = existingByEmployee
// 			if protectedUsers[normalize(target.Username)] {
// 				counts.ProtectedSkipped++
// 				fmt.Printf("[SKIP] row=%d username=%s employee_id=%s reason=employee_id belongs to protected account %s\n", user.Row, user.Username, user.EmployeeID, target.Username)
// 				continue
// 			}
// 		}

// 		if existingByUsername != nil {
// 			if target == nil || existingByUsername.ID != target.ID {
// 				counts.DBConflictSkipped++
// 				fmt.Printf("[CONFLICT] row=%d username=%s employee_id=%s reason=username already belongs to another database user (user_id=%d employee_id=%s)\n", user.Row, user.Username, user.EmployeeID, existingByUsername.ID, existingByUsername.EmployeeID)
// 				continue
// 			}
// 		}

// 		if email != "" {
// 			existingByEmail, err := findUserByEmail(ctx, db, email)
// 			if err != nil && !errors.Is(err, pgx.ErrNoRows) {
// 				log.Fatalf("lookup by email row=%d: %v", user.Row, err)
// 			}

// 			if existingByEmail != nil && (target == nil || existingByEmail.ID != target.ID) {
// 				counts.DuplicateEmail++
// 				fmt.Printf("[WARN] row=%d username=%s employee_id=%s email already belongs to database user_id=%d; email will be stored as NULL\n", user.Row, user.Username, user.EmployeeID, existingByEmail.ID)
// 				email = ""
// 			}
// 		}

// 		role := roles[user.UserType]

// 		if target == nil {
// 			counts.WouldCreate++
// 			actionCount++

// 			if !opts.Apply {
// 				fmt.Printf("[CREATE] row=%d username=%s employee_id=%s user_type=%d role=%s\n", user.Row, user.Username, user.EmployeeID, user.UserType, role.Code)
// 				continue
// 			}

// 			if err := createUser(context.Background(), db, user, email, role, opts.MustChangePassword); err != nil {
// 				log.Fatalf("create row=%d username=%s employee_id=%s: %v", user.Row, user.Username, user.EmployeeID, err)
// 			}

// 			counts.Created++
// 			fmt.Printf("[CREATED] row=%d username=%s employee_id=%s role=%s\n", user.Row, user.Username, user.EmployeeID, role.Code)
// 			continue
// 		}

// 		counts.WouldUpdate++
// 		actionCount++

// 		if !opts.Apply {
// 			passwordAction := "preserve-existing-password"
// 			if opts.OverwriteExistingPasswords {
// 				passwordAction = "replace-with-Excel-password"
// 			}
// 			fmt.Printf("[UPDATE] row=%d user_id=%d username=%s employee_id=%s user_type=%d role=%s password=%s\n", user.Row, target.ID, user.Username, user.EmployeeID, user.UserType, role.Code, passwordAction)
// 			continue
// 		}

// 		if err := updateUser(context.Background(), db, target.ID, user, email, role, opts.MustChangePassword, opts.OverwriteExistingPasswords); err != nil {
// 			log.Fatalf("update row=%d user_id=%d username=%s employee_id=%s: %v", user.Row, target.ID, user.Username, user.EmployeeID, err)
// 		}

// 		if !opts.OverwriteExistingPasswords {
// 			counts.PasswordPreserved++
// 		}
// 		counts.Updated++
// 		fmt.Printf("[UPDATED] row=%d user_id=%d username=%s employee_id=%s role=%s\n", user.Row, target.ID, user.Username, user.EmployeeID, role.Code)
// 	}

// 	printSummary(opts, counts, actionCount)
// }

// func parseFlags() options {
// 	var opts options
// 	flag.StringVar(&opts.File, "file", "", "path to legacy Excel workbook")
// 	flag.StringVar(&opts.Sheet, "sheet", "tbl_user_info", "Excel sheet name")
// 	flag.BoolVar(&opts.Apply, "apply", false, "write changes to PostgreSQL; default is dry-run")
// 	flag.IntVar(&opts.Limit, "limit", 0, "maximum number of create/update actions; 0 means unlimited")
// 	flag.BoolVar(&opts.MustChangePassword, "must-change-password", false, "set must_change_password=true for newly imported/re-passworded users")
// 	flag.BoolVar(&opts.OverwriteExistingPasswords, "overwrite-existing-passwords", false, "replace password_hash for existing users using the Excel password")
// 	flag.Parse()
// 	return opts
// }

// func loadRoles(ctx context.Context, db *pgxpool.Pool) (map[int]roleInfo, error) {
// 	rows, err := db.Query(ctx, `
// 		SELECT id, code, legacy_user_type
// 		FROM public.auth_roles
// 		WHERE active = TRUE
// 		ORDER BY hierarchy_level DESC, id
// 	`)
// 	if err != nil {
// 		return nil, err
// 	}
// 	defer rows.Close()

// 	result := make(map[int]roleInfo)
// 	for rows.Next() {
// 		var role roleInfo
// 		if err := rows.Scan(&role.ID, &role.Code, &role.LegacyUserType); err != nil {
// 			return nil, err
// 		}
// 		if _, exists := result[role.LegacyUserType]; exists {
// 			return nil, fmt.Errorf("multiple active auth_roles exist for legacy_user_type=%d", role.LegacyUserType)
// 		}
// 		result[role.LegacyUserType] = role
// 	}
// 	if err := rows.Err(); err != nil {
// 		return nil, err
// 	}
// 	return result, nil
// }

// func loadSourceUsers(filePath, sheetName string) ([]sourceUser, counters, error) {
// 	workbook, err := excelize.OpenFile(filePath)
// 	if err != nil {
// 		return nil, counters{}, err
// 	}
// 	defer func() { _ = workbook.Close() }()

// 	if sheetName == "" {
// 		sheets := workbook.GetSheetList()
// 		if len(sheets) == 0 {
// 			return nil, counters{}, errors.New("Excel workbook has no sheets")
// 		}
// 		sheetName = sheets[0]
// 	}

// 	rows, err := workbook.GetRows(sheetName)
// 	if err != nil {
// 		return nil, counters{}, fmt.Errorf("read sheet %q: %w", sheetName, err)
// 	}
// 	if len(rows) < 2 {
// 		return nil, counters{}, errors.New("Excel sheet has no data rows")
// 	}

// 	headers := make(map[string]int)
// 	for index, raw := range rows[0] {
// 		key := normalizeHeader(raw)
// 		if key != "" {
// 			headers[key] = index
// 		}
// 	}

// 	required := []string{"user_name", "password", "employee_id", "user_type", "status", "active"}
// 	for _, column := range required {
// 		if _, ok := headers[column]; !ok {
// 			return nil, counters{}, fmt.Errorf("required Excel column %q not found", column)
// 		}
// 	}

// 	result := make([]sourceUser, 0, len(rows)-1)
// 	for index := 1; index < len(rows); index++ {
// 		row := rows[index]
// 		username := strings.TrimSpace(cell(row, headers, "user_name"))
// 		employeeID := strings.TrimSpace(cell(row, headers, "employee_id"))
// 		fullName := strings.TrimSpace(firstNonEmpty(cell(row, headers, "full_name"), cell(row, headers, "employee_name"), username, employeeID))
// 		userTypeRaw := strings.TrimSpace(cell(row, headers, "user_type"))
// 		userType, err := strconv.Atoi(userTypeRaw)
// 		if err != nil {
// 			userType = -1
// 		}

// 		result = append(result, sourceUser{
// 			Row:        index + 1,
// 			Username:   username,
// 			Password:   cell(row, headers, "password"), // intentionally NOT TrimSpace
// 			EmployeeID: employeeID,
// 			FullName:   fullName,
// 			Email:      strings.TrimSpace(cell(row, headers, "email")),
// 			Mobile:     strings.TrimSpace(cell(row, headers, "mobile")),
// 			UserType:   userType,
// 			ActiveRaw:  strings.TrimSpace(cell(row, headers, "active")),
// 			StatusRaw:  strings.TrimSpace(cell(row, headers, "status")),
// 		})
// 	}

// 	return result, counters{SourceRows: len(result)}, nil
// }

// func isEligible(user sourceUser) bool {
// 	return strings.EqualFold(strings.TrimSpace(user.ActiveRaw), "yes") && strings.TrimSpace(user.StatusRaw) == "1"
// }

// func findUserByEmployeeID(ctx context.Context, db *pgxpool.Pool, employeeID string) (*dbUser, error) {
// 	var user dbUser
// 	err := db.QueryRow(ctx, `
// 		SELECT id, username, COALESCE(employee_id, ''), COALESCE(email, '')
// 		FROM public.users
// 		WHERE deleted_at IS NULL
// 		  AND BTRIM(COALESCE(employee_id, '')) = BTRIM($1)
// 		ORDER BY id
// 		LIMIT 1
// 	`, employeeID).Scan(&user.ID, &user.Username, &user.EmployeeID, &user.Email)
// 	if err != nil {
// 		return nil, err
// 	}
// 	return &user, nil
// }

// func findUserByUsername(ctx context.Context, db *pgxpool.Pool, username string) (*dbUser, error) {
// 	var user dbUser
// 	err := db.QueryRow(ctx, `
// 		SELECT id, username, COALESCE(employee_id, ''), COALESCE(email, '')
// 		FROM public.users
// 		WHERE deleted_at IS NULL
// 		  AND LOWER(BTRIM(username)) = LOWER(BTRIM($1))
// 		ORDER BY id
// 		LIMIT 1
// 	`, username).Scan(&user.ID, &user.Username, &user.EmployeeID, &user.Email)
// 	if err != nil {
// 		return nil, err
// 	}
// 	return &user, nil
// }

// func findUserByEmail(ctx context.Context, db *pgxpool.Pool, email string) (*dbUser, error) {
// 	var user dbUser
// 	err := db.QueryRow(ctx, `
// 		SELECT id, username, COALESCE(employee_id, ''), COALESCE(email, '')
// 		FROM public.users
// 		WHERE deleted_at IS NULL
// 		  AND NULLIF(BTRIM(COALESCE(email, '')), '') IS NOT NULL
// 		  AND LOWER(BTRIM(email)) = LOWER(BTRIM($1))
// 		ORDER BY id
// 		LIMIT 1
// 	`, email).Scan(&user.ID, &user.Username, &user.EmployeeID, &user.Email)
// 	if err != nil {
// 		return nil, err
// 	}
// 	return &user, nil
// }

// func createUser(ctx context.Context, db *pgxpool.Pool, user sourceUser, email string, role roleInfo, mustChangePassword bool) error {
// 	passwordHash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
// 	if err != nil {
// 		return fmt.Errorf("bcrypt password: %w", err)
// 	}

// 	tx, err := db.Begin(ctx)
// 	if err != nil {
// 		return err
// 	}
// 	defer func() { _ = tx.Rollback(ctx) }()

// 	var userID int
// 	err = tx.QueryRow(ctx, `
// 		INSERT INTO public.users (
// 			username, password_hash, employee_id, full_name, email, mobile,
// 			user_type, active, otp_verify, app_token, created_at, updated_at,
// 			account_status, must_change_password, failed_login_attempts,
// 			locked_until, password_changed_at, last_login_at, last_login_ip,
// 			last_login_user_agent, deleted_at
// 		)
// 		VALUES (
// 			$1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''),
// 			$7, TRUE, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
// 			'active', $8, 0, NULL, NULL, NULL, NULL, NULL, NULL
// 		)
// 		RETURNING id
// 	`,
// 		strings.TrimSpace(user.Username), string(passwordHash), strings.TrimSpace(user.EmployeeID),
// 		strings.TrimSpace(user.FullName), strings.TrimSpace(email), strings.TrimSpace(user.Mobile),
// 		user.UserType, mustChangePassword,
// 	).Scan(&userID)
// 	if err != nil {
// 		return fmt.Errorf("insert users: %w", err)
// 	}

// 	if err := replaceRoleAssignment(ctx, tx, userID, role.ID); err != nil {
// 		return err
// 	}
// 	return tx.Commit(ctx)
// }

// func updateUser(ctx context.Context, db *pgxpool.Pool, userID int, user sourceUser, email string, role roleInfo, mustChangePassword, overwritePassword bool) error {
// 	tx, err := db.Begin(ctx)
// 	if err != nil {
// 		return err
// 	}
// 	defer func() { _ = tx.Rollback(ctx) }()

// 	if overwritePassword {
// 		passwordHash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
// 		if err != nil {
// 			return fmt.Errorf("bcrypt password: %w", err)
// 		}
// 		_, err = tx.Exec(ctx, `
// 			UPDATE public.users
// 			SET username=$2, password_hash=$3, employee_id=NULLIF($4, ''), full_name=NULLIF($5, ''),
// 			    email=NULLIF($6, ''), mobile=NULLIF($7, ''), user_type=$8, active=TRUE,
// 			    account_status='active', must_change_password=$9, failed_login_attempts=0,
// 			    locked_until=NULL, updated_at=CURRENT_TIMESTAMP, deleted_at=NULL
// 			WHERE id=$1
// 		`, userID, strings.TrimSpace(user.Username), string(passwordHash), strings.TrimSpace(user.EmployeeID), strings.TrimSpace(user.FullName), strings.TrimSpace(email), strings.TrimSpace(user.Mobile), user.UserType, mustChangePassword)
// 		if err != nil {
// 			return fmt.Errorf("update users with password: %w", err)
// 		}
// 	} else {
// 		_, err = tx.Exec(ctx, `
// 			UPDATE public.users
// 			SET username=$2, employee_id=NULLIF($3, ''), full_name=NULLIF($4, ''), email=NULLIF($5, ''),
// 			    mobile=NULLIF($6, ''), user_type=$7, active=TRUE, account_status='active',
// 			    failed_login_attempts=0, locked_until=NULL, updated_at=CURRENT_TIMESTAMP, deleted_at=NULL
// 			WHERE id=$1
// 		`, userID, strings.TrimSpace(user.Username), strings.TrimSpace(user.EmployeeID), strings.TrimSpace(user.FullName), strings.TrimSpace(email), strings.TrimSpace(user.Mobile), user.UserType)
// 		if err != nil {
// 			return fmt.Errorf("update users: %w", err)
// 		}
// 	}

// 	if err := replaceRoleAssignment(ctx, tx, userID, role.ID); err != nil {
// 		return err
// 	}
// 	return tx.Commit(ctx)
// }

// func replaceRoleAssignment(ctx context.Context, tx pgx.Tx, userID, roleID int) error {
// 	_, err := tx.Exec(ctx, `
// 		UPDATE public.auth_user_roles
// 		SET active = FALSE
// 		WHERE user_id = $1 AND active = TRUE
// 	`, userID)
// 	if err != nil {
// 		return fmt.Errorf("deactivate existing auth_user_roles: %w", err)
// 	}

// 	tag, err := tx.Exec(ctx, `
// 		UPDATE public.auth_user_roles
// 		SET
// 			assigned_by = NULL,
// 			assigned_at = CURRENT_TIMESTAMP,
// 			expires_at = NULL,
// 			active = TRUE
// 		WHERE user_id = $1 AND role_id = $2
// 	`, userID, roleID)
// 	if err != nil {
// 		return fmt.Errorf("reactivate auth_user_roles: %w", err)
// 	}

// 	if tag.RowsAffected() == 0 {
// 		_, err = tx.Exec(ctx, `
// 			INSERT INTO public.auth_user_roles (
// 				user_id, role_id, assigned_by, assigned_at, expires_at, active
// 			)
// 			VALUES ($1, $2, NULL, CURRENT_TIMESTAMP, NULL, TRUE)
// 		`, userID, roleID)
// 		if err != nil {
// 			return fmt.Errorf("insert auth_user_roles: %w", err)
// 		}
// 	}

// 	return nil
// }

// func cell(row []string, headers map[string]int, name string) string {
// 	index, ok := headers[name]
// 	if !ok || index < 0 || index >= len(row) {
// 		return ""
// 	}
// 	return row[index]
// }

// func normalizeHeader(value string) string {
// 	result := strings.TrimSpace(strings.ToLower(strings.TrimPrefix(value, "\uFEFF")))
// 	result = strings.ReplaceAll(result, " ", "_")
// 	result = strings.ReplaceAll(result, "-", "_")
// 	switch result {
// 	case "username":
// 		return "user_name"
// 	case "employeeid", "emp_id":
// 		return "employee_id"
// 	case "fullname":
// 		return "full_name"
// 	case "employee_name":
// 		return "employee_name"
// 	case "email_address":
// 		return "email"
// 	case "mobile_no", "mobile_number":
// 		return "mobile"
// 	default:
// 		return result
// 	}
// }

// func normalize(value string) string {
// 	return strings.ToLower(strings.TrimSpace(value))
// }

// func firstNonEmpty(values ...string) string {
// 	for _, value := range values {
// 		if strings.TrimSpace(value) != "" {
// 			return value
// 		}
// 	}
// 	return ""
// }

// func printSummary(opts options, counts counters, actionCount int) {
// 	mode := "DRY RUN"
// 	if opts.Apply {
// 		mode = "APPLY"
// 	}
// 	fmt.Println()
// 	fmt.Println("============================================================")
// 	fmt.Println("LIVE AUTH USER MIGRATION SUMMARY")
// 	fmt.Println("============================================================")
// 	fmt.Printf("Mode                       : %s\n", mode)
// 	fmt.Printf("Source rows                : %d\n", counts.SourceRows)
// 	fmt.Printf("Eligible active rows       : %d\n", counts.EligibleRows)
// 	fmt.Printf("Action limit               : %d\n", opts.Limit)
// 	fmt.Printf("Actions considered         : %d\n", actionCount)
// 	fmt.Printf("Would create               : %d\n", counts.WouldCreate)
// 	fmt.Printf("Would update               : %d\n", counts.WouldUpdate)
// 	fmt.Printf("Created                    : %d\n", counts.Created)
// 	fmt.Printf("Updated                    : %d\n", counts.Updated)
// 	fmt.Printf("Inactive/status skipped    : %d\n", counts.InactiveSkipped)
// 	fmt.Printf("Protected skipped          : %d\n", counts.ProtectedSkipped)
// 	fmt.Printf("Duplicate username skipped : %d\n", counts.DuplicateUsername)
// 	fmt.Printf("Duplicate employee skipped : %d\n", counts.DuplicateEmployeeID)
// 	fmt.Printf("Duplicate email warnings   : %d\n", counts.DuplicateEmail)
// 	fmt.Printf("Unsupported user_type      : %d\n", counts.UnsupportedType)
// 	fmt.Printf("Missing role skipped       : %d\n", counts.RoleMissingSkipped)
// 	fmt.Printf("Invalid records skipped    : %d\n", counts.InvalidSkipped)
// 	fmt.Printf("Database conflicts skipped : %d\n", counts.DBConflictSkipped)
// 	fmt.Printf("Existing passwords kept    : %d\n", counts.PasswordPreserved)
// 	fmt.Println("============================================================")
// 	if !opts.Apply {
// 		fmt.Println("DRY RUN ONLY: no database rows were changed.")
// 		fmt.Println("Run again with --apply only after reviewing this output.")
// 	}
// }

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
	File                       string
	Sheet                      string
	Apply                      bool
	Limit                      int
	MustChangePassword         bool
	OverwriteExistingPasswords bool
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
	UserType       int // target auth user_type after conservative mapping
	ActiveRaw      string
	StatusRaw      string
}

type dbUser struct {
	ID         int
	Username   string
	EmployeeID string
	Email      string
}

type roleInfo struct {
	ID             int
	Code           string
	LegacyUserType int
}

type counters struct {
	SourceRows          int
	EligibleRows        int
	WouldCreate         int
	WouldUpdate         int
	Created             int
	Updated             int
	InactiveSkipped     int
	ProtectedSkipped    int
	DuplicateUsername   int
	DuplicateEmployeeID int
	DuplicateEmail      int
	UnsupportedType     int
	InvalidSkipped      int
	DBConflictSkipped   int
	RoleMissingSkipped  int
	PasswordPreserved   int
}

var protectedUsers = map[string]bool{
	"admin":            true,
	"itm.root":         true,
	"test.general":     true,
	"test.itpersonnel": true,
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("warning: .env file was not loaded: %v", err)
	}

	opts := parseFlags()

	if strings.TrimSpace(opts.File) == "" {
		log.Fatal("--file is required")
	}

	dbURL := firstNonEmpty(
		os.Getenv("DATABASE_URL"),
		os.Getenv("DB_URL"),
		os.Getenv("POSTGRES_DSN"),
	)

	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set. Set it in the current shell before running this command.")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
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
		log.Fatalf("load auth roles: %v", err)
	}

	fmt.Println("Database auth role mapping:")
	roleTypes := make([]int, 0, len(roles))
	for userType := range roles {
		roleTypes = append(roleTypes, userType)
	}
	sort.Ints(roleTypes)

	for _, userType := range roleTypes {
		role := roles[userType]
		fmt.Printf("  target_user_type=%d -> role_id=%d (%s)\n", userType, role.ID, role.Code)
	}

	fmt.Println("Conservative legacy migration mapping:")
	fmt.Println("  source_user_type=0 -> target_user_type=3 (GENERAL_USER)")
	fmt.Println("  source_user_type=1 -> target_user_type=3 (GENERAL_USER) [review/elevate separately]")
	fmt.Println("  source_user_type=2 -> target_user_type=2 (IT_PERSONNEL)")
	fmt.Println("  source_user_type=3 -> target_user_type=3 (GENERAL_USER)")
	fmt.Println("  No legacy Excel row is automatically granted ROOT or IT_ADMIN.")

	users, sourceCounts, err := loadSourceUsers(opts.File, opts.Sheet)
	if err != nil {
		log.Fatalf("read Excel: %v", err)
	}

	counts := counters{SourceRows: sourceCounts.SourceRows}
	eligible := make([]sourceUser, 0, len(users))

	for _, user := range users {
		if !isEligible(user) {
			counts.InactiveSkipped++
			continue
		}

		counts.EligibleRows++

		if strings.TrimSpace(user.Username) == "" || strings.TrimSpace(user.EmployeeID) == "" || user.Password == "" {
			counts.InvalidSkipped++
			fmt.Printf("[SKIP] row=%d username=%q employee_id=%q reason=missing required username/employee_id/password\n", user.Row, user.Username, user.EmployeeID)
			continue
		}

		targetUserType, ok := mapLegacyUserType(user.SourceUserType)
		if !ok {
			counts.UnsupportedType++
			fmt.Printf(
				"[SKIP] row=%d username=%s employee_id=%s reason=unsupported source_user_type=%d\n",
				user.Row,
				user.Username,
				user.EmployeeID,
				user.SourceUserType,
			)
			continue
		}

		user.UserType = targetUserType

		if _, ok := roles[user.UserType]; !ok {
			counts.RoleMissingSkipped++
			fmt.Printf(
				"[SKIP] row=%d username=%s employee_id=%s reason=no active role for target_user_type=%d\n",
				user.Row,
				user.Username,
				user.EmployeeID,
				user.UserType,
			)
			continue
		}

		eligible = append(eligible, user)
	}

	usernameCounts := make(map[string]int)
	employeeCounts := make(map[string]int)
	emailCounts := make(map[string]int)

	for _, user := range eligible {
		usernameCounts[normalize(user.Username)]++
		employeeCounts[normalize(user.EmployeeID)]++
		if email := normalize(user.Email); email != "" {
			emailCounts[email]++
		}
	}

	actionCount := 0

	for _, user := range eligible {
		if opts.Limit > 0 && actionCount >= opts.Limit {
			break
		}

		usernameKey := normalize(user.Username)
		employeeKey := normalize(user.EmployeeID)

		if usernameCounts[usernameKey] > 1 {
			counts.DuplicateUsername++
			fmt.Printf("[SKIP] row=%d username=%s employee_id=%s reason=duplicate username in Excel\n", user.Row, user.Username, user.EmployeeID)
			continue
		}

		if employeeCounts[employeeKey] > 1 {
			counts.DuplicateEmployeeID++
			fmt.Printf("[SKIP] row=%d username=%s employee_id=%s reason=duplicate employee_id in Excel\n", user.Row, user.Username, user.EmployeeID)
			continue
		}

		if protectedUsers[usernameKey] {
			counts.ProtectedSkipped++
			fmt.Printf("[SKIP] row=%d username=%s employee_id=%s reason=protected account\n", user.Row, user.Username, user.EmployeeID)
			continue
		}

		email := strings.TrimSpace(user.Email)
		if email != "" && emailCounts[normalize(email)] > 1 {
			counts.DuplicateEmail++
			fmt.Printf("[WARN] row=%d username=%s employee_id=%s duplicate email in Excel; email will be stored as NULL\n", user.Row, user.Username, user.EmployeeID)
			email = ""
		}

		existingByEmployee, err := findUserByEmployeeID(ctx, db, user.EmployeeID)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Fatalf("lookup by employee_id row=%d: %v", user.Row, err)
		}

		existingByUsername, err := findUserByUsername(ctx, db, user.Username)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			log.Fatalf("lookup by username row=%d: %v", user.Row, err)
		}

		var target *dbUser
		if existingByEmployee != nil {
			target = existingByEmployee
			if protectedUsers[normalize(target.Username)] {
				counts.ProtectedSkipped++
				fmt.Printf("[SKIP] row=%d username=%s employee_id=%s reason=employee_id belongs to protected account %s\n", user.Row, user.Username, user.EmployeeID, target.Username)
				continue
			}
		}

		if existingByUsername != nil {
			if target == nil || existingByUsername.ID != target.ID {
				counts.DBConflictSkipped++
				fmt.Printf("[CONFLICT] row=%d username=%s employee_id=%s reason=username already belongs to another database user (user_id=%d employee_id=%s)\n", user.Row, user.Username, user.EmployeeID, existingByUsername.ID, existingByUsername.EmployeeID)
				continue
			}
		}

		if email != "" {
			existingByEmail, err := findUserByEmail(ctx, db, email)
			if err != nil && !errors.Is(err, pgx.ErrNoRows) {
				log.Fatalf("lookup by email row=%d: %v", user.Row, err)
			}

			if existingByEmail != nil && (target == nil || existingByEmail.ID != target.ID) {
				counts.DuplicateEmail++
				fmt.Printf("[WARN] row=%d username=%s employee_id=%s email already belongs to database user_id=%d; email will be stored as NULL\n", user.Row, user.Username, user.EmployeeID, existingByEmail.ID)
				email = ""
			}
		}

		role := roles[user.UserType]

		if target == nil {
			counts.WouldCreate++
			actionCount++

			if !opts.Apply {
				fmt.Printf(
					"[CREATE] row=%d username=%s employee_id=%s source_user_type=%d target_user_type=%d role=%s\n",
					user.Row,
					user.Username,
					user.EmployeeID,
					user.SourceUserType,
					user.UserType,
					role.Code,
				)
				continue
			}

			if err := createUser(context.Background(), db, user, email, role, opts.MustChangePassword); err != nil {
				log.Fatalf("create row=%d username=%s employee_id=%s: %v", user.Row, user.Username, user.EmployeeID, err)
			}

			counts.Created++
			fmt.Printf(
				"[CREATED] row=%d username=%s employee_id=%s source_user_type=%d target_user_type=%d role=%s\n",
				user.Row,
				user.Username,
				user.EmployeeID,
				user.SourceUserType,
				user.UserType,
				role.Code,
			)
			continue
		}

		counts.WouldUpdate++
		actionCount++

		if !opts.Apply {
			passwordAction := "preserve-existing-password"
			if opts.OverwriteExistingPasswords {
				passwordAction = "replace-with-Excel-password"
			}
			fmt.Printf(
				"[UPDATE] row=%d user_id=%d username=%s employee_id=%s source_user_type=%d target_user_type=%d role=%s password=%s\n",
				user.Row,
				target.ID,
				user.Username,
				user.EmployeeID,
				user.SourceUserType,
				user.UserType,
				role.Code,
				passwordAction,
			)
			continue
		}

		if err := updateUser(context.Background(), db, target.ID, user, email, role, opts.MustChangePassword, opts.OverwriteExistingPasswords); err != nil {
			log.Fatalf("update row=%d user_id=%d username=%s employee_id=%s: %v", user.Row, target.ID, user.Username, user.EmployeeID, err)
		}

		if !opts.OverwriteExistingPasswords {
			counts.PasswordPreserved++
		}
		counts.Updated++
		fmt.Printf(
			"[UPDATED] row=%d user_id=%d username=%s employee_id=%s source_user_type=%d target_user_type=%d role=%s\n",
			user.Row,
			target.ID,
			user.Username,
			user.EmployeeID,
			user.SourceUserType,
			user.UserType,
			role.Code,
		)
	}

	printSummary(opts, counts, actionCount)
}

func parseFlags() options {
	var opts options
	flag.StringVar(&opts.File, "file", "", "path to legacy Excel workbook")
	flag.StringVar(&opts.Sheet, "sheet", "tbl_user_info", "Excel sheet name")
	flag.BoolVar(&opts.Apply, "apply", false, "write changes to PostgreSQL; default is dry-run")
	flag.IntVar(&opts.Limit, "limit", 0, "maximum number of create/update actions; 0 means unlimited")
	flag.BoolVar(&opts.MustChangePassword, "must-change-password", false, "set must_change_password=true for newly imported/re-passworded users")
	flag.BoolVar(&opts.OverwriteExistingPasswords, "overwrite-existing-passwords", false, "replace password_hash for existing users using the Excel password")
	flag.Parse()
	return opts
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
		if err := rows.Scan(&role.ID, &role.Code, &role.LegacyUserType); err != nil {
			return nil, err
		}
		if _, exists := result[role.LegacyUserType]; exists {
			return nil, fmt.Errorf("multiple active auth_roles exist for legacy_user_type=%d", role.LegacyUserType)
		}
		result[role.LegacyUserType] = role
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func loadSourceUsers(filePath, sheetName string) ([]sourceUser, counters, error) {
	workbook, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, counters{}, err
	}
	defer func() { _ = workbook.Close() }()

	if sheetName == "" {
		sheets := workbook.GetSheetList()
		if len(sheets) == 0 {
			return nil, counters{}, errors.New("Excel workbook has no sheets")
		}
		sheetName = sheets[0]
	}

	rows, err := workbook.GetRows(sheetName)
	if err != nil {
		return nil, counters{}, fmt.Errorf("read sheet %q: %w", sheetName, err)
	}
	if len(rows) < 2 {
		return nil, counters{}, errors.New("Excel sheet has no data rows")
	}

	headers := make(map[string]int)
	for index, raw := range rows[0] {
		key := normalizeHeader(raw)
		if key != "" {
			headers[key] = index
		}
	}

	required := []string{"user_name", "password", "employee_id", "user_type", "status", "active"}
	for _, column := range required {
		if _, ok := headers[column]; !ok {
			return nil, counters{}, fmt.Errorf("required Excel column %q not found", column)
		}
	}

	result := make([]sourceUser, 0, len(rows)-1)
	for index := 1; index < len(rows); index++ {
		row := rows[index]
		username := strings.TrimSpace(cell(row, headers, "user_name"))
		employeeID := strings.TrimSpace(cell(row, headers, "employee_id"))
		fullName := strings.TrimSpace(firstNonEmpty(cell(row, headers, "full_name"), cell(row, headers, "employee_name"), username, employeeID))
		userTypeRaw := strings.TrimSpace(cell(row, headers, "user_type"))
		userType, err := strconv.Atoi(userTypeRaw)
		if err != nil {
			userType = -1
		}

		result = append(result, sourceUser{
			Row:            index + 1,
			Username:       username,
			Password:       cell(row, headers, "password"), // intentionally NOT TrimSpace
			EmployeeID:     employeeID,
			FullName:       fullName,
			Email:          strings.TrimSpace(cell(row, headers, "email")),
			Mobile:         strings.TrimSpace(cell(row, headers, "mobile")),
			SourceUserType: userType,
			UserType:       userType,
			ActiveRaw:      strings.TrimSpace(cell(row, headers, "active")),
			StatusRaw:      strings.TrimSpace(cell(row, headers, "status")),
		})
	}

	return result, counters{SourceRows: len(result)}, nil
}

// mapLegacyUserType applies a least-privilege migration policy.
//
// Important:
//   - Legacy Excel type 0 MUST NOT become ROOT automatically.
//   - Legacy Excel type 1 is temporarily migrated as GENERAL_USER until
//     those few accounts are explicitly reviewed and elevated if required.
//   - Type 2 is mapped to IT_PERSONNEL.
//   - Type 3 is mapped to GENERAL_USER.
//
// ROOT and IT_ADMIN remain controlled roles and are not automatically
// granted from the legacy workbook.
func mapLegacyUserType(sourceUserType int) (int, bool) {
	switch sourceUserType {
	case 0:
		return 3, true // GENERAL_USER
	case 1:
		return 3, true // GENERAL_USER; review/elevate separately
	case 2:
		return 2, true // IT_PERSONNEL
	case 3:
		return 3, true // GENERAL_USER
	default:
		return 0, false
	}
}

func isEligible(user sourceUser) bool {
	return strings.EqualFold(strings.TrimSpace(user.ActiveRaw), "yes") && strings.TrimSpace(user.StatusRaw) == "1"
}

func findUserByEmployeeID(ctx context.Context, db *pgxpool.Pool, employeeID string) (*dbUser, error) {
	var user dbUser
	err := db.QueryRow(ctx, `
		SELECT id, username, COALESCE(employee_id, ''), COALESCE(email, '')
		FROM public.users
		WHERE deleted_at IS NULL
		  AND BTRIM(COALESCE(employee_id, '')) = BTRIM($1)
		ORDER BY id
		LIMIT 1
	`, employeeID).Scan(&user.ID, &user.Username, &user.EmployeeID, &user.Email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func findUserByUsername(ctx context.Context, db *pgxpool.Pool, username string) (*dbUser, error) {
	var user dbUser
	err := db.QueryRow(ctx, `
		SELECT id, username, COALESCE(employee_id, ''), COALESCE(email, '')
		FROM public.users
		WHERE deleted_at IS NULL
		  AND LOWER(BTRIM(username)) = LOWER(BTRIM($1))
		ORDER BY id
		LIMIT 1
	`, username).Scan(&user.ID, &user.Username, &user.EmployeeID, &user.Email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func findUserByEmail(ctx context.Context, db *pgxpool.Pool, email string) (*dbUser, error) {
	var user dbUser
	err := db.QueryRow(ctx, `
		SELECT id, username, COALESCE(employee_id, ''), COALESCE(email, '')
		FROM public.users
		WHERE deleted_at IS NULL
		  AND NULLIF(BTRIM(COALESCE(email, '')), '') IS NOT NULL
		  AND LOWER(BTRIM(email)) = LOWER(BTRIM($1))
		ORDER BY id
		LIMIT 1
	`, email).Scan(&user.ID, &user.Username, &user.EmployeeID, &user.Email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func createUser(ctx context.Context, db *pgxpool.Pool, user sourceUser, email string, role roleInfo, mustChangePassword bool) error {
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
			'active', $8, 0, NULL, NULL, NULL, NULL, NULL, NULL
		)
		RETURNING id
	`,
		strings.TrimSpace(user.Username), string(passwordHash), strings.TrimSpace(user.EmployeeID),
		strings.TrimSpace(user.FullName), strings.TrimSpace(email), strings.TrimSpace(user.Mobile),
		user.UserType, mustChangePassword,
	).Scan(&userID)
	if err != nil {
		return fmt.Errorf("insert users: %w", err)
	}

	if err := replaceRoleAssignment(ctx, tx, userID, role.ID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func updateUser(ctx context.Context, db *pgxpool.Pool, userID int, user sourceUser, email string, role roleInfo, mustChangePassword, overwritePassword bool) error {
	tx, err := db.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if overwritePassword {
		passwordHash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("bcrypt password: %w", err)
		}
		_, err = tx.Exec(ctx, `
			UPDATE public.users
			SET username=$2, password_hash=$3, employee_id=NULLIF($4, ''), full_name=NULLIF($5, ''),
			    email=NULLIF($6, ''), mobile=NULLIF($7, ''), user_type=$8, active=TRUE,
			    account_status='active', must_change_password=$9, failed_login_attempts=0,
			    locked_until=NULL, updated_at=CURRENT_TIMESTAMP, deleted_at=NULL
			WHERE id=$1
		`, userID, strings.TrimSpace(user.Username), string(passwordHash), strings.TrimSpace(user.EmployeeID), strings.TrimSpace(user.FullName), strings.TrimSpace(email), strings.TrimSpace(user.Mobile), user.UserType, mustChangePassword)
		if err != nil {
			return fmt.Errorf("update users with password: %w", err)
		}
	} else {
		_, err = tx.Exec(ctx, `
			UPDATE public.users
			SET username=$2, employee_id=NULLIF($3, ''), full_name=NULLIF($4, ''), email=NULLIF($5, ''),
			    mobile=NULLIF($6, ''), user_type=$7, active=TRUE, account_status='active',
			    failed_login_attempts=0, locked_until=NULL, updated_at=CURRENT_TIMESTAMP, deleted_at=NULL
			WHERE id=$1
		`, userID, strings.TrimSpace(user.Username), strings.TrimSpace(user.EmployeeID), strings.TrimSpace(user.FullName), strings.TrimSpace(email), strings.TrimSpace(user.Mobile), user.UserType)
		if err != nil {
			return fmt.Errorf("update users: %w", err)
		}
	}

	if err := replaceRoleAssignment(ctx, tx, userID, role.ID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func replaceRoleAssignment(ctx context.Context, tx pgx.Tx, userID, roleID int) error {
	_, err := tx.Exec(ctx, `
		UPDATE public.auth_user_roles
		SET active = FALSE
		WHERE user_id = $1 AND active = TRUE
	`, userID)
	if err != nil {
		return fmt.Errorf("deactivate existing auth_user_roles: %w", err)
	}

	tag, err := tx.Exec(ctx, `
		UPDATE public.auth_user_roles
		SET
			assigned_by = NULL,
			assigned_at = CURRENT_TIMESTAMP,
			expires_at = NULL,
			active = TRUE
		WHERE user_id = $1 AND role_id = $2
	`, userID, roleID)
	if err != nil {
		return fmt.Errorf("reactivate auth_user_roles: %w", err)
	}

	if tag.RowsAffected() == 0 {
		_, err = tx.Exec(ctx, `
			INSERT INTO public.auth_user_roles (
				user_id, role_id, assigned_by, assigned_at, expires_at, active
			)
			VALUES ($1, $2, NULL, CURRENT_TIMESTAMP, NULL, TRUE)
		`, userID, roleID)
		if err != nil {
			return fmt.Errorf("insert auth_user_roles: %w", err)
		}
	}

	return nil
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
	case "employee_name":
		return "employee_name"
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

func printSummary(opts options, counts counters, actionCount int) {
	mode := "DRY RUN"
	if opts.Apply {
		mode = "APPLY"
	}
	fmt.Println()
	fmt.Println("============================================================")
	fmt.Println("LIVE AUTH USER MIGRATION SUMMARY")
	fmt.Println("============================================================")
	fmt.Printf("Mode                       : %s\n", mode)
	fmt.Printf("Source rows                : %d\n", counts.SourceRows)
	fmt.Printf("Eligible active rows       : %d\n", counts.EligibleRows)
	fmt.Printf("Action limit               : %d\n", opts.Limit)
	fmt.Printf("Actions considered         : %d\n", actionCount)
	fmt.Printf("Would create               : %d\n", counts.WouldCreate)
	fmt.Printf("Would update               : %d\n", counts.WouldUpdate)
	fmt.Printf("Created                    : %d\n", counts.Created)
	fmt.Printf("Updated                    : %d\n", counts.Updated)
	fmt.Printf("Inactive/status skipped    : %d\n", counts.InactiveSkipped)
	fmt.Printf("Protected skipped          : %d\n", counts.ProtectedSkipped)
	fmt.Printf("Duplicate username skipped : %d\n", counts.DuplicateUsername)
	fmt.Printf("Duplicate employee skipped : %d\n", counts.DuplicateEmployeeID)
	fmt.Printf("Duplicate email warnings   : %d\n", counts.DuplicateEmail)
	fmt.Printf("Unsupported user_type      : %d\n", counts.UnsupportedType)
	fmt.Printf("Missing role skipped       : %d\n", counts.RoleMissingSkipped)
	fmt.Printf("Invalid records skipped    : %d\n", counts.InvalidSkipped)
	fmt.Printf("Database conflicts skipped : %d\n", counts.DBConflictSkipped)
	fmt.Printf("Existing passwords kept    : %d\n", counts.PasswordPreserved)
	fmt.Println("============================================================")
	if !opts.Apply {
		fmt.Println("DRY RUN ONLY: no database rows were changed.")
		fmt.Println("Run again with --apply only after reviewing this output.")
	}
}

// backend/internal/handler/auth.go
// package handler

// import (
// 	"context"
// 	"log"
// 	"net/http"
// 	"time"

// 	"itm-api/internal/config"
// 	"itm-api/internal/middleware"
// 	"itm-api/pkg/response"

// 	"github.com/gin-gonic/gin"
// 	"github.com/golang-jwt/jwt/v5"
// 	"github.com/jackc/pgx/v5/pgxpool"
// 	"golang.org/x/crypto/bcrypt"
// )

// type AuthHandler struct {
// 	db  *pgxpool.Pool
// 	cfg *config.Config
// }

// func NewAuthHandler(db *pgxpool.Pool, cfg *config.Config) *AuthHandler {
// 	return &AuthHandler{db: db, cfg: cfg}
// }

// func (h *AuthHandler) Login(c *gin.Context) {
// 	var req struct {
// 		Username string `json:"username" binding:"required"`
// 		Password string `json:"password" binding:"required"`
// 	}

// 	if err := c.ShouldBindJSON(&req); err != nil {
// 		log.Println("LOGIN DEBUG bind error:", err)
// 		response.BadRequest(c, "username and password required")
// 		return
// 	}

// 	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
// 	defer cancel()

// 	var id int
// 	var empID, username, fullName, hash string
// 	var userType int
// 	var active bool

// 	err := h.db.QueryRow(ctx,
// 		`SELECT id, employee_id, username, full_name, password_hash, user_type, active
// 		 FROM users
// 		 WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)
// 		 LIMIT 1`, req.Username).
// 		Scan(&id, &empID, &username, &fullName, &hash, &userType, &active)

// 	if err != nil {
// 		log.Println("LOGIN DEBUG query/scan error:", err)
// 		response.BadRequest(c, "invalid credentials")
// 		return
// 	}

// 	// print debug info
// 	// log.Println("LOGIN DEBUG id:", id)
// 	// log.Println("LOGIN DEBUG username:", username)
// 	// log.Println("LOGIN DEBUG active:", active)
// 	// log.Println("LOGIN DEBUG userType:", userType)
// 	// log.Println("LOGIN DEBUG hash length:", len(hash))
// 	// log.Println("LOGIN DEBUG hash:", hash)
// 	// log.Println("LOGIN DEBUG password:", req.Password)

// 	if !active {
// 		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "account inactive"})
// 		return
// 	}

// 	bcryptErr := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password))
// 	log.Println("LOGIN DEBUG bcrypt error:", bcryptErr)

// 	if bcryptErr != nil {
// 		response.BadRequest(c, "invalid credentials")
// 		return
// 	}

// 	token, err := h.makeToken(id, empID, username, userType, 8*time.Hour)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	_, _ = h.db.Exec(ctx,
// 		`INSERT INTO login_logs (user_id, ip_address) VALUES ($1, $2::inet)`,
// 		empID,
// 		c.ClientIP(),
// 	)

// 	response.OK(c, gin.H{
// 		"token":       token,
// 		"expires_in":  28800,
// 		"user_id":     id,
// 		"employee_id": empID,
// 		"username":    username,
// 		"full_name":   fullName,
// 		"user_type":   userType,
// 	})
// }

// func (h *AuthHandler) Refresh(c *gin.Context) {
// 	h2 := c.GetHeader("Authorization")

// 	if len(h2) < 8 {
// 		response.BadRequest(c, "missing token")
// 		return
// 	}

// 	claims := &middleware.Claims{}
// 	p := jwt.NewParser(jwt.WithoutClaimsValidation())

// 	if _, err := p.ParseWithClaims(h2[7:], claims, func(t *jwt.Token) (any, error) {
// 		return []byte(h.cfg.JWTSecret), nil
// 	}); err != nil {
// 		response.BadRequest(c, "invalid token")
// 		return
// 	}

// 	tok, err := h.makeToken(
// 		claims.UserID,
// 		claims.EmployeeID,
// 		claims.Username,
// 		claims.UserType,
// 		8*time.Hour,
// 	)
// 	if err != nil {
// 		response.ServerError(c, err)
// 		return
// 	}

// 	response.OK(c, gin.H{"token": tok, "expires_in": 28800})
// }

// func (h *AuthHandler) makeToken(uid int, empID, username string, role int, dur time.Duration) (string, error) {
// 	claims := &middleware.Claims{
// 		UserID:     uid,
// 		EmployeeID: empID,
// 		Username:   username,
// 		UserType:   role,
// 		RegisteredClaims: jwt.RegisteredClaims{
// 			ExpiresAt: jwt.NewNumericDate(time.Now().Add(dur)),
// 			IssuedAt:  jwt.NewNumericDate(time.Now()),
// 		},
// 	}

// 	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(h.cfg.JWTSecret))
// }

// backend/internal/handler/auth.go

package handler

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"strings"
	"time"

	"itm-api/internal/config"
	"itm-api/internal/middleware"
	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

const (
	authDBTimeout       = 5 * time.Second
	accessTokenDuration = 8 * time.Hour

	maxLoginAttempts = 5
	lockDuration     = 15 * time.Minute
)

type AuthHandler struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

type authenticatedUser struct {
	ID                 int
	EmployeeID         string
	Username           string
	FullName           string
	PasswordHash       string
	UserType           int
	RoleCode           string
	Active             bool
	AccountStatus      string
	LockedUntil        sql.NullTime
	MustChangePassword bool
}

func NewAuthHandler(db *pgxpool.Pool, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		db:  db,
		cfg: cfg,
	}
}

/* ============================================================
   LOGIN
============================================================ */

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(
			c,
			"username and password required",
		)
		return
	}

	loginIdentifier := strings.TrimSpace(req.Username)

	if loginIdentifier == "" ||
		req.Password == "" {

		response.BadRequest(
			c,
			"username and password required",
		)
		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		authDBTimeout,
	)
	defer cancel()

	user, err := h.findLoginUser(
		ctx,
		loginIdentifier,
	)

	if err != nil {
		if err != pgx.ErrNoRows {
			log.Printf(
				"auth login query failed: %v",
				err,
			)
		}

		h.writeAuthAudit(
			ctx,
			c,
			nil,
			"",
			loginIdentifier,
			"LOGIN_FAILED",
			false,
			"invalid credentials",
		)

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "invalid credentials",
			},
		)
		return
	}

	/* ========================================================
	   HANDLE EXPIRED TEMPORARY LOCK
	======================================================== */

	if strings.EqualFold(
		user.AccountStatus,
		"locked",
	) {
		if user.LockedUntil.Valid &&
			!user.LockedUntil.Time.After(time.Now()) {

			if err := h.unlockExpiredAccount(
				ctx,
				user.ID,
			); err != nil {
				log.Printf(
					"auth unlock expired account failed: %v",
					err,
				)

				response.ServerError(c, err)
				return
			}

			user.AccountStatus = "active"
			user.LockedUntil = sql.NullTime{}
		}
	}

	/* ========================================================
	   CHECK ACTIVE / ACCOUNT STATUS
	======================================================== */

	if !user.Active {
		h.writeAuthAudit(
			ctx,
			c,
			&user.ID,
			user.EmployeeID,
			user.Username,
			"LOGIN_FAILED",
			false,
			"account inactive",
		)

		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"error":   "account inactive",
			},
		)
		return
	}

	if strings.EqualFold(
		user.AccountStatus,
		"locked",
	) {
		h.writeAuthAudit(
			ctx,
			c,
			&user.ID,
			user.EmployeeID,
			user.Username,
			"LOGIN_FAILED",
			false,
			"account temporarily locked",
		)

		c.JSON(
			http.StatusLocked,
			gin.H{
				"success": false,
				"error":   "account temporarily locked",
			},
		)
		return
	}

	if !strings.EqualFold(
		user.AccountStatus,
		"active",
	) {
		h.writeAuthAudit(
			ctx,
			c,
			&user.ID,
			user.EmployeeID,
			user.Username,
			"LOGIN_FAILED",
			false,
			"account unavailable",
		)

		c.JSON(
			http.StatusForbidden,
			gin.H{
				"success": false,
				"error":   "account unavailable",
			},
		)
		return
	}

	/* ========================================================
	   VERIFY BCRYPT PASSWORD
	======================================================== */

	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(req.Password),
	); err != nil {

		if updateErr := h.recordFailedLogin(
			ctx,
			user.ID,
		); updateErr != nil {
			log.Printf(
				"auth failed-login update failed: %v",
				updateErr,
			)
		}

		h.writeAuthAudit(
			ctx,
			c,
			&user.ID,
			user.EmployeeID,
			user.Username,
			"LOGIN_FAILED",
			false,
			"invalid credentials",
		)

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "invalid credentials",
			},
		)
		return
	}

	/* ========================================================
	   SUCCESSFUL LOGIN
	======================================================== */

	if err := h.recordSuccessfulLogin(
		ctx,
		user.ID,
		c.ClientIP(),
		c.Request.UserAgent(),
	); err != nil {
		log.Printf(
			"auth login metadata update failed: %v",
			err,
		)
	}

	token, err := h.makeToken(
		user.ID,
		user.EmployeeID,
		user.Username,
		user.UserType,
		user.RoleCode,
		accessTokenDuration,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	/*
	   Keep the legacy login_logs write temporarily because
	   the existing application may still depend on this table.

	   We will review the login_logs schema separately before
	   changing or removing this legacy behavior.
	*/
	if _, err := h.db.Exec(
		ctx,
		`INSERT INTO login_logs (
			user_id,
			ip_address
		)
		VALUES (
			$1,
			NULLIF($2, '')::inet
		)`,
		user.EmployeeID,
		c.ClientIP(),
	); err != nil {
		log.Printf(
			"legacy login_logs insert failed: %v",
			err,
		)
	}

	h.writeAuthAudit(
		ctx,
		c,
		&user.ID,
		user.EmployeeID,
		user.Username,
		"LOGIN_SUCCESS",
		true,
		"",
	)

	response.OK(
		c,
		gin.H{
			"token":                token,
			"expires_in":           int(accessTokenDuration.Seconds()),
			"user_id":              user.ID,
			"employee_id":          user.EmployeeID,
			"username":             user.Username,
			"full_name":            user.FullName,
			"user_type":            user.UserType,
			"role_code":            user.RoleCode,
			"must_change_password": user.MustChangePassword,
		},
	)
}

/* ============================================================
   REFRESH CURRENT ACCESS TOKEN

   IMPORTANT:
   This remains backward-compatible with the current API.

   It now requires a valid, non-expired access token and checks
   the current database account/role before issuing a new token.

   Later, auth_sessions will be used for dedicated refresh
   tokens.
============================================================ */

func (h *AuthHandler) Refresh(c *gin.Context) {
	tokenString, ok := bearerToken(
		c.GetHeader("Authorization"),
	)
	if !ok {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "missing token",
			},
		)
		return
	}

	claims := &middleware.Claims{}

	parser := jwt.NewParser(
		jwt.WithValidMethods(
			[]string{
				jwt.SigningMethodHS256.Alg(),
			},
		),
		jwt.WithExpirationRequired(),
		jwt.WithIssuedAt(),
		jwt.WithLeeway(30*time.Second),
	)

	token, err := parser.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (any, error) {
			if token.Method.Alg() !=
				jwt.SigningMethodHS256.Alg() {

				return nil, jwt.ErrSignatureInvalid
			}

			return []byte(
				h.cfg.JWTSecret,
			), nil
		},
	)

	if err != nil ||
		token == nil ||
		!token.Valid {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "invalid or expired token",
			},
		)
		return
	}

	if claims.UserID <= 0 {
		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "invalid token identity",
			},
		)
		return
	}

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		authDBTimeout,
	)
	defer cancel()

	user, err := h.findUserByID(
		ctx,
		claims.UserID,
	)
	if err != nil {
		if err != pgx.ErrNoRows {
			log.Printf(
				"auth refresh user lookup failed: %v",
				err,
			)
		}

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "account unavailable",
			},
		)
		return
	}

	if !user.Active ||
		!strings.EqualFold(
			user.AccountStatus,
			"active",
		) {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "account unavailable",
			},
		)
		return
	}

	newToken, err := h.makeToken(
		user.ID,
		user.EmployeeID,
		user.Username,
		user.UserType,
		user.RoleCode,
		accessTokenDuration,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	h.writeAuthAudit(
		ctx,
		c,
		&user.ID,
		user.EmployeeID,
		user.Username,
		"TOKEN_REFRESH",
		true,
		"",
	)

	response.OK(
		c,
		gin.H{
			"token":      newToken,
			"expires_in": int(accessTokenDuration.Seconds()),
			"role_code":  user.RoleCode,
		},
	)
}

/* ============================================================
   CURRENT AUTHENTICATED USER

   GET /api/v1/auth/me

   Returns the current database identity, role and permissions.
   We intentionally resolve these from the database instead of
   trusting only the JWT so current role/permission changes are
   reflected immediately.
============================================================ */

func (h *AuthHandler) Me(c *gin.Context) {
	userID, ok := middleware.GetCurrentUserID(c)
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

	ctx, cancel := context.WithTimeout(
		c.Request.Context(),
		authDBTimeout,
	)
	defer cancel()

	var (
		id                 int
		employeeID         string
		username           string
		fullName           string
		email              string
		userType           int
		roleCode           string
		roleName           string
		active             bool
		accountStatus      string
		mustChangePassword bool
	)

	err := h.db.QueryRow(
		ctx,
		`
		SELECT
			u.id,
			COALESCE(u.employee_id, ''),
			u.username,
			COALESCE(u.full_name, ''),
			COALESCE(u.email, ''),
			u.user_type,
			u.active,
			u.account_status,
			u.must_change_password,
			r.code,
			r.name

		FROM public.users AS u

		JOIN public.auth_user_roles AS ur
			ON ur.user_id = u.id
			AND ur.active = TRUE
			AND (
				ur.expires_at IS NULL
				OR ur.expires_at > CURRENT_TIMESTAMP
			)

		JOIN public.auth_roles AS r
			ON r.id = ur.role_id
			AND r.active = TRUE
			AND r.legacy_user_type = u.user_type

		WHERE
			u.id = $1
			AND u.deleted_at IS NULL

		ORDER BY r.hierarchy_level DESC

		LIMIT 1
		`,
		userID,
	).Scan(
		&id,
		&employeeID,
		&username,
		&fullName,
		&email,
		&userType,
		&active,
		&accountStatus,
		&mustChangePassword,
		&roleCode,
		&roleName,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(
				http.StatusUnauthorized,
				gin.H{
					"success": false,
					"error":   "account unavailable",
				},
			)
			return
		}

		log.Printf(
			"auth me user lookup failed: %v",
			err,
		)

		response.ServerError(c, err)
		return
	}

	if !active ||
		!strings.EqualFold(
			accountStatus,
			"active",
		) {

		c.JSON(
			http.StatusUnauthorized,
			gin.H{
				"success": false,
				"error":   "account unavailable",
			},
		)
		return
	}

	rows, err := h.db.Query(
		ctx,
		`
		SELECT DISTINCT
			p.code

		FROM public.auth_user_roles AS ur

		JOIN public.auth_roles AS r
			ON r.id = ur.role_id
			AND r.active = TRUE

		JOIN public.auth_role_permissions AS rp
			ON rp.role_id = r.id

		JOIN public.auth_permissions AS p
			ON p.id = rp.permission_id
			AND p.active = TRUE

		WHERE
			ur.user_id = $1
			AND ur.active = TRUE
			AND (
				ur.expires_at IS NULL
				OR ur.expires_at > CURRENT_TIMESTAMP
			)

		ORDER BY p.code
		`,
		userID,
	)
	if err != nil {
		log.Printf(
			"auth me permission lookup failed: %v",
			err,
		)

		response.ServerError(c, err)
		return
	}
	defer rows.Close()

	permissions := make([]string, 0)

	for rows.Next() {
		var permissionCode string

		if err := rows.Scan(
			&permissionCode,
		); err != nil {
			log.Printf(
				"auth me permission scan failed: %v",
				err,
			)

			response.ServerError(c, err)
			return
		}

		permissionCode = strings.TrimSpace(
			permissionCode,
		)

		if permissionCode != "" {
			permissions = append(
				permissions,
				permissionCode,
			)
		}
	}

	if err := rows.Err(); err != nil {
		log.Printf(
			"auth me permission rows failed: %v",
			err,
		)

		response.ServerError(c, err)
		return
	}

	response.OK(
		c,
		gin.H{
			"user_id":              id,
			"employee_id":          strings.TrimSpace(employeeID),
			"username":             strings.TrimSpace(username),
			"full_name":            strings.TrimSpace(fullName),
			"email":                strings.TrimSpace(email),
			"user_type":            userType,
			"role_code":            strings.TrimSpace(roleCode),
			"role_name":            strings.TrimSpace(roleName),
			"account_status":       accountStatus,
			"must_change_password": mustChangePassword,
			"permissions":          permissions,
		},
	)
}

/* ============================================================
   FIND LOGIN USER

   Authentication now resolves the role through:

   users
       -> auth_user_roles
       -> auth_roles

   The active role must match users.user_type through the
   legacy_user_type mapping.
============================================================ */

func (h *AuthHandler) findLoginUser(
	ctx context.Context,
	loginIdentifier string,
) (*authenticatedUser, error) {
	var user authenticatedUser

	err := h.db.QueryRow(
		ctx,
		`
		SELECT
			u.id,
			COALESCE(u.employee_id, ''),
			u.username,
			COALESCE(u.full_name, ''),
			u.password_hash,
			u.user_type,
			u.active,
			u.account_status,
			u.locked_until,
			u.must_change_password,
			r.code
		FROM public.users AS u

		JOIN public.auth_user_roles AS ur
			ON ur.user_id = u.id
			AND ur.active = TRUE
			AND (
				ur.expires_at IS NULL
				OR ur.expires_at > CURRENT_TIMESTAMP
			)

		JOIN public.auth_roles AS r
			ON r.id = ur.role_id
			AND r.active = TRUE
			AND r.legacy_user_type = u.user_type

		WHERE
			u.deleted_at IS NULL
			AND (
				LOWER(u.username) = LOWER($1)
				OR LOWER(u.email) = LOWER($1)
			)

		ORDER BY r.hierarchy_level DESC

		LIMIT 1
		`,
		loginIdentifier,
	).Scan(
		&user.ID,
		&user.EmployeeID,
		&user.Username,
		&user.FullName,
		&user.PasswordHash,
		&user.UserType,
		&user.Active,
		&user.AccountStatus,
		&user.LockedUntil,
		&user.MustChangePassword,
		&user.RoleCode,
	)
	if err != nil {
		return nil, err
	}

	user.EmployeeID = strings.TrimSpace(
		user.EmployeeID,
	)

	user.Username = strings.TrimSpace(
		user.Username,
	)

	user.FullName = strings.TrimSpace(
		user.FullName,
	)

	user.RoleCode = strings.TrimSpace(
		user.RoleCode,
	)

	return &user, nil
}

/* ============================================================
   FIND CURRENT USER BY ID
============================================================ */

func (h *AuthHandler) findUserByID(
	ctx context.Context,
	userID int,
) (*authenticatedUser, error) {
	var user authenticatedUser

	err := h.db.QueryRow(
		ctx,
		`
		SELECT
			u.id,
			COALESCE(u.employee_id, ''),
			u.username,
			COALESCE(u.full_name, ''),
			u.password_hash,
			u.user_type,
			u.active,
			u.account_status,
			u.locked_until,
			u.must_change_password,
			r.code
		FROM public.users AS u

		JOIN public.auth_user_roles AS ur
			ON ur.user_id = u.id
			AND ur.active = TRUE
			AND (
				ur.expires_at IS NULL
				OR ur.expires_at > CURRENT_TIMESTAMP
			)

		JOIN public.auth_roles AS r
			ON r.id = ur.role_id
			AND r.active = TRUE
			AND r.legacy_user_type = u.user_type

		WHERE
			u.id = $1
			AND u.deleted_at IS NULL

		ORDER BY r.hierarchy_level DESC

		LIMIT 1
		`,
		userID,
	).Scan(
		&user.ID,
		&user.EmployeeID,
		&user.Username,
		&user.FullName,
		&user.PasswordHash,
		&user.UserType,
		&user.Active,
		&user.AccountStatus,
		&user.LockedUntil,
		&user.MustChangePassword,
		&user.RoleCode,
	)
	if err != nil {
		return nil, err
	}

	user.EmployeeID = strings.TrimSpace(
		user.EmployeeID,
	)

	user.Username = strings.TrimSpace(
		user.Username,
	)

	user.FullName = strings.TrimSpace(
		user.FullName,
	)

	user.RoleCode = strings.TrimSpace(
		user.RoleCode,
	)

	return &user, nil
}

/* ============================================================
   RECORD FAILED LOGIN

   Five consecutive failures temporarily lock the account for
   15 minutes.
============================================================ */

func (h *AuthHandler) recordFailedLogin(
	ctx context.Context,
	userID int,
) error {
	_, err := h.db.Exec(
		ctx,
		`
		UPDATE public.users

		SET
			failed_login_attempts =
				COALESCE(failed_login_attempts, 0) + 1,

			account_status =
				CASE
					WHEN
						COALESCE(failed_login_attempts, 0) + 1
						>= $2
					THEN 'locked'
					ELSE account_status
				END,

			locked_until =
				CASE
					WHEN
						COALESCE(failed_login_attempts, 0) + 1
						>= $2
					THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes'
					ELSE locked_until
				END,

			updated_at = CURRENT_TIMESTAMP

		WHERE id = $1
		`,
		userID,
		maxLoginAttempts,
	)

	return err
}

/* ============================================================
   UNLOCK EXPIRED TEMPORARY LOCK
============================================================ */

func (h *AuthHandler) unlockExpiredAccount(
	ctx context.Context,
	userID int,
) error {
	_, err := h.db.Exec(
		ctx,
		`
		UPDATE public.users

		SET
			account_status = 'active',
			failed_login_attempts = 0,
			locked_until = NULL,
			updated_at = CURRENT_TIMESTAMP

		WHERE
			id = $1
			AND account_status = 'locked'
			AND locked_until IS NOT NULL
			AND locked_until <= CURRENT_TIMESTAMP
		`,
		userID,
	)

	return err
}

/* ============================================================
   RECORD SUCCESSFUL LOGIN
============================================================ */

func (h *AuthHandler) recordSuccessfulLogin(
	ctx context.Context,
	userID int,
	ipAddress string,
	userAgent string,
) error {
	_, err := h.db.Exec(
		ctx,
		`
		UPDATE public.users

		SET
			failed_login_attempts = 0,
			locked_until = NULL,
			account_status = 'active',
			last_login_at = CURRENT_TIMESTAMP,
			last_login_ip = NULLIF($2, '')::inet,
			last_login_user_agent = NULLIF($3, ''),
			updated_at = CURRENT_TIMESTAMP

		WHERE id = $1
		`,
		userID,
		strings.TrimSpace(ipAddress),
		strings.TrimSpace(userAgent),
	)

	return err
}

/* ============================================================
   AUTH SECURITY AUDIT
============================================================ */

func (h *AuthHandler) writeAuthAudit(
	ctx context.Context,
	c *gin.Context,
	userID *int,
	employeeID string,
	username string,
	action string,
	success bool,
	failureReason string,
) {
	var dbUserID any

	if userID != nil {
		dbUserID = *userID
	}

	_, err := h.db.Exec(
		ctx,
		`
		INSERT INTO public.auth_audit_logs (
			user_id,
			employee_id_snapshot,
			username_snapshot,
			action,
			module,
			ip_address,
			user_agent,
			success,
			failure_reason
		)
		VALUES (
			$1,
			NULLIF($2, ''),
			NULLIF($3, ''),
			$4,
			'authentication',
			NULLIF($5, '')::inet,
			NULLIF($6, ''),
			$7,
			NULLIF($8, '')
		)
		`,
		dbUserID,
		strings.TrimSpace(employeeID),
		strings.TrimSpace(username),
		action,
		strings.TrimSpace(c.ClientIP()),
		strings.TrimSpace(c.Request.UserAgent()),
		success,
		strings.TrimSpace(failureReason),
	)
	if err != nil {
		log.Printf(
			"auth audit write failed: %v",
			err,
		)
	}
}

/* ============================================================
   CREATE ACCESS TOKEN
============================================================ */

func (h *AuthHandler) makeToken(
	userID int,
	employeeID string,
	username string,
	userType int,
	roleCode string,
	duration time.Duration,
) (string, error) {
	now := time.Now()

	claims := &middleware.Claims{
		UserID:     userID,
		EmployeeID: strings.TrimSpace(employeeID),
		Username:   strings.TrimSpace(username),
		UserType:   userType,
		RoleCode:   strings.TrimSpace(roleCode),

		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(
				now.Add(duration),
			),
			IssuedAt: jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(
				now,
			),
			Issuer: "itm-api",
		},
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	return token.SignedString(
		[]byte(h.cfg.JWTSecret),
	)
}

/* ============================================================
   BEARER TOKEN PARSER
============================================================ */

func bearerToken(
	authorizationHeader string,
) (string, bool) {
	parts := strings.Fields(
		strings.TrimSpace(
			authorizationHeader,
		),
	)

	if len(parts) != 2 {
		return "", false
	}

	if !strings.EqualFold(
		parts[0],
		"Bearer",
	) {
		return "", false
	}

	token := strings.TrimSpace(
		parts[1],
	)

	if token == "" {
		return "", false
	}

	return token, true
}

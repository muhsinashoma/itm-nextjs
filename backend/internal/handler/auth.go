
// backend/internal/handler/auth.go
package handler

import (
	"context"
	"log"
	"net/http"
	"time"

	"itm-api/internal/config"
	"itm-api/internal/middleware"
	"itm-api/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewAuthHandler(db *pgxpool.Pool, cfg *config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Println("LOGIN DEBUG bind error:", err)
		response.BadRequest(c, "username and password required")
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var id int
	var empID, username, fullName, hash string
	var userType int
	var active bool

	err := h.db.QueryRow(ctx,
		`SELECT id, employee_id, username, full_name, password_hash, user_type, active
		 FROM users
		 WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)
		 LIMIT 1`, req.Username).
		Scan(&id, &empID, &username, &fullName, &hash, &userType, &active)

	if err != nil {
		log.Println("LOGIN DEBUG query/scan error:", err)
		response.BadRequest(c, "invalid credentials")
		return
	}

	log.Println("LOGIN DEBUG id:", id)
	log.Println("LOGIN DEBUG username:", username)
	log.Println("LOGIN DEBUG active:", active)
	log.Println("LOGIN DEBUG userType:", userType)
	log.Println("LOGIN DEBUG hash length:", len(hash))
	log.Println("LOGIN DEBUG hash:", hash)
	log.Println("LOGIN DEBUG password:", req.Password)

	if !active {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "account inactive"})
		return
	}

	bcryptErr := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password))
	log.Println("LOGIN DEBUG bcrypt error:", bcryptErr)

	if bcryptErr != nil {
		response.BadRequest(c, "invalid credentials")
		return
	}

	token, err := h.makeToken(id, empID, username, userType, 8*time.Hour)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	_, _ = h.db.Exec(ctx,
		`INSERT INTO login_logs (user_id, ip_address) VALUES ($1, $2::inet)`,
		empID,
		c.ClientIP(),
	)

	response.OK(c, gin.H{
		"token":       token,
		"expires_in":  28800,
		"user_id":     id,
		"employee_id": empID,
		"username":    username,
		"full_name":   fullName,
		"user_type":   userType,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	h2 := c.GetHeader("Authorization")

	if len(h2) < 8 {
		response.BadRequest(c, "missing token")
		return
	}

	claims := &middleware.Claims{}
	p := jwt.NewParser(jwt.WithoutClaimsValidation())

	if _, err := p.ParseWithClaims(h2[7:], claims, func(t *jwt.Token) (any, error) {
		return []byte(h.cfg.JWTSecret), nil
	}); err != nil {
		response.BadRequest(c, "invalid token")
		return
	}

	tok, err := h.makeToken(
		claims.UserID,
		claims.EmployeeID,
		claims.Username,
		claims.UserType,
		8*time.Hour,
	)
	if err != nil {
		response.ServerError(c, err)
		return
	}

	response.OK(c, gin.H{"token": tok, "expires_in": 28800})
}

func (h *AuthHandler) makeToken(uid int, empID, username string, role int, dur time.Duration) (string, error) {
	claims := &middleware.Claims{
		UserID:     uid,
		EmployeeID: empID,
		Username:   username,
		UserType:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(dur)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(h.cfg.JWTSecret))
}
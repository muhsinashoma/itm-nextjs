//backend/internal/middleware/permission.go

package middleware

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

const permissionCheckTimeout = 5 * time.Second

// RequirePermission checks the currently authenticated user's permission
// through:
//
// users
//   -> auth_user_roles
//   -> auth_roles
//   -> auth_role_permissions
//   -> auth_permissions
//
// This is database-backed so permission changes take effect immediately.
func RequirePermission(
	db *pgxpool.Pool,
	permissionCode string,
) gin.HandlerFunc {
	permissionCode = strings.TrimSpace(permissionCode)

	return func(c *gin.Context) {
		if db == nil || permissionCode == "" {
			c.AbortWithStatusJSON(
				http.StatusInternalServerError,
				gin.H{
					"success": false,
					"error":   "authorization configuration error",
				},
			)
			return
		}

		userID, ok := GetCurrentUserID(c)
		if !ok {
			c.AbortWithStatusJSON(
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
			permissionCheckTimeout,
		)
		defer cancel()

		var allowed bool

		err := db.QueryRow(
			ctx,
			`
			SELECT EXISTS (
				SELECT 1

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

				JOIN public.auth_role_permissions AS rp
					ON rp.role_id = r.id

				JOIN public.auth_permissions AS p
					ON p.id = rp.permission_id
					AND p.active = TRUE

				WHERE
					u.id = $1
					AND u.deleted_at IS NULL
					AND u.active = TRUE
					AND u.account_status = 'active'
					AND p.code = $2
			)
			`,
			userID,
			permissionCode,
		).Scan(&allowed)

		if err != nil {
			log.Printf(
				"permission check failed: user_id=%d permission=%s error=%v",
				userID,
				permissionCode,
				err,
			)

			c.AbortWithStatusJSON(
				http.StatusInternalServerError,
				gin.H{
					"success": false,
					"error":   "authorization check failed",
				},
			)
			return
		}

		if !allowed {
			c.AbortWithStatusJSON(
				http.StatusForbidden,
				gin.H{
					"success": false,
					"error":   "permission denied",
				},
			)
			return
		}

		c.Set(
			"required_permission",
			permissionCode,
		)

		c.Next()
	}
}

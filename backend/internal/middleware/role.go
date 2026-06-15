package middleware

import "github.com/gin-gonic/gin"

func RequireRoles(roles ...int) gin.HandlerFunc {
	allowed := map[int]bool{}

	for _, role := range roles {
		allowed[role] = true
	}

	return func(c *gin.Context) {
		userType := c.GetInt("user_type")

		if !allowed[userType] {
			c.AbortWithStatusJSON(403, gin.H{
				"success": false,
				"error":   "permission denied",
			})
			return
		}

		c.Next()
	}
}
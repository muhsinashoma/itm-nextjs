package response

import (
	"fmt"
	"net/http"
	"github.com/gin-gonic/gin"
)

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}
func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": data})
}
func Paginated(c *gin.Context, data any, total, page, pageSize int) {
	c.Header("X-Total-Count", fmt.Sprintf("%d", total))
	c.Header("X-Page", fmt.Sprintf("%d", page))
	c.Header("X-Page-Size", fmt.Sprintf("%d", pageSize))
	c.JSON(http.StatusOK, gin.H{
		"success": true, "data": data,
		"total": total, "page": page, "page_size": pageSize,
	})
}
func BadRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": msg})
}
func NotFound(c *gin.Context, msg string) {
	c.JSON(http.StatusNotFound, gin.H{"success": false, "error": msg})
}
func ServerError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
}
func NoContent(c *gin.Context) { c.Status(http.StatusNoContent) }

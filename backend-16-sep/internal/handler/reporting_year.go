package handler

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	minReportingYear = 2000
	maxReportingYear = 2100
)

func optionalReportingYear(
	c *gin.Context,
) (int, bool, error) {
	raw := strings.TrimSpace(
		c.Query("year"),
	)

	if raw == "" {
		return 0, false, nil
	}

	year, err := strconv.Atoi(raw)
	if err != nil ||
		year < minReportingYear ||
		year > maxReportingYear {
		return 0, false, fmt.Errorf(
			"year must be between %d and %d",
			minReportingYear,
			maxReportingYear,
		)
	}

	return year, true, nil
}

func reportingYearOrCurrent(
	c *gin.Context,
) (int, error) {
	year, provided, err :=
		optionalReportingYear(c)
	if err != nil {
		return 0, err
	}

	if provided {
		return year, nil
	}

	return time.Now().In(
		time.FixedZone("Asia/Dhaka", 6*60*60),
	).Year(), nil
}

func reportingYearBounds(
	year int,
) (string, string) {
	return fmt.Sprintf(
			"%04d-01-01",
			year,
		),
		fmt.Sprintf(
			"%04d-01-01",
			year+1,
		)
}

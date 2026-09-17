package main

import (
	"flag"
	"fmt"
	"log"
	"sort"
	"strings"

	"github.com/xuri/excelize/v2"
)

type target struct {
	EmployeeID string
	Username   string
}

type rowInfo struct {
	Row        int
	Username   string
	EmployeeID string
	FullName   string
	Email      string
	Mobile     string
	UserType   string
	Active     string
	Status     string
	EditDate   string
	EditBy     string
	Date       string
	Password   string
}

var targets = []target{
	{EmployeeID: "02-2069", Username: "rabbani"},
	{EmployeeID: "02-2732", Username: "mdjahid.hasan"},
	{EmployeeID: "02-2730", Username: "minhazul"},
	{EmployeeID: "02-2666", Username: "mijanur"},
}

func main() {
	var filePath string
	var sheetName string

	flag.StringVar(&filePath, "file", "", "path to legacy Excel workbook")
	flag.StringVar(&sheetName, "sheet", "tbl_user_info", "Excel sheet name")
	flag.Parse()

	if strings.TrimSpace(filePath) == "" {
		log.Fatal("--file is required")
	}

	workbook, err := excelize.OpenFile(filePath)
	if err != nil {
		log.Fatalf("open Excel: %v", err)
	}
	defer func() { _ = workbook.Close() }()

	rows, err := workbook.GetRows(sheetName)
	if err != nil {
		log.Fatalf("read sheet %q: %v", sheetName, err)
	}

	if len(rows) < 2 {
		log.Fatal("Excel sheet has no data rows")
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

	for _, name := range required {
		if _, ok := headers[name]; !ok {
			log.Fatalf("required Excel column %q not found", name)
		}
	}

	groups := make(map[string][]rowInfo)

	for i := 1; i < len(rows); i++ {
		row := rows[i]

		employeeID := strings.TrimSpace(cell(row, headers, "employee_id"))
		username := strings.TrimSpace(cell(row, headers, "user_name"))

		if !isTarget(employeeID, username) {
			continue
		}

		info := rowInfo{
			Row:        i + 1,
			Username:   username,
			EmployeeID: employeeID,
			FullName: strings.TrimSpace(firstNonEmpty(
				cell(row, headers, "full_name"),
				cell(row, headers, "employee_name"),
			)),
			Email:    strings.TrimSpace(cell(row, headers, "email")),
			Mobile:   strings.TrimSpace(cell(row, headers, "mobile")),
			UserType: strings.TrimSpace(cell(row, headers, "user_type")),
			Active:   strings.TrimSpace(cell(row, headers, "active")),
			Status:   strings.TrimSpace(cell(row, headers, "status")),
			EditDate: strings.TrimSpace(cell(row, headers, "edit_date")),
			EditBy:   strings.TrimSpace(cell(row, headers, "edit_by")),
			Date:     strings.TrimSpace(cell(row, headers, "date")),
			Password: cell(row, headers, "password"), // never printed
		}

		groups[normalize(employeeID)] = append(groups[normalize(employeeID)], info)
	}

	fmt.Println("============================================================")
	fmt.Println("DUPLICATE USER SOURCE INSPECTION")
	fmt.Println("============================================================")
	fmt.Println("Passwords are NOT printed.")
	fmt.Println("password_group only shows whether duplicated rows share the same password.")
	fmt.Println("No database writes are performed.")
	fmt.Println("============================================================")

	for _, t := range targets {
		group := groups[normalize(t.EmployeeID)]
		sort.Slice(group, func(i, j int) bool { return group[i].Row < group[j].Row })

		fmt.Println()
		fmt.Printf("Employee: %s  Username: %s  Rows found: %d\n", t.EmployeeID, t.Username, len(group))
		fmt.Println(strings.Repeat("-", 60))

		passwordGroups := make([]string, 0)
		passwordLabelByValue := make(map[string]string)

		for _, r := range group {
			label, ok := passwordLabelByValue[r.Password]
			if !ok {
				label = fmt.Sprintf("P%d", len(passwordGroups)+1)
				passwordGroups = append(passwordGroups, r.Password)
				passwordLabelByValue[r.Password] = label
			}

			fmt.Printf("row=%d\n", r.Row)
			fmt.Printf("  full_name      : %q\n", r.FullName)
			fmt.Printf("  email          : %q\n", r.Email)
			fmt.Printf("  mobile         : %q\n", r.Mobile)
			fmt.Printf("  user_type      : %q\n", r.UserType)
			fmt.Printf("  active         : %q\n", r.Active)
			fmt.Printf("  status         : %q\n", r.Status)
			fmt.Printf("  edit_date      : %q\n", r.EditDate)
			fmt.Printf("  edit_by        : %q\n", r.EditBy)
			fmt.Printf("  date           : %q\n", r.Date)
			fmt.Printf("  password_group : %s\n", label)
		}

		fmt.Printf("Distinct password versions: %d\n", len(passwordGroups))
	}

	fmt.Println()
	fmt.Println("============================================================")
	fmt.Println("INSPECTION COMPLETE")
	fmt.Println("============================================================")
}

func isTarget(employeeID, username string) bool {
	for _, t := range targets {
		if strings.EqualFold(strings.TrimSpace(employeeID), t.EmployeeID) &&
			strings.EqualFold(strings.TrimSpace(username), t.Username) {
			return true
		}
	}
	return false
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

package mailqueue

import (
	"bytes"
	"fmt"
	"html/template"
	"strings"
)

type AssignmentTemplateData struct {
	EventLabel       string
	TTNo             string
	QueryType        string
	IssueDescription string
	RequesterName    string
	RequesterID      string
	Department       string
	Mobile           string
	AssignedName     string
	AssignedID       string
	AssignedByName   string
	AssignedByID     string
	AssignmentNote   string
	ActionURL        string
}

type ClosedTemplateData struct {
	TTNo               string
	QueryType          string
	IssueDescription   string
	RequesterName      string
	RequesterID        string
	Department         string
	AssignedName       string
	AssignedID         string
	ClosedByName       string
	ClosedByID         string
	ClosingDescription string
	ClosedAt           string
	ActionURL          string
}

func AssignmentSubject(ttNo string, reassigned bool) string {
	if reassigned {
		return fmt.Sprintf("[ITM] TT %s reassigned to you", strings.TrimSpace(ttNo))
	}
	return fmt.Sprintf("[ITM] TT %s assigned to you", strings.TrimSpace(ttNo))
}

func ClosedSubject(ttNo string) string {
	return fmt.Sprintf("[ITM] TT %s has been closed", strings.TrimSpace(ttNo))
}

func RenderAssignmentEmail(data AssignmentTemplateData) (string, error) {
	return executeTemplate(assignmentTemplate, data)
}

func RenderClosedEmail(data ClosedTemplateData) (string, error) {
	return executeTemplate(closedTemplate, data)
}

func executeTemplate(t *template.Template, data any) (string, error) {
	var buffer bytes.Buffer
	if err := t.Execute(&buffer, data); err != nil {
		return "", err
	}
	return buffer.String(), nil
}

var assignmentTemplate = template.Must(template.New("tt-assignment-email").Parse(`<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="680" cellspacing="0" cellpadding="0" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #dfe6ee;border-radius:14px;overflow:hidden;">
<tr><td style="padding:22px 26px;background:#0f4c81;color:#ffffff;">
<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.82;">ITM Service Desk</div>
<div style="font-size:22px;font-weight:700;margin-top:6px;">{{.EventLabel}}</div>
<div style="font-size:13px;margin-top:6px;opacity:.9;">Trouble Ticket {{.TTNo}}</div>
</td></tr>
<tr><td style="padding:24px 26px;">
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;">Dear {{.AssignedName}},</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;">A Trouble Ticket has been {{if eq .EventLabel "Trouble Ticket Reassigned"}}reassigned{{else}}assigned{{end}} to you for action. Please review the ticket information below.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e4e9ef;border-radius:10px;overflow:hidden;">
<tr><td style="padding:10px 12px;background:#f8fafc;width:34%;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">TT No.</td><td style="padding:10px 12px;font-size:13px;font-weight:700;border-bottom:1px solid #e4e9ef;">{{.TTNo}}</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">Query Type</td><td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e4e9ef;">{{.QueryType}}</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">Requester</td><td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e4e9ef;">{{.RequesterName}} ({{.RequesterID}})</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">Department</td><td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e4e9ef;">{{.Department}}</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">Contact</td><td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e4e9ef;">{{.Mobile}}</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">Assigned By</td><td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e4e9ef;">{{.AssignedByName}} ({{.AssignedByID}})</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;vertical-align:top;">Issue</td><td style="padding:10px 12px;font-size:13px;line-height:1.55;white-space:pre-wrap;">{{.IssueDescription}}</td></tr>
</table>
{{if .AssignmentNote}}<div style="margin-top:16px;padding:12px 14px;border-left:4px solid #f59e0b;background:#fffbeb;border-radius:6px;font-size:13px;line-height:1.5;"><strong>Assignment note:</strong><br>{{.AssignmentNote}}</div>{{end}}
{{if .ActionURL}}<div style="margin-top:22px;"><a href="{{.ActionURL}}" style="display:inline-block;background:#0f4c81;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:11px 18px;border-radius:8px;">Open ITM Dashboard</a></div>{{end}}
<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#667085;">This is a system-generated notification from ITM. Please do not share ticket information outside the authorized support workflow.</p>
</td></tr>
<tr><td style="padding:15px 26px;background:#f8fafc;border-top:1px solid #e4e9ef;font-size:11px;color:#667085;">Fiber@Home Limited · ITM Service Desk</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`))

var closedTemplate = template.Must(template.New("tt-closed-email").Parse(`<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="680" cellspacing="0" cellpadding="0" style="max-width:680px;width:100%;background:#ffffff;border:1px solid #dfe6ee;border-radius:14px;overflow:hidden;">
<tr><td style="padding:22px 26px;background:#047857;color:#ffffff;">
<div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.82;">ITM Service Desk</div>
<div style="font-size:22px;font-weight:700;margin-top:6px;">Trouble Ticket Closed</div>
<div style="font-size:13px;margin-top:6px;opacity:.9;">Trouble Ticket {{.TTNo}}</div>
</td></tr>
<tr><td style="padding:24px 26px;">
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;">Dear {{.RequesterName}},</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;">Your Trouble Ticket has been closed by the IT team. The recorded resolution is shown below for your reference.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e4e9ef;border-radius:10px;overflow:hidden;">
<tr><td style="padding:10px 12px;background:#f8fafc;width:34%;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">TT No.</td><td style="padding:10px 12px;font-size:13px;font-weight:700;border-bottom:1px solid #e4e9ef;">{{.TTNo}}</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">Query Type</td><td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e4e9ef;">{{.QueryType}}</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">Assigned To</td><td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e4e9ef;">{{.AssignedName}} {{if .AssignedID}}({{.AssignedID}}){{end}}</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">Closed By</td><td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e4e9ef;">{{.ClosedByName}} ({{.ClosedByID}})</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;border-bottom:1px solid #e4e9ef;">Closed At</td><td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #e4e9ef;">{{.ClosedAt}}</td></tr>
<tr><td style="padding:10px 12px;background:#f8fafc;font-size:12px;color:#667085;vertical-align:top;">Original Issue</td><td style="padding:10px 12px;font-size:13px;line-height:1.55;white-space:pre-wrap;">{{.IssueDescription}}</td></tr>
</table>
<div style="margin-top:16px;padding:14px 16px;border-left:4px solid #10b981;background:#ecfdf5;border-radius:6px;font-size:13px;line-height:1.55;"><strong>Resolution / Closing Summary</strong><br>{{.ClosingDescription}}</div>
{{if .ActionURL}}<div style="margin-top:22px;"><a href="{{.ActionURL}}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:11px 18px;border-radius:8px;">Open My ITM Dashboard</a></div>{{end}}
<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#667085;">Thank you for using the ITM ticketing system. If the issue continues, please create a new Trouble Ticket with the relevant details.</p>
</td></tr>
<tr><td style="padding:15px 26px;background:#f8fafc;border-top:1px solid #e4e9ef;font-size:11px;color:#667085;">Fiber@Home Limited · ITM Service Desk · System-generated email</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`))

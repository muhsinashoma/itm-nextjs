package mailqueue

import (
	"bytes"
	"fmt"
	"html/template"
	"strings"
)

type AssignmentTemplateData struct {
	EventLabel           string
	Reassigned           bool
	TTNo                 string
	QueryType            string
	IssueDescription     string
	RequesterName        string
	RequesterID          string
	Department           string
	Mobile               string
	CreatedAt            string
	AssignedName         string
	AssignedID           string
	AssignedByName       string
	AssignedByID         string
	PreviousAssignedName string
	PreviousAssignedID   string
	AssignmentNote       string
	ActionURL            string
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
	ttNo = strings.TrimSpace(ttNo)
	if reassigned {
		return fmt.Sprintf("[ITM Service Desk] TT %s reassigned to you", ttNo)
	}
	return fmt.Sprintf("[ITM Service Desk] TT %s assigned to you", ttNo)
}

func ClosedSubject(ttNo string) string {
	return fmt.Sprintf("[ITM Service Desk] TT %s closed successfully", strings.TrimSpace(ttNo))
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
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{.EventLabel}}</title>
<style>
@media only screen and (max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:18px!important;padding-right:18px!important}.stack-cell{display:block!important;width:100%!important}.cta{display:block!important;text-align:center!important}}
</style>
</head>
<body style="margin:0;padding:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Trouble Ticket {{.TTNo}} has been {{if .Reassigned}}reassigned{{else}}assigned{{end}} to you for action.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3f6fa;">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" class="email-shell" width="680" cellspacing="0" cellpadding="0" border="0" style="width:680px;max-width:680px;background:#ffffff;border:1px solid #dce4ee;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.06);">
<tr><td style="padding:0;background:#0b4f83;height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
<tr><td class="email-pad" style="padding:24px 28px 20px;background:#ffffff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td valign="top">
<div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:#0b4f83;">ITM Service Desk</div>
<div style="margin-top:6px;font-size:24px;line-height:31px;font-weight:700;color:#172033;">{{.EventLabel}}</div>
<div style="margin-top:6px;font-size:13px;line-height:20px;color:#667085;">Trouble Ticket <strong style="color:#344054;">{{.TTNo}}</strong></div>
</td>
<td align="right" valign="top" style="padding-left:12px;">
<span style="display:inline-block;border-radius:999px;background:#eaf3fb;color:#0b4f83;padding:7px 11px;font-size:11px;font-weight:700;white-space:nowrap;">Action required</span>
</td>
</tr>
</table>
</td></tr>
<tr><td class="email-pad" style="padding:0 28px 26px;">
<p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#344054;">Dear <strong>{{.AssignedName}}</strong>,</p>
<p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#475467;">Trouble Ticket <strong>{{.TTNo}}</strong> has been {{if .Reassigned}}reassigned{{else}}assigned{{end}} to you. Please review the requester information and issue details below, then take the appropriate action in ITM.</p>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0;border:1px solid #e4e9ef;border-radius:12px;overflow:hidden;">
<tr>
<td class="stack-cell" width="50%" valign="top" style="padding:13px 14px;border-bottom:1px solid #e4e9ef;background:#f8fafc;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">TT Number</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#101828;font-weight:700;">{{.TTNo}}</div>
</td>
<td class="stack-cell" width="50%" valign="top" style="padding:13px 14px;border-bottom:1px solid #e4e9ef;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">Query Type</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#101828;font-weight:600;">{{.QueryType}}</div>
</td>
</tr>
<tr>
<td class="stack-cell" width="50%" valign="top" style="padding:13px 14px;border-bottom:1px solid #e4e9ef;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">Requester</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#101828;">{{.RequesterName}} <span style="color:#667085;">({{.RequesterID}})</span></div>
</td>
<td class="stack-cell" width="50%" valign="top" style="padding:13px 14px;border-bottom:1px solid #e4e9ef;background:#f8fafc;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">Department</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#101828;">{{.Department}}</div>
</td>
</tr>
<tr>
<td class="stack-cell" width="50%" valign="top" style="padding:13px 14px;{{if .Reassigned}}border-bottom:1px solid #e4e9ef;{{end}}background:#f8fafc;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">Requester Contact</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#101828;">{{.Mobile}}</div>
</td>
<td class="stack-cell" width="50%" valign="top" style="padding:13px 14px;{{if .Reassigned}}border-bottom:1px solid #e4e9ef;{{end}}">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">Assigned By</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#101828;">{{.AssignedByName}} <span style="color:#667085;">({{.AssignedByID}})</span></div>
</td>
</tr>
{{if .Reassigned}}
<tr>
<td colspan="2" valign="top" style="padding:13px 14px;background:#fff8eb;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#9a6700;font-weight:700;">Previous Assignee</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#5f4300;">{{.PreviousAssignedName}}{{if .PreviousAssignedID}} <span style="color:#8a6a1f;">({{.PreviousAssignedID}})</span>{{end}}</div>
</td>
</tr>
{{end}}
</table>

<div style="margin-top:16px;border:1px solid #dfe6ee;border-radius:12px;padding:15px 16px;background:#ffffff;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">Issue / Query Description</div>
<div style="margin-top:7px;font-size:13px;line-height:21px;color:#344054;white-space:pre-wrap;word-break:break-word;">{{.IssueDescription}}</div>
</div>

{{if .AssignmentNote}}
<div style="margin-top:14px;border-left:4px solid #d89b15;border-radius:8px;background:#fff9e8;padding:12px 14px;">
<div style="font-size:11px;line-height:16px;font-weight:700;color:#7a570f;">Assignment note</div>
<div style="margin-top:4px;font-size:13px;line-height:20px;color:#5f4300;white-space:pre-wrap;word-break:break-word;">{{.AssignmentNote}}</div>
</div>
{{end}}

{{if .CreatedAt}}<p style="margin:14px 0 0;font-size:11px;line-height:18px;color:#98a2b3;">Ticket created: {{.CreatedAt}}</p>{{end}}

{{if .ActionURL}}
<div style="margin-top:20px;">
<a class="cta" href="{{.ActionURL}}" style="display:inline-block;background:#0b4f83;color:#ffffff;text-decoration:none;font-size:13px;line-height:18px;font-weight:700;padding:11px 18px;border-radius:9px;">Open ITM Dashboard</a>
</div>
{{end}}

<p style="margin:22px 0 0;font-size:11px;line-height:18px;color:#98a2b3;">This email was sent only to the currently assigned IT personnel for this ticket. It is an automated ITM Service Desk notification.</p>
</td></tr>
<tr><td class="email-pad" style="padding:15px 28px;background:#f8fafc;border-top:1px solid #e4e9ef;font-size:11px;line-height:17px;color:#667085;">Fiber@Home Limited &nbsp;•&nbsp; ITM Service Desk</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`))

var closedTemplate = template.Must(template.New("tt-closed-email").Parse(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Trouble Ticket Closed</title>
<style>
@media only screen and (max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:18px!important;padding-right:18px!important}.stack-cell{display:block!important;width:100%!important}.cta{display:block!important;text-align:center!important}}
</style>
</head>
<body style="margin:0;padding:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your Trouble Ticket {{.TTNo}} has been closed successfully.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3f6fa;">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" class="email-shell" width="680" cellspacing="0" cellpadding="0" border="0" style="width:680px;max-width:680px;background:#ffffff;border:1px solid #dce4ee;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.06);">
<tr><td style="padding:0;background:#087443;height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
<tr><td class="email-pad" style="padding:24px 28px 12px;">
<div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:#087443;">ITM Service Desk</div>
<div style="margin-top:6px;font-size:24px;line-height:31px;font-weight:700;color:#172033;">Ticket closed successfully</div>
<div style="margin-top:6px;font-size:13px;line-height:20px;color:#667085;">Trouble Ticket <strong style="color:#344054;">{{.TTNo}}</strong></div>
</td></tr>
<tr><td class="email-pad" style="padding:8px 28px 26px;">
<div style="border-radius:12px;background:#ecfdf3;border:1px solid #b7ebca;padding:14px 16px;">
<div style="font-size:13px;line-height:20px;font-weight:700;color:#067647;">Resolved and closed</div>
<div style="margin-top:3px;font-size:13px;line-height:20px;color:#3f5f4c;">Dear {{.RequesterName}}, your Trouble Ticket has been successfully closed by the IT team.</div>
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;border-collapse:separate;border-spacing:0;border:1px solid #e4e9ef;border-radius:12px;overflow:hidden;">
<tr>
<td class="stack-cell" width="50%" valign="top" style="padding:13px 14px;border-bottom:1px solid #e4e9ef;background:#f8fafc;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">TT Number</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#101828;font-weight:700;">{{.TTNo}}</div>
</td>
<td class="stack-cell" width="50%" valign="top" style="padding:13px 14px;border-bottom:1px solid #e4e9ef;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">Query Type</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#101828;font-weight:600;">{{.QueryType}}</div>
</td>
</tr>
<tr>
<td class="stack-cell" width="50%" valign="top" style="padding:13px 14px;background:#f8fafc;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">Closed By</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#101828;">{{.ClosedByName}} <span style="color:#667085;">({{.ClosedByID}})</span></div>
</td>
<td class="stack-cell" width="50%" valign="top" style="padding:13px 14px;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#667085;font-weight:700;">Closed At</div>
<div style="margin-top:4px;font-size:13px;line-height:19px;color:#101828;">{{.ClosedAt}}</div>
</td>
</tr>
</table>

<div style="margin-top:16px;border-left:4px solid #12b76a;border-radius:9px;background:#f0fdf4;padding:13px 15px;">
<div style="font-size:11px;line-height:16px;font-weight:700;color:#067647;">Resolution / Closing summary</div>
<div style="margin-top:5px;font-size:13px;line-height:21px;color:#355847;white-space:pre-wrap;word-break:break-word;">{{.ClosingDescription}}</div>
</div>

<div style="margin-top:14px;border:1px solid #e4e9ef;border-radius:10px;padding:12px 14px;background:#ffffff;">
<div style="font-size:10px;line-height:15px;text-transform:uppercase;letter-spacing:.06em;color:#98a2b3;font-weight:700;">Original query</div>
<div style="margin-top:5px;font-size:12px;line-height:19px;color:#667085;white-space:pre-wrap;word-break:break-word;">{{.IssueDescription}}</div>
</div>

{{if .ActionURL}}
<div style="margin-top:20px;">
<a class="cta" href="{{.ActionURL}}" style="display:inline-block;background:#087443;color:#ffffff;text-decoration:none;font-size:13px;line-height:18px;font-weight:700;padding:11px 18px;border-radius:9px;">View My ITM Dashboard</a>
</div>
{{end}}

<p style="margin:22px 0 0;font-size:12px;line-height:19px;color:#667085;">Thank you for using the ITM Service Desk. If the same issue occurs again, please create a new Trouble Ticket and include any updated details.</p>
<p style="margin:10px 0 0;font-size:11px;line-height:18px;color:#98a2b3;">This is an automated confirmation sent to the ticket requester.</p>
</td></tr>
<tr><td class="email-pad" style="padding:15px 28px;background:#f8fafc;border-top:1px solid #e4e9ef;font-size:11px;line-height:17px;color:#667085;">Fiber@Home Limited &nbsp;•&nbsp; ITM Service Desk</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`))

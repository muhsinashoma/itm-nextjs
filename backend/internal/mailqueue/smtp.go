package mailqueue

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"mime"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"
)

func (s *Service) sendSMTP(ctx context.Context, item queueItem) error {
	recipients, err := normalizeRecipients(item.To, item.CC)
	if err != nil {
		return err
	}
	if len(recipients) == 0 {
		return fmt.Errorf("no valid email recipients")
	}

	address := net.JoinHostPort(s.cfg.Host, fmt.Sprintf("%d", s.cfg.Port))
	dialer := &net.Dialer{Timeout: s.cfg.SendTimeout}

	var (
		client  *smtp.Client
		rawConn net.Conn
	)

	switch s.cfg.TLSMode {
	case "implicit":
		tlsConn, err := tls.DialWithDialer(
			dialer,
			"tcp",
			address,
			&tls.Config{
				ServerName: s.cfg.Host,
				MinVersion: tls.VersionTLS12,
			},
		)
		if err != nil {
			return fmt.Errorf("SMTP TLS connection failed: %w", err)
		}

		rawConn = tlsConn
		client, err = smtp.NewClient(tlsConn, s.cfg.Host)
		if err != nil {
			_ = tlsConn.Close()
			return fmt.Errorf("SMTP client initialization failed: %w", err)
		}

	case "starttls", "none":
		conn, err := dialer.DialContext(ctx, "tcp", address)
		if err != nil {
			return fmt.Errorf("SMTP connection failed: %w", err)
		}

		rawConn = conn
		client, err = smtp.NewClient(conn, s.cfg.Host)
		if err != nil {
			_ = conn.Close()
			return fmt.Errorf("SMTP client initialization failed: %w", err)
		}

		if s.cfg.TLSMode == "starttls" {
			if err := client.StartTLS(&tls.Config{
				ServerName: s.cfg.Host,
				MinVersion: tls.VersionTLS12,
			}); err != nil {
				_ = client.Close()
				return fmt.Errorf("SMTP STARTTLS failed: %w", err)
			}
		}

	default:
		return fmt.Errorf("unsupported SMTP TLS mode %q", s.cfg.TLSMode)
	}

	defer client.Close()

	// Apply a hard deadline to all SMTP commands after the connection is open.
	// This keeps a stalled mail server from pinning the worker indefinitely.
	if deadline, ok := ctx.Deadline(); ok && rawConn != nil {
		_ = rawConn.SetDeadline(deadline)
	}

	if s.cfg.Username != "" {
		auth := smtp.PlainAuth("", s.cfg.Username, s.cfg.Password, s.cfg.Host)
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("SMTP authentication failed: %w", err)
		}
	}

	if err := client.Mail(s.cfg.FromAddress); err != nil {
		return fmt.Errorf("SMTP MAIL FROM failed: %w", err)
	}

	for _, recipient := range recipients {
		if err := client.Rcpt(recipient); err != nil {
			return fmt.Errorf("SMTP recipient rejected (%s): %w", recipient, err)
		}
	}

	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("SMTP DATA failed: %w", err)
	}

	message := buildMIMEMessage(s.cfg, item)
	if _, err := io.Copy(writer, bytes.NewReader(message)); err != nil {
		_ = writer.Close()
		return fmt.Errorf("SMTP message write failed: %w", err)
	}

	if err := writer.Close(); err != nil {
		return fmt.Errorf("SMTP message finalization failed: %w", err)
	}

	if err := client.Quit(); err != nil {
		return fmt.Errorf("SMTP QUIT failed: %w", err)
	}

	return nil
}

func normalizeRecipients(to, cc string) ([]string, error) {
	combined := []string{to, cc}
	seen := map[string]struct{}{}
	result := make([]string, 0, 4)

	for _, group := range combined {
		for _, raw := range strings.FieldsFunc(group, func(r rune) bool {
			return r == ',' || r == ';'
		}) {
			raw = strings.TrimSpace(raw)
			if raw == "" {
				continue
			}

			parsed, err := mail.ParseAddress(raw)
			if err != nil {
				return nil, fmt.Errorf("invalid recipient address %q: %w", raw, err)
			}

			normalized := strings.ToLower(strings.TrimSpace(parsed.Address))
			if normalized == "" {
				continue
			}
			if _, exists := seen[normalized]; exists {
				continue
			}

			seen[normalized] = struct{}{}
			result = append(result, parsed.Address)
		}
	}

	return result, nil
}

func buildMIMEMessage(cfg Config, item queueItem) []byte {
	var buffer bytes.Buffer

	subject := mime.QEncoding.Encode("UTF-8", item.Subject)
	fromName := mime.QEncoding.Encode("UTF-8", cfg.FromName)

	buffer.WriteString("Date: ")
	buffer.WriteString(time.Now().Format(time.RFC1123Z))
	buffer.WriteString("\r\n")

	buffer.WriteString("From: ")
	buffer.WriteString(fromName)
	buffer.WriteString(" <")
	buffer.WriteString(cfg.FromAddress)
	buffer.WriteString(">\r\n")

	buffer.WriteString("To: ")
	buffer.WriteString(item.To)
	buffer.WriteString("\r\n")

	if strings.TrimSpace(item.CC) != "" {
		buffer.WriteString("Cc: ")
		buffer.WriteString(item.CC)
		buffer.WriteString("\r\n")
	}

	buffer.WriteString("Subject: ")
	buffer.WriteString(subject)
	buffer.WriteString("\r\n")
	buffer.WriteString("MIME-Version: 1.0\r\n")
	buffer.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	buffer.WriteString("Content-Transfer-Encoding: 8bit\r\n")
	buffer.WriteString("Auto-Submitted: auto-generated\r\n")
	buffer.WriteString("X-Auto-Response-Suppress: All\r\n")
	buffer.WriteString("\r\n")
	buffer.WriteString(strings.ReplaceAll(item.HTMLBody, "\n", "\r\n"))

	return buffer.Bytes()
}

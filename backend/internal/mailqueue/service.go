package mailqueue

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Config controls the background SMTP outbox worker.
// SMTP credentials are intentionally loaded from environment-backed application
// configuration; they must never be hard-coded in source code.
type Config struct {
	Enabled      bool
	Host         string
	Port         int
	TLSMode      string
	Username     string
	Password     string
	FromAddress  string
	FromName     string
	AppPublicURL string
	PollInterval time.Duration
	MaxAttempts  int
	SendTimeout  time.Duration
	WorkerID     string
}

// Message is the durable email-outbox payload written by a business transaction.
type Message struct {
	To              string
	ToName          string
	CC              string
	Subject         string
	HTMLBody        string
	SessionUser     string
	SessionIP       string
	EventType       string
	EntityType      string
	EntityID        *int64
	EntityReference string
	DedupeKey       string
}

type Service struct {
	db  *pgxpool.Pool
	cfg Config
}

type queueItem struct {
	ID              int64
	To              string
	ToName          string
	CC              string
	Subject         string
	HTMLBody        string
	Attempts        int
	EventType       string
	EntityType      string
	EntityID        *int64
	EntityReference string
}

func New(db *pgxpool.Pool, cfg Config) (*Service, error) {
	if db == nil {
		return nil, errors.New("mailqueue: database pool is required")
	}

	cfg.Host = strings.TrimSpace(cfg.Host)
	cfg.TLSMode = strings.ToLower(strings.TrimSpace(cfg.TLSMode))
	cfg.Username = strings.TrimSpace(cfg.Username)
	cfg.FromAddress = strings.TrimSpace(cfg.FromAddress)
	cfg.FromName = strings.TrimSpace(cfg.FromName)
	cfg.AppPublicURL = strings.TrimRight(strings.TrimSpace(cfg.AppPublicURL), "/")

	if cfg.Port <= 0 {
		cfg.Port = 465
	}
	if cfg.TLSMode == "" {
		cfg.TLSMode = "implicit"
	}
	if cfg.FromName == "" {
		cfg.FromName = "ITM Service Desk"
	}
	if cfg.FromAddress == "" {
		cfg.FromAddress = cfg.Username
	}
	if cfg.PollInterval <= 0 {
		cfg.PollInterval = 2 * time.Second
	}
	if cfg.MaxAttempts <= 0 {
		cfg.MaxAttempts = 5
	}
	if cfg.SendTimeout <= 0 {
		cfg.SendTimeout = 20 * time.Second
	}
	if cfg.WorkerID == "" {
		host, _ := os.Hostname()
		cfg.WorkerID = fmt.Sprintf("%s-%d", host, os.Getpid())
	}

	if cfg.Enabled {
		if cfg.Host == "" {
			return nil, errors.New("mailqueue: SMTP host is required when mail is enabled")
		}
		if cfg.Username == "" {
			return nil, errors.New("mailqueue: SMTP username is required when mail is enabled")
		}
		if cfg.Password == "" {
			return nil, errors.New("mailqueue: SMTP password is required when mail is enabled")
		}
		if cfg.FromAddress == "" {
			return nil, errors.New("mailqueue: SMTP from address is required when mail is enabled")
		}
		switch cfg.TLSMode {
		case "implicit", "starttls", "none":
		default:
			return nil, fmt.Errorf("mailqueue: unsupported SMTP TLS mode %q", cfg.TLSMode)
		}
	}

	return &Service{db: db, cfg: cfg}, nil
}

func (s *Service) Enabled() bool {
	return s != nil && s.cfg.Enabled
}

func (s *Service) AppPublicURL() string {
	if s == nil {
		return ""
	}
	return s.cfg.AppPublicURL
}

// Run processes queued email records in the background. Core TT assignment and
// close requests therefore never wait for SMTP network latency.
func (s *Service) Run(ctx context.Context) {
	if !s.Enabled() {
		return
	}

	log.Printf("✉️  ITM mail worker started (host=%s port=%d tls=%s)", s.cfg.Host, s.cfg.Port, s.cfg.TLSMode)

	// Process immediately once, then on the configured interval.
	s.processAvailable(ctx)

	ticker := time.NewTicker(s.cfg.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("✉️  ITM mail worker stopped")
			return
		case <-ticker.C:
			s.processAvailable(ctx)
		}
	}
}

func (s *Service) processAvailable(ctx context.Context) {
	for processed := 0; processed < 10; processed++ {
		item, ok, err := s.claimOne(ctx)
		if err != nil {
			if !errors.Is(err, context.Canceled) {
				log.Printf("mail worker claim error: %v", err)
			}
			return
		}
		if !ok {
			return
		}

		sendCtx, cancel := context.WithTimeout(ctx, s.cfg.SendTimeout)
		err = s.sendSMTP(sendCtx, item)
		cancel()

		if err == nil {
			if markErr := s.markSuccess(ctx, item.ID); markErr != nil {
				log.Printf("mail worker mark-success error (id=%d): %v", item.ID, markErr)
			}
			continue
		}

		if markErr := s.markFailure(ctx, item, err); markErr != nil {
			log.Printf("mail worker mark-failure error (id=%d): %v", item.ID, markErr)
		}
	}
}

func (s *Service) claimOne(ctx context.Context) (queueItem, bool, error) {
	var item queueItem

	row := s.db.QueryRow(
		ctx,
		`
        WITH candidate AS (
            SELECT id
            FROM public.tbl_emails
            WHERE (
                    (
                        mail_status IN ('queued', 'retry')
                        AND COALESCE(next_attempt_at, CURRENT_TIMESTAMP) <= CURRENT_TIMESTAMP
                    )
                    OR (
                        mail_status = 'sending'
                        AND locked_at <= CURRENT_TIMESTAMP - INTERVAL '10 minutes'
                    )
                  )
              AND COALESCE(attempts, 0) < $1
              AND COALESCE(event_type, '') IN ('TT_ASSIGNED', 'TT_REASSIGNED', 'TT_CLOSED')
            ORDER BY created_at ASC, id ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        )
        UPDATE public.tbl_emails AS mail
        SET
            mail_status = 'sending',
            attempts = COALESCE(mail.attempts, 0) + 1,
            locked_at = CURRENT_TIMESTAMP,
            locked_by = $2,
            updated_at = CURRENT_TIMESTAMP
        FROM candidate
        WHERE mail.id = candidate.id
        RETURNING
            mail.id,
            COALESCE(mail."to", ''),
            COALESCE(mail.to_name, ''),
            COALESCE(mail.cc, ''),
            COALESCE(mail.subject, ''),
            COALESCE(mail.body, ''),
            COALESCE(mail.attempts, 0),
            COALESCE(mail.event_type, ''),
            COALESCE(mail.entity_type, ''),
            mail.entity_id,
            COALESCE(mail.entity_reference, '')
        `,
		s.cfg.MaxAttempts,
		s.cfg.WorkerID,
	)

	err := row.Scan(
		&item.ID,
		&item.To,
		&item.ToName,
		&item.CC,
		&item.Subject,
		&item.HTMLBody,
		&item.Attempts,
		&item.EventType,
		&item.EntityType,
		&item.EntityID,
		&item.EntityReference,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return queueItem{}, false, nil
	}
	if err != nil {
		return queueItem{}, false, err
	}

	return item, true, nil
}

func (s *Service) markSuccess(ctx context.Context, id int64) error {
	_, err := s.db.Exec(
		ctx,
		`
        UPDATE public.tbl_emails
        SET
            "from" = $2,
            from_name = $3,
            mail_status = 'success',
            sent_at = CURRENT_TIMESTAMP,
            last_error = '',
            locked_at = NULL,
            locked_by = '',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
		id,
		s.cfg.FromAddress,
		s.cfg.FromName,
	)
	return err
}

func (s *Service) markFailure(ctx context.Context, item queueItem, sendErr error) error {
	nextStatus := "retry"
	if item.Attempts >= s.cfg.MaxAttempts {
		nextStatus = "dead"
	}

	delay := retryDelay(item.Attempts)
	message := strings.TrimSpace(sendErr.Error())
	if len(message) > 2000 {
		message = message[:2000]
	}

	_, err := s.db.Exec(
		ctx,
		`
        UPDATE public.tbl_emails
        SET
            "from" = $2,
            from_name = $3,
            mail_status = $4,
            next_attempt_at = CURRENT_TIMESTAMP + ($5::text || ' seconds')::interval,
            last_error = $6,
            locked_at = NULL,
            locked_by = '',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
		item.ID,
		s.cfg.FromAddress,
		s.cfg.FromName,
		nextStatus,
		strconv.Itoa(int(delay.Seconds())),
		message,
	)
	return err
}

func retryDelay(attempt int) time.Duration {
	switch {
	case attempt <= 1:
		return 30 * time.Second
	case attempt == 2:
		return 2 * time.Minute
	case attempt == 3:
		return 10 * time.Minute
	default:
		return 30 * time.Minute
	}
}

// EnqueueTx adds an email to the durable outbox inside the caller's transaction.
// A dedupe key guarantees a business event cannot enqueue the same email twice.
func EnqueueTx(ctx context.Context, tx pgx.Tx, message Message) (int64, string, error) {
	if tx == nil {
		return 0, "", errors.New("mailqueue: transaction is required")
	}

	message.To = strings.TrimSpace(message.To)
	message.ToName = strings.TrimSpace(message.ToName)
	message.CC = strings.TrimSpace(message.CC)
	message.Subject = strings.TrimSpace(message.Subject)
	message.EventType = strings.TrimSpace(message.EventType)
	message.EntityType = strings.TrimSpace(message.EntityType)
	message.EntityReference = strings.TrimSpace(message.EntityReference)
	message.DedupeKey = strings.TrimSpace(message.DedupeKey)
	message.SessionUser = strings.TrimSpace(message.SessionUser)
	message.SessionIP = strings.TrimSpace(message.SessionIP)

	status := "queued"
	lastError := ""
	if message.To == "" {
		status = "skipped"
		lastError = "recipient email is not available"
	}

	var id int64
	err := tx.QueryRow(
		ctx,
		`
        INSERT INTO public.tbl_emails (
            "from",
            from_name,
            "to",
            to_name,
            cc,
            subject,
            body,
            mail_status,
            "session_user",
            session_ip,
            event_type,
            entity_type,
            entity_id,
            entity_reference,
            dedupe_key,
            attempts,
            next_attempt_at,
            last_error,
            updated_at
        )
        VALUES (
            '',
            'ITM Service Desk',
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            NULLIF($13, ''),
            0,
            CURRENT_TIMESTAMP,
            $14,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (dedupe_key)
        WHERE dedupe_key IS NOT NULL
        DO UPDATE SET
            updated_at = public.tbl_emails.updated_at
        RETURNING id
        `,
		message.To,
		message.ToName,
		message.CC,
		message.Subject,
		message.HTMLBody,
		status,
		message.SessionUser,
		message.SessionIP,
		message.EventType,
		message.EntityType,
		message.EntityID,
		message.EntityReference,
		message.DedupeKey,
		lastError,
	).Scan(&id)

	if err != nil {
		return 0, "", err
	}

	return id, status, nil
}

// AppURL builds an absolute link from APP_PUBLIC_URL without exposing SMTP
// configuration to request handlers.
func AppURL(path string) string {
	base := strings.TrimRight(strings.TrimSpace(os.Getenv("APP_PUBLIC_URL")), "/")
	path = "/" + strings.TrimLeft(strings.TrimSpace(path), "/")
	if base == "" {
		return ""
	}
	return base + path
}

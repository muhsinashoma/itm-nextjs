// backend/internal/config/config.go
package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	Env         string
	DatabaseURL string
	JWTSecret   string
	AllowOrigin string

	MailEnabled            bool
	SMTPHost               string
	SMTPPort               int
	SMTPTLSMode            string
	SMTPUsername           string
	SMTPPassword           string
	SMTPFromAddress        string
	SMTPFromName           string
	AppPublicURL           string
	MailWorkerPollSeconds  int
	MailMaxAttempts        int
	MailSendTimeoutSeconds int
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		Port:        getenv("PORT", "8080"),
		Env:         getenv("ENV", "development"),
		DatabaseURL: mustenv("DATABASE_URL"),
		JWTSecret:   mustenv("JWT_SECRET"),
		AllowOrigin: getenv("ALLOW_ORIGIN", "http://localhost:3000"),

		MailEnabled:            getenvBool("MAIL_ENABLED", false),
		SMTPHost:               getenv("SMTP_HOST", ""),
		SMTPPort:               getenvInt("SMTP_PORT", 465),
		SMTPTLSMode:            getenv("SMTP_TLS_MODE", "implicit"),
		SMTPUsername:           getenv("SMTP_USERNAME", ""),
		SMTPPassword:           getenv("SMTP_PASSWORD", ""),
		SMTPFromAddress:        getenv("SMTP_FROM_ADDRESS", ""),
		SMTPFromName:           getenv("SMTP_FROM_NAME", "ITM Service Desk"),
		AppPublicURL:           getenv("APP_PUBLIC_URL", "http://localhost:5173"),
		MailWorkerPollSeconds:  getenvInt("MAIL_WORKER_POLL_SECONDS", 2),
		MailMaxAttempts:        getenvInt("MAIL_MAX_ATTEMPTS", 5),
		MailSendTimeoutSeconds: getenvInt("MAIL_SEND_TIMEOUT_SECONDS", 20),
	}
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func getenvInt(k string, def int) int {
	value := getenv(k, "")
	if value == "" {
		return def
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return def
	}
	return parsed
}

func getenvBool(k string, def bool) bool {
	value := getenv(k, "")
	if value == "" {
		return def
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return def
	}
	return parsed
}

func mustenv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		panic("missing env var: " + k)
	}
	return v
}

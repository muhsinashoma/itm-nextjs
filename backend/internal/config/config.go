//backend//internal/config/config.go
package config

import (
	"os"
	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	Env         string
	DatabaseURL string
	JWTSecret   string
	AllowOrigin string
}

func Load() *Config {
	_ = godotenv.Load()
	return &Config{
		Port:        getenv("PORT", "8080"),
		Env:         getenv("ENV", "development"),
		DatabaseURL: mustenv("DATABASE_URL"),
		JWTSecret:   mustenv("JWT_SECRET"),
		AllowOrigin: getenv("ALLOW_ORIGIN", "http://localhost:3000"),
	}
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" { return v }
	return def
}

func mustenv(k string) string {
	v := os.Getenv(k)
	if v == "" { panic("missing env var: " + k) }
	return v
}

// Password Migration Tool
// Sets bcrypt password for all users imported from admin_user_info
// Run once: DATABASE_URL="..." go run cmd/migrate_passwords/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	_ = godotenv.Load()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" { log.Fatal("DATABASE_URL not set") }

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil { log.Fatal(err) }
	defer pool.Close()

	// Temp password - users must change on first login
	temp := "ChangeMe@1234"
	hash, _ := bcrypt.GenerateFromPassword([]byte(temp), 12)

	tag, err := pool.Exec(context.Background(),
		"UPDATE users SET password_hash=$1 WHERE password_hash NOT LIKE '$2a$%'", string(hash))
	if err != nil { log.Fatal(err) }

	fmt.Printf("✅ Updated %d users to bcrypt password: %s\n", tag.RowsAffected(), temp)
	fmt.Println("⚠️  All users must change password on first login!")
}

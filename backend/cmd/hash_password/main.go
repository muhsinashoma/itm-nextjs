//backend/cmd/hash_password/main.go

package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	fmt.Print("Enter password: ")

	reader := bufio.NewReader(os.Stdin)

	password, err := reader.ReadString('\n')
	if err != nil {
		log.Fatal(err)
	}

	password = strings.TrimSpace(password)

	if len(password) < 12 {
		log.Fatal("password must be at least 12 characters")
	}

	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println()
	fmt.Println(string(hash))
}
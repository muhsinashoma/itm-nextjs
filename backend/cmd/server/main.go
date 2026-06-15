//backend/cmd/server/main.go
// import "github.com/gin-contrib/gzip"
// package main

// import (
// 	"context"
// 	"log"
// 	"net/http"
// 	"os"
// 	"os/signal"
// 	"syscall"
// 	"time"

// 	"itm-api/internal/config"
// 	"itm-api/internal/db"
// 	"itm-api/internal/handler"
// 	"itm-api/internal/middleware"

// 	"github.com/gin-contrib/cors"
// 	"github.com/gin-gonic/gin"
// )

// func main() {
// 	cfg := config.Load()

// 	pool, err := db.Connect(cfg.DatabaseURL)
// 	if err != nil {
// 		log.Fatalf("❌ DB connect failed: %v", err)
// 	}
// 	defer pool.Close()
// 	log.Println("✅ PostgreSQL connected")

// 	if cfg.Env == "production" {
// 		gin.SetMode(gin.ReleaseMode)
// 	}

// 	r := gin.New()
// 	r.Use(gin.Recovery(), middleware.Logger())
// 	r.Use(cors.New(cors.Config{
// 		AllowOrigins:     []string{cfg.AllowOrigin},
// 		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
// 		AllowHeaders:     []string{"Authorization", "Content-Type"},
// 		ExposeHeaders:    []string{"X-Total-Count", "X-Page", "X-Page-Size"},
// 		AllowCredentials: true,
// 		MaxAge:           12 * time.Hour,
// 	}))

// 	r.GET("/health", func(c *gin.Context) {
// 		c.JSON(200, gin.H{"status": "ok", "time": time.Now().UTC()})
// 	})

// 	v1 := r.Group("/api/v1")

// 	// Public
// 	authH := handler.NewAuthHandler(pool, cfg)
// 	v1.POST("/auth/login", middleware.RateLimit(5, time.Minute), authH.Login)
// 	v1.POST("/auth/refresh", authH.Refresh)

// 	// Protected
// 	p := v1.Group("/")
// 	p.Use(middleware.Auth(cfg.JWTSecret))
// 	{
// 		handler.NewTicketHandler(pool).Register(p)
// 		handler.NewDeviceHandler(pool).Register(p)
// 		handler.NewEmployeeHandler(pool).Register(p)
// 		handler.NewClaimHandler(pool).Register(p)
// 		handler.NewStockHandler(pool).Register(p)
// 		handler.NewReportHandler(pool).Register(p)
// 		handler.NewVendorHandler(pool).Register(p)
// 		handler.NewCategoryHandler(pool).Register(p)
// 		handler.NewDashboardHandler(pool).Register(p)
// 	}

// 	srv := &http.Server{
// 		Addr: ":" + cfg.Port, Handler: r,
// 		ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second,
// 	}
// 	go func() {
// 		log.Printf("🚀 ITM API on :%s [%s]", cfg.Port, cfg.Env)
// 		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
// 			log.Fatalf("listen: %v", err)
// 		}
// 	}()

// 	quit := make(chan os.Signal, 1)
// 	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
// 	<-quit
// 	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
// 	defer cancel()
// 	srv.Shutdown(ctx)
// }


// r.Use(gin.Recovery(), middleware.Logger(), middleware.SecurityHeaders())


// backend/cmd/server/main.go
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"itm-api/internal/config"
	"itm-api/internal/db"
	"itm-api/internal/handler"
	"itm-api/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ DB connect failed: %v", err)
	}
	defer pool.Close()
	log.Println("✅ PostgreSQL connected")

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.SecurityHeaders())
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.AllowOrigin},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"X-Total-Count", "X-Page", "X-Page-Size"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"time":   time.Now().UTC(),
		})
	})

	v1 := r.Group("/api/v1")

	// Public
	authH := handler.NewAuthHandler(pool, cfg)
	v1.POST("/auth/login", middleware.RateLimit(5, time.Minute), authH.Login)
	v1.POST("/auth/refresh", authH.Refresh)

	// Protected
	p := v1.Group("/")
	p.Use(middleware.Auth(cfg.JWTSecret))
	{
		handler.NewTicketHandler(pool).Register(p)
		handler.NewDeviceHandler(pool).Register(p)
		handler.NewEmployeeHandler(pool).Register(p)
		handler.NewClaimHandler(pool).Register(p)
		handler.NewStockHandler(pool).Register(p)
		handler.NewReportHandler(pool).Register(p)
		handler.NewVendorHandler(pool).Register(p)
		handler.NewCategoryHandler(pool).Register(p)
		handler.NewDashboardHandler(pool).Register(p)
	}

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	go func() {
		log.Printf("🚀 ITM API on :%s [%s]", cfg.Port, cfg.Env)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("server shutdown error: %v", err)
	}
}
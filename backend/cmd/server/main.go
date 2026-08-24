// backend/cmd/server/main.go

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
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
	/* ============================================================
	   CONFIG
	============================================================ */

	cfg := config.Load()

	/* ============================================================
	   DATABASE
	============================================================ */

	pool, err := db.Connect(
		cfg.DatabaseURL,
	)
	if err != nil {
		log.Fatalf(
			"❌ DB connect failed: %v",
			err,
		)
	}

	defer pool.Close()

	log.Println(
		"✅ PostgreSQL connected",
	)

	/* ============================================================
	   GIN MODE
	============================================================ */

	if cfg.Env == "production" {
		gin.SetMode(
			gin.ReleaseMode,
		)
	}

	/* ============================================================
	   ROUTER
	============================================================ */

	r := gin.New()

	/* ============================================================
	   GLOBAL MIDDLEWARE
	============================================================ */

	r.Use(
		gin.Recovery(),
	)

	r.Use(
		middleware.Logger(),
	)

	r.Use(
		middleware.SecurityHeaders(),
	)

	r.Use(
		gzip.Gzip(
			gzip.DefaultCompression,
		),
	)

	/* ============================================================
	   CORS
	============================================================ */

	r.Use(
		cors.New(
			cors.Config{
				AllowOrigins: []string{
					cfg.AllowOrigin,
				},

				AllowMethods: []string{
					"GET",
					"POST",
					"PUT",
					"PATCH",
					"DELETE",
					"OPTIONS",
				},

				AllowHeaders: []string{
					"Authorization",
					"Content-Type",
					"Accept",
					"Origin",
					"X-Requested-With",
				},

				ExposeHeaders: []string{
					"X-Total-Count",
					"X-Page",
					"X-Page-Size",
				},

				AllowCredentials: true,

				MaxAge: 12 * time.Hour,
			},
		),
	)

	/* ============================================================
	   HEALTH
	============================================================ */

	r.GET(
		"/health",
		func(
			c *gin.Context,
		) {
			c.JSON(
				http.StatusOK,
				gin.H{
					"status": "ok",

					"time": time.Now().
						UTC(),
				},
			)
		},
	)

	/* ============================================================
	   API V1
	============================================================ */

	v1 :=
		r.Group(
			"/api/v1",
		)

	/* ============================================================
	   AUTH — PUBLIC
	============================================================ */

	authH :=
		handler.NewAuthHandler(
			pool,
			cfg,
		)

	v1.POST(
		"/auth/login",

		middleware.RateLimit(
			5,
			time.Minute,
		),

		authH.Login,
	)

	v1.POST(
		"/auth/refresh",
		authH.Refresh,
	)

	/* ============================================================
	   PROTECTED API

	   IMPORTANT:
	   Use Group("") here.

	   Final protected URLs become:

	   /api/v1/auth/me
	   /api/v1/admin/role-access/overview
	   /api/v1/admin/role-access/roles
	   etc.
	============================================================ */

	protected :=
		v1.Group(
			"",
		)

	protected.Use(
		middleware.Auth(
			cfg.JWTSecret,
		),
	)

	/* ============================================================
	   AUTH — PROTECTED
	============================================================ */

	protected.GET(
		"/auth/me",
		authH.Me,
	)

	/* ============================================================
	   CORE HANDLERS
	============================================================ */

	handler.NewTicketHandler(
		pool,
	).Register(
		protected,
	)

	handler.NewDeviceHandler(
		pool,
	).Register(
		protected,
	)

	/* ============================================================
	   UNIQUE / CURRENT ASSET DEVICES

	   GET /api/v1/assets/devices
	============================================================ */

	handler.NewAssetDeviceHandler(
		pool,
	).Register(
		protected,
	)

	/* ============================================================
	   EMPLOYEE
	============================================================ */

	handler.NewEmployeeHandler(
		pool,
	).Register(
		protected,
	)

	/* ============================================================
	   CLAIM
	============================================================ */

	handler.NewClaimHandler(
		pool,
	).Register(
		protected,
	)

	/* ============================================================
	   STOCK
	============================================================ */

	handler.NewStockHandler(
		pool,
	).Register(
		protected,
	)

	/* ============================================================
	   REPORT
	============================================================ */

	handler.NewReportHandler(
		pool,
	).Register(
		protected,
	)

	/* ============================================================
	   VENDOR
	============================================================ */

	handler.NewVendorHandler(
		pool,
	).Register(
		protected,
	)

	/* ============================================================
	   CATEGORY
	============================================================ */

	handler.NewCategoryHandler(
		pool,
	).Register(
		protected,
	)

	/* ============================================================
	   ADMIN DASHBOARD
	============================================================ */

	handler.NewDashboardHandler(
		pool,
	).Register(
		protected,
	)

	/* ============================================================
	   USER / EMPLOYEE DASHBOARD
	============================================================ */

	handler.NewUserDashboardHandler(
		pool,
	).Register(
		protected,
	)

	/* ============================================================
	   ROLE & ACCESS MANAGEMENT

	   Creates:

	   GET
	   /api/v1/admin/role-access/overview

	   GET
	   /api/v1/admin/role-access/roles

	   GET
	   /api/v1/admin/role-access/permissions

	   GET
	   /api/v1/admin/role-access/users

	   PUT
	   /api/v1/admin/role-access/users/:id/role

	   PUT
	   /api/v1/admin/role-access/roles/:id/permissions

	   The RoleAccessHandler itself additionally enforces:

	   roles.manage
	============================================================ */

	roleAccessHandler :=
		handler.NewRoleAccessHandler(
			pool,
		)

	roleAccessHandler.Register(
		protected,
	)

	/* ============================================================
	   JSON 404

	   Makes missing backend routes easier to debug.
	============================================================ */

	r.NoRoute(
		func(
			c *gin.Context,
		) {
			c.JSON(
				http.StatusNotFound,
				gin.H{
					"success": false,

					"error": "route not found",

					"method": c.Request.Method,

					"path": c.Request.URL.Path,
				},
			)
		},
	)

	/* ============================================================
	   STARTUP ROUTE CHECK

	   This is intentionally kept for Role Access debugging.

	   When the API starts you MUST see lines like:

	   REGISTERED ROUTE:
	   GET /api/v1/admin/role-access/overview
	============================================================ */

	roleAccessRouteCount :=
		0

	for _, route := range r.Routes() {

		if strings.Contains(
			route.Path,
			"/admin/role-access",
		) {
			roleAccessRouteCount++

			log.Printf(
				"✅ REGISTERED ROUTE: %s %s",
				route.Method,
				route.Path,
			)
		}
	}

	if roleAccessRouteCount ==
		0 {

		log.Fatal(
			"❌ Role Access routes were NOT registered",
		)
	}

	log.Printf(
		"✅ Role Access routes registered: %d",
		roleAccessRouteCount,
	)

	/* ============================================================
	   HTTP SERVER
	============================================================ */

	srv :=
		&http.Server{
			Addr: ":" +
				cfg.Port,

			Handler: r,

			ReadTimeout: 15 *
				time.Second,

			WriteTimeout: 30 *
				time.Second,

			IdleTimeout: 60 *
				time.Second,
		}

	/* ============================================================
	   START SERVER
	============================================================ */

	go func() {
		log.Printf(
			"🚀 ITM API running on :%s [%s]",
			cfg.Port,
			cfg.Env,
		)

		err :=
			srv.ListenAndServe()

		if err != nil &&
			err !=
				http.ErrServerClosed {

			log.Fatalf(
				"❌ listen failed: %v",
				err,
			)
		}
	}()

	/* ============================================================
	   GRACEFUL SHUTDOWN
	============================================================ */

	quit :=
		make(
			chan os.Signal,
			1,
		)

	signal.Notify(
		quit,
		syscall.SIGINT,
		syscall.SIGTERM,
	)

	<-quit

	log.Println(
		"🛑 shutting down ITM API...",
	)

	ctx,
		cancel :=
		context.WithTimeout(
			context.Background(),
			10*time.Second,
		)

	defer cancel()

	if err :=
		srv.Shutdown(
			ctx,
		); err != nil {

		log.Printf(
			"server shutdown error: %v",
			err,
		)
	}

	log.Println(
		"✅ ITM API stopped",
	)
}

package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"small-victory-backend/internal/config"
	"small-victory-backend/internal/database"
	"small-victory-backend/internal/handlers"
	"small-victory-backend/internal/services"
)

func main() {
	cfg := config.LoadConfig()

	// Connect to MongoDB
	db, err := database.ConnectDB(cfg)
	if err != nil {
		log.Fatalf("Fatal: MongoDB connection initialization failed: %v", err)
	}
	defer db.Close()

	// Initialize Cloudinary Service
	cldService := services.NewCloudinaryService(cfg)

	// Initialize Handlers
	h := handlers.NewAppHandler(db, cldService)

	// Gin setup
	router := gin.Default()

	// CORS configuration - Allow all origins dynamically for seamless local & network dev
	corsConfig := cors.Config{
		AllowOriginFunc:  func(origin string) bool { return true },
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	router.Use(cors.New(corsConfig))

	// Serve static uploads (for local file fallback)
	router.Static("/uploads", "./uploads")

	// API Routes Group
	api := router.Group("/api")
	{
		api.GET("/health", h.HealthCheck)
		api.GET("/stats", h.GetStats)

		// Days & Morning / Evening Workflows
		days := api.Group("/days")
		{
			days.GET("/:date", h.GetDay)
			days.POST("/:date/intention", h.UpdateIntention)
			days.POST("/:date/goals", h.AddGoal)
			days.PUT("/:date/goals/:goalId", h.UpdateGoal)
			days.DELETE("/:date/goals/:goalId", h.DeleteGoal)
			days.POST("/:date/morning-photo", h.UploadMorningPhoto)
			days.POST("/:date/evening", h.SubmitEveningReview)
		}

		// Daily Small Wins Journal
		wins := api.Group("/wins")
		{
			wins.GET("", h.GetWins)
			wins.POST("", h.CreateWin)
			wins.DELETE("/:id", h.DeleteWin)
		}
	}

	log.Printf("🚀 Small Victory Backend is running on port %s...", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server stopped with error: %v", err)
	}
}

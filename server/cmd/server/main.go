package main

import (
	"log"
	"net/http"
	"os"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/database"
	httpHandler "github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/handlers"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/repositories"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/security"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	db, err := database.NewPostgresDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err := database.RunMigrations(db.GetDB()); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}
	log.Println("Migrations completed successfully")

	jwtManager, err := security.NewJWTManager()
	if err != nil {
		log.Fatal("Failed to initialize JWT manager:", err)
	}
	passwordManager := security.NewPasswordManager()

	userRepo := repositories.NewUserRepository(db.GetDB())
	eventRepo := repositories.NewEventRepository(db.GetDB())
	eventInviteRepo := repositories.NewEventInviteRepository(db.GetDB())

	authUseCase := usecases.NewAuthUseCase(userRepo, jwtManager, passwordManager)
	eventUseCase := usecases.NewEventUseCase(eventRepo, eventInviteRepo, userRepo)

	authHandler := handlers.NewAuthHandler(authUseCase)
	eventHandler := handlers.NewEventHandler(eventUseCase)

	authMiddleware := middleware.NewAuthMiddleware(jwtManager)

	router := httpHandler.NewRouter(authHandler, eventHandler, authMiddleware)
	muxRouter := router.SetupRoutes()
	handler := middleware.CORS(muxRouter)


	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
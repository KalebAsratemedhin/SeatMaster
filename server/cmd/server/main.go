package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/KalebAsratemedhin/seatmaster/internal/application/usecases"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/database"
	httpHandler "github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/handlers"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/middleware"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/http/ws"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/mail"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/queue"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/repositories"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/security"
	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/storage"

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
	eventTableRepo := repositories.NewEventTableRepository(db.GetDB())
	eventSeatRepo := repositories.NewEventSeatRepository(db.GetDB())
	eventCommentRepo := repositories.NewEventCommentRepository(db.GetDB())
	eventChatThreadRepo := repositories.NewEventChatThreadRepository(db.GetDB())
	eventChatMessageRepo := repositories.NewEventChatMessageRepository(db.GetDB())
	invitationCardRepo := repositories.NewEventInvitationCardRepository(db.GetDB())
	inviteJobRepo := repositories.NewInviteJobRepository(db.GetDB())

	authUseCase := usecases.NewAuthUseCase(userRepo, jwtManager, passwordManager)
	mailer := mail.NewSMTPMailer()
	eventUseCase := usecases.NewEventUseCase(eventRepo, eventInviteRepo, eventTableRepo, eventSeatRepo, invitationCardRepo, inviteJobRepo, nil, userRepo, mailer)

	ctx := context.Background()
	riverClient, err := queue.NewClient(ctx, database.DSN(), eventUseCase)
	if err != nil {
		log.Fatal("Failed to initialize job queue:", err)
	}
	defer func() {
		stopCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = riverClient.Stop(stopCtx)
	}()
	eventUseCase.SetInviteJobQueue(riverClient)

	if err := riverClient.Start(ctx); err != nil {
		log.Fatal("Failed to start job queue:", err)
	}
	if err := eventUseCase.RecoverIncompleteInviteJobs(ctx); err != nil {
		log.Printf("error: invite job recovery: %v", err)
	}
	log.Println("Job queue started")

	dashboardUseCase := usecases.NewDashboardUseCase(eventRepo, eventInviteRepo, userRepo)
	profileUseCase := usecases.NewProfileUseCase(userRepo, eventRepo, authUseCase, passwordManager)
	commentUseCase := usecases.NewCommentUseCase(eventRepo, eventInviteRepo, eventCommentRepo, userRepo)
	chatUseCase := usecases.NewChatUseCase(eventRepo, eventInviteRepo, eventChatThreadRepo, eventChatMessageRepo, userRepo)
	invitationCardUseCase := usecases.NewInvitationCardUseCase(eventRepo, invitationCardRepo)

	authHandler := handlers.NewAuthHandler(authUseCase)
	eventHandler := handlers.NewEventHandler(eventUseCase)
	dashboardHandler := handlers.NewDashboardHandler(dashboardUseCase)
	profileHandler := handlers.NewProfileHandler(profileUseCase)
	commentHandler := handlers.NewCommentHandler(commentUseCase)
	chatHandler := handlers.NewChatHandler(chatUseCase)
	invitationCardHandler := handlers.NewInvitationCardHandler(invitationCardUseCase)
	chatHub := ws.NewHub()
	chatWSHandler := handlers.NewChatWSHandler(chatUseCase, jwtManager, chatHub)

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "uploads"
	}
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	var imageUploader storage.ImageUploader
	if cld, err := storage.NewCloudinaryUploaderFromEnv(); err == nil {
		imageUploader = cld
		log.Println("Uploads: Cloudinary")
	} else {
		imageUploader = storage.NewLocalUploader(uploadDir, baseURL)
		log.Printf("Uploads: local disk (%v)", err)
	}
	uploadHandler := handlers.NewUploadHandler(imageUploader)

	authMiddleware := middleware.NewAuthMiddleware(jwtManager, userRepo.ExistsByID)

	router := httpHandler.NewRouter(authHandler, eventHandler, uploadHandler, profileHandler, commentHandler, chatHandler, chatWSHandler, dashboardHandler, invitationCardHandler, authMiddleware)
	muxRouter := router.SetupRoutes(uploadDir)
	handler := middleware.RequestLogger(middleware.CORS(muxRouter))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{Addr: ":" + port, Handler: handler}
	go func() {
		log.Printf("Server starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server:", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	log.Println("Shutting down...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}

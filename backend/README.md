# SeatMaster Backend

A Go backend with authentication system for the SeatMaster application.

## Features

- User authentication (signup, signin, signout, me)
- JWT token-based authentication
- PostgreSQL database with GORM
- Docker support
- RESTful API endpoints
- **Swagger/OpenAPI documentation**

## Architecture

### Middleware Pattern
This project uses the proper Go/Gin middleware pattern:

1. **Global Middleware**: Applied to all routes (CORS)
2. **Route Group Middleware**: Applied to specific route groups
   ```go
   // Public routes (no auth required)
   auth := router.Group("/auth")
   auth.POST("/signup", authHandler.SignUp)
   
   // Protected routes (auth required)
   protected := router.Group("/")
   protected.Use(authMiddleware.AuthRequired()) // Middleware applied here
   protected.GET("/auth/me", authHandler.Me)    // This route requires auth
   ```

3. **Context Flow**: Middleware sets user context → Handlers access it
   ```go
   // Middleware sets context
   c.Set("user_context", userCtx)
   
   // Handler accesses context
   userCtx, exists := middleware.GetUserFromContext(c)
   ```

## Quick Start

### Prerequisites

- Go 1.21+
- Docker and Docker Compose
- PostgreSQL (via Docker)

### Setup

1. **Clone and navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Start PostgreSQL database**
   ```bash
   docker compose up -d
   ```

3. **Copy environment file**
   ```bash
   cp env.example .env
   ```

4. **Install dependencies**
   ```bash
   go mod tidy
   ```

5. **Run the server**
   ```bash
   go run cmd/server/main.go
   ```

The server will start on `http://localhost:8080`

## API Documentation

### Swagger UI
Once the server is running, you can access the interactive API documentation at:
```
http://localhost:8080/swagger/index.html
```

This provides:
- Interactive API testing
- Request/response examples
- Authentication setup
- All endpoint documentation

### Regenerating Swagger Docs
If you modify the API endpoints or models, regenerate the docs:
```bash
~/go/bin/swag init -g cmd/server/main.go -o docs
```

## API Endpoints

### Public Routes (No Authentication)
- `GET /health` - Health check
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/signout` - User logout

### Protected Routes (Authentication Required)
- `GET /auth/me` - Get current user (requires JWT token)

## Environment Variables

Copy `env.example` to `.env` and configure:

- Database settings (host, port, user, password, name)
- JWT secret and expiry
- Server host and port

## Database

The application uses GORM with PostgreSQL. Tables are automatically created on startup using `AutoMigrate`.

## Development

- The server runs in debug mode when `SERVER_HOST=localhost`
- Database migrations happen automatically on startup
- JWT tokens expire after 24 hours by default
- Swagger docs are generated from code annotations 
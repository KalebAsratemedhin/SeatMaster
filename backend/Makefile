.PHONY: help build run test clean swagger docker-up docker-down

# Default target
help:
	@echo "Available commands:"
	@echo "  build      - Build the application"
	@echo "  run        - Run the application"
	@echo "  test       - Run tests"
	@echo "  clean      - Clean build artifacts"
	@echo "  swagger    - Generate Swagger documentation"
	@echo "  docker-up  - Start PostgreSQL database"
	@echo "  docker-down- Stop PostgreSQL database"

# Build the application
build:
	go build -o bin/server ./cmd/server

# Run the application
run:
	go run ./cmd/server/main.go

# Run tests
test:
	go test ./...

# Clean build artifacts
clean:
	rm -rf bin/
	rm -rf docs/

# Generate Swagger documentation
swagger:
	~/go/bin/swag init -g cmd/server/main.go -o docs

# Start PostgreSQL database
docker-up:
	docker compose up -d

# Stop PostgreSQL database
docker-down:
	docker compose down

# Full setup (database + swagger + run)
setup: docker-up swagger run 
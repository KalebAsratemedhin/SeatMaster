# Database: set DATABASE_URL (or DB_URL) - used by server and migrate CLI
# Example: postgres://user:pass@host:5432/dbname?sslmode=require
DATABASE_URL ?= postgres://postgres:postgres@localhost:5435/seatmaster?sslmode=disable
DB_URL ?= $(DATABASE_URL)
MIGRATIONS_PATH ?= migrations
BINARY ?= server
COMPOSE ?= docker compose
DB_CONTAINER ?= seatmaster-db

# Start Postgres (Docker), wait until ready, then run the API
up: db-up db-wait run

# Start Postgres in the background
db-up:
	$(COMPOSE) up -d

# Stop Postgres (volume kept)
db-down:
	$(COMPOSE) down

# Block until Postgres accepts connections (avoids race on first boot)
db-wait:
	@echo "Waiting for Postgres..."
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do \
		if $(COMPOSE) exec -T $(DB_CONTAINER) pg_isready -U postgres >/dev/null 2>&1; then \
			echo "Postgres is ready."; \
			exit 0; \
		fi; \
		sleep 1; \
	done; \
	echo "Error: Postgres did not become ready in time."; \
	exit 1

# Run the API (loads .env via godotenv; migrations run on start)
run:
	go run ./cmd/server

# Build the API binary (no DB required)
build:
	go build -o $(BINARY) ./cmd/server

# Run all tests
test:
	go test ./...

# Migrate - uses Go program (reads from .env)
migrate:
	go run ./internal/infrastructure/database/migrate.go

# Direct migrate commands (uses migrate CLI tool)
migrate-up:
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" up

migrate-down:
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" down 1

migrate-version:
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" version

migrate-create:
	@if [ -z "$(name)" ]; then \
		echo "Error: name parameter required. Usage: make migrate-create name=create_users_table"; \
		exit 1; \
	fi
	migrate create -ext sql -dir $(MIGRATIONS_PATH) -seq $(name)

migrate-clean:
	docker exec -i seatmaster-db psql -U postgres -d seatmaster -c "DROP TABLE IF EXISTS schema_migrations"

# Dependencies
deps:
	go mod download
	go mod tidy

.PHONY: up db-up db-down db-wait run build test migrate migrate-up migrate-down migrate-version migrate-create migrate-clean deps
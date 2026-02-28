# Database: set DATABASE_URL (or DB_URL) - used by server and migrate CLI
# Example: postgres://user:pass@host:5432/dbname?sslmode=require
DATABASE_URL ?= postgres://postgres:postgres@localhost:5435/seatmaster?sslmode=disable
DB_URL ?= $(DATABASE_URL)
MIGRATIONS_PATH ?= migrations
BINARY ?= server

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

.PHONY: build test migrate migrate-up migrate-down migrate-version migrate-create migrate-clean deps
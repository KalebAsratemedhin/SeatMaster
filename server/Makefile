# Database connection string - can be overridden via environment
DB_URL ?= postgres://postgres:postgres@localhost:5435/seatmaster?sslmode=disable
MIGRATIONS_PATH ?= migrations

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

.PHONY: migrate migrate-up migrate-down migrate-version migrate-create migrate-clean deps
package database

import (
	"fmt"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type PostgresDB struct {
	DB *gorm.DB
}

// DSN returns the Postgres connection string from DATABASE_URL or DB_URL.
func DSN() string {
	if u := os.Getenv("DATABASE_URL"); u != "" {
		// Some hosts use "postgresql://"; Go driver accepts "postgres://"
		return strings.Replace(u, "postgresql://", "postgres://", 1)
	}
	if u := os.Getenv("DB_URL"); u != "" {
		return strings.Replace(u, "postgresql://", "postgres://", 1)
	}
	return ""
}

func NewPostgresDB() (*PostgresDB, error) {
	dsn := DSN()
	if dsn == "" {
		return nil, fmt.Errorf("database connection required: set DATABASE_URL or DB_URL (e.g. postgres://user:pass@host:port/dbname?sslmode=require)")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		// Silent: no SQL to stdout. Use Info temporarily when debugging queries.
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &PostgresDB{DB: db}, nil
}

func (p *PostgresDB) Close() error {
	sqlDB, err := p.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func (p *PostgresDB) GetDB() *gorm.DB {
	return p.DB
}
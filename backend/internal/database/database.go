package database

import (
	"fmt"
	"log"
	"strings"

	"github.com/seatmaster/backend/internal/config"
	"github.com/seatmaster/backend/internal/database/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type DB struct {
	*gorm.DB
}

func NewConnection(config *config.Config) (*DB, error) {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		config.Database.Host,
		config.Database.Port,
		config.Database.User,
		config.Database.Password,
		config.Database.Name,
		config.Database.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get the underlying sql.DB object for connection pool settings
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)

	log.Println("Successfully connected to database")
	return &DB{db}, nil
}

func (db *DB) Close() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// InitTables creates the necessary database tables using GORM AutoMigrate
func (db *DB) InitTables() error {
	// Enable UUID extension for PostgreSQL
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		return fmt.Errorf("failed to create UUID extension: %w", err)
	}

	// Let GORM handle the migration - it should create new tables with UUID structure
	// If tables exist with old structure, GORM will attempt to migrate them
	err := db.AutoMigrate(&models.User{}, &models.Event{}, &models.Guest{}, &models.Seat{})
	if err != nil {
		// If migration fails due to type conflicts, we need to handle it
		if strings.Contains(err.Error(), "cannot cast type bigint to uuid") {
			log.Println("Migration failed due to UUID type conflict. Dropping existing tables to recreate with UUID structure...")

			// Drop existing tables and recreate
			if err := db.Migrator().DropTable(&models.Seat{}); err != nil {
				return fmt.Errorf("failed to drop seats table: %w", err)
			}
			if err := db.Migrator().DropTable(&models.Guest{}); err != nil {
				return fmt.Errorf("failed to drop guests table: %w", err)
			}
			if err := db.Migrator().DropTable(&models.Event{}); err != nil {
				return fmt.Errorf("failed to drop events table: %w", err)
			}
			if err := db.Migrator().DropTable(&models.User{}); err != nil {
				return fmt.Errorf("failed to drop users table: %w", err)
			}

			// Try migration again
			if err := db.AutoMigrate(&models.User{}, &models.Event{}, &models.Guest{}, &models.Seat{}); err != nil {
				return fmt.Errorf("failed to migrate database after dropping tables: %w", err)
			}
		} else {
			return fmt.Errorf("failed to migrate database: %w", err)
		}
	}

	log.Println("Database tables initialized successfully")
	return nil
}

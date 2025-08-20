package database

import (
	"fmt"
	"log"

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
	err := db.AutoMigrate(&models.User{})
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database tables initialized successfully")
	return nil
}

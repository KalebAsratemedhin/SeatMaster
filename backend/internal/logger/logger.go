package logger

import (
	"log"
	"os"
)

// Logger provides structured logging for the application
type Logger struct {
	*log.Logger
}

// New creates a new logger instance
func New() *Logger {
	return &Logger{
		Logger: log.New(os.Stdout, "[SeatMaster] ", log.LstdFlags|log.Lshortfile),
	}
}

// Info logs an informational message
func (l *Logger) Info(format string, v ...interface{}) {
	l.Printf("[INFO] "+format, v...)
}

// Error logs an error message
func (l *Logger) Error(format string, v ...interface{}) {
	l.Printf("[ERROR] "+format, v...)
}

// Debug logs a debug message
func (l *Logger) Debug(format string, v ...interface{}) {
	l.Printf("[DEBUG] "+format, v...)
}

// Fatal logs a fatal message and exits
func (l *Logger) Fatal(format string, v ...interface{}) {
	l.Printf("[FATAL] "+format, v...)
	os.Exit(1)
}

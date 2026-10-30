package storage

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// LocalUploader stores images under uploadDir and returns baseURL/uploads/{folder}/{name}.
type LocalUploader struct {
	uploadDir string
	baseURL   string
}

func NewLocalUploader(uploadDir, baseURL string) *LocalUploader {
	return &LocalUploader{
		uploadDir: uploadDir,
		baseURL:   strings.TrimSuffix(baseURL, "/"),
	}
}

func (u *LocalUploader) UploadImage(ctx context.Context, file io.Reader, folder, contentType string) (string, error) {
	_ = ctx
	folder = strings.Trim(folder, "/")
	if folder == "" {
		folder = "misc"
	}
	ext := extForContentType(contentType)
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate filename: %w", err)
	}
	name := hex.EncodeToString(b) + ext
	dir := filepath.Join(u.uploadDir, folder)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("create upload dir: %w", err)
	}
	path := filepath.Join(dir, name)
	dst, err := os.Create(path)
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		os.Remove(path)
		return "", fmt.Errorf("save file: %w", err)
	}
	return fmt.Sprintf("%s/uploads/%s/%s", u.baseURL, folder, name), nil
}

func extForContentType(ct string) string {
	switch {
	case strings.Contains(ct, "png"):
		return ".png"
	case strings.Contains(ct, "gif"):
		return ".gif"
	case strings.Contains(ct, "webp"):
		return ".webp"
	default:
		return ".jpg"
	}
}

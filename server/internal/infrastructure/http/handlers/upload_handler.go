package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const maxBannerSize = 10 << 20 // 10MB
var allowedBannerTypes = map[string]bool{
	"image/jpeg": true, "image/jpg": true, "image/png": true,
	"image/gif": true, "image/webp": true,
}

type UploadHandler struct {
	uploadDir string
	baseURL   string
}

func NewUploadHandler(uploadDir, baseURL string) *UploadHandler {
	return &UploadHandler{uploadDir: uploadDir, baseURL: strings.TrimSuffix(baseURL, "/")}
}

func (h *UploadHandler) UploadBanner(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	if err := r.ParseMultipartForm(maxBannerSize); err != nil {
		respondWithError(w, http.StatusBadRequest, "file too large or invalid form")
		return
	}

	file, header, err := r.FormFile("banner")
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "missing file: use form key 'banner'")
		return
	}
	defer file.Close()

	ct := header.Header.Get("Content-Type")
	if !allowedBannerTypes[ct] {
		respondWithError(w, http.StatusBadRequest, "invalid file type: use JPEG, PNG, GIF, or WebP")
		return
	}

	ext := ".jpg"
	switch {
	case strings.Contains(ct, "png"):
		ext = ".png"
	case strings.Contains(ct, "gif"):
		ext = ".gif"
	case strings.Contains(ct, "webp"):
		ext = ".webp"
	}

	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to generate filename")
		return
	}
	name := hex.EncodeToString(b) + ext
	dir := filepath.Join(h.uploadDir, "banners")
	if err := os.MkdirAll(dir, 0755); err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to create upload directory")
		return
	}
	path := filepath.Join(dir, name)

	dst, err := os.Create(path)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to save file")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		os.Remove(path)
		respondWithError(w, http.StatusInternalServerError, "failed to save file")
		return
	}

	url := fmt.Sprintf("%s/uploads/banners/%s", h.baseURL, name)
	respondWithJSON(w, http.StatusOK, map[string]string{"url": url})
}

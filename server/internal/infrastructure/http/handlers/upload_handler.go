package handlers

import (
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/KalebAsratemedhin/seatmaster/internal/infrastructure/storage"
)

const maxBannerSize = 10 << 20 // 10MB
const maxAvatarSize = 5 << 20  // 5MB

var allowedImageTypes = map[string]bool{
	"image/jpeg": true, "image/jpg": true, "image/png": true,
	"image/gif": true, "image/webp": true,
}

type UploadHandler struct {
	uploader storage.ImageUploader
}

func NewUploadHandler(uploader storage.ImageUploader) *UploadHandler {
	return &UploadHandler{uploader: uploader}
}

func (h *UploadHandler) UploadBanner(w http.ResponseWriter, r *http.Request) {
	h.upload(w, r, "banner", "banners", maxBannerSize)
}

func (h *UploadHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	h.upload(w, r, "avatar", "avatars", maxAvatarSize)
}

func (h *UploadHandler) upload(w http.ResponseWriter, r *http.Request, formKey, folder string, maxSize int64) {
	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := r.ParseMultipartForm(maxSize); err != nil {
		respondWithError(w, http.StatusBadRequest, "file too large or invalid form")
		return
	}
	file, header, err := r.FormFile(formKey)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "missing file: use form key '"+formKey+"'")
		return
	}
	defer file.Close()

	ct := header.Header.Get("Content-Type")
	if !allowedImageTypes[ct] {
		respondWithError(w, http.StatusBadRequest, "invalid file type: use JPEG, PNG, GIF, or WebP")
		return
	}

	// Bound read to maxSize even if multipart lied.
	limited := io.LimitReader(file, maxSize+1)
	url, err := h.uploader.UploadImage(r.Context(), limited, folder, ct)
	if err != nil {
		log.Printf("error: upload %s: %v", folder, err)
		respondWithError(w, http.StatusInternalServerError, "failed to upload file")
		return
	}
	if strings.TrimSpace(url) == "" {
		respondWithError(w, http.StatusInternalServerError, "failed to upload file")
		return
	}
	respondWithJSON(w, http.StatusOK, map[string]string{"url": url})
}

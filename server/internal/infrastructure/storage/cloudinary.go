package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// ImageUploader stores an image and returns a publicly reachable URL.
type ImageUploader interface {
	UploadImage(ctx context.Context, file io.Reader, folder, contentType string) (url string, err error)
}

type cloudinaryUploader struct {
	cld          *cloudinary.Cloudinary
	folderPrefix string
}

// NewCloudinaryUploaderFromEnv builds a Cloudinary uploader.
// Accepts CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.
// Optional CLOUDINARY_FOLDER prefixes asset folders (default: seatmaster).
func NewCloudinaryUploaderFromEnv() (ImageUploader, error) {
	var (
		cld *cloudinary.Cloudinary
		err error
	)
	if u := strings.TrimSpace(os.Getenv("CLOUDINARY_URL")); u != "" {
		cld, err = cloudinary.NewFromURL(u)
	} else {
		cloud := strings.TrimSpace(os.Getenv("CLOUDINARY_CLOUD_NAME"))
		key := strings.TrimSpace(os.Getenv("CLOUDINARY_API_KEY"))
		secret := strings.TrimSpace(os.Getenv("CLOUDINARY_API_SECRET"))
		if cloud == "" || key == "" || secret == "" {
			return nil, fmt.Errorf("cloudinary not configured: set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET")
		}
		cld, err = cloudinary.NewFromParams(cloud, key, secret)
	}
	if err != nil {
		return nil, fmt.Errorf("cloudinary init: %w", err)
	}
	prefix := strings.Trim(strings.TrimSpace(os.Getenv("CLOUDINARY_FOLDER")), "/")
	if prefix == "" {
		prefix = "seatmaster"
	}
	return &cloudinaryUploader{cld: cld, folderPrefix: prefix}, nil
}

func (u *cloudinaryUploader) UploadImage(ctx context.Context, file io.Reader, folder, contentType string) (string, error) {
	_ = contentType
	folder = strings.Trim(folder, "/")
	fullFolder := u.folderPrefix
	if folder != "" {
		fullFolder = u.folderPrefix + "/" + folder
	}
	res, err := u.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:         fullFolder,
		ResourceType:   "image",
		UniqueFilename: apiBool(true),
		Overwrite:      apiBool(false),
	})
	if err != nil {
		return "", fmt.Errorf("cloudinary upload: %w", err)
	}
	if res == nil || res.SecureURL == "" {
		return "", fmt.Errorf("cloudinary upload: empty secure_url")
	}
	return res.SecureURL, nil
}

func apiBool(v bool) *bool { return &v }

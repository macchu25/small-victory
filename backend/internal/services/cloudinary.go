package services

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"small-victory-backend/internal/config"
)

type CloudinaryService struct {
	cld       *cloudinary.Cloudinary
	isConfigured bool
}

func NewCloudinaryService(cfg *config.Config) *CloudinaryService {
	var cld *cloudinary.Cloudinary
	var err error

	if cfg.CloudinaryURL != "" {
		cld, err = cloudinary.NewFromURL(cfg.CloudinaryURL)
	} else if cfg.CloudinaryCloudName != "" && cfg.CloudinaryAPIKey != "" && cfg.CloudinaryAPISecret != "" {
		cld, err = cloudinary.NewFromParams(cfg.CloudinaryCloudName, cfg.CloudinaryAPIKey, cfg.CloudinaryAPISecret)
	}

	if err != nil || cld == nil {
		log.Printf("[Cloudinary] Notice: Cloudinary credentials not fully configured. Using local filesystem fallback in ./uploads")
		_ = os.MkdirAll("./uploads", 0755)
		return &CloudinaryService{
			cld:          nil,
			isConfigured: false,
		}
	}

	log.Printf("[Cloudinary] Successfully connected to Cloudinary service")
	return &CloudinaryService{
		cld:          cld,
		isConfigured: true,
	}
}

func boolPtr(b bool) *bool {
	return &b
}

// UploadImage uploads a multipart file to Cloudinary (or local fallback)
func (s *CloudinaryService) UploadImage(ctx context.Context, file multipart.File, fileHeader *multipart.FileHeader, folder string) (url string, publicID string, err error) {
	if s.isConfigured && s.cld != nil {
		uploadParams := uploader.UploadParams{
			Folder:         "small-victory/" + folder,
			UniqueFilename: boolPtr(true),
			Overwrite:      boolPtr(false),
		}

		res, err := s.cld.Upload.Upload(ctx, file, uploadParams)
		if err != nil {
			return "", "", fmt.Errorf("cloudinary upload error: %w", err)
		}
		return res.SecureURL, res.PublicID, nil
	}

	// Local filesystem fallback
	_ = os.MkdirAll("./uploads/"+folder, 0755)
	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(fileHeader.Filename))
	destPath := filepath.Join("./uploads", folder, filename)

	dst, err := os.Create(destPath)
	if err != nil {
		return "", "", fmt.Errorf("local upload error: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", "", fmt.Errorf("copy file error: %w", err)
	}

	// Return local relative API path
	localURL := fmt.Sprintf("/uploads/%s/%s", folder, filename)
	return localURL, "local_" + filename, nil
}

// UploadBase64 uploads a base64 encoded image string to Cloudinary
func (s *CloudinaryService) UploadBase64(ctx context.Context, base64Data string, folder string) (url string, publicID string, err error) {
	if s.isConfigured && s.cld != nil {
		uploadParams := uploader.UploadParams{
			Folder:         "small-victory/" + folder,
			UniqueFilename: boolPtr(true),
		}

		res, err := s.cld.Upload.Upload(ctx, base64Data, uploadParams)
		if err != nil {
			return "", "", fmt.Errorf("cloudinary upload base64 error: %w", err)
		}
		return res.SecureURL, res.PublicID, nil
	}

	// Local fallback for base64: save decoded bytes
	_ = os.MkdirAll("./uploads/"+folder, 0755)
	filename := fmt.Sprintf("%d_snapshot.jpg", time.Now().UnixNano())
	destPath := filepath.Join("./uploads", folder, filename)

	// Strip data URI prefix if present (e.g. data:image/jpeg;base64,...)
	b64Clean := base64Data
	if idx := len("data:image/jpeg;base64,"); len(base64Data) > idx && base64Data[0:4] == "data" {
		for i := 0; i < len(base64Data); i++ {
			if base64Data[i] == ',' {
				b64Clean = base64Data[i+1:]
				break
			}
		}
	}

	decoded, err := base64.StdEncoding.DecodeString(b64Clean)
	if err != nil {
		// Just write string or return error
		return "", "", fmt.Errorf("decode base64 error: %w", err)
	}

	if err := os.WriteFile(destPath, decoded, 0644); err != nil {
		return "", "", fmt.Errorf("save base64 error: %w", err)
	}

	localURL := fmt.Sprintf("/uploads/%s/%s", folder, filename)
	return localURL, "local_" + filename, nil
}

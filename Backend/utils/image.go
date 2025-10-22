package utils

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofrs/uuid"
)

const (
	MaxFileSize = 10 << 20
	UploadDir   = "uploads"
)

var AllowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/gif":  true,
}

var AllowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
}

type ImageUploadResult struct {
	Filename string `json:"filename"`
	Path     string `json:"path"`
	Size     int64  `json:"size"`
	MimeType string `json:"mime_type"`
}

func init() {
	if err := os.MkdirAll(UploadDir, 0755); err != nil {
		panic(fmt.Sprintf("Failed to create uploads directory: %v", err))
	}
}

func ValidateImageFile(header *multipart.FileHeader) error {
	if header.Size > MaxFileSize {
		return errors.New("file size exceeds maximum allowed size of 10MB")
	}
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !AllowedExtensions[ext] {
		return errors.New("invalid file extension. Only JPEG, PNG, and GIF files are allowed")
	}
	return nil
}

func ValidateImageContent(file multipart.File) (string, error) {
	buffer := make([]byte, 512)
	_, err := file.Read(buffer)
	if err != nil {
		return "", fmt.Errorf("failed to read file content: %v", err)
	}
	file.Seek(0, io.SeekStart)
	contentType := http.DetectContentType(buffer)
	if !AllowedImageTypes[contentType] {
		return "", errors.New("invalid file content. Only JPEG, PNG, and GIF images are allowed")
	}
	return contentType, nil
}

func SaveImageFile(file multipart.File, header *multipart.FileHeader) (*ImageUploadResult, error) {
	if err := ValidateImageFile(header); err != nil {
		return nil, err
	}
	contentType, err := ValidateImageContent(file)
	if err != nil {
		return nil, err
	}
	fileID, err := uuid.NewV4()
	if err != nil {
		return nil, fmt.Errorf("failed to generate file ID: %v", err)
	}
	ext := strings.ToLower(filepath.Ext(header.Filename))
	filename := fmt.Sprintf("%s%s", fileID.String(), ext)
	filePath := filepath.Join(UploadDir, filename)
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create destination file: %v", err)
	}
	defer dst.Close()
	size, err := io.Copy(dst, file)
	if err != nil {
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to save file: %v", err)
	}
	return &ImageUploadResult{
		Filename: filename,
		Path:     filePath,
		Size:     size,
		MimeType: contentType,
	}, nil
}

func DeleteImageFile(filename string) error {
	if filename == "" {
		return nil
	}
	filePath := filepath.Join(UploadDir, filename)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil
	}
	return os.Remove(filePath)
}

func GetImagePath(filename string) string {
	if filename == "" {
		return ""
	}
	return filepath.Join(UploadDir, filename)
}

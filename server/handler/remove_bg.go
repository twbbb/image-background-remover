package handler

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"

	"bg-remover-server/tencent"
)

type RemoveBgRequest struct {
	Image string `json:"image"` // base64 or data URL
	Mode  string `json:"mode"`  // portrait, goods, general (default: portrait)
}

type RemoveBgResponse struct {
	Success bool   `json:"success"`
	Image   string `json:"image,omitempty"` // base64 PNG result
	Error   string `json:"error,omitempty"`
}

func RemoveBackground(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Read request body (limit to 10MB)
	body, err := io.ReadAll(io.LimitReader(r.Body, 10*1024*1024))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Failed to read request body")
		return
	}
	defer r.Body.Close()

	var req RemoveBgRequest
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON request body")
		return
	}

	if req.Image == "" {
		writeError(w, http.StatusBadRequest, "Missing image data. Please provide base64 encoded image.")
		return
	}

	// Remove data URL prefix if present (e.g., "data:image/png;base64,")
	base64Data := req.Image
	if idx := strings.Index(base64Data, ","); idx != -1 && strings.HasPrefix(base64Data, "data:") {
		base64Data = base64Data[idx+1:]
	}

	// Validate base64 size (should be ≤ 10MB after decode for CI API)
	sizeInBytes := float64(len(base64Data)) * 3.0 / 4.0
	sizeInMB := sizeInBytes / (1024 * 1024)
	if sizeInMB > 10 {
		writeError(w, http.StatusBadRequest, "Image too large. Maximum size is 10MB.")
		return
	}

	// Parse matting mode (default to portrait)
	mode := tencent.ModePortrait
	switch req.Mode {
	case "goods":
		mode = tencent.ModeGoods
	case "general":
		mode = tencent.ModeGeneral
	case "portrait", "":
		mode = tencent.ModePortrait
	default:
		mode = tencent.ModePortrait
	}

	// Call Tencent Cloud CI matting API
	result, err := tencent.RemoveBackgroundCI(base64Data, mode)
	if err != nil {
		log.Printf("Tencent Cloud CI API error: %v", err)

		errMsg := err.Error()
		if strings.Contains(errMsg, "InArrears") {
			writeError(w, http.StatusServiceUnavailable, "Service temporarily unavailable. Please try again later.")
			return
		}
		if strings.Contains(errMsg, "ImageSizeExceed") || strings.Contains(errMsg, "ImageResolutionExceed") {
			writeError(w, http.StatusBadRequest, "Image is too large or resolution exceeds limit. Please resize and try again.")
			return
		}
		if strings.Contains(errMsg, "NoSuchKey") {
			writeError(w, http.StatusInternalServerError, "Failed to process image. Please try again.")
			return
		}

		writeError(w, http.StatusInternalServerError, "Failed to remove background. Please try again.")
		return
	}

	if !result.HasForeground {
		writeError(w, http.StatusUnprocessableEntity, "No foreground detected in the image. Please try a different image.")
		return
	}

	json.NewEncoder(w).Encode(RemoveBgResponse{
		Success: true,
		Image:   result.ResultImage,
	})
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(RemoveBgResponse{
		Error: msg,
	})
}

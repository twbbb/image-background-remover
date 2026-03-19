package tencent

import (
	"crypto/hmac"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type RemoveBackgroundResult struct {
	ResultImage   string `json:"resultImage"`
	HasForeground bool   `json:"hasForeground"`
}

// MattingMode represents the type of matting to perform
type MattingMode string

const (
	ModePortrait MattingMode = "portrait" // 人像抠图 - AIPortraitMatting
	ModeGoods    MattingMode = "goods"    // 商品抠图 - GoodsMatting
	ModeGeneral  MattingMode = "general"  // 通用抠图 - AIPicMatting
)

// getCIProcess returns the ci-process value for the given matting mode
func getCIProcess(mode MattingMode) string {
	switch mode {
	case ModePortrait:
		return "AIPortraitMatting"
	case ModeGoods:
		return "GoodsMatting"
	case ModeGeneral:
		return "AIPicMatting"
	default:
		return "AIPortraitMatting"
	}
}

// RemoveBackgroundCI calls Tencent Cloud CI (Data Processing) matting API
// Supports three modes: portrait (人像), goods (商品), general (通用)
func RemoveBackgroundCI(imageBase64 string, mode MattingMode) (*RemoveBackgroundResult, error) {
	secretID := os.Getenv("TENCENT_SECRET_ID")
	secretKey := os.Getenv("TENCENT_SECRET_KEY")
	bucket := os.Getenv("TENCENT_COS_BUCKET")
	region := os.Getenv("TENCENT_COS_REGION")
	if region == "" {
		region = os.Getenv("TENCENT_REGION")
	}

	if secretID == "" || secretKey == "" {
		return nil, fmt.Errorf("missing TENCENT_SECRET_ID or TENCENT_SECRET_KEY environment variables")
	}
	if bucket == "" {
		return nil, fmt.Errorf("missing TENCENT_COS_BUCKET environment variable")
	}
	if region == "" {
		region = "ap-guangzhou"
	}

	// Decode base64 image
	imageBytes, err := base64.StdEncoding.DecodeString(imageBase64)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64 image: %w", err)
	}

	// Generate a unique object key for temporary storage
	objectKey := fmt.Sprintf("tmp/matting_%d.jpg", time.Now().UnixNano())
	host := fmt.Sprintf("%s.cos.%s.myqcloud.com", bucket, region)

	// Step 1: Upload image to COS
	err = cosUpload(secretID, secretKey, host, objectKey, imageBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to upload image to COS: %w", err)
	}

	// Step 2: Download with matting processing
	ciProcess := getCIProcess(mode)
	resultBytes, err := cosGetWithMatting(secretID, secretKey, host, objectKey, ciProcess)
	if err != nil {
		// Clean up: delete the temp object
		_ = cosDelete(secretID, secretKey, host, objectKey)
		return nil, fmt.Errorf("failed to process image with %s: %w", ciProcess, err)
	}

	// Step 3: Clean up - delete the temp object
	_ = cosDelete(secretID, secretKey, host, objectKey)

	// Convert result to base64
	resultBase64 := base64.StdEncoding.EncodeToString(resultBytes)

	return &RemoveBackgroundResult{
		ResultImage:   resultBase64,
		HasForeground: len(resultBytes) > 0,
	}, nil
}

// cosUpload uploads data to COS using PUT request
func cosUpload(secretID, secretKey, host, objectKey string, data []byte) error {
	urlStr := fmt.Sprintf("https://%s/%s", host, objectKey)

	req, err := http.NewRequest("PUT", urlStr, strings.NewReader(string(data)))
	if err != nil {
		return err
	}

	// Detect content type
	contentType := http.DetectContentType(data)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Host", host)

	// Generate COS signature
	auth := cosSign(secretID, secretKey, "put", "/"+objectKey, nil, map[string]string{
		"content-type": contentType,
		"host":         host,
	}, 600)
	req.Header.Set("Authorization", auth)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("upload request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// cosGetWithMatting downloads image from COS with matting processing
func cosGetWithMatting(secretID, secretKey, host, objectKey, ciProcess string) ([]byte, error) {
	params := url.Values{}
	params.Set("ci-process", ciProcess)

	urlStr := fmt.Sprintf("https://%s/%s?%s", host, objectKey, params.Encode())

	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Host", host)

	// Generate COS signature - include ci-process in url params
	auth := cosSign(secretID, secretKey, "get", "/"+objectKey, map[string]string{
		"ci-process": ciProcess,
	}, map[string]string{
		"host": host,
	}, 600)
	req.Header.Set("Authorization", auth)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("matting request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read matting response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("matting failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Check if it's actually an image (not an error XML response)
	ct := resp.Header.Get("Content-Type")
	if strings.Contains(ct, "xml") || strings.Contains(ct, "json") {
		return nil, fmt.Errorf("matting returned error: %s", string(body))
	}

	return body, nil
}

// cosDelete deletes an object from COS
func cosDelete(secretID, secretKey, host, objectKey string) error {
	urlStr := fmt.Sprintf("https://%s/%s", host, objectKey)

	req, err := http.NewRequest("DELETE", urlStr, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Host", host)

	auth := cosSign(secretID, secretKey, "delete", "/"+objectKey, nil, map[string]string{
		"host": host,
	}, 600)
	req.Header.Set("Authorization", auth)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

// cosSign generates COS API authorization signature
// Uses HMAC-SHA1 algorithm as per: https://cloud.tencent.com/document/product/436/7778
func cosSign(secretID, secretKey, httpMethod, uriPathname string, urlParams, headers map[string]string, expireSeconds int64) string {
	now := time.Now().Unix()
	keyTime := fmt.Sprintf("%d;%d", now, now+expireSeconds)

	// Step 1: Generate SignKey
	signKey := hmacSHA1Hex(secretKey, keyTime)

	// Step 2: Build sorted parameter and header lists
	urlParamList, httpParameters := buildSortedKV(urlParams)
	headerList, httpHeaders := buildSortedKV(headers)

	// Step 3: Build HttpString
	httpString := strings.Join([]string{
		httpMethod,
		uriPathname,
		httpParameters,
		httpHeaders,
		"",
	}, "\n")

	// Step 4: Build StringToSign
	stringToSign := strings.Join([]string{
		"sha1",
		keyTime,
		sha1Hex(httpString),
		"",
	}, "\n")

	// Step 5: Generate Signature
	signature := hmacSHA1Hex(signKey, stringToSign)

	// Step 6: Build Authorization string
	authorization := fmt.Sprintf(
		"q-sign-algorithm=sha1&q-ak=%s&q-sign-time=%s&q-key-time=%s&q-header-list=%s&q-url-param-list=%s&q-signature=%s",
		secretID, keyTime, keyTime, headerList, urlParamList, signature,
	)

	return authorization
}

// buildSortedKV builds sorted key list and key=value string for COS signature
func buildSortedKV(params map[string]string) (string, string) {
	if len(params) == 0 {
		return "", ""
	}

	// Collect and sort keys
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, strings.ToLower(k))
	}
	// Simple sort
	for i := 0; i < len(keys); i++ {
		for j := i + 1; j < len(keys); j++ {
			if keys[i] > keys[j] {
				keys[i], keys[j] = keys[j], keys[i]
			}
		}
	}

	// Build key=value pairs in sorted order
	kvPairs := make([]string, 0, len(keys))
	for _, k := range keys {
		// Find original key (case-insensitive)
		for origK, v := range params {
			if strings.ToLower(origK) == k {
				kvPairs = append(kvPairs, fmt.Sprintf("%s=%s",
					url.QueryEscape(k),
					url.QueryEscape(v),
				))
				break
			}
		}
	}

	keyList := strings.Join(keys, ";")
	kvString := strings.Join(kvPairs, "&")

	return keyList, kvString
}

func sha1Hex(s string) string {
	h := sha1.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}

func hmacSHA1Hex(key, data string) string {
	h := hmac.New(sha1.New, []byte(key))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

// --- Legacy BDA API (SegmentPortraitPic) - kept as fallback ---

// RemoveBackground calls Tencent Cloud SegmentPortraitPic API (人像分割 only)
func RemoveBackground(imageBase64 string) (*RemoveBackgroundResult, error) {
	secretID := os.Getenv("TENCENT_SECRET_ID")
	secretKey := os.Getenv("TENCENT_SECRET_KEY")
	region := os.Getenv("TENCENT_REGION")

	if secretID == "" || secretKey == "" {
		return nil, fmt.Errorf("missing TENCENT_SECRET_ID or TENCENT_SECRET_KEY environment variables")
	}
	if region == "" {
		region = "ap-guangzhou"
	}

	payload := map[string]interface{}{
		"Image":      imageBase64,
		"RspImgType": "base64",
		"Scene":      "GEN",
	}

	resp, err := callAPI(secretID, secretKey, callAPIOptions{
		Service: "bda",
		Action:  "SegmentPortraitPic",
		Version: "2020-03-24",
		Region:  region,
		Payload: payload,
	})
	if err != nil {
		return nil, err
	}

	// Parse response
	responseData, ok := resp["Response"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected API response format")
	}

	// Check for errors
	if errData, ok := responseData["Error"].(map[string]interface{}); ok {
		code, _ := errData["Code"].(string)
		message, _ := errData["Message"].(string)
		return nil, fmt.Errorf("tencent Cloud API Error [%s]: %s", code, message)
	}

	resultImage, _ := responseData["ResultImage"].(string)
	hasForeground, _ := responseData["HasForeground"].(bool)

	return &RemoveBackgroundResult{
		ResultImage:   resultImage,
		HasForeground: hasForeground,
	}, nil
}

type callAPIOptions struct {
	Service string
	Action  string
	Version string
	Region  string
	Payload map[string]interface{}
}

func callAPI(secretID, secretKey string, opts callAPIOptions) (map[string]interface{}, error) {
	host := opts.Service + ".tencentcloudapi.com"
	endpoint := "https://" + host

	timestamp := time.Now().Unix()
	date := time.Unix(timestamp, 0).UTC().Format("2006-01-02")

	payloadBytes, err := json.Marshal(opts.Payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}
	payloadStr := string(payloadBytes)

	// Step 1: Build canonical request
	contentType := "application/json; charset=utf-8"
	canonicalHeaders := fmt.Sprintf("content-type:%s\nhost:%s\n", contentType, host)
	signedHeaders := "content-type;host"
	hashedPayload := sha256Hex(payloadStr)

	canonicalRequest := strings.Join([]string{
		"POST",
		"/",
		"",
		canonicalHeaders,
		signedHeaders,
		hashedPayload,
	}, "\n")

	// Step 2: Build string to sign
	algorithm := "TC3-HMAC-SHA256"
	credentialScope := fmt.Sprintf("%s/%s/tc3_request", date, opts.Service)
	hashedCanonicalRequest := sha256Hex(canonicalRequest)
	stringToSign := strings.Join([]string{
		algorithm,
		fmt.Sprintf("%d", timestamp),
		credentialScope,
		hashedCanonicalRequest,
	}, "\n")

	// Step 3: Calculate signature
	secretDate := hmacSHA256([]byte("TC3"+secretKey), date)
	secretService := hmacSHA256(secretDate, opts.Service)
	secretSigning := hmacSHA256(secretService, "tc3_request")
	signature := hex.EncodeToString(hmacSHA256(secretSigning, stringToSign))

	// Step 4: Build authorization header
	authorization := fmt.Sprintf(
		"%s Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		algorithm, secretID, credentialScope, signedHeaders, signature,
	)

	// Step 5: Send request
	req, err := http.NewRequest("POST", endpoint, strings.NewReader(payloadStr))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", authorization)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Host", host)
	req.Header.Set("X-TC-Action", opts.Action)
	req.Header.Set("X-TC-Version", opts.Version)
	req.Header.Set("X-TC-Timestamp", fmt.Sprintf("%d", timestamp))
	req.Header.Set("X-TC-Region", opts.Region)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return result, nil
}

func sha256Hex(s string) string {
	h := sha256.New()
	h.Write([]byte(s))
	return hex.EncodeToString(h.Sum(nil))
}

func hmacSHA256(key []byte, data string) []byte {
	h := hmac.New(sha256.New, key)
	h.Write([]byte(data))
	return h.Sum(nil)
}

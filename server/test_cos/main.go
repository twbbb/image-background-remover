package main

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

func main() {
	secretID := os.Getenv("TENCENT_SECRET_ID")
	secretKey := os.Getenv("TENCENT_SECRET_KEY")
	bucket := os.Getenv("TENCENT_COS_BUCKET")
	region := os.Getenv("TENCENT_REGION")

	if secretID == "" || secretKey == "" || bucket == "" {
		fmt.Println("Missing env vars")
		return
	}

	host := fmt.Sprintf("%s.cos.%s.myqcloud.com", bucket, region)
	objectKey := "tmp/test_upload.txt"
	data := []byte("hello world test")

	fmt.Printf("Host: %s\n", host)
	fmt.Printf("SecretID: %s...%s\n", secretID[:8], secretID[len(secretID)-4:])

	// Test 1: Upload
	fmt.Println("\n=== Test 1: PUT Upload ===")
	{
		urlStr := fmt.Sprintf("https://%s/%s", host, objectKey)
		req, _ := http.NewRequest("PUT", urlStr, strings.NewReader(string(data)))
		contentType := "text/plain"
		req.Header.Set("Content-Type", contentType)
		req.Header.Set("Host", host)

		auth := cosSign(secretID, secretKey, "put", "/"+objectKey, nil, map[string]string{
			"content-type": contentType,
			"host":         host,
		}, 600)
		req.Header.Set("Authorization", auth)

		fmt.Printf("URL: %s\n", urlStr)
		fmt.Printf("Auth: %s\n", auth[:80]+"...")

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			return
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("Status: %d\n", resp.StatusCode)
		if resp.StatusCode != 200 {
			fmt.Printf("Response: %s\n", string(body))
		} else {
			fmt.Println("Upload OK!")
		}
	}

	// Test 2: GET with AIPicMatting (will fail on text file, but shows auth works)
	fmt.Println("\n=== Test 2: GET Object ===")
	{
		urlStr := fmt.Sprintf("https://%s/%s", host, objectKey)
		req, _ := http.NewRequest("GET", urlStr, nil)
		req.Header.Set("Host", host)

		auth := cosSign(secretID, secretKey, "get", "/"+objectKey, nil, map[string]string{
			"host": host,
		}, 600)
		req.Header.Set("Authorization", auth)

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			return
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("Status: %d\n", resp.StatusCode)
		fmt.Printf("Content-Type: %s\n", resp.Header.Get("Content-Type"))
		fmt.Printf("Body: %s\n", string(body))
	}

	// Test 3: DELETE
	fmt.Println("\n=== Test 3: DELETE Object ===")
	{
		urlStr := fmt.Sprintf("https://%s/%s", host, objectKey)
		req, _ := http.NewRequest("DELETE", urlStr, nil)
		req.Header.Set("Host", host)

		auth := cosSign(secretID, secretKey, "delete", "/"+objectKey, nil, map[string]string{
			"host": host,
		}, 600)
		req.Header.Set("Authorization", auth)

		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			return
		}
		defer resp.Body.Close()

		fmt.Printf("Status: %d\n", resp.StatusCode)
		if resp.StatusCode == 204 || resp.StatusCode == 200 {
			fmt.Println("Delete OK!")
		} else {
			body, _ := io.ReadAll(resp.Body)
			fmt.Printf("Response: %s\n", string(body))
		}
	}
}

func cosSign(secretID, secretKey, httpMethod, uriPathname string, urlParams, headers map[string]string, expireSeconds int64) string {
	now := time.Now().Unix()
	keyTime := fmt.Sprintf("%d;%d", now, now+expireSeconds)

	signKey := hmacSHA1Hex(secretKey, keyTime)

	urlParamList, httpParameters := buildSortedKV(urlParams)
	headerList, httpHeaders := buildSortedKV(headers)

	httpString := strings.Join([]string{
		httpMethod,
		uriPathname,
		httpParameters,
		httpHeaders,
		"",
	}, "\n")

	stringToSign := strings.Join([]string{
		"sha1",
		keyTime,
		sha1Hex(httpString),
		"",
	}, "\n")

	signature := hmacSHA1Hex(signKey, stringToSign)

	authorization := fmt.Sprintf(
		"q-sign-algorithm=sha1&q-ak=%s&q-sign-time=%s&q-key-time=%s&q-header-list=%s&q-url-param-list=%s&q-signature=%s",
		secretID, keyTime, keyTime, headerList, urlParamList, signature,
	)

	return authorization
}

func buildSortedKV(params map[string]string) (string, string) {
	if len(params) == 0 {
		return "", ""
	}

	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, strings.ToLower(k))
	}
	for i := 0; i < len(keys); i++ {
		for j := i + 1; j < len(keys); j++ {
			if keys[i] > keys[j] {
				keys[i], keys[j] = keys[j], keys[i]
			}
		}
	}

	kvPairs := make([]string, 0, len(keys))
	for _, k := range keys {
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

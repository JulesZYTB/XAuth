package xauth

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

func getHWID() string {
	switch runtime.GOOS {
	case "windows":
		out, err := exec.Command("wmic", "csproduct", "get", "uuid").Output()
		if err == nil {
			lines := strings.Split(string(out), "\n")
			if len(lines) > 1 {
				return strings.TrimSpace(lines[1])
			}
		}
	case "linux":
		out, err := os.ReadFile("/etc/machine-id")
		if err == nil {
			return strings.TrimSpace(string(out))
		}
	case "darwin":
		out, err := exec.Command("sh", "-c", "ioreg -rd1 -c IOPlatformExpertDevice | awk '/IOPlatformUUID/ { print $3; }'").Output()
		if err == nil {
			return strings.TrimSpace(strings.ReplaceAll(string(out), "\"", ""))
		}
	}
	
	// Fallback
	host, _ := os.Hostname()
	return fmt.Sprintf("%x", sha256.Sum256([]byte(host)))
}

type XAuth struct {
	AppID     int
	AppSecret string
	BaseURL   string
	sessionID string
	nonce     string
}

type ValidationResult struct {
	Success   bool                   `json:"success"`
	Message   string                 `json:"message,omitempty"`
	Expiry    string                 `json:"expiry,omitempty"`
	Broadcast string                 `json:"broadcast,omitempty"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

func NewXAuth(appID int, appSecret string, baseURL string) *XAuth {
	if baseURL == "" {
		baseURL = "http://localhost:3310"
	}
	return &XAuth{
		AppID:     appID,
		AppSecret: appSecret,
		BaseURL:   strings.TrimRight(baseURL, "/"),
	}
}

func (x *XAuth) Initialize() error {
	payload, _ := json.Marshal(map[string]int{"app_id": x.AppID})
	
	resp, err := http.Post(x.BaseURL+"/api/v1/client/initialize", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("initialization failed with status: %d", resp.StatusCode)
	}

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return err
	}

	if sid, ok := data["session_id"].(string); ok {
		x.sessionID = sid
	}
	if n, ok := data["nonce"].(string); ok {
		x.nonce = n
	}

	return nil
}

func (x *XAuth) decryptResponse(encryptedData string) (map[string]interface{}, error) {
	parts := strings.Split(encryptedData, ":")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid format")
	}

	iv, _ := base64.StdEncoding.DecodeString(parts[0])
	tag, _ := base64.StdEncoding.DecodeString(parts[1])
	ciphertext, _ := base64.StdEncoding.DecodeString(parts[2])

	rawKey := []byte(x.AppSecret + x.nonce)
	hash := sha256.Sum256(rawKey)

	block, err := aes.NewCipher(hash[:])
	if err != nil {
		return nil, err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	// GCM expects ciphertext + tag
	ciphertextWithTag := append(ciphertext, tag...)
	plaintext, err := aesGCM.Open(nil, iv, ciphertextWithTag, nil)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(plaintext, &result); err != nil {
		return nil, err
	}

	return result, nil
}

func (x *XAuth) ValidateLicense(licenseKey string) *ValidationResult {
	if x.sessionID == "" || x.nonce == "" {
		if err := x.Initialize(); err != nil {
			return &ValidationResult{Success: false, Message: "Initialization failed: " + err.Error()}
		}
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"license_key": licenseKey,
		"hwid":        getHWID(),
		"app_secret":  x.AppSecret,
		"session_id":  x.sessionID,
	})

	resp, err := http.Post(x.BaseURL+"/api/v1/client/validate", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return &ValidationResult{Success: false, Message: "Network error: " + err.Error()}
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		var data map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&data)
		
		if encryptedPayload, ok := data["data"].(string); ok {
			decrypted, err := x.decryptResponse(encryptedPayload)
			if err == nil {
				if status, ok := decrypted["status"].(string); ok && status == "success" {
					res := &ValidationResult{Success: true}
					if expiry, ok := decrypted["expiry"].(string); ok {
						res.Expiry = expiry
					}
					if broadcast, ok := decrypted["broadcast"].(string); ok {
						res.Broadcast = broadcast
					}
					if variables, ok := decrypted["variables"].(map[string]interface{}); ok {
						res.Variables = variables
					}
					return res
				}
			}
		}
		return &ValidationResult{Success: false, Message: "Failed to verify secure response."}
	}

	bodyBytes, _ := io.ReadAll(resp.Body)
	var errData map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &errData); err == nil {
		if msg, ok := errData["message"].(string); ok {
			return &ValidationResult{Success: false, Message: msg}
		}
	}
	return &ValidationResult{Success: false, Message: string(bodyBytes)}
}

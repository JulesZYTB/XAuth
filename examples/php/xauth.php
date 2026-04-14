<?php

/**
 * XAuth Client SDK for PHP
 */
class XAuth {
    private $appId;
    private $appSecret;
    private $baseUrl;
    private $sessionId;
    private $nonce;

    public function __construct($appId, $appSecret, $baseUrl = "http://localhost:3310") {
        $this->appId = $appId;
        $this->appSecret = $appSecret;
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    private function getHwid() {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            @exec('wmic csproduct get uuid', $output);
            if (isset($output[1])) return trim($output[1]);
        } elseif (PHP_OS === 'Linux') {
            if (file_exists('/etc/machine-id')) {
                return trim(file_get_contents('/etc/machine-id'));
            }
        } elseif (PHP_OS === 'Darwin') {
            @exec("ioreg -rd1 -c IOPlatformExpertDevice | awk '/IOPlatformUUID/ { print $3; }'", $output);
            if (isset($output[0])) return trim(str_replace('"', '', $output[0]));
        }
        return hash('sha256', gethostname() . get_current_user());
    }

    private function request($endpoint, $payload) {
        $ch = curl_init($this->baseUrl . $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return ['status' => $httpCode, 'body' => $response];
    }

    public function initialize() {
        $res = $this->request("/api/v1/client/initialize", ["app_id" => $this->appId]);
        
        if ($res['status'] == 200) {
            $data = json_decode($res['body'], true);
            $this->sessionId = $data['session_id'];
            $this->nonce = $data['nonce'];
            return ['success' => true];
        }
        return ['success' => false, 'message' => $res['body']];
    }

    private function decryptResponse($encryptedData) {
        try {
            $parts = explode(":", $encryptedData);
            if (count($parts) != 3) return null;
            
            $iv = base64_decode($parts[0]);
            $tag = base64_decode($parts[1]);
            $ciphertext = base64_decode($parts[2]);

            $rawKey = $this->appSecret . $this->nonce;
            $key = hash('sha256', $rawKey, true);

            $decrypted = openssl_decrypt(
                $ciphertext,
                'aes-256-gcm',
                $key,
                OPENSSL_RAW_DATA,
                $iv,
                $tag
            );

            if ($decrypted === false) return null;
            return json_decode($decrypted, true);
        } catch (Exception $e) {
            return null;
        }
    }

    public function validateLicense($licenseKey) {
        if (!$this->sessionId || !$this->nonce) {
            $init = $this->initialize();
            if (!$init['success']) {
                return ['success' => false, 'message' => 'Initialization failed: ' . $init['message']];
            }
        }

        $res = $this->request("/api/v1/client/validate", [
            "license_key" => $licenseKey,
            "hwid" => $this->getHwid(),
            "app_secret" => $this->appSecret,
            "session_id" => $this->sessionId
        ]);

        if ($res['status'] == 200) {
            $data = json_decode($res['body'], true);
            $decryptedData = $this->decryptResponse($data['data']);
            
            if ($decryptedData && isset($decryptedData['status']) && $decryptedData['status'] === 'success') {
                return [
                    'success' => true,
                    'expiry' => $decryptedData['expiry'] ?? null,
                    'broadcast' => $decryptedData['broadcast'] ?? null,
                    'variables' => $decryptedData['variables'] ?? []
                ];
            }
            return ['success' => false, 'message' => 'Failed to verify secure response.'];
        } else {
            $errData = json_decode($res['body'], true);
            return [
                'success' => false, 
                'message' => $errData['message'] ?? 'Validation rejected'
            ];
        }
    }
}

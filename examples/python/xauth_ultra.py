import requests
import json
import uuid
import base64
import hashlib
from Crypto.Cipher import AES

class XAuthUltra:
    def __init__(self, app_secret, base_url="http://localhost:3310"):
        self.app_secret = app_secret
        self.base_url = base_url
        # Key must be 32 bytes (SHA-256 of the secret)
        self.key = hashlib.sha256(app_secret.encode()).digest()

    def decrypt_response(self, encrypted_data):
        try:
            # Format from server: IV:AuthTag:EncryptedData (all base64)
            iv_b64, tag_b64, data_b64 = encrypted_data.split(":")
            
            iv = base64.b64decode(iv_b64)
            tag = base64.b64decode(tag_b64)
            ciphertext = base64.b64decode(data_b64)
            
            cipher = AES.new(self.key, AES.MODE_GCM, nonce=iv)
            decrypted = cipher.decrypt_and_verify(ciphertext, tag)
            
            return json.loads(decrypted.decode('utf-8'))
        except Exception as e:
            print(f"[XAuth] Decryption Error: {e}")
            return None

    def validate_license(self, license_key):
        hwid = str(uuid.getnode())

        payload = {
            "license_key": license_key,
            "hwid": hwid,
            "app_secret": self.app_secret
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/v1/client/validate",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                # Server returns { data: "encrypted_string" }
                encrypted_payload = data.get("data")
                
                decrypted_data = self.decrypt_response(encrypted_payload)
                if decrypted_data and decrypted_data.get("status") == "success":
                    print(f"[XAuth] Secure validation successful!")
                    print(f"[XAuth] Expiry: {decrypted_data.get('expiry')}")
                    return True
                else:
                    print("[XAuth] Failed to verify secure response.")
                    return False
            else:
                error_data = response.json()
                print(f"[XAuth] Request Failed: {error_data.get('message', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"[XAuth] Network Error: {e}")
            return False

if __name__ == "__main__":
    print("--- XAuth Ultra Secure Client ---")
    SECRET = "REPLACE_WITH_YOUR_SECRET"
    
    auth = XAuthUltra(SECRET)
    
    key = input("Enter License Key: ")
    if auth.validate_license(key):
        print("Welcome, authenticated user.")
    else:
        print("Access denied. Please check your license.")

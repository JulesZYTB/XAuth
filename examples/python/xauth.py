import requests
import json
import uuid
import base64
import hashlib
import subprocess
import platform
from Crypto.Cipher import AES

def get_hwid():
    """Generates a reliable hardware ID (cross-platform)"""
    try:
        if platform.system() == "Windows":
            output = subprocess.check_output('wmic csproduct get uuid', shell=True).decode()
            return output.split('\n')[1].strip()
        elif platform.system() == "Linux":
            with open("/etc/machine-id", "r") as f:
                return f.read().strip()
        elif platform.system() == "Darwin":
            output = subprocess.check_output("ioreg -rd1 -c IOPlatformExpertDevice | awk '/IOPlatformUUID/ { print $3; }'", shell=True).decode()
            return output.strip().strip('"')
    except Exception:
        pass
    # Fallback to mac address if all else fails
    return str(uuid.getnode())


class XAuthUltra:
    def __init__(self, app_id, app_secret, base_url="http://localhost:3310"):
        self.app_id = app_id
        self.app_secret = app_secret
        self.base_url = base_url
        self.session_id = None
        self.nonce = None

    def initialize(self):
        """Step 1: Initialize the session to get a nonce"""
        payload = {"app_id": self.app_id}
        try:
            response = requests.post(f"{self.base_url}/api/v1/client/initialize", json=payload)
            if response.status_code == 200:
                data = response.json()
                self.session_id = data.get("session_id")
                self.nonce = data.get("nonce")
                return True
            else:
                print(f"[XAuth] Initialize Failed: {response.text}")
                return False
        except Exception as e:
            print(f"[XAuth] Network Error (Init): {e}")
            return False

    def decrypt_response(self, encrypted_data):
        try:
            # Format from server: IV:AuthTag:EncryptedData (all base64)
            iv_b64, tag_b64, data_b64 = encrypted_data.split(":")
            
            iv = base64.b64decode(iv_b64)
            tag = base64.b64decode(tag_b64)
            ciphertext = base64.b64decode(data_b64)
            
            # The session nonce is appended to the secret to form the true encryption key
            raw_key = (self.app_secret + self.nonce).encode('utf-8')
            key = hashlib.sha256(raw_key).digest()

            cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
            decrypted = cipher.decrypt_and_verify(ciphertext, tag)
            
            return json.loads(decrypted.decode('utf-8'))
        except Exception as e:
            print(f"[XAuth] Decryption Error: {e}")
            return None

    def validate_license(self, license_key):
        # Ensure session is initialized
        if not self.session_id or not self.nonce:
            if not self.initialize():
                return False

        hwid = get_hwid()

        payload = {
            "license_key": license_key,
            "hwid": hwid,
            "app_secret": self.app_secret,
            "session_id": self.session_id
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
                    print(f"[XAuth] Broadcast: {decrypted_data.get('broadcast')}")
                    return True
                else:
                    print("[XAuth] Failed to verify secure response.")
                    return False
            else:
                try:
                    error_data = response.json()
                    print(f"[XAuth] Request Failed: {error_data.get('message', 'Unknown error')}")
                except Exception:
                    print(f"[XAuth] Request Failed: {response.text}")
                return False
        except Exception as e:
            print(f"[XAuth] Network Error (Validation): {e}")
            return False

if __name__ == "__main__":
    print("--- XAuth Ultra Secure Client ---")
    APP_ID = 1  # Replace with actual App ID
    SECRET = "REPLACE_WITH_YOUR_SECRET"
    LICENSE_KEY = "REPLACE_WITH_LICENSE_KEY" # No more input(), hardcoded or arguments

    auth = XAuthUltra(app_id=APP_ID, app_secret=SECRET)
    
    if auth.validate_license(LICENSE_KEY):
        print("Welcome, authenticated user.")
    else:
        print("Access denied. Please check your license.")

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


class XAuth:
    """XAuth Client SDK for Python"""
    def __init__(self, app_id, app_secret, base_url="http://localhost:3310"):
        self.app_id = app_id
        self.app_secret = app_secret
        self.base_url = base_url.rstrip("/")
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
                return True, "Session initialized"
            return False, response.text
        except Exception as e:
            return False, str(e)

    def _decrypt_response(self, encrypted_data):
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
        except Exception:
            return None

    def validate_license(self, license_key):
        """
        Validates the license key against the XAuth Omega Infrastructure.
        Returns a dict: {'success': bool, 'message'?: str, 'expiry'?: str, 'broadcast'?: str, 'variables'?: dict}
        """
        # Ensure session is initialized
        if not self.session_id or not self.nonce:
            success, msg = self.initialize()
            if not success:
                return {"success": False, "message": f"Initialization failed: {msg}"}

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
                
                decrypted_data = self._decrypt_response(encrypted_payload)
                if decrypted_data and decrypted_data.get("status") == "success":
                    return {
                        "success": True,
                        "expiry": decrypted_data.get("expiry"),
                        "broadcast": decrypted_data.get("broadcast"),
                        "variables": decrypted_data.get("variables", {})
                    }
                else:
                    return {"success": False, "message": "Failed to verify secure response."}
            else:
                try:
                    error_data = response.json()
                    return {"success": False, "message": error_data.get("message", "Validation rejected")}
                except Exception:
                    return {"success": False, "message": response.text}
        except Exception as e:
            return {"success": False, "message": f"Network Error: {str(e)}"}

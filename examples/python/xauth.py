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

    def check_version(self, current_version=None, channel="stable"):
        """
        Securely checks for application updates.
        Returns a dict: {'success': bool, 'version'?: str, 'update_available'?: bool, ...}
        """
        payload = {
            "app_id": self.app_id,
            "app_secret": self.app_secret,
            "channel": channel,
            "current_version": current_version
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/v1/client/verify-version",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "version": data.get("version"),
                    "channel": data.get("channel"),
                    "url": data.get("url"),
                    "checksum": data.get("checksum"),
                    "published_at": data.get("published_at"),
                    "update_available": data.get("update_available"),
                    "broadcast": data.get("broadcast")
                }
            else:
                try:
                    error_data = response.json()
                    return {"success": False, "message": error_data.get("message", "Version check failed")}
                except Exception:
                    return {"success": False, "message": response.text}
        except Exception as e:
            return {"success": False, "message": f"Network Error: {str(e)}"}

    def get_latest_release(self, channel="stable"):
        """
        Publicly checks for the latest application release without a secret.
        Returns a dict: {'success': bool, 'version'?: str, ...}
        """
        try:
            response = requests.get(f"{self.base_url}/api/update/{self.app_id}/{channel}")
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "version": data.get("version"),
                    "channel": data.get("channel"),
                    "url": data.get("url"),
                    "checksum": data.get("checksum"),
                    "published_at": data.get("published_at")
                }
            return {"success": False, "message": response.text}
        except Exception as e:
            return {"success": False, "message": str(e)}


# Example Usage
if __name__ == "__main__":
    # Initialize XAuth
    # In production, use your actual App ID and Secret Key
    auth = XAuth(app_id=1, app_secret="your_app_secret_here")

    print("--- XAuth Omega Python SDK Demo ---")

    # 1. Public Update Check (GET)
    print("\n[1] Checking for updates (Public)...")
    release = auth.get_latest_release(channel="stable")
    if release["success"]:
        print(f"Latest Version: {release['version']} ({release['channel']})")
        print(f"Download URL: {release['url']}")
    else:
        print(f"Update check failed: {release['message']}")

    # 2. Secure Version Verification (POST)
    print("\n[2] Verifying local version (Secure)...")
    ver = auth.check_version(current_version="1.0.0", channel="stable")
    if ver["success"]:
        if ver["update_available"]:
            print(f"A new version {ver['version']} is available!")
        else:
            print("You are running the latest version.")
        
        if ver["broadcast"]:
            print(f"Server Message: {ver['broadcast']}")
    else:
        print(f"Secure check failed: {ver['message']}")

    # 3. License Validation
    print("\n[3] Validating license...")
    license_key = "XXXX-XXXX-XXXX-XXXX" # Replace with a real key
    result = auth.validate_license(license_key)
    
    if result["success"]:
        print(f"License Valid! Expires: {result['expiry']}")
        if result["broadcast"]:
            print(f"Broadcast: {result['broadcast']}")
        print(f"Variables: {result['variables']}")
    else:
        print(f"Validation failed: {result['message']}")

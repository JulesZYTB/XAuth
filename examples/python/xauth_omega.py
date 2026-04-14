import requests
import json
import uuid
import base64
import hashlib
import time
from Crypto.Cipher import AES

class XAuthOmega:
    """
    XAuth Omega SDK v3.0 - Zero-Trust Enterprise Edition
    Features: 2-Step Handshake, Session Nonces, AES-256-GCM Secure Channel.
    """
    def __init__(self, app_id, app_secret, base_url="http://localhost:3310"):
        self.app_id = app_id
        self.app_secret = app_secret
        self.base_url = base_url
        self.session_id = None
        self.nonce = None

    def _get_encryption_key(self):
        """Derives the session encryption key: SHA256(APP_SECRET + SESSION_NONCE)"""
        if not self.nonce:
            raise ValueError("Session not initialized. Call initialize() first.")
        combined = self.app_secret + self.nonce
        return hashlib.sha256(combined.encode()).digest()

    def initialize(self):
        """Step 1: Handshake - Get Session ID and Nonce from server"""
        print("[Omega] Initializing secure handshake...")
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/client/initialize",
                json={"app_id": self.app_id}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.session_id = data.get("session_id")
                self.nonce = data.get("nonce")
                print(f"[Omega] Handshake Success. Session: {self.session_id[:8]}...")
                return True
            else:
                print(f"[Omega] Handshake Failed: {response.text}")
                return False
        except Exception as e:
            print(f"[Omega] Connection Error during Init: {e}")
            return False

    def decrypt_response(self, encrypted_data):
        """Step 2b: Decrypt server response using derived session key"""
        try:
            encryption_key = self._get_encryption_key()
            
            # Format: IV:AuthTag:Ciphertext
            iv_b64, tag_b64, data_b64 = encrypted_data.split(":")
            
            iv = base64.b64decode(iv_b64)
            tag = base64.b64decode(tag_b64)
            ciphertext = base64.b64decode(data_b64)
            
            cipher = AES.new(encryption_key, AES.MODE_GCM, nonce=iv)
            decrypted = cipher.decrypt_and_verify(ciphertext, tag)
            
            return json.loads(decrypted.decode('utf-8'))
        except Exception as e:
            print(f"[Omega] Decryption Failed: {e}")
            return None

    def validate(self, license_key):
        """Step 2: Validation - Perform encrypted validation with session ID"""
        if not self.session_id:
            if not self.initialize():
                return False

        hwid = str(uuid.getnode())
        
        payload = {
            "license_key": license_key,
            "hwid": hwid,
            "app_secret": self.app_secret,
            "session_id": self.session_id
        }

        try:
            print("[Omega] Sending encrypted validation request...")
            response = requests.post(
                f"{self.base_url}/api/v1/client/validate",
                json=payload
            )
            
            if response.status_code == 200:
                encrypted_payload = response.json().get("data")
                data = self.decrypt_response(encrypted_payload)
                
                if data and data.get("status") == "success":
                    print("\n" + "="*40)
                    print(f" AUTHENTICATION SUCCESSFUL")
                    print("="*40)
                    print(f" License Expiry : {data.get('expiry')}")
                    print(f" Broadcast      : {data.get('broadcast')}")
                    
                    vars = data.get("variables", {})
                    if vars:
                        print(" User Variables  :")
                        for k, v in vars.items():
                            print(f"   - {k}: {v}")
                    print("="*40 + "\n")
                    return True
            else:
                print(f"[Omega] Validation Denied: {response.json().get('message')}")
                return False
        except Exception as e:
            print(f"[Omega] Security alert or network error: {e}")
            return False

if __name__ == "__main__":
    # Example usage for XAuth Omega
    APP_ID = 1 # Replace with your App ID from dashboard
    SECRET = "REPLACE_WITH_YOUR_SECRET"
    
    auth = XAuthOmega(APP_ID, SECRET)
    
    key = input("Enter Omega License Key: ")
    if auth.validate(key):
        print("Success: Access granted to protected modules.")
    else:
        print("Failure: Access restricted.")

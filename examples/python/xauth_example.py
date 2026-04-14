import requests
import json
import uuid

class XAuth:
    def __init__(self, app_secret, base_url="http://localhost:3310"):
        self.app_secret = app_secret
        self.base_url = base_url

    def validate_license(self, license_key):
        # Generate HWID (Simple version using UUID)
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
                print(f"[XAuth] Success! License valid until: {data['expiry']}")
                return True
            else:
                error_data = response.json()
                print(f"[XAuth] Validation Failed: {error_data.get('message', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"[XAuth] Error connecting to server: {e}")
            return False

if __name__ == "__main__":
    # Example usage
    # Replace with your actual App Secret from the dashboard
    APP_SECRET = "REPLACE_WITH_YOUR_SECRET"
    
    auth = XAuth(APP_SECRET)
    
    key = input("Enter your License Key: ")
    if auth.validate_license(key):
        print("Welcome to XAuth Protected Software!")
    else:
        print("Access Denied.")

const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');

function getHwid() {
    try {
        if (os.platform() === 'win32') {
            return execSync('wmic csproduct get uuid', { encoding: 'utf8' }).split('\n')[1].trim();
        } else if (os.platform() === 'linux') {
            return require('fs').readFileSync('/etc/machine-id', 'utf8').trim();
        } else if (os.platform() === 'darwin') {
            const output = execSync("ioreg -rd1 -c IOPlatformExpertDevice | awk '/IOPlatformUUID/ { print $3; }'", { encoding: 'utf8' });
            return output.replace(/"/g, '').trim();
        }
    } catch (e) {
        // Fallback
    }
    
    // Fallback to mac address or hostname hash
    const hash = crypto.createHash('sha256');
    hash.update(os.hostname() + os.userInfo().username);
    return hash.digest('hex');
}

class XAuth {
    constructor(appId, appSecret, baseUrl = "http://localhost:3310") {
        this.appId = appId;
        this.appSecret = appSecret;
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.sessionId = null;
        this.nonce = null;
    }

    async initialize() {
        try {
            const res = await fetch(`${this.baseUrl}/api/v1/client/initialize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ app_id: this.appId })
            });

            if (res.ok) {
                const data = await res.json();
                this.sessionId = data.session_id;
                this.nonce = data.nonce;
                return { success: true };
            }
            return { success: false, message: await res.text() };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    _decryptResponse(encryptedData) {
        try {
            const [ivB64, tagB64, dataB64] = encryptedData.split(":");
            
            const iv = Buffer.from(ivB64, 'base64');
            const tag = Buffer.from(tagB64, 'base64');
            const ciphertext = Buffer.from(dataB64, 'base64');

            const rawKey = Buffer.from(this.appSecret + this.nonce, 'utf-8');
            const key = crypto.createHash('sha256').update(rawKey).digest();

            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(ciphertext);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            return JSON.parse(decrypted.toString('utf-8'));
        } catch (e) {
            return null;
        }
    }

    async validateLicense(licenseKey) {
        if (!this.sessionId || !this.nonce) {
            const init = await this.initialize();
            if (!init.success) {
                return { success: false, message: `Initialization failed: ${init.message}` };
            }
        }

        const hwid = getHwid();
        
        try {
            const res = await fetch(`${this.baseUrl}/api/v1/client/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    license_key: licenseKey,
                    hwid: hwid,
                    app_secret: this.appSecret,
                    session_id: this.sessionId
                })
            });

            if (res.ok) {
                const body = await res.json();
                const decryptedData = this._decryptResponse(body.data);
                
                if (decryptedData && decryptedData.status === "success") {
                    return {
                        success: true,
                        expiry: decryptedData.expiry,
                        broadcast: decryptedData.broadcast,
                        variables: decryptedData.variables || {}
                    };
                }
                return { success: false, message: "Failed to verify secure response." };
            } else {
                try {
                    const errBody = await res.json();
                    return { success: false, message: errBody.message || "Validation rejected" };
                } catch {
                    return { success: false, message: await res.text() };
                }
            }
        } catch (e) {
            return { success: false, message: `Network error: ${e.message}` };
        }
    }

    async checkVersion(currentVersion, channel = "stable") {
        try {
            const res = await fetch(`${this.baseUrl}/api/v1/client/verify-version`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    app_id: this.appId,
                    app_secret: this.appSecret,
                    channel: channel,
                    current_version: currentVersion
                })
            });

            if (res.ok) {
                const data = await res.json();
                return {
                    success: true,
                    version: data.version,
                    channel: data.channel,
                    url: data.url,
                    checksum: data.checksum,
                    publishedAt: data.published_at,
                    updateAvailable: data.update_available,
                    broadcast: data.broadcast
                };
            } else {
                try {
                    const errBody = await res.json();
                    return { success: false, message: errBody.message || "Version check failed" };
                } catch {
                    return { success: false, message: await res.text() };
                }
            }
        } catch (e) {
            return { success: false, message: `Network error: ${e.message}` };
        }
    }

    async getLatestRelease(channel = "stable") {
        try {
            const res = await fetch(`${this.baseUrl}/api/update/${this.appId}/${channel}`);
            if (res.ok) {
                const data = await res.json();
                return {
                    success: true,
                    version: data.version,
                    channel: data.channel,
                    url: data.url,
                    checksum: data.checksum,
                    publishedAt: data.published_at
                };
            }
            return { success: false, message: await res.text() };
        } catch (e) {
            return { success: false, message: e.message };
        }
    }
}

// Example Usage
if (require.main === module) {
    (async () => {
        const auth = new XAuth(1, "your_app_secret_here");

        console.log("--- XAuth Omega Node.js JS SDK Demo ---");

        // 1. Public Update Check
        console.log("\n[1] Checking for updates (Public)...");
        const release = await auth.getLatestRelease();
        if (release.success) {
            console.log(`Latest Version: ${release.version} (${release.channel})`);
        }

        // 2. Secure Check
        console.log("\n[2] Verifying version (Secure)...");
        const ver = await auth.checkVersion("1.0.0");
        if (ver.success) {
            console.log(ver.updateAvailable ? "Update available!" : "Up to date.");
        }

        // 3. License Validation
        console.log("\n[3] Validating license...");
        const result = await auth.validateLicense("XXXX-XXXX-XXXX-XXXX");
        console.log(result.success ? `Valid! Expiry: ${result.expiry}` : `Failed: ${result.message}`);
    })();
}

module.exports = XAuth;

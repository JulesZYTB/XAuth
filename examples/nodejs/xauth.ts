import * as crypto from 'crypto';
import * as os from 'os';
import { execSync } from 'child_process';

function getHwid(): string {
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
    
    const hash = crypto.createHash('sha256');
    hash.update(os.hostname() + os.userInfo().username);
    return hash.digest('hex');
}

export interface XAuthValidationResult {
    success: boolean;
    message?: string;
    expiry?: string;
    broadcast?: string;
    variables?: Record<string, any>;
}

export class XAuth {
    private appId: number;
    private appSecret: string;
    private baseUrl: string;
    private sessionId: string | null = null;
    private nonce: string | null = null;

    constructor(appId: number, appSecret: string, baseUrl: string = "http://localhost:3310") {
        this.appId = appId;
        this.appSecret = appSecret;
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    private async initialize(): Promise<{ success: boolean; message?: string }> {
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
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    }

    private _decryptResponse(encryptedData: string): any {
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

    async validateLicense(licenseKey: string): Promise<XAuthValidationResult> {
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
        } catch (e: any) {
            return { success: false, message: `Network error: ${e.message}` };
        }
    }
}

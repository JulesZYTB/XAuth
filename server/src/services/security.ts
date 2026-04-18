import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

class SecurityService {
  /**
   * Deterministic SHA-256 hash for fast lookups.
   */
  hash(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex");
  }

  /**
   * Encrypts a payload using AES-256-GCM.
   * Returns a base64 string containing IV + AuthTag + Ciphertext.
   */
  encrypt(text: string, key: string): string {
    // Ensure key is 32 bytes (SHA-256 hash of the secret)
    const secretKey = crypto.createHash("sha256").update(key).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, secretKey, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Format: IV:AuthTag:EncryptedData
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  }

  /**
   * Decrypts a payload encrypted with the above method.
   */
  decrypt(data: string, key: string): string {
    const secretKey = crypto.createHash("sha256").update(key).digest();
    const [ivBase64, authTagBase64, encryptedBase64] = data.split(":");

    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedBase64, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Generates a HMAC signature for a request payload.
   */
  sign(payload: string, key: string): string {
    return crypto.createHmac("sha256", key).update(payload).digest("hex");
  }

  /**
   * Verifies a HMAC signature.
   */
  /**
   * DB Encryption: Uses a fixed system key for encrypting sensitive fields.
   */
  dbEncrypt(text: string): string {
    const dbKey = process.env.DB_ENCRYPTION_KEY || "omega_system_default_key_32bytes_";
    return this.encrypt(text, dbKey);
  }

  dbDecrypt(encrypted: string): string {
    const dbKey = process.env.DB_ENCRYPTION_KEY || "omega_system_default_key_32bytes_";
    return this.decrypt(encrypted, dbKey);
  }

  /**
   * Session Cryptography
   */
  generateSessionNonce(): string {
    return crypto.randomBytes(16).toString("hex");
  }
}

export default new SecurityService();


import dns from "node:dns";
import { promisify } from "node:util";

const resolveMx = promisify(dns.resolveMx);

class MailServerService {
  /**
   * Verifies if the domain of the given email has valid MX records.
   * @param email The email address to verify
   * @returns Promise<boolean> True if MX records are found, false otherwise.
   */
  async checkMailServer(email: string): Promise<boolean> {
    try {
      const domain = email.split("@")[1];
      if (!domain) return false;

      const records = await resolveMx(domain);
      return records && records.length > 0;
    } catch (err: any) {
      // If domain doesn't exist or has no MX records, resolution fails
      if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
        return false;
      }
      // Log other DNS issues but fail conservatively
      console.warn(`DNS resolution error for domain: ${email.split("@")[1]}`, err);
      return false;
    }
  }
}

export default new MailServerService();

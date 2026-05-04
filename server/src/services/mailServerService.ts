import dns from "node:dns";
import { promisify } from "node:util";
import axios from "axios";

const resolveMx = promisify(dns.resolveMx);

class MailServerService {
  private readonly USERCHECK_API_KEY = process.env.USERCHECK_API_KEY;

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
      if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
        return false;
      }
      console.warn(`DNS resolution error for domain: ${email.split("@")[1]}`, err);
      return false;
    }
  }

  /**
   * Verifies email using UserCheck API (Disposable, Spam, Blocklisted)
   */
  async verifyWithUserCheck(email: string): Promise<{ success: boolean; reason?: string }> {
    if (!this.USERCHECK_API_KEY) {
      // If no API key, fallback to standard MX check
      const hasMx = await this.checkMailServer(email);
      return { success: hasMx, reason: hasMx ? undefined : "Invalid mail domain" };
    }

    try {
      const response = await axios.get(`https://api.usercheck.com/email/${email}`, {
        headers: {
          Authorization: `Bearer ${this.USERCHECK_API_KEY}`
        }
      });

      const data = response.data;

      if (data.disposable) return { success: false, reason: "Disposable emails are blocked" };
      if (data.blocklisted) return { success: false, reason: "This email address is blocklisted" };
      if (data.spam) return { success: false, reason: "This email is flagged as spam" };
      if (!data.mx) return { success: false, reason: "Invalid mail domain (No MX records)" };

      return { success: true };
    } catch (error) {
      console.error("UserCheck API error:", error);
      // Fallback to MX check if API is down
      const hasMx = await this.checkMailServer(email);
      return { success: hasMx, reason: hasMx ? undefined : "Invalid mail domain" };
    }
  }
}

export default new MailServerService();

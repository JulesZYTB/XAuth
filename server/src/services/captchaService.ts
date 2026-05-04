import axios from "axios";

/**
 * Cloudflare Turnstile verification service
 */
class CaptchaService {
  private readonly SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    // If no secret key is configured, allow for development but warn
    if (!this.SECRET_KEY) {
      if (process.env.NODE_ENV === "production") {
         console.error("CLOUDFLARE_TURNSTILE_SECRET_KEY is missing in production!");
         return false;
      }
      console.warn("CLOUDFLARE_TURNSTILE_SECRET_KEY is missing, bypassing captcha check in development.");
      return true;
    }

    try {
      const response = await axios.post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          secret: this.SECRET_KEY,
          response: token,
          remoteip: remoteIp,
        }
      );

      return response.data.success === true;
    } catch (error) {
      console.error("Cloudflare Turnstile verification error:", error);
      return false;
    }
  }
}

export default new CaptchaService();

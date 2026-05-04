import type { Request, Response, NextFunction } from "express";

const DISPOSABLE_DOMAINS = [
  "tempmail.com", "throwawaymail.com", "guerrillamail.com", "10minutemail.com",
  "mailinator.com", "yopmail.com", "temp-mail.org", "maildrop.cc", "sharklasers.com",
  "dispostable.com", "getnada.com", "boun.cr", "fakeinbox.com", "incognitomail.com",
  "mintemail.com", "mytrashmail.com", "spambox.us", "zoemail.org", "grr.la",
  "mail-temporaire.fr", "temp-mail.io", "moakt.com", "guerrillamail.biz"
];

/**
 * Middleware to block disposable email addresses.
 */
export const blockDisposableEmail = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.BLOCK_DISPOSABLE_EMAILS === "false") return next();

  const { email } = req.body;
  if (email && typeof email === "string") {
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && DISPOSABLE_DOMAINS.some(d => domain.includes(d))) {
       res.status(400).json({ 
        message: "Disposable email addresses are not allowed for registration." 
      });
      return;
    }
  }
  next();
};

/**
 * Advanced Bot Protection Middleware
 * - Honeypot check
 * - User Agent validation
 * - Username pattern analysis
 */
export const intelligentSpamCheck = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.SPAM_PROTECTION_ENABLED === "false") return next();

  const { username, website_url } = req.body; // 'website_url' is the honeypot field
  const userAgent = req.headers["user-agent"] || "";

  // 1. Honeypot Check: If the hidden field is filled, it's a bot.
  const honeypotField = process.env.HONEYPOT_FIELD_NAME || "website_url";
  if (req.body[honeypotField]) {
    console.warn(`[SECURITY] Honeypot triggered by ${req.ip}`);
    res.status(400).json({ message: "Bot detected (Honeypot)." });
    return;
  }

  // 2. User Agent Check: Block empty or obviously suspicious UAs
  if (!userAgent || userAgent.length < 20 || userAgent.includes("python-requests") || userAgent.includes("PostmanRuntime")) {
    console.warn(`[SECURITY] Suspicious User-Agent from ${req.ip}: ${userAgent}`);
    res.status(400).json({ message: "Registration from this browser is not allowed." });
    return;
  }

  // 3. Username Pattern Analysis
  if (process.env.STRICT_USERNAME_VALIDATION !== "false") {
    if (username) {
      // Check for too many consecutive numbers or consonants (random string detection)
      const numMatch = username.match(/\d/g);
      if (numMatch && numMatch.length > 5) {
        res.status(400).json({ message: "Username looks like a bot generation." });
        return;
      }

      // Vowel ratio check (very simple bot detection)
      const vowels = username.match(/[aeiou]/gi);
      if (username.length > 6 && (!vowels || vowels.length / username.length < 0.1)) {
        res.status(400).json({ message: "Username is not natural enough." });
        return;
      }
    }
  }

  next();
};

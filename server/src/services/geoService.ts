export interface GeoData {
  country: string;
  countryCode: string;
}

class GeoService {
  /**
   * Resolves an IP address to country information using a public API.
   * Note: In production, consider a local DB like geoip-lite if traffic is high.
   */
  async lookup(ip: string): Promise<GeoData> {
    try {
      // Localhost handling
      if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") {
        return { country: "Local Development", countryCode: "FR" }; // Mocking local as FR for visuals
      }

      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`);
      const data = await res.json();

      if (data.status === "success") {
        return {
          country: data.country,
          countryCode: data.countryCode
        };
      }
    } catch (err) {
      console.error("[GeoService] IP lookup error:", err);
    }

    return { country: "Unknown", countryCode: "??" };
  }
}

export default new GeoService();

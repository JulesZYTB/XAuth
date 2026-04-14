import crypto from "node:crypto";
import webhookRepository from "../modules/app/webhookRepository";
import type { WebhookEvent } from "../types";

class WebhookService {
  /**
   * Dispatches an event to all enabled webhooks for a specific application.
   */
  async dispatch(appId: number, event: WebhookEvent, payload: Record<string, unknown>) {

    try {
      const hooks = await webhookRepository.readByAppId(appId);
      const enabledHooks = hooks.filter(h => h.is_enabled);

      const promises = enabledHooks.map(async (hook) => {
        // Filter by event type if not "all"
        if (hook.event_types !== "all" && !hook.event_types.includes(event)) {
          return;
        }

        const body = JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload
        });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-XAuth-Event": event,
          "User-Agent": "XAuth-Omega-Webhook/1.0"
        };

        // Add HMAC signature if a secret is configured
        if (hook.secret) {
          const hmac = crypto.createHmac("sha256", hook.secret);
          const signature = hmac.update(body).digest("hex");
          headers["X-XAuth-Signature"] = signature;
        }

        try {
          await fetch(hook.url, {
            method: "POST",
            headers,
            body
          });
        } catch (err) {
          console.error(`[Webhook Error] Failed to dispatch to ${hook.url}:`, err);
        }
      });

      // We don't want to block the caller for webhooks, but we await them for this batch
      await Promise.all(promises);
    } catch (err) {
      console.error("[Webhook Service] Error in dispatch:", err);
    }
  }
}

export default new WebhookService();

export interface Webhook {
  id: number;
  app_id: number;
  url: string;
  event_types: string; // "all" or specific ones like "REDEEM,BAN,RESET_HWID"
  secret?: string;
  is_enabled: boolean;
}

export type WebhookEvent = "REDEEM" | "BAN" | "UNBAN" | "RESET_HWID" | "KEY_REGENERATE";

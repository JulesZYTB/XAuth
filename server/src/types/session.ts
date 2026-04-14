export interface Session {
  id: string;
  nonce: string;
  app_id: number;
  expires_at: Date | string;
}


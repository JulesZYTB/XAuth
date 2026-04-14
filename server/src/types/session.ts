export interface Session {
  id: string;
  nonce: string;
  expires_at: Date | string;
}

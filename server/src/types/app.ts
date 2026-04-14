export interface App {
  id: number;
  name: string;
  secret_key: string;
  broadcast_message?: string;
  is_paused: boolean;
  owner_id: number;
}

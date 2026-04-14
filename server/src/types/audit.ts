export interface AuditLog {
  id: number;
  action: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  created_at: Date | string;

  app_id?: number;
  user_id?: number;
  app_name?: string;
  username?: string;
}

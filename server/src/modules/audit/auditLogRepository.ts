import databaseClient from "../../../database/client";
import type { Rows } from "../../../database/client";

type AuditLog = {
  id: number;
  action: string;
  details: string;
  ip_address: string;
  user_agent: string;
  session_id: string;
  created_at: string;
  app_id?: number;
  user_id?: number;
  app_name?: string;
  username?: string;
};

class AuditLogRepository {
  async readAll() {
    const [rows] = await databaseClient.query<Rows>(
      `select l.*, a.name as app_name, u.username 
       from audit_log l 
       left join app a on l.app_id = a.id 
       left join user u on l.user_id = u.id 
       order by l.created_at desc 
       limit 100`
    );
    return rows as AuditLog[];
  }

  async readByUserId(userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      `select l.*, a.name as app_name 
       from audit_log l 
       left join app a on l.app_id = a.id 
       where l.user_id = ? 
       order by l.created_at desc 
       limit 50`,
      [userId]
    );
    return rows as AuditLog[];
  }
}

export default new AuditLogRepository();

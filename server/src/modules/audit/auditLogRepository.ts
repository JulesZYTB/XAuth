import databaseClient from "../../../database/client";
import type { Rows } from "../../../database/client";
import type { AuditLog } from "../../types";


class AuditLogRepository {
  async create(log: Omit<AuditLog, "id" | "created_at" | "app_name" | "username">) {
    const [result] = await databaseClient.query(
      "insert into audit_log (action, details, ip_address, user_agent, session_id, app_id, user_id) values (?, ?, ?, ?, ?, ?, ?)",
      [log.action, log.details, log.ip_address, log.user_agent, log.session_id, log.app_id, log.user_id]
    );
    return result;
  }

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

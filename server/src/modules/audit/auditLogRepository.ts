import databaseClient from "../../../database/client.js";
import type { Rows } from "../../../database/client.js";
import type { AuditLog } from "../../types/index.js";


class AuditLogRepository {
  async create(log: Omit<AuditLog, "id" | "created_at" | "app_name" | "username">) {
    const [result] = await databaseClient.query(
      "insert into audit_log (action, details, ip_address, user_agent, session_id, app_id, user_id) values (?, ?, ?, ?, ?, ?, ?)",
      [log.action, log.details, log.ip_address, log.user_agent, log.session_id, log.app_id, log.user_id]
    );
    return result;
  }

  async readAll(search?: string, limit: number = 50, offset: number = 0) {
    let query = `
       select l.*, a.name as app_name, u.username 
       from audit_log l 
       left join app a on l.app_id = a.id 
       left join user u on l.user_id = u.id`;
    const params: any[] = [];

    if (search) {
      query += " where l.action like ? or l.details like ? or u.username like ?";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " order by l.created_at desc limit ? offset ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await databaseClient.query<Rows>(query, params);
    return rows as AuditLog[];
  }

  async count(search?: string) {
    let query = "select count(*) as count from audit_log l left join user u on l.user_id = u.id";
    const params: any[] = [];
    if (search) {
      query += " where l.action like ? or l.details like ? or u.username like ?";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const [rows] = await databaseClient.query<Rows>(query, params);
    return (rows[0] as any).count as number;
  }

  async readByUserId(userId: number, search?: string, limit: number = 50, offset: number = 0) {
    let query = `
       select l.*, a.name as app_name 
       from audit_log l 
       left join app a on l.app_id = a.id 
       where l.user_id = ?`;
    const params: any[] = [userId];

    if (search) {
      query += " and (l.action like ? or l.details like ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " order by l.created_at desc limit ? offset ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await databaseClient.query<Rows>(query, params);
    return rows as AuditLog[];
  }

  async countByUserId(userId: number, search?: string) {
    let query = "select count(*) as count from audit_log l where l.user_id = ?";
    const params: any[] = [userId];
    if (search) {
      query += " and (l.action like ? or l.details like ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    const [rows] = await databaseClient.query<Rows>(query, params);
    return (rows[0] as any).count as number;
  }

  async bulkDelete(ids: number[]) {
    const [result] = await databaseClient.query(
      "delete from audit_log where id in (?)",
      [ids]
    );
    return result;
  }

  async reset() {
    const [result] = await databaseClient.query("delete from audit_log");
    return result;
  }
}

export default new AuditLogRepository();

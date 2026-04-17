import databaseClient from "../../../database/client.js";
import type { Result, Rows } from "../../../database/client.js";
import type { ValidationLog } from "../../types/index.js";

class ValidationLogRepository {
  async create(log: Omit<ValidationLog, "id" | "created_at">) {
    const [result] = await databaseClient.query<Result>(
      `insert into validation_log 
      (license_id, app_id, ip_address, country, country_code, status, error_type) 
      values (?, ?, ?, ?, ?, ?, ?)`,
      [log.license_id || null, log.app_id, log.ip_address, log.country || "Unknown", log.country_code || "??", log.status, log.error_type || null]
    );
    return result.insertId;
  }

  async getMapData(ownerId: number) {
    const [rows] = await databaseClient.query<Rows>(
      `select country_code as country, count(*) as value 
       from validation_log 
       join app on validation_log.app_id = app.id
       where app.owner_id = ? and validation_log.status = 'success'
       group by country_code`,
      [ownerId]
    );
    return rows;
  }

  async getDAU(ownerId: number) {
    const [rows] = await databaseClient.query<Rows>(
      `select date(created_at) as date, count(distinct license_id) as count
       from validation_log
       join app on validation_log.app_id = app.id
       where app.owner_id = ? and validation_log.status = 'success'
       group by date(created_at)
       order by date(created_at) asc
       limit 30`,
      [ownerId]
    );
    return rows;
  }

  async getAnomalies(ownerId: number) {
    const [rows] = await databaseClient.query<Rows>(
      `select 
        date_format(created_at, '%Y-%m-%d %H:00:00') as timestamp,
        sum(case when status = 'success' then 1 else 0 end) as successes,
        sum(case when status = 'failed' then 1 else 0 end) as failures
       from validation_log
       join app on validation_log.app_id = app.id
       where app.owner_id = ?
       group by timestamp
       order by timestamp desc
       limit 48`,
      [ownerId]
    );
    return rows;
  }
}

export default new ValidationLogRepository();

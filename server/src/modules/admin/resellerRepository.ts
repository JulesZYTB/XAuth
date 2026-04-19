import databaseClient from "../../../database/client.js";
import type { Result, Rows } from "../../../database/client.js";

interface Reseller {
  id: number;
  user_id: number;
  app_id: number;
  key_quota: number;
  keys_generated: number;
  max_day_quota: number;
  created_at?: Date;
}

class ResellerRepository {
  async getReseller(userId: number, appId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from reseller where user_id = ? and app_id = ? limit 1",
      [userId, appId]
    );
    return rows[0] as Reseller;
  }

  async incrementKeysGenerated(userId: number, appId: number) {
    const [result] = await databaseClient.query<Result>(
      "update reseller set keys_generated = keys_generated + 1 where user_id = ? and app_id = ?",
      [userId, appId]
    );
    return result.affectedRows > 0;
  }

  async createReseller(data: Omit<Reseller, "id" | "keys_generated">) {
     const [result] = await databaseClient.query<Result>(
        "insert into reseller (user_id, app_id, key_quota, max_day_quota) values (?, ?, ?, ?)",
        [data.user_id, data.app_id, data.key_quota, data.max_day_quota]
     );
    return result.insertId;
  }

  async listByAppId(appId: number) {
      const [rows] = await databaseClient.query<Rows>(
          `select r.*, u.username, u.email 
           from reseller r 
           join user u on r.user_id = u.id 
           where r.app_id = ?`,
          [appId]
      );
      return rows;
  }

  async deleteReseller(userId: number, appId: number) {
      const [result] = await databaseClient.query<Result>(
          "delete from reseller where user_id = ? and app_id = ?",
          [userId, appId]
      );
      return result.affectedRows > 0;
  }
}

export default new ResellerRepository();

import databaseClient from "../../../database/client.js";
import type { Result, Rows } from "../../../database/client.js";
import type { App } from "../../types/index.js";

class AppRepository {
  async create(app: Omit<App, "id">) {
    const [result] = await databaseClient.query<Result>(
      "insert into app (name, secret_key, owner_id) values (?, ?, ?)",
      [app.name, app.secret_key, app.owner_id]
    );
    return result.insertId;
  }

  async readByOwnerId(userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT DISTINCT a.* FROM app a
       LEFT JOIN reseller r ON a.id = r.app_id
       WHERE a.owner_id = ? OR r.user_id = ?`,
      [userId, userId]
    );
    return rows as App[];
  }

  async read(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from app where id = ?",
      [id]
    );
    return rows[0] as App;
  }

  async update(id: number, owner_id: number, data: Partial<App>) {
    const allowedFields = ["name", "broadcast_message", "is_paused"];
    const keys = Object.keys(data).filter(key => allowedFields.includes(key));
    
    if (keys.length === 0) return 0;
    
    const fields = keys.map(key => `${key} = ?`).join(", ");
    const values = keys.map(key => (data as any)[key]);
    
    const [result] = await databaseClient.query<Result>(
      `update app set ${fields} where id = ? and owner_id = ?`,
      [...values, id, owner_id]
    );
    return result.affectedRows;
  }

  async updateAdmin(id: number, data: Partial<App>) {
    const allowedFields = ["name", "broadcast_message", "is_paused", "owner_id"];
    const keys = Object.keys(data).filter(key => allowedFields.includes(key));
    
    if (keys.length === 0) return 0;

    const fields = keys.map(key => `${key} = ?`).join(", ");
    const values = keys.map(key => (data as any)[key]);
    
    const [result] = await databaseClient.query<Result>(
      `update app set ${fields} where id = ?`,
      [...values, id]
    );
    return result.affectedRows;
  }


  async delete(id: number, ownerId: number) {
    const [result] = await databaseClient.query<Result>(
      "delete from app where id = ? and owner_id = ?",
      [id, ownerId]
    );
    return result.affectedRows;
  }

  async deleteAdmin(id: number) {
    const [result] = await databaseClient.query<Result>(
      "delete from app where id = ?",
      [id]
    );
    return result.affectedRows;
  }

}

export default new AppRepository();



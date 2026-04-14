import databaseClient from "../../../database/client";
import type { Result, Rows } from "../../../database/client";

type App = {
  id: number;
  name: string;
  secret_key: string;
  broadcast_message?: string;
  is_paused: boolean;
  owner_id: number;
};

class AppRepository {
  async create(app: Omit<App, "id">) {
    const [result] = await databaseClient.query<Result>(
      "insert into app (name, secret_key, owner_id) values (?, ?, ?)",
      [app.name, app.secret_key, app.owner_id]
    );
    return result.insertId;
  }

  async readByOwnerId(ownerId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from app where owner_id = ?",
      [ownerId]
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

  async update(id: number, ownerId: number, data: Partial<App>) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(", ");
    const values = Object.values(data);
    const [result] = await databaseClient.query<Result>(
      `update app set ${fields} where id = ? and owner_id = ?`,
      [...values, id, ownerId]
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
}

export default new AppRepository();



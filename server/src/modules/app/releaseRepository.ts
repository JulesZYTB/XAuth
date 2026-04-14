import databaseClient from "../../../database/client";
import type { Result, Rows } from "../../../database/client";
import type { AppRelease } from "../../types";

class ReleaseRepository {
  async create(release: Omit<AppRelease, "id" | "created_at">) {
    const [result] = await databaseClient.query<Result>(
      `insert into app_release (app_id, version, channel, download_url, checksum, is_active) 
       values (?, ?, ?, ?, ?, ?)`,
      [release.app_id, release.version, release.channel, release.download_url, release.checksum, release.is_active ?? true]
    );
    return result.insertId;
  }

  async readByAppId(appId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from app_release where app_id = ? order by created_at desc",
      [appId]
    );
    return rows as AppRelease[];
  }

  async getLatest(appId: number, channel: string) {
    const [rows] = await databaseClient.query<Rows>(
      `select * from app_release 
       where app_id = ? and (channel = ? or channel = 'stable') and is_active = true 
       order by created_at desc limit 1`,
      [appId, channel]
    );
    return rows[0] as AppRelease;
  }

  async update(id: number, data: Partial<AppRelease>) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(", ");
    const values = Object.values(data);
    const [result] = await databaseClient.query<Result>(
      `update app_release set ${fields} where id = ?`,
      [...values, id]
    );
    return result.affectedRows;
  }

  async delete(id: number) {
    const [result] = await databaseClient.query<Result>(
      "delete from app_release where id = ?",
      [id]
    );
    return result.affectedRows;
  }
}

export default new ReleaseRepository();

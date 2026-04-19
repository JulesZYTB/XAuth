import databaseClient from "../../../database/client.js";
import type { Result, Rows } from "../../../database/client.js";

class TrialRepository {
  async addTrialLog(appId: number, hwidHash: string) {
    const [result] = await databaseClient.query<Result>(
      "insert into app_trial_log (app_id, hwid_hash) values (?, ?)",
      [appId, hwidHash]
    );
    return result.insertId;
  }

  async hasTrialed(appId: number, hwidHash: string) {
    const [rows] = await databaseClient.query<Rows>(
      "select 1 from app_trial_log where app_id = ? and hwid_hash = ? limit 1",
      [appId, hwidHash]
    );
    return rows.length > 0;
  }
}

export default new TrialRepository();

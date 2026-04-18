import databaseClient from "../../../database/client.js";
import type { Result, Rows } from "../../../database/client.js";
import type { Webhook } from "../../types/index.js";

class WebhookRepository {
  async create(webhook: Omit<Webhook, "id">) {
    const [result] = await databaseClient.query<Result>(
      "insert into webhook (app_id, url, event_types, secret, is_enabled) values (?, ?, ?, ?, ?)",
      [webhook.app_id, webhook.url, webhook.event_types || "all", webhook.secret || null, webhook.is_enabled ?? true]
    );
    return result.insertId;
  }

  async read(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from webhook where id = ?",
      [id]
    );
    return rows[0] as Webhook;
  }

  async readByAppId(appId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from webhook where app_id = ?",
      [appId]
    );
    return rows as Webhook[];
  }

  async update(id: number, data: Partial<Webhook>) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(", ");
    const values = Object.values(data);
    const [result] = await databaseClient.query<Result>(
      `update webhook set ${fields} where id = ?`,
      [...values, id]
    );
    return result.affectedRows;
  }

  async delete(id: number) {
    const [result] = await databaseClient.query<Result>(
      "delete from webhook where id = ?",
      [id]
    );
    return result.affectedRows;
  }
}

export default new WebhookRepository();

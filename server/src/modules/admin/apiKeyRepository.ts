import databaseClient from "../../../database/client.js";
import type { Result, Rows } from "../../../database/client.js";

export type ApiKey = {
  id: number;
  user_id: number;
  name: string;
  key_prefix: string;
  key_hash: string;
  created_at: Date;
  last_used?: Date;
};

class ApiKeyRepository {
  async create(data: Omit<ApiKey, "id" | "created_at" | "last_used">) {
    const [result] = await databaseClient.query<Result>(
      "INSERT INTO api_key (user_id, name, key_prefix, key_hash) VALUES (?, ?, ?, ?)",
      [data.user_id, data.name, data.key_prefix, data.key_hash]
    );
    return result.insertId;
  }

  async readByUserId(userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT id, name, key_prefix, created_at, last_used FROM api_key WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  async readByPrefix(prefix: string) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT * FROM api_key WHERE key_prefix = ?",
      [prefix]
    );
    return rows[0] as ApiKey | undefined;
  }

  async delete(id: number, userId: number) {
    const [result] = await databaseClient.query<Result>(
      "DELETE FROM api_key WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    return result.affectedRows;
  }

  async updateLastUsed(id: number) {
    await databaseClient.query(
      "UPDATE api_key SET last_used = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
  }
}

export default new ApiKeyRepository();

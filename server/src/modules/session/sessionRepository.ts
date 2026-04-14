import databaseClient from "../../../database/client";
import type { Result, Rows } from "../../../database/client";

type Session = {
  id: string;
  nonce: string;
  app_id: number;
  expires_at: Date;
};

class SessionRepository {
  async create(session: Session) {
    const [result] = await databaseClient.query<Result>(
      "insert into session (id, nonce, app_id, expires_at) values (?, ?, ?, ?)",
      [session.id, session.nonce, session.app_id, session.expires_at]
    );
    return result.affectedRows;
  }

  async read(id: string) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from session where id = ?",
      [id]
    );
    return rows[0] as Session;
  }

  async delete(id: string) {
    const [result] = await databaseClient.query<Result>(
      "delete from session where id = ?",
      [id]
    );
    return result.affectedRows;
  }
}

export default new SessionRepository();

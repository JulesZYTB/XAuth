import databaseClient from "../../../database/client.js";
import type { Result, Rows } from "../../../database/client.js";
import type { User } from "../../types/index.js";


class UserRepository {
  async readByEmail(email: string) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from user where email = ?",
      [email]
    );
    return rows[0] as User;
  }

  async read(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from user where id = ?",
      [id]
    );
    return rows[0] as User;
  }

  async readByUsername(username: string) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from user where username = ?",
      [username]
    );
    return rows[0] as User;
  }

  async create(user: Omit<User, "id">) {
    const [result] = await databaseClient.query<Result>(
      "insert into user (username, email, password, role) values (?, ?, ?, ?)",
      [user.username, user.email, user.password, user.role || "user"]
    );
    return result.insertId;
  }

  async readAll() {
    const [rows] = await databaseClient.query<Rows>("select id, username, email, role from user");
    return rows as User[];
  }

  async updateRole(id: number, role: "admin" | "user") {
    const [result] = await databaseClient.query<Result>(
      "update user set role = ? where id = ?",
      [role, id]
    );
    return result.affectedRows;
  }

  async updateProfile(id: number, username: string, email: string, hashedPassword?: string) {
    if (hashedPassword) {
      const [result] = await databaseClient.query<Result>(
        "update user set username = ?, email = ?, password = ? where id = ?",
        [username, email, hashedPassword, id]
      );
      return result.affectedRows;
    } else {
      const [result] = await databaseClient.query<Result>(
        "update user set username = ?, email = ? where id = ?",
        [username, email, id]
      );
      return result.affectedRows;
    }
  }

  async delete(id: number) {
    const [result] = await databaseClient.query<Result>(
      "delete from user where id = ? and id != 1", // Protection for system_admin
      [id]
    );
    return result.affectedRows;
  }
}

export default new UserRepository();


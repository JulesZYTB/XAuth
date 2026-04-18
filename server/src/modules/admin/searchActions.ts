import type { Request, RequestHandler } from "express";
import databaseClient from "../../../database/client.js";
import type { Rows } from "../../../database/client.js";
import type { AuthUser } from "../../types/index.js";

interface AuthenticatedRequest extends Request {
  auth: AuthUser;
}

const globalSearch: RequestHandler = async (req, res, next) => {
  try {
    const query = req.query.q as string;
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!query || query.length < 2) {
      res.json({ apps: [], licenses: [], users: [] });
      return;
    }

    const searchQuery = `%${query}%`;
    const results: any = { apps: [], licenses: [], users: [] };

    // 1. Search Apps (Filtered by ownership unless admin)
    const appSql = actor.role === "admin" 
      ? "SELECT id, name, created_at FROM app WHERE name LIKE ? LIMIT 5"
      : "SELECT id, name, created_at FROM app WHERE owner_id = ? AND name LIKE ? LIMIT 5";
    
    const appParams = actor.role === "admin" ? [searchQuery] : [actor.id, searchQuery];
    const [apps] = await databaseClient.query<Rows>(appSql, appParams);
    results.apps = apps;

    // 2. Search Licenses (Filtered by app ownership unless admin)
    const licenseSql = actor.role === "admin"
      ? "SELECT id, license_key, app_id, status FROM license WHERE license_key LIKE ? LIMIT 5"
      : `SELECT l.id, l.license_key, l.app_id, l.status 
         FROM license l 
         JOIN app a ON l.app_id = a.id 
         WHERE a.owner_id = ? AND l.license_key LIKE ? 
         LIMIT 5`;
    
    const licenseParams = actor.role === "admin" ? [searchQuery] : [actor.id, searchQuery];
    const [licenses] = await databaseClient.query<Rows>(licenseSql, licenseParams);
    results.licenses = licenses;

    // 3. Search Users (Admin Only)
    if (actor.role === "admin") {
      const [users] = await databaseClient.query<Rows>(
        "SELECT id, username, email, role FROM user WHERE username LIKE ? OR email LIKE ? LIMIT 5",
        [searchQuery, searchQuery]
      );
      results.users = users;
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
};

export default { globalSearch };

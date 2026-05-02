import databaseClient from "../../../database/client.js";
import type { Result, Rows } from "../../../database/client.js";
import securityService from "../../services/security.js";
import type { License } from "../../types/index.js";

class LicenseRepository {
  async create(license: Omit<License, "id">) {
    const encryptedKey = securityService.dbEncrypt(license.license_key);
    const keyHash = securityService.hash(license.license_key);
    const [result] = await databaseClient.query<Result>(
      "insert into license (license_key, license_key_hash, expiry_date, app_id, status, variables, max_hwids, linked_hwids, created_by) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [encryptedKey, keyHash, license.expiry_date, license.app_id, license.status, license.variables || "{}", license.max_hwids || 1, license.linked_hwids || "[]", license.created_by || null]
    );
    return result.insertId;
  }

  async read(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from license where id = ?",
      [id]
    );
    const license = rows[0] as License;
    if (license) {
      try {
        license.license_key = securityService.dbDecrypt(license.license_key);
        if (license.hwid) license.hwid = securityService.dbDecrypt(license.hwid);
      } catch (e) {
        // Handle decryption errors
      }
    }
    return license;
  }

  async readByKey(licenseKey: string) {
    const keyHash = securityService.hash(licenseKey);
    const [rows] = await databaseClient.query<Rows>(
      "select * from license where license_key_hash = ?",
      [keyHash]
    );

    if (rows.length > 0) {
      const license = rows[0] as License;
      license.license_key = licenseKey; // We already know it matches the hash
      if (license.hwid) license.hwid = securityService.dbDecrypt(license.hwid);
      return license;
    }

    // Fallback for legacy data (without hash)
    const [allRows] = await databaseClient.query<Rows>("select * from license where license_key_hash IS NULL");
    
    for (const row of allRows as License[]) {
      try {
        const decryptedKey = securityService.dbDecrypt(row.license_key);
        if (decryptedKey === licenseKey) {
          // Lazy migration: Update the hash for next time
          await databaseClient.query(
            "update license set license_key_hash = ? where id = ?",
            [keyHash, row.id]
          );

          const license = { ...row };
          license.license_key = decryptedKey;
          license.license_key_hash = keyHash;
          if (license.hwid) license.hwid = securityService.dbDecrypt(license.hwid);
          return license;
        }
      } catch (e) {}
    }
    return null;
  }

  async readByAppId(appId: number, creatorId?: number) {
    let query = `
      SELECT l.*, 
             (SELECT COUNT(*) 
              FROM validation_log v 
              WHERE v.license_id = l.id 
                AND v.status = 'success' 
                AND v.created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
             ) > 0 as is_online
      FROM license l 
      WHERE l.app_id = ?`;
    const params: any[] = [appId];

    if (creatorId) {
      query += " AND l.created_by = ?";
      params.push(creatorId);
    }

    const [rows] = await databaseClient.query<Rows>(query, params);
    const results = rows as License[];
    for (const res of results) {
      try {
        res.license_key = securityService.dbDecrypt(res.license_key);
        if (res.hwid) res.hwid = securityService.dbDecrypt(res.hwid);
      } catch (e) {
        // Silently skip if decryption fails
      }
    }
    return results;
  }

  async updateHwid(id: number, hwid: string) {
    const encryptedHwid = securityService.dbEncrypt(hwid);
    const hwidHash = securityService.hash(hwid);
    const [result] = await databaseClient.query<Result>(
      "update license set hwid = ?, hwid_hash = ?, linked_hwids = JSON_ARRAY(?) where id = ?",
      [encryptedHwid, hwidHash, hwidHash, id]
    );
    return result.affectedRows;
  }

  async linkHwid(id: number, hwidHash: string) {
    const [result] = await databaseClient.query<Result>(
      "update license set linked_hwids = JSON_ARRAY_APPEND(IFNULL(linked_hwids, JSON_ARRAY()), '$', ?) where id = ?",
      [hwidHash, id]
    );
    return result.affectedRows;
  }

  async isHwidBlacklisted(hwidHash: string) {
    const [rows] = await databaseClient.query<Rows>(
      "SELECT COUNT(*) as count FROM license WHERE hwid_hash = ? AND status = 'banned'",
      [hwidHash]
    );
    return (rows[0] as any).count > 0;
  }

  async updateStatus(id: number, status: string) {
    const [result] = await databaseClient.query<Result>(
      "update license set status = ? where id = ?",
      [status, id]
    );
    return result.affectedRows;
  }

  async update(id: number, data: Partial<License>) {
    const allowedFields = ["status", "expiry_date", "variables", "ip_lock", "hwid", "max_hwids"];
    const keys = Object.keys(data).filter(key => allowedFields.includes(key));
    
    if (keys.length === 0) return 0;

    const fields = keys.map(key => `${key} = ?`).join(", ");
    const values = keys.map(key => (data as any)[key]);
    
    const [result] = await databaseClient.query<Result>(
      `update license set ${fields} where id = ?`,
      [...values, id]
    );
    return result.affectedRows;
  }

  async redeem(licenseKey: string, userId: number) {
    const keyHash = securityService.hash(licenseKey);
    const [result] = await databaseClient.query<Result>(
      "update license set user_id = ? where license_key_hash = ? and user_id is null",
      [userId, keyHash]
    );
    
    // Fallback for legacy data without hash
    if (result.affectedRows === 0) {
      const license = await this.readByKey(licenseKey);
      if (license && !license.user_id) {
         const [retryResult] = await databaseClient.query<Result>(
           "update license set user_id = ? where id = ?",
           [userId, license.id]
         );
         return retryResult.affectedRows;
      }
    }

    return result.affectedRows;
  }

  async readByUserId(userId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select l.*, a.name as app_name from license l join app a on l.app_id = a.id where l.user_id = ?",
      [userId]
    );
    
    const results = rows as License[];
    for (const res of results) {
      try {
        res.license_key = securityService.dbDecrypt(res.license_key);
        if (res.hwid) res.hwid = securityService.dbDecrypt(res.hwid);
      } catch (e) {
        // Handle potential decryption errors for legacy data
      }
    }
    return results;
  }

  async resetHwid(id: number) {
    const [result] = await databaseClient.query<Result>(
      "update license set hwid = NULL, hwid_hash = NULL, linked_hwids = JSON_ARRAY() where id = ?",
      [id]
    );
    return result.affectedRows;
  }

  async updateKey(id: number, newKey: string) {
    const encryptedKey = securityService.dbEncrypt(newKey);
    const keyHash = securityService.hash(newKey);
    const [result] = await databaseClient.query<Result>(
      "update license set license_key = ?, license_key_hash = ? where id = ?",
      [encryptedKey, keyHash, id]
    );
    return result.affectedRows;
  }

  async delete(id: number) {

    const [result] = await databaseClient.query<Result>(
      "delete from license where id = ?",
      [id]
    );
    return result.affectedRows;
  }
}

export default new LicenseRepository();

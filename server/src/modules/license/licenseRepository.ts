import databaseClient from "../../../database/client.js";
import type { Result, Rows } from "../../../database/client.js";
import securityService from "../../services/security.js";
import type { License } from "../../types/index.js";

class LicenseRepository {
  async create(license: Omit<License, "id">) {
    const encryptedKey = securityService.dbEncrypt(license.license_key);
    const keyHash = securityService.hash(license.license_key);
    const [result] = await databaseClient.query<Result>(
      "insert into license (license_key, license_key_hash, expiry_date, app_id, status, variables) values (?, ?, ?, ?, ?, ?)",
      [encryptedKey, keyHash, license.expiry_date, license.app_id, license.status, license.variables || "{}"]
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

  async readByAppId(appId: number) {
    const [rows] = await databaseClient.query<Rows>(
      "select * from license where app_id = ?",
      [appId]
    );
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
    const [result] = await databaseClient.query<Result>(
      "update license set hwid = ? where id = ?",
      [encryptedHwid, id]
    );
    return result.affectedRows;
  }

  async updateStatus(id: number, status: string) {
    const [result] = await databaseClient.query<Result>(
      "update license set status = ? where id = ?",
      [status, id]
    );
    return result.affectedRows;
  }

  async update(id: number, data: Partial<License>) {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(", ");
    const values = Object.values(data);
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
      "update license set hwid = NULL where id = ?",
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

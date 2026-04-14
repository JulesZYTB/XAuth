import databaseClient from "../../../database/client";
import type { Result, Rows } from "../../../database/client";
import securityService from "../../services/security";
import type { License } from "../../types";

class LicenseRepository {
  async create(license: Omit<License, "id">) {
    const encryptedKey = securityService.dbEncrypt(license.license_key);
    const [result] = await databaseClient.query<Result>(
      "insert into license (license_key, expiry_date, app_id, status, variables) values (?, ?, ?, ?, ?)",
      [encryptedKey, license.expiry_date, license.app_id, license.status, license.variables || "{}"]
    );
    return result.insertId;
  }

  async readByKey(licenseKey: string) {
    const [rows] = await databaseClient.query<Rows>("select * from license");
    
    for (const row of rows as License[]) {
      try {
        const decryptedKey = securityService.dbDecrypt(row.license_key);
        if (decryptedKey === licenseKey) {
          const license = { ...row };
          license.license_key = decryptedKey;
          if (license.hwid) license.hwid = securityService.dbDecrypt(license.hwid);
          return license;
        }
      } catch (e) {
        // Silently skip if decryption fails for unrelated keys
      }
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
    const encryptedKey = securityService.dbEncrypt(licenseKey);
    const [result] = await databaseClient.query<Result>(
      "update license set user_id = ? where license_key = ? and user_id is null",
      [userId, encryptedKey]
    );
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
    const [result] = await databaseClient.query<Result>(
      "update license set license_key = ? where id = ?",
      [encryptedKey, id]
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

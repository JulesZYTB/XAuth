import databaseClient from "../../../database/client.js";
import type { Rows } from "../../../database/client.js";

class DashboardRepository {
  async getStats(appId?: number) {
    const [userCount] = appId 
      ? await databaseClient.query<Rows>("SELECT COUNT(DISTINCT user_id) as count FROM license WHERE app_id = ?", [appId])
      : await databaseClient.query<Rows>("SELECT COUNT(*) as count FROM user");
    
    const [appCount] = appId
      ? [{ 0: { count: 1 } }] as any
      : await databaseClient.query<Rows>("SELECT COUNT(*) as count FROM app");

    const [licenseCount] = appId
      ? await databaseClient.query<Rows>("SELECT COUNT(*) as count FROM license WHERE app_id = ?", [appId])
      : await databaseClient.query<Rows>("SELECT COUNT(*) as count FROM license");

    const [activeLicenses] = appId
      ? await databaseClient.query<Rows>("SELECT COUNT(*) as count FROM license WHERE app_id = ? AND status = 'active'", [appId])
      : await databaseClient.query<Rows>("SELECT COUNT(*) as count FROM license WHERE status = 'active'");
    
    return {
      totalUsers: (userCount[0] as any).count,
      totalApps: (appCount[0] as any).count,
      totalLicenses: (licenseCount[0] as any).count,
      activeLicenses: (activeLicenses[0] as any).count,
    };
  }

  async getTrafficData(appId?: number) {
    const sql = `SELECT DATE(created_at) as date, COUNT(*) as count 
                 FROM audit_log 
                 WHERE action LIKE '%validation%' 
                 ${appId ? "AND app_id = ?" : ""}
                 GROUP BY DATE(created_at) 
                 ORDER BY date DESC 
                 LIMIT 7`;
    const [rows] = await databaseClient.query<Rows>(sql, appId ? [appId] : []);
    return rows;
  }

  async getRecentActivity(appId?: number) {
    const sql = `SELECT l.*, u.username, a.name as app_name 
                 FROM audit_log l 
                 LEFT JOIN user u ON l.user_id = u.id 
                 LEFT JOIN app a ON l.app_id = a.id 
                 ${appId ? "WHERE l.app_id = ?" : ""}
                 ORDER BY l.created_at DESC 
                 LIMIT 5`;
    const [rows] = await databaseClient.query<Rows>(sql, appId ? [appId] : []);
    return rows;
  }

  async getMapData(appId?: number) {
    const sql = `SELECT country_code as country, COUNT(*) as value 
                 FROM validation_log 
                 WHERE country_code IS NOT NULL AND country_code != '??'
                 ${appId ? "AND app_id = ?" : ""}
                 GROUP BY country_code 
                 ORDER BY value DESC`;
    const [rows] = await databaseClient.query<Rows>(sql, appId ? [appId] : []);
    return rows;
  }

  async getDauData(appId?: number) {
    const sql = `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(DISTINCT ip_address) as count 
                 FROM validation_log 
                 WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                 ${appId ? "AND app_id = ?" : ""}
                 GROUP BY DATE(created_at) 
                 ORDER BY date ASC`;
    const [rows] = await databaseClient.query<Rows>(sql, appId ? [appId] : []);
    return rows;
  }

  async getAnomalyData(appId?: number) {
    const sql = `SELECT 
                   DATE_FORMAT(created_at, '%Y-%m-%dT%H:00:00.000Z') as timestamp,
                   SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successes,
                   SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failures
                 FROM validation_log 
                 WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                 ${appId ? "AND app_id = ?" : ""}
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m-%dT%H:00:00.000Z')
                 ORDER BY timestamp ASC`;
    const [rows] = await databaseClient.query<Rows>(sql, appId ? [appId] : []);
    return rows;
  }

  async getSuspiciousIPs(appId?: number) {
    const sql = `SELECT ip_address as ip, COUNT(*) as failedAttempts, MAX(created_at) as lastAttempt
                 FROM validation_log
                 WHERE status = 'failed' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                 ${appId ? "AND app_id = ?" : ""}
                 GROUP BY ip_address
                 HAVING failedAttempts > 5
                 ORDER BY failedAttempts DESC
                 LIMIT 10`;
    const [rows] = await databaseClient.query<Rows>(sql, appId ? [appId] : []);
    return rows;
  }

  async getSharedKeys(appId?: number) {
    const sql = `SELECT l.id, l.license_key as licenseKey, COUNT(DISTINCT v.country_code) as countriesCount, COUNT(DISTINCT v.ip_address) as ipsCount, GROUP_CONCAT(DISTINCT v.country_code) as countries
                 FROM validation_log v
                 JOIN license l ON v.license_id = l.id
                 WHERE v.status = 'success' AND v.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                 ${appId ? "AND v.app_id = ?" : ""}
                 GROUP BY v.license_id, l.id, l.license_key
                 HAVING countriesCount > 1 OR ipsCount > 2
                 ORDER BY ipsCount DESC
                 LIMIT 10`;
    const [rows] = await databaseClient.query<Rows>(sql, appId ? [appId] : []);
    return rows;
  }
}

export default new DashboardRepository();

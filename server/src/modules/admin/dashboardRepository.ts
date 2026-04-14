import databaseClient from "../../../database/client";
import type { Rows } from "../../../database/client";

class DashboardRepository {
  async getGlobalStats() {
    const [userCount] = await databaseClient.query<Rows>("select count(*) as count from user");
    const [appCount] = await databaseClient.query<Rows>("select count(*) as count from app");
    const [licenseCount] = await databaseClient.query<Rows>("select count(*) as count from license");
    const [activeLicenses] = await databaseClient.query<Rows>("select count(*) as count from license where status = 'active'");
    
    return {
      totalUsers: (userCount[0] as any).count,
      totalApps: (appCount[0] as any).count,
      totalLicenses: (licenseCount[0] as any).count,
      activeLicenses: (activeLicenses[0] as any).count,
    };
  }

  async getTrafficData() {
    // Get last 7 days of validation activity
    const [rows] = await databaseClient.query<Rows>(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM audit_log 
       WHERE action LIKE '%validation%' 
       GROUP BY DATE(created_at) 
       ORDER BY date DESC 
       LIMIT 7`
    );
    return rows;
  }

  async getRecentActivity() {
    const [rows] = await databaseClient.query<Rows>(
      `SELECT l.*, u.username, a.name as app_name 
       FROM audit_log l 
       LEFT JOIN user u ON l.user_id = u.id 
       LEFT JOIN app a ON l.app_id = a.id 
       ORDER BY l.created_at DESC 
       LIMIT 5`
    );
    return rows;
  }
}

export default new DashboardRepository();

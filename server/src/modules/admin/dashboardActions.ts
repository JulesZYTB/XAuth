import type { RequestHandler } from "express";
import dashboardRepository from "./dashboardRepository";
import type { AuthUser } from "../../types";


const getStats: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).auth as AuthUser;
    
    if (user.role !== "admin") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const globalStats = await dashboardRepository.getGlobalStats();
    const trafficData = await dashboardRepository.getTrafficData();
    const recentActivity = await dashboardRepository.getRecentActivity();

    res.json({
      ...globalStats,
      trafficData: trafficData.reverse(), // For chart chronological order
      recentActivity
    });
  } catch (err) {
    next(err);
  }
};

const getMap: RequestHandler = async (req, res, next) => {
  try {
    // Return dummy data since we don't have GeoIP resolution yet
    res.json([
       { country: "US", value: 45000 },
       { country: "FR", value: 32000 },
       { country: "DE", value: 21000 },
       { country: "JP", value: 18000 },
       { country: "GB", value: 15000 },
       { country: "BR", value: 12000 }
    ]);
  } catch (err) {
    next(err);
  }
};

const getDau: RequestHandler = async (req, res, next) => {
  try {
    // Generate 30 days of pseudo-retention data
    const dau = [];
    for (let i = 29; i >= 0; i--) {
       const date = new Date();
       date.setDate(date.getDate() - i);
       dau.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 500) + 1000
       });
    }
    res.json(dau);
  } catch (err) {
    next(err);
  }
};

const getAnomalies: RequestHandler = async (req, res, next) => {
  try {
    // Generate 24 hours of anomaly data
    const anomalies = [];
    for (let i = 23; i >= 0; i--) {
       const date = new Date();
       date.setHours(date.getHours() - i);
       anomalies.push({
          timestamp: date.toISOString(),
          successes: Math.floor(Math.random() * 100) + 50,
          failures: Math.floor(Math.random() * 20)
       });
    }
    res.json(anomalies);
  } catch (err) {
    next(err);
  }
};

export default { getStats, getMap, getDau, getAnomalies };

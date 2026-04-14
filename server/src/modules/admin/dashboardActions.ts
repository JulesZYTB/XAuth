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
    const mapData = await dashboardRepository.getMapData();
    res.json(mapData);
  } catch (err) {
    next(err);
  }
};

const getDau: RequestHandler = async (req, res, next) => {
  try {
    const dauData = await dashboardRepository.getDauData();
    res.json(dauData);
  } catch (err) {
    next(err);
  }
};

const getAnomalies: RequestHandler = async (req, res, next) => {
  try {
    const anomalyData = await dashboardRepository.getAnomalyData();
    // Convert string totals to numbers because SUM returns strings in some MySQL drivers
    const formatted = anomalyData.map((row: any) => ({
      timestamp: row.timestamp,
      successes: Number(row.successes),
      failures: Number(row.failures)
    }));
    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

const getAuditorScan: RequestHandler = async (req, res, next) => {
  try {
    const suspiciousIPs = await dashboardRepository.getSuspiciousIPs();
    const sharedKeys = await dashboardRepository.getSharedKeys();

    res.json({ suspiciousIPs, sharedKeys });
  } catch (err) {
    next(err);
  }
};


export default { getStats, getMap, getDau, getAnomalies, getAuditorScan };

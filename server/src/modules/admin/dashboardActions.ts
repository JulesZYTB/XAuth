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

export default { getStats };

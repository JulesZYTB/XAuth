import type { Request, RequestHandler } from "express";
import dashboardRepository from "./dashboardRepository.js";
import appRepository from "../app/appRepository.js";
import type { AuthUser } from "../../types/index.js";
import securityService from "../../services/security.js";
import validationLogRepository from "../app/validationLogRepository.js";
import auditLogRepository from "../audit/auditLogRepository.js";

// Helper to check if user owns the app or is admin
const checkOwnership = async (user: AuthUser, appId: number) => {
  if (user.role === "admin") return true;
  const app = await appRepository.read(appId);
  return app && app.owner_id === user.id;
};

const getStats: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).auth as AuthUser;
    const appId = req.params.appId ? Number(req.params.appId) : undefined;

    if (appId) {
      if (!(await checkOwnership(user, appId))) {
        res.status(403).json({ message: "Forbidden: You do not own this application" });
        return;
      }
    } else if (user.role !== "admin") {
      res.status(403).json({ message: "Forbidden: Admin access required for global stats" });
      return;
    }

    const stats = await dashboardRepository.getStats(appId);
    const trafficData = await dashboardRepository.getTrafficData(appId);
    const recentActivity = await dashboardRepository.getRecentActivity(appId);
    const rawThreats = await dashboardRepository.getRecentThreats(appId);

    // Decrypt sensitive data in threats
    const recentThreats = rawThreats.map((threat: any) => {
       const decrypted = { ...threat };
       try {
         if (threat.license_key) {
           decrypted.license_key = securityService.dbDecrypt(threat.license_key);
         }
         if (threat.hwid) {
           decrypted.hwid = securityService.dbDecrypt(threat.hwid);
         }
       } catch (err) {
         // Fallback if not encrypted or key mismatch
         console.warn(`Failed to decrypt threat data for ID ${threat.id}`);
       }
       return decrypted;
    });

    res.json({
      ...stats,
      trafficData: trafficData.reverse(),
      recentActivity,
      recentThreats
    });
  } catch (err) {
    next(err);
  }
};

const clearThreats: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).auth as AuthUser;
    const appId = req.params.appId ? Number(req.params.appId) : undefined;

    if (appId) {
      if (!(await checkOwnership(user, appId))) {
        res.status(403).json({ message: "Forbidden: You do not own this application" });
        return;
      }
      await validationLogRepository.clearThreatLogs(appId);
    } else if (user.role === "admin") {
      await validationLogRepository.clearAllThreatLogs();
    } else {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Log the purge action
    await auditLogRepository.create({
      action: "THREAT_LOGS_PURGED",
      details: appId ? `Threat logs cleared for App ID ${appId}` : "Global threat logs cleared by administrator",
      user_id: user.id,
      app_id: appId,
      ip_address: req.ip
    });

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const getMap: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).auth as AuthUser;
    const appId = req.params.appId ? Number(req.params.appId) : undefined;

    if (appId && !(await checkOwnership(user, appId))) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }

    const mapData = await dashboardRepository.getMapData(appId);
    res.json(mapData);
  } catch (err) {
    next(err);
  }
};

const getDau: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).auth as AuthUser;
    const appId = req.params.appId ? Number(req.params.appId) : undefined;

    if (appId && !(await checkOwnership(user, appId))) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }

    const dauData = await dashboardRepository.getDauData(appId);
    res.json(dauData);
  } catch (err) {
    next(err);
  }
};

const getAnomalies: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).auth as AuthUser;
    const appId = req.params.appId ? Number(req.params.appId) : undefined;

    if (appId && !(await checkOwnership(user, appId))) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }

    const anomalyData = await dashboardRepository.getAnomalyData(appId);
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
    const user = (req as any).auth as AuthUser;
    const appId = req.params.appId ? Number(req.params.appId) : undefined;

    if (appId && !(await checkOwnership(user, appId))) {
        res.status(403).json({ message: "Forbidden" });
        return;
    }

    const suspiciousIPs = await dashboardRepository.getSuspiciousIPs(appId);
    const sharedKeys = await dashboardRepository.getSharedKeys(appId);

    res.json({ suspiciousIPs, sharedKeys });
  } catch (err) {
    next(err);
  }
};

export default { getStats, getMap, getDau, getAnomalies, getAuditorScan, clearThreats };

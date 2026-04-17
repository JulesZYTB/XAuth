import type { RequestHandler } from "express";
import auditLogRepository from "./auditLogRepository.js";
import type { AuthUser } from "../../types/index.js";


const browse: RequestHandler = async (req, res, next) => {
  try {
    const { role, id: userId } = (req as any).auth as AuthUser;
    
    if (role === "admin") {
      const logs = await auditLogRepository.readAll();
      res.json(logs);
    } else {
      const logs = await auditLogRepository.readByUserId(userId);
      res.json(logs);
    }
  } catch (err) {
    next(err);
  }
};

export default { browse };

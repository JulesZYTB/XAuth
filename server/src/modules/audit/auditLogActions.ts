import type { RequestHandler } from "express";
import auditLogRepository from "./auditLogRepository";
import type { AuthUser } from "../../types";


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

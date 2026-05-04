import type { RequestHandler } from "express";
import auditLogRepository from "./auditLogRepository.js";
import type { AuthUser } from "../../types/index.js";
import { bulkDeleteSchema } from "../security/schemas.js";


const browse: RequestHandler = async (req, res, next) => {
  try {
    const { role, id: userId } = (req as any).auth as AuthUser;
    const { search, limit, page } = req.query;
    const l = Number(limit) || 50;
    const p = Number(page) || 1;
    const offset = (p - 1) * l;
    
    let logs, total;
    if (role === "admin") {
      logs = await auditLogRepository.readAll(search as string, l, offset);
      total = await auditLogRepository.count(search as string);
    } else {
      logs = await auditLogRepository.readByUserId(userId, search as string, l, offset);
      total = await auditLogRepository.countByUserId(userId, search as string);
    }

    res.json({
        data: logs,
        pagination: {
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l)
        }
    });
  } catch (err) {
    next(err);
  }
};

const bulkDestroy: RequestHandler = async (req, res, next) => {
  try {
    const validation = bulkDeleteSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Invalid input", errors: validation.error.format() });
      return;
    }

    const { ids } = validation.data;
    await auditLogRepository.bulkDelete(ids);

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const reset: RequestHandler = async (req, res, next) => {
  try {
    await auditLogRepository.reset();
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export default { browse, bulkDestroy, reset };

import type { Request, RequestHandler } from "express";
import validationLogRepository from "./validationLogRepository";
import type { AuthUser } from "../../types";

interface AuthenticatedRequest extends Request {
  auth: AuthUser;
}


const getMapData: RequestHandler = async (req, res, next) => {
  try {
    const ownerId = (req as unknown as AuthenticatedRequest).auth.id;

    const data = await validationLogRepository.getMapData(ownerId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getDAU: RequestHandler = async (req, res, next) => {
  try {
    const ownerId = (req as unknown as AuthenticatedRequest).auth.id;

    const data = await validationLogRepository.getDAU(ownerId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getAnomalies: RequestHandler = async (req, res, next) => {
  try {
    const ownerId = (req as unknown as AuthenticatedRequest).auth.id;

    const data = await validationLogRepository.getAnomalies(ownerId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export default { getMapData, getDAU, getAnomalies };

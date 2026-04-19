import type { Request, RequestHandler } from "express";
import resellerRepository from "./resellerRepository.js";
import userRepository from "./userRepository.js";
import type { AuthUser } from "../../types/index.js";
import auditLogRepository from "../audit/auditLogRepository.js";
import appRepository from "../app/appRepository.js";
import mailServerService from "../../services/mailServerService.js";

interface AuthenticatedRequest extends Request {
  auth: AuthUser;
}

const checkAppOwnership = async (user: AuthUser, appId: number) => {
  if (user.role === "admin") return true;
  const app = await appRepository.read(appId);
  return app && app.owner_id === user.id;
};

const browse: RequestHandler = async (req, res, next) => {
  try {
    const appId = Number(req.params.appId);
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!(await checkAppOwnership(actor, appId))) {
       res.status(403).json({ message: "Forbidden: You do not own this application" });
       return;
    }

    const resellers = await resellerRepository.listByAppId(appId);
    res.json(resellers);
  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    const { appId, email, keyQuota } = req.body;
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!(await checkAppOwnership(actor, appId))) {
        res.status(403).json({ message: "Forbidden: You do not own this application" });
        return;
    }

    // Check if domain has a valid mail server
    const hasMailServer = await mailServerService.checkMailServer(email);
    if (!hasMailServer) {
        res.status(400).json({ message: "The email domain does not appear to have a valid mail server." });
        return;
    }

    const user = await userRepository.readByEmail(email);
    if (!user) {
        res.status(404).json({ message: "User not found with this email" });
        return;
    }

    await resellerRepository.createReseller({
        user_id: user.id,
        app_id: appId,
        key_quota: keyQuota
    });

    await auditLogRepository.create({
        action: "RESELLER_ADD",
        details: `Added user ${user.username} as reseller for app ${appId} with quota ${keyQuota}`,
        user_id: actor.id,
        app_id: appId,
        ip_address: req.ip
    });

    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
    try {
        const userId = Number(req.params.userId);
        const appId = Number(req.params.appId);
        const actor = (req as unknown as AuthenticatedRequest).auth;

        if (!(await checkAppOwnership(actor, appId))) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        await resellerRepository.deleteReseller(userId, appId);
        
        await auditLogRepository.create({
            action: "RESELLER_REMOVE",
            details: `Removed user ID ${userId} as reseller for app ${appId}`,
            user_id: actor.id,
            app_id: appId,
            ip_address: req.ip
        });

        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};

export default { browse, add, destroy };

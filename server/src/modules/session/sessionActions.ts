import type { RequestHandler } from "express";
import crypto from "node:crypto";
import sessionRepository from "./sessionRepository.js";
import securityService from "../../services/security.js";
import appRepository from "../app/appRepository.js";

const initialize: RequestHandler = async (req, res, next) => {
  try {
    const { app_id } = req.body;

    const app = await appRepository.read(app_id);
    if (!app) {
      res.status(404).json({ message: "App not found" });
      return;
    }

    const sessionId = crypto.randomUUID();
    const nonce = securityService.generateSessionNonce();
    
    // Session expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await sessionRepository.create({
      id: sessionId,
      nonce,
      app_id,
      expires_at: expiresAt,
    });

    res.json({ session_id: sessionId, nonce });
  } catch (err) {
    next(err);
  }
};

export default { initialize };

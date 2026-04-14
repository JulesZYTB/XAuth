import type { RequestHandler } from "express";
import crypto from "node:crypto";
import licenseRepository from "./licenseRepository";
import appRepository from "../app/appRepository";
import sessionRepository from "../session/sessionRepository";
import securityService from "../../services/security";
import auditLogRepository from "../audit/auditLogRepository";


interface AuthUser {
  id: number;
  username: string;
  role: string;
}

// Dashboard action: Create a new license
const add: RequestHandler = async (req, res, next) => {
  try {
    const { license_key, expiry_date, app_id } = req.body;

    const id = await licenseRepository.create({
      license_key,
      expiry_date: new Date(expiry_date),
      app_id,
      status: "active",
    });

    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
};

// Client action: Validate a license (Omega Edition)
const validate: RequestHandler = async (req, res, next) => {
  try {
    const { license_key, hwid, app_secret, session_id } = req.body;
    const ip = req.ip || req.socket.remoteAddress;

    // 1. Session check
    const session = await sessionRepository.read(session_id);
    if (!session || new Date(session.expires_at) < new Date()) {
      res.status(403).json({ message: "Invalid or expired session. Please initialize handshake." });
      return;
    }

    const license = await licenseRepository.readByKey(license_key);
    if (!license) {
      res.status(404).json({ message: "License not found" });
      return;
    }

    const app = await appRepository.read(license.app_id);
    if (!app || app.secret_key !== app_secret) {
      res.status(401).json({ message: "Invalid app secret" });
      return;
    }

    if (new Date(license.expiry_date) < new Date()) {
      res.status(403).json({ message: "License expired" });
      return;
    }

    if (license.status !== "active") {
      res.status(403).json({ message: `License is ${license.status}` });
      return;
    }

    // HWID Check
    if (license.hwid && license.hwid !== hwid) {
      res.status(403).json({ message: "HWID mismatch" });
      return;
    }

    // IP Lock check
    if (license.ip_lock && license.ip_lock !== ip) {
      res.status(403).json({ message: "IP address blocked for this license" });
      return;
    }

    // Lock HWID/IP if not set
    if (!license.hwid && hwid) {
      await licenseRepository.updateHwid(license.id, hwid);
    }

    // 4. Finalize session (consume it)
    await sessionRepository.delete(session_id);

    // Prepare response data with Enterprise metadata
    const responseData = JSON.stringify({ 
      status: "success", 
      expiry: license.expiry_date,
      variables: JSON.parse(license.variables || "{}"),
      broadcast: app.broadcast_message || "Welcome to XAuth Omega protected software.",
    });

    // Encrypted response using app secret + session nonce as additional security
    const encryptionKey = app.secret_key + session.nonce;
    const encryptedResponse = securityService.encrypt(responseData, encryptionKey);

    res.json({ data: encryptedResponse });
  } catch (err) {
    next(err);
  }
};

const ban: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await licenseRepository.updateStatus(id, "banned");
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const unban: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await licenseRepository.updateStatus(id, "active");
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const resetHwid: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = (req as any).auth as AuthUser;
    
    await licenseRepository.resetHwid(id);
    
    // Log the action
    await auditLogRepository.create({
      action: "HWID_RESET",
      details: `Hardware ID reset for license ID: ${id}`,
      user_id: actor.id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"]
    });

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};


const browse: RequestHandler = async (req, res, next) => {
  try {
    const appId = Number(req.params.appId);
    const licenses = await licenseRepository.readByAppId(appId);
    res.json(licenses);
  } catch (err) {
    next(err);
  }
};

const myLicenses: RequestHandler = async (req, res, next) => {
  try {
    const userId = ((req as any).auth as AuthUser).id;
    const licenses = await licenseRepository.readByUserId(userId);
    res.json(licenses);
  } catch (err) {
    next(err);
  }
};

const redeem: RequestHandler = async (req, res, next) => {
  try {
    const { license_key } = req.body;
    const userId = ((req as any).auth as AuthUser).id;
    const affected = await licenseRepository.redeem(license_key, userId);
    
    if (affected === 0) {
      res.status(400).json({ message: "Invalid key or license already claimed" });
    } else {
      res.json({ message: "License successfully linked to your account" });
    }
  } catch (err) {
    next(err);
  }
};

const modify: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await licenseRepository.update(id, req.body);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await licenseRepository.delete(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export default { add, validate, browse, ban, unban, resetHwid, myLicenses, redeem, modify, destroy };

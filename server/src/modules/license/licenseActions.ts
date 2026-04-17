import type { Request, RequestHandler } from "express";

import crypto from "node:crypto";
import licenseRepository from "./licenseRepository.js";
import appRepository from "../app/appRepository.js";
import sessionRepository from "../session/sessionRepository.js";
import securityService from "../../services/security.js";
import auditLogRepository from "../audit/auditLogRepository.js";
import type { AuthUser } from "../../types/index.js";
import webhookService from "../../services/webhookService.js";
import geoService from "../../services/geoService.js";
import validationLogRepository from "../app/validationLogRepository.js";

interface AuthenticatedRequest extends Request {
  auth: AuthUser;
}


import { licenseCreateSchema, licenseRedeemSchema } from "../security/schemas.js";

// Dashboard action: Create a new license
const add: RequestHandler = async (req, res, next) => {
  try {
    const validation = licenseCreateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Invalid input", errors: validation.error.format() });
      return;
    }

    const { license_key, expiry_date, app_id } = validation.data;

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
    const ip = req.ip || req.socket.remoteAddress || "0.0.0.0";


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

    // Resolve geography once
    const geo = await geoService.lookup(ip);
    const country: string = geo.country ?? "Unknown";
    const country_code: string = geo.countryCode ?? "??";

    const app = await appRepository.read(license.app_id);
    if (!app || app.secret_key !== app_secret) {
      // Log failure (Unauthorized app access)
      await validationLogRepository.create({
        app_id: license.app_id,
        license_id: license.id,
        ip_address: ip,
        country: country as string,
        country_code: country_code as string,
        status: "failed",
        error_type: "UNAUTHORIZED_APP"
      });

      res.status(401).json({ message: "Invalid app secret" });
      return;
    }

    // KILL-SWITCH CHECK
    if (app.is_paused) {
      // Log failure (System paused)
      await validationLogRepository.create({
        app_id: app.id,
        license_id: license.id,
        ip_address: ip,
        country: country as string,
        country_code: country_code as string,
        status: "failed",
        error_type: "SYSTEM_PAUSED"
      });

      res.status(403).json({ message: "System under maintenance. Access temporarily suspended." });
      return;
    }

    if (new Date(license.expiry_date) < new Date()) {
      await validationLogRepository.create({
        app_id: app.id,
        license_id: license.id,
        ip_address: ip,
        country: country as string,
        country_code: country_code as string,
        status: "failed",
        error_type: "EXPIRED"
      });

      res.status(403).json({ message: "License expired" });
      return;
    }

    if (license.status !== "active") {
      await validationLogRepository.create({
        app_id: app.id,
        license_id: license.id,
        ip_address: ip,
        country: country as string,
        country_code: country_code as string,
        status: "failed",
        error_type: "BANNED"
      });

      res.status(403).json({ message: `License is ${license.status}` });
      return;
    }

    // HWID Check
    if (license.hwid && license.hwid !== hwid) {
       await validationLogRepository.create({
        app_id: app.id,
        license_id: license.id,
        ip_address: ip,
        country: country as string,
        country_code: country_code as string,
        status: "failed",
        error_type: "HWID_MISMATCH"
      });

      res.status(403).json({ message: "HWID mismatch" });
      return;
    }

    // IP Lock check
    if (license.ip_lock && license.ip_lock !== ip) {
       await validationLogRepository.create({
        app_id: app.id,
        license_id: license.id,
        ip_address: ip,
        country: country as string,
        country_code: country_code as string,
        status: "failed",
        error_type: "IP_MISMATCH"
      });

      res.status(403).json({ message: "IP address blocked for this license" });
      return;
    }

    // Lock HWID/IP if not set
    if (!license.hwid && hwid) {
      await licenseRepository.updateHwid(license.id, hwid);
    }

    // Log success
    await validationLogRepository.create({
      app_id: app.id,
      license_id: license.id,
      ip_address: ip || "0.0.0.0",
      country: country as string,
      country_code: country_code as string,
      status: "success"
    });



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
    const license = await licenseRepository.read(id);
    await licenseRepository.updateStatus(id, "banned");
    
    // Webhook dispatch
    if (license) {
      await webhookService.dispatch(license.app_id, "BAN", { license_id: id, key: license.license_key });
    }
    
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const unban: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const license = await licenseRepository.read(id);
    await licenseRepository.updateStatus(id, "active");
    
    // Webhook dispatch
    if (license) {
      await webhookService.dispatch(license.app_id, "UNBAN", { license_id: id, key: license.license_key });
    }
    
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const resetHwid: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = (req as unknown as AuthenticatedRequest).auth;


    const license = await licenseRepository.read(id);
    
    await licenseRepository.resetHwid(id);
    
    // Log the action
    await auditLogRepository.create({
      action: "HWID_RESET",
      details: `Hardware ID reset for license ID: ${id}`,
      user_id: actor.id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"]
    });

    // Webhook dispatch
    if (license) {
      await webhookService.dispatch(license.app_id, "RESET_HWID", { license_id: id, key: license.license_key });
    }

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};


// Helper for generating randomized keys
function generateRandomKey(pattern = "XXXX-XXXX-XXXX") {
  return pattern.replace(/X/g, () => crypto.randomBytes(1).toString("hex").charAt(0).toUpperCase());
}

const regenerateKey: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = (req as unknown as AuthenticatedRequest).auth;


    const license = await licenseRepository.read(id);
    const newKey = generateRandomKey();
    
    await licenseRepository.updateKey(id, newKey);
    
    await auditLogRepository.create({
      action: "KEY_REGENERATE",
      details: `License key regenerated for ID: ${id}`,
      user_id: actor.id,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"]
    });

    // Webhook dispatch
    if (license) {
      await webhookService.dispatch(license.app_id, "KEY_REGENERATE", { license_id: id, old_key: license.license_key, new_key: newKey });
    }

    res.json({ newKey });
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
    const userId = (req as unknown as AuthenticatedRequest).auth.id;


    const licenses = await licenseRepository.readByUserId(userId);
    res.json(licenses);
  } catch (err) {
    next(err);
  }
};

const redeem: RequestHandler = async (req, res, next) => {
  try {
    const validation = licenseRedeemSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Invalid input", errors: validation.error.format() });
      return;
    }

    const { license_key } = validation.data;
    const userId = (req as unknown as AuthenticatedRequest).auth.id;



    
    // Get license info before redemption for webhook
    const license = await licenseRepository.readByKey(license_key);
    
    const affected = await licenseRepository.redeem(license_key, userId);
    
    if (affected === 0) {
      res.status(400).json({ message: "Invalid key or license already claimed" });
    } else {
      // Webhook dispatch
      if (license) {
        await webhookService.dispatch(license.app_id, "REDEEM", { license_id: license.id, key: license_key, user_id: userId });
      }
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

export default { add, validate, browse, ban, unban, resetHwid, regenerateKey, myLicenses, redeem, modify, destroy };

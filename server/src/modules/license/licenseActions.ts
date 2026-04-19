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
import trialRepository from "../app/trialRepository.js";
import resellerRepository from "../admin/resellerRepository.js";

interface AuthenticatedRequest extends Request {
  auth: AuthUser;
}


import { licenseCreateSchema, licenseRedeemSchema } from "../security/schemas.js";

// Helper for random key generation
const generateRandomKey = (mask: string = "XXXX-XXXX-XXXX") => {
  return mask.replace(/X/g, () => crypto.randomBytes(1).toString("hex").substring(0, 1).toUpperCase());
};

// Helper to check if user owns the app or is admin
const checkOwnership = async (user: AuthUser, appId: number) => {
  if (user.role === "admin") return true;
  const app = await appRepository.read(appId);
  if (app && app.owner_id === user.id) return true;
  
  // Check if user is a reseller for this app
  const reseller = await resellerRepository.getReseller(user.id, appId);
  return !!reseller;
};

// Helper to check if user owns the license (via app ownership)
const checkLicenseOwnership = async (user: AuthUser, licenseId: number) => {
  if (user.role === "admin") return true;
  const license = await licenseRepository.read(licenseId);
  if (!license) return false;
  return await checkOwnership(user, license.app_id);
};

// Dashboard action: Create a new license
const add: RequestHandler = async (req, res, next) => {
  try {
    const validation = licenseCreateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Invalid input", errors: validation.error.format() });
      return;
    }

    const { license_key, expiry_date, app_id } = validation.data;
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!(await checkOwnership(actor, app_id))) {
      res.status(403).json({ message: "Forbidden: You do not own this application" });
      return;
    }

    const id = await licenseRepository.create({
      license_key: license_key as string,
      expiry_date: new Date(expiry_date as string),
      app_id: Number(app_id),
      status: "active",
    });

    // If actor is a reseller, increment their keys_generated count
    if (actor.role !== "admin") {
      const app = await appRepository.read(app_id);
      if (app && app.owner_id !== actor.id) {
          const reseller = await resellerRepository.getReseller(actor.id, app_id);
          if (reseller) {
              if (reseller.keys_generated >= reseller.key_quota) {
                  res.status(403).json({ message: "Quota de revendeur atteint. Veuillez contacter l'administrateur." });
                  return;
              }
              await resellerRepository.incrementKeysGenerated(actor.id, app_id);
          }
      }
    }

    await auditLogRepository.create({
      action: "LICENSE_CREATE",
      details: `License created for app ID: ${app_id} (License ID: ${id})`,
      user_id: actor.id,
      app_id: Number(app_id),
      ip_address: req.ip || req.socket.remoteAddress,
      user_agent: req.headers["user-agent"]
    });

    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
};



// Client action: Validate a license (Omega Edition)
const validate: RequestHandler = async (req, res, next) => {
  try {
    const { license_key, hwid, app_secret, session_id, error_type, details } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "0.0.0.0";

    // 0. Manual Security Signal (Debugger/Bypass detected by client)
    if (error_type === "BYPASS_DETECTED" || error_type === "DEBUGGER_DETECTED") {
      const license = await licenseRepository.readByKey(license_key);
      const geo = await geoService.lookup(ip);

      if (license) {
        await validationLogRepository.create({
          app_id: license.app_id,
          license_id: license.id,
          ip_address: ip,
          country: geo.country || "Unknown",
          country_code: geo.countryCode || "??",
          status: "failed",
          error_type: error_type,
          details: details
        });

        // Intelligent Auto-Ban System
        const threatCount = await validationLogRepository.countBypassAttempts(license.id);
        if (threatCount >= 3 && license.status !== "banned") {
          await licenseRepository.updateStatus(license.id, "banned");
          
          // Log the auto-ban
          await auditLogRepository.create({
            action: "AUTO_BAN",
            details: `License auto-banned after ${threatCount} security violations. Last trigger: ${error_type}.`,
            ip_address: ip,
            app_id: license.app_id
          });
          
          // Dispatch webhook for automation
          await webhookService.dispatch(license.app_id, "BAN", { 
            license_id: license.id, 
            key: license.license_key,
            reason: "AUTO_BAN_SECURITY_VIOLATION",
            attempts: threatCount
          });
        }
      } else {
         await validationLogRepository.create({
          app_id: 0,
          ip_address: ip,
          country: geo.country || "Unknown",
          country_code: geo.countryCode || "??",
          status: "failed",
          error_type: error_type,
          details: details
        });
      }

      // Log to audit trial for persistent visibility
      await auditLogRepository.create({
        action: "BYPASS_DETECTED",
        details: details || `Bypass tool detected by client. License: ${license_key}`,
        ip_address: ip,
        app_id: license?.app_id || 0
      });

      res.status(403).json({ message: "Security Integrity Violation Detected" });
      return;
    }

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

    // HWID Blacklist System (Sticky Banning)
    if (hwid) {
      const hwidHash = securityService.hash(hwid);
      if (await licenseRepository.isHwidBlacklisted(hwidHash)) {
        if (license.status !== "banned") {
          await licenseRepository.updateStatus(license.id, "banned");
          
          await auditLogRepository.create({
            action: "AUTO_BAN_HWID_BLACKLIST",
            details: `License auto-banned: hardware ID belongs to a previously banned user.`,
            ip_address: ip,
            app_id: license.app_id
          });
          
          await webhookService.dispatch(license.app_id, "BAN", { 
            license_id: license.id, 
            key: license.license_key, 
            reason: "HWID_BLACKLISTED" 
          });
        }
        res.status(403).json({ message: "Security Violation: Hardware ID is blacklisted." });
        return;
      }
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
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!(await checkLicenseOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this license" });
      return;
    }

    const license = await licenseRepository.read(id);
    await licenseRepository.updateStatus(id, "banned");
    
    await auditLogRepository.create({
      action: "LICENSE_BAN",
      details: `License banned (ID: ${id})`,
      user_id: actor.id,
      app_id: license?.app_id || 0,
      ip_address: req.ip || req.socket.remoteAddress,
      user_agent: req.headers["user-agent"]
    });
    
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
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!(await checkLicenseOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this license" });
      return;
    }

    const license = await licenseRepository.read(id);
    await licenseRepository.updateStatus(id, "active");
    
    await auditLogRepository.create({
      action: "LICENSE_UNBAN",
      details: `License unbanned (ID: ${id})`,
      user_id: actor.id,
      app_id: license?.app_id || 0,
      ip_address: req.ip || req.socket.remoteAddress,
      user_agent: req.headers["user-agent"]
    });
    
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

    if (!(await checkLicenseOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this license" });
      return;
    }

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


const regenerateKey: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!(await checkLicenseOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this license" });
      return;
    }

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
    if (isNaN(appId)) {
      res.status(400).json({ message: "Invalid application ID" });
      return;
    }
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!(await checkOwnership(actor, appId))) {
      res.status(403).json({ message: "Forbidden: You do not own this application" });
      return;
    }

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
        
        await auditLogRepository.create({
          action: "LICENSE_REDEEM",
          details: `License redeemed (ID: ${license.id}) by user: ${userId}`,
          user_id: userId,
          app_id: license.app_id,
          ip_address: req.ip || req.socket.remoteAddress,
          user_agent: req.headers["user-agent"]
        });
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
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!(await checkLicenseOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this license" });
      return;
    }

    const license = await licenseRepository.read(id);
    await licenseRepository.update(id, req.body);
    
    await auditLogRepository.create({
      action: "LICENSE_MODIFY",
      details: `License modified (ID: ${id})`,
      user_id: actor.id,
      app_id: license?.app_id || 0,
      ip_address: req.ip || req.socket.remoteAddress,
      user_agent: req.headers["user-agent"]
    });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!(await checkLicenseOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this license" });
      return;
    }

    await licenseRepository.delete(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const setVariable: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { key, value } = req.body;
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (!(await checkLicenseOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this license" });
      return;
    }

    const license = await licenseRepository.read(id);
    if (!license) {
      res.status(404).json({ message: "License not found" });
      return;
    }

    const variables = typeof license.variables === 'string' ? JSON.parse(license.variables) : (license.variables || {});
    variables[key] = value;

    await licenseRepository.update(id, { variables: JSON.stringify(variables) });
    
    await auditLogRepository.create({
      action: "LICENSE_VAR_SET",
      details: `Variable '${key}' set for license ID: ${id}`,
      user_id: actor.id,
      ip_address: req.ip || req.socket.remoteAddress,
      user_agent: req.headers["user-agent"]
    });

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const requestTrial: RequestHandler = async (req, res, next) => {
  try {
    const { app_id, hwid } = req.body;
    const actor = (req as unknown as AuthenticatedRequest).auth;
    const hwidHash = securityService.hash(hwid);

    if (await trialRepository.hasTrialed(app_id, hwidHash)) {
      res.status(403).json({ message: "Vous avez déjà réclamé votre essai gratuit pour cette application." });
      return;
    }

    // Generate 24h key
    const trialKey = "TRIAL-" + generateRandomKey("XXXX-XXXX");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    const id = await licenseRepository.create({
      license_key: trialKey,
      expiry_date: expiry,
      app_id: Number(app_id),
      status: "active",
      user_id: actor.id,
      hwid: securityService.dbEncrypt(hwid),
      hwid_hash: hwidHash
    });

    await trialRepository.addTrialLog(app_id, hwidHash);

    await auditLogRepository.create({
      action: "LICENSE_TRIAL_REQUEST",
      details: `Trial license requested for app ID: ${app_id} (License ID: ${id})`,
      user_id: actor.id,
      ip_address: req.ip || req.socket.remoteAddress,
      user_agent: req.headers["user-agent"]
    });

    res.status(201).json({ key: trialKey, expiry });
  } catch (err) {
    next(err);
  }
};


export default { add, validate, browse, ban, unban, resetHwid, regenerateKey, myLicenses, redeem, modify, destroy, setVariable, requestTrial };

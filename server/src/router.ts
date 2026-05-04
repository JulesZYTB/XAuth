import express from "express";
import rateLimit from "express-rate-limit";

const router = express.Router();

/**
 * Security: Strict Rate Limiting for Authentication
 * Prevents brute-force attacks on login and registration.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { message: "Too many authentication attempts, please try again." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Security: Dedicated Registration Rate Limiter
 * Stricter limit to prevent mass account creation bots.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // Only 2 accounts per hour per IP
  message: { message: "Account creation limit reached. Please try again." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

/**
 * Security: Rate Limiting for License Creation
 * Strictly limits license creation to prevent spam.
 */
const licenseCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 license per minute
  message: { message: "Rate limit exceeded. Please try again." },
  keyGenerator: (req) => {
    // Limit by app_id if provided (for external API) or by user ID
    return String(req.body.app_id || (req as any).auth?.id || req.ip);
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

/* ************************************************************************* */
// Define Your API Routes Here
/* ************************************************************************* */

import userActions from "./modules/admin/userActions.js";
import appActions from "./modules/app/appActions.js";
import licenseActions from "./modules/license/licenseActions.js";
import auditLogActions from "./modules/audit/auditLogActions.js";
import sessionActions from "./modules/session/sessionActions.js";
import dashboardActions from "./modules/admin/dashboardActions.js";
import { verifyToken, isAdmin } from "./modules/admin/authMiddleware.js";
import webhookActions from "./modules/app/webhookActions.js";
import analyticsActions from "./modules/app/analyticsActions.js";
import releaseActions from "./modules/app/releaseActions.js";
import updateActions from "./modules/app/updateActions.js";
import apiKeyActions from "./modules/admin/apiKeyActions.js";
import searchActions from "./modules/admin/searchActions.js";
import resellerActions from "./modules/admin/resellerActions.js";
import { blockDisposableEmail, intelligentSpamCheck } from "./modules/security/spamProtection.js";



// --- CLIENT AUTH API (Public with Secret) ---
router.post("/api/v1/client/initialize", sessionActions.initialize);
router.post("/api/v1/client/validate", licenseActions.validate);
router.post("/api/v1/client/verify-version", updateActions.verify);
router.post("/api/v1/licenses/external-create", licenseCreationLimiter, licenseActions.externalCreate);

// --- PUBLIC UPDATE GATEWAY ---
router.get("/api/update/:appId/:channel", updateActions.check);

// --- IDENTITY API (Public with Strict Rate Limiting) ---
router.post("/api/auth/login", authLimiter, userActions.login);
router.post("/api/auth/register", registerLimiter, blockDisposableEmail, intelligentSpamCheck, userActions.register);

// Protected routes (Requires valid JWT)
router.use(verifyToken);

// PROFILE & SECURITY (Self)
router.put("/api/auth/profile", userActions.updateProfile);
router.get("/api/api-keys", apiKeyActions.browse);
router.post("/api/api-keys", apiKeyActions.add);
router.delete("/api/api-keys/:id", apiKeyActions.destroy);

// GLOBAL SEARCH
router.get("/api/search", searchActions.globalSearch);


// --- USER / DEVELOPER PORTFOLIO (Requires Authenticated Session) ---
// These routes handle resources owned by the user (Apps, Licenses, Webhooks)

// APPS (Full CRUD - appActions checks owner_id)
router.get("/api/apps", appActions.browse);
router.post("/api/apps", appActions.add);
router.patch("/api/apps/:id", appActions.edit);
router.patch("/api/apps/:id/toggle-pause", appActions.togglePause);
router.delete("/api/apps/:id", appActions.destroy);

// WEBHOOKS (appActions/webhookActions should verify ownership)
router.get("/api/apps/:appId/webhooks", webhookActions.browse);
router.post("/api/webhooks", webhookActions.add);
router.patch("/api/webhooks/:id", webhookActions.edit);
router.delete("/api/webhooks/:id", webhookActions.destroy);

// RELEASES (appActions/releaseActions should verify ownership)
router.get("/api/apps/:appId/releases", releaseActions.browse);
router.post("/api/releases", releaseActions.add);
router.patch("/api/releases/:id", releaseActions.edit);
router.delete("/api/releases/:id", releaseActions.destroy);

// LICENSES - USER ACTIONS (Redeem & Browse My)
router.get("/api/my-licenses", licenseActions.myLicenses);
router.post("/api/licenses/redeem", licenseActions.redeem);
router.post("/api/licenses/request-trial", licenseActions.requestTrial);

// LICENSES - DEVELOPER ACTIONS (Manage licenses for owned apps)
// NOTE: Ownership checks are required in these actions
router.get("/api/apps/:appId/licenses", licenseActions.browse);
router.post("/api/licenses", licenseCreationLimiter, licenseActions.add);
router.delete("/api/licenses/bulk", licenseActions.bulkDestroy);
router.patch("/api/licenses/:id", licenseActions.modify);
router.patch("/api/licenses/:id/ban", licenseActions.ban);
router.patch("/api/licenses/:id/unban", licenseActions.unban);
router.patch("/api/licenses/:id/reset-hwid", licenseActions.resetHwid);
router.patch("/api/licenses/:id/regenerate", licenseActions.regenerateKey);
router.patch("/api/licenses/:id/variables/set", licenseActions.setVariable);
router.delete("/api/licenses/:id", licenseActions.destroy);
router.delete("/api/apps/:appId/licenses/purge-long", licenseActions.purgeLongExpiry);
router.delete("/api/apps/:appId/licenses/purge-by-date", licenseActions.purgeByExpiryDate);

// APP-SPECIFIC ANALYTICS
router.get("/api/apps/:appId/dashboard/stats", dashboardActions.getStats);
router.get("/api/apps/:appId/dashboard/map", dashboardActions.getMap);
router.get("/api/apps/:appId/dashboard/dau", dashboardActions.getDau);
router.get("/api/apps/:appId/dashboard/anomalies", dashboardActions.getAnomalies);
router.get("/api/apps/:appId/dashboard/auditor-scan", dashboardActions.getAuditorScan);
router.delete("/api/apps/:appId/dashboard/threats", dashboardActions.clearThreats);

// RESELLERS MANAGEMENT
router.get("/api/apps/:appId/resellers", resellerActions.browse);
router.post("/api/resellers", resellerActions.add);
router.delete("/api/apps/:appId/resellers/:userId", resellerActions.destroy);



// --- SYSTEM ADMINISTRATION (Admin Only) ---
router.use(isAdmin);

// USERS MANAGEMENT
router.get("/api/users", userActions.browse);
router.delete("/api/users/bulk", userActions.bulkDestroy);
router.patch("/api/users/:id", userActions.editRole);
router.delete("/api/users/:id", userActions.destroy);

// AUDIT TRAIL
router.get("/api/logs", auditLogActions.browse);
router.delete("/api/logs/bulk", auditLogActions.bulkDestroy);
router.delete("/api/logs/reset", auditLogActions.reset);

// GLOBAL DASHBOARD ANALYTICS
router.get("/api/dashboard/stats", dashboardActions.getStats);
router.get("/api/dashboard/map", dashboardActions.getMap);
router.get("/api/dashboard/dau", dashboardActions.getDau);
router.get("/api/dashboard/anomalies", dashboardActions.getAnomalies);
router.get("/api/dashboard/auditor-scan", dashboardActions.getAuditorScan);
router.delete("/api/dashboard/threats", dashboardActions.clearThreats);


export default router;

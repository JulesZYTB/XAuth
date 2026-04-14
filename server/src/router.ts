import express from "express";

const router = express.Router();

/* ************************************************************************* */
// Define Your API Routes Here
/* ************************************************************************* */

import userActions from "./modules/admin/userActions";
import appActions from "./modules/app/appActions";
import licenseActions from "./modules/license/licenseActions";
import auditLogActions from "./modules/audit/auditLogActions";
import sessionActions from "./modules/session/sessionActions";
import dashboardActions from "./modules/admin/dashboardActions";
import verifyToken from "./modules/admin/authMiddleware";
import webhookActions from "./modules/app/webhookActions";
import analyticsActions from "./modules/app/analyticsActions";
import releaseActions from "./modules/app/releaseActions";
import updateActions from "./modules/app/updateActions";


// --- CLIENT AUTH API (Public with Secret) ---
router.post("/api/v1/client/initialize", sessionActions.initialize);
router.post("/api/v1/client/validate", licenseActions.validate);

// --- PUBLIC UPDATE GATEWAY ---
router.get("/api/update/:appId/:channel", updateActions.check);

// --- IDENTITY API (Public) ---
router.post("/api/auth/login", userActions.login);
router.post("/api/auth/register", userActions.register);

// Protected routes
router.use(verifyToken);

// PROFILE (Self)
router.put("/api/auth/profile", userActions.updateProfile);

// USERS CRUD
router.get("/api/users", userActions.browse);
router.patch("/api/users/:id", userActions.editRole);
router.delete("/api/users/:id", userActions.destroy);

// APPS CRUD
router.get("/api/apps", appActions.browse);
router.post("/api/apps", appActions.add);
router.patch("/api/apps/:id", appActions.edit);
router.patch("/api/apps/:id/toggle-pause", appActions.togglePause);
router.delete("/api/apps/:id", appActions.destroy);

// WEBHOOKS CRUD
router.get("/api/apps/:appId/webhooks", webhookActions.browse);
router.post("/api/webhooks", webhookActions.add);
router.patch("/api/webhooks/:id", webhookActions.edit);
router.delete("/api/webhooks/:id", webhookActions.destroy);

// RELEASE MANAGEMENT
router.get("/api/apps/:appId/releases", releaseActions.browse);
router.post("/api/releases", releaseActions.add);
router.patch("/api/releases/:id", releaseActions.edit);
router.delete("/api/releases/:id", releaseActions.destroy);

// LICENSES CRUD
router.get("/api/my-licenses", licenseActions.myLicenses);
router.post("/api/licenses/redeem", licenseActions.redeem);
router.get("/api/apps/:appId/licenses", licenseActions.browse);
router.post("/api/licenses", licenseActions.add);
router.patch("/api/licenses/:id", licenseActions.modify);
router.patch("/api/licenses/:id/ban", licenseActions.ban);
router.patch("/api/licenses/:id/unban", licenseActions.unban);
router.patch("/api/licenses/:id/reset-hwid", licenseActions.resetHwid);
router.patch("/api/licenses/:id/regenerate", licenseActions.regenerateKey);
router.delete("/api/licenses/:id", licenseActions.destroy);


// AUDIT LOGS
router.get("/api/logs", auditLogActions.browse);

// ADMIN DASHBOARD
router.get("/api/admin/stats", dashboardActions.getStats);

export default router;

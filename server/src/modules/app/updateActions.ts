import type { RequestHandler } from "express";
import releaseRepository from "./releaseRepository.js";
import appRepository from "./appRepository.js";
import { versionVerifySchema } from "../security/schemas.js";

/**
 * Public endpoint for clients to check for updates.
 * GET /api/update/:appId/:channel
 */
const check: RequestHandler = async (req, res, next) => {
  try {
    const appId = Number(req.params.appId);
    const channel = req.params.channel || "stable";
    
    const release = await releaseRepository.getLatest(appId, channel);
    
    if (!release) {
      res.status(404).json({ message: "No active release found for this channel." });
      return;
    }

    res.json({
      version: release.version,
      channel: release.channel,
      url: release.download_url,
      checksum: release.checksum,
      published_at: release.created_at
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Secure endpoint for clients to verify version with app id and secret.
 * POST /api/v1/client/verify-version
 */
const verify: RequestHandler = async (req, res, next) => {
  try {
    const validation = versionVerifySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Invalid input", errors: validation.error.format() });
      return;
    }

    const { app_id, app_secret, channel, current_version } = validation.data;

    // 1. Verify App & Secret
    const app = await appRepository.read(app_id);
    if (!app || app.secret_key !== app_secret) {
      res.status(401).json({ message: "Invalid application credentials" });
      return;
    }

    // 2. Kill-Switch Check
    if (app.is_paused) {
      res.status(403).json({ message: "Application access is temporarily suspended (Kill-Switch Active)." });
      return;
    }

    // 3. Get Latest Release
    const release = await releaseRepository.getLatest(app_id, channel);
    
    if (!release) {
      res.status(404).json({ message: "No active release found for this channel." });
      return;
    }

    res.json({
      version: release.version,
      channel: release.channel,
      url: release.download_url,
      checksum: release.checksum,
      published_at: release.created_at,
      update_available: current_version ? release.version !== current_version : false,
      broadcast: app.broadcast_message || null
    });
  } catch (err) {
    next(err);
  }
};

export default { check, verify };

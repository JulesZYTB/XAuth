import type { RequestHandler } from "express";
import releaseRepository from "./releaseRepository";
import appRepository from "./appRepository";

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

export default { check };

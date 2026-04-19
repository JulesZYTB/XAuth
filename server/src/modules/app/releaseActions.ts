import type { RequestHandler } from "express";
import releaseRepository from "./releaseRepository.js";
import appRepository from "./appRepository.js";
import type { AuthUser } from "../../types/index.js";
import resellerRepository from "../admin/resellerRepository.js";

// Helper to check ownership
const checkOwnership = async (user: AuthUser, appId: number) => {
  if (user.role === "admin") return true;
  const app = await appRepository.read(appId);
  return app && app.owner_id === user.id;
};

// Helper to check if user owns the release (via app ownership)
const checkReleaseOwnership = async (user: AuthUser, releaseId: number) => {
  if (user.role === "admin") return true;
  const release = await releaseRepository.read(releaseId);
  if (!release) return false;
  return await checkOwnership(user, release.app_id);
};

const browse: RequestHandler = async (req, res, next) => {
  try {
    const appId = Number(req.params.appId);
    if (isNaN(appId)) {
      res.status(400).json({ message: "Invalid application ID" });
      return;
    }
    const actor = (req as any).auth as AuthUser;

    if (!(await checkOwnership(actor, appId))) {
        res.status(403).json({ message: "Forbidden: You do not own this application" });
        return;
    }

    const releases = await releaseRepository.readByAppId(appId);
    res.json(releases);

  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    const { app_id, version, channel, download_url, checksum } = req.body;
    const actor = (req as any).auth as AuthUser;

    if (!(await checkOwnership(actor, app_id))) {
      res.status(403).json({ message: "Forbidden: You do not own this application" });
      return;
    }

    const id = await releaseRepository.create({
      app_id,
      version,
      channel,
      download_url,
      checksum,
      is_active: true,
      is_banned: false
    });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
};


const edit: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid release ID" });
      return;
    }
    const actor = (req as any).auth as AuthUser;

    if (!(await checkReleaseOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this release" });
      return;
    }

    await releaseRepository.update(id, req.body);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};


const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = (req as any).auth as AuthUser;

    if (!(await checkReleaseOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this release" });
      return;
    }

    await releaseRepository.delete(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};


export default { browse, add, edit, destroy };

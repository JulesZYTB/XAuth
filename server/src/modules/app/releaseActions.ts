import type { RequestHandler } from "express";
import releaseRepository from "./releaseRepository";
import type { AuthUser } from "../../types";

const browse: RequestHandler = async (req, res, next) => {
  try {
    const appId = Number(req.params.appId);
    const releases = await releaseRepository.readByAppId(appId);
    res.json(releases);
  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    const { app_id, version, channel, download_url, checksum } = req.body;
    const id = await releaseRepository.create({
      app_id,
      version,
      channel,
      download_url,
      checksum,
      is_active: true
    });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
};

const edit: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await releaseRepository.update(id, req.body);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await releaseRepository.delete(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export default { browse, add, edit, destroy };

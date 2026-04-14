import type { RequestHandler } from "express";
import webhookRepository from "./webhookRepository";
import type { AuthUser } from "../../types";

const browse: RequestHandler = async (req, res, next) => {
  try {
    const appId = Number(req.params.appId);
    const hooks = await webhookRepository.readByAppId(appId);
    res.json(hooks);
  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    const { url, event_types, app_id, secret } = req.body;
    const insertId = await webhookRepository.create({
      app_id,
      url,
      event_types,
      secret,
      is_enabled: true
    });
    res.status(201).json({ id: insertId });
  } catch (err) {
    next(err);
  }
};

const edit: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await webhookRepository.update(id, req.body);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await webhookRepository.delete(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export default { browse, add, edit, destroy };

import type { RequestHandler } from "express";
import type { AuthUser } from "../../types/index.js";
import webhookRepository from "./webhookRepository.js";
import appRepository from "./appRepository.js";


// Helper to check ownership
const checkOwnership = async (user: AuthUser, appId: number) => {
  if (user.role === "admin") return true;
  const app = await appRepository.read(appId);
  return app && app.owner_id === user.id;
};

// Helper to check if user owns the webhook (via app ownership)
const checkWebhookOwnership = async (user: AuthUser, webhookId: number) => {
  if (user.role === "admin") return true;
  const hook = await webhookRepository.read(webhookId);
  if (!hook) return false;
  return await checkOwnership(user, hook.app_id);
};

const browse: RequestHandler = async (req, res, next) => {
  try {
    const appId = Number(req.params.appId);
    const actor = (req as any).auth as AuthUser;

    if (!(await checkOwnership(actor, appId))) {
        res.status(403).json({ message: "Forbidden: You do not own this application" });
        return;
    }

    const hooks = await webhookRepository.readByAppId(appId);
    res.json(hooks);

  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    const { url, event_types, app_id, secret } = req.body;
    const actor = (req as any).auth as AuthUser;

    if (!(await checkOwnership(actor, app_id))) {
      res.status(403).json({ message: "Forbidden: You do not own this application" });
      return;
    }

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
    const actor = (req as any).auth as AuthUser;

    if (!(await checkWebhookOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this webhook" });
      return;
    }

    await webhookRepository.update(id, req.body);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};


const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = (req as any).auth as AuthUser;

    if (!(await checkWebhookOwnership(actor, id))) {
      res.status(403).json({ message: "Forbidden: You do not own this webhook" });
      return;
    }

    await webhookRepository.delete(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};


export default { browse, add, edit, destroy };

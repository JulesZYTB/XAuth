import type { Request, RequestHandler } from "express";
import crypto from "node:crypto";
import appRepository from "./appRepository.js";
import type { AuthUser } from "../../types/index.js";

interface AuthenticatedRequest extends Request {
  auth: AuthUser;
}

const browse: RequestHandler = async (req, res, next) => {
  try {
    const actor = (req as AuthenticatedRequest).auth;
    
    let apps;
    if (actor.role === "admin") {
      // Admins see everything
      const [allApps] = await (await import("../../../database/client.js")).default.query("select * from app");
      apps = allApps;
    } else {
      // Regular users see only their own
      apps = await appRepository.readByOwnerId(actor.id);
    }
    
    res.json(apps);
  } catch (err) {
    next(err);
  }
};


import { appSchema } from "../security/schemas.js";

const add: RequestHandler = async (req, res, next) => {
  try {
    const validation = appSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Invalid input", errors: validation.error.format() });
      return;
    }

    const { name } = validation.data;
    const ownerId = (req as unknown as AuthenticatedRequest).auth.id;





    const secret_key = crypto.randomBytes(16).toString("hex");

    const insertId = await appRepository.create({
      name,
      secret_key,
      owner_id: ownerId,
      is_paused: false,
    });

    res.status(201).json({ insertId, secret_key });
  } catch (err) {
    next(err);
  }
};

const edit: RequestHandler = async (req, res, next) => {
  try {
    const validation = appSchema.partial().safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Invalid input", errors: validation.error.format() });
      return;
    }

    const id = Number(req.params.id);
    const actor = (req as unknown as AuthenticatedRequest).auth;

    if (actor.role === "admin") {
      await appRepository.updateAdmin(id, validation.data);
    } else {
      await appRepository.update(id, actor.id, validation.data);
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};



const togglePause: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = (req as unknown as AuthenticatedRequest).auth;

    const app = await appRepository.read(id);
    if (!app || (actor.role !== "admin" && app.owner_id !== actor.id)) {
       res.status(404).json({ message: "App not found or unauthorized" });
       return;
    }

    const newData = { is_paused: !app.is_paused };
    if (actor.role === "admin") {
      await appRepository.updateAdmin(id, newData);
    } else {
      await appRepository.update(id, actor.id, newData);
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};


const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = (req as unknown as Request & { auth: AuthUser }).auth;

    let affected;
    if (actor.role === "admin") {
      affected = await appRepository.deleteAdmin(id);
    } else {
      affected = await appRepository.delete(id, actor.id);
    }

    if (affected === 0) {
      res.status(404).json({ message: "App not found or unauthorized" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};


export default { browse, add, destroy, edit, togglePause };

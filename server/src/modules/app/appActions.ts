import type { Request, RequestHandler } from "express";
import crypto from "node:crypto";
import appRepository from "./appRepository";
import type { AuthUser } from "../../types";

interface AuthenticatedRequest extends Request {
  auth: AuthUser;
}

const browse: RequestHandler = async (req, res, next) => {
  try {
    const ownerId = (req as AuthenticatedRequest).auth.id;



    const apps = await appRepository.readByOwnerId(ownerId);
    res.json(apps);
  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    const { name } = req.body;
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
    const id = Number(req.params.id);
    const ownerId = (req as unknown as AuthenticatedRequest).auth.id;



    await appRepository.update(id, ownerId, req.body);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const togglePause: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const ownerId = (req as unknown as AuthenticatedRequest).auth.id;



    
    const app = await appRepository.read(id);
    if (!app || app.owner_id !== ownerId) {
       res.status(404).json({ message: "App not found or unauthorized" });
       return;
    }

    await appRepository.update(id, ownerId, { is_paused: !app.is_paused });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {

  try {
    const id = Number(req.params.id);
    const ownerId = (req as unknown as Request & { auth: AuthUser }).auth.id;



    await appRepository.delete(id, ownerId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export default { browse, add, destroy, edit, togglePause };

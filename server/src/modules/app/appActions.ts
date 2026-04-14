import type { RequestHandler } from "express";
import crypto from "node:crypto";
import appRepository from "./appRepository";
import type { AuthUser } from "../../types";


const browse: RequestHandler = async (req, res, next) => {
  try {
    const ownerId = ((req as any).auth as AuthUser).id;
    const apps = await appRepository.readByOwnerId(ownerId);
    res.json(apps);
  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    const { name } = req.body;
    const ownerId = ((req as any).auth as AuthUser).id;

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
    const ownerId = ((req as any).auth as AuthUser).id;
    await appRepository.update(id, ownerId, req.body);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const ownerId = ((req as any).auth as AuthUser).id;

    await appRepository.delete(id, ownerId);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export default { browse, add, destroy, edit };

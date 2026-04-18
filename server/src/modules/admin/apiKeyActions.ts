import type { Request, RequestHandler } from "express";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import apiKeyRepository from "./apiKeyRepository.js";
import type { AuthUser } from "../../types/index.js";

const SALT_ROUNDS = 10;

interface AuthenticatedRequest extends Request {
  auth: AuthUser;
}

const browse: RequestHandler = async (req, res, next) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).auth.id;
    const keys = await apiKeyRepository.readByUserId(userId);
    res.json(keys);
  } catch (err) {
    next(err);
  }
};

const add: RequestHandler = async (req, res, next) => {
  try {
    const { name } = req.body;
    const userId = (req as unknown as AuthenticatedRequest).auth.id;

    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    // Generate Key: xk_live_<32 chars>
    const rawKey = crypto.randomBytes(24).toString("hex");
    const prefix = "xk_live_";
    const fullKey = `${prefix}${rawKey}`;
    const hash = await bcrypt.hash(fullKey, SALT_ROUNDS);

    const id = await apiKeyRepository.create({
      user_id: userId,
      name,
      key_prefix: fullKey.substring(0, 8), // Store prefix for fast lookup
      key_hash: hash
    });

    // We only return the full key ONCE
    res.status(201).json({ 
      id, 
      name, 
      api_key: fullKey,
      message: "Please store this key securely. It will never be shown again."
    });
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = (req as unknown as AuthenticatedRequest).auth.id;
    
    const affected = await apiKeyRepository.delete(id, userId);
    if (affected === 0) {
      res.status(404).json({ message: "Key not found or unauthorized" });
      return;
    }
    
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export default { browse, add, destroy };

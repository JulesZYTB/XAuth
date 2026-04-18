import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { AuthUser } from "../../types/index.js";

const APP_SECRET = process.env.APP_SECRET;

import apiKeyRepository from "../app/../admin/apiKeyRepository.js";
import bcrypt from "bcrypt";
import userRepository from "./userRepository.js";

// Midleware to verify the JWT token OR API Key
const verifyToken: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers["x-xauth-key"];

    // Case 1: API Key Auth (Developer Automation)
    if (apiKeyHeader && typeof apiKeyHeader === "string") {
      const prefix = apiKeyHeader.substring(0, 8);
      const keyData = await apiKeyRepository.readByPrefix(prefix);
      
      if (keyData && await bcrypt.compare(apiKeyHeader, keyData.key_hash)) {
        const user = await userRepository.read(keyData.user_id);
        if (user) {
          (req as any).auth = { 
            id: user.id, 
            username: user.username, 
            role: user.role, 
            email: user.email 
          };
          await apiKeyRepository.updateLastUsed(keyData.id);
          next();
          return;
        }
      }
      res.status(401).json({ message: "Invalid API Key" });
      return;
    }

    // Case 2: JWT Auth (Browser Session)
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!APP_SECRET && process.env.NODE_ENV === "production") {
      console.error("CRITICAL: APP_SECRET is not set in production!");
      res.status(500).json({ message: "Internal server security configuration error" });
      return;
    }

    const decoded = jwt.verify(token, APP_SECRET || "default_secret");

    (req as any).auth = decoded;

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token or key" });
  }
};


// Middleware to verify if the user is an admin
const isAdmin: RequestHandler = (req, res, next) => {
  const authUser = (req as any).auth as AuthUser;

  if (authUser && authUser.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Admin access required" });
  }
};

export { verifyToken, isAdmin };
export default verifyToken;


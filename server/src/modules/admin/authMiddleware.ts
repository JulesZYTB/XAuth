import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { AuthUser } from "../../types/index.js";

const APP_SECRET = process.env.APP_SECRET;

// Midleware to verify the JWT token
const verifyToken: RequestHandler = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

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
    res.status(401).json({ message: "Invalid token" });
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


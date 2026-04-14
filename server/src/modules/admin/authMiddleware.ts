import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const verifyToken: RequestHandler = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.APP_SECRET || "default_secret");

    (req as any).auth = decoded;

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default verifyToken;

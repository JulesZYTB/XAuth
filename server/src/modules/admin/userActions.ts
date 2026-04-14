import type { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userRepository from "./userRepository";

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await userRepository.readByEmail(email);

    if (!user || !user.password) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      process.env.APP_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

const register: RequestHandler = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Check if user already exists
    const existingUser = await userRepository.readByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: "User already exists with this email" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check for admin secret to grant elevated privileges
    const registrationSecret = process.env.ADMIN_REGISTRATION_SECRET || "change_me_immediately";
    const role = (req.body.secret === registrationSecret) ? "admin" : "user";

    const insertId = await userRepository.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({ 
      message: role === "admin" ? "Admin registration successful" : "Registration successful", 
      insertId 
    });

  } catch (err) {
    next(err);
  }
};

const browse: RequestHandler = async (req, res, next) => {
  try {
    // Only allow admins to list all users
    if (((req as any).auth as AuthUser).role !== "admin") {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    const users = await userRepository.readAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
};


const editRole: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;
    await userRepository.updateRole(id, role);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const destroy: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await userRepository.delete(id);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

export default { login, register, browse, editRole, destroy };


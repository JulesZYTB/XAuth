import type { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userRepository from "./userRepository.js";
import type { AuthUser, User } from "../../types/index.js";
import { loginSchema, registerSchema } from "../security/schemas.js";

const APP_SECRET = process.env.APP_SECRET;

const login: RequestHandler = async (req, res, next) => {
  try {
    // Schema Validation
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Invalid input", errors: validation.error.format() });
      return;
    }

    const { email, password } = validation.data;
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

    if (!APP_SECRET && process.env.NODE_ENV === "production") {
      throw new Error("APP_SECRET is not configured");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      APP_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

const register: RequestHandler = async (req, res, next) => {
  try {
    // Schema Validation
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Invalid input", errors: validation.error.format() });
      return;
    }

    const { username, email, password, secret } = validation.data;

    // Check if user already exists
    const existingUser = await userRepository.readByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: "User already exists with this email" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds

    // Check for admin secret to grant elevated privileges
    const registrationSecret = process.env.ADMIN_REGISTRATION_SECRET;
    let role = "user";
    
    if (secret && registrationSecret && secret === registrationSecret) {
      role = "admin";
    } else if (secret && !registrationSecret) {
      console.warn("ADMIN_REGISTRATION_SECRET is not set, admin registration blocked.");
    }

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

const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const authUser = (req as any).auth as AuthUser;
    const { username, email, password } = req.body;
    
    if (!username || !email) {
      res.status(400).json({ message: "Username and email are required" });
      return;
    }
    
    let hashedPassword = undefined;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    await userRepository.updateProfile(authUser.id, username, email, hashedPassword);
    
    // sign new token
    const token = jwt.sign(
      { id: authUser.id, email, role: authUser.role, username },
      process.env.APP_SECRET || "default_secret",
      { expiresIn: "1h" }
    );
    
    res.json({ message: "Profile updated successfully", token });
  } catch (err) {
    next(err);
  }
};

export default { login, register, browse, editRole, destroy, updateProfile };


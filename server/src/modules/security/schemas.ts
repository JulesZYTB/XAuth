import { z } from "zod";

/**
 * Authentication Schemas
 */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, "Must contain at least one uppercase letter").regex(/[0-9]/, "Must contain at least one number"),
  secret: z.string().optional(),
});

/**
 * License Schemas
 */
export const licenseCreateSchema = z.object({
  app_id: z.coerce.number().int().positive(),
  license_key: z.string().optional(),
  expiry_date: z.union([z.string(), z.number()]),
});

export const licenseRedeemSchema = z.object({
  license_key: z.string().min(1),
});

/**
 * App Schemas
 */
export const appSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  broadcast_message: z.string().optional(),
  is_paused: z.boolean().optional(),
});

export const versionVerifySchema = z.object({
  app_id: z.number().int().positive(),
  app_secret: z.string().min(1),
  channel: z.enum(["stable", "beta"]).default("stable"),
  current_version: z.string().optional(),
});

export const licenseTrialSchema = z.object({
  app_id: z.number().int().positive(),
  hwid: z.string().min(1),
});

export const licenseVariableSchema = z.object({
  key: z.string().min(1).max(50),
  value: z.string().max(500).optional(),
});

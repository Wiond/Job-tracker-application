import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const applicationStatusValues = [
  "saved",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export const createApplicationSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(255),
  role: z.string().trim().min(1, "Role is required").max(255),
  status: z.enum(applicationStatusValues).default("saved"),
  jobUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  location: z.string().trim().max(255).optional().or(z.literal("")),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  appliedDate: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export const updateApplicationSchema = createApplicationSchema.partial();

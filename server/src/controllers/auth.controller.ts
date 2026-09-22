import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { registerSchema, loginSchema } from "../utils/validation";
import { signToken, setSessionCookie, clearSessionCookie } from "../utils/jwt";
import { AppError } from "../utils/AppError";

const SALT_ROUNDS = 12;

function toPublicUser(user: { id: string; email: string; name: string }) {
  return { id: user.id, email: user.email, name: user.name };
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = registerSchema.parse(req.body);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({ id: users.id, email: users.email, name: users.name });

  const token = signToken({ userId: user.id });
  setSessionCookie(res, token);
  res.status(201).json({ user: toPublicUser(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signToken({ userId: user.id });
  setSessionCookie(res, token);
  res.json({ user: toPublicUser(user) });
}

export async function logout(_req: Request, res: Response) {
  clearSessionCookie(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, req.userId!),
  });
  if (!user) {
    throw new AppError(401, "Not authenticated");
  }
  res.json({ user: toPublicUser(user) });
}

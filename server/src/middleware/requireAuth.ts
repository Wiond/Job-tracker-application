import type { Request, Response, NextFunction } from "express";
import { COOKIE_NAME, verifyToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    throw new AppError(401, "Not authenticated");
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired session");
  }
}

import type { Request, Response } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db } from "../db";
import { applications } from "../db/schema";
import { createApplicationSchema, updateApplicationSchema } from "../utils/validation";
import { AppError } from "../utils/AppError";

function normalize<T extends Record<string, unknown>>(payload: T) {
  // Empty-string optional fields (from form inputs) should be stored as null, not "".
  const result: Record<string, unknown> = { ...payload };
  for (const key of ["jobUrl", "location", "notes", "appliedDate", "followUpDate"]) {
    if (result[key] === "") result[key] = null;
  }
  return result;
}

// req.params values are typed string | string[] in Express 5 (to accommodate
// wildcard route segments). Our routes never use wildcards, so a param is
// always a single string at runtime — this just asserts that to Drizzle.
function getIdParam(req: Request): string {
  const id = req.params.id;
  if (typeof id !== "string") {
    throw new AppError(400, "Invalid id parameter");
  }
  return id;
}

export async function listApplications(req: Request, res: Response) {
  const rows = await db.query.applications.findMany({
    where: eq(applications.userId, req.userId!),
    orderBy: [desc(applications.createdAt)],
  });
  res.json({ applications: rows });
}

export async function getApplication(req: Request, res: Response) {
  const id = getIdParam(req);
  const row = await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, req.userId!)),
  });
  if (!row) throw new AppError(404, "Application not found");
  res.json({ application: row });
}

export async function createApplication(req: Request, res: Response) {
  const data = normalize(createApplicationSchema.parse(req.body));

  const [row] = await db
    .insert(applications)
    .values({ ...data, userId: req.userId! } as typeof applications.$inferInsert)
    .returning();

  res.status(201).json({ application: row });
}

export async function updateApplication(req: Request, res: Response) {
  const id = getIdParam(req);
  const data = normalize(updateApplicationSchema.parse(req.body));

  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, req.userId!)),
  });
  if (!existing) throw new AppError(404, "Application not found");

  const [row] = await db
    .update(applications)
    .set({ ...data, updatedAt: new Date() } as Partial<typeof applications.$inferInsert>)
    .where(eq(applications.id, id))
    .returning();

  res.json({ application: row });
}

export async function deleteApplication(req: Request, res: Response) {
  const id = getIdParam(req);
  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, req.userId!)),
  });
  if (!existing) throw new AppError(404, "Application not found");

  await db.delete(applications).where(eq(applications.id, id));
  res.status(204).send();
}

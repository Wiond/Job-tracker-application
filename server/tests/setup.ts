import path from "node:path";
import dotenv from "dotenv";
import { beforeAll, beforeEach, afterAll } from "vitest";

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

// Truncating tables in beforeEach makes a mistaken DATABASE_URL destructive,
// so refuse to run unless it's unambiguously pointed at a test database.
if (!process.env.DATABASE_URL?.includes("test")) {
  throw new Error(
    "Refusing to run tests: DATABASE_URL does not look like a test database (expected it to contain 'test'). Check server/.env.test."
  );
}

const { db, pool } = await import("../src/db");
const { migrate } = await import("drizzle-orm/node-postgres/migrator");
const { sql } = await import("drizzle-orm");

beforeAll(async () => {
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../drizzle") });
});

beforeEach(async () => {
  await db.execute(sql`TRUNCATE TABLE applications, users RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await pool.end();
});

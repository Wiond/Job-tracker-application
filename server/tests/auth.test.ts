import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("auth", () => {
  it("registers a new user and sets a session cookie", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email: "test@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: "test@example.com", name: "Test User" });
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects duplicate email registration", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "A", email: "dup@example.com", password: "password123" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "B", email: "dup@example.com", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("logs in with correct credentials and rejects wrong password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ name: "A", email: "login@example.com", password: "password123" });

    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "wrongpassword" });
    expect(bad.status).toBe(401);

    const good = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "password123" });
    expect(good.status).toBe(200);
  });

  it("returns 401 from /me without a session, and the user with one", async () => {
    const anon = await request(app).get("/api/auth/me");
    expect(anon.status).toBe(401);

    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ name: "A", email: "me@example.com", password: "password123" });

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("me@example.com");
  });

  it("logout clears the session so /me then 401s", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ name: "A", email: "logout@example.com", password: "password123" });

    await agent.post("/api/auth/logout").expect(204);

    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

async function registeredAgent(email: string) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ name: "Test", email, password: "password123" });
  return agent;
}

describe("applications", () => {
  it("requires auth", async () => {
    const res = await request(app).get("/api/applications");
    expect(res.status).toBe(401);
  });

  it("creates an application and normalizes empty strings to null", async () => {
    const agent = await registeredAgent("apps1@example.com");

    const res = await agent.post("/api/applications").send({
      company: "Acme",
      role: "Engineer",
      status: "applied",
      jobUrl: "",
      location: "",
    });

    expect(res.status).toBe(201);
    expect(res.body.application.jobUrl).toBeNull();
    expect(res.body.application.location).toBeNull();
  });

  it("rejects invalid payloads with field-level details", async () => {
    const agent = await registeredAgent("apps2@example.com");

    const res = await agent.post("/api/applications").send({});

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "company" }),
        expect.objectContaining({ path: "role" }),
      ])
    );
  });

  it("lists, gets, updates and deletes an owned application", async () => {
    const agent = await registeredAgent("apps3@example.com");

    const created = await agent.post("/api/applications").send({ company: "Acme", role: "Engineer" });
    const id = created.body.application.id;

    const list = await agent.get("/api/applications");
    expect(list.body.applications).toHaveLength(1);

    const got = await agent.get(`/api/applications/${id}`);
    expect(got.status).toBe(200);

    const updated = await agent.patch(`/api/applications/${id}`).send({ status: "interview" });
    expect(updated.body.application.status).toBe("interview");

    await agent.delete(`/api/applications/${id}`).expect(204);
    await agent.get(`/api/applications/${id}`).expect(404);
  });

  it("404s on another user's application (ownership scoping)", async () => {
    const owner = await registeredAgent("owner@example.com");
    const created = await owner.post("/api/applications").send({ company: "Acme", role: "Engineer" });
    const id = created.body.application.id;

    const intruder = await registeredAgent("intruder@example.com");
    const res = await intruder.get(`/api/applications/${id}`);
    expect(res.status).toBe(404);
  });
});

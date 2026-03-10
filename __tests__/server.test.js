const fs = require("fs");
const path = require("path");
const request = require("supertest");

const { createApp } = require("../server");

function createTestContext() {
  const baseDir = path.join(__dirname, ".tmp");
  fs.mkdirSync(baseDir, { recursive: true });

  const dataDir = fs.mkdtempSync(path.join(baseDir, "items-"));
  const dataFile = path.join(dataDir, "items.json");
  const app = createApp({ dataDir, dataFile });

  return { app, dataDir, dataFile };
}

describe("items api", () => {
  let ctx;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => {
    fs.rmSync(ctx.dataDir, { recursive: true, force: true });
  });

  test("GET /api/items returns an empty array and creates the data file when storage is missing", async () => {
    const response = await request(ctx.app).get("/api/items");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(fs.existsSync(ctx.dataFile)).toBe(true);
    expect(JSON.parse(fs.readFileSync(ctx.dataFile, "utf8"))).toEqual([]);
  });

  test("POST /api/items trims text, returns 201, and stores the new item", async () => {
    const response = await request(ctx.app)
      .post("/api/items")
      .send({ text: "  first item  " });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      text: "first item",
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });

    const storedItems = JSON.parse(fs.readFileSync(ctx.dataFile, "utf8"));
    expect(storedItems).toHaveLength(1);
    expect(storedItems[0]).toMatchObject({
      id: response.body.id,
      text: "first item"
    });
  });

  test("POST /api/items returns 400 when text is blank", async () => {
    const response = await request(ctx.app)
      .post("/api/items")
      .send({ text: "   " });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "text is required" });
  });

  test("GET /api/items returns stored items in newest-first order", async () => {
    const first = await request(ctx.app).post("/api/items").send({ text: "first" });
    const second = await request(ctx.app).post("/api/items").send({ text: "second" });

    const response = await request(ctx.app).get("/api/items");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBe(second.body.id);
    expect(response.body[1].id).toBe(first.body.id);
  });

  test("PUT /api/items/:id updates text and preserves immutable fields", async () => {
    const created = await request(ctx.app).post("/api/items").send({ text: "before" });

    const response = await request(ctx.app)
      .put(`/api/items/${created.body.id}`)
      .send({ text: "after" });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.body.id);
    expect(response.body.text).toBe("after");
    expect(response.body.createdAt).toBe(created.body.createdAt);
    expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.body.updatedAt).getTime()
    );
  });

  test("PUT /api/items/:id returns 404 for an unknown item", async () => {
    const response = await request(ctx.app)
      .put("/api/items/missing-id")
      .send({ text: "after" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "not found" });
  });

  test("DELETE /api/items/:id removes the item and returns the deleted record", async () => {
    const created = await request(ctx.app).post("/api/items").send({ text: "delete me" });

    const response = await request(ctx.app).delete(`/api/items/${created.body.id}`);
    const listResponse = await request(ctx.app).get("/api/items");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.body.id);
    expect(listResponse.body).toEqual([]);
  });

  test("GET /api/items returns an empty array when the data file contains invalid JSON", async () => {
    fs.mkdirSync(ctx.dataDir, { recursive: true });
    fs.writeFileSync(ctx.dataFile, "{invalid json", "utf8");

    const response = await request(ctx.app).get("/api/items");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");

beforeAll(async () => {
    // Ensure the table exists and is clean
    await db.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      text VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await db.query("DELETE FROM todos");
});

afterAll(async () => {
    await db.end();
});

describe("Integration: Todos API", () => {
    it("POST then GET returns the created todo", async () => {
        const postRes = await request(app)
            .post("/api/todos")
            .send({ text: "Integration test todo" });
        expect(postRes.status).toBe(201);
        expect(postRes.body.id).toBeDefined();
        expect(postRes.body.text).toBe("Integration test todo");

        const getRes = await request(app).get("/api/todos");
        expect(getRes.status).toBe(200);
        expect(getRes.body.length).toBeGreaterThan(0);
        expect(getRes.body.some((t) => t.text === "Integration test todo")).toBe(true);
    });
});

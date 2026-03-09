const request = require("supertest");

// Mock the db module before requiring app
jest.mock("../../src/db", () => ({
    query: jest.fn(),
}));

const app = require("../../src/app");
const db = require("../../src/db");

describe("GET /api/todos", () => {
    it("returns a list of todos", async () => {
        db.query.mockResolvedValue([[{ id: 1, text: "Test todo" }]]);
        const res = await request(app).get("/api/todos");
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 1, text: "Test todo" }]);
    });
});

describe("POST /api/todos", () => {
    it("creates a todo and returns 201", async () => {
        db.query.mockResolvedValue([{ insertId: 1 }]);
        const res = await request(app)
            .post("/api/todos")
            .send({ text: "New todo" });
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ id: 1, text: "New todo" });
    });
});

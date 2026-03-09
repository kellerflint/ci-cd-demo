const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/todos", async (req, res) => {
    const [rows] = await db.query("SELECT * FROM todos ORDER BY created_at DESC");
    res.json(rows);
});

app.post("/api/todos", async (req, res) => {
    const { text } = req.body;
    const [result] = await db.query("INSERT INTO todos (text) VALUES (?)", [text]);
    res.status(201).json({ id: result.insertId, text });
});

module.exports = app;

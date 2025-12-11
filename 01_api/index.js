// 01_api/index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");

const PORT = process.env.PORT || 3001;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "user_form_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const app = express();

app.use(
  cors({
    origin: "*", // you can change to your specific frontend origin if you want
  })
);
app.use(bodyParser.json());

// ---- HEALTH CHECK ----------------------------------------------------------
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ status: "ok", db: true });
  } catch (err) {
    console.error("Health DB check error:", err);
    return res.json({ status: "ok", db: false });
  }
});

// ---- GET ALL USERS ---------------------------------------------------------
app.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, info, email, contact FROM users ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

// ---- CREATE USER -----------------------------------------------------------
app.post("/users", async (req, res) => {
  const { username, info, email, contact } = req.body || {};

  if (!username || !email || !contact) {
    return res
      .status(400)
      .json({ error: "username, email and contact are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO users (username, info, email, contact) VALUES (?, ?, ?, ?)",
      [username, info || "", email, contact]
    );

    const [rows] = await pool.query(
      "SELECT id, username, info, email, contact FROM users WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /users error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// ---- START SERVER ----------------------------------------------------------
app.listen(PORT, () => {
  console.log(`User API listening on http://localhost:${PORT}`);
});

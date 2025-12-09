const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Load local env if present (for non-Docker dev)
dotenv.config({ path: path.join(__dirname, ".env.local") });

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "user_form_db",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Health check
app.get("/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ status: "ok", db: rows[0].ok === 1 });
  } catch (err) {
    console.error("GET /health error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// GET /users – list all users
app.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /users – create new user
app.post("/users", async (req, res) => {
  const { username, info, email, contact } = req.body;

  if (!username || !email || !contact) {
    return res
      .status(400)
      .json({ error: "username, email and contact are required." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO users (username, info, email, contact) VALUES (?, ?, ?, ?)",
      [username, info ?? "", email, contact]
    );

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /users error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const port = Number(process.env.PORT || process.env.API_PORT || 3001);
app.listen(port, () => {
  console.log(`User API listening on http://localhost:${port}`);
});
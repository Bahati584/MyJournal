const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Create Trade Idea
router.post("/", upload.single("before_screenshot"), (req, res) => {
  const { pair, session, setup_type, risk_percent, notes, trade_date } = req.body;

  const before_screenshot = req.file
    ? `/uploads/${req.file.filename}`
    : null;

  const sql = `
    INSERT INTO trade_ideas
    (pair, session, setup_type, risk_percent, notes, trade_date, before_screenshot)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [pair, session, setup_type, risk_percent, notes, trade_date, before_screenshot],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to create idea" });

      res.json({
        message: "Trade idea created",
        ideaId: result.insertId
      });
    }
  );
});


// Get all ideas
router.get("/", (req, res) => {
  db.query("SELECT * FROM trade_ideas ORDER BY trade_date DESC", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch ideas" });
    res.json(results);
  });
});

module.exports = router;
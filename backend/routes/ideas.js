const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const { storage } = require("../config/cloudinary");

const upload = multer({ storage });

// Create Trade Idea
router.post("/", upload.single("before_screenshot"), (req, res) => {
  const { pair, session, setup_type, risk_percent, notes, trade_date } = req.body;

  // multer-storage-cloudinary puts the uploaded file's URL in req.file.path
  const before_screenshot = req.file ? req.file.path : null;

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
        ideaId: result.insertId,
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
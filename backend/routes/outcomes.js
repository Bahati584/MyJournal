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

// Attach outcome to idea
router.post("/", upload.single("screenshot"), (req, res) => {
  const { idea_id, result_r } = req.body;

  const screenshot_path = req.file
    ? `/uploads/${req.file.filename}`
    : null;

  const sql = `
    INSERT INTO trade_outcomes
    (idea_id, result_r, screenshot_path)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [idea_id, result_r, screenshot_path], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to attach outcome" });
    }

    res.json({
      message: "Outcome attached successfully"
    });
  });
});

module.exports = router;
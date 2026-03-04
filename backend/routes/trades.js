const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Create trade
router.post("/", upload.single("screenshot"), (req, res) => {
  const {
    pair,
    session,
    setup_type,
    risk_percent,
    result_r,
    notes,
    trade_date
  } = req.body;

  const screenshot_path = req.file
    ? `/uploads/${req.file.filename}`
    : null;

  const sql = `
    INSERT INTO trades 
    (pair, session, setup_type, risk_percent, result_r, notes, trade_date, screenshot_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      pair,
      session,
      setup_type,
      risk_percent,
      result_r,
      notes,
      trade_date,
      screenshot_path
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to insert trade" });
      }

      res.json({
        message: "Trade added successfully",
        tradeId: result.insertId,
        screenshot: screenshot_path
      });
    }
  );
});


router.get("/daily-summary", (req, res) => {
  const sql = `
    SELECT 
      trade_date,
      SUM(result_r) AS totalR
    FROM trades
    GROUP BY trade_date
    ORDER BY trade_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch daily summary" });
    }

    res.json(results);
  });
});

module.exports = router;
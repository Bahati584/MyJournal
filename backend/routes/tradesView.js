const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all trades (ideas joined with their outcomes)
router.get("/", (req, res) => {
  const sql = `
    SELECT
      i.id,
      i.pair,
      i.session,
      i.setup_type,
      i.risk_percent,
      i.notes,
      i.trade_date,
      i.before_screenshot,
      i.created_at,
      o.id AS outcome_id,
      o.result_r,
      o.screenshot_path AS after_screenshot
    FROM trade_ideas i
    LEFT JOIN trade_outcomes o ON i.id = o.idea_id
    ORDER BY i.trade_date DESC, i.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch trades" });
    res.json(results);
  });
});

module.exports = router;
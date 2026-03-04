const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/daily", (req, res) => {
  const sql = `
    SELECT 
      i.trade_date,
      SUM(o.result_r) AS totalR
    FROM trade_ideas i
    JOIN trade_outcomes o ON i.id = o.idea_id
    GROUP BY i.trade_date
    ORDER BY i.trade_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch summary" });
    res.json(results);
  });
});

module.exports = router;
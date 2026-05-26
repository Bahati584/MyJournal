const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Win rate by pair
router.get("/by-pair", (req, res) => {
  const sql = `
    SELECT
      i.pair,
      COUNT(o.id) AS total,
      SUM(CASE WHEN o.result_r > 0 THEN 1 ELSE 0 END) AS wins,
      ROUND(SUM(CASE WHEN o.result_r > 0 THEN 1 ELSE 0 END) / COUNT(o.id) * 100, 0) AS win_rate,
      ROUND(SUM(o.result_r), 2) AS total_r
    FROM trade_ideas i
    JOIN trade_outcomes o ON i.id = o.idea_id
    GROUP BY i.pair
    ORDER BY total DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch pair stats" });
    res.json(results);
  });
});

// Win rate by session
router.get("/by-session", (req, res) => {
  const sql = `
    SELECT
      i.session,
      COUNT(o.id) AS total,
      SUM(CASE WHEN o.result_r > 0 THEN 1 ELSE 0 END) AS wins,
      ROUND(SUM(CASE WHEN o.result_r > 0 THEN 1 ELSE 0 END) / COUNT(o.id) * 100, 0) AS win_rate,
      ROUND(SUM(o.result_r), 2) AS total_r
    FROM trade_ideas i
    JOIN trade_outcomes o ON i.id = o.idea_id
    WHERE i.session IS NOT NULL AND i.session != ''
    GROUP BY i.session
    ORDER BY total DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch session stats" });
    res.json(results);
  });
});

// Win rate by setup type
router.get("/by-setup", (req, res) => {
  const sql = `
    SELECT
      i.setup_type,
      COUNT(o.id) AS total,
      SUM(CASE WHEN o.result_r > 0 THEN 1 ELSE 0 END) AS wins,
      ROUND(SUM(CASE WHEN o.result_r > 0 THEN 1 ELSE 0 END) / COUNT(o.id) * 100, 0) AS win_rate,
      ROUND(SUM(o.result_r), 2) AS total_r
    FROM trade_ideas i
    JOIN trade_outcomes o ON i.id = o.idea_id
    WHERE i.setup_type IS NOT NULL AND i.setup_type != ''
    GROUP BY i.setup_type
    ORDER BY total DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch setup stats" });
    res.json(results);
  });
});

// R over time (cumulative)
router.get("/r-over-time", (req, res) => {
  const sql = `
    SELECT
      i.trade_date,
      ROUND(SUM(o.result_r), 2) AS daily_r
    FROM trade_ideas i
    JOIN trade_outcomes o ON i.id = o.idea_id
    GROUP BY i.trade_date
    ORDER BY i.trade_date ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch R over time" });

    // compute cumulative R
    let cumulative = 0;
    const data = results.map((row) => {
      cumulative += Number(row.daily_r);
      return {
        date: row.trade_date,
        daily_r: Number(row.daily_r),
        cumulative_r: Math.round(cumulative * 100) / 100,
      };
    });
    res.json(data);
  });
});

// Best and worst trades
router.get("/best-worst", (req, res) => {
  const bestSql = `
    SELECT i.pair, i.session, i.setup_type, i.trade_date, i.notes,
           i.before_screenshot, o.result_r, o.screenshot_path, o.id AS outcome_id
    FROM trade_ideas i
    JOIN trade_outcomes o ON i.id = o.idea_id
    ORDER BY o.result_r DESC
    LIMIT 5
  `;
  const worstSql = `
    SELECT i.pair, i.session, i.setup_type, i.trade_date, i.notes,
           i.before_screenshot, o.result_r, o.screenshot_path, o.id AS outcome_id
    FROM trade_ideas i
    JOIN trade_outcomes o ON i.id = o.idea_id
    ORDER BY o.result_r ASC
    LIMIT 5
  `;

  db.query(bestSql, (err, best) => {
    if (err) return res.status(500).json({ error: "Failed to fetch best trades" });
    db.query(worstSql, (err, worst) => {
      if (err) return res.status(500).json({ error: "Failed to fetch worst trades" });
      res.json({ best, worst });
    });
  });
});

module.exports = router;
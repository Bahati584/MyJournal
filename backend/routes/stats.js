const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", (req, res) => {
  // Total trades (all time)
  db.query("SELECT COUNT(*) AS total_trades FROM trade_ideas", (err, totalRes) => {
    if (err) return res.status(500).json({ error: "Failed to fetch stats" });

    const totalTrades = totalRes[0].total_trades;

    // Current month trades & R
    db.query(`
      SELECT 
        COUNT(DISTINCT i.id) AS current_month_trades,
        COALESCE(SUM(o.result_r), 0) AS current_month_r
      FROM trade_ideas i
      LEFT JOIN trade_outcomes o ON i.id = o.idea_id
      WHERE MONTH(i.trade_date) = MONTH(CURRENT_DATE()) 
        AND YEAR(i.trade_date) = YEAR(CURRENT_DATE())
    `, (err, currentRes) => {
      if (err) return res.status(500).json({ error: "Failed to fetch current month" });

      const currentTrades = currentRes[0].current_month_trades;
      const currentR = currentRes[0].current_month_r;

      // Previous month R (for change comparison)
      db.query(`
        SELECT COALESCE(SUM(o.result_r), 0) AS prev_month_r
        FROM trade_ideas i
        LEFT JOIN trade_outcomes o ON i.id = o.idea_id
        WHERE MONTH(i.trade_date) = MONTH(CURRENT_DATE()) - 1
          AND YEAR(i.trade_date) = YEAR(CURRENT_DATE())
      `, (err, prevRes) => {
        if (err) return res.status(500).json({ error: "Failed to fetch previous month" });

        const prevR = prevRes[0].prev_month_r || 0;
        const rChange = currentR - prevR;

        // Win rate (current month)
        db.query(`
          SELECT 
            (SUM(CASE WHEN o.result_r > 0 THEN 1 ELSE 0 END) / COUNT(o.id)) * 100 AS win_rate
          FROM trade_ideas i
          LEFT JOIN trade_outcomes o ON i.id = o.idea_id
          WHERE MONTH(i.trade_date) = MONTH(CURRENT_DATE()) 
            AND YEAR(i.trade_date) = YEAR(CURRENT_DATE())
        `, (err, winRes) => {
          if (err) return res.status(500).json({ error: "Failed to fetch win rate" });

          const winRate = winRes[0].win_rate || 0;

          // Winning streak (max consecutive positive outcomes)
          db.query(`
            SELECT MAX(streak) AS winning_streak
            FROM (
              SELECT COUNT(*) AS streak
              FROM (
                SELECT 
                  o.id,
                  o.result_r,
                  ROW_NUMBER() OVER (ORDER BY o.id) - ROW_NUMBER() OVER (PARTITION BY (o.result_r > 0) ORDER BY o.id) AS grp
                FROM trade_outcomes o
                WHERE o.result_r > 0
              ) t
              GROUP BY grp
            ) s
          `, (err, streakRes) => {
            if (err) return res.status(500).json({ error: "Failed to fetch streak" });

            const winningStreak = streakRes[0].winning_streak || 0;

            res.json({
              total_trades: totalTrades,
              winning_streak: winningStreak,
              monthly_r: currentR,
              win_rate: winRate,
              // Change values
              trades_change: `+${currentTrades} this month`,
              streak_longest: `Longest: ${winningStreak} days`, // could compute longest ever if needed
              r_change: `${rChange >= 0 ? '+' : ''}${rChange.toFixed(1)} vs last month`,
              win_rate_change: `↑ ${winRate.toFixed(0)}% this month` // simplified; can compute vs prev if needed
            });
          });
        });
      });
    });
  });
});

module.exports = router;
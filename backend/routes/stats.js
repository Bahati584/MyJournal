const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", (req, res) => {

  // Current month trades, R, and win rate in one query
  db.query(`
    SELECT
      COUNT(DISTINCT i.id) AS total_trades,
      COALESCE(SUM(o.result_r), 0) AS monthly_r,
      CASE
        WHEN COUNT(o.id) = 0 THEN 0
        ELSE ROUND(
          SUM(CASE WHEN o.result_r > 0 THEN 1 ELSE 0 END) / COUNT(o.id) * 100, 0
        )
      END AS win_rate
    FROM trade_ideas i
    LEFT JOIN trade_outcomes o ON i.id = o.idea_id
    WHERE MONTH(i.trade_date) = MONTH(CURRENT_DATE())
      AND YEAR(i.trade_date) = YEAR(CURRENT_DATE())
  `, (err, currentRes) => {
    if (err) return res.status(500).json({ error: "Failed to fetch current month stats" });

    const totalTrades = currentRes[0].total_trades;
    const currentR = Number(currentRes[0].monthly_r);
    const winRate = Number(currentRes[0].win_rate ?? 0);

    // Previous month R for comparison
    db.query(`
      SELECT COALESCE(SUM(o.result_r), 0) AS prev_month_r,
             COUNT(DISTINCT i.id) AS prev_month_trades
      FROM trade_ideas i
      LEFT JOIN trade_outcomes o ON i.id = o.idea_id
      WHERE MONTH(i.trade_date) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        AND YEAR(i.trade_date) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
    `, (err, prevRes) => {
      if (err) return res.status(500).json({ error: "Failed to fetch previous month stats" });

      const prevR = Number(prevRes[0].prev_month_r || 0);
      const prevTrades = Number(prevRes[0].prev_month_trades || 0);
      const rChange = currentR - prevR;
      const tradesChange = totalTrades - prevTrades;

      // Winning streak — current month only, consecutive wins ordered by trade date
      db.query(`
        SELECT o.result_r
        FROM trade_ideas i
        JOIN trade_outcomes o ON i.id = o.idea_id
        WHERE MONTH(i.trade_date) = MONTH(CURRENT_DATE())
          AND YEAR(i.trade_date) = YEAR(CURRENT_DATE())
        ORDER BY i.trade_date ASC, o.created_at ASC
      `, (err, outcomeRows) => {
        if (err) return res.status(500).json({ error: "Failed to fetch streak data" });

        // Calculate current winning streak (count from end of list backwards)
        let streak = 0;
        for (let i = outcomeRows.length - 1; i >= 0; i--) {
          if (Number(outcomeRows[i].result_r) > 0) {
            streak++;
          } else {
            break;
          }
        }

        // Calculate longest streak this month
        let longestStreak = 0;
        let currentStreak = 0;
        for (const row of outcomeRows) {
          if (Number(row.result_r) > 0) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        }

        res.json({
          total_trades: totalTrades,
          winning_streak: streak,
          monthly_r: currentR,
          win_rate: winRate,
          trades_change: `${tradesChange >= 0 ? "+" : ""}${tradesChange} vs last month`,
          streak_longest: `Longest: ${longestStreak} trade${longestStreak === 1 ? "" : "s"} this month`,
          r_change: `${rChange >= 0 ? "+" : ""}${rChange.toFixed(1)} vs last month`,
          win_rate_change: `↑ ${winRate}% this month`,
        });
      });
    });
  });
});

module.exports = router;
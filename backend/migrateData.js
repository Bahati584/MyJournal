require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  multipleStatements: true, // needed to run several INSERT statements at once
});

// Paste the INSERT statements from your dump file here.
// NOTE: we skip the id column for trade_ideas so Aiven assigns fresh auto-increment ids,
// BUT trade_outcomes references idea_id, so we need to preserve the original ideas' ids
// to keep the relationship intact. Easiest: insert WITH explicit ids using INSERT ... (id, ...) VALUES (...)

const ideasSQL = `
INSERT INTO trade_ideas (id, pair, session, setup_type, risk_percent, notes, trade_date, created_at, before_screenshot) VALUES
(1,'EURUSD','Asia','IRL-ERL',1.00,'Got the trade from a H1 breaker ','2026-03-05','2026-03-05 08:20:23','/uploads/1772698823708-999424436.png'),
(2,'BTCUSD','New York ','IRL-ERL',0.99,'BTC had an internal range liquidity on the daily timeframe which got tagged.On the H4 timeframe it formed a CRT candle pattern inside the daily Internal range liquidity thus could frame a reversal','2026-03-06','2026-03-06 11:12:43','/uploads/1772795563346-966600319.png'),
(3,'GBPUSD','London','IRL-ERL',1.00,'On a daily GU took previous days high and closed above it.Todays open formed an Internal range liquidity and thus I aimed for some previous weeks highs. Dropped to a 15minute timeframe where I framed my entry from a change in state of delivery. Delivered 45 pips','2026-03-10','2026-03-10 19:52:23','/uploads/1773172343371-648607981.jpeg'),
(4,'XAUUSD','New York ','IRL-ERL',1.00,'From a daily timeframe gold had formed an Inverted fair value gap which it had retested and rejected giving a close outside the IFVG. The following candle gave a CRT pattern and drropping to the one hour timeframe I waited for a full body close CISD and entered shorts. The trade went on to follow through the next day early morning','2026-03-11','2026-03-12 01:46:38','/uploads/1773279998816-557715408.jpg'),
(5,'XAUUSD','New York ','IRL-ERL',1.00,'Gold formed an Internal range Liguidity on the 4 hour timeframe which got mitigated and a change in state of delivery initiated on the 15 minute timeframe after gave me a short bias . Took a 1% risk trade and my exit was a 15 minute wickless candle.','2026-03-13','2026-03-13 15:54:00','/uploads/1773417240655-176175805.png'),
(6,'EURUSD','London','IRL-ERL',1.00,'EU formed a 4 hour bullish fair value gap which was filled and immediately formed another bullish inverted fair value gap on the one hour timeframe . Dropped to the 15 minute where I framed my entry off of a 15 minute fair value gap. ','2026-03-17','2026-03-17 20:14:14','/uploads/1773778454738-593555825.jpg'),
(7,'GBPUSD','London','IRL-ERL',1.00,'GU formed a H4 bearish fair value gap which upon mitigation rejected it and formed an Ifvg on the 1 hour timeframe. The inverted fair value gap was my entry poi where I waited for it to be mitigated on the 15 minute timeframe and after a full body close I entered shorts.','2026-03-18','2026-03-18 20:28:17','/uploads/1773865697352-830472758.jpg'),
(8,'EURUSD','New York ','IRL-ERL',2.00,'EU had formed an internal range liquidity from the four hour timeframe. The IRL got mitigated and froma a change in state of delivery I wanted to go long.Took longs from there but the IRL did not hold. From my Judgement since the weekly highs were taken then the bias shifted to shorts .','2026-03-24','2026-03-24 19:07:25','/uploads/1774379245574-401975514.png'),
(9,'BTCUSD','London','IRL-ERL',1.00,'BTC had formed an Inversion fair value gap in the daily timeframe and had mitigated the IFVG I waited for a clear setup till thursday through Asia ,London and New york for my take profit to be fully taken. I confirmed the trade from a close below a1hour bearish change in state of delivery.','2026-03-25','2026-03-29 12:06:58','/uploads/1774786018229-629401031.jpg');
`;

const outcomesSQL = `
INSERT INTO trade_outcomes (id, idea_id, result_r, screenshot_path, created_at) VALUES
(2,1,2.00,'/uploads/1772747250001-87647479.png','2026-03-05 21:47:30'),
(3,2,0.00,'/uploads/1772816386379-317128733.png','2026-03-06 16:59:46'),
(4,3,3.00,'/uploads/1773172384398-431848640.jpeg','2026-03-10 19:53:04'),
(5,4,3.00,'/uploads/1773280033386-47971182.jpg','2026-03-12 01:47:13'),
(6,5,3.00,'/uploads/1773417282468-357355622.png','2026-03-13 15:54:42'),
(7,6,3.00,'/uploads/1773778489152-615545576.jpg','2026-03-17 20:14:49'),
(8,7,4.00,'/uploads/1773865722912-254353155.jpg','2026-03-18 20:28:42'),
(9,8,-2.00,'/uploads/1774379287719-3783307.png','2026-03-24 19:08:07'),
(10,9,2.52,'/uploads/1774786070219-818903527.jpg','2026-03-29 12:07:50');
`;

db.connect((err) => {
  if (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to Aiven. Importing trade_ideas...");

  db.query(ideasSQL, (err) => {
    if (err) {
      console.error("Failed inserting trade_ideas:", err);
      process.exit(1);
    }
    console.log("trade_ideas imported successfully.");

    db.query(outcomesSQL, (err) => {
      if (err) {
        console.error("Failed inserting trade_outcomes:", err);
        process.exit(1);
      }
      console.log("trade_outcomes imported successfully.");

      db.query("SELECT id, pair, trade_date FROM trade_ideas ORDER BY id", (err, results) => {
        if (err) { console.error(err); process.exit(1); }
        console.log("Trade ideas now in database:");
        console.table(results);
        db.end();
      });
    });
  });
});
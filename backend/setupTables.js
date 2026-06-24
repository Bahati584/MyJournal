require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

const createIdeas = `
CREATE TABLE IF NOT EXISTS trade_ideas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pair VARCHAR(20) NOT NULL,
    session VARCHAR(20),
    setup_type VARCHAR(50),
    risk_percent DECIMAL(5,2),
    notes TEXT,
    trade_date DATE NOT NULL,
    before_screenshot VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createOutcomes = `
CREATE TABLE IF NOT EXISTS trade_outcomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idea_id INT NOT NULL,
    result_r DECIMAL(6,2) NOT NULL,
    screenshot_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idea_id) REFERENCES trade_ideas(id) ON DELETE CASCADE
);
`;

db.connect((err) => {
  if (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
  console.log("Connected. Creating tables...");

  db.query(createIdeas, (err) => {
    if (err) { console.error("Failed creating trade_ideas:", err); process.exit(1); }
    console.log("trade_ideas created (or already exists)");

    db.query(createOutcomes, (err) => {
      if (err) { console.error("Failed creating trade_outcomes:", err); process.exit(1); }
      console.log("trade_outcomes created (or already exists)");

      db.query("SHOW TABLES", (err, results) => {
        if (err) { console.error(err); process.exit(1); }
        console.log("Tables now in database:", results);
        db.end();
      });
    });
  });
});
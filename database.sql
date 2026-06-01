CREATE DATABASE IF NOT EXISTS trading_journal;
USE trading_journal;

-- Trade ideas (pre-trade plans)
CREATE TABLE IF NOT EXISTS trade_ideas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pair VARCHAR(20) NOT NULL,          -- e.g. XAUUSD, EUR/USD
    session VARCHAR(20),                -- London / NY / Asia
    setup_type VARCHAR(50),             -- Breakout / Pullback / etc
    risk_percent DECIMAL(5,2),          -- e.g. 1.00 (% risk)
    notes TEXT,
    trade_date DATE NOT NULL,
    before_screenshot VARCHAR(255),     -- path to pre-trade chart screenshot
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade outcomes (post-trade results linked to an idea)
CREATE TABLE IF NOT EXISTS trade_outcomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idea_id INT NOT NULL,               -- references trade_ideas.id
    result_r DECIMAL(6,2) NOT NULL,     -- R multiple (e.g. 2.50, -1.00)
    screenshot_path VARCHAR(255),       -- path to post-trade chart screenshot
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idea_id) REFERENCES trade_ideas(id) ON DELETE CASCADE
);
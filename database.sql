CREATE DATABASE IF NOT EXISTS trading_journal;
USE trading_journal;

CREATE TABLE trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    pair VARCHAR(20) NOT NULL,                -- e.g. XAUUSD
    session VARCHAR(20),                      -- London / NY / Asia
    setup_type VARCHAR(50),                   -- Breakout / Pullback / etc
    
    risk_percent DECIMAL(5,2),                -- e.g. 1.00 (% risk)
    result_r DECIMAL(6,2) NOT NULL,           -- R multiple (e.g. 2.50, -1.00)
    
    screenshot_path VARCHAR(255),             -- local file path
    
    notes TEXT,
    
    trade_date DATE NOT NULL,                 -- important for calendar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

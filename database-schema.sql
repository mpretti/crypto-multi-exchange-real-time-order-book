-- AI Paper Trading Agent Database Schema
-- SQLite Database for persisting all trading agent data

-- Trading Sessions Table
CREATE TABLE trading_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT DEFAULT 'default_user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    session_name TEXT,
    notes TEXT
);

-- Trading Configurations Table
CREATE TABLE trading_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    exchange TEXT NOT NULL,
    asset TEXT NOT NULL,
    strategy TEXT NOT NULL,
    initial_capital REAL NOT NULL,
    trading_speed TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    position_size INTEGER NOT NULL, -- Percentage
    ai_personality TEXT NOT NULL,
    chart_overlay_enabled BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES trading_sessions(session_id)
);

-- Portfolio States Table (snapshots over time)
CREATE TABLE portfolio_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    cash REAL NOT NULL,
    total_value REAL NOT NULL,
    initial_value REAL NOT NULL,
    day_start_value REAL NOT NULL,
    -- Position data (JSON for flexibility)
    position_asset TEXT,
    position_quantity REAL,
    position_average_price REAL,
    position_entry_time DATETIME,
    -- Performance metrics
    total_pnl REAL,
    daily_pnl REAL,
    unrealized_pnl REAL,
    FOREIGN KEY (session_id) REFERENCES trading_sessions(session_id)
);

-- Trades Table
CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    trade_id TEXT UNIQUE NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    asset TEXT NOT NULL,
    exchange TEXT NOT NULL,
    price REAL NOT NULL,
    quantity REAL NOT NULL,
    value REAL NOT NULL,
    fee REAL NOT NULL,
    fee_rate REAL, -- The actual fee rate used
    pnl REAL DEFAULT 0,
    strategy TEXT NOT NULL,
    reason TEXT,
    confidence REAL, -- AI confidence level
    market_conditions TEXT, -- JSON blob of market data at trade time
    FOREIGN KEY (session_id) REFERENCES trading_sessions(session_id)
);

-- AI Thoughts and Actions Log
CREATE TABLE agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    log_type TEXT NOT NULL CHECK (log_type IN ('thought', 'action', 'error', 'config_change')),
    content TEXT NOT NULL,
    data JSON, -- Additional structured data
    FOREIGN KEY (session_id) REFERENCES trading_sessions(session_id)
);

-- Market Data Snapshots (for backtesting and analysis)
CREATE TABLE market_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    asset TEXT NOT NULL,
    exchange TEXT NOT NULL,
    price REAL NOT NULL,
    volume REAL,
    bid REAL,
    ask REAL,
    spread REAL,
    FOREIGN KEY (session_id) REFERENCES trading_sessions(session_id)
);

-- Performance Analytics Table
CREATE TABLE performance_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metric_name TEXT NOT NULL,
    metric_value REAL,
    metric_data JSON, -- For complex metrics
    period_start DATETIME,
    period_end DATETIME,
    FOREIGN KEY (session_id) REFERENCES trading_sessions(session_id)
);

-- Exchange Fee Information Cache
CREATE TABLE exchange_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exchange TEXT NOT NULL,
    asset TEXT NOT NULL,
    maker_fee REAL NOT NULL,
    taker_fee REAL NOT NULL,
    fee_note TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exchange, asset)
);

-- Strategy Performance Tracking
CREATE TABLE strategy_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    strategy_name TEXT NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl REAL DEFAULT 0,
    max_drawdown REAL DEFAULT 0,
    sharpe_ratio REAL,
    win_rate REAL,
    avg_win REAL,
    avg_loss REAL,
    largest_win REAL,
    largest_loss REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES trading_sessions(session_id)
);

-- Indexes for performance
CREATE INDEX idx_trades_session_timestamp ON trades(session_id, timestamp);
CREATE INDEX idx_portfolio_session_timestamp ON portfolio_states(session_id, timestamp);
CREATE INDEX idx_agent_logs_session_timestamp ON agent_logs(session_id, timestamp);
CREATE INDEX idx_market_snapshots_session_asset ON market_snapshots(session_id, asset, timestamp);

-- Views for common queries
CREATE VIEW recent_trades AS
SELECT 
    t.*,
    ts.session_name,
    tc.strategy,
    tc.exchange as config_exchange
FROM trades t
JOIN trading_sessions ts ON t.session_id = ts.session_id
JOIN trading_configs tc ON t.session_id = tc.session_id
WHERE ts.is_active = 1
ORDER BY t.timestamp DESC;

CREATE VIEW current_portfolios AS
SELECT 
    ps.*,
    ts.session_name,
    tc.exchange,
    tc.asset,
    tc.strategy
FROM portfolio_states ps
JOIN trading_sessions ts ON ps.session_id = ts.session_id
JOIN trading_configs tc ON ps.session_id = tc.session_id
WHERE ts.is_active = 1
AND ps.timestamp = (
    SELECT MAX(timestamp) 
    FROM portfolio_states ps2 
    WHERE ps2.session_id = ps.session_id
);

-- Triggers to update timestamps
CREATE TRIGGER update_trading_sessions_timestamp 
    AFTER UPDATE ON trading_sessions
BEGIN
    UPDATE trading_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Initial data for testing
INSERT INTO trading_sessions (session_id, session_name, notes) 
VALUES ('default', 'Default Trading Session', 'Initial session for testing'); 
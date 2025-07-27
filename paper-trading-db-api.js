import express from 'express';
import sqlite3Package from 'sqlite3';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const sqlite3 = sqlite3Package.verbose();

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = './paper-trading.db';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
let db;

function initDatabase() {
    console.log('🗄️ Initializing Paper Trading Database...');
    
    // Check if database exists
    const dbExists = fs.existsSync(DB_PATH);
    
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('❌ Error opening database:', err.message);
            process.exit(1);
        }
        console.log(`✅ Connected to SQLite database at ${DB_PATH}`);
    });

    // If database doesn't exist, create schema
    if (!dbExists) {
        console.log('📋 Creating database schema...');
        const schema = fs.readFileSync('./database-schema.sql', 'utf8');
        
        db.exec(schema, (err) => {
            if (err) {
                console.error('❌ Error creating schema:', err.message);
            } else {
                console.log('✅ Database schema created successfully');
            }
        });
    }
}

// Helper function for promisifying database operations
function dbAll(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function dbRun(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

function dbGet(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// API Routes

// ==== TRADING SESSIONS ====

// Get all trading sessions
app.get('/api/sessions', async (req, res) => {
    try {
        const sessions = await dbAll(`
            SELECT ts.*, 
                   COUNT(t.id) as total_trades,
                   COALESCE(SUM(CASE WHEN t.pnl > 0 THEN 1 ELSE 0 END), 0) as winning_trades,
                   COALESCE(SUM(t.pnl), 0) as total_pnl
            FROM trading_sessions ts
            LEFT JOIN trades t ON ts.session_id = t.session_id
            GROUP BY ts.id
            ORDER BY ts.created_at DESC
        `);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new trading session
app.post('/api/sessions', async (req, res) => {
    try {
        const { session_id, session_name, notes } = req.body;
        const result = await dbRun(`
            INSERT INTO trading_sessions (session_id, session_name, notes)
            VALUES (?, ?, ?)
        `, [session_id, session_name, notes]);
        
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==== TRADING CONFIGURATIONS ====

// Get configuration for session
app.get('/api/sessions/:sessionId/config', async (req, res) => {
    try {
        const config = await dbGet(`
            SELECT * FROM trading_configs 
            WHERE session_id = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        `, [req.params.sessionId]);
        
        res.json(config || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save trading configuration
app.post('/api/sessions/:sessionId/config', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const config = req.body;
        
        const result = await dbRun(`
            INSERT INTO trading_configs (
                session_id, exchange, asset, strategy, initial_capital, 
                trading_speed, risk_level, position_size, ai_personality, 
                chart_overlay_enabled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            sessionId, config.exchange, config.asset, config.strategy,
            config.initialCapital, config.tradingSpeed, config.riskLevel,
            config.positionSize, config.aiPersonality, config.chartOverlay || false
        ]);
        
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==== PORTFOLIO STATES ====

// Get current portfolio for session
app.get('/api/sessions/:sessionId/portfolio', async (req, res) => {
    try {
        const portfolio = await dbGet(`
            SELECT * FROM portfolio_states 
            WHERE session_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 1
        `, [req.params.sessionId]);
        
        res.json(portfolio || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save portfolio state
app.post('/api/sessions/:sessionId/portfolio', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const portfolio = req.body;
        
        const result = await dbRun(`
            INSERT INTO portfolio_states (
                session_id, cash, total_value, initial_value, day_start_value,
                position_asset, position_quantity, position_average_price, 
                position_entry_time, total_pnl, daily_pnl, unrealized_pnl
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            sessionId, portfolio.cash, portfolio.totalValue, portfolio.initialValue,
            portfolio.dayStartValue, portfolio.position?.asset || null,
            portfolio.position?.quantity || null, portfolio.position?.averagePrice || null,
            portfolio.position?.entryTime || null, portfolio.totalPnl || 0,
            portfolio.dailyPnl || 0, portfolio.unrealizedPnl || 0
        ]);
        
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get portfolio history
app.get('/api/sessions/:sessionId/portfolio/history', async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const history = await dbAll(`
            SELECT * FROM portfolio_states 
            WHERE session_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `, [req.params.sessionId, parseInt(limit)]);
        
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==== TRADES ====

// Get trades for session
app.get('/api/sessions/:sessionId/trades', async (req, res) => {
    try {
        const { limit = 50, side } = req.query;
        let query = `
            SELECT * FROM trades 
            WHERE session_id = ?
        `;
        let params = [req.params.sessionId];
        
        if (side) {
            query += ` AND side = ?`;
            params.push(side);
        }
        
        query += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(parseInt(limit));
        
        const trades = await dbAll(query, params);
        res.json(trades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save trade
app.post('/api/sessions/:sessionId/trades', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const trade = req.body;
        
        const result = await dbRun(`
            INSERT INTO trades (
                session_id, trade_id, side, asset, exchange, price, quantity,
                value, fee, fee_rate, pnl, strategy, reason, confidence, market_conditions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            sessionId, trade.id, trade.side, trade.asset, trade.exchange,
            trade.price, trade.quantity, trade.value, trade.fee, trade.feeRate || null,
            trade.pnl, trade.strategy, trade.reason, trade.confidence || null,
            trade.marketConditions || null
        ]);
        
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==== AGENT LOGS ====

// Get agent logs for session
app.get('/api/sessions/:sessionId/logs', async (req, res) => {
    try {
        const { limit = 100, type } = req.query;
        let query = `
            SELECT * FROM agent_logs 
            WHERE session_id = ?
        `;
        let params = [req.params.sessionId];
        
        if (type) {
            query += ` AND log_type = ?`;
            params.push(type);
        }
        
        query += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(parseInt(limit));
        
        const logs = await dbAll(query, params);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save agent log
app.post('/api/sessions/:sessionId/logs', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { type, content, data } = req.body;
        
        const result = await dbRun(`
            INSERT INTO agent_logs (session_id, log_type, content, data)
            VALUES (?, ?, ?, ?)
        `, [sessionId, type, content, data ? JSON.stringify(data) : null]);
        
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==== ANALYTICS ====

// Get performance analytics
app.get('/api/sessions/:sessionId/analytics', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        
        // Calculate comprehensive analytics
        const [tradeStats, portfolioStats, strategyStats] = await Promise.all([
            // Trade statistics
            dbGet(`
                SELECT 
                    COUNT(*) as total_trades,
                    COUNT(CASE WHEN side = 'buy' THEN 1 END) as buy_trades,
                    COUNT(CASE WHEN side = 'sell' THEN 1 END) as sell_trades,
                    COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_trades,
                    COUNT(CASE WHEN pnl < 0 THEN 1 END) as losing_trades,
                    COALESCE(SUM(pnl), 0) as total_pnl,
                    COALESCE(AVG(pnl), 0) as avg_pnl,
                    COALESCE(MAX(pnl), 0) as best_trade,
                    COALESCE(MIN(pnl), 0) as worst_trade,
                    COALESCE(SUM(fee), 0) as total_fees
                FROM trades 
                WHERE session_id = ?
            `, [sessionId]),
            
            // Portfolio statistics
            dbGet(`
                SELECT 
                    MIN(total_value) as min_portfolio_value,
                    MAX(total_value) as max_portfolio_value,
                    (MAX(total_value) - MIN(total_value)) / MIN(total_value) * 100 as max_gain_percent
                FROM portfolio_states 
                WHERE session_id = ?
            `, [sessionId]),
            
            // Strategy performance
            dbAll(`
                SELECT 
                    strategy,
                    COUNT(*) as trades_count,
                    SUM(pnl) as strategy_pnl,
                    AVG(pnl) as avg_pnl,
                    COUNT(CASE WHEN pnl > 0 THEN 1 END) * 100.0 / COUNT(*) as win_rate
                FROM trades 
                WHERE session_id = ? 
                GROUP BY strategy
            `, [sessionId])
        ]);
        
        // Calculate win rate
        const winRate = tradeStats.sell_trades > 0 ? 
            (tradeStats.winning_trades / tradeStats.sell_trades * 100).toFixed(2) : 0;
        
        res.json({
            trades: { ...tradeStats, win_rate: parseFloat(winRate) },
            portfolio: portfolioStats || {},
            strategies: strategyStats || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==== EXCHANGE FEES ====

// Cache exchange fees
app.post('/api/exchange-fees', async (req, res) => {
    try {
        const { exchange, asset, makerFee, takerFee, note } = req.body;
        
        const result = await dbRun(`
            INSERT OR REPLACE INTO exchange_fees (exchange, asset, maker_fee, taker_fee, fee_note)
            VALUES (?, ?, ?, ?, ?)
        `, [exchange, asset, makerFee, takerFee, note]);
        
        res.json({ success: true, id: result.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get cached exchange fees
app.get('/api/exchange-fees/:exchange/:asset', async (req, res) => {
    try {
        const fees = await dbGet(`
            SELECT * FROM exchange_fees 
            WHERE exchange = ? AND asset = ?
        `, [req.params.exchange, req.params.asset]);
        
        res.json(fees || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==== EXPORT/IMPORT ====

// Export session data
app.get('/api/sessions/:sessionId/export', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        
        const [session, config, trades, portfolio, logs] = await Promise.all([
            dbGet('SELECT * FROM trading_sessions WHERE session_id = ?', [sessionId]),
            dbGet('SELECT * FROM trading_configs WHERE session_id = ? ORDER BY created_at DESC LIMIT 1', [sessionId]),
            dbAll('SELECT * FROM trades WHERE session_id = ? ORDER BY timestamp', [sessionId]),
            dbAll('SELECT * FROM portfolio_states WHERE session_id = ? ORDER BY timestamp', [sessionId]),
            dbAll('SELECT * FROM agent_logs WHERE session_id = ? ORDER BY timestamp', [sessionId])
        ]);
        
        const exportData = {
            session,
            config,
            trades,
            portfolio,
            logs,
            exported_at: new Date().toISOString()
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="paper-trading-${sessionId}-${Date.now()}.json"`);
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
function startServer() {
    initDatabase();
    
    app.listen(PORT, () => {
        console.log(`🚀 Paper Trading DB API Server running on port ${PORT}`);
        console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
        console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('✅ Database connection closed.');
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

// Start the server
startServer(); 
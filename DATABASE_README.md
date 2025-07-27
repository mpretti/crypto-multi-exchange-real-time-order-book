# 🗄️ Paper Trading Database System

## Overview

The AI Paper Trading Agent now includes a comprehensive database persistence system that stores all trading activities, thoughts, configurations, and performance analytics. The system automatically falls back to localStorage if the database backend is not available.

## 🏗️ Architecture

### Database Schema
- **SQLite Database**: `paper-trading.db`
- **8 Core Tables**: Trading sessions, configurations, portfolio states, trades, agent logs, market snapshots, performance analytics, exchange fees
- **Views & Indexes**: Optimized for fast queries and reporting
- **Triggers**: Automatic timestamp updates

### Backend API
- **Node.js + Express**: RESTful API server
- **Port 3001**: Database backend service
- **CORS Enabled**: For frontend communication
- **Health Monitoring**: Real-time status checks

### Frontend Integration
- **Database Client**: TypeScript client for API communication
- **Fallback Mode**: Automatic localStorage fallback
- **Migration**: Seamless migration from localStorage to database

## 📊 What Gets Persisted

### 1. **Trading Sessions**
- Session metadata and identification
- User information and session notes
- Active/inactive status tracking

### 2. **Trading Configurations**
- Exchange, asset, and strategy selections
- Initial capital and position sizing
- Risk levels and AI personality settings
- Chart overlay preferences

### 3. **Portfolio States (Time Series)**
- Cash balances and total portfolio value
- Position details (asset, quantity, average price)
- P&L calculations (realized and unrealized)
- Daily performance snapshots

### 4. **Trade Records**
- Complete trade execution details
- Buy/sell orders with timestamps
- Fees, P&L, and strategy reasoning
- Market conditions at trade time
- AI confidence levels

### 5. **AI Agent Logs**
- Thoughts and decision reasoning
- Configuration changes
- Error logs and debugging info
- Action history with timestamps

### 6. **Market Data Snapshots**
- Price, volume, bid/ask data
- Spread calculations
- Exchange-specific market conditions

### 7. **Performance Analytics**
- Win rates and trade statistics
- Strategy performance comparisons
- Risk metrics and drawdown analysis
- Sharpe ratios and other indicators

### 8. **Exchange Fee Cache**
- Real-time fee structures
- Maker/taker rates by exchange
- Fee optimization insights

## 🚀 Getting Started

### Prerequisites
```bash
# Install Node.js (if not already installed)
curl -fsSL https://nodejs.org/dist/v18.17.0/node-v18.17.0-darwin-x64.tar.gz | tar -xz

# Verify installation
node --version
npm --version
```

### Quick Start
```bash
# Start both frontend and backend
./start-with-database.sh

# Or manually:
# 1. Install dependencies
npm install

# 2. Start backend (Terminal 1)
node paper-trading-db-api.js

# 3. Start frontend (Terminal 2)
python3 -m http.server 8001
```

### Verification
```bash
# Check backend health
curl http://localhost:3001/api/health

# Access frontend
open http://localhost:8001
```

## 📡 API Endpoints

### Sessions
- `GET /api/sessions` - List all trading sessions
- `POST /api/sessions` - Create new session

### Configuration
- `GET /api/sessions/:id/config` - Get session configuration
- `POST /api/sessions/:id/config` - Save configuration

### Portfolio
- `GET /api/sessions/:id/portfolio` - Current portfolio state
- `POST /api/sessions/:id/portfolio` - Save portfolio state
- `GET /api/sessions/:id/portfolio/history` - Portfolio history

### Trades
- `GET /api/sessions/:id/trades` - Get trade history
- `POST /api/sessions/:id/trades` - Save new trade

### Agent Logs
- `GET /api/sessions/:id/logs` - Get agent logs
- `POST /api/sessions/:id/logs` - Save agent log

### Analytics
- `GET /api/sessions/:id/analytics` - Performance analytics

### Export/Import
- `GET /api/sessions/:id/export` - Export session data

## 🔧 Configuration

### Database Configuration
The system automatically creates and configures the SQLite database:

```javascript
// Database location
const DB_PATH = './paper-trading.db';

// Auto-initialization
- Schema creation from SQL file
- Default session setup
- Index optimization
```

### Frontend Configuration
```typescript
// Database client configuration
const paperTradingDb = new PaperTradingDbClient(
    'http://localhost:3001/api',  // Backend URL
    'default'                     // Session ID
);
```

## 📈 Enhanced Features

### 1. **Automatic Migration**
- Seamlessly migrates existing localStorage data to database
- Zero data loss during transition
- Preserves all historical trades and configurations

### 2. **Fallback Mode**
- Continues working if database backend is unavailable
- Automatic detection of backend status
- Transparent switching between storage modes

### 3. **Real-Time Analytics**
```sql
-- Example: Get win rate by strategy
SELECT 
    strategy,
    COUNT(*) as total_trades,
    COUNT(CASE WHEN pnl > 0 THEN 1 END) * 100.0 / COUNT(*) as win_rate,
    SUM(pnl) as total_pnl
FROM trades 
WHERE session_id = 'default' 
GROUP BY strategy;
```

### 4. **Data Export**
- Complete session exports in JSON format
- Includes all trades, portfolio history, and logs
- Suitable for backup and analysis

### 5. **Performance Monitoring**
- Real-time performance analytics
- Strategy comparison tools
- Risk assessment metrics

## 🛡️ Data Safety

### Backup Strategy
```bash
# Backup database
cp paper-trading.db paper-trading-backup-$(date +%Y%m%d).db

# Export session data via API
curl http://localhost:3001/api/sessions/default/export > backup.json
```

### Recovery Options
- Database corruption recovery via schema rebuild
- localStorage fallback maintains functionality
- Session export/import for data migration

## 🔍 Monitoring & Debugging

### Health Checks
```bash
# Backend status
curl http://localhost:3001/api/health

# Database connectivity
sqlite3 paper-trading.db ".tables"
```

### Log Analysis
```javascript
// Frontend logs
paperTradingDb.getAgentLogs(100, 'error')

// Backend logs
tail -f server.log
```

## 📊 Analytics Queries

### Trading Performance
```sql
-- Portfolio growth over time
SELECT 
    DATE(timestamp) as date,
    total_value,
    (total_value - initial_value) / initial_value * 100 as growth_percent
FROM portfolio_states 
WHERE session_id = 'default'
ORDER BY timestamp;
```

### Strategy Analysis
```sql
-- Best performing strategies
SELECT 
    strategy,
    COUNT(*) as trades,
    AVG(pnl) as avg_pnl,
    SUM(pnl) as total_pnl,
    COUNT(CASE WHEN pnl > 0 THEN 1 END) * 100.0 / COUNT(*) as win_rate
FROM trades 
WHERE session_id = 'default'
GROUP BY strategy
ORDER BY total_pnl DESC;
```

## 🚀 Advanced Usage

### Custom Sessions
```javascript
// Create specialized trading sessions
await paperTradingDb.createSession('momentum-testing', 'Testing momentum strategy variations');

// Switch between sessions
paperTradingDb.setSessionId('momentum-testing');
```

### Multi-User Support
The system supports multiple users through the `user_id` field in trading sessions, enabling:
- Isolated trading environments
- User-specific analytics
- Collaborative analysis capabilities

## 🔮 Future Enhancements

- **Real-time dashboards** with live analytics
- **Advanced backtesting** with historical data
- **Machine learning insights** from trading patterns
- **Multi-exchange arbitrage** tracking
- **Social trading features** with shared strategies

---

**Database System Status**: ✅ Production Ready  
**Migration Support**: ✅ Automatic  
**Fallback Mode**: ✅ localStorage  
**Analytics**: ✅ Advanced  
**Export/Import**: ✅ Complete 
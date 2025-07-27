# Development Guide

## 🚀 Quick Start

### Option 1: Automatic Start (Recommended)
```bash
npm run dev:start
```
This will:
1. Build JavaScript files from TypeScript sources
2. Start the database API on port 3001
3. Start the web server on port 8001

### Option 2: Manual Start
```bash
# 1. Build core JS files from TypeScript
npm run build:core

# 2. Start database API
npm run start

# 3. Start web server (in another terminal)
npm run serve
```

## 📁 File Structure

### JavaScript Files (Browser-Ready)
- `paper-trading.js` - Paper trading engine with database persistence
- `multi-agent-trading-manager.js` - Multi-agent AI trading system
- `multi-agent-strategies.js` - Trading strategies for AI agents
- `multi-agent-integration.js` - Integration with order book interface
- `utils.js` - Utility functions
- `state.js` - Application state management (auto-generated)
- `config.js` - Configuration constants (auto-generated)
- `dom.js` - DOM element references (auto-generated)
- `uiUpdates.js` - UI update functions (auto-generated)

### TypeScript Source Files
- `state.ts` - Source for state.js
- `config.ts` - Source for config.js  
- `dom.ts` - Source for dom.js
- `uiUpdates.ts` - Source for uiUpdates.js
- `index.tsx` - Main application (complex, manually converted if needed)
- `charts.ts` - Chart functionality (complex, manually converted if needed)

### Database
- `paper-trading-db-api.js` - Express API server for data persistence
- `database-schema.sql` - SQLite database schema
- `paper-trading.db` - SQLite database file (auto-created)

## 🔧 Development Scripts

- `npm run dev:start` - Full development environment (build + servers)
- `npm run build:core` - Convert TypeScript files to JavaScript
- `npm run start` - Start database API only
- `npm run serve` - Start web server only
- `npm run dev:full` - Start both servers (assumes JS files exist)

## 🌐 Access Points

- **Web Application**: http://localhost:8001
- **Database API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## 📊 Features Available

✅ **Real-time Order Book** - Multi-exchange crypto data visualization  
✅ **Paper Trading** - Complete trading simulation with database persistence  
✅ **Multi-Agent Trading** - AI trading agents with 6 different strategies  
✅ **Chart Integration** - Trading visualization overlaid on price charts  
✅ **Database Persistence** - All trades and portfolios saved automatically  
✅ **Whale Watcher** - Large order detection and alerts  
✅ **Time & Sales** - Real-time trade stream monitoring  

## 🤖 Multi-Agent Trading Strategies

1. **Conservative Growth** - Capital preservation focus (5% max drawdown)
2. **Aggressive Momentum** - High-risk momentum trading (25% max drawdown)
3. **Balanced Trader** - Moderate risk with diversification (15% max drawdown) 
4. **Scalper Pro** - High-frequency small profit trades (8% max drawdown)
5. **Multi-Asset Arbitrage** - Price discrepancy exploitation (3% max drawdown)
6. **Whale Hunter** - Follows large institutional movements (20% max drawdown)

## 🔄 TypeScript to JavaScript Conversion

The build script (`build-core.js`) automatically:
- Removes TypeScript import/export statements
- Strips type annotations 
- Removes interface/type definitions
- Converts to browser-compatible JavaScript

For complex files like `index.tsx` and `charts.ts`, manual conversion may be needed due to advanced TypeScript features.

## 🗄️ Database Schema

The application uses SQLite with tables for:
- `trading_sessions` - Session management
- `trading_configs` - Agent configurations  
- `portfolio_states` - Portfolio snapshots over time
- `trades` - Individual trade records
- `trading_logs` - Application logs and events

## 🔧 Troubleshooting

### MIME Type Errors
- Use JavaScript files instead of TypeScript files in HTML
- Run `npm run build:core` to regenerate JS files

### Database Errors
- Delete `paper-trading.db` and restart API to recreate schema
- Check API health: `curl http://localhost:3001/api/health`

### Port Conflicts
- Database API: Change PORT in `paper-trading-db-api.js`
- Web Server: Use different port with `python3 -m http.server 8002` 
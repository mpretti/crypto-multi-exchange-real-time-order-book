# 🚀 Quick Start: Web Monitoring Dashboard

## 🌐 Access the Dashboard

1. **Start the web server**:
   ```bash
   cd historical-data
   npm run web
   ```

2. **Open in browser**:
   - **Main Dashboard**: http://localhost:3001
   - **Stats Page**: http://localhost:3001/stats.html
   - **API Endpoint**: http://localhost:3001/api/stats

## 📊 Dashboard Features

### Real-Time Monitoring
- **System Stats**: Files count, storage usage, uptime
- **Collection Status**: Active, completed, failed collections
- **Live Updates**: Automatic refresh every 30 seconds

### Collection Control
- **Start All**: Begin collecting from all exchanges
- **Exchange-Specific**: Start Binance, Bybit individually
- **Analysis**: Run data quality analysis
- **Stop Control**: Stop running collections

### Live Logs
- Real-time collection logs
- System events and errors
- Process status updates

## 🎛️ API Usage

### Get System Stats
```bash
curl http://localhost:3001/api/stats
```

### Start Collections
```bash
# Start all exchanges
curl -X POST http://localhost:3001/api/start

# Start specific exchange
curl -X POST http://localhost:3001/api/start/binance
curl -X POST http://localhost:3001/api/start/bybit
```

### Run Analysis
```bash
curl http://localhost:3001/api/analyze
```

## 🎯 Quick Demo

1. Start the web server: `npm run web`
2. Open http://localhost:3001/stats.html
3. Click "🚀 Start All" to begin collection
4. Watch real-time logs and stats
5. Monitor progress in the dashboard

The web interface provides complete control and monitoring for your historical data collection system!

# 🌐 Historical Data Collection Web Interface

A comprehensive web-based controller and monitoring dashboard for the cryptocurrency historical data collection system.

## 🚀 Quick Start

### Start the Web Server
```bash
cd historical-data
npm run web
```

### Access the Dashboard
- **Main Dashboard**: http://localhost:3001
- **Monitoring Page**: http://localhost:3001/monitoring.html
- **API Status**: http://localhost:3001/api/stats

## 📊 Features

### Real-Time Monitoring
- Live system stats (files, storage, uptime)
- Collection status tracking
- WebSocket-powered updates
- Visual progress charts

### Collection Control
- Start/stop collections
- Exchange-specific controls
- Data analysis triggers
- Process management

### Analytics Dashboard
- Progress tracking charts
- Storage usage breakdown
- Success rate metrics
- Recent activity feed

## 🔧 API Endpoints

### System Information
- `GET /api/stats` - Current system statistics
- `GET /api/config` - Configuration settings
- `POST /api/config` - Update configuration

### Collection Control
- `POST /api/start/:exchange?` - Start collection
- `POST /api/stop/:collectionId` - Stop collection
- `GET /api/analyze` - Run data analysis

### Data Access
- `GET /api/logs` - Recent log files
- `GET /api/files/:exchange?/:symbol?` - Browse files

## 📱 Usage

### Starting Collections
```bash
# Via web interface buttons or API calls
curl -X POST http://localhost:3001/api/start/binance
curl -X POST http://localhost:3001/api/start  # all exchanges
```

### Monitoring
- Real-time logs in dashboard
- Automatic status updates
- Progress visualization
- Error tracking

### Configuration
- Edit settings via web interface
- Real-time config updates
- Validation and error handling

The web interface provides complete control and monitoring for your historical data collection system.

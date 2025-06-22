# 🏗️ Crypto Trading Dashboard - Server Architecture

## 📋 Overview

Your crypto trading system runs on **two separate servers** for different purposes:

### 🎯 **Port 5173** - Frontend Trading Dashboard (Vite Dev Server)
- **URL**: `http://localhost:5173/`
- **Purpose**: Real-time trading interface and analytics
- **Technology**: Vite.js development server with hot reload
- **Features**:
  - 📈 Real-time order book across multiple exchanges
  - 🐋 **Whale Watcher** - Large trade detection and monitoring
  - ⏰ **Time & Sales** - Live trade feed with filtering
  - 📊 Advanced volume analytics and charts
  - 🔧 Exchange status monitoring
  - 🔍 Trading pairs explorer

### 🗄️ **Port 3001** - Historical Data Collection Server (Express.js)
- **URL**: `http://localhost:3001/`
- **Purpose**: Data collection, storage, and historical analysis
- **Technology**: Express.js + Socket.IO + EJS templates
- **Features**:
  - 📊 Historical data collection dashboard
  - 🔄 Data collector management and monitoring
  - 📈 Data analysis and reporting
  - 📁 File browser for collected data
  - 📝 Collection logs and system stats
  - ⚙️ Configuration management

## 🔗 Navigation Integration

All pages now include links to both systems:

### Main Navigation (All Pages)
- 📈 Order Book → `index.html`
- 📊 Charts → `charts-dashboard.html`  
- 📊 Volume → `volume-dashboard.html` (with 🐋 Whale Watcher & ⏰ Time & Sales)
- 🔍 Trading Pairs → `trading-pairs-explorer.html`
- 🔧 Exchange Status → `exchange-status.html`
- **📊 Historical Data** → `http://localhost:3001/` *(opens in new tab)*

### Quick Access Buttons
- **Whale Watcher Controls**: Export + 📊 Historical button
- **Time & Sales Controls**: Export + 📊 Historical button

## 🚀 Starting Both Services

### Frontend Server (Port 5173)
```bash
npm run dev
# or
vite
```

### Historical Data Server (Port 3001)
```bash
cd historical-data/web
node server.js
```

## 🎯 Use Cases

### **Real-time Trading** → Port 5173
- Monitor live order books and prices
- Track whale trades and large movements
- Analyze real-time volume and market sentiment
- Watch exchange connectivity status

### **Historical Analysis** → Port 3001
- Collect and store historical price data
- Run data analysis and generate reports
- Manage data collection processes
- Browse and export historical datasets

## 🔧 Architecture Benefits

1. **Separation of Concerns**: Real-time UI separate from data collection
2. **Independent Scaling**: Each service can be optimized independently  
3. **Development Flexibility**: Frontend hot reload doesn't affect data collection
4. **Data Persistence**: Historical server maintains data even if frontend restarts
5. **Modular Design**: Easy to add new features to either system

## 🎉 New Features Added

### 🐋 Whale Watcher
- **Threshold Detection**: 100-1000+ BTC configurable thresholds
- **Real-time Alerts**: Notifications for mega whales (2000+ BTC)
- **Statistics Tracking**: Whale count, volume, market percentage
- **Visual Indicators**: 🐳 🐋 🐟 based on trade size
- **Export Functionality**: JSON export of whale trade data

### ⏰ Time & Sales
- **Live Trade Feed**: Real-time trades across all exchanges
- **Smart Filtering**: By exchange and trade size
- **Market Sentiment**: Buy/sell ratio and trading velocity
- **Visual Indicators**: 🔥 ⚡ 📊 for different trade sizes
- **Export Functionality**: Filtered trade data export

Both systems are fully integrated and cross-linked for seamless navigation! 🎉

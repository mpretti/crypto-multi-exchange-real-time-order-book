# Crypto Historical Data Collector

A comprehensive system for downloading 5 years of historical cryptocurrency data from multiple exchanges at the smallest available granularity.

## 🚀 Features

- **Multi-Exchange Support**: Binance, Bybit, OKX, Kraken, Bitget, MEXC, Gemini, Coinbase, dYdX, Hyperliquid
- **Multiple Data Types**: Klines/OHLCV, Trades, Order Book snapshots, Funding rates
- **High Granularity**: 1-minute intervals (or smallest available per exchange)
- **Smart Rate Limiting**: Respects each exchange's API limits
- **Data Validation**: Integrity checks and gap detection
- **Organized Storage**: Hierarchical file structure with compression
- **Progress Tracking**: Detailed logging and reporting
- **Resume Capability**: Can restart from where it left off

## 📁 Project Structure

```
historical-data/
├── config/
│   └── data-collection-config.json    # Main configuration
├── scripts/
│   ├── data-collector.js              # Base collector class
│   ├── binance-collector.js           # Binance-specific collector
│   ├── bybit-collector.js             # Bybit-specific collector
│   ├── run-all-collectors.js          # Master script
│   └── data-analyzer.js               # Data analysis tools
├── data/                              # Downloaded data storage
├── logs/                              # Collection reports and logs
└── package.json                      # Dependencies and scripts
```

## 🔧 Configuration

Edit `config/data-collection-config.json` to customize:

- **Date Range**: Start and end dates for data collection
- **Symbols**: Which trading pairs to collect
- **Data Types**: Klines, trades, funding rates, etc.
- **Intervals**: Time granularities (1m, 5m, 1h, etc.)
- **Storage**: Compression, checksums, file structure
- **Rate Limits**: API request limits per exchange

## 🚀 Quick Start

### Installation

```bash
cd historical-data
npm install
```

### Basic Usage

```bash
# Run all enabled exchanges
npm run collect:all

# Run specific exchange
npm run collect:binance
npm run collect:bybit

# Test individual collector
npm run test:binance

# Analyze collected data
npm run analyze

# Show help
npm run help
```

## 📊 Data Organization

Data is organized in a hierarchical structure:

```
data/{exchange}/{symbol}/{dataType}/{year}/{month}/
```

## 🔍 Data Analysis

The analyzer provides comprehensive insights:

```bash
npm run analyze
```

## ⚡ Performance & Optimization

- **Rate Limiting**: Respects API limits with automatic backoff
- **Storage**: Gzip compression reduces size by ~70%
- **Memory**: Streaming writes and chunked processing

## 📈 Estimated Collection Times

For 5 years of 1-minute data:
- **Binance**: 8-12 hours, 8-12 GB
- **Bybit**: 6-8 hours, 6-8 GB
- **Total**: 24-48 hours, 25-35 GB

## 🚨 Error Handling

- Automatic retry with exponential backoff
- Resume capability from last successful point
- Comprehensive logging and error reporting

## 📄 License

MIT License

---

**⚠️ Disclaimer**: Respect exchange API terms of service and rate limits. 
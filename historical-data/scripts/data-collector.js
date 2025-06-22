const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const zlib = require('zlib');
const crypto = require('crypto');

class DataCollector {
  constructor(configPath = '../config/data-collection-config.json') {
    this.configPath = configPath;
    this.config = null;
    this.stats = {
      totalFiles: 0,
      totalSize: 0,
      errors: 0,
      success: 0,
      startTime: null,
      endTime: null
    };
    this.rateLimiters = new Map();
  }

  async init() {
    try {
      const configData = await fs.readFile(path.join(__dirname, this.configPath), 'utf8');
      this.config = JSON.parse(configData);
      
      await this.createDirectories();
      this.initRateLimiters();
      
      console.log('✅ Data Collector initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Data Collector:', error);
      return false;
    }
  }

  async createDirectories() {
    const baseDir = this.config.storage.baseDir;
    const logDir = this.config.logging.logDir;
    
    await fs.mkdir(baseDir, { recursive: true });
    await fs.mkdir(logDir, { recursive: true });
    
    for (const exchange of Object.keys(this.config.exchanges)) {
      const exchangeDir = path.join(baseDir, exchange);
      await fs.mkdir(exchangeDir, { recursive: true });
    }
  }

  initRateLimiters() {
    for (const [exchange, config] of Object.entries(this.config.exchanges)) {
      if (config.enabled) {
        this.rateLimiters.set(exchange, {
          requests: [],
          maxPerMinute: config.maxRequestsPerMinute
        });
      }
    }
  }

  async checkRateLimit(exchange) {
    const limiter = this.rateLimiters.get(exchange);
    if (!limiter) return true;

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    limiter.requests = limiter.requests.filter(time => time > oneMinuteAgo);
    
    if (limiter.requests.length >= limiter.maxPerMinute) {
      const oldestRequest = Math.min(...limiter.requests);
      const waitTime = 60000 - (now - oldestRequest);
      console.log(`⏳ Rate limit reached for ${exchange}, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }
    
    limiter.requests.push(now);
    return true;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async downloadData(exchange, symbol, dataType, startDate, endDate) {
    const exchangeConfig = this.config.exchanges[exchange];
    if (!exchangeConfig || !exchangeConfig.enabled) {
      console.log(`⏭️ Skipping disabled exchange: ${exchange}`);
      return;
    }

    console.log(`🚀 Starting ${dataType} download for ${symbol} on ${exchange}`);
    
    try {
      switch (exchange) {
        case 'binance':
          return await this.downloadBinanceData(symbol, dataType, startDate, endDate);
        case 'bybit':
          return await this.downloadBybitData(symbol, dataType, startDate, endDate);
        case 'okx':
          return await this.downloadOKXData(symbol, dataType, startDate, endDate);
        case 'kraken':
          return await this.downloadKrakenData(symbol, dataType, startDate, endDate);
        case 'bitget':
          return await this.downloadBitgetData(symbol, dataType, startDate, endDate);
        case 'mexc':
          return await this.downloadMEXCData(symbol, dataType, startDate, endDate);
        case 'gemini':
          return await this.downloadGeminiData(symbol, dataType, startDate, endDate);
        case 'coinbase':
          return await this.downloadCoinbaseData(symbol, dataType, startDate, endDate);
        case 'dydx':
          return await this.downloadDydxData(symbol, dataType, startDate, endDate);
        case 'hyperliquid':
          return await this.downloadHyperliquidData(symbol, dataType, startDate, endDate);
        default:
          console.log(`⚠️ Unknown exchange: ${exchange}`);
      }
    } catch (error) {
      console.error(`❌ Error downloading ${dataType} for ${symbol} on ${exchange}:`, error);
      this.stats.errors++;
    }
  }

  async downloadBinanceData(symbol, dataType, startDate, endDate) {
    const baseUrl = 'https://api.binance.com/api/v3';
    const config = this.config.exchanges.binance;
    
    await this.checkRateLimit('binance');
    
    switch (dataType) {
      case 'klines':
        return await this.downloadBinanceKlines(symbol, startDate, endDate);
      case 'trades':
        return await this.downloadBinanceTrades(symbol, startDate, endDate);
      case 'orderbook':
        return await this.downloadBinanceOrderbook(symbol, startDate, endDate);
      default:
        console.log(`⚠️ Unsupported data type for Binance: ${dataType}`);
    }
  }

  async downloadBinanceKlines(symbol, startDate, endDate) {
    const intervals = this.config.exchanges.binance.klineIntervals;
    
    for (const interval of intervals) {
      console.log(`📊 Downloading ${symbol} ${interval} klines from Binance`);
      
      let currentDate = new Date(startDate);
      const end = new Date(endDate);
      
      while (currentDate < end) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const startTime = currentDate.getTime();
        const endTime = Math.min(nextDate.getTime(), end.getTime());
        
        try {
          await this.checkRateLimit('binance');
          
          const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`;
          const response = await axios.get(url);
          
          if (response.data && response.data.length > 0) {
            await this.saveData('binance', symbol, 'klines', interval, currentDate, response.data);
            console.log(`✅ Saved ${response.data.length} ${interval} klines for ${symbol} on ${currentDate.toISOString().split('T')[0]}`);
            this.stats.success++;
          }
          
          await this.sleep(this.config.general.rateLimitDelay);
        } catch (error) {
          console.error(`❌ Error downloading ${symbol} ${interval} klines for ${currentDate.toISOString().split('T')[0]}:`, error.message);
          this.stats.errors++;
        }
        
        currentDate = nextDate;
      }
    }
  }

  async downloadBinanceTrades(symbol, startDate, endDate) {
    console.log(`💱 Downloading ${symbol} trades from Binance`);
    
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate < end) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const startTime = currentDate.getTime();
      const endTime = Math.min(nextDate.getTime(), end.getTime());
      
      try {
        await this.checkRateLimit('binance');
        
        const url = `https://api.binance.com/api/v3/aggTrades?symbol=${symbol}&startTime=${startTime}&endTime=${endTime}&limit=1000`;
        const response = await axios.get(url);
        
        if (response.data && response.data.length > 0) {
          await this.saveData('binance', symbol, 'trades', 'raw', currentDate, response.data);
          console.log(`✅ Saved ${response.data.length} trades for ${symbol} on ${currentDate.toISOString().split('T')[0]}`);
          this.stats.success++;
        }
        
        await this.sleep(this.config.general.rateLimitDelay);
      } catch (error) {
        console.error(`❌ Error downloading ${symbol} trades for ${currentDate.toISOString().split('T')[0]}:`, error.message);
        this.stats.errors++;
      }
      
      currentDate = nextDate;
    }
  }

  async saveData(exchange, symbol, dataType, interval, date, data) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const dir = path.join(
      this.config.storage.baseDir,
      exchange,
      symbol,
      dataType,
      String(year),
      month
    );
    
    await fs.mkdir(dir, { recursive: true });
    
    let filename = `${exchange}_${symbol}_${dataType}_${interval}_${year}-${month}-${day}.json`;
    let filepath = path.join(dir, filename);
    
    let content = JSON.stringify(data, null, 2);
    
    if (this.config.storage.compression) {
      content = zlib.gzipSync(content);
      filepath += '.gz';
    }
    
    await fs.writeFile(filepath, content);
    
    if (this.config.storage.checksums) {
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      await fs.writeFile(filepath + '.sha256', hash);
    }
    
    this.stats.totalFiles++;
    this.stats.totalSize += content.length;
  }

  async generateReport() {
    const duration = this.stats.endTime - this.stats.startTime;
    const report = {
      summary: {
        duration: `${Math.round(duration / 1000)} seconds`,
        totalFiles: this.stats.totalFiles,
        totalSize: `${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
        successfulDownloads: this.stats.success,
        errors: this.stats.errors,
        successRate: `${((this.stats.success / (this.stats.success + this.stats.errors)) * 100).toFixed(2)}%`
      },
      timestamp: new Date().toISOString(),
      config: this.config
    };
    
    const reportPath = path.join(this.config.logging.logDir, `data-collection-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Data Collection Report:');
    console.log(`⏱️ Duration: ${report.summary.duration}`);
    console.log(`📁 Files created: ${report.summary.totalFiles}`);
    console.log(`💾 Total size: ${report.summary.totalSize}`);
    console.log(`✅ Successful downloads: ${report.summary.successfulDownloads}`);
    console.log(`❌ Errors: ${report.summary.errors}`);
    console.log(`📈 Success rate: ${report.summary.successRate}`);
    console.log(`📄 Report saved to: ${reportPath}`);
  }

  async run() {
    if (!await this.init()) {
      console.error('❌ Failed to initialize, exiting...');
      return;
    }

    this.stats.startTime = Date.now();
    console.log('🚀 Starting historical data collection...');
    
    const startDate = new Date(this.config.general.startDate);
    const endDate = new Date(this.config.general.endDate);
    
    for (const [exchange, config] of Object.entries(this.config.exchanges)) {
      if (!config.enabled) continue;
      
      console.log(`\n🏢 Processing exchange: ${exchange.toUpperCase()}`);
      
      for (const symbol of config.symbols) {
        for (const dataType of config.dataTypes) {
          await this.downloadData(exchange, symbol, dataType, startDate, endDate);
        }
      }
    }
    
    this.stats.endTime = Date.now();
    await this.generateReport();
    console.log('\n🎉 Historical data collection completed!');
  }
}

// Export for use as module
module.exports = DataCollector;

// Run if called directly
if (require.main === module) {
  const collector = new DataCollector();
  collector.run().catch(console.error);
} 
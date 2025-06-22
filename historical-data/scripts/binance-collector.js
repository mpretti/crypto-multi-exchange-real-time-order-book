const DataCollector = require('./data-collector');
const axios = require('axios');

class BinanceCollector extends DataCollector {
  constructor() {
    super();
    this.baseUrl = 'https://api.binance.com/api/v3';
    this.futuresUrl = 'https://fapi.binance.com/fapi/v1';
  }

  async downloadBinanceKlines(symbol, startDate, endDate, interval = '1m', market = 'spot') {
    console.log(`📊 Downloading ${symbol} ${interval} klines from Binance ${market}`);
    
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate < end) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const startTime = currentDate.getTime();
      const endTime = Math.min(nextDate.getTime(), end.getTime());
      
      try {
        await this.checkRateLimit('binance');
        
        const baseUrl = market === 'futures' ? this.futuresUrl : this.baseUrl;
        const url = `${baseUrl}/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1500`;
        
        const response = await axios.get(url);
        
        if (response.data && response.data.length > 0) {
          const transformedData = response.data.map(kline => ({
            openTime: parseInt(kline[0]),
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5]),
            closeTime: parseInt(kline[6]),
            quoteVolume: parseFloat(kline[7]),
            trades: parseInt(kline[8]),
            buyBaseVolume: parseFloat(kline[9]),
            buyQuoteVolume: parseFloat(kline[10])
          }));
          
          await this.saveData('binance', symbol, `klines-${market}`, interval, currentDate, transformedData);
          console.log(`✅ Saved ${transformedData.length} ${interval} ${market} klines for ${symbol} on ${currentDate.toISOString().split('T')[0]}`);
          this.stats.success++;
        }
        
        await this.sleep(100);
      } catch (error) {
        console.error(`❌ Error downloading ${symbol} ${interval} ${market} klines for ${currentDate.toISOString().split('T')[0]}:`, error.message);
        this.stats.errors++;
        
        if (error.response?.status === 429) {
          console.log('⏳ Rate limited, waiting 60 seconds...');
          await this.sleep(60000);
        }
      }
      
      currentDate = nextDate;
    }
  }

  async downloadBinanceTrades(symbol, startDate, endDate, market = 'spot') {
    console.log(`💱 Downloading ${symbol} trades from Binance ${market}`);
    
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate < end) {
      const nextDate = new Date(currentDate);
      nextDate.setHours(nextDate.getHours() + 1); // Smaller chunks for trades
      
      const startTime = currentDate.getTime();
      const endTime = Math.min(nextDate.getTime(), end.getTime());
      
      try {
        await this.checkRateLimit('binance');
        
        const baseUrl = market === 'futures' ? this.futuresUrl : this.baseUrl;
        const url = `${baseUrl}/aggTrades?symbol=${symbol}&startTime=${startTime}&endTime=${endTime}&limit=1000`;
        
        const response = await axios.get(url);
        
        if (response.data && response.data.length > 0) {
          const transformedData = response.data.map(trade => ({
            id: trade.a || trade.id,
            price: parseFloat(trade.p),
            quantity: parseFloat(trade.q),
            firstTradeId: trade.f,
            lastTradeId: trade.l,
            timestamp: parseInt(trade.T),
            isBuyerMaker: trade.m,
            isBestMatch: trade.M || true
          }));
          
          await this.saveData('binance', symbol, `trades-${market}`, 'raw', currentDate, transformedData);
          console.log(`✅ Saved ${transformedData.length} ${market} trades for ${symbol} on ${currentDate.toISOString()}`);
          this.stats.success++;
        }
        
        await this.sleep(100);
      } catch (error) {
        console.error(`❌ Error downloading ${symbol} ${market} trades for ${currentDate.toISOString()}:`, error.message);
        this.stats.errors++;
        
        if (error.response?.status === 429) {
          console.log('⏳ Rate limited, waiting 60 seconds...');
          await this.sleep(60000);
        }
      }
      
      currentDate = nextDate;
    }
  }

  async downloadFundingRates(symbol, startDate, endDate) {
    console.log(`💰 Downloading ${symbol} funding rates from Binance Futures`);
    
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate < end) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 30); // Monthly chunks
      
      const startTime = currentDate.getTime();
      const endTime = Math.min(nextDate.getTime(), end.getTime());
      
      try {
        await this.checkRateLimit('binance');
        
        const url = `${this.futuresUrl}/fundingRate?symbol=${symbol}&startTime=${startTime}&endTime=${endTime}&limit=1000`;
        const response = await axios.get(url);
        
        if (response.data && response.data.length > 0) {
          const transformedData = response.data.map(rate => ({
            symbol: rate.symbol,
            fundingTime: parseInt(rate.fundingTime),
            fundingRate: parseFloat(rate.fundingRate),
            markPrice: parseFloat(rate.markPrice)
          }));
          
          await this.saveData('binance', symbol, 'funding-futures', 'raw', currentDate, transformedData);
          console.log(`✅ Saved ${transformedData.length} funding rates for ${symbol} on ${currentDate.toISOString().split('T')[0]}`);
          this.stats.success++;
        }
        
        await this.sleep(100);
      } catch (error) {
        console.error(`❌ Error downloading ${symbol} funding rates for ${currentDate.toISOString().split('T')[0]}:`, error.message);
        this.stats.errors++;
      }
      
      currentDate = nextDate;
    }
  }

  async run() {
    if (!await this.init()) {
      console.error('❌ Failed to initialize Binance collector');
      return;
    }

    this.stats.startTime = Date.now();
    console.log('🚀 Starting Binance historical data collection...');
    
    const config = this.config.exchanges.binance;
    if (!config.enabled) {
      console.log('⏭️ Binance collection disabled in config');
      return;
    }

    const startDate = new Date(this.config.general.startDate);
    const endDate = new Date(this.config.general.endDate);
    
    for (const symbol of config.symbols) {
      console.log(`\n🪙 Processing symbol: ${symbol}`);
      
      if (config.dataTypes.includes('klines')) {
        for (const interval of config.klineIntervals) {
          if (config.spot) {
            await this.downloadBinanceKlines(symbol, startDate, endDate, interval, 'spot');
          }
          if (config.futures) {
            await this.downloadBinanceKlines(symbol, startDate, endDate, interval, 'futures');
          }
        }
      }
      
      if (config.dataTypes.includes('trades')) {
        if (config.spot) {
          await this.downloadBinanceTrades(symbol, startDate, endDate, 'spot');
        }
        if (config.futures) {
          await this.downloadBinanceTrades(symbol, startDate, endDate, 'futures');
        }
      }
      
      if (config.dataTypes.includes('funding') && config.futures) {
        await this.downloadFundingRates(symbol, startDate, endDate);
      }
    }
    
    this.stats.endTime = Date.now();
    await this.generateReport();
    console.log('\n🎉 Binance data collection completed!');
  }

  async generateReport() {
    const duration = this.stats.endTime - this.stats.startTime;
    const report = {
      exchange: 'binance',
      summary: {
        duration: `${Math.round(duration / 1000)} seconds`,
        totalFiles: this.stats.totalFiles,
        totalSize: `${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
        successfulDownloads: this.stats.success,
        errors: this.stats.errors,
        successRate: `${((this.stats.success / (this.stats.success + this.stats.errors)) * 100).toFixed(2)}%`
      },
      timestamp: new Date().toISOString()
    };
    
    const reportPath = path.join(this.config.logging.logDir, `binance-collection-report-${Date.now()}.json`);
    await require('fs').promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Binance Collection Report:');
    console.log(`⏱️ Duration: ${report.summary.duration}`);
    console.log(`📁 Files created: ${report.summary.totalFiles}`);
    console.log(`💾 Total size: ${report.summary.totalSize}`);
    console.log(`✅ Successful downloads: ${report.summary.successfulDownloads}`);
    console.log(`❌ Errors: ${report.summary.errors}`);
    console.log(`📈 Success rate: ${report.summary.successRate}`);
  }
}

module.exports = BinanceCollector;

if (require.main === module) {
  const collector = new BinanceCollector();
  collector.run().catch(console.error);
} 
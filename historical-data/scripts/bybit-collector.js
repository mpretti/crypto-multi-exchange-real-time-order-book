const DataCollector = require('./data-collector');
const axios = require('axios');

class BybitCollector extends DataCollector {
  constructor() {
    super();
    this.baseUrl = 'https://api.bybit.com';
  }

  async downloadBybitKlines(symbol, startDate, endDate, interval = '1', category = 'spot') {
    console.log(`📊 Downloading ${symbol} ${interval}min klines from Bybit ${category}`);
    
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate < end) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const start = Math.floor(currentDate.getTime());
      const endTime = Math.min(nextDate.getTime(), end.getTime());
      
      try {
        await this.checkRateLimit('bybit');
        
        const url = `${this.baseUrl}/v5/market/kline?category=${category}&symbol=${symbol}&interval=${interval}&start=${start}&end=${endTime}&limit=1000`;
        
        const response = await axios.get(url);
        
        if (response.data?.result?.list && response.data.result.list.length > 0) {
          const transformedData = response.data.result.list.map(kline => ({
            openTime: parseInt(kline[0]),
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5]),
            turnover: parseFloat(kline[6])
          }));
          
          await this.saveData('bybit', symbol, `klines-${category}`, interval, currentDate, transformedData);
          console.log(`✅ Saved ${transformedData.length} ${interval}min ${category} klines for ${symbol} on ${currentDate.toISOString().split('T')[0]}`);
          this.stats.success++;
        }
        
        await this.sleep(200);
      } catch (error) {
        console.error(`❌ Error downloading ${symbol} ${interval}min ${category} klines for ${currentDate.toISOString().split('T')[0]}:`, error.message);
        this.stats.errors++;
        
        if (error.response?.status === 429) {
          console.log('⏳ Rate limited, waiting 60 seconds...');
          await this.sleep(60000);
        }
      }
      
      currentDate = nextDate;
    }
  }

  async run() {
    if (!await this.init()) {
      console.error('❌ Failed to initialize Bybit collector');
      return;
    }

    this.stats.startTime = Date.now();
    console.log('🚀 Starting Bybit historical data collection...');
    
    const config = this.config.exchanges.bybit;
    if (!config.enabled) {
      console.log('⏭️ Bybit collection disabled in config');
      return;
    }

    const startDate = new Date(this.config.general.startDate);
    const endDate = new Date(this.config.general.endDate);
    
    for (const symbol of config.symbols) {
      console.log(`\n🪙 Processing symbol: ${symbol}`);
      
      if (config.dataTypes.includes('klines')) {
        for (const interval of config.klineIntervals) {
          if (config.spot) {
            await this.downloadBybitKlines(symbol, startDate, endDate, interval, 'spot');
          }
          if (config.futures) {
            await this.downloadBybitKlines(symbol, startDate, endDate, interval, 'linear');
          }
        }
      }
    }
    
    this.stats.endTime = Date.now();
    console.log('\n🎉 Bybit data collection completed!');
  }
}

module.exports = BybitCollector;

if (require.main === module) {
  const collector = new BybitCollector();
  collector.run().catch(console.error);
} 
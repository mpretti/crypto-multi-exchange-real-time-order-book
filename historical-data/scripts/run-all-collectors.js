#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Import all collectors
const BinanceCollector = require('./binance-collector');
const BybitCollector = require('./bybit-collector');

class MasterCollector {
  constructor() {
    this.collectors = new Map();
    this.globalStats = {
      totalExchanges: 0,
      completedExchanges: 0,
      failedExchanges: 0,
      startTime: null,
      endTime: null,
      totalFiles: 0,
      totalSize: 0
    };
  }

  async init() {
    console.log('🚀 Initializing Master Data Collector...');
    
    // Register available collectors
    this.collectors.set('binance', BinanceCollector);
    this.collectors.set('bybit', BybitCollector);
    
    // Load configuration
    try {
      const configPath = path.join(__dirname, '../config/data-collection-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(configData);
      
      console.log('✅ Master Collector initialized successfully');
      console.log(`📊 Found ${this.collectors.size} available collectors`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Master Collector:', error);
      return false;
    }
  }

  async runCollector(exchangeName) {
    console.log(`\n🏢 Starting ${exchangeName.toUpperCase()} data collection...`);
    
    const CollectorClass = this.collectors.get(exchangeName);
    if (!CollectorClass) {
      console.error(`❌ No collector found for ${exchangeName}`);
      this.globalStats.failedExchanges++;
      return false;
    }

    const exchangeConfig = this.config.exchanges[exchangeName];
    if (!exchangeConfig || !exchangeConfig.enabled) {
      console.log(`⏭️ ${exchangeName} is disabled in configuration`);
      return true;
    }

    try {
      const collector = new CollectorClass();
      await collector.run();
      
      // Aggregate stats
      this.globalStats.totalFiles += collector.stats.totalFiles;
      this.globalStats.totalSize += collector.stats.totalSize;
      this.globalStats.completedExchanges++;
      
      console.log(`✅ ${exchangeName.toUpperCase()} collection completed successfully`);
      return true;
    } catch (error) {
      console.error(`❌ ${exchangeName.toUpperCase()} collection failed:`, error);
      this.globalStats.failedExchanges++;
      return false;
    }
  }

  async runAll() {
    if (!await this.init()) {
      console.error('❌ Failed to initialize, exiting...');
      return;
    }

    this.globalStats.startTime = Date.now();
    this.globalStats.totalExchanges = Object.keys(this.config.exchanges).filter(
      exchange => this.config.exchanges[exchange].enabled
    ).length;

    console.log(`\n🎯 Starting data collection for ${this.globalStats.totalExchanges} exchanges`);
    console.log(`📅 Date range: ${this.config.general.startDate} to ${this.config.general.endDate}`);
    console.log(`🪙 Base pairs: ${this.config.general.basePairs.join(', ')}`);
    
    // Run collectors sequentially to avoid overwhelming APIs
    for (const [exchangeName, exchangeConfig] of Object.entries(this.config.exchanges)) {
      if (exchangeConfig.enabled && this.collectors.has(exchangeName)) {
        await this.runCollector(exchangeName);
        
        // Wait between exchanges to be respectful
        if (this.globalStats.completedExchanges + this.globalStats.failedExchanges < this.globalStats.totalExchanges) {
          console.log('⏳ Waiting 30 seconds before next exchange...');
          await this.sleep(30000);
        }
      }
    }

    this.globalStats.endTime = Date.now();
    await this.generateMasterReport();
  }

  async runSpecific(exchangeNames) {
    if (!await this.init()) {
      console.error('❌ Failed to initialize, exiting...');
      return;
    }

    this.globalStats.startTime = Date.now();
    
    const validExchanges = exchangeNames.filter(name => {
      if (!this.collectors.has(name)) {
        console.error(`❌ Unknown exchange: ${name}`);
        return false;
      }
      if (!this.config.exchanges[name]?.enabled) {
        console.log(`⏭️ ${name} is disabled in configuration`);
        return false;
      }
      return true;
    });

    this.globalStats.totalExchanges = validExchanges.length;

    console.log(`\n🎯 Starting data collection for specific exchanges: ${validExchanges.join(', ')}`);
    
    for (const exchangeName of validExchanges) {
      await this.runCollector(exchangeName);
      
      if (validExchanges.indexOf(exchangeName) < validExchanges.length - 1) {
        console.log('⏳ Waiting 30 seconds before next exchange...');
        await this.sleep(30000);
      }
    }

    this.globalStats.endTime = Date.now();
    await this.generateMasterReport();
  }

  async generateMasterReport() {
    const duration = this.globalStats.endTime - this.globalStats.startTime;
    const report = {
      masterReport: true,
      summary: {
        duration: `${Math.round(duration / 1000)} seconds`,
        totalExchanges: this.globalStats.totalExchanges,
        completedExchanges: this.globalStats.completedExchanges,
        failedExchanges: this.globalStats.failedExchanges,
        successRate: `${((this.globalStats.completedExchanges / this.globalStats.totalExchanges) * 100).toFixed(2)}%`,
        totalFiles: this.globalStats.totalFiles,
        totalSize: `${(this.globalStats.totalSize / 1024 / 1024).toFixed(2)} MB`,
        avgSizePerExchange: `${(this.globalStats.totalSize / this.globalStats.completedExchanges / 1024 / 1024).toFixed(2)} MB`
      },
      timestamp: new Date().toISOString(),
      dateRange: {
        start: this.config.general.startDate,
        end: this.config.general.endDate
      }
    };
    
    const reportPath = path.join(__dirname, '../logs', `master-collection-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 MASTER DATA COLLECTION REPORT:');
    console.log('═'.repeat(50));
    console.log(`⏱️ Total Duration: ${report.summary.duration}`);
    console.log(`🏢 Exchanges Processed: ${report.summary.completedExchanges}/${report.summary.totalExchanges}`);
    console.log(`✅ Success Rate: ${report.summary.successRate}`);
    console.log(`📁 Total Files Created: ${report.summary.totalFiles}`);
    console.log(`💾 Total Data Size: ${report.summary.totalSize}`);
    console.log(`📈 Average Size per Exchange: ${report.summary.avgSizePerExchange}`);
    console.log(`📄 Full Report: ${reportPath}`);
    console.log('═'.repeat(50));
    
    if (this.globalStats.failedExchanges > 0) {
      console.log(`⚠️ ${this.globalStats.failedExchanges} exchange(s) failed. Check individual logs for details.`);
    }
    
    console.log('\n🎉 HISTORICAL DATA COLLECTION COMPLETED! 🎉');
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printUsage() {
    console.log('\n📖 Usage:');
    console.log('  node run-all-collectors.js                    # Run all enabled exchanges');
    console.log('  node run-all-collectors.js binance            # Run specific exchange');
    console.log('  node run-all-collectors.js binance bybit      # Run multiple specific exchanges');
    console.log('\n🔧 Available exchanges: binance, bybit');
    console.log('\n💡 Configure exchanges in ../config/data-collection-config.json');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const collector = new MasterCollector();

  if (args.length === 0) {
    // Run all exchanges
    await collector.runAll();
  } else if (args.includes('--help') || args.includes('-h')) {
    collector.printUsage();
  } else {
    // Run specific exchanges
    await collector.runSpecific(args);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MasterCollector; 
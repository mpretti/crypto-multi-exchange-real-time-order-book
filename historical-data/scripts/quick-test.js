#!/usr/bin/env node

const DataCollector = require('./data-collector');
const axios = require('axios');

class QuickTester extends DataCollector {
  constructor() {
    super();
  }

  async testBinanceConnection() {
    console.log('🧪 Testing Binance API connection...');
    
    try {
      const url = 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=5';
      const response = await axios.get(url);
      
      if (response.data && response.data.length > 0) {
        console.log('✅ Binance API connection successful');
        return true;
      } else {
        console.log('❌ No data returned from Binance API');
        return false;
      }
    } catch (error) {
      console.error('❌ Binance API test failed:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Quick Test Suite');
    console.log('═'.repeat(50));

    const tests = [
      { name: 'Binance API Connection', fn: () => this.testBinanceConnection() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      console.log(`\n🧪 Running: ${test.name}`);
      try {
        const result = await test.fn();
        if (result) {
          passed++;
          console.log(`✅ ${test.name}: PASSED`);
        } else {
          failed++;
          console.log(`❌ ${test.name}: FAILED`);
        }
      } catch (error) {
        failed++;
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      }
    }

    console.log('\n📊 TEST RESULTS:');
    console.log(`✅ Passed: ${passed}, ❌ Failed: ${failed}`);

    return failed === 0;
  }
}

if (require.main === module) {
  const tester = new QuickTester();
  tester.runAllTests().catch(console.error);
}

module.exports = QuickTester;

#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');

class DataAnalyzer {
  constructor() {
    this.config = null;
    this.analysis = {
      exchanges: {},
      totalFiles: 0,
      totalSize: 0,
      dateRange: { min: null, max: null },
      symbols: new Set(),
      dataTypes: new Set(),
      issues: []
    };
  }

  async init() {
    try {
      const configPath = path.join(__dirname, '../config/data-collection-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(configData);
      console.log('✅ Data Analyzer initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      return false;
    }
  }

  async analyzeDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.analyzeDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.json.gz'))) {
          await this.analyzeFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`❌ Error analyzing directory ${dirPath}:`, error.message);
    }
  }

  async analyzeFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      this.analysis.totalFiles++;
      this.analysis.totalSize += stats.size;

      // Parse file path to extract metadata
      const relativePath = path.relative(path.join(__dirname, '../data'), filePath);
      const pathParts = relativePath.split(path.sep);
      
      if (pathParts.length >= 4) {
        const [exchange, symbol, dataType] = pathParts;
        
        // Initialize exchange analysis if not exists
        if (!this.analysis.exchanges[exchange]) {
          this.analysis.exchanges[exchange] = {
            files: 0,
            size: 0,
            symbols: new Set(),
            dataTypes: new Set(),
            dateRange: { min: null, max: null },
            issues: []
          };
        }

        const exchangeAnalysis = this.analysis.exchanges[exchange];
        exchangeAnalysis.files++;
        exchangeAnalysis.size += stats.size;
        exchangeAnalysis.symbols.add(symbol);
        exchangeAnalysis.dataTypes.add(dataType);
        
        this.analysis.symbols.add(symbol);
        this.analysis.dataTypes.add(dataType);

        // Extract date from filename
        const filename = path.basename(filePath);
        const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]);
          
          // Update global date range
          if (!this.analysis.dateRange.min || fileDate < this.analysis.dateRange.min) {
            this.analysis.dateRange.min = fileDate;
          }
          if (!this.analysis.dateRange.max || fileDate > this.analysis.dateRange.max) {
            this.analysis.dateRange.max = fileDate;
          }
          
          // Update exchange date range
          if (!exchangeAnalysis.dateRange.min || fileDate < exchangeAnalysis.dateRange.min) {
            exchangeAnalysis.dateRange.min = fileDate;
          }
          if (!exchangeAnalysis.dateRange.max || fileDate > exchangeAnalysis.dateRange.max) {
            exchangeAnalysis.dateRange.max = fileDate;
          }
        }

        // Check file integrity
        await this.checkFileIntegrity(filePath, exchange, symbol, dataType);
      }
    } catch (error) {
      console.error(`❌ Error analyzing file ${filePath}:`, error.message);
      this.analysis.issues.push({
        type: 'file_error',
        file: filePath,
        error: error.message
      });
    }
  }

  async checkFileIntegrity(filePath, exchange, symbol, dataType) {
    try {
      let content;
      
      if (filePath.endsWith('.gz')) {
        const compressed = await fs.readFile(filePath);
        content = zlib.gunzipSync(compressed).toString();
      } else {
        content = await fs.readFile(filePath, 'utf8');
      }

      const data = JSON.parse(content);
      
      // Basic validation
      if (!Array.isArray(data)) {
        this.analysis.exchanges[exchange].issues.push({
          type: 'invalid_format',
          file: path.basename(filePath),
          issue: 'Data is not an array'
        });
        return;
      }

      if (data.length === 0) {
        this.analysis.exchanges[exchange].issues.push({
          type: 'empty_file',
          file: path.basename(filePath),
          issue: 'File contains no data'
        });
        return;
      }

      // Data type specific validation
      if (dataType.includes('klines')) {
        this.validateKlineData(data, filePath, exchange);
      } else if (dataType.includes('trades')) {
        this.validateTradeData(data, filePath, exchange);
      }

    } catch (error) {
      this.analysis.exchanges[exchange].issues.push({
        type: 'parse_error',
        file: path.basename(filePath),
        error: error.message
      });
    }
  }

  validateKlineData(data, filePath, exchange) {
    const sample = data[0];
    const requiredFields = ['openTime', 'open', 'high', 'low', 'close', 'volume'];
    
    for (const field of requiredFields) {
      if (!(field in sample)) {
        this.analysis.exchanges[exchange].issues.push({
          type: 'missing_field',
          file: path.basename(filePath),
          field: field,
          dataType: 'klines'
        });
      }
    }

    // Check for data consistency
    let timeGaps = 0;
    for (let i = 1; i < Math.min(data.length, 100); i++) {
      const prevTime = data[i-1].openTime;
      const currTime = data[i].openTime;
      
      if (currTime <= prevTime) {
        timeGaps++;
      }
    }

    if (timeGaps > 0) {
      this.analysis.exchanges[exchange].issues.push({
        type: 'time_consistency',
        file: path.basename(filePath),
        issue: `Found ${timeGaps} time gaps or non-sequential data`
      });
    }
  }

  validateTradeData(data, filePath, exchange) {
    const sample = data[0];
    const requiredFields = ['price', 'quantity', 'timestamp'];
    
    for (const field of requiredFields) {
      if (!(field in sample)) {
        this.analysis.exchanges[exchange].issues.push({
          type: 'missing_field',
          file: path.basename(filePath),
          field: field,
          dataType: 'trades'
        });
      }
    }
  }

  async generateGapReport() {
    console.log('\n📊 DATA GAP ANALYSIS:');
    console.log('═'.repeat(60));

    const expectedStart = new Date(this.config.general.startDate);
    const expectedEnd = new Date(this.config.general.endDate);

    for (const [exchange, analysis] of Object.entries(this.analysis.exchanges)) {
      console.log(`\n🏢 ${exchange.toUpperCase()}:`);
      
      if (analysis.dateRange.min && analysis.dateRange.max) {
        const actualStart = analysis.dateRange.min;
        const actualEnd = analysis.dateRange.max;
        
        console.log(`  📅 Expected: ${expectedStart.toISOString().split('T')[0]} to ${expectedEnd.toISOString().split('T')[0]}`);
        console.log(`  📅 Actual:   ${actualStart.toISOString().split('T')[0]} to ${actualEnd.toISOString().split('T')[0]}`);
        
        if (actualStart > expectedStart) {
          const daysMissing = Math.floor((actualStart - expectedStart) / (1000 * 60 * 60 * 24));
          console.log(`  ⚠️ Missing ${daysMissing} days at the beginning`);
        }
        
        if (actualEnd < expectedEnd) {
          const daysMissing = Math.floor((expectedEnd - actualEnd) / (1000 * 60 * 60 * 24));
          console.log(`  ⚠️ Missing ${daysMissing} days at the end`);
        }
      } else {
        console.log(`  ❌ No valid date range found`);
      }
    }
  }

  async run() {
    if (!await this.init()) return;

    console.log('🔍 Starting data analysis...');
    
    const dataDir = path.join(__dirname, '../data');
    await this.analyzeDirectory(dataDir);

    // Convert Sets to Arrays for JSON serialization
    for (const exchange of Object.keys(this.analysis.exchanges)) {
      this.analysis.exchanges[exchange].symbols = Array.from(this.analysis.exchanges[exchange].symbols);
      this.analysis.exchanges[exchange].dataTypes = Array.from(this.analysis.exchanges[exchange].dataTypes);
    }
    this.analysis.symbols = Array.from(this.analysis.symbols);
    this.analysis.dataTypes = Array.from(this.analysis.dataTypes);

    // Generate reports
    await this.printSummary();
    await this.generateGapReport();
    await this.saveAnalysisReport();
  }

  async printSummary() {
    console.log('\n📊 DATA COLLECTION SUMMARY:');
    console.log('═'.repeat(60));
    console.log(`📁 Total Files: ${this.analysis.totalFiles.toLocaleString()}`);
    console.log(`💾 Total Size: ${(this.analysis.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`🏢 Exchanges: ${Object.keys(this.analysis.exchanges).length}`);
    console.log(`🪙 Symbols: ${this.analysis.symbols.length}`);
    console.log(`📊 Data Types: ${this.analysis.dataTypes.join(', ')}`);
    
    if (this.analysis.dateRange.min && this.analysis.dateRange.max) {
      console.log(`📅 Date Range: ${this.analysis.dateRange.min.toISOString().split('T')[0]} to ${this.analysis.dateRange.max.toISOString().split('T')[0]}`);
    }

    console.log('\n🏢 EXCHANGE BREAKDOWN:');
    for (const [exchange, analysis] of Object.entries(this.analysis.exchanges)) {
      console.log(`\n  ${exchange.toUpperCase()}:`);
      console.log(`    📁 Files: ${analysis.files.toLocaleString()}`);
      console.log(`    💾 Size: ${(analysis.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`    🪙 Symbols: ${analysis.symbols.length} (${analysis.symbols.slice(0, 3).join(', ')}${analysis.symbols.length > 3 ? '...' : ''})`);
      console.log(`    📊 Data Types: ${analysis.dataTypes.join(', ')}`);
      
      if (analysis.issues.length > 0) {
        console.log(`    ⚠️ Issues: ${analysis.issues.length}`);
      } else {
        console.log(`    ✅ No issues detected`);
      }
    }
  }

  async saveAnalysisReport() {
    const reportPath = path.join(__dirname, '../logs', `data-analysis-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(this.analysis, null, 2));
    console.log(`\n📄 Detailed analysis saved to: ${reportPath}`);
  }
}

if (require.main === module) {
  const analyzer = new DataAnalyzer();
  analyzer.run().catch(console.error);
}

module.exports = DataAnalyzer; 
#!/usr/bin/env node

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

const DataAnalyzer = require('../scripts/data-analyzer');
const MasterCollector = require('../scripts/run-all-collectors');

class DataCollectionController {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);
    this.port = process.env.PORT || 3001;
    
    this.activeCollections = new Map();
    this.systemStats = {
      totalFiles: 0,
      totalSize: 0,
      activeCollectors: 0,
      completedCollections: 0,
      errors: 0,
      uptime: Date.now()
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.startPeriodicUpdates();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.use('/static', express.static(path.join(__dirname, 'static')));
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));
  }

  setupRoutes() {
    // Main dashboard
    this.app.get('/', async (req, res) => {
      try {
        const stats = await this.getSystemStats();
        const config = await this.getConfig();
        res.render('dashboard', { stats, config, activeCollections: Array.from(this.activeCollections.entries()) });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API Routes
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.getSystemStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/config', async (req, res) => {
      try {
        const config = await this.getConfig();
        res.json(config);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/config', async (req, res) => {
      try {
        await this.updateConfig(req.body);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Collection Control
    this.app.post('/api/start/:exchange?', async (req, res) => {
      try {
        const exchange = req.params.exchange;
        const collectionId = await this.startCollection(exchange);
        res.json({ success: true, collectionId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/stop/:collectionId', async (req, res) => {
      try {
        const collectionId = req.params.collectionId;
        await this.stopCollection(collectionId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Data Analysis
    this.app.get('/api/analyze', async (req, res) => {
      try {
        const analysis = await this.runDataAnalysis();
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Logs
    this.app.get('/api/logs', async (req, res) => {
      try {
        const logs = await this.getRecentLogs();
        res.json(logs);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // File browser
    this.app.get('/api/files/:exchange?/:symbol?', async (req, res) => {
      try {
        const files = await this.getFiles(req.params.exchange, req.params.symbol);
        res.json(files);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Custom collection with date range
    this.app.post('/api/start/custom', async (req, res) => {
      try {
        const { exchange, startDate, endDate } = req.body;
        const collectionId = await this.startCustomCollection(exchange, startDate, endDate);
        res.json({ success: true, collectionId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Gap filling
    this.app.post('/api/fill-gaps', async (req, res) => {
      try {
        const collectionId = await this.fillAllGaps();
        res.json({ success: true, collectionId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Fill specific gap
    this.app.post('/api/fill-gap', async (req, res) => {
      try {
        const { exchange, startDate, endDate } = req.body;
        const collectionId = await this.fillSpecificGap(exchange, startDate, endDate);
        res.json({ success: true, collectionId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Manual dashboard refresh
    this.app.post('/api/refresh', async (req, res) => {
      try {
        const success = await this.triggerDashboardRefresh('Manual refresh requested');
        res.json({ success });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected to monitoring dashboard');
      
      // Send initial stats
      this.getSystemStats().then(stats => {
        socket.emit('stats_update', stats);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected from monitoring dashboard');
      });
    });
  }

  async getConfig() {
    try {
      const configPath = path.join(__dirname, '../config/data-collection-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      throw new Error('Failed to load configuration');
    }
  }

  async updateConfig(newConfig) {
    try {
      const configPath = path.join(__dirname, '../config/data-collection-config.json');
      await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
      this.io.emit('config_updated', newConfig);
    } catch (error) {
      throw new Error('Failed to update configuration');
    }
  }

  async getSystemStats() {
    try {
      const dataDir = path.join(__dirname, '../data');
      const logsDir = path.join(__dirname, '../logs');
      
      // Calculate data directory stats
      let totalFiles = 0;
      let totalSize = 0;
      
      try {
        const stats = await this.calculateDirectoryStats(dataDir);
        totalFiles = stats.files;
        totalSize = stats.size;
      } catch (error) {
        // Directory might not exist yet
      }

      // Get recent collection reports
      let recentReports = [];
      try {
        const logFiles = await fs.readdir(logsDir);
        const reportFiles = logFiles.filter(f => f.includes('collection-report')).slice(-5);
        
        for (const file of reportFiles) {
          const reportPath = path.join(logsDir, file);
          const reportData = await fs.readFile(reportPath, 'utf8');
          recentReports.push(JSON.parse(reportData));
        }
      } catch (error) {
        // Logs directory might not exist yet
      }

      return {
        totalFiles,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        activeCollectors: this.activeCollections.size,
        completedCollections: this.systemStats.completedCollections,
        errors: this.systemStats.errors,
        uptime: Date.now() - this.systemStats.uptime,
        uptimeFormatted: this.formatUptime(Date.now() - this.systemStats.uptime),
        recentReports,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Failed to get system stats');
    }
  }

  async calculateDirectoryStats(dirPath) {
    let totalFiles = 0;
    let totalSize = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const subStats = await this.calculateDirectoryStats(fullPath);
          totalFiles += subStats.files;
          totalSize += subStats.size;
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          totalFiles++;
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Handle permission errors or missing directories
    }

    return { files: totalFiles, size: totalSize };
  }

  async startCollection(exchange = null) {
    const collectionId = `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const scriptPath = path.join(__dirname, '../scripts/run-all-collectors.js');
      const args = exchange ? [exchange] : [];
      
      const process = spawn('node', [scriptPath, ...args], {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const collection = {
        id: collectionId,
        exchange: exchange || 'all',
        startTime: Date.now(),
        process,
        status: 'running',
        logs: []
      };

      // Capture output
      process.stdout.on('data', (data) => {
        const log = data.toString();
        collection.logs.push({ timestamp: Date.now(), type: 'stdout', message: log });
        this.io.emit('collection_log', { collectionId, log: { timestamp: Date.now(), type: 'stdout', message: log } });
      });

      process.stderr.on('data', (data) => {
        const log = data.toString();
        collection.logs.push({ timestamp: Date.now(), type: 'stderr', message: log });
        this.io.emit('collection_log', { collectionId, log: { timestamp: Date.now(), type: 'stderr', message: log } });
      });

      process.on('close', (code) => {
        collection.status = code === 0 ? 'completed' : 'failed';
        collection.endTime = Date.now();
        
        if (code === 0) {
          this.systemStats.completedCollections++;
        } else {
          this.systemStats.errors++;
        }
        
        this.io.emit('collection_finished', { collectionId, status: collection.status, code });
        
        // Remove from active collections after 5 minutes
        setTimeout(() => {
          this.activeCollections.delete(collectionId);
        }, 5 * 60 * 1000);
      });

      this.activeCollections.set(collectionId, collection);
      this.io.emit('collection_started', { collectionId, exchange: collection.exchange });
      
      return collectionId;
    } catch (error) {
      throw new Error(`Failed to start collection: ${error.message}`);
    }
  }

  async stopCollection(collectionId) {
    const collection = this.activeCollections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    if (collection.process && collection.status === 'running') {
      collection.process.kill('SIGTERM');
      collection.status = 'stopped';
      collection.endTime = Date.now();
      
      this.io.emit('collection_stopped', { collectionId });
    }
  }

  async startCustomCollection(exchange, startDate, endDate) {
    try {
      // Update config temporarily for this collection
      const config = await this.getConfig();
      const originalConfig = JSON.parse(JSON.stringify(config)); // Deep copy
      
      // Modify config for custom date range
      config.dateRange.startDate = startDate;
      config.dateRange.endDate = endDate;
      
      // Save temporary config
      await this.updateConfig(config);
      
      // Start collection for specific exchange
      const collectionId = await this.startCollection(exchange);
      
      // Restore original config after a delay
      setTimeout(async () => {
        try {
          await this.updateConfig(originalConfig);
        } catch (error) {
          console.error('Failed to restore original config:', error);
        }
      }, 5000);
      
      return collectionId;
    } catch (error) {
      throw new Error(`Failed to start custom collection: ${error.message}`);
    }
  }

  async fillAllGaps() {
    try {
      // Run analysis first to identify gaps
      const analysis = await this.runDataAnalysis();
      
      // Start collection to fill all identified gaps
      const collectionId = await this.startCollection();
      
      return collectionId;
    } catch (error) {
      throw new Error(`Failed to start gap filling: ${error.message}`);
    }
  }

  async fillSpecificGap(exchange, startDate, endDate) {
    try {
      return await this.startCustomCollection(exchange, startDate, endDate);
    } catch (error) {
      throw new Error(`Failed to fill specific gap: ${error.message}`);
    }
  }

  async runDataAnalysis() {
    try {
      // Enhanced data analysis with gap detection
      const dataDir = path.join(__dirname, '../data');
      const analysis = {
        exchanges: {},
        gaps: { completeness: {}, missing: {} },
        dateRanges: {},
        summary: {}
      };

      // Analyze each exchange
      const exchanges = ['binance', 'bybit', 'okx', 'kraken', 'coinbase', 'gemini', 'bitget', 'mexc'];
      
      for (const exchange of exchanges) {
        const exchangeDir = path.join(dataDir, exchange);
        const exchangeData = await this.analyzeExchange(exchangeDir, exchange);
        analysis.exchanges[exchange] = exchangeData;
        
        // Calculate completeness percentage
        analysis.gaps.completeness[exchange] = exchangeData.completeness || 0;
        
        // Identify missing date ranges
        analysis.gaps.missing[exchange] = exchangeData.missingRanges || [];
      }

      // Calculate overall date coverage
      analysis.dateRanges = await this.calculateDateCoverage(dataDir);
      
      return analysis;
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  async analyzeExchange(exchangeDir, exchangeName) {
    try {
      const stats = await fs.stat(exchangeDir);
      if (!stats.isDirectory()) {
        return { files: 0, coverage: 0, completeness: 0, missingRanges: [] };
      }

      const dirStats = await this.calculateDirectoryStats(exchangeDir);
      
      // Calculate expected vs actual files for completeness
      const config = await this.getConfig();
      const startDate = new Date(config.dateRange.startDate);
      const endDate = new Date(config.dateRange.endDate);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      // Estimate expected files (symbols * data types * timeframes * days)
      const expectedFiles = config.exchanges[exchangeName]?.symbols?.length || 1 * 
                           (config.dataTypes?.length || 2) * 
                           (config.timeframes?.length || 6) * 
                           daysDiff;
      
      const completeness = expectedFiles > 0 ? Math.min(100, (dirStats.files / expectedFiles) * 100) : 0;
      
      // Find missing date ranges (simplified)
      const missingRanges = await this.findMissingDateRanges(exchangeDir, startDate, endDate);
      
      return {
        files: dirStats.files,
        size: dirStats.size,
        sizeFormatted: this.formatBytes(dirStats.size),
        coverage: Math.round(completeness),
        completeness: Math.round(completeness),
        missingRanges: missingRanges
      };
    } catch (error) {
      return { files: 0, coverage: 0, completeness: 0, missingRanges: [] };
    }
  }

  async findMissingDateRanges(exchangeDir, startDate, endDate) {
    try {
      // Simplified gap detection - check for missing daily files
      const missingRanges = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const hasDataForDate = await this.hasDataForDate(exchangeDir, dateStr);
        
        if (!hasDataForDate) {
          // Find consecutive missing days
          const rangeStart = dateStr;
          let rangeEnd = dateStr;
          
          // Look ahead for consecutive missing days
          const nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);
          
          while (nextDate <= endDate && !(await this.hasDataForDate(exchangeDir, nextDate.toISOString().split('T')[0]))) {
            rangeEnd = nextDate.toISOString().split('T')[0];
            nextDate.setDate(nextDate.getDate() + 1);
          }
          
          missingRanges.push({ start: rangeStart, end: rangeEnd });
          currentDate.setTime(nextDate.getTime());
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      return missingRanges;
    } catch (error) {
      return [];
    }
  }

  async hasDataForDate(exchangeDir, dateStr) {
    try {
      // Check if any files exist for this date
      const [year, month] = dateStr.split('-');
      const monthDir = path.join(exchangeDir, '**', year, month);
      
      // Simple check - if month directory exists and has files
      const symbols = await fs.readdir(exchangeDir);
      for (const symbol of symbols) {
        const symbolDir = path.join(exchangeDir, symbol);
        const symbolStat = await fs.stat(symbolDir);
        if (symbolStat.isDirectory()) {
          const dataTypes = await fs.readdir(symbolDir);
          for (const dataType of dataTypes) {
            const yearDir = path.join(symbolDir, dataType, year);
            try {
              const yearStat = await fs.stat(yearDir);
              if (yearStat.isDirectory()) {
                const monthDir = path.join(yearDir, month);
                const monthStat = await fs.stat(monthDir);
                if (monthStat.isDirectory()) {
                  const files = await fs.readdir(monthDir);
                  if (files.some(f => f.includes(dateStr))) {
                    return true;
                  }
                }
              }
            } catch (e) {
              // Directory doesn't exist, continue
            }
          }
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async calculateDateCoverage(dataDir) {
    try {
      const coverage = {};
      const exchanges = await fs.readdir(dataDir);
      
      for (const exchange of exchanges) {
        const exchangeDir = path.join(dataDir, exchange);
        const stat = await fs.stat(exchangeDir);
        
        if (stat.isDirectory()) {
          // Calculate coverage for last 30 days
          const endDate = new Date();
          const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          let totalDays = 0;
          let coveredDays = 0;
          
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            totalDays++;
            const dateStr = currentDate.toISOString().split('T')[0];
            
            if (await this.hasDataForDate(exchangeDir, dateStr)) {
              coveredDays++;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          coverage[exchange] = totalDays > 0 ? Math.round((coveredDays / totalDays) * 100) : 0;
        }
      }
      
      return coverage;
    } catch (error) {
      return {};
    }
  }

  async getRecentLogs() {
    try {
      const logsDir = path.join(__dirname, '../logs');
      const files = await fs.readdir(logsDir);
      const logFiles = files.filter(f => f.endsWith('.json')).slice(-10);
      
      const logs = [];
      for (const file of logFiles) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);
        logs.push({
          filename: file,
          size: stats.size,
          modified: stats.mtime,
          path: filePath
        });
      }
      
      return logs.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      return [];
    }
  }

  async getFiles(exchange, symbol) {
    try {
      const dataDir = path.join(__dirname, '../data');
      
      if (!exchange) {
        // Return exchange overview
        const result = {};
        const exchanges = await fs.readdir(dataDir);
        
        for (const exchangeName of exchanges) {
          const exchangeDir = path.join(dataDir, exchangeName);
          try {
            const stats = await fs.stat(exchangeDir);
            if (stats.isDirectory()) {
              const dirStats = await this.calculateDirectoryStats(exchangeDir);
              result[exchangeName] = {
                totalFiles: dirStats.files,
                totalSize: dirStats.size,
                totalSizeFormatted: this.formatBytes(dirStats.size)
              };
            }
          } catch (e) {
            result[exchangeName] = { totalFiles: 0, totalSize: 0, totalSizeFormatted: '0 Bytes' };
          }
        }
        
        return result;
      }
      
      // Return files for specific exchange
      let targetDir = path.join(dataDir, exchange);
      if (symbol) {
        targetDir = path.join(targetDir, symbol);
      }

      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      const files = [];
      
      for (const entry of entries) {
        const fullPath = path.join(targetDir, entry.name);
        const stats = await fs.stat(fullPath);
        
        files.push({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          modified: stats.mtime,
          path: fullPath
        });
      }
      
      return files.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      return exchange ? [] : {};
    }
  }

  startPeriodicUpdates() {
    // Update basic stats every 30 seconds
    setInterval(async () => {
      try {
        const stats = await this.getSystemStats();
        this.io.emit('stats_update', stats);
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }, 30000);

    // Update active collections every 10 seconds
    setInterval(() => {
      const collections = Array.from(this.activeCollections.entries()).map(([id, collection]) => ({
        id,
        exchange: collection.exchange,
        status: collection.status,
        startTime: collection.startTime,
        endTime: collection.endTime,
        duration: collection.endTime ? collection.endTime - collection.startTime : Date.now() - collection.startTime
      }));
      
      this.io.emit('collections_update', collections);
    }, 10000);

    // 🚀 NEW: Comprehensive data analysis updates every 2 minutes
    setInterval(async () => {
      try {
        console.log('🔄 Running periodic data analysis update...');
        const analysis = await this.runDataAnalysis();
        this.io.emit('analysis_update', analysis);
        
        // Also update file browser data
        const files = await this.getFiles();
        this.io.emit('files_update', files);
        
        console.log('✅ Data analysis update completed');
      } catch (error) {
        console.error('Failed to update data analysis:', error);
      }
    }, 120000); // Every 2 minutes

    // 🚀 NEW: File system change monitoring (faster updates when actively collecting)
    this.startFileSystemMonitoring();

    // 🚀 NEW: Collection progress monitoring
    this.startCollectionProgressMonitoring();
  }

  startFileSystemMonitoring() {
    const fs = require('fs');
    const dataDir = path.join(__dirname, '../data');
    
    // Track last known file counts per exchange
    this.lastFileCounts = {};
    
    // Monitor file system changes every 30 seconds during active collections
    setInterval(async () => {
      try {
        if (this.activeCollections.size > 0) {
          const hasChanges = await this.detectFileSystemChanges();
          
          if (hasChanges) {
            console.log('📁 File system changes detected, updating dashboard...');
            
            // Quick stats update
            const stats = await this.getSystemStats();
            this.io.emit('stats_update', stats);
            
            // Update exchange status
            const analysis = await this.runDataAnalysis();
            this.io.emit('exchange_status_update', analysis.exchanges);
            
            // Update file browser
            const files = await this.getFiles();
            this.io.emit('files_update', files);
            
            // Emit change notification
            this.io.emit('data_change_notification', {
              message: 'New data files detected! Dashboard updated.',
              timestamp: Date.now(),
              type: 'success'
            });
          }
        }
      } catch (error) {
        console.error('File system monitoring error:', error);
      }
    }, 30000); // Every 30 seconds during active collections
  }

  async detectFileSystemChanges() {
    try {
      const dataDir = path.join(__dirname, '../data');
      const exchanges = await fs.readdir(dataDir);
      let hasChanges = false;
      
      for (const exchange of exchanges) {
        const exchangeDir = path.join(dataDir, exchange);
        try {
          const stats = await fs.stat(exchangeDir);
          if (stats.isDirectory()) {
            const dirStats = await this.calculateDirectoryStats(exchangeDir);
            const currentCount = dirStats.files;
            const lastCount = this.lastFileCounts[exchange] || 0;
            
            if (currentCount !== lastCount) {
              console.log(`📈 ${exchange}: ${lastCount} → ${currentCount} files (+${currentCount - lastCount})`);
              this.lastFileCounts[exchange] = currentCount;
              hasChanges = true;
            }
          }
        } catch (e) {
          // Directory doesn't exist or error accessing it
        }
      }
      
      return hasChanges;
    } catch (error) {
      return false;
    }
  }

  startCollectionProgressMonitoring() {
    // Monitor collection progress and emit detailed updates
    setInterval(() => {
      this.activeCollections.forEach((collection, collectionId) => {
        if (collection.status === 'running') {
          const progress = {
            collectionId,
            exchange: collection.exchange,
            duration: Date.now() - collection.startTime,
            recentLogs: collection.logs.slice(-5), // Last 5 log entries
            status: 'running'
          };
          
          this.io.emit('collection_progress', progress);
        }
      });
    }, 15000); // Every 15 seconds
  }

  // 🚀 NEW: Method to trigger immediate dashboard refresh
  async triggerDashboardRefresh(reason = 'Manual refresh') {
    try {
      console.log(`🔄 Triggering dashboard refresh: ${reason}`);
      
      // Get all updated data
      const [stats, analysis, files] = await Promise.all([
        this.getSystemStats(),
        this.runDataAnalysis(),
        this.getFiles()
      ]);
      
      // Emit all updates simultaneously
      this.io.emit('full_dashboard_refresh', {
        stats,
        analysis,
        files,
        timestamp: Date.now(),
        reason
      });
      
      console.log('✅ Dashboard refresh completed');
      return true;
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
      return false;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`🚀 Data Collection Controller running on http://localhost:${this.port}`);
      console.log(`📊 Monitoring dashboard available at http://localhost:${this.port}`);
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const controller = new DataCollectionController();
  controller.start();
}

module.exports = DataCollectionController; 
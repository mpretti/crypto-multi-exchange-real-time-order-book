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

  async runDataAnalysis() {
    try {
      const analyzer = new DataAnalyzer();
      await analyzer.run();
      return analyzer.analysis;
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
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
      let targetDir = dataDir;
      
      if (exchange) {
        targetDir = path.join(dataDir, exchange);
        if (symbol) {
          targetDir = path.join(targetDir, symbol);
        }
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
      return [];
    }
  }

  startPeriodicUpdates() {
    // Update stats every 30 seconds
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
/**
 * Exchange Status Dashboard
 * Real-time monitoring and diagnostics for all exchange connections
 */

// Import necessary modules (adjust paths as needed)
import { SUPPORTED_EXCHANGES_WITH_DEX, SUPPORTED_EXCHANGES_ORDER_WITH_DEX, EXCHANGE_COLORS } from './config.js';

class ExchangeStatusDashboard {
    constructor() {
        this.exchanges = new Map();
        this.logs = [];
        this.maxLogs = 1000;
        this.autoRefreshInterval = null;
        this.isLogsPaused = false;
        this.filters = {
            status: 'all',
            type: 'all',
            sort: 'name',
            logLevel: 'all'
        };
        
        // Load saved log settings
        this.logSettings = this.loadLogSettings();
        this.loadGlobalLogSettings();
        
        this.init();
    }

    loadLogSettings() {
        try {
            const saved = localStorage.getItem('exchangeLogSettings');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Failed to load log settings from localStorage:', e);
            return {};
        }
    }

    saveLogSettings() {
        try {
            const settings = {};
            this.exchanges.forEach((exchange, exchangeId) => {
                settings[exchangeId] = exchange.logsEnabled;
            });
            localStorage.setItem('exchangeLogSettings', JSON.stringify(settings));
            console.log('Log settings saved to localStorage');
        } catch (e) {
            console.warn('Failed to save log settings to localStorage:', e);
        }
    }

    loadGlobalLogSettings() {
        try {
            const saved = localStorage.getItem('exchangeGlobalLogSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.isLogsPaused = settings.isLogsPaused || false;
                
                // Load filter settings
                if (settings.filters) {
                    this.filters = { ...this.filters, ...settings.filters };
                }
                
                // Update UI to reflect loaded state
                const pauseBtn = document.getElementById('pause-logs-btn');
                if (pauseBtn && this.isLogsPaused) {
                    pauseBtn.textContent = 'Resume';
                    pauseBtn.style.background = 'rgba(40, 167, 69, 0.2)';
                }
            }
        } catch (e) {
            console.warn('Failed to load global log settings from localStorage:', e);
        }
    }

    saveGlobalLogSettings() {
        try {
            const settings = {
                isLogsPaused: this.isLogsPaused,
                filters: this.filters
            };
            localStorage.setItem('exchangeGlobalLogSettings', JSON.stringify(settings));
            console.log('Global log settings saved to localStorage');
        } catch (e) {
            console.warn('Failed to save global log settings to localStorage:', e);
        }
    }

    init() {
        this.initializeExchangeData();
        this.bindEvents();
        this.restoreFilterUI();
        this.startAutoRefresh();
        this.render();
        this.addLog('info', 'System', 'Exchange Status Dashboard initialized');
    }

    restoreFilterUI() {
        // Restore filter UI state from saved settings
        try {
            const statusFilter = document.getElementById('status-filter');
            const typeFilter = document.getElementById('type-filter');
            const sortFilter = document.getElementById('sort-filter');
            const logLevelFilter = document.getElementById('log-level-filter');

            if (statusFilter) statusFilter.value = this.filters.status;
            if (typeFilter) typeFilter.value = this.filters.type;
            if (sortFilter) sortFilter.value = this.filters.sort;
            if (logLevelFilter) logLevelFilter.value = this.filters.logLevel;

            console.log('Filter UI state restored from localStorage');
        } catch (e) {
            console.warn('Failed to restore filter UI state:', e);
        }
    }

    initializeExchangeData() {
        SUPPORTED_EXCHANGES_ORDER_WITH_DEX.forEach(exchangeId => {
            const config = SUPPORTED_EXCHANGES_WITH_DEX[exchangeId];
            this.exchanges.set(exchangeId, {
                id: exchangeId,
                name: config.name,
                status: 'disconnected',
                type: this.getExchangeType(exchangeId),
                connectionTime: null,
                lastMessageTime: null,
                lastMessageContent: null,
                messageCount: 0,
                errorCount: 0,
                retryCount: 0,
                latency: 0,
                latencyHistory: [],
                uptime: 0,
                websocketUrl: config.getWebSocketUrl ? config.getWebSocketUrl('BTCUSDT') : 'N/A',
                pingInterval: config.pingIntervalMs || 'N/A',
                orderBookDepth: 0,
                lastError: null,
                lastErrorTime: null,
                dataRate: 0, // messages per second
                rateHistory: [],
                lastPingTime: null,
                lastPongTime: null,
                pingLatency: 0,
                isDataStale: false,
                logsEnabled: this.logSettings[exchangeId] !== undefined ? this.logSettings[exchangeId] : true, // Individual exchange logging toggle
                auxDataStatus: {
                    fees: 'not_fetched',
                    funding: 'not_fetched',
                    volume: 'not_fetched'
                },
                // Trading pairs data
                tradingPairs: {
                    total: 0,
                    byType: {},
                    lastUpdated: null,
                    isLoading: false,
                    error: null
                }
            });
        });
        
        // Load trading pairs data for all exchanges
        this.loadTradingPairsData();
    }

    async loadTradingPairsData() {
        try {
            // Load the comprehensive trading pairs data
            const response = await fetch('/trading-pairs/all-exchanges-pairs.json');
            if (!response.ok) {
                throw new Error(`Failed to load trading pairs: ${response.status}`);
            }
            
            const allPairsData = await response.json();
            
            // Process data for each exchange
            Object.keys(allPairsData).forEach(exchangeKey => {
                const exchangeData = allPairsData[exchangeKey];
                const exchange = this.exchanges.get(exchangeKey);
                
                if (exchange && exchangeData.pairs) {
                    // Analyze trading pairs by type
                    const typeAnalysis = this.analyzeTradingPairsByType(exchangeData.pairs, exchangeKey);
                    
                    exchange.tradingPairs = {
                        total: exchangeData.count || exchangeData.pairs.length,
                        byType: typeAnalysis,
                        lastUpdated: exchangeData.lastUpdated,
                        isLoading: false,
                        error: null
                    };
                    
                    this.addLog('info', exchange.name, `Loaded ${exchange.tradingPairs.total} trading pairs`, exchangeKey);
                }
            });
            
            // Re-render to show the updated data
            this.render();
            
        } catch (error) {
            console.error('Failed to load trading pairs data:', error);
            this.addLog('error', 'System', `Failed to load trading pairs data: ${error.message}`);
            
            // Mark all exchanges as having failed to load trading pairs
            this.exchanges.forEach(exchange => {
                exchange.tradingPairs.error = error.message;
                exchange.tradingPairs.isLoading = false;
            });
        }
    }

    analyzeTradingPairsByType(pairs, exchangeId) {
        const typeAnalysis = {};
        
        pairs.forEach(pair => {
            let tradingType = 'Unknown';
            
            // Different exchanges use different field names and values
            switch(exchangeId) {
                case 'binance':
                    tradingType = this.normalizeBinanceContractType(pair.contractType);
                    break;
                case 'bybit':
                    tradingType = this.normalizeBybitContractType(pair.contractType);
                    break;
                case 'okx':
                    tradingType = this.normalizeOkxInstType(pair.instType);
                    break;
                case 'coinbase':
                case 'gemini':
                case 'kraken':
                    tradingType = 'Spot'; // These are primarily spot exchanges
                    break;
                case 'bitget':
                case 'mexc':
                    // These might have mixed types, check if they have contractType
                    if (pair.contractType) {
                        tradingType = this.normalizeGenericContractType(pair.contractType);
                    } else if (pair.instType) {
                        tradingType = this.normalizeGenericInstType(pair.instType);
                    } else {
                        tradingType = 'Spot';
                    }
                    break;
                case 'dydx':
                case 'hyperliquid':
                case 'vertex':
                    tradingType = 'Perpetual'; // DEX perpetuals
                    break;
                case 'jupiter':
                    tradingType = 'Spot'; // DEX spot
                    break;
                default:
                    // Try to infer from available fields
                    if (pair.contractType) {
                        tradingType = this.normalizeGenericContractType(pair.contractType);
                    } else if (pair.instType) {
                        tradingType = this.normalizeGenericInstType(pair.instType);
                    } else {
                        tradingType = 'Spot';
                    }
            }
            
            typeAnalysis[tradingType] = (typeAnalysis[tradingType] || 0) + 1;
        });
        
        return typeAnalysis;
    }

    normalizeBinanceContractType(contractType) {
        switch(contractType?.toUpperCase()) {
            case 'PERPETUAL':
                return 'Perpetual';
            case 'CURRENT_QUARTER':
            case 'NEXT_QUARTER':
                return 'Futures';
            default:
                return 'Spot';
        }
    }

    normalizeBybitContractType(contractType) {
        switch(contractType) {
            case 'LinearPerpetual':
            case 'InversePerpetual':
                return 'Perpetual';
            case 'LinearFutures':
            case 'InverseFutures':
                return 'Futures';
            default:
                return 'Spot';
        }
    }

    normalizeOkxInstType(instType) {
        switch(instType?.toUpperCase()) {
            case 'SWAP':
                return 'Perpetual';
            case 'FUTURES':
                return 'Futures';
            case 'OPTION':
                return 'Options';
            case 'SPOT':
            default:
                return 'Spot';
        }
    }

    normalizeGenericContractType(contractType) {
        const type = contractType?.toUpperCase();
        if (type?.includes('PERPETUAL') || type?.includes('PERP')) {
            return 'Perpetual';
        } else if (type?.includes('FUTURE')) {
            return 'Futures';
        } else if (type?.includes('OPTION')) {
            return 'Options';
        }
        return 'Spot';
    }

    normalizeGenericInstType(instType) {
        const type = instType?.toUpperCase();
        if (type?.includes('SWAP') || type?.includes('PERPETUAL')) {
            return 'Perpetual';
        } else if (type?.includes('FUTURE')) {
            return 'Futures';
        } else if (type?.includes('OPTION')) {
            return 'Options';
        }
        return 'Spot';
    }

    getExchangeType(exchangeId) {
        const dexExchanges = ['dydx', 'hyperliquid', 'vertex', 'jupiter', 'uniswap'];
        const simulatedExchanges = [];
        
        if (simulatedExchanges.includes(exchangeId)) return 'simulated';
        if (dexExchanges.includes(exchangeId)) return 'dex';
        return 'cex';
    }

    bindEvents() {
        // Auto-refresh toggle
        document.getElementById('auto-refresh-toggle').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });

        // Control buttons
        document.getElementById('refresh-all-btn').addEventListener('click', () => {
            this.refreshAllData();
        });

        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Enhanced testing controls
        document.getElementById('test-all-apis-btn').addEventListener('click', () => {
            this.testAllAPIs();
        });

        document.getElementById('test-all-websockets-btn').addEventListener('click', () => {
            this.testAllWebSockets();
        });

        document.getElementById('test-symbols-btn').addEventListener('click', () => {
            this.testSymbolLists();
        });

        document.getElementById('test-orderbooks-btn').addEventListener('click', () => {
            this.testOrderBooks();
        });

        document.getElementById('test-historical-btn').addEventListener('click', () => {
            this.testHistoricalData();
        });

        document.getElementById('test-rate-limits-btn').addEventListener('click', () => {
            this.testRateLimits();
        });

        // Filter controls
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.saveGlobalLogSettings();
            this.render();
        });

        document.getElementById('type-filter').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.saveGlobalLogSettings();
            this.render();
        });

        document.getElementById('sort-filter').addEventListener('change', (e) => {
            this.filters.sort = e.target.value;
            this.saveGlobalLogSettings();
            this.render();
        });

        // Log controls
        document.getElementById('clear-logs-btn').addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('pause-logs-btn').addEventListener('click', (e) => {
            this.isLogsPaused = !this.isLogsPaused;
            e.target.textContent = this.isLogsPaused ? 'Resume' : 'Pause';
            e.target.style.background = this.isLogsPaused ? 'rgba(40, 167, 69, 0.2)' : '';
            
            // Save global log settings
            this.saveGlobalLogSettings();
            
            console.log(`Global logging ${this.isLogsPaused ? 'paused' : 'resumed'}`);
        });

        document.getElementById('log-level-filter').addEventListener('change', (e) => {
            this.filters.logLevel = e.target.value;
            this.saveGlobalLogSettings();
            this.renderLogs();
        });

        // Add event delegation for exchange action buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.action-btn[data-action]')) {
                const exchangeId = e.target.getAttribute('data-exchange-id');
                const action = e.target.getAttribute('data-action');
                
                console.log('Action button clicked:', action, 'for exchange:', exchangeId);
                
                switch (action) {
                    case 'reconnect':
                        this.reconnectExchange(exchangeId);
                        break;
                    case 'disconnect':
                        this.disconnectExchange(exchangeId);
                        break;
                    case 'details':
                        this.showExchangeDetails(exchangeId);
                        break;
                    case 'toggle-logs':
                        this.toggleExchangeLogs(exchangeId, e.target.checked);
                        break;
                }
            }
        });

        // Listen for messages from main application (if in iframe or shared context)
        this.setupMainAppConnection();
    }

    setupMainAppConnection() {
        // Try to access parent window data if available
        try {
            if (window.parent && window.parent !== window) {
                // Dashboard is in iframe - set up communication
                window.addEventListener('message', (event) => {
                    if (event.data.type === 'exchange-update') {
                        this.updateExchangeData(event.data.exchangeId, event.data.data);
                    }
                });
            } else {
                // Dashboard is standalone - simulate data or connect to WebSocket
                this.setupStandaloneMode();
            }
        } catch (e) {
            console.warn('Cannot access parent window, running in standalone mode');
            this.setupStandaloneMode();
        }
    }

    setupStandaloneMode() {
        // Simulate real-time data updates for demonstration
        setInterval(() => {
            this.simulateDataUpdates();
        }, 2000);

        // Add some initial simulated data
        setTimeout(() => {
            this.addSimulatedConnections();
        }, 1000);
    }

    simulateDataUpdates() {
        this.exchanges.forEach((exchange, exchangeId) => {
            if (exchange.status === 'connected') {
                const now = Date.now();
                
                // Simulate ping/pong every 30 seconds
                if (!exchange.lastPingTime || (now - exchange.lastPingTime) > 30000) {
                    exchange.lastPingTime = now;
                    // Simulate pong response with some latency
                    setTimeout(() => {
                        exchange.lastPongTime = Date.now();
                        exchange.pingLatency = exchange.lastPongTime - exchange.lastPingTime;
                    }, 10 + Math.random() * 50);
                }
                
                // Simulate data staleness (occasionally no data for a while)
                const shouldReceiveData = Math.random() > 0.1; // 90% chance of receiving data
                
                if (shouldReceiveData) {
                    // Simulate message received
                    exchange.messageCount++;
                    exchange.lastMessageTime = now;
                    exchange.lastMessageContent = this.generateSimulatedMessage(exchangeId);
                    exchange.isDataStale = false;
                } else {
                    // Check if data is becoming stale
                    if (exchange.lastMessageTime && (now - exchange.lastMessageTime) > 30000) {
                        exchange.isDataStale = true;
                    }
                }
                
                // Simulate latency
                exchange.latency = 20 + Math.random() * 100;
                exchange.latencyHistory.push(exchange.latency);
                if (exchange.latencyHistory.length > 60) {
                    exchange.latencyHistory.shift();
                }
                
                // Simulate data rate
                exchange.dataRate = shouldReceiveData ? (0.5 + Math.random() * 2) : 0;
                exchange.rateHistory.push(exchange.dataRate);
                if (exchange.rateHistory.length > 60) {
                    exchange.rateHistory.shift();
                }
                
                // Simulate order book depth
                exchange.orderBookDepth = shouldReceiveData ? (10 + Math.floor(Math.random() * 40)) : exchange.orderBookDepth;
                
                // Occasionally simulate errors
                if (Math.random() < 0.02) {
                    exchange.errorCount++;
                    exchange.lastError = 'Connection timeout';
                    exchange.lastErrorTime = now;
                    this.addLog('error', exchange.name, 'Connection timeout detected', exchangeId);
                }
                
                // Check for stale data and log warning
                if (exchange.isDataStale && Math.random() < 0.1) {
                    this.addLog('warn', exchange.name, 'Data stream appears stale - no recent updates', exchangeId);
                }
            }
        });
    }

    addSimulatedConnections() {
        // Simulate some exchanges being connected
        const connectExchanges = ['binance', 'bybit', 'uniswap', 'hyperliquid'];
        
        connectExchanges.forEach((exchangeId, index) => {
            setTimeout(() => {
                const exchange = this.exchanges.get(exchangeId);
                if (exchange) {
                    exchange.status = 'connecting';
                    this.addLog('info', exchange.name, 'Attempting to connect...', exchangeId);
                    
                                            setTimeout(() => {
                            exchange.status = 'connected';
                            exchange.connectionTime = Date.now();
                            exchange.auxDataStatus.fees = 'loaded';
                            exchange.auxDataStatus.volume = 'loaded';
                            if (exchange.type !== 'simulated') {
                                exchange.auxDataStatus.funding = 'loaded';
                            }
                            this.addLog('info', exchange.name, 'Successfully connected', exchangeId);
                        }, 1000 + Math.random() * 2000);
                }
            }, index * 500);
        });

        // Simulate some connection errors
        setTimeout(() => {
            const errorExchanges = ['kraken', 'bitget'];
            errorExchanges.forEach(exchangeId => {
                const exchange = this.exchanges.get(exchangeId);
                if (exchange) {
                    exchange.status = 'error';
                    exchange.lastError = 'WebSocket connection failed';
                    exchange.lastErrorTime = Date.now();
                    exchange.errorCount++;
                    this.addLog('error', exchange.name, 'WebSocket connection failed', exchangeId);
                }
            });
        }, 3000);
    }

    generateSimulatedMessage(exchangeId) {
        const messageTypes = [
            'Order book snapshot received',
            'Order book update processed',
            'Ping/pong successful',
            'Market data update',
            'Fee information updated'
        ];
        
        return messageTypes[Math.floor(Math.random() * messageTypes.length)];
    }

    updateExchangeData(exchangeId, data) {
        const exchange = this.exchanges.get(exchangeId);
        if (!exchange) return;

        // Update exchange data based on real connection info
        Object.assign(exchange, data);
        
        // Add log entry
        if (data.status && data.status !== exchange.status) {
            this.addLog('info', exchange.name, `Status changed to ${data.status}`, exchangeId);
        }
        
        this.render();
    }

    addLog(level, exchangeName, message, exchangeId = null) {
        if (this.isLogsPaused) return;
        
        // Check if individual exchange logging is enabled
        if (exchangeId) {
            const exchange = this.exchanges.get(exchangeId);
            if (exchange && !exchange.logsEnabled) {
                return; // Skip logging for this exchange if disabled
            }
        }

        const logEntry = {
            timestamp: new Date().toLocaleTimeString(),
            level,
            exchange: exchangeName,
            message,
            exchangeId: exchangeId,
            id: Date.now() + Math.random()
        };

        this.logs.unshift(logEntry);
        
        // Also log to browser console with proper attribution
        const consoleMessage = `[${exchangeName}] ${message}`;
        switch (level) {
            case 'error':
                console.error(consoleMessage);
                break;
            case 'warn':
            case 'warning':
                console.warn(consoleMessage);
                break;
            case 'success':
                console.log(`✅ ${consoleMessage}`);
                break;
            case 'debug':
                console.debug(consoleMessage);
                break;
            case 'info':
            default:
                console.log(consoleMessage);
                break;
        }
        
        // Limit log size
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        this.renderLogs();
    }

    clearLogs() {
        this.logs = [];
        this.renderLogs();
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.autoRefreshInterval = setInterval(() => {
            this.refreshAllData();
        }, 60000); // Changed to 60 seconds
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    refreshAllData() {
        // Update uptime for connected exchanges
        const now = Date.now();
        this.exchanges.forEach(exchange => {
            if (exchange.status === 'connected' && exchange.connectionTime) {
                exchange.uptime = now - exchange.connectionTime;
            }
        });

        this.render();
        this.addLog('info', 'System', 'Dashboard data refreshed');
    }

    exportData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            exchanges: Array.from(this.exchanges.values()),
            logs: this.logs.slice(0, 100), // Export last 100 logs
            summary: this.getStatsSummary()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exchange-status-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.addLog('info', 'System', 'Status data exported successfully');
    }

    getStatsSummary() {
        let connected = 0, connecting = 0, errors = 0, totalMessages = 0, totalRetries = 0;
        let latencies = [];

        this.exchanges.forEach(exchange => {
            switch (exchange.status) {
                case 'connected': connected++; break;
                case 'connecting': connecting++; break;
                case 'error': errors++; break;
            }
            
            totalMessages += exchange.messageCount;
            totalRetries += exchange.retryCount;
            
            if (exchange.latency > 0) {
                latencies.push(exchange.latency);
            }
        });

        const avgLatency = latencies.length > 0 
            ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
            : 0;

        return {
            connected,
            connecting,
            errors,
            totalMessages,
            avgLatency,
            totalRetries
        };
    }

    render() {
        this.renderStats();
        this.renderExchanges();
    }

    renderStats() {
        const stats = this.getStatsSummary();
        
        document.getElementById('connected-count').textContent = stats.connected;
        document.getElementById('connecting-count').textContent = stats.connecting;
        document.getElementById('error-count').textContent = stats.errors;
        document.getElementById('total-messages').textContent = stats.totalMessages.toLocaleString();
        document.getElementById('avg-latency').textContent = `${stats.avgLatency}ms`;
        document.getElementById('total-retries').textContent = stats.totalRetries;
    }

    renderExchanges() {
        const container = document.getElementById('exchanges-grid');
        const filteredExchanges = this.getFilteredExchanges();
        
        container.innerHTML = '';
        
        filteredExchanges.forEach(exchange => {
            const card = this.createExchangeCard(exchange);
            container.appendChild(card);
        });
    }

    getFilteredExchanges() {
        let exchanges = Array.from(this.exchanges.values());
        
        // Filter by status
        if (this.filters.status !== 'all') {
            exchanges = exchanges.filter(ex => ex.status === this.filters.status);
        }
        
        // Filter by type
        if (this.filters.type !== 'all') {
            exchanges = exchanges.filter(ex => ex.type === this.filters.type);
        }
        
        // Sort
        exchanges.sort((a, b) => {
            switch (this.filters.sort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'status':
                    return a.status.localeCompare(b.status);
                case 'uptime':
                    return b.uptime - a.uptime;
                case 'messages':
                    return b.messageCount - a.messageCount;
                case 'latency':
                    return a.latency - b.latency;
                case 'errors':
                    return b.errorCount - a.errorCount;
                default:
                    return 0;
            }
        });
        
        return exchanges;
    }

    createExchangeCard(exchange) {
        const card = document.createElement('div');
        card.className = `exchange-card ${exchange.status === 'connected' ? 'connected' : ''}`;
        card.setAttribute('data-exchange', exchange.id);
        
        const statusClass = `status-${exchange.status}`;
        const uptimeFormatted = this.formatUptime(exchange.uptime);
        const lastMessageFormatted = exchange.lastMessageTime 
            ? this.formatRelativeTime(exchange.lastMessageTime)
            : 'Never';
        const timeSinceLastData = exchange.lastMessageTime 
            ? this.getTimeSinceLastData(exchange.lastMessageTime)
            : 'No data received';
        
        card.innerHTML = `
            <div class="exchange-header">
                <div class="exchange-name">${exchange.name}</div>
                <div class="exchange-status ${statusClass}">${exchange.status}</div>
            </div>
            
            <div class="exchange-metrics">
                <div class="metric">
                    <div class="metric-label">Messages</div>
                    <div class="metric-value">${exchange.messageCount.toLocaleString()}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Latency</div>
                    <div class="metric-value">${exchange.latency.toFixed(0)}ms</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Errors</div>
                    <div class="metric-value">${exchange.errorCount}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Uptime</div>
                    <div class="metric-value">${uptimeFormatted}</div>
                </div>
            </div>
            
            <div class="exchange-details">
                <div class="detail-row">
                    <span>Type:</span>
                    <span class="detail-value">${exchange.type.toUpperCase()}</span>
                </div>
                <div class="detail-row">
                    <span>Last Message:</span>
                    <span class="detail-value">${lastMessageFormatted}</span>
                </div>
                <div class="detail-row">
                    <span>Time Since Last Data:</span>
                    <span class="detail-value" style="color: ${this.getDataFreshnessColor(exchange.lastMessageTime, exchange.isDataStale)};">
                        ${timeSinceLastData}
                    </span>
                </div>
                <div class="detail-row">
                    <span>Order Book Depth:</span>
                    <span class="detail-value">${exchange.orderBookDepth}</span>
                </div>
                <div class="detail-row">
                    <span>Data Rate:</span>
                    <span class="detail-value">${exchange.dataRate.toFixed(1)}/sec</span>
                </div>
                ${exchange.status === 'connected' ? `
                <div class="detail-row">
                    <span>Ping Latency:</span>
                    <span class="detail-value">${exchange.pingLatency ? exchange.pingLatency.toFixed(0) + 'ms' : 'N/A'}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span>WebSocket URL:</span>
                    <span class="detail-value" style="font-size: 0.8em; opacity: 0.8;">${exchange.websocketUrl}</span>
                </div>
                ${exchange.lastError ? `
                <div class="detail-row">
                    <span>Last Error:</span>
                    <span class="detail-value" style="color: #dc3545;">${exchange.lastError}</span>
                </div>
                ` : ''}
            </div>
            
            ${this.renderTradingPairsSection(exchange)}
            
            <div class="exchange-actions">
                ${exchange.status === 'disconnected' || exchange.status === 'error' ? `
                    <button id="reconnect-${exchange.id}" class="action-btn reconnect" data-exchange-id="${exchange.id}" data-action="reconnect">
                        🔄 Reconnect
                    </button>
                ` : ''}
                ${exchange.status === 'connected' ? `
                    <button id="disconnect-${exchange.id}" class="action-btn disconnect" data-exchange-id="${exchange.id}" data-action="disconnect">
                        🔌 Disconnect
                    </button>
                ` : ''}
                <button id="details-${exchange.id}" class="action-btn" data-exchange-id="${exchange.id}" data-action="details">
                    📊 Details
                </button>
            </div>
            
            <div class="exchange-log-control">
                <label class="log-toggle-control">
                    <input type="checkbox" id="log-toggle-${exchange.id}" data-exchange-id="${exchange.id}" data-action="toggle-logs" ${exchange.logsEnabled ? 'checked' : ''}>
                    <span class="log-toggle-slider"></span>
                    <span class="log-toggle-label">📝 Logs</span>
                </label>
            </div>
        `;
        
        return card;
    }

    renderTradingPairsSection(exchange) {
        if (!exchange.tradingPairs || exchange.tradingPairs.isLoading) {
            return `
                <div class="trading-pairs-section">
                    <div class="section-header">
                        <span class="section-title">📈 Trading Pairs</span>
                        <span class="loading-indicator">Loading...</span>
                    </div>
                </div>
            `;
        }
        
        if (exchange.tradingPairs.error) {
            return `
                <div class="trading-pairs-section">
                    <div class="section-header">
                        <span class="section-title">📈 Trading Pairs</span>
                        <span class="error-indicator">Error loading</span>
                    </div>
                </div>
            `;
        }
        
        const totalPairs = exchange.tradingPairs.total;
        const byType = exchange.tradingPairs.byType;
        
        if (totalPairs === 0) {
            return `
                <div class="trading-pairs-section">
                    <div class="section-header">
                        <span class="section-title">📈 Trading Pairs</span>
                        <span class="total-count">0</span>
                    </div>
                </div>
            `;
        }
        
        // Create type breakdown
        const typeBreakdown = Object.entries(byType)
            .sort(([,a], [,b]) => b - a) // Sort by count descending
            .map(([type, count]) => {
                const percentage = ((count / totalPairs) * 100).toFixed(0);
                const typeIcon = this.getTradingTypeIcon(type);
                return `
                    <div class="type-breakdown-item">
                        <span class="type-icon">${typeIcon}</span>
                        <span class="type-name">${type}</span>
                        <span class="type-count">${count}</span>
                        <span class="type-percentage">(${percentage}%)</span>
                    </div>
                `;
            }).join('');
        
        return `
            <div class="trading-pairs-section">
                <div class="section-header">
                    <span class="section-title">📈 Trading Pairs</span>
                    <span class="total-count">${totalPairs.toLocaleString()}</span>
                </div>
                <div class="type-breakdown">
                    ${typeBreakdown}
                </div>
            </div>
        `;
    }

    getTradingTypeIcon(type) {
        switch(type.toLowerCase()) {
            case 'spot':
                return '💱';
            case 'perpetual':
                return '🔄';
            case 'futures':
                return '📅';
            case 'options':
                return '🎯';
            default:
                return '❓';
        }
    }

    renderLogs() {
        const container = document.getElementById('logs-container');
        const filteredLogs = this.getFilteredLogs();
        
        container.innerHTML = '';
        
        filteredLogs.slice(0, 100).forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = 'log-entry';
            logElement.innerHTML = `
                <div class="log-timestamp">${log.timestamp}</div>
                <div class="log-level ${log.level}">${log.level}</div>
                <div class="log-exchange ${log.exchangeId ? 'exchange-specific' : 'system-log'}" data-exchange-id="${log.exchangeId || ''}">${log.exchange}</div>
                <div class="log-message">${log.message}</div>
            `;
            container.appendChild(logElement);
        });
        
        // Auto-scroll to top for new logs
        container.scrollTop = 0;
    }

    getFilteredLogs() {
        if (this.filters.logLevel === 'all') {
            return this.logs;
        }
        return this.logs.filter(log => log.level === this.filters.logLevel);
    }

    formatUptime(uptime) {
        if (!uptime) return '0s';
        
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    getTimeSinceLastData(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 5) return 'Live';
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    }

    getDataFreshnessColor(timestamp, isDataStale) {
        if (!timestamp) return '#6c757d'; // Gray for no data
        
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        
        if (isDataStale) return '#dc3545'; // Red for stale data
        if (seconds < 5) return '#28a745';  // Green for live data
        if (seconds < 30) return '#20c997'; // Teal for recent data
        if (seconds < 60) return '#ffc107'; // Yellow for somewhat old data
        return '#fd7e14'; // Orange for old data
    }

    // Action methods
    reconnectExchange(exchangeId) {
        console.log('Reconnect button clicked for:', exchangeId);
        const exchange = this.exchanges.get(exchangeId);
        if (exchange) {
            console.log('Exchange found:', exchange.name);
            exchange.status = 'connecting';
            exchange.retryCount++;
            this.addLog('info', exchange.name, 'Manual reconnection initiated', exchangeId);
            this.render();
            
            // Test real WebSocket connection
            this.testRealConnection(exchangeId);
        } else {
            console.error('Exchange not found:', exchangeId);
        }
    }

    testRealConnection(exchangeId) {
        const exchange = this.exchanges.get(exchangeId);
        if (!exchange) return;

        try {
            const config = SUPPORTED_EXCHANGES_WITH_DEX[exchangeId];
            if (!config || !config.getWebSocketUrl) {
                this.addLog('error', exchange.name, 'No WebSocket configuration found', exchangeId);
                exchange.status = 'error';
                exchange.lastError = 'No WebSocket configuration';
                exchange.lastErrorTime = Date.now();
                this.render();
                return;
            }

            const wsUrl = config.getWebSocketUrl();
            const ws = new WebSocket(wsUrl);
            const startTime = Date.now();
            let subscriptionSent = false;

            // Set timeout for connection attempt
            const timeout = setTimeout(() => {
                if (ws.readyState !== WebSocket.OPEN) {
                    ws.close();
                    exchange.status = 'error';
                    exchange.lastError = 'Connection timeout';
                    exchange.lastErrorTime = Date.now();
                    this.addLog('error', exchange.name, 'Connection timeout (10s)', exchangeId);
                    this.render();
                }
            }, 10000);

            ws.onopen = () => {
                clearTimeout(timeout);
                const connectionLatency = Date.now() - startTime;
                exchange.latency = connectionLatency;
                exchange.lastPingTime = startTime;
                exchange.lastPongTime = Date.now();
                exchange.pingLatency = connectionLatency;
                
                this.addLog('success', exchange.name, `WebSocket connected (${connectionLatency}ms)`, exchangeId);
                
                // Send subscription message based on exchange
                try {
                    let subscribeMessage;
                    const symbol = 'BTCUSDT'; // Test symbol
                    const formattedSymbol = config.formatSymbol ? config.formatSymbol(symbol) : symbol;
                    
                    if (config.getSubscribeMessage) {
                        subscribeMessage = config.getSubscribeMessage(formattedSymbol);
                        
                        // Handle different message formats
                        if (typeof subscribeMessage === 'string') {
                            ws.send(subscribeMessage);
                        } else {
                            ws.send(JSON.stringify(subscribeMessage));
                        }
                        
                        subscriptionSent = true;
                        this.addLog('info', exchange.name, `Subscription sent for ${formattedSymbol}`, exchangeId);
                    } else {
                        this.addLog('warning', exchange.name, 'No subscription message configured', exchangeId);
                    }
                } catch (error) {
                    this.addLog('error', exchange.name, `Subscription error: ${error.message}`, exchangeId);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    exchange.messageCount++;
                    exchange.lastMessageTime = Date.now();
                    exchange.lastMessageContent = data;
                    
                    // Handle different message types
                    if (exchangeId === 'gemini') {
                        if (data.type === 'subscription_ack') {
                            exchange.status = 'connected';
                            exchange.connectionTime = Date.now();
                            this.addLog('success', exchange.name, 'Subscription acknowledged', exchangeId);
                        } else if (data.type === 'l2_updates' && data.changes) {
                            if (exchange.status !== 'connected') {
                                exchange.status = 'connected';
                                exchange.connectionTime = Date.now();
                            }
                            exchange.orderBookDepth = data.changes.length;
                            this.addLog('info', exchange.name, `Order book update: ${data.changes.length} changes`, exchangeId);
                        } else if (data.type === 'heartbeat') {
                            this.addLog('debug', exchange.name, 'Heartbeat received', exchangeId);
                        } else {
                            this.addLog('info', exchange.name, `Message: ${data.type || 'unknown'}`, exchangeId);
                        }
                    } else {
                        // Generic handling for other exchanges
                        if (exchange.status !== 'connected') {
                            exchange.status = 'connected';
                            exchange.connectionTime = Date.now();
                            this.addLog('success', exchange.name, 'First data received - connection established', exchangeId);
                        }
                        
                        // Try to extract order book depth
                        if (data.bids && data.asks) {
                            exchange.orderBookDepth = (data.bids.length || 0) + (data.asks.length || 0);
                        } else if (data.changes) {
                            exchange.orderBookDepth = data.changes.length;
                        }
                        
                        this.addLog('info', exchange.name, `Data received: ${Object.keys(data).join(', ')}`, exchangeId);
                    }
                    
                    this.render();
                    
                    // Close connection after successful test (optional)
                    setTimeout(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.close();
                            this.addLog('info', exchange.name, 'Test connection closed', exchangeId);
                        }
                    }, 5000);
                    
                } catch (error) {
                    this.addLog('error', exchange.name, `Message parse error: ${error.message}`, exchangeId);
                }
            };

            ws.onerror = (error) => {
                clearTimeout(timeout);
                exchange.status = 'error';
                exchange.errorCount++;
                exchange.lastError = 'WebSocket error';
                exchange.lastErrorTime = Date.now();
                this.addLog('error', exchange.name, `WebSocket error: ${error.message || 'Unknown error'}`, exchangeId);
                this.render();
            };

            ws.onclose = (event) => {
                clearTimeout(timeout);
                if (exchange.status === 'connecting') {
                    exchange.status = 'error';
                    exchange.lastError = `Connection failed (${event.code})`;
                    exchange.lastErrorTime = Date.now();
                    this.addLog('error', exchange.name, `Connection failed: ${event.code} - ${event.reason}`, exchangeId);
                } else {
                    this.addLog('info', exchange.name, `Connection closed: ${event.code} - ${event.reason}`, exchangeId);
                }
                this.render();
            };

        } catch (error) {
            exchange.status = 'error';
            exchange.lastError = error.message;
            exchange.lastErrorTime = Date.now();
            this.addLog('error', exchange.name, `Connection setup error: ${error.message}`, exchangeId);
            this.render();
        }
    }

    disconnectExchange(exchangeId) {
        const exchange = this.exchanges.get(exchangeId);
        if (exchange) {
            exchange.status = 'disconnected';
            exchange.connectionTime = null;
            exchange.uptime = 0;
            this.addLog('info', exchange.name, 'Manual disconnection', exchangeId);
            this.render();
        }
    }

    showExchangeDetails(exchangeId) {
        const exchange = this.exchanges.get(exchangeId);
        if (exchange) {
            // Create detailed modal or expand card (simplified for now)
            alert(`Detailed stats for ${exchange.name}:\n\n` +
                  `Messages: ${exchange.messageCount}\n` +
                  `Errors: ${exchange.errorCount}\n` +
                  `Retries: ${exchange.retryCount}\n` +
                  `Avg Latency: ${exchange.latency.toFixed(0)}ms\n` +
                  `Data Rate: ${exchange.dataRate.toFixed(1)}/sec\n` +
                  `Logs Enabled: ${exchange.logsEnabled ? 'Yes' : 'No'}`);
        }
    }

    toggleExchangeLogs(exchangeId, enabled) {
        const exchange = this.exchanges.get(exchangeId);
        if (exchange) {
            exchange.logsEnabled = enabled;
            const status = enabled ? 'enabled' : 'disabled';
            console.log(`[${exchange.name}] Logging ${status}`);
            
            // Save settings to localStorage
            this.saveLogSettings();
            
            // Add a log entry about the toggle (always show this regardless of toggle state)
            const logEntry = {
                timestamp: new Date().toLocaleTimeString(),
                level: 'info',
                exchange: exchange.name,
                message: `Logging ${status}`,
                exchangeId: exchangeId,
                id: Date.now() + Math.random()
            };
            
            this.logs.unshift(logEntry);
            this.renderLogs();
            
            // Update automation helpers
            if (window.automationHelpers) {
                window.automationHelpers.getExchangeLogStatus = (exchangeId) => {
                    const exchange = this.exchanges.get(exchangeId);
                    return exchange ? exchange.logsEnabled : false;
                };
            }
        }
    }

    // Comprehensive API Testing
    async testAllAPIs() {
        this.addLog('info', 'System', '🧪 Starting comprehensive API testing...');
        const testSymbol = document.getElementById('test-symbol-filter').value;
        let tested = 0, passed = 0, failed = 0;

        const exchangeConfigs = {
            binance: {
                name: 'Binance',
                endpoints: {
                    exchangeInfo: 'https://api.binance.com/api/v3/exchangeInfo',
                    ticker: `https://api.binance.com/api/v3/ticker/24hr?symbol=${testSymbol}`,
                    orderBook: `https://api.binance.com/api/v3/depth?symbol=${testSymbol}&limit=10`,
                    klines: `https://api.binance.com/api/v3/klines?symbol=${testSymbol}&interval=1d&limit=5`
                }
            },
            bybit: {
                name: 'Bybit',
                endpoints: {
                    instruments: 'https://api.bybit.com/v5/market/instruments-info?category=linear&limit=5',
                    ticker: `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${testSymbol}`,
                    orderBook: `https://api.bybit.com/v5/market/orderbook?category=linear&symbol=${testSymbol}&limit=10`,
                    klines: `https://api.bybit.com/v5/market/kline?category=linear&symbol=${testSymbol}&interval=D&limit=5`
                }
            },
            hyperliquid: {
                name: 'Hyperliquid',
                endpoints: {
                    allMids: 'https://api.hyperliquid.xyz/info',
                    orderBook: 'https://api.hyperliquid.xyz/info'
                }
            },
            okx: {
                name: 'OKX',
                endpoints: {
                    instruments: 'https://www.okx.com/api/v5/public/instruments?instType=SPOT',
                    ticker: `https://www.okx.com/api/v5/market/ticker?instId=${testSymbol.replace('USDT', '-USDT')}`,
                    orderBook: `https://www.okx.com/api/v5/market/books?instId=${testSymbol.replace('USDT', '-USDT')}&sz=10`,
                    candles: `https://www.okx.com/api/v5/market/candles?instId=${testSymbol.replace('USDT', '-USDT')}&bar=1D&limit=5`
                }
            }
        };

        for (const [exchangeId, config] of Object.entries(exchangeConfigs)) {
            this.addLog('info', config.name, `Testing ${config.name} API endpoints...`);
            
            for (const [endpointName, url] of Object.entries(config.endpoints)) {
                tested++;
                try {
                    const startTime = Date.now();
                    let response;
                    
                    if (exchangeId === 'hyperliquid') {
                        response = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: endpointName === 'allMids' ? 'allMids' : 'l2Book', coin: 'BTC' })
                        });
                    } else {
                        response = await fetch(url);
                    }
                    
                    const latency = Date.now() - startTime;
                    
                    if (response.ok) {
                        const data = await response.json();
                        passed++;
                        this.addLog('success', config.name, `✅ ${endpointName} API working (${latency}ms)`);
                        
                        // Update exchange data
                        if (this.exchanges.has(exchangeId)) {
                            const exchange = this.exchanges.get(exchangeId);
                            exchange.latency = latency;
                            exchange.status = 'connected';
                            exchange.lastMessageTime = Date.now();
                        }
                    } else {
                        failed++;
                        this.addLog('error', config.name, `❌ ${endpointName} API failed: ${response.status} ${response.statusText}`);
                        
                        if (this.exchanges.has(exchangeId)) {
                            const exchange = this.exchanges.get(exchangeId);
                            exchange.status = 'error';
                            exchange.lastError = `${response.status} ${response.statusText}`;
                            exchange.lastErrorTime = Date.now();
                        }
                    }
                } catch (error) {
                    failed++;
                    this.addLog('error', config.name, `❌ ${endpointName} API error: ${error.message}`);
                    
                    if (this.exchanges.has(exchangeId)) {
                        const exchange = this.exchanges.get(exchangeId);
                        exchange.status = 'error';
                        exchange.lastError = error.message;
                        exchange.lastErrorTime = Date.now();
                    }
                }
                
                // Small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // Update test results
        document.getElementById('api-tested').textContent = tested;
        document.getElementById('api-passed').textContent = passed;
        document.getElementById('api-failed').textContent = failed;

        this.addLog('info', 'System', `🧪 API testing completed: ${passed}/${tested} passed`);
        this.updateRateLimitingMonitor();
        this.render();
    }

    // WebSocket Testing
    async testAllWebSockets() {
        this.addLog('info', 'System', '🔌 Starting WebSocket connection testing...');
        const testSymbol = document.getElementById('test-symbol-filter').value;
        let tested = 0, connected = 0, failed = 0;

        const wsConfigs = {
            binance: {
                name: 'Binance',
                url: `wss://stream.binance.com:9443/ws/${testSymbol.toLowerCase()}@depth5`
            },
            bybit: {
                name: 'Bybit',
                url: 'wss://stream.bybit.com/v5/public/linear'
            },
            hyperliquid: {
                name: 'Hyperliquid',
                url: 'wss://api.hyperliquid.xyz/ws'
            }
        };

        for (const [exchangeId, config] of Object.entries(wsConfigs)) {
            tested++;
            this.addLog('info', config.name, `Testing ${config.name} WebSocket...`);
            
            try {
                const ws = new WebSocket(config.url);
                const timeout = setTimeout(() => {
                    ws.close();
                    failed++;
                    this.addLog('error', config.name, `❌ WebSocket connection timeout`);
                }, 5000);

                ws.onopen = () => {
                    clearTimeout(timeout);
                    connected++;
                    this.addLog('success', config.name, `✅ WebSocket connected successfully`);
                    
                    // Send subscription message for Bybit and Hyperliquid
                    if (exchangeId === 'bybit') {
                        ws.send(JSON.stringify({
                            op: 'subscribe',
                            args: [`orderbook.1.${testSymbol}`]
                        }));
                    } else if (exchangeId === 'hyperliquid') {
                        ws.send(JSON.stringify({
                            method: 'subscribe',
                            subscription: { type: 'l2Book', coin: 'BTC' }
                        }));
                    }
                    
                    // Close after testing
                    setTimeout(() => ws.close(), 2000);
                };

                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    failed++;
                    this.addLog('error', config.name, `❌ WebSocket error: ${error.message || 'Connection failed'}`);
                };

                ws.onmessage = (event) => {
                    this.addLog('debug', config.name, `📨 WebSocket message received`);
                };

            } catch (error) {
                failed++;
                this.addLog('error', config.name, `❌ WebSocket error: ${error.message}`);
            }

            // Delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Update test results
        document.getElementById('ws-tested').textContent = tested;
        document.getElementById('ws-connected').textContent = connected;
        document.getElementById('ws-failed').textContent = failed;

        this.addLog('info', 'System', `🔌 WebSocket testing completed: ${connected}/${tested} connected`);
    }

    // Symbol Lists Testing
    async testSymbolLists() {
        this.addLog('info', 'System', '📋 Testing symbol lists availability...');
        let tested = 0, valid = 0, invalid = 0;

        const symbolEndpoints = {
            binance: 'https://api.binance.com/api/v3/exchangeInfo',
            bybit: 'https://api.bybit.com/v5/market/instruments-info?category=linear&limit=100',
            okx: 'https://www.okx.com/api/v5/public/instruments?instType=SPOT',
            hyperliquid: 'https://api.hyperliquid.xyz/info'
        };

        for (const [exchange, url] of Object.entries(symbolEndpoints)) {
            tested++;
            try {
                let response;
                if (exchange === 'hyperliquid') {
                    response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'meta' })
                    });
                } else {
                    response = await fetch(url);
                }

                if (response.ok) {
                    const data = await response.json();
                    let symbolCount = 0;
                    
                    if (exchange === 'binance') {
                        symbolCount = data.symbols?.length || 0;
                    } else if (exchange === 'bybit') {
                        symbolCount = data.result?.list?.length || 0;
                    } else if (exchange === 'okx') {
                        symbolCount = data.data?.length || 0;
                    } else if (exchange === 'hyperliquid') {
                        symbolCount = data.universe?.length || 0;
                    }

                    if (symbolCount > 0) {
                        valid++;
                        this.addLog('success', exchange, `✅ Found ${symbolCount} symbols`);
                    } else {
                        invalid++;
                        this.addLog('warn', exchange, `⚠️ No symbols found`);
                    }
                } else {
                    invalid++;
                    this.addLog('error', exchange, `❌ Symbol list API failed: ${response.status}`);
                }
            } catch (error) {
                invalid++;
                this.addLog('error', exchange, `❌ Symbol list error: ${error.message}`);
            }
        }

        this.addLog('info', 'System', `📋 Symbol testing completed: ${valid}/${tested} valid`);
    }

    // Order Book Testing
    async testOrderBooks() {
        this.addLog('info', 'System', '📈 Testing order book data quality...');
        const testSymbol = document.getElementById('test-symbol-filter').value;
        let tested = 0, valid = 0, invalid = 0;

        const orderbookEndpoints = {
            binance: `/api/binance/api/v3/depth?symbol=${testSymbol}&limit=10`,
            bybit: `/api/bybit/v5/market/orderbook?category=linear&symbol=${testSymbol}&limit=10`,
            okx: `/api/okx/api/v5/market/books?instId=${testSymbol.replace('USDT', '-USDT')}&sz=10`
        };

        for (const [exchange, url] of Object.entries(orderbookEndpoints)) {
            tested++;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    let isValid = false;
                    
                    if (exchange === 'binance') {
                        isValid = data.bids?.length > 0 && data.asks?.length > 0;
                    } else if (exchange === 'bybit') {
                        isValid = data.result?.b?.length > 0 && data.result?.a?.length > 0;
                    } else if (exchange === 'okx') {
                        isValid = data.data?.[0]?.bids?.length > 0 && data.data?.[0]?.asks?.length > 0;
                    }

                    if (isValid) {
                        valid++;
                        this.addLog('success', exchange, `✅ Order book data valid`);
                    } else {
                        invalid++;
                        this.addLog('warn', exchange, `⚠️ Order book data incomplete`);
                    }
                } else {
                    invalid++;
                    this.addLog('error', exchange, `❌ Order book API failed: ${response.status}`);
                }
            } catch (error) {
                invalid++;
                this.addLog('error', exchange, `❌ Order book error: ${error.message}`);
            }
        }

        // Update test results
        document.getElementById('orderbook-tested').textContent = tested;
        document.getElementById('orderbook-valid').textContent = valid;
        document.getElementById('orderbook-invalid').textContent = invalid;

        this.addLog('info', 'System', `📈 Order book testing completed: ${valid}/${tested} valid`);
    }

    // Historical Data Testing
    async testHistoricalData() {
        this.addLog('info', 'System', '📊 Testing historical data availability...');
        const testSymbol = document.getElementById('test-symbol-filter').value;
        let tested = 0, available = 0, unavailable = 0;

        const historicalEndpoints = {
            binance: `/api/binance/api/v3/klines?symbol=${testSymbol}&interval=1d&limit=5`,
            bybit: `/api/bybit/v5/market/kline?category=linear&symbol=${testSymbol}&interval=D&limit=5`,
            okx: `/api/okx/api/v5/market/candles?instId=${testSymbol.replace('USDT', '-USDT')}&bar=1D&limit=5`
        };

        for (const [exchange, url] of Object.entries(historicalEndpoints)) {
            tested++;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    let hasData = false;
                    
                    if (exchange === 'binance') {
                        hasData = Array.isArray(data) && data.length > 0;
                    } else if (exchange === 'bybit') {
                        hasData = data.result?.list?.length > 0;
                    } else if (exchange === 'okx') {
                        hasData = data.data?.length > 0;
                    }

                    if (hasData) {
                        available++;
                        this.addLog('success', exchange, `✅ Historical data available`);
                    } else {
                        unavailable++;
                        this.addLog('warn', exchange, `⚠️ No historical data`);
                    }
                } else {
                    unavailable++;
                    this.addLog('error', exchange, `❌ Historical data API failed: ${response.status}`);
                }
            } catch (error) {
                unavailable++;
                this.addLog('error', exchange, `❌ Historical data error: ${error.message}`);
            }
        }

        // Update test results
        document.getElementById('historical-tested').textContent = tested;
        document.getElementById('historical-available').textContent = available;
        document.getElementById('historical-unavailable').textContent = unavailable;

        this.addLog('info', 'System', `📊 Historical data testing completed: ${available}/${tested} available`);
    }

    // Rate Limiting Testing
    async testRateLimits() {
        this.addLog('warn', 'System', '⚠️ Starting rate limit testing - this may trigger temporary restrictions');
        
        const testEndpoints = {
            binance: 'https://api.binance.com/api/v3/exchangeInfo',
            bybit: 'https://api.bybit.com/v5/market/instruments-info?category=linear&limit=5'
        };

        for (const [exchange, url] of Object.entries(testEndpoints)) {
            this.addLog('info', exchange, `Testing ${exchange} rate limits...`);
            let requestCount = 0;
            let rateLimited = false;

            // Make rapid requests to test rate limiting
            for (let i = 0; i < 10; i++) {
                try {
                    const startTime = Date.now();
                    const response = await fetch(url);
                    const latency = Date.now() - startTime;
                    requestCount++;

                    if (response.status === 429) {
                        rateLimited = true;
                        this.addLog('warn', exchange, `🚨 Rate limit hit after ${requestCount} requests`);
                        break;
                    } else if (response.ok) {
                        this.addLog('debug', exchange, `Request ${i + 1}: ${latency}ms`);
                    } else {
                        this.addLog('warn', exchange, `Request ${i + 1} failed: ${response.status}`);
                    }
                } catch (error) {
                    this.addLog('error', exchange, `Request ${i + 1} error: ${error.message}`);
                }

                // Short delay between requests
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            if (!rateLimited) {
                this.addLog('success', exchange, `✅ No rate limiting detected (${requestCount} requests)`);
            }
        }

        this.updateRateLimitingMonitor();
    }

    // Update Rate Limiting Monitor
    updateRateLimitingMonitor() {
        const rateLimitedExchanges = [];
        const slowExchanges = [];
        let totalExchanges = 0;
        let healthyExchanges = 0;

        this.exchanges.forEach((exchange, exchangeId) => {
            totalExchanges++;
            
            if (exchange.lastError && exchange.lastError.includes('429')) {
                rateLimitedExchanges.push(exchange.name);
            } else if (exchange.latency > 2000) {
                slowExchanges.push(`${exchange.name} (${exchange.latency}ms)`);
            } else if (exchange.status === 'connected') {
                healthyExchanges++;
            }
        });

        // Update UI
        document.getElementById('rate-limited-exchanges').textContent = 
            rateLimitedExchanges.length > 0 ? rateLimitedExchanges.join(', ') : 'None detected';
        
        document.getElementById('slow-exchanges').textContent = 
            slowExchanges.length > 0 ? slowExchanges.join(', ') : 'None detected';
        
        const healthScore = totalExchanges > 0 ? Math.round((healthyExchanges / totalExchanges) * 100) : 100;
        document.getElementById('health-score').textContent = `${healthScore}%`;
        
        // Update health score color
        const healthElement = document.getElementById('health-score');
        if (healthScore >= 80) {
            healthElement.className = 'text-2xl font-bold text-green-400';
        } else if (healthScore >= 60) {
            healthElement.className = 'text-2xl font-bold text-yellow-400';
        } else {
            healthElement.className = 'text-2xl font-bold text-red-400';
        }
    }
}

// Initialize dashboard when page loads
const dashboard = new ExchangeStatusDashboard();

// Make dashboard available globally for action buttons
window.dashboard = dashboard;
console.log('Dashboard initialized and made global:', window.dashboard);

// Add automation helper functions
window.automationHelpers = {
    // Test reconnect functionality for a specific exchange
    testReconnect: (exchangeId) => {
        console.log(`Testing reconnect for ${exchangeId}`);
        const button = document.getElementById(`reconnect-${exchangeId}`);
        if (button) {
            button.click();
            return `Clicked reconnect button for ${exchangeId}`;
        } else {
            return `Reconnect button not found for ${exchangeId} (exchange may be connected or not exist)`;
        }
    },
    
    // Test disconnect functionality for a specific exchange
    testDisconnect: (exchangeId) => {
        console.log(`Testing disconnect for ${exchangeId}`);
        const button = document.getElementById(`disconnect-${exchangeId}`);
        if (button) {
            button.click();
            return `Clicked disconnect button for ${exchangeId}`;
        } else {
            return `Disconnect button not found for ${exchangeId} (exchange may be disconnected or not exist)`;
        }
    },
    
    // Get all available exchange IDs
    getExchangeIds: () => {
        return Array.from(dashboard.exchanges.keys());
    },
    
    // Get exchange status
    getExchangeStatus: (exchangeId) => {
        const exchange = dashboard.exchanges.get(exchangeId);
        return exchange ? exchange.status : 'not found';
    },
    
    // Toggle logs for specific exchange
    toggleExchangeLogs: (exchangeId, enabled = null) => {
        const exchange = dashboard.exchanges.get(exchangeId);
        if (!exchange) {
            return `Exchange ${exchangeId} not found`;
        }
        
        // If enabled is null, toggle current state
        if (enabled === null) {
            enabled = !exchange.logsEnabled;
        }
        
        const checkbox = document.getElementById(`log-toggle-${exchangeId}`);
        if (checkbox) {
            checkbox.checked = enabled;
            dashboard.toggleExchangeLogs(exchangeId, enabled);
            return `Logs ${enabled ? 'enabled' : 'disabled'} for ${exchange.name}`;
        } else {
            return `Log toggle not found for ${exchangeId}`;
        }
    },
    
    // Get log status for specific exchange
    getExchangeLogStatus: (exchangeId) => {
        const exchange = dashboard.exchanges.get(exchangeId);
        return exchange ? exchange.logsEnabled : false;
    },
    
    // List all available automation IDs
    listAutomationIds: () => {
        const exchangeIds = Array.from(dashboard.exchanges.keys());
        const ids = {
            mainControls: ['refresh-all-btn', 'export-data-btn', 'auto-refresh-toggle', 'clear-logs-btn', 'pause-logs-btn'],
            filters: ['status-filter', 'type-filter', 'sort-filter', 'log-level-filter'],
            exchangeButtons: [],
            logToggles: []
        };
        
        exchangeIds.forEach(id => {
            const exchange = dashboard.exchanges.get(id);
            if (exchange.status === 'disconnected' || exchange.status === 'error') {
                ids.exchangeButtons.push(`reconnect-${id}`);
            }
            if (exchange.status === 'connected') {
                ids.exchangeButtons.push(`disconnect-${id}`);
            }
            ids.exchangeButtons.push(`details-${id}`);
            ids.logToggles.push(`log-toggle-${id}`);
        });
        
        return ids;
    },
    
    // Clear all saved settings
    clearSavedSettings: () => {
        try {
            localStorage.removeItem('exchangeLogSettings');
            localStorage.removeItem('exchangeGlobalLogSettings');
            console.log('All saved settings cleared');
            return 'Settings cleared successfully. Refresh the page to see defaults.';
        } catch (e) {
            console.error('Failed to clear saved settings:', e);
            return 'Failed to clear settings';
        }
    },
    
    // Test Gemini connection specifically
    testGeminiConnection: () => {
        console.log('Testing Gemini connection with correct format...');
        const result = window.automationHelpers.testReconnect('gemini');
        console.log('Gemini test result:', result);
        return result;
    },

    // Test all CEX exchanges
    testAllCEXExchanges: () => {
        const cexExchanges = ['binance', 'bybit', 'okx', 'kraken', 'bitget', 'mexc', 'gemini'];
        const results = [];
        
        cexExchanges.forEach((exchangeId, index) => {
            setTimeout(() => {
                const result = window.automationHelpers.testReconnect(exchangeId);
                results.push(`${exchangeId}: ${result}`);
                console.log(`[${index + 1}/${cexExchanges.length}] ${result}`);
            }, index * 2000); // Stagger tests by 2 seconds
        });
        
        return `Testing ${cexExchanges.length} CEX exchanges. Check console for results.`;
    },

    // Quick Gemini status check
    getGeminiStatus: () => {
        const exchange = dashboard.exchanges.get('gemini');
        if (!exchange) return 'Gemini not found';
        
        return {
            status: exchange.status,
            messageCount: exchange.messageCount,
            errorCount: exchange.errorCount,
            lastError: exchange.lastError,
            orderBookDepth: exchange.orderBookDepth,
            latency: exchange.latency,
            lastMessageTime: exchange.lastMessageTime ? new Date(exchange.lastMessageTime).toLocaleTimeString() : 'Never'
        };
    },

    // Export current settings
    exportSettings: () => {
        try {
            const logSettings = localStorage.getItem('exchangeLogSettings');
            const globalSettings = localStorage.getItem('exchangeGlobalLogSettings');
            
            const settings = {
                exchangeLogSettings: logSettings ? JSON.parse(logSettings) : {},
                globalLogSettings: globalSettings ? JSON.parse(globalSettings) : {}
            };
            
            console.log('Current settings:', settings);
            return settings;
        } catch (e) {
            console.error('Failed to export settings:', e);
            return null;
        }
    },
};

console.log('Automation helpers available:', window.automationHelpers);

// Export for module usage
export default ExchangeStatusDashboard; 
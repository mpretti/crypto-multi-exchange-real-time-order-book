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
                }
            });
        });
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
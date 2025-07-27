// Multi-Exchange Live Trade Ticker with Marine Animal Classifications
// Supports multiple WebSocket connections for different exchanges

import { logger } from './utils';

interface TradeData {
    symbol: string;
    price: number;
    quantity: number;
    isBuyer: boolean;
    timestamp: number;
    value: number;
    exchange: string;
}

interface TickerSettings {
    isEnabled: boolean;
    minTradeSize: number;
    rateLimitMs: number;
    sideFilter: 'all' | 'buy' | 'sell';
    maxDisplayTrades: number;
    selectedExchanges: Set<string>;
    displayMode: 'unified' | 'separated';
}

interface ExchangeConnection {
    ws: WebSocket | null;
    isConnected: boolean;
    lastTradeTime: number;
    reconnectTimer: NodeJS.Timeout | null;
}

interface ExchangeConfig {
    name: string;
    wsUrl: (symbol: string) => string;
    parseTradeData: (data: any) => TradeData | null;
    color: string;
    icon: string;
}

class MultiExchangeTradeTicker {
    private connections: Map<string, ExchangeConnection> = new Map();
    private settings: TickerSettings;
    private trades: TradeData[] = [];
    private selectedAsset = 'BTCUSDT';
    private exchangeConfigs: Map<string, ExchangeConfig> = new Map();

    constructor() {
        this.settings = {
            isEnabled: true,
            minTradeSize: 1000,
            rateLimitMs: 2000,
            sideFilter: 'all',
            maxDisplayTrades: 50,
            selectedExchanges: new Set(['binance']),
            displayMode: 'unified'
        };
        
        this.initializeExchangeConfigs();
        this.initializeControls();
        this.loadSettings();
        this.initializeExchangePills();
    }

    private initializeExchangeConfigs() {
        // Binance configuration
        this.exchangeConfigs.set('binance', {
            name: 'Binance',
            wsUrl: (symbol) => `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`,
            parseTradeData: (data) => {
                try {
                    const trade = JSON.parse(data);
                    return {
                        symbol: trade.s,
                        price: parseFloat(trade.p),
                        quantity: parseFloat(trade.q),
                        isBuyer: trade.m === false,
                        timestamp: trade.T,
                        value: parseFloat(trade.p) * parseFloat(trade.q),
                        exchange: 'binance'
                    };
                } catch (e) {
                    logger.error('Error parsing Binance trade data:', e);
                    return null;
                }
            },
            color: '#f3ba2f',
            icon: '🟨'
        });

        // Bybit configuration (placeholder - would need real implementation)
        this.exchangeConfigs.set('bybit', {
            name: 'Bybit',
            wsUrl: (symbol) => `wss://stream.bybit.com/v5/public/spot`,
            parseTradeData: (data) => {
                // Placeholder - real Bybit implementation would go here
                logger.warn('Bybit trade parsing not implemented');
                return null;
            },
            color: '#f7931e',
            icon: '🟠'
        });

        // Add more exchange configs here...
    }

    private initializeExchangePills() {
        const container = document.getElementById('ticker-exchange-pills');
        if (!container) return;

        container.innerHTML = '';

        this.exchangeConfigs.forEach((config, exchangeId) => {
            const pill = document.createElement('div');
            pill.className = 'ticker-exchange-pill';
            pill.dataset.exchange = exchangeId;
            
            if (this.settings.selectedExchanges.has(exchangeId)) {
                pill.classList.add('active');
            }

            pill.innerHTML = `
                <span class="ticker-exchange-icon">${config.icon}</span>
                <span>${config.name}</span>
                <span class="connection-status">●</span>
            `;

            pill.addEventListener('click', () => this.toggleExchange(exchangeId));
            container.appendChild(pill);
        });

        this.updateExchangeStatus();
    }

    private toggleExchange(exchangeId: string) {
        if (this.settings.selectedExchanges.has(exchangeId)) {
            this.settings.selectedExchanges.delete(exchangeId);
            this.disconnectFromExchange(exchangeId);
        } else {
            this.settings.selectedExchanges.add(exchangeId);
            if (this.settings.isEnabled) {
                this.connectToExchange(exchangeId);
            }
        }

        this.saveSettings();
        this.updateExchangePills();
        this.updateExchangeStatus();
    }

    private updateExchangePills() {
        const pills = document.querySelectorAll('.ticker-exchange-pill');
        pills.forEach(pill => {
            const exchangeId = (pill as HTMLElement).dataset.exchange;
            if (exchangeId) {
                if (this.settings.selectedExchanges.has(exchangeId)) {
                    pill.classList.add('active');
                } else {
                    pill.classList.remove('active');
                }

                const connection = this.connections.get(exchangeId);
                const statusDot = pill.querySelector('.connection-status');
                if (statusDot && connection) {
                    if (connection.isConnected) {
                        statusDot.textContent = '🟢';
                    } else if (connection.ws) {
                        statusDot.textContent = '🟡';
                    } else {
                        statusDot.textContent = '⚫';
                    }
                }
            }
        });
    }

    private updateExchangeStatus() {
        const statusElement = document.getElementById('ticker-exchange-status');
        if (!statusElement) return;

        const connectedCount = Array.from(this.connections.values())
            .filter(conn => conn.isConnected).length;
        const totalSelected = this.settings.selectedExchanges.size;

        const indicator = statusElement.querySelector('.status-indicator');
        if (indicator) {
            indicator.textContent = `⚡ ${connectedCount}/${totalSelected} exchanges connected`;
        }
    }

    // Marine Animal Classification System 🌊
    private getMarineClassification(tradeValue: number): { icon: string; name: string; color: string } {
        if (tradeValue >= 50000) {
            return { icon: '🦣', name: 'Mega Whale', color: '#9c27b0' };
        } else if (tradeValue >= 10000) {
            return { icon: '🐋', name: 'Whale', color: '#3f51b5' };
        } else if (tradeValue >= 5000) {
            return { icon: '🦈', name: 'Shark', color: '#f44336' };
        } else if (tradeValue >= 1000) {
            return { icon: '🐟', name: 'Fish', color: '#ff9800' };
        } else if (tradeValue >= 100) {
            return { icon: '🐠', name: 'Small Fish', color: '#4caf50' };
        } else {
            return { icon: '🦐', name: 'Shrimp', color: '#9e9e9e' };
        }
    }

    private initializeControls() {
        // Toggle button
        const toggleBtn = document.getElementById('trade-ticker-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTicker());
        }

        // Settings button (show/hide filters)
        const settingsBtn = document.getElementById('trade-ticker-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Clear button
        const clearBtn = document.getElementById('trade-ticker-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearTrades());
        }

        // Filter controls
        this.initializeFilters();

        // Listen for asset changes
        this.listenForAssetChanges();
    }

    private initializeFilters() {
        const minSizeSelect = document.getElementById('min-trade-size') as HTMLSelectElement;
        const rateLimitSelect = document.getElementById('trade-rate-limit') as HTMLSelectElement;
        const sideFilterSelect = document.getElementById('trade-side-filter') as HTMLSelectElement;
        const maxDisplaySelect = document.getElementById('max-trades-display') as HTMLSelectElement;
        const displayModeSelect = document.getElementById('ticker-display-mode') as HTMLSelectElement;

        if (minSizeSelect) {
            minSizeSelect.addEventListener('change', (e) => {
                this.settings.minTradeSize = parseInt((e.target as HTMLSelectElement).value);
                this.saveSettings();
                this.filterAndDisplayTrades();
            });
        }

        if (rateLimitSelect) {
            rateLimitSelect.addEventListener('change', (e) => {
                this.settings.rateLimitMs = parseInt((e.target as HTMLSelectElement).value);
                this.saveSettings();
            });
        }

        if (sideFilterSelect) {
            sideFilterSelect.addEventListener('change', (e) => {
                this.settings.sideFilter = (e.target as HTMLSelectElement).value as 'all' | 'buy' | 'sell';
                this.saveSettings();
                this.filterAndDisplayTrades();
            });
        }

        if (maxDisplaySelect) {
            maxDisplaySelect.addEventListener('change', (e) => {
                this.settings.maxDisplayTrades = parseInt((e.target as HTMLSelectElement).value);
                this.saveSettings();
                this.filterAndDisplayTrades();
            });
        }

        if (displayModeSelect) {
            displayModeSelect.addEventListener('change', (e) => {
                this.settings.displayMode = (e.target as HTMLSelectElement).value as 'unified' | 'separated';
                this.saveSettings();
                this.updateDisplayMode();
            });
        }
    }

    private listenForAssetChanges() {
        document.addEventListener('assetChanged', (event: any) => {
            const newAsset = event.detail.asset;
            if (newAsset !== this.selectedAsset) {
                this.selectedAsset = newAsset;
                this.clearTrades();
                this.reconnectAllExchanges();
            }
        });
    }

    private connectToExchange(exchangeId: string) {
        const config = this.exchangeConfigs.get(exchangeId);
        if (!config) {
            logger.error(`No configuration found for exchange: ${exchangeId}`);
            return;
        }

        // Disconnect if already connected
        this.disconnectFromExchange(exchangeId);

        // Create new connection
        const connection: ExchangeConnection = {
            ws: null,
            isConnected: false,
            lastTradeTime: 0,
            reconnectTimer: null
        };

        try {
            const wsUrl = config.wsUrl(this.selectedAsset);
            logger.log(`Connecting to ${config.name} trade stream: ${wsUrl}`);
            
            connection.ws = new WebSocket(wsUrl);
            
            connection.ws.onopen = () => {
                connection.isConnected = true;
                logger.log(`${config.name} trade ticker connected`);
                this.updateExchangePills();
                this.updateExchangeStatus();
                this.clearReconnectTimer(exchangeId);
            };

            connection.ws.onmessage = (event) => {
                this.handleTradeData(exchangeId, event.data);
            };

            connection.ws.onclose = () => {
                connection.isConnected = false;
                connection.ws = null;
                logger.warn(`${config.name} trade ticker disconnected`);
                this.updateExchangePills();
                this.updateExchangeStatus();
                this.scheduleReconnect(exchangeId);
            };

            connection.ws.onerror = (error) => {
                logger.error(`${config.name} trade ticker WebSocket error:`, error);
                this.updateExchangePills();
            };

            this.connections.set(exchangeId, connection);

        } catch (error) {
            logger.error(`Failed to create ${config.name} trade ticker WebSocket:`, error);
        }
    }

    private disconnectFromExchange(exchangeId: string) {
        const connection = this.connections.get(exchangeId);
        if (connection) {
            if (connection.ws) {
                connection.ws.close();
                connection.ws = null;
            }
            connection.isConnected = false;
            this.clearReconnectTimer(exchangeId);
        }
        this.updateExchangePills();
        this.updateExchangeStatus();
    }

    private handleTradeData(exchangeId: string, data: string) {
        const connection = this.connections.get(exchangeId);
        const config = this.exchangeConfigs.get(exchangeId);
        
        if (!connection || !config) return;

        // Rate limiting check
        const now = Date.now();
        if (now - connection.lastTradeTime < this.settings.rateLimitMs) {
            return;
        }

        const tradeData = config.parseTradeData(data);
        if (!tradeData) return;

        // Apply filters
        if (!this.shouldDisplayTrade(tradeData)) {
            return;
        }

        connection.lastTradeTime = now;
        this.addTrade(tradeData);
    }

    private shouldDisplayTrade(trade: TradeData): boolean {
        // Size filter
        if (trade.value < this.settings.minTradeSize) {
            return false;
        }

        // Side filter
        if (this.settings.sideFilter === 'buy' && !trade.isBuyer) {
            return false;
        }
        if (this.settings.sideFilter === 'sell' && trade.isBuyer) {
            return false;
        }

        return true;
    }

    private addTrade(trade: TradeData) {
        this.trades.unshift(trade); // Add to beginning
        
        // Limit the number of stored trades
        if (this.trades.length > this.settings.maxDisplayTrades * 2) {
            this.trades = this.trades.slice(0, this.settings.maxDisplayTrades);
        }

        this.displayTrade(trade, true);
        this.trimDisplayedTrades();
    }

    private displayTrade(trade: TradeData, isNew = false) {
        const container = document.getElementById('trade-ticker-list');
        if (!container) return;

        // Remove placeholder if it exists
        const placeholder = container.querySelector('.trade-ticker-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const marine = this.getMarineClassification(trade.value);
        const config = this.exchangeConfigs.get(trade.exchange);
        const side = trade.isBuyer ? 'buy' : 'sell';
        const time = new Date(trade.timestamp).toLocaleTimeString([], { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });

        const tradeElement = document.createElement('div');
        tradeElement.className = `trade-item ${side}${isNew ? ' fresh' : ''}`;
        tradeElement.dataset.exchange = trade.exchange;
        
        tradeElement.innerHTML = `
            <div class="trade-marine-icon" title="${marine.name}: $${trade.value.toLocaleString()}">${marine.icon}</div>
            <div class="trade-details">
                <div class="trade-main-info">
                    <div class="trade-price ${side}">$${trade.price.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 8 
                    })}</div>
                    <div class="trade-quantity">${trade.quantity.toFixed(8)} ${trade.symbol.replace('USDT', '')}</div>
                </div>
                <div class="trade-meta">
                    <div class="trade-value">$${trade.value.toLocaleString()}</div>
                    <div class="trade-time">${time}</div>
                </div>
            </div>
            <div class="trade-exchange-label">${config?.name || trade.exchange}</div>
        `;

        // Add to the top of the list
        container.insertBefore(tradeElement, container.firstChild);

        // Remove fresh class after animation
        if (isNew) {
            setTimeout(() => {
                tradeElement.classList.remove('fresh');
            }, 1300);
        }
    }

    private trimDisplayedTrades() {
        const container = document.getElementById('trade-ticker-list');
        if (!container) return;

        const tradeElements = container.querySelectorAll('.trade-item');
        if (tradeElements.length > this.settings.maxDisplayTrades) {
            // Remove excess elements from the bottom
            for (let i = this.settings.maxDisplayTrades; i < tradeElements.length; i++) {
                tradeElements[i].remove();
            }
        }
    }

    private filterAndDisplayTrades() {
        const container = document.getElementById('trade-ticker-list');
        if (!container) return;

        // Clear current display
        container.innerHTML = '';

        // Filter and display trades
        const filteredTrades = this.trades
            .filter(trade => this.shouldDisplayTrade(trade))
            .slice(0, this.settings.maxDisplayTrades);

        if (filteredTrades.length === 0) {
            container.innerHTML = `
                <div class="trade-ticker-placeholder">
                    <div class="placeholder-text">🌊 No trades match current filters</div>
                    <div class="placeholder-subtext">Adjust filters to see more trades</div>
                </div>
            `;
            return;
        }

        filteredTrades.forEach(trade => this.displayTrade(trade, false));
    }

    private updateDisplayMode() {
        // TODO: Implement separated display mode
        logger.log(`Display mode changed to: ${this.settings.displayMode}`);
    }

    private toggleTicker() {
        this.settings.isEnabled = !this.settings.isEnabled;
        this.saveSettings();

        const toggleBtn = document.getElementById('trade-ticker-toggle');
        const statusSpan = toggleBtn?.querySelector('.ticker-status');
        
        if (this.settings.isEnabled) {
            toggleBtn?.classList.add('active');
            if (statusSpan) statusSpan.textContent = 'ON';
            this.connectToAllExchanges();
        } else {
            toggleBtn?.classList.remove('active');
            if (statusSpan) statusSpan.textContent = 'OFF';
            this.disconnectAllExchanges();
        }
    }

    private connectToAllExchanges() {
        this.settings.selectedExchanges.forEach(exchangeId => {
            this.connectToExchange(exchangeId);
        });
    }

    private disconnectAllExchanges() {
        this.connections.forEach((_, exchangeId) => {
            this.disconnectFromExchange(exchangeId);
        });
    }

    private reconnectAllExchanges() {
        this.disconnectAllExchanges();
        if (this.settings.isEnabled) {
            setTimeout(() => this.connectToAllExchanges(), 1000);
        }
    }

    private clearTrades() {
        this.trades = [];
        const container = document.getElementById('trade-ticker-list');
        if (container) {
            container.innerHTML = `
                <div class="trade-ticker-placeholder">
                    <div class="placeholder-text">🌊 Trade history cleared</div>
                    <div class="placeholder-subtext">New trades will appear here</div>
                </div>
            `;
        }
    }

    private showSettings() {
        const filters = document.getElementById('trade-ticker-filters');
        if (filters) {
            const isVisible = filters.style.display !== 'none';
            filters.style.display = isVisible ? 'none' : 'block';
        }
    }

    private scheduleReconnect(exchangeId: string) {
        const connection = this.connections.get(exchangeId);
        if (connection && this.settings.isEnabled && this.settings.selectedExchanges.has(exchangeId)) {
            connection.reconnectTimer = setTimeout(() => {
                logger.log(`Attempting to reconnect ${exchangeId} trade ticker...`);
                this.connectToExchange(exchangeId);
            }, 5000);
        }
    }

    private clearReconnectTimer(exchangeId: string) {
        const connection = this.connections.get(exchangeId);
        if (connection?.reconnectTimer) {
            clearTimeout(connection.reconnectTimer);
            connection.reconnectTimer = null;
        }
    }

    private saveSettings() {
        try {
            const settingsToSave = {
                ...this.settings,
                selectedExchanges: Array.from(this.settings.selectedExchanges)
            };
            localStorage.setItem('multiExchangeTradeTickerSettings', JSON.stringify(settingsToSave));
        } catch (error) {
            logger.warn('Failed to save trade ticker settings:', error);
        }
    }

    private loadSettings() {
        try {
            const saved = localStorage.getItem('multiExchangeTradeTickerSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.settings = {
                    ...this.settings,
                    ...settings,
                    selectedExchanges: new Set(settings.selectedExchanges || ['binance'])
                };
                this.applySavedSettings();
            }
        } catch (error) {
            logger.warn('Failed to load trade ticker settings:', error);
        }
    }

    private applySavedSettings() {
        // Update UI elements to reflect saved settings
        const minSizeSelect = document.getElementById('min-trade-size') as HTMLSelectElement;
        const rateLimitSelect = document.getElementById('trade-rate-limit') as HTMLSelectElement;
        const sideFilterSelect = document.getElementById('trade-side-filter') as HTMLSelectElement;
        const maxDisplaySelect = document.getElementById('max-trades-display') as HTMLSelectElement;
        const displayModeSelect = document.getElementById('ticker-display-mode') as HTMLSelectElement;

        if (minSizeSelect) minSizeSelect.value = this.settings.minTradeSize.toString();
        if (rateLimitSelect) rateLimitSelect.value = this.settings.rateLimitMs.toString();
        if (sideFilterSelect) sideFilterSelect.value = this.settings.sideFilter;
        if (maxDisplaySelect) maxDisplaySelect.value = this.settings.maxDisplayTrades.toString();
        if (displayModeSelect) displayModeSelect.value = this.settings.displayMode;

        // Update toggle button
        const toggleBtn = document.getElementById('trade-ticker-toggle');
        const statusSpan = toggleBtn?.querySelector('.ticker-status');
        
        if (this.settings.isEnabled) {
            toggleBtn?.classList.add('active');
            if (statusSpan) statusSpan.textContent = 'ON';
        } else {
            toggleBtn?.classList.remove('active');
            if (statusSpan) statusSpan.textContent = 'OFF';
        }
    }

    // Public methods
    public start() {
        if (this.settings.isEnabled) {
            this.connectToAllExchanges();
        }
    }

    public setAsset(asset: string) {
        if (asset !== this.selectedAsset) {
            this.selectedAsset = asset;
            this.clearTrades();
            this.reconnectAllExchanges();
        }
    }
}

// Export singleton instance
export const multiExchangeTradeTicker = new MultiExchangeTradeTicker();

// Auto-start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => multiExchangeTradeTicker.start(), 2000);
    });
} else {
    setTimeout(() => multiExchangeTradeTicker.start(), 2000);
} 
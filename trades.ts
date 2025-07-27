// Live Trade Ticker with Marine Animal Classifications
// Connects to Binance trade stream and displays trades with filtering

import { logger } from './utils';

interface TradeData {
    symbol: string;
    price: number;
    quantity: number;
    isBuyer: boolean;
    timestamp: number;
    value: number;
    exchange: string; // Added exchange identifier
}

interface TickerSettings {
    isEnabled: boolean;
    minTradeSize: number;
    rateLimitMs: number;
    sideFilter: 'all' | 'buy' | 'sell';
    maxDisplayTrades: number;
    selectedExchanges: Set<string>; // Added exchange selection
    displayMode: 'unified' | 'separated'; // Added display mode
}

interface ExchangeConnection {
    ws: WebSocket | null;
    isConnected: boolean;
    lastTradeTime: number;
    reconnectTimer: NodeJS.Timeout | null;
}

class TradeTicker {
    private connections: Map<string, ExchangeConnection> = new Map();
    private settings: TickerSettings;
    private trades: TradeData[] = [];
    private selectedAsset = 'BTCUSDT';
    
    // Backward compatibility properties
    private ws: WebSocket | null = null;
    private isConnected: boolean = false;
    private lastTradeTime: number = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;

    constructor() {
        this.settings = {
            isEnabled: true,
            minTradeSize: 1000, // Default $1K+ (Fish)
            rateLimitMs: 2000,  // 1 trade per 2 seconds
            sideFilter: 'all',
            maxDisplayTrades: 50,
            selectedExchanges: new Set(['binance']), // Default to Binance
            displayMode: 'unified'
        };
        
        this.initializeControls();
        this.loadSettings();
        this.initializeExchangePills();
    }

    // Marine Animal Classification System 🌊
    private getMarineClassification(tradeValue: number): { icon: string; name: string; color: string } {
        if (tradeValue >= 50000) {
            return { icon: '🦣', name: 'Mega Whale', color: '#9c27b0' }; // Purple for mega whales
        } else if (tradeValue >= 10000) {
            return { icon: '🐋', name: 'Whale', color: '#3f51b5' }; // Indigo for whales
        } else if (tradeValue >= 5000) {
            return { icon: '🦈', name: 'Shark', color: '#f44336' }; // Red for sharks
        } else if (tradeValue >= 1000) {
            return { icon: '🐟', name: 'Fish', color: '#ff9800' }; // Orange for fish
        } else if (tradeValue >= 100) {
            return { icon: '🐠', name: 'Small Fish', color: '#4caf50' }; // Green for small fish
        } else {
            return { icon: '🦐', name: 'Shrimp', color: '#9e9e9e' }; // Gray for shrimp
        }
    }

    private initializeControls() {
        // Toggle button
        const toggleBtn = document.getElementById('trade-ticker-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTicker());
        }

        // Settings button
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
    }

    private listenForAssetChanges() {
        // Listen for asset changes from the main application
        document.addEventListener('assetChanged', (event: any) => {
            const newAsset = event.detail.asset;
            if (newAsset !== this.selectedAsset) {
                this.selectedAsset = newAsset;
                this.clearTrades();
                if (this.isConnected) {
                    this.disconnect();
                    setTimeout(() => this.connect(), 1000);
                }
            }
        });
    }

    public connect() {
        if (this.ws || !this.settings.isEnabled) return;

        try {
            const wsUrl = `wss://stream.binance.com:9443/ws/${this.selectedAsset.toLowerCase()}@trade`;
            logger.info(`Connecting to trade stream: ${wsUrl}`);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                logger.info('Trade ticker connected to Binance stream');
                this.updateConnectionStatus('Connected', true);
                this.clearReconnectTimer();
            };

            this.ws.onmessage = (event) => {
                this.handleTradeData(event.data);
            };

            this.ws.onclose = () => {
                this.isConnected = false;
                this.ws = null;
                logger.warn('Trade ticker disconnected');
                this.updateConnectionStatus('Disconnected', false);
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                logger.error('Trade ticker WebSocket error:', error);
                this.updateConnectionStatus('Error', false);
            };

        } catch (error) {
            logger.error('Failed to create trade ticker WebSocket:', error);
            this.updateConnectionStatus('Error', false);
        }
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
        this.clearReconnectTimer();
    }

    private handleTradeData(data: string) {
        try {
            const trade = JSON.parse(data);
            
            // Rate limiting check
            const now = Date.now();
            if (now - this.lastTradeTime < this.settings.rateLimitMs) {
                return;
            }

            const tradeData: TradeData = {
                symbol: trade.s,
                price: parseFloat(trade.p),
                quantity: parseFloat(trade.q),
                isBuyer: trade.m === false, // m=true means maker was seller (so taker was buyer)
                timestamp: trade.T,
                value: parseFloat(trade.p) * parseFloat(trade.q),
                exchange: 'binance' // TODO: Get exchange from context
            };

            // Apply filters
            if (!this.shouldDisplayTrade(tradeData)) {
                return;
            }

            this.lastTradeTime = now;
            this.addTrade(tradeData);

        } catch (error) {
            logger.error('Error parsing trade data:', error);
        }
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
        const side = trade.isBuyer ? 'buy' : 'sell';
        const sideText = trade.isBuyer ? 'BUY' : 'SELL';
        const time = new Date(trade.timestamp).toLocaleTimeString([], { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });

        const tradeElement = document.createElement('div');
        tradeElement.className = `trade-item ${side}${isNew ? ' fresh' : ''}`;
        
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

    private toggleTicker() {
        this.settings.isEnabled = !this.settings.isEnabled;
        this.saveSettings();

        const toggleBtn = document.getElementById('trade-ticker-toggle');
        const statusSpan = toggleBtn?.querySelector('.ticker-status');
        
        if (this.settings.isEnabled) {
            toggleBtn?.classList.add('active');
            if (statusSpan) statusSpan.textContent = 'ON';
            this.connect();
        } else {
            toggleBtn?.classList.remove('active');
            if (statusSpan) statusSpan.textContent = 'OFF';
            this.disconnect();
            this.updateConnectionStatus('Disabled', false);
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
        // Toggle the visibility of the filters
        const filters = document.getElementById('trade-ticker-filters');
        if (filters) {
            const isVisible = filters.style.display !== 'none';
            filters.style.display = isVisible ? 'none' : 'block';
        }
    }

    private updateConnectionStatus(status: string, isConnected: boolean) {
        // Update the placeholder text if no trades are displayed
        const container = document.getElementById('trade-ticker-list');
        const placeholder = container?.querySelector('.trade-ticker-placeholder');
        
        if (placeholder) {
            const statusText = placeholder.querySelector('.placeholder-text');
            const subText = placeholder.querySelector('.placeholder-subtext');
            
            if (statusText && subText) {
                if (isConnected) {
                    statusText.textContent = '🌊 Connected - Waiting for trades...';
                    subText.textContent = 'Trades will appear based on your filter settings';
                } else {
                    statusText.textContent = `🔌 ${status}`;
                    subText.textContent = isConnected ? 'Trades will appear here once connected' : 'Check connection and filters';
                }
            }
        }
    }

    private scheduleReconnect() {
        if (this.settings.isEnabled && !this.reconnectTimer) {
            this.reconnectTimer = setTimeout(() => {
                logger.info('Attempting to reconnect trade ticker...');
                this.connect();
            }, 5000);
        }
    }

    private clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    private saveSettings() {
        try {
            localStorage.setItem('tradeTickerSettings', JSON.stringify(this.settings));
        } catch (error) {
            logger.warn('Failed to save trade ticker settings:', error);
        }
    }

    private loadSettings() {
        try {
            const saved = localStorage.getItem('tradeTickerSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.settings = { ...this.settings, ...settings };
                this.applySavedSettings();
            }
        } catch (error) {
            logger.warn('Failed to load trade ticker settings:', error);
        }
    }

    private initializeExchangePills() {
        // Simple implementation for exchange pills
        // Since the main TradeTicker is focused on single exchange (Binance), 
        // we'll just create a basic placeholder or skip this for now
        const container = document.getElementById('ticker-exchange-pills');
        if (!container) {
            // Exchange pills container not needed for main order book
            return;
        }

        container.innerHTML = `
            <div class="ticker-exchange-pill active" data-exchange="binance">
                <span class="ticker-exchange-icon">🟡</span>
                <span>Binance</span>
                <span class="connection-status">●</span>
            </div>
        `;
    }

    private applySavedSettings() {
        // Update UI elements to reflect saved settings
        const minSizeSelect = document.getElementById('min-trade-size') as HTMLSelectElement;
        const rateLimitSelect = document.getElementById('trade-rate-limit') as HTMLSelectElement;
        const sideFilterSelect = document.getElementById('trade-side-filter') as HTMLSelectElement;
        const maxDisplaySelect = document.getElementById('max-trades-display') as HTMLSelectElement;

        if (minSizeSelect) minSizeSelect.value = this.settings.minTradeSize.toString();
        if (rateLimitSelect) rateLimitSelect.value = this.settings.rateLimitMs.toString();
        if (sideFilterSelect) sideFilterSelect.value = this.settings.sideFilter;
        if (maxDisplaySelect) maxDisplaySelect.value = this.settings.maxDisplayTrades.toString();

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

    // Public method to start the ticker
    public start() {
        if (this.settings.isEnabled) {
            this.connect();
        }
    }

    // Public method to update asset (called from main app)
    public setAsset(asset: string) {
        if (asset !== this.selectedAsset) {
            this.selectedAsset = asset;
            this.clearTrades();
            if (this.isConnected) {
                this.disconnect();
                setTimeout(() => this.connect(), 1000);
            }
        }
    }
}

// Export singleton instance
export const tradeTicker = new TradeTicker();

// Auto-start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => tradeTicker.start(), 2000); // Small delay to let main app initialize
    });
} else {
    setTimeout(() => tradeTicker.start(), 2000);
} 
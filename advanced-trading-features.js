/**
 * 🚀 ADVANCED TRADING FEATURES - PROFESSIONAL SUITE
 * Real-time arbitrage detection, market analytics, and trading intelligence
 */

class ArbitrageDetector {
    constructor() {
        this.opportunities = new Map();
        this.profitThreshold = 0.1; // 0.1% minimum profit
        this.notifications = [];
        this.isRunning = false;
        this.stats = {
            totalOpportunities: 0,
            maxProfit: 0,
            avgProfit: 0,
            activeArbs: 0
        };
    }

    start() {
        this.isRunning = true;
        this.scanInterval = setInterval(() => this.scanArbitrageOpportunities(), 1000);
        this.updateUI();
        console.log('🎯 Arbitrage detector started - scanning for profit opportunities...');
    }

    stop() {
        this.isRunning = false;
        if (this.scanInterval) clearInterval(this.scanInterval);
        console.log('⏹️ Arbitrage detector stopped');
    }

    scanArbitrageOpportunities() {
        const exchanges = ['binance', 'bybit', 'gate'];
        const opportunities = [];

        // Get current prices from all exchanges
        const prices = {};
        exchanges.forEach(exchange => {
            const connection = window.activeConnections?.get(exchange);
            if (connection?.bids?.size > 0 && connection?.asks?.size > 0) {
                const bestBid = Math.max(...Array.from(connection.bids.keys()).map(p => parseFloat(p)));
                const bestAsk = Math.min(...Array.from(connection.asks.keys()).map(p => parseFloat(p)));
                prices[exchange] = { bid: bestBid, ask: bestAsk, spread: bestBid - bestAsk };
            }
        });

        // Find arbitrage opportunities
        for (const buyExchange of exchanges) {
            for (const sellExchange of exchanges) {
                if (buyExchange === sellExchange) continue;
                
                const buyPrice = prices[buyExchange]?.ask;
                const sellPrice = prices[sellExchange]?.bid;
                
                if (buyPrice && sellPrice && sellPrice > buyPrice) {
                    const profit = ((sellPrice - buyPrice) / buyPrice) * 100;
                    
                    if (profit > this.profitThreshold) {
                        const opportunity = {
                            id: `${buyExchange}-${sellExchange}`,
                            buyExchange,
                            sellExchange,
                            buyPrice,
                            sellPrice,
                            profit: profit.toFixed(3),
                            timestamp: Date.now(),
                            volume: Math.min(
                                prices[buyExchange]?.askVolume || 1,
                                prices[sellExchange]?.bidVolume || 1
                            )
                        };
                        
                        opportunities.push(opportunity);
                        this.stats.totalOpportunities++;
                        this.stats.maxProfit = Math.max(this.stats.maxProfit, profit);
                        this.stats.activeArbs = opportunities.length;
                    }
                }
            }
        }

        this.opportunities = new Map(opportunities.map(opp => [opp.id, opp]));
        this.updateArbitrageDisplay();
    }

    updateArbitrageDisplay() {
        const container = document.getElementById('arbitrage-opportunities');
        if (!container) return;

        const opportunities = Array.from(this.opportunities.values())
            .sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit))
            .slice(0, 5);

        container.innerHTML = opportunities.map(opp => `
            <div class="arbitrage-opportunity ${parseFloat(opp.profit) > 0.5 ? 'high-profit' : 'low-profit'}">
                <div class="arb-header">
                    <span class="arb-profit">+${opp.profit}%</span>
                    <span class="arb-time">${this.timeAgo(opp.timestamp)}</span>
                </div>
                <div class="arb-details">
                    <div class="arb-trade">
                        <span class="buy-side">BUY ${opp.buyExchange.toUpperCase()}</span>
                        <span class="buy-price">$${opp.buyPrice.toFixed(2)}</span>
                    </div>
                    <div class="arb-arrow">→</div>
                    <div class="arb-trade">
                        <span class="sell-side">SELL ${opp.sellExchange.toUpperCase()}</span>
                        <span class="sell-price">$${opp.sellPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Update stats
        this.updateArbitrageStats();
    }

    updateArbitrageStats() {
        const avgProfit = this.stats.totalOpportunities > 0 
            ? (Array.from(this.opportunities.values()).reduce((sum, opp) => sum + parseFloat(opp.profit), 0) / this.opportunities.size).toFixed(3)
            : '0.000';

        document.getElementById('arb-total')?.updateContent(this.stats.totalOpportunities);
        document.getElementById('arb-active')?.updateContent(this.stats.activeArbs);
        document.getElementById('arb-max-profit')?.updateContent(`${this.stats.maxProfit.toFixed(3)}%`);
        document.getElementById('arb-avg-profit')?.updateContent(`${avgProfit}%`);
    }

    timeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h`;
    }

    updateUI() {
        const status = document.getElementById('arb-status');
        if (status) {
            status.className = `arb-status ${this.isRunning ? 'running' : 'stopped'}`;
            status.textContent = this.isRunning ? 'SCANNING' : 'STOPPED';
        }
    }
}

class MarketAnalytics {
    constructor() {
        this.priceHistory = new Map();
        this.volumeData = new Map();
        this.volatilityData = new Map();
        this.trendIndicators = new Map();
        this.isRunning = false;
    }

    start() {
        this.isRunning = true;
        this.analyticsInterval = setInterval(() => this.updateAnalytics(), 2000);
        console.log('📊 Market analytics engine started');
    }

    stop() {
        this.isRunning = false;
        if (this.analyticsInterval) clearInterval(this.analyticsInterval);
    }

    updateAnalytics() {
        const exchanges = ['binance', 'bybit', 'gate'];
        const timestamp = Date.now();
        
        exchanges.forEach(exchange => {
            const connection = window.activeConnections?.get(exchange);
            if (connection?.bids?.size > 0 && connection?.asks?.size > 0) {
                const midPrice = this.calculateMidPrice(connection);
                const volume = this.calculateVolume(connection);
                const volatility = this.calculateVolatility(exchange, midPrice);
                const trend = this.calculateTrend(exchange, midPrice);

                // Store data
                this.updatePriceHistory(exchange, timestamp, midPrice);
                this.volumeData.set(exchange, volume);
                this.volatilityData.set(exchange, volatility);
                this.trendIndicators.set(exchange, trend);
            }
        });

        this.updateAnalyticsDisplay();
    }

    calculateMidPrice(connection) {
        const bestBid = Math.max(...Array.from(connection.bids.keys()).map(p => parseFloat(p)));
        const bestAsk = Math.min(...Array.from(connection.asks.keys()).map(p => parseFloat(p)));
        return (bestBid + bestAsk) / 2;
    }

    calculateVolume(connection) {
        const bidVolume = Array.from(connection.bids.values()).reduce((sum, vol) => sum + vol, 0);
        const askVolume = Array.from(connection.asks.values()).reduce((sum, vol) => sum + vol, 0);
        return bidVolume + askVolume;
    }

    calculateVolatility(exchange, currentPrice) {
        const history = this.priceHistory.get(exchange) || [];
        if (history.length < 10) return 0;

        const prices = history.slice(-10).map(h => h.price);
        const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
        return Math.sqrt(variance) / mean * 100; // Coefficient of variation as percentage
    }

    calculateTrend(exchange, currentPrice) {
        const history = this.priceHistory.get(exchange) || [];
        if (history.length < 5) return 'neutral';

        const recent = history.slice(-5).map(h => h.price);
        const slope = this.calculateSlope(recent);
        
        if (slope > 0.001) return 'bullish';
        if (slope < -0.001) return 'bearish';
        return 'neutral';
    }

    calculateSlope(prices) {
        const n = prices.length;
        const x = Array.from({length: n}, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = prices.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * prices[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    updatePriceHistory(exchange, timestamp, price) {
        if (!this.priceHistory.has(exchange)) {
            this.priceHistory.set(exchange, []);
        }
        
        const history = this.priceHistory.get(exchange);
        history.push({ timestamp, price });
        
        // Keep only last 100 data points
        if (history.length > 100) {
            history.shift();
        }
    }

    updateAnalyticsDisplay() {
        const container = document.getElementById('market-analytics');
        if (!container) return;

        const exchanges = ['binance', 'bybit', 'gate'];
        container.innerHTML = exchanges.map(exchange => {
            const volume = this.volumeData.get(exchange) || 0;
            const volatility = this.volatilityData.get(exchange) || 0;
            const trend = this.trendIndicators.get(exchange) || 'neutral';
            const history = this.priceHistory.get(exchange) || [];
            const currentPrice = history.length > 0 ? history[history.length - 1].price : 0;
            
            return `
                <div class="analytics-card ${trend}">
                    <div class="exchange-name">${exchange.toUpperCase()}</div>
                    <div class="price-display">$${currentPrice.toFixed(2)}</div>
                    <div class="analytics-metrics">
                        <div class="metric">
                            <span class="metric-label">Trend</span>
                            <span class="metric-value trend-${trend}">
                                ${trend === 'bullish' ? '📈' : trend === 'bearish' ? '📉' : '➡️'} ${trend.toUpperCase()}
                            </span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Volatility</span>
                            <span class="metric-value">${volatility.toFixed(3)}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Volume</span>
                            <span class="metric-value">${volume.toFixed(1)}</span>
                        </div>
                    </div>
                    <div class="mini-chart" data-exchange="${exchange}">
                        ${this.generateMiniChart(history)}
                    </div>
                </div>
            `;
        }).join('');
    }

    generateMiniChart(history) {
        if (history.length < 2) return '<div class="no-data">No data</div>';
        
        const prices = history.slice(-20).map(h => h.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min;
        
        if (range === 0) return '<div class="flat-line"></div>';
        
        const points = prices.map((price, i) => {
            const x = (i / (prices.length - 1)) * 100;
            const y = 100 - ((price - min) / range) * 100;
            return `${x},${y}`;
        }).join(' ');
        
        return `
            <svg viewBox="0 0 100 30" class="price-chart">
                <polyline points="${points}" stroke="currentColor" stroke-width="1" fill="none"/>
            </svg>
        `;
    }
}

class ProfessionalTradingInterface {
    constructor() {
        this.arbitrageDetector = new ArbitrageDetector();
        this.marketAnalytics = new MarketAnalytics();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing Professional Trading Interface...');
        
        await this.createAdvancedUI();
        this.setupEventListeners();
        this.startSystems();
        
        this.isInitialized = true;
        console.log('✅ Professional Trading Interface ready!');
    }

    async createAdvancedUI() {
        // Add advanced trading section after AI trading
        const aiSection = document.getElementById('ai-trading-section');
        if (!aiSection) return;

        const advancedSection = document.createElement('section');
        advancedSection.id = 'advanced-trading-section';
        advancedSection.innerHTML = `
            <div class="section-header">
                <h2>⚡ Professional Trading Suite</h2>
                <div class="trading-status">
                    <span class="status-dot active"></span>
                    <span>LIVE MARKET DATA</span>
                </div>
            </div>
            
            <div class="advanced-trading-grid">
                <!-- Arbitrage Detection Panel -->
                <div class="trading-panel arbitrage-panel">
                    <div class="panel-header">
                        <h3>🎯 Arbitrage Scanner</h3>
                        <div class="arb-controls">
                            <button id="start-arbitrage" class="control-btn start">Start</button>
                            <button id="stop-arbitrage" class="control-btn stop">Stop</button>
                        </div>
                    </div>
                    <div class="arb-stats">
                        <div class="stat-item">
                            <span class="stat-label">Total Found</span>
                            <span id="arb-total" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Active</span>
                            <span id="arb-active" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Max Profit</span>
                            <span id="arb-max-profit" class="stat-value">0.000%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Avg Profit</span>
                            <span id="arb-avg-profit" class="stat-value">0.000%</span>
                        </div>
                    </div>
                    <div id="arbitrage-opportunities" class="opportunities-list">
                        <div class="no-opportunities">🔍 Scanning for opportunities...</div>
                    </div>
                </div>

                <!-- Market Analytics Panel -->
                <div class="trading-panel analytics-panel">
                    <div class="panel-header">
                        <h3>📊 Market Intelligence</h3>
                        <div class="analytics-controls">
                            <button id="start-analytics" class="control-btn start">Analyze</button>
                            <button id="stop-analytics" class="control-btn stop">Stop</button>
                        </div>
                    </div>
                    <div id="market-analytics" class="analytics-grid">
                        <div class="loading-analytics">🧠 Initializing market intelligence...</div>
                    </div>
                </div>

                <!-- Real-time Metrics Panel -->
                <div class="trading-panel metrics-panel">
                    <div class="panel-header">
                        <h3>⚡ Live Metrics</h3>
                    </div>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-icon">📈</div>
                            <div class="metric-content">
                                <div class="metric-label">Market Cap</div>
                                <div class="metric-value" id="market-cap">$2.8T</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">🔥</div>
                            <div class="metric-content">
                                <div class="metric-label">24h Volume</div>
                                <div class="metric-value" id="daily-volume">$145B</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">⚡</div>
                            <div class="metric-content">
                                <div class="metric-label">Network Activity</div>
                                <div class="metric-value" id="network-activity">HIGH</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">🎯</div>
                            <div class="metric-content">
                                <div class="metric-label">Fear & Greed</div>
                                <div class="metric-value" id="fear-greed">72 (GREED)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        aiSection.parentNode.insertBefore(advancedSection, aiSection.nextSibling);
        
        // Add advanced CSS
        await this.addAdvancedCSS();
    }

    async addAdvancedCSS() {
        const style = document.createElement('style');
        style.textContent = `
            #advanced-trading-section {
                margin: 20px 0;
                background: linear-gradient(135deg, #0c1426 0%, #1a1f3a 100%);
                border-radius: 12px;
                border: 1px solid #2a3441;
                overflow: hidden;
            }

            .advanced-trading-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: auto auto;
                gap: 20px;
                padding: 20px;
            }

            .trading-panel {
                background: rgba(255, 255, 255, 0.03);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 16px;
            }

            .arbitrage-panel {
                grid-column: 1;
                grid-row: 1;
            }

            .analytics-panel {
                grid-column: 2;
                grid-row: 1;
            }

            .metrics-panel {
                grid-column: 1 / -1;
                grid-row: 2;
            }

            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .panel-header h3 {
                margin: 0;
                font-size: 1.1rem;
                font-weight: 600;
                color: #e0e0e0;
            }

            .arb-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                margin-bottom: 16px;
            }

            .stat-item {
                text-align: center;
                padding: 8px;
                background: rgba(34, 211, 238, 0.1);
                border-radius: 6px;
                border: 1px solid rgba(34, 211, 238, 0.2);
            }

            .stat-label {
                display: block;
                font-size: 0.7rem;
                color: #22d3ee;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }

            .stat-value {
                display: block;
                font-size: 1rem;
                font-weight: 600;
                color: #fff;
            }

            .opportunities-list {
                max-height: 200px;
                overflow-y: auto;
            }

            .arbitrage-opportunity {
                background: rgba(34, 197, 94, 0.1);
                border: 1px solid rgba(34, 197, 94, 0.3);
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 8px;
                transition: all 0.3s ease;
            }

            .arbitrage-opportunity.high-profit {
                background: rgba(34, 197, 94, 0.2);
                border-color: rgba(34, 197, 94, 0.5);
                box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
            }

            .arb-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .arb-profit {
                font-size: 1.1rem;
                font-weight: 700;
                color: #22c55e;
            }

            .arb-time {
                font-size: 0.8rem;
                color: #888;
            }

            .arb-details {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .arb-trade {
                flex: 1;
                text-align: center;
            }

            .buy-side, .sell-side {
                display: block;
                font-size: 0.8rem;
                font-weight: 600;
                margin-bottom: 4px;
            }

            .buy-side {
                color: #ef4444;
            }

            .sell-side {
                color: #22c55e;
            }

            .buy-price, .sell-price {
                font-size: 0.9rem;
                color: #e0e0e0;
            }

            .arb-arrow {
                font-size: 1.2rem;
                color: #22d3ee;
                font-weight: bold;
            }

            .analytics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
            }

            .analytics-card {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 12px;
                transition: all 0.3s ease;
            }

            .analytics-card.bullish {
                border-color: rgba(34, 197, 94, 0.4);
                background: rgba(34, 197, 94, 0.1);
            }

            .analytics-card.bearish {
                border-color: rgba(239, 68, 68, 0.4);
                background: rgba(239, 68, 68, 0.1);
            }

            .exchange-name {
                font-size: 0.9rem;
                font-weight: 600;
                color: #22d3ee;
                margin-bottom: 4px;
            }

            .price-display {
                font-size: 1.3rem;
                font-weight: 700;
                color: #fff;
                margin-bottom: 8px;
            }

            .analytics-metrics {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 8px;
            }

            .metric {
                text-align: center;
            }

            .metric-label {
                display: block;
                font-size: 0.7rem;
                color: #888;
                margin-bottom: 2px;
            }

            .metric-value {
                display: block;
                font-size: 0.8rem;
                font-weight: 600;
                color: #e0e0e0;
            }

            .trend-bullish {
                color: #22c55e !important;
            }

            .trend-bearish {
                color: #ef4444 !important;
            }

            .trend-neutral {
                color: #888 !important;
            }

            .mini-chart {
                height: 30px;
                margin-top: 8px;
            }

            .price-chart {
                width: 100%;
                height: 100%;
                color: #22d3ee;
            }

            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }

            .metric-card {
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 16px;
                transition: all 0.3s ease;
            }

            .metric-card:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(34, 211, 238, 0.3);
                transform: translateY(-2px);
            }

            .metric-icon {
                font-size: 1.5rem;
            }

            .metric-content {
                flex: 1;
            }

            .metric-content .metric-label {
                font-size: 0.8rem;
                color: #888;
                margin-bottom: 4px;
            }

            .metric-content .metric-value {
                font-size: 1.1rem;
                font-weight: 600;
                color: #e0e0e0;
            }

            .control-btn {
                padding: 6px 12px;
                border: 1px solid;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-left: 4px;
            }

            .control-btn.start {
                background: rgba(34, 197, 94, 0.1);
                border-color: rgba(34, 197, 94, 0.3);
                color: #22c55e;
            }

            .control-btn.start:hover {
                background: rgba(34, 197, 94, 0.2);
            }

            .control-btn.stop {
                background: rgba(239, 68, 68, 0.1);
                border-color: rgba(239, 68, 68, 0.3);
                color: #ef4444;
            }

            .control-btn.stop:hover {
                background: rgba(239, 68, 68, 0.2);
            }

            @media (max-width: 768px) {
                .advanced-trading-grid {
                    grid-template-columns: 1fr;
                }
                
                .arbitrage-panel,
                .analytics-panel,
                .metrics-panel {
                    grid-column: 1;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Arbitrage controls
        document.getElementById('start-arbitrage')?.addEventListener('click', () => {
            this.arbitrageDetector.start();
        });

        document.getElementById('stop-arbitrage')?.addEventListener('click', () => {
            this.arbitrageDetector.stop();
        });

        // Analytics controls
        document.getElementById('start-analytics')?.addEventListener('click', () => {
            this.marketAnalytics.start();
        });

        document.getElementById('stop-analytics')?.addEventListener('click', () => {
            this.marketAnalytics.stop();
        });
    }

    startSystems() {
        // Auto-start after a brief delay
        setTimeout(() => {
            this.arbitrageDetector.start();
            this.marketAnalytics.start();
        }, 2000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        const tradingInterface = new ProfessionalTradingInterface();
        await tradingInterface.initialize();
        
        // Make it globally available
        window.professionalTrading = tradingInterface;
    });
} else {
    // DOM already loaded
    const tradingInterface = new ProfessionalTradingInterface();
    tradingInterface.initialize();
    window.professionalTrading = tradingInterface;
}

// Add helper method to stat elements
HTMLElement.prototype.updateContent = function(value) {
    this.textContent = value;
    this.style.animation = 'flash 0.3s ease';
    setTimeout(() => this.style.animation = '', 300);
};

// Add flash animation
const flashStyle = document.createElement('style');
flashStyle.textContent = `
    @keyframes flash {
        0% { background: rgba(34, 211, 238, 0.3); }
        100% { background: transparent; }
    }
`;
document.head.appendChild(flashStyle); 
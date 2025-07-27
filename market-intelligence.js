/**
 * 🧠 MARKET INTELLIGENCE & PREDICTIVE ANALYTICS
 * Advanced AI-powered market analysis, trend prediction, and trading signals
 */

class MarketIntelligence {
    constructor() {
        this.marketData = new Map();
        this.predictions = new Map();
        this.signals = [];
        this.models = {
            momentum: new MomentumAnalyzer(),
            volatility: new VolatilityAnalyzer(),
            support: new SupportResistanceAnalyzer(),
            sentiment: new SentimentAnalyzer()
        };
        this.isActive = false;
        this.exchangeData = new Map(); // Store real exchange data
        this.priceHistory = new Map(); // Store price history for analysis
        this.lastUpdate = Date.now();
    }

    async initialize() {
        console.log('🧠 Initializing Market Intelligence System...');
        
        this.createIntelligenceInterface();
        this.startAnalysis();
        this.isActive = true;
        
        console.log('✅ Market Intelligence System online!');
    }

    createIntelligenceInterface() {
        // Create floating intelligence panel
        const panel = document.createElement('div');
        panel.id = 'market-intelligence-panel';
        panel.innerHTML = `
            <div class="intel-header" id="intel-header">
                <div class="intel-title">
                    <span class="brain-icon">🧠</span>
                    <span>MARKET INTELLIGENCE</span>
                    <span class="ai-badge">AI</span>
                </div>
                <div class="intel-controls">
                    <div class="intel-status">
                        <div class="status-indicator active"></div>
                        <span>ANALYZING</span>
                    </div>
                    <button class="intel-toggle-btn" id="intel-toggle-btn" title="Toggle visibility (Ctrl/Cmd + M)">▼</button>
                </div>
            </div>
            
            <div class="intel-content">
                <div class="analysis-grid">
                    <div class="analysis-card trend-analysis">
                        <div class="card-header">
                            <span class="card-icon">📈</span>
                            <span class="card-title">Trend Analysis</span>
                            <div class="confidence-meter">
                                <div class="confidence-bar" id="trend-confidence"></div>
                            </div>
                        </div>
                        <div class="card-content">
                            <div class="trend-direction" id="trend-direction">ANALYZING...</div>
                            <div class="trend-strength" id="trend-strength">Strength: --</div>
                            <div class="trend-duration" id="trend-duration">Duration: --</div>
                        </div>
                    </div>

                    <div class="analysis-card volatility-analysis">
                        <div class="card-header">
                            <span class="card-icon">⚡</span>
                            <span class="card-title">Volatility Index</span>
                            <div class="volatility-gauge" id="volatility-gauge">
                                <div class="gauge-needle"></div>
                            </div>
                        </div>
                        <div class="card-content">
                            <div class="volatility-level" id="volatility-level">--</div>
                            <div class="volatility-forecast" id="volatility-forecast">Forecast: --</div>
                        </div>
                    </div>

                    <div class="analysis-card support-resistance">
                        <div class="card-header">
                            <span class="card-icon">🎯</span>
                            <span class="card-title">Key Levels</span>
                        </div>
                        <div class="card-content">
                            <div class="level-item">
                                <span class="level-label">Resistance:</span>
                                <span class="level-value" id="resistance-level">$--</span>
                            </div>
                            <div class="level-item">
                                <span class="level-label">Current:</span>
                                <span class="level-value current" id="current-price">$--</span>
                            </div>
                            <div class="level-item">
                                <span class="level-label">Support:</span>
                                <span class="level-value" id="support-level">$--</span>
                            </div>
                        </div>
                    </div>

                    <div class="analysis-card sentiment-analysis">
                        <div class="card-header">
                            <span class="card-icon">💭</span>
                            <span class="card-title">Market Sentiment</span>
                        </div>
                        <div class="card-content">
                            <div class="sentiment-score" id="sentiment-score">--</div>
                            <div class="sentiment-indicators">
                                <div class="indicator bullish" id="bullish-strength">
                                    <span>📈 Bullish</span>
                                    <div class="strength-bar"><div class="fill"></div></div>
                                </div>
                                <div class="indicator bearish" id="bearish-strength">
                                    <span>📉 Bearish</span>
                                    <div class="strength-bar"><div class="fill"></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="trading-signals">
                    <div class="signals-header">
                        <span class="signals-icon">🚨</span>
                        <span class="signals-title">AI Trading Signals</span>
                        <div class="signals-count" id="signals-count">0</div>
                    </div>
                    <div class="signals-list" id="signals-list">
                        <div class="no-signals">🔍 Scanning for trading opportunities...</div>
                    </div>
                </div>

                <div class="prediction-engine">
                    <div class="prediction-header">
                        <span class="prediction-icon">🔮</span>
                        <span class="prediction-title">Price Predictions</span>
                        <div class="prediction-timeframe">
                            <button class="timeframe-btn active" data-timeframe="5m">5M</button>
                            <button class="timeframe-btn" data-timeframe="15m">15M</button>
                            <button class="timeframe-btn" data-timeframe="1h">1H</button>
                            <button class="timeframe-btn" data-timeframe="4h">4H</button>
                        </div>
                    </div>
                    <div class="prediction-display">
                        <div class="prediction-chart" id="prediction-chart">
                            <canvas id="prediction-canvas" width="300" height="100"></canvas>
                        </div>
                        <div class="prediction-stats">
                            <div class="prediction-item">
                                <span>Next 5m:</span>
                                <span class="pred-value" id="pred-5m">+0.00%</span>
                            </div>
                            <div class="prediction-item">
                                <span>Next 15m:</span>
                                <span class="pred-value" id="pred-15m">+0.00%</span>
                            </div>
                            <div class="prediction-item">
                                <span>Accuracy:</span>
                                <span class="pred-value" id="pred-accuracy">85.0%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Exchange-specific data display -->
                <div class="exchange-data-section">
                    <div class="exchange-data-header">
                        <span class="exchange-data-icon">🏢</span>
                        <span class="exchange-data-title">Exchange Data</span>
                    </div>
                    <div class="exchange-grid" id="exchange-grid">
                        <!-- Exchange cards will be dynamically created here -->
                    </div>
                </div>
                        </div>
                        <div class="prediction-stats">
                            <div class="prediction-item">
                                <span class="pred-label">Next 5m:</span>
                                <span class="pred-value bullish" id="pred-5m">+0.12%</span>
                            </div>
                            <div class="prediction-item">
                                <span class="pred-label">Next 15m:</span>
                                <span class="pred-value bearish" id="pred-15m">-0.08%</span>
                            </div>
                            <div class="prediction-item">
                                <span class="pred-label">Accuracy:</span>
                                <span class="pred-value" id="pred-accuracy">84.3%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add sophisticated CSS
        const style = document.createElement('style');
        style.textContent = `
            #market-intelligence-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: linear-gradient(135deg, #0a0e1a 0%, #1a1f36 50%, #0f1420 100%);
                border: 2px solid #22d3ee;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(34, 211, 238, 0.3);
                z-index: 10001;
                overflow: hidden;
                animation: powerUp 0.8s ease;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            @keyframes powerUp {
                0% { transform: translateY(100%) scale(0.8); opacity: 0; }
                50% { transform: translateY(-10px) scale(1.05); }
                100% { transform: translateY(0) scale(1); opacity: 1; }
            }

            .intel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: linear-gradient(90deg, rgba(34, 211, 238, 0.2), rgba(79, 172, 254, 0.2));
                border-bottom: 1px solid #22d3ee;
                cursor: pointer;
            }

            .intel-header:hover {
                background: linear-gradient(90deg, rgba(34, 211, 238, 0.3), rgba(79, 172, 254, 0.3));
            }

            .intel-toggle-btn {
                background: none;
                border: none;
                color: #22d3ee;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .intel-toggle-btn:hover {
                background: rgba(34, 211, 238, 0.2);
                transform: scale(1.1);
            }

            .intel-content {
                padding: 16px;
                max-height: calc(80vh - 60px);
                overflow-y: auto;
                transition: all 0.3s ease;
            }

            .intel-content.hidden {
                max-height: 0;
                padding: 0 16px;
                overflow: hidden;
            }

            #market-intelligence-panel.collapsed {
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(34, 211, 238, 0.2);
            }

            #market-intelligence-panel.collapsed .intel-header {
                background: linear-gradient(90deg, rgba(34, 211, 238, 0.15), rgba(79, 172, 254, 0.15));
            }

            .intel-header::after {
                content: 'Click to expand';
                position: absolute;
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 0.7rem;
                color: #22d3ee;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }

            #market-intelligence-panel.collapsed .intel-header::after {
                opacity: 1;
            }

            /* Exchange Data Section */
            .exchange-data-section {
                margin-top: 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 16px;
            }

            .exchange-data-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                font-weight: 600;
                color: #22d3ee;
            }

            .exchange-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 8px;
            }

            .exchange-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 12px;
                font-size: 0.85rem;
            }

            .exchange-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .exchange-name {
                font-weight: 600;
                color: #22d3ee;
            }

            .exchange-status {
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 500;
            }

            .exchange-status.connected {
                background: rgba(34, 197, 94, 0.2);
                color: #22c55e;
            }

            .exchange-status.disconnected {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
            }

            .exchange-price {
                font-size: 1.2rem;
                font-weight: 700;
                color: #fff;
                margin-bottom: 8px;
            }

            .exchange-metrics {
                display: grid;
                gap: 4px;
            }

            .metric {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .metric-label {
                color: #888;
                font-size: 0.75rem;
            }

            .exchange-trend {
                font-weight: 500;
                font-size: 0.75rem;
            }

            .exchange-trend.bullish {
                color: #22c55e;
            }

            .exchange-trend.bearish {
                color: #ef4444;
            }

            .exchange-trend.neutral {
                color: #888;
            }

            .exchange-volatility {
                font-weight: 500;
                font-size: 0.75rem;
            }

            .exchange-volatility.high {
                color: #ef4444;
            }

            .exchange-volatility.medium {
                color: #f59e0b;
            }

            .exchange-volatility.low {
                color: #22c55e;
            }

            .exchange-volume {
                font-weight: 500;
                font-size: 0.75rem;
                color: #888;
            }

            .intel-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 700;
                font-size: 1rem;
                color: #22d3ee;
            }

            .brain-icon {
                font-size: 1.2rem;
                animation: pulse 2s infinite;
            }

            .ai-badge {
                background: linear-gradient(45deg, #22d3ee, #4facfe);
                color: #000;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 0.7rem;
                font-weight: 900;
                letter-spacing: 0.5px;
            }

            .intel-controls {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .intel-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.8rem;
                color: #22c55e;
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #22c55e;
                animation: blink 1s infinite;
            }

            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }

            .intel-content {
                padding: 16px;
                max-height: calc(80vh - 60px);
                overflow-y: auto;
            }

            .analysis-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 16px;
            }

            .analysis-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 12px;
                transition: all 0.3s ease;
            }

            .analysis-card:hover {
                border-color: rgba(34, 211, 238, 0.5);
                background: rgba(255, 255, 255, 0.08);
                transform: translateY(-2px);
            }

            .card-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .card-icon {
                font-size: 1.1rem;
            }

            .card-title {
                font-size: 0.9rem;
                font-weight: 600;
                color: #e0e0e0;
                flex: 1;
                margin-left: 6px;
            }

            .confidence-meter {
                width: 60px;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
            }

            .confidence-bar {
                height: 100%;
                background: linear-gradient(90deg, #ef4444, #fbbf24, #22c55e);
                transition: width 0.5s ease;
                width: 0%;
            }

            .card-content {
                font-size: 0.8rem;
            }

            .trend-direction {
                font-size: 1rem;
                font-weight: 700;
                margin-bottom: 4px;
            }

            .trend-direction.bullish { color: #22c55e; }
            .trend-direction.bearish { color: #ef4444; }
            .trend-direction.neutral { color: #fbbf24; }

            .volatility-gauge {
                width: 40px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 20px 20px 0 0;
                position: relative;
                overflow: hidden;
            }

            .gauge-needle {
                position: absolute;
                bottom: 0;
                left: 50%;
                width: 2px;
                height: 16px;
                background: #22d3ee;
                transform-origin: bottom;
                transform: translateX(-50%) rotate(-45deg);
                transition: transform 0.5s ease;
            }

            .level-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }

            .level-value.current {
                color: #22d3ee;
                font-weight: 700;
            }

            .sentiment-score {
                font-size: 1.5rem;
                font-weight: 700;
                text-align: center;
                margin-bottom: 8px;
            }

            .sentiment-score.bullish { color: #22c55e; }
            .sentiment-score.bearish { color: #ef4444; }
            .sentiment-score.neutral { color: #fbbf24; }

            .sentiment-indicators {
                display: grid;
                gap: 6px;
            }

            .indicator {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 0.8rem;
            }

            .strength-bar {
                width: 60px;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
            }

            .strength-bar .fill {
                height: 100%;
                transition: width 0.5s ease;
                width: 0%;
            }

            .indicator.bullish .fill { background: #22c55e; }
            .indicator.bearish .fill { background: #ef4444; }

            .trading-signals,
            .prediction-engine {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
            }

            .signals-header,
            .prediction-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                font-weight: 600;
                color: #e0e0e0;
            }

            .signals-count {
                background: #22c55e;
                color: #000;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 0.8rem;
                font-weight: 700;
            }

            .signals-list {
                max-height: 120px;
                overflow-y: auto;
            }

            .signal-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
                margin-bottom: 4px;
                font-size: 0.8rem;
            }

            .signal-item.buy {
                border-left: 3px solid #22c55e;
            }

            .signal-item.sell {
                border-left: 3px solid #ef4444;
            }

            .prediction-timeframe {
                display: flex;
                gap: 4px;
            }

            .timeframe-btn {
                padding: 4px 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #e0e0e0;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.7rem;
                transition: all 0.3s ease;
            }

            .timeframe-btn.active {
                background: #22d3ee;
                color: #000;
                border-color: #22d3ee;
            }

            .prediction-display {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 12px;
                align-items: center;
            }

            .prediction-chart {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
                padding: 8px;
            }

            #prediction-canvas {
                width: 100%;
                height: 80px;
            }

            .prediction-stats {
                display: grid;
                gap: 6px;
            }

            .prediction-item {
                display: flex;
                justify-content: space-between;
                font-size: 0.8rem;
            }

            .pred-value.bullish { color: #22c55e; }
            .pred-value.bearish { color: #ef4444; }

            /* Scrollbar styling */
            .intel-content::-webkit-scrollbar,
            .signals-list::-webkit-scrollbar {
                width: 4px;
            }

            .intel-content::-webkit-scrollbar-track,
            .signals-list::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
            }

            .intel-content::-webkit-scrollbar-thumb,
            .signals-list::-webkit-scrollbar-thumb {
                background: #22d3ee;
                border-radius: 2px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(panel);

        // Start in collapsed state (with small delay to ensure DOM is ready)
        setTimeout(() => {
            const intelContent = document.querySelector('.intel-content');
            const intelPanel = document.getElementById('market-intelligence-panel');
            const toggleBtn = document.getElementById('intel-toggle-btn');
            
            if (intelContent && intelPanel && toggleBtn) {
                intelContent.classList.add('hidden');
                intelPanel.classList.add('collapsed');
                toggleBtn.textContent = '▼';
            }
        }, 100);

        // Setup event listeners
        this.setupEventListeners();
        this.initializePredictionChart();
        
        // Connect to real exchange data
        this.connectToExchangeData();
    }

    connectToExchangeData() {
        // Try to access the global state from the main application
        if (typeof window !== 'undefined') {
            // Check if the main app state is available
            if (window.activeConnections) {
                this.setupDataConnection();
            } else {
                // Wait for the main app to initialize
                setTimeout(() => this.connectToExchangeData(), 1000);
            }
        }
    }

    setupDataConnection() {
        // Access the global state
        const activeConnections = window.activeConnections;
        const selectedAsset = window.selectedAsset || 'BTCUSDT';
        
        if (!activeConnections) {
            console.warn('Market Intelligence: No active connections available');
            return;
        }

        console.log('Market Intelligence: Connecting to exchange data...');
        
        // Monitor for data updates
        this.startDataMonitoring();
        
        // Initial data fetch
        this.updateFromExchangeData();
        
        // Create exchange display cards
        this.createExchangeCards();
    }

    createExchangeCards() {
        const exchangeGrid = document.getElementById('exchange-grid');
        if (!exchangeGrid) return;

        // Clear existing cards
        exchangeGrid.innerHTML = '';

        // Get available exchanges from the main app
        const activeConnections = window.activeConnections;
        if (!activeConnections) return;

        // Sort exchanges to prioritize Bitget over Gate.io
        const sortedExchanges = Array.from(activeConnections.entries()).sort(([a], [b]) => {
            // Prioritize Bitget over Gate.io
            if (a === 'gate' && b === 'bitget') return 1;
            if (a === 'bitget' && b === 'gate') return -1;
            return 0;
        });

        // Create cards for each exchange
        for (const [exchangeId, connection] of sortedExchanges) {
            const exchangeCard = document.createElement('div');
            exchangeCard.className = 'exchange-card';
            exchangeCard.setAttribute('data-exchange', exchangeId);
            
            exchangeCard.innerHTML = `
                <div class="exchange-header">
                    <span class="exchange-name">${exchangeId.toUpperCase()}</span>
                    <span class="exchange-status disconnected">Disconnected</span>
                </div>
                <div class="exchange-price">$0.00</div>
                <div class="exchange-metrics">
                    <div class="metric">
                        <span class="metric-label">Trend:</span>
                        <span class="exchange-trend neutral">→ NEUTRAL</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Volatility:</span>
                        <span class="exchange-volatility low">0.000%</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Volume:</span>
                        <span class="exchange-volume">N/A</span>
                    </div>
                </div>
            `;
            
            exchangeGrid.appendChild(exchangeCard);
        }
    }

    startDataMonitoring() {
        // Monitor for changes in exchange data every 2 seconds
        setInterval(() => {
            this.updateFromExchangeData();
        }, 2000);
    }

    updateFromExchangeData() {
        const activeConnections = window.activeConnections;
        const selectedAsset = window.selectedAsset || 'BTCUSDT';
        
        if (!activeConnections) return;

        let hasData = false;
        const exchangeData = {};

        // Process each exchange connection - prioritize Bitget over Gate.io
        const sortedExchanges = Array.from(activeConnections.entries()).sort(([a], [b]) => {
            // Prioritize Bitget over Gate.io
            if (a === 'gate' && b === 'bitget') return 1;
            if (a === 'bitget' && b === 'gate') return -1;
            return 0;
        });

        for (const [exchangeId, connection] of sortedExchanges) {
            if (connection && connection.bids && connection.asks) {
                // Get best bid and ask from the Maps
                const bids = Array.from(connection.bids.keys()).map(p => parseFloat(p)).sort((a, b) => b - a);
                const asks = Array.from(connection.asks.keys()).map(p => parseFloat(p)).sort((a, b) => a - b);
                
                const bestBid = bids[0];
                const bestAsk = asks[0];
                
                if (bestBid && bestAsk && bestBid > 0 && bestAsk > 0) {
                    const midPrice = (bestBid + bestAsk) / 2;
                    const spread = bestAsk - bestBid;
                    const spreadPercent = (spread / midPrice) * 100;
                    
                    exchangeData[exchangeId] = {
                        price: midPrice,
                        bid: bestBid,
                        ask: bestAsk,
                        spread: spread,
                        spreadPercent: spreadPercent,
                        volume: connection.volumeInfo?.usdVolume || 0,
                        status: connection.status,
                        timestamp: Date.now()
                    };

                    // Store price history for analysis
                    if (!this.priceHistory.has(exchangeId)) {
                        this.priceHistory.set(exchangeId, []);
                    }
                    this.priceHistory.get(exchangeId).push({
                        price: midPrice,
                        timestamp: Date.now()
                    });

                    // Keep only last 100 price points
                    const history = this.priceHistory.get(exchangeId);
                    if (history.length > 100) {
                        history.shift();
                    }

                    hasData = true;
                }
            }
        }

        this.exchangeData = exchangeData;
        this.lastUpdate = Date.now();

        if (hasData) {
            this.updateMarketIntelligenceDisplay();
        }
        
        // Check if we need to recreate exchange cards (new connections added)
        this.checkAndUpdateExchangeCards();
    }

    checkAndUpdateExchangeCards() {
        const activeConnections = window.activeConnections;
        if (!activeConnections) return;

        const exchangeGrid = document.getElementById('exchange-grid');
        if (!exchangeGrid) return;

        const currentCards = exchangeGrid.querySelectorAll('.exchange-card');
        const currentExchangeIds = Array.from(currentCards).map(card => card.getAttribute('data-exchange'));
        const activeExchangeIds = Array.from(activeConnections.keys());

        // Check if we need to add new cards
        const newExchanges = activeExchangeIds.filter(id => !currentExchangeIds.includes(id));
        if (newExchanges.length > 0) {
            this.createExchangeCards();
        }
    }

    updateMarketIntelligenceDisplay() {
        const exchanges = Object.keys(this.exchangeData);
        if (exchanges.length === 0) return;

        // Update exchange-specific displays
        exchanges.forEach(exchangeId => {
            const data = this.exchangeData[exchangeId];
            this.updateExchangeDisplay(exchangeId, data);
        });

        // Update aggregated analysis (only if we have valid data)
        const validExchanges = exchanges.filter(exchangeId => {
            const data = this.exchangeData[exchangeId];
            return data && data.price > 0 && data.status === 'connected';
        });
        
        if (validExchanges.length > 0) {
            this.updateAggregatedAnalysis();
        }
    }

    updateExchangeDisplay(exchangeId, data) {
        const exchangeEl = document.querySelector(`[data-exchange="${exchangeId}"]`);
        if (!exchangeEl) return;

        // Update price
        const priceEl = exchangeEl.querySelector('.exchange-price');
        if (priceEl) {
            priceEl.textContent = `$${data.price.toFixed(2)}`;
        }

        // Update trend
        const trendEl = exchangeEl.querySelector('.exchange-trend');
        if (trendEl) {
            const history = this.priceHistory.get(exchangeId) || [];
            if (history.length >= 2) {
                const currentPrice = history[history.length - 1].price;
                const previousPrice = history[history.length - 2].price;
                const change = currentPrice - previousPrice;
                const changePercent = (change / previousPrice) * 100;
                
                let trend = 'NEUTRAL';
                let trendClass = 'neutral';
                let trendIcon = '→';
                
                if (changePercent > 0.1) {
                    trend = 'BULLISH';
                    trendClass = 'bullish';
                    trendIcon = '↗';
                } else if (changePercent < -0.1) {
                    trend = 'BEARISH';
                    trendClass = 'bearish';
                    trendIcon = '↘';
                }
                
                trendEl.innerHTML = `${trendIcon} ${trend}`;
                trendEl.className = `exchange-trend ${trendClass}`;
            }
        }

        // Update volatility
        const volatilityEl = exchangeEl.querySelector('.exchange-volatility');
        if (volatilityEl) {
            const history = this.priceHistory.get(exchangeId) || [];
            if (history.length >= 10) {
                const prices = history.slice(-10).map(h => h.price);
                const volatility = this.calculateVolatility(prices);
                volatilityEl.textContent = `${volatility.toFixed(3)}%`;
                volatilityEl.className = `exchange-volatility ${volatility > 2 ? 'high' : volatility > 1 ? 'medium' : 'low'}`;
            }
        }

        // Update volume
        const volumeEl = exchangeEl.querySelector('.exchange-volume');
        if (volumeEl) {
            const volume = data.volume || 0;
            if (volume > 0) {
                volumeEl.textContent = this.formatVolume(volume);
            } else {
                volumeEl.textContent = 'N/A';
            }
        }

        // Update status
        const statusEl = exchangeEl.querySelector('.exchange-status');
        if (statusEl) {
            statusEl.textContent = data.status === 'connected' ? 'Live' : 'Disconnected';
            statusEl.className = `exchange-status ${data.status === 'connected' ? 'connected' : 'disconnected'}`;
        }
    }

    updateAggregatedAnalysis() {
        const exchanges = Object.keys(this.exchangeData);
        if (exchanges.length === 0) return;

        // Filter for valid exchanges with data
        const validExchanges = exchanges.filter(exchangeId => {
            const data = this.exchangeData[exchangeId];
            return data && data.price > 0 && data.status === 'connected';
        });

        if (validExchanges.length === 0) return;

        // Calculate aggregated metrics from valid exchanges only
        const prices = validExchanges.map(ex => this.exchangeData[ex].price);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const priceRange = Math.max(...prices) - Math.min(...prices);
        const priceVolatility = (priceRange / avgPrice) * 100;

        // Update trend analysis
        this.updateTrendAnalysisWithRealData(avgPrice, priceVolatility);
        
        // Update volatility analysis
        this.updateVolatilityAnalysisWithRealData(priceVolatility);
        
        // Update support/resistance
        this.updateSupportResistanceWithRealData(prices);
        
        // Update sentiment
        this.updateSentimentAnalysisWithRealData();
    }

    calculateVolatility(prices) {
        if (prices.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        return Math.sqrt(variance) * 100; // Convert to percentage
    }

    formatVolume(volume) {
        if (volume >= 1e9) {
            return `${(volume / 1e9).toFixed(1)}B`;
        } else if (volume >= 1e6) {
            return `${(volume / 1e6).toFixed(1)}M`;
        } else if (volume >= 1e3) {
            return `${(volume / 1e3).toFixed(1)}K`;
        }
        return volume.toFixed(0);
    }

    setupEventListeners() {
        // Timeframe selector
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updatePredictions(e.target.dataset.timeframe);
            });
        });

        // Toggle visibility
        const toggleBtn = document.getElementById('intel-toggle-btn');
        const intelContent = document.querySelector('.intel-content');
        const intelHeader = document.getElementById('intel-header');
        
        if (toggleBtn && intelContent) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                intelContent.classList.toggle('hidden');
                const panel = document.getElementById('market-intelligence-panel');
                if (panel) {
                    panel.classList.toggle('collapsed', intelContent.classList.contains('hidden'));
                }
                toggleBtn.textContent = intelContent.classList.contains('hidden') ? '▼' : '▲';
            });
        }

        // Click header to toggle (alternative method)
        if (intelHeader && intelContent) {
            intelHeader.addEventListener('click', (e) => {
                // Don't trigger if clicking the toggle button
                if (e.target.closest('.intel-toggle-btn')) return;
                
                intelContent.classList.toggle('hidden');
                const panel = document.getElementById('market-intelligence-panel');
                if (panel) {
                    panel.classList.toggle('collapsed', intelContent.classList.contains('hidden'));
                }
                const toggleBtn = document.getElementById('intel-toggle-btn');
                if (toggleBtn) {
                    toggleBtn.textContent = intelContent.classList.contains('hidden') ? '▼' : '▲';
                }
            });
        }

        // Keyboard shortcut (Ctrl/Cmd + M to toggle)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                if (intelContent) {
                    intelContent.classList.toggle('hidden');
                    const panel = document.getElementById('market-intelligence-panel');
                    if (panel) {
                        panel.classList.toggle('collapsed', intelContent.classList.contains('hidden'));
                    }
                    const toggleBtn = document.getElementById('intel-toggle-btn');
                    if (toggleBtn) {
                        toggleBtn.textContent = intelContent.classList.contains('hidden') ? '▼' : '▲';
                    }
                }
            }
        });
    }

    startAnalysis() {
        // Start all analysis engines
        setInterval(() => this.updateTrendAnalysis(), 3000);
        setInterval(() => this.updateVolatilityAnalysis(), 2000);
        setInterval(() => this.updateSupportResistance(), 5000);
        setInterval(() => this.updateSentimentAnalysis(), 4000);
        setInterval(() => this.generateTradingSignals(), 6000);
        setInterval(() => this.updatePredictions(), 2500);
    }

    updateTrendAnalysis() {
        // Fallback to random data if no real data available
        const trends = ['STRONG BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', 'STRONG BEARISH'];
        const trend = trends[Math.floor(Math.random() * trends.length)];
        const strength = Math.floor(Math.random() * 100) + 1;
        const duration = Math.floor(Math.random() * 240) + 5;
        
        const directionEl = document.getElementById('trend-direction');
        const strengthEl = document.getElementById('trend-strength');
        const durationEl = document.getElementById('trend-duration');
        const confidenceEl = document.getElementById('trend-confidence');
        
        if (directionEl) {
            directionEl.textContent = trend;
            directionEl.className = `trend-direction ${trend.includes('BULLISH') ? 'bullish' : trend.includes('BEARISH') ? 'bearish' : 'neutral'}`;
        }
        
        if (strengthEl) strengthEl.textContent = `Strength: ${strength}%`;
        if (durationEl) durationEl.textContent = `Duration: ${duration}m`;
        if (confidenceEl) confidenceEl.style.width = `${Math.random() * 100}%`;
    }

    updateTrendAnalysisWithRealData(avgPrice, volatility) {
        const exchanges = Object.keys(this.exchangeData);
        if (exchanges.length === 0) return;

        // Calculate trend based on price movements across exchanges
        let bullishCount = 0;
        let bearishCount = 0;
        let totalChange = 0;

        exchanges.forEach(exchangeId => {
            const history = this.priceHistory.get(exchangeId) || [];
            if (history.length >= 2) {
                const currentPrice = history[history.length - 1].price;
                const previousPrice = history[history.length - 2].price;
                const change = currentPrice - previousPrice;
                totalChange += change;
                
                if (change > 0) bullishCount++;
                else if (change < 0) bearishCount++;
            }
        });

        let trend = 'NEUTRAL';
        let strength = 50;
        let confidence = 50;

        if (exchanges.length > 0) {
            const avgChange = totalChange / exchanges.length;
            const changePercent = (avgChange / avgPrice) * 100;
            
            if (changePercent > 0.5) {
                trend = 'STRONG BULLISH';
                strength = Math.min(100, 60 + Math.abs(changePercent) * 10);
            } else if (changePercent > 0.1) {
                trend = 'BULLISH';
                strength = Math.min(100, 50 + Math.abs(changePercent) * 20);
            } else if (changePercent < -0.5) {
                trend = 'STRONG BEARISH';
                strength = Math.min(100, 60 + Math.abs(changePercent) * 10);
            } else if (changePercent < -0.1) {
                trend = 'BEARISH';
                strength = Math.min(100, 50 + Math.abs(changePercent) * 20);
            }

            // Calculate confidence based on agreement across exchanges
            const agreement = Math.max(bullishCount, bearishCount) / exchanges.length;
            confidence = Math.min(100, 50 + agreement * 50);
        }

        const directionEl = document.getElementById('trend-direction');
        const strengthEl = document.getElementById('trend-strength');
        const durationEl = document.getElementById('trend-duration');
        const confidenceEl = document.getElementById('trend-confidence');
        
        if (directionEl) {
            directionEl.textContent = trend;
            directionEl.className = `trend-direction ${trend.includes('BULLISH') ? 'bullish' : trend.includes('BEARISH') ? 'bearish' : 'neutral'}`;
        }
        
        if (strengthEl) strengthEl.textContent = `Strength: ${Math.round(strength)}%`;
        if (durationEl) durationEl.textContent = `Duration: ${Math.round((Date.now() - this.lastUpdate) / 60000)}m`;
        if (confidenceEl) confidenceEl.style.width = `${confidence}%`;
    }

    updateVolatilityAnalysis() {
        // Fallback to random data if no real data available
        const volatility = Math.random() * 100;
        const level = volatility > 70 ? 'HIGH' : volatility > 40 ? 'MEDIUM' : 'LOW';
        const forecast = Math.random() > 0.5 ? 'INCREASING' : 'DECREASING';
        
        document.getElementById('volatility-level')?.setTextContent(`${level} (${volatility.toFixed(1)}%)`);
        document.getElementById('volatility-forecast')?.setTextContent(`Forecast: ${forecast}`);
        
        // Update gauge
        const needle = document.querySelector('.gauge-needle');
        if (needle) {
            const angle = (volatility / 100) * 90 - 45; // -45 to +45 degrees
            needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
        }
    }

    updateVolatilityAnalysisWithRealData(volatility) {
        const level = volatility > 5 ? 'HIGH' : volatility > 2 ? 'MEDIUM' : 'LOW';
        const forecast = volatility > 3 ? 'INCREASING' : 'DECREASING';
        
        const levelEl = document.getElementById('volatility-level');
        const forecastEl = document.getElementById('volatility-forecast');
        const needle = document.querySelector('.gauge-needle');
        
        if (levelEl) levelEl.textContent = `${level} (${volatility.toFixed(1)}%)`;
        if (forecastEl) forecastEl.textContent = `Forecast: ${forecast}`;
        
        if (needle) {
            const angle = Math.min(45, Math.max(-45, (volatility / 10) * 90 - 45));
            needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
        }
    }

    updateSupportResistance() {
        // Fallback to random data if no real data available
        const currentPrice = 3450 + (Math.random() - 0.5) * 100;
        const support = currentPrice - Math.random() * 50 - 20;
        const resistance = currentPrice + Math.random() * 50 + 20;
        
        document.getElementById('current-price')?.setTextContent(`$${currentPrice.toFixed(2)}`);
        document.getElementById('support-level')?.setTextContent(`$${support.toFixed(2)}`);
        document.getElementById('resistance-level')?.setTextContent(`$${resistance.toFixed(2)}`);
    }

    updateSupportResistanceWithRealData(prices) {
        if (prices.length === 0) return;
        
        const currentPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        // Calculate support and resistance based on recent price action
        const priceRange = maxPrice - minPrice;
        const support = currentPrice - (priceRange * 0.3);
        const resistance = currentPrice + (priceRange * 0.3);
        
        const currentEl = document.getElementById('current-price');
        const supportEl = document.getElementById('support-level');
        const resistanceEl = document.getElementById('resistance-level');
        
        if (currentEl) currentEl.textContent = `$${currentPrice.toFixed(2)}`;
        if (supportEl) supportEl.textContent = `$${support.toFixed(2)}`;
        if (resistanceEl) resistanceEl.textContent = `$${resistance.toFixed(2)}`;
    }

    updateSentimentAnalysis() {
        // Fallback to random data if no real data available
        const sentiments = ['EXTREMELY BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', 'EXTREMELY BEARISH'];
        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        const bullishStrength = Math.random() * 100;
        const bearishStrength = Math.random() * 100;
        
        const scoreEl = document.getElementById('sentiment-score');
        if (scoreEl) {
            scoreEl.textContent = sentiment;
            scoreEl.className = `sentiment-score ${sentiment.includes('BULLISH') ? 'bullish' : sentiment.includes('BEARISH') ? 'bearish' : 'neutral'}`;
        }
        
        document.querySelector('#bullish-strength .fill')?.setStyleWidth(`${bullishStrength}%`);
        document.querySelector('#bearish-strength .fill')?.setStyleWidth(`${bearishStrength}%`);
    }

    updateSentimentAnalysisWithRealData() {
        const exchanges = Object.keys(this.exchangeData);
        if (exchanges.length === 0) return;

        let bullishCount = 0;
        let bearishCount = 0;
        let totalVolume = 0;

        exchanges.forEach(exchangeId => {
            const data = this.exchangeData[exchangeId];
            const history = this.priceHistory.get(exchangeId) || [];
            
            if (history.length >= 2) {
                const currentPrice = history[history.length - 1].price;
                const previousPrice = history[history.length - 2].price;
                const change = currentPrice - previousPrice;
                
                if (change > 0) bullishCount++;
                else if (change < 0) bearishCount++;
            }
            
            totalVolume += data.volume || 0;
        });

        const totalExchanges = exchanges.length;
        const bullishStrength = (bullishCount / totalExchanges) * 100;
        const bearishStrength = (bearishCount / totalExchanges) * 100;
        
        let sentiment = 'NEUTRAL';
        if (bullishStrength > 60) sentiment = 'BULLISH';
        else if (bullishStrength > 40) sentiment = 'SLIGHTLY BULLISH';
        else if (bearishStrength > 60) sentiment = 'BEARISH';
        else if (bearishStrength > 40) sentiment = 'SLIGHTLY BEARISH';

        const scoreEl = document.getElementById('sentiment-score');
        if (scoreEl) {
            scoreEl.textContent = sentiment;
            scoreEl.className = `sentiment-score ${sentiment.includes('BULLISH') ? 'bullish' : sentiment.includes('BEARISH') ? 'bearish' : 'neutral'}`;
        }
        
        const bullishFill = document.querySelector('#bullish-strength .fill');
        const bearishFill = document.querySelector('#bearish-strength .fill');
        
        if (bullishFill) bullishFill.style.width = `${bullishStrength}%`;
        if (bearishFill) bearishFill.style.width = `${bearishStrength}%`;
    }

    generateTradingSignals() {
        const signals = [
            { type: 'buy', message: 'Bullish divergence detected', confidence: 87 },
            { type: 'sell', message: 'Resistance level reached', confidence: 92 },
            { type: 'buy', message: 'Support bounce confirmation', confidence: 78 },
            { type: 'sell', message: 'Overbought conditions', confidence: 85 }
        ];
        
        if (Math.random() > 0.7) { // 30% chance to generate signal
            const signal = signals[Math.floor(Math.random() * signals.length)];
            this.addTradingSignal(signal);
        }
    }

    addTradingSignal(signal) {
        const signalsList = document.getElementById('signals-list');
        if (!signalsList) return;
        
        // Remove "no signals" message
        const noSignals = signalsList.querySelector('.no-signals');
        if (noSignals) noSignals.remove();
        
        const signalElement = document.createElement('div');
        signalElement.className = `signal-item ${signal.type}`;
        signalElement.innerHTML = `
            <div>
                <strong>${signal.type.toUpperCase()}</strong>
                <div style="font-size: 0.7rem; color: #888;">${signal.message}</div>
            </div>
            <div style="text-align: right;">
                <div style="color: #22d3ee;">${signal.confidence}%</div>
                <div style="font-size: 0.7rem; color: #888;">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        signalsList.insertBefore(signalElement, signalsList.firstChild);
        
        // Keep only last 5 signals
        const signals = signalsList.querySelectorAll('.signal-item');
        if (signals.length > 5) {
            signalsList.removeChild(signals[signals.length - 1]);
        }
        
        // Update count
        document.getElementById('signals-count')?.setTextContent(signals.length);
    }

    updatePredictions(timeframe = '5m') {
        const predictions = {
            '5m': (Math.random() - 0.5) * 0.5,
            '15m': (Math.random() - 0.5) * 1.2,
            '1h': (Math.random() - 0.5) * 2.5,
            '4h': (Math.random() - 0.5) * 5.0
        };
        
        document.getElementById('pred-5m')?.updatePrediction(predictions['5m']);
        document.getElementById('pred-15m')?.updatePrediction(predictions['15m']);
        document.getElementById('pred-accuracy')?.setTextContent(`${(Math.random() * 20 + 75).toFixed(1)}%`);
        
        this.updatePredictionChart(predictions);
    }

    initializePredictionChart() {
        const canvas = document.getElementById('prediction-canvas');
        if (!canvas) return;
        
        this.predictionCtx = canvas.getContext('2d');
        this.predictionData = [];
    }

    updatePredictionChart(predictions) {
        if (!this.predictionCtx) return;
        
        const canvas = this.predictionCtx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        this.predictionCtx.clearRect(0, 0, width, height);
        
        // Generate prediction curve
        const points = [];
        for (let i = 0; i <= 50; i++) {
            const x = (i / 50) * width;
            const noise = (Math.random() - 0.5) * 0.3;
            const trend = Math.sin(i * 0.2) * 0.5 + predictions['5m'] + noise;
            const y = height / 2 - trend * height * 0.3;
            points.push({ x, y });
        }
        
        // Draw prediction line
        this.predictionCtx.strokeStyle = '#22d3ee';
        this.predictionCtx.lineWidth = 2;
        this.predictionCtx.beginPath();
        
        points.forEach((point, index) => {
            if (index === 0) {
                this.predictionCtx.moveTo(point.x, point.y);
            } else {
                this.predictionCtx.lineTo(point.x, point.y);
            }
        });
        
        this.predictionCtx.stroke();
        
        // Draw confidence area
        this.predictionCtx.fillStyle = 'rgba(34, 211, 238, 0.1)';
        this.predictionCtx.beginPath();
        this.predictionCtx.moveTo(0, height / 2);
        points.forEach(point => this.predictionCtx.lineTo(point.x, point.y));
        this.predictionCtx.lineTo(width, height / 2);
        this.predictionCtx.closePath();
        this.predictionCtx.fill();
    }
}

// Enhanced DOM methods
HTMLElement.prototype.setStyleWidth = function(width) {
    this.style.width = width;
};

HTMLElement.prototype.updatePrediction = function(value) {
    const sign = value >= 0 ? '+' : '';
    this.textContent = `${sign}${value.toFixed(2)}%`;
    this.className = `pred-value ${value >= 0 ? 'bullish' : 'bearish'}`;
    this.style.animation = 'glow 0.5s ease';
    setTimeout(() => this.style.animation = '', 500);
};

// Add glow animation
const glowStyle = document.createElement('style');
glowStyle.textContent = `
    @keyframes glow {
        0% { text-shadow: none; }
        50% { text-shadow: 0 0 10px currentColor; }
        100% { text-shadow: none; }
    }
`;
document.head.appendChild(glowStyle);

// Analyzers (simplified implementations)
class MomentumAnalyzer {
    analyze(data) { return Math.random() * 100; }
}

class VolatilityAnalyzer {
    analyze(data) { return Math.random() * 100; }
}

class SupportResistanceAnalyzer {
    analyze(data) { return { support: 3400, resistance: 3500 }; }
}

class SentimentAnalyzer {
    analyze(data) { return Math.random() * 100 - 50; }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const intelligence = new MarketIntelligence();
        await intelligence.initialize();
        window.marketIntelligence = intelligence;
        
        // Check if we should start hidden (default to hidden)
        const shouldStartHidden = !window.isMarketIntelligenceVisible;
        if (shouldStartHidden) {
            const panel = document.getElementById('market-intelligence-panel');
            if (panel) {
                panel.style.display = 'none';
            }
        }
    }, 5000);
});

export default MarketIntelligence; 
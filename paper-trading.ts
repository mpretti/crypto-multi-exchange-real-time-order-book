// AI Paper Trading Engine
// Simulates trading with different AI strategies and tracks P&L

import { logger } from './utils';
import { SUPPORTED_EXCHANGES_WITH_DEX } from './config';
import { paperTradingDb, type TradeRecord, type PortfolioState, type TradingConfiguration } from './paper-trading-db-client';

interface TradingConfig {
    exchange: string;
    asset: string;
    strategy: string;
    initialCapital: number;
    tradingSpeed: string;
    riskLevel: string;
    positionSize: number;
    aiPersonality: string;
}

interface Portfolio {
    cash: number;
    position: {
        asset: string;
        quantity: number;
        averagePrice: number;
        entryTime: number;
    } | null;
    totalValue: number;
    initialValue: number;
    dayStartValue: number;
}

interface Trade {
    id: string;
    timestamp: number;
    side: 'buy' | 'sell';
    asset: string;
    price: number;
    quantity: number;
    value: number;
    fee: number;
    pnl: number;
    strategy: string;
    reason: string;
}

interface MarketData {
    price: number;
    timestamp: number;
    volume: number;
    bid: number;
    ask: number;
    spread: number;
}

interface ExchangeFees {
    maker: number;
    taker: number;
    note?: string;
}

class TradingStrategy {
    name: string;
    description: string;
    
    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }
    
    // Override in subclasses
    shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig): { should: boolean; confidence: number; reason: string } {
        return { should: false, confidence: 0, reason: "Base strategy - no logic" };
    }
    
    shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig): { should: boolean; confidence: number; reason: string } {
        return { should: false, confidence: 0, reason: "Base strategy - no logic" };
    }
}

class MomentumStrategy extends TradingStrategy {
    constructor() {
        super("Momentum", "Buys when price is trending up, sells when trending down");
    }
    
    shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 5) {
            return { should: false, confidence: 0, reason: "Not enough data" };
        }
        
        const recent = marketData.slice(-5);
        const priceChange = ((recent[4].price - recent[0].price) / recent[0].price) * 100;
        const volumeIncrease = recent[4].volume > recent[0].volume * 1.2;
        
        if (priceChange > 0.5 && volumeIncrease) {
            const confidence = Math.min(priceChange * 10, 80);
            return { 
                should: true, 
                confidence, 
                reason: `Strong upward momentum: +${priceChange.toFixed(2)}% with volume spike` 
            };
        }
        
        return { should: false, confidence: 0, reason: `Weak momentum: ${priceChange.toFixed(2)}%` };
    }
    
    shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 3 || !portfolio.position) {
            return { should: false, confidence: 0, reason: "No position or insufficient data" };
        }
        
        const recent = marketData.slice(-3);
        const priceChange = ((recent[2].price - recent[0].price) / recent[0].price) * 100;
        const currentPnL = (recent[2].price - portfolio.position.averagePrice) / portfolio.position.averagePrice * 100;
        
        // Take profit at 2%
        if (currentPnL > 2) {
            return { 
                should: true, 
                confidence: 90, 
                reason: `Take profit: +${currentPnL.toFixed(2)}%` 
            };
        }
        
        // Stop loss at -1%
        if (currentPnL < -1) {
            return { 
                should: true, 
                confidence: 95, 
                reason: `Stop loss: ${currentPnL.toFixed(2)}%` 
            };
        }
        
        // Momentum reversal
        if (priceChange < -0.3) {
            return { 
                should: true, 
                confidence: 60, 
                reason: `Momentum reversal: ${priceChange.toFixed(2)}%` 
            };
        }
        
        return { should: false, confidence: 0, reason: `Holding: P&L ${currentPnL.toFixed(2)}%` };
    }
}

class MeanReversionStrategy extends TradingStrategy {
    constructor() {
        super("Mean Reversion", "Buys when oversold, sells when overbought");
    }
    
    shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 20) {
            return { should: false, confidence: 0, reason: "Not enough data for mean reversion" };
        }
        
        const prices = marketData.slice(-20).map(d => d.price);
        const mean = prices.reduce((a, b) => a + b) / prices.length;
        const currentPrice = prices[prices.length - 1];
        const deviation = ((currentPrice - mean) / mean) * 100;
        
        if (deviation < -2) {
            const confidence = Math.min(Math.abs(deviation) * 15, 85);
            return { 
                should: true, 
                confidence, 
                reason: `Oversold: ${deviation.toFixed(2)}% below mean` 
            };
        }
        
        return { should: false, confidence: 0, reason: `Price near mean: ${deviation.toFixed(2)}%` };
    }
    
    shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 20 || !portfolio.position) {
            return { should: false, confidence: 0, reason: "No position or insufficient data" };
        }
        
        const prices = marketData.slice(-20).map(d => d.price);
        const mean = prices.reduce((a, b) => a + b) / prices.length;
        const currentPrice = prices[prices.length - 1];
        const deviation = ((currentPrice - mean) / mean) * 100;
        
        if (deviation > 1.5) {
            const confidence = Math.min(deviation * 20, 80);
            return { 
                should: true, 
                confidence, 
                reason: `Overbought: ${deviation.toFixed(2)}% above mean` 
            };
        }
        
        return { should: false, confidence: 0, reason: `Not overbought: ${deviation.toFixed(2)}%` };
    }
}

class WhaleFollowerStrategy extends TradingStrategy {
    constructor() {
        super("Whale Follower", "Follows large trades and whale movements");
    }
    
    shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 2) {
            return { should: false, confidence: 0, reason: "Insufficient data" };
        }
        
        const current = marketData[marketData.length - 1];
        const previous = marketData[marketData.length - 2];
        
        // Look for volume spikes (whale activity)
        const volumeRatio = current.volume / previous.volume;
        const priceMove = ((current.price - previous.price) / previous.price) * 100;
        
        if (volumeRatio > 2 && priceMove > 0.1) {
            const confidence = Math.min(volumeRatio * 15 + priceMove * 10, 85);
            return { 
                should: true, 
                confidence, 
                reason: `Whale activity: ${volumeRatio.toFixed(1)}x volume, +${priceMove.toFixed(2)}%` 
            };
        }
        
        return { should: false, confidence: 0, reason: "No whale activity detected" };
    }
    
    shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 2 || !portfolio.position) {
            return { should: false, confidence: 0, reason: "No position or insufficient data" };
        }
        
        const current = marketData[marketData.length - 1];
        const previous = marketData[marketData.length - 2];
        const volumeRatio = current.volume / previous.volume;
        const priceMove = ((current.price - previous.price) / previous.price) * 100;
        
        // Whale dumping
        if (volumeRatio > 2 && priceMove < -0.1) {
            return { 
                should: true, 
                confidence: 80, 
                reason: `Whale dumping: ${volumeRatio.toFixed(1)}x volume, ${priceMove.toFixed(2)}%` 
            };
        }
        
        return { should: false, confidence: 0, reason: "No whale selling detected" };
    }
}

class PaperTradingEngine {
    private config: TradingConfig;
    private portfolio: Portfolio;
    private trades: Trade[] = [];
    private marketData: MarketData[] = [];
    private strategies: Map<string, TradingStrategy> = new Map();
    private isRunning = false;
    private cachedFees: ExchangeFees | null = null;
    private chartPositionOverlay = false;
    private tradingTimer: NodeJS.Timeout | null = null;
    private priceSubscription: any = null;
    private databaseMode = false; // Use database if available, localStorage as fallback
    private sessionId: string; // Unique session ID for multi-agent support
    private eventEmitter: any = null; // For communicating with multi-agent manager

    constructor(sessionId?: string) {
        this.sessionId = sessionId || `default_${Date.now()}`;
        
        this.config = {
            exchange: 'binance',
            asset: 'BTCUSDT',
            strategy: 'momentum',
            initialCapital: 10000,
            tradingSpeed: 'moderate',
            riskLevel: 'medium',
            positionSize: 10,
            aiPersonality: 'balanced'
        };
        
        this.portfolio = {
            cash: this.config.initialCapital,
            position: null,
            totalValue: this.config.initialCapital,
            initialValue: this.config.initialCapital,
            dayStartValue: this.config.initialCapital
        };
        
        this.initializeStrategies();
        
        // Only initialize UI for the default session to avoid conflicts
        if (sessionId === undefined || sessionId === 'default') {
            this.initializeUI();
        }
        
        this.initializeDatabase();
        this.initializeEventEmitter();
    }
    
    private initializeEventEmitter() {
        // Simple event emitter for multi-agent communication
        this.eventEmitter = {
            listeners: new Map(),
            on: (event: string, callback: Function) => {
                if (!this.eventEmitter.listeners.has(event)) {
                    this.eventEmitter.listeners.set(event, []);
                }
                this.eventEmitter.listeners.get(event).push(callback);
            },
            emit: (event: string, data: any) => {
                const callbacks = this.eventEmitter.listeners.get(event) || [];
                callbacks.forEach((callback: Function) => callback(data));
            }
        };
    }
    
    private initializeStrategies() {
        this.strategies.set('momentum', new MomentumStrategy());
        this.strategies.set('meanReversion', new MeanReversionStrategy());
        this.strategies.set('whale', new WhaleFollowerStrategy());
        
        // TODO: Add more strategies
        // this.strategies.set('arbitrage', new ArbitrageStrategy());
        // this.strategies.set('scalper', new ScalperStrategy());
        // this.strategies.set('sentiment', new SentimentStrategy());
        // this.strategies.set('neural', new NeuralNetworkStrategy());
    }
    
    private async initializeDatabase() {
        try {
            // Check if database backend is available
            this.databaseMode = await paperTradingDb.isBackendAvailable();
            
            if (this.databaseMode) {
                logger.log('Paper Trading: Database backend available, enabling database persistence');
                
                // Try to migrate existing localStorage data
                await paperTradingDb.migrateFromLocalStorage();
                
                // Load state from database
                await this.loadStateFromDatabase();
            } else {
                logger.log('Paper Trading: Database backend not available, using localStorage');
                this.loadStateFromLocalStorage();
            }
        } catch (error) {
            logger.error('Paper Trading: Database initialization failed, falling back to localStorage:', error);
            this.databaseMode = false;
            this.loadStateFromLocalStorage();
        }
    }
    
    private initializeUI() {
        // Control buttons
        const startBtn = document.getElementById('start-trading-btn');
        const stopBtn = document.getElementById('stop-trading-btn');
        const resetBtn = document.getElementById('reset-trading-btn');
        
        if (startBtn) startBtn.addEventListener('click', () => this.startTrading());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopTrading());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetPortfolio());
        
        // Configuration selectors
        const configElements = [
            'trading-exchange', 'trading-asset', 'trading-strategy', 'initial-capital',
            'trading-speed', 'risk-level', 'position-size', 'ai-personality'
        ];
        
        configElements.forEach(id => {
            const element = document.getElementById(id) as HTMLSelectElement;
            if (element) {
                element.addEventListener('change', async () => await this.updateConfig());
            }
        });
        
        // History buttons
        const exportBtn = document.getElementById('export-trades-btn');
        const clearBtn = document.getElementById('clear-history-btn');
        
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportTrades());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearHistory());
        
        this.updateUI();
    }
    
    private async updateConfig() {
        const getSelectValue = (id: string) => {
            const element = document.getElementById(id) as HTMLSelectElement;
            return element ? element.value : '';
        };
        
        this.config.exchange = getSelectValue('trading-exchange');
        this.config.asset = getSelectValue('trading-asset');
        this.config.strategy = getSelectValue('trading-strategy');
        this.config.initialCapital = parseInt(getSelectValue('initial-capital'));
        this.config.tradingSpeed = getSelectValue('trading-speed');
        this.config.riskLevel = getSelectValue('risk-level');
        this.config.positionSize = parseInt(getSelectValue('position-size'));
        this.config.aiPersonality = getSelectValue('ai-personality');
        
        // Update chart overlay setting
        const chartToggle = document.getElementById('chart-overlay-toggle') as HTMLInputElement;
        this.chartPositionOverlay = chartToggle?.checked || false;
        
        if (this.databaseMode) {
            await paperTradingDb.saveConfiguration(this.config);
            await paperTradingDb.saveAgentLog('config_change', `🔧 Configuration updated: ${this.config.exchange} - ${this.config.asset}`);
        }
        
        await this.saveState();
        this.updateThoughts(`🔧 Configuration updated: ${this.config.exchange} - ${this.config.asset}`);
    }
    
    public startTrading() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.updateAgentStatus('active', 'Trading');
        this.updateThoughts('🚀 Starting trading operations...');
        this.addAction('🟢 Trading agent started');
        
        // Subscribe to market data
        this.subscribeToMarketData();
        
        // Start trading loop
        const intervals = {
            conservative: 5 * 60 * 1000, // 5 minutes
            moderate: 60 * 1000,         // 1 minute
            aggressive: 30 * 1000,       // 30 seconds
            extreme: 10 * 1000           // 10 seconds
        };
        
        const interval = intervals[this.config.tradingSpeed as keyof typeof intervals] || intervals.moderate;
        
        this.tradingTimer = setInterval(async () => {
            await this.runTradingLogic();
        }, interval);
        
        // Update UI
        const startBtn = document.getElementById('start-trading-btn') as HTMLButtonElement;
        const stopBtn = document.getElementById('stop-trading-btn') as HTMLButtonElement;
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        
        logger.log('Paper trading started');
    }
    
    public stopTrading() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.updateAgentStatus('inactive', 'Stopped');
        this.updateThoughts('⏹️ Trading operations stopped');
        this.addAction('🔴 Trading agent stopped');
        
        // Clear timer
        if (this.tradingTimer) {
            clearInterval(this.tradingTimer);
            this.tradingTimer = null;
        }
        
        // Unsubscribe from market data
        this.unsubscribeFromMarketData();
        
        // Update UI
        const startBtn = document.getElementById('start-trading-btn') as HTMLButtonElement;
        const stopBtn = document.getElementById('stop-trading-btn') as HTMLButtonElement;
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        
        logger.log('Paper trading stopped');
    }
    
    private subscribeToMarketData() {
        // Subscribe to real market data from the order book
        // This connects to the same data feed as the main app
        document.addEventListener('marketDataUpdate', (event: any) => {
            const { price, volume, bid, ask } = event.detail;
            
            this.marketData.push({
                price: parseFloat(price),
                timestamp: Date.now(),
                volume: parseFloat(volume) || 1000,
                bid: parseFloat(bid) || price * 0.999,
                ask: parseFloat(ask) || price * 1.001,
                spread: ((ask - bid) / bid) * 100
            });
            
            // Keep only last 100 data points
            if (this.marketData.length > 100) {
                this.marketData = this.marketData.slice(-100);
            }
        });
        
        // Fallback: simulate market data if no real data available
        setTimeout(() => {
            if (this.marketData.length === 0) {
                this.simulateMarketData();
            }
        }, 5000);
    }
    
    private simulateMarketData() {
        // Generate realistic market data for demo purposes
        let basePrice = 45000; // BTC base price
        let price = basePrice;
        
        const dataInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(dataInterval);
                return;
            }
            
            // Random walk with trend
            const change = (Math.random() - 0.5) * 200; // ±$100
            price = Math.max(price + change, basePrice * 0.8); // Don't go below 80% of base
            
            const volume = 1000 + Math.random() * 5000; // Random volume
            const spread = 0.01 + Math.random() * 0.05; // 0.01-0.06% spread
            
            this.marketData.push({
                price,
                timestamp: Date.now(),
                volume,
                bid: price * (1 - spread / 200),
                ask: price * (1 + spread / 200),
                spread
            });
            
            // Keep only last 100 data points
            if (this.marketData.length > 100) {
                this.marketData = this.marketData.slice(-100);
            }
        }, 2000); // New data every 2 seconds
    }
    
    private unsubscribeFromMarketData() {
        // Remove event listeners
        document.removeEventListener('marketDataUpdate', () => {});
    }
    
    private async runTradingLogic() {
        if (!this.isRunning || this.marketData.length < 5) {
            return;
        }
        
        const strategy = this.strategies.get(this.config.strategy);
        if (!strategy) {
            this.updateThoughts('❌ Unknown strategy selected');
            return;
        }
        
        const currentPrice = this.marketData[this.marketData.length - 1].price;
        this.updatePortfolioValue(currentPrice);
        
        // Check if we should make a trade
        if (this.portfolio.position === null) {
            // No position - check if we should buy
            const buyDecision = strategy.shouldBuy(this.marketData, this.portfolio, this.config);
            
            if (buyDecision.should && buyDecision.confidence > 50) {
                await this.executeBuy(currentPrice, buyDecision.reason);
            } else {
                this.updateThoughts(`💭 "${buyDecision.reason}" (${buyDecision.confidence}% confidence)`);
            }
        } else {
            // Have position - check if we should sell
            const sellDecision = strategy.shouldSell(this.marketData, this.portfolio, this.config);
            
            if (sellDecision.should && sellDecision.confidence > 50) {
                await this.executeSell(currentPrice, sellDecision.reason);
            } else {
                this.updateThoughts(`🤔 "${sellDecision.reason}" (${sellDecision.confidence}% confidence)`);
            }
        }
        
        this.updateUI();
    }
    
    private async executeBuy(price: number, reason: string) {
        const cashToUse = this.portfolio.cash * (this.config.positionSize / 100);
        
        // Get real exchange fees
        if (!this.cachedFees) {
            this.cachedFees = await this.getExchangeFees(this.config.exchange);
        }
        
        // Use taker fee for market orders (most conservative)
        const feeRate = this.cachedFees.taker;
        const fee = cashToUse * feeRate;
        const quantity = (cashToUse - fee) / price;
        
        if (quantity <= 0 || cashToUse > this.portfolio.cash) {
            this.updateThoughts('❌ Insufficient funds for buy order');
            return;
        }
        
        // Execute trade
        const trade: Trade = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            side: 'buy',
            asset: this.config.asset,
            price,
            quantity,
            value: cashToUse,
            fee,
            pnl: 0,
            strategy: this.config.strategy,
            reason
        };
        
        // Update portfolio
        this.portfolio.cash -= cashToUse;
        this.portfolio.position = {
            asset: this.config.asset,
            quantity,
            averagePrice: price,
            entryTime: Date.now()
        };
        
        this.trades.push(trade);
        this.sendChartTradeMarker(trade);
        this.addAction(`🟢 BUY ${quantity.toFixed(6)} ${this.config.asset} @ $${price.toFixed(2)}`);
        this.updateThoughts(`✅ Bought! Reason: ${reason}`);
        
        // Save trade to database if available
        if (this.databaseMode) {
            await paperTradingDb.saveTrade(trade);
            await paperTradingDb.saveAgentLog('action', `🟢 BUY ${quantity.toFixed(6)} ${this.config.asset} @ $${price.toFixed(2)}`);
        }
        
        logger.log(`Paper trade executed: BUY ${quantity} @ ${price}`);
        await this.saveState();
    }
    
    private async executeSell(price: number, reason: string) {
        if (!this.portfolio.position) return;
        
        const quantity = this.portfolio.position.quantity;
        const value = quantity * price;
        
        // Get real exchange fees
        if (!this.cachedFees) {
            this.cachedFees = await this.getExchangeFees(this.config.exchange);
        }
        
        // Use taker fee for market orders (most conservative)
        const feeRate = this.cachedFees.taker;
        const fee = value * feeRate;
        const netValue = value - fee;
        
        const costBasis = this.portfolio.position.quantity * this.portfolio.position.averagePrice;
        const pnl = netValue - costBasis;
        
        // Execute trade
        const trade: Trade = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            side: 'sell',
            asset: this.config.asset,
            price,
            quantity,
            value: netValue,
            fee,
            pnl,
            strategy: this.config.strategy,
            reason
        };
        
        // Update portfolio
        this.portfolio.cash += netValue;
        this.portfolio.position = null;
        
        this.trades.push(trade);
        this.sendChartTradeMarker(trade);
        this.addAction(`🔴 SELL ${quantity.toFixed(6)} ${this.config.asset} @ $${price.toFixed(2)} (P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`);
        this.updateThoughts(`✅ Sold! P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}. Reason: ${reason}`);
        
        // Save trade to database if available
        if (this.databaseMode) {
            await paperTradingDb.saveTrade(trade);
            await paperTradingDb.saveAgentLog('action', `🔴 SELL ${quantity.toFixed(6)} ${this.config.asset} @ $${price.toFixed(2)} (P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})`);
        }
        
        logger.log(`Paper trade executed: SELL ${quantity} @ ${price}, P&L: ${pnl}`);
        await this.saveState();
    }
    
    private updatePortfolioValue(currentPrice: number) {
        let totalValue = this.portfolio.cash;
        
        if (this.portfolio.position) {
            totalValue += this.portfolio.position.quantity * currentPrice;
        }
        
        this.portfolio.totalValue = totalValue;
    }
    
    private async getExchangeFees(exchangeId: string): Promise<ExchangeFees> {
        // Default fallback fees
        const defaultFees: ExchangeFees = { maker: 0.001, taker: 0.001, note: "Default 0.1% fee" };
        
        try {
            const exchangeConfig = SUPPORTED_EXCHANGES_WITH_DEX[exchangeId];
            if (!exchangeConfig || !exchangeConfig.fetchFeeInfo) {
                logger.warn(`No fee info available for ${exchangeId}, using default`);
                return defaultFees;
            }
            
            const feeInfo = await exchangeConfig.fetchFeeInfo(this.config.asset.toLowerCase());
            if (!feeInfo) {
                logger.warn(`Failed to fetch fee info for ${exchangeId}, using default`);
                return defaultFees;
            }
            
            // Parse the fee strings (e.g., "0.1%" -> 0.001)
            const parseFeeString = (feeStr: string): number => {
                const match = feeStr.match(/([0-9.]+)%/);
                if (match) {
                    return parseFloat(match[1]) / 100;
                }
                // Handle range fees (e.g., "0.015% - 0.098%") - use the higher rate for simulation
                const rangeMatch = feeStr.match(/([0-9.]+)%\s*-\s*([0-9.]+)%/);
                if (rangeMatch) {
                    return parseFloat(rangeMatch[2]) / 100; // Use higher rate
                }
                // Handle negative fees (maker rebates)
                const negativeMatch = feeStr.match(/-([0-9.]+)%/);
                if (negativeMatch) {
                    return -parseFloat(negativeMatch[1]) / 100;
                }
                return 0.001; // 0.1% fallback
            };
            
            const makerFee = parseFeeString(String(feeInfo.makerRate || "0.1%"));
            const takerFee = parseFeeString(String(feeInfo.takerRate || "0.1%"));
            
            logger.log(`Loaded fees for ${exchangeId}: Maker ${(makerFee * 100).toFixed(3)}%, Taker ${(takerFee * 100).toFixed(3)}%`);
            
            return {
                maker: makerFee,
                taker: takerFee,
                note: feeInfo.raw?.note || `${exchangeId} fees`
            };
        } catch (error) {
            logger.error(`Error loading fees for ${exchangeId}:`, error);
            return defaultFees;
        }
    }
    
    private updateUI() {
        this.updatePortfolioStats();
        this.updateTradesTable();
        this.sendChartPositionUpdate();
    }
    
    private sendChartTradeMarker(trade: Trade) {
        if (!this.chartPositionOverlay) return;
        
        // Send custom event to chart system
        const chartEvent = new CustomEvent('paperTradingMarker', {
            detail: {
                type: 'trade',
                timestamp: trade.timestamp,
                price: trade.price,
                side: trade.side,
                asset: trade.asset,
                quantity: trade.quantity,
                value: trade.value,
                pnl: trade.pnl,
                reason: trade.reason,
                exchange: this.config.exchange
            }
        });
        document.dispatchEvent(chartEvent);
        
        logger.log(`Chart: Sent ${trade.side} marker at $${trade.price.toFixed(2)}`);
    }
    
    private sendChartPositionUpdate() {
        if (!this.chartPositionOverlay) return;
        
        const currentPrice = this.marketData.length > 0 ? this.marketData[this.marketData.length - 1].price : 0;
        
        const chartEvent = new CustomEvent('paperTradingPosition', {
            detail: {
                type: 'position',
                position: this.portfolio.position,
                totalValue: this.portfolio.totalValue,
                cash: this.portfolio.cash,
                currentPrice: currentPrice,
                exchange: this.config.exchange,
                strategy: this.config.strategy
            }
        });
        document.dispatchEvent(chartEvent);
    }
    
    private updatePortfolioStats() {
        const portfolioValueEl = document.getElementById('portfolio-value');
        const portfolioChangeEl = document.getElementById('portfolio-change');
        const currentPositionEl = document.getElementById('current-position');
        const positionPnlEl = document.getElementById('position-pnl');
        const totalTradesEl = document.getElementById('total-trades');
        const winRateEl = document.getElementById('win-rate');
        const dailyPnlEl = document.getElementById('daily-pnl');
        const dailyChangeEl = document.getElementById('daily-change');
        
        if (portfolioValueEl) {
            portfolioValueEl.textContent = `$${this.portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        
        if (portfolioChangeEl) {
            const change = this.portfolio.totalValue - this.portfolio.initialValue;
            const changePercent = (change / this.portfolio.initialValue) * 100;
            portfolioChangeEl.textContent = `${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
            portfolioChangeEl.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
        
        if (currentPositionEl && positionPnlEl) {
            if (this.portfolio.position) {
                const currentPrice = this.marketData.length > 0 ? this.marketData[this.marketData.length - 1].price : 0;
                const positionValue = this.portfolio.position.quantity * currentPrice;
                const costBasis = this.portfolio.position.quantity * this.portfolio.position.averagePrice;
                const unrealizedPnl = positionValue - costBasis;
                
                currentPositionEl.textContent = `${this.portfolio.position.quantity.toFixed(6)} ${this.config.asset}`;
                positionPnlEl.textContent = `${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toFixed(2)}`;
                positionPnlEl.className = `stat-change ${unrealizedPnl >= 0 ? 'positive' : 'negative'}`;
            } else {
                currentPositionEl.textContent = 'No Position';
                positionPnlEl.textContent = '$0.00';
                positionPnlEl.className = 'stat-change neutral';
            }
        }
        
        if (totalTradesEl && winRateEl) {
            const completedTrades = this.trades.filter(t => t.side === 'sell');
            const winningTrades = completedTrades.filter(t => t.pnl > 0);
            const winRate = completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0;
            
            totalTradesEl.textContent = completedTrades.length.toString();
            winRateEl.textContent = `${winRate.toFixed(1)}% Win Rate`;
        }
        
        if (dailyPnlEl && dailyChangeEl) {
            const dailyPnl = this.portfolio.totalValue - this.portfolio.dayStartValue;
            const dailyPercent = (dailyPnl / this.portfolio.dayStartValue) * 100;
            
            dailyPnlEl.textContent = `${dailyPnl >= 0 ? '+' : ''}$${dailyPnl.toFixed(2)}`;
            dailyChangeEl.textContent = `${dailyPercent >= 0 ? '+' : ''}${dailyPercent.toFixed(2)}%`;
            
            dailyPnlEl.className = `stat-value ${dailyPnl >= 0 ? 'positive' : 'negative'}`;
            dailyChangeEl.className = `stat-change ${dailyPnl >= 0 ? 'positive' : 'negative'}`;
        }
    }
    
    private updateTradesTable() {
        const tbody = document.getElementById('trades-table-body');
        if (!tbody) return;
        
        if (this.trades.length === 0) {
            tbody.innerHTML = '<tr class="no-trades"><td colspan="8">No trades yet - start the agent to begin trading</td></tr>';
            return;
        }
        
        // Show last 20 trades
        const recentTrades = this.trades.slice(-20).reverse();
        
        tbody.innerHTML = recentTrades.map(trade => {
            const time = new Date(trade.timestamp).toLocaleTimeString();
            const pnlClass = trade.pnl > 0 ? 'trade-pnl-positive' : trade.pnl < 0 ? 'trade-pnl-negative' : 'trade-pnl-neutral';
            const sideClass = trade.side === 'buy' ? 'trade-side-buy' : 'trade-side-sell';
            
            return `
                <tr>
                    <td>${time}</td>
                    <td class="${sideClass}">${trade.side.toUpperCase()}</td>
                    <td>${trade.asset}</td>
                    <td>$${trade.price.toFixed(2)}</td>
                    <td>${trade.quantity.toFixed(6)}</td>
                    <td>$${trade.value.toFixed(2)}</td>
                    <td class="${pnlClass}">$${trade.pnl.toFixed(2)}</td>
                    <td>${trade.strategy}</td>
                </tr>
            `;
        }).join('');
    }
    
    private updateAgentStatus(status: 'inactive' | 'active' | 'error', text: string) {
        const indicator = document.getElementById('agent-indicator');
        if (!indicator) return;
        
        const dot = indicator.querySelector('.status-dot');
        const statusText = indicator.querySelector('.status-text');
        
        if (dot) {
            dot.className = `status-dot ${status}`;
        }
        
        if (statusText) {
            statusText.textContent = text;
        }
    }
    
    private updateThoughts(thought: string) {
        const thoughtsEl = document.getElementById('agent-thoughts');
        if (!thoughtsEl) return;
        
        thoughtsEl.innerHTML = `<div class="thought-bubble">${thought}</div>`;
    }
    
    private addAction(action: string) {
        const actionsEl = document.querySelector('.action-list');
        if (!actionsEl) return;
        
        // Remove placeholder
        const placeholder = actionsEl.querySelector('.placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Add new action
        const actionEl = document.createElement('div');
        actionEl.className = 'action-item';
        actionEl.textContent = `${new Date().toLocaleTimeString()} - ${action}`;
        
        // Add to top
        actionsEl.insertBefore(actionEl, actionsEl.firstChild);
        
        // Keep only last 10 actions
        const actions = actionsEl.querySelectorAll('.action-item');
        if (actions.length > 10) {
            actions[actions.length - 1].remove();
        }
    }
    
    private resetPortfolio() {
        if (this.isRunning) {
            this.stopTrading();
        }
        
        this.portfolio = {
            cash: this.config.initialCapital,
            position: null,
            totalValue: this.config.initialCapital,
            initialValue: this.config.initialCapital,
            dayStartValue: this.config.initialCapital
        };
        
        this.trades = [];
        this.marketData = [];
        
        this.updateThoughts('🔄 Portfolio reset to initial state');
        this.addAction('🔄 Portfolio reset');
        this.updateUI();
        this.saveState();
        
        logger.log('Portfolio reset');
    }
    
    private exportTrades() {
        if (this.trades.length === 0) {
            alert('No trades to export');
            return;
        }
        
        const csvContent = [
            'Timestamp,Side,Asset,Price,Quantity,Value,Fee,PnL,Strategy,Reason',
            ...this.trades.map(trade => 
                `${new Date(trade.timestamp).toISOString()},${trade.side},${trade.asset},${trade.price},${trade.quantity},${trade.value},${trade.fee},${trade.pnl},${trade.strategy},"${trade.reason}"`
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `paper-trades-${Date.now()}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    private clearHistory() {
        if (confirm('Are you sure you want to clear all trading history?')) {
            this.trades = [];
            this.updateUI();
            this.saveState();
            this.addAction('🗑️ Trading history cleared');
        }
    }
    
    private async saveState() {
        try {
            if (this.databaseMode) {
                // Save to database
                await Promise.all([
                    paperTradingDb.saveConfiguration(this.config),
                    paperTradingDb.savePortfolioState(this.portfolio)
                ]);
            } else {
                // Save to localStorage
                const state = {
                    config: this.config,
                    portfolio: this.portfolio,
                    trades: this.trades.slice(-100) // Keep only last 100 trades
                };
                localStorage.setItem('paperTradingState', JSON.stringify(state));
            }
        } catch (error) {
            logger.warn('Failed to save paper trading state:', error);
        }
    }
    
    private async loadStateFromDatabase() {
        try {
            const [config, portfolio, trades] = await Promise.all([
                paperTradingDb.getConfiguration(),
                paperTradingDb.getCurrentPortfolio(),
                paperTradingDb.getTrades(100)
            ]);
            
            if (config && Object.keys(config).length > 0) {
                this.config = { ...this.config, ...config };
            }
            
            if (portfolio && Object.keys(portfolio).length > 0) {
                this.portfolio = {
                    cash: portfolio.cash,
                    totalValue: portfolio.total_value,
                    initialValue: portfolio.initial_value,
                    dayStartValue: portfolio.day_start_value,
                    position: portfolio.position_asset ? {
                        asset: portfolio.position_asset,
                        quantity: portfolio.position_quantity,
                        averagePrice: portfolio.position_average_price,
                        entryTime: portfolio.position_entry_time
                    } : null
                };
            }
            
            this.trades = trades.map(t => ({
                id: t.trade_id,
                timestamp: new Date(t.timestamp).getTime(),
                side: t.side as 'buy' | 'sell',
                asset: t.asset,
                price: t.price,
                quantity: t.quantity,
                value: t.value,
                fee: t.fee,
                pnl: t.pnl,
                strategy: t.strategy,
                reason: t.reason
            }));
            
            this.applyLoadedState();
            logger.log('Paper Trading: State loaded from database');
        } catch (error) {
            logger.warn('Failed to load paper trading state from database:', error);
        }
    }
    
    private loadStateFromLocalStorage() {
        try {
            const saved = localStorage.getItem('paperTradingState');
            if (saved) {
                const state = JSON.parse(saved);
                this.config = { ...this.config, ...state.config };
                this.portfolio = { ...this.portfolio, ...state.portfolio };
                this.trades = state.trades || [];
                
                this.applyLoadedState();
            }
        } catch (error) {
            logger.warn('Failed to load paper trading state from localStorage:', error);
        }
    }
    
    private applyLoadedState() {
        // Update UI selectors
        const updateSelect = (id: string, value: any) => {
            const element = document.getElementById(id) as HTMLSelectElement;
            if (element) element.value = value.toString();
        };
        
        updateSelect('trading-exchange', this.config.exchange);
        updateSelect('trading-asset', this.config.asset);
        updateSelect('trading-strategy', this.config.strategy);
        updateSelect('initial-capital', this.config.initialCapital);
        updateSelect('trading-speed', this.config.tradingSpeed);
        updateSelect('risk-level', this.config.riskLevel);
        updateSelect('position-size', this.config.positionSize);
        updateSelect('ai-personality', this.config.aiPersonality);
        
        this.updateUI();
        this.updateThoughts('📂 Previous state loaded');
    }
    
    // Multi-Agent Support Methods
    
    public getSessionId(): string {
        return this.sessionId;
    }
    
    public getPortfolio(): Portfolio {
        return { ...this.portfolio };
    }
    
    public getTrades(): Trade[] {
        return [...this.trades];
    }
    
    public getPortfolioValue(): number {
        return this.portfolio.totalValue;
    }
    
    public getConfig(): TradingConfig {
        return { ...this.config };
    }
    
    public async updateConfigFromMultiAgent(newConfig: Partial<TradingConfig>): Promise<void> {
        this.config = { ...this.config, ...newConfig };
        
        // Reset portfolio if initial capital changed
        if (newConfig.initialCapital && newConfig.initialCapital !== this.portfolio.initialValue) {
            this.portfolio.cash = newConfig.initialCapital;
            this.portfolio.position = null;
            this.portfolio.totalValue = newConfig.initialCapital;
            this.portfolio.initialValue = newConfig.initialCapital;
            this.portfolio.dayStartValue = newConfig.initialCapital;
            this.trades = [];
        }
        
        await this.saveState();
        this.eventEmitter?.emit('configUpdate', this.config);
    }
    
    public on(event: string, callback: Function): void {
        this.eventEmitter?.on(event, callback);
    }
    
    public getIsRunning(): boolean {
        return this.isRunning;
    }
    
    private updateThoughts(thought: string): void {
        // Emit thought for multi-agent manager
        this.eventEmitter?.emit('thought', thought);
        
        // Update UI for default session only
        if (this.sessionId === 'default' || this.sessionId.startsWith('default_')) {
            const thoughtsEl = document.getElementById('ai-thoughts');
            if (thoughtsEl) {
                thoughtsEl.textContent = thought;
            }
        }
    }
}

// Export singleton instance
export const paperTradingEngine = new PaperTradingEngine();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Paper trading engine initializes automatically in constructor
    });
} 
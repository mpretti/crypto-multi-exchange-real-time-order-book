// Advanced Trading Strategies for Multi-Agent System
// Additional strategy implementations beyond the basic momentum, mean reversion, and whale strategies

import { logger } from './utils';

interface MarketData {
    price: number;
    timestamp: number;
    volume: number;
    bid: number;
    ask: number;
    spread: number;
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

abstract class TradingStrategy {
    name: string;
    description: string;
    
    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }
    
    abstract shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig): { should: boolean; confidence: number; reason: string };
    abstract shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig): { should: boolean; confidence: number; reason: string };
}

// Scalping Strategy - High frequency, small profits
export class ScalperStrategy extends TradingStrategy {
    private lastTradeTime = 0;
    private minTradeInterval = 30000; // 30 seconds minimum between trades
    private profitTarget = 0.002; // 0.2% profit target
    private stopLoss = 0.001; // 0.1% stop loss
    
    constructor() {
        super("Scalper", "High-frequency trading with small, quick profits");
    }
    
    shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 10) {
            return { should: false, confidence: 0, reason: "Not enough data for scalping" };
        }
        
        const now = Date.now();
        if (now - this.lastTradeTime < this.minTradeInterval) {
            return { should: false, confidence: 0, reason: "Too soon since last trade" };
        }
        
        const current = marketData[marketData.length - 1];
        const recent = marketData.slice(-10);
        
        // Look for tight spread and quick price movements
        const spreadPercent = (current.spread / current.price) * 100;
        if (spreadPercent > 0.1) {
            return { should: false, confidence: 0, reason: "Spread too wide for scalping" };
        }
        
        // Check for upward momentum in last few ticks
        const recentPrices = recent.map(d => d.price);
        const momentum = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
        
        if (momentum > 0.0005) { // 0.05% upward movement
            const confidence = Math.min(momentum * 10000, 85);
            this.lastTradeTime = now;
            return {
                should: true,
                confidence,
                reason: `Scalping opportunity: ${(momentum * 100).toFixed(3)}% momentum, tight spread`
            };
        }
        
        return { should: false, confidence: 0, reason: "No scalping opportunity detected" };
    }
    
    shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (!portfolio.position || marketData.length === 0) {
            return { should: false, confidence: 0, reason: "No position to sell" };
        }
        
        const currentPrice = marketData[marketData.length - 1].price;
        const entryPrice = portfolio.position.averagePrice;
        const priceChange = (currentPrice - entryPrice) / entryPrice;
        
        // Take profit
        if (priceChange >= this.profitTarget) {
            return {
                should: true,
                confidence: 95,
                reason: `Scalping profit target hit: +${(priceChange * 100).toFixed(3)}%`
            };
        }
        
        // Stop loss
        if (priceChange <= -this.stopLoss) {
            return {
                should: true,
                confidence: 90,
                reason: `Scalping stop loss triggered: ${(priceChange * 100).toFixed(3)}%`
            };
        }
        
        // Time-based exit (hold for max 5 minutes)
        const holdTime = Date.now() - portfolio.position.entryTime;
        if (holdTime > 300000 && priceChange > 0) { // 5 minutes and profitable
            return {
                should: true,
                confidence: 70,
                reason: `Scalping time exit: held for ${Math.round(holdTime / 1000)}s with profit`
            };
        }
        
        return { should: false, confidence: 0, reason: "Holding scalping position" };
    }
}

// Arbitrage Strategy - Price differences across exchanges
export class ArbitrageStrategy extends TradingStrategy {
    private priceHistory: Map<string, number[]> = new Map();
    private minArbitrageProfit = 0.005; // 0.5% minimum profit
    
    constructor() {
        super("Arbitrage", "Exploits price differences across assets and timeframes");
    }
    
    shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 20) {
            return { should: false, confidence: 0, reason: "Insufficient data for arbitrage analysis" };
        }
        
        const current = marketData[marketData.length - 1];
        const asset = config.asset;
        
        // Store price history for this asset
        if (!this.priceHistory.has(asset)) {
            this.priceHistory.set(asset, []);
        }
        
        const history = this.priceHistory.get(asset)!;
        history.push(current.price);
        
        // Keep only last 50 prices
        if (history.length > 50) {
            history.shift();
        }
        
        if (history.length < 20) {
            return { should: false, confidence: 0, reason: "Building price history for arbitrage" };
        }
        
        // Look for price mean reversion opportunities
        const mean = history.reduce((sum, p) => sum + p, 0) / history.length;
        const deviation = (current.price - mean) / mean;
        
        // Buy when price is significantly below mean
        if (deviation < -this.minArbitrageProfit) {
            const confidence = Math.min(Math.abs(deviation) * 1000, 80);
            return {
                should: true,
                confidence,
                reason: `Arbitrage opportunity: ${(deviation * 100).toFixed(2)}% below mean price`
            };
        }
        
        // Also check for temporary price dislocations (sudden drops)
        const recent5 = marketData.slice(-5);
        const quickDrop = (recent5[0].price - current.price) / recent5[0].price;
        
        if (quickDrop > 0.01) { // 1% drop in 5 ticks
            return {
                should: true,
                confidence: 75,
                reason: `Quick price dislocation: ${(quickDrop * 100).toFixed(2)}% drop detected`
            };
        }
        
        return { should: false, confidence: 0, reason: "No arbitrage opportunity" };
    }
    
    shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (!portfolio.position || marketData.length === 0) {
            return { should: false, confidence: 0, reason: "No position for arbitrage exit" };
        }
        
        const currentPrice = marketData[marketData.length - 1].price;
        const entryPrice = portfolio.position.averagePrice;
        const profit = (currentPrice - entryPrice) / entryPrice;
        
        // Exit with profit target
        if (profit >= this.minArbitrageProfit) {
            return {
                should: true,
                confidence: 85,
                reason: `Arbitrage profit achieved: +${(profit * 100).toFixed(2)}%`
            };
        }
        
        const asset = config.asset;
        const history = this.priceHistory.get(asset);
        
        if (history && history.length >= 10) {
            const mean = history.reduce((sum, p) => sum + p, 0) / history.length;
            const currentDeviation = (currentPrice - mean) / mean;
            
            // Exit if price has moved back to mean or above
            if (currentDeviation >= 0 && profit > 0) {
                return {
                    should: true,
                    confidence: 70,
                    reason: `Arbitrage mean reversion complete: back to fair value`
                };
            }
        }
        
        // Stop loss for arbitrage (tight since we expect quick moves)
        if (profit <= -0.002) { // 0.2% stop loss
            return {
                should: true,
                confidence: 90,
                reason: `Arbitrage stop loss: ${(profit * 100).toFixed(2)}%`
            };
        }
        
        return { should: false, confidence: 0, reason: "Waiting for arbitrage profit" };
    }
}

// Sentiment Analysis Strategy - Based on volume and price action sentiment
export class SentimentStrategy extends TradingStrategy {
    private volumeHistory: number[] = [];
    private volatilityHistory: number[] = [];
    
    constructor() {
        super("Sentiment", "Trades based on market sentiment indicators");
    }
    
    shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 30) {
            return { should: false, confidence: 0, reason: "Building sentiment data" };
        }
        
        const current = marketData[marketData.length - 1];
        const recent20 = marketData.slice(-20);
        
        // Update volume history
        this.volumeHistory.push(current.volume);
        if (this.volumeHistory.length > 100) {
            this.volumeHistory.shift();
        }
        
        // Calculate sentiment indicators
        const avgVolume = this.volumeHistory.reduce((sum, v) => sum + v, 0) / this.volumeHistory.length;
        const volumeRatio = current.volume / avgVolume;
        
        // Price action sentiment (higher highs, higher lows)
        const highs = recent20.map(d => Math.max(d.price, d.bid, d.ask));
        const lows = recent20.map(d => Math.min(d.price, d.bid, d.ask));
        
        const recentHighs = highs.slice(-10);
        const olderHighs = highs.slice(-20, -10);
        const recentLows = lows.slice(-10);
        const olderLows = lows.slice(-20, -10);
        
        const avgRecentHigh = recentHighs.reduce((sum, h) => sum + h, 0) / recentHighs.length;
        const avgOlderHigh = olderHighs.reduce((sum, h) => sum + h, 0) / olderHighs.length;
        const avgRecentLow = recentLows.reduce((sum, l) => sum + l, 0) / recentLows.length;
        const avgOlderLow = olderLows.reduce((sum, l) => sum + l, 0) / olderLows.length;
        
        const bullishSentiment = avgRecentHigh > avgOlderHigh && avgRecentLow > avgOlderLow;
        
        // Positive sentiment: high volume + bullish price action
        if (volumeRatio > 1.5 && bullishSentiment) {
            const confidence = Math.min(volumeRatio * 30 + 20, 85);
            return {
                should: true,
                confidence,
                reason: `Bullish sentiment: ${volumeRatio.toFixed(2)}x volume + higher highs/lows`
            };
        }
        
        // Fear buying: sudden volume spike with price drop (potential reversal)
        const priceChange = (current.price - recent20[0].price) / recent20[0].price;
        if (volumeRatio > 2.0 && priceChange < -0.02) {
            return {
                should: true,
                confidence: 70,
                reason: `Fear buying opportunity: volume spike on ${(priceChange * 100).toFixed(1)}% drop`
            };
        }
        
        return { should: false, confidence: 0, reason: "Neutral market sentiment" };
    }
    
    shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (!portfolio.position || marketData.length < 10) {
            return { should: false, confidence: 0, reason: "No position or insufficient data" };
        }
        
        const current = marketData[marketData.length - 1];
        const recent10 = marketData.slice(-10);
        
        // Check for sentiment reversal
        const avgVolume = this.volumeHistory.reduce((sum, v) => sum + v, 0) / this.volumeHistory.length;
        const volumeRatio = current.volume / avgVolume;
        
        // Calculate current profit
        const profit = (current.price - portfolio.position.averagePrice) / portfolio.position.averagePrice;
        
        // Bearish sentiment: high volume with declining prices
        const priceChange = (current.price - recent10[0].price) / recent10[0].price;
        if (volumeRatio > 1.8 && priceChange < -0.01 && profit > 0.01) {
            return {
                should: true,
                confidence: 80,
                reason: `Bearish sentiment detected: ${volumeRatio.toFixed(2)}x volume on decline`
            };
        }
        
        // Euphoria selling: extremely high volume with big gains
        if (volumeRatio > 3.0 && profit > 0.05) {
            return {
                should: true,
                confidence: 85,
                reason: `Euphoria selling: ${volumeRatio.toFixed(2)}x volume at +${(profit * 100).toFixed(1)}%`
            };
        }
        
        // Standard profit taking
        if (profit > 0.03) { // 3% profit
            return {
                should: true,
                confidence: 70,
                reason: `Sentiment profit taking: +${(profit * 100).toFixed(1)}%`
            };
        }
        
        // Stop loss
        if (profit < -0.02) { // 2% loss
            return {
                should: true,
                confidence: 90,
                reason: `Sentiment stop loss: ${(profit * 100).toFixed(1)}%`
            };
        }
        
        return { should: false, confidence: 0, reason: "Holding based on sentiment" };
    }
}

// Neural Network Strategy - Simulated deep learning approach
export class NeuralNetworkStrategy extends TradingStrategy {
    private featureHistory: number[][] = [];
    private predictions: number[] = [];
    private accuracy = 0.5; // Start at 50% accuracy
    private learningRate = 0.01;
    
    constructor() {
        super("Neural Network", "Advanced machine learning pattern recognition");
    }
    
    shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 50) {
            return { should: false, confidence: 0, reason: "Training neural network..." };
        }
        
        // Create feature vector from recent market data
        const features = this.extractFeatures(marketData);
        this.featureHistory.push(features);
        
        // Keep only recent history for training
        if (this.featureHistory.length > 200) {
            this.featureHistory.shift();
        }
        
        // Simulate neural network prediction
        const prediction = this.predict(features);
        this.predictions.push(prediction);
        
        // Update accuracy based on recent predictions vs actual outcomes
        if (this.predictions.length > 10) {
            this.updateAccuracy(marketData);
        }
        
        // Buy if prediction is bullish and confidence is high
        if (prediction > 0.65 && this.accuracy > 0.55) {
            const confidence = Math.min((prediction - 0.5) * 200 * this.accuracy, 90);
            return {
                should: true,
                confidence,
                reason: `Neural network prediction: ${(prediction * 100).toFixed(1)}% bullish (accuracy: ${(this.accuracy * 100).toFixed(1)}%)`
            };
        }
        
        return { should: false, confidence: 0, reason: `Neural network bearish: ${(prediction * 100).toFixed(1)}%` };
    }
    
    shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (!portfolio.position || marketData.length < 10) {
            return { should: false, confidence: 0, reason: "No position for neural network" };
        }
        
        const features = this.extractFeatures(marketData);
        const prediction = this.predict(features);
        const profit = (marketData[marketData.length - 1].price - portfolio.position.averagePrice) / portfolio.position.averagePrice;
        
        // Sell if neural network predicts decline
        if (prediction < 0.35 && this.accuracy > 0.55) {
            return {
                should: true,
                confidence: Math.min((0.5 - prediction) * 200 * this.accuracy, 90),
                reason: `Neural network sell signal: ${(prediction * 100).toFixed(1)}% bearish`
            };
        }
        
        // Profit taking with neural network confirmation
        if (profit > 0.04 && prediction < 0.6) {
            return {
                should: true,
                confidence: 75,
                reason: `Neural network profit taking: +${(profit * 100).toFixed(1)}% with bearish signal`
            };
        }
        
        // Stop loss
        if (profit < -0.025) {
            return {
                should: true,
                confidence: 95,
                reason: `Neural network stop loss: ${(profit * 100).toFixed(1)}%`
            };
        }
        
        return { should: false, confidence: 0, reason: "Neural network holding signal" };
    }
    
    private extractFeatures(marketData: MarketData[]): number[] {
        const recent = marketData.slice(-20);
        if (recent.length < 20) return [];
        
        // Extract various technical features
        const prices = recent.map(d => d.price);
        const volumes = recent.map(d => d.volume);
        const spreads = recent.map(d => d.spread);
        
        return [
            // Price features
            this.normalize(prices[prices.length - 1] - prices[0], prices[0]), // Price change
            this.normalize(Math.max(...prices) - Math.min(...prices), prices[0]), // Range
            this.calculateSMA(prices, 5) / prices[prices.length - 1] - 1, // SMA ratio
            this.calculateSMA(prices, 10) / prices[prices.length - 1] - 1, // Longer SMA ratio
            
            // Volume features
            this.normalize(volumes[volumes.length - 1] - volumes[0], volumes[0]), // Volume change
            this.normalize(Math.max(...volumes) - Math.min(...volumes), this.average(volumes)), // Volume range
            
            // Spread features
            this.normalize(spreads[spreads.length - 1], prices[prices.length - 1]), // Current spread
            this.normalize(this.average(spreads), prices[prices.length - 1]), // Average spread
            
            // Momentum features
            this.calculateMomentum(prices, 5),
            this.calculateMomentum(prices, 10),
            
            // Volatility
            this.calculateVolatility(prices)
        ];
    }
    
    private predict(features: number[]): number {
        if (features.length === 0) return 0.5;
        
        // Simplified neural network simulation
        // In reality, this would be a complex multi-layer network
        let prediction = 0.5;
        
        // Weighted sum of features (simplified)
        const weights = [0.2, 0.15, 0.25, 0.1, 0.05, 0.05, 0.03, 0.02, 0.08, 0.05, 0.02];
        
        for (let i = 0; i < Math.min(features.length, weights.length); i++) {
            prediction += features[i] * weights[i];
        }
        
        // Apply sigmoid activation
        prediction = 1 / (1 + Math.exp(-prediction * 2));
        
        return Math.max(0, Math.min(1, prediction));
    }
    
    private updateAccuracy(marketData: MarketData[]): void {
        if (this.predictions.length < 20 || marketData.length < 30) return;
        
        // Simple accuracy calculation based on prediction vs actual price movement
        let correct = 0;
        const recent = marketData.slice(-20);
        
        for (let i = 1; i < recent.length && i < this.predictions.length; i++) {
            const actualChange = recent[i].price > recent[i - 1].price;
            const predictedBullish = this.predictions[this.predictions.length - i] > 0.5;
            
            if (actualChange === predictedBullish) {
                correct++;
            }
        }
        
        const newAccuracy = correct / Math.min(recent.length - 1, this.predictions.length);
        
        // Smooth accuracy update
        this.accuracy = this.accuracy * (1 - this.learningRate) + newAccuracy * this.learningRate;
        this.accuracy = Math.max(0.3, Math.min(0.8, this.accuracy)); // Clamp between 30-80%
    }
    
    // Helper functions
    private normalize(value: number, base: number): number {
        return base !== 0 ? value / base : 0;
    }
    
    private calculateSMA(data: number[], period: number): number {
        if (data.length < period) return data[data.length - 1] || 0;
        const recent = data.slice(-period);
        return recent.reduce((sum, val) => sum + val, 0) / recent.length;
    }
    
    private average(data: number[]): number {
        return data.length > 0 ? data.reduce((sum, val) => sum + val, 0) / data.length : 0;
    }
    
    private calculateMomentum(prices: number[], period: number): number {
        if (prices.length < period) return 0;
        const current = prices[prices.length - 1];
        const past = prices[prices.length - period];
        return past !== 0 ? (current - past) / past : 0;
    }
    
    private calculateVolatility(prices: number[]): number {
        if (prices.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }
        
        const mean = this.average(returns);
        const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
        return Math.sqrt(this.average(squaredDiffs));
    }
}

// Conservative Strategy - Risk-averse approach
export class ConservativeStrategy extends TradingStrategy {
    private drawdownLimit = 0.05; // 5% max drawdown
    private profitTarget = 0.15; // 15% profit target
    
    constructor() {
        super("Conservative", "Low-risk approach with capital preservation focus");
    }
    
    shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 50) {
            return { should: false, confidence: 0, reason: "Conservative strategy needs more data" };
        }
        
        // Only buy in strong uptrends with confirmation
        const recent30 = marketData.slice(-30);
        const sma20 = this.calculateSMA(recent30.map(d => d.price), 20);
        const sma50 = this.calculateSMA(marketData.slice(-50).map(d => d.price), 50);
        const currentPrice = marketData[marketData.length - 1].price;
        
        // Conservative entry: price above both SMAs, and SMAs trending up
        const above20SMA = currentPrice > sma20;
        const above50SMA = currentPrice > sma50;
        const smasRisingFilter = sma20 > sma50;
        
        // Also check volume is normal (not extreme)
        const volumes = recent30.map(d => d.volume);
        const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
        const currentVolume = marketData[marketData.length - 1].volume;
        const normalVolume = currentVolume < avgVolume * 2; // Not more than 2x average
        
        if (above20SMA && above50SMA && smasRisingFilter && normalVolume) {
            const strength = ((currentPrice - sma50) / sma50) * 100;
            const confidence = Math.min(strength * 10 + 40, 75); // Conservative confidence
            
            return {
                should: true,
                confidence,
                reason: `Conservative entry: above SMAs with normal volume (+${strength.toFixed(2)}% above 50 SMA)`
            };
        }
        
        return { should: false, confidence: 0, reason: "Conservative criteria not met" };
    }
    
    shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (!portfolio.position) {
            return { should: false, confidence: 0, reason: "No position to sell" };
        }
        
        const currentPrice = marketData[marketData.length - 1].price;
        const entryPrice = portfolio.position.averagePrice;
        const profit = (currentPrice - entryPrice) / entryPrice;
        
        // Conservative profit taking
        if (profit >= this.profitTarget) {
            return {
                should: true,
                confidence: 95,
                reason: `Conservative profit target reached: +${(profit * 100).toFixed(1)}%`
            };
        }
        
        // Conservative stop loss
        if (profit <= -this.drawdownLimit) {
            return {
                should: true,
                confidence: 95,
                reason: `Conservative stop loss: ${(profit * 100).toFixed(1)}%`
            };
        }
        
        // Early profit taking on any decline after gains
        if (profit > 0.05 && marketData.length >= 10) {
            const recent5 = marketData.slice(-5).map(d => d.price);
            const shortTermDecline = (recent5[recent5.length - 1] - recent5[0]) / recent5[0] < -0.01;
            
            if (shortTermDecline) {
                return {
                    should: true,
                    confidence: 80,
                    reason: `Conservative exit on decline: +${(profit * 100).toFixed(1)}% profit secured`
                };
            }
        }
        
        return { should: false, confidence: 0, reason: "Conservative holding" };
    }
    
    private calculateSMA(data: number[], period: number): number {
        if (data.length < period) return data[data.length - 1] || 0;
        const recent = data.slice(-period);
        return recent.reduce((sum, val) => sum + val, 0) / recent.length;
    }
}

// Aggressive Strategy - High risk, high reward
export class AggressiveStrategy extends TradingStrategy {
    private profitTarget = 0.5; // 50% profit target
    private stopLoss = 0.15; // 15% stop loss (higher risk tolerance)
    
    constructor() {
        super("Aggressive", "High-risk, high-reward momentum chasing");
    }
    
    shouldBuy(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (marketData.length < 20) {
            return { should: false, confidence: 0, reason: "Aggressive strategy initializing" };
        }
        
        const current = marketData[marketData.length - 1];
        const recent10 = marketData.slice(-10);
        const recent20 = marketData.slice(-20);
        
        // Look for strong momentum with volume confirmation
        const priceChange10 = (current.price - recent10[0].price) / recent10[0].price;
        const priceChange20 = (current.price - recent20[0].price) / recent20[0].price;
        
        // Volume analysis
        const volumes = recent20.map(d => d.volume);
        const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
        const volumeRatio = current.volume / avgVolume;
        
        // Aggressive entry: strong momentum + volume spike
        if (priceChange10 > 0.02 && priceChange20 > 0.03 && volumeRatio > 1.5) {
            const confidence = Math.min(priceChange20 * 1000 + volumeRatio * 20, 95);
            return {
                should: true,
                confidence,
                reason: `Aggressive momentum: +${(priceChange20 * 100).toFixed(1)}% with ${volumeRatio.toFixed(1)}x volume`
            };
        }
        
        // Breakout trading (price breaking recent highs)
        const recent20Highs = recent20.map(d => Math.max(d.price, d.ask));
        const maxRecent = Math.max(...recent20Highs.slice(0, -1)); // Excluding current
        
        if (current.price > maxRecent * 1.01 && volumeRatio > 2.0) { // 1% above recent high
            return {
                should: true,
                confidence: 85,
                reason: `Aggressive breakout: +${((current.price / maxRecent - 1) * 100).toFixed(2)}% above recent high`
            };
        }
        
        return { should: false, confidence: 0, reason: "No aggressive setup detected" };
    }
    
    shouldSell(marketData: MarketData[], portfolio: Portfolio, config: TradingConfig) {
        if (!portfolio.position) {
            return { should: false, confidence: 0, reason: "No position for aggressive exit" };
        }
        
        const currentPrice = marketData[marketData.length - 1].price;
        const entryPrice = portfolio.position.averagePrice;
        const profit = (currentPrice - entryPrice) / entryPrice;
        
        // Aggressive profit taking
        if (profit >= this.profitTarget) {
            return {
                should: true,
                confidence: 95,
                reason: `Aggressive profit target hit: +${(profit * 100).toFixed(1)}%`
            };
        }
        
        // Aggressive stop loss (larger tolerance)
        if (profit <= -this.stopLoss) {
            return {
                should: true,
                confidence: 95,
                reason: `Aggressive stop loss: ${(profit * 100).toFixed(1)}%`
            };
        }
        
        // Momentum reversal detection
        if (marketData.length >= 5 && profit > 0.1) {
            const recent5 = marketData.slice(-5);
            const momentumChange = (recent5[recent5.length - 1].price - recent5[0].price) / recent5[0].price;
            
            // Exit if momentum reverses after good gains
            if (momentumChange < -0.02) { // 2% reversal
                return {
                    should: true,
                    confidence: 80,
                    reason: `Aggressive momentum reversal exit: +${(profit * 100).toFixed(1)}% profit`
                };
            }
        }
        
        return { should: false, confidence: 0, reason: "Aggressive holding for bigger gains" };
    }
}

// Export all strategies
export const ADVANCED_STRATEGIES = {
    scalper: ScalperStrategy,
    arbitrage: ArbitrageStrategy,
    sentiment: SentimentStrategy,
    neural: NeuralNetworkStrategy,
    conservative: ConservativeStrategy,
    aggressive: AggressiveStrategy
}; 
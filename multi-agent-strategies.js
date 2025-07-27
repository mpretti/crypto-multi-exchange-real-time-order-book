/**
 * Trading Strategies for Multi-Agent System - JavaScript Version
 */

// Base strategy class
class BaseStrategy {
    constructor(config) {
        this.config = config;
        this.name = 'BaseStrategy';
        this.lastSignal = null;
        this.signals = [];
        this.maxSignals = 100;
    }

    addSignal(type, strength, price, timestamp = Date.now()) {
        this.signals.unshift({ type, strength, price, timestamp });
        if (this.signals.length > this.maxSignals) {
            this.signals = this.signals.slice(0, this.maxSignals);
        }
        this.lastSignal = { type, strength, price, timestamp };
    }

    shouldBuy(symbol, price, portfolio) {
        return Math.random() > 0.8; // Default random behavior
    }

    shouldSell(symbol, price, portfolio) {
        return Math.random() > 0.9; // Default random behavior
    }

    getPositionSize(availableCash) {
        const percentage = this.config.positionSize / 100;
        return availableCash * percentage;
    }
}

// Conservative Strategy - Capital preservation focused
class ConservativeStrategy extends BaseStrategy {
    constructor(config) {
        super(config);
        this.name = 'Conservative';
        this.priceHistory = new Map();
        this.maxDrawdown = config.maxDrawdown || 5;
        this.profitTarget = 0.02; // 2% profit target
        this.stopLoss = 0.015; // 1.5% stop loss
    }

    updatePriceHistory(symbol, price) {
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, []);
        }
        const history = this.priceHistory.get(symbol);
        history.push({ price, timestamp: Date.now() });
        
        // Keep only last 50 prices
        if (history.length > 50) {
            history.shift();
        }
    }

    shouldBuy(symbol, price, portfolio) {
        this.updatePriceHistory(symbol, price);
        
        // Conservative: Only buy on clear dips with low volatility
        const history = this.priceHistory.get(symbol);
        if (!history || history.length < 10) return false;
        
        const recentPrices = history.slice(-10).map(h => h.price);
        const avgPrice = recentPrices.reduce((a, b) => a + b) / recentPrices.length;
        const isLowVolatility = this.calculateVolatility(recentPrices) < 0.02;
        const isDip = price < avgPrice * 0.98; // 2% below average
        
        // Don't buy if already have position that's too large
        const position = portfolio.positions && portfolio.positions[symbol];
        const currentValue = position ? position.quantity * price : 0;
        const maxPositionValue = portfolio.cash * 0.1; // Max 10% of portfolio
        
        const signal = isDip && isLowVolatility && currentValue < maxPositionValue;
        if (signal) {
            this.addSignal('buy', 0.3, price); // Low strength signal
        }
        
        return signal;
    }

    shouldSell(symbol, price, portfolio) {
        const position = portfolio.positions && portfolio.positions[symbol];
        if (!position || position.quantity <= 0) return false;
        
        const profitPercent = (price - position.averagePrice) / position.averagePrice;
        
        // Sell on profit target or stop loss
        const shouldSell = profitPercent >= this.profitTarget || profitPercent <= -this.stopLoss;
        
        if (shouldSell) {
            this.addSignal('sell', profitPercent > 0 ? 0.8 : 0.9, price);
        }
        
        return shouldSell;
    }

    calculateVolatility(prices) {
        if (prices.length < 2) return 0;
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        const avgReturn = returns.reduce((a, b) => a + b) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }
}

// Aggressive Strategy - High risk momentum trading
class AggressiveStrategy extends BaseStrategy {
    constructor(config) {
        super(config);
        this.name = 'Aggressive';
        this.momentumWindow = 5;
        this.priceHistory = new Map();
        this.profitTarget = 0.1; // 10% profit target
        this.stopLoss = 0.05; // 5% stop loss
    }

    shouldBuy(symbol, price, portfolio) {
        this.updatePriceHistory(symbol, price);
        
        // Aggressive: Buy on strong upward momentum
        const history = this.priceHistory.get(symbol);
        if (!history || history.length < this.momentumWindow) return false;
        
        const recentPrices = history.slice(-this.momentumWindow).map(h => h.price);
        const momentum = this.calculateMomentum(recentPrices);
        const isStrongMomentum = momentum > 0.03; // 3% momentum
        
        // Aggressive position sizing - up to 20% of portfolio
        const position = portfolio.positions && portfolio.positions[symbol];
        const currentValue = position ? position.quantity * price : 0;
        const maxPositionValue = portfolio.cash * 0.2;
        
        const signal = isStrongMomentum && currentValue < maxPositionValue;
        if (signal) {
            this.addSignal('buy', 0.9, price); // High strength signal
        }
        
        return signal;
    }

    shouldSell(symbol, price, portfolio) {
        const position = portfolio.positions && portfolio.positions[symbol];
        if (!position || position.quantity <= 0) return false;
        
        const profitPercent = (price - position.averagePrice) / position.averagePrice;
        
        // More aggressive profit taking and stop losses
        const shouldSell = profitPercent >= this.profitTarget || profitPercent <= -this.stopLoss;
        
        if (shouldSell) {
            this.addSignal('sell', profitPercent > 0 ? 0.9 : 0.8, price);
        }
        
        return shouldSell;
    }

    updatePriceHistory(symbol, price) {
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, []);
        }
        const history = this.priceHistory.get(symbol);
        history.push({ price, timestamp: Date.now() });
        
        if (history.length > 20) {
            history.shift();
        }
    }

    calculateMomentum(prices) {
        if (prices.length < 2) return 0;
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        return (lastPrice - firstPrice) / firstPrice;
    }
}

// Scalper Strategy - High frequency, small profits
class ScalperStrategy extends BaseStrategy {
    constructor(config) {
        super(config);
        this.name = 'Scalper';
        this.profitTarget = 0.002; // 0.2% profit target
        this.stopLoss = 0.001; // 0.1% stop loss
        this.lastTradeTime = new Map();
        this.minTimeBetweenTrades = 30000; // 30 seconds
    }

    shouldBuy(symbol, price, portfolio) {
        // Check if enough time has passed since last trade
        const lastTrade = this.lastTradeTime.get(symbol) || 0;
        if (Date.now() - lastTrade < this.minTimeBetweenTrades) return false;
        
        // Scalping: Look for quick opportunities with small price movements
        const signal = Math.random() > 0.85; // More frequent but smaller trades
        
        if (signal) {
            this.lastTradeTime.set(symbol, Date.now());
            this.addSignal('buy', 0.5, price);
        }
        
        return signal;
    }

    shouldSell(symbol, price, portfolio) {
        const position = portfolio.positions && portfolio.positions[symbol];
        if (!position || position.quantity <= 0) return false;
        
        const profitPercent = (price - position.averagePrice) / position.averagePrice;
        
        // Very tight profit targets and stop losses for scalping
        const shouldSell = profitPercent >= this.profitTarget || profitPercent <= -this.stopLoss;
        
        if (shouldSell) {
            this.addSignal('sell', 0.7, price);
        }
        
        return shouldSell;
    }

    getPositionSize(availableCash) {
        // Smaller position sizes for scalping
        return availableCash * 0.05; // 5% max
    }
}

// Arbitrage Strategy - Price discrepancy exploitation
class ArbitrageStrategy extends BaseStrategy {
    constructor(config) {
        super(config);
        this.name = 'Arbitrage';
        this.priceHistory = new Map();
        this.minProfitThreshold = 0.005; // 0.5% minimum profit
    }

    shouldBuy(symbol, price, portfolio) {
        this.updatePriceHistory(symbol, price);
        
        // Look for mean reversion opportunities
        const history = this.priceHistory.get(symbol);
        if (!history || history.length < 20) return false;
        
        const recentPrices = history.slice(-20).map(h => h.price);
        const avgPrice = recentPrices.reduce((a, b) => a + b) / recentPrices.length;
        const isUndervalued = price < avgPrice * 0.995; // 0.5% below average
        
        const signal = isUndervalued;
        if (signal) {
            this.addSignal('buy', 0.6, price);
        }
        
        return signal;
    }

    shouldSell(symbol, price, portfolio) {
        const position = portfolio.positions && portfolio.positions[symbol];
        if (!position || position.quantity <= 0) return false;
        
        const profitPercent = (price - position.averagePrice) / position.averagePrice;
        
        // Sell when minimum profit threshold is reached
        const shouldSell = profitPercent >= this.minProfitThreshold;
        
        if (shouldSell) {
            this.addSignal('sell', 0.8, price);
        }
        
        return shouldSell;
    }

    updatePriceHistory(symbol, price) {
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, []);
        }
        const history = this.priceHistory.get(symbol);
        history.push({ price, timestamp: Date.now() });
        
        if (history.length > 50) {
            history.shift();
        }
    }
}

// Whale Strategy - Follow large order flows
class WhaleStrategy extends BaseStrategy {
    constructor(config) {
        super(config);
        this.name = 'Whale';
        this.volumeThreshold = 1000000; // $1M volume threshold
        this.whaleSignals = [];
    }

    shouldBuy(symbol, price, portfolio) {
        // Simulate whale detection (in real app, this would use actual volume data)
        const hasWhaleActivity = Math.random() > 0.95; // Rare whale signals
        
        if (hasWhaleActivity) {
            this.whaleSignals.push({ symbol, price, timestamp: Date.now(), type: 'buy' });
            this.addSignal('buy', 0.8, price);
            return true;
        }
        
        return false;
    }

    shouldSell(symbol, price, portfolio) {
        const position = portfolio.positions && portfolio.positions[symbol];
        if (!position || position.quantity <= 0) return false;
        
        // Follow whale exit signals
        const profitPercent = (price - position.averagePrice) / position.averagePrice;
        const hasWhaleExit = Math.random() > 0.98;
        
        const shouldSell = profitPercent >= 0.05 || hasWhaleExit; // 5% profit or whale exit
        
        if (shouldSell) {
            this.addSignal('sell', 0.7, price);
        }
        
        return shouldSell;
    }

    getPositionSize(availableCash) {
        // Larger position sizes to follow whales
        return availableCash * 0.15; // 15% max
    }
}

// Balanced Strategy - Moderate risk approach
class BalancedStrategy extends BaseStrategy {
    constructor(config) {
        super(config);
        this.name = 'Balanced';
        this.priceHistory = new Map();
        this.profitTarget = 0.05; // 5% profit target
        this.stopLoss = 0.03; // 3% stop loss
    }

    shouldBuy(symbol, price, portfolio) {
        this.updatePriceHistory(symbol, price);
        
        // Balanced approach: Mix of momentum and mean reversion
        const history = this.priceHistory.get(symbol);
        if (!history || history.length < 15) return false;
        
        const recentPrices = history.slice(-15).map(h => h.price);
        const avgPrice = recentPrices.reduce((a, b) => a + b) / recentPrices.length;
        const momentum = this.calculateMomentum(recentPrices.slice(-5));
        
        const isGoodEntry = (price < avgPrice * 0.99 && momentum > 0.01) || 
                           (price > avgPrice * 1.01 && momentum > 0.02);
        
        const position = portfolio.positions && portfolio.positions[symbol];
        const currentValue = position ? position.quantity * price : 0;
        const maxPositionValue = portfolio.cash * 0.15; // 15% max position
        
        const signal = isGoodEntry && currentValue < maxPositionValue;
        if (signal) {
            this.addSignal('buy', 0.6, price);
        }
        
        return signal;
    }

    shouldSell(symbol, price, portfolio) {
        const position = portfolio.positions && portfolio.positions[symbol];
        if (!position || position.quantity <= 0) return false;
        
        const profitPercent = (price - position.averagePrice) / position.averagePrice;
        
        const shouldSell = profitPercent >= this.profitTarget || profitPercent <= -this.stopLoss;
        
        if (shouldSell) {
            this.addSignal('sell', 0.7, price);
        }
        
        return shouldSell;
    }

    updatePriceHistory(symbol, price) {
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, []);
        }
        const history = this.priceHistory.get(symbol);
        history.push({ price, timestamp: Date.now() });
        
        if (history.length > 30) {
            history.shift();
        }
    }

    calculateMomentum(prices) {
        if (prices.length < 2) return 0;
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        return (lastPrice - firstPrice) / firstPrice;
    }
}

// Export strategies
const TradingStrategies = {
    conservative: ConservativeStrategy,
    aggressive: AggressiveStrategy,
    scalper: ScalperStrategy,
    arbitrage: ArbitrageStrategy,
    whale: WhaleStrategy,
    balanced: BalancedStrategy
};

// Export to global scope
window.TradingStrategies = TradingStrategies;
window.BaseStrategy = BaseStrategy;

console.log('📈 Multi-Agent Trading Strategies (JS) loaded successfully!'); 
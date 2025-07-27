/**
 * Paper Trading Engine - JavaScript Version
 * Converted from TypeScript for direct browser usage
 */

// Database persistence configuration
const DB_CONFIG = {
    enabled: true,
    apiUrl: 'http://localhost:3001/api',
    autoSave: true,
    saveInterval: 5000 // 5 seconds
};

class PaperTradingEngine {
    constructor(sessionId = 'default') {
        this.sessionId = sessionId;
        this.portfolio = {
            cash: 100000,
            positions: new Map(),
            initialCash: 100000
        };
        this.trades = [];
        this.currentPrices = new Map();
        this.exchangeFees = new Map();
        this.isActive = false;
        this.lastSaveTime = 0;
        this.eventEmitter = new EventTarget();
        
        // Load data from database on initialization
        this.loadFromDatabase();
        
        // Auto-save timer
        if (DB_CONFIG.autoSave) {
            setInterval(() => this.saveToDatabase(), DB_CONFIG.saveInterval);
        }
    }

    // Database persistence methods
    async loadFromDatabase() {
        try {
            const response = await fetch(`${DB_CONFIG.apiUrl}/sessions/${this.sessionId}/portfolio`);
            if (response.ok) {
                const data = await response.json();
                if (data.portfolio) {
                    this.portfolio = {
                        ...data.portfolio,
                        positions: new Map(Object.entries(data.portfolio.positions || {}))
                    };
                }
                if (data.trades) {
                    this.trades = data.trades;
                }
                console.log(`📊 Loaded portfolio for session ${this.sessionId}:`, {
                    cash: this.portfolio.cash,
                    positions: this.portfolio.positions.size,
                    trades: this.trades.length
                });
                this.emitEvent('portfolioLoaded', { sessionId: this.sessionId });
            }
        } catch (error) {
            console.warn('Failed to load from database:', error);
        }
    }

    async saveToDatabase() {
        if (!DB_CONFIG.enabled) return;
        
        try {
            const totalValue = this.getPortfolioValue();
            const portfolioData = {
                cash: this.portfolio.cash,
                totalValue: totalValue,
                initialValue: this.portfolio.initialCash,
                dayStartValue: this.portfolio.initialCash, // For now, same as initial
                totalPnl: totalValue - this.portfolio.initialCash,
                dailyPnl: 0, // Would need day start tracking
                unrealizedPnl: this.getUnrealizedPnL(),
                position: this.getLargestPosition() // Send largest position for simplicity
            };
            
            const apiUrl = `${DB_CONFIG.apiUrl}/sessions/${this.sessionId}/portfolio`;
            console.log('📤 Saving to database:', apiUrl, portfolioData);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(portfolioData)
            });
            
            if (response.ok) {
                this.lastSaveTime = Date.now();
                this.emitEvent('portfolioSaved', { sessionId: this.sessionId });
            }
        } catch (error) {
            console.warn('Failed to save to database:', error);
        }
    }

    emitEvent(type, data) {
        const event = new CustomEvent(type, { detail: data });
        this.eventEmitter.dispatchEvent(event);
        
        // Also emit to global document for compatibility
        document.dispatchEvent(new CustomEvent(`paperTrading${type}`, { detail: data }));
    }

    addEventListener(type, listener) {
        this.eventEmitter.addEventListener(type, listener);
    }

    removeEventListener(type, listener) {
        this.eventEmitter.removeEventListener(type, listener);
    }

    updatePrice(symbol, price, exchange = 'unknown') {
        this.currentPrices.set(symbol, { price, exchange, timestamp: Date.now() });
        
        // Update position P&L
        if (this.portfolio.positions.has(symbol)) {
            const position = this.portfolio.positions.get(symbol);
            const pnl = (price - position.averagePrice) * position.quantity;
            position.unrealizedPnL = pnl;
            position.currentPrice = price;
        }
    }

    setExchangeFees(exchange, fees) {
        this.exchangeFees.set(exchange, fees);
    }

    getExchangeFee(exchange, isMaker = false) {
        const fees = this.exchangeFees.get(exchange);
        if (!fees) return 0.001; // Default 0.1%
        
        // Use taker fee by default (more conservative)
        return isMaker ? fees.maker : fees.taker;
    }

    calculateFee(price, quantity, exchange) {
        const feeRate = this.getExchangeFee(exchange);
        return price * quantity * feeRate;
    }

    buyMarket(symbol, quantity, exchange = 'paper') {
        const priceData = this.currentPrices.get(symbol);
        if (!priceData) {
            console.warn(`No price data for ${symbol}`);
            return false;
        }

        const price = priceData.price;
        const fee = this.calculateFee(price, quantity, exchange);
        const totalCost = (price * quantity) + fee;

        if (this.portfolio.cash < totalCost) {
            console.warn(`Insufficient funds. Need ${totalCost}, have ${this.portfolio.cash}`);
            return false;
        }

        // Execute trade
        this.portfolio.cash -= totalCost;
        
        const position = this.portfolio.positions.get(symbol) || {
            symbol,
            quantity: 0,
            averagePrice: 0,
            totalCost: 0,
            unrealizedPnL: 0,
            currentPrice: price
        };

        // Update position
        const newTotalCost = position.totalCost + (price * quantity);
        const newQuantity = position.quantity + quantity;
        position.averagePrice = newTotalCost / newQuantity;
        position.quantity = newQuantity;
        position.totalCost = newTotalCost;
        position.currentPrice = price;
        position.unrealizedPnL = (price - position.averagePrice) * position.quantity;

        this.portfolio.positions.set(symbol, position);

        // Record trade
        const trade = {
            id: Date.now().toString(),
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            symbol,
            side: 'buy',
            quantity,
            price,
            fee,
            exchange,
            totalValue: price * quantity
        };
        
        this.trades.push(trade);
        
        console.log(`📈 BUY: ${quantity} ${symbol} at $${price} (Fee: $${fee.toFixed(4)})`);
        
        // Emit events
        this.emitEvent('trade', trade);
        this.emitEvent('positionUpdate', { symbol, position });
        
        // Save to database
        this.saveToDatabase();
        
        return true;
    }

    sellMarket(symbol, quantity, exchange = 'paper') {
        const position = this.portfolio.positions.get(symbol);
        if (!position || position.quantity < quantity) {
            console.warn(`Insufficient ${symbol} to sell. Have ${position?.quantity || 0}, trying to sell ${quantity}`);
            return false;
        }

        const priceData = this.currentPrices.get(symbol);
        if (!priceData) {
            console.warn(`No price data for ${symbol}`);
            return false;
        }

        const price = priceData.price;
        const fee = this.calculateFee(price, quantity, exchange);
        const totalReceived = (price * quantity) - fee;

        // Execute trade
        this.portfolio.cash += totalReceived;
        
        // Update position
        position.quantity -= quantity;
        if (position.quantity <= 0) {
            this.portfolio.positions.delete(symbol);
        } else {
            position.currentPrice = price;
            position.unrealizedPnL = (price - position.averagePrice) * position.quantity;
        }

        // Record trade
        const trade = {
            id: Date.now().toString(),
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            symbol,
            side: 'sell',
            quantity,
            price,
            fee,
            exchange,
            totalValue: price * quantity
        };
        
        this.trades.push(trade);
        
        console.log(`📉 SELL: ${quantity} ${symbol} at $${price} (Fee: $${fee.toFixed(4)})`);
        
        // Emit events
        this.emitEvent('trade', trade);
        this.emitEvent('positionUpdate', { symbol, position: position.quantity > 0 ? position : null });
        
        // Save to database
        this.saveToDatabase();
        
        return true;
    }

    getPortfolioValue() {
        let totalValue = this.portfolio.cash;
        
        for (const [symbol, position] of this.portfolio.positions) {
            const priceData = this.currentPrices.get(symbol);
            if (priceData) {
                totalValue += position.quantity * priceData.price;
            }
        }
        
        return totalValue;
    }

    getUnrealizedPnL() {
        let totalUnrealizedPnL = 0;
        
        for (const [symbol, position] of this.portfolio.positions) {
            if (position.unrealizedPnL) {
                totalUnrealizedPnL += position.unrealizedPnL;
            }
        }
        
        return totalUnrealizedPnL;
    }

    getLargestPosition() {
        let largestPosition = null;
        let largestValue = 0;
        
        for (const [symbol, position] of this.portfolio.positions) {
            const priceData = this.currentPrices.get(symbol);
            if (priceData) {
                const value = position.quantity * priceData.price;
                if (value > largestValue) {
                    largestValue = value;
                    largestPosition = {
                        asset: symbol,
                        quantity: position.quantity,
                        averagePrice: position.averagePrice,
                        entryTime: new Date().toISOString() // Simplified for now
                    };
                }
            }
        }
        
        return largestPosition;
    }

    getPortfolioSummary() {
        const totalValue = this.getPortfolioValue();
        const totalPnL = totalValue - this.portfolio.initialCash;
        const totalPnLPercent = (totalPnL / this.portfolio.initialCash) * 100;
        
        return {
            sessionId: this.sessionId,
            cash: this.portfolio.cash,
            totalValue,
            totalPnL,
            totalPnLPercent,
            positions: Array.from(this.portfolio.positions.values()),
            tradesCount: this.trades.length,
            isActive: this.isActive
        };
    }

    getRecentTrades(limit = 10) {
        return this.trades
            .slice(-limit)
            .reverse()
            .map(trade => ({
                ...trade,
                timestamp: new Date(trade.timestamp).toLocaleString()
            }));
    }

    // Public methods for external access
    getPortfolio() {
        return {
            cash: this.portfolio.cash,
            positions: Object.fromEntries(this.portfolio.positions),
            initialCash: this.portfolio.initialCash
        };
    }

    getTrades() {
        return [...this.trades];
    }

    updateConfig(config) {
        if (config.initialCash !== undefined) {
            this.portfolio.initialCash = config.initialCash;
        }
        // Save updated config
        this.saveToDatabase();
    }

    start() {
        this.isActive = true;
        console.log(`🚀 Paper trading started for session ${this.sessionId}`);
        this.emitEvent('started', { sessionId: this.sessionId });
    }

    stop() {
        this.isActive = false;
        console.log(`⏹️ Paper trading stopped for session ${this.sessionId}`);
        this.emitEvent('stopped', { sessionId: this.sessionId });
    }

    reset() {
        this.portfolio = {
            cash: this.portfolio.initialCash,
            positions: new Map(),
            initialCash: this.portfolio.initialCash
        };
        this.trades = [];
        this.saveToDatabase();
        console.log(`🔄 Paper trading reset for session ${this.sessionId}`);
        this.emitEvent('reset', { sessionId: this.sessionId });
    }
}

// Export for use in other modules
window.PaperTradingEngine = PaperTradingEngine;

// Default instance for backward compatibility
if (!window.paperTradingEngine) {
    window.paperTradingEngine = new PaperTradingEngine('default');
}

console.log('📊 Paper Trading Engine (JS) loaded successfully!'); 
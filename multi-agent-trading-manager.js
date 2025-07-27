/**
 * Multi-Agent Trading Manager - JavaScript Version
 * Converted from TypeScript for direct browser usage
 */

// Agent templates configuration
const AGENT_TEMPLATES = {
    conservative: {
        id: 'conservative',
        name: 'Conservative Growth',
        description: 'Low-risk, steady growth strategy with capital preservation focus',
        config: {
            initialCash: 50000,
            maxDrawdown: 5,
            riskLevel: 1,
            positionSize: 2,
            expectedReturn: 8
        },
        strategy: 'conservative'
    },
    aggressive: {
        id: 'aggressive',
        name: 'Aggressive Momentum',
        description: 'High-risk, high-reward momentum trading with large positions',
        config: {
            initialCash: 100000,
            maxDrawdown: 25,
            riskLevel: 5,
            positionSize: 10,
            expectedReturn: 35
        },
        strategy: 'aggressive'
    },
    balanced: {
        id: 'balanced',
        name: 'Balanced Trader',
        description: 'Moderate risk with diversified approach and steady returns',
        config: {
            initialCash: 75000,
            maxDrawdown: 15,
            riskLevel: 3,
            positionSize: 5,
            expectedReturn: 18
        },
        strategy: 'balanced'
    },
    scalper: {
        id: 'scalper',
        name: 'Scalper Pro',
        description: 'High-frequency trading with small profits and tight stops',
        config: {
            initialCash: 25000,
            maxDrawdown: 8,
            riskLevel: 4,
            positionSize: 1,
            expectedReturn: 22
        },
        strategy: 'scalper'
    },
    arbitrage: {
        id: 'arbitrage',
        name: 'Multi-Asset Arbitrage',
        description: 'Exploits price differences across exchanges and assets',
        config: {
            initialCash: 150000,
            maxDrawdown: 3,
            riskLevel: 2,
            positionSize: 8,
            expectedReturn: 12
        },
        strategy: 'arbitrage'
    },
    whale: {
        id: 'whale',
        name: 'Whale Hunter',
        description: 'Follows large orders and institutional movements',
        config: {
            initialCash: 200000,
            maxDrawdown: 20,
            riskLevel: 4,
            positionSize: 15,
            expectedReturn: 28
        },
        strategy: 'whale'
    }
};

class TradingAgent {
    constructor(id, name, template, sessionId) {
        this.id = id;
        this.name = name;
        this.template = template;
        this.sessionId = sessionId;
        this.config = { ...template.config };
        this.status = 'inactive';
        this.createdAt = new Date();
        this.lastActivity = new Date();
        
        // Performance metrics
        this.metrics = {
            totalReturn: 0,
            totalReturnPercent: 0,
            winRate: 0,
            profitFactor: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            averageWin: 0,
            averageLoss: 0,
            largestWin: 0,
            largestLoss: 0
        };
        
        // Initialize paper trading engine for this agent
        this.paperTrading = new PaperTradingEngine(sessionId);
        this.paperTrading.portfolio.cash = this.config.initialCash;
        this.paperTrading.portfolio.initialCash = this.config.initialCash;
        
        // Strategy instance
        this.strategy = null;
        this.initializeStrategy();
        
        console.log(`🤖 Agent ${this.name} created with ${template.name} template`);
    }

    initializeStrategy() {
        // Import strategy based on template
        if (window.TradingStrategies && window.TradingStrategies[this.template.strategy]) {
            this.strategy = new window.TradingStrategies[this.template.strategy](this.config);
        } else {
            console.warn(`Strategy ${this.template.strategy} not found, using default`);
            this.strategy = {
                shouldBuy: () => Math.random() > 0.7,
                shouldSell: () => Math.random() > 0.8,
                getPositionSize: () => this.config.positionSize
            };
        }
    }

    start() {
        this.status = 'active';
        this.paperTrading.start();
        this.lastActivity = new Date();
        console.log(`🚀 Agent ${this.name} started`);
    }

    stop() {
        this.status = 'inactive';
        this.paperTrading.stop();
        console.log(`⏹️ Agent ${this.name} stopped`);
    }

    pause() {
        this.status = 'paused';
        console.log(`⏸️ Agent ${this.name} paused`);
    }

    resume() {
        if (this.status === 'paused') {
            this.status = 'active';
            console.log(`▶️ Agent ${this.name} resumed`);
        }
    }

    updatePrice(symbol, price, exchange) {
        if (this.status !== 'active') return;
        
        this.paperTrading.updatePrice(symbol, price, exchange);
        this.evaluateTrading(symbol, price, exchange);
        this.updateMetrics();
        this.lastActivity = new Date();
    }

    evaluateTrading(symbol, price, exchange) {
        if (!this.strategy) return;
        
        try {
            // Check if we should buy
            if (this.strategy.shouldBuy(symbol, price, this.paperTrading.getPortfolio())) {
                const positionSize = this.strategy.getPositionSize(this.paperTrading.portfolio.cash);
                const quantity = positionSize / price;
                
                if (this.paperTrading.buyMarket(symbol, quantity, exchange)) {
                    console.log(`🤖 ${this.name}: Bought ${quantity} ${symbol} at ${price}`);
                }
            }
            
            // Check if we should sell
            else if (this.strategy.shouldSell(symbol, price, this.paperTrading.getPortfolio())) {
                const position = this.paperTrading.portfolio.positions.get(symbol);
                if (position && position.quantity > 0) {
                    const sellQuantity = Math.min(position.quantity, position.quantity * 0.5); // Sell 50% max
                    
                    if (this.paperTrading.sellMarket(symbol, sellQuantity, exchange)) {
                        console.log(`🤖 ${this.name}: Sold ${sellQuantity} ${symbol} at ${price}`);
                    }
                }
            }
        } catch (error) {
            console.error(`Error in agent ${this.name} trading evaluation:`, error);
        }
    }

    updateMetrics() {
        const portfolio = this.paperTrading.getPortfolioSummary();
        const trades = this.paperTrading.getTrades();
        
        this.metrics.totalReturn = portfolio.totalPnL;
        this.metrics.totalReturnPercent = portfolio.totalPnLPercent;
        this.metrics.totalTrades = trades.length;
        
        // Calculate win/loss metrics
        const winningTrades = trades.filter(t => {
            // Simple profit calculation - would need more sophisticated logic for real P&L
            return t.side === 'sell'; // Assume sells are profit-taking
        });
        
        this.metrics.winningTrades = winningTrades.length;
        this.metrics.losingTrades = this.metrics.totalTrades - this.metrics.winningTrades;
        this.metrics.winRate = this.metrics.totalTrades > 0 
            ? (this.metrics.winningTrades / this.metrics.totalTrades) * 100 
            : 0;
    }

    getStatus() {
        return {
            id: this.id,
            name: this.name,
            template: this.template.name,
            status: this.status,
            createdAt: this.createdAt,
            lastActivity: this.lastActivity,
            config: this.config,
            metrics: this.metrics,
            portfolio: this.paperTrading.getPortfolioSummary()
        };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.paperTrading.updateConfig(newConfig);
        console.log(`⚙️ Agent ${this.name} config updated`);
    }
}

class MultiAgentTradingManager {
    constructor() {
        this.agents = new Map();
        this.maxAgents = 10;
        this.isActive = false;
        this.activityLog = [];
        this.eventEmitter = new EventTarget();
        
        console.log('🎯 Multi-Agent Trading Manager initialized');
    }

    createAgent(templateId, customName = null) {
        if (this.agents.size >= this.maxAgents) {
            throw new Error(`Maximum number of agents (${this.maxAgents}) reached`);
        }

        const template = AGENT_TEMPLATES[templateId];
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }

        const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sessionId = `session_${agentId}`;
        const name = customName || `${template.name} #${this.agents.size + 1}`;

        const agent = new TradingAgent(agentId, name, template, sessionId);
        this.agents.set(agentId, agent);

        this.logActivity('info', `Agent created: ${name} (${template.name})`);
        this.emitEvent('agentCreated', { agentId, agent: agent.getStatus() });

        return agent;
    }

    deleteAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        agent.stop();
        this.agents.delete(agentId);

        this.logActivity('warning', `Agent deleted: ${agent.name}`);
        this.emitEvent('agentDeleted', { agentId });
    }

    startAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        agent.start();
        this.logActivity('success', `Agent started: ${agent.name}`);
        this.emitEvent('agentStarted', { agentId, agent: agent.getStatus() });
    }

    stopAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        agent.stop();
        this.logActivity('info', `Agent stopped: ${agent.name}`);
        this.emitEvent('agentStopped', { agentId, agent: agent.getStatus() });
    }

    pauseAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        agent.pause();
        this.logActivity('info', `Agent paused: ${agent.name}`);
        this.emitEvent('agentPaused', { agentId, agent: agent.getStatus() });
    }

    resumeAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        agent.resume();
        this.logActivity('success', `Agent resumed: ${agent.name}`);
        this.emitEvent('agentResumed', { agentId, agent: agent.getStatus() });
    }

    updateAgentConfig(agentId, config) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        agent.updateConfig(config);
        this.logActivity('info', `Agent config updated: ${agent.name}`);
        this.emitEvent('agentConfigUpdated', { agentId, config, agent: agent.getStatus() });
    }

    updatePrice(symbol, price, exchange) {
        if (!this.isActive) return;

        // Update all active agents
        for (const agent of this.agents.values()) {
            if (agent.status === 'active') {
                agent.updatePrice(symbol, price, exchange);
            }
        }
    }

    startSystem() {
        this.isActive = true;
        this.logActivity('success', 'Multi-Agent Trading System started');
        this.emitEvent('systemStarted', {});
        console.log('🚀 Multi-Agent Trading System started');
    }

    stopSystem() {
        this.isActive = false;
        
        // Stop all agents
        for (const agent of this.agents.values()) {
            if (agent.status === 'active') {
                agent.stop();
            }
        }

        this.logActivity('warning', 'Multi-Agent Trading System stopped');
        this.emitEvent('systemStopped', {});
        console.log('⏹️ Multi-Agent Trading System stopped');
    }

    getAllAgents() {
        return Array.from(this.agents.values()).map(agent => agent.getStatus());
    }

    getAgent(agentId) {
        const agent = this.agents.get(agentId);
        return agent ? agent.getStatus() : null;
    }

    getSystemStatus() {
        const agents = this.getAllAgents();
        const activeAgents = agents.filter(a => a.status === 'active').length;
        const totalValue = agents.reduce((sum, a) => sum + a.portfolio.totalValue, 0);
        const totalPnL = agents.reduce((sum, a) => sum + a.portfolio.totalPnL, 0);

        return {
            isActive: this.isActive,
            totalAgents: agents.length,
            activeAgents,
            totalValue,
            totalPnL,
            totalPnLPercent: totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0,
            agents
        };
    }

    getPerformanceComparison() {
        const agents = this.getAllAgents();
        
        return agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            template: agent.template,
            status: agent.status,
            totalReturn: agent.metrics.totalReturn,
            totalReturnPercent: agent.metrics.totalReturnPercent,
            winRate: agent.metrics.winRate,
            totalTrades: agent.metrics.totalTrades,
            portfolioValue: agent.portfolio.totalValue,
            drawdown: agent.metrics.maxDrawdown
        })).sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);
    }

    logActivity(type, message) {
        const entry = {
            timestamp: new Date(),
            type, // 'success', 'error', 'warning', 'info'
            message
        };
        
        this.activityLog.unshift(entry);
        
        // Keep only last 100 entries
        if (this.activityLog.length > 100) {
            this.activityLog = this.activityLog.slice(0, 100);
        }

        this.emitEvent('activityLogged', entry);
    }

    getActivityLog(limit = 20) {
        return this.activityLog.slice(0, limit);
    }

    emitEvent(type, data) {
        const event = new CustomEvent(type, { detail: data });
        this.eventEmitter.dispatchEvent(event);
        
        // Also emit to global document
        document.dispatchEvent(new CustomEvent(`multiAgent${type}`, { detail: data }));
    }

    addEventListener(type, listener) {
        this.eventEmitter.addEventListener(type, listener);
    }

    removeEventListener(type, listener) {
        this.eventEmitter.removeEventListener(type, listener);
    }
}

// Export for global usage
window.MultiAgentTradingManager = MultiAgentTradingManager;
window.TradingAgent = TradingAgent;
window.AGENT_TEMPLATES = AGENT_TEMPLATES;

// Create global instance
if (!window.multiAgentManager) {
    window.multiAgentManager = new MultiAgentTradingManager();
}

console.log('🤖 Multi-Agent Trading Manager (JS) loaded successfully!'); 
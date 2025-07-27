// Multi-Agent Trading Manager
// Orchestrates multiple AI trading agents with different strategies, configurations, and portfolios

import { logger } from './utils';
import { SUPPORTED_EXCHANGES_WITH_DEX } from './config';
import { paperTradingDb, type TradeRecord, type PortfolioState, type TradingConfiguration } from './paper-trading-db-client';

interface AgentConfig {
    id: string;
    name: string;
    description: string;
    exchange: string;
    asset: string;
    strategy: string;
    initialCapital: number;
    tradingSpeed: string;
    riskLevel: string;
    positionSize: number;
    aiPersonality: string;
    isActive: boolean;
    autoRestart: boolean;
    maxDrawdown: number;
    profitTarget: number;
    color: string; // For UI visualization
}

interface AgentPerformance {
    totalReturn: number;
    totalReturnPercent: number;
    dailyReturn: number;
    dailyReturnPercent: number;
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    currentDrawdown: number;
    lastUpdate: number;
    isRunning: boolean;
    currentThought?: string;
    confidence?: number;
}

interface AgentTemplate {
    name: string;
    description: string;
    config: Partial<AgentConfig>;
    tags: string[];
}

class MultiAgentTradingManager {
    private agents: Map<string, any> = new Map(); // Agent instances
    private agentConfigs: Map<string, AgentConfig> = new Map();
    private agentPerformance: Map<string, AgentPerformance> = new Map();
    private agentTemplates: AgentTemplate[] = [];
    private isInitialized = false;
    private updateInterval: NodeJS.Timeout | null = null;
    private maxConcurrentAgents = 10;
    private globalPaused = false;

    constructor() {
        this.initializeTemplates();
        this.loadSavedAgents();
        this.initializeUI();
        this.startPerformanceMonitoring();
    }

    private initializeTemplates() {
        this.agentTemplates = [
            {
                name: "Conservative Growth",
                description: "Low-risk strategy focusing on steady, consistent returns",
                config: {
                    strategy: "meanReversion",
                    riskLevel: "low",
                    positionSize: 5,
                    aiPersonality: "conservative",
                    tradingSpeed: "slow",
                    maxDrawdown: 5,
                    profitTarget: 15,
                    color: "#22c55e"
                },
                tags: ["low-risk", "stable", "beginner-friendly"]
            },
            {
                name: "Aggressive Momentum",
                description: "High-risk, high-reward momentum trading strategy",
                config: {
                    strategy: "momentum",
                    riskLevel: "high",
                    positionSize: 25,
                    aiPersonality: "aggressive",
                    tradingSpeed: "fast",
                    maxDrawdown: 20,
                    profitTarget: 50,
                    color: "#ef4444"
                },
                tags: ["high-risk", "momentum", "experienced"]
            },
            {
                name: "Balanced Trader",
                description: "Moderate risk approach with diversified strategies",
                config: {
                    strategy: "momentum",
                    riskLevel: "medium",
                    positionSize: 15,
                    aiPersonality: "balanced",
                    tradingSpeed: "moderate",
                    maxDrawdown: 10,
                    profitTarget: 25,
                    color: "#3b82f6"
                },
                tags: ["medium-risk", "balanced", "recommended"]
            },
            {
                name: "Whale Hunter",
                description: "Follows large market movements and whale activity",
                config: {
                    strategy: "whale",
                    riskLevel: "medium",
                    positionSize: 20,
                    aiPersonality: "analytical",
                    tradingSpeed: "fast",
                    maxDrawdown: 15,
                    profitTarget: 40,
                    color: "#8b5cf6"
                },
                tags: ["whale-following", "volume-based", "advanced"]
            },
            {
                name: "Scalper Pro",
                description: "High-frequency trading with small, quick profits",
                config: {
                    strategy: "scalper",
                    riskLevel: "medium",
                    positionSize: 10,
                    aiPersonality: "precise",
                    tradingSpeed: "ultrafast",
                    maxDrawdown: 8,
                    profitTarget: 20,
                    color: "#f59e0b"
                },
                tags: ["scalping", "high-frequency", "expert"]
            },
            {
                name: "Multi-Asset Arbitrage",
                description: "Exploits price differences across assets and exchanges",
                config: {
                    strategy: "arbitrage",
                    riskLevel: "low",
                    positionSize: 12,
                    aiPersonality: "methodical",
                    tradingSpeed: "fast",
                    maxDrawdown: 6,
                    profitTarget: 18,
                    color: "#06b6d4"
                },
                tags: ["arbitrage", "low-risk", "consistent"]
            }
        ];
    }

    // Agent Management
    async createAgent(template: string, customName?: string, customConfig?: Partial<AgentConfig>): Promise<string> {
        const templateConfig = this.agentTemplates.find(t => t.name === template);
        if (!templateConfig) {
            throw new Error(`Template "${template}" not found`);
        }

        const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const agentName = customName || `${templateConfig.name} #${this.agents.size + 1}`;

        const config: AgentConfig = {
            id: agentId,
            name: agentName,
            description: templateConfig.description,
            exchange: 'binance',
            asset: 'BTCUSDT',
            strategy: 'momentum',
            initialCapital: 10000,
            tradingSpeed: 'moderate',
            riskLevel: 'medium',
            positionSize: 10,
            aiPersonality: 'balanced',
            isActive: false,
            autoRestart: false,
            maxDrawdown: 10,
            profitTarget: 25,
            color: '#3b82f6',
            ...templateConfig.config,
            ...customConfig,
            id: agentId,
            name: agentName
        };

        // Store configuration
        this.agentConfigs.set(agentId, config);

        // Initialize performance tracking
        this.agentPerformance.set(agentId, {
            totalReturn: 0,
            totalReturnPercent: 0,
            dailyReturn: 0,
            dailyReturnPercent: 0,
            totalTrades: 0,
            winRate: 0,
            profitFactor: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            currentDrawdown: 0,
            lastUpdate: Date.now(),
            isRunning: false
        });

        // Create agent instance
        const agent = await this.createAgentInstance(config);
        this.agents.set(agentId, agent);

        // Save to database
        await this.saveAgentConfig(agentId);

        // Update UI
        this.updateAgentsList();
        this.addActivity(`Created new agent: ${agentName}`, 'success');

        logger.log(`Multi-Agent: Created agent "${agentName}" with strategy "${config.strategy}"`);
        return agentId;
    }

    async deleteAgent(agentId: string): Promise<void> {
        const config = this.agentConfigs.get(agentId);
        if (!config) return;

        // Stop agent if running
        await this.stopAgent(agentId);

        // Remove from maps
        this.agents.delete(agentId);
        this.agentConfigs.delete(agentId);
        this.agentPerformance.delete(agentId);

        // Update UI
        this.updateAgentsList();
        this.addActivity(`Deleted agent: ${config.name}`, 'warning');

        logger.log(`Multi-Agent: Deleted agent "${config.name}"`);
    }

    async startAgent(agentId: string): Promise<void> {
        const agent = this.agents.get(agentId);
        const config = this.agentConfigs.get(agentId);
        
        if (!agent || !config) {
            throw new Error(`Agent ${agentId} not found`);
        }

        if (this.getActiveAgentsCount() >= this.maxConcurrentAgents) {
            throw new Error(`Maximum concurrent agents (${this.maxConcurrentAgents}) reached`);
        }

        config.isActive = true;
        await agent.startTrading();
        
        const performance = this.agentPerformance.get(agentId);
        if (performance) {
            performance.isRunning = true;
            performance.lastUpdate = Date.now();
        }

        this.updateAgentStatus(agentId);
        this.addActivity(`Started agent: ${config.name}`, 'success');
        
        logger.log(`Multi-Agent: Started agent "${config.name}"`);
    }

    async stopAgent(agentId: string): Promise<void> {
        const agent = this.agents.get(agentId);
        const config = this.agentConfigs.get(agentId);
        
        if (!agent || !config) return;

        config.isActive = false;
        await agent.stopTrading();
        
        const performance = this.agentPerformance.get(agentId);
        if (performance) {
            performance.isRunning = false;
        }

        this.updateAgentStatus(agentId);
        this.addActivity(`Stopped agent: ${config.name}`, 'warning');
        
        logger.log(`Multi-Agent: Stopped agent "${config.name}"`);
    }

    async pauseAllAgents(): Promise<void> {
        this.globalPaused = true;
        for (const [agentId, config] of this.agentConfigs.entries()) {
            if (config.isActive) {
                await this.stopAgent(agentId);
            }
        }
        this.addActivity('Paused all agents', 'warning');
        this.updateGlobalControls();
    }

    async resumeAllAgents(): Promise<void> {
        this.globalPaused = false;
        let resumedCount = 0;
        
        for (const [agentId, config] of this.agentConfigs.entries()) {
            if (!config.isActive && config.autoRestart) {
                await this.startAgent(agentId);
                resumedCount++;
            }
        }
        
        this.addActivity(`Resumed ${resumedCount} agents`, 'success');
        this.updateGlobalControls();
    }

    // Performance & Analytics
    getAgentPerformance(agentId: string): AgentPerformance | null {
        return this.agentPerformance.get(agentId) || null;
    }

    getAllPerformance(): { agentId: string; config: AgentConfig; performance: AgentPerformance }[] {
        const results = [];
        for (const [agentId, config] of this.agentConfigs.entries()) {
            const performance = this.agentPerformance.get(agentId);
            if (performance) {
                results.push({ agentId, config, performance });
            }
        }
        return results.sort((a, b) => b.performance.totalReturnPercent - a.performance.totalReturnPercent);
    }

    getActiveAgentsCount(): number {
        return Array.from(this.agentConfigs.values()).filter(config => config.isActive).length;
    }

    getTotalPortfolioValue(): number {
        let totalValue = 0;
        for (const agent of this.agents.values()) {
            totalValue += agent.getPortfolioValue();
        }
        return totalValue;
    }

    getBestPerformingAgent(): { agentId: string; config: AgentConfig; performance: AgentPerformance } | null {
        const performances = this.getAllPerformance();
        return performances.length > 0 ? performances[0] : null;
    }

    // Agent Instance Creation
    private async createAgentInstance(config: AgentConfig) {
        // Import the PaperTradingEngine class
        const { PaperTradingEngine } = await import('./paper-trading');
        
        // Create new instance with custom session ID
        const agent = new PaperTradingEngine(config.id);
        
        // Configure the agent
        await agent.updateConfig({
            exchange: config.exchange,
            asset: config.asset,
            strategy: config.strategy,
            initialCapital: config.initialCapital,
            tradingSpeed: config.tradingSpeed,
            riskLevel: config.riskLevel,
            positionSize: config.positionSize,
            aiPersonality: config.aiPersonality
        });

        // Set up event listeners for performance tracking
        agent.on('trade', (trade: any) => this.handleAgentTrade(config.id, trade));
        agent.on('thought', (thought: string) => this.handleAgentThought(config.id, thought));
        agent.on('portfolioUpdate', (portfolio: any) => this.handlePortfolioUpdate(config.id, portfolio));

        return agent;
    }

    // Event Handlers
    private handleAgentTrade(agentId: string, trade: any) {
        const performance = this.agentPerformance.get(agentId);
        if (!performance) return;

        performance.totalTrades++;
        performance.lastUpdate = Date.now();
        
        // Update performance metrics
        this.updateAgentPerformance(agentId);
        this.updateAgentStatus(agentId);
        
        // Log trade
        const config = this.agentConfigs.get(agentId);
        if (config) {
            this.addActivity(`${config.name}: ${trade.side.toUpperCase()} ${trade.asset} @ $${trade.price.toFixed(2)}`, 'info');
        }
    }

    private handleAgentThought(agentId: string, thought: string) {
        const performance = this.agentPerformance.get(agentId);
        if (performance) {
            performance.currentThought = thought;
            performance.lastUpdate = Date.now();
        }
        this.updateAgentStatus(agentId);
    }

    private handlePortfolioUpdate(agentId: string, portfolio: any) {
        this.updateAgentPerformance(agentId);
        this.updateAgentStatus(agentId);
        this.updateOverallStats();
    }

    // Performance Calculation
    private updateAgentPerformance(agentId: string) {
        const agent = this.agents.get(agentId);
        const config = this.agentConfigs.get(agentId);
        const performance = this.agentPerformance.get(agentId);
        
        if (!agent || !config || !performance) return;

        const portfolio = agent.getPortfolio();
        const trades = agent.getTrades();

        // Calculate returns
        performance.totalReturn = portfolio.totalValue - config.initialCapital;
        performance.totalReturnPercent = ((portfolio.totalValue / config.initialCapital) - 1) * 100;

        // Calculate daily return
        const dayStartValue = portfolio.dayStartValue || config.initialCapital;
        performance.dailyReturn = portfolio.totalValue - dayStartValue;
        performance.dailyReturnPercent = ((portfolio.totalValue / dayStartValue) - 1) * 100;

        // Calculate win rate
        if (trades.length > 0) {
            const profitableTrades = trades.filter((t: any) => t.pnl > 0).length;
            performance.winRate = (profitableTrades / trades.length) * 100;
        }

        // Calculate profit factor
        const profits = trades.filter((t: any) => t.pnl > 0).reduce((sum: number, t: any) => sum + t.pnl, 0);
        const losses = Math.abs(trades.filter((t: any) => t.pnl < 0).reduce((sum: number, t: any) => sum + t.pnl, 0));
        performance.profitFactor = losses > 0 ? profits / losses : profits > 0 ? 999 : 0;

        // Calculate drawdown
        const peak = Math.max(config.initialCapital, ...trades.map((t: any) => t.portfolioValue || config.initialCapital));
        performance.currentDrawdown = ((peak - portfolio.totalValue) / peak) * 100;
        performance.maxDrawdown = Math.max(performance.maxDrawdown, performance.currentDrawdown);

        performance.lastUpdate = Date.now();
    }

    // Performance Monitoring
    private startPerformanceMonitoring() {
        this.updateInterval = setInterval(() => {
            for (const agentId of this.agents.keys()) {
                this.updateAgentPerformance(agentId);
            }
            this.updateOverallStats();
            this.checkAgentAlerts();
        }, 5000); // Update every 5 seconds
    }

    private checkAgentAlerts() {
        for (const [agentId, config] of this.agentConfigs.entries()) {
            const performance = this.agentPerformance.get(agentId);
            if (!performance || !config.isActive) continue;

            // Check drawdown limits
            if (performance.currentDrawdown > config.maxDrawdown) {
                this.stopAgent(agentId);
                this.addActivity(`⚠️ ${config.name}: Stopped due to max drawdown (${performance.currentDrawdown.toFixed(2)}%)`, 'error');
            }

            // Check profit targets
            if (performance.totalReturnPercent > config.profitTarget) {
                this.addActivity(`🎯 ${config.name}: Profit target reached (${performance.totalReturnPercent.toFixed(2)}%)`, 'success');
            }
        }
    }

    // Database Operations
    private async saveAgentConfig(agentId: string) {
        const config = this.agentConfigs.get(agentId);
        if (!config) return;

        try {
            await paperTradingDb.saveConfiguration(config);
        } catch (error) {
            logger.error(`Failed to save agent config for ${agentId}:`, error);
        }
    }

    private async loadSavedAgents() {
        try {
            // Load from database if available
            const sessions = await paperTradingDb.getSessions();
            for (const session of sessions) {
                if (session.session_id.startsWith('agent_')) {
                    // Restore agent from session data
                    const config = await paperTradingDb.getConfiguration();
                    if (config) {
                        this.agentConfigs.set(session.session_id, config);
                        const agent = await this.createAgentInstance(config);
                        this.agents.set(session.session_id, agent);
                    }
                }
            }
        } catch (error) {
            logger.warn('Failed to load saved agents:', error);
        }
    }

    // UI Management
    private initializeUI() {
        this.createMultiAgentInterface();
        this.bindEventListeners();
    }

    private createMultiAgentInterface() {
        // Create main multi-agent container
        const container = document.createElement('div');
        container.id = 'multi-agent-container';
        container.className = 'multi-agent-container';
        container.innerHTML = `
            <div class="multi-agent-header">
                <div class="header-title">
                    <h2>🤖 Multi-Agent Trading System</h2>
                    <div class="global-stats">
                        <span class="stat-item">
                            <span class="stat-label">Active:</span>
                            <span class="stat-value" id="active-agents-count">0</span>
                        </span>
                        <span class="stat-item">
                            <span class="stat-label">Total Value:</span>
                            <span class="stat-value" id="total-portfolio-value">$0</span>
                        </span>
                        <span class="stat-item">
                            <span class="stat-label">Best Performer:</span>
                            <span class="stat-value" id="best-performer">N/A</span>
                        </span>
                    </div>
                </div>
                
                <div class="global-controls">
                    <button id="create-agent-btn" class="btn btn-primary">
                        <span class="btn-icon">➕</span>
                        Create Agent
                    </button>
                    <button id="pause-all-btn" class="btn btn-warning">
                        <span class="btn-icon">⏸️</span>
                        Pause All
                    </button>
                    <button id="resume-all-btn" class="btn btn-success" disabled>
                        <span class="btn-icon">▶️</span>
                        Resume All
                    </button>
                    <button id="comparison-view-btn" class="btn btn-secondary">
                        <span class="btn-icon">📊</span>
                        Compare Performance
                    </button>
                </div>
            </div>

            <div class="multi-agent-content">
                <div class="agents-list" id="agents-list">
                    <div class="no-agents-placeholder">
                        <div class="placeholder-icon">🤖</div>
                        <h3>No Trading Agents Yet</h3>
                        <p>Create your first AI trading agent to get started</p>
                        <button class="btn btn-primary" onclick="window.multiAgentManager.showCreateAgentModal()">
                            Create Your First Agent
                        </button>
                    </div>
                </div>
                
                <div class="activity-panel">
                    <h3>🔔 Activity Feed</h3>
                    <div class="activity-list" id="activity-list">
                        <div class="activity-item">
                            <span class="activity-time">Just now</span>
                            <span class="activity-message">Multi-Agent System initialized</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Create Agent Modal -->
            <div id="create-agent-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create New Trading Agent</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="agent-templates">
                            <h4>Choose Agent Template</h4>
                            <div class="templates-grid" id="templates-grid">
                                <!-- Templates will be populated here -->
                            </div>
                        </div>
                        
                        <div class="agent-customization">
                            <h4>Customize Agent</h4>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Agent Name</label>
                                    <input type="text" id="agent-name" placeholder="My Trading Agent">
                                </div>
                                <div class="form-group">
                                    <label>Initial Capital</label>
                                    <input type="number" id="agent-capital" value="10000" min="1000" max="1000000">
                                </div>
                                <div class="form-group">
                                    <label>Exchange</label>
                                    <select id="agent-exchange">
                                        <option value="binance">Binance</option>
                                        <option value="bybit">Bybit</option>
                                        <option value="okx">OKX</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Trading Pair</label>
                                    <select id="agent-asset">
                                        <option value="BTCUSDT">BTC/USDT</option>
                                        <option value="ETHUSDT">ETH/USDT</option>
                                        <option value="SOLUSDT">SOL/USDT</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Auto-Restart</label>
                                    <input type="checkbox" id="agent-auto-restart">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="window.multiAgentManager.hideCreateAgentModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="window.multiAgentManager.createAgentFromModal()">Create Agent</button>
                    </div>
                </div>
            </div>

            <!-- Performance Comparison Modal -->
            <div id="comparison-modal" class="modal" style="display: none;">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>Agent Performance Comparison</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="comparison-content" id="comparison-content">
                            <!-- Comparison data will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert into page
        const targetContainer = document.getElementById('paper-trading-section') || document.body;
        targetContainer.appendChild(container);

        // Populate templates
        this.populateAgentTemplates();
    }

    private populateAgentTemplates() {
        const templatesGrid = document.getElementById('templates-grid');
        if (!templatesGrid) return;

        templatesGrid.innerHTML = this.agentTemplates.map(template => `
            <div class="template-card" data-template="${template.name}">
                <div class="template-header" style="border-left: 4px solid ${template.config.color}">
                    <h5>${template.name}</h5>
                    <div class="template-tags">
                        ${template.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <p class="template-description">${template.description}</p>
                <div class="template-stats">
                    <span>Risk: ${template.config.riskLevel}</span>
                    <span>Speed: ${template.config.tradingSpeed}</span>
                    <span>Size: ${template.config.positionSize}%</span>
                </div>
            </div>
        `).join('');

        // Add click handlers
        templatesGrid.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                templatesGrid.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });
    }

    private bindEventListeners() {
        // Global controls
        document.getElementById('create-agent-btn')?.addEventListener('click', () => this.showCreateAgentModal());
        document.getElementById('pause-all-btn')?.addEventListener('click', () => this.pauseAllAgents());
        document.getElementById('resume-all-btn')?.addEventListener('click', () => this.resumeAllAgents());
        document.getElementById('comparison-view-btn')?.addEventListener('click', () => this.showComparisonModal());

        // Modal controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = (e.target as HTMLElement).closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).classList.contains('modal')) {
                (e.target as HTMLElement).style.display = 'none';
            }
        });
    }

    // UI Update Methods
    private updateAgentsList() {
        const agentsList = document.getElementById('agents-list');
        if (!agentsList) return;

        if (this.agents.size === 0) {
            agentsList.innerHTML = `
                <div class="no-agents-placeholder">
                    <div class="placeholder-icon">🤖</div>
                    <h3>No Trading Agents Yet</h3>
                    <p>Create your first AI trading agent to get started</p>
                    <button class="btn btn-primary" onclick="window.multiAgentManager.showCreateAgentModal()">
                        Create Your First Agent
                    </button>
                </div>
            `;
            return;
        }

        const agentsHtml = Array.from(this.agentConfigs.entries()).map(([agentId, config]) => {
            const performance = this.agentPerformance.get(agentId);
            return this.createAgentCard(agentId, config, performance);
        }).join('');

        agentsList.innerHTML = agentsHtml;

        // Bind agent control events
        this.bindAgentControls();
    }

    private createAgentCard(agentId: string, config: AgentConfig, performance?: AgentPerformance): string {
        const isRunning = performance?.isRunning || false;
        const returnPercent = performance?.totalReturnPercent || 0;
        const returnClass = returnPercent >= 0 ? 'positive' : 'negative';
        
        return `
            <div class="agent-card" data-agent-id="${agentId}">
                <div class="agent-header" style="border-left: 4px solid ${config.color}">
                    <div class="agent-info">
                        <h4>${config.name}</h4>
                        <p class="agent-description">${config.description}</p>
                        <div class="agent-meta">
                            <span class="meta-item">${config.strategy}</span>
                            <span class="meta-item">${config.asset}</span>
                            <span class="meta-item">${config.exchange}</span>
                        </div>
                    </div>
                    <div class="agent-status">
                        <div class="status-indicator ${isRunning ? 'running' : 'stopped'}">
                            ${isRunning ? '🟢' : '🔴'}
                        </div>
                        <span class="status-text">${isRunning ? 'Active' : 'Stopped'}</span>
                    </div>
                </div>

                <div class="agent-performance">
                    <div class="performance-grid">
                        <div class="perf-item">
                            <span class="perf-label">Total Return</span>
                            <span class="perf-value ${returnClass}">
                                ${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(2)}%
                            </span>
                        </div>
                        <div class="perf-item">
                            <span class="perf-label">Trades</span>
                            <span class="perf-value">${performance?.totalTrades || 0}</span>
                        </div>
                        <div class="perf-item">
                            <span class="perf-label">Win Rate</span>
                            <span class="perf-value">${(performance?.winRate || 0).toFixed(1)}%</span>
                        </div>
                        <div class="perf-item">
                            <span class="perf-label">Drawdown</span>
                            <span class="perf-value">${(performance?.currentDrawdown || 0).toFixed(1)}%</span>
                        </div>
                    </div>
                    
                    ${performance?.currentThought ? `
                        <div class="agent-thought">
                            <span class="thought-icon">💭</span>
                            <span class="thought-text">${performance.currentThought}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="agent-controls">
                    <button class="btn btn-sm ${isRunning ? 'btn-warning' : 'btn-success'}" 
                            onclick="window.multiAgentManager.${isRunning ? 'stopAgent' : 'startAgent'}('${agentId}')">
                        ${isRunning ? '⏹️ Stop' : '▶️ Start'}
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="window.multiAgentManager.configureAgent('${agentId}')">
                        ⚙️ Config
                    </button>
                    <button class="btn btn-sm btn-info" onclick="window.multiAgentManager.viewAgentDetails('${agentId}')">
                        📊 Details
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.multiAgentManager.deleteAgent('${agentId}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }

    private bindAgentControls() {
        // Agent controls are handled via onclick attributes in HTML
        // This method can be extended for additional event binding
    }

    private updateAgentStatus(agentId: string) {
        const agentCard = document.querySelector(`[data-agent-id="${agentId}"]`);
        if (!agentCard) return;

        const config = this.agentConfigs.get(agentId);
        const performance = this.agentPerformance.get(agentId);
        
        if (!config || !performance) return;

        // Update status indicator
        const statusIndicator = agentCard.querySelector('.status-indicator');
        const statusText = agentCard.querySelector('.status-text');
        
        if (statusIndicator && statusText) {
            const isRunning = performance.isRunning;
            statusIndicator.className = `status-indicator ${isRunning ? 'running' : 'stopped'}`;
            statusIndicator.textContent = isRunning ? '🟢' : '🔴';
            statusText.textContent = isRunning ? 'Active' : 'Stopped';
        }

        // Update performance values
        const perfItems = agentCard.querySelectorAll('.perf-value');
        if (perfItems.length >= 4) {
            const returnPercent = performance.totalReturnPercent;
            perfItems[0].textContent = `${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(2)}%`;
            perfItems[0].className = `perf-value ${returnPercent >= 0 ? 'positive' : 'negative'}`;
            perfItems[1].textContent = performance.totalTrades.toString();
            perfItems[2].textContent = `${performance.winRate.toFixed(1)}%`;
            perfItems[3].textContent = `${performance.currentDrawdown.toFixed(1)}%`;
        }

        // Update thought bubble
        const existingThought = agentCard.querySelector('.agent-thought');
        if (performance.currentThought) {
            if (!existingThought) {
                const thoughtDiv = document.createElement('div');
                thoughtDiv.className = 'agent-thought';
                thoughtDiv.innerHTML = `
                    <span class="thought-icon">💭</span>
                    <span class="thought-text">${performance.currentThought}</span>
                `;
                agentCard.querySelector('.agent-performance')?.appendChild(thoughtDiv);
            } else {
                const thoughtText = existingThought.querySelector('.thought-text');
                if (thoughtText) thoughtText.textContent = performance.currentThought;
            }
        } else if (existingThought) {
            existingThought.remove();
        }
    }

    private updateOverallStats() {
        const activeCount = this.getActiveAgentsCount();
        const totalValue = this.getTotalPortfolioValue();
        const bestPerformer = this.getBestPerformingAgent();

        // Update active agents count
        const activeCountEl = document.getElementById('active-agents-count');
        if (activeCountEl) activeCountEl.textContent = activeCount.toString();

        // Update total portfolio value
        const totalValueEl = document.getElementById('total-portfolio-value');
        if (totalValueEl) totalValueEl.textContent = `$${totalValue.toLocaleString()}`;

        // Update best performer
        const bestPerformerEl = document.getElementById('best-performer');
        if (bestPerformerEl) {
            if (bestPerformer) {
                bestPerformerEl.textContent = `${bestPerformer.config.name} (+${bestPerformer.performance.totalReturnPercent.toFixed(1)}%)`;
            } else {
                bestPerformerEl.textContent = 'N/A';
            }
        }
    }

    private updateGlobalControls() {
        const pauseBtn = document.getElementById('pause-all-btn');
        const resumeBtn = document.getElementById('resume-all-btn');
        
        if (pauseBtn && resumeBtn) {
            if (this.globalPaused) {
                pauseBtn.setAttribute('disabled', 'true');
                resumeBtn.removeAttribute('disabled');
            } else {
                pauseBtn.removeAttribute('disabled');
                resumeBtn.setAttribute('disabled', 'true');
            }
        }
    }

    private addActivity(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        const activityItem = document.createElement('div');
        activityItem.className = `activity-item activity-${type}`;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        
        activityItem.innerHTML = `
            <span class="activity-time">${timeStr}</span>
            <span class="activity-message">${message}</span>
        `;

        // Insert at the beginning
        activityList.insertBefore(activityItem, activityList.firstChild);

        // Keep only last 50 activities
        while (activityList.children.length > 50) {
            activityList.removeChild(activityList.lastChild);
        }

        // Auto-scroll to top
        activityList.scrollTop = 0;
    }

    // Modal Methods
    showCreateAgentModal() {
        const modal = document.getElementById('create-agent-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Reset form
            (document.getElementById('agent-name') as HTMLInputElement).value = '';
            // Clear template selection
            document.querySelectorAll('.template-card').forEach(card => {
                card.classList.remove('selected');
            });
        }
    }

    hideCreateAgentModal() {
        const modal = document.getElementById('create-agent-modal');
        if (modal) modal.style.display = 'none';
    }

    async createAgentFromModal() {
        const selectedTemplate = document.querySelector('.template-card.selected');
        if (!selectedTemplate) {
            alert('Please select an agent template');
            return;
        }

        const templateName = selectedTemplate.getAttribute('data-template');
        const agentName = (document.getElementById('agent-name') as HTMLInputElement).value;
        const capital = parseFloat((document.getElementById('agent-capital') as HTMLInputElement).value);
        const exchange = (document.getElementById('agent-exchange') as HTMLSelectElement).value;
        const asset = (document.getElementById('agent-asset') as HTMLSelectElement).value;
        const autoRestart = (document.getElementById('agent-auto-restart') as HTMLInputElement).checked;

        try {
            await this.createAgent(templateName!, agentName || undefined, {
                initialCapital: capital,
                exchange,
                asset,
                autoRestart
            });
            this.hideCreateAgentModal();
        } catch (error) {
            alert(`Failed to create agent: ${error}`);
        }
    }

    showComparisonModal() {
        const modal = document.getElementById('comparison-modal');
        if (!modal) return;

        const comparisonContent = document.getElementById('comparison-content');
        if (!comparisonContent) return;

        // Generate comparison data
        const allPerformance = this.getAllPerformance();
        
        if (allPerformance.length === 0) {
            comparisonContent.innerHTML = `
                <div class="no-data-placeholder">
                    <h4>No agents to compare</h4>
                    <p>Create some trading agents first to see performance comparison</p>
                </div>
            `;
        } else {
            comparisonContent.innerHTML = this.generateComparisonTable(allPerformance);
        }

        modal.style.display = 'flex';
    }

    private generateComparisonTable(performances: any[]): string {
        return `
            <div class="comparison-table-container">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Strategy</th>
                            <th>Status</th>
                            <th>Total Return</th>
                            <th>Daily Return</th>
                            <th>Trades</th>
                            <th>Win Rate</th>
                            <th>Profit Factor</th>
                            <th>Max Drawdown</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${performances.map(item => {
                            const { config, performance } = item;
                            const isRunning = performance.isRunning;
                            const returnClass = performance.totalReturnPercent >= 0 ? 'positive' : 'negative';
                            
                            return `
                                <tr>
                                    <td>
                                        <div class="agent-name-cell">
                                            <div class="agent-color" style="background: ${config.color}"></div>
                                            <span>${config.name}</span>
                                        </div>
                                    </td>
                                    <td>${config.strategy}</td>
                                    <td>
                                        <span class="status-badge ${isRunning ? 'running' : 'stopped'}">
                                            ${isRunning ? 'Active' : 'Stopped'}
                                        </span>
                                    </td>
                                    <td class="${returnClass}">
                                        ${performance.totalReturnPercent >= 0 ? '+' : ''}${performance.totalReturnPercent.toFixed(2)}%
                                    </td>
                                    <td class="${performance.dailyReturnPercent >= 0 ? 'positive' : 'negative'}">
                                        ${performance.dailyReturnPercent >= 0 ? '+' : ''}${performance.dailyReturnPercent.toFixed(2)}%
                                    </td>
                                    <td>${performance.totalTrades}</td>
                                    <td>${performance.winRate.toFixed(1)}%</td>
                                    <td>${performance.profitFactor.toFixed(2)}</td>
                                    <td>${performance.maxDrawdown.toFixed(1)}%</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-xs ${isRunning ? 'btn-warning' : 'btn-success'}"
                                                    onclick="window.multiAgentManager.${isRunning ? 'stopAgent' : 'startAgent'}('${config.id}')">
                                                ${isRunning ? 'Stop' : 'Start'}
                                            </button>
                                            <button class="btn btn-xs btn-info"
                                                    onclick="window.multiAgentManager.viewAgentDetails('${config.id}')">
                                                Details
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Agent Management Methods (called from UI)
    async configureAgent(agentId: string) {
        // TODO: Implement agent configuration modal
        alert('Agent configuration coming soon!');
    }

    async viewAgentDetails(agentId: string) {
        // TODO: Implement detailed agent view
        alert('Agent details view coming soon!');
    }

    // Cleanup
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Stop all agents
        for (const agentId of this.agents.keys()) {
            this.stopAgent(agentId);
        }

        // Remove UI
        const container = document.getElementById('multi-agent-container');
        if (container) {
            container.remove();
        }
    }
}

// Global instance
let multiAgentManager: MultiAgentTradingManager | null = null;

// Initialize multi-agent system
export function initializeMultiAgentSystem() {
    if (!multiAgentManager) {
        multiAgentManager = new MultiAgentTradingManager();
        (window as any).multiAgentManager = multiAgentManager;
        logger.log('Multi-Agent Trading System initialized');
    }
    return multiAgentManager;
}

// Export for global access
export { MultiAgentTradingManager }; 
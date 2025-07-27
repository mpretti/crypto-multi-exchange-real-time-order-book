/**
 * AI Trading Playground - Advanced Features
 * Strategy Builder, Backtesting Engine, and Professional Tools
 */

class AdvancedFeatures {
    constructor(playground) {
        this.playground = playground;
        this.strategyBuilder = new VisualStrategyBuilder();
        this.backtester = new BacktestingEngine();
        this.portfolioAnalyzer = new PortfolioAnalyzer();
        this.marketScanner = new MarketScanner();
        this.riskManager = new RiskManager();
        
        this.init();
    }

    init() {
        this.addAdvancedControls();
        this.initializeModules();
    }

    addAdvancedControls() {
        // Add advanced menu to header
        const headerControls = document.querySelector('.header-controls');
        const advancedBtn = document.createElement('button');
        advancedBtn.className = 'advanced-btn glass-effect';
        advancedBtn.innerHTML = `
            <i class="fas fa-cogs"></i>
            <span>Advanced</span>
        `;
        advancedBtn.addEventListener('click', () => this.showAdvancedPanel());
        headerControls.insertBefore(advancedBtn, headerControls.children[1]);

        // Create advanced features panel
        this.createAdvancedPanel();
    }

    createAdvancedPanel() {
        const advancedPanel = document.createElement('div');
        advancedPanel.className = 'modal-overlay';
        advancedPanel.id = 'advancedPanel';
        advancedPanel.innerHTML = `
            <div class="advanced-panel-modal glass-effect">
                <div class="modal-header">
                    <h2>🔧 Advanced Trading Tools</h2>
                    <button class="modal-close" id="closeAdvancedPanel">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="advanced-content">
                    <!-- Tool Selector -->
                    <div class="tools-sidebar">
                        <div class="tool-category">
                            <h3>Strategy Development</h3>
                            <button class="tool-btn active" data-tool="builder">
                                <i class="fas fa-sitemap"></i>
                                Visual Builder
                            </button>
                            <button class="tool-btn" data-tool="backtest">
                                <i class="fas fa-chart-area"></i>
                                Backtester
                            </button>
                            <button class="tool-btn" data-tool="optimizer">
                                <i class="fas fa-sliders-h"></i>
                                Optimizer
                            </button>
                        </div>
                        
                        <div class="tool-category">
                            <h3>Analysis Tools</h3>
                            <button class="tool-btn" data-tool="portfolio">
                                <i class="fas fa-pie-chart"></i>
                                Portfolio Analysis
                            </button>
                            <button class="tool-btn" data-tool="scanner">
                                <i class="fas fa-search"></i>
                                Market Scanner
                            </button>
                            <button class="tool-btn" data-tool="risk">
                                <i class="fas fa-shield-alt"></i>
                                Risk Manager
                            </button>
                        </div>
                        
                        <div class="tool-category">
                            <h3>Research</h3>
                            <button class="tool-btn" data-tool="correlation">
                                <i class="fas fa-project-diagram"></i>
                                Correlation Matrix
                            </button>
                            <button class="tool-btn" data-tool="sentiment">
                                <i class="fas fa-brain"></i>
                                Market Sentiment
                            </button>
                        </div>
                    </div>
                    
                    <!-- Tool Content Area -->
                    <div class="tools-content">
                        <div class="tool-panel active" id="builder-panel">
                            ${this.createStrategyBuilderPanel()}
                        </div>
                        
                        <div class="tool-panel" id="backtest-panel">
                            ${this.createBacktestPanel()}
                        </div>
                        
                        <div class="tool-panel" id="optimizer-panel">
                            ${this.createOptimizerPanel()}
                        </div>
                        
                        <div class="tool-panel" id="portfolio-panel">
                            ${this.createPortfolioPanel()}
                        </div>
                        
                        <div class="tool-panel" id="scanner-panel">
                            ${this.createScannerPanel()}
                        </div>
                        
                        <div class="tool-panel" id="risk-panel">
                            ${this.createRiskPanel()}
                        </div>
                        
                        <div class="tool-panel" id="correlation-panel">
                            ${this.createCorrelationPanel()}
                        </div>
                        
                        <div class="tool-panel" id="sentiment-panel">
                            ${this.createSentimentPanel()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(advancedPanel);
        
        // Add event listeners
        document.getElementById('closeAdvancedPanel').addEventListener('click', () => {
            advancedPanel.classList.remove('active');
        });
        
        // Tool switching
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolName = e.target.dataset.tool;
                this.switchTool(toolName);
            });
        });
        
        advancedPanel.addEventListener('click', (e) => {
            if (e.target === advancedPanel) {
                advancedPanel.classList.remove('active');
            }
        });
    }

    createStrategyBuilderPanel() {
        return `
            <div class="strategy-builder">
                <div class="builder-header">
                    <h3>Visual Strategy Builder</h3>
                    <div class="builder-actions">
                        <button class="btn-secondary" id="loadTemplate">Load Template</button>
                        <button class="btn-primary" id="saveStrategy">Save Strategy</button>
                    </div>
                </div>
                
                <div class="builder-workspace">
                    <!-- Components Palette -->
                    <div class="components-palette">
                        <h4>Components</h4>
                        
                        <div class="component-category">
                            <h5>Inputs</h5>
                            <div class="component" draggable="true" data-type="price">
                                <i class="fas fa-dollar-sign"></i>
                                Price
                            </div>
                            <div class="component" draggable="true" data-type="volume">
                                <i class="fas fa-chart-bar"></i>
                                Volume
                            </div>
                            <div class="component" draggable="true" data-type="time">
                                <i class="fas fa-clock"></i>
                                Time
                            </div>
                        </div>
                        
                        <div class="component-category">
                            <h5>Indicators</h5>
                            <div class="component" draggable="true" data-type="sma">
                                <i class="fas fa-chart-line"></i>
                                SMA
                            </div>
                            <div class="component" draggable="true" data-type="rsi">
                                <i class="fas fa-wave-square"></i>
                                RSI
                            </div>
                            <div class="component" draggable="true" data-type="macd">
                                <i class="fas fa-signal"></i>
                                MACD
                            </div>
                            <div class="component" draggable="true" data-type="bollinger">
                                <i class="fas fa-arrows-alt-v"></i>
                                Bollinger
                            </div>
                        </div>
                        
                        <div class="component-category">
                            <h5>Logic</h5>
                            <div class="component" draggable="true" data-type="condition">
                                <i class="fas fa-question"></i>
                                Condition
                            </div>
                            <div class="component" draggable="true" data-type="and">
                                <i class="fas fa-plus"></i>
                                AND
                            </div>
                            <div class="component" draggable="true" data-type="or">
                                <i class="fas fa-code-branch"></i>
                                OR
                            </div>
                        </div>
                        
                        <div class="component-category">
                            <h5>Actions</h5>
                            <div class="component" draggable="true" data-type="buy">
                                <i class="fas fa-arrow-up text-green-400"></i>
                                Buy
                            </div>
                            <div class="component" draggable="true" data-type="sell">
                                <i class="fas fa-arrow-down text-red-400"></i>
                                Sell
                            </div>
                            <div class="component" draggable="true" data-type="hold">
                                <i class="fas fa-pause text-yellow-400"></i>
                                Hold
                            </div>
                        </div>
                    </div>
                    
                    <!-- Canvas -->
                    <div class="strategy-canvas" id="strategyCanvas">
                        <div class="canvas-grid"></div>
                        <div class="canvas-content">
                            <div class="welcome-message">
                                <i class="fas fa-mouse-pointer"></i>
                                <h4>Drag components here to build your strategy</h4>
                                <p>Connect components with lines to create trading logic</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Properties Panel -->
                    <div class="properties-panel">
                        <h4>Properties</h4>
                        <div class="property-content" id="propertyContent">
                            <p class="no-selection">Select a component to edit properties</p>
                        </div>
                    </div>
                </div>
                
                <div class="builder-footer">
                    <div class="strategy-status">
                        <span class="status-indicator">●</span>
                        <span>Ready to build</span>
                    </div>
                    <div class="builder-controls">
                        <button class="btn-secondary" id="validateStrategy">Validate</button>
                        <button class="btn-success" id="testStrategy">Test Strategy</button>
                    </div>
                </div>
            </div>
        `;
    }

    createBacktestPanel() {
        return `
            <div class="backtest-panel">
                <div class="backtest-header">
                    <h3>Strategy Backtesting</h3>
                    <button class="btn-primary" id="runBacktest">Run Backtest</button>
                </div>
                
                <div class="backtest-config">
                    <div class="config-section">
                        <h4>Test Parameters</h4>
                        <div class="config-grid">
                            <div class="config-item">
                                <label>Strategy</label>
                                <select id="backtestStrategy">
                                    <option value="sma">Moving Average Crossover</option>
                                    <option value="rsi">RSI Mean Reversion</option>
                                    <option value="custom">Custom Strategy</option>
                                </select>
                            </div>
                            <div class="config-item">
                                <label>Start Date</label>
                                <input type="date" id="backtestStartDate" value="2022-01-01">
                            </div>
                            <div class="config-item">
                                <label>End Date</label>
                                <input type="date" id="backtestEndDate" value="2023-12-31">
                            </div>
                            <div class="config-item">
                                <label>Initial Capital</label>
                                <input type="number" id="backtestCapital" value="10000" min="1000">
                            </div>
                            <div class="config-item">
                                <label>Commission (%)</label>
                                <input type="number" id="backtestCommission" value="0.1" step="0.01" min="0">
                            </div>
                            <div class="config-item">
                                <label>Slippage (%)</label>
                                <input type="number" id="backtestSlippage" value="0.05" step="0.01" min="0">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="backtest-results" id="backtestResults">
                    <div class="results-placeholder">
                        <i class="fas fa-chart-line fa-3x"></i>
                        <h4>No backtest results yet</h4>
                        <p>Configure your parameters and run a backtest to see results</p>
                    </div>
                </div>
            </div>
        `;
    }

    createOptimizerPanel() {
        return `
            <div class="optimizer-panel">
                <div class="optimizer-header">
                    <h3>Strategy Optimizer</h3>
                    <button class="btn-primary" id="startOptimization">Start Optimization</button>
                </div>
                
                <div class="optimization-setup">
                    <div class="param-optimization">
                        <h4>Parameter Ranges</h4>
                        <div class="param-list" id="paramList">
                            <div class="param-item">
                                <span class="param-name">Short SMA Period</span>
                                <div class="param-range">
                                    <input type="number" value="5" min="1" max="50"> to
                                    <input type="number" value="20" min="1" max="50">
                                    <span class="param-step">step: <input type="number" value="1" min="1"></span>
                                </div>
                            </div>
                            <div class="param-item">
                                <span class="param-name">Long SMA Period</span>
                                <div class="param-range">
                                    <input type="number" value="20" min="10" max="100"> to
                                    <input type="number" value="50" min="10" max="100">
                                    <span class="param-step">step: <input type="number" value="5" min="1"></span>
                                </div>
                            </div>
                        </div>
                        <button class="btn-secondary" id="addParam">Add Parameter</button>
                    </div>
                    
                    <div class="optimization-target">
                        <h4>Optimization Target</h4>
                        <div class="target-options">
                            <label class="radio-option">
                                <input type="radio" name="optimTarget" value="return" checked>
                                <span>Total Return</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="optimTarget" value="sharpe">
                                <span>Sharpe Ratio</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="optimTarget" value="profit_factor">
                                <span>Profit Factor</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="optimTarget" value="win_rate">
                                <span>Win Rate</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="optimization-progress" id="optimizationProgress" style="display: none;">
                    <div class="progress-header">
                        <h4>Optimization in Progress</h4>
                        <span class="progress-text">Testing combination 1 of 100...</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="current-best">
                        <span>Current Best: </span>
                        <span class="best-params">SMA(10, 30) - Return: 15.4%</span>
                    </div>
                </div>
                
                <div class="optimization-results" id="optimizationResults">
                    <div class="results-placeholder">
                        <i class="fas fa-sliders-h fa-3x"></i>
                        <h4>No optimization results</h4>
                        <p>Run an optimization to find the best parameters</p>
                    </div>
                </div>
            </div>
        `;
    }

    createPortfolioPanel() {
        return `
            <div class="portfolio-analysis">
                <div class="analysis-header">
                    <h3>Portfolio Analysis</h3>
                    <div class="analysis-controls">
                        <select id="analysisTimeframe">
                            <option value="1M">1 Month</option>
                            <option value="3M">3 Months</option>
                            <option value="6M">6 Months</option>
                            <option value="1Y" selected>1 Year</option>
                            <option value="ALL">All Time</option>
                        </select>
                        <button class="btn-primary" id="refreshAnalysis">Refresh</button>
                    </div>
                </div>
                
                <div class="analysis-grid">
                    <div class="analysis-card">
                        <h4>Risk Metrics</h4>
                        <div class="metrics-list">
                            <div class="metric-row">
                                <span>Value at Risk (95%)</span>
                                <span class="metric-value">$247</span>
                            </div>
                            <div class="metric-row">
                                <span>Expected Shortfall</span>
                                <span class="metric-value">$389</span>
                            </div>
                            <div class="metric-row">
                                <span>Beta</span>
                                <span class="metric-value">1.12</span>
                            </div>
                            <div class="metric-row">
                                <span>Alpha</span>
                                <span class="metric-value">0.023</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-card">
                        <h4>Performance Attribution</h4>
                        <div class="attribution-chart">
                            <canvas id="attributionChart" width="300" height="200"></canvas>
                        </div>
                    </div>
                    
                    <div class="analysis-card">
                        <h4>Drawdown Analysis</h4>
                        <div class="drawdown-chart">
                            <canvas id="drawdownChart" width="300" height="200"></canvas>
                        </div>
                    </div>
                    
                    <div class="analysis-card">
                        <h4>Rolling Returns</h4>
                        <div class="returns-distribution">
                            <canvas id="returnsChart" width="300" height="200"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="detailed-analysis">
                    <h4>Trade Analysis</h4>
                    <div class="trade-stats">
                        <div class="stat-group">
                            <h5>Win/Loss Distribution</h5>
                            <div class="distribution-chart">
                                <canvas id="winLossChart" width="400" height="250"></canvas>
                            </div>
                        </div>
                        
                        <div class="stat-group">
                            <h5>Monthly Returns Heatmap</h5>
                            <div class="returns-heatmap" id="returnsHeatmap">
                                <!-- Heatmap will be generated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createScannerPanel() {
        return `
            <div class="market-scanner">
                <div class="scanner-header">
                    <h3>Market Scanner</h3>
                    <button class="btn-primary" id="runScan">Run Scan</button>
                </div>
                
                <div class="scanner-filters">
                    <div class="filter-section">
                        <h4>Technical Filters</h4>
                        <div class="filter-grid">
                            <div class="filter-item">
                                <label>Price > SMA(20)</label>
                                <input type="checkbox" checked>
                            </div>
                            <div class="filter-item">
                                <label>RSI > 70 (Overbought)</label>
                                <input type="checkbox">
                            </div>
                            <div class="filter-item">
                                <label>RSI < 30 (Oversold)</label>
                                <input type="checkbox">
                            </div>
                            <div class="filter-item">
                                <label>Volume > Avg Volume</label>
                                <input type="checkbox" checked>
                            </div>
                            <div class="filter-item">
                                <label>MACD Bullish Crossover</label>
                                <input type="checkbox">
                            </div>
                            <div class="filter-item">
                                <label>Bollinger Band Squeeze</label>
                                <input type="checkbox">
                            </div>
                        </div>
                    </div>
                    
                    <div class="filter-section">
                        <h4>Price Filters</h4>
                        <div class="price-filters">
                            <div class="filter-row">
                                <label>Price Range</label>
                                <input type="number" placeholder="Min" value="100">
                                <span>to</span>
                                <input type="number" placeholder="Max" value="100000">
                            </div>
                            <div class="filter-row">
                                <label>24h Change %</label>
                                <input type="number" placeholder="Min" value="-5">
                                <span>to</span>
                                <input type="number" placeholder="Max" value="5">
                            </div>
                            <div class="filter-row">
                                <label>Market Cap</label>
                                <select>
                                    <option value="all">All</option>
                                    <option value="large">Large Cap (>$10B)</option>
                                    <option value="mid">Mid Cap ($1B-$10B)</option>
                                    <option value="small">Small Cap (<$1B)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="scan-results" id="scanResults">
                    <div class="results-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Price</th>
                                    <th>24h Change</th>
                                    <th>Volume</th>
                                    <th>RSI</th>
                                    <th>Signal</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="scanResultsBody">
                                <tr class="no-results">
                                    <td colspan="7">
                                        <i class="fas fa-search"></i>
                                        Run a scan to see results
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    createRiskPanel() {
        return `
            <div class="risk-manager">
                <div class="risk-header">
                    <h3>Risk Management</h3>
                    <div class="risk-status">
                        <span class="risk-level low">Low Risk</span>
                    </div>
                </div>
                
                <div class="risk-settings">
                    <div class="setting-section">
                        <h4>Position Sizing</h4>
                        <div class="risk-controls">
                            <div class="control-item">
                                <label>Max Position Size (%)</label>
                                <input type="range" min="1" max="50" value="10" id="maxPositionSize">
                                <span class="value">10%</span>
                            </div>
                            <div class="control-item">
                                <label>Risk per Trade (%)</label>
                                <input type="range" min="0.5" max="5" value="2" step="0.5" id="riskPerTrade">
                                <span class="value">2%</span>
                            </div>
                            <div class="control-item">
                                <label>Max Daily Loss (%)</label>
                                <input type="range" min="1" max="10" value="5" id="maxDailyLoss">
                                <span class="value">5%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-section">
                        <h4>Stop Loss Rules</h4>
                        <div class="stop-loss-config">
                            <label class="checkbox-option">
                                <input type="checkbox" checked id="enableStopLoss">
                                <span>Enable Stop Loss</span>
                            </label>
                            <div class="stop-loss-settings">
                                <div class="setting-row">
                                    <label>Stop Loss Type</label>
                                    <select id="stopLossType">
                                        <option value="fixed">Fixed Percentage</option>
                                        <option value="atr">ATR Based</option>
                                        <option value="support">Support/Resistance</option>
                                    </select>
                                </div>
                                <div class="setting-row">
                                    <label>Stop Loss %</label>
                                    <input type="number" value="3" min="0.5" max="10" step="0.5" id="stopLossPercent">
                                </div>
                                <div class="setting-row">
                                    <label>Trailing Stop</label>
                                    <input type="checkbox" id="trailingStop">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-section">
                        <h4>Portfolio Limits</h4>
                        <div class="portfolio-limits">
                            <div class="limit-item">
                                <label>Max Open Positions</label>
                                <input type="number" value="5" min="1" max="20" id="maxPositions">
                            </div>
                            <div class="limit-item">
                                <label>Max Correlation</label>
                                <input type="number" value="0.7" min="0.1" max="1" step="0.1" id="maxCorrelation">
                            </div>
                            <div class="limit-item">
                                <label>Sector Concentration (%)</label>
                                <input type="number" value="30" min="10" max="100" id="sectorLimit">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="risk-dashboard">
                    <h4>Current Risk Exposure</h4>
                    <div class="risk-metrics">
                        <div class="risk-gauge">
                            <canvas id="riskGauge" width="200" height="200"></canvas>
                            <div class="gauge-label">Portfolio Risk</div>
                        </div>
                        
                        <div class="risk-breakdown">
                            <div class="risk-item">
                                <span>Position Risk</span>
                                <div class="risk-bar">
                                    <div class="risk-fill" style="width: 35%"></div>
                                </div>
                                <span>35%</span>
                            </div>
                            <div class="risk-item">
                                <span>Correlation Risk</span>
                                <div class="risk-bar">
                                    <div class="risk-fill" style="width: 60%"></div>
                                </div>
                                <span>60%</span>
                            </div>
                            <div class="risk-item">
                                <span>Concentration Risk</span>
                                <div class="risk-bar">
                                    <div class="risk-fill" style="width: 25%"></div>
                                </div>
                                <span>25%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createCorrelationPanel() {
        return `
            <div class="correlation-analysis">
                <div class="correlation-header">
                    <h3>Correlation Matrix</h3>
                    <div class="correlation-controls">
                        <select id="correlationTimeframe">
                            <option value="30">30 Days</option>
                            <option value="90" selected>90 Days</option>
                            <option value="180">180 Days</option>
                            <option value="365">1 Year</option>
                        </select>
                        <button class="btn-primary" id="updateCorrelation">Update</button>
                    </div>
                </div>
                
                <div class="correlation-matrix" id="correlationMatrix">
                    <div class="matrix-placeholder">
                        <i class="fas fa-project-diagram fa-3x"></i>
                        <h4>Correlation Matrix</h4>
                        <p>Add positions to see correlation analysis</p>
                    </div>
                </div>
                
                <div class="correlation-insights">
                    <h4>Correlation Insights</h4>
                    <div class="insights-list" id="correlationInsights">
                        <div class="insight-item">
                            <i class="fas fa-info-circle text-blue-400"></i>
                            <span>Build a portfolio to see correlation insights</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createSentimentPanel() {
        return `
            <div class="sentiment-analysis">
                <div class="sentiment-header">
                    <h3>Market Sentiment</h3>
                    <div class="sentiment-controls">
                        <select id="sentimentSource">
                            <option value="all">All Sources</option>
                            <option value="news">News</option>
                            <option value="social">Social Media</option>
                            <option value="options">Options Flow</option>
                        </select>
                        <button class="btn-primary" id="refreshSentiment">Refresh</button>
                    </div>
                </div>
                
                <div class="sentiment-overview">
                    <div class="sentiment-gauge">
                        <canvas id="sentimentGauge" width="200" height="200"></canvas>
                        <div class="sentiment-score">
                            <span class="score-value">72</span>
                            <span class="score-label">Bullish</span>
                        </div>
                    </div>
                    
                    <div class="sentiment-breakdown">
                        <div class="sentiment-source">
                            <span class="source-name">News Sentiment</span>
                            <div class="sentiment-bar">
                                <div class="sentiment-fill positive" style="width: 68%"></div>
                            </div>
                            <span class="sentiment-value">+68</span>
                        </div>
                        <div class="sentiment-source">
                            <span class="source-name">Social Media</span>
                            <div class="sentiment-bar">
                                <div class="sentiment-fill positive" style="width: 75%"></div>
                            </div>
                            <span class="sentiment-value">+75</span>
                        </div>
                        <div class="sentiment-source">
                            <span class="source-name">Options Flow</span>
                            <div class="sentiment-bar">
                                <div class="sentiment-fill neutral" style="width: 52%"></div>
                            </div>
                            <span class="sentiment-value">+52</span>
                        </div>
                    </div>
                </div>
                
                <div class="sentiment-trends">
                    <h4>Sentiment Trends</h4>
                    <div class="trends-chart">
                        <canvas id="sentimentTrends" width="600" height="300"></canvas>
                    </div>
                </div>
                
                <div class="sentiment-alerts">
                    <h4>Sentiment Alerts</h4>
                    <div class="alerts-list">
                        <div class="alert-item positive">
                            <i class="fas fa-arrow-up"></i>
                            <span>BTC sentiment improved 15% in last 24h</span>
                            <span class="alert-time">2 hours ago</span>
                        </div>
                        <div class="alert-item negative">
                            <i class="fas fa-arrow-down"></i>
                            <span>ETH options showing bearish bias</span>
                            <span class="alert-time">6 hours ago</span>
                        </div>
                        <div class="alert-item neutral">
                            <i class="fas fa-minus"></i>
                            <span>Market sentiment stabilizing after volatility</span>
                            <span class="alert-time">1 day ago</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showAdvancedPanel() {
        document.getElementById('advancedPanel').classList.add('active');
    }

    switchTool(toolName) {
        // Update tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === toolName);
        });
        
        // Update tool panels
        document.querySelectorAll('.tool-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${toolName}-panel`);
        });
    }

    initializeModules() {
        // Initialize all advanced modules
        this.strategyBuilder.init();
        this.backtester.init();
        this.portfolioAnalyzer.init();
        this.marketScanner.init();
        this.riskManager.init();
    }
}

// Individual module classes
class VisualStrategyBuilder {
    constructor() {
        this.components = [];
        this.connections = [];
        this.selectedComponent = null;
    }

    init() {
        console.log('Visual Strategy Builder initialized');
        // Implementation for drag-and-drop strategy building
    }
}

class BacktestingEngine {
    constructor() {
        this.strategies = [];
        this.results = {};
    }

    init() {
        console.log('Backtesting Engine initialized');
    }

    async runBacktest(strategy, parameters) {
        // Simulate backtesting
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    totalReturn: 23.4,
                    sharpeRatio: 1.45,
                    maxDrawdown: 8.2,
                    winRate: 65.3,
                    trades: 42
                });
            }, 3000);
        });
    }
}

class PortfolioAnalyzer {
    constructor() {
        this.portfolioData = {};
    }

    init() {
        console.log('Portfolio Analyzer initialized');
    }

    calculateRiskMetrics() {
        // Calculate VaR, Sharpe, etc.
        return {
            var95: 247,
            expectedShortfall: 389,
            beta: 1.12,
            alpha: 0.023
        };
    }
}

class MarketScanner {
    constructor() {
        this.filters = {};
        this.results = [];
    }

    init() {
        console.log('Market Scanner initialized');
    }

    async runScan(filters) {
        // Simulate market scanning
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { symbol: 'BTC', price: 45000, change: 2.3, volume: 1250000, rsi: 68, signal: 'BUY' },
                    { symbol: 'ETH', price: 3200, change: -1.2, volume: 890000, rsi: 45, signal: 'HOLD' },
                    { symbol: 'ADA', price: 0.85, change: 4.7, volume: 2100000, rsi: 72, signal: 'SELL' }
                ]);
            }, 2000);
        });
    }
}

class RiskManager {
    constructor() {
        this.rules = {};
        this.limits = {};
    }

    init() {
        console.log('Risk Manager initialized');
    }

    assessRisk(portfolio) {
        // Calculate portfolio risk
        return {
            totalRisk: 35,
            positionRisk: 25,
            concentrationRisk: 40,
            correlationRisk: 60
        };
    }
}

// Export for use in main playground
window.AdvancedFeatures = AdvancedFeatures; 
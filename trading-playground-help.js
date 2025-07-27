/**
 * AI Trading Playground - Interactive Help System
 * Contextual guidance, tooltips, and comprehensive documentation
 */

class HelpSystem {
    constructor(playground) {
        this.playground = playground;
        this.helpData = this.initializeHelpData();
        this.activeTooltip = null;
        this.helpModal = null;
        
        this.init();
    }

    init() {
        this.addHelpButton();
        this.createHelpModal();
        this.addTooltips();
        this.addContextualHelp();
    }

    addHelpButton() {
        // Add help button to header
        const headerControls = document.querySelector('.header-controls');
        const helpBtn = document.createElement('button');
        helpBtn.className = 'help-btn glass-effect';
        helpBtn.innerHTML = `
            <i class="fas fa-question-circle"></i>
            <span>Help</span>
        `;
        helpBtn.addEventListener('click', () => this.showHelpCenter());
        headerControls.insertBefore(helpBtn, headerControls.children[2]);
    }

    createHelpModal() {
        this.helpModal = document.createElement('div');
        this.helpModal.className = 'modal-overlay';
        this.helpModal.id = 'helpModal';
        this.helpModal.innerHTML = `
            <div class="help-modal glass-effect">
                <div class="modal-header">
                    <h2>📚 Help Center</h2>
                    <button class="modal-close" id="closeHelpModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="help-content">
                    <!-- Search Bar -->
                    <div class="help-search">
                        <div class="search-container">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" placeholder="Search help articles..." id="helpSearch" class="search-input">
                            <button class="search-clear" id="clearSearch" style="display: none;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Help Categories -->
                    <div class="help-categories">
                        <button class="category-btn active" data-category="getting-started">
                            <i class="fas fa-play-circle"></i>
                            Getting Started
                        </button>
                        <button class="category-btn" data-category="agents">
                            <i class="fas fa-robot"></i>
                            AI Agents
                        </button>
                        <button class="category-btn" data-category="strategies">
                            <i class="fas fa-brain"></i>
                            Strategies
                        </button>
                        <button class="category-btn" data-category="metrics">
                            <i class="fas fa-chart-bar"></i>
                            Metrics
                        </button>
                        <button class="category-btn" data-category="tools">
                            <i class="fas fa-tools"></i>
                            Tools
                        </button>
                        <button class="category-btn" data-category="troubleshooting">
                            <i class="fas fa-wrench"></i>
                            Troubleshooting
                        </button>
                    </div>
                    
                    <!-- Help Articles -->
                    <div class="help-articles" id="helpArticles">
                        <!-- Content will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.helpModal);
        
        // Add event listeners
        document.getElementById('closeHelpModal').addEventListener('click', () => {
            this.helpModal.classList.remove('active');
        });
        
        // Category switching
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.showHelpCategory(category);
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('helpSearch');
        const clearSearch = document.getElementById('clearSearch');
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query) {
                this.searchHelp(query);
                clearSearch.style.display = 'block';
            } else {
                this.showHelpCategory('getting-started');
                clearSearch.style.display = 'none';
            }
        });
        
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            clearSearch.style.display = 'none';
            this.showHelpCategory('getting-started');
        });
        
        // Close on background click
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.helpModal.classList.remove('active');
            }
        });
        
        this.showHelpCategory('getting-started');
    }

    initializeHelpData() {
        return {
            'getting-started': [
                {
                    title: 'Welcome to AI Trading Playground',
                    content: `
                        <p>Welcome to your journey from zero to AI trading hero! This comprehensive platform teaches algorithmic trading through hands-on experience.</p>
                        
                        <h4>Quick Start Steps:</h4>
                        <ol>
                            <li><strong>Complete the Tutorial:</strong> Click the "Learn" button and follow the interactive guide</li>
                            <li><strong>Choose an Agent:</strong> Start with Simple Moving Average for beginners</li>
                            <li><strong>Set Your Capital:</strong> Begin with $10,000 virtual money</li>
                            <li><strong>Start Trading:</strong> Click "Start Trading" and watch your AI agent work</li>
                            <li><strong>Analyze Performance:</strong> Study the metrics to understand what works</li>
                        </ol>
                        
                        <div class="help-tip">
                            <i class="fas fa-lightbulb"></i>
                            <strong>Pro Tip:</strong> Don't skip the tutorial! It covers essential concepts you'll need throughout your journey.
                        </div>
                    `,
                    keywords: ['start', 'begin', 'first', 'tutorial', 'getting started']
                },
                {
                    title: 'Understanding the Interface',
                    content: `
                        <p>The trading playground is divided into several key panels:</p>
                        
                        <h4>Main Panels:</h4>
                        <ul>
                            <li><strong>Agent Panel (Top Left):</strong> Configure your AI trading agent</li>
                            <li><strong>Chart Panel (Top Right):</strong> View price charts and technical indicators</li>
                            <li><strong>Time Machine (Bottom Left):</strong> Control simulation speed and timeline</li>
                            <li><strong>Performance (Bottom Center):</strong> Track portfolio metrics and returns</li>
                            <li><strong>Activity Feed (Bottom Right):</strong> See live trading decisions and alerts</li>
                        </ul>
                        
                        <h4>Header Controls:</h4>
                        <ul>
                            <li><strong>Learn Button:</strong> Access tutorials and learning content</li>
                            <li><strong>Advanced Button:</strong> Open professional trading tools</li>
                            <li><strong>Help Button:</strong> Access this help system</li>
                            <li><strong>Settings:</strong> Customize themes and preferences</li>
                        </ul>
                    `,
                    keywords: ['interface', 'panels', 'layout', 'navigation', 'controls']
                }
            ],
            'agents': [
                {
                    title: 'Simple Moving Average Agent',
                    content: `
                        <p>Perfect for beginners learning trend-following strategies.</p>
                        
                        <h4>How It Works:</h4>
                        <ul>
                            <li>Calculates fast and slow moving averages</li>
                            <li>Buys when fast MA crosses above slow MA (Golden Cross)</li>
                            <li>Sells when fast MA crosses below slow MA (Death Cross)</li>
                        </ul>
                        
                        <h4>Best Market Conditions:</h4>
                        <ul>
                            <li>Trending markets (up or down)</li>
                            <li>Markets with clear directional moves</li>
                            <li>Avoid during sideways/choppy conditions</li>
                        </ul>
                        
                        <h4>Typical Performance:</h4>
                        <ul>
                            <li><strong>Annual Return:</strong> 12-18%</li>
                            <li><strong>Win Rate:</strong> 60-70%</li>
                            <li><strong>Max Drawdown:</strong> 8-15%</li>
                            <li><strong>Sharpe Ratio:</strong> 1.0-1.5</li>
                        </ul>
                    `,
                    keywords: ['sma', 'moving average', 'trend', 'golden cross', 'beginner']
                },
                {
                    title: 'RSI Mean Reversion Agent',
                    content: `
                        <p>Intermediate strategy that profits from market overreactions.</p>
                        
                        <h4>How It Works:</h4>
                        <ul>
                            <li>Uses Relative Strength Index (RSI) to measure momentum</li>
                            <li>Buys when RSI < 30 (oversold conditions)</li>
                            <li>Sells when RSI > 70 (overbought conditions)</li>
                            <li>Assumes prices will revert to the mean</li>
                        </ul>
                        
                        <h4>Best Market Conditions:</h4>
                        <ul>
                            <li>Range-bound markets</li>
                            <li>High volatility periods</li>
                            <li>Markets with frequent reversals</li>
                        </ul>
                        
                        <h4>Typical Performance:</h4>
                        <ul>
                            <li><strong>Annual Return:</strong> 15-22%</li>
                            <li><strong>Win Rate:</strong> 55-65%</li>
                            <li><strong>Max Drawdown:</strong> 10-18%</li>
                            <li><strong>Sharpe Ratio:</strong> 0.8-1.3</li>
                        </ul>
                    `,
                    keywords: ['rsi', 'mean reversion', 'oversold', 'overbought', 'intermediate']
                },
                {
                    title: 'Deep Q-Learning Agent',
                    content: `
                        <p>Advanced AI agent using neural networks and reinforcement learning.</p>
                        
                        <h4>How It Works:</h4>
                        <ul>
                            <li>Neural network learns from market patterns</li>
                            <li>Uses experience replay to improve decisions</li>
                            <li>Adapts to changing market conditions</li>
                            <li>Considers multiple timeframes and indicators</li>
                        </ul>
                        
                        <h4>Key Features:</h4>
                        <ul>
                            <li><strong>Pattern Recognition:</strong> Identifies complex market patterns</li>
                            <li><strong>Adaptive Learning:</strong> Improves performance over time</li>
                            <li><strong>Multi-Factor Analysis:</strong> Considers price, volume, volatility</li>
                            <li><strong>Risk Awareness:</strong> Adjusts position sizes based on confidence</li>
                        </ul>
                        
                        <h4>Typical Performance:</h4>
                        <ul>
                            <li><strong>Annual Return:</strong> 20-35%</li>
                            <li><strong>Win Rate:</strong> 70-75%</li>
                            <li><strong>Max Drawdown:</strong> 12-25%</li>
                            <li><strong>Sharpe Ratio:</strong> 1.5-2.2</li>
                        </ul>
                    `,
                    keywords: ['ai', 'machine learning', 'neural network', 'deep learning', 'advanced']
                }
            ],
            'strategies': [
                {
                    title: 'Building Your First Strategy',
                    content: `
                        <p>Learn to create custom trading strategies using the Visual Strategy Builder.</p>
                        
                        <h4>Strategy Components:</h4>
                        <ul>
                            <li><strong>Inputs:</strong> Price, Volume, Time data</li>
                            <li><strong>Indicators:</strong> SMA, RSI, MACD, Bollinger Bands</li>
                            <li><strong>Logic:</strong> Conditions, AND/OR operators</li>
                            <li><strong>Actions:</strong> Buy, Sell, Hold decisions</li>
                        </ul>
                        
                        <h4>Step-by-Step Process:</h4>
                        <ol>
                            <li>Open Advanced Tools → Visual Builder</li>
                            <li>Drag price input to canvas</li>
                            <li>Add SMA indicator and connect to price</li>
                            <li>Create condition: "Price > SMA"</li>
                            <li>Connect condition to Buy action</li>
                            <li>Test strategy with validation tool</li>
                        </ol>
                    `,
                    keywords: ['strategy', 'builder', 'custom', 'create', 'visual']
                },
                {
                    title: 'Backtesting Strategies',
                    content: `
                        <p>Test your strategies on historical data to validate their effectiveness.</p>
                        
                        <h4>Backtesting Process:</h4>
                        <ol>
                            <li>Select strategy to test</li>
                            <li>Choose date range (recommend 1+ years)</li>
                            <li>Set realistic parameters (commission, slippage)</li>
                            <li>Run backtest and analyze results</li>
                            <li>Optimize parameters if needed</li>
                        </ol>
                        
                        <h4>Key Considerations:</h4>
                        <ul>
                            <li><strong>Out-of-Sample Testing:</strong> Test on unseen data</li>
                            <li><strong>Transaction Costs:</strong> Include realistic fees</li>
                            <li><strong>Overfitting:</strong> Avoid over-optimizing parameters</li>
                            <li><strong>Market Regimes:</strong> Test in different market conditions</li>
                        </ul>
                    `,
                    keywords: ['backtest', 'historical', 'validation', 'testing', 'optimize']
                }
            ],
            'metrics': [
                {
                    title: 'Understanding Performance Metrics',
                    content: `
                        <p>Professional trading metrics to evaluate strategy performance.</p>
                        
                        <h4>Return Metrics:</h4>
                        <ul>
                            <li><strong>Total Return:</strong> Overall portfolio growth percentage</li>
                            <li><strong>Annualized Return:</strong> Return adjusted for time period</li>
                            <li><strong>Excess Return:</strong> Return above benchmark (Buy & Hold)</li>
                        </ul>
                        
                        <h4>Risk Metrics:</h4>
                        <ul>
                            <li><strong>Sharpe Ratio:</strong> Risk-adjusted returns (>1.0 good, >2.0 excellent)</li>
                            <li><strong>Maximum Drawdown:</strong> Largest peak-to-trough decline</li>
                            <li><strong>Volatility:</strong> Standard deviation of returns</li>
                        </ul>
                        
                        <h4>Trade Metrics:</h4>
                        <ul>
                            <li><strong>Win Rate:</strong> Percentage of profitable trades</li>
                            <li><strong>Profit Factor:</strong> Gross profit ÷ Gross loss</li>
                            <li><strong>Average Trade:</strong> Mean profit/loss per trade</li>
                        </ul>
                    `,
                    keywords: ['metrics', 'performance', 'sharpe', 'drawdown', 'returns']
                },
                {
                    title: 'Risk Management Metrics',
                    content: `
                        <p>Advanced risk measurement and management techniques.</p>
                        
                        <h4>Value at Risk (VaR):</h4>
                        <ul>
                            <li>Potential loss at 95% confidence level</li>
                            <li>Example: 1-day VaR of $250 means 95% chance loss won't exceed $250</li>
                            <li>Used for position sizing and risk limits</li>
                        </ul>
                        
                        <h4>Expected Shortfall (ES):</h4>
                        <ul>
                            <li>Average loss when VaR threshold is exceeded</li>
                            <li>Measures tail risk in extreme scenarios</li>
                            <li>More conservative than VaR alone</li>
                        </ul>
                        
                        <h4>Beta and Alpha:</h4>
                        <ul>
                            <li><strong>Beta:</strong> Correlation with market movements (1.0 = market correlation)</li>
                            <li><strong>Alpha:</strong> Excess returns vs. benchmark (positive = outperforming)</li>
                        </ul>
                    `,
                    keywords: ['risk', 'var', 'value at risk', 'beta', 'alpha', 'shortfall']
                }
            ],
            'tools': [
                {
                    title: 'Portfolio Analyzer',
                    content: `
                        <p>Professional portfolio analysis tools for institutional-grade insights.</p>
                        
                        <h4>Key Features:</h4>
                        <ul>
                            <li><strong>Risk Decomposition:</strong> Break down portfolio risk by source</li>
                            <li><strong>Attribution Analysis:</strong> Understand profit/loss sources</li>
                            <li><strong>Correlation Matrix:</strong> Measure asset relationships</li>
                            <li><strong>Drawdown Analysis:</strong> Detailed peak-to-trough tracking</li>
                        </ul>
                        
                        <h4>How to Use:</h4>
                        <ol>
                            <li>Open Advanced Tools → Portfolio Analysis</li>
                            <li>Select analysis timeframe (1M, 3M, 6M, 1Y)</li>
                            <li>Review risk metrics and charts</li>
                            <li>Identify concentration risks and correlations</li>
                            <li>Adjust portfolio based on insights</li>
                        </ol>
                    `,
                    keywords: ['portfolio', 'analysis', 'risk', 'correlation', 'attribution']
                },
                {
                    title: 'Market Scanner',
                    content: `
                        <p>Find trading opportunities using technical and fundamental filters.</p>
                        
                        <h4>Filter Types:</h4>
                        <ul>
                            <li><strong>Technical:</strong> RSI levels, MA crosses, volume spikes</li>
                            <li><strong>Price:</strong> Range, market cap, percentage changes</li>
                            <li><strong>Pattern:</strong> Bollinger squeezes, breakouts</li>
                        </ul>
                        
                        <h4>Setting Up Scans:</h4>
                        <ol>
                            <li>Access Advanced Tools → Market Scanner</li>
                            <li>Select desired technical filters</li>
                            <li>Set price and volume criteria</li>
                            <li>Run scan to find matches</li>
                            <li>Analyze results and consider trades</li>
                        </ol>
                    `,
                    keywords: ['scanner', 'screening', 'filters', 'opportunities', 'technical']
                }
            ],
            'troubleshooting': [
                {
                    title: 'Common Issues and Solutions',
                    content: `
                        <h4>Chart Not Loading:</h4>
                        <ul>
                            <li>Refresh the page (Ctrl+F5 or Cmd+Shift+R)</li>
                            <li>Check browser console for errors (F12)</li>
                            <li>Ensure JavaScript is enabled</li>
                            <li>Try a different browser (Chrome, Firefox, Safari)</li>
                        </ul>
                        
                        <h4>Agent Not Trading:</h4>
                        <ul>
                            <li>Check that trading is started (green play button)</li>
                            <li>Verify agent configuration is complete</li>
                            <li>Ensure sufficient capital is available</li>
                            <li>Check if market conditions meet strategy criteria</li>
                        </ul>
                        
                        <h4>Performance Issues:</h4>
                        <ul>
                            <li>Reduce simulation speed if browser slows down</li>
                            <li>Close other browser tabs/applications</li>
                            <li>Use latest browser version</li>
                            <li>Clear browser cache and reload</li>
                        </ul>
                    `,
                    keywords: ['issues', 'problems', 'troubleshooting', 'errors', 'bugs']
                },
                {
                    title: 'Browser Compatibility',
                    content: `
                        <h4>Recommended Browsers:</h4>
                        <ul>
                            <li><strong>Chrome 90+:</strong> Best performance and features</li>
                            <li><strong>Firefox 88+:</strong> Good compatibility</li>
                            <li><strong>Safari 14+:</strong> Works well on macOS/iOS</li>
                            <li><strong>Edge 90+:</strong> Good Windows compatibility</li>
                        </ul>
                        
                        <h4>Required Features:</h4>
                        <ul>
                            <li>JavaScript enabled</li>
                            <li>Canvas API support</li>
                            <li>Local Storage access</li>
                            <li>CSS Grid and Flexbox support</li>
                        </ul>
                        
                        <h4>Mobile Devices:</h4>
                        <ul>
                            <li>iOS 13+ with Safari or Chrome</li>
                            <li>Android 8+ with Chrome or Firefox</li>
                            <li>Responsive design adapts to screen size</li>
                            <li>Touch gestures supported on charts</li>
                        </ul>
                    `,
                    keywords: ['browser', 'compatibility', 'mobile', 'requirements', 'support']
                }
            ]
        };
    }

    addTooltips() {
        // Add tooltips to key interface elements
        const tooltipElements = [
            {
                selector: '#agentTypeSelect',
                content: 'Choose your AI trading strategy. Start with Simple Moving Average for beginners.',
                position: 'bottom'
            },
            {
                selector: '#initialCapital',
                content: 'Virtual money to start trading. No real money is used - this is for learning!',
                position: 'bottom'
            },
            {
                selector: '#riskSlider',
                content: 'Control how aggressively your agent trades. Higher risk = bigger potential gains and losses.',
                position: 'bottom'
            },
            {
                selector: '#confidenceFill',
                content: 'Shows how confident your AI agent is about its current decisions.',
                position: 'left'
            },
            {
                selector: '#portfolioValue',
                content: 'Current total value of your portfolio including cash and positions.',
                position: 'top'
            },
            {
                selector: '#sharpeRatio',
                content: 'Risk-adjusted returns. Higher is better. >1.0 is good, >2.0 is excellent.',
                position: 'top'
            },
            {
                selector: '#maxDrawdown',
                content: 'Largest peak-to-trough decline. Lower is better for risk management.',
                position: 'top'
            }
        ];

        tooltipElements.forEach(tooltip => {
            const element = document.querySelector(tooltip.selector);
            if (element) {
                this.addTooltip(element, tooltip.content, tooltip.position);
            }
        });
    }

    addTooltip(element, content, position = 'top') {
        element.addEventListener('mouseenter', (e) => {
            this.showTooltip(e.target, content, position);
        });

        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }

    showTooltip(target, content, position) {
        this.hideTooltip(); // Remove any existing tooltip

        const tooltip = document.createElement('div');
        tooltip.className = 'help-tooltip';
        tooltip.innerHTML = content;
        
        document.body.appendChild(tooltip);
        
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let x, y;
        
        switch (position) {
            case 'top':
                x = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                y = targetRect.top - tooltipRect.height - 10;
                break;
            case 'bottom':
                x = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                y = targetRect.bottom + 10;
                break;
            case 'left':
                x = targetRect.left - tooltipRect.width - 10;
                y = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                break;
            case 'right':
                x = targetRect.right + 10;
                y = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                break;
        }
        
        // Keep tooltip within viewport
        x = Math.max(10, Math.min(x, window.innerWidth - tooltipRect.width - 10));
        y = Math.max(10, Math.min(y, window.innerHeight - tooltipRect.height - 10));
        
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.classList.add('visible');
        
        this.activeTooltip = tooltip;
    }

    hideTooltip() {
        if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
        }
    }

    addContextualHelp() {
        // Add context-sensitive help based on user actions
        document.addEventListener('click', (e) => {
            // Show relevant help when users interact with specific elements
            if (e.target.matches('#trainAgentBtn')) {
                this.showQuickHelp('Training starts the learning process. Watch the confidence meter increase as your agent improves!');
            } else if (e.target.matches('#startTradingBtn')) {
                this.showQuickHelp('Trading started! Your AI agent will now make buy/sell decisions based on market conditions.');
            }
        });
    }

    showQuickHelp(message) {
        const quickHelp = document.createElement('div');
        quickHelp.className = 'quick-help-notification';
        quickHelp.innerHTML = `
            <div class="quick-help-content">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(quickHelp);
        
        setTimeout(() => {
            quickHelp.classList.add('visible');
        }, 100);
        
        setTimeout(() => {
            quickHelp.classList.remove('visible');
            setTimeout(() => quickHelp.remove(), 300);
        }, 4000);
    }

    showHelpCenter() {
        this.helpModal.classList.add('active');
    }

    showHelpCategory(category) {
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        // Show articles for category
        const articlesContainer = document.getElementById('helpArticles');
        const articles = this.helpData[category] || [];
        
        articlesContainer.innerHTML = articles.map(article => `
            <div class="help-article">
                <h3 class="article-title">${article.title}</h3>
                <div class="article-content">${article.content}</div>
            </div>
        `).join('');
    }

    searchHelp(query) {
        const allArticles = [];
        Object.values(this.helpData).forEach(categoryArticles => {
            allArticles.push(...categoryArticles);
        });
        
        const results = allArticles.filter(article => {
            const searchText = (article.title + ' ' + article.content + ' ' + article.keywords.join(' ')).toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
        
        const articlesContainer = document.getElementById('helpArticles');
        
        if (results.length === 0) {
            articlesContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search fa-3x"></i>
                    <h3>No results found</h3>
                    <p>Try different keywords or browse categories above.</p>
                </div>
            `;
        } else {
            articlesContainer.innerHTML = results.map(article => `
                <div class="help-article">
                    <h3 class="article-title">${article.title}</h3>
                    <div class="article-content">${article.content}</div>
                </div>
            `).join('');
        }
    }
}

// Export for use in main playground
window.HelpSystem = HelpSystem; 
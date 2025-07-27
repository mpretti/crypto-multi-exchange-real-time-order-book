// AI Trading Playground - Unified Panel System
// Consolidates all features into organized, draggable, closeable panels

class UnifiedPanelSystem {
    constructor() {
        this.panels = new Map();
        this.panelStack = [];
        this.dragState = {
            isDragging: false,
            currentPanel: null,
            startX: 0,
            startY: 0,
            startPanelX: 0,
            startPanelY: 0
        };
        
        this.panelCategories = {
            'trading': {
                name: 'Trading Tools',
                icon: '📈',
                color: '#00ff88',
                panels: ['chart-enhancement', 'agent-control', 'time-machine']
            },
            'learning': {
                name: 'Learning Center',
                icon: '🎓',
                color: '#6c5ce7',
                panels: ['tutorial', 'ai-coach', 'help-system']
            },
            'analytics': {
                name: 'Analytics Suite',
                icon: '📊',
                color: '#fd79a8',
                panels: ['performance', 'learning-viz', 'market-analysis']
            },
            'professional': {
                name: 'Professional Tools',
                icon: '💼',
                color: '#fdcb6e',
                panels: ['options-trading', 'portfolio-optimizer', 'algo-trading']
            },
            'defi': {
                name: 'DeFi & Crypto',
                icon: '🌐',
                color: '#74b9ff',
                panels: ['defi-tools', 'yield-farming', 'arbitrage']
            },
            'social': {
                name: 'Social Trading',
                icon: '👥',
                color: '#a29bfe',
                panels: ['social-feed', 'strategy-marketplace', 'leaderboard']
            },
            'advanced': {
                name: 'Advanced Features',
                icon: '🔧',
                color: '#e17055',
                panels: ['voice-control', 'market-making', 'sentiment-analysis']
            }
        };
        
        this.init();
    }

    init() {
        this.createUnifiedInterface();
        this.setupEventHandlers();
        this.loadUserPreferences();
    }

    createUnifiedInterface() {
        // Create main control hub
        const controlHub = document.createElement('div');
        controlHub.className = 'unified-control-hub';
        controlHub.innerHTML = `
            <div class="hub-header">
                <div class="hub-logo">
                    <i class="fas fa-th-large"></i>
                    <span>Control Hub</span>
                </div>
                <div class="hub-controls">
                    <button class="hub-btn" id="minimize-all-btn" title="Minimize All">
                        <i class="fas fa-window-minimize"></i>
                    </button>
                    <button class="hub-btn" id="organize-panels-btn" title="Auto Organize">
                        <i class="fas fa-magic"></i>
                    </button>
                    <button class="hub-btn" id="toggle-hub-btn" title="Toggle Hub">
                        <i class="fas fa-eye-slash"></i>
                    </button>
                </div>
            </div>
            
            <div class="hub-content">
                <div class="category-tabs" id="category-tabs"></div>
                <div class="panel-grid" id="panel-grid"></div>
            </div>
            
            <div class="hub-footer">
                <div class="active-panels-count">
                    <span id="active-panels-count">0</span> panels active
                </div>
                <button class="hub-btn settings-btn" id="panel-settings-btn">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        `;

        document.body.appendChild(controlHub);
        this.populateControlHub();
    }

    populateControlHub() {
        const categoryTabs = document.getElementById('category-tabs');
        const panelGrid = document.getElementById('panel-grid');

        // Create category tabs
        Object.entries(this.panelCategories).forEach(([key, category], index) => {
            const tab = document.createElement('button');
            tab.className = `category-tab ${index === 0 ? 'active' : ''}`;
            tab.dataset.category = key;
            tab.innerHTML = `
                <span class="tab-icon">${category.icon}</span>
                <span class="tab-name">${category.name}</span>
            `;
            tab.style.setProperty('--category-color', category.color);
            categoryTabs.appendChild(tab);
        });

        // Show first category by default
        this.showCategory(Object.keys(this.panelCategories)[0]);
    }

    showCategory(categoryKey) {
        const category = this.panelCategories[categoryKey];
        const panelGrid = document.getElementById('panel-grid');
        
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === categoryKey);
        });

        // Clear and populate panel grid
        panelGrid.innerHTML = '';
        
        const panelDefinitions = this.getPanelDefinitions();
        
        category.panels.forEach(panelKey => {
            const panelDef = panelDefinitions[panelKey];
            if (panelDef) {
                const panelCard = document.createElement('div');
                panelCard.className = 'panel-card';
                panelCard.innerHTML = `
                    <div class="panel-card-header">
                        <div class="panel-card-icon">${panelDef.icon}</div>
                        <div class="panel-card-info">
                            <div class="panel-card-title">${panelDef.title}</div>
                            <div class="panel-card-description">${panelDef.description}</div>
                        </div>
                    </div>
                    <div class="panel-card-actions">
                        <button class="panel-action-btn open-btn" data-panel="${panelKey}">
                            <i class="fas fa-external-link-alt"></i>
                            Open
                        </button>
                        ${this.panels.has(panelKey) ? `
                            <button class="panel-action-btn close-btn" data-panel="${panelKey}">
                                <i class="fas fa-times"></i>
                                Close
                            </button>
                        ` : ''}
                    </div>
                `;
                
                panelGrid.appendChild(panelCard);
            }
        });
    }

    getPanelDefinitions() {
        return {
            'chart-enhancement': {
                title: 'Chart Enhancement',
                description: 'Advanced charting tools and indicators',
                icon: '📈',
                component: 'ChartEnhancementPanel'
            },
            'agent-control': {
                title: 'AI Agent Control',
                description: 'Configure and control trading agents',
                icon: '🤖',
                component: 'AgentControlPanel'
            },
            'time-machine': {
                title: 'Time Machine',
                description: 'Historical data playback and analysis',
                icon: '⏰',
                component: 'TimeMachinePanel'
            },
            'tutorial': {
                title: 'Interactive Tutorial',
                description: 'Learn trading with guided lessons',
                icon: '🎓',
                component: 'TutorialPanel'
            },
            'ai-coach': {
                title: 'AI Trading Coach',
                description: 'Personalized trading guidance',
                icon: '🧠',
                component: 'AICoachPanel'
            },
            'help-system': {
                title: 'Help Center',
                description: 'Documentation and support',
                icon: '❓',
                component: 'HelpSystemPanel'
            },
            'performance': {
                title: 'Performance Analytics',
                description: 'Detailed trading performance metrics',
                icon: '📊',
                component: 'PerformancePanel'
            },
            'learning-viz': {
                title: 'Learning Visualization',
                description: 'Watch AI learning in real-time',
                icon: '🧬',
                component: 'LearningVizPanel'
            },
            'market-analysis': {
                title: 'Market Analysis',
                description: 'Advanced market analytics tools',
                icon: '📋',
                component: 'MarketAnalysisPanel'
            },
            'options-trading': {
                title: 'Options Trading',
                description: 'Options strategies and analysis',
                icon: '📜',
                component: 'OptionsTradingPanel'
            },
            'portfolio-optimizer': {
                title: 'Portfolio Optimizer',
                description: 'Modern portfolio theory tools',
                icon: '⚖️',
                component: 'PortfolioOptimizerPanel'
            },
            'algo-trading': {
                title: 'Algorithmic Trading',
                description: 'Build and deploy trading algorithms',
                icon: '🔄',
                component: 'AlgoTradingPanel'
            },
            'defi-tools': {
                title: 'DeFi Tools',
                description: 'Decentralized finance utilities',
                icon: '🌐',
                component: 'DeFiToolsPanel'
            },
            'yield-farming': {
                title: 'Yield Farming',
                description: 'DeFi yield optimization',
                icon: '🌾',
                component: 'YieldFarmingPanel'
            },
            'arbitrage': {
                title: 'Arbitrage Scanner',
                description: 'Cross-exchange arbitrage opportunities',
                icon: '⚡',
                component: 'ArbitragePanel'
            },
            'social-feed': {
                title: 'Social Trading Feed',
                description: 'Live trading activity from community',
                icon: '📢',
                component: 'SocialFeedPanel'
            },
            'strategy-marketplace': {
                title: 'Strategy Marketplace',
                description: 'Buy and sell trading strategies',
                icon: '🏪',
                component: 'StrategyMarketplacePanel'
            },
            'leaderboard': {
                title: 'Trader Leaderboard',
                description: 'Top performing traders',
                icon: '🏆',
                component: 'LeaderboardPanel'
            },
            'voice-control': {
                title: 'Voice Control',
                description: 'Hands-free trading commands',
                icon: '🎤',
                component: 'VoiceControlPanel'
            },
            'market-making': {
                title: 'Market Making',
                description: 'Automated market making strategies',
                icon: '🔀',
                component: 'MarketMakingPanel'
            },
            'sentiment-analysis': {
                title: 'Sentiment Analysis',
                description: 'Market sentiment tracking',
                icon: '😊',
                component: 'SentimentAnalysisPanel'
            }
        };
    }

    openPanel(panelKey, options = {}) {
        if (this.panels.has(panelKey)) {
            // Panel already exists, just focus it
            this.focusPanel(panelKey);
            return;
        }

        const panelDef = this.getPanelDefinitions()[panelKey];
        if (!panelDef) return;

        const panel = this.createDraggablePanel(panelKey, panelDef, options);
        this.panels.set(panelKey, panel);
        this.updatePanelCount();
        
        // Add to panel stack for z-index management
        this.panelStack.push(panelKey);
        this.updatePanelZIndices();
        
        // Trigger panel-specific initialization
        this.initializePanelContent(panelKey, panel);
    }

    createDraggablePanel(panelKey, panelDef, options = {}) {
        const panel = document.createElement('div');
        panel.className = 'unified-draggable-panel';
        panel.dataset.panelKey = panelKey;
        
        // Set initial position
        const position = this.calculatePanelPosition(options.position);
        panel.style.left = position.x + 'px';
        panel.style.top = position.y + 'px';
        
        // Set size
        const size = options.size || this.getDefaultPanelSize(panelKey);
        panel.style.width = size.width;
        panel.style.height = size.height;

        panel.innerHTML = `
            <div class="panel-header" data-drag-handle>
                <div class="panel-title-section">
                    <span class="panel-icon">${panelDef.icon}</span>
                    <span class="panel-title">${panelDef.title}</span>
                </div>
                <div class="panel-controls">
                    <button class="panel-control-btn minimize-btn" title="Minimize">
                        <i class="fas fa-window-minimize"></i>
                    </button>
                    <button class="panel-control-btn maximize-btn" title="Maximize">
                        <i class="fas fa-window-maximize"></i>
                    </button>
                    <button class="panel-control-btn close-btn" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="panel-content" id="panel-content-${panelKey}">
                <div class="panel-loading">
                    <div class="loading-spinner"></div>
                    <span>Loading ${panelDef.title}...</span>
                </div>
            </div>
            
            <div class="panel-resize-handles">
                <div class="resize-handle resize-n" data-direction="n"></div>
                <div class="resize-handle resize-ne" data-direction="ne"></div>
                <div class="resize-handle resize-e" data-direction="e"></div>
                <div class="resize-handle resize-se" data-direction="se"></div>
                <div class="resize-handle resize-s" data-direction="s"></div>
                <div class="resize-handle resize-sw" data-direction="sw"></div>
                <div class="resize-handle resize-w" data-direction="w"></div>
                <div class="resize-handle resize-nw" data-direction="nw"></div>
            </div>
        `;

        document.body.appendChild(panel);
        
        // Setup panel event handlers
        this.setupPanelEventHandlers(panel, panelKey);
        
        return panel;
    }

    calculatePanelPosition(preferredPosition) {
        if (preferredPosition) {
            return preferredPosition;
        }

        // Smart positioning to avoid overlap
        const offset = this.panels.size * 30;
        const baseX = 100 + offset;
        const baseY = 100 + offset;
        
        // Wrap around if too far right/down
        const maxX = window.innerWidth - 400;
        const maxY = window.innerHeight - 300;
        
        return {
            x: baseX > maxX ? 100 : baseX,
            y: baseY > maxY ? 100 : baseY
        };
    }

    getDefaultPanelSize(panelKey) {
        const sizes = {
            'chart-enhancement': { width: '800px', height: '600px' },
            'agent-control': { width: '400px', height: '500px' },
            'time-machine': { width: '600px', height: '400px' },
            'tutorial': { width: '700px', height: '550px' },
            'ai-coach': { width: '450px', height: '600px' },
            'performance': { width: '750px', height: '500px' },
            'options-trading': { width: '900px', height: '700px' },
            'portfolio-optimizer': { width: '800px', height: '650px' },
            'social-feed': { width: '400px', height: '600px' },
            'voice-control': { width: '350px', height: '450px' }
        };
        
        return sizes[panelKey] || { width: '500px', height: '400px' };
    }

    setupPanelEventHandlers(panel, panelKey) {
        const header = panel.querySelector('.panel-header');
        const minimizeBtn = panel.querySelector('.minimize-btn');
        const maximizeBtn = panel.querySelector('.maximize-btn');
        const closeBtn = panel.querySelector('.close-btn');
        
        // Dragging
        header.addEventListener('mousedown', (e) => this.startDrag(e, panel));
        
        // Panel controls
        minimizeBtn.addEventListener('click', () => this.minimizePanel(panelKey));
        maximizeBtn.addEventListener('click', () => this.toggleMaximizePanel(panelKey));
        closeBtn.addEventListener('click', () => this.closePanel(panelKey));
        
        // Focus on click
        panel.addEventListener('mousedown', () => this.focusPanel(panelKey));
        
        // Resize handles
        panel.querySelectorAll('.resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => this.startResize(e, panel, handle.dataset.direction));
        });
    }

    startDrag(e, panel) {
        if (e.target.closest('.panel-control-btn')) return;
        
        this.dragState.isDragging = true;
        this.dragState.currentPanel = panel;
        this.dragState.startX = e.clientX;
        this.dragState.startY = e.clientY;
        
        const rect = panel.getBoundingClientRect();
        this.dragState.startPanelX = rect.left;
        this.dragState.startPanelY = rect.top;
        
        panel.classList.add('dragging');
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.endDrag);
        
        e.preventDefault();
    }

    handleDrag = (e) => {
        if (!this.dragState.isDragging || !this.dragState.currentPanel) return;
        
        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;
        
        const newX = this.dragState.startPanelX + deltaX;
        const newY = this.dragState.startPanelY + deltaY;
        
        // Constrain to viewport
        const maxX = window.innerWidth - this.dragState.currentPanel.offsetWidth;
        const maxY = window.innerHeight - this.dragState.currentPanel.offsetHeight;
        
        const constrainedX = Math.max(0, Math.min(newX, maxX));
        const constrainedY = Math.max(0, Math.min(newY, maxY));
        
        this.dragState.currentPanel.style.left = constrainedX + 'px';
        this.dragState.currentPanel.style.top = constrainedY + 'px';
    }

    endDrag = () => {
        if (this.dragState.currentPanel) {
            this.dragState.currentPanel.classList.remove('dragging');
        }
        
        this.dragState.isDragging = false;
        this.dragState.currentPanel = null;
        
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.endDrag);
    }

    startResize(e, panel, direction) {
        // Resize functionality
        e.stopPropagation();
        e.preventDefault();
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = panel.offsetWidth;
        const startHeight = panel.offsetHeight;
        const startLeft = panel.offsetLeft;
        const startTop = panel.offsetTop;
        
        const handleResize = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            if (direction.includes('e')) newWidth = startWidth + deltaX;
            if (direction.includes('w')) {
                newWidth = startWidth - deltaX;
                newLeft = startLeft + deltaX;
            }
            if (direction.includes('s')) newHeight = startHeight + deltaY;
            if (direction.includes('n')) {
                newHeight = startHeight - deltaY;
                newTop = startTop + deltaY;
            }
            
            // Minimum size constraints
            newWidth = Math.max(300, newWidth);
            newHeight = Math.max(200, newHeight);
            
            panel.style.width = newWidth + 'px';
            panel.style.height = newHeight + 'px';
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
        };
        
        const endResize = () => {
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', endResize);
        };
        
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', endResize);
    }

    focusPanel(panelKey) {
        // Move panel to top of stack
        const index = this.panelStack.indexOf(panelKey);
        if (index > -1) {
            this.panelStack.splice(index, 1);
            this.panelStack.push(panelKey);
            this.updatePanelZIndices();
        }
    }

    minimizePanel(panelKey) {
        const panel = this.panels.get(panelKey);
        if (!panel) return;
        
        panel.classList.toggle('minimized');
        
        if (panel.classList.contains('minimized')) {
            panel.dataset.originalHeight = panel.style.height;
            panel.style.height = '40px';
        } else {
            panel.style.height = panel.dataset.originalHeight || '400px';
        }
    }

    toggleMaximizePanel(panelKey) {
        const panel = this.panels.get(panelKey);
        if (!panel) return;
        
        if (panel.classList.contains('maximized')) {
            // Restore
            panel.style.left = panel.dataset.originalLeft || '100px';
            panel.style.top = panel.dataset.originalTop || '100px';
            panel.style.width = panel.dataset.originalWidth || '500px';
            panel.style.height = panel.dataset.originalHeight || '400px';
            panel.classList.remove('maximized');
        } else {
            // Maximize
            panel.dataset.originalLeft = panel.style.left;
            panel.dataset.originalTop = panel.style.top;
            panel.dataset.originalWidth = panel.style.width;
            panel.dataset.originalHeight = panel.style.height;
            
            panel.style.left = '0px';
            panel.style.top = '0px';
            panel.style.width = '100vw';
            panel.style.height = '100vh';
            panel.classList.add('maximized');
        }
    }

    closePanel(panelKey) {
        const panel = this.panels.get(panelKey);
        if (!panel) return;
        
        // Animate out
        panel.style.opacity = '0';
        panel.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            panel.remove();
            this.panels.delete(panelKey);
            
            // Remove from stack
            const index = this.panelStack.indexOf(panelKey);
            if (index > -1) {
                this.panelStack.splice(index, 1);
            }
            
            this.updatePanelCount();
            this.updateControlHub();
        }, 300);
    }

    updatePanelZIndices() {
        this.panelStack.forEach((panelKey, index) => {
            const panel = this.panels.get(panelKey);
            if (panel) {
                panel.style.zIndex = 2000 + index;
            }
        });
    }

    updatePanelCount() {
        const countElement = document.getElementById('active-panels-count');
        if (countElement) {
            countElement.textContent = this.panels.size;
        }
    }

    updateControlHub() {
        // Refresh the current category view
        const activeTab = document.querySelector('.category-tab.active');
        if (activeTab) {
            this.showCategory(activeTab.dataset.category);
        }
    }

    setupEventHandlers() {
        // Category tab switching
        document.addEventListener('click', (e) => {
            if (e.target.closest('.category-tab')) {
                const tab = e.target.closest('.category-tab');
                this.showCategory(tab.dataset.category);
            }
            
            // Panel open/close buttons
            if (e.target.closest('.open-btn')) {
                const btn = e.target.closest('.open-btn');
                this.openPanel(btn.dataset.panel);
            }
            
            if (e.target.closest('.close-btn')) {
                const btn = e.target.closest('.close-btn');
                this.closePanel(btn.dataset.panel);
            }
        });
        
        // Control hub buttons
        document.getElementById('minimize-all-btn')?.addEventListener('click', () => {
            this.minimizeAllPanels();
        });
        
        document.getElementById('organize-panels-btn')?.addEventListener('click', () => {
            this.organizePanels();
        });
        
        document.getElementById('toggle-hub-btn')?.addEventListener('click', () => {
            this.toggleControlHub();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'h':
                        e.preventDefault();
                        this.toggleControlHub();
                        break;
                    case 'm':
                        e.preventDefault();
                        this.minimizeAllPanels();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.organizePanels();
                        break;
                }
            }
        });
    }

    minimizeAllPanels() {
        this.panels.forEach((panel, panelKey) => {
            if (!panel.classList.contains('minimized')) {
                this.minimizePanel(panelKey);
            }
        });
    }

    organizePanels() {
        const panelKeys = Array.from(this.panels.keys());
        const cols = Math.ceil(Math.sqrt(panelKeys.length));
        const panelWidth = 400;
        const panelHeight = 300;
        const spacing = 20;
        
        panelKeys.forEach((panelKey, index) => {
            const panel = this.panels.get(panelKey);
            if (!panel || panel.classList.contains('maximized')) return;
            
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            const x = col * (panelWidth + spacing) + spacing;
            const y = row * (panelHeight + spacing) + spacing + 60; // Account for header
            
            panel.style.left = x + 'px';
            panel.style.top = y + 'px';
            panel.style.width = panelWidth + 'px';
            panel.style.height = panelHeight + 'px';
            
            // Remove minimized state
            panel.classList.remove('minimized');
        });
    }

    toggleControlHub() {
        const hub = document.querySelector('.unified-control-hub');
        if (hub) {
            hub.classList.toggle('hidden');
        }
    }

    initializePanelContent(panelKey, panel) {
        const contentContainer = panel.querySelector(`#panel-content-${panelKey}`);
        
        setTimeout(() => {
            // Remove loading state
            contentContainer.innerHTML = '';
            
            // Initialize specific panel content based on panelKey
            switch (panelKey) {
                case 'chart-enhancement':
                    this.initChartEnhancementPanel(contentContainer);
                    break;
                case 'agent-control':
                    this.initAgentControlPanel(contentContainer);
                    break;
                case 'tutorial':
                    this.initTutorialPanel(contentContainer);
                    break;
                case 'ai-coach':
                    this.initAICoachPanel(contentContainer);
                    break;
                case 'performance':
                    this.initPerformancePanel(contentContainer);
                    break;
                case 'options-trading':
                    this.initOptionsTradingPanel(contentContainer);
                    break;
                case 'social-feed':
                    this.initSocialFeedPanel(contentContainer);
                    break;
                case 'voice-control':
                    this.initVoiceControlPanel(contentContainer);
                    break;
                default:
                    this.initGenericPanel(contentContainer, panelKey);
            }
        }, 500);
    }

    initChartEnhancementPanel(container) {
        container.innerHTML = `
            <div class="chart-enhancement-content">
                <div class="enhancement-controls">
                    <div class="control-group">
                        <label>Chart Type</label>
                        <select class="chart-type-select">
                            <option value="candlestick">Candlestick</option>
                            <option value="line">Line</option>
                            <option value="area">Area</option>
                        </select>
                    </div>
                    
                    <div class="control-group">
                        <label>Indicators</label>
                        <div class="indicator-toggles">
                            <label class="toggle-label">
                                <input type="checkbox" checked> SMA
                            </label>
                            <label class="toggle-label">
                                <input type="checkbox"> EMA
                            </label>
                            <label class="toggle-label">
                                <input type="checkbox"> RSI
                            </label>
                            <label class="toggle-label">
                                <input type="checkbox"> MACD
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="chart-preview">
                    <canvas id="enhanced-chart-preview"></canvas>
                </div>
            </div>
        `;
    }

    initAgentControlPanel(container) {
        container.innerHTML = `
            <div class="agent-control-content">
                <div class="agent-status">
                    <div class="status-indicator">
                        <div class="status-dot active"></div>
                        <span>Agent Active</span>
                    </div>
                </div>
                
                <div class="agent-config">
                    <div class="config-group">
                        <label>Agent Type</label>
                        <select class="agent-type-select">
                            <option value="sma">Simple Moving Average</option>
                            <option value="rsi">RSI Strategy</option>
                            <option value="ml">Machine Learning</option>
                        </select>
                    </div>
                    
                    <div class="config-group">
                        <label>Risk Level</label>
                        <input type="range" min="1" max="10" value="5" class="risk-slider">
                    </div>
                    
                    <div class="config-group">
                        <label>Capital</label>
                        <input type="number" value="10000" class="capital-input">
                    </div>
                </div>
                
                <div class="agent-actions">
                    <button class="btn btn-primary">Start Trading</button>
                    <button class="btn btn-secondary">Train Agent</button>
                    <button class="btn btn-danger">Stop</button>
                </div>
            </div>
        `;
    }

    initGenericPanel(container, panelKey) {
        container.innerHTML = `
            <div class="generic-panel-content">
                <div class="panel-info">
                    <h3>${this.getPanelDefinitions()[panelKey]?.title || 'Panel'}</h3>
                    <p>${this.getPanelDefinitions()[panelKey]?.description || 'Panel content loading...'}</p>
                </div>
                
                <div class="panel-placeholder">
                    <div class="placeholder-icon">🔧</div>
                    <p>This panel is under development</p>
                    <button class="btn btn-primary">Coming Soon</button>
                </div>
            </div>
        `;
    }

    // Public API methods
    openPanelByName(panelName, options = {}) {
        this.openPanel(panelName, options);
    }

    closePanelByName(panelName) {
        this.closePanel(panelName);
    }

    getActivePanels() {
        return Array.from(this.panels.keys());
    }

    closeAllPanels() {
        Array.from(this.panels.keys()).forEach(panelKey => {
            this.closePanel(panelKey);
        });
    }

    loadUserPreferences() {
        // Load saved panel positions and states
        const saved = localStorage.getItem('unified-panel-preferences');
        if (saved) {
            try {
                const preferences = JSON.parse(saved);
                // Apply saved preferences
                console.log('Loaded panel preferences:', preferences);
            } catch (e) {
                console.warn('Failed to load panel preferences:', e);
            }
        }
    }

    saveUserPreferences() {
        const preferences = {
            openPanels: Array.from(this.panels.keys()),
            panelPositions: {},
            hubVisible: !document.querySelector('.unified-control-hub')?.classList.contains('hidden')
        };
        
        this.panels.forEach((panel, panelKey) => {
            preferences.panelPositions[panelKey] = {
                x: panel.offsetLeft,
                y: panel.offsetTop,
                width: panel.offsetWidth,
                height: panel.offsetHeight,
                minimized: panel.classList.contains('minimized'),
                maximized: panel.classList.contains('maximized')
            };
        });
        
        localStorage.setItem('unified-panel-preferences', JSON.stringify(preferences));
    }
}

// Initialize the unified panel system
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.unifiedPanelSystem = new UnifiedPanelSystem();
        console.log('🎛️ Unified Panel System initialized');
    }, 1000);
});

// Save preferences on page unload
window.addEventListener('beforeunload', () => {
    if (window.unifiedPanelSystem) {
        window.unifiedPanelSystem.saveUserPreferences();
    }
}); 
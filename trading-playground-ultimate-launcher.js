// AI Trading Playground - Ultimate Launcher
// Master initialization script for the complete trading ecosystem

class TradingPlaygroundUltimateLauncher {
    constructor() {
        this.systems = {};
        this.initializationOrder = [
            'corePlayground',
            'layoutManager',
            'gridManager',
            'spaceOptimizer',
            'chartEnhancement',
            'tutorialSystem',
            'advancedFeatures',
            'helpSystem',
            'learningVisualization',
            'aiCoach',
            'voiceControl',
            'marketSimulator',
            'completeFeatures',
            'professionalSuite'
        ];
        
        this.initializationStatus = {};
        this.totalSystems = this.initializationOrder.length;
        this.initializedSystems = 0;
        
        this.init();
    }

    async init() {
        console.log('🚀 AI Trading Playground Ultimate Edition v3.0 Starting...');
        console.log('🌟 Initializing complete AI-powered trading ecosystem...');
        
        this.showLoadingScreen();
        await this.initializeSystems();
        this.finalizeInitialization();
    }

    showLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'ultimate-loading-screen';
        loadingScreen.innerHTML = `
            <div class="ultimate-loading-container">
                <div class="ultimate-logo">
                    <div class="logo-animation">🤖</div>
                    <h1>AI Trading Playground</h1>
                    <p>Ultimate Edition v3.0</p>
                </div>
                
                <div class="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="ultimate-progress-fill"></div>
                    </div>
                    <div class="progress-text">
                        <span id="ultimate-progress-text">Initializing systems...</span>
                        <span id="ultimate-progress-percent">0%</span>
                    </div>
                </div>
                
                <div class="loading-features">
                    <div class="feature-list" id="ultimate-feature-list">
                        <div class="feature-item">🎯 Core Trading Engine</div>
                        <div class="feature-item">🎨 Advanced Layout System</div>
                        <div class="feature-item">📱 Responsive Grid Manager</div>
                        <div class="feature-item">🎓 Interactive Tutorial System</div>
                        <div class="feature-item">🔧 Professional Trading Tools</div>
                        <div class="feature-item">🧠 Live Learning Visualization</div>
                        <div class="feature-item">🤖 AI Coach & Mentor</div>
                        <div class="feature-item">🎤 Voice Control System</div>
                        <div class="feature-item">📈 Chart Enhancement Engine</div>
                        <div class="feature-item">🌐 Complete Features Suite</div>
                        <div class="feature-item">💼 Professional Trading Suite</div>
                        <div class="feature-item">📊 Market Simulation Engine</div>
                    </div>
                </div>
                
                <div class="loading-tips">
                    <div class="tip-container">
                        <div class="tip-icon">💡</div>
                        <div class="tip-text" id="ultimate-loading-tip">
                            Did you know? The AI Trading Playground uses advanced machine learning to help you master trading!
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add loading screen styles
        const loadingStyles = document.createElement('style');
        loadingStyles.textContent = `
            #ultimate-loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #0f0f19 0%, #1a1a2e 50%, #16213e 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                overflow: hidden;
            }
            
            .ultimate-loading-container {
                text-align: center;
                max-width: 600px;
                padding: 40px;
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(0, 255, 136, 0.2);
                border-radius: 20px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            }
            
            .ultimate-logo {
                margin-bottom: 40px;
            }
            
            .logo-animation {
                font-size: 4em;
                animation: logoFloat 2s ease-in-out infinite;
                margin-bottom: 20px;
            }
            
            @keyframes logoFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            .ultimate-logo h1 {
                color: #00ff88;
                font-size: 2.5em;
                margin: 0;
                text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
                font-weight: 700;
            }
            
            .ultimate-logo p {
                color: rgba(255, 255, 255, 0.8);
                font-size: 1.2em;
                margin: 10px 0 0 0;
            }
            
            .loading-progress {
                margin-bottom: 40px;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 15px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00ff88, #00cc6a);
                width: 0%;
                transition: width 0.5s ease;
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
            }
            
            .progress-text {
                display: flex;
                justify-content: space-between;
                color: white;
                font-size: 1em;
            }
            
            .loading-features {
                margin-bottom: 30px;
            }
            
            .feature-list {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                text-align: left;
            }
            
            .feature-item {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9em;
                padding: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
                transition: all 0.3s ease;
                opacity: 0.5;
            }
            
            .feature-item.loaded {
                color: #00ff88;
                opacity: 1;
                background: rgba(0, 255, 136, 0.1);
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.2);
            }
            
            .loading-tips {
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 20px;
            }
            
            .tip-container {
                display: flex;
                align-items: center;
                gap: 15px;
                text-align: left;
            }
            
            .tip-icon {
                font-size: 1.5em;
                animation: tipGlow 2s ease-in-out infinite;
            }
            
            @keyframes tipGlow {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; }
            }
            
            .tip-text {
                color: rgba(255, 255, 255, 0.8);
                font-size: 0.9em;
                line-height: 1.4;
            }
            
            @media (max-width: 768px) {
                .ultimate-loading-container {
                    max-width: 90vw;
                    padding: 20px;
                }
                
                .ultimate-logo h1 {
                    font-size: 2em;
                }
                
                .feature-list {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(loadingStyles);
        document.body.appendChild(loadingScreen);
        
        // Start tip rotation
        this.startTipRotation();
    }

    startTipRotation() {
        const tips = [
            "💡 The AI Trading Playground uses advanced machine learning to help you master trading!",
            "🎯 Start with the tutorial system to learn the basics of AI trading strategies.",
            "🧠 Watch your AI agent learn in real-time with the live learning visualization.",
            "🎤 Use voice commands to control your trading strategies hands-free!",
            "📈 Professional tools include options trading, portfolio optimization, and DeFi integration.",
            "🤖 Your AI coach will provide personalized guidance based on your progress.",
            "🎨 Switch between different layout modes for the optimal trading experience.",
            "📊 Backtest your strategies on years of historical market data.",
            "🌟 Complete challenges and earn achievements as you progress from zero to hero!",
            "🔧 Build custom strategies with the visual strategy builder.",
            "📱 The responsive design works perfectly on desktop, tablet, and mobile.",
            "🚀 Advanced features include market making, arbitrage, and sentiment analysis!"
        ];
        
        let currentTip = 0;
        const tipElement = document.getElementById('ultimate-loading-tip');
        
        setInterval(() => {
            currentTip = (currentTip + 1) % tips.length;
            if (tipElement) {
                tipElement.style.opacity = '0';
                setTimeout(() => {
                    tipElement.textContent = tips[currentTip];
                    tipElement.style.opacity = '1';
                }, 300);
            }
        }, 3000);
    }

    async initializeSystems() {
        for (const systemName of this.initializationOrder) {
            await this.initializeSystem(systemName);
            this.updateProgress();
            await this.delay(500); // Smooth loading experience
        }
    }

    async initializeSystem(systemName) {
        try {
            this.updateLoadingText(`Initializing ${this.getSystemDisplayName(systemName)}...`);
            
            switch (systemName) {
                case 'corePlayground':
                    if (window.TradingPlayground) {
                        this.systems.corePlayground = window.tradingPlayground || new TradingPlayground();
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'layoutManager':
                    if (window.AdvancedLayoutManager) {
                        this.systems.layoutManager = new AdvancedLayoutManager();
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'gridManager':
                    if (window.ResponsiveGridManager) {
                        this.systems.gridManager = new ResponsiveGridManager();
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'spaceOptimizer':
                    if (window.SpaceOptimizer) {
                        this.systems.spaceOptimizer = new SpaceOptimizer();
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'chartEnhancement':
                    if (window.ChartEnhancement) {
                        this.systems.chartEnhancement = new ChartEnhancement();
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'tutorialSystem':
                    if (window.TutorialSystem) {
                        this.systems.tutorialSystem = new TutorialSystem(this.systems.corePlayground);
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'advancedFeatures':
                    if (window.AdvancedFeatures) {
                        this.systems.advancedFeatures = new AdvancedFeatures(this.systems.corePlayground);
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'helpSystem':
                    if (window.HelpSystem) {
                        this.systems.helpSystem = new HelpSystem(this.systems.corePlayground);
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'learningVisualization':
                    if (window.LiveLearningVisualization) {
                        this.systems.learningVisualization = new LiveLearningVisualization(this.systems.corePlayground);
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'aiCoach':
                    if (window.AICoach) {
                        this.systems.aiCoach = new AICoach(this.systems.corePlayground);
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'voiceControl':
                    if (window.VoiceControl) {
                        this.systems.voiceControl = new VoiceControl(this.systems.corePlayground);
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'marketSimulator':
                    if (window.AdvancedMarketSimulator) {
                        this.systems.marketSimulator = new AdvancedMarketSimulator();
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'completeFeatures':
                    if (window.TradingPlaygroundCompleteFeatures) {
                        this.systems.completeFeatures = new TradingPlaygroundCompleteFeatures();
                        this.initializationStatus[systemName] = true;
                    }
                    break;
                    
                case 'professionalSuite':
                    if (window.TradingPlaygroundProfessionalSuite) {
                        this.systems.professionalSuite = new TradingPlaygroundProfessionalSuite();
                        this.initializationStatus[systemName] = true;
                    }
                    break;
            }
            
            // Mark feature as loaded in UI
            this.markFeatureLoaded(systemName);
            
        } catch (error) {
            console.warn(`⚠️ Failed to initialize ${systemName}:`, error);
            this.initializationStatus[systemName] = false;
        }
    }

    getSystemDisplayName(systemName) {
        const displayNames = {
            corePlayground: 'Core Trading Engine',
            layoutManager: 'Advanced Layout System',
            gridManager: 'Responsive Grid Manager',
            spaceOptimizer: 'Space Optimization Engine',
            chartEnhancement: 'Chart Enhancement System',
            tutorialSystem: 'Interactive Tutorial System',
            advancedFeatures: 'Professional Trading Tools',
            helpSystem: 'Help & Documentation System',
            learningVisualization: 'Live Learning Visualization',
            aiCoach: 'AI Coach & Mentor',
            voiceControl: 'Voice Control System',
            marketSimulator: 'Market Simulation Engine',
            completeFeatures: 'Complete Features Suite',
            professionalSuite: 'Professional Trading Suite'
        };
        
        return displayNames[systemName] || systemName;
    }

    markFeatureLoaded(systemName) {
        const featureItems = document.querySelectorAll('.feature-item');
        const systemDisplayName = this.getSystemDisplayName(systemName);
        
        featureItems.forEach(item => {
            if (item.textContent.includes(systemDisplayName.split(' ').slice(-2).join(' '))) {
                item.classList.add('loaded');
            }
        });
    }

    updateProgress() {
        this.initializedSystems++;
        const percentage = Math.round((this.initializedSystems / this.totalSystems) * 100);
        
        const progressFill = document.getElementById('ultimate-progress-fill');
        const progressPercent = document.getElementById('ultimate-progress-percent');
        
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressPercent) progressPercent.textContent = `${percentage}%`;
    }

    updateLoadingText(text) {
        const progressText = document.getElementById('ultimate-progress-text');
        if (progressText) progressText.textContent = text;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    finalizeInitialization() {
        this.updateLoadingText('Finalizing initialization...');
        
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showWelcomeMessage();
            this.logSystemStatus();
        }, 1000);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('ultimate-loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transform = 'scale(0.9)';
            loadingScreen.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }

    showWelcomeMessage() {
        const successfulSystems = Object.values(this.initializationStatus).filter(status => status).length;
        
        // Create welcome notification
        this.showNotification({
            title: '🚀 AI Trading Playground Ultimate Edition Ready!',
            message: `${successfulSystems}/${this.totalSystems} systems initialized successfully`,
            type: 'success',
            duration: 5000
        });
        
        // Show quick start guide
        setTimeout(() => {
            this.showQuickStartGuide();
        }, 2000);
    }

    showNotification({ title, message, type = 'info', duration = 3000 }) {
        const notification = document.createElement('div');
        notification.className = `ultimate-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">×</button>
        `;
        
        // Add notification styles
        if (!document.getElementById('ultimate-notification-styles')) {
            const notificationStyles = document.createElement('style');
            notificationStyles.id = 'ultimate-notification-styles';
            notificationStyles.textContent = `
                .ultimate-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    padding: 20px;
                    max-width: 400px;
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    animation: notificationSlideIn 0.5s ease-out;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                
                .ultimate-notification.success {
                    border-color: #00ff88;
                    box-shadow: 0 10px 30px rgba(0, 255, 136, 0.2);
                }
                
                @keyframes notificationSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .notification-icon {
                    font-size: 1.5em;
                }
                
                .notification-content {
                    flex: 1;
                }
                
                .notification-title {
                    color: #00ff88;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .notification-message {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.9em;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 1.2em;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .notification-close:hover {
                    color: white;
                }
            `;
            document.head.appendChild(notificationStyles);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove notification
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        });
    }

    showQuickStartGuide() {
        // Show quick start guide if tutorial system is available
        if (this.systems.tutorialSystem) {
            this.showNotification({
                title: '🎓 Ready to Start Learning?',
                message: 'Click the Tutorial button to begin your journey from zero to trading hero!',
                type: 'info',
                duration: 7000
            });
        }
    }

    logSystemStatus() {
        console.log('🎯 AI Trading Playground Ultimate Edition v3.0 - System Status:');
        console.log('==================================================================');
        
        Object.entries(this.initializationStatus).forEach(([system, status]) => {
            const icon = status ? '✅' : '❌';
            const displayName = this.getSystemDisplayName(system);
            console.log(`${icon} ${displayName}: ${status ? 'Ready' : 'Failed'}`);
        });
        
        console.log('==================================================================');
        
        const successfulSystems = Object.values(this.initializationStatus).filter(status => status).length;
        const successRate = Math.round((successfulSystems / this.totalSystems) * 100);
        
        console.log(`🚀 Initialization Complete: ${successfulSystems}/${this.totalSystems} systems (${successRate}%)`);
        console.log('🌟 AI Trading Playground Ultimate Edition is ready!');
        console.log('📚 Complete learning ecosystem from zero to hero!');
        console.log('🔧 Professional-grade trading tools and analytics!');
        console.log('🤖 AI-powered coaching and live learning visualization!');
        console.log('🎨 Advanced layout management and responsive design!');
        console.log('🎤 Voice control and accessibility features!');
        console.log('💼 Institutional-grade trading suite!');
        console.log('==================================================================');
    }

    // Public API for accessing systems
    getSystem(systemName) {
        return this.systems[systemName];
    }

    getAllSystems() {
        return this.systems;
    }

    getInitializationStatus() {
        return this.initializationStatus;
    }
}

// Initialize the Ultimate Trading Playground when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all scripts are loaded
    setTimeout(() => {
        window.ultimateLauncher = new TradingPlaygroundUltimateLauncher();
    }, 100);
}); 
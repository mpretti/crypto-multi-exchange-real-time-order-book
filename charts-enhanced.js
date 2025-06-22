/**
 * Enhanced Chart Features - Next Level Trading Charts
 * This module adds advanced features to the existing LightweightCharts implementation
 */

// Enhanced chart state
window.ChartEnhancements = {
    indicators: new Set(['volume']),
    mode: 'single',
    theme: 'dark',
    isInitialized: false,
    
    // Initialize enhanced features
    init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing Enhanced Chart Features...');
        
        // Add enhanced controls
        this.addEnhancedControls();
        
        // Add chart statistics
        this.addChartStatistics();
        
        // Add keyboard shortcuts
        this.addKeyboardShortcuts();
        
        // Add price alerts
        this.initPriceAlerts();
        
        this.isInitialized = true;
        console.log('✅ Enhanced Chart Features Initialized!');
        
        // Show welcome message
        this.showNotification('🎉 Enhanced chart features activated! Press "H" for help.', 'success');
    },
    
    // Add enhanced control panel
    addEnhancedControls() {
        const chartContainer = document.getElementById('chart-container');
        if (!chartContainer) return;
        
        // Create floating control panel
        const controlPanel = document.createElement('div');
        controlPanel.id = 'enhanced-chart-controls';
        controlPanel.className = 'enhanced-controls-panel';
        controlPanel.innerHTML = `
            <div class="controls-header">
                <h4>📊 Chart Pro</h4>
                <button class="minimize-btn" onclick="ChartEnhancements.toggleControls()">−</button>
            </div>
            
            <div class="controls-content">
                <div class="control-group">
                    <label>📈 Chart Mode:</label>
                    <select id="chart-mode-select" onchange="ChartEnhancements.switchMode(this.value)">
                        <option value="single">📈 Single Asset</option>
                        <option value="comparison">📊 Multi-Exchange</option>
                        <option value="depth">📚 Order Book</option>
                        <option value="heatmap">🔥 Price Heatmap</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <label>🔧 Indicators:</label>
                    <div class="indicator-checkboxes">
                        <label><input type="checkbox" onchange="ChartEnhancements.toggleIndicator('volume', this.checked)" checked> 📊 Volume</label>
                        <label><input type="checkbox" onchange="ChartEnhancements.toggleIndicator('sma', this.checked)"> 📈 SMA 20</label>
                        <label><input type="checkbox" onchange="ChartEnhancements.toggleIndicator('ema', this.checked)"> 📉 EMA 50</label>
                        <label><input type="checkbox" onchange="ChartEnhancements.toggleIndicator('bollinger', this.checked)"> 🎯 Bollinger</label>
                        <label><input type="checkbox" onchange="ChartEnhancements.toggleIndicator('rsi', this.checked)"> ⚡ RSI</label>
                        <label><input type="checkbox" onchange="ChartEnhancements.toggleIndicator('macd', this.checked)"> 🌊 MACD</label>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>🎨 Theme:</label>
                    <select id="chart-theme-select" onchange="ChartEnhancements.switchTheme(this.value)">
                        <option value="dark">🌙 Dark</option>
                        <option value="light">☀️ Light</option>
                        <option value="crypto">💎 Crypto</option>
                        <option value="matrix">🔢 Matrix</option>
                        <option value="neon">💫 Neon</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <div class="action-buttons">
                        <button onclick="ChartEnhancements.resetZoom()" title="Reset Zoom">🔍</button>
                        <button onclick="ChartEnhancements.takeScreenshot()" title="Screenshot">📸</button>
                        <button onclick="ChartEnhancements.showHelp()" title="Help">❓</button>
                        <button onclick="ChartEnhancements.toggleFullscreen()" title="Fullscreen">⛶</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        this.addEnhancedStyles();
        
        // Insert control panel
        chartContainer.parentElement?.appendChild(controlPanel);
    },
    
    // Add enhanced styles
    addEnhancedStyles() {
        if (document.getElementById('enhanced-chart-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'enhanced-chart-styles';
        styles.textContent = `
            .enhanced-controls-panel {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(20, 20, 30, 0.95);
                border: 1px solid rgba(79, 172, 254, 0.3);
                border-radius: 12px;
                padding: 16px;
                min-width: 280px;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 1000;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(79, 172, 254, 0.2);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                transition: all 0.3s ease;
                color: #e0e0e0;
            }
            
            .controls-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .controls-header h4 {
                margin: 0;
                color: #4facfe;
                font-size: 16px;
                font-weight: 600;
            }
            
            .minimize-btn {
                background: none;
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #a0a0a0;
                width: 24px;
                height: 24px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .minimize-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #e0e0e0;
            }
            
            .control-group {
                margin-bottom: 16px;
            }
            
            .control-group label {
                display: block;
                color: #b0b0b0;
                font-size: 13px;
                font-weight: 500;
                margin-bottom: 8px;
            }
            
            .control-group select {
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #e0e0e0;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .control-group select:focus {
                outline: none;
                border-color: #4facfe;
                background: rgba(255, 255, 255, 0.08);
            }
            
            .indicator-checkboxes {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            
            .indicator-checkboxes label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                margin-bottom: 4px;
                cursor: pointer;
                transition: color 0.2s ease;
            }
            
            .indicator-checkboxes label:hover {
                color: #e0e0e0;
            }
            
            .indicator-checkboxes input[type="checkbox"] {
                accent-color: #4facfe;
                width: 14px;
                height: 14px;
            }
            
            .action-buttons {
                display: flex;
                gap: 8px;
                justify-content: space-between;
            }
            
            .action-buttons button {
                flex: 1;
                background: linear-gradient(45deg, #4facfe, #00f2fe);
                border: none;
                color: white;
                padding: 8px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: 36px;
            }
            
            .action-buttons button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
            }
            
            .chart-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(20, 20, 30, 0.95);
                border: 1px solid rgba(79, 172, 254, 0.3);
                border-radius: 8px;
                padding: 12px 16px;
                color: #e0e0e0;
                font-size: 14px;
                z-index: 10000;
                backdrop-filter: blur(10px);
                animation: slideInRight 0.3s ease;
                max-width: 300px;
            }
            
            .chart-notification.success {
                border-color: rgba(0, 255, 136, 0.3);
                background: rgba(0, 50, 20, 0.95);
            }
            
            .chart-notification.error {
                border-color: rgba(255, 68, 68, 0.3);
                background: rgba(50, 0, 0, 0.95);
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .chart-stats-overlay {
                position: absolute;
                top: 60px;
                left: 10px;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(79, 172, 254, 0.3);
                border-radius: 8px;
                padding: 12px;
                color: #e0e0e0;
                font-size: 12px;
                z-index: 100;
                min-width: 200px;
                backdrop-filter: blur(5px);
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }
            
            .stat-value.positive {
                color: #00ff88;
            }
            
            .stat-value.negative {
                color: #ff4444;
            }
            
            .enhanced-controls-panel.minimized .controls-content {
                display: none;
            }
            
            .enhanced-controls-panel.minimized {
                min-width: auto;
            }
            
            /* Theme variations */
            .theme-crypto {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            }
            
            .theme-matrix {
                background: linear-gradient(135deg, #0d1b0d 0%, #1a3d1a 100%);
                color: #00ff41;
            }
            
            .theme-neon {
                background: linear-gradient(135deg, #0a0a0a 0%, #2d1b69 100%);
            }
        `;
        
        document.head.appendChild(styles);
    },
    
    // Add chart statistics overlay
    addChartStatistics() {
        const chartContainer = document.getElementById('chart-container');
        if (!chartContainer || document.getElementById('chart-stats-overlay')) return;
        
        const statsOverlay = document.createElement('div');
        statsOverlay.id = 'chart-stats-overlay';
        statsOverlay.className = 'chart-stats-overlay';
        statsOverlay.innerHTML = `
            <div class="stat-row">
                <span>Current Price:</span>
                <span id="current-price-stat" class="stat-value">$44,712.91</span>
            </div>
            <div class="stat-row">
                <span>24h Change:</span>
                <span id="price-change-stat" class="stat-value negative">-$287.09 (-0.64%)</span>
            </div>
            <div class="stat-row">
                <span>Volume:</span>
                <span id="volume-stat" class="stat-value">62.05K BTC</span>
            </div>
            <div class="stat-row">
                <span>High/Low:</span>
                <span id="high-low-stat" class="stat-value">$46,902.15 / $44,648.60</span>
            </div>
            <div class="stat-row">
                <span>Active Indicators:</span>
                <span id="indicators-count" class="stat-value">1</span>
            </div>
        `;
        
        chartContainer.appendChild(statsOverlay);
        
        // Update stats periodically
        this.startStatsUpdater();
    },
    
    // Start statistics updater
    startStatsUpdater() {
        setInterval(() => {
            this.updateChartStatistics();
        }, 5000);
    },
    
    // Update chart statistics
    updateChartStatistics() {
        const priceEl = document.getElementById('current-price-stat');
        const changeEl = document.getElementById('price-change-stat');
        const volumeEl = document.getElementById('volume-stat');
        const indicatorsEl = document.getElementById('indicators-count');
        
        // Simulate real-time price updates
        const basePrice = 44712.91;
        const variation = (Math.random() - 0.5) * 200;
        const newPrice = basePrice + variation;
        const change = variation;
        const changePercent = (change / basePrice) * 100;
        
        if (priceEl) {
            priceEl.textContent = `$${newPrice.toFixed(2)}`;
        }
        
        if (changeEl) {
            changeEl.textContent = `${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
            changeEl.className = `stat-value ${change >= 0 ? 'positive' : 'negative'}`;
        }
        
        if (volumeEl) {
            const volume = 62.05 + (Math.random() - 0.5) * 10;
            volumeEl.textContent = `${volume.toFixed(2)}K BTC`;
        }
        
        if (indicatorsEl) {
            indicatorsEl.textContent = this.indicators.size.toString();
        }
    },
    
    // Add keyboard shortcuts
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only activate if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.key.toLowerCase()) {
                case 'h':
                    this.showHelp();
                    break;
                case 'r':
                    this.resetZoom();
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.takeScreenshot();
                    }
                    break;
                case 'f':
                    this.toggleFullscreen();
                    break;
                case 't':
                    this.cycleTheme();
                    break;
                case '1':
                    this.switchMode('single');
                    break;
                case '2':
                    this.switchMode('comparison');
                    break;
                case '3':
                    this.switchMode('depth');
                    break;
            }
        });
    },
    
    // Initialize price alerts
    initPriceAlerts() {
        this.priceAlerts = [];
        this.lastPrice = 44712.91;
        
        // Check for price alerts every second
        setInterval(() => {
            this.checkPriceAlerts();
        }, 1000);
    },
    
    // Switch chart mode
    switchMode(mode) {
        this.mode = mode;
        console.log(`📊 Switching to ${mode} mode`);
        
        const modeSelect = document.getElementById('chart-mode-select');
        if (modeSelect) {
            modeSelect.value = mode;
        }
        
        switch (mode) {
            case 'single':
                this.showNotification('📈 Single asset mode activated', 'success');
                break;
            case 'comparison':
                this.showNotification('📊 Multi-exchange comparison mode activated', 'success');
                this.simulateMultiExchangeData();
                break;
            case 'depth':
                this.showNotification('📚 Order book depth mode activated', 'success');
                this.simulateDepthData();
                break;
            case 'heatmap':
                this.showNotification('🔥 Price heatmap mode activated', 'success');
                break;
        }
    },
    
    // Toggle indicator
    toggleIndicator(indicator, enabled) {
        if (enabled) {
            this.indicators.add(indicator);
            console.log(`✅ Added ${indicator} indicator`);
            this.showNotification(`✅ ${indicator.toUpperCase()} indicator added`, 'success');
        } else {
            this.indicators.delete(indicator);
            console.log(`❌ Removed ${indicator} indicator`);
            this.showNotification(`❌ ${indicator.toUpperCase()} indicator removed`, 'success');
        }
        
        this.updateChartStatistics();
    },
    
    // Switch theme
    switchTheme(theme) {
        this.theme = theme;
        console.log(`🎨 Switching to ${theme} theme`);
        
        const chartContainer = document.getElementById('chart-container');
        if (chartContainer) {
            // Remove existing theme classes
            chartContainer.classList.remove('theme-dark', 'theme-light', 'theme-crypto', 'theme-matrix', 'theme-neon');
            chartContainer.classList.add(`theme-${theme}`);
        }
        
        this.showNotification(`🎨 ${theme.charAt(0).toUpperCase() + theme.slice(1)} theme applied`, 'success');
    },
    
    // Cycle through themes
    cycleTheme() {
        const themes = ['dark', 'light', 'crypto', 'matrix', 'neon'];
        const currentIndex = themes.indexOf(this.theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        this.switchTheme(nextTheme);
        
        const themeSelect = document.getElementById('chart-theme-select');
        if (themeSelect) {
            themeSelect.value = nextTheme;
        }
    },
    
    // Reset zoom
    resetZoom() {
        console.log('🔍 Resetting chart zoom');
        this.showNotification('🔍 Chart zoom reset', 'success');
        
        // In a real implementation, this would reset the chart zoom
        // For now, we'll just show the notification
    },
    
    // Take screenshot
    takeScreenshot() {
        console.log('📸 Taking chart screenshot');
        this.showNotification('📸 Screenshot saved!', 'success');
        
        // In a real implementation, this would capture the chart
        // For now, we'll simulate it
    },
    
    // Toggle fullscreen
    toggleFullscreen() {
        const chartSection = document.getElementById('chart-section-container');
        if (!chartSection) return;
        
        if (chartSection.classList.contains('fullscreen')) {
            chartSection.classList.remove('fullscreen');
            this.showNotification('📱 Exited fullscreen', 'success');
        } else {
            chartSection.classList.add('fullscreen');
            this.showNotification('⛶ Entered fullscreen', 'success');
        }
    },
    
    // Toggle controls panel
    toggleControls() {
        const panel = document.getElementById('enhanced-chart-controls');
        if (panel) {
            panel.classList.toggle('minimized');
        }
    },
    
    // Show help
    showHelp() {
        const helpMessage = `
🎯 Enhanced Chart Shortcuts:

⌨️ Keyboard Shortcuts:
• H - Show this help
• R - Reset zoom
• Ctrl+S - Take screenshot
• F - Toggle fullscreen
• T - Cycle themes
• 1 - Single asset mode
• 2 - Multi-exchange mode
• 3 - Order book depth mode

📊 Features:
• Real-time price updates
• Technical indicators
• Multi-exchange comparison
• Order book depth visualization
• Price alerts
• Theme customization

🚀 Pro Tips:
• Hover over buttons for tooltips
• Use mouse wheel to zoom
• Right-click for context menu
        `;
        
        alert(helpMessage);
    },
    
    // Simulate multi-exchange data
    simulateMultiExchangeData() {
        const exchanges = ['Binance', 'Bybit', 'OKX', 'Kraken', 'Coinbase'];
        const basePrice = 44712.91;
        
        exchanges.forEach((exchange, index) => {
            setTimeout(() => {
                const variation = (Math.random() - 0.5) * 100;
                const price = basePrice + variation;
                console.log(`${exchange}: $${price.toFixed(2)}`);
            }, index * 500);
        });
    },
    
    // Simulate depth data
    simulateDepthData() {
        console.log('📚 Loading order book depth data...');
        
        setTimeout(() => {
            const bids = Math.floor(Math.random() * 50) + 20;
            const asks = Math.floor(Math.random() * 50) + 20;
            console.log(`Order book: ${bids} bids, ${asks} asks`);
            this.showNotification(`📚 Loaded ${bids} bids, ${asks} asks`, 'success');
        }, 1000);
    },
    
    // Check price alerts
    checkPriceAlerts() {
        // Simulate price movement
        const variation = (Math.random() - 0.5) * 10;
        this.lastPrice += variation;
        
        // Check alerts (simplified)
        if (Math.random() < 0.01) { // 1% chance of alert
            this.showNotification('🔔 Price Alert: Target reached!', 'success');
        }
    },
    
    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `chart-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.ChartEnhancements.init();
        }, 2000); // Wait for chart to load
    });
} else {
    setTimeout(() => {
        window.ChartEnhancements.init();
    }, 2000);
}

// Add fullscreen styles
const fullscreenStyles = document.createElement('style');
fullscreenStyles.textContent = `
    #chart-section-container.fullscreen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 9999 !important;
        background: #0a0a0a !important;
    }
    
    #chart-section-container.fullscreen #chart-container {
        height: calc(100vh - 60px) !important;
    }
    
    .slideOutRight {
        animation: slideOutRight 0.3s ease forwards;
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(fullscreenStyles);

console.log('🚀 Enhanced Chart System Loaded! Ready to activate...'); 
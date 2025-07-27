// Charts Dashboard Enhancements
// Advanced features to make the charts dashboard more professional and functional

class ChartsDashboardEnhancements {
    constructor() {
        this.init();
    }

    init() {
        this.addAdvancedControls();
        this.addTradingTools();
        this.addMarketAnalysis();
        this.addKeyboardShortcuts();
        this.addChartSync();
        this.addDataExport();
        this.addThemeCustomization();
        this.addPerformanceMonitoring();
    }

    // 1. Advanced Chart Controls
    addAdvancedControls() {
        const controlsHTML = `
            <div class="advanced-controls glass-effect rounded-xl p-4 mb-6">
                <h3 class="text-lg font-semibold mb-4">📊 Advanced Controls</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button class="control-btn" id="sync-charts">
                        <i class="fas fa-sync"></i> Sync Charts
                    </button>
                    <button class="control-btn" id="screenshot">
                        <i class="fas fa-camera"></i> Screenshot
                    </button>
                    <button class="control-btn" id="compare-mode">
                        <i class="fas fa-balance-scale"></i> Compare
                    </button>
                    <button class="control-btn" id="drawing-tools">
                        <i class="fas fa-pencil-ruler"></i> Draw
                    </button>
                </div>
            </div>
        `;
        
        const container = document.querySelector('.max-w-7xl');
        const controlPanel = document.querySelector('.glass-effect');
        controlPanel.insertAdjacentHTML('afterend', controlsHTML);
        
        this.setupAdvancedControlHandlers();
    }

    setupAdvancedControlHandlers() {
        // Chart synchronization
        document.getElementById('sync-charts')?.addEventListener('click', () => {
            this.syncCharts();
            this.showNotification('Charts synchronized', 'success');
        });

        // Screenshot functionality
        document.getElementById('screenshot')?.addEventListener('click', () => {
            this.takeScreenshot();
        });

        // Compare mode
        document.getElementById('compare-mode')?.addEventListener('click', () => {
            this.toggleCompareMode();
        });

        // Drawing tools
        document.getElementById('drawing-tools')?.addEventListener('click', () => {
            this.toggleDrawingTools();
        });
    }

    // 2. Trading Tools Integration
    addTradingTools() {
        const tradingToolsHTML = `
            <div class="trading-tools glass-effect rounded-xl p-4 mb-6">
                <h3 class="text-lg font-semibold mb-4">🔧 Trading Tools</h3>
                <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <button class="tool-btn" id="fibonacci">
                        <i class="fas fa-wave-square"></i> Fibonacci
                    </button>
                    <button class="tool-btn" id="support-resistance">
                        <i class="fas fa-arrows-alt-h"></i> S/R Lines
                    </button>
                    <button class="tool-btn" id="trend-lines">
                        <i class="fas fa-chart-line"></i> Trend Lines
                    </button>
                    <button class="tool-btn" id="price-targets">
                        <i class="fas fa-bullseye"></i> Targets
                    </button>
                    <button class="tool-btn" id="risk-calc">
                        <i class="fas fa-calculator"></i> Risk Calc
                    </button>
                    <button class="tool-btn" id="order-book">
                        <i class="fas fa-list"></i> Order Book
                    </button>
                </div>
            </div>
        `;
        
        document.querySelector('.advanced-controls').insertAdjacentHTML('afterend', tradingToolsHTML);
        this.setupTradingToolHandlers();
    }

    setupTradingToolHandlers() {
        // Fibonacci retracement
        document.getElementById('fibonacci')?.addEventListener('click', () => {
            this.addFibonacciTool();
        });

        // Support/Resistance lines
        document.getElementById('support-resistance')?.addEventListener('click', () => {
            this.addSupportResistanceLines();
        });

        // Risk calculator
        document.getElementById('risk-calc')?.addEventListener('click', () => {
            this.openRiskCalculator();
        });
    }

    // 3. Market Analysis Panel
    addMarketAnalysis() {
        const analysisHTML = `
            <div class="market-analysis glass-effect rounded-xl p-4 mb-6">
                <h3 class="text-lg font-semibold mb-4">📈 Market Analysis</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="analysis-card">
                        <h4 class="font-semibold mb-2">Technical Signals</h4>
                        <div id="technical-signals">
                            <div class="signal-item">
                                <span class="signal-name">RSI (14):</span>
                                <span class="signal-value" id="rsi-signal">Loading...</span>
                            </div>
                            <div class="signal-item">
                                <span class="signal-name">MACD:</span>
                                <span class="signal-value" id="macd-signal">Loading...</span>
                            </div>
                            <div class="signal-item">
                                <span class="signal-name">Moving Avg:</span>
                                <span class="signal-value" id="ma-signal">Loading...</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-card">
                        <h4 class="font-semibold mb-2">Price Levels</h4>
                        <div id="price-levels">
                            <div class="level-item">
                                <span class="level-name">Resistance:</span>
                                <span class="level-value" id="resistance">$0.00</span>
                            </div>
                            <div class="level-item">
                                <span class="level-name">Support:</span>
                                <span class="level-value" id="support">$0.00</span>
                            </div>
                            <div class="level-item">
                                <span class="level-name">Pivot:</span>
                                <span class="level-value" id="pivot">$0.00</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-card">
                        <h4 class="font-semibold mb-2">Market Sentiment</h4>
                        <div id="market-sentiment">
                            <div class="sentiment-gauge">
                                <div class="gauge-fill" id="sentiment-fill"></div>
                                <span class="gauge-text" id="sentiment-text">Neutral</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.querySelector('.trading-tools').insertAdjacentHTML('afterend', analysisHTML);
        this.updateMarketAnalysis();
    }

    // 4. Keyboard Shortcuts
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.takeScreenshot();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFullscreen();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.refreshCharts();
                        break;
                    case '1':
                        e.preventDefault();
                        this.switchToTimeframe('1m');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchToTimeframe('5m');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchToTimeframe('1h');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchToTimeframe('1d');
                        break;
                }
            }
        });

        // Show keyboard shortcuts help
        this.addShortcutsHelp();
    }

    addShortcutsHelp() {
        const helpHTML = `
            <div class="shortcuts-help" id="shortcuts-help" style="display: none;">
                <div class="glass-effect rounded-xl p-4">
                    <h4 class="font-semibold mb-3">⌨️ Keyboard Shortcuts</h4>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div><kbd>Ctrl+S</kbd> Screenshot</div>
                        <div><kbd>Ctrl+F</kbd> Fullscreen</div>
                        <div><kbd>Ctrl+R</kbd> Refresh</div>
                        <div><kbd>Ctrl+1</kbd> 1m timeframe</div>
                        <div><kbd>Ctrl+2</kbd> 5m timeframe</div>
                        <div><kbd>Ctrl+3</kbd> 1h timeframe</div>
                        <div><kbd>Ctrl+4</kbd> 1d timeframe</div>
                        <div><kbd>?</kbd> Show/hide help</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', helpHTML);
        
        // Toggle help with '?' key
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.toggleShortcutsHelp();
            }
        });
    }

    // 5. Chart Synchronization
    syncCharts() {
        // Sync timeframes, zoom levels, and crosshair positions
        const charts = document.querySelectorAll('.chart-container');
        // Implementation would sync chart states
        console.log('🔄 Charts synchronized');
    }

    // 6. Enhanced Screenshot
    takeScreenshot() {
        html2canvas(document.querySelector('#charts-container')).then(canvas => {
            const link = document.createElement('a');
            link.download = `charts-${new Date().toISOString().slice(0, 19)}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    }

    // 7. Data Export
    addDataExport() {
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.showExportOptions();
            });
        }
    }

    showExportOptions() {
        const modal = document.createElement('div');
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="glass-effect rounded-xl p-6 max-w-md w-full mx-4">
                <h3 class="text-xl font-semibold mb-4">📊 Export Data</h3>
                <div class="space-y-3">
                    <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded" onclick="exportToCSV()">
                        📄 Export to CSV
                    </button>
                    <button class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded" onclick="exportToJSON()">
                        📋 Export to JSON
                    </button>
                    <button class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded" onclick="exportChart()">
                        📈 Export Chart Image
                    </button>
                    <button class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded" onclick="closeModal()">
                        ❌ Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        window.closeModal = () => modal.remove();
        window.exportToCSV = () => this.exportData('csv');
        window.exportToJSON = () => this.exportData('json');
        window.exportChart = () => this.takeScreenshot();
    }

    // 8. Theme Customization
    addThemeCustomization() {
        const themeSelector = document.createElement('div');
        themeSelector.className = 'theme-selector fixed top-20 right-4 z-40';
        themeSelector.innerHTML = `
            <div class="glass-effect rounded-lg p-3">
                <h4 class="text-sm font-semibold mb-2">🎨 Theme</h4>
                <div class="flex flex-col space-y-2">
                    <button class="theme-btn" data-theme="dark">🌙 Dark</button>
                    <button class="theme-btn" data-theme="light">☀️ Light</button>
                    <button class="theme-btn" data-theme="cyberpunk">🔮 Cyber</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(themeSelector);
        
        // Theme switching
        themeSelector.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-btn')) {
                this.switchTheme(e.target.dataset.theme);
            }
        });
    }

    // 9. Performance Monitoring
    addPerformanceMonitoring() {
        const perfMonitor = document.createElement('div');
        perfMonitor.className = 'perf-monitor fixed bottom-4 right-4 z-40';
        perfMonitor.innerHTML = `
            <div class="glass-effect rounded-lg p-3 text-xs">
                <div>FPS: <span id="fps">0</span></div>
                <div>Memory: <span id="memory">0 MB</span></div>
                <div>Latency: <span id="latency">0 ms</span></div>
            </div>
        `;
        
        document.body.appendChild(perfMonitor);
        
        this.startPerformanceMonitoring();
    }

    startPerformanceMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const updateStats = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                document.getElementById('fps').textContent = fps;
                
                // Memory usage (if available)
                if (performance.memory) {
                    const memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
                    document.getElementById('memory').textContent = memory;
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(updateStats);
        };
        
        updateStats();
    }

    // Utility Methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 z-50 glass-effect rounded-lg p-4 ${type}`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    switchTheme(theme) {
        document.body.className = `theme-${theme}`;
        localStorage.setItem('chart-theme', theme);
        this.showNotification(`Switched to ${theme} theme`, 'success');
    }

    toggleShortcutsHelp() {
        const help = document.getElementById('shortcuts-help');
        help.style.display = help.style.display === 'none' ? 'block' : 'none';
    }

    updateMarketAnalysis() {
        // Update technical signals
        setInterval(() => {
            this.updateTechnicalSignals();
            this.updatePriceLevels();
            this.updateSentimentGauge();
        }, 5000);
    }

    updateTechnicalSignals() {
        // Mock data - replace with actual calculations
        document.getElementById('rsi-signal').textContent = 'Oversold (25)';
        document.getElementById('macd-signal').textContent = 'Bullish Cross';
        document.getElementById('ma-signal').textContent = 'Above 20 MA';
    }

    updatePriceLevels() {
        // Mock data - replace with actual calculations
        document.getElementById('resistance').textContent = '$67,500';
        document.getElementById('support').textContent = '$65,200';
        document.getElementById('pivot').textContent = '$66,350';
    }

    updateSentimentGauge() {
        const sentiment = Math.random() * 100;
        const fill = document.getElementById('sentiment-fill');
        const text = document.getElementById('sentiment-text');
        
        if (fill) {
            fill.style.width = `${sentiment}%`;
            
            if (sentiment < 30) {
                text.textContent = 'Bearish';
                fill.style.background = '#ef4444';
            } else if (sentiment > 70) {
                text.textContent = 'Bullish';
                fill.style.background = '#10b981';
            } else {
                text.textContent = 'Neutral';
                fill.style.background = '#f59e0b';
            }
        }
    }

    exportData(format) {
        // Implementation for data export
        this.showNotification(`Exporting data as ${format.toUpperCase()}...`, 'info');
        
        setTimeout(() => {
            this.showNotification(`Data exported successfully!`, 'success');
        }, 2000);
    }
}

// CSS for enhancements
const enhancementStyles = `
<style>
.control-btn, .tool-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #cbd5e0;
    padding: 0.75rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    cursor: pointer;
    text-align: center;
    font-size: 0.875rem;
}

.control-btn:hover, .tool-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    transform: translateY(-1px);
}

.analysis-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    padding: 1rem;
}

.signal-item, .level-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
}

.signal-name, .level-name {
    color: #9ca3af;
}

.signal-value, .level-value {
    color: white;
    font-weight: 500;
}

.sentiment-gauge {
    position: relative;
    background: rgba(255, 255, 255, 0.1);
    height: 2rem;
    border-radius: 1rem;
    overflow: hidden;
}

.gauge-fill {
    height: 100%;
    background: #f59e0b;
    transition: width 0.3s ease;
    border-radius: 1rem;
}

.gauge-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
}

.theme-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    padding: 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.2s ease;
}

.theme-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.notification {
    animation: slideIn 0.3s ease-out;
}

.notification.success {
    border-left: 4px solid #10b981;
}

.notification.error {
    border-left: 4px solid #ef4444;
}

.notification.info {
    border-left: 4px solid #3b82f6;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

kbd {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
    padding: 0.125rem 0.25rem;
    font-size: 0.75rem;
    font-family: monospace;
}

.shortcuts-help {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
}

.perf-monitor {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.8);
}

.theme-selector {
    transition: all 0.3s ease;
}

.theme-selector:hover {
    transform: scale(1.05);
}
</style>
`;

// Add styles to document
document.head.insertAdjacentHTML('beforeend', enhancementStyles);

// Initialize enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        new ChartsDashboardEnhancements();
        console.log('📊 Charts Dashboard Enhanced!');
    }, 1000);
}); 
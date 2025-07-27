/**
 * AI Trading Playground - Space Optimizer
 * Intelligent space management system for optimal layout
 */

class SpaceOptimizer {
    constructor() {
        this.isInitialized = false;
        this.currentMode = 'auto';
        this.originalSizes = new Map();
        this.observers = new Map();
        
        this.init();
    }

    init() {
        this.createSpaceControls();
        this.optimizeChartSpace();
        this.enhanceTimeMachine();
        this.setupDynamicResize();
        this.createOverlayModes();
        this.isInitialized = true;
        
        console.log('🎯 Space Optimizer initialized');
    }

    createSpaceControls() {
        // Create floating space control panel
        const spaceControls = document.createElement('div');
        spaceControls.className = 'space-controls-panel glass-effect';
        spaceControls.id = 'spaceControlsPanel';
        spaceControls.innerHTML = `
            <div class="space-header">
                <i class="fas fa-expand-arrows-alt"></i>
                <span>Space</span>
                <button class="minimize-btn" id="spaceMinimizeBtn">
                    <i class="fas fa-minus"></i>
                </button>
            </div>
            <div class="space-content">
                <div class="space-mode-selector">
                    <button class="space-mode-btn active" data-mode="auto">Auto</button>
                    <button class="space-mode-btn" data-mode="chart-focus">Chart Focus</button>
                    <button class="space-mode-btn" data-mode="compact">Compact</button>
                    <button class="space-mode-btn" data-mode="overlay">Overlay</button>
                </div>
                
                <div class="space-sliders">
                    <div class="slider-group">
                        <label>Chart Height</label>
                        <input type="range" min="200" max="800" value="400" id="chartHeightSlider">
                        <span id="chartHeightValue">400px</span>
                    </div>
                    
                    <div class="slider-group">
                        <label>Time Panel Width</label>
                        <input type="range" min="250" max="500" value="350" id="timePanelWidthSlider">
                        <span id="timePanelWidthValue">350px</span>
                    </div>
                </div>
                
                <div class="quick-actions">
                    <button class="quick-action-btn" id="maximizeChartBtn">
                        <i class="fas fa-chart-line"></i>
                        Max Chart
                    </button>
                    <button class="quick-action-btn" id="balanceLayoutBtn">
                        <i class="fas fa-balance-scale"></i>
                        Balance
                    </button>
                    <button class="quick-action-btn" id="hideNonEssentialBtn">
                        <i class="fas fa-eye-slash"></i>
                        Focus
                    </button>
                </div>
                
                <div class="overlay-toggles">
                    <label class="toggle-item">
                        <input type="checkbox" id="floatingTimeMachine">
                        <span class="toggle-slider"></span>
                        <span>Floating Time Machine</span>
                    </label>
                    
                    <label class="toggle-item">
                        <input type="checkbox" id="compactPerformance">
                        <span class="toggle-slider"></span>
                        <span>Compact Performance</span>
                    </label>
                    
                    <label class="toggle-item">
                        <input type="checkbox" id="sidebarMode">
                        <span class="toggle-slider"></span>
                        <span>Sidebar Mode</span>
                    </label>
                </div>
            </div>
        `;
        
        // Position it
        spaceControls.style.position = 'fixed';
        spaceControls.style.top = '20px';
        spaceControls.style.left = '20px';
        spaceControls.style.zIndex = '1010';
        spaceControls.style.width = '280px';
        
        document.body.appendChild(spaceControls);
        this.setupSpaceControlEvents();
    }

    setupSpaceControlEvents() {
        // Mode selector
        document.querySelectorAll('.space-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.space-mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.setSpaceMode(e.target.dataset.mode);
            });
        });

        // Sliders
        const chartHeightSlider = document.getElementById('chartHeightSlider');
        const timePanelWidthSlider = document.getElementById('timePanelWidthSlider');
        
        chartHeightSlider?.addEventListener('input', (e) => {
            const value = e.target.value + 'px';
            document.getElementById('chartHeightValue').textContent = value;
            this.setChartHeight(e.target.value);
        });
        
        timePanelWidthSlider?.addEventListener('input', (e) => {
            const value = e.target.value + 'px';
            document.getElementById('timePanelWidthValue').textContent = value;
            this.setTimePanelWidth(e.target.value);
        });

        // Quick actions
        document.getElementById('maximizeChartBtn')?.addEventListener('click', () => this.maximizeChart());
        document.getElementById('balanceLayoutBtn')?.addEventListener('click', () => this.balanceLayout());
        document.getElementById('hideNonEssentialBtn')?.addEventListener('click', () => this.focusMode());

        // Toggles
        document.getElementById('floatingTimeMachine')?.addEventListener('change', (e) => {
            this.toggleFloatingTimeMachine(e.target.checked);
        });
        
        document.getElementById('compactPerformance')?.addEventListener('change', (e) => {
            this.toggleCompactPerformance(e.target.checked);
        });
        
        document.getElementById('sidebarMode')?.addEventListener('change', (e) => {
            this.toggleSidebarMode(e.target.checked);
        });

        // Minimize button
        document.getElementById('spaceMinimizeBtn')?.addEventListener('click', () => {
            const panel = document.getElementById('spaceControlsPanel');
            panel.classList.toggle('minimized');
        });
    }

    setSpaceMode(mode) {
        this.currentMode = mode;
        document.body.className = document.body.className.replace(/space-mode-\w+/g, '');
        document.body.classList.add(`space-mode-${mode}`);
        
        switch(mode) {
            case 'auto':
                this.autoOptimizeSpace();
                break;
            case 'chart-focus':
                this.chartFocusMode();
                break;
            case 'compact':
                this.compactMode();
                break;
            case 'overlay':
                this.overlayMode();
                break;
        }
    }

    autoOptimizeSpace() {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Smart auto-optimization based on screen size
        if (viewport.width < 1200) {
            this.compactMode();
        } else if (viewport.width > 1600) {
            this.chartFocusMode();
        } else {
            this.balanceLayout();
        }
    }

    chartFocusMode() {
        // Maximize chart, minimize everything else
        this.setChartHeight(Math.min(600, window.innerHeight * 0.7));
        
        // Compact time machine
        const timePanel = document.querySelector('.time-panel');
        if (timePanel) {
            timePanel.style.minWidth = '280px';
            timePanel.style.maxWidth = '320px';
        }
        
        // Minimize performance panel
        const performancePanel = document.querySelector('.performance-panel');
        if (performancePanel) {
            performancePanel.style.minWidth = '200px';
            this.compactifyMetrics();
        }
        
        // Stack activity panel
        this.stackActivityPanel();
    }

    compactMode() {
        // Reduce all panel sizes
        this.setChartHeight(300);
        
        const timePanel = document.querySelector('.time-panel');
        if (timePanel) {
            timePanel.style.minWidth = '250px';
            timePanel.style.maxWidth = '280px';
        }
        
        // Compact all panels
        this.compactifyAllPanels();
    }

    overlayMode() {
        // Move panels to overlay positions
        this.createFloatingTimeMachine();
        this.createFloatingPerformance();
        
        // Maximize chart space
        const chartSection = document.querySelector('.chart-panel');
        if (chartSection) {
            chartSection.style.gridColumn = '1 / -1';
            chartSection.style.gridRow = '1 / -1';
        }
    }

    optimizeChartSpace() {
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) return;
        
        // Store original size
        this.originalSizes.set('chart', {
            height: chartContainer.style.height || '400px',
            width: chartContainer.style.width || '100%'
        });
        
        // Add chart optimization overlay
        const chartOptimizer = document.createElement('div');
        chartOptimizer.className = 'chart-space-optimizer';
        chartOptimizer.innerHTML = `
            <div class="chart-optimizer-controls">
                <button class="optimizer-btn" id="chartExpandBtn" title="Expand Chart">
                    <i class="fas fa-expand"></i>
                </button>
                <button class="optimizer-btn" id="chartFloatBtn" title="Float Chart">
                    <i class="fas fa-external-link-alt"></i>
                </button>
                <button class="optimizer-btn" id="chartFullscreenBtn" title="Fullscreen">
                    <i class="fas fa-arrows-alt"></i>
                </button>
            </div>
        `;
        
        chartContainer.style.position = 'relative';
        chartContainer.appendChild(chartOptimizer);
        
        this.setupChartOptimizer();
    }

    setupChartOptimizer() {
        document.getElementById('chartExpandBtn')?.addEventListener('click', () => {
            this.expandChart();
        });
        
        document.getElementById('chartFloatBtn')?.addEventListener('click', () => {
            this.floatChart();
        });
        
        document.getElementById('chartFullscreenBtn')?.addEventListener('click', () => {
            this.fullscreenChart();
        });
    }

    enhanceTimeMachine() {
        const timePanel = document.querySelector('.time-panel');
        if (!timePanel) return;
        
        // Store original size
        this.originalSizes.set('timePanel', {
            width: timePanel.style.width || 'auto',
            minWidth: timePanel.style.minWidth || '300px'
        });
        
        // Add time machine enhancer
        const timeMachineEnhancer = document.createElement('div');
        timeMachineEnhancer.className = 'time-machine-enhancer';
        timeMachineEnhancer.innerHTML = `
            <div class="time-enhancer-controls">
                <button class="enhancer-btn" id="timeCompactBtn" title="Compact Mode">
                    <i class="fas fa-compress"></i>
                </button>
                <button class="enhancer-btn" id="timeFloatBtn" title="Float Time Machine">
                    <i class="fas fa-clock"></i>
                </button>
                <button class="enhancer-btn" id="timeExpandBtn" title="Expand Controls">
                    <i class="fas fa-expand-arrows-alt"></i>
                </button>
            </div>
        `;
        
        const panelHeader = timePanel.querySelector('.panel-header');
        if (panelHeader) {
            panelHeader.appendChild(timeMachineEnhancer);
        }
        
        this.setupTimeMachineEnhancer();
    }

    setupTimeMachineEnhancer() {
        document.getElementById('timeCompactBtn')?.addEventListener('click', () => {
            this.compactTimeMachine();
        });
        
        document.getElementById('timeFloatBtn')?.addEventListener('click', () => {
            this.floatTimeMachine();
        });
        
        document.getElementById('timeExpandBtn')?.addEventListener('click', () => {
            this.expandTimeMachine();
        });
    }

    createFloatingTimeMachine() {
        const timePanel = document.querySelector('.time-panel');
        if (!timePanel) return;
        
        const floatingTime = document.createElement('div');
        floatingTime.className = 'floating-time-machine glass-effect';
        floatingTime.id = 'floatingTimeMachine';
        floatingTime.innerHTML = `
            <div class="floating-header">
                <div class="floating-title">
                    <i class="fas fa-clock"></i>
                    <span>Time Machine</span>
                </div>
                <div class="floating-controls">
                    <button class="floating-btn" id="floatingTimeMinimize">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="floating-btn" id="floatingTimeClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="floating-content">
                <div class="compact-time-controls">
                    <div class="time-display">
                        <span id="floatingCurrentDate">2023-01-01</span>
                        <span id="floatingCurrentTime">00:00:00</span>
                    </div>
                    
                    <div class="playback-row">
                        <button class="compact-btn" id="floatingPlayBtn">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="compact-btn" id="floatingPauseBtn">
                            <i class="fas fa-pause"></i>
                        </button>
                        <div class="speed-display">
                            <span id="floatingSpeedValue">1x</span>
                        </div>
                    </div>
                    
                    <div class="quick-jumps">
                        <button class="jump-btn" data-jump="1h">1H</button>
                        <button class="jump-btn" data-jump="1d">1D</button>
                        <button class="jump-btn" data-jump="1w">1W</button>
                        <button class="jump-btn" data-jump="1m">1M</button>
                    </div>
                </div>
            </div>
        `;
        
        floatingTime.style.position = 'fixed';
        floatingTime.style.bottom = '20px';
        floatingTime.style.right = '20px';
        floatingTime.style.width = '280px';
        floatingTime.style.zIndex = '1015';
        
        document.body.appendChild(floatingTime);
        
        // Hide original time panel
        timePanel.style.display = 'none';
        
        this.setupFloatingTimeMachine();
    }

    setupFloatingTimeMachine() {
        // Make draggable
        this.makeDraggable(document.getElementById('floatingTimeMachine'));
        
        // Connect controls
        document.getElementById('floatingPlayBtn')?.addEventListener('click', () => {
            document.getElementById('playBtn')?.click();
        });
        
        document.getElementById('floatingPauseBtn')?.addEventListener('click', () => {
            document.getElementById('pauseBtn')?.click();
        });
        
        // Quick jumps
        document.querySelectorAll('.jump-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const jump = e.target.dataset.jump;
                this.performQuickJump(jump);
            });
        });
        
        // Close button
        document.getElementById('floatingTimeClose')?.addEventListener('click', () => {
            document.getElementById('floatingTimeMachine').remove();
            document.querySelector('.time-panel').style.display = 'block';
        });
    }

    makeDraggable(element) {
        if (!element) return;
        
        const header = element.querySelector('.floating-header');
        if (!header) return;
        
        let isDragging = false;
        let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.floating-controls')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                
                element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.cursor = 'grab';
        });
    }

    setChartHeight(height) {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.height = height + 'px';
            
            // Trigger chart resize if chart exists
            if (window.tradingChart && window.tradingChart.resize) {
                setTimeout(() => window.tradingChart.resize(), 100);
            }
        }
    }

    setTimePanelWidth(width) {
        const timePanel = document.querySelector('.time-panel');
        if (timePanel) {
            timePanel.style.minWidth = width + 'px';
            timePanel.style.maxWidth = width + 'px';
        }
    }

    maximizeChart() {
        this.setChartHeight(Math.min(700, window.innerHeight * 0.8));
        
        // Minimize other panels
        this.compactifyAllPanels();
        
        // Show notification
        this.showNotification('Chart maximized for better analysis', 'success');
    }

    balanceLayout() {
        // Reset to balanced proportions
        this.setChartHeight(400);
        this.setTimePanelWidth(350);
        
        // Reset panel sizes
        this.resetPanelSizes();
        
        this.showNotification('Layout balanced for optimal workflow', 'info');
    }

    focusMode() {
        // Hide non-essential elements
        const nonEssential = [
            '.activity-panel',
            '.performance-panel .metric-card:nth-child(n+4)'
        ];
        
        nonEssential.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = el.style.display === 'none' ? '' : 'none';
            });
        });
        
        this.maximizeChart();
        this.showNotification('Focus mode activated', 'success');
    }

    compactifyAllPanels() {
        // Compact time panel
        this.compactTimeMachine();
        
        // Compact performance panel
        this.compactifyMetrics();
        
        // Compact activity panel
        this.compactActivityPanel();
    }

    compactTimeMachine() {
        const timePanel = document.querySelector('.time-panel');
        if (timePanel) {
            timePanel.classList.add('compact-mode');
            timePanel.style.minWidth = '250px';
            timePanel.style.maxWidth = '280px';
            
            // Hide non-essential time controls
            const dateControls = timePanel.querySelector('.date-controls');
            if (dateControls) {
                dateControls.style.display = 'none';
            }
        }
    }

    compactifyMetrics() {
        const metricsGrid = document.querySelector('.metrics-grid');
        if (metricsGrid) {
            metricsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            metricsGrid.style.gap = '8px';
            
            // Hide less important metrics
            const metricCards = metricsGrid.querySelectorAll('.metric-card');
            metricCards.forEach((card, index) => {
                if (index >= 4) {
                    card.style.display = 'none';
                }
            });
        }
    }

    compactActivityPanel() {
        const activityPanel = document.querySelector('.activity-panel');
        if (activityPanel) {
            activityPanel.style.minWidth = '200px';
            activityPanel.style.maxWidth = '250px';
        }
    }

    stackActivityPanel() {
        const bottomRow = document.querySelector('.bottom-row');
        if (bottomRow) {
            bottomRow.style.flexDirection = 'column';
            bottomRow.style.gap = '10px';
        }
    }

    resetPanelSizes() {
        // Reset all panels to original sizes
        this.originalSizes.forEach((size, element) => {
            const el = document.querySelector(`.${element}`);
            if (el) {
                Object.assign(el.style, size);
            }
        });
        
        // Remove compact classes
        document.querySelectorAll('.compact-mode').forEach(el => {
            el.classList.remove('compact-mode');
        });
        
        // Show hidden elements
        document.querySelectorAll('[style*="display: none"]').forEach(el => {
            el.style.display = '';
        });
    }

    setupDynamicResize() {
        const resizeObserver = new ResizeObserver((entries) => {
            if (this.currentMode === 'auto') {
                this.autoOptimizeSpace();
            }
        });
        
        resizeObserver.observe(document.body);
        this.observers.set('resize', resizeObserver);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `space-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        notification.style.position = 'fixed';
        notification.style.top = '80px';
        notification.style.left = '20px';
        notification.style.zIndex = '1020';
        notification.style.padding = '12px 16px';
        notification.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)';
        notification.style.border = `1px solid ${type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`;
        notification.style.borderRadius = '8px';
        notification.style.color = '#e2e8f0';
        notification.style.backdropFilter = 'blur(10px)';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Utility methods
    toggleFloatingTimeMachine(enabled) {
        if (enabled) {
            this.createFloatingTimeMachine();
        } else {
            const floating = document.getElementById('floatingTimeMachine');
            if (floating) {
                floating.remove();
                document.querySelector('.time-panel').style.display = 'block';
            }
        }
    }

    toggleCompactPerformance(enabled) {
        if (enabled) {
            this.compactifyMetrics();
        } else {
            this.resetPanelSizes();
        }
    }

    toggleSidebarMode(enabled) {
        document.body.classList.toggle('sidebar-mode', enabled);
    }

    performQuickJump(period) {
        console.log(`Quick jump: ${period}`);
        // This would integrate with the existing time machine
    }

    expandChart() {
        this.setChartHeight(600);
    }

    floatChart() {
        // Create floating chart window
        console.log('Creating floating chart...');
    }

    fullscreenChart() {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            if (chartContainer.requestFullscreen) {
                chartContainer.requestFullscreen();
            }
        }
    }

    expandTimeMachine() {
        const timePanel = document.querySelector('.time-panel');
        if (timePanel) {
            timePanel.classList.remove('compact-mode');
            timePanel.style.minWidth = '400px';
            timePanel.style.maxWidth = '500px';
        }
    }

    floatTimeMachine() {
        this.createFloatingTimeMachine();
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.spaceOptimizer) {
        window.spaceOptimizer = new SpaceOptimizer();
    }
});

// Export for use
window.SpaceOptimizer = SpaceOptimizer; 
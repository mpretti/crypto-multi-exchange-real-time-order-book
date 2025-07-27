/**
 * AI Trading Playground - Advanced Layout Manager
 * Dynamic layout with overlay modes, resizable panels, and smart space utilization
 */

class AdvancedLayoutManager {
    constructor() {
        this.layoutMode = 'standard'; // standard, compact, overlay, fullscreen
        this.panelStates = new Map();
        this.overlayStack = [];
        this.resizableElements = new Map();
        this.chartMode = 'standard'; // standard, mini, overlay, floating
        this.isDragging = false;
        this.currentDragElement = null;
        
        this.init();
    }

    init() {
        this.createLayoutControls();
        this.setupResizablePanels();
        this.optimizeInitialLayout();
        this.setupKeyboardShortcuts();
        this.createFloatingChartSystem();
    }

    createLayoutControls() {
        const layoutControls = document.createElement('div');
        layoutControls.className = 'layout-controls glass-effect';
        layoutControls.id = 'layoutControls';
        layoutControls.innerHTML = `
            <div class="layout-header">
                <i class="fas fa-th-large"></i>
                <span>Layout</span>
            </div>
            <div class="layout-options">
                <button class="layout-btn active" data-mode="standard" title="Standard Layout">
                    <i class="fas fa-th-large"></i>
                </button>
                <button class="layout-btn" data-mode="compact" title="Compact Mode">
                    <i class="fas fa-compress-alt"></i>
                </button>
                <button class="layout-btn" data-mode="overlay" title="Overlay Mode">
                    <i class="fas fa-layer-group"></i>
                </button>
                <button class="layout-btn" data-mode="focus" title="Focus Mode">
                    <i class="fas fa-expand"></i>
                </button>
            </div>
            <div class="chart-options">
                <button class="chart-btn active" data-chart="standard" title="Standard Chart">
                    <i class="fas fa-chart-line"></i>
                </button>
                <button class="chart-btn" data-chart="mini" title="Mini Chart">
                    <i class="fas fa-chart-area"></i>
                </button>
                <button class="chart-btn" data-chart="floating" title="Floating Chart">
                    <i class="fas fa-external-link-alt"></i>
                </button>
                <button class="chart-btn" data-chart="overlay" title="Chart Overlay">
                    <i class="fas fa-clone"></i>
                </button>
            </div>
            <div class="panel-toggles">
                <button class="panel-toggle" data-panel="aiCoach" title="AI Coach">
                    <i class="fas fa-robot"></i>
                </button>
                <button class="panel-toggle" data-panel="voice" title="Voice Control">
                    <i class="fas fa-microphone"></i>
                </button>
                <button class="panel-toggle" data-panel="market" title="Market Sim">
                    <i class="fas fa-globe"></i>
                </button>
                <button class="panel-toggle" data-panel="learning" title="Learning Viz">
                    <i class="fas fa-brain"></i>
                </button>
            </div>
        `;
        
        // Position in top right
        layoutControls.style.position = 'fixed';
        layoutControls.style.top = '20px';
        layoutControls.style.right = '380px'; // Next to existing panels
        layoutControls.style.zIndex = '1005';
        
        document.body.appendChild(layoutControls);
        this.setupLayoutEventListeners();
    }

    setupLayoutEventListeners() {
        // Layout mode buttons
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.setLayoutMode(mode);
                this.updateActiveButton('.layout-btn', e.currentTarget);
            });
        });
        
        // Chart mode buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.chart;
                this.setChartMode(mode);
                this.updateActiveButton('.chart-btn', e.currentTarget);
            });
        });
        
        // Panel toggles
        document.querySelectorAll('.panel-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.currentTarget.dataset.panel;
                this.togglePanel(panel);
                e.currentTarget.classList.toggle('active');
            });
        });
    }

    updateActiveButton(selector, activeBtn) {
        document.querySelectorAll(selector).forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    setLayoutMode(mode) {
        this.layoutMode = mode;
        document.body.className = document.body.className.replace(/layout-\w+/g, '');
        document.body.classList.add(`layout-${mode}`);
        
        switch(mode) {
            case 'standard':
                this.applyStandardLayout();
                break;
            case 'compact':
                this.applyCompactLayout();
                break;
            case 'overlay':
                this.applyOverlayLayout();
                break;
            case 'focus':
                this.applyFocusLayout();
                break;
        }
    }

    applyStandardLayout() {
        // Reset all panels to default positions
        this.resetPanelPositions();
        
        // Optimize chart size
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.height = '400px';
            chartContainer.style.width = '100%';
        }
        
        // Ensure time machine has proper space
        const timePanel = document.querySelector('.time-panel');
        if (timePanel) {
            timePanel.style.minWidth = '300px';
            timePanel.style.flex = '1';
        }
    }

    applyCompactLayout() {
        // Minimize all panels
        this.minimizeAllPanels();
        
        // Make chart smaller
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.height = '250px';
        }
        
        // Compact time controls
        const timePanel = document.querySelector('.time-panel');
        if (timePanel) {
            timePanel.classList.add('compact-mode');
        }
        
        // Stack panels vertically on left
        this.stackPanelsVertically();
    }

    applyOverlayLayout() {
        // Move panels to overlay mode
        this.moveToOverlayMode();
        
        // Maximize chart space
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.height = '500px';
            chartContainer.style.width = '100%';
        }
        
        // Create overlay containers
        this.createOverlayContainers();
    }

    applyFocusLayout() {
        // Hide all panels except essential ones
        this.hideNonEssentialPanels();
        
        // Maximize chart
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.height = '600px';
            chartContainer.style.width = '100%';
        }
        
        // Minimize time controls
        this.createMinimalTimeControls();
    }

    setChartMode(mode) {
        this.chartMode = mode;
        
        switch(mode) {
            case 'standard':
                this.applyStandardChart();
                break;
            case 'mini':
                this.applyMiniChart();
                break;
            case 'floating':
                this.createFloatingChart();
                break;
            case 'overlay':
                this.createChartOverlay();
                break;
        }
    }

    applyStandardChart() {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.position = 'relative';
            chartContainer.style.height = '400px';
            chartContainer.style.width = '100%';
            chartContainer.style.zIndex = 'auto';
        }
        
        this.removeFloatingChart();
    }

    applyMiniChart() {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.style.height = '200px';
            chartContainer.style.width = '50%';
            chartContainer.style.position = 'relative';
        }
        
        // Create mini chart controls
        this.createMiniChartControls();
    }

    createFloatingChart() {
        const floatingChart = document.createElement('div');
        floatingChart.className = 'floating-chart glass-effect';
        floatingChart.id = 'floatingChart';
        floatingChart.innerHTML = `
            <div class="floating-chart-header">
                <div class="chart-title">
                    <i class="fas fa-chart-line"></i>
                    <span>Trading Chart</span>
                </div>
                <div class="chart-controls">
                    <button class="chart-minimize" title="Minimize">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="chart-maximize" title="Maximize">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="chart-close" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="floating-chart-content">
                <canvas id="floatingTradingChart"></canvas>
            </div>
            <div class="floating-chart-resize-handle"></div>
        `;
        
        floatingChart.style.position = 'fixed';
        floatingChart.style.top = '100px';
        floatingChart.style.right = '50px';
        floatingChart.style.width = '500px';
        floatingChart.style.height = '350px';
        floatingChart.style.zIndex = '1010';
        
        document.body.appendChild(floatingChart);
        this.makeFloatingChartDraggable(floatingChart);
        this.makeFloatingChartResizable(floatingChart);
        
        // Clone chart to floating window
        this.cloneChartToFloating();
    }

    createChartOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'chart-overlay-container';
        overlay.id = 'chartOverlayContainer';
        overlay.innerHTML = `
            <div class="overlay-background"></div>
            <div class="overlay-chart glass-effect">
                <div class="overlay-header">
                    <h3>Chart Analysis</h3>
                    <button class="overlay-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="overlay-content">
                    <canvas id="overlayTradingChart"></canvas>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Setup overlay events
        overlay.querySelector('.overlay-close').addEventListener('click', () => {
            overlay.remove();
        });
        
        overlay.querySelector('.overlay-background').addEventListener('click', () => {
            overlay.remove();
        });
        
        // Clone chart to overlay
        this.cloneChartToOverlay();
    }

    createOverlayContainers() {
        // Create overlay dock
        const overlayDock = document.createElement('div');
        overlayDock.className = 'overlay-dock';
        overlayDock.id = 'overlayDock';
        overlayDock.innerHTML = `
            <div class="dock-tabs">
                <div class="dock-tab active" data-panel="coach">
                    <i class="fas fa-robot"></i>
                    <span>Coach</span>
                </div>
                <div class="dock-tab" data-panel="voice">
                    <i class="fas fa-microphone"></i>
                    <span>Voice</span>
                </div>
                <div class="dock-tab" data-panel="market">
                    <i class="fas fa-globe"></i>
                    <span>Market</span>
                </div>
                <div class="dock-tab" data-panel="learning">
                    <i class="fas fa-brain"></i>
                    <span>Learning</span>
                </div>
            </div>
            <div class="dock-content">
                <div class="dock-panel active" id="dockCoach"></div>
                <div class="dock-panel" id="dockVoice"></div>
                <div class="dock-panel" id="dockMarket"></div>
                <div class="dock-panel" id="dockLearning"></div>
            </div>
        `;
        
        overlayDock.style.position = 'fixed';
        overlayDock.style.bottom = '0';
        overlayDock.style.left = '0';
        overlayDock.style.right = '0';
        overlayDock.style.height = '200px';
        overlayDock.style.zIndex = '1008';
        
        document.body.appendChild(overlayDock);
        this.setupOverlayDock();
    }

    setupOverlayDock() {
        const tabs = document.querySelectorAll('.dock-tab');
        const panels = document.querySelectorAll('.dock-panel');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                
                tab.classList.add('active');
                const panelId = 'dock' + tab.dataset.panel.charAt(0).toUpperCase() + tab.dataset.panel.slice(1);
                document.getElementById(panelId).classList.add('active');
            });
        });
        
        // Move panel contents to dock
        this.movePanelsToDock();
    }

    movePanelsToDock() {
        const panelMappings = {
            'aiCoachPanel': 'dockCoach',
            'voiceControlPanel': 'dockVoice',
            'marketSimulatorPanel': 'dockMarket',
            'learningVizPanel': 'dockLearning'
        };
        
        Object.entries(panelMappings).forEach(([sourceId, targetId]) => {
            const sourcePanel = document.getElementById(sourceId);
            const targetPanel = document.getElementById(targetId);
            
            if (sourcePanel && targetPanel) {
                const content = sourcePanel.querySelector('.panel-content, .coach-content, .voice-content, .market-content, .learning-viz-content');
                if (content) {
                    targetPanel.appendChild(content.cloneNode(true));
                }
                sourcePanel.style.display = 'none';
            }
        });
    }

    createMinimalTimeControls() {
        const timePanel = document.querySelector('.time-panel');
        if (!timePanel) return;
        
        // Create minimal floating time controls
        const minimalControls = document.createElement('div');
        minimalControls.className = 'minimal-time-controls glass-effect';
        minimalControls.innerHTML = `
            <div class="minimal-playback">
                <button class="minimal-btn" id="minimalPlayBtn">
                    <i class="fas fa-play"></i>
                </button>
                <button class="minimal-btn" id="minimalPauseBtn">
                    <i class="fas fa-pause"></i>
                </button>
                <div class="minimal-speed">
                    <span id="minimalSpeedValue">10x</span>
                </div>
            </div>
            <div class="minimal-date">
                <span id="minimalCurrentDate">2023-01-01</span>
            </div>
        `;
        
        minimalControls.style.position = 'fixed';
        minimalControls.style.bottom = '20px';
        minimalControls.style.left = '50%';
        minimalControls.style.transform = 'translateX(-50%)';
        minimalControls.style.zIndex = '1009';
        
        document.body.appendChild(minimalControls);
        
        // Hide original time panel
        timePanel.style.display = 'none';
        
        // Connect minimal controls to original functionality
        this.connectMinimalControls();
    }

    connectMinimalControls() {
        document.getElementById('minimalPlayBtn')?.addEventListener('click', () => {
            document.getElementById('playBtn')?.click();
        });
        
        document.getElementById('minimalPauseBtn')?.addEventListener('click', () => {
            document.getElementById('pauseBtn')?.click();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.setLayoutMode('standard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.setLayoutMode('compact');
                        break;
                    case '3':
                        e.preventDefault();
                        this.setLayoutMode('overlay');
                        break;
                    case '4':
                        e.preventDefault();
                        this.setLayoutMode('focus');
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFullscreen();
                        break;
                }
            }
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    togglePanel(panelName) {
        const panelMappings = {
            'aiCoach': 'aiCoachPanel',
            'voice': 'voiceControlPanel',
            'market': 'marketSimulatorPanel',
            'learning': 'learningVizPanel'
        };
        
        const panelId = panelMappings[panelName];
        const panel = document.getElementById(panelId);
        
        if (panel) {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
            
            // Update panel state
            this.panelStates.set(panelName, !isVisible);
        }
    }

    makeFloatingChartDraggable(element) {
        const header = element.querySelector('.floating-chart-header');
        let isDragging = false;
        let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.chart-controls')) return;
            
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

    makeFloatingChartResizable(element) {
        const resizeHandle = element.querySelector('.floating-chart-resize-handle');
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isResizing) {
                const width = startWidth + e.clientX - startX;
                const height = startHeight + e.clientY - startY;
                
                element.style.width = Math.max(300, width) + 'px';
                element.style.height = Math.max(200, height) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    optimizeInitialLayout() {
        // Optimize chart container
        const chartSection = document.querySelector('.chart-section');
        if (chartSection) {
            chartSection.style.flex = '1';
            chartSection.style.minHeight = '300px';
        }
        
        // Optimize time machine
        const timePanel = document.querySelector('.time-panel');
        if (timePanel) {
            timePanel.style.minWidth = '280px';
            timePanel.style.maxWidth = '400px';
        }
        
        // Optimize performance panel
        const performancePanel = document.querySelector('.performance-panel');
        if (performancePanel) {
            performancePanel.style.minWidth = '250px';
        }
        
        // Make bottom row more flexible
        const bottomRow = document.querySelector('.bottom-row');
        if (bottomRow) {
            bottomRow.style.gap = '15px';
            bottomRow.style.flexWrap = 'wrap';
        }
    }

    minimizeAllPanels() {
        const panels = ['aiCoachPanel', 'voiceControlPanel', 'marketSimulatorPanel', 'learningVizPanel'];
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.classList.add('minimized');
            }
        });
    }

    resetPanelPositions() {
        const panels = ['aiCoachPanel', 'voiceControlPanel', 'marketSimulatorPanel', 'learningVizPanel'];
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.classList.remove('minimized');
                panel.style.display = 'block';
                panel.style.transform = '';
            }
        });
        
        // Remove overlay dock if exists
        const overlayDock = document.getElementById('overlayDock');
        if (overlayDock) {
            overlayDock.remove();
        }
        
        // Remove minimal controls if exists
        const minimalControls = document.querySelector('.minimal-time-controls');
        if (minimalControls) {
            minimalControls.remove();
        }
        
        // Show original time panel
        const timePanel = document.querySelector('.time-panel');
        if (timePanel) {
            timePanel.style.display = 'block';
            timePanel.classList.remove('compact-mode');
        }
    }

    createFloatingChartSystem() {
        // Add floating chart controls to existing chart
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            const floatBtn = document.createElement('button');
            floatBtn.className = 'chart-float-btn';
            floatBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
            floatBtn.title = 'Float Chart';
            floatBtn.addEventListener('click', () => this.createFloatingChart());
            
            chartContainer.style.position = 'relative';
            chartContainer.appendChild(floatBtn);
        }
    }

    cloneChartToFloating() {
        const originalChart = document.getElementById('tradingChart');
        const floatingCanvas = document.getElementById('floatingTradingChart');
        
        if (originalChart && floatingCanvas) {
            // Copy chart data and configuration
            // This would integrate with the existing chart system
            console.log('Cloning chart to floating window');
        }
    }

    removeFloatingChart() {
        const floatingChart = document.getElementById('floatingChart');
        if (floatingChart) {
            floatingChart.remove();
        }
    }

    moveToOverlayMode() {
        // Hide original panels
        const panels = ['aiCoachPanel', 'voiceControlPanel', 'marketSimulatorPanel', 'learningVizPanel'];
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
            }
        });
    }

    hideNonEssentialPanels() {
        const panels = ['aiCoachPanel', 'voiceControlPanel', 'marketSimulatorPanel', 'learningVizPanel'];
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
            }
        });
    }

    stackPanelsVertically() {
        const panels = ['aiCoachPanel', 'voiceControlPanel', 'marketSimulatorPanel'];
        let topOffset = 20;
        
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.position = 'fixed';
                panel.style.left = '10px';
                panel.style.top = topOffset + 'px';
                panel.style.width = '250px';
                panel.style.height = '150px';
                topOffset += 160;
            }
        });
    }
}

// Export for use in main playground
window.AdvancedLayoutManager = AdvancedLayoutManager; 
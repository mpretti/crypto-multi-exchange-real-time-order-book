/**
 * AI Trading Playground - Advanced Responsive Grid System
 * Intelligent space optimization and dynamic layout management
 */

class ResponsiveGridManager {
    constructor() {
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1440,
            ultrawide: 1920
        };
        
        this.currentBreakpoint = this.getCurrentBreakpoint();
        this.gridConfig = this.getGridConfig();
        this.resizeObserver = null;
        
        this.init();
    }

    init() {
        this.createResponsiveGrid();
        this.optimizeChartSpace();
        this.enhanceTimeMachine();
        this.setupResizeObserver();
        this.createDynamicSidebar();
        this.setupGridToggle();
    }

    getCurrentBreakpoint() {
        const width = window.innerWidth;
        if (width <= this.breakpoints.mobile) return 'mobile';
        if (width <= this.breakpoints.tablet) return 'tablet';
        if (width <= this.breakpoints.desktop) return 'desktop';
        return 'ultrawide';
    }

    getGridConfig() {
        const configs = {
            mobile: {
                columns: 1,
                chartHeight: '300px',
                timeMachinePosition: 'bottom',
                panelLayout: 'stack',
                sidebarWidth: '100%'
            },
            tablet: {
                columns: 2,
                chartHeight: '350px',
                timeMachinePosition: 'bottom',
                panelLayout: 'grid',
                sidebarWidth: '300px'
            },
            desktop: {
                columns: 3,
                chartHeight: '450px',
                timeMachinePosition: 'side',
                panelLayout: 'flex',
                sidebarWidth: '350px'
            },
            ultrawide: {
                columns: 4,
                chartHeight: '500px',
                timeMachinePosition: 'side',
                panelLayout: 'flex',
                sidebarWidth: '400px'
            }
        };
        
        return configs[this.currentBreakpoint];
    }

    createResponsiveGrid() {
        // Create main grid container
        const gridContainer = document.createElement('div');
        gridContainer.className = 'responsive-grid-container';
        gridContainer.id = 'responsiveGridContainer';
        
        // Create grid areas
        const gridAreas = this.createGridAreas();
        gridContainer.appendChild(gridAreas);
        
        // Apply grid styles
        this.applyGridStyles(gridContainer);
        
        // Replace existing dashboard container
        const existingDashboard = document.querySelector('.dashboard-container');
        if (existingDashboard && existingDashboard.parentNode) {
            existingDashboard.parentNode.insertBefore(gridContainer, existingDashboard);
            this.moveContentToGrid(existingDashboard, gridContainer);
            existingDashboard.style.display = 'none';
        }
    }

    createGridAreas() {
        const gridAreas = document.createElement('div');
        gridAreas.className = 'grid-areas';
        
        gridAreas.innerHTML = `
            <div class="grid-area chart-area" data-area="chart">
                <div class="area-header">
                    <div class="area-title">
                        <i class="fas fa-chart-line"></i>
                        <span>Trading Chart</span>
                    </div>
                    <div class="area-controls">
                        <button class="area-btn" id="chartFullscreen" title="Fullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="area-btn" id="chartFloat" title="Float">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="area-btn" id="chartMinimize" title="Minimize">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                </div>
                <div class="area-content" id="chartAreaContent"></div>
            </div>
            
            <div class="grid-area time-area" data-area="time">
                <div class="area-header">
                    <div class="area-title">
                        <i class="fas fa-clock"></i>
                        <span>Time Machine</span>
                    </div>
                    <div class="area-controls">
                        <button class="area-btn" id="timeExpand" title="Expand">
                            <i class="fas fa-expand-arrows-alt"></i>
                        </button>
                        <button class="area-btn" id="timeCompact" title="Compact">
                            <i class="fas fa-compress-arrows-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="area-content enhanced-time-machine" id="timeAreaContent"></div>
            </div>
            
            <div class="grid-area performance-area" data-area="performance">
                <div class="area-header">
                    <div class="area-title">
                        <i class="fas fa-chart-bar"></i>
                        <span>Performance</span>
                    </div>
                    <div class="area-controls">
                        <button class="area-btn" id="perfDetails" title="Details">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
                <div class="area-content" id="performanceAreaContent"></div>
            </div>
            
            <div class="grid-area activity-area" data-area="activity">
                <div class="area-header">
                    <div class="area-title">
                        <i class="fas fa-list"></i>
                        <span>Activity</span>
                    </div>
                    <div class="area-controls">
                        <button class="area-btn" id="activityFilter" title="Filter">
                            <i class="fas fa-filter"></i>
                        </button>
                    </div>
                </div>
                <div class="area-content" id="activityAreaContent"></div>
            </div>
            
            <div class="grid-area agents-area" data-area="agents">
                <div class="area-header">
                    <div class="area-title">
                        <i class="fas fa-robot"></i>
                        <span>AI Agents</span>
                    </div>
                    <div class="area-controls">
                        <button class="area-btn" id="agentsConfig" title="Configure">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
                <div class="area-content" id="agentsAreaContent"></div>
            </div>
        `;
        
        return gridAreas;
    }

    applyGridStyles(container) {
        const config = this.gridConfig;
        
        container.style.display = 'grid';
        container.style.height = '100vh';
        container.style.padding = '10px';
        container.style.gap = '15px';
        container.style.overflow = 'hidden';
        
        // Dynamic grid template based on breakpoint
        switch(this.currentBreakpoint) {
            case 'mobile':
                container.style.gridTemplateColumns = '1fr';
                container.style.gridTemplateRows = '300px 250px 200px 200px 150px';
                container.style.gridTemplateAreas = `
                    "chart"
                    "time"
                    "performance"
                    "activity"
                    "agents"
                `;
                break;
                
            case 'tablet':
                container.style.gridTemplateColumns = '1fr 1fr';
                container.style.gridTemplateRows = '350px 250px 200px';
                container.style.gridTemplateAreas = `
                    "chart chart"
                    "time performance"
                    "activity agents"
                `;
                break;
                
            case 'desktop':
                container.style.gridTemplateColumns = '2fr 1fr 1fr';
                container.style.gridTemplateRows = '450px 250px';
                container.style.gridTemplateAreas = `
                    "chart time performance"
                    "chart activity agents"
                `;
                break;
                
            case 'ultrawide':
                container.style.gridTemplateColumns = '3fr 1fr 1fr 1fr';
                container.style.gridTemplateRows = '500px 200px';
                container.style.gridTemplateAreas = `
                    "chart time performance agents"
                    "chart activity activity activity"
                `;
                break;
        }
        
        // Apply grid area assignments
        const areas = container.querySelectorAll('.grid-area');
        areas.forEach(area => {
            const areaName = area.dataset.area;
            area.style.gridArea = areaName;
        });
    }

    optimizeChartSpace() {
        const chartArea = document.querySelector('.chart-area');
        if (!chartArea) return;
        
        // Make chart area more prominent
        chartArea.style.position = 'relative';
        chartArea.style.overflow = 'hidden';
        
        // Add chart optimization controls
        const chartControls = document.createElement('div');
        chartControls.className = 'chart-optimization-controls';
        chartControls.innerHTML = `
            <div class="chart-size-controls">
                <button class="size-btn active" data-size="normal">Normal</button>
                <button class="size-btn" data-size="large">Large</button>
                <button class="size-btn" data-size="max">Max</button>
            </div>
            <div class="chart-view-controls">
                <button class="view-btn active" data-view="standard">Standard</button>
                <button class="view-btn" data-view="focus">Focus</button>
                <button class="view-btn" data-view="overlay">Overlay</button>
            </div>
        `;
        
        chartArea.appendChild(chartControls);
        this.setupChartOptimization();
    }

    enhanceTimeMachine() {
        const timeArea = document.querySelector('.time-area');
        if (!timeArea) return;
        
        // Create enhanced time machine interface
        const enhancedTimeMachine = document.createElement('div');
        enhancedTimeMachine.className = 'enhanced-time-machine-interface';
        enhancedTimeMachine.innerHTML = `
            <div class="time-machine-header">
                <div class="current-datetime">
                    <div class="date-display" id="enhancedDateDisplay">2023-01-01</div>
                    <div class="time-display" id="enhancedTimeDisplay">00:00:00</div>
                </div>
                <div class="speed-indicator">
                    <span class="speed-label">Speed:</span>
                    <span class="speed-value" id="enhancedSpeedValue">1x</span>
                </div>
            </div>
            
            <div class="time-machine-timeline">
                <div class="timeline-track">
                    <div class="timeline-progress" id="timelineProgress"></div>
                    <div class="timeline-handle" id="timelineHandle"></div>
                </div>
                <div class="timeline-markers" id="timelineMarkers"></div>
            </div>
            
            <div class="time-machine-controls">
                <div class="playback-controls">
                    <button class="control-btn" id="enhancedRewindBtn">
                        <i class="fas fa-fast-backward"></i>
                    </button>
                    <button class="control-btn primary" id="enhancedPlayBtn">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="control-btn" id="enhancedPauseBtn" style="display: none;">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="control-btn" id="enhancedForwardBtn">
                        <i class="fas fa-fast-forward"></i>
                    </button>
                </div>
                
                <div class="speed-controls">
                    <button class="speed-btn" data-speed="0.5">0.5x</button>
                    <button class="speed-btn active" data-speed="1">1x</button>
                    <button class="speed-btn" data-speed="2">2x</button>
                    <button class="speed-btn" data-speed="5">5x</button>
                    <button class="speed-btn" data-speed="10">10x</button>
                    <button class="speed-btn" data-speed="50">50x</button>
                </div>
            </div>
            
            <div class="time-machine-presets">
                <div class="preset-group">
                    <span class="preset-label">Quick Jump:</span>
                    <button class="preset-btn" data-period="1h">1H</button>
                    <button class="preset-btn" data-period="1d">1D</button>
                    <button class="preset-btn" data-period="1w">1W</button>
                    <button class="preset-btn" data-period="1m">1M</button>
                </div>
            </div>
            
            <div class="time-machine-events">
                <div class="events-header">
                    <span>Market Events</span>
                    <button class="events-toggle" id="eventsToggle">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <div class="events-list" id="eventsList">
                    <div class="event-item">
                        <div class="event-time">09:30</div>
                        <div class="event-desc">Market Open</div>
                    </div>
                    <div class="event-item">
                        <div class="event-time">16:00</div>
                        <div class="event-desc">Market Close</div>
                    </div>
                </div>
            </div>
        `;
        
        const timeAreaContent = timeArea.querySelector('.area-content');
        if (timeAreaContent) {
            timeAreaContent.appendChild(enhancedTimeMachine);
        }
        
        this.setupEnhancedTimeMachine();
    }

    setupChartOptimization() {
        // Chart size controls
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const size = e.target.dataset.size;
                this.adjustChartSize(size);
            });
        });
        
        // Chart view controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const view = e.target.dataset.view;
                this.adjustChartView(view);
            });
        });
    }

    adjustChartSize(size) {
        const chartArea = document.querySelector('.chart-area');
        if (!chartArea) return;
        
        chartArea.classList.remove('size-normal', 'size-large', 'size-max');
        chartArea.classList.add(`size-${size}`);
        
        // Trigger chart resize
        if (window.tradingChart && window.tradingChart.resize) {
            setTimeout(() => window.tradingChart.resize(), 100);
        }
    }

    adjustChartView(view) {
        const gridContainer = document.querySelector('.responsive-grid-container');
        if (!gridContainer) return;
        
        gridContainer.classList.remove('view-standard', 'view-focus', 'view-overlay');
        gridContainer.classList.add(`view-${view}`);
        
        if (view === 'focus') {
            this.enterChartFocusMode();
        } else if (view === 'overlay') {
            this.createChartOverlay();
        } else {
            this.exitSpecialModes();
        }
    }

    setupEnhancedTimeMachine() {
        // Timeline interaction
        const timelineTrack = document.getElementById('timelineProgress');
        const timelineHandle = document.getElementById('timelineHandle');
        
        if (timelineTrack && timelineHandle) {
            this.setupTimelineInteraction(timelineTrack, timelineHandle);
        }
        
        // Speed controls
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const speed = e.target.dataset.speed;
                this.setPlaybackSpeed(speed);
            });
        });
        
        // Preset controls
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.jumpToPeriod(period);
            });
        });
        
        // Playback controls
        this.setupPlaybackControls();
    }

    setupTimelineInteraction(track, handle) {
        let isDragging = false;
        
        const updatePosition = (e) => {
            const rect = track.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;
            
            handle.style.left = percentage + '%';
            track.style.width = percentage + '%';
            
            // Update time display
            this.updateTimeFromPercentage(percentage);
        };
        
        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updatePosition(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        track.parentElement.addEventListener('click', (e) => {
            if (!isDragging) {
                updatePosition(e);
            }
        });
    }

    setupPlaybackControls() {
        const playBtn = document.getElementById('enhancedPlayBtn');
        const pauseBtn = document.getElementById('enhancedPauseBtn');
        const rewindBtn = document.getElementById('enhancedRewindBtn');
        const forwardBtn = document.getElementById('enhancedForwardBtn');
        
        playBtn?.addEventListener('click', () => this.startPlayback());
        pauseBtn?.addEventListener('click', () => this.pausePlayback());
        rewindBtn?.addEventListener('click', () => this.rewind());
        forwardBtn?.addEventListener('click', () => this.fastForward());
    }

    createDynamicSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'dynamic-sidebar';
        sidebar.id = 'dynamicSidebar';
        sidebar.innerHTML = `
            <div class="sidebar-toggle" id="sidebarToggle">
                <i class="fas fa-chevron-left"></i>
            </div>
            <div class="sidebar-content">
                <div class="sidebar-section">
                    <h4>Quick Actions</h4>
                    <div class="quick-actions">
                        <button class="quick-btn" data-action="resetLayout">
                            <i class="fas fa-refresh"></i>
                            <span>Reset Layout</span>
                        </button>
                        <button class="quick-btn" data-action="saveLayout">
                            <i class="fas fa-save"></i>
                            <span>Save Layout</span>
                        </button>
                        <button class="quick-btn" data-action="loadLayout">
                            <i class="fas fa-folder-open"></i>
                            <span>Load Layout</span>
                        </button>
                    </div>
                </div>
                
                <div class="sidebar-section">
                    <h4>Display Options</h4>
                    <div class="display-options">
                        <label class="option-item">
                            <input type="checkbox" id="showGridLines" checked>
                            <span>Grid Lines</span>
                        </label>
                        <label class="option-item">
                            <input type="checkbox" id="showAreaHeaders" checked>
                            <span>Area Headers</span>
                        </label>
                        <label class="option-item">
                            <input type="checkbox" id="autoResize" checked>
                            <span>Auto Resize</span>
                        </label>
                    </div>
                </div>
                
                <div class="sidebar-section">
                    <h4>Themes</h4>
                    <div class="theme-options">
                        <button class="theme-btn active" data-theme="dark">Dark</button>
                        <button class="theme-btn" data-theme="light">Light</button>
                        <button class="theme-btn" data-theme="blue">Blue</button>
                        <button class="theme-btn" data-theme="purple">Purple</button>
                    </div>
                </div>
            </div>
        `;
        
        sidebar.style.position = 'fixed';
        sidebar.style.right = '0';
        sidebar.style.top = '50%';
        sidebar.style.transform = 'translateY(-50%)';
        sidebar.style.zIndex = '1006';
        
        document.body.appendChild(sidebar);
        this.setupSidebar();
    }

    setupSidebar() {
        const sidebar = document.getElementById('dynamicSidebar');
        const toggle = document.getElementById('sidebarToggle');
        
        toggle?.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const icon = toggle.querySelector('i');
            icon.className = sidebar.classList.contains('collapsed') ? 
                'fas fa-chevron-right' : 'fas fa-chevron-left';
        });
        
        // Quick actions
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Theme options
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const theme = e.target.dataset.theme;
                this.applyTheme(theme);
            });
        });
    }

    setupGridToggle() {
        // Add grid toggle to layout controls
        const layoutControls = document.getElementById('layoutControls');
        if (layoutControls) {
            const gridToggle = document.createElement('div');
            gridToggle.className = 'grid-toggle-section';
            gridToggle.innerHTML = `
                <div class="toggle-header">Grid Mode</div>
                <button class="grid-toggle-btn active" id="gridModeToggle">
                    <i class="fas fa-th"></i>
                </button>
            `;
            
            layoutControls.appendChild(gridToggle);
            
            document.getElementById('gridModeToggle')?.addEventListener('click', () => {
                this.toggleGridMode();
            });
        }
    }

    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver((entries) => {
            const newBreakpoint = this.getCurrentBreakpoint();
            if (newBreakpoint !== this.currentBreakpoint) {
                this.currentBreakpoint = newBreakpoint;
                this.gridConfig = this.getGridConfig();
                this.updateGridLayout();
            }
        });
        
        this.resizeObserver.observe(document.body);
    }

    updateGridLayout() {
        const container = document.querySelector('.responsive-grid-container');
        if (container) {
            this.applyGridStyles(container);
        }
    }

    moveContentToGrid(oldContainer, newContainer) {
        // Move chart content
        const chartContainer = oldContainer.querySelector('.chart-container');
        const chartAreaContent = newContainer.querySelector('#chartAreaContent');
        if (chartContainer && chartAreaContent) {
            chartAreaContent.appendChild(chartContainer);
        }
        
        // Move time panel content
        const timePanel = oldContainer.querySelector('.time-panel');
        const timeAreaContent = newContainer.querySelector('#timeAreaContent');
        if (timePanel && timeAreaContent) {
            const timePanelContent = timePanel.querySelector('.panel-content');
            if (timePanelContent) {
                timeAreaContent.appendChild(timePanelContent);
            }
        }
        
        // Move performance content
        const performancePanel = oldContainer.querySelector('.performance-panel');
        const performanceAreaContent = newContainer.querySelector('#performanceAreaContent');
        if (performancePanel && performanceAreaContent) {
            const performancePanelContent = performancePanel.querySelector('.panel-content');
            if (performancePanelContent) {
                performanceAreaContent.appendChild(performancePanelContent);
            }
        }
        
        // Move activity content
        const activityPanel = oldContainer.querySelector('.activity-panel');
        const activityAreaContent = newContainer.querySelector('#activityAreaContent');
        if (activityPanel && activityAreaContent) {
            const activityPanelContent = activityPanel.querySelector('.panel-content');
            if (activityPanelContent) {
                activityAreaContent.appendChild(activityPanelContent);
            }
        }
        
        // Move agents content
        const agentsPanel = oldContainer.querySelector('.agents-panel');
        const agentsAreaContent = newContainer.querySelector('#agentsAreaContent');
        if (agentsPanel && agentsAreaContent) {
            const agentsPanelContent = agentsPanel.querySelector('.panel-content');
            if (agentsPanelContent) {
                agentsAreaContent.appendChild(agentsPanelContent);
            }
        }
    }

    // Utility methods
    startPlayback() {
        document.getElementById('enhancedPlayBtn').style.display = 'none';
        document.getElementById('enhancedPauseBtn').style.display = 'block';
        // Connect to existing playback system
        document.getElementById('playBtn')?.click();
    }

    pausePlayback() {
        document.getElementById('enhancedPauseBtn').style.display = 'none';
        document.getElementById('enhancedPlayBtn').style.display = 'block';
        // Connect to existing playback system
        document.getElementById('pauseBtn')?.click();
    }

    setPlaybackSpeed(speed) {
        document.getElementById('enhancedSpeedValue').textContent = speed + 'x';
        // Connect to existing speed system
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.value = speed;
            speedSlider.dispatchEvent(new Event('input'));
        }
    }

    updateTimeFromPercentage(percentage) {
        // Calculate time based on percentage
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-12-31');
        const timeDiff = endDate.getTime() - startDate.getTime();
        const currentTime = new Date(startDate.getTime() + (timeDiff * percentage / 100));
        
        document.getElementById('enhancedDateDisplay').textContent = 
            currentTime.toLocaleDateString();
        document.getElementById('enhancedTimeDisplay').textContent = 
            currentTime.toLocaleTimeString();
    }

    jumpToPeriod(period) {
        // Quick jump functionality
        console.log(`Jumping to ${period}`);
    }

    rewind() {
        console.log('Rewinding...');
    }

    fastForward() {
        console.log('Fast forwarding...');
    }

    toggleGridMode() {
        const container = document.querySelector('.responsive-grid-container');
        const oldContainer = document.querySelector('.dashboard-container');
        
        if (container.style.display === 'none') {
            container.style.display = 'grid';
            oldContainer.style.display = 'none';
        } else {
            container.style.display = 'none';
            oldContainer.style.display = 'flex';
        }
    }

    handleQuickAction(action) {
        switch(action) {
            case 'resetLayout':
                this.resetLayout();
                break;
            case 'saveLayout':
                this.saveLayout();
                break;
            case 'loadLayout':
                this.loadLayout();
                break;
        }
    }

    resetLayout() {
        this.updateGridLayout();
        console.log('Layout reset');
    }

    saveLayout() {
        const layout = {
            breakpoint: this.currentBreakpoint,
            config: this.gridConfig,
            timestamp: Date.now()
        };
        localStorage.setItem('tradingPlaygroundLayout', JSON.stringify(layout));
        console.log('Layout saved');
    }

    loadLayout() {
        const saved = localStorage.getItem('tradingPlaygroundLayout');
        if (saved) {
            const layout = JSON.parse(saved);
            this.gridConfig = layout.config;
            this.updateGridLayout();
            console.log('Layout loaded');
        }
    }

    applyTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
    }

    enterChartFocusMode() {
        const chartArea = document.querySelector('.chart-area');
        if (chartArea) {
            chartArea.style.gridColumn = '1 / -1';
            chartArea.style.gridRow = '1 / -1';
            chartArea.style.zIndex = '100';
        }
    }

    exitSpecialModes() {
        const chartArea = document.querySelector('.chart-area');
        if (chartArea) {
            chartArea.style.gridColumn = '';
            chartArea.style.gridRow = '';
            chartArea.style.zIndex = '';
        }
    }
}

// Export for use in main playground
window.ResponsiveGridManager = ResponsiveGridManager; 
// Enhanced Volume Dashboard with Real-Time Data Integration
class VolumeAnalyticsDashboard {
    constructor() {
        this.volumeChart = null;
        this.comparisonChart = null;
        this.buyPressureChart = null;
        this.sellPressureChart = null;
        this.autoRefreshEnabled = true;
        this.currentSymbol = 'BTCUSDT';
        this.volumeData = [];
        this.exchangeData = {};
        this.whaleThreshold = 100;
        this.realTimeConnected = false;
        this.whaleAlerts = [];
        this.alerts = [];
        this.heatmapData = {};
        this.timeRange = '5m';
        this.analysisMode = 'realtime';
        
        // Real-time data storage
        this.realtimeVolumes = new Map();
        this.realtimeExchangeData = new Map();
        
        // WebSocket connections
        this.websockets = new Map();
        
        // Initialize after a short delay to ensure DOM is ready
        setTimeout(() => this.init(), 500);
    }

    async init() {
        console.log('🚀 Initializing Volume Analytics Dashboard...');
        
        try {
            // Wait for Chart.js to be available
            await this.waitForChartJS();
            
            // Initialize all components
            this.initializeCharts();
            this.setupEventListeners();
            this.initializeDataDisplays();
            this.startRealTimeSimulation();
            
            console.log('✅ Volume Analytics Dashboard initialized successfully');
            this.showNotification('Volume Dashboard Ready!', 'success');
            
        } catch (error) {
            console.error('❌ Failed to initialize dashboard:', error);
            this.showNotification('Failed to initialize dashboard: ' + error.message, 'error');
        }
    }

    async waitForChartJS() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        return new Promise((resolve, reject) => {
            const checkChart = () => {
                attempts++;
                
                // Check for Chart.js in various ways it might be loaded
                const chartAvailable = (
                    (typeof Chart !== 'undefined') ||
                    (typeof window.Chart !== 'undefined') ||
                    (window.Chart && typeof window.Chart === 'function')
                );
                
                if (chartAvailable) {
                    console.log('📈 Chart.js detected and ready');
                    // Ensure we're using the global Chart
                    if (typeof Chart === 'undefined' && window.Chart) {
                        window.Chart = window.Chart;
                    }
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('❌ Chart.js failed to load after maximum attempts');
                    reject(new Error('Chart.js not available after timeout'));
                } else {
                    console.log(`⏳ Waiting for Chart.js... (attempt ${attempts}/${maxAttempts})`);
                    setTimeout(checkChart, 100);
                }
            };
            checkChart();
        });
    }

    initializeCharts() {
        console.log('📊 Initializing charts...');
        
        // Get Chart constructor
        const ChartConstructor = window.Chart || Chart;
        
        if (!ChartConstructor) {
            throw new Error('Chart.js not available');
        }

        try {
            // Volume Chart
            this.initVolumeChart(ChartConstructor);
            
            // Comparison Chart
            this.initComparisonChart(ChartConstructor);
            
            // Pressure Charts
            this.initPressureCharts(ChartConstructor);
            
        } catch (error) {
            console.error('❌ Error initializing charts:', error);
            throw error;
        }
    }

    initVolumeChart(ChartConstructor) {
        const volumeCtx = document.getElementById('volumeChart');
        if (!volumeCtx) {
            console.warn('⚠️ Volume chart canvas not found');
            return;
        }

        console.log('📈 Creating volume chart...');
        
        this.volumeChart = new ChartConstructor(volumeCtx, {
            type: 'line',
            data: {
                labels: this.generateTimeLabels(),
                datasets: [{
                    label: 'Volume (BTC)',
                    data: this.generateVolumeData(),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#F9FAFB',
                        bodyColor: '#F9FAFB',
                        borderColor: '#374151',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(75, 85, 99, 0.3)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#9CA3AF',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(75, 85, 99, 0.3)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#9CA3AF',
                            callback: function(value) {
                                return value.toFixed(0) + ' BTC';
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#3B82F6'
                    }
                }
            }
        });
        
        console.log('✅ Volume chart created successfully');
    }

    initComparisonChart(ChartConstructor) {
        const comparisonCtx = document.getElementById('comparisonChart');
        if (!comparisonCtx) {
            console.warn('⚠️ Comparison chart canvas not found');
            return;
        }

        console.log('📊 Creating comparison chart...');

        this.comparisonChart = new ChartConstructor(comparisonCtx, {
            type: 'bar',
            data: {
                labels: ['Binance', 'Bybit', 'OKX', 'Coinbase', 'Kraken'],
                datasets: [{
                    label: 'Volume Share (%)',
                    data: [42.3, 28.7, 15.2, 8.9, 4.9],
                    backgroundColor: [
                        '#F59E0B',
                        '#10B981',
                        '#3B82F6',
                        '#8B5CF6',
                        '#EF4444'
                    ],
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#F9FAFB',
                        bodyColor: '#F9FAFB',
                        borderColor: '#374151',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#9CA3AF'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(75, 85, 99, 0.3)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#9CA3AF',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Comparison chart created successfully');
    }

    initPressureCharts(ChartConstructor) {
        // Buy Pressure Chart
        const buyPressureCtx = document.getElementById('buyPressureChart');
        if (buyPressureCtx) {
            console.log('💚 Creating buy pressure chart...');
            
            this.buyPressureChart = new ChartConstructor(buyPressureCtx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [65, 35],
                        backgroundColor: ['#10B981', '#374151'],
                        borderWidth: 0,
                        cutout: '70%'
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        }
                    }
                }
            });
            
            console.log('✅ Buy pressure chart created');
        }

        // Sell Pressure Chart
        const sellPressureCtx = document.getElementById('sellPressureChart');
        if (sellPressureCtx) {
            console.log('🔴 Creating sell pressure chart...');
            
            this.sellPressureChart = new ChartConstructor(sellPressureCtx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [35, 65],
                        backgroundColor: ['#EF4444', '#374151'],
                        borderWidth: 0,
                        cutout: '70%'
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        }
                    }
                }
            });
            
            console.log('✅ Sell pressure chart created');
        }
    }

    generateTimeLabels() {
        const labels = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            labels.push(time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        }
        return labels;
    }

    generateVolumeData() {
        const data = [];
        const baseTime = Date.now();
        
        for (let i = 0; i < 24; i++) {
            // Generate more realistic volume data with daily patterns
            const hourOfDay = (new Date(baseTime - (23 - i) * 60 * 60 * 1000)).getHours();
            
            // Higher volume during trading hours (8-20 UTC)
            let baseVolume = 800;
            if (hourOfDay >= 8 && hourOfDay <= 20) {
                baseVolume = 1200 + Math.sin((hourOfDay - 8) * Math.PI / 12) * 400;
            }
            
            // Add some randomness
            const noise = (Math.random() - 0.5) * 300;
            const volume = Math.max(200, baseVolume + noise);
            
            data.push(Math.round(volume));
        }
        return data;
    }

    setupEventListeners() {
        console.log('🎛️ Setting up event listeners...');

        // Trading pair selector
        const tradingPairSelect = document.getElementById('tradingPair');
        if (tradingPairSelect) {
            tradingPairSelect.addEventListener('change', (e) => {
                this.currentSymbol = e.target.value;
                this.updateAllCharts();
                this.showNotification(`Switched to ${this.currentSymbol}`, 'info');
            });
        }

        // Time range selector
        const timeRangeSelect = document.getElementById('timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.timeRange = e.target.value;
                this.updateAllCharts();
                this.showNotification(`Time range changed to ${this.timeRange}`, 'info');
            });
        }

        // Auto refresh toggle
        const autoRefreshBtn = document.getElementById('autoRefreshBtn');
        if (autoRefreshBtn) {
            autoRefreshBtn.addEventListener('click', () => {
                this.autoRefreshEnabled = !this.autoRefreshEnabled;
                autoRefreshBtn.classList.toggle('bg-blue-600');
                autoRefreshBtn.classList.toggle('bg-gray-600');
                autoRefreshBtn.innerHTML = this.autoRefreshEnabled 
                    ? '<i class="fas fa-sync-alt mr-2"></i>Auto Refresh: ON'
                    : '<i class="fas fa-pause mr-2"></i>Auto Refresh: OFF';
                this.showNotification(`Auto refresh ${this.autoRefreshEnabled ? 'enabled' : 'disabled'}`, 'info');
            });
        }

        // Whale threshold selector
        const whaleThresholdSelect = document.getElementById('whaleThreshold');
        if (whaleThresholdSelect) {
            whaleThresholdSelect.addEventListener('change', (e) => {
                this.whaleThreshold = parseInt(e.target.value);
                this.updateWhaleWatcher();
                this.showNotification(`Whale threshold set to ${this.whaleThreshold}+ BTC`, 'info');
            });
        }

        // Comparison metric selector
        const comparisonMetricSelect = document.getElementById('comparisonMetric');
        if (comparisonMetricSelect) {
            comparisonMetricSelect.addEventListener('change', (e) => {
                this.updateComparisonChart(e.target.value);
            });
        }

        // Heatmap timeframe selector
        const heatmapTimeframeSelect = document.getElementById('heatmapTimeframe');
        if (heatmapTimeframeSelect) {
            heatmapTimeframeSelect.addEventListener('change', (e) => {
                this.updateHeatmap(e.target.value);
            });
        }
    }

    initializeDataDisplays() {
        console.log('📊 Initializing data displays...');
        
        // Update stats cards
        this.updateStatsCards();
        
        // Initialize whale watcher
        this.updateWhaleWatcher();
        
        // Initialize volume heatmap
        this.updateHeatmap('24h');
        
        // Initialize alerts display
        this.updateAlertsDisplay();
        
        // Initialize flow analysis
        this.updateFlowAnalysis();
    }

    updateStatsCards() {
        // Total Volume
        const totalVolumeEl = document.querySelector('[data-stat="total-volume"]') || 
                             document.querySelector('#totalVolume') ||
                             document.querySelector('.text-2xl.font-bold');
        if (totalVolumeEl) totalVolumeEl.textContent = '$2.4B';
        
        const volumeChangeEl = document.querySelector('[data-stat="volume-change"]') ||
                              document.querySelector('#volumeChange');
        if (volumeChangeEl) volumeChangeEl.textContent = '+12.8%';
        
        // Active Exchanges
        const activeExchangesEl = document.querySelector('[data-stat="active-exchanges"]') ||
                                 document.querySelector('#activeExchanges');
        if (activeExchangesEl) activeExchangesEl.textContent = '8';
        
        // Whale Alerts
        const whaleCountEl = document.querySelector('[data-stat="whale-count"]') ||
                            document.querySelector('#whaleCount');
        if (whaleCountEl) whaleCountEl.textContent = '23';
        
        // Market Dominance
        const dominanceEl = document.querySelector('[data-stat="dominance"]') ||
                           document.querySelector('#dominancePercent');
        if (dominanceEl) dominanceEl.textContent = '42.3%';
    }

    updateWhaleWatcher() {
        const container = document.getElementById('whaleTradesContainer');
        if (!container) return;

        // Generate sample whale trades
        const whaleTrades = this.generateWhaleTradeData();
        
        container.innerHTML = whaleTrades.map(trade => `
            <div class="bg-gray-800 rounded-lg p-3 border-l-4 ${trade.type === 'buy' ? 'border-green-400' : 'border-red-400'} transform transition-all duration-200 hover:scale-102">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="font-medium ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}">
                            ${trade.type.toUpperCase()}
                        </span>
                        <span class="text-white ml-2 font-bold">${trade.amount} BTC</span>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-300 font-medium">${trade.exchange}</div>
                        <div class="text-xs text-gray-500">${trade.time}</div>
                    </div>
                </div>
                <div class="text-sm text-gray-400 mt-1">
                    Price: $${trade.price.toLocaleString()} • Value: $${(trade.amount * trade.price).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    generateWhaleTradeData() {
        const exchanges = ['Binance', 'Bybit', 'OKX', 'Coinbase', 'Kraken', 'Huobi'];
        const trades = [];
        
        for (let i = 0; i < 6; i++) {
            const amount = this.whaleThreshold + Math.random() * 500;
            const price = 65000 + (Math.random() - 0.5) * 3000;
            const time = new Date(Date.now() - Math.random() * 3600000);
            
            trades.push({
                type: Math.random() > 0.5 ? 'buy' : 'sell',
                amount: amount.toFixed(1),
                price: Math.round(price),
                exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
                time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            });
        }
        
        return trades.sort((a, b) => b.amount - a.amount);
    }

    updateHeatmap(timeframe) {
        const container = document.getElementById('volumeHeatmap');
        if (!container) return;

        // Generate heatmap data
        const heatmapData = this.generateHeatmapData(timeframe);
        
        container.innerHTML = heatmapData.map(cell => `
            <div class="rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg"
                 style="background-color: ${this.getHeatmapColor(cell.intensity)}; color: ${cell.intensity > 0.6 ? '#fff' : '#000'}; min-height: 60px;"
                 title="${cell.exchange}: ${cell.volume} BTC (${cell.intensity.toFixed(2)} intensity)">
                <div class="text-center">
                    <div class="font-bold text-sm">${cell.exchange}</div>
                    <div class="text-xs opacity-90">${cell.volume}</div>
                </div>
            </div>
        `).join('');
    }

    generateHeatmapData(timeframe) {
        const exchanges = ['Binance', 'Bybit', 'OKX', 'Coinbase', 'Kraken', 'Huobi'];
        return exchanges.map(exchange => {
            const volume = Math.random() * 1500 + 200;
            const intensity = Math.random();
            
            return {
                exchange: exchange.substring(0, 3).toUpperCase(),
                volume: volume.toFixed(0),
                intensity: intensity
            };
        });
    }

    getHeatmapColor(intensity) {
        // Create a more vibrant color gradient
        const colors = [
            '#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5',
            '#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#e879f9'
        ];
        const index = Math.floor(intensity * (colors.length - 1));
        return colors[index];
    }

    updateAlertsDisplay() {
        const container = document.getElementById('alertsContainer');
        if (!container) return;

        if (this.alerts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-bell-slash text-4xl mb-4 opacity-50"></i>
                    <p class="text-lg mb-2">No alerts configured</p>
                    <p class="text-sm">Click "Add Alert" to create volume alerts</p>
                </div>
            `;
        } else {
            container.innerHTML = this.alerts.map(alert => `
                <div class="bg-gray-800 rounded-lg p-3 border border-gray-600 hover:border-gray-500 transition-colors">
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="font-medium text-white">${alert.condition}</span>
                            <span class="text-blue-400 ml-2 font-bold">${alert.value}</span>
                        </div>
                        <button onclick="removeAlert('${alert.id}')" class="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        Created: ${alert.created.toLocaleTimeString()}
                    </div>
                </div>
            `).join('');
        }
    }

    updateComparisonChart(metric) {
        if (!this.comparisonChart) return;

        const data = {
            volume: { values: [42.3, 28.7, 15.2, 8.9, 4.9], suffix: '%' },
            trades: { values: [38.5, 31.2, 18.1, 7.8, 4.4], suffix: '%' },
            spread: { values: [0.02, 0.03, 0.025, 0.04, 0.035], suffix: '%' }
        };

        const selectedData = data[metric] || data.volume;
        
        this.comparisonChart.data.datasets[0].data = selectedData.values;
        this.comparisonChart.options.scales.y.ticks.callback = function(value) {
            return metric === 'spread' ? value.toFixed(3) + '%' : value + '%';
        };
        this.comparisonChart.update('resize');
        
        this.showNotification(`Updated comparison to show ${metric}`, 'info');
    }

    updateAllCharts() {
        console.log('🔄 Updating all charts...');
        
        if (this.volumeChart) {
            this.volumeChart.data.labels = this.generateTimeLabels();
            this.volumeChart.data.datasets[0].data = this.generateVolumeData();
            this.volumeChart.update('resize');
        }
        
        this.updateStatsCards();
        this.updateWhaleWatcher();
        this.updateFlowAnalysis();
    }

    startRealTimeSimulation() {
        console.log('🔄 Starting real-time data simulation...');
        
        // Update charts every 5 seconds
        setInterval(() => {
            if (this.autoRefreshEnabled) {
                this.updateAllCharts();
            }
        }, 5000);

        // Update whale watcher every 8 seconds
        setInterval(() => {
            if (this.autoRefreshEnabled) {
                this.updateWhaleWatcher();
            }
        }, 8000);

        // Update pressure charts every 3 seconds
        setInterval(() => {
            if (this.autoRefreshEnabled) {
                this.updatePressureCharts();
            }
        }, 3000);

        // Update heatmap every 15 seconds
        setInterval(() => {
            if (this.autoRefreshEnabled) {
                this.updateHeatmap(document.getElementById('heatmapTimeframe')?.value || '24h');
            }
        }, 15000);
    }

    updateFlowAnalysis() {
        // Generate realistic buy/sell pressure
        const marketTrend = Math.sin(Date.now() / 100000) * 0.3 + 0.5; // Slow trend
        const volatility = Math.random() * 0.2 - 0.1; // Random volatility
        
        const buyPressure = Math.max(10, Math.min(90, (marketTrend + volatility) * 100));
        const sellPressure = 100 - buyPressure;

        // Update display values
        const buyPressureValueEl = document.getElementById('buyPressureValue');
        const sellPressureValueEl = document.getElementById('sellPressureValue');
        
        if (buyPressureValueEl) buyPressureValueEl.textContent = buyPressure.toFixed(0) + '%';
        if (sellPressureValueEl) sellPressureValueEl.textContent = sellPressure.toFixed(0) + '%';

        // Update flow balance bar
        const flowBalance = document.getElementById('flowBalance');
        const flowBalanceText = document.getElementById('flowBalanceText');
        
        if (flowBalance && flowBalanceText) {
            const balance = buyPressure - 50; // -50 to +50
            const width = Math.abs(balance) * 2; // 0 to 100%
            const marginLeft = balance > 0 ? 50 : 50 - width;
            
            flowBalance.style.width = width + '%';
            flowBalance.style.marginLeft = marginLeft + '%';
            
            if (balance > 15) {
                flowBalanceText.textContent = 'Strong Buy Pressure';
                flowBalanceText.className = 'text-sm text-green-400 mt-2 font-medium';
            } else if (balance > 5) {
                flowBalanceText.textContent = 'Buy Dominant';
                flowBalanceText.className = 'text-sm text-green-300 mt-2';
            } else if (balance < -15) {
                flowBalanceText.textContent = 'Strong Sell Pressure';
                flowBalanceText.className = 'text-sm text-red-400 mt-2 font-medium';
            } else if (balance < -5) {
                flowBalanceText.textContent = 'Sell Dominant';
                flowBalanceText.className = 'text-sm text-red-300 mt-2';
            } else {
                flowBalanceText.textContent = 'Balanced Market';
                flowBalanceText.className = 'text-sm text-gray-400 mt-2';
            }
        }

        // Update pressure charts
        this.updatePressureCharts();
    }

    updatePressureCharts() {
        const buyPressureEl = document.getElementById('buyPressureValue');
        const buyPressure = buyPressureEl ? parseFloat(buyPressureEl.textContent) : 65;
        const sellPressure = 100 - buyPressure;

        if (this.buyPressureChart) {
            this.buyPressureChart.data.datasets[0].data = [buyPressure, 100 - buyPressure];
            this.buyPressureChart.update('none');
        }

        if (this.sellPressureChart) {
            this.sellPressureChart.data.datasets[0].data = [sellPressure, 100 - sellPressure];
            this.sellPressureChart.update('none');
        }
    }

    updateFromRealTimeData() {
        // Integration with main application's WebSocket data
        if (window.activeConnections) {
            console.log('📡 Updating from real-time data...');
            this.updateAllCharts();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full max-w-sm`;
        
        const colors = {
            success: 'bg-green-600 text-white border-green-500',
            error: 'bg-red-600 text-white border-red-500',
            info: 'bg-blue-600 text-white border-blue-500',
            warning: 'bg-yellow-600 text-black border-yellow-500'
        };
        
        notification.className += ` ${colors[type] || colors.info} border-l-4`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${icons[type] || icons.info} mr-3 text-lg"></i>
                <span class="font-medium">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Global functions for UI interactions
function addAlert() {
    const dashboard = window.volumeDashboard;
    if (!dashboard) return;

    const condition = prompt('Enter alert condition (e.g., "Volume above", "Price below"):');
    const value = prompt('Enter threshold value (e.g., "1000 BTC", "$70000"):');
    
    if (condition && value) {
        const alert = {
            id: Date.now().toString(),
            condition: condition,
            value: value,
            created: new Date()
        };
        
        dashboard.alerts.push(alert);
        dashboard.updateAlertsDisplay();
        dashboard.showNotification('Alert added successfully', 'success');
    }
}

function removeAlert(alertId) {
    const dashboard = window.volumeDashboard;
    if (!dashboard) return;

    dashboard.alerts = dashboard.alerts.filter(alert => alert.id !== alertId);
    dashboard.updateAlertsDisplay();
    dashboard.showNotification('Alert removed', 'info');
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM ready, initializing Volume Analytics Dashboard...');
    
    // Small delay to ensure all scripts are loaded
    setTimeout(() => {
        window.volumeDashboard = new VolumeAnalyticsDashboard();
    }, 100);
});

// Also try to initialize if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('🎯 DOM already ready, initializing Volume Analytics Dashboard...');
    setTimeout(() => {
        if (!window.volumeDashboard) {
            window.volumeDashboard = new VolumeAnalyticsDashboard();
        }
    }, 100);
}

// Export for global access
window.VolumeAnalyticsDashboard = VolumeAnalyticsDashboard;

/**
 * AI Trading Playground - Main Application Engine
 * Inspired by the beautiful volume dashboard design
 */

class TradingPlayground {
    constructor() {
        this.isInitialized = false;
        this.currentAgent = null;
        this.simulation = {
            isRunning: false,
            speed: 10,
            currentDate: new Date('2023-01-01'),
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            data: []
        };
        this.portfolio = {
            initialCapital: 10000,
            currentValue: 10000,
            position: 0,
            trades: [],
            metrics: {}
        };
        this.chart = null;
        this.settings = {
            theme: 'dark',
            soundEnabled: true,
            notificationsEnabled: true
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing AI Trading Playground...');
            
            // Initialize UI components
            this.initEventListeners();
            this.initChart();
            this.generateMarketData();
            this.updateUI();
            
            // Show welcome notification
            this.showNotification('🤖 AI Trading Playground initialized successfully!', 'success');
            
            this.isInitialized = true;
            console.log('✅ Trading Playground ready!');
        } catch (error) {
            console.error('❌ Failed to initialize Trading Playground:', error);
            this.showNotification('Failed to initialize playground', 'error');
        }
    }

    initEventListeners() {
        // Agent Controls
        document.getElementById('agentTypeSelect').addEventListener('change', (e) => {
            this.selectAgent(e.target.value);
        });

        document.getElementById('riskSlider').addEventListener('input', (e) => {
            document.getElementById('riskValue').textContent = e.target.value;
        });

        document.getElementById('initialCapital').addEventListener('change', (e) => {
            this.portfolio.initialCapital = parseFloat(e.target.value) || 10000;
            this.portfolio.currentValue = this.portfolio.initialCapital;
            this.updateMetrics();
        });

        document.getElementById('trainAgentBtn').addEventListener('click', () => {
            this.trainAgent();
        });

        document.getElementById('startTradingBtn').addEventListener('click', () => {
            this.toggleTrading();
        });

        // Time Machine Controls
        document.getElementById('playBtn').addEventListener('click', () => {
            this.toggleSimulation();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseSimulation();
        });

        document.getElementById('stepBackBtn').addEventListener('click', () => {
            this.stepSimulation(-1);
        });

        document.getElementById('stepForwardBtn').addEventListener('click', () => {
            this.stepSimulation(1);
        });

        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.simulation.speed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = `${this.simulation.speed}x`;
        });

        document.getElementById('startDate').addEventListener('change', (e) => {
            this.simulation.startDate = new Date(e.target.value);
            this.simulation.currentDate = new Date(e.target.value);
            this.generateMarketData();
        });

        document.getElementById('endDate').addEventListener('change', (e) => {
            this.simulation.endDate = new Date(e.target.value);
            this.generateMarketData();
        });

        // Chart Controls
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateChart();
            });
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('active');
        });

        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('active');
        });

        document.getElementById('resetStatsBtn').addEventListener('click', () => {
            this.resetPortfolio();
        });

        document.getElementById('clearActivityBtn').addEventListener('click', () => {
            this.clearActivity();
        });

        // Auto-refresh toggle
        document.getElementById('autoRefreshBtn').addEventListener('click', (e) => {
            e.target.classList.toggle('active');
            this.toggleAutoRefresh();
        });

        // Modal close on background click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.classList.remove('active');
            }
        });
    }

    async initChart() {
        const ctx = document.getElementById('tradingChart').getContext('2d');
        
        try {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'BTC/USDT',
                            data: [],
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'SMA 10',
                            data: [],
                            borderColor: '#10b981',
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            pointRadius: 0,
                            borderDash: [5, 5]
                        },
                        {
                            label: 'SMA 30',
                            data: [],
                            borderColor: '#f59e0b',
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            pointRadius: 0,
                            borderDash: [5, 5]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#e2e8f0',
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            titleColor: '#e2e8f0',
                            bodyColor: '#e2e8f0',
                            borderColor: 'rgba(75, 85, 99, 0.3)',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'hour',
                                displayFormats: {
                                    hour: 'MMM dd HH:mm'
                                }
                            },
                            grid: {
                                color: 'rgba(75, 85, 99, 0.3)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#94a3b8',
                                font: {
                                    size: 11
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(75, 85, 99, 0.3)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#94a3b8',
                                font: {
                                    size: 11
                                },
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });

            // Hide chart overlay after successful initialization
            setTimeout(() => {
                document.getElementById('chartOverlay').style.display = 'none';
            }, 1000);

        } catch (error) {
            console.error('Chart initialization failed:', error);
            this.showNotification('Chart initialization failed', 'error');
        }
    }

    generateMarketData() {
        console.log('📊 Generating market data...');
        
        const data = [];
        const startTime = this.simulation.startDate.getTime();
        const endTime = this.simulation.endDate.getTime();
        const interval = 60 * 60 * 1000; // 1 hour
        
        let currentPrice = 45000; // Starting BTC price
        let trend = 1;
        let volatility = 0.02;
        
        for (let time = startTime; time <= endTime; time += interval) {
            // Simulate price movement with trend and noise
            const noise = (Math.random() - 0.5) * volatility * currentPrice;
            const trendChange = trend * 0.001 * currentPrice;
            
            currentPrice += trendChange + noise;
            
            // Occasionally change trend
            if (Math.random() < 0.01) {
                trend *= -1;
            }
            
            // Add market cycles
            const timeOfDay = new Date(time).getHours();
            if (timeOfDay >= 14 && timeOfDay <= 16) { // US market hours boost
                currentPrice *= 1.0001;
            }
            
            data.push({
                timestamp: time,
                price: Math.max(currentPrice, 1000), // Prevent negative prices
                volume: Math.random() * 1000 + 500
            });
        }
        
        this.simulation.data = data;
        this.updateChart();
        console.log(`📈 Generated ${data.length} data points`);
    }

    updateChart() {
        if (!this.chart || !this.simulation.data.length) return;

        const visibleData = this.simulation.data.slice(0, 
            Math.floor((this.simulation.currentDate.getTime() - this.simulation.startDate.getTime()) / (60 * 60 * 1000))
        );

        const labels = visibleData.map(d => new Date(d.timestamp));
        const prices = visibleData.map(d => d.price);
        
        // Calculate moving averages
        const sma10 = this.calculateSMA(prices, 10);
        const sma30 = this.calculateSMA(prices, 30);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = prices;
        this.chart.data.datasets[1].data = sma10;
        this.chart.data.datasets[2].data = sma30;

        this.chart.update('none');
    }

    calculateSMA(data, period) {
        const sma = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                sma.push(null);
            } else {
                const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
                sma.push(sum / period);
            }
        }
        return sma;
    }

    selectAgent(type) {
        console.log(`🤖 Selecting agent: ${type}`);
        
        const agents = {
            sma: new SMAAgent(),
            rsi: new RSIAgent(),
            ml: new MLAgent(),
            custom: new CustomAgent()
        };

        this.currentAgent = agents[type];
        this.updateAgentStatus();
        this.addActivity('agent', `Selected ${this.currentAgent.name} agent`);
    }

    async trainAgent() {
        if (!this.currentAgent) {
            this.showNotification('Please select an agent first', 'error');
            return;
        }

        console.log('🎓 Training agent...');
        document.getElementById('trainAgentBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Training...';
        
        try {
            await this.currentAgent.train(this.simulation.data);
            this.showNotification(`${this.currentAgent.name} training completed!`, 'success');
            this.addActivity('training', `Agent training completed successfully`);
        } catch (error) {
            console.error('Training failed:', error);
            this.showNotification('Agent training failed', 'error');
        } finally {
            document.getElementById('trainAgentBtn').innerHTML = '<i class="fas fa-graduation-cap"></i> Train Agent';
        }
    }

    toggleTrading() {
        if (!this.currentAgent) {
            this.showNotification('Please select and train an agent first', 'error');
            return;
        }

        if (this.simulation.isRunning) {
            this.stopTrading();
        } else {
            this.startTrading();
        }
    }

    startTrading() {
        console.log('🚀 Starting trading simulation...');
        this.simulation.isRunning = true;
        document.getElementById('startTradingBtn').innerHTML = '<i class="fas fa-stop"></i> Stop Trading';
        document.getElementById('playBtn').innerHTML = '<i class="fas fa-pause"></i>';
        
        this.runSimulation();
        this.addActivity('trading', 'Trading simulation started');
        this.showNotification('Trading simulation started!', 'info');
    }

    stopTrading() {
        console.log('⏹️ Stopping trading simulation...');
        this.simulation.isRunning = false;
        document.getElementById('startTradingBtn').innerHTML = '<i class="fas fa-play"></i> Start Trading';
        document.getElementById('playBtn').innerHTML = '<i class="fas fa-play"></i>';
        
        this.addActivity('trading', 'Trading simulation stopped');
    }

    toggleSimulation() {
        if (this.simulation.isRunning) {
            this.pauseSimulation();
        } else {
            this.startTrading();
        }
    }

    pauseSimulation() {
        this.simulation.isRunning = false;
        document.getElementById('playBtn').innerHTML = '<i class="fas fa-play"></i>';
    }

    stepSimulation(direction) {
        const stepSize = 60 * 60 * 1000; // 1 hour
        const newTime = this.simulation.currentDate.getTime() + (direction * stepSize);
        
        if (newTime >= this.simulation.startDate.getTime() && newTime <= this.simulation.endDate.getTime()) {
            this.simulation.currentDate = new Date(newTime);
            document.getElementById('currentSimDate').textContent = this.simulation.currentDate.toISOString().split('T')[0];
            this.updateChart();
        }
    }

    async runSimulation() {
        while (this.simulation.isRunning) {
            // Get current market state
            const currentDataIndex = Math.floor(
                (this.simulation.currentDate.getTime() - this.simulation.startDate.getTime()) / (60 * 60 * 1000)
            );
            
            if (currentDataIndex >= this.simulation.data.length) {
                this.stopTrading();
                this.showNotification('Simulation completed!', 'success');
                break;
            }

            const currentData = this.simulation.data[currentDataIndex];
            
            // Let agent make decision
            if (this.currentAgent) {
                const decision = await this.currentAgent.decide(currentData, this.portfolio);
                if (decision.action !== 'hold') {
                    this.executeTrade(decision, currentData);
                }
                
                // Update confidence meter
                this.updateConfidence(decision.confidence);
            }

            // Advance time
            this.simulation.currentDate = new Date(this.simulation.currentDate.getTime() + (60 * 60 * 1000));
            document.getElementById('currentSimDate').textContent = this.simulation.currentDate.toISOString().split('T')[0];
            
            // Update chart and metrics
            this.updateChart();
            this.updateMetrics();

            // Wait based on simulation speed
            await new Promise(resolve => setTimeout(resolve, Math.max(10, 1000 / this.simulation.speed)));
        }
    }

    executeTrade(decision, marketData) {
        const trade = {
            timestamp: this.simulation.currentDate.getTime(),
            action: decision.action,
            price: marketData.price,
            quantity: decision.quantity,
            confidence: decision.confidence,
            reasoning: decision.reasoning
        };

        if (decision.action === 'buy') {
            const cost = trade.price * trade.quantity;
            if (this.portfolio.currentValue >= cost) {
                this.portfolio.currentValue -= cost;
                this.portfolio.position += trade.quantity;
                this.portfolio.trades.push(trade);
                
                this.addActivity('buy', 
                    `Bought ${trade.quantity.toFixed(4)} BTC at $${trade.price.toLocaleString()}`,
                    `Confidence: ${Math.round(trade.confidence)}%`
                );
                
                if (this.settings.soundEnabled) {
                    this.playSound('buy');
                }
            }
        } else if (decision.action === 'sell' && this.portfolio.position > 0) {
            const sellQuantity = Math.min(trade.quantity, this.portfolio.position);
            const revenue = trade.price * sellQuantity;
            
            this.portfolio.currentValue += revenue;
            this.portfolio.position -= sellQuantity;
            this.portfolio.trades.push({...trade, quantity: sellQuantity});
            
            this.addActivity('sell', 
                `Sold ${sellQuantity.toFixed(4)} BTC at $${trade.price.toLocaleString()}`,
                `Confidence: ${Math.round(trade.confidence)}%`
            );
            
            if (this.settings.soundEnabled) {
                this.playSound('sell');
            }
        }

        this.updateMetrics();
    }

    updateConfidence(confidence) {
        const confidenceFill = document.getElementById('confidenceFill');
        const confidenceValue = document.getElementById('confidenceValue');
        
        confidenceFill.style.width = `${confidence}%`;
        confidenceValue.textContent = Math.round(confidence);
    }

    updateMetrics() {
        const totalValue = this.portfolio.currentValue + (this.portfolio.position * this.getCurrentPrice());
        const totalReturn = ((totalValue - this.portfolio.initialCapital) / this.portfolio.initialCapital) * 100;
        
        // Calculate additional metrics
        const winningTrades = this.portfolio.trades.filter(trade => {
            if (trade.action === 'buy') return false;
            const buyTrade = this.portfolio.trades.slice().reverse().find(t => t.action === 'buy');
            return buyTrade && trade.price > buyTrade.price;
        });
        
        const winRate = this.portfolio.trades.length > 0 ? 
            (winningTrades.length / this.portfolio.trades.filter(t => t.action === 'sell').length) * 100 : 0;

        // Update UI
        document.getElementById('portfolioValue').textContent = `$${totalValue.toLocaleString()}`;
        document.getElementById('portfolioValue').className = `metric-value ${totalReturn >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('portfolioChange').textContent = `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`;
        document.getElementById('totalReturn').textContent = `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`;
        document.getElementById('totalTrades').textContent = this.portfolio.trades.length;
        document.getElementById('winRate').textContent = `${winRate.toFixed(1)}%`;
        document.getElementById('sharpeRatio').textContent = this.calculateSharpeRatio().toFixed(2);
        document.getElementById('maxDrawdown').textContent = `-${this.calculateMaxDrawdown().toFixed(2)}%`;
    }

    getCurrentPrice() {
        const currentIndex = Math.floor(
            (this.simulation.currentDate.getTime() - this.simulation.startDate.getTime()) / (60 * 60 * 1000)
        );
        return this.simulation.data[currentIndex]?.price || 45000;
    }

    calculateSharpeRatio() {
        if (this.portfolio.trades.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < this.portfolio.trades.length; i++) {
            const prevValue = this.portfolio.trades[i-1].price;
            const currentValue = this.portfolio.trades[i].price;
            returns.push((currentValue - prevValue) / prevValue);
        }
        
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        
        return stdDev !== 0 ? avgReturn / stdDev : 0;
    }

    calculateMaxDrawdown() {
        if (this.portfolio.trades.length === 0) return 0;
        
        let peak = this.portfolio.initialCapital;
        let maxDrawdown = 0;
        
        for (const trade of this.portfolio.trades) {
            const currentValue = this.portfolio.currentValue + (this.portfolio.position * trade.price);
            peak = Math.max(peak, currentValue);
            const drawdown = (peak - currentValue) / peak * 100;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        }
        
        return maxDrawdown;
    }

    updateAgentStatus() {
        const statusDot = document.querySelector('.agent-status .status-dot');
        const statusText = document.querySelector('.agent-status span');
        
        if (this.currentAgent) {
            statusDot.className = 'status-dot status-ready';
            statusText.textContent = 'Ready';
        } else {
            statusDot.className = 'status-dot';
            statusText.textContent = 'No Agent';
        }
    }

    updateUI() {
        // Update date inputs
        document.getElementById('startDate').value = this.simulation.startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = this.simulation.endDate.toISOString().split('T')[0];
        document.getElementById('currentSimDate').textContent = this.simulation.currentDate.toISOString().split('T')[0];
        
        // Update speed display
        document.getElementById('speedValue').textContent = `${this.simulation.speed}x`;
        
        // Update metrics
        this.updateMetrics();
    }

    addActivity(type, text, subtext = '') {
        const activityFeed = document.getElementById('activityFeed');
        const timestamp = new Date().toLocaleTimeString();
        
        const icons = {
            agent: 'fas fa-robot',
            training: 'fas fa-graduation-cap',
            trading: 'fas fa-play',
            buy: 'fas fa-arrow-up',
            sell: 'fas fa-arrow-down'
        };

        const activityItem = document.createElement('div');
        activityItem.className = `activity-item ${type}`;
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="${icons[type] || 'fas fa-info'}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${text}</div>
                <div class="activity-time">${subtext || timestamp}</div>
            </div>
        `;

        // Add to top of feed
        if (activityFeed.children.length > 0) {
            activityFeed.insertBefore(activityItem, activityFeed.firstChild);
        } else {
            activityFeed.appendChild(activityItem);
        }

        // Limit feed length
        while (activityFeed.children.length > 50) {
            activityFeed.removeChild(activityFeed.lastChild);
        }

        // Animate new item
        activityItem.style.transform = 'translateY(-20px)';
        activityItem.style.opacity = '0';
        setTimeout(() => {
            activityItem.style.transform = 'translateY(0)';
            activityItem.style.opacity = '1';
            activityItem.style.transition = 'all 0.3s ease';
        }, 100);
    }

    clearActivity() {
        const activityFeed = document.getElementById('activityFeed');
        activityFeed.innerHTML = `
            <div class="activity-item welcome">
                <div class="activity-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">Activity feed cleared</div>
                    <div class="activity-time">Ready for new trades</div>
                </div>
            </div>
        `;
    }

    resetPortfolio() {
        this.portfolio = {
            initialCapital: this.portfolio.initialCapital,
            currentValue: this.portfolio.initialCapital,
            position: 0,
            trades: [],
            metrics: {}
        };
        
        this.simulation.currentDate = new Date(this.simulation.startDate);
        this.updateUI();
        this.updateChart();
        this.addActivity('trading', 'Portfolio reset to initial state');
        this.showNotification('Portfolio reset successfully', 'info');
    }

    toggleAutoRefresh() {
        // Implementation for auto-refresh functionality
        console.log('Auto-refresh toggled');
    }

    playSound(type) {
        if (!this.settings.soundEnabled) return;
        
        // Create audio context for sound effects
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'buy') {
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            } else if (type === 'sell') {
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Silently fail if audio is not supported
        }
    }

    showNotification(message, type = 'info') {
        if (!this.settings.notificationsEnabled) return;
        
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #94a3b8; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Agent Classes
class TradingAgent {
    constructor(name, strategy) {
        this.name = name;
        this.strategy = strategy;
        this.isTrained = false;
        this.confidence = 0;
    }

    async train(data) {
        console.log(`Training ${this.name}...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate training time
        this.isTrained = true;
    }

    async decide(marketData, portfolio) {
        return {
            action: 'hold',
            quantity: 0,
            confidence: 50,
            reasoning: 'Base agent - no strategy implemented'
        };
    }
}

class SMAAgent extends TradingAgent {
    constructor() {
        super('Simple Moving Average', 'Golden Cross');
        this.shortPeriod = 10;
        this.longPeriod = 30;
        this.priceHistory = [];
    }

    async decide(marketData, portfolio) {
        this.priceHistory.push(marketData.price);
        
        if (this.priceHistory.length < this.longPeriod) {
            return { action: 'hold', quantity: 0, confidence: 0, reasoning: 'Insufficient data' };
        }

        const shortSMA = this.calculateSMA(this.shortPeriod);
        const longSMA = this.calculateSMA(this.longPeriod);
        const prevShortSMA = this.calculateSMA(this.shortPeriod, 1);
        const prevLongSMA = this.calculateSMA(this.longPeriod, 1);

        const goldenCross = shortSMA > longSMA && prevShortSMA <= prevLongSMA;
        const deathCross = shortSMA < longSMA && prevShortSMA >= prevLongSMA;

        const strength = Math.abs(shortSMA - longSMA) / longSMA;
        this.confidence = Math.min(strength * 1000, 95);

        if (goldenCross) {
            const quantity = (portfolio.currentValue * 0.5) / marketData.price; // 50% of available capital
            return {
                action: 'buy',
                quantity: quantity,
                confidence: this.confidence,
                reasoning: `Golden cross: SMA${this.shortPeriod} crossed above SMA${this.longPeriod}`
            };
        } else if (deathCross && portfolio.position > 0) {
            return {
                action: 'sell',
                quantity: portfolio.position,
                confidence: this.confidence,
                reasoning: `Death cross: SMA${this.shortPeriod} crossed below SMA${this.longPeriod}`
            };
        }

        return {
            action: 'hold',
            quantity: 0,
            confidence: this.confidence,
            reasoning: 'No clear crossover signal'
        };
    }

    calculateSMA(period, offset = 0) {
        const start = Math.max(0, this.priceHistory.length - period - offset);
        const end = this.priceHistory.length - offset;
        const slice = this.priceHistory.slice(start, end);
        return slice.reduce((sum, price) => sum + price, 0) / slice.length;
    }
}

class RSIAgent extends TradingAgent {
    constructor() {
        super('RSI Mean Reversion', 'Oversold/Overbought');
        this.period = 14;
        this.priceHistory = [];
        this.overbought = 70;
        this.oversold = 30;
    }

    async decide(marketData, portfolio) {
        this.priceHistory.push(marketData.price);
        
        if (this.priceHistory.length < this.period + 1) {
            return { action: 'hold', quantity: 0, confidence: 0, reasoning: 'Insufficient data for RSI' };
        }

        const rsi = this.calculateRSI();
        this.confidence = Math.abs(rsi - 50) * 2; // Higher confidence at extremes

        if (rsi < this.oversold) {
            const quantity = (portfolio.currentValue * 0.3) / marketData.price; // 30% of available capital
            return {
                action: 'buy',
                quantity: quantity,
                confidence: this.confidence,
                reasoning: `RSI oversold: ${rsi.toFixed(1)} < ${this.oversold}`
            };
        } else if (rsi > this.overbought && portfolio.position > 0) {
            return {
                action: 'sell',
                quantity: portfolio.position * 0.5, // Sell half
                confidence: this.confidence,
                reasoning: `RSI overbought: ${rsi.toFixed(1)} > ${this.overbought}`
            };
        }

        return {
            action: 'hold',
            quantity: 0,
            confidence: this.confidence,
            reasoning: `RSI neutral: ${rsi.toFixed(1)}`
        };
    }

    calculateRSI() {
        const changes = [];
        for (let i = 1; i < this.priceHistory.length; i++) {
            changes.push(this.priceHistory[i] - this.priceHistory[i - 1]);
        }

        const recentChanges = changes.slice(-this.period);
        const gains = recentChanges.filter(change => change > 0);
        const losses = recentChanges.filter(change => change < 0).map(loss => Math.abs(loss));

        const avgGain = gains.length > 0 ? gains.reduce((sum, gain) => sum + gain, 0) / this.period : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((sum, loss) => sum + loss, 0) / this.period : 0;

        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
}

class MLAgent extends TradingAgent {
    constructor() {
        super('Deep Q-Learning', 'Neural Network');
        this.modelComplexity = 0;
    }

    async train(data) {
        console.log('Training neural network...');
        // Simulate complex ML training
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            this.modelComplexity += 10;
        }
        this.isTrained = true;
    }

    async decide(marketData, portfolio) {
        if (!this.isTrained) {
            return { action: 'hold', quantity: 0, confidence: 0, reasoning: 'Model not trained' };
        }

        // Simulate neural network prediction
        const prediction = Math.random(); // Random prediction for demo
        const confidence = Math.random() * 100;
        
        this.confidence = confidence;

        if (prediction > 0.7) {
            const quantity = (portfolio.currentValue * 0.4) / marketData.price;
            return {
                action: 'buy',
                quantity: quantity,
                confidence: confidence,
                reasoning: `Neural network bullish prediction: ${(prediction * 100).toFixed(1)}%`
            };
        } else if (prediction < 0.3 && portfolio.position > 0) {
            return {
                action: 'sell',
                quantity: portfolio.position * 0.6,
                confidence: confidence,
                reasoning: `Neural network bearish prediction: ${(prediction * 100).toFixed(1)}%`
            };
        }

        return {
            action: 'hold',
            quantity: 0,
            confidence: confidence,
            reasoning: `Neural network neutral: ${(prediction * 100).toFixed(1)}%`
        };
    }
}

class CustomAgent extends TradingAgent {
    constructor() {
        super('Custom Strategy', 'User-Defined');
    }

    async decide(marketData, portfolio) {
        // Placeholder for user-defined strategy
        return {
            action: 'hold',
            quantity: 0,
            confidence: 50,
            reasoning: 'Custom strategy not implemented'
        };
    }
}

// Initialize the Trading Playground when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tradingPlayground = new TradingPlayground();
});

console.log('🚀 AI Trading Playground loaded successfully!'); 
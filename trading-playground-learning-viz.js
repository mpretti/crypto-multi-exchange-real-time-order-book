/**
 * AI Trading Playground - Live Learning Visualization
 * Watch AI models learn and adapt in real-time during historical playback
 */

class LiveLearningVisualization {
    constructor(playground) {
        this.playground = playground;
        this.isLearningMode = false;
        this.learningData = {
            confidence: [],
            losses: [],
            weights: [],
            decisions: [],
            rewards: [],
            exploration: [],
            memory: []
        };
        this.neuralNetworkViz = null;
        this.learningCharts = {};
        this.currentEpoch = 0;
        this.learningSpeed = 1;
        
        this.init();
    }

    init() {
        this.addLearningModeButton();
        this.createLearningVisualizationPanel();
        this.initializeLearningCharts();
    }

    addLearningModeButton() {
        // Add learning mode toggle to time panel
        const timePanel = document.querySelector('.time-panel .panel-content');
        const learningToggle = document.createElement('div');
        learningToggle.className = 'learning-mode-toggle';
        learningToggle.innerHTML = `
            <div class="learning-toggle-container">
                <div class="toggle-header">
                    <i class="fas fa-brain text-purple-400"></i>
                    <span class="toggle-label">Live Learning Mode</span>
                    <div class="learning-status" id="learningStatus">
                        <span class="status-text">Disabled</span>
                    </div>
                </div>
                <div class="toggle-controls">
                    <div class="learning-switch">
                        <input type="checkbox" id="learningModeToggle" class="learning-checkbox">
                        <label for="learningModeToggle" class="learning-slider">
                            <span class="slider-text off">Watch</span>
                            <span class="slider-text on">Learn</span>
                        </label>
                    </div>
                    <button class="reset-learning-btn" id="resetLearningBtn" disabled>
                        <i class="fas fa-redo"></i>
                        Reset Learning
                    </button>
                </div>
                <div class="learning-options" id="learningOptions" style="display: none;">
                    <div class="option-group">
                        <label>Learning Algorithm</label>
                        <select id="learningAlgorithm">
                            <option value="dqn">Deep Q-Network</option>
                            <option value="ppo">Proximal Policy Optimization</option>
                            <option value="a3c">Actor-Critic</option>
                            <option value="genetic">Genetic Algorithm</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label>Learning Rate</label>
                        <input type="range" min="0.001" max="0.1" step="0.001" value="0.01" id="learningRate">
                        <span class="value-display" id="learningRateValue">0.01</span>
                    </div>
                    <div class="option-group">
                        <label>Exploration Rate</label>
                        <input type="range" min="0" max="1" step="0.01" value="0.1" id="explorationRate">
                        <span class="value-display" id="explorationRateValue">0.1</span>
                    </div>
                </div>
            </div>
        `;
        
        timePanel.appendChild(learningToggle);
        
        // Add event listeners
        const learningCheckbox = document.getElementById('learningModeToggle');
        const learningOptions = document.getElementById('learningOptions');
        const resetBtn = document.getElementById('resetLearningBtn');
        
        learningCheckbox.addEventListener('change', (e) => {
            this.toggleLearningMode(e.target.checked);
            learningOptions.style.display = e.target.checked ? 'block' : 'none';
            resetBtn.disabled = !e.target.checked;
        });
        
        resetBtn.addEventListener('click', () => this.resetLearning());
        
        // Learning rate and exploration rate updates
        document.getElementById('learningRate').addEventListener('input', (e) => {
            document.getElementById('learningRateValue').textContent = e.target.value;
        });
        
        document.getElementById('explorationRate').addEventListener('input', (e) => {
            document.getElementById('explorationRateValue').textContent = e.target.value;
        });
    }

    createLearningVisualizationPanel() {
        // Create floating learning visualization panel
        const learningPanel = document.createElement('div');
        learningPanel.className = 'learning-viz-panel glass-effect';
        learningPanel.id = 'learningVizPanel';
        learningPanel.innerHTML = `
            <div class="learning-viz-header">
                <div class="panel-title">
                    <i class="fas fa-brain text-purple-400"></i>
                    <span>AI Learning Dashboard</span>
                    <div class="epoch-counter">
                        <span>Epoch: </span>
                        <span id="epochCounter">0</span>
                    </div>
                </div>
                <div class="panel-controls">
                    <button class="minimize-btn" id="minimizeLearningPanel">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="close-btn" id="closeLearningPanel">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="learning-viz-content">
                <!-- Neural Network Visualization -->
                <div class="neural-network-section">
                    <h4>Neural Network Activity</h4>
                    <div class="network-container">
                        <canvas id="neuralNetworkCanvas" width="400" height="300"></canvas>
                        <div class="network-info">
                            <div class="info-item">
                                <span class="info-label">Neurons Active:</span>
                                <span class="info-value" id="activeNeurons">0</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Strongest Connection:</span>
                                <span class="info-value" id="strongestConnection">0.00</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Network Complexity:</span>
                                <span class="info-value" id="networkComplexity">Low</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Learning Metrics Charts -->
                <div class="learning-charts-section">
                    <div class="charts-grid">
                        <!-- Loss Chart -->
                        <div class="chart-container">
                            <h5>Learning Loss</h5>
                            <canvas id="lossChart" width="200" height="150"></canvas>
                            <div class="chart-info">
                                <span class="current-loss">Current: <span id="currentLoss">0.00</span></span>
                                <span class="trend" id="lossTrend">Stable</span>
                            </div>
                        </div>
                        
                        <!-- Reward Chart -->
                        <div class="chart-container">
                            <h5>Cumulative Reward</h5>
                            <canvas id="rewardChart" width="200" height="150"></canvas>
                            <div class="chart-info">
                                <span class="current-reward">Total: <span id="totalReward">0</span></span>
                                <span class="trend" id="rewardTrend">Growing</span>
                            </div>
                        </div>
                        
                        <!-- Confidence Chart -->
                        <div class="chart-container">
                            <h5>Decision Confidence</h5>
                            <canvas id="confidenceChart" width="200" height="150"></canvas>
                            <div class="chart-info">
                                <span class="current-confidence">Now: <span id="currentConfidenceValue">0%</span></span>
                                <span class="trend" id="confidenceTrend">Improving</span>
                            </div>
                        </div>
                        
                        <!-- Exploration Chart -->
                        <div class="chart-container">
                            <h5>Exploration vs Exploitation</h5>
                            <canvas id="explorationChart" width="200" height="150"></canvas>
                            <div class="chart-info">
                                <span class="exploration-rate">Explore: <span id="currentExploration">10%</span></span>
                                <span class="exploitation-rate">Exploit: <span id="currentExploitation">90%</span></span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Learning Events Feed -->
                <div class="learning-events-section">
                    <h4>Learning Events</h4>
                    <div class="events-feed" id="learningEventsFeed">
                        <div class="event-item system">
                            <div class="event-icon">
                                <i class="fas fa-play"></i>
                            </div>
                            <div class="event-content">
                                <span class="event-text">Learning system ready</span>
                                <span class="event-time">Ready to learn</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Memory Visualization -->
                <div class="memory-section">
                    <h4>Experience Memory</h4>
                    <div class="memory-container">
                        <div class="memory-stats">
                            <div class="stat-item">
                                <span class="stat-label">Experiences Stored:</span>
                                <span class="stat-value" id="experiencesStored">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Memory Utilization:</span>
                                <div class="memory-bar">
                                    <div class="memory-fill" id="memoryFill" style="width: 0%"></div>
                                </div>
                                <span class="stat-value" id="memoryUtilization">0%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Replay Frequency:</span>
                                <span class="stat-value" id="replayFrequency">0/sec</span>
                            </div>
                        </div>
                        <div class="memory-visualization">
                            <canvas id="memoryCanvas" width="350" height="100"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(learningPanel);
        
        // Add drag functionality
        this.makeDraggable(learningPanel);
        
        // Add event listeners
        document.getElementById('minimizeLearningPanel').addEventListener('click', () => {
            learningPanel.classList.toggle('minimized');
        });
        
        document.getElementById('closeLearningPanel').addEventListener('click', () => {
            learningPanel.style.display = 'none';
        });
    }

    makeDraggable(element) {
        let isDragging = false;
        let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

        const header = element.querySelector('.learning-viz-header');
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.panel-controls')) return;
            
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

    initializeLearningCharts() {
        // Initialize all learning visualization charts
        setTimeout(() => {
            this.initLossChart();
            this.initRewardChart();
            this.initConfidenceChart();
            this.initExplorationChart();
            this.initNeuralNetworkVisualization();
            this.initMemoryVisualization();
        }, 500);
    }

    initLossChart() {
        const ctx = document.getElementById('lossChart')?.getContext('2d');
        if (!ctx) return;
        
        this.learningCharts.loss = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Loss',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { 
                        display: true,
                        grid: { color: 'rgba(75, 85, 99, 0.3)' },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                },
                elements: { point: { radius: 0 } }
            }
        });
    }

    initRewardChart() {
        const ctx = document.getElementById('rewardChart')?.getContext('2d');
        if (!ctx) return;
        
        this.learningCharts.reward = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cumulative Reward',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { 
                        display: true,
                        grid: { color: 'rgba(75, 85, 99, 0.3)' },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                },
                elements: { point: { radius: 0 } }
            }
        });
    }

    initConfidenceChart() {
        const ctx = document.getElementById('confidenceChart')?.getContext('2d');
        if (!ctx) return;
        
        this.learningCharts.confidence = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Confidence',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { 
                        display: true,
                        min: 0,
                        max: 100,
                        grid: { color: 'rgba(75, 85, 99, 0.3)' },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                },
                elements: { point: { radius: 0 } }
            }
        });
    }

    initExplorationChart() {
        const ctx = document.getElementById('explorationChart')?.getContext('2d');
        if (!ctx) return;
        
        this.learningCharts.exploration = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Exploration', 'Exploitation'],
                datasets: [{
                    data: [10, 90],
                    backgroundColor: ['#f59e0b', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    initNeuralNetworkVisualization() {
        const canvas = document.getElementById('neuralNetworkCanvas');
        if (!canvas) return;
        
        this.neuralNetworkViz = new NeuralNetworkVisualizer(canvas);
        this.neuralNetworkViz.initialize();
    }

    initMemoryVisualization() {
        const canvas = document.getElementById('memoryCanvas');
        if (!canvas) return;
        
        this.memoryViz = new MemoryVisualizer(canvas);
        this.memoryViz.initialize();
    }

    toggleLearningMode(enabled) {
        this.isLearningMode = enabled;
        const status = document.getElementById('learningStatus');
        const panel = document.getElementById('learningVizPanel');
        
        if (enabled) {
            status.innerHTML = '<span class="status-text learning">Learning Active</span>';
            panel.style.display = 'block';
            this.startLearningVisualization();
            this.addLearningEvent('system', 'Learning mode activated', 'AI will learn from market data');
        } else {
            status.innerHTML = '<span class="status-text">Disabled</span>';
            panel.style.display = 'none';
            this.stopLearningVisualization();
        }
    }

    startLearningVisualization() {
        // Reset learning data
        this.learningData = {
            confidence: [],
            losses: [],
            weights: [],
            decisions: [],
            rewards: [],
            exploration: [],
            memory: []
        };
        this.currentEpoch = 0;
        
        // Start learning simulation
        this.learningInterval = setInterval(() => {
            this.simulateLearningStep();
        }, 1000 / this.learningSpeed);
    }

    stopLearningVisualization() {
        if (this.learningInterval) {
            clearInterval(this.learningInterval);
            this.learningInterval = null;
        }
    }

    simulateLearningStep() {
        if (!this.isLearningMode) return;
        
        this.currentEpoch++;
        document.getElementById('epochCounter').textContent = this.currentEpoch;
        
        // Simulate learning metrics
        const timeStep = this.currentEpoch;
        
        // Generate realistic learning data
        const loss = this.generateLoss(timeStep);
        const reward = this.generateReward(timeStep);
        const confidence = this.generateConfidence(timeStep);
        const exploration = this.generateExploration(timeStep);
        
        // Update data arrays
        this.learningData.losses.push(loss);
        this.learningData.rewards.push(reward);
        this.learningData.confidence.push(confidence);
        this.learningData.exploration.push(exploration);
        
        // Keep only last 100 data points for visualization
        const maxPoints = 100;
        Object.keys(this.learningData).forEach(key => {
            if (this.learningData[key].length > maxPoints) {
                this.learningData[key] = this.learningData[key].slice(-maxPoints);
            }
        });
        
        // Update visualizations
        this.updateLearningCharts();
        this.updateNeuralNetwork();
        this.updateMemoryVisualization();
        this.updateLearningEvents(timeStep, loss, reward, confidence);
        
        // Update info displays
        this.updateInfoDisplays(loss, reward, confidence, exploration);
    }

    generateLoss(timeStep) {
        // Simulate decreasing loss with some noise
        const baseLoss = Math.max(0.01, 2 * Math.exp(-timeStep / 50));
        const noise = (Math.random() - 0.5) * 0.1;
        return Math.max(0, baseLoss + noise);
    }

    generateReward(timeStep) {
        // Simulate increasing cumulative reward
        const baseReward = timeStep * 0.5 + Math.sin(timeStep / 10) * 2;
        const noise = (Math.random() - 0.5) * 1;
        return Math.max(0, baseReward + noise);
    }

    generateConfidence(timeStep) {
        // Simulate increasing confidence with plateaus
        const baseConfidence = Math.min(95, 20 + (timeStep / 2));
        const noise = (Math.random() - 0.5) * 5;
        return Math.max(0, Math.min(100, baseConfidence + noise));
    }

    generateExploration(timeStep) {
        // Simulate decreasing exploration over time
        const baseExploration = Math.max(5, 30 * Math.exp(-timeStep / 100));
        return Math.max(0, Math.min(100, baseExploration));
    }

    updateLearningCharts() {
        const labels = this.learningData.losses.map((_, i) => i);
        
        // Update loss chart
        if (this.learningCharts.loss) {
            this.learningCharts.loss.data.labels = labels;
            this.learningCharts.loss.data.datasets[0].data = this.learningData.losses;
            this.learningCharts.loss.update('none');
        }
        
        // Update reward chart
        if (this.learningCharts.reward) {
            this.learningCharts.reward.data.labels = labels;
            this.learningCharts.reward.data.datasets[0].data = this.learningData.rewards;
            this.learningCharts.reward.update('none');
        }
        
        // Update confidence chart
        if (this.learningCharts.confidence) {
            this.learningCharts.confidence.data.labels = labels;
            this.learningCharts.confidence.data.datasets[0].data = this.learningData.confidence;
            this.learningCharts.confidence.update('none');
        }
        
        // Update exploration chart
        const currentExploration = this.learningData.exploration[this.learningData.exploration.length - 1] || 10;
        if (this.learningCharts.exploration) {
            this.learningCharts.exploration.data.datasets[0].data = [currentExploration, 100 - currentExploration];
            this.learningCharts.exploration.update('none');
        }
    }

    updateNeuralNetwork() {
        if (this.neuralNetworkViz) {
            const activation = Math.random();
            const weights = Array.from({length: 10}, () => Math.random());
            this.neuralNetworkViz.updateActivation(activation, weights);
        }
    }

    updateMemoryVisualization() {
        if (this.memoryViz) {
            const memorySize = Math.min(1000, this.currentEpoch * 5);
            const utilization = Math.min(100, (memorySize / 1000) * 100);
            this.memoryViz.updateMemory(memorySize, utilization);
            
            // Update memory stats
            document.getElementById('experiencesStored').textContent = memorySize;
            document.getElementById('memoryUtilization').textContent = Math.round(utilization) + '%';
            document.getElementById('memoryFill').style.width = utilization + '%';
            document.getElementById('replayFrequency').textContent = Math.round(Math.random() * 10) + '/sec';
        }
    }

    updateLearningEvents(timeStep, loss, reward, confidence) {
        // Add significant learning events
        if (timeStep % 10 === 0) {
            const eventType = this.determineLearningEvent(loss, reward, confidence);
            this.addLearningEvent(eventType.type, eventType.message, eventType.detail);
        }
    }

    determineLearningEvent(loss, reward, confidence) {
        const events = [
            {
                type: 'breakthrough',
                message: 'Learning breakthrough detected',
                detail: 'Model discovered new profitable pattern'
            },
            {
                type: 'adaptation',
                message: 'Strategy adaptation in progress',
                detail: 'Adjusting to new market conditions'
            },
            {
                type: 'optimization',
                message: 'Neural weights optimized',
                detail: 'Improved decision-making capacity'
            },
            {
                type: 'exploration',
                message: 'Exploring new strategy space',
                detail: 'Testing alternative approaches'
            }
        ];
        
        return events[Math.floor(Math.random() * events.length)];
    }

    addLearningEvent(type, message, detail) {
        const eventsFeed = document.getElementById('learningEventsFeed');
        const event = document.createElement('div');
        event.className = `event-item ${type}`;
        
        const icons = {
            system: 'fas fa-cog',
            breakthrough: 'fas fa-lightbulb',
            adaptation: 'fas fa-sync-alt',
            optimization: 'fas fa-chart-line',
            exploration: 'fas fa-search'
        };
        
        event.innerHTML = `
            <div class="event-icon">
                <i class="${icons[type] || 'fas fa-info'}"></i>
            </div>
            <div class="event-content">
                <span class="event-text">${message}</span>
                <span class="event-time">${detail}</span>
            </div>
        `;
        
        eventsFeed.insertBefore(event, eventsFeed.firstChild);
        
        // Keep only last 10 events
        while (eventsFeed.children.length > 10) {
            eventsFeed.removeChild(eventsFeed.lastChild);
        }
    }

    updateInfoDisplays(loss, reward, confidence, exploration) {
        // Update current values
        document.getElementById('currentLoss').textContent = loss.toFixed(4);
        document.getElementById('totalReward').textContent = Math.round(reward);
        document.getElementById('currentConfidenceValue').textContent = Math.round(confidence) + '%';
        document.getElementById('currentExploration').textContent = Math.round(exploration) + '%';
        document.getElementById('currentExploitation').textContent = Math.round(100 - exploration) + '%';
        
        // Update neural network info
        document.getElementById('activeNeurons').textContent = Math.round(20 + Math.random() * 30);
        document.getElementById('strongestConnection').textContent = (0.1 + Math.random() * 0.9).toFixed(2);
        
        const complexityLevels = ['Low', 'Medium', 'High', 'Very High'];
        const complexityIndex = Math.min(3, Math.floor(this.currentEpoch / 25));
        document.getElementById('networkComplexity').textContent = complexityLevels[complexityIndex];
        
        // Update trend indicators
        this.updateTrendIndicators(loss, reward, confidence);
    }

    updateTrendIndicators(loss, reward, confidence) {
        const lossTrend = document.getElementById('lossTrend');
        const rewardTrend = document.getElementById('rewardTrend');
        const confidenceTrend = document.getElementById('confidenceTrend');
        
        // Determine trends based on recent data
        const recentLosses = this.learningData.losses.slice(-5);
        const recentRewards = this.learningData.rewards.slice(-5);
        const recentConfidence = this.learningData.confidence.slice(-5);
        
        // Loss trend (decreasing is good)
        if (recentLosses.length >= 2) {
            const lossDirection = recentLosses[recentLosses.length - 1] < recentLosses[0];
            lossTrend.textContent = lossDirection ? 'Decreasing ↓' : 'Increasing ↑';
            lossTrend.className = lossDirection ? 'trend positive' : 'trend negative';
        }
        
        // Reward trend (increasing is good)
        if (recentRewards.length >= 2) {
            const rewardDirection = recentRewards[recentRewards.length - 1] > recentRewards[0];
            rewardTrend.textContent = rewardDirection ? 'Growing ↑' : 'Declining ↓';
            rewardTrend.className = rewardDirection ? 'trend positive' : 'trend negative';
        }
        
        // Confidence trend (increasing is good)
        if (recentConfidence.length >= 2) {
            const confidenceDirection = recentConfidence[recentConfidence.length - 1] > recentConfidence[0];
            confidenceTrend.textContent = confidenceDirection ? 'Improving ↑' : 'Declining ↓';
            confidenceTrend.className = confidenceDirection ? 'trend positive' : 'trend negative';
        }
    }

    resetLearning() {
        this.currentEpoch = 0;
        this.learningData = {
            confidence: [],
            losses: [],
            weights: [],
            decisions: [],
            rewards: [],
            exploration: [],
            memory: []
        };
        
        // Clear charts
        Object.values(this.learningCharts).forEach(chart => {
            if (chart) {
                chart.data.labels = [];
                chart.data.datasets.forEach(dataset => {
                    dataset.data = [];
                });
                chart.update();
            }
        });
        
        // Clear events feed
        const eventsFeed = document.getElementById('learningEventsFeed');
        eventsFeed.innerHTML = `
            <div class="event-item system">
                <div class="event-icon">
                    <i class="fas fa-play"></i>
                </div>
                <div class="event-content">
                    <span class="event-text">Learning system reset</span>
                    <span class="event-time">Ready to learn</span>
                </div>
            </div>
        `;
        
        this.addLearningEvent('system', 'Learning reset complete', 'Model weights randomized');
    }
}

// Neural Network Visualizer Class
class NeuralNetworkVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.neurons = [];
        this.connections = [];
        this.animationFrame = null;
    }

    initialize() {
        this.createNetwork();
        this.startAnimation();
    }

    createNetwork() {
        const layers = [4, 6, 4, 2]; // Input, Hidden1, Hidden2, Output
        const layerSpacing = this.canvas.width / (layers.length + 1);
        
        this.neurons = [];
        this.connections = [];
        
        // Create neurons
        layers.forEach((neuronCount, layerIndex) => {
            const x = layerSpacing * (layerIndex + 1);
            const neuronSpacing = this.canvas.height / (neuronCount + 1);
            
            for (let i = 0; i < neuronCount; i++) {
                const y = neuronSpacing * (i + 1);
                this.neurons.push({
                    x, y,
                    layer: layerIndex,
                    index: i,
                    activation: 0,
                    radius: 8
                });
            }
        });
        
        // Create connections
        for (let i = 0; i < layers.length - 1; i++) {
            const currentLayer = this.neurons.filter(n => n.layer === i);
            const nextLayer = this.neurons.filter(n => n.layer === i + 1);
            
            currentLayer.forEach(from => {
                nextLayer.forEach(to => {
                    this.connections.push({
                        from: from,
                        to: to,
                        weight: Math.random() * 2 - 1,
                        active: false
                    });
                });
            });
        }
    }

    updateActivation(globalActivation, weights) {
        // Update neuron activations
        this.neurons.forEach((neuron, index) => {
            if (neuron.layer === 0) {
                // Input layer - simulate market data
                neuron.activation = Math.random() * 0.8 + 0.1;
            } else {
                // Hidden and output layers
                neuron.activation = Math.max(0, Math.min(1, globalActivation + (Math.random() - 0.5) * 0.3));
            }
        });
        
        // Update connection weights
        this.connections.forEach((conn, index) => {
            if (index < weights.length) {
                conn.weight = weights[index] * 2 - 1; // Normalize to -1 to 1
                conn.active = Math.abs(conn.weight) > 0.5;
            }
        });
    }

    startAnimation() {
        const animate = () => {
            this.draw();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        this.connections.forEach(conn => {
            const opacity = Math.abs(conn.weight) * 0.7;
            const color = conn.weight > 0 ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
            const width = Math.abs(conn.weight) * 3 + 0.5;
            
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = width;
            this.ctx.beginPath();
            this.ctx.moveTo(conn.from.x, conn.from.y);
            this.ctx.lineTo(conn.to.x, conn.to.y);
            this.ctx.stroke();
        });
        
        // Draw neurons
        this.neurons.forEach(neuron => {
            const intensity = neuron.activation;
            const color = `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
            const borderColor = `rgba(59, 130, 246, ${0.8 + intensity * 0.2})`;
            
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Add activation pulse
            if (intensity > 0.7) {
                const pulseRadius = neuron.radius + Math.sin(Date.now() * 0.01) * 3;
                this.ctx.strokeStyle = `rgba(59, 130, 246, ${0.3})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(neuron.x, neuron.y, pulseRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
    }
}

// Memory Visualizer Class
class MemoryVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.memoryBlocks = [];
    }

    initialize() {
        this.createMemoryBlocks();
        this.startAnimation();
    }

    createMemoryBlocks() {
        const blockCount = 50;
        const blockWidth = this.canvas.width / blockCount;
        const blockHeight = this.canvas.height * 0.8;
        
        for (let i = 0; i < blockCount; i++) {
            this.memoryBlocks.push({
                x: i * blockWidth,
                y: this.canvas.height - blockHeight,
                width: blockWidth - 1,
                height: blockHeight,
                filled: false,
                importance: 0,
                age: 0
            });
        }
    }

    updateMemory(totalExperiences, utilization) {
        const filledBlocks = Math.floor((utilization / 100) * this.memoryBlocks.length);
        
        this.memoryBlocks.forEach((block, index) => {
            if (index < filledBlocks) {
                block.filled = true;
                block.importance = Math.random();
                block.age += 1;
            } else {
                block.filled = false;
                block.importance = 0;
                block.age = 0;
            }
        });
    }

    startAnimation() {
        const animate = () => {
            this.draw();
            requestAnimationFrame(animate);
        };
        animate();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.memoryBlocks.forEach(block => {
            if (block.filled) {
                const hue = 200 + block.importance * 60; // Blue to cyan based on importance
                const saturation = 70 + block.importance * 30;
                const lightness = 40 + block.importance * 20;
                const alpha = 0.6 + block.importance * 0.4;
                
                this.ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                this.ctx.fillRect(block.x, block.y, block.width, block.height);
                
                // Add replay indicator for high importance memories
                if (block.importance > 0.8 && Math.sin(Date.now() * 0.01 + block.x) > 0) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.fillRect(block.x, block.y, block.width, block.height);
                }
            } else {
                this.ctx.fillStyle = 'rgba(55, 65, 81, 0.3)';
                this.ctx.fillRect(block.x, block.y, block.width, block.height);
            }
        });
        
        // Draw memory labels
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = '10px monospace';
        this.ctx.fillText('Experience Memory Buffer', 5, 15);
        this.ctx.fillText('Low Importance', 5, this.canvas.height - 5);
        this.ctx.fillText('High Importance', this.canvas.width - 80, this.canvas.height - 5);
    }
}

// Export for use in main playground
window.LiveLearningVisualization = LiveLearningVisualization; 
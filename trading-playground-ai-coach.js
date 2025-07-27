/**
 * AI Trading Playground - AI Coach System
 * Intelligent coaching and real-time guidance for users
 */

class AICoach {
    constructor(playground) {
        this.playground = playground;
        this.isActive = true;
        this.coachingLevel = 'adaptive'; // beginner, intermediate, advanced, adaptive
        this.coachPersonality = 'friendly'; // friendly, professional, mentor, challenger
        this.insights = [];
        this.suggestions = [];
        this.userProgress = {
            level: 1,
            xp: 0,
            skillPoints: {
                technical: 0,
                risk: 0,
                psychology: 0,
                strategy: 0
            },
            weaknesses: [],
            strengths: []
        };
        
        this.init();
    }

    init() {
        this.createCoachPanel();
        this.startCoaching();
        this.analyzeUserBehavior();
    }

    createCoachPanel() {
        const coachPanel = document.createElement('div');
        coachPanel.className = 'ai-coach-panel glass-effect';
        coachPanel.id = 'aiCoachPanel';
        coachPanel.innerHTML = `
            <div class="coach-header">
                <div class="coach-avatar">
                    <div class="avatar-container">
                        <i class="fas fa-robot" id="coachAvatar"></i>
                        <div class="mood-indicator" id="coachMood"></div>
                    </div>
                    <div class="coach-info">
                        <span class="coach-name">AI Coach Alex</span>
                        <span class="coach-status" id="coachStatus">Ready to help</span>
                    </div>
                </div>
                <div class="coach-controls">
                    <button class="coach-settings-btn" id="coachSettingsBtn">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="coach-minimize-btn" id="coachMinimizeBtn">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
            </div>
            
            <div class="coach-content" id="coachContent">
                <!-- Real-time Insights -->
                <div class="coach-section insights-section">
                    <h4><i class="fas fa-lightbulb"></i> Real-time Insights</h4>
                    <div class="insights-container" id="insightsContainer">
                        <div class="insight-item welcome">
                            <div class="insight-icon">💡</div>
                            <div class="insight-text">
                                Welcome! I'm here to help you become a better trader. Let's start by analyzing your first strategy!
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Smart Suggestions -->
                <div class="coach-section suggestions-section">
                    <h4><i class="fas fa-magic"></i> Smart Suggestions</h4>
                    <div class="suggestions-container" id="suggestionsContainer">
                        <div class="suggestion-item">
                            <div class="suggestion-priority high">!</div>
                            <div class="suggestion-content">
                                <div class="suggestion-title">Try Different Timeframes</div>
                                <div class="suggestion-desc">Experiment with various timeframes to find what works best for your strategy.</div>
                                <button class="suggestion-action" onclick="aiCoach.applySuggestion('timeframes')">
                                    Apply <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Progress Tracker -->
                <div class="coach-section progress-section">
                    <h4><i class="fas fa-chart-line"></i> Your Progress</h4>
                    <div class="progress-container">
                        <div class="level-info">
                            <span class="level-label">Level <span id="userLevel">1</span></span>
                            <span class="xp-label"><span id="userXP">0</span> / <span id="nextLevelXP">100</span> XP</span>
                        </div>
                        <div class="xp-bar">
                            <div class="xp-fill" id="xpFill" style="width: 0%"></div>
                        </div>
                        <div class="skill-points">
                            <div class="skill-item">
                                <span class="skill-label">Technical</span>
                                <div class="skill-bar">
                                    <div class="skill-fill technical" id="technicalSkill" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="skill-item">
                                <span class="skill-label">Risk Mgmt</span>
                                <div class="skill-bar">
                                    <div class="skill-fill risk" id="riskSkill" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="skill-item">
                                <span class="skill-label">Psychology</span>
                                <div class="skill-bar">
                                    <div class="skill-fill psychology" id="psychologySkill" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="skill-item">
                                <span class="skill-label">Strategy</span>
                                <div class="skill-bar">
                                    <div class="skill-fill strategy" id="strategySkill" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Learning Path -->
                <div class="coach-section learning-path-section">
                    <h4><i class="fas fa-route"></i> Recommended Learning Path</h4>
                    <div class="learning-path" id="learningPath">
                        <div class="path-step active">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <div class="step-title">Master Basic Indicators</div>
                                <div class="step-progress">In Progress</div>
                            </div>
                        </div>
                        <div class="path-step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <div class="step-title">Risk Management</div>
                                <div class="step-progress">Not Started</div>
                            </div>
                        </div>
                        <div class="path-step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <div class="step-title">Advanced Strategies</div>
                                <div class="step-progress">Locked</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="coach-section actions-section">
                    <h4><i class="fas fa-bolt"></i> Quick Actions</h4>
                    <div class="quick-actions">
                        <button class="action-btn" onclick="aiCoach.analyzeCurrentStrategy()">
                            <i class="fas fa-search"></i>
                            Analyze Strategy
                        </button>
                        <button class="action-btn" onclick="aiCoach.suggestOptimizations()">
                            <i class="fas fa-magic"></i>
                            Optimize Settings
                        </button>
                        <button class="action-btn" onclick="aiCoach.explainMarketCondition()">
                            <i class="fas fa-info-circle"></i>
                            Market Analysis
                        </button>
                        <button class="action-btn" onclick="aiCoach.generatePersonalizedChallenge()">
                            <i class="fas fa-trophy"></i>
                            New Challenge
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Coach Settings Modal -->
            <div class="coach-settings-modal" id="coachSettingsModal" style="display: none;">
                <div class="settings-content">
                    <h4>AI Coach Settings</h4>
                    <div class="setting-group">
                        <label>Coaching Level</label>
                        <select id="coachingLevelSelect">
                            <option value="beginner">Beginner Friendly</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="adaptive" selected>Adaptive (Recommended)</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label>Coach Personality</label>
                        <select id="coachPersonalitySelect">
                            <option value="friendly" selected>Friendly & Encouraging</option>
                            <option value="professional">Professional</option>
                            <option value="mentor">Wise Mentor</option>
                            <option value="challenger">Challenging Coach</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label>Insight Frequency</label>
                        <select id="insightFrequencySelect">
                            <option value="low">Minimal</option>
                            <option value="medium" selected>Balanced</option>
                            <option value="high">Frequent</option>
                        </select>
                    </div>
                    <div class="settings-actions">
                        <button class="settings-save-btn" onclick="aiCoach.saveSettings()">Save</button>
                        <button class="settings-cancel-btn" onclick="aiCoach.closeSettings()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(coachPanel);
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('coachSettingsBtn').addEventListener('click', () => {
            document.getElementById('coachSettingsModal').style.display = 'flex';
        });
        
        document.getElementById('coachMinimizeBtn').addEventListener('click', () => {
            document.getElementById('aiCoachPanel').classList.toggle('minimized');
        });
    }

    startCoaching() {
        // Start providing real-time coaching
        setInterval(() => {
            this.analyzeCurrentSituation();
            this.updateProgress();
            this.generateInsights();
        }, 5000);
        
        // Welcome message
        setTimeout(() => {
            this.addInsight('greeting', 'Welcome to your AI Trading Journey! 🚀', 
                'I\'ll be monitoring your progress and providing personalized guidance. Let\'s start by selecting an AI agent to begin trading!');
        }, 2000);
    }

    analyzeUserBehavior() {
        // Monitor user interactions and learning patterns
        document.addEventListener('click', (e) => {
            this.trackUserAction(e.target);
        });
        
        // Monitor strategy changes
        if (this.playground) {
            // Hook into playground events to track strategy usage
            this.monitorStrategyUsage();
        }
    }

    trackUserAction(element) {
        const actionType = this.categorizeAction(element);
        if (actionType) {
            this.awardXP(actionType);
            this.updateSkillPoints(actionType);
        }
    }

    categorizeAction(element) {
        const className = element.className;
        const id = element.id;
        
        if (className.includes('agent-card') || id.includes('agent')) {
            return 'strategy';
        } else if (className.includes('timeframe') || id.includes('timeframe')) {
            return 'technical';
        } else if (className.includes('reset') || id.includes('reset')) {
            return 'risk';
        } else if (className.includes('tutorial') || id.includes('help')) {
            return 'psychology';
        }
        
        return null;
    }

    awardXP(actionType) {
        const xpRewards = {
            strategy: 10,
            technical: 15,
            risk: 20,
            psychology: 5
        };
        
        const xp = xpRewards[actionType] || 5;
        this.userProgress.xp += xp;
        this.userProgress.skillPoints[actionType] += xp;
        
        this.checkLevelUp();
        this.showXPGain(xp, actionType);
    }

    checkLevelUp() {
        const requiredXP = this.userProgress.level * 100;
        if (this.userProgress.xp >= requiredXP) {
            this.userProgress.level++;
            this.userProgress.xp = 0;
            this.showLevelUp();
        }
    }

    showXPGain(xp, type) {
        const notification = document.createElement('div');
        notification.className = 'xp-notification';
        notification.innerHTML = `
            <div class="xp-icon">⭐</div>
            <div class="xp-text">+${xp} ${type.toUpperCase()} XP</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showLevelUp() {
        const levelUpModal = document.createElement('div');
        levelUpModal.className = 'level-up-modal';
        levelUpModal.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">🎉</div>
                <h3>Level Up!</h3>
                <p>Congratulations! You've reached level ${this.userProgress.level}!</p>
                <p>New features and challenges are now available.</p>
                <button onclick="this.parentElement.parentElement.remove()">Continue</button>
            </div>
        `;
        
        document.body.appendChild(levelUpModal);
        
        setTimeout(() => {
            levelUpModal.classList.add('show');
        }, 100);
    }

    analyzeCurrentSituation() {
        // Analyze current trading situation and provide context-aware insights
        const currentAgent = this.getCurrentAgent();
        const currentMarketCondition = this.analyzeMarketCondition();
        const recentPerformance = this.getRecentPerformance();
        
        if (currentAgent && recentPerformance) {
            this.generateContextualInsight(currentAgent, currentMarketCondition, recentPerformance);
        }
    }

    getCurrentAgent() {
        const activeAgent = document.querySelector('.agent-card.active');
        return activeAgent ? activeAgent.dataset.agent : null;
    }

    analyzeMarketCondition() {
        // Simulate market condition analysis
        const conditions = ['trending', 'sideways', 'volatile', 'calm'];
        return conditions[Math.floor(Math.random() * conditions.length)];
    }

    getRecentPerformance() {
        // Get recent performance data from playground
        const portfolioValue = document.getElementById('portfolioValue')?.textContent || '$10,000';
        const totalReturn = document.getElementById('totalReturn')?.textContent || '+0.00%';
        
        return {
            value: portfolioValue,
            return: totalReturn,
            trend: parseFloat(totalReturn.replace(/[+%]/g, '')) > 0 ? 'positive' : 'negative'
        };
    }

    generateContextualInsight(agent, market, performance) {
        const insights = this.getContextualInsights(agent, market, performance);
        const randomInsight = insights[Math.floor(Math.random() * insights.length)];
        
        if (randomInsight && Math.random() < 0.3) { // 30% chance to show insight
            this.addInsight(randomInsight.type, randomInsight.title, randomInsight.message);
        }
    }

    getContextualInsights(agent, market, performance) {
        const insightTemplates = {
            'sma': {
                trending: [
                    {
                        type: 'strategy',
                        title: 'SMA Strategy in Trending Market',
                        message: 'Simple Moving Average works great in trending markets! Your strategy should perform well in current conditions.'
                    }
                ],
                sideways: [
                    {
                        type: 'warning',
                        title: 'Sideways Market Challenge',
                        message: 'SMA strategies can struggle in sideways markets. Consider adding filters or switching to RSI for better results.'
                    }
                ]
            },
            'rsi': {
                volatile: [
                    {
                        type: 'opportunity',
                        title: 'RSI Excels in Volatility',
                        message: 'Perfect timing! RSI strategies perform exceptionally well in volatile markets like this one.'
                    }
                ]
            }
        };
        
        return insightTemplates[agent]?.[market] || [
            {
                type: 'general',
                title: 'Keep Learning!',
                message: 'Every trade is a learning opportunity. Focus on understanding why your strategy makes certain decisions.'
            }
        ];
    }

    addInsight(type, title, message) {
        const insightsContainer = document.getElementById('insightsContainer');
        const insight = document.createElement('div');
        insight.className = `insight-item ${type}`;
        
        const icons = {
            greeting: '👋',
            strategy: '🎯',
            warning: '⚠️',
            opportunity: '💎',
            general: '💡',
            achievement: '🏆'
        };
        
        insight.innerHTML = `
            <div class="insight-icon">${icons[type] || '💡'}</div>
            <div class="insight-content">
                <div class="insight-title">${title}</div>
                <div class="insight-text">${message}</div>
                <div class="insight-time">${new Date().toLocaleTimeString()}</div>
            </div>
            <button class="insight-dismiss" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        insightsContainer.insertBefore(insight, insightsContainer.firstChild);
        
        // Keep only last 5 insights
        while (insightsContainer.children.length > 5) {
            insightsContainer.removeChild(insightsContainer.lastChild);
        }
        
        // Animate in
        setTimeout(() => {
            insight.classList.add('show');
        }, 100);
    }

    updateProgress() {
        // Update progress displays
        document.getElementById('userLevel').textContent = this.userProgress.level;
        document.getElementById('userXP').textContent = this.userProgress.xp;
        document.getElementById('nextLevelXP').textContent = this.userProgress.level * 100;
        
        const xpPercent = (this.userProgress.xp / (this.userProgress.level * 100)) * 100;
        document.getElementById('xpFill').style.width = xpPercent + '%';
        
        // Update skill bars
        const maxSkill = Math.max(...Object.values(this.userProgress.skillPoints));
        Object.entries(this.userProgress.skillPoints).forEach(([skill, points]) => {
            const percent = maxSkill > 0 ? (points / maxSkill) * 100 : 0;
            document.getElementById(skill + 'Skill').style.width = Math.min(percent, 100) + '%';
        });
    }

    // Quick Action Methods
    analyzeCurrentStrategy() {
        const agent = this.getCurrentAgent();
        if (agent) {
            this.addInsight('strategy', 'Strategy Analysis', 
                `Your ${agent.toUpperCase()} strategy is ${this.getStrategyAnalysis(agent)}. Consider ${this.getStrategyRecommendation(agent)}.`);
        } else {
            this.addInsight('warning', 'No Strategy Selected', 
                'Please select an AI agent first to analyze your trading strategy.');
        }
    }

    getStrategyAnalysis(agent) {
        const analyses = {
            sma: 'well-suited for trending markets but may lag in volatile conditions',
            rsi: 'excellent for identifying overbought/oversold conditions',
            ml: 'adaptive and learning from market patterns',
            custom: 'using your personalized trading logic'
        };
        return analyses[agent] || 'performing according to its design';
    }

    getStrategyRecommendation(agent) {
        const recommendations = {
            sma: 'adding a volatility filter to reduce false signals',
            rsi: 'combining with trend indicators for better entries',
            ml: 'providing more training data for improved accuracy',
            custom: 'backtesting with different parameters'
        };
        return recommendations[agent] || 'monitoring its performance closely';
    }

    suggestOptimizations() {
        const suggestions = [
            'Try adjusting your timeframe for better signal quality',
            'Consider implementing stop-loss levels for risk management',
            'Experiment with different position sizes',
            'Add multiple indicators for confirmation signals',
            'Test your strategy on different market conditions'
        ];
        
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        this.addInsight('opportunity', 'Optimization Suggestion', randomSuggestion);
    }

    explainMarketCondition() {
        const condition = this.analyzeMarketCondition();
        const explanations = {
            trending: 'The market is showing clear directional movement. Trend-following strategies like SMA work well.',
            sideways: 'The market is moving in a range. Mean-reversion strategies like RSI might be more effective.',
            volatile: 'High volatility presents both opportunities and risks. Use smaller position sizes.',
            calm: 'Low volatility markets favor breakout strategies. Wait for clear signals.'
        };
        
        this.addInsight('general', `Market Condition: ${condition.toUpperCase()}`, explanations[condition]);
    }

    generatePersonalizedChallenge() {
        const challenges = [
            'Achieve 3 consecutive profitable trades',
            'Try a new AI agent you haven\'t used yet',
            'Optimize your strategy for different timeframes',
            'Complete a full trading session without losses > 5%',
            'Test your strategy on historical data from a different year'
        ];
        
        const challenge = challenges[Math.floor(Math.random() * challenges.length)];
        this.addInsight('achievement', 'New Challenge!', `🎯 ${challenge}. Complete this to earn bonus XP!`);
    }

    applySuggestion(type) {
        switch(type) {
            case 'timeframes':
                this.addInsight('strategy', 'Timeframe Tip', 
                    'Try switching between 1m, 5m, 15m, and 1h timeframes to see how your strategy performs differently!');
                break;
            default:
                this.addInsight('general', 'Suggestion Applied', 'Great choice! Keep experimenting to improve your skills.');
        }
    }

    saveSettings() {
        this.coachingLevel = document.getElementById('coachingLevelSelect').value;
        this.coachPersonality = document.getElementById('coachPersonalitySelect').value;
        this.closeSettings();
        
        this.addInsight('general', 'Settings Updated', 
            `I'll now provide ${this.coachingLevel} level guidance with a ${this.coachPersonality} approach!`);
    }

    closeSettings() {
        document.getElementById('coachSettingsModal').style.display = 'none';
    }

    generateInsights() {
        // Periodically generate helpful insights based on user behavior
        if (Math.random() < 0.1) { // 10% chance every cycle
            const randomInsights = [
                {
                    type: 'general',
                    title: 'Pro Tip',
                    message: 'The best traders combine multiple indicators for confirmation signals.'
                },
                {
                    type: 'psychology',
                    title: 'Trading Psychology',
                    message: 'Remember: losses are part of learning. Focus on understanding why they happened.'
                },
                {
                    type: 'strategy',
                    title: 'Strategy Development',
                    message: 'Try backtesting your strategies on different market conditions to validate their robustness.'
                }
            ];
            
            const insight = randomInsights[Math.floor(Math.random() * randomInsights.length)];
            this.addInsight(insight.type, insight.title, insight.message);
        }
    }
}

// Export for use in main playground
window.AICoach = AICoach; 
/**
 * AI Trading Playground - Interactive Tutorial System
 * Guide users from zero to hero with progressive learning
 */

class TutorialSystem {
    constructor(playground) {
        this.playground = playground;
        this.currentStep = 0;
        this.currentLesson = null;
        this.userProgress = {
            level: 1,
            xp: 0,
            completedLessons: [],
            achievements: [],
            skillPoints: {
                technical_analysis: 0,
                risk_management: 0,
                strategy_development: 0,
                market_psychology: 0
            }
        };
        this.isActive = false;
        this.overlay = null;
        
        this.init();
    }

    init() {
        this.createTutorialUI();
        this.loadUserProgress();
        
        // Show welcome tutorial for new users
        if (this.userProgress.completedLessons.length === 0) {
            setTimeout(() => this.startWelcomeTutorial(), 2000);
        }
    }

    createTutorialUI() {
        // Add tutorial button to header
        const headerControls = document.querySelector('.header-controls');
        const tutorialBtn = document.createElement('button');
        tutorialBtn.className = 'tutorial-btn glass-effect';
        tutorialBtn.innerHTML = `
            <i class="fas fa-graduation-cap"></i>
            <span>Learn</span>
        `;
        tutorialBtn.addEventListener('click', () => this.showLearningCenter());
        headerControls.insertBefore(tutorialBtn, headerControls.firstChild);

        // Add progress indicator
        const progressIndicator = document.createElement('div');
        progressIndicator.className = 'user-progress glass-effect';
        progressIndicator.innerHTML = `
            <div class="progress-content">
                <div class="user-level">
                    <span class="level-badge">Level ${this.userProgress.level}</span>
                    <div class="xp-bar">
                        <div class="xp-fill" style="width: ${(this.userProgress.xp % 1000) / 10}%"></div>
                    </div>
                    <span class="xp-text">${this.userProgress.xp % 1000}/1000 XP</span>
                </div>
            </div>
        `;
        document.querySelector('.playground-header .header-content').appendChild(progressIndicator);

        // Create learning center modal
        this.createLearningCenter();
        
        // Create tutorial overlay system
        this.createTutorialOverlay();
    }

    createLearningCenter() {
        const learningCenter = document.createElement('div');
        learningCenter.className = 'modal-overlay';
        learningCenter.id = 'learningCenter';
        learningCenter.innerHTML = `
            <div class="learning-center-modal glass-effect">
                <div class="modal-header">
                    <h2>🎓 AI Trading Academy</h2>
                    <button class="modal-close" id="closeLearningCenter">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="learning-content">
                    <!-- Navigation Tabs -->
                    <div class="learning-tabs">
                        <button class="tab-btn active" data-tab="lessons">
                            <i class="fas fa-book"></i>
                            Lessons
                        </button>
                        <button class="tab-btn" data-tab="challenges">
                            <i class="fas fa-trophy"></i>
                            Challenges
                        </button>
                        <button class="tab-btn" data-tab="strategies">
                            <i class="fas fa-brain"></i>
                            Strategies
                        </button>
                        <button class="tab-btn" data-tab="achievements">
                            <i class="fas fa-medal"></i>
                            Achievements
                        </button>
                    </div>
                    
                    <!-- Lessons Tab -->
                    <div class="tab-content active" id="lessons-tab">
                        <div class="lessons-grid">
                            <!-- Beginner Track -->
                            <div class="lesson-track">
                                <h3 class="track-title">
                                    <i class="fas fa-seedling text-green-400"></i>
                                    Beginner Track
                                </h3>
                                <div class="lessons-list" id="beginnerLessons"></div>
                            </div>
                            
                            <!-- Intermediate Track -->
                            <div class="lesson-track">
                                <h3 class="track-title">
                                    <i class="fas fa-chart-line text-blue-400"></i>
                                    Intermediate Track
                                </h3>
                                <div class="lessons-list" id="intermediateLessons"></div>
                            </div>
                            
                            <!-- Advanced Track -->
                            <div class="lesson-track">
                                <h3 class="track-title">
                                    <i class="fas fa-rocket text-purple-400"></i>
                                    Advanced Track
                                </h3>
                                <div class="lessons-list" id="advancedLessons"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Challenges Tab -->
                    <div class="tab-content" id="challenges-tab">
                        <div class="challenges-grid" id="challengesGrid"></div>
                    </div>
                    
                    <!-- Strategies Tab -->
                    <div class="tab-content" id="strategies-tab">
                        <div class="strategies-library" id="strategiesLibrary"></div>
                    </div>
                    
                    <!-- Achievements Tab -->
                    <div class="tab-content" id="achievements-tab">
                        <div class="achievements-showcase" id="achievementsShowcase"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(learningCenter);
        
        // Add event listeners
        document.getElementById('closeLearningCenter').addEventListener('click', () => {
            learningCenter.classList.remove('active');
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Close on background click
        learningCenter.addEventListener('click', (e) => {
            if (e.target === learningCenter) {
                learningCenter.classList.remove('active');
            }
        });
        
        this.populateLearningContent();
    }

    createTutorialOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-spotlight"></div>
            <div class="tutorial-tooltip">
                <div class="tooltip-content">
                    <div class="tooltip-header">
                        <span class="step-indicator">Step 1 of 5</span>
                        <button class="skip-tutorial">Skip</button>
                    </div>
                    <div class="tooltip-body">
                        <h4 class="tooltip-title">Welcome to AI Trading!</h4>
                        <p class="tooltip-text">Let's start your journey to becoming an AI trading expert.</p>
                    </div>
                    <div class="tooltip-actions">
                        <button class="btn-secondary" id="prevTutorialStep">Previous</button>
                        <button class="btn-primary" id="nextTutorialStep">Next</button>
                    </div>
                </div>
                <div class="tooltip-arrow"></div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        
        // Add event listeners
        this.overlay.querySelector('.skip-tutorial').addEventListener('click', () => this.endTutorial());
        this.overlay.querySelector('#prevTutorialStep').addEventListener('click', () => this.previousStep());
        this.overlay.querySelector('#nextTutorialStep').addEventListener('click', () => this.nextStep());
    }

    populateLearningContent() {
        this.populateLessons();
        this.populateChallenges();
        this.populateStrategies();
        this.populateAchievements();
    }

    populateLessons() {
        const lessons = {
            beginner: [
                {
                    id: 'basics-1',
                    title: 'What is Algorithmic Trading?',
                    description: 'Learn the fundamentals of automated trading systems',
                    duration: '10 min',
                    xp: 100,
                    skillType: 'technical_analysis',
                    completed: false
                },
                {
                    id: 'basics-2',
                    title: 'Understanding Market Data',
                    description: 'Price, volume, and candlestick patterns',
                    duration: '15 min',
                    xp: 150,
                    skillType: 'technical_analysis',
                    completed: false
                },
                {
                    id: 'basics-3',
                    title: 'Your First Trading Agent',
                    description: 'Create and configure a simple moving average strategy',
                    duration: '20 min',
                    xp: 200,
                    skillType: 'strategy_development',
                    completed: false
                },
                {
                    id: 'basics-4',
                    title: 'Risk Management Basics',
                    description: 'Position sizing and stop losses',
                    duration: '15 min',
                    xp: 150,
                    skillType: 'risk_management',
                    completed: false
                }
            ],
            intermediate: [
                {
                    id: 'inter-1',
                    title: 'Technical Indicators Deep Dive',
                    description: 'RSI, MACD, Bollinger Bands and more',
                    duration: '25 min',
                    xp: 250,
                    skillType: 'technical_analysis',
                    completed: false
                },
                {
                    id: 'inter-2',
                    title: 'Backtesting Strategies',
                    description: 'Test your strategies on historical data',
                    duration: '30 min',
                    xp: 300,
                    skillType: 'strategy_development',
                    completed: false
                },
                {
                    id: 'inter-3',
                    title: 'Market Psychology',
                    description: 'Understanding fear, greed, and market cycles',
                    duration: '20 min',
                    xp: 200,
                    skillType: 'market_psychology',
                    completed: false
                },
                {
                    id: 'inter-4',
                    title: 'Portfolio Optimization',
                    description: 'Diversification and correlation analysis',
                    duration: '25 min',
                    xp: 250,
                    skillType: 'risk_management',
                    completed: false
                }
            ],
            advanced: [
                {
                    id: 'adv-1',
                    title: 'Machine Learning for Trading',
                    description: 'Neural networks and deep reinforcement learning',
                    duration: '45 min',
                    xp: 500,
                    skillType: 'strategy_development',
                    completed: false
                },
                {
                    id: 'adv-2',
                    title: 'Multi-Asset Strategies',
                    description: 'Cross-market arbitrage and correlation trading',
                    duration: '40 min',
                    xp: 400,
                    skillType: 'strategy_development',
                    completed: false
                },
                {
                    id: 'adv-3',
                    title: 'High-Frequency Trading',
                    description: 'Latency optimization and market microstructure',
                    duration: '35 min',
                    xp: 350,
                    skillType: 'technical_analysis',
                    completed: false
                },
                {
                    id: 'adv-4',
                    title: 'Risk Models & VaR',
                    description: 'Advanced risk measurement and management',
                    duration: '30 min',
                    xp: 300,
                    skillType: 'risk_management',
                    completed: false
                }
            ]
        };

        // Populate each track
        Object.entries(lessons).forEach(([level, lessonList]) => {
            const container = document.getElementById(`${level}Lessons`);
            lessonList.forEach(lesson => {
                const isCompleted = this.userProgress.completedLessons.includes(lesson.id);
                const isLocked = this.shouldLockLesson(lesson);
                
                const lessonCard = document.createElement('div');
                lessonCard.className = `lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
                lessonCard.innerHTML = `
                    <div class="lesson-icon">
                        ${isCompleted ? '<i class="fas fa-check-circle text-green-400"></i>' : 
                          isLocked ? '<i class="fas fa-lock text-gray-400"></i>' : 
                          '<i class="fas fa-play-circle text-blue-400"></i>'}
                    </div>
                    <div class="lesson-content">
                        <h4 class="lesson-title">${lesson.title}</h4>
                        <p class="lesson-description">${lesson.description}</p>
                        <div class="lesson-meta">
                            <span class="duration">
                                <i class="fas fa-clock"></i>
                                ${lesson.duration}
                            </span>
                            <span class="xp-reward">
                                <i class="fas fa-star"></i>
                                ${lesson.xp} XP
                            </span>
                            <span class="skill-type skill-${lesson.skillType}">
                                ${lesson.skillType.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                    <button class="start-lesson-btn ${isLocked ? 'disabled' : ''}" 
                            ${isLocked ? 'disabled' : ''} 
                            data-lesson="${lesson.id}">
                        ${isCompleted ? 'Review' : isLocked ? 'Locked' : 'Start'}
                    </button>
                `;
                
                if (!isLocked) {
                    lessonCard.querySelector('.start-lesson-btn').addEventListener('click', () => {
                        this.startLesson(lesson);
                    });
                }
                
                container.appendChild(lessonCard);
            });
        });
    }

    populateChallenges() {
        const challenges = [
            {
                id: 'challenge-1',
                title: 'First Profitable Trade',
                description: 'Make your first profitable trade using any strategy',
                difficulty: 'Easy',
                reward: '200 XP + Beginner Trader Badge',
                requirements: ['Complete Basics Track'],
                progress: 0,
                target: 1
            },
            {
                id: 'challenge-2',
                title: 'Bear Market Survivor',
                description: 'Maintain positive returns during a 30% market decline',
                difficulty: 'Medium',
                reward: '500 XP + Bear Market Badge',
                requirements: ['Level 3', 'Risk Management Basics'],
                progress: 0,
                target: 1
            },
            {
                id: 'challenge-3',
                title: 'Consistent Performer',
                description: 'Achieve positive returns for 5 consecutive months',
                difficulty: 'Hard',
                reward: '1000 XP + Consistency Master Badge',
                requirements: ['Level 5', 'Portfolio Optimization'],
                progress: 0,
                target: 5
            },
            {
                id: 'challenge-4',
                title: 'Strategy Creator',
                description: 'Design and backtest a custom trading strategy',
                difficulty: 'Expert',
                reward: '1500 XP + Innovation Badge',
                requirements: ['Level 7', 'ML for Trading'],
                progress: 0,
                target: 1
            }
        ];

        const container = document.getElementById('challengesGrid');
        challenges.forEach(challenge => {
            const isUnlocked = this.isChallengeUnlocked(challenge);
            const isCompleted = this.userProgress.achievements.some(a => a.id === challenge.id);
            
            const challengeCard = document.createElement('div');
            challengeCard.className = `challenge-card ${isCompleted ? 'completed' : ''} ${!isUnlocked ? 'locked' : ''}`;
            challengeCard.innerHTML = `
                <div class="challenge-header">
                    <div class="challenge-difficulty difficulty-${challenge.difficulty.toLowerCase()}">
                        ${challenge.difficulty}
                    </div>
                    <div class="challenge-status">
                        ${isCompleted ? '<i class="fas fa-trophy text-yellow-400"></i>' : 
                          !isUnlocked ? '<i class="fas fa-lock text-gray-400"></i>' : 
                          '<i class="fas fa-target text-blue-400"></i>'}
                    </div>
                </div>
                <div class="challenge-content">
                    <h4 class="challenge-title">${challenge.title}</h4>
                    <p class="challenge-description">${challenge.description}</p>
                    <div class="challenge-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(challenge.progress / challenge.target) * 100}%"></div>
                        </div>
                        <span class="progress-text">${challenge.progress}/${challenge.target}</span>
                    </div>
                    <div class="challenge-reward">
                        <i class="fas fa-gift"></i>
                        ${challenge.reward}
                    </div>
                    <div class="challenge-requirements">
                        <small>Requirements:</small>
                        <ul>
                            ${challenge.requirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
            
            container.appendChild(challengeCard);
        });
    }

    populateStrategies() {
        const strategies = [
            {
                id: 'sma-crossover',
                name: 'Moving Average Crossover',
                category: 'Trend Following',
                complexity: 'Beginner',
                description: 'Buy when fast MA crosses above slow MA, sell when it crosses below',
                winRate: '65%',
                sharpeRatio: '1.2',
                maxDrawdown: '15%',
                code: this.getSampleStrategyCode('sma')
            },
            {
                id: 'rsi-mean-reversion',
                name: 'RSI Mean Reversion',
                category: 'Mean Reversion',
                complexity: 'Intermediate',
                description: 'Buy oversold conditions (RSI < 30), sell overbought (RSI > 70)',
                winRate: '58%',
                sharpeRatio: '0.9',
                maxDrawdown: '12%',
                code: this.getSampleStrategyCode('rsi')
            },
            {
                id: 'bollinger-squeeze',
                name: 'Bollinger Band Squeeze',
                category: 'Volatility',
                complexity: 'Intermediate',
                description: 'Trade breakouts from low volatility periods',
                winRate: '62%',
                sharpeRatio: '1.4',
                maxDrawdown: '18%',
                code: this.getSampleStrategyCode('bollinger')
            },
            {
                id: 'ml-lstm',
                name: 'LSTM Price Prediction',
                category: 'Machine Learning',
                complexity: 'Advanced',
                description: 'Use LSTM neural networks to predict price movements',
                winRate: '72%',
                sharpeRatio: '1.8',
                maxDrawdown: '22%',
                code: this.getSampleStrategyCode('lstm')
            }
        ];

        const container = document.getElementById('strategiesLibrary');
        strategies.forEach(strategy => {
            const strategyCard = document.createElement('div');
            strategyCard.className = 'strategy-card';
            strategyCard.innerHTML = `
                <div class="strategy-header">
                    <h4 class="strategy-name">${strategy.name}</h4>
                    <span class="strategy-complexity complexity-${strategy.complexity.toLowerCase()}">
                        ${strategy.complexity}
                    </span>
                </div>
                <div class="strategy-category">${strategy.category}</div>
                <p class="strategy-description">${strategy.description}</p>
                <div class="strategy-metrics">
                    <div class="metric">
                        <span class="metric-label">Win Rate</span>
                        <span class="metric-value">${strategy.winRate}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Sharpe</span>
                        <span class="metric-value">${strategy.sharpeRatio}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Max DD</span>
                        <span class="metric-value">${strategy.maxDrawdown}</span>
                    </div>
                </div>
                <div class="strategy-actions">
                    <button class="btn-secondary view-code-btn" data-strategy="${strategy.id}">
                        <i class="fas fa-code"></i>
                        View Code
                    </button>
                    <button class="btn-primary implement-btn" data-strategy="${strategy.id}">
                        <i class="fas fa-play"></i>
                        Try Strategy
                    </button>
                </div>
            `;
            
            // Add event listeners
            strategyCard.querySelector('.view-code-btn').addEventListener('click', () => {
                this.showStrategyCode(strategy);
            });
            
            strategyCard.querySelector('.implement-btn').addEventListener('click', () => {
                this.implementStrategy(strategy);
            });
            
            container.appendChild(strategyCard);
        });
    }

    populateAchievements() {
        const achievements = [
            {
                id: 'first-trade',
                name: 'First Steps',
                description: 'Complete your first trade',
                icon: 'fas fa-baby',
                rarity: 'common',
                earned: false,
                earnedDate: null
            },
            {
                id: 'profitable-week',
                name: 'Weekly Winner',
                description: 'Achieve positive returns for a full week',
                icon: 'fas fa-chart-line',
                rarity: 'common',
                earned: false,
                earnedDate: null
            },
            {
                id: 'bear-survivor',
                name: 'Bear Market Survivor',
                description: 'Maintain profits during market crash',
                icon: 'fas fa-shield-alt',
                rarity: 'rare',
                earned: false,
                earnedDate: null
            },
            {
                id: 'strategy-master',
                name: 'Strategy Master',
                description: 'Master all four agent types',
                icon: 'fas fa-brain',
                rarity: 'epic',
                earned: false,
                earnedDate: null
            },
            {
                id: 'millionaire',
                name: 'Millionaire Trader',
                description: 'Grow portfolio to $1,000,000',
                icon: 'fas fa-crown',
                rarity: 'legendary',
                earned: false,
                earnedDate: null
            }
        ];

        const container = document.getElementById('achievementsShowcase');
        
        // Group by rarity
        const rarityGroups = {};
        achievements.forEach(achievement => {
            if (!rarityGroups[achievement.rarity]) {
                rarityGroups[achievement.rarity] = [];
            }
            rarityGroups[achievement.rarity].push(achievement);
        });

        Object.entries(rarityGroups).forEach(([rarity, achievementList]) => {
            const raritySection = document.createElement('div');
            raritySection.className = 'achievements-rarity-section';
            raritySection.innerHTML = `
                <h4 class="rarity-title rarity-${rarity}">${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Achievements</h4>
                <div class="achievements-grid"></div>
            `;
            
            const grid = raritySection.querySelector('.achievements-grid');
            achievementList.forEach(achievement => {
                const isEarned = this.userProgress.achievements.some(a => a.id === achievement.id);
                
                const achievementCard = document.createElement('div');
                achievementCard.className = `achievement-card ${isEarned ? 'earned' : 'locked'} rarity-${achievement.rarity}`;
                achievementCard.innerHTML = `
                    <div class="achievement-icon">
                        <i class="${achievement.icon}"></i>
                    </div>
                    <div class="achievement-content">
                        <h5 class="achievement-name">${achievement.name}</h5>
                        <p class="achievement-description">${achievement.description}</p>
                        ${isEarned ? `<div class="earned-date">Earned: ${achievement.earnedDate || 'Recently'}</div>` : ''}
                    </div>
                `;
                
                grid.appendChild(achievementCard);
            });
            
            container.appendChild(raritySection);
        });
    }

    showLearningCenter() {
        document.getElementById('learningCenter').classList.add('active');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    startWelcomeTutorial() {
        this.currentLesson = {
            id: 'welcome',
            steps: [
                {
                    target: '.logo-section',
                    title: 'Welcome to AI Trading Playground!',
                    text: 'This is your gateway to learning algorithmic trading. Let\'s take a quick tour!',
                    position: 'bottom'
                },
                {
                    target: '.agent-panel',
                    title: 'AI Trading Agents',
                    text: 'Choose from different AI agents, each with unique trading strategies. Start with Simple Moving Average for beginners.',
                    position: 'right'
                },
                {
                    target: '.chart-panel',
                    title: 'Live Trading Chart',
                    text: 'Watch your AI agent make trading decisions in real-time. Technical indicators help visualize market trends.',
                    position: 'left'
                },
                {
                    target: '.time-panel',
                    title: 'Time Machine',
                    text: 'Travel through time to test strategies on historical data. Control simulation speed and date ranges.',
                    position: 'top'
                },
                {
                    target: '.performance-panel',
                    title: 'Performance Analytics',
                    text: 'Track your AI agent\'s performance with professional trading metrics. Learn what makes a successful strategy.',
                    position: 'top'
                },
                {
                    target: '.tutorial-btn',
                    title: 'Learning Center',
                    text: 'Access lessons, challenges, and strategies to become an AI trading expert. Click here anytime to continue learning!',
                    position: 'bottom'
                }
            ]
        };
        
        this.startTutorial();
    }

    startTutorial() {
        this.isActive = true;
        this.currentStep = 0;
        this.overlay.classList.add('active');
        this.showStep();
    }

    showStep() {
        const step = this.currentLesson.steps[this.currentStep];
        const target = document.querySelector(step.target);
        
        if (!target) {
            this.nextStep();
            return;
        }

        // Position spotlight
        const rect = target.getBoundingClientRect();
        const spotlight = this.overlay.querySelector('.tutorial-spotlight');
        spotlight.style.left = `${rect.left - 10}px`;
        spotlight.style.top = `${rect.top - 10}px`;
        spotlight.style.width = `${rect.width + 20}px`;
        spotlight.style.height = `${rect.height + 20}px`;

        // Position tooltip
        const tooltip = this.overlay.querySelector('.tutorial-tooltip');
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let tooltipX, tooltipY;
        
        switch (step.position) {
            case 'right':
                tooltipX = rect.right + 20;
                tooltipY = rect.top + (rect.height - tooltipRect.height) / 2;
                break;
            case 'left':
                tooltipX = rect.left - tooltipRect.width - 20;
                tooltipY = rect.top + (rect.height - tooltipRect.height) / 2;
                break;
            case 'top':
                tooltipX = rect.left + (rect.width - tooltipRect.width) / 2;
                tooltipY = rect.top - tooltipRect.height - 20;
                break;
            case 'bottom':
            default:
                tooltipX = rect.left + (rect.width - tooltipRect.width) / 2;
                tooltipY = rect.bottom + 20;
                break;
        }

        tooltip.style.left = `${Math.max(20, Math.min(tooltipX, window.innerWidth - tooltipRect.width - 20))}px`;
        tooltip.style.top = `${Math.max(20, Math.min(tooltipY, window.innerHeight - tooltipRect.height - 20))}px`;

        // Update content
        tooltip.querySelector('.step-indicator').textContent = 
            `Step ${this.currentStep + 1} of ${this.currentLesson.steps.length}`;
        tooltip.querySelector('.tooltip-title').textContent = step.title;
        tooltip.querySelector('.tooltip-text').textContent = step.text;

        // Update buttons
        const prevBtn = tooltip.querySelector('#prevTutorialStep');
        const nextBtn = tooltip.querySelector('#nextTutorialStep');
        
        prevBtn.style.display = this.currentStep === 0 ? 'none' : 'block';
        nextBtn.textContent = this.currentStep === this.currentLesson.steps.length - 1 ? 'Finish' : 'Next';

        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    nextStep() {
        if (this.currentStep < this.currentLesson.steps.length - 1) {
            this.currentStep++;
            this.showStep();
        } else {
            this.endTutorial();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }

    endTutorial() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        
        if (this.currentLesson.id === 'welcome') {
            this.awardXP(100);
            this.playground.showNotification('Welcome tutorial completed! +100 XP', 'success');
            this.unlockAchievement('tutorial-complete');
        }
    }

    startLesson(lesson) {
        this.playground.showNotification(`Starting lesson: ${lesson.title}`, 'info');
        
        // Simulate lesson content
        setTimeout(() => {
            this.completeLesson(lesson);
        }, 3000); // Simulate lesson duration
    }

    completeLesson(lesson) {
        if (!this.userProgress.completedLessons.includes(lesson.id)) {
            this.userProgress.completedLessons.push(lesson.id);
            this.awardXP(lesson.xp);
            this.addSkillPoints(lesson.skillType, Math.floor(lesson.xp / 50));
            this.saveUserProgress();
            
            this.playground.showNotification(`Lesson completed! +${lesson.xp} XP`, 'success');
            
            // Refresh learning center content
            this.populateLessons();
        }
    }

    awardXP(amount) {
        this.userProgress.xp += amount;
        
        // Check for level up
        const newLevel = Math.floor(this.userProgress.xp / 1000) + 1;
        if (newLevel > this.userProgress.level) {
            this.userProgress.level = newLevel;
            this.playground.showNotification(`Level up! You are now level ${newLevel}`, 'success');
            this.unlockAchievement('level-up');
        }
        
        this.updateProgressDisplay();
        this.saveUserProgress();
    }

    addSkillPoints(skillType, points) {
        if (this.userProgress.skillPoints[skillType] !== undefined) {
            this.userProgress.skillPoints[skillType] += points;
        }
    }

    unlockAchievement(achievementId) {
        if (!this.userProgress.achievements.some(a => a.id === achievementId)) {
            this.userProgress.achievements.push({
                id: achievementId,
                earnedDate: new Date().toLocaleDateString()
            });
            this.saveUserProgress();
        }
    }

    updateProgressDisplay() {
        const progressIndicator = document.querySelector('.user-progress');
        if (progressIndicator) {
            const xpInLevel = this.userProgress.xp % 1000;
            progressIndicator.querySelector('.level-badge').textContent = `Level ${this.userProgress.level}`;
            progressIndicator.querySelector('.xp-fill').style.width = `${xpInLevel / 10}%`;
            progressIndicator.querySelector('.xp-text').textContent = `${xpInLevel}/1000 XP`;
        }
    }

    shouldLockLesson(lesson) {
        // Simple progression logic - can be enhanced
        return false;
    }

    isChallengeUnlocked(challenge) {
        // Check if user meets requirements
        return true; // Simplified for demo
    }

    getSampleStrategyCode(type) {
        const codes = {
            sma: `
// Simple Moving Average Strategy
class SMAStrategy {
    constructor(shortPeriod = 10, longPeriod = 30) {
        this.shortPeriod = shortPeriod;
        this.longPeriod = longPeriod;
        this.prices = [];
    }
    
    addPrice(price) {
        this.prices.push(price);
        if (this.prices.length > this.longPeriod) {
            this.prices.shift();
        }
    }
    
    getSignal() {
        if (this.prices.length < this.longPeriod) return 'HOLD';
        
        const shortSMA = this.calculateSMA(this.shortPeriod);
        const longSMA = this.calculateSMA(this.longPeriod);
        
        return shortSMA > longSMA ? 'BUY' : 'SELL';
    }
    
    calculateSMA(period) {
        const slice = this.prices.slice(-period);
        return slice.reduce((a, b) => a + b) / slice.length;
    }
}`,
            rsi: `
// RSI Mean Reversion Strategy
class RSIStrategy {
    constructor(period = 14, oversold = 30, overbought = 70) {
        this.period = period;
        this.oversold = oversold;
        this.overbought = overbought;
        this.prices = [];
    }
    
    addPrice(price) {
        this.prices.push(price);
        if (this.prices.length > this.period + 1) {
            this.prices.shift();
        }
    }
    
    getSignal() {
        const rsi = this.calculateRSI();
        
        if (rsi < this.oversold) return 'BUY';
        if (rsi > this.overbought) return 'SELL';
        return 'HOLD';
    }
    
    calculateRSI() {
        // RSI calculation implementation
        // ... (detailed RSI logic)
    }
}`
        };
        
        return codes[type] || '// Strategy code not available';
    }

    showStrategyCode(strategy) {
        // Create code modal
        const codeModal = document.createElement('div');
        codeModal.className = 'modal-overlay active';
        codeModal.innerHTML = `
            <div class="code-modal glass-effect">
                <div class="modal-header">
                    <h3>${strategy.name} - Implementation</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="code-content">
                    <pre><code class="javascript">${strategy.code}</code></pre>
                </div>
            </div>
        `;
        
        document.body.appendChild(codeModal);
        
        codeModal.querySelector('.modal-close').addEventListener('click', () => {
            codeModal.remove();
        });
        
        codeModal.addEventListener('click', (e) => {
            if (e.target === codeModal) {
                codeModal.remove();
            }
        });
    }

    implementStrategy(strategy) {
        this.playground.showNotification(`Implementing ${strategy.name} strategy...`, 'info');
        // Integration with main playground
    }

    saveUserProgress() {
        localStorage.setItem('tradingPlaygroundProgress', JSON.stringify(this.userProgress));
    }

    loadUserProgress() {
        const saved = localStorage.getItem('tradingPlaygroundProgress');
        if (saved) {
            this.userProgress = { ...this.userProgress, ...JSON.parse(saved) };
        }
    }
}

// Export for use in main playground
window.TutorialSystem = TutorialSystem; 
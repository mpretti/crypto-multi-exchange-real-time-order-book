/**
 * AI Trading Playground - Advanced Market Simulator
 * Realistic market conditions, news events, and sentiment analysis
 */

class AdvancedMarketSimulator {
    constructor(playground) {
        this.playground = playground;
        this.currentMarketRegime = 'normal'; // normal, volatile, trending, ranging, crisis
        this.marketSentiment = 0.5; // 0 = extreme fear, 1 = extreme greed
        this.volatilityIndex = 0.3; // 0 = very low, 1 = extreme
        this.newsEvents = [];
        this.economicCalendar = [];
        this.marketFactors = {
            supply: 0.5,
            demand: 0.5,
            momentum: 0.5,
            volume: 0.5,
            manipulation: 0.1
        };
        
        this.init();
    }

    init() {
        this.createMarketPanel();
        this.generateEconomicCalendar();
        this.startMarketSimulation();
        this.startNewsGeneration();
    }

    createMarketPanel() {
        const marketPanel = document.createElement('div');
        marketPanel.className = 'market-simulator-panel glass-effect';
        marketPanel.id = 'marketSimulatorPanel';
        marketPanel.innerHTML = `
            <div class="market-header">
                <div class="market-title">
                    <i class="fas fa-globe"></i>
                    <span>Market Simulator</span>
                </div>
                <div class="market-controls">
                    <button class="market-toggle-btn" id="marketToggleBtn">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                </div>
            </div>
            
            <div class="market-content" id="marketContent">
                <!-- Market Regime Indicator -->
                <div class="market-section regime-section">
                    <h4><i class="fas fa-chart-area"></i> Market Regime</h4>
                    <div class="regime-display">
                        <div class="regime-indicator" id="regimeIndicator">
                            <div class="regime-icon">📈</div>
                            <div class="regime-text">
                                <span class="regime-name" id="regimeName">Normal Market</span>
                                <span class="regime-desc" id="regimeDesc">Stable trading conditions</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Market Sentiment -->
                <div class="market-section sentiment-section">
                    <h4><i class="fas fa-heart"></i> Market Sentiment</h4>
                    <div class="sentiment-display">
                        <div class="sentiment-meter">
                            <div class="sentiment-scale">
                                <span class="scale-label">Fear</span>
                                <div class="sentiment-bar">
                                    <div class="sentiment-fill" id="sentimentFill" style="width: 50%"></div>
                                    <div class="sentiment-pointer" id="sentimentPointer" style="left: 50%"></div>
                                </div>
                                <span class="scale-label">Greed</span>
                            </div>
                            <div class="sentiment-value">
                                <span id="sentimentValue">50</span>
                                <span class="sentiment-label" id="sentimentLabel">Neutral</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Market Factors -->
                <div class="market-section factors-section">
                    <h4><i class="fas fa-cogs"></i> Market Factors</h4>
                    <div class="factors-grid">
                        <div class="factor-item">
                            <div class="factor-label">Supply/Demand</div>
                            <div class="factor-bar">
                                <div class="factor-fill supply-demand" id="supplyDemandFactor" style="width: 50%"></div>
                            </div>
                            <div class="factor-value" id="supplyDemandValue">Balanced</div>
                        </div>
                        <div class="factor-item">
                            <div class="factor-label">Momentum</div>
                            <div class="factor-bar">
                                <div class="factor-fill momentum" id="momentumFactor" style="width: 50%"></div>
                            </div>
                            <div class="factor-value" id="momentumValue">Neutral</div>
                        </div>
                        <div class="factor-item">
                            <div class="factor-label">Volume</div>
                            <div class="factor-bar">
                                <div class="factor-fill volume" id="volumeFactor" style="width: 50%"></div>
                            </div>
                            <div class="factor-value" id="volumeValue">Normal</div>
                        </div>
                        <div class="factor-item">
                            <div class="factor-label">Volatility</div>
                            <div class="factor-bar">
                                <div class="factor-fill volatility" id="volatilityFactor" style="width: 30%"></div>
                            </div>
                            <div class="factor-value" id="volatilityValue">Low</div>
                        </div>
                    </div>
                </div>
                
                <!-- Economic Calendar -->
                <div class="market-section calendar-section">
                    <h4><i class="fas fa-calendar"></i> Economic Events</h4>
                    <div class="calendar-container" id="calendarContainer">
                        <div class="calendar-item">
                            <div class="event-time">Loading...</div>
                            <div class="event-name">Market events loading</div>
                            <div class="event-impact low">Low Impact</div>
                        </div>
                    </div>
                </div>
                
                <!-- News Feed -->
                <div class="market-section news-section">
                    <h4><i class="fas fa-newspaper"></i> Market News</h4>
                    <div class="news-feed" id="newsFeed">
                        <div class="news-item">
                            <div class="news-time">Loading...</div>
                            <div class="news-headline">Market news loading...</div>
                            <div class="news-impact neutral">
                                <i class="fas fa-minus"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Market Analytics -->
                <div class="market-section analytics-section">
                    <h4><i class="fas fa-analytics"></i> Quick Analytics</h4>
                    <div class="analytics-grid">
                        <div class="analytics-item">
                            <div class="analytics-label">VIX Index</div>
                            <div class="analytics-value" id="vixValue">18.5</div>
                        </div>
                        <div class="analytics-item">
                            <div class="analytics-label">Market Cap</div>
                            <div class="analytics-value" id="marketCapValue">$2.1T</div>
                        </div>
                        <div class="analytics-item">
                            <div class="analytics-label">24h Volume</div>
                            <div class="analytics-value" id="volumeValue">$45.2B</div>
                        </div>
                        <div class="analytics-item">
                            <div class="analytics-label">Fear & Greed</div>
                            <div class="analytics-value" id="fearGreedValue">50</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Position it on the left side
        marketPanel.style.position = 'fixed';
        marketPanel.style.top = '120px';
        marketPanel.style.left = '20px';
        marketPanel.style.width = '320px';
        marketPanel.style.maxHeight = '75vh';
        marketPanel.style.zIndex = '997';
        
        document.body.appendChild(marketPanel);
        this.setupMarketEventListeners();
    }

    setupMarketEventListeners() {
        const toggleBtn = document.getElementById('marketToggleBtn');
        const content = document.getElementById('marketContent');
        
        toggleBtn.addEventListener('click', () => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            const icon = toggleBtn.querySelector('i');
            icon.className = content.style.display === 'none' ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        });
    }

    startMarketSimulation() {
        // Update market conditions every 10 seconds
        setInterval(() => {
            this.updateMarketConditions();
            this.updateMarketDisplay();
        }, 10000);
        
        // Initial update
        this.updateMarketConditions();
        this.updateMarketDisplay();
    }

    updateMarketConditions() {
        // Evolve market sentiment gradually with some randomness
        const sentimentChange = (Math.random() - 0.5) * 0.1;
        this.marketSentiment = Math.max(0, Math.min(1, this.marketSentiment + sentimentChange));
        
        // Evolve volatility
        const volatilityChange = (Math.random() - 0.5) * 0.05;
        this.volatilityIndex = Math.max(0.1, Math.min(0.9, this.volatilityIndex + volatilityChange));
        
        // Update market factors
        Object.keys(this.marketFactors).forEach(factor => {
            if (factor !== 'manipulation') {
                const change = (Math.random() - 0.5) * 0.1;
                this.marketFactors[factor] = Math.max(0, Math.min(1, this.marketFactors[factor] + change));
            }
        });
        
        // Determine market regime based on conditions
        this.updateMarketRegime();
        
        // Generate market events based on conditions
        this.generateMarketEvents();
    }

    updateMarketRegime() {
        const regimes = [
            {
                name: 'Bull Market',
                condition: () => this.marketSentiment > 0.7 && this.volatilityIndex < 0.4,
                icon: '🐂',
                desc: 'Strong upward momentum'
            },
            {
                name: 'Bear Market',
                condition: () => this.marketSentiment < 0.3 && this.volatilityIndex > 0.6,
                icon: '🐻',
                desc: 'Significant downward pressure'
            },
            {
                name: 'Volatile Market',
                condition: () => this.volatilityIndex > 0.7,
                icon: '⚡',
                desc: 'High volatility and uncertainty'
            },
            {
                name: 'Ranging Market',
                condition: () => this.volatilityIndex < 0.3 && Math.abs(this.marketSentiment - 0.5) < 0.2,
                icon: '📊',
                desc: 'Sideways movement, low volatility'
            },
            {
                name: 'Crisis Mode',
                condition: () => this.marketSentiment < 0.2 && this.volatilityIndex > 0.8,
                icon: '🚨',
                desc: 'Extreme market stress'
            }
        ];
        
        const currentRegime = regimes.find(regime => regime.condition()) || {
            name: 'Normal Market',
            icon: '📈',
            desc: 'Stable trading conditions'
        };
        
        this.currentMarketRegime = currentRegime.name;
        this.currentRegimeData = currentRegime;
    }

    updateMarketDisplay() {
        // Update regime display
        if (this.currentRegimeData) {
            document.getElementById('regimeName').textContent = this.currentRegimeData.name;
            document.getElementById('regimeDesc').textContent = this.currentRegimeData.desc;
            document.querySelector('.regime-icon').textContent = this.currentRegimeData.icon;
        }
        
        // Update sentiment display
        const sentimentPercent = this.marketSentiment * 100;
        document.getElementById('sentimentFill').style.width = sentimentPercent + '%';
        document.getElementById('sentimentPointer').style.left = sentimentPercent + '%';
        document.getElementById('sentimentValue').textContent = Math.round(sentimentPercent);
        
        const sentimentLabels = ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'];
        const sentimentIndex = Math.floor(this.marketSentiment * 4.99);
        document.getElementById('sentimentLabel').textContent = sentimentLabels[sentimentIndex];
        
        // Update market factors
        this.updateFactorDisplay('supplyDemand', this.marketFactors.demand, 
            ['High Supply', 'Balanced', 'High Demand']);
        this.updateFactorDisplay('momentum', this.marketFactors.momentum,
            ['Bearish', 'Neutral', 'Bullish']);
        this.updateFactorDisplay('volume', this.marketFactors.volume,
            ['Low', 'Normal', 'High']);
        this.updateFactorDisplay('volatility', this.volatilityIndex,
            ['Low', 'Medium', 'High']);
        
        // Update analytics
        this.updateAnalytics();
    }

    updateFactorDisplay(factorId, value, labels) {
        const percent = value * 100;
        document.getElementById(factorId + 'Factor').style.width = percent + '%';
        
        const labelIndex = Math.floor(value * 2.99);
        const valueElement = document.getElementById(factorId.replace('Factor', 'Value'));
        if (valueElement) {
            valueElement.textContent = labels[labelIndex];
        }
    }

    updateAnalytics() {
        // VIX simulation
        const vix = 10 + (this.volatilityIndex * 50);
        document.getElementById('vixValue').textContent = vix.toFixed(1);
        
        // Market cap simulation
        const baseCap = 2.1;
        const capVariation = (this.marketSentiment - 0.5) * 0.8;
        const marketCap = baseCap + capVariation;
        document.getElementById('marketCapValue').textContent = `$${marketCap.toFixed(1)}T`;
        
        // Volume simulation
        const baseVolume = 45;
        const volumeVariation = this.marketFactors.volume * 40;
        const volume = baseVolume + volumeVariation;
        document.getElementById('volumeValue').textContent = `$${volume.toFixed(1)}B`;
        
        // Fear & Greed index
        document.getElementById('fearGreedValue').textContent = Math.round(this.marketSentiment * 100);
    }

    generateEconomicCalendar() {
        const events = [
            { name: 'Fed Interest Rate Decision', impact: 'high', hours: 2 },
            { name: 'Non-Farm Payrolls', impact: 'high', hours: 24 },
            { name: 'CPI Release', impact: 'medium', hours: 6 },
            { name: 'GDP Report', impact: 'medium', hours: 12 },
            { name: 'FOMC Meeting Minutes', impact: 'medium', hours: 18 },
            { name: 'Unemployment Rate', impact: 'low', hours: 4 },
            { name: 'Consumer Confidence', impact: 'low', hours: 8 },
            { name: 'Retail Sales', impact: 'low', hours: 16 }
        ];
        
        this.economicCalendar = events.map(event => ({
            ...event,
            time: new Date(Date.now() + event.hours * 60 * 60 * 1000)
        }));
        
        this.updateCalendarDisplay();
    }

    updateCalendarDisplay() {
        const container = document.getElementById('calendarContainer');
        container.innerHTML = '';
        
        const upcomingEvents = this.economicCalendar
            .filter(event => event.time > new Date())
            .sort((a, b) => a.time - b.time)
            .slice(0, 3);
        
        upcomingEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'calendar-item';
            
            const timeUntil = this.getTimeUntil(event.time);
            
            eventElement.innerHTML = `
                <div class="event-time">${timeUntil}</div>
                <div class="event-name">${event.name}</div>
                <div class="event-impact ${event.impact}">${event.impact.toUpperCase()} Impact</div>
            `;
            
            container.appendChild(eventElement);
        });
    }

    getTimeUntil(eventTime) {
        const now = new Date();
        const diff = eventTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    startNewsGeneration() {
        // Generate news every 30 seconds
        setInterval(() => {
            this.generateNewsEvent();
        }, 30000);
        
        // Generate initial news
        this.generateNewsEvent();
    }

    generateNewsEvent() {
        const newsTemplates = [
            {
                template: "Bitcoin reaches new {direction} milestone at ${price}",
                sentiment: 'positive',
                conditions: () => this.marketSentiment > 0.6
            },
            {
                template: "Major institutional investor {action} significant crypto holdings",
                sentiment: 'positive',
                conditions: () => this.marketSentiment > 0.5
            },
            {
                template: "Regulatory uncertainty causes market {reaction}",
                sentiment: 'negative',
                conditions: () => this.marketSentiment < 0.4
            },
            {
                template: "Technical analysis suggests {direction} trend continuation",
                sentiment: 'neutral',
                conditions: () => true
            },
            {
                template: "Trading volume spikes amid {event} speculation",
                sentiment: 'neutral',
                conditions: () => this.marketFactors.volume > 0.7
            },
            {
                template: "Market makers report {activity} in derivatives trading",
                sentiment: 'neutral',
                conditions: () => this.volatilityIndex > 0.5
            }
        ];
        
        const applicableNews = newsTemplates.filter(news => news.conditions());
        if (applicableNews.length === 0) return;
        
        const selectedNews = applicableNews[Math.floor(Math.random() * applicableNews.length)];
        const headline = this.fillNewsTemplate(selectedNews.template);
        
        this.addNewsItem(headline, selectedNews.sentiment);
    }

    fillNewsTemplate(template) {
        const replacements = {
            '{direction}': this.marketSentiment > 0.5 ? 'bullish' : 'bearish',
            '{price}': '$' + (40000 + Math.random() * 20000).toFixed(0),
            '{action}': Math.random() > 0.5 ? 'accumulates' : 'diversifies',
            '{reaction}': this.marketSentiment > 0.5 ? 'optimism' : 'volatility',
            '{event}': ['DeFi', 'NFT', 'regulation', 'adoption'][Math.floor(Math.random() * 4)],
            '{activity}': this.volatilityIndex > 0.5 ? 'increased activity' : 'consolidation'
        };
        
        let filled = template;
        Object.entries(replacements).forEach(([key, value]) => {
            filled = filled.replace(key, value);
        });
        
        return filled;
    }

    addNewsItem(headline, sentiment) {
        const newsFeed = document.getElementById('newsFeed');
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        const impactIcons = {
            positive: '<i class="fas fa-arrow-up"></i>',
            negative: '<i class="fas fa-arrow-down"></i>',
            neutral: '<i class="fas fa-minus"></i>'
        };
        
        newsItem.innerHTML = `
            <div class="news-time">${new Date().toLocaleTimeString()}</div>
            <div class="news-headline">${headline}</div>
            <div class="news-impact ${sentiment}">
                ${impactIcons[sentiment]}
            </div>
        `;
        
        newsFeed.insertBefore(newsItem, newsFeed.firstChild);
        
        // Keep only last 5 news items
        while (newsFeed.children.length > 5) {
            newsFeed.removeChild(newsFeed.lastChild);
        }
        
        // Animate in
        setTimeout(() => {
            newsItem.classList.add('show');
        }, 100);
        
        // Update market sentiment based on news
        this.processNewsImpact(sentiment);
    }

    processNewsImpact(sentiment) {
        const impact = {
            positive: 0.02,
            negative: -0.02,
            neutral: 0
        };
        
        this.marketSentiment = Math.max(0, Math.min(1, this.marketSentiment + impact[sentiment]));
    }

    generateMarketEvents() {
        // Occasionally generate significant market events
        if (Math.random() < 0.05) { // 5% chance every update
            this.generateSignificantEvent();
        }
    }

    generateSignificantEvent() {
        const events = [
            {
                name: 'Flash Crash',
                effect: () => {
                    this.volatilityIndex = Math.min(0.9, this.volatilityIndex + 0.3);
                    this.marketSentiment = Math.max(0.1, this.marketSentiment - 0.3);
                },
                probability: this.volatilityIndex > 0.6 ? 0.3 : 0.1
            },
            {
                name: 'Whale Movement',
                effect: () => {
                    this.marketFactors.volume = Math.min(1, this.marketFactors.volume + 0.2);
                    this.volatilityIndex = Math.min(0.8, this.volatilityIndex + 0.1);
                },
                probability: 0.4
            },
            {
                name: 'Institutional Buy',
                effect: () => {
                    this.marketSentiment = Math.min(0.9, this.marketSentiment + 0.2);
                    this.marketFactors.demand = Math.min(1, this.marketFactors.demand + 0.3);
                },
                probability: this.marketSentiment > 0.4 ? 0.3 : 0.1
            },
            {
                name: 'Regulatory News',
                effect: () => {
                    const impact = Math.random() > 0.5 ? 0.15 : -0.15;
                    this.marketSentiment = Math.max(0, Math.min(1, this.marketSentiment + impact));
                    this.volatilityIndex = Math.min(0.8, this.volatilityIndex + 0.1);
                },
                probability: 0.2
            }
        ];
        
        events.forEach(event => {
            if (Math.random() < event.probability) {
                event.effect();
                this.addNewsItem(`Market alert: ${event.name} detected`, 
                    event.name.includes('Buy') ? 'positive' : 'negative');
            }
        });
    }
}

// Export for use in main playground
window.AdvancedMarketSimulator = AdvancedMarketSimulator; 
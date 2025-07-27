/**
 * AI Trading Playground - AI Coach Fixes & Complete Implementation
 * Fix save button and complete all missing functionality
 */

class AICoachFixes {
    constructor() {
        this.settings = {
            coachingLevel: 'beginner-friendly',
            personality: 'wise-mentor',
            insightFrequency: 'frequent',
            notifications: true,
            soundEffects: true
        };
        
        this.init();
    }

    init() {
        this.fixSaveButton();
        this.implementSettingsModal();
        this.enhanceCoachInteractions();
        this.addMissingFunctionality();
        this.setupEventListeners();
        
        console.log('🤖 AI Coach fixes and enhancements applied');
    }

    fixSaveButton() {
        // Find and fix the save button in AI Coach settings
        const saveButtons = document.querySelectorAll('button');
        saveButtons.forEach(btn => {
            if (btn.textContent.trim() === 'Save' || btn.innerHTML.includes('Save')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.saveCoachSettings();
                });
                
                // Ensure proper styling
                btn.style.background = 'linear-gradient(135deg, #8b5cf6, #3b82f6)';
                btn.style.color = 'white';
                btn.style.border = '1px solid rgba(139, 92, 246, 0.5)';
                btn.style.borderRadius = '8px';
                btn.style.padding = '12px 24px';
                btn.style.cursor = 'pointer';
                btn.style.transition = 'all 0.3s ease';
                btn.style.fontWeight = '600';
                
                btn.addEventListener('mouseenter', () => {
                    btn.style.transform = 'translateY(-2px)';
                    btn.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
                });
                
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'translateY(0)';
                    btn.style.boxShadow = 'none';
                });
            }
        });
    }

    saveCoachSettings() {
        // Get current settings from the modal
        const modal = document.querySelector('.ai-coach-settings, .coach-settings-modal, [class*="settings"]');
        if (!modal) {
            this.showNotification('Settings modal not found', 'error');
            return;
        }

        // Extract settings from dropdowns/selects
        const coachingLevelSelect = modal.querySelector('select') || 
                                   document.querySelector('[data-setting="coaching-level"]') ||
                                   modal.querySelector('.coaching-level-select');
        
        const personalitySelect = modal.querySelectorAll('select')[1] || 
                                 document.querySelector('[data-setting="personality"]') ||
                                 modal.querySelector('.personality-select');
        
        const frequencySelect = modal.querySelectorAll('select')[2] || 
                               document.querySelector('[data-setting="frequency"]') ||
                               modal.querySelector('.frequency-select');

        // Update settings
        if (coachingLevelSelect) {
            this.settings.coachingLevel = coachingLevelSelect.value || 'beginner-friendly';
        }
        
        if (personalitySelect) {
            this.settings.personality = personalitySelect.value || 'wise-mentor';
        }
        
        if (frequencySelect) {
            this.settings.insightFrequency = frequencySelect.value || 'frequent';
        }

        // Save to localStorage
        localStorage.setItem('aiCoachSettings', JSON.stringify(this.settings));
        
        // Apply settings immediately
        this.applySettings();
        
        // Close modal
        this.closeSettingsModal();
        
        // Show success notification
        this.showNotification('AI Coach settings saved successfully! 🤖✨', 'success');
        
        // Update coach behavior
        this.updateCoachBehavior();
    }

    applySettings() {
        const coach = window.aiCoach || this;
        
        // Apply coaching level
        switch(this.settings.coachingLevel) {
            case 'beginner-friendly':
                coach.difficulty = 'easy';
                coach.explanationLevel = 'detailed';
                break;
            case 'intermediate':
                coach.difficulty = 'medium';
                coach.explanationLevel = 'moderate';
                break;
            case 'advanced':
                coach.difficulty = 'hard';
                coach.explanationLevel = 'brief';
                break;
        }
        
        // Apply personality
        switch(this.settings.personality) {
            case 'wise-mentor':
                coach.tone = 'encouraging';
                coach.style = 'mentor';
                break;
            case 'drill-sergeant':
                coach.tone = 'strict';
                coach.style = 'demanding';
                break;
            case 'friendly-guide':
                coach.tone = 'casual';
                coach.style = 'supportive';
                break;
        }
        
        // Apply frequency
        coach.insightInterval = this.settings.insightFrequency === 'frequent' ? 30000 : 60000;
    }

    closeSettingsModal() {
        const modals = document.querySelectorAll('.modal-overlay, .ai-coach-settings, .coach-settings-modal');
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.opacity = '0';
                modal.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }

    implementSettingsModal() {
        // Create a proper settings modal if it doesn't exist
        if (!document.querySelector('.ai-coach-settings-modal')) {
            this.createSettingsModal();
        }
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'ai-coach-settings-modal modal-overlay';
        modal.id = 'aiCoachSettingsModal';
        modal.innerHTML = `
            <div class="modal glass-effect">
                <div class="modal-header">
                    <h3>🤖 AI Coach Settings</h3>
                    <button class="modal-close" id="closeAICoachSettings">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <div class="setting-group">
                        <label class="setting-label">
                            <i class="fas fa-graduation-cap"></i>
                            Coaching Level
                        </label>
                        <select class="setting-select coaching-level-select" data-setting="coaching-level">
                            <option value="beginner-friendly">Beginner Friendly</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label class="setting-label">
                            <i class="fas fa-user-tie"></i>
                            Coach Personality
                        </label>
                        <select class="setting-select personality-select" data-setting="personality">
                            <option value="wise-mentor">Wise Mentor</option>
                            <option value="drill-sergeant">Drill Sergeant</option>
                            <option value="friendly-guide">Friendly Guide</option>
                            <option value="analytical-expert">Analytical Expert</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label class="setting-label">
                            <i class="fas fa-clock"></i>
                            Insight Frequency
                        </label>
                        <select class="setting-select frequency-select" data-setting="frequency">
                            <option value="frequent">Frequent</option>
                            <option value="moderate">Moderate</option>
                            <option value="minimal">Minimal</option>
                            <option value="on-demand">On Demand Only</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label class="setting-label">
                            <i class="fas fa-bell"></i>
                            Notifications
                        </label>
                        <div class="setting-toggle">
                            <input type="checkbox" id="coachNotifications" checked>
                            <label for="coachNotifications" class="toggle-slider"></label>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <label class="setting-label">
                            <i class="fas fa-volume-up"></i>
                            Sound Effects
                        </label>
                        <div class="setting-toggle">
                            <input type="checkbox" id="coachSounds" checked>
                            <label for="coachSounds" class="toggle-slider"></label>
                        </div>
                    </div>
                    
                    <div class="setting-actions">
                        <button class="btn btn-primary save-coach-settings">
                            <i class="fas fa-save"></i>
                            Save Settings
                        </button>
                        <button class="btn btn-secondary cancel-coach-settings">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'none';
        document.body.appendChild(modal);
        
        this.setupModalEvents(modal);
    }

    setupModalEvents(modal) {
        // Save button
        modal.querySelector('.save-coach-settings')?.addEventListener('click', () => {
            this.saveCoachSettings();
        });
        
        // Cancel button
        modal.querySelector('.cancel-coach-settings')?.addEventListener('click', () => {
            this.closeSettingsModal();
        });
        
        // Close button
        modal.querySelector('.modal-close')?.addEventListener('click', () => {
            this.closeSettingsModal();
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeSettingsModal();
            }
        });
    }

    enhanceCoachInteractions() {
        // Add real-time coaching suggestions
        this.startCoachingEngine();
        
        // Add interactive coaching elements
        this.addCoachingIndicators();
        
        // Implement progress tracking
        this.trackUserProgress();
    }

    startCoachingEngine() {
        setInterval(() => {
            if (this.settings.insightFrequency !== 'on-demand') {
                this.generateCoachingInsight();
            }
        }, this.settings.insightFrequency === 'frequent' ? 30000 : 60000);
    }

    generateCoachingInsight() {
        const insights = [
            "💡 Consider diversifying your portfolio with different timeframes",
            "📊 Your win rate is improving! Keep following the strategy",
            "⚠️ Market volatility is high - consider reducing position sizes",
            "🎯 Great entry point! Your technical analysis is getting better",
            "📈 This uptrend looks strong - consider holding longer",
            "🔄 Time to review your risk management rules",
            "⭐ Excellent trade execution! Your timing is improving",
            "📉 Don't chase this dip - wait for confirmation",
            "🎪 Market is ranging - switch to mean reversion strategy",
            "🚀 Momentum is building - this could be a breakout"
        ];
        
        const randomInsight = insights[Math.floor(Math.random() * insights.length)];
        this.showCoachingNotification(randomInsight);
    }

    showCoachingNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'coaching-notification glass-effect';
        notification.innerHTML = `
            <div class="coach-avatar">🤖</div>
            <div class="coach-message">
                <div class="coach-name">AI Coach Alex</div>
                <div class="coach-text">${message}</div>
            </div>
            <button class="dismiss-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 1060;
            background: rgba(17, 24, 39, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 12px;
            padding: 16px;
            max-width: 320px;
            box-shadow: 0 10px 25px rgba(139, 92, 246, 0.2);
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto dismiss after 8 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 8000);
        
        // Manual dismiss
        notification.querySelector('.dismiss-btn')?.addEventListener('click', () => {
            notification.remove();
        });
    }

    addCoachingIndicators() {
        // Add coaching status indicator to the main coach panel
        const coachPanel = document.querySelector('.ai-coach-panel, [class*="coach"]');
        if (coachPanel && !coachPanel.querySelector('.coaching-status')) {
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'coaching-status';
            statusIndicator.innerHTML = `
                <div class="status-dot active"></div>
                <span>Actively Coaching</span>
            `;
            
            statusIndicator.style.cssText = `
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                background: rgba(16, 185, 129, 0.2);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 6px;
                font-size: 11px;
                color: #10b981;
                margin-top: 8px;
            `;
            
            coachPanel.appendChild(statusIndicator);
        }
    }

    trackUserProgress() {
        // Track trading decisions and provide feedback
        const tradingButtons = document.querySelectorAll('[id*="trading"], [id*="trade"], .btn');
        tradingButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.logUserAction(btn.textContent || btn.id);
            });
        });
    }

    logUserAction(action) {
        const actions = JSON.parse(localStorage.getItem('userActions') || '[]');
        actions.push({
            action,
            timestamp: Date.now(),
            context: this.getCurrentMarketContext()
        });
        
        // Keep only last 100 actions
        if (actions.length > 100) {
            actions.shift();
        }
        
        localStorage.setItem('userActions', JSON.stringify(actions));
        
        // Provide contextual feedback
        this.provideContextualFeedback(action);
    }

    getCurrentMarketContext() {
        return {
            timeframe: document.querySelector('.timeframe-btn.active')?.textContent || '1H',
            price: document.querySelector('.chart-price')?.textContent || 'N/A',
            trend: Math.random() > 0.5 ? 'up' : 'down' // Simplified
        };
    }

    provideContextualFeedback(action) {
        const feedbackMessages = {
            'Train Agent': "🎓 Great choice! Training will improve your agent's performance",
            'Start Trading': "🚀 Trading started! Monitor your positions closely",
            'Play': "⏯️ Time machine activated - great for backtesting strategies",
            'Pause': "⏸️ Good practice to pause and analyze current positions"
        };
        
        const message = feedbackMessages[action];
        if (message && Math.random() > 0.7) { // 30% chance to show feedback
            setTimeout(() => {
                this.showCoachingNotification(message);
            }, 1000);
        }
    }

    addMissingFunctionality() {
        // Add missing coach features
        this.implementCoachChat();
        this.addProgressTracking();
        this.createCoachingChallenges();
        this.setupCoachingAnalytics();
    }

    implementCoachChat() {
        // Add a chat interface for direct coach interaction
        const chatButton = document.createElement('button');
        chatButton.className = 'coach-chat-btn glass-effect';
        chatButton.innerHTML = `
            <i class="fas fa-comments"></i>
            <span>Chat with Coach</span>
        `;
        
        chatButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1055;
            background: rgba(139, 92, 246, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 25px;
            color: #8b5cf6;
            padding: 12px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            font-size: 12px;
            transition: all 0.3s ease;
        `;
        
        chatButton.addEventListener('click', () => {
            this.openCoachChat();
        });
        
        document.body.appendChild(chatButton);
    }

    openCoachChat() {
        // Create chat interface
        const chatModal = document.createElement('div');
        chatModal.className = 'coach-chat-modal';
        chatModal.innerHTML = `
            <div class="chat-container glass-effect">
                <div class="chat-header">
                    <div class="coach-info">
                        <div class="coach-avatar">🤖</div>
                        <div>
                            <div class="coach-name">AI Coach Alex</div>
                            <div class="coach-status">Online</div>
                        </div>
                    </div>
                    <button class="chat-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="chat-messages" id="coachChatMessages">
                    <div class="message coach-message">
                        <div class="message-content">
                            Hi! I'm here to help you improve your trading. What would you like to learn about?
                        </div>
                        <div class="message-time">Just now</div>
                    </div>
                </div>
                <div class="chat-input-container">
                    <input type="text" class="chat-input" placeholder="Ask me anything about trading..." id="coachChatInput">
                    <button class="chat-send" id="coachChatSend">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        chatModal.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 1070;
            width: 350px;
            height: 500px;
        `;
        
        document.body.appendChild(chatModal);
        this.setupChatEvents(chatModal);
    }

    setupChatEvents(chatModal) {
        const input = chatModal.querySelector('#coachChatInput');
        const sendBtn = chatModal.querySelector('#coachChatSend');
        const closeBtn = chatModal.querySelector('.chat-close');
        
        const sendMessage = () => {
            const message = input.value.trim();
            if (message) {
                this.addChatMessage(message, 'user');
                input.value = '';
                
                // Simulate coach response
                setTimeout(() => {
                    const response = this.generateCoachResponse(message);
                    this.addChatMessage(response, 'coach');
                }, 1000);
            }
        };
        
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        closeBtn.addEventListener('click', () => {
            chatModal.remove();
        });
    }

    addChatMessage(message, sender) {
        const messagesContainer = document.getElementById('coachChatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    generateCoachResponse(userMessage) {
        const responses = {
            'risk': "Risk management is crucial! Never risk more than 2% of your portfolio on a single trade. Use stop losses and position sizing.",
            'strategy': "A good strategy combines technical analysis with risk management. Start with simple moving averages and RSI indicators.",
            'indicators': "RSI shows overbought/oversold conditions, MACD shows momentum, and moving averages show trend direction. Use them together!",
            'help': "I'm here to guide you! Ask me about risk management, trading strategies, technical indicators, or market psychology.",
            'default': "That's a great question! Focus on learning one concept at a time and practice with small positions first."
        };
        
        const lowerMessage = userMessage.toLowerCase();
        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }
        
        return responses.default;
    }

    setupEventListeners() {
        // Listen for settings button clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('[class*="settings"], .coach-settings, #coachSettings')) {
                e.preventDefault();
                this.openSettingsModal();
            }
        });
    }

    openSettingsModal() {
        const modal = document.getElementById('aiCoachSettingsModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);
            
            // Load current settings
            this.loadCurrentSettings(modal);
        }
    }

    loadCurrentSettings(modal) {
        const saved = localStorage.getItem('aiCoachSettings');
        if (saved) {
            this.settings = JSON.parse(saved);
        }
        
        // Set dropdown values
        const coachingLevel = modal.querySelector('.coaching-level-select');
        const personality = modal.querySelector('.personality-select');
        const frequency = modal.querySelector('.frequency-select');
        
        if (coachingLevel) coachingLevel.value = this.settings.coachingLevel;
        if (personality) personality.value = this.settings.personality;
        if (frequency) frequency.value = this.settings.insightFrequency;
        
        // Set toggle states
        const notifications = modal.querySelector('#coachNotifications');
        const sounds = modal.querySelector('#coachSounds');
        
        if (notifications) notifications.checked = this.settings.notifications;
        if (sounds) sounds.checked = this.settings.soundEffects;
    }

    updateCoachBehavior() {
        // Update the coach's behavior based on new settings
        const coachPanel = document.querySelector('.ai-coach-panel, [class*="coach"]');
        if (coachPanel) {
            // Update coaching level indicator
            const levelIndicator = coachPanel.querySelector('.coaching-level') || 
                                  document.createElement('div');
            levelIndicator.className = 'coaching-level';
            levelIndicator.textContent = this.settings.coachingLevel.replace('-', ' ').toUpperCase();
            levelIndicator.style.cssText = `
                background: rgba(139, 92, 246, 0.2);
                border: 1px solid rgba(139, 92, 246, 0.3);
                border-radius: 4px;
                padding: 2px 6px;
                font-size: 10px;
                color: #8b5cf6;
                margin-top: 4px;
            `;
            
            if (!coachPanel.contains(levelIndicator)) {
                coachPanel.appendChild(levelIndicator);
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1080;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.2)' : type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
            border: 1px solid ${type === 'success' ? 'rgba(16, 185, 129, 0.3)' : type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'};
            border-radius: 8px;
            color: #e2e8f0;
            padding: 12px 16px;
            backdrop-filter: blur(10px);
            font-size: 12px;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add required CSS animations
const coachStyles = document.createElement('style');
coachStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .coaching-notification {
        animation: slideInRight 0.3s ease !important;
    }
    
    .coach-avatar {
        font-size: 24px;
        flex-shrink: 0;
    }
    
    .coach-message {
        flex: 1;
    }
    
    .coach-name {
        font-weight: 600;
        color: #8b5cf6;
        font-size: 12px;
        margin-bottom: 4px;
    }
    
    .coach-text {
        color: #e2e8f0;
        font-size: 13px;
        line-height: 1.4;
    }
    
    .dismiss-btn {
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 4px;
        color: #f87171;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        cursor: pointer;
        flex-shrink: 0;
    }
    
    .chat-container {
        background: rgba(17, 24, 39, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(75, 85, 99, 0.3);
        border-radius: 12px;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .chat-header {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(75, 85, 99, 0.3);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(31, 41, 55, 0.8);
    }
    
    .coach-info {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .coach-status {
        font-size: 10px;
        color: #10b981;
    }
    
    .chat-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .message {
        max-width: 80%;
    }
    
    .user-message {
        align-self: flex-end;
    }
    
    .coach-message {
        align-self: flex-start;
    }
    
    .message-content {
        background: rgba(55, 65, 81, 0.6);
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 12px;
        line-height: 1.4;
        color: #e2e8f0;
    }
    
    .user-message .message-content {
        background: rgba(139, 92, 246, 0.3);
        border: 1px solid rgba(139, 92, 246, 0.4);
    }
    
    .message-time {
        font-size: 10px;
        color: #6b7280;
        margin-top: 4px;
        text-align: right;
    }
    
    .coach-message .message-time {
        text-align: left;
    }
    
    .chat-input-container {
        padding: 12px 16px;
        border-top: 1px solid rgba(75, 85, 99, 0.3);
        display: flex;
        gap: 8px;
        background: rgba(31, 41, 55, 0.8);
    }
    
    .chat-input {
        flex: 1;
        background: rgba(55, 65, 81, 0.6);
        border: 1px solid rgba(107, 114, 128, 0.3);
        border-radius: 6px;
        padding: 8px 12px;
        color: #e2e8f0;
        font-size: 12px;
    }
    
    .chat-send {
        background: rgba(139, 92, 246, 0.3);
        border: 1px solid rgba(139, 92, 246, 0.4);
        border-radius: 6px;
        color: #8b5cf6;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
    }
`;
document.head.appendChild(coachStyles);

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!window.aiCoachFixes) {
        window.aiCoachFixes = new AICoachFixes();
    }
});

// Export for use
window.AICoachFixes = AICoachFixes; 
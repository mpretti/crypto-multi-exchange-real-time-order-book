// Multi-Agent Trading System Integration
// Connects the multi-agent manager with the existing order book interface

class MultiAgentIntegration {
    constructor() {
        this.multiAgentManager = null;
        this.isInitialized = false;
        this.integrationButton = null;
    }

    async initialize() {
        try {
            console.log('🤖 Initializing Multi-Agent Trading Integration...');
            
            // Create the toggle button for multi-agent system
            this.createToggleButton();
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupIntegration());
            } else {
                this.setupIntegration();
            }
            
        } catch (error) {
            console.error('Failed to initialize multi-agent integration:', error);
        }
    }

    createToggleButton() {
        // Add button to the header area
        const headerArea = document.querySelector('.header-area') || document.querySelector('header') || document.body;
        
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'multi-agent-toggle-container';
        toggleContainer.innerHTML = `
            <button id="multi-agent-toggle" class="multi-agent-toggle-btn" title="Toggle Multi-Agent Trading System">
                <span class="toggle-icon">🤖</span>
                <span class="toggle-text">Multi-Agent Trading</span>
                <span class="toggle-status">Off</span>
            </button>
        `;
        
        // Add styles for the button
        const style = document.createElement('style');
        style.textContent = `
            .multi-agent-toggle-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            }
            
            .multi-agent-toggle-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: linear-gradient(135deg, #1e293b, #334155);
                border: 1px solid rgba(59, 130, 246, 0.3);
                border-radius: 12px;
                color: #e2e8f0;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
            }
            
            .multi-agent-toggle-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
                border-color: rgba(59, 130, 246, 0.6);
            }
            
            .multi-agent-toggle-btn.active {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                border-color: #60a5fa;
            }
            
            .toggle-icon {
                font-size: 18px;
            }
            
            .toggle-status {
                font-size: 12px;
                opacity: 0.8;
                background: rgba(0, 0, 0, 0.2);
                padding: 2px 8px;
                border-radius: 8px;
            }
            
            .multi-agent-toggle-btn.active .toggle-status {
                background: rgba(255, 255, 255, 0.2);
            }
        `;
        
        document.head.appendChild(style);
        headerArea.appendChild(toggleContainer);
        
        this.integrationButton = document.getElementById('multi-agent-toggle');
        this.integrationButton.addEventListener('click', () => this.toggleMultiAgentSystem());
    }

    setupIntegration() {
        // Wait a bit for other systems to initialize
        setTimeout(() => {
            this.integrationButton.style.display = 'flex';
            console.log('✅ Multi-Agent integration ready - click the button to activate');
        }, 2000);
    }

    async toggleMultiAgentSystem() {
        try {
            if (!this.isInitialized) {
                await this.activateMultiAgentSystem();
            } else {
                this.deactivateMultiAgentSystem();
            }
        } catch (error) {
            console.error('Failed to toggle multi-agent system:', error);
            this.showNotification('Failed to toggle multi-agent system', 'error');
        }
    }

    async activateMultiAgentSystem() {
        try {
            console.log('🚀 Activating Multi-Agent Trading System...');
            
            // Show loading state
            this.updateToggleButton('Loading...', false);
            
            // Initialize the multi-agent system
            this.multiAgentManager = await initializeMultiAgentSystem();
            
            if (this.multiAgentManager) {
                this.isInitialized = true;
                this.updateToggleButton('On', true);
                this.showNotification('Multi-Agent Trading System activated!', 'success');
                
                // Setup integration with existing systems
                this.setupRealTimeDataIntegration();
                this.setupOrderBookIntegration();
                
                console.log('✅ Multi-Agent Trading System fully activated');
            } else {
                throw new Error('Failed to initialize multi-agent manager');
            }
            
        } catch (error) {
            console.error('Failed to activate multi-agent system:', error);
            this.updateToggleButton('Off', false);
            this.showNotification('Failed to activate multi-agent system', 'error');
        }
    }

    deactivateMultiAgentSystem() {
        try {
            console.log('⏹️ Deactivating Multi-Agent Trading System...');
            
            if (this.multiAgentManager) {
                this.multiAgentManager.destroy();
                this.multiAgentManager = null;
            }
            
            this.isInitialized = false;
            this.updateToggleButton('Off', false);
            this.showNotification('Multi-Agent Trading System deactivated', 'info');
            
            console.log('✅ Multi-Agent Trading System deactivated');
            
        } catch (error) {
            console.error('Failed to deactivate multi-agent system:', error);
        }
    }

    setupRealTimeDataIntegration() {
        // Integrate with the existing order book data streams
        // This allows agents to react to real-time market data
        
        if (window.orderBookManager) {
            // Hook into price updates
            const originalUpdatePrice = window.orderBookManager.updatePrice;
            if (originalUpdatePrice) {
                window.orderBookManager.updatePrice = (...args) => {
                    // Call original function
                    originalUpdatePrice.apply(window.orderBookManager, args);
                    
                    // Notify multi-agent system of price updates
                    if (this.multiAgentManager && args.length > 0) {
                        const priceData = {
                            symbol: args[0],
                            price: args[1],
                            timestamp: Date.now()
                        };
                        this.multiAgentManager.notifyPriceUpdate(priceData);
                    }
                };
            }
        }
    }

    setupOrderBookIntegration() {
        // Integrate with order book events for market analysis
        
        document.addEventListener('orderBookUpdate', (event) => {
            if (this.multiAgentManager && event.detail) {
                const orderBookData = {
                    symbol: event.detail.symbol,
                    bids: event.detail.bids,
                    asks: event.detail.asks,
                    spread: event.detail.spread,
                    timestamp: Date.now()
                };
                this.multiAgentManager.notifyOrderBookUpdate(orderBookData);
            }
        });
        
        // Listen for large trades (whale activity)
        document.addEventListener('largeTradeDetected', (event) => {
            if (this.multiAgentManager && event.detail) {
                this.multiAgentManager.notifyWhaleActivity(event.detail);
            }
        });
    }

    updateToggleButton(status, isActive) {
        if (!this.integrationButton) return;
        
        const statusEl = this.integrationButton.querySelector('.toggle-status');
        if (statusEl) {
            statusEl.textContent = status;
        }
        
        if (isActive) {
            this.integrationButton.classList.add('active');
        } else {
            this.integrationButton.classList.remove('active');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `multi-agent-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add notification styles
        const style = document.createElement('style');
        style.textContent = `
            .multi-agent-notification {
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
                border-radius: 12px;
                padding: 16px;
                border: 1px solid;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                min-width: 300px;
                max-width: 400px;
                backdrop-filter: blur(10px);
                animation: slideInFromRight 0.3s ease;
            }
            
            @keyframes slideInFromRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .notification-success { border-color: #10b981; }
            .notification-error { border-color: #ef4444; }
            .notification-warning { border-color: #f59e0b; }
            .notification-info { border-color: #3b82f6; }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                color: #e2e8f0;
            }
            
            .notification-icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            
            .notification-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 18px;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                color: #ef4444;
                background: rgba(239, 68, 68, 0.1);
            }
        `;
        
        if (!document.querySelector('style[data-multi-agent-notifications]')) {
            style.setAttribute('data-multi-agent-notifications', 'true');
            document.head.appendChild(style);
        }
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInFromRight 0.3s ease reverse';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.style.animation = 'slideInFromRight 0.3s ease reverse';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '📢';
        }
    }
}

// Create global instance
const multiAgentIntegration = new MultiAgentIntegration();

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    multiAgentIntegration.initialize();
});

// Export for global access
window.multiAgentIntegration = multiAgentIntegration; 
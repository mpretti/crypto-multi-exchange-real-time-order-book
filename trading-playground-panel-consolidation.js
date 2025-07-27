// AI Trading Playground - Panel Consolidation Manager
// Integrates all existing features into the unified panel system

class PanelConsolidationManager {
    constructor() {
        this.existingPanels = new Map();
        this.consolidatedPanels = new Map();
        this.migrationMap = new Map();
        this.hiddenElements = new Set();
        
        this.init();
    }

    init() {
        this.detectExistingPanels();
        this.createMigrationPlan();
        this.setupConsolidationInterface();
        this.startConsolidation();
    }

    detectExistingPanels() {
        // Detect all existing panel-like elements
        const panelSelectors = [
            '.complete-features-panel',
            '.professional-suite-panel',
            '.learning-viz-panel',
            '.ai-coach-panel',
            '.voice-control-panel',
            '.help-center-panel',
            '.tutorial-panel',
            '.advanced-features-panel'
        ];

        panelSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const panelId = this.generatePanelId(element);
                this.existingPanels.set(panelId, {
                    element,
                    selector,
                    originalDisplay: element.style.display,
                    isVisible: !element.style.display || element.style.display !== 'none'
                });
            });
        });

        console.log(`📋 Detected ${this.existingPanels.size} existing panels for consolidation`);
    }

    generatePanelId(element) {
        // Generate unique ID based on element characteristics
        const className = element.className.split(' ')[0];
        const textContent = element.textContent.substring(0, 20).replace(/\s+/g, '-');
        return `${className}-${textContent}`.toLowerCase();
    }

    createMigrationPlan() {
        // Map existing panels to unified panel categories
        this.migrationMap.set('complete-features-panel', {
            targetCategory: 'social',
            targetPanel: 'social-feed',
            priority: 1
        });

        this.migrationMap.set('professional-suite-panel', {
            targetCategory: 'professional',
            targetPanel: 'professional-suite',
            priority: 1
        });

        this.migrationMap.set('learning-viz-panel', {
            targetCategory: 'learning',
            targetPanel: 'learning-viz',
            priority: 2
        });

        this.migrationMap.set('ai-coach-panel', {
            targetCategory: 'learning',
            targetPanel: 'ai-coach',
            priority: 1
        });

        this.migrationMap.set('voice-control-panel', {
            targetCategory: 'advanced',
            targetPanel: 'voice-control',
            priority: 3
        });

        this.migrationMap.set('help-center-panel', {
            targetCategory: 'learning',
            targetPanel: 'help-system',
            priority: 2
        });

        this.migrationMap.set('tutorial-panel', {
            targetCategory: 'learning',
            targetPanel: 'tutorial',
            priority: 1
        });

        this.migrationMap.set('advanced-features-panel', {
            targetCategory: 'analytics',
            targetPanel: 'market-analysis',
            priority: 2
        });
    }

    setupConsolidationInterface() {
        // Create consolidation control interface
        const consolidationInterface = document.createElement('div');
        consolidationInterface.className = 'consolidation-interface';
        consolidationInterface.innerHTML = `
            <div class="consolidation-header">
                <div class="consolidation-title">
                    <i class="fas fa-layer-group"></i>
                    Panel Consolidation
                </div>
                <div class="consolidation-controls">
                    <button class="consolidation-btn" id="auto-consolidate-btn" title="Auto Consolidate">
                        <i class="fas fa-magic"></i>
                        Auto Organize
                    </button>
                    <button class="consolidation-btn" id="show-all-btn" title="Show All Panels">
                        <i class="fas fa-eye"></i>
                        Show All
                    </button>
                    <button class="consolidation-btn" id="hide-all-btn" title="Hide All Panels">
                        <i class="fas fa-eye-slash"></i>
                        Hide All
                    </button>
                    <button class="consolidation-btn" id="toggle-consolidation-btn" title="Toggle Interface">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="consolidation-content">
                <div class="consolidation-stats">
                    <div class="stat-item">
                        <span class="stat-value" id="detected-panels-count">${this.existingPanels.size}</span>
                        <span class="stat-label">Detected</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="consolidated-panels-count">0</span>
                        <span class="stat-label">Consolidated</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="hidden-panels-count">0</span>
                        <span class="stat-label">Hidden</span>
                    </div>
                </div>
                
                <div class="panel-list" id="consolidation-panel-list">
                    <!-- Panel list will be populated here -->
                </div>
                
                <div class="consolidation-actions">
                    <button class="action-btn primary-btn" id="start-consolidation-btn">
                        <i class="fas fa-play"></i>
                        Start Consolidation
                    </button>
                    <button class="action-btn secondary-btn" id="reset-panels-btn">
                        <i class="fas fa-undo"></i>
                        Reset All
                    </button>
                </div>
            </div>
        `;

        // Position the interface
        consolidationInterface.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            width: 320px;
            background: rgba(15, 15, 25, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 165, 0, 0.4);
            border-radius: 15px;
            z-index: 3000;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            max-height: 80vh;
            overflow: hidden;
        `;

        document.body.appendChild(consolidationInterface);
        this.populatePanelList();
        this.setupConsolidationEventHandlers();
    }

    populatePanelList() {
        const panelList = document.getElementById('consolidation-panel-list');
        if (!panelList) return;

        panelList.innerHTML = '';

        this.existingPanels.forEach((panelData, panelId) => {
            const panelItem = document.createElement('div');
            panelItem.className = 'consolidation-panel-item';
            panelItem.innerHTML = `
                <div class="panel-item-info">
                    <div class="panel-item-icon">
                        ${this.getPanelIcon(panelData.selector)}
                    </div>
                    <div class="panel-item-details">
                        <div class="panel-item-title">
                            ${this.getPanelTitle(panelData.selector)}
                        </div>
                        <div class="panel-item-status">
                            ${panelData.isVisible ? 'Visible' : 'Hidden'}
                        </div>
                    </div>
                </div>
                <div class="panel-item-actions">
                    <button class="panel-item-btn toggle-btn" data-panel="${panelId}" title="Toggle Visibility">
                        <i class="fas fa-${panelData.isVisible ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button class="panel-item-btn consolidate-btn" data-panel="${panelId}" title="Consolidate">
                        <i class="fas fa-layer-group"></i>
                    </button>
                </div>
            `;

            panelList.appendChild(panelItem);
        });
    }

    getPanelIcon(selector) {
        const iconMap = {
            '.complete-features-panel': '👥',
            '.professional-suite-panel': '💼',
            '.learning-viz-panel': '🧬',
            '.ai-coach-panel': '🤖',
            '.voice-control-panel': '🎤',
            '.help-center-panel': '❓',
            '.tutorial-panel': '🎓',
            '.advanced-features-panel': '🔧'
        };
        
        return iconMap[selector] || '📋';
    }

    getPanelTitle(selector) {
        const titleMap = {
            '.complete-features-panel': 'Social Features',
            '.professional-suite-panel': 'Professional Suite',
            '.learning-viz-panel': 'Learning Visualization',
            '.ai-coach-panel': 'AI Coach',
            '.voice-control-panel': 'Voice Control',
            '.help-center-panel': 'Help Center',
            '.tutorial-panel': 'Tutorial System',
            '.advanced-features-panel': 'Advanced Features'
        };
        
        return titleMap[selector] || 'Unknown Panel';
    }

    setupConsolidationEventHandlers() {
        // Auto consolidate button
        document.getElementById('auto-consolidate-btn')?.addEventListener('click', () => {
            this.autoConsolidate();
        });

        // Show all panels
        document.getElementById('show-all-btn')?.addEventListener('click', () => {
            this.showAllPanels();
        });

        // Hide all panels
        document.getElementById('hide-all-btn')?.addEventListener('click', () => {
            this.hideAllPanels();
        });

        // Toggle consolidation interface
        document.getElementById('toggle-consolidation-btn')?.addEventListener('click', () => {
            this.toggleConsolidationInterface();
        });

        // Start consolidation
        document.getElementById('start-consolidation-btn')?.addEventListener('click', () => {
            this.startConsolidation();
        });

        // Reset panels
        document.getElementById('reset-panels-btn')?.addEventListener('click', () => {
            this.resetAllPanels();
        });

        // Panel item actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.toggle-btn')) {
                const btn = e.target.closest('.toggle-btn');
                const panelId = btn.dataset.panel;
                this.togglePanelVisibility(panelId);
            }

            if (e.target.closest('.consolidate-btn')) {
                const btn = e.target.closest('.consolidate-btn');
                const panelId = btn.dataset.panel;
                this.consolidatePanel(panelId);
            }
        });
    }

    autoConsolidate() {
        console.log('🔄 Starting auto-consolidation...');
        
        // Hide all existing panels first
        this.hideAllPanels();
        
        // Wait a moment for animations
        setTimeout(() => {
            // Open key panels in unified system
            if (window.unifiedPanelSystem) {
                window.unifiedPanelSystem.openPanelByName('ai-coach');
                window.unifiedPanelSystem.openPanelByName('tutorial');
                window.unifiedPanelSystem.openPanelByName('chart-enhancement');
                
                // Organize them nicely
                setTimeout(() => {
                    window.unifiedPanelSystem.organizePanels();
                }, 500);
            }
            
            this.showNotification('✨ Auto-consolidation complete! Key panels are now organized.', 'success');
        }, 500);
    }

    showAllPanels() {
        this.existingPanels.forEach((panelData, panelId) => {
            if (panelData.element) {
                panelData.element.style.display = panelData.originalDisplay || 'block';
                panelData.isVisible = true;
                this.hiddenElements.delete(panelData.element);
            }
        });
        
        this.updateStats();
        this.populatePanelList();
        this.showNotification('👁️ All panels are now visible', 'info');
    }

    hideAllPanels() {
        this.existingPanels.forEach((panelData, panelId) => {
            if (panelData.element) {
                panelData.element.style.display = 'none';
                panelData.isVisible = false;
                this.hiddenElements.add(panelData.element);
            }
        });
        
        this.updateStats();
        this.populatePanelList();
        this.showNotification('🙈 All panels are now hidden', 'info');
    }

    togglePanelVisibility(panelId) {
        const panelData = this.existingPanels.get(panelId);
        if (!panelData || !panelData.element) return;

        if (panelData.isVisible) {
            panelData.element.style.display = 'none';
            panelData.isVisible = false;
            this.hiddenElements.add(panelData.element);
        } else {
            panelData.element.style.display = panelData.originalDisplay || 'block';
            panelData.isVisible = true;
            this.hiddenElements.delete(panelData.element);
        }

        this.updateStats();
        this.populatePanelList();
    }

    consolidatePanel(panelId) {
        const panelData = this.existingPanels.get(panelId);
        if (!panelData) return;

        // Find migration target
        const migrationTarget = this.findMigrationTarget(panelData.selector);
        
        if (migrationTarget && window.unifiedPanelSystem) {
            // Hide original panel
            panelData.element.style.display = 'none';
            panelData.isVisible = false;
            this.hiddenElements.add(panelData.element);
            
            // Open in unified system
            window.unifiedPanelSystem.openPanelByName(migrationTarget.targetPanel);
            
            // Mark as consolidated
            this.consolidatedPanels.set(panelId, migrationTarget);
            
            this.updateStats();
            this.populatePanelList();
            
            this.showNotification(`📦 Panel consolidated to ${migrationTarget.targetPanel}`, 'success');
        } else {
            this.showNotification('❌ Could not find consolidation target for this panel', 'error');
        }
    }

    findMigrationTarget(selector) {
        for (const [key, value] of this.migrationMap.entries()) {
            if (selector.includes(key.replace('-panel', ''))) {
                return value;
            }
        }
        return null;
    }

    startConsolidation() {
        console.log('🚀 Starting comprehensive panel consolidation...');
        
        let consolidatedCount = 0;
        const totalPanels = this.existingPanels.size;
        
        // Consolidate panels one by one with animation
        const consolidateNext = (index = 0) => {
            const panelIds = Array.from(this.existingPanels.keys());
            
            if (index >= panelIds.length) {
                this.showNotification(`🎉 Consolidation complete! ${consolidatedCount}/${totalPanels} panels consolidated.`, 'success');
                return;
            }
            
            const panelId = panelIds[index];
            const panelData = this.existingPanels.get(panelId);
            const migrationTarget = this.findMigrationTarget(panelData.selector);
            
            if (migrationTarget && migrationTarget.priority <= 2) {
                this.consolidatePanel(panelId);
                consolidatedCount++;
            }
            
            // Continue with next panel
            setTimeout(() => consolidateNext(index + 1), 200);
        };
        
        consolidateNext();
    }

    resetAllPanels() {
        // Show all original panels
        this.existingPanels.forEach((panelData, panelId) => {
            if (panelData.element) {
                panelData.element.style.display = panelData.originalDisplay || 'block';
                panelData.isVisible = true;
                this.hiddenElements.delete(panelData.element);
            }
        });
        
        // Close all unified panels
        if (window.unifiedPanelSystem) {
            window.unifiedPanelSystem.closeAllPanels();
        }
        
        // Clear consolidated panels
        this.consolidatedPanels.clear();
        
        this.updateStats();
        this.populatePanelList();
        this.showNotification('🔄 All panels have been reset to their original state', 'info');
    }

    toggleConsolidationInterface() {
        const interface_ = document.querySelector('.consolidation-interface');
        if (interface_) {
            interface_.style.display = interface_.style.display === 'none' ? 'block' : 'none';
        }
    }

    updateStats() {
        const detectedCount = this.existingPanels.size;
        const consolidatedCount = this.consolidatedPanels.size;
        const hiddenCount = this.hiddenElements.size;
        
        const detectedEl = document.getElementById('detected-panels-count');
        const consolidatedEl = document.getElementById('consolidated-panels-count');
        const hiddenEl = document.getElementById('hidden-panels-count');
        
        if (detectedEl) detectedEl.textContent = detectedCount;
        if (consolidatedEl) consolidatedEl.textContent = consolidatedCount;
        if (hiddenEl) hiddenEl.textContent = hiddenCount;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `consolidation-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 360px;
            background: rgba(15, 15, 25, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff6b6b' : '#74b9ff'};
            border-radius: 8px;
            padding: 15px 20px;
            color: white;
            z-index: 3001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Public API
    getConsolidationStatus() {
        return {
            detected: this.existingPanels.size,
            consolidated: this.consolidatedPanels.size,
            hidden: this.hiddenElements.size
        };
    }

    forceConsolidateAll() {
        this.autoConsolidate();
    }

    restoreOriginalLayout() {
        this.resetAllPanels();
    }
}

// CSS for consolidation interface
const consolidationStyles = document.createElement('style');
consolidationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .consolidation-interface {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .consolidation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(255, 140, 0, 0.1));
        border-bottom: 1px solid rgba(255, 165, 0, 0.2);
    }
    
    .consolidation-title {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #ffa500;
        font-weight: bold;
        font-size: 1.1em;
    }
    
    .consolidation-controls {
        display: flex;
        gap: 6px;
    }
    
    .consolidation-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: white;
        width: 32px;
        height: 32px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8em;
    }
    
    .consolidation-btn:hover {
        background: rgba(255, 165, 0, 0.2);
        border-color: #ffa500;
        transform: translateY(-1px);
    }
    
    .consolidation-content {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
    }
    
    .consolidation-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .stat-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 15px;
        text-align: center;
    }
    
    .stat-value {
        display: block;
        font-size: 1.5em;
        font-weight: bold;
        color: #ffa500;
        margin-bottom: 5px;
    }
    
    .stat-label {
        font-size: 0.8em;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .panel-list {
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 20px;
    }
    
    .consolidation-panel-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px 15px;
        margin-bottom: 8px;
        transition: all 0.3s ease;
    }
    
    .consolidation-panel-item:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 165, 0, 0.3);
    }
    
    .panel-item-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
    }
    
    .panel-item-icon {
        font-size: 1.2em;
        width: 24px;
        text-align: center;
    }
    
    .panel-item-details {
        flex: 1;
    }
    
    .panel-item-title {
        color: white;
        font-weight: 500;
        font-size: 0.9em;
        margin-bottom: 2px;
    }
    
    .panel-item-status {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.7em;
    }
    
    .panel-item-actions {
        display: flex;
        gap: 6px;
    }
    
    .panel-item-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: white;
        width: 28px;
        height: 28px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8em;
    }
    
    .panel-item-btn:hover {
        background: rgba(255, 165, 0, 0.2);
        border-color: #ffa500;
        transform: scale(1.1);
    }
    
    .consolidation-actions {
        display: flex;
        gap: 12px;
    }
    
    .action-btn {
        flex: 1;
        padding: 12px 16px;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9em;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .primary-btn {
        background: linear-gradient(45deg, #ffa500, #ff8c00);
        color: white;
    }
    
    .secondary-btn {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .consolidation-notification {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.1em;
    }
    
    .consolidation-content::-webkit-scrollbar,
    .panel-list::-webkit-scrollbar {
        width: 6px;
    }
    
    .consolidation-content::-webkit-scrollbar-track,
    .panel-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }
    
    .consolidation-content::-webkit-scrollbar-thumb,
    .panel-list::-webkit-scrollbar-thumb {
        background: linear-gradient(45deg, #ffa500, #ff8c00);
        border-radius: 10px;
    }
`;

document.head.appendChild(consolidationStyles);

// Initialize panel consolidation manager
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.panelConsolidationManager = new PanelConsolidationManager();
        console.log('📦 Panel Consolidation Manager initialized');
    }, 2000);
}); 
/**
 * Common Header Component for Crypto Multi-Exchange Real-Time Order Book
 */
class CommonHeader {
    constructor(options = {}) {
        console.log('CommonHeader: Constructor called with options:', options);
        this.options = {
            currentPage: options.currentPage || '',
            showStatus: options.showStatus !== false,
            showNavigation: options.showNavigation !== false,
            customActions: options.customActions || [],
            ...options
        };
        
        this.systemStatus = { online: true, connections: 0 };
        console.log('CommonHeader: Calling init()');
        this.init();
    }
    
    init() {
        console.log('CommonHeader: init() called');
        this.createHeaderElement();
        this.setupEventListeners();
        if (this.options.showStatus) {
            this.startStatusUpdates();
        }
        console.log('CommonHeader: init() completed');
    }
    
    createHeaderElement() {
        console.log('CommonHeader: createHeaderElement() called');
        const header = document.createElement('header');
        header.className = 'crypto-header';
        console.log('CommonHeader: Header element created:', header);
        header.innerHTML = this.getHeaderHTML();
        console.log('CommonHeader: Header HTML set, innerHTML length:', header.innerHTML.length);
        document.body.insertBefore(header, document.body.firstChild);
        console.log('CommonHeader: Header inserted into DOM');
        
        if (!document.getElementById('common-header-styles')) {
            console.log('CommonHeader: Adding styles');
            this.addStyles();
        } else {
            console.log('CommonHeader: Styles already exist');
        }
    }
    
    getHeaderHTML() {
        return `
            <div class="header-container">
                <div class="header-brand">
                    <div class="brand-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="brand-text">
                        <h1>Crypto Multi-Exchange</h1>
                        <div class="brand-subtitle">Real-time Order Book</div>
                    </div>
                </div>
                
                ${this.getNavigationHTML()}
                
                <div class="header-actions">
                    ${this.getStatusHTML()}
                    ${this.getCustomActionsHTML()}
                    
                    <button class="header-menu-toggle">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
            </div>
            
            <div id="mobile-nav" class="mobile-nav">
                ${this.getMobileNavigationHTML()}
            </div>
        `;
    }
    
    getNavigationHTML() {
        const navItems = [
            { id: 'main', label: 'Live Trading', icon: 'chart-line', url: '/index.html' },
            { id: 'trading-playground', label: 'Trading Playground', icon: 'gamepad', url: '/trading-playground.html' },
            { id: 'charts', label: 'Charts Dashboard', icon: 'chart-bar', url: '/charts-dashboard.html' },
            { id: 'volume', label: 'Volume Dashboard', icon: 'signal', url: '/volume-dashboard.html' },
            { id: 'pairs', label: 'Trading Pairs', icon: 'exchange-alt', url: '/trading-pairs-explorer.html' },
            { id: 'exchange-status', label: 'Exchange Status', icon: 'server', url: '/exchange-status.html' },
            { id: 'historical', label: 'Historical Data', icon: 'database', url: '/historical-data/web/' }
        ];
        
        return `
            <nav class="header-nav">
                <ul class="nav-list">
                    ${navItems.map(item => `
                        <li class="nav-item ${this.options.currentPage === item.id ? 'active' : ''}">
                            <a href="${item.url}" class="nav-link">
                                <i class="fas fa-${item.icon}"></i>
                                <span>${item.label}</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </nav>
        `;
    }
    
    getMobileNavigationHTML() {
        const navItems = [
            { id: 'main', label: 'Live Trading', icon: 'chart-line', url: '/index.html' },
            { id: 'trading-playground', label: 'Trading Playground', icon: 'gamepad', url: '/trading-playground.html' },
            { id: 'charts', label: 'Charts Dashboard', icon: 'chart-bar', url: '/charts-dashboard.html' },
            { id: 'volume', label: 'Volume Dashboard', icon: 'signal', url: '/volume-dashboard.html' },
            { id: 'pairs', label: 'Trading Pairs', icon: 'exchange-alt', url: '/trading-pairs-explorer.html' },
            { id: 'exchange-status', label: 'Exchange Status', icon: 'server', url: '/exchange-status.html' },
            { id: 'historical', label: 'Historical Data', icon: 'database', url: '/historical-data/web/' }
        ];
        
        return `
            <ul class="mobile-nav-list">
                ${navItems.map(item => `
                    <li class="mobile-nav-item ${this.options.currentPage === item.id ? 'active' : ''}">
                        <a href="${item.url}" class="mobile-nav-link">
                            <i class="fas fa-${item.icon}"></i>
                            <span>${item.label}</span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        `;
    }
    
    getStatusHTML() {
        return `
            <div class="system-status">
                <div class="status-indicator ${this.systemStatus.online ? 'online' : 'offline'}">
                    <div class="status-dot"></div>
                    <span class="status-text">${this.systemStatus.online ? 'Online' : 'Offline'}</span>
                </div>
                <div class="status-details">
                    <span class="connections-count">${this.systemStatus.connections} connections</span>
                </div>
            </div>
        `;
    }
    
    getCustomActionsHTML() {
        if (!this.options.customActions.length) return '';
        
        return `
            <div class="custom-actions">
                ${this.options.customActions.map(action => `
                    <button class="action-btn ${action.class || ''}" onclick="${action.onclick || ''}" title="${action.title || ''}">
                        <i class="fas fa-${action.icon}"></i>
                        ${action.label ? `<span>${action.label}</span>` : ''}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    setupEventListeners() {
        const menuToggle = document.querySelector('.header-menu-toggle');
        const mobileNav = document.getElementById('mobile-nav');
        
        if (menuToggle && mobileNav) {
            menuToggle.addEventListener('click', () => {
                mobileNav.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }
        
        document.addEventListener('click', (e) => {
            if (mobileNav && !e.target.closest('.header-menu-toggle') && !e.target.closest('.mobile-nav')) {
                mobileNav.classList.remove('active');
                menuToggle?.classList.remove('active');
            }
        });
    }
    
    startStatusUpdates() {
        setInterval(() => this.updateSystemStatus(), 30000);
        this.updateSystemStatus();
    }
    
    updateSystemStatus() {
        const statusIndicator = document.querySelector('.status-indicator');
        const connectionsCount = document.querySelector('.connections-count');
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.systemStatus.online ? 'online' : 'offline'}`;
            statusIndicator.querySelector('.status-text').textContent = this.systemStatus.online ? 'Online' : 'Offline';
        }
        
        if (connectionsCount) {
            connectionsCount.textContent = `${this.systemStatus.connections} connections`;
        }
    }
    
    setSystemStatus(online, connections = 0) {
        this.systemStatus.online = online;
        this.systemStatus.connections = connections;
        this.updateSystemStatus();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.id = 'common-header-styles';
        style.textContent = `
            .crypto-header {
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%);
                color: white; padding: 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                position: sticky; top: 0; z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .header-container { max-width: 1400px; margin: 0 auto; display: flex; align-items: center;
                justify-content: space-between; padding: 1rem 1.5rem; gap: 2rem; }
            .header-brand { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }
            .brand-icon { background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 0.75rem;
                display: flex; align-items: center; justify-content: center; }
            .brand-icon i { font-size: 1.5rem; color: #fbbf24; }
            .brand-text h1 { margin: 0; font-size: 1.25rem; font-weight: 700; line-height: 1.2; }
            .brand-subtitle { font-size: 0.875rem; opacity: 0.8; font-weight: 400; }
            .header-nav { flex: 1; max-width: 800px; }
            .nav-list { display: flex; list-style: none; margin: 0; padding: 0; gap: 0.5rem; flex-wrap: wrap; }
            .nav-link { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem;
                color: rgba(255, 255, 255, 0.9); text-decoration: none; border-radius: 8px;
                transition: all 0.2s ease; font-size: 0.875rem; font-weight: 500; white-space: nowrap; }
            .nav-link:hover { background: rgba(255, 255, 255, 0.1); color: white; transform: translateY(-1px); }
            .nav-item.active .nav-link { background: rgba(255, 255, 255, 0.15); color: white;
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2); }
            .header-actions { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }
            .system-status { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
            .status-indicator { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 500; }
            .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: pulse 2s infinite; }
            .status-indicator.online .status-dot { background: #10b981; }
            .status-details { font-size: 0.75rem; opacity: 0.8; }
            .custom-actions { display: flex; gap: 0.5rem; }
            .action-btn { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);
                color: white; padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer;
                transition: all 0.2s ease; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
            .action-btn:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
            .header-menu-toggle { display: none; background: rgba(255, 255, 255, 0.1); border: none;
                color: white; padding: 0.75rem; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; }
            .header-menu-toggle:hover { background: rgba(255, 255, 255, 0.2); }
            .mobile-nav { display: none; background: #1e40af; border-top: 1px solid rgba(255, 255, 255, 0.1);
                max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
            .mobile-nav.active { max-height: 500px; }
            .mobile-nav-list { list-style: none; margin: 0; padding: 1rem; }
            .mobile-nav-item { margin-bottom: 0.5rem; }
            .mobile-nav-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
                color: rgba(255, 255, 255, 0.9); text-decoration: none; border-radius: 8px; transition: all 0.2s ease; }
            .mobile-nav-link:hover, .mobile-nav-item.active .mobile-nav-link { background: rgba(255, 255, 255, 0.1); color: white; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            @media (max-width: 1024px) { .header-nav { display: none; } .header-menu-toggle { display: block; }
                .mobile-nav { display: block; } .status-details { display: none; } }
            @media (max-width: 768px) { .header-container { padding: 0.75rem 1rem; gap: 1rem; }
                .brand-text h1 { font-size: 1.125rem; } .brand-subtitle { display: none; }
                .custom-actions .action-btn span { display: none; } }
        `;
        document.head.appendChild(style);
    }
}

// Auto-initialize if page has data-header attribute
document.addEventListener('DOMContentLoaded', () => {
    console.log('CommonHeader: DOMContentLoaded event fired');
    const headerConfig = document.body.dataset.header;
    console.log('CommonHeader: headerConfig found:', headerConfig);
    if (headerConfig) {
        try {
            const options = JSON.parse(headerConfig);
            console.log('CommonHeader: Parsed options:', options);
            const header = new CommonHeader(options);
            console.log('CommonHeader: Instance created:', header);
        } catch (e) {
            console.error('CommonHeader: Error parsing config, using defaults:', e);
            const header = new CommonHeader();
            console.log('CommonHeader: Default instance created:', header);
        }
    } else {
        console.log('CommonHeader: No data-header attribute found');
    }
});

window.CommonHeader = CommonHeader;

/**
 * 🐋 Whale Watcher & ⏰ Time & Sales Implementation
 * Advanced trade monitoring for crypto exchanges
 */

// 🐋 Whale Watcher Class
class WhaleWatcher {
    constructor() {
        this.whales = [];
        this.threshold = 250; // Default 250 BTC
        this.totalWhaleVolume = 0;
        this.isActive = true;
        this.init();
    }

    init() {
        console.log('🐋 Initializing Whale Watcher...');
        this.bindEvents();
        this.startWhaleDetection();
        this.updateWhaleStats();
        this.showNotification('🐋 Whale Watcher activated - monitoring large trades');
    }

    bindEvents() {
        const thresholdSelect = document.getElementById('whaleThreshold');
        if (thresholdSelect) {
            thresholdSelect.addEventListener('change', (e) => {
                this.threshold = parseInt(e.target.value);
                this.filterWhalesByThreshold();
                this.showNotification(`🐋 Whale threshold set to ${this.threshold}+ BTC`);
            });
        }
    }

    startWhaleDetection() {
        const detectWhale = () => {
            if (this.isActive && Math.random() < 0.25) { // 25% chance of whale trade
                this.generateWhaleTradeData();
            }
            setTimeout(detectWhale, Math.random() * 8000 + 2000); // 2-10 seconds
        };
        detectWhale();
    }

    generateWhaleTradeData() {
        const exchanges = [
            { name: 'Binance', color: '#f3ba2f' },
            { name: 'Bybit', color: '#f7931a' },
            { name: 'OKX', color: '#007bff' },
            { name: 'Kraken', color: '#5c6bc0' },
            { name: 'Uniswap', color: '#ff6b9d' }
        ];
        const sides = ['BUY', 'SELL'];
        
        // Generate whale-sized trade
        const minSize = this.threshold;
        const maxSize = this.threshold * 8; // Up to 8x threshold
        const size = minSize + Math.random() * (maxSize - minSize);
        const basePrice = 44700;
        const price = basePrice + (Math.random() - 0.5) * 300; // ±$150 variance
        const value = size * price;
        const exchange = exchanges[Math.floor(Math.random() * exchanges.length)];
        
        const whale = {
            id: Date.now() + Math.random(),
            time: new Date(),
            exchange: exchange.name,
            exchangeColor: exchange.color,
            side: sides[Math.floor(Math.random() * sides.length)],
            size: size,
            price: price,
            value: value,
            isNew: true,
            timestamp: Date.now()
        };

        this.whales.unshift(whale);
        this.totalWhaleVolume += size;

        // Keep only last 200 whale trades
        if (this.whales.length > 200) {
            const removed = this.whales.splice(200);
            removed.forEach(w => this.totalWhaleVolume -= w.size);
        }

        this.updateWhaleDisplay();
        this.updateWhaleStats();
        
        // Show notifications for significant whales
        if (size > 2000) {
            this.showNotification(`🚨 MEGA WHALE: ${size.toFixed(0)} BTC (${(value/1000000).toFixed(1)}M USD) on ${whale.exchange}!`);
        } else if (size > 1000) {
            this.showNotification(`🐋 LARGE WHALE: ${size.toFixed(0)} BTC on ${whale.exchange}`);
        }
    }

    updateWhaleDisplay() {
        const container = document.getElementById('whaleTradesList');
        if (!container) return;

        container.innerHTML = '';

        const filteredWhales = this.whales.filter(w => w.size >= this.threshold);
        
        filteredWhales.slice(0, 50).forEach((whale, index) => {
            const tradeEl = document.createElement('div');
            tradeEl.className = `whale-trade ${whale.isNew ? 'new' : ''}`;
            
            // Add whale size indicator
            let whaleIcon = '🐋';
            if (whale.size > 2000) whaleIcon = '🐳'; // Mega whale
            else if (whale.size > 1000) whaleIcon = '🐋'; // Large whale
            else if (whale.size > 500) whaleIcon = '🐟'; // Medium whale
            
            tradeEl.innerHTML = `
                <span class="trade-time">${whale.time.toLocaleTimeString()}</span>
                <span class="trade-exchange" style="color: ${whale.exchangeColor}">${whale.exchange}</span>
                <span class="trade-side ${whale.side.toLowerCase()}">${whaleIcon} ${whale.side}</span>
                <span class="trade-size">${whale.size.toFixed(1)} BTC</span>
                <span class="trade-price">$${whale.price.toFixed(2)}</span>
                <span class="trade-value">$${(whale.value / 1000000).toFixed(2)}M</span>
            `;
            
            container.appendChild(tradeEl);
            
            // Remove new class after animation
            if (whale.isNew) {
                setTimeout(() => {
                    whale.isNew = false;
                    tradeEl.classList.remove('new');
                }, 3000);
            }
        });
    }

    updateWhaleStats() {
        const now = Date.now();
        const last24h = now - (24 * 60 * 60 * 1000);
        const filteredWhales = this.whales.filter(w => w.size >= this.threshold && w.timestamp > last24h);
        
        const whaleCount = filteredWhales.length;
        const whaleVolume = filteredWhales.reduce((sum, w) => sum + w.size, 0);
        const largestWhale = filteredWhales.length > 0 ? Math.max(...filteredWhales.map(w => w.size)) : 0;
        const totalVolume = 75000; // Simulated total market volume (24h)
        const whalePercent = totalVolume > 0 ? (whaleVolume / totalVolume) * 100 : 0;

        this.updateElement('whaleCount', whaleCount.toString());
        this.updateElement('whaleVolume', `${whaleVolume.toFixed(0)} BTC`);
        this.updateElement('whalePercent', `${whalePercent.toFixed(1)}%`);
        this.updateElement('largestWhale', `${largestWhale.toFixed(0)} BTC`);
    }

    filterWhalesByThreshold() {
        this.updateWhaleDisplay();
        this.updateWhaleStats();
    }

    exportWhales() {
        const filteredWhales = this.whales.filter(w => w.size >= this.threshold);
        const data = {
            timestamp: new Date().toISOString(),
            threshold: this.threshold,
            whales: filteredWhales,
            summary: {
                totalWhales: filteredWhales.length,
                totalVolume: filteredWhales.reduce((sum, w) => sum + w.size, 0),
                avgTradeSize: filteredWhales.length > 0 ? filteredWhales.reduce((sum, w) => sum + w.size, 0) / filteredWhales.length : 0,
                largestTrade: filteredWhales.length > 0 ? Math.max(...filteredWhales.map(w => w.size)) : 0
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whale-trades-${this.threshold}btc-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`💾 Exported ${filteredWhales.length} whale trades`);
    }

    clearWhales() {
        this.whales = [];
        this.totalWhaleVolume = 0;
        this.updateWhaleDisplay();
        this.updateWhaleStats();
        this.showNotification('🗑️ All whale trades cleared');
    }

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    showNotification(message) {
        console.log(message);
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(79, 172, 254, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
            animation: slideInRight 0.3s ease;
            max-width: 350px;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// ⏰ Time & Sales Class
class TimeSales {
    constructor() {
        this.trades = [];
        this.isRunning = true;
        this.exchangeFilter = 'all';
        this.sizeFilter = 'all';
        this.tradesPerSecond = 0;
        this.tradeCount = 0;
        this.buyCount = 0;
        this.sellCount = 0;
        this.totalVolume = 0;
        this.init();
    }

    init() {
        console.log('⏰ Initializing Time & Sales...');
        this.bindEvents();
        this.startTradeGeneration();
        this.startStatsUpdater();
        this.showNotification('⏰ Time & Sales activated - monitoring all trades');
    }

    bindEvents() {
        const exchangeFilter = document.getElementById('exchangeFilter');
        if (exchangeFilter) {
            exchangeFilter.addEventListener('change', (e) => {
                this.exchangeFilter = e.target.value;
                this.updateTradeDisplay();
                this.showNotification(`📊 Filter: ${e.target.value === 'all' ? 'All Exchanges' : e.target.value}`);
            });
        }

        const sizeFilter = document.getElementById('sizeFilter');
        if (sizeFilter) {
            sizeFilter.addEventListener('change', (e) => {
                this.sizeFilter = e.target.value === 'all' ? 'all' : parseFloat(e.target.value);
                this.updateTradeDisplay();
                this.showNotification(`📏 Size filter: ${e.target.value === 'all' ? 'All Sizes' : e.target.value + '+ BTC'}`);
            });
        }
    }

    startTradeGeneration() {
        const generateTrade = () => {
            if (this.isRunning) {
                // Generate 1-8 trades at once (burst trading)
                const numTrades = Math.floor(Math.random() * 8) + 1;
                for (let i = 0; i < numTrades; i++) {
                    setTimeout(() => this.generateTradeData(), i * 50); // Stagger by 50ms
                }
            }
            setTimeout(generateTrade, Math.random() * 3000 + 500); // 0.5-3.5 seconds
        };
        generateTrade();
    }

    generateTradeData() {
        const exchanges = [
            { name: 'Binance', color: '#f3ba2f', volume: 0.4 },
            { name: 'Bybit', color: '#f7931a', volume: 0.25 },
            { name: 'OKX', color: '#007bff', volume: 0.15 },
            { name: 'Kraken', color: '#5c6bc0', volume: 0.1 },
            { name: 'Uniswap', color: '#ff6b9d', volume: 0.1 }
        ];
        
        // Weighted exchange selection based on volume
        const rand = Math.random();
        let cumulative = 0;
        let selectedExchange = exchanges[0];
        
        for (const exchange of exchanges) {
            cumulative += exchange.volume;
            if (rand <= cumulative) {
                selectedExchange = exchange;
                break;
            }
        }
        
        const sides = ['BUY', 'SELL'];
        
        // Generate realistic trade sizes (most trades are small)
        let size;
        const sizeRand = Math.random();
        if (sizeRand < 0.7) {
            size = Math.random() * 5 + 0.01; // 70% small trades (0.01-5 BTC)
        } else if (sizeRand < 0.9) {
            size = Math.random() * 20 + 5; // 20% medium trades (5-25 BTC)
        } else {
            size = Math.random() * 100 + 25; // 10% large trades (25-125 BTC)
        }
        
        const basePrice = 44700;
        const price = basePrice + (Math.random() - 0.5) * 50; // ±$25 variance
        const value = size * price;
        const side = sides[Math.floor(Math.random() * sides.length)];
        
        const trade = {
            id: Date.now() + Math.random(),
            time: new Date(),
            exchange: selectedExchange.name,
            exchangeColor: selectedExchange.color,
            side: side,
            size: size,
            price: price,
            value: value,
            isNew: true,
            timestamp: Date.now()
        };

        this.trades.unshift(trade);
        this.tradeCount++;
        this.totalVolume += size;
        
        if (side === 'BUY') {
            this.buyCount++;
        } else {
            this.sellCount++;
        }

        // Keep only last 1000 trades
        if (this.trades.length > 1000) {
            const removed = this.trades.splice(1000);
            removed.forEach(t => this.totalVolume -= t.size);
        }

        this.updateTradeDisplay();
    }

    updateTradeDisplay() {
        const container = document.getElementById('timeSalesList');
        if (!container) return;

        // Filter trades
        let filteredTrades = this.trades;
        
        if (this.exchangeFilter !== 'all') {
            filteredTrades = filteredTrades.filter(t => t.exchange.toLowerCase() === this.exchangeFilter);
        }
        
        if (this.sizeFilter !== 'all' && this.sizeFilter > 0) {
            filteredTrades = filteredTrades.filter(t => t.size >= this.sizeFilter);
        }

        container.innerHTML = '';

        // Display filtered trades (last 100)
        filteredTrades.slice(0, 100).forEach(trade => {
            const tradeEl = document.createElement('div');
            tradeEl.className = `time-sales-trade ${trade.isNew ? 'new' : ''}`;
            
            // Add size indicator
            let sizeIcon = '';
            if (trade.size >= 100) sizeIcon = '🔥';
            else if (trade.size >= 50) sizeIcon = '⚡';
            else if (trade.size >= 10) sizeIcon = '📊';
            
            tradeEl.innerHTML = `
                <span class="trade-time">${trade.time.toLocaleTimeString()}</span>
                <span class="trade-exchange" style="color: ${trade.exchangeColor}">${trade.exchange}</span>
                <span class="trade-side ${trade.side.toLowerCase()}">${sizeIcon} ${trade.side}</span>
                <span class="trade-size">${trade.size.toFixed(3)} BTC</span>
                <span class="trade-price">$${trade.price.toFixed(2)}</span>
                <span class="trade-value">$${(trade.value / 1000).toFixed(1)}K</span>
            `;
            
            container.appendChild(tradeEl);
            
            // Remove new class after animation
            if (trade.isNew) {
                setTimeout(() => {
                    trade.isNew = false;
                    tradeEl.classList.remove('new');
                }, 2000);
            }
        });
    }

    startStatsUpdater() {
        let lastTradeCount = 0;
        let lastUpdateTime = Date.now();
        
        setInterval(() => {
            const now = Date.now();
            const timeDiff = (now - lastUpdateTime) / 1000; // seconds
            
            // Calculate trades per second
            const currentTradeCount = this.tradeCount;
            this.tradesPerSecond = Math.round((currentTradeCount - lastTradeCount) / timeDiff);
            lastTradeCount = currentTradeCount;
            lastUpdateTime = now;
            
            this.updateStats();
        }, 1000);
    }

    updateStats() {
        const recentTrades = this.trades.slice(0, 200); // Last 200 trades
        const avgSize = recentTrades.length > 0 ? 
            recentTrades.reduce((sum, t) => sum + t.size, 0) / recentTrades.length : 0;
        
        const buyTrades = recentTrades.filter(t => t.side === 'BUY').length;
        const sellTrades = recentTrades.filter(t => t.side === 'SELL').length;
        const total = buyTrades + sellTrades;
        const buyPercent = total > 0 ? (buyTrades / total * 100).toFixed(0) : 50;
        const sellPercent = total > 0 ? (sellTrades / total * 100).toFixed(0) : 50;

        this.updateElement('tradesPerSecond', this.tradesPerSecond.toString());
        this.updateElement('avgTradeSize', `${avgSize.toFixed(3)} BTC`);
        this.updateElement('buyVsSell', `${buyPercent}/${sellPercent}`);
        this.updateElement('totalTrades', this.tradeCount.toLocaleString());
    }

    pauseUpdates() {
        this.isRunning = !this.isRunning;
        const btn = document.getElementById('pauseBtn');
        if (btn) {
            btn.textContent = this.isRunning ? '⏸️' : '▶️';
        }
        
        const message = this.isRunning ? '▶️ Time & Sales resumed' : '⏸️ Time & Sales paused';
        this.showNotification(message);
    }

    exportTrades() {
        let filteredTrades = this.trades;
        
        if (this.exchangeFilter !== 'all') {
            filteredTrades = filteredTrades.filter(t => t.exchange.toLowerCase() === this.exchangeFilter);
        }
        
        if (this.sizeFilter !== 'all' && this.sizeFilter > 0) {
            filteredTrades = filteredTrades.filter(t => t.size >= this.sizeFilter);
        }
        
        const data = {
            timestamp: new Date().toISOString(),
            filters: {
                exchange: this.exchangeFilter,
                minSize: this.sizeFilter
            },
            trades: filteredTrades.slice(0, 2000), // Export last 2000 filtered trades
            stats: {
                totalTrades: this.tradeCount,
                tradesPerSecond: this.tradesPerSecond,
                totalVolume: this.totalVolume,
                buyCount: this.buyCount,
                sellCount: this.sellCount
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-sales-${this.exchangeFilter}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification(`💾 Exported ${filteredTrades.length} trades`);
    }

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    showNotification(message) {
        console.log(message);
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(26, 222, 129, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(26, 222, 129, 0.3);
            animation: slideInRight 0.3s ease;
            max-width: 350px;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Global references for external access
window.WhaleWatcher = WhaleWatcher;
window.TimeSales = TimeSales;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (document.getElementById('whaleTradesList')) {
            window.whaleWatcher = new WhaleWatcher();
        }
        if (document.getElementById('timeSalesList')) {
            window.timeSales = new TimeSales();
        }
        console.log('🐋⏰ Whale Watcher and Time & Sales systems ready!');
    }, 1000);
});

// Add required CSS styles
const whaleTimeSalesStyles = document.createElement('style');
whaleTimeSalesStyles.textContent = `
    /* Whale Watcher & Time Sales Styles */
    .whale-content, .time-sales-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    .whale-stats, .time-sales-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 16px;
    }
    
    .whale-stat, .sales-stat {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(255, 255, 255, 0.05);
        padding: 16px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
    }
    
    .whale-stat:hover, .sales-stat:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(79, 172, 254, 0.3);
    }
    
    .stat-icon {
        font-size: 24px;
        width: 40px;
        text-align: center;
    }
    
    .stat-info {
        flex: 1;
    }
    
    .stat-value {
        font-size: 20px;
        font-weight: 600;
        color: #4facfe;
        margin-bottom: 4px;
    }
    
    .stat-label {
        font-size: 12px;
        color: #a0a0a0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .sales-stat {
        text-align: center;
        flex-direction: column;
        gap: 8px;
    }
    
    .sales-stat .stat-value {
        font-size: 18px;
    }
    
    .whale-trades-container, .time-sales-container {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .whale-trade-header, .time-sales-header {
        display: grid;
        grid-template-columns: 80px 100px 80px 100px 100px 120px;
        gap: 8px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.1);
        font-size: 12px;
        font-weight: 600;
        color: #b0b0b0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .whale-trades-list, .time-sales-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .whale-trade, .time-sales-trade {
        display: grid;
        grid-template-columns: 80px 100px 80px 100px 100px 120px;
        gap: 8px;
        padding: 8px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        font-size: 12px;
        transition: all 0.2s ease;
    }
    
    .whale-trade:hover, .time-sales-trade:hover {
        background: rgba(255, 255, 255, 0.05);
    }
    
    .whale-trade.new, .time-sales-trade.new {
        background: rgba(79, 172, 254, 0.15);
        animation: highlightTrade 3s ease-out;
    }
    
    @keyframes highlightTrade {
        0% { 
            background: rgba(79, 172, 254, 0.4);
            transform: scale(1.01);
        }
        100% { 
            background: rgba(79, 172, 254, 0.05);
            transform: scale(1);
        }
    }
    
    .trade-time {
        color: #a0a0a0;
        font-family: 'Courier New', monospace;
        font-size: 11px;
    }
    
    .trade-exchange {
        font-weight: 600;
        font-size: 11px;
    }
    
    .trade-side {
        font-weight: 600;
        font-size: 11px;
    }
    
    .trade-side.buy {
        color: #26de81;
    }
    
    .trade-side.sell {
        color: #ff4757;
    }
    
    .trade-size {
        color: #e0e0e0;
        font-weight: 600;
        font-family: 'Courier New', monospace;
    }
    
    .trade-price {
        color: #ffa502;
        font-family: 'Courier New', monospace;
        font-size: 11px;
    }
    
    .trade-value {
        color: #e0e0e0;
        font-weight: 500;
        font-size: 11px;
    }
    
    .whale-controls, .time-sales-controls {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }
    
    .whale-controls select, .time-sales-controls select {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e0e0e0;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
    }
    
    .whale-controls select:focus, .time-sales-controls select:focus {
        outline: none;
        border-color: #4facfe;
        background: rgba(255, 255, 255, 0.15);
    }
    
    /* Scrollbar Styles */
    .whale-trades-list::-webkit-scrollbar,
    .time-sales-list::-webkit-scrollbar {
        width: 6px;
    }
    
    .whale-trades-list::-webkit-scrollbar-track,
    .time-sales-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
    }
    
    .whale-trades-list::-webkit-scrollbar-thumb,
    .time-sales-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }
    
    .whale-trades-list::-webkit-scrollbar-thumb:hover,
    .time-sales-list::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    /* Animation keyframes */
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
        .whale-trade-header, .time-sales-header,
        .whale-trade, .time-sales-trade {
            grid-template-columns: 60px 80px 60px 80px 80px 100px;
            font-size: 10px;
            padding: 6px 12px;
        }
        
        .whale-stats, .time-sales-stats {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        }
        
        .whale-controls, .time-sales-controls {
            flex-direction: column;
            align-items: stretch;
        }
        
        .whale-controls select, .time-sales-controls select {
            width: 100%;
        }
    }
`;
document.head.appendChild(whaleTimeSalesStyles); 
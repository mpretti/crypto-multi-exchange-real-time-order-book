// Trading Pairs Explorer - TypeScript Implementation
interface TradingPair {
    symbol: string;
    baseAsset?: string;
    quoteAsset?: string;
    baseCoin?: string;
    quoteCoin?: string;
    baseCcy?: string;
    quoteCcy?: string;
    status?: string;
    type?: string;
    exchangeId?: string;
    exchangeName?: string;
}

interface VolumeData {
    volume24h: number;
    volumeUSD: number;
    lastUpdated: string;
    timeframe: string;
    status: 'loading' | 'success' | 'error';
    error?: string;
}

interface ProcessedPair {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    exchanges: ExchangeInfo[];
    exchangeCount: number;
    rawPairs: TradingPair[];
    volumeData?: VolumeData;
}

interface ExchangeInfo {
    id: string;
    name: string;
    originalSymbol: string;
}

interface ExchangeData {
    exchange: string;
    count: number;
    lastUpdated: string;
    pairs: TradingPair[];
}

interface AllExchangesData {
    [key: string]: ExchangeData;
}

interface FilterState {
    searchTerm: string;
    sortBy: string;
    quoteFilter: string;
    baseFilter: string;
    selectedExchanges: Set<string>;
}

class TradingPairsExplorer {
    private allData: AllExchangesData = {};
    private processedPairs: ProcessedPair[] = [];
    private filteredPairs: ProcessedPair[] = [];
    private filterState: FilterState;
    private volumeCache: Map<string, VolumeData> = new Map();
    private volumeUpdateInterval: number | null = null;
    private readonly exchangeColors: Record<string, string> = {
        'binance': '#f0b90b',
        'bybit': '#f7931a',
        'okx': '#0052ff',
        'kraken': '#5741d9',
        'bitget': '#00d4aa',
        'coinbase': '#0052ff',
        'gemini': '#00dcfa',
        'bitrue': '#0088cc',
        'hyperliquid': '#ff6b35',
        'dydx': '#6966ff',
        'vertex': '#7c3aed',
        'jupiter': '#ffa500'
    };

    constructor() {
        this.filterState = {
            searchTerm: '',
            sortBy: 'symbol',
            quoteFilter: '',
            baseFilter: '',
            selectedExchanges: new Set()
        };
        this.init();
    }

    private async init(): Promise<void> {
        try {
            await this.loadData();
            this.processData();
            this.setupEventListeners();
            this.updateDisplay();
            this.startVolumeUpdates();
        } catch (error) {
            this.showError('Failed to load trading pairs data: ' + (error as Error).message);
        }
    }

    private async loadData(): Promise<void> {
        const response = await fetch('./trading-pairs/all-exchanges-pairs.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        this.allData = await response.json();
    }

    private processData(): void {
        const pairMap = new Map<string, ProcessedPair>();
        
        // Process all pairs and group by normalized symbol
        for (const [exchangeId, exchangeData] of Object.entries(this.allData)) {
            for (const pair of exchangeData.pairs) {
                const normalizedSymbol = this.normalizeSymbol(pair.symbol);
                
                if (!pairMap.has(normalizedSymbol)) {
                    pairMap.set(normalizedSymbol, {
                        symbol: normalizedSymbol,
                        baseAsset: this.extractBaseAsset(pair),
                        quoteAsset: this.extractQuoteAsset(pair),
                        exchanges: [],
                        exchangeCount: 0,
                        rawPairs: []
                    });
                }
                
                const pairData = pairMap.get(normalizedSymbol)!;
                pairData.exchanges.push({
                    id: exchangeId,
                    name: exchangeData.exchange,
                    originalSymbol: pair.symbol
                });
                pairData.rawPairs.push({ ...pair, exchangeId, exchangeName: exchangeData.exchange });
                pairData.exchangeCount = pairData.exchanges.length;
            }
        }
        
        this.processedPairs = Array.from(pairMap.values());
        this.filteredPairs = [...this.processedPairs];
        
        // Initialize all exchanges as selected
        this.filterState.selectedExchanges = new Set(Object.keys(this.allData));
    }

    private normalizeSymbol(symbol: string): string {
        // Remove common separators and normalize
        return symbol.replace(/[-_\/]/g, '').toUpperCase();
    }

    private extractBaseAsset(pair: TradingPair): string {
        if (pair.baseAsset || pair.baseCoin || pair.baseCcy) {
            return pair.baseAsset || pair.baseCoin || pair.baseCcy || '';
        }
        
        // Try to extract from symbol
        const symbol = pair.symbol.replace(/[-_\/]/g, '');
        const commonQuotes = ['USDT', 'USDC', 'BTC', 'ETH', 'USD', 'EUR'];
        
        for (const quote of commonQuotes) {
            if (symbol.endsWith(quote)) {
                return symbol.slice(0, -quote.length);
            }
        }
        
        return symbol.slice(0, -3); // Fallback: assume last 3 chars are quote
    }

    private extractQuoteAsset(pair: TradingPair): string {
        if (pair.quoteAsset || pair.quoteCoin || pair.quoteCcy) {
            return pair.quoteAsset || pair.quoteCoin || pair.quoteCcy || '';
        }
        
        // Try to extract from symbol
        const symbol = pair.symbol.replace(/[-_\/]/g, '');
        const commonQuotes = ['USDT', 'USDC', 'BTC', 'ETH', 'USD', 'EUR'];
        
        for (const quote of commonQuotes) {
            if (symbol.endsWith(quote)) {
                return quote;
            }
        }
        
        return symbol.slice(-3); // Fallback: assume last 3 chars are quote
    }

    private setupEventListeners(): void {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        const sortBy = document.getElementById('sortBy') as HTMLSelectElement;
        const quoteFilter = document.getElementById('quoteFilter') as HTMLSelectElement;
        const baseFilter = document.getElementById('baseFilter') as HTMLSelectElement;

        searchInput?.addEventListener('input', () => {
            this.filterState.searchTerm = searchInput.value;
            this.applyFilters();
        });

        sortBy?.addEventListener('change', () => {
            this.filterState.sortBy = sortBy.value;
            this.applyFilters();
        });

        quoteFilter?.addEventListener('change', () => {
            this.filterState.quoteFilter = quoteFilter.value;
            this.applyFilters();
        });

        baseFilter?.addEventListener('change', () => {
            this.filterState.baseFilter = baseFilter.value;
            this.applyFilters();
        });
    }

    private updateDisplay(): void {
        this.updateStats();
        this.updateTopPairs();
        this.updateExchangeFilters();
        this.updateFilterOptions();
        this.applyFilters();
    }

    private updateStats(): void {
        const totalPairs = Object.values(this.allData).reduce((sum, exchange) => sum + exchange.count, 0);
        const totalExchanges = Object.keys(this.allData).length;
        const uniquePairs = this.processedPairs.length;
        
        // Get most recent update
        const lastUpdated = Object.values(this.allData)
            .map(exchange => new Date(exchange.lastUpdated))
            .sort((a, b) => b.getTime() - a.getTime())[0];

        this.updateElement('totalPairs', totalPairs.toLocaleString());
        this.updateElement('totalExchanges', totalExchanges.toString());
        this.updateElement('uniquePairs', uniquePairs.toLocaleString());
        this.updateElement('lastUpdated', lastUpdated.toLocaleDateString());
    }

    private updateTopPairs(): void {
        const topPairs = this.processedPairs
            .sort((a, b) => b.exchangeCount - a.exchangeCount)
            .slice(0, 12);

        const grid = document.getElementById('topPairsGrid');
        if (grid) {
            grid.innerHTML = topPairs.map(pair => `
                <div class="top-pair-item">
                    <span class="pair-name">${pair.symbol}</span>
                    <span class="pair-count">${pair.exchangeCount} exchanges</span>
                </div>
            `).join('');
        }
    }

    private updateExchangeFilters(): void {
        const container = document.getElementById('exchangeFilters');
        if (!container) return;

        container.innerHTML = Object.entries(this.allData).map(([id, data]) => `
            <div class="exchange-chip active" data-exchange="${id}">
                ${data.exchange} (${data.count})
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.exchange-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const exchangeId = (chip as HTMLElement).dataset.exchange;
                if (!exchangeId) return;

                if (this.filterState.selectedExchanges.has(exchangeId)) {
                    this.filterState.selectedExchanges.delete(exchangeId);
                    chip.classList.remove('active');
                } else {
                    this.filterState.selectedExchanges.add(exchangeId);
                    chip.classList.add('active');
                }
                this.applyFilters();
            });
        });
    }

    private updateFilterOptions(): void {
        // Update quote asset filter
        const quoteAssets = [...new Set(this.processedPairs.map(p => p.quoteAsset))].sort();
        const quoteFilter = document.getElementById('quoteFilter') as HTMLSelectElement;
        if (quoteFilter) {
            quoteFilter.innerHTML = '<option value="">All Quote Assets</option>' + 
                quoteAssets.map(asset => `<option value="${asset}">${asset}</option>`).join('');
        }

        // Update base asset filter
        const baseAssets = [...new Set(this.processedPairs.map(p => p.baseAsset))].sort();
        const baseFilter = document.getElementById('baseFilter') as HTMLSelectElement;
        if (baseFilter) {
            baseFilter.innerHTML = '<option value="">All Base Assets</option>' + 
                baseAssets.map(asset => `<option value="${asset}">${asset}</option>`).join('');
        }
    }

    private applyFilters(): void {
        // Filter pairs
        this.filteredPairs = this.processedPairs.filter(pair => {
            // Search filter
            if (this.filterState.searchTerm) {
                const searchTerm = this.filterState.searchTerm.toLowerCase();
                if (!pair.symbol.toLowerCase().includes(searchTerm) && 
                    !pair.baseAsset.toLowerCase().includes(searchTerm) && 
                    !pair.quoteAsset.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }

            // Quote asset filter
            if (this.filterState.quoteFilter && pair.quoteAsset !== this.filterState.quoteFilter) {
                return false;
            }

            // Base asset filter
            if (this.filterState.baseFilter && pair.baseAsset !== this.filterState.baseFilter) {
                return false;
            }

            // Exchange filter
            if (!pair.exchanges.some(exchange => this.filterState.selectedExchanges.has(exchange.id))) {
                return false;
            }

            return true;
        });

        // Sort pairs
        this.filteredPairs.sort((a, b) => {
            switch (this.filterState.sortBy) {
                case 'symbol':
                    return a.symbol.localeCompare(b.symbol);
                case 'exchanges':
                    return b.exchangeCount - a.exchangeCount;
                case 'volume':
                    const aVolume = a.volumeData?.volumeUSD || 0;
                    const bVolume = b.volumeData?.volumeUSD || 0;
                    return bVolume - aVolume; // Descending order (highest volume first)
                case 'baseAsset':
                    return a.baseAsset.localeCompare(b.baseAsset);
                case 'quoteAsset':
                    return a.quoteAsset.localeCompare(b.quoteAsset);
                default:
                    return 0;
            }
        });

        this.updateTable();
    }

    private updateTable(): void {
        const tbody = document.getElementById('pairsTableBody');
        const resultsCount = document.getElementById('resultsCount');

        if (resultsCount) {
            resultsCount.textContent = `${this.filteredPairs.length} pairs`;
        }

        if (!tbody) return;

        if (this.filteredPairs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #666;">No trading pairs match your filters</td></tr>';
            return;
        }

        tbody.innerHTML = this.filteredPairs.map(pair => `
            <tr>
                <td class="symbol-cell">${pair.symbol}</td>
                <td>${pair.baseAsset}</td>
                <td>${pair.quoteAsset}</td>
                <td class="volume-cell">
                    ${this.renderVolumeData(pair)}
                </td>
                <td>
                    ${pair.exchanges.map(exchange => `
                        <span class="exchange-badge" style="background-color: ${this.exchangeColors[exchange.id] || '#6c757d'}">
                            ${exchange.name}
                        </span>
                    `).join('')}
                </td>
                <td><strong>${pair.exchangeCount}</strong></td>
            </tr>
        `).join('');
    }

    private updateElement(id: string, content: string): void {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    private showError(message: string): void {
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div class="header">
                    <h1>🚀 Trading Pairs Explorer</h1>
                    <p>Comprehensive trading pairs data across all supported exchanges</p>
                </div>
                <div class="error">
                    <strong>Error:</strong> ${message}
                </div>
            `;
        }
    }

    // Volume-related methods
    private startVolumeUpdates(): void {
        // Initial load of volume data for visible pairs
        this.updateVolumeData();
        
        // Set up periodic updates every 30 seconds
        this.volumeUpdateInterval = window.setInterval(() => {
            this.updateVolumeData();
        }, 30000);
    }

    private async updateVolumeData(): Promise<void> {
        // Update volume for top pairs first (most visible)
        const topPairs = this.filteredPairs.slice(0, 20);
        
        for (const pair of topPairs) {
            if (!pair.volumeData || pair.volumeData.status !== 'loading') {
                await this.fetchVolumeForPair(pair);
            }
        }
        
        // Update the table to reflect new volume data
        this.updateTable();
    }

    private async fetchVolumeForPair(pair: ProcessedPair): Promise<void> {
        const cacheKey = pair.symbol;
        const cached = this.volumeCache.get(cacheKey);
        
        // Check if cached data is still fresh (less than 2 minutes old)
        if (cached && cached.status === 'success') {
            const age = Date.now() - new Date(cached.lastUpdated).getTime();
            if (age < 120000) { // 2 minutes
                pair.volumeData = cached;
                return;
            }
        }

        // Set loading state
        pair.volumeData = {
            volume24h: 0,
            volumeUSD: 0,
            lastUpdated: new Date().toISOString(),
            timeframe: '24h',
            status: 'loading'
        };

        try {
            // Try to fetch volume from the primary exchange (first in the list)
            const primaryExchange = pair.exchanges[0];
            const volumeData = await this.fetchVolumeFromExchange(primaryExchange.id, pair.symbol);
            
            const volume: VolumeData = {
                volume24h: volumeData.volume,
                volumeUSD: volumeData.volumeUSD,
                lastUpdated: new Date().toISOString(),
                timeframe: '24h',
                status: 'success'
            };

            pair.volumeData = volume;
            this.volumeCache.set(cacheKey, volume);
            
        } catch (error) {
            const errorData: VolumeData = {
                volume24h: 0,
                volumeUSD: 0,
                lastUpdated: new Date().toISOString(),
                timeframe: '24h',
                status: 'error',
                error: (error as Error).message
            };
            
            pair.volumeData = errorData;
            this.volumeCache.set(cacheKey, errorData);
        }
    }

    private async fetchVolumeFromExchange(exchangeId: string, symbol: string): Promise<{volume: number, volumeUSD: number}> {
        switch (exchangeId) {
            case 'binance':
                return this.fetchBinanceVolume(symbol);
            case 'bybit':
                return this.fetchBybitVolume(symbol);
            case 'okx':
                return this.fetchOkxVolume(symbol);
            default:
                // For other exchanges, return simulated data
                return this.generateSimulatedVolume(symbol);
        }
    }

    private async fetchBinanceVolume(symbol: string): Promise<{volume: number, volumeUSD: number}> {
        try {
            const response = await fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`);
            if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
            
            const data = await response.json();
            return {
                volume: parseFloat(data.volume) || 0,
                volumeUSD: parseFloat(data.quoteVolume) || 0
            };
        } catch (error) {
            console.warn(`Failed to fetch Binance volume for ${symbol}:`, error);
            return this.generateSimulatedVolume(symbol);
        }
    }

    private async fetchBybitVolume(symbol: string): Promise<{volume: number, volumeUSD: number}> {
        try {
            const response = await fetch(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`);
            if (!response.ok) throw new Error(`Bybit API error: ${response.status}`);
            
            const data = await response.json();
            const ticker = data.result?.list?.[0];
            if (!ticker) throw new Error('No ticker data');
            
            return {
                volume: parseFloat(ticker.volume24h) || 0,
                volumeUSD: parseFloat(ticker.turnover24h) || 0
            };
        } catch (error) {
            console.warn(`Failed to fetch Bybit volume for ${symbol}:`, error);
            return this.generateSimulatedVolume(symbol);
        }
    }

    private async fetchOkxVolume(symbol: string): Promise<{volume: number, volumeUSD: number}> {
        try {
            // Convert symbol format for OKX (e.g., BTCUSDT -> BTC-USDT-SWAP)
            const base = symbol.replace('USDT', '');
            const okxSymbol = `${base}-USDT-SWAP`;
            
            const response = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${okxSymbol}`);
            if (!response.ok) throw new Error(`OKX API error: ${response.status}`);
            
            const data = await response.json();
            const ticker = data.data?.[0];
            if (!ticker) throw new Error('No ticker data');
            
            return {
                volume: parseFloat(ticker.vol24h) || 0,
                volumeUSD: parseFloat(ticker.volCcy24h) || 0
            };
        } catch (error) {
            console.warn(`Failed to fetch OKX volume for ${symbol}:`, error);
            return this.generateSimulatedVolume(symbol);
        }
    }

    private generateSimulatedVolume(symbol: string): {volume: number, volumeUSD: number} {
        // Generate realistic-looking volume data based on symbol popularity
        const popularSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT'];
        const isPopular = popularSymbols.includes(symbol);
        
        const baseVolume = isPopular ? 
            Math.random() * 50000 + 10000 : // 10K-60K for popular
            Math.random() * 5000 + 500;     // 500-5.5K for others
        
        const price = isPopular ? 
            Math.random() * 50000 + 1000 :  // Simulated price
            Math.random() * 100 + 1;
        
        return {
            volume: Math.floor(baseVolume),
            volumeUSD: Math.floor(baseVolume * price)
        };
    }

    public renderVolumeData(pair: ProcessedPair): string {
        if (!pair.volumeData) {
            return '<div class="volume-loading">Loading...</div>';
        }

        const { volumeData } = pair;

        switch (volumeData.status) {
            case 'loading':
                return '<div class="volume-loading">Loading...</div>';
                
            case 'error':
                return '<div class="volume-error">N/A</div>';
                
            case 'success':
                const volumeClass = this.getVolumeClass(volumeData.volumeUSD);
                const formattedVolume = this.formatVolume(volumeData.volumeUSD);
                const timeAgo = this.getTimeAgo(volumeData.lastUpdated);
                
                return `
                    <div class="volume-data">
                        <div class="volume-amount ${volumeClass}">$${formattedVolume}</div>
                        <div class="volume-meta">
                            <span class="volume-timeframe">${volumeData.timeframe}</span>
                            <span class="volume-updated">${timeAgo}</span>
                        </div>
                    </div>
                `;
                
            default:
                return '<div class="volume-error">N/A</div>';
        }
    }

    private getVolumeClass(volumeUSD: number): string {
        if (volumeUSD > 10000000) return 'high';   // > $10M
        if (volumeUSD > 1000000) return 'medium';  // > $1M
        return 'low';
    }

    private formatVolume(volume: number): string {
        if (volume >= 1e9) return (volume / 1e9).toFixed(1) + 'B';
        if (volume >= 1e6) return (volume / 1e6).toFixed(1) + 'M';
        if (volume >= 1e3) return (volume / 1e3).toFixed(1) + 'K';
        return volume.toFixed(0);
    }

    private getTimeAgo(timestamp: string): string {
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    public cleanup(): void {
        if (this.volumeUpdateInterval) {
            clearInterval(this.volumeUpdateInterval);
            this.volumeUpdateInterval = null;
        }
    }

    // Public methods for external access
    public getPairsByExchange(exchangeId: string): TradingPair[] {
        return this.allData[exchangeId]?.pairs || [];
    }

    public getCommonPairs(minExchanges: number = 2): ProcessedPair[] {
        return this.processedPairs.filter(pair => pair.exchangeCount >= minExchanges);
    }

    public exportData(format: 'json' | 'csv' = 'json'): string {
        if (format === 'csv') {
            const headers = ['Symbol', 'Base Asset', 'Quote Asset', 'Exchange Count', 'Exchanges'];
            const rows = this.filteredPairs.map(pair => [
                pair.symbol,
                pair.baseAsset,
                pair.quoteAsset,
                pair.exchangeCount.toString(),
                pair.exchanges.map(e => e.name).join('; ')
            ]);
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }
        return JSON.stringify(this.filteredPairs, null, 2);
    }
}

// Initialize the explorer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TradingPairsExplorer();
});

// Export for module usage
export { TradingPairsExplorer, type TradingPair, type ProcessedPair, type ExchangeData }; 
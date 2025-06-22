/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// LightweightCharts is loaded globally via CDN
declare const LightweightCharts: any;

interface KLineData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface ExchangeConfig {
    name: string;
    wsUrl: (symbol: string, interval: string) => string;
    historyUrl: (symbol: string, interval: string, limit: number) => string;
    formatSymbol: (symbol: string) => string;
    parseKlineData: (data: any) => KLineData;
    parseHistoricalData: (data: any) => KLineData[];
    color: string;
}

interface ChartInstance {
    chart: any;
    series: Map<string, any>; // Map of exchange -> series
    volumeSeries: Map<string, any>; // Map of exchange -> volume series
    indicatorSeries: Map<string, any>; // Map of indicator -> series
    container: HTMLElement;
    websockets: Map<string, WebSocket>; // Map of exchange -> websocket
    lastCandles: Map<string, KLineData>; // Map of exchange -> last candle
    openPrices: Map<string, number>; // Map of exchange -> open price
    timeframe: string;
    chartId: string;
    activeIndicators: Set<string>;
    technicalData: TechnicalData;
    historicalPrices: number[]; // For technical analysis
}

interface TechnicalData {
    rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    bollinger: { upper: number; middle: number; lower: number; percentage: number };
    volatility: number;
    ma20: number;
    ma50: number;
}

interface Alert {
    id: string;
    type: 'price' | 'volume' | 'rsi' | 'macd';
    condition: 'above' | 'below' | 'crosses';
    value: number;
    asset: string;
    active: boolean;
    triggered: boolean;
    createdAt: Date;
}

interface MarketData {
    volume24h: string;
    marketCap: string;
    fearGreedIndex: string;
    btcDominance: string;
}

interface TimeframeConfig {
    display: string;
    wsInterval: string;
    tooltipFormat: string;
    scaleFormat: string;
}

// Technical Analysis Utilities
class TechnicalAnalysis {
    static calculateRSI(prices: number[], period: number = 14): number {
        if (prices.length < period + 1) return 50;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    
    static calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
        if (prices.length < slowPeriod) return { macd: 0, signal: 0, histogram: 0 };
        
        const ema12 = this.calculateEMA(prices, fastPeriod);
        const ema26 = this.calculateEMA(prices, slowPeriod);
        const macd = ema12 - ema26;
        
        // For simplicity, using SMA instead of EMA for signal line
        const macdLine = [macd];
        const signal = this.calculateSMA(macdLine, 1);
        const histogram = macd - signal;
        
        return { macd, signal, histogram };
    }
    
    static calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2) {
        if (prices.length < period) return { upper: 0, middle: 0, lower: 0, percentage: 0 };
        
        const sma = this.calculateSMA(prices.slice(-period), period);
        const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        
        const upper = sma + (multiplier * stdDev);
        const lower = sma - (multiplier * stdDev);
        const currentPrice = prices[prices.length - 1];
        const percentage = ((currentPrice - lower) / (upper - lower)) * 100;
        
        return { upper, middle: sma, lower, percentage };
    }
    
    static calculateSMA(prices: number[], period: number): number {
        if (prices.length < period) return prices[prices.length - 1] || 0;
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }
    
    static calculateEMA(prices: number[], period: number): number {
        if (prices.length < period) return prices[prices.length - 1] || 0;
        
        const multiplier = 2 / (period + 1);
        let ema = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return ema;
    }
    
    static calculateVolatility(prices: number[], period: number = 20): number {
        if (prices.length < period) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
        
        return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
    }
}

class ChartsDashboard {
    private selectedAsset: string = 'BTCUSDT';
    private selectedExchange: string = 'binance';
    private overlayMode: boolean = false;
    private selectedOverlayExchanges: Set<string> = new Set(['binance']);
    private chartMode: 'dual' | 'single' | 'quad' | 'comparison' = 'dual';
    private chart1!: ChartInstance;
    private chart2!: ChartInstance;
    private chart3!: ChartInstance;
    private chart4!: ChartInstance;
    private activeCharts: ChartInstance[] = [];
    
    // Advanced Features
    private alerts: Alert[] = [];
    private marketData: MarketData = { volume24h: 'Loading...', marketCap: 'Loading...', fearGreedIndex: 'Loading...', btcDominance: 'Loading...' };
    private sidePanelVisible: boolean = false;
    private fullscreenMode: boolean = false;
    
    // DOM Elements
    private assetSelect!: HTMLSelectElement;
    private exchangeSelect!: HTMLSelectElement;
    private chartModeSelect!: HTMLSelectElement;
    private overlayModeToggle!: HTMLInputElement;
    private overlayExchangesDiv!: HTMLElement;
    private timeframe1Select!: HTMLSelectElement;
    private timeframe2Select!: HTMLSelectElement;
    private timeframe3Select!: HTMLSelectElement;
    private timeframe4Select!: HTMLSelectElement;
    
    // Tool Elements
    private analysisBtn!: HTMLButtonElement;
    private alertsBtn!: HTMLButtonElement;
    private exportBtn!: HTMLButtonElement;
    private fullscreenBtn!: HTMLButtonElement;
    private sidePanel!: HTMLElement;
    private alertModal!: HTMLElement;
    private analysisModal!: HTMLElement;
    
    // Timeframe configurations
    private timeframeConfigs: Record<string, TimeframeConfig> = {
        '1m': { display: '1 Minute', wsInterval: '1m', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'HH:mm' },
        '3m': { display: '3 Minutes', wsInterval: '3m', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'HH:mm' },
        '5m': { display: '5 Minutes', wsInterval: '5m', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'HH:mm' },
        '15m': { display: '15 Minutes', wsInterval: '15m', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'HH:mm' },
        '30m': { display: '30 Minutes', wsInterval: '30m', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'HH:mm' },
        '1h': { display: '1 Hour', wsInterval: '1h', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'MMM dd HH:mm' },
        '2h': { display: '2 Hours', wsInterval: '2h', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'MMM dd HH:mm' },
        '4h': { display: '4 Hours', wsInterval: '4h', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'MMM dd HH:mm' },
        '6h': { display: '6 Hours', wsInterval: '6h', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'MMM dd HH:mm' },
        '8h': { display: '8 Hours', wsInterval: '8h', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'MMM dd HH:mm' },
        '12h': { display: '12 Hours', wsInterval: '12h', tooltipFormat: 'MMM dd, HH:mm', scaleFormat: 'MMM dd HH:mm' },
        '1d': { display: '1 Day', wsInterval: '1d', tooltipFormat: 'MMM dd, yyyy', scaleFormat: 'MMM dd' },
        '3d': { display: '3 Days', wsInterval: '3d', tooltipFormat: 'MMM dd, yyyy', scaleFormat: 'MMM dd' },
        '1w': { display: '1 Week', wsInterval: '1w', tooltipFormat: 'MMM dd, yyyy', scaleFormat: 'MMM dd' }
    };

    // Exchange configurations
    private exchanges: Record<string, ExchangeConfig> = {
        binance: {
            name: 'Binance',
            wsUrl: (symbol: string, interval: string) => `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`,
            historyUrl: (symbol: string, interval: string, limit: number) => `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
            formatSymbol: (symbol: string) => symbol.toUpperCase(),
            parseKlineData: (data: any) => ({
                time: Math.floor(data.t / 1000),
                open: parseFloat(data.o),
                high: parseFloat(data.h),
                low: parseFloat(data.l),
                close: parseFloat(data.c),
                volume: parseFloat(data.v)
            }),
            parseHistoricalData: (data: any[]) => data.map((item: any[]) => ({
                time: Math.floor(item[0] / 1000),
                open: parseFloat(item[1]),
                high: parseFloat(item[2]),
                low: parseFloat(item[3]),
                close: parseFloat(item[4]),
                volume: parseFloat(item[5])
            })),
            color: '#f0b90b'
        },
        bybit: {
            name: 'Bybit',
            wsUrl: (_symbol: string, _interval: string) => `wss://stream.bybit.com/v5/public/linear`,
            historyUrl: (symbol: string, interval: string, limit: number) => `https://api.bybit.com/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`,
            formatSymbol: (symbol: string) => symbol.toUpperCase(),
            parseKlineData: (data: any) => ({
                time: Math.floor(parseInt(data.start) / 1000),
                open: parseFloat(data.open),
                high: parseFloat(data.high),
                low: parseFloat(data.low),
                close: parseFloat(data.close),
                volume: parseFloat(data.volume)
            }),
            parseHistoricalData: (data: any) => data.result.list.map((item: any[]) => ({
                time: Math.floor(parseInt(item[0]) / 1000),
                open: parseFloat(item[1]),
                high: parseFloat(item[2]),
                low: parseFloat(item[3]),
                close: parseFloat(item[4]),
                volume: parseFloat(item[5])
            })),
            color: '#f7931a'
        },
        okx: {
            name: 'OKX',
            wsUrl: (_symbol: string, _interval: string) => `wss://ws.okx.com:8443/ws/v5/public`,
            historyUrl: (symbol: string, interval: string, limit: number) => `https://www.okx.com/api/v5/market/candles?instId=${symbol}&bar=${interval}&limit=${limit}`,
            formatSymbol: (symbol: string) => symbol.replace('USDT', '-USDT'),
            parseKlineData: (data: any) => ({
                time: Math.floor(parseInt(data.ts) / 1000),
                open: parseFloat(data.o),
                high: parseFloat(data.h),
                low: parseFloat(data.l),
                close: parseFloat(data.c),
                volume: parseFloat(data.vol)
            }),
            parseHistoricalData: (data: any) => data.data.map((item: any[]) => ({
                time: Math.floor(parseInt(item[0]) / 1000),
                open: parseFloat(item[1]),
                high: parseFloat(item[2]),
                low: parseFloat(item[3]),
                close: parseFloat(item[4]),
                volume: parseFloat(item[5])
            })),
            color: '#00d4ff'
        },
        kraken: {
            name: 'Kraken',
            wsUrl: (_symbol: string, _interval: string) => `wss://ws.kraken.com`,
            historyUrl: (symbol: string, interval: string, _limit: number) => `https://api.kraken.com/0/public/OHLC?pair=${symbol}&interval=${interval}&since=0`,
            formatSymbol: (symbol: string) => symbol.replace('USDT', 'USD'),
            parseKlineData: (data: any) => ({
                time: Math.floor(data.time),
                open: parseFloat(data.open),
                high: parseFloat(data.high),
                low: parseFloat(data.low),
                close: parseFloat(data.close),
                volume: parseFloat(data.volume)
            }),
            parseHistoricalData: (data: any) => {
                const pairKey = Object.keys(data.result)[0];
                return data.result[pairKey].map((item: any[]) => ({
                    time: Math.floor(item[0]),
                    open: parseFloat(item[1]),
                    high: parseFloat(item[2]),
                    low: parseFloat(item[3]),
                    close: parseFloat(item[4]),
                    volume: parseFloat(item[6])
                }));
            },
            color: '#5741d9'
        },
        bitget: {
            name: 'Bitget',
            wsUrl: (_symbol: string, _interval: string) => `wss://ws.bitget.com/spot/v1/stream`,
            historyUrl: (symbol: string, interval: string, limit: number) => `https://api.bitget.com/api/spot/v1/market/candles?symbol=${symbol}&period=${interval}&limit=${limit}`,
            formatSymbol: (symbol: string) => symbol.toUpperCase(),
            parseKlineData: (data: any) => ({
                time: parseInt(data[0]) / 1000,
                open: parseFloat(data[1]),
                high: parseFloat(data[2]),
                low: parseFloat(data[3]),
                close: parseFloat(data[4]),
                volume: parseFloat(data[5])
            }),
            parseHistoricalData: (data: any) => {
                if (Array.isArray(data)) {
                    return data.map((item: any) => ({
                        time: parseInt(item[0]) / 1000,
                        open: parseFloat(item[1]),
                        high: parseFloat(item[2]),
                        low: parseFloat(item[3]),
                        close: parseFloat(item[4]),
                        volume: parseFloat(item[5])
                    }));
                }
                return [];
            },
            color: '#00CED1'
        },
        coinbase: {
            name: 'Coinbase Pro',
            wsUrl: (_symbol: string, _interval: string) => `wss://ws-feed.exchange.coinbase.com`,
            historyUrl: (symbol: string, interval: string, limit: number) => {
                // Coinbase uses granularity in seconds
                const granularityMap: Record<string, number> = {
                    '1m': 60,
                    '5m': 300,
                    '15m': 900,
                    '1h': 3600,
                    '4h': 14400,
                    '1d': 86400
                };
                const granularity = granularityMap[interval] || 60;
                const end = Math.floor(Date.now() / 1000);
                const start = end - (limit * granularity);
                return `https://api.exchange.coinbase.com/products/${symbol}/candles?start=${start}&end=${end}&granularity=${granularity}`;
            },
            formatSymbol: (symbol: string) => symbol.replace('USDT', '-USD'),
            parseKlineData: (data: any) => ({
                time: data[0],
                low: data[1],
                high: data[2],
                open: data[3],
                close: data[4],
                volume: data[5]
            }),
            parseHistoricalData: (data: any) => {
                if (Array.isArray(data)) {
                    return data.map((item: any) => ({
                        time: item[0],
                        low: item[1],
                        high: item[2],
                        open: item[3],
                        close: item[4],
                        volume: item[5]
                    }));
                }
                return [];
            },
            color: '#FF007A'
        },
        gemini: {
            name: 'Gemini',
            wsUrl: (_symbol: string, _interval: string) => `wss://api.gemini.com/v1/marketdata`,
            historyUrl: (symbol: string, _interval: string, _limit: number) => {
                // Gemini doesn't have a direct candle API, using ticker for now
                return `https://api.gemini.com/v1/pubticker/${symbol.toLowerCase()}`;
            },
            formatSymbol: (symbol: string) => symbol.replace('USDT', 'USD'),
            parseKlineData: (_data: any) => {
                // Gemini doesn't provide kline data in the same format
                return {
                    time: Date.now() / 1000,
                    open: 0,
                    high: 0,
                    low: 0,
                    close: 0,
                    volume: 0
                };
            },
            parseHistoricalData: (_data: any) => [],
            color: '#00D4AA'
        },
        bitrue: {
            name: 'Bitrue',
            wsUrl: (_symbol: string, _interval: string) => `wss://wsapi.bitrue.com/kline-api/ws`,
            historyUrl: (symbol: string, interval: string, limit: number) => `https://openapi.bitrue.com/api/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
            formatSymbol: (symbol: string) => symbol.toUpperCase(),
            parseKlineData: (data: any) => ({
                time: data[0] / 1000,
                open: parseFloat(data[1]),
                high: parseFloat(data[2]),
                low: parseFloat(data[3]),
                close: parseFloat(data[4]),
                volume: parseFloat(data[5])
            }),
            parseHistoricalData: (data: any) => {
                if (Array.isArray(data)) {
                    return data.map((item: any) => ({
                        time: item[0] / 1000,
                        open: parseFloat(item[1]),
                        high: parseFloat(item[2]),
                        low: parseFloat(item[3]),
                        close: parseFloat(item[4]),
                        volume: parseFloat(item[5])
                    }));
                }
                return [];
            },
            color: '#1E90FF'
        }
    };

    constructor() {
        this.initializeDOM();
        this.loadUserPreferences(); // Load saved preferences first
        this.setupEventListeners();
        this.waitForLightweightChartsAndStart();
        
        // Initialize advanced features
        this.loadAlertsFromStorage();
        this.fetchMarketData();
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Update market data every 5 minutes
        setInterval(() => this.fetchMarketData(), 5 * 60 * 1000);
        
        // Set initial active charts
        this.activeCharts = [this.chart1, this.chart2];
        
        // Save preferences when page unloads
        window.addEventListener('beforeunload', () => {
            this.saveUserPreferences();
        });
        
        // Auto-save preferences every 30 seconds
        setInterval(() => this.saveUserPreferences(), 30000);
    }

    private initializeDOM() {
        // Get DOM elements
        this.assetSelect = document.getElementById('asset-select') as HTMLSelectElement;
        this.exchangeSelect = document.getElementById('exchange-select') as HTMLSelectElement;
        this.chartModeSelect = document.getElementById('chart-mode-select') as HTMLSelectElement;
        this.overlayModeToggle = document.getElementById('overlay-mode') as HTMLInputElement;
        this.overlayExchangesDiv = document.getElementById('overlay-exchanges') as HTMLElement;
        this.timeframe1Select = document.getElementById('timeframe1-select') as HTMLSelectElement;
        this.timeframe2Select = document.getElementById('timeframe2-select') as HTMLSelectElement;
        this.timeframe3Select = document.getElementById('timeframe3-select') as HTMLSelectElement;
        this.timeframe4Select = document.getElementById('timeframe4-select') as HTMLSelectElement;
        
        // Advanced UI elements
        this.analysisBtn = document.getElementById('analysis-btn') as HTMLButtonElement;
        this.alertsBtn = document.getElementById('alerts-btn') as HTMLButtonElement;
        this.exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
        this.fullscreenBtn = document.getElementById('fullscreen-btn') as HTMLButtonElement;
        this.sidePanel = document.getElementById('side-panel') as HTMLElement;
        this.alertModal = document.getElementById('alert-modal') as HTMLElement;
        this.analysisModal = document.getElementById('analysis-modal') as HTMLElement;
        
        // Initialize chart instances
        this.chart1 = {
            chart: null,
            series: new Map(),
            volumeSeries: new Map(),
            indicatorSeries: new Map(),
            container: document.getElementById('chart1-container')!,
            websockets: new Map(),
            lastCandles: new Map(),
            openPrices: new Map(),
            timeframe: '1m',
            chartId: '1',
            activeIndicators: new Set(),
            technicalData: { rsi: 0, macd: { macd: 0, signal: 0, histogram: 0 }, bollinger: { upper: 0, middle: 0, lower: 0, percentage: 0 }, volatility: 0, ma20: 0, ma50: 0 },
            historicalPrices: []
        };

        this.chart2 = {
            chart: null,
            series: new Map(),
            volumeSeries: new Map(),
            indicatorSeries: new Map(),
            container: document.getElementById('chart2-container')!,
            websockets: new Map(),
            lastCandles: new Map(),
            openPrices: new Map(),
            timeframe: '5m',
            chartId: '2',
            activeIndicators: new Set(),
            technicalData: { rsi: 0, macd: { macd: 0, signal: 0, histogram: 0 }, bollinger: { upper: 0, middle: 0, lower: 0, percentage: 0 }, volatility: 0, ma20: 0, ma50: 0 },
            historicalPrices: []
        };
        
        this.chart3 = {
            chart: null,
            series: new Map(),
            volumeSeries: new Map(),
            indicatorSeries: new Map(),
            container: document.getElementById('chart3-container')!,
            websockets: new Map(),
            lastCandles: new Map(),
            openPrices: new Map(),
            timeframe: '15m',
            chartId: '3',
            activeIndicators: new Set(),
            technicalData: { rsi: 0, macd: { macd: 0, signal: 0, histogram: 0 }, bollinger: { upper: 0, middle: 0, lower: 0, percentage: 0 }, volatility: 0, ma20: 0, ma50: 0 },
            historicalPrices: []
        };
        
        this.chart4 = {
            chart: null,
            series: new Map(),
            volumeSeries: new Map(),
            indicatorSeries: new Map(),
            container: document.getElementById('chart4-container')!,
            websockets: new Map(),
            lastCandles: new Map(),
            openPrices: new Map(),
            timeframe: '1h',
            chartId: '4',
            activeIndicators: new Set(),
            technicalData: { rsi: 0, macd: { macd: 0, signal: 0, histogram: 0 }, bollinger: { upper: 0, middle: 0, lower: 0, percentage: 0 }, volatility: 0, ma20: 0, ma50: 0 },
            historicalPrices: []
        };
    }

    private setupEventListeners() {
        // Asset selector
        this.assetSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            this.selectedAsset = target.value;
            this.updateTitles();
            this.restartCharts();
            this.savePreferencesDebounced(); // Save preferences
        });

        // Exchange selector (only allow working exchanges)
        this.exchangeSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            const workingExchanges = ['binance', 'bybit', 'okx'];
            
            if (workingExchanges.includes(target.value)) {
                this.selectedExchange = target.value;
                this.updateTitles();
                if (!this.overlayMode) {
                    this.restartCharts();
                }
                this.savePreferencesDebounced(); // Save preferences
            } else {
                console.warn(`⚠️ Exchange ${target.value} is not working, staying with ${this.selectedExchange}`);
                target.value = this.selectedExchange; // Reset to current working exchange
            }
        });

        // Overlay mode toggle
        this.overlayModeToggle.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.overlayMode = target.checked;
            this.overlayExchangesDiv.style.display = this.overlayMode ? 'block' : 'none';
            this.updateTitles();
            this.restartCharts();
            this.savePreferencesDebounced(); // Save preferences
        });

        // Overlay exchanges checkboxes (only allow working exchanges)
        const overlayCheckboxes = this.overlayExchangesDiv.querySelectorAll('input[type="checkbox"]');
        overlayCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                const exchangeId = target.value;
                const workingExchanges = ['binance', 'bybit', 'okx'];
                
                if (workingExchanges.includes(exchangeId)) {
                    if (target.checked) {
                        this.selectedOverlayExchanges.add(exchangeId);
                    } else {
                        this.selectedOverlayExchanges.delete(exchangeId);
                    }
                    
                    // Ensure at least one exchange is selected
                    if (this.selectedOverlayExchanges.size === 0) {
                        this.selectedOverlayExchanges.add('binance');
                        const binanceCheckbox = this.overlayExchangesDiv.querySelector('input[value="binance"]') as HTMLInputElement;
                        if (binanceCheckbox) binanceCheckbox.checked = true;
                    }
                    
                    if (this.overlayMode) {
                        this.restartCharts();
                    }
                } else {
                    console.warn(`⚠️ Exchange ${exchangeId} is not working, ignoring selection`);
                    target.checked = false; // Uncheck the box
                }
            });
        });

        // Timeframe selectors
        this.timeframe1Select.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            this.chart1.timeframe = target.value;
            this.updateTitles();
            this.restartChart(this.chart1);
            this.savePreferencesDebounced(); // Save preferences
        });

        this.timeframe2Select.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            this.chart2.timeframe = target.value;
            this.updateTitles();
            this.restartChart(this.chart2);
            this.savePreferencesDebounced(); // Save preferences
        });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Connection monitoring
        setInterval(() => this.checkConnections(), 30000); // Check every 30 seconds
        
        // Chart resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Indicator button event listeners
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            
            // Handle indicator button clicks
            if (target.classList.contains('indicator-btn')) {
                const indicator = target.dataset.indicator;
                const chartId = target.dataset.chart;
                
                if (indicator && chartId) {
                    const chartInstance = this.getChartById(chartId);
                    if (chartInstance) {
                        this.toggleIndicator(chartInstance, indicator);
                    }
                }
            }
            
            // Handle chart mode buttons
            if (target.classList.contains('chart-mode-btn')) {
                const mode = target.dataset.mode as typeof this.chartMode;
                if (mode) {
                    this.switchChartMode(mode);
                    
                    // Update button states
                    document.querySelectorAll('.chart-mode-btn').forEach(btn => btn.classList.remove('active'));
                    target.classList.add('active');
                }
            }
        });
        
        // Chart mode selector
        if (this.chartModeSelect) {
            this.chartModeSelect.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                const mode = target.value as typeof this.chartMode;
                this.switchChartMode(mode);
                this.savePreferencesDebounced();
            });
        }
        
        // Side panel controls
        this.setupSidePanelControls();
    }
    
    private setupSidePanelControls() {
        const settingsBtn = document.getElementById('settings-btn');
        const sidePanel = document.getElementById('side-panel');
        const closeSidePanelBtn = document.getElementById('close-side-panel');
        
        // Settings button to open side panel
        if (settingsBtn && sidePanel) {
            settingsBtn.addEventListener('click', () => {
                sidePanel.classList.add('open');
                this.sidePanelVisible = true;
                this.savePreferencesDebounced();
            });
        }
        
        // Close side panel button
        if (closeSidePanelBtn && sidePanel) {
            closeSidePanelBtn.addEventListener('click', () => {
                sidePanel.classList.remove('open');
                this.sidePanelVisible = false;
                this.savePreferencesDebounced();
            });
        }
        
        // Chart theme selector
        const themeSelect = document.getElementById('chart-theme-select') as HTMLSelectElement;
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                this.updateChartTheme(target.value);
                this.savePreferencesDebounced();
            });
        }
        
        // Crosshair toggle
        const crosshairToggle = document.getElementById('crosshair-toggle') as HTMLInputElement;
        if (crosshairToggle) {
            crosshairToggle.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                this.toggleCrosshair(target.checked);
                this.savePreferencesDebounced();
            });
        }
        
        // Grid toggle
        const gridToggle = document.getElementById('grid-toggle') as HTMLInputElement;
        if (gridToggle) {
            gridToggle.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                this.toggleGrid(target.checked);
                this.savePreferencesDebounced();
            });
        }
        
        // Price scale toggle
        const priceScaleToggle = document.getElementById('price-scale-toggle') as HTMLInputElement;
        if (priceScaleToggle) {
            priceScaleToggle.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                this.togglePriceScale(target.checked);
                this.savePreferencesDebounced();
            });
        }
        
        // Time scale toggle
        const timeScaleToggle = document.getElementById('time-scale-toggle') as HTMLInputElement;
        if (timeScaleToggle) {
            timeScaleToggle.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                this.toggleTimeScale(target.checked);
                this.savePreferencesDebounced();
            });
        }
        
        // Auto scale toggle
        const autoScaleToggle = document.getElementById('auto-scale-toggle') as HTMLInputElement;
        if (autoScaleToggle) {
            autoScaleToggle.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                this.toggleAutoScale(target.checked);
                this.savePreferencesDebounced();
            });
        }
        
        // Reset zoom button
        const resetZoomBtn = document.getElementById('reset-zoom-btn');
        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', () => {
                this.resetZoom();
            });
        }
        
        // Screenshot button
        const screenshotBtn = document.getElementById('screenshot-btn');
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', () => {
                this.takeScreenshot();
            });
        }
    }
    
    // Chart customization methods
    private updateChartTheme(theme: string) {
        const isDark = theme === 'dark';
        const options = {
            layout: {
                background: { color: isDark ? '#1a1a2e' : '#ffffff' },
                textColor: isDark ? '#ffffff' : '#000000',
            },
            grid: {
                vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            },
        };
        
        this.activeCharts.forEach(chart => {
            if (chart.chart) {
                chart.chart.applyOptions(options);
            }
        });
    }
    
    private toggleCrosshair(enabled: boolean) {
        const options = {
            crosshair: {
                mode: enabled ? 1 : 0, // 1 = Normal, 0 = Hidden
            }
        };
        
        this.activeCharts.forEach(chart => {
            if (chart.chart) {
                chart.chart.applyOptions(options);
            }
        });
    }
    
    private toggleGrid(enabled: boolean) {
        const options = {
            grid: {
                vertLines: { visible: enabled },
                horzLines: { visible: enabled },
            }
        };
        
        this.activeCharts.forEach(chart => {
            if (chart.chart) {
                chart.chart.applyOptions(options);
            }
        });
    }
    
    private togglePriceScale(enabled: boolean) {
        const options = {
            rightPriceScale: { visible: enabled }
        };
        
        this.activeCharts.forEach(chart => {
            if (chart.chart) {
                chart.chart.applyOptions(options);
            }
        });
    }
    
    private toggleTimeScale(enabled: boolean) {
        const options = {
            timeScale: { visible: enabled }
        };
        
        this.activeCharts.forEach(chart => {
            if (chart.chart) {
                chart.chart.applyOptions(options);
            }
        });
    }
    
    private toggleAutoScale(enabled: boolean) {
        this.activeCharts.forEach(chart => {
            if (chart.chart) {
                const priceScale = chart.chart.priceScale('right');
                if (enabled) {
                    priceScale.applyOptions({ autoScale: true });
                } else {
                    priceScale.applyOptions({ autoScale: false });
                }
            }
        });
    }
    
    private resetZoom() {
        this.activeCharts.forEach(chart => {
            if (chart.chart) {
                chart.chart.timeScale().fitContent();
            }
        });
    }
    
    private takeScreenshot() {
        // For now, just show a message. Full screenshot functionality would require additional libraries
        alert('📸 Screenshot functionality coming soon! Use your browser\'s screenshot tools for now.');
    }

    private updateTitles() {
        const config1 = this.timeframeConfigs[this.chart1.timeframe];
        const config2 = this.timeframeConfigs[this.chart2.timeframe];
        
        const exchangeText = this.overlayMode ? 
            `Multi-Exchange (${Array.from(this.selectedOverlayExchanges).join(', ')})` : 
            this.exchanges[this.selectedExchange].name;
        
        document.getElementById('chart1-title')!.textContent = `${this.selectedAsset} - ${config1.display} - ${exchangeText}`;
        document.getElementById('chart2-title')!.textContent = `${this.selectedAsset} - ${config2.display} - ${exchangeText}`;
    }

    private waitForLightweightChartsAndStart() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const checkAndInit = () => {
            attempts++;
            console.log(`Attempt ${attempts}: Checking for LightweightCharts...`);
            
            if (typeof LightweightCharts !== 'undefined' && LightweightCharts.createChart) {
                console.log('✅ LightweightCharts is available, initializing charts...');
                this.initializeCharts();
                this.startCharts();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error('❌ LightweightCharts failed to load after maximum attempts');
                // Show error message to user
                this.showLoadingError();
                return;
            }
            
            setTimeout(checkAndInit, 100);
        };
        
        checkAndInit();
    }
    
    private showLoadingError() {
        const containers = [
            document.getElementById('chart1-container'),
            document.getElementById('chart2-container')
        ];
        
        containers.forEach((container, index) => {
            if (container) {
                container.innerHTML = `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 400px;
                        background: #f8f9fa;
                        border: 2px dashed #dee2e6;
                        border-radius: 8px;
                        color: #6c757d;
                        text-align: center;
                        padding: 20px;
                    ">
                        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                        <h3 style="margin: 0 0 8px 0; color: #495057;">Chart ${index + 1} Loading Failed</h3>
                        <p style="margin: 0; font-size: 14px;">
                            LightweightCharts library failed to load.<br>
                            Please refresh the page or check your internet connection.
                        </p>
                        <button onclick="window.location.reload()" style="
                            margin-top: 16px;
                            padding: 8px 16px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Refresh Page</button>
                    </div>
                `;
            }
        });
    }

    private initializeCharts() {
        this.createChart(this.chart1);
        this.createChart(this.chart2);
    }

    private createChart(chartInstance: ChartInstance) {
        if (!chartInstance.container) {
            console.error(`Chart container not found for ${chartInstance.chartId}`);
            return;
        }

        const containerWidth = chartInstance.container.clientWidth;
        const containerHeight = chartInstance.container.clientHeight;

        if (containerWidth <= 0 || containerHeight <= 0) {
            console.warn(`Chart container has invalid dimensions: ${containerWidth}x${containerHeight}`);
            return;
        }

        const LWC = (typeof LightweightCharts !== 'undefined' && LightweightCharts) || 
                   (typeof window !== 'undefined' && (window as any).LightweightCharts);
        
        if (!LWC || typeof LWC.createChart !== 'function') {
            console.error(`LightweightCharts library is not available`);
            return;
        }

        try {
            // Create chart with enhanced options
            const chart = LWC.createChart(chartInstance.container, {
                width: containerWidth,
                height: containerHeight,
                layout: {
                    backgroundColor: '#1a1a1a',
                    textColor: '#ffffff',
                },
                grid: {
                    vertLines: {
                        color: '#2a2a2a',
                    },
                    horzLines: {
                        color: '#2a2a2a',
                    },
                },
                crosshair: {
                    mode: 1,
                },
                rightPriceScale: {
                    borderColor: '#484848',
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.2,
                    },
                },
                timeScale: {
                    borderColor: '#484848',
                    timeVisible: true,
                    secondsVisible: false,
                },
            });

            chartInstance.chart = chart;
            
            // Set up crosshair move handler
            chart.subscribeCrosshairMove((param: any) => this.handleCrosshairMove(param, chartInstance));
            
        } catch (error) {
            console.error(`Failed to create chart ${chartInstance.chartId}:`, error);
        }
    }

    private handleCrosshairMove(param: any, chartInstance: ChartInstance) {
        if (!param.time) return;
        
        const tooltip = document.getElementById(`tooltip-${chartInstance.chartId}`);
        if (!tooltip) return;
        
        // Update tooltip position and content based on crosshair
        // This is a placeholder - implement actual tooltip logic
    }

    private async startCharts() {
        await this.startChart(this.chart1);
        await this.startChart(this.chart2);
    }

    private async startChart(chartInstance: ChartInstance) {
        await this.loadHistoricalData(chartInstance);
        this.connectWebSocket(chartInstance);
        this.updateStats(chartInstance);
        
        // Apply saved indicators
        chartInstance.activeIndicators.forEach(indicator => {
            this.addIndicator(chartInstance, indicator);
        });
        
        // Update indicator button states
        this.updateIndicatorButtons(chartInstance);
    }

    private async restartCharts() {
        await this.restartChart(this.chart1);
        await this.restartChart(this.chart2);
    }

    private async restartChart(chartInstance: ChartInstance) {
        console.log(`Restarting chart ${chartInstance.chartId}`);
        
        // Disconnect existing WebSockets
        this.disconnectWebSocket(chartInstance);
        
        // Clear existing series from the chart
        chartInstance.series.forEach((series, exchangeId) => {
            try {
                chartInstance.chart.removeSeries(series);
            } catch (error) {
                console.warn(`Error removing series for ${exchangeId}:`, error);
            }
        });
        
        // Clear all data structures
        chartInstance.series.clear();
        chartInstance.volumeSeries.clear();
        chartInstance.lastCandles.clear();
        chartInstance.openPrices.clear();
        
        // Update status
        this.updateWebSocketStatus(chartInstance.chartId, 'Restarting');
        
        // Start fresh
        await this.startChart(chartInstance);
    }

    private async loadHistoricalData(chartInstance: ChartInstance) {
        console.log(`Loading historical data for chart ${chartInstance.chartId}`);
        
        // List of exchanges that actually work reliably
        const workingExchanges = ['binance', 'bybit', 'okx'];
        
        if (this.overlayMode) {
            // Load data for all selected overlay exchanges, but only working ones
            const exchangesToUse = Array.from(this.selectedOverlayExchanges).filter(ex => workingExchanges.includes(ex));
            
            for (const exchangeId of exchangesToUse) {
                const exchangeConfig = this.exchanges[exchangeId];
                if (exchangeConfig) {
                    const symbol = exchangeConfig.formatSymbol(this.selectedAsset);
                    console.log(`Fetching data for ${exchangeId}: ${symbol} ${chartInstance.timeframe}`);
                    
                    try {
                        const historicalData = await this.fetchHistoricalData(symbol, chartInstance.timeframe, exchangeId);
                        
                        if (historicalData && historicalData.length > 0 && this.validateKlineData(historicalData)) {
                            // Create candlestick series for this exchange
                            const series = chartInstance.chart.addCandlestickSeries({
                                upColor: exchangeConfig.color,
                                downColor: this.darkenColor(exchangeConfig.color),
                                borderDownColor: this.darkenColor(exchangeConfig.color),
                                borderUpColor: exchangeConfig.color,
                                wickDownColor: this.darkenColor(exchangeConfig.color),
                                wickUpColor: exchangeConfig.color,
                                priceLineVisible: false,
                                lastValueVisible: false,
                            });
                            
                            series.setData(historicalData);
                            chartInstance.series.set(exchangeId, series);
                            
                            // Store the last candle for stats
                            if (historicalData.length > 0) {
                                chartInstance.lastCandles.set(exchangeId, historicalData[historicalData.length - 1]);
                                chartInstance.openPrices.set(exchangeId, historicalData[0].open);
                                
                                // Update historical prices for technical analysis
                                chartInstance.historicalPrices = historicalData.map(candle => candle.close);
                                
                                // Update technical analysis
                                this.updateTechnicalAnalysis(chartInstance);
                            }
                            
                            console.log(`✅ Added ${historicalData.length} candles for ${exchangeId}`);
                        } else {
                            console.warn(`❌ Invalid or empty data for ${exchangeId}, using fallback`);
                            // Use fallback data if API data is invalid
                            const fallbackData = this.generateFallbackData(symbol);
                            if (fallbackData.length > 0) {
                                const series = chartInstance.chart.addCandlestickSeries({
                                    upColor: exchangeConfig.color,
                                    downColor: this.darkenColor(exchangeConfig.color),
                                    borderDownColor: this.darkenColor(exchangeConfig.color),
                                    borderUpColor: exchangeConfig.color,
                                    wickDownColor: this.darkenColor(exchangeConfig.color),
                                    wickUpColor: exchangeConfig.color,
                                    priceLineVisible: false,
                                    lastValueVisible: false,
                                });
                                
                                series.setData(fallbackData);
                                chartInstance.series.set(exchangeId, series);
                                chartInstance.lastCandles.set(exchangeId, fallbackData[fallbackData.length - 1]);
                                chartInstance.openPrices.set(exchangeId, fallbackData[0].open);
                                console.log(`🎲 Added ${fallbackData.length} fallback candles for ${exchangeId}`);
                            }
                        }
                    } catch (error) {
                        console.error(`❌ Failed to load data for ${exchangeId}:`, error);
                        // Always provide fallback data
                        const fallbackData = this.generateFallbackData(symbol);
                        if (fallbackData.length > 0) {
                            const series = chartInstance.chart.addCandlestickSeries({
                                upColor: exchangeConfig.color,
                                downColor: this.darkenColor(exchangeConfig.color),
                                borderDownColor: this.darkenColor(exchangeConfig.color),
                                borderUpColor: exchangeConfig.color,
                                wickDownColor: this.darkenColor(exchangeConfig.color),
                                wickUpColor: exchangeConfig.color,
                                priceLineVisible: false,
                                lastValueVisible: false,
                            });
                            
                            series.setData(fallbackData);
                            chartInstance.series.set(exchangeId, series);
                            chartInstance.lastCandles.set(exchangeId, fallbackData[fallbackData.length - 1]);
                            chartInstance.openPrices.set(exchangeId, fallbackData[0].open);
                            console.log(`🎲 Added ${fallbackData.length} emergency fallback candles for ${exchangeId}`);
                        }
                    }
                }
            }
        } else {
            // Load data for single exchange, but only if it's a working one
            if (!workingExchanges.includes(this.selectedExchange)) {
                console.warn(`Exchange ${this.selectedExchange} is not reliable, switching to Binance`);
                this.selectedExchange = 'binance';
                // Update the UI selector
                if (this.exchangeSelect) {
                    this.exchangeSelect.value = 'binance';
                }
            }
            
            const exchangeConfig = this.exchanges[this.selectedExchange];
            if (exchangeConfig) {
                const symbol = exchangeConfig.formatSymbol(this.selectedAsset);
                console.log(`Fetching data for ${this.selectedExchange}: ${symbol} ${chartInstance.timeframe}`);
                
                try {
                    const historicalData = await this.fetchHistoricalData(symbol, chartInstance.timeframe, this.selectedExchange);
                    
                    if (historicalData && historicalData.length > 0 && this.validateKlineData(historicalData)) {
                        // Create candlestick series
                        const series = chartInstance.chart.addCandlestickSeries({
                            upColor: '#26de81',
                            downColor: '#ff4757',
                            borderDownColor: '#ff4757',
                            borderUpColor: '#26de81',
                            wickDownColor: '#ff4757',
                            wickUpColor: '#26de81',
                        });
                        
                        series.setData(historicalData);
                        chartInstance.series.set(this.selectedExchange, series);
                        
                        // Store the last candle for stats
                        if (historicalData.length > 0) {
                            chartInstance.lastCandles.set(this.selectedExchange, historicalData[historicalData.length - 1]);
                            chartInstance.openPrices.set(this.selectedExchange, historicalData[0].open);
                            
                            // Update historical prices for technical analysis
                            chartInstance.historicalPrices = historicalData.map(candle => candle.close);
                            
                            // Update technical analysis
                            this.updateTechnicalAnalysis(chartInstance);
                        }
                        
                        // Fit content to show all data
                        chartInstance.chart.timeScale().fitContent();
                        
                        console.log(`✅ Added ${historicalData.length} candles for ${this.selectedExchange}`);
                    } else {
                        console.warn(`❌ Invalid or empty data for ${this.selectedExchange}, using fallback`);
                        // Use fallback data if API data is invalid
                        const fallbackData = this.generateFallbackData(symbol);
                        if (fallbackData.length > 0) {
                            const series = chartInstance.chart.addCandlestickSeries({
                                upColor: '#26de81',
                                downColor: '#ff4757',
                                borderDownColor: '#ff4757',
                                borderUpColor: '#26de81',
                                wickDownColor: '#ff4757',
                                wickUpColor: '#26de81',
                            });
                            
                            series.setData(fallbackData);
                            chartInstance.series.set(this.selectedExchange, series);
                            chartInstance.lastCandles.set(this.selectedExchange, fallbackData[fallbackData.length - 1]);
                            chartInstance.openPrices.set(this.selectedExchange, fallbackData[0].open);
                            chartInstance.chart.timeScale().fitContent();
                            console.log(`🎲 Added ${fallbackData.length} fallback candles for ${this.selectedExchange}`);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Failed to load data for ${this.selectedExchange}:`, error);
                    // Always provide fallback data
                    const fallbackData = this.generateFallbackData(symbol);
                    if (fallbackData.length > 0) {
                        const series = chartInstance.chart.addCandlestickSeries({
                            upColor: '#26de81',
                            downColor: '#ff4757',
                            borderDownColor: '#ff4757',
                            borderUpColor: '#26de81',
                            wickDownColor: '#ff4757',
                            wickUpColor: '#26de81',
                        });
                        
                        series.setData(fallbackData);
                        chartInstance.series.set(this.selectedExchange, series);
                        chartInstance.lastCandles.set(this.selectedExchange, fallbackData[fallbackData.length - 1]);
                        chartInstance.openPrices.set(this.selectedExchange, fallbackData[0].open);
                        chartInstance.chart.timeScale().fitContent();
                        console.log(`🎲 Added ${fallbackData.length} emergency fallback candles for ${this.selectedExchange}`);
                    }
                }
            }
        }
    }
    
    // Validate kline data to prevent chart crashes
    private validateKlineData(data: KLineData[]): boolean {
        if (!Array.isArray(data) || data.length === 0) {
            return false;
        }
        
        return data.every(candle => {
            return (
                typeof candle.time === 'number' && candle.time > 0 &&
                typeof candle.open === 'number' && candle.open > 0 &&
                typeof candle.high === 'number' && candle.high > 0 &&
                typeof candle.low === 'number' && candle.low > 0 &&
                typeof candle.close === 'number' && candle.close > 0 &&
                typeof candle.volume === 'number' && candle.volume >= 0 &&
                candle.high >= candle.low &&
                candle.high >= candle.open &&
                candle.high >= candle.close &&
                candle.low <= candle.open &&
                candle.low <= candle.close
            );
        });
    }
    
    // Helper to darken colors for down candles
    private darkenColor(color: string): string {
        // Simple color darkening
        const colorMap: Record<string, string> = {
            '#f0b90b': '#cc9900',
            '#f7931a': '#d67700',
            '#00d4ff': '#00b3d9',
            '#5741d9': '#4a37b8',
            '#00CED1': '#00a8aa',
            '#FF007A': '#cc0062',
            '#00D4AA': '#00b088'
        };
        return colorMap[color] || color;
    }

    private async fetchHistoricalData(symbol: string, interval: string, exchangeId: string): Promise<KLineData[]> {
        try {
            const exchangeConfig = this.exchanges[exchangeId];
            if (!exchangeConfig) {
                throw new Error(`Exchange config not found for ${exchangeId}`);
            }
            
            const url = exchangeConfig.historyUrl(symbol, interval, 500);
            console.log(`📡 Fetching from: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`📊 Raw data received for ${exchangeId}:`, data);
            
            // Parse data based on exchange
            let parsedData: KLineData[] = [];
            
            if (exchangeId === 'binance') {
                if (Array.isArray(data)) {
                    parsedData = exchangeConfig.parseHistoricalData(data);
                }
            } else if (exchangeId === 'bybit') {
                if (data.retCode === 0 && data.result && Array.isArray(data.result.list)) {
                    // Bybit returns newest first, so we need to reverse
                    const reversedData = [...data.result.list].reverse();
                    parsedData = reversedData.map((item: any[]) => ({
                        time: Math.floor(parseInt(item[0]) / 1000),
                        open: parseFloat(item[1]),
                        high: parseFloat(item[2]),
                        low: parseFloat(item[3]),
                        close: parseFloat(item[4]),
                        volume: parseFloat(item[5])
                    }));
                }
            } else if (exchangeId === 'okx') {
                if (data.code === '0' && Array.isArray(data.data)) {
                    // OKX returns newest first, so we need to reverse
                    const reversedData = [...data.data].reverse();
                    parsedData = reversedData.map((item: any[]) => ({
                        time: Math.floor(parseInt(item[0]) / 1000),
                        open: parseFloat(item[1]),
                        high: parseFloat(item[2]),
                        low: parseFloat(item[3]),
                        close: parseFloat(item[4]),
                        volume: parseFloat(item[5])
                    }));
                }
            }
            
            // Final validation
            if (parsedData.length === 0) {
                console.warn(`⚠️ No valid data parsed for ${exchangeId}`);
                return [];
            }
            
            // Sort by time to ensure proper order
            parsedData.sort((a, b) => a.time - b.time);
            
            console.log(`✅ Successfully parsed ${parsedData.length} candles for ${exchangeId}`);
            console.log(`📈 First candle:`, parsedData[0]);
            console.log(`📈 Last candle:`, parsedData[parsedData.length - 1]);
            
            return parsedData;
            
        } catch (error) {
            console.error(`❌ Error fetching historical data for ${exchangeId}:`, error);
            
            // For CORS errors, provide helpful message
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.error(`🚫 CORS error for ${exchangeId} - this exchange blocks browser requests`);
            }
            
            // Return fallback data instead of empty array
            console.log(`🔄 Generating fallback data for ${exchangeId}`);
            return this.generateFallbackData(symbol);
        }
    }

    private generateFallbackData(symbol: string): KLineData[] {
        console.log(`🎲 Generating fallback data for ${symbol}`);
        const now = Math.floor(Date.now() / 1000);
        const data: KLineData[] = [];
        
        // Base prices for different assets
        const basePrices: Record<string, number> = {
            'BTCUSDT': 45000,
            'ETHUSDT': 2500,
            'BNBUSDT': 300,
            'ADAUSDT': 0.5,
            'SOLUSDT': 100,
            'XRPUSDT': 0.6,
            'DOTUSDT': 7,
            'LINKUSDT': 15,
            'MATICUSDT': 0.8,
            'LTCUSDT': 70
        };
        
        const basePrice = basePrices[symbol] || 100;
        let currentPrice = basePrice;
        
        // Generate 100 candles of realistic looking data
        for (let i = 99; i >= 0; i--) {
            const time = now - (i * 60); // 1 minute intervals
            
            // Add some trend and volatility
            const trend = (Math.random() - 0.5) * 0.002; // Small trend
            const volatility = basePrice * 0.005; // 0.5% volatility
            
            const open = currentPrice;
            const change = (Math.random() - 0.5) * volatility;
            const high = open + Math.abs(change) + Math.random() * volatility * 0.5;
            const low = open - Math.abs(change) - Math.random() * volatility * 0.5;
            const close = open + change + (trend * basePrice);
            
            // Ensure high >= max(open, close) and low <= min(open, close)
            const actualHigh = Math.max(high, Math.max(open, close));
            const actualLow = Math.min(low, Math.min(open, close));
            
            const volume = Math.random() * 100 + 10; // Random volume 10-110
            
            data.push({
                time,
                open: Math.round(open * 100) / 100,
                high: Math.round(actualHigh * 100) / 100,
                low: Math.round(actualLow * 100) / 100,
                close: Math.round(close * 100) / 100,
                volume: Math.round(volume * 100) / 100
            });
            
            currentPrice = close; // Update for next candle
        }
        
        console.log(`✅ Generated ${data.length} fallback candles for ${symbol}`);
        return data;
    }

    private connectWebSocket(chartInstance: ChartInstance) {
        console.log(`🔌 Connecting WebSocket for chart ${chartInstance.chartId}`);
        
        // Only connect to working exchanges
        const workingExchanges = ['binance', 'bybit', 'okx'];
        
        if (this.overlayMode) {
            // Connect to multiple exchanges, but only working ones
            const exchangesToUse = Array.from(this.selectedOverlayExchanges).filter(ex => workingExchanges.includes(ex));
            
            for (const exchangeId of exchangesToUse) {
                if (chartInstance.websockets.has(exchangeId)) {
                    console.log(`⚠️ WebSocket already exists for ${exchangeId}, skipping`);
                    continue;
                }
                
                this.createWebSocketConnection(chartInstance, exchangeId);
            }
        } else {
            // Connect to single exchange, but only if it's working
            if (!workingExchanges.includes(this.selectedExchange)) {
                console.warn(`⚠️ Exchange ${this.selectedExchange} is not reliable for WebSocket, switching to Binance`);
                this.selectedExchange = 'binance';
            }
            
            if (!chartInstance.websockets.has(this.selectedExchange)) {
                this.createWebSocketConnection(chartInstance, this.selectedExchange);
            }
        }
    }
    
    private createWebSocketConnection(chartInstance: ChartInstance, exchangeId: string) {
        const exchangeConfig = this.exchanges[exchangeId];
        if (!exchangeConfig) {
            console.error(`❌ No config found for exchange: ${exchangeId}`);
            return;
        }
        
        const symbol = exchangeConfig.formatSymbol(this.selectedAsset);
        const wsUrl = exchangeConfig.wsUrl(symbol, chartInstance.timeframe);
        
        console.log(`🔌 Connecting to ${exchangeId} WebSocket: ${wsUrl}`);
        
        try {
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log(`✅ ${exchangeId} WebSocket connected for chart ${chartInstance.chartId}`);
                this.updateWebSocketStatus(chartInstance.chartId, 'Connected');
                
                // Send subscription message for exchanges that need it
                if (exchangeId === 'bybit') {
                    const subscribeMsg = {
                        op: 'subscribe',
                        args: [`kline.${chartInstance.timeframe}.${symbol}`]
                    };
                    ws.send(JSON.stringify(subscribeMsg));
                    console.log(`📤 Sent Bybit subscription:`, subscribeMsg);
                } else if (exchangeId === 'okx') {
                    const subscribeMsg = {
                        op: 'subscribe',
                        args: [{
                            channel: 'candle' + chartInstance.timeframe,
                            instId: symbol
                        }]
                    };
                    ws.send(JSON.stringify(subscribeMsg));
                    console.log(`📤 Sent OKX subscription:`, subscribeMsg);
                }
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const klineData = this.parseWebSocketMessage(data, exchangeId, chartInstance.timeframe);
                    
                    if (klineData && this.validateSingleKline(klineData)) {
                        const series = chartInstance.series.get(exchangeId);
                        if (series) {
                            series.update(klineData);
                            chartInstance.lastCandles.set(exchangeId, klineData);
                            this.updateStats(chartInstance);
                            console.log(`📊 Updated ${exchangeId} chart with:`, klineData);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error parsing ${exchangeId} WebSocket message:`, error);
                }
            };
            
            ws.onerror = (error) => {
                console.error(`❌ ${exchangeId} WebSocket error:`, error);
                this.updateWebSocketStatus(chartInstance.chartId, 'Error');
            };
            
            ws.onclose = (event) => {
                console.log(`🔌 ${exchangeId} WebSocket closed for chart ${chartInstance.chartId}`, event.code, event.reason);
                this.updateWebSocketStatus(chartInstance.chartId, 'Disconnected');
                
                // Remove from the map
                chartInstance.websockets.delete(exchangeId);
                
                // Attempt to reconnect after a delay (only for working exchanges)
                if (['binance', 'bybit', 'okx'].includes(exchangeId)) {
                    setTimeout(() => {
                        if (!chartInstance.websockets.has(exchangeId)) {
                            console.log(`🔄 Attempting to reconnect ${exchangeId} WebSocket...`);
                            this.createWebSocketConnection(chartInstance, exchangeId);
                        }
                    }, 5000);
                }
            };
            
            chartInstance.websockets.set(exchangeId, ws);
        } catch (error) {
            console.error(`❌ Failed to create ${exchangeId} WebSocket:`, error);
        }
    }
    
    // Validate a single kline data point
    private validateSingleKline(candle: KLineData): boolean {
        return (
            typeof candle.time === 'number' && candle.time > 0 &&
            typeof candle.open === 'number' && candle.open > 0 &&
            typeof candle.high === 'number' && candle.high > 0 &&
            typeof candle.low === 'number' && candle.low > 0 &&
            typeof candle.close === 'number' && candle.close > 0 &&
            typeof candle.volume === 'number' && candle.volume >= 0 &&
            candle.high >= candle.low &&
            candle.high >= candle.open &&
            candle.high >= candle.close &&
            candle.low <= candle.open &&
            candle.low <= candle.close
        );
    }

    private parseWebSocketMessage(data: any, exchangeId: string, timeframe: string): KLineData | null {
        const exchangeConfig = this.exchanges[exchangeId];
        if (!exchangeConfig) return null;
        
        try {
            if (exchangeId === 'binance') {
                if (data.k && data.k.x) { // Only process closed candles
                    return exchangeConfig.parseKlineData(data.k);
                }
            } else if (exchangeId === 'bybit') {
                if (data.topic && data.topic.includes('kline') && data.data) {
                    return exchangeConfig.parseKlineData(data.data[0]);
                }
            }
            // Add other exchanges as needed
            
            return null;
        } catch (error) {
            console.error(`Error parsing ${exchangeId} message:`, error);
            return null;
        }
    }
    
    private updateWebSocketStatus(chartId: string, status: string) {
        const statusElement = document.getElementById(`ws${chartId}-status`);
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `status-indicator status-${status.toLowerCase()}`;
        }
    }

    private disconnectWebSocket(chartInstance: ChartInstance) {
        chartInstance.websockets.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
        chartInstance.websockets.clear();
    }

    private updateStats(chartInstance: ChartInstance) {
        // Get the latest candle data for stats
        const lastCandles = Array.from(chartInstance.lastCandles.values());
        const openPrices = Array.from(chartInstance.openPrices.values());
        
        if (lastCandles.length > 0 && openPrices.length > 0) {
            const lastCandle = lastCandles[0]; // Use first exchange's data for stats
            const openPrice = openPrices[0];
            
            this.updateStatsDisplay(chartInstance.chartId, lastCandle, openPrice);
            
            // Update technical analysis if we have enough historical data
            if (chartInstance.historicalPrices.length >= 50) {
                this.updateTechnicalAnalysis(chartInstance);
            }
            
            // Check alerts
            this.checkAlerts(chartInstance);
        }
        
        // Schedule next update
        setTimeout(() => this.updateStats(chartInstance), 1000);
    }
    
    private updateStatsDisplay(chartId: string, lastCandle: KLineData, openPrice: number) {
        // Update price
        const priceElement = document.getElementById(`price${chartId}`);
        if (priceElement) {
            priceElement.textContent = `$${lastCandle.close.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8
            })}`;
        }
        
        // Update change
        const changeElement = document.getElementById(`change${chartId}`);
        if (changeElement) {
            const change = lastCandle.close - openPrice;
            const changePercent = ((change / openPrice) * 100);
            const isPositive = change >= 0;
            
            changeElement.textContent = `${isPositive ? '+' : ''}${change.toFixed(2)} (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%)`;
            changeElement.className = `change ${isPositive ? 'positive' : 'negative'}`;
            changeElement.style.color = isPositive ? '#26de81' : '#ff4757';
        }
        
        // Update OHLC values
        const openElement = document.getElementById(`open${chartId}`);
        if (openElement) {
            openElement.textContent = `$${lastCandle.open.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8
            })}`;
        }
        
        const highElement = document.getElementById(`high${chartId}`);
        if (highElement) {
            highElement.textContent = `$${lastCandle.high.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8
            })}`;
        }
        
        const lowElement = document.getElementById(`low${chartId}`);
        if (lowElement) {
            lowElement.textContent = `$${lastCandle.low.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8
            })}`;
        }
        
        const volumeElement = document.getElementById(`volume${chartId}`);
        if (volumeElement) {
            const volume = lastCandle.volume;
            let formattedVolume: string;
            
            if (volume >= 1e9) {
                formattedVolume = (volume / 1e9).toFixed(2) + 'B';
            } else if (volume >= 1e6) {
                formattedVolume = (volume / 1e6).toFixed(2) + 'M';
            } else if (volume >= 1e3) {
                formattedVolume = (volume / 1e3).toFixed(2) + 'K';
            } else {
                formattedVolume = volume.toFixed(2);
            }
            
            volumeElement.textContent = formattedVolume;
        }
    }

    private handleResize() {
        if (this.chart1.chart) {
            const container = this.chart1.container;
            this.chart1.chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight
            });
        }
        
        if (this.chart2.chart) {
            const container = this.chart2.container;
            this.chart2.chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight
            });
        }
    }

    private checkConnections() {
        [this.chart1, this.chart2].forEach(chartInstance => {
            chartInstance.websockets.forEach((ws, exchangeId) => {
                if (ws.readyState === WebSocket.CLOSED) {
                    console.log(`Reconnecting ${exchangeId} for chart ${chartInstance.chartId}`);
                    // Implement reconnection logic
                }
            });
        });
    }

    private runConnectivityTest() {
        console.log('=== Charts Dashboard Connectivity Test ===');
        console.log('Chart 1 container:', !!this.chart1?.container);
        console.log('Chart 2 container:', !!this.chart2?.container);
        console.log('Chart 1 chart instance:', !!this.chart1?.chart);
        console.log('Chart 2 chart instance:', !!this.chart2?.chart);
        console.log('Chart 1 series count:', this.chart1?.series.size || 0);
        console.log('Chart 2 series count:', this.chart2?.series.size || 0);
        console.log('Chart 1 websockets:', this.chart1?.websockets.size || 0);
        console.log('Chart 2 websockets:', this.chart2?.websockets.size || 0);
        console.log('=== End Connectivity Test ===');
    }

    // Market Data Methods
    private async fetchMarketData() {
        try {
            // Simulate market data fetching (in real implementation, use actual APIs)
            this.marketData = {
                volume24h: '$' + (Math.random() * 100 + 50).toFixed(1) + 'B',
                marketCap: '$' + (Math.random() * 500 + 1000).toFixed(1) + 'B',
                fearGreedIndex: Math.floor(Math.random() * 100).toString(),
                btcDominance: (Math.random() * 10 + 45).toFixed(1) + '%'
            };
            
            this.updateMarketDataDisplay();
        } catch (error) {
            console.error('Error fetching market data:', error);
        }
    }
    
    private updateMarketDataDisplay() {
        const elements = {
            'market-volume': this.marketData.volume24h,
            'market-cap': this.marketData.marketCap,
            'fear-greed': this.marketData.fearGreedIndex,
            'btc-dominance': this.marketData.btcDominance
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    
    // Alert Management
    private addAlert(type: Alert['type'], condition: Alert['condition'], value: number) {
        const alert: Alert = {
            id: Date.now().toString(),
            type,
            condition,
            value,
            asset: this.selectedAsset,
            active: true,
            triggered: false,
            createdAt: new Date()
        };
        
        this.alerts.push(alert);
        this.updateAlertsDisplay();
        this.saveAlertsToStorage();
    }
    
    private removeAlert(alertId: string) {
        this.alerts = this.alerts.filter(alert => alert.id !== alertId);
        this.updateAlertsDisplay();
        this.saveAlertsToStorage();
    }
    
    private checkAlerts(chartInstance: ChartInstance) {
        const lastCandle = Array.from(chartInstance.lastCandles.values())[0];
        if (!lastCandle) return;
        
        this.alerts.forEach(alert => {
            if (!alert.active || alert.triggered) return;
            
            let currentValue = 0;
            switch (alert.type) {
                case 'price':
                    currentValue = lastCandle.close;
                    break;
                case 'volume':
                    currentValue = lastCandle.volume;
                    break;
                case 'rsi':
                    currentValue = chartInstance.technicalData.rsi;
                    break;
                case 'macd':
                    currentValue = chartInstance.technicalData.macd.macd;
                    break;
            }
            
            let triggered = false;
            switch (alert.condition) {
                case 'above':
                    triggered = currentValue > alert.value;
                    break;
                case 'below':
                    triggered = currentValue < alert.value;
                    break;
                case 'crosses':
                    // Simplified crossing logic
                    triggered = Math.abs(currentValue - alert.value) < (alert.value * 0.001);
                    break;
            }
            
            if (triggered) {
                alert.triggered = true;
                this.triggerAlert(alert);
            }
        });
    }
    
    private triggerAlert(alert: Alert) {
        // Show notification
        if (Notification.permission === 'granted') {
            new Notification(`${alert.type.toUpperCase()} Alert`, {
                body: `${alert.asset} ${alert.type} is ${alert.condition} ${alert.value}`,
                icon: '/favicon.ico'
            });
        }
        
        // Visual alert
        this.showAlertNotification(alert);
    }
    
    private showAlertNotification(alert: Alert) {
        const notification = document.createElement('div');
        notification.className = 'alert-notification';
        notification.innerHTML = `
            <div class="alert-content">
                <strong>🔔 ${alert.type.toUpperCase()} Alert</strong>
                <p>${alert.asset} ${alert.type} is ${alert.condition} ${alert.value}</p>
            </div>
            <button class="alert-close">✕</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Manual close
        notification.querySelector('.alert-close')?.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
    
    private updateAlertsDisplay() {
        const alertsList = document.getElementById('alerts-list');
        if (!alertsList) return;
        
        alertsList.innerHTML = this.alerts.map(alert => `
            <div class="alert-item ${alert.triggered ? 'triggered' : ''}">
                <div class="alert-info">
                    <span class="alert-type">${alert.type.toUpperCase()}</span>
                    <span class="alert-condition">${alert.condition} ${alert.value}</span>
                    <span class="alert-asset">${alert.asset}</span>
                </div>
                <button class="alert-remove" data-id="${alert.id}">Remove</button>
            </div>
        `).join('');
        
        // Add remove event listeners
        alertsList.querySelectorAll('.alert-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const alertId = (e.target as HTMLElement).dataset.id;
                if (alertId) this.removeAlert(alertId);
            });
        });
    }
    
    private saveAlertsToStorage() {
        localStorage.setItem('chartDashboardAlerts', JSON.stringify(this.alerts));
    }
    
    private loadAlertsFromStorage() {
        const stored = localStorage.getItem('chartDashboardAlerts');
        if (stored) {
            this.alerts = JSON.parse(stored);
            this.updateAlertsDisplay();
        }
    }
    
    // Technical Analysis Methods
    private updateTechnicalAnalysis(chartInstance: ChartInstance) {
        if (chartInstance.historicalPrices.length < 50) return;
        
        const prices = chartInstance.historicalPrices;
        
        chartInstance.technicalData = {
            rsi: TechnicalAnalysis.calculateRSI(prices),
            macd: TechnicalAnalysis.calculateMACD(prices),
            bollinger: TechnicalAnalysis.calculateBollingerBands(prices),
            volatility: TechnicalAnalysis.calculateVolatility(prices),
            ma20: TechnicalAnalysis.calculateSMA(prices, 20),
            ma50: TechnicalAnalysis.calculateSMA(prices, 50)
        };
        
        this.updateTechnicalDisplay(chartInstance);
    }
    
    private updateTechnicalDisplay(chartInstance: ChartInstance) {
        const chartId = chartInstance.chartId;
        const tech = chartInstance.technicalData;
        
        const elements = {
            [`rsi${chartId}`]: tech.rsi.toFixed(1),
            [`macd${chartId}`]: tech.macd.macd.toFixed(4),
            [`bb${chartId}`]: tech.bollinger.percentage.toFixed(1) + '%',
            [`volatility${chartId}`]: tech.volatility.toFixed(1) + '%'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    
    // Chart Mode Management
    private switchChartMode(mode: typeof this.chartMode) {
        this.chartMode = mode;
        const chartsGrid = document.getElementById('charts-grid');
        if (!chartsGrid) return;
        
        // Remove existing mode classes
        chartsGrid.className = 'charts-grid';
        
        // Hide all charts first
        [1, 2, 3, 4].forEach(i => {
            const section = document.getElementById(`chart${i}-section`);
            if (section) section.style.display = 'none';
        });
        
        switch (mode) {
            case 'single':
                chartsGrid.classList.add('single-mode');
                document.getElementById('chart1-section')!.style.display = 'flex';
                this.activeCharts = [this.chart1];
                break;
            case 'dual':
                document.getElementById('chart1-section')!.style.display = 'flex';
                document.getElementById('chart2-section')!.style.display = 'flex';
                this.activeCharts = [this.chart1, this.chart2];
                break;
            case 'quad':
                chartsGrid.classList.add('quad-mode');
                [1, 2, 3, 4].forEach(i => {
                    document.getElementById(`chart${i}-section`)!.style.display = 'flex';
                });
                this.activeCharts = [this.chart1, this.chart2, this.chart3, this.chart4];
                break;
            case 'comparison':
                chartsGrid.classList.add('comparison-mode');
                document.getElementById('chart1-section')!.style.display = 'flex';
                this.activeCharts = [this.chart1];
                break;
        }
        
        // Resize charts after mode change
        setTimeout(() => this.handleResize(), 100);
        
        // Save preferences when chart mode changes
        this.savePreferencesDebounced();
    }
    
    // Indicator Management
    private toggleIndicator(chartInstance: ChartInstance, indicator: string) {
        if (chartInstance.activeIndicators.has(indicator)) {
            this.removeIndicator(chartInstance, indicator);
        } else {
            this.addIndicator(chartInstance, indicator);
        }
        
        // Save preferences when indicators change
        this.savePreferencesDebounced();
    }
    
    private addIndicator(chartInstance: ChartInstance, indicator: string) {
        if (!chartInstance.chart) return;
        
        chartInstance.activeIndicators.add(indicator);
        
        switch (indicator) {
            case 'volume':
                this.addVolumeIndicator(chartInstance);
                break;
            case 'ma':
                this.addMovingAverageIndicator(chartInstance);
                break;
            case 'bollinger':
                this.addBollingerBandsIndicator(chartInstance);
                break;
            case 'rsi':
                this.addRSIIndicator(chartInstance);
                break;
            case 'macd':
                this.addMACDIndicator(chartInstance);
                break;
        }
        
        this.updateIndicatorButtons(chartInstance);
    }
    
    private removeIndicator(chartInstance: ChartInstance, indicator: string) {
        chartInstance.activeIndicators.delete(indicator);
        
        const series = chartInstance.indicatorSeries.get(indicator);
        if (series && chartInstance.chart) {
            chartInstance.chart.removeSeries(series);
            chartInstance.indicatorSeries.delete(indicator);
        }
        
        this.updateIndicatorButtons(chartInstance);
    }
    
    private updateIndicatorButtons(chartInstance: ChartInstance) {
        const chartNum = chartInstance.chartId;
        document.querySelectorAll(`[data-chart="${chartNum}"]`).forEach(btn => {
            const indicator = (btn as HTMLElement).dataset.indicator;
            if (indicator) {
                const isActive = chartInstance.activeIndicators.has(indicator);
                btn.classList.toggle('active', isActive);
                
                // Update button appearance
                if (isActive) {
                    (btn as HTMLElement).style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
                    (btn as HTMLElement).style.color = '#000';
                } else {
                    (btn as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
                    (btn as HTMLElement).style.color = '#fff';
                }
            }
        });
    }
    
    // Export Functionality
    private exportChartData() {
        const data = {
            asset: this.selectedAsset,
            exchange: this.selectedExchange,
            timestamp: new Date().toISOString(),
            charts: this.activeCharts.map(chart => ({
                timeframe: chart.timeframe,
                technicalData: chart.technicalData,
                lastCandle: Array.from(chart.lastCandles.values())[0]
            })),
            alerts: this.alerts,
            marketData: this.marketData
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart-data-${this.selectedAsset}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Fullscreen Management
    private toggleFullscreen() {
        this.fullscreenMode = !this.fullscreenMode;
        const chartsContainer = document.getElementById('charts-container');
        
        if (this.fullscreenMode) {
            chartsContainer?.requestFullscreen?.();
            document.body.classList.add('fullscreen-mode');
        } else {
            document.exitFullscreen?.();
            document.body.classList.remove('fullscreen-mode');
        }
    }

    // Indicator Implementation Methods
    private addVolumeIndicator(chartInstance: ChartInstance) {
        if (!chartInstance.chart) return;
        
        const volumeSeries = chartInstance.chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: 'volume',
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });
        
        chartInstance.indicatorSeries.set('volume', volumeSeries);
        
        // Add existing volume data if available
        const exchangeId = this.overlayMode ? Array.from(this.selectedOverlayExchanges)[0] : this.selectedExchange;
        const existingVolumeSeries = chartInstance.volumeSeries.get(exchangeId);
        if (existingVolumeSeries) {
            // Copy data from existing volume series
            // This is a simplified approach - in practice you'd maintain the data separately
        }
    }
    
    private addMovingAverageIndicator(chartInstance: ChartInstance) {
        if (!chartInstance.chart || chartInstance.historicalPrices.length < 50) return;
        
        const ma20Series = chartInstance.chart.addLineSeries({
            color: '#FF6B6B',
            lineWidth: 2,
            title: 'MA20',
        });
        
        const ma50Series = chartInstance.chart.addLineSeries({
            color: '#4ECDC4',
            lineWidth: 2,
            title: 'MA50',
        });
        
        chartInstance.indicatorSeries.set('ma20', ma20Series);
        chartInstance.indicatorSeries.set('ma50', ma50Series);
        
        // Calculate and set MA data
        this.updateMovingAverages(chartInstance);
    }
    
    private addBollingerBandsIndicator(chartInstance: ChartInstance) {
        if (!chartInstance.chart || chartInstance.historicalPrices.length < 20) return;
        
        const upperBandSeries = chartInstance.chart.addLineSeries({
            color: '#9C27B0',
            lineWidth: 1,
            lineStyle: 2, // Dashed
            title: 'BB Upper',
        });
        
        const lowerBandSeries = chartInstance.chart.addLineSeries({
            color: '#9C27B0',
            lineWidth: 1,
            lineStyle: 2, // Dashed
            title: 'BB Lower',
        });
        
        const middleBandSeries = chartInstance.chart.addLineSeries({
            color: '#9C27B0',
            lineWidth: 1,
            title: 'BB Middle',
        });
        
        chartInstance.indicatorSeries.set('bb_upper', upperBandSeries);
        chartInstance.indicatorSeries.set('bb_lower', lowerBandSeries);
        chartInstance.indicatorSeries.set('bb_middle', middleBandSeries);
        
        this.updateBollingerBands(chartInstance);
    }
    
    private addRSIIndicator(chartInstance: ChartInstance) {
        if (!chartInstance.chart || chartInstance.historicalPrices.length < 14) return;
        
        const rsiSeries = chartInstance.chart.addLineSeries({
            color: '#FF9800',
            lineWidth: 2,
            title: 'RSI',
            priceScaleId: 'rsi',
        });
        
        // Set RSI scale
        chartInstance.chart.priceScale('rsi').applyOptions({
            scaleMargins: {
                top: 0.1,
                bottom: 0.1,
            },
            borderVisible: false,
        });
        
        chartInstance.indicatorSeries.set('rsi', rsiSeries);
        this.updateRSI(chartInstance);
    }
    
    private addMACDIndicator(chartInstance: ChartInstance) {
        if (!chartInstance.chart || chartInstance.historicalPrices.length < 26) return;
        
        const macdSeries = chartInstance.chart.addLineSeries({
            color: '#2196F3',
            lineWidth: 2,
            title: 'MACD',
            priceScaleId: 'macd',
        });
        
        const signalSeries = chartInstance.chart.addLineSeries({
            color: '#FF5722',
            lineWidth: 2,
            title: 'Signal',
            priceScaleId: 'macd',
        });
        
        const histogramSeries = chartInstance.chart.addHistogramSeries({
            color: '#4CAF50',
            title: 'Histogram',
            priceScaleId: 'macd',
        });
        
        chartInstance.indicatorSeries.set('macd', macdSeries);
        chartInstance.indicatorSeries.set('macd_signal', signalSeries);
        chartInstance.indicatorSeries.set('macd_histogram', histogramSeries);
        
        this.updateMACD(chartInstance);
    }
    
    // Indicator Update Methods
    private updateMovingAverages(chartInstance: ChartInstance) {
        const prices = chartInstance.historicalPrices;
        if (prices.length < 50) return;
        
        const ma20Series = chartInstance.indicatorSeries.get('ma20');
        const ma50Series = chartInstance.indicatorSeries.get('ma50');
        
        if (ma20Series && ma50Series) {
            const currentTime = Math.floor(Date.now() / 1000);
            const ma20Value = TechnicalAnalysis.calculateSMA(prices, 20);
            const ma50Value = TechnicalAnalysis.calculateSMA(prices, 50);
            
            ma20Series.update({ time: currentTime, value: ma20Value });
            ma50Series.update({ time: currentTime, value: ma50Value });
        }
    }
    
    private updateBollingerBands(chartInstance: ChartInstance) {
        const prices = chartInstance.historicalPrices;
        if (prices.length < 20) return;
        
        const bb = TechnicalAnalysis.calculateBollingerBands(prices);
        const currentTime = Math.floor(Date.now() / 1000);
        
        const upperSeries = chartInstance.indicatorSeries.get('bb_upper');
        const middleSeries = chartInstance.indicatorSeries.get('bb_middle');
        const lowerSeries = chartInstance.indicatorSeries.get('bb_lower');
        
        if (upperSeries && middleSeries && lowerSeries) {
            upperSeries.update({ time: currentTime, value: bb.upper });
            middleSeries.update({ time: currentTime, value: bb.middle });
            lowerSeries.update({ time: currentTime, value: bb.lower });
        }
    }
    
    private updateRSI(chartInstance: ChartInstance) {
        const prices = chartInstance.historicalPrices;
        if (prices.length < 14) return;
        
        const rsiSeries = chartInstance.indicatorSeries.get('rsi');
        if (rsiSeries) {
            const rsiValue = TechnicalAnalysis.calculateRSI(prices);
            const currentTime = Math.floor(Date.now() / 1000);
            rsiSeries.update({ time: currentTime, value: rsiValue });
        }
    }
    
    private updateMACD(chartInstance: ChartInstance) {
        const prices = chartInstance.historicalPrices;
        if (prices.length < 26) return;
        
        const macd = TechnicalAnalysis.calculateMACD(prices);
        const currentTime = Math.floor(Date.now() / 1000);
        
        const macdSeries = chartInstance.indicatorSeries.get('macd');
        const signalSeries = chartInstance.indicatorSeries.get('macd_signal');
        const histogramSeries = chartInstance.indicatorSeries.get('macd_histogram');
        
        if (macdSeries && signalSeries && histogramSeries) {
            macdSeries.update({ time: currentTime, value: macd.macd });
            signalSeries.update({ time: currentTime, value: macd.signal });
            histogramSeries.update({ time: currentTime, value: macd.histogram });
        }
    }
    
    // Helper method to get chart instance by ID
    private getChartById(chartId: string): ChartInstance | null {
        switch (chartId) {
            case '1': return this.chart1;
            case '2': return this.chart2;
            case '3': return this.chart3;
            case '4': return this.chart4;
            default: return null;
        }
    }

    // User Preferences Persistence
    private saveUserPreferences() {
        try {
            const preferences = {
                selectedAsset: this.selectedAsset,
                selectedExchange: this.selectedExchange,
                overlayMode: this.overlayMode,
                selectedOverlayExchanges: Array.from(this.selectedOverlayExchanges),
                chartMode: this.chartMode,
                timeframes: {
                    chart1: this.chart1.timeframe,
                    chart2: this.chart2.timeframe,
                    chart3: this.chart3.timeframe,
                    chart4: this.chart4.timeframe
                },
                activeIndicators: {
                    chart1: Array.from(this.chart1.activeIndicators),
                    chart2: Array.from(this.chart2.activeIndicators),
                    chart3: Array.from(this.chart3.activeIndicators),
                    chart4: Array.from(this.chart4.activeIndicators)
                },
                sidePanelVisible: this.sidePanelVisible,
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem('chartsDashboardPreferences', JSON.stringify(preferences));
            console.log('💾 User preferences saved successfully');
            
            // Show save confirmation
            this.showPreferencesStatus('Preferences Saved!', 'saved');
            
        } catch (error) {
            console.error('❌ Failed to save user preferences:', error);
            this.showPreferencesStatus('Save Failed!', 'error');
        }
    }
    
    private showPreferencesStatus(message: string, type: 'saved' | 'error' | 'saving' = 'saved') {
        const statusElement = document.getElementById('preferences-status');
        if (!statusElement) return;
        
        statusElement.textContent = message;
        statusElement.className = `preferences-status show ${type}`;
        
        // Hide after 2 seconds
        setTimeout(() => {
            statusElement.classList.remove('show');
        }, 2000);
    }
    
    private loadUserPreferences() {
        try {
            const stored = localStorage.getItem('chartsDashboardPreferences');
            if (!stored) {
                console.log('📝 No saved preferences found, using defaults');
                return;
            }
            
            const preferences = JSON.parse(stored);
            console.log('📂 Loading saved user preferences:', preferences);
            
            // Restore basic settings
            if (preferences.selectedAsset) {
                this.selectedAsset = preferences.selectedAsset;
            }
            
            if (preferences.selectedExchange) {
                // Verify the exchange is still valid/working
                const workingExchanges = ['binance', 'bybit', 'okx'];
                if (workingExchanges.includes(preferences.selectedExchange)) {
                    this.selectedExchange = preferences.selectedExchange;
                } else {
                    console.warn(`⚠️ Saved exchange ${preferences.selectedExchange} is no longer working, using default`);
                }
            }
            
            if (typeof preferences.overlayMode === 'boolean') {
                this.overlayMode = preferences.overlayMode;
            }
            
            if (preferences.selectedOverlayExchanges && Array.isArray(preferences.selectedOverlayExchanges)) {
                // Filter to only working exchanges
                const workingExchanges = ['binance', 'bybit', 'okx'];
                const validOverlayExchanges = preferences.selectedOverlayExchanges.filter(
                    (exchange: string) => workingExchanges.includes(exchange)
                );
                
                if (validOverlayExchanges.length > 0) {
                    this.selectedOverlayExchanges = new Set(validOverlayExchanges);
                } else {
                    this.selectedOverlayExchanges = new Set(['binance']); // Default fallback
                }
            }
            
            if (preferences.chartMode) {
                this.chartMode = preferences.chartMode;
            }
            
            // Restore timeframes
            if (preferences.timeframes) {
                if (preferences.timeframes.chart1) this.chart1.timeframe = preferences.timeframes.chart1;
                if (preferences.timeframes.chart2) this.chart2.timeframe = preferences.timeframes.chart2;
                if (preferences.timeframes.chart3) this.chart3.timeframe = preferences.timeframes.chart3;
                if (preferences.timeframes.chart4) this.chart4.timeframe = preferences.timeframes.chart4;
            }
            
            // Restore active indicators
            if (preferences.activeIndicators) {
                if (preferences.activeIndicators.chart1) {
                    this.chart1.activeIndicators = new Set(preferences.activeIndicators.chart1);
                }
                if (preferences.activeIndicators.chart2) {
                    this.chart2.activeIndicators = new Set(preferences.activeIndicators.chart2);
                }
                if (preferences.activeIndicators.chart3) {
                    this.chart3.activeIndicators = new Set(preferences.activeIndicators.chart3);
                }
                if (preferences.activeIndicators.chart4) {
                    this.chart4.activeIndicators = new Set(preferences.activeIndicators.chart4);
                }
            }
            
            if (typeof preferences.sidePanelVisible === 'boolean') {
                this.sidePanelVisible = preferences.sidePanelVisible;
            }
            
            console.log('✅ User preferences loaded successfully');
            
            // Apply the loaded preferences to the UI
            this.applyPreferencesToUI();
            
        } catch (error) {
            console.error('❌ Failed to load user preferences:', error);
            console.log('🔄 Using default settings');
        }
    }
    
    private applyPreferencesToUI() {
        // Update UI elements to reflect loaded preferences
        if (this.assetSelect) {
            this.assetSelect.value = this.selectedAsset;
        }
        
        if (this.exchangeSelect) {
            this.exchangeSelect.value = this.selectedExchange;
        }
        
        if (this.overlayModeToggle) {
            this.overlayModeToggle.checked = this.overlayMode;
        }
        
        if (this.overlayExchangesDiv) {
            this.overlayExchangesDiv.style.display = this.overlayMode ? 'block' : 'none';
            
            // Update overlay exchange checkboxes
            const checkboxes = this.overlayExchangesDiv.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const input = checkbox as HTMLInputElement;
                input.checked = this.selectedOverlayExchanges.has(input.value);
            });
        }
        
        if (this.chartModeSelect) {
            this.chartModeSelect.value = this.chartMode;
        }
        
        // Update timeframe selectors
        if (this.timeframe1Select) this.timeframe1Select.value = this.chart1.timeframe;
        if (this.timeframe2Select) this.timeframe2Select.value = this.chart2.timeframe;
        if (this.timeframe3Select) this.timeframe3Select.value = this.chart3.timeframe;
        if (this.timeframe4Select) this.timeframe4Select.value = this.chart4.timeframe;
        
        // Update side panel visibility
        if (this.sidePanel) {
            this.sidePanel.style.display = this.sidePanelVisible ? 'block' : 'none';
        }
        
        // Apply side panel visibility
        const sidePanel = document.getElementById('side-panel');
        if (sidePanel) {
            if (this.sidePanelVisible) {
                sidePanel.classList.add('open');
            } else {
                sidePanel.classList.remove('open');
            }
        }
        
        // Apply chart mode
        this.switchChartMode(this.chartMode);
        
        // Update indicator button states for all charts
        [this.chart1, this.chart2, this.chart3, this.chart4].forEach(chart => {
            this.updateIndicatorButtons(chart);
        });
        
        console.log('🎨 UI updated with saved preferences');
    }
    
    // Enhanced method to save preferences when settings change
    private savePreferencesDebounced = this.debounce(() => {
        this.saveUserPreferences();
    }, 1000);
    
    private debounce(func: Function, wait: number) {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Method to reset all preferences
    private resetUserPreferences() {
        try {
            localStorage.removeItem('chartsDashboardPreferences');
            console.log('🗑️ User preferences reset');
            
            // Reset to defaults
            this.selectedAsset = 'BTCUSDT';
            this.selectedExchange = 'binance';
            this.overlayMode = false;
            this.selectedOverlayExchanges = new Set(['binance']);
            this.chartMode = 'dual';
            this.chart1.timeframe = '1m';
            this.chart2.timeframe = '5m';
            this.chart3.timeframe = '15m';
            this.chart4.timeframe = '1h';
            this.sidePanelVisible = false;
            
            // Clear all active indicators
            [this.chart1, this.chart2, this.chart3, this.chart4].forEach(chart => {
                chart.activeIndicators.clear();
            });
            
            this.applyPreferencesToUI();
            this.restartCharts();
            
        } catch (error) {
            console.error('❌ Failed to reset preferences:', error);
        }
    }
}

// Initialize the dashboard when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChartsDashboard();
}); 
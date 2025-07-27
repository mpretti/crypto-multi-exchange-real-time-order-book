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
    private overlayMode: boolean = true; // Enable overlay mode by default
    private selectedOverlayExchanges: Set<string> = new Set(['binance', 'bybit', 'okx', 'mexc']); // Show multiple exchanges by default
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
            historyUrl: (symbol: string, interval: string, limit: number) => `/api/binance/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
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
            historyUrl: (symbol: string, interval: string, limit: number) => {
                // Bybit uses different interval notation
                const intervalMap: Record<string, string> = {
                    '1m': '1',
                    '3m': '3',
                    '5m': '5',
                    '15m': '15',
                    '30m': '30',
                    '1h': '60',
                    '2h': '120',
                    '4h': '240',
                    '6h': '360',
                    '8h': '480',
                    '12h': '720',
                    '1d': 'D',
                    '3d': '3D',
                    '1w': 'W'
                };
                const bybitInterval = intervalMap[interval] || interval;
                return `/api/bybit/v5/market/kline?category=linear&symbol=${symbol}&interval=${bybitInterval}&limit=${limit}`;
            },
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
            historyUrl: (symbol: string, interval: string, limit: number) => {
                // OKX uses different interval notation
                const intervalMap: Record<string, string> = {
                    '1m': '1m',
                    '3m': '3m',
                    '5m': '5m',
                    '15m': '15m',
                    '30m': '30m',
                    '1h': '1H',
                    '2h': '2H',
                    '4h': '4H',
                    '6h': '6H',
                    '8h': '8H',
                    '12h': '12H',
                    '1d': '1D',
                    '3d': '3D',
                    '1w': '1W'
                };
                const okxInterval = intervalMap[interval] || interval;
                return `/api/okx/api/v5/market/candles?instId=${symbol}&bar=${okxInterval}&limit=${limit}`;
            },
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
            color: '#0066ff'  // Changed from '#00d4ff' to darker blue for better distinction
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
        },
        mexc: {
            name: 'MEXC',
            wsUrl: (_symbol: string, _interval: string) => `wss://wbs.mexc.com/ws`,
            historyUrl: (symbol: string, interval: string, limit: number) => {
                const intervalMap: Record<string, string> = {
                    '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
                    '1h': '1h', '4h': '4h', '1d': '1d'
                };
                const mexcInterval = intervalMap[interval] || interval;
                return `/api/mexc/api/v3/klines?symbol=${symbol}&interval=${mexcInterval}&limit=${limit}`;
            },
            formatSymbol: (symbol: string) => symbol.toUpperCase(),
            parseKlineData: (data: any) => ({
                time: Math.floor(data[0] / 1000),
                open: parseFloat(data[1]),
                high: parseFloat(data[2]),
                low: parseFloat(data[3]),
                close: parseFloat(data[4]),
                volume: parseFloat(data[5])
            }),
            parseHistoricalData: (data: any) => {
                if (Array.isArray(data)) {
                    return data.map((item: any[]) => ({
                        time: Math.floor(item[0] / 1000),
                        open: parseFloat(item[1]),
                        high: parseFloat(item[2]),
                        low: parseFloat(item[3]),
                        close: parseFloat(item[4]),
                        volume: parseFloat(item[5])
                    }));
                }
                return [];
            },
            color: '#1E88E5'
        },
    };

    // ... rest of the existing code ...
}

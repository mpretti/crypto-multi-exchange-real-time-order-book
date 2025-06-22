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
    container: HTMLElement;
    websockets: Map<string, WebSocket>; // Map of exchange -> websocket
    lastCandles: Map<string, KLineData>; // Map of exchange -> last candle
    openPrices: Map<string, number>; // Map of exchange -> open price
    timeframe: string;
    chartId: string;
}

interface TimeframeConfig {
    display: string;
    wsInterval: string;
    tooltipFormat: string;
    scaleFormat: string;
}

class ChartsDashboard {
    private selectedAsset: string = 'BTCUSDT';
    private selectedExchange: string = 'binance';
    private overlayMode: boolean = false;
    private selectedOverlayExchanges: Set<string> = new Set(['binance']);
    private chart1!: ChartInstance;
    private chart2!: ChartInstance;
    
    // DOM Elements
    private assetSelect!: HTMLSelectElement;
    private exchangeSelect!: HTMLSelectElement;
    private overlayModeToggle!: HTMLInputElement;
    private overlayExchangesDiv!: HTMLElement;
    private timeframe1Select!: HTMLSelectElement;
    private timeframe2Select!: HTMLSelectElement;
    
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
        console.log('ChartsDashboard initializing...');
        this.initializeDOM();
        this.setupEventListeners();
        this.updateTitles();
        this.waitForLightweightChartsAndStart();
        
        // Add a simple connectivity test
        setTimeout(() => this.runConnectivityTest(), 5000);
    }

    private initializeDOM() {
        this.assetSelect = document.getElementById('asset-select') as HTMLSelectElement;
        this.exchangeSelect = document.getElementById('exchange-select') as HTMLSelectElement;
        this.overlayModeToggle = document.getElementById('overlay-mode') as HTMLInputElement;
        this.overlayExchangesDiv = document.getElementById('overlay-exchanges')!;
        this.timeframe1Select = document.getElementById('timeframe1-select') as HTMLSelectElement;
        this.timeframe2Select = document.getElementById('timeframe2-select') as HTMLSelectElement;

        // Initialize chart instances
        this.chart1 = {
            chart: null,
            series: new Map(),
            volumeSeries: new Map(),
            container: document.getElementById('chart1-container')!,
            websockets: new Map(),
            lastCandles: new Map(),
            openPrices: new Map(),
            timeframe: '1m',
            chartId: '1'
        };

        this.chart2 = {
            chart: null,
            series: new Map(),
            volumeSeries: new Map(),
            container: document.getElementById('chart2-container')!,
            websockets: new Map(),
            lastCandles: new Map(),
            openPrices: new Map(),
            timeframe: '5m',
            chartId: '2'
        };
    }

    private setupEventListeners() {
        // Asset selector
        this.assetSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            this.selectedAsset = target.value;
            this.updateTitles();
            this.restartCharts();
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
        });

        this.timeframe2Select.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            this.chart2.timeframe = target.value;
            this.updateTitles();
            this.restartChart(this.chart2);
        });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Connection monitoring
        setInterval(() => this.checkConnections(), 30000); // Check every 30 seconds
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
        const maxAttempts = 100;
        
        const checkAndInit = () => {
            attempts++;
            console.log(`Attempt ${attempts}: Checking LightweightCharts availability`);
            
            const lwc = (typeof LightweightCharts !== 'undefined' && LightweightCharts) || 
                       (typeof window !== 'undefined' && (window as any).LightweightCharts);
            
            if (lwc && typeof lwc.createChart === 'function') {
                console.log('LightweightCharts is available, initializing charts...');
                this.initializeCharts();
                this.startCharts();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error('Failed to load LightweightCharts after maximum attempts.');
                return;
            }
            
            setTimeout(checkAndInit, 100);
        };
        
        checkAndInit();
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
                            }
                            
                            console.log(`✅ Added ${historicalData.length} candles for ${exchangeId}`);
                        } else {
                            console.warn(`❌ Invalid or empty data for ${exchangeId}`);
                        }
                    } catch (error) {
                        console.error(`❌ Failed to load data for ${exchangeId}:`, error);
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
                        }
                        
                        // Fit content to show all data
                        chartInstance.chart.timeScale().fitContent();
                        
                        console.log(`✅ Added ${historicalData.length} candles for ${this.selectedExchange}`);
                    } else {
                        console.warn(`❌ Invalid or empty data for ${this.selectedExchange}`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to load data for ${this.selectedExchange}:`, error);
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
            
            return [];
        }
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
        const chartId = chartInstance.chartId;
        
        if (this.overlayMode) {
            // Calculate stats for overlay mode - use primary exchange for main stats
            const primaryExchange = Array.from(this.selectedOverlayExchanges)[0];
            const lastCandle = chartInstance.lastCandles.get(primaryExchange);
            if (lastCandle) {
                this.updateStatsDisplay(chartId, lastCandle, chartInstance.openPrices.get(primaryExchange) || lastCandle.open);
            }
        } else {
            // Calculate stats for single exchange
            const lastCandle = chartInstance.lastCandles.get(this.selectedExchange);
            if (lastCandle) {
                this.updateStatsDisplay(chartId, lastCandle, chartInstance.openPrices.get(this.selectedExchange) || lastCandle.open);
            }
        }
        
        // Update last update time
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleTimeString();
        }
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
}

// Initialize the dashboard when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChartsDashboard();
}); 
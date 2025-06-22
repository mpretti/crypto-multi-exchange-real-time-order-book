/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KLineData } from './types';

// LightweightCharts is loaded globally via CDN
declare const LightweightCharts: any;
import { chartContainerEl, chartTimeframeSelectorEl } from './dom';
import {
    chart, klineSeries, currentChartInterval, klineWebSocket,
    setChart, setKlineSeries, setCurrentChartInterval, setKlineWebSocket, selectedAsset
} from './state';
import { fetchBinanceHistoricalKlines } from './api';
import { logger } from './utils';

// Enhanced chart state
let volumeSeries: any = null;
let maSeries: any = null;
let bollBandsSeries: any = null;
let rsiSeries: any = null;
let macdSeries: any = null;
let orderBookDepthSeries: any = null;
let exchangeComparisonSeries: Map<string, any> = new Map();
let currentIndicators: Set<string> = new Set();
let chartMode: 'single' | 'comparison' | 'depth' = 'single';
let depthWebSocket: WebSocket | null = null;

// Technical indicator calculations
export function calculateSMA(data: KLineData[], period: number): number[] {
    const sma: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(NaN);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
            sma.push(sum / period);
        }
    }
    return sma;
}

export function calculateEMA(data: KLineData[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            ema.push(data[i].close);
        } else {
            ema.push((data[i].close - ema[i - 1]) * multiplier + ema[i - 1]);
        }
    }
    return ema;
}

export function calculateBollingerBands(data: KLineData[], period: number = 20, stdDev: number = 2) {
    const sma = calculateSMA(data, period);
    const upperBand: number[] = [];
    const lowerBand: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            upperBand.push(NaN);
            lowerBand.push(NaN);
        } else {
            const slice = data.slice(i - period + 1, i + 1);
            const avg = sma[i];
            const variance = slice.reduce((acc, val) => acc + Math.pow(val.close - avg, 2), 0) / period;
            const standardDeviation = Math.sqrt(variance);
            
            upperBand.push(avg + (standardDeviation * stdDev));
            lowerBand.push(avg - (standardDeviation * stdDev));
        }
    }
    
    return { upper: upperBand, middle: sma, lower: lowerBand };
}

export function calculateRSI(data: KLineData[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    for (let i = 0; i < data.length; i++) {
        if (i < period) {
            rsi.push(NaN);
        } else {
            const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
            const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
            
            if (avgLoss === 0) {
                rsi.push(100);
            } else {
                const rs = avgGain / avgLoss;
                rsi.push(100 - (100 / (1 + rs)));
            }
        }
    }
    
    return rsi;
}

export function calculateMACD(data: KLineData[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const fastEMA = calculateEMA(data, fastPeriod);
    const slowEMA = calculateEMA(data, slowPeriod);
    const macdLine: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
        macdLine.push(fastEMA[i] - slowEMA[i]);
    }
    
    const signalLine = calculateEMA(macdLine.map((val, i) => ({ close: val, time: data[i].time, open: val, high: val, low: val })), signalPeriod);
    const histogram: number[] = [];
    
    for (let i = 0; i < macdLine.length; i++) {
        histogram.push(macdLine[i] - signalLine[i]);
    }
    
    return { macd: macdLine, signal: signalLine, histogram };
}

export function initChart() {
    // Clear existing chart data first
    if (klineSeries && typeof klineSeries.setData === 'function') {
        try { klineSeries.setData([]); } catch (e) { logger.warn("Chart: Minor error clearing old klineSeries data:", e); }
    }
    setKlineSeries(null);

    // Clear indicator series
    volumeSeries = null;
    maSeries = null;
    bollBandsSeries = null;
    rsiSeries = null;
    macdSeries = null;
    orderBookDepthSeries = null;
    exchangeComparisonSeries.clear();

    if (chart && typeof chart.remove === 'function') {
        try { chart.remove(); } catch (e) { logger.warn("Chart: Minor error removing old chart instance:", e); }
    }
    setChart(null);

    // Validate DOM element
    if (!chartContainerEl) {
        logger.error("Chart Error: chartContainerEl is not found in the DOM.");
        return;
    }
    
    if (chartContainerEl.clientWidth <= 0 || chartContainerEl.clientHeight <= 0) {
        logger.warn(`Chart Warning: chartContainerEl has non-positive dimensions (${chartContainerEl.clientWidth}x${chartContainerEl.clientHeight}). Retrying in 1 second...`);
        setTimeout(() => initChart(), 1000);
        return;
    }

    // Validate LightweightCharts library
    if (typeof LightweightCharts === 'undefined') {
        logger.error("Chart Error: LightweightCharts library is not loaded. Retrying in 2 seconds...");
        setTimeout(() => initChart(), 2000);
        return;
    }

    if (typeof LightweightCharts.createChart !== 'function') {
        logger.error("Chart Error: LightweightCharts.createChart is not a function.");
        return;
    }

    try {
        // Enhanced chart configuration
        const chartOptions = {
            width: chartContainerEl.clientWidth,
            height: chartContainerEl.clientHeight,
            layout: { 
                background: { type: 'solid', color: '#0a0a0a' }, 
                textColor: '#e0e0e0' 
            },
            grid: { 
                vertLines: { color: '#1a1a1a', style: 1 }, 
                horzLines: { color: '#1a1a1a', style: 1 } 
            },
            timeScale: { 
                timeVisible: true, 
                secondsVisible: false, 
                borderColor: '#333',
                rightOffset: 20,
                barSpacing: 8,
                minBarSpacing: 4
            },
            crosshair: { 
                mode: 1, // Normal mode
                vertLine: {
                    color: '#758696',
                    width: 1,
                    style: 3 // Dashed
                },
                horzLine: {
                    color: '#758696',
                    width: 1,
                    style: 3 // Dashed
                }
            },
            rightPriceScale: {
                borderColor: '#333',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.2,
                },
            },
            leftPriceScale: {
                visible: true,
                borderColor: '#333',
                scaleMargins: {
                    top: 0.6,
                    bottom: 0.05,
                },
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        };

        logger.log("Chart: Creating enhanced LightweightCharts instance...");
        
        // Check if LightweightCharts is available
        if (typeof (window as any).LightweightCharts === 'undefined') {
            logger.error("Chart Error: LightweightCharts library not loaded. Retrying in 2 seconds...");
            setTimeout(() => initChart(), 2000);
            return;
        }
        
        const newChart = (window as any).LightweightCharts.createChart(chartContainerEl, chartOptions);
        
        // Validate chart creation
        if (!newChart) {
            logger.error("Chart Error: LightweightCharts.createChart returned null/undefined.");
            return;
        }

        if (typeof newChart.addCandlestickSeries !== 'function') {
            logger.error("Chart Error: Created chart object does not have addCandlestickSeries method.");
            logger.error("Chart Debug: Available methods:", Object.getOwnPropertyNames(newChart));
            if (typeof newChart.remove === 'function') {
                try { newChart.remove(); } catch (e) { logger.warn("Chart: Error cleaning up invalid chart:", e); }
            }
            return;
        }

        setChart(newChart);
        logger.log("Chart: Successfully created enhanced chart instance.");

        // Create enhanced candlestick series
        const seriesOptions = {
            upColor: '#00ff88', 
            downColor: '#ff4444', 
            borderDownColor: '#ff4444',
            borderUpColor: '#00ff88', 
            wickDownColor: '#ff4444', 
            wickUpColor: '#00ff88',
            borderVisible: true,
            wickVisible: true,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        };

        logger.log("Chart: Adding enhanced candlestick series...");
        const newSeries = newChart.addCandlestickSeries(seriesOptions);

        // Validate series creation
        if (!newSeries) {
            logger.error("Chart Error: addCandlestickSeries returned null/undefined.");
            if (typeof newChart.remove === 'function') {
                try { newChart.remove(); } catch (e) { logger.warn("Chart: Error cleaning up chart after series failure:", e); }
            }
            setChart(null);
            return;
        }

        if (typeof newSeries.setData !== 'function' || typeof newSeries.update !== 'function') {
            logger.error("Chart Error: Created series does not have required methods (setData/update).");
            if (typeof newChart.remove === 'function') {
                try { newChart.remove(); } catch (e) { logger.warn("Chart: Error cleaning up chart after series validation failure:", e); }
            }
            setChart(null);
            return;
        }

        setKlineSeries(newSeries);
        
        // Add volume series by default
        addVolumeIndicator();
        
        // Initialize chart controls
        initChartControls();
        
        logger.log("Chart: Successfully initialized enhanced chart and klineSeries.");
        
    } catch (e) {
        logger.error("Chart: Exception during chart/series initialization:", e);
        if (chart && typeof chart.remove === 'function') {
            try { chart.remove(); } catch (cleanupError) { 
                logger.warn("Chart: Error during cleanup after exception:", cleanupError); 
            }
        }
        setChart(null);
        setKlineSeries(null);
        
        // Retry after a delay if this was a temporary issue
        logger.log("Chart: Retrying initialization in 3 seconds...");
        setTimeout(() => initChart(), 3000);
    }
}

export function initChartControls() {
    // Add chart control panel if it doesn't exist
    let controlPanel = document.getElementById('chart-controls');
    if (!controlPanel && chartContainerEl) {
        controlPanel = document.createElement('div');
        controlPanel.id = 'chart-controls';
        controlPanel.className = 'chart-controls-panel';
        controlPanel.innerHTML = `
            <div class="chart-controls-section">
                <h4>📊 Chart Mode</h4>
                <button class="chart-mode-btn active" data-mode="single">Single Asset</button>
                <button class="chart-mode-btn" data-mode="comparison">Multi-Exchange</button>
                <button class="chart-mode-btn" data-mode="depth">Order Book Depth</button>
            </div>
            
            <div class="chart-controls-section">
                <h4>📈 Technical Indicators</h4>
                <label><input type="checkbox" data-indicator="volume" checked> Volume</label>
                <label><input type="checkbox" data-indicator="sma20"> SMA 20</label>
                <label><input type="checkbox" data-indicator="ema50"> EMA 50</label>
                <label><input type="checkbox" data-indicator="bollinger"> Bollinger Bands</label>
                <label><input type="checkbox" data-indicator="rsi"> RSI</label>
                <label><input type="checkbox" data-indicator="macd"> MACD</label>
            </div>
            
            <div class="chart-controls-section">
                <h4>🎨 Chart Style</h4>
                <select id="chart-theme">
                    <option value="dark">Dark Theme</option>
                    <option value="light">Light Theme</option>
                    <option value="crypto">Crypto Theme</option>
                </select>
                <label><input type="checkbox" id="show-crosshair" checked> Crosshair</label>
                <label><input type="checkbox" id="show-grid" checked> Grid</label>
            </div>
            
            <div class="chart-controls-section">
                <h4>🔄 Real-time Data</h4>
                <label><input type="checkbox" id="auto-scale" checked> Auto Scale</label>
                <label><input type="checkbox" id="real-time-updates" checked> Live Updates</label>
                <button id="reset-zoom">Reset Zoom</button>
            </div>
        `;
        
        chartContainerEl.parentElement?.insertBefore(controlPanel, chartContainerEl);
        
        // Add event listeners for controls
        bindChartControls();
    }
}

export function bindChartControls() {
    // Chart mode buttons
    document.querySelectorAll('.chart-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = (e.target as HTMLElement).dataset.mode as 'single' | 'comparison' | 'depth';
            switchChartMode(mode);
            
            // Update active state
            document.querySelectorAll('.chart-mode-btn').forEach(b => b.classList.remove('active'));
            (e.target as HTMLElement).classList.add('active');
        });
    });
    
    // Indicator checkboxes
    document.querySelectorAll('[data-indicator]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const indicator = (e.target as HTMLInputElement).dataset.indicator!;
            const enabled = (e.target as HTMLInputElement).checked;
            
            if (enabled) {
                addIndicator(indicator);
            } else {
                removeIndicator(indicator);
            }
        });
    });
    
    // Theme selector
    const themeSelect = document.getElementById('chart-theme') as HTMLSelectElement;
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const theme = (e.target as HTMLSelectElement).value;
            applyChartTheme(theme);
        });
    }
    
    // Reset zoom button
    const resetZoomBtn = document.getElementById('reset-zoom');
    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', () => {
            if (chart && chart.timeScale) {
                chart.timeScale().fitContent();
            }
        });
    }
}

export function switchChartMode(mode: 'single' | 'comparison' | 'depth') {
    chartMode = mode;
    logger.log(`Chart: Switching to ${mode} mode`);
    
    switch (mode) {
        case 'single':
            // Standard single asset chart
            clearComparisonSeries();
            clearDepthVisualization();
            break;
            
        case 'comparison':
            // Multi-exchange price comparison
            initMultiExchangeComparison();
            break;
            
        case 'depth':
            // Order book depth visualization
            initOrderBookDepthVisualization();
            break;
    }
}

export function addIndicator(indicator: string) {
    if (!chart || !klineSeries) {
        logger.warn(`Chart: Cannot add indicator ${indicator} - chart not ready`);
        return;
    }
    
    currentIndicators.add(indicator);
    logger.log(`Chart: Adding ${indicator} indicator`);
    
    switch (indicator) {
        case 'volume':
            addVolumeIndicator();
            break;
        case 'sma20':
            addMovingAverage(20, 'SMA');
            break;
        case 'ema50':
            addMovingAverage(50, 'EMA');
            break;
        case 'bollinger':
            addBollingerBands();
            break;
        case 'rsi':
            addRSIIndicator();
            break;
        case 'macd':
            addMACDIndicator();
            break;
    }
}

export function removeIndicator(indicator: string) {
    currentIndicators.delete(indicator);
    logger.log(`Chart: Removing ${indicator} indicator`);
    
    // Remove the corresponding series
    // Implementation depends on how we track individual indicator series
}

export function addVolumeIndicator() {
    if (!chart || volumeSeries) return;
    
    volumeSeries = chart.addHistogramSeries({
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
    
    logger.log("Chart: Volume indicator added");
}

export function addMovingAverage(period: number, type: 'SMA' | 'EMA') {
    if (!chart) return;
    
    const color = type === 'SMA' ? '#ff6b6b' : '#4ecdc4';
    
    maSeries = chart.addLineSeries({
        color: color,
        lineWidth: 2,
        title: `${type}${period}`,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
    });
    
    logger.log(`Chart: ${type}${period} indicator added`);
}

export function addBollingerBands() {
    if (!chart) return;
    
    // Add three lines for Bollinger Bands
    const upperBand = chart.addLineSeries({
        color: '#2196F3',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'BB Upper',
        priceLineVisible: false,
    });
    
    const middleBand = chart.addLineSeries({
        color: '#FF9800',
        lineWidth: 1,
        title: 'BB Middle',
        priceLineVisible: false,
    });
    
    const lowerBand = chart.addLineSeries({
        color: '#2196F3',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'BB Lower',
        priceLineVisible: false,
    });
    
    bollBandsSeries = { upper: upperBand, middle: middleBand, lower: lowerBand };
    
    logger.log("Chart: Bollinger Bands indicator added");
}

export function addRSIIndicator() {
    if (!chart) return;
    
    rsiSeries = chart.addLineSeries({
        color: '#9c27b0',
        lineWidth: 2,
        title: 'RSI',
        priceScaleId: 'rsi',
        priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
        },
        scaleMargins: {
            top: 0.1,
            bottom: 0.1,
        },
    });
    
    // Add RSI levels (30, 50, 70)
    chart.addPriceLine({
        price: 70,
        color: '#ef5350',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Overbought',
        priceScaleId: 'rsi',
    });
    
    chart.addPriceLine({
        price: 30,
        color: '#66bb6a',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Oversold',
        priceScaleId: 'rsi',
    });
    
    logger.log("Chart: RSI indicator added");
}

export function addMACDIndicator() {
    if (!chart) return;
    
    // MACD line
    const macdLine = chart.addLineSeries({
        color: '#2196F3',
        lineWidth: 2,
        title: 'MACD',
        priceScaleId: 'macd',
    });
    
    // Signal line
    const signalLine = chart.addLineSeries({
        color: '#FF9800',
        lineWidth: 2,
        title: 'Signal',
        priceScaleId: 'macd',
    });
    
    // Histogram
    const histogram = chart.addHistogramSeries({
        color: '#4CAF50',
        title: 'Histogram',
        priceScaleId: 'macd',
    });
    
    macdSeries = { macd: macdLine, signal: signalLine, histogram };
    
    logger.log("Chart: MACD indicator added");
}

export function applyChartTheme(theme: string) {
    if (!chart) return;
    
    let themeOptions;
    
    switch (theme) {
        case 'light':
            themeOptions = {
                layout: {
                    background: { type: 'solid', color: '#ffffff' },
                    textColor: '#333333',
                },
                grid: {
                    vertLines: { color: '#e0e0e0' },
                    horzLines: { color: '#e0e0e0' },
                },
            };
            break;
            
        case 'crypto':
            themeOptions = {
                layout: {
                    background: { type: 'gradient', topColor: '#1a1a2e', bottomColor: '#16213e' },
                    textColor: '#00ff88',
                },
                grid: {
                    vertLines: { color: '#0f3460' },
                    horzLines: { color: '#0f3460' },
                },
            };
            break;
            
        default: // dark
            themeOptions = {
                layout: {
                    background: { type: 'solid', color: '#0a0a0a' },
                    textColor: '#e0e0e0',
                },
                grid: {
                    vertLines: { color: '#1a1a1a' },
                    horzLines: { color: '#1a1a1a' },
                },
            };
    }
    
    chart.applyOptions(themeOptions);
    logger.log(`Chart: Applied ${theme} theme`);
}

export function initMultiExchangeComparison() {
    logger.log("Chart: Initializing multi-exchange comparison mode");
    
    // This would connect to multiple exchange feeds and overlay prices
    // For now, we'll simulate this with different colored lines
    
    const exchanges = ['binance', 'bybit', 'okx'];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
    
    exchanges.forEach((exchange, index) => {
        if (!exchangeComparisonSeries.has(exchange)) {
            const series = chart?.addLineSeries({
                color: colors[index],
                lineWidth: 2,
                title: exchange.toUpperCase(),
                priceLineVisible: false,
                lastValueVisible: true,
                crosshairMarkerVisible: true,
            });
            
            if (series) {
                exchangeComparisonSeries.set(exchange, series);
            }
        }
    });
}

export function clearComparisonSeries() {
    exchangeComparisonSeries.forEach((series, exchange) => {
        if (chart && series) {
            chart.removeSeries(series);
        }
    });
    exchangeComparisonSeries.clear();
}

export function initOrderBookDepthVisualization() {
    logger.log("Chart: Initializing order book depth visualization");
    
    if (!chart) return;
    
    // Add area series for bids and asks
    const bidsSeries = chart.addAreaSeries({
        topColor: 'rgba(76, 175, 80, 0.4)',
        bottomColor: 'rgba(76, 175, 80, 0.0)',
        lineColor: 'rgba(76, 175, 80, 1)',
        lineWidth: 2,
        title: 'Bids',
        priceScaleId: 'depth',
    });
    
    const asksSeries = chart.addAreaSeries({
        topColor: 'rgba(244, 67, 54, 0.4)',
        bottomColor: 'rgba(244, 67, 54, 0.0)',
        lineColor: 'rgba(244, 67, 54, 1)',
        lineWidth: 2,
        title: 'Asks',
        priceScaleId: 'depth',
    });
    
    orderBookDepthSeries = { bids: bidsSeries, asks: asksSeries };
    
    // Start depth WebSocket connection
    connectToDepthFeed();
}

export function connectToDepthFeed() {
    if (depthWebSocket) {
        depthWebSocket.close();
    }
    
    const wsUrl = `wss://stream.binance.com:9443/ws/${selectedAsset.toLowerCase()}@depth20@100ms`;
    depthWebSocket = new WebSocket(wsUrl);
    
    depthWebSocket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.bids && data.asks && orderBookDepthSeries) {
                updateDepthVisualization(data.bids, data.asks);
            }
        } catch (e) {
            logger.error("Chart: Error parsing depth data:", e);
        }
    };
}

export function updateDepthVisualization(bids: string[][], asks: string[][]) {
    if (!orderBookDepthSeries) return;
    
    // Convert order book data to cumulative depth
    const bidDepth = [];
    const askDepth = [];
    let cumBidVolume = 0;
    let cumAskVolume = 0;
    
    // Process bids (highest to lowest price)
    for (const [price, volume] of bids) {
        cumBidVolume += parseFloat(volume);
        bidDepth.push({
            time: parseFloat(price),
            value: cumBidVolume
        });
    }
    
    // Process asks (lowest to highest price)
    for (const [price, volume] of asks) {
        cumAskVolume += parseFloat(volume);
        askDepth.push({
            time: parseFloat(price),
            value: cumAskVolume
        });
    }
    
    orderBookDepthSeries.bids.setData(bidDepth);
    orderBookDepthSeries.asks.setData(askDepth);
}

export function clearDepthVisualization() {
    if (orderBookDepthSeries && chart) {
        chart.removeSeries(orderBookDepthSeries.bids);
        chart.removeSeries(orderBookDepthSeries.asks);
        orderBookDepthSeries = null;
    }
    
    if (depthWebSocket) {
        depthWebSocket.close();
        depthWebSocket = null;
    }
}

export async function updateChartForAssetAndInterval(asset: string, interval: string) {
    if (!chart || !klineSeries) {
        logger.log(`Chart: Chart or klineSeries not ready for ${asset}(${interval}). Attempting initChart.`);
        initChart();
    }
    if (!klineSeries) {
        logger.warn(`Chart: KlineSeries not available for ${asset} (${interval}) after init attempt.`);
        return;
    }

    setCurrentChartInterval(interval);
    document.querySelectorAll('#chart-timeframe-selector button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-interval') === interval);
    });

    try {
        klineSeries.setData([]);
    } catch (e) {
        logger.error("Chart: Error clearing klineSeries data:", e, "Attempting to re-initialize chart.");
        initChart();
        if(!klineSeries) {
            logger.error("Chart: Failed to re-initialize chart after series error. Cannot update.");
            return;
        }
    }

    const historicalData = await fetchBinanceHistoricalKlines(asset, interval);
    logger.log(`Chart: Historical data length for ${asset} (${interval}): ${historicalData.length}.`);

    if (historicalData.length > 0) {
        try {
            klineSeries.setData(historicalData);
            
            // Update indicators with new data
            updateIndicators(historicalData);
            
            if (chart && typeof chart.timeScale === 'function' && typeof chart.timeScale().fitContent === 'function') {
                 chart.timeScale().fitContent();
            }
        } catch (e) {
            logger.error("Chart: Error setting historical data on klineSeries:", e, "Attempting to re-initialize chart.");
             initChart();
        }
    } else {
        logger.warn(`No historical kline data for ${asset} (${interval})`);
    }
    subscribeToBinanceKlineUpdates(asset, interval);
}

export function updateIndicators(data: KLineData[]) {
    if (!data.length) return;
    
    // Update volume
    if (volumeSeries && currentIndicators.has('volume')) {
        const volumeData = data.map(d => {
            const volume = (d as any).volume;
            // ONLY use real volume data - NO simulation/fallback
            if (volume != null && !isNaN(volume) && volume > 0) {
                return {
                    time: d.time,
                    value: volume,
                    color: d.close > d.open ? '#26a69a' : '#ef5350'
                };
            }
            return null; // Return null for missing data instead of fake data
        }).filter(d => d != null && d.time != null && d.value != null && !isNaN(d.value) && d.value > 0);
        
        if (volumeData.length > 0) {
            volumeSeries.setData(volumeData);
        }
    }
    
    // Update moving averages
    if (maSeries && (currentIndicators.has('sma20') || currentIndicators.has('ema50'))) {
        let maData;
        if (currentIndicators.has('sma20')) {
            const sma = calculateSMA(data, 20);
            maData = data.map((d, i) => ({ time: d.time, value: sma[i] }))
                .filter(d => d.time != null && d.value != null && !isNaN(d.value) && isFinite(d.value));
        } else if (currentIndicators.has('ema50')) {
            const ema = calculateEMA(data, 50);
            maData = data.map((d, i) => ({ time: d.time, value: ema[i] }))
                .filter(d => d.time != null && d.value != null && !isNaN(d.value) && isFinite(d.value));
        }
        if (maData && maData.length > 0) {
            maSeries.setData(maData);
        }
    }
    
    // Update Bollinger Bands
    if (bollBandsSeries && currentIndicators.has('bollinger')) {
        const bb = calculateBollingerBands(data);
        const upperData = data.map((d, i) => ({ time: d.time, value: bb.upper[i] }))
            .filter(d => d.time != null && d.value != null && !isNaN(d.value) && isFinite(d.value));
        const middleData = data.map((d, i) => ({ time: d.time, value: bb.middle[i] }))
            .filter(d => d.time != null && d.value != null && !isNaN(d.value) && isFinite(d.value));
        const lowerData = data.map((d, i) => ({ time: d.time, value: bb.lower[i] }))
            .filter(d => d.time != null && d.value != null && !isNaN(d.value) && isFinite(d.value));
        
        if (upperData.length > 0) bollBandsSeries.upper.setData(upperData);
        if (middleData.length > 0) bollBandsSeries.middle.setData(middleData);
        if (lowerData.length > 0) bollBandsSeries.lower.setData(lowerData);
    }
    
    // Update RSI
    if (rsiSeries && currentIndicators.has('rsi')) {
        const rsi = calculateRSI(data);
        const rsiData = data.map((d, i) => ({ time: d.time, value: rsi[i] }))
            .filter(d => d.time != null && d.value != null && !isNaN(d.value) && isFinite(d.value));
        if (rsiData.length > 0) {
            rsiSeries.setData(rsiData);
        }
    }
    
    // Update MACD
    if (macdSeries && currentIndicators.has('macd')) {
        const macd = calculateMACD(data);
        const macdData = data.map((d, i) => ({ time: d.time, value: macd.macd[i] }))
            .filter(d => d.time != null && d.value != null && !isNaN(d.value) && isFinite(d.value));
        const signalData = data.map((d, i) => ({ time: d.time, value: macd.signal[i] }))
            .filter(d => d.time != null && d.value != null && !isNaN(d.value) && isFinite(d.value));
        const histogramData = data.map((d, i) => ({ time: d.time, value: macd.histogram[i] }))
            .filter(d => d.time != null && d.value != null && !isNaN(d.value) && isFinite(d.value));
        
        if (macdData.length > 0) macdSeries.macd.setData(macdData);
        if (signalData.length > 0) macdSeries.signal.setData(signalData);
        if (histogramData.length > 0) macdSeries.histogram.setData(histogramData);
    }
}

export function subscribeToBinanceKlineUpdates(asset: string, interval: string) {
    if (klineWebSocket && klineWebSocket.readyState === WebSocket.OPEN) {
        try { klineWebSocket.close(); } catch (e) { logger.warn("Chart: Error closing old kline WebSocket:", e); }
    }
    setKlineWebSocket(null);

    const wsUrl = `wss://stream.binance.com:9443/ws/${asset.toLowerCase()}@kline_${interval}`;
    logger.log(`Chart: Connecting to enhanced Binance kline WebSocket: ${wsUrl}`);

    try {
        const ws = new WebSocket(wsUrl);
        setKlineWebSocket(ws);

        ws.onopen = () => {
            logger.log(`Chart: Enhanced Binance kline WebSocket connected for ${asset} (${interval})`);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.k && data.k.x) {
                    const time = Math.floor(data.k.t / 1000);
                    const open = parseFloat(data.k.o);
                    const high = parseFloat(data.k.h);
                    const low = parseFloat(data.k.l);
                    const close = parseFloat(data.k.c);
                    
                    // Validate all kline data before creating update
                    if (time > 0 && 
                        !isNaN(open) && isFinite(open) && open > 0 &&
                        !isNaN(high) && isFinite(high) && high > 0 &&
                        !isNaN(low) && isFinite(low) && low > 0 &&
                        !isNaN(close) && isFinite(close) && close > 0 &&
                        high >= low && 
                        high >= Math.max(open, close) && 
                        low <= Math.min(open, close)) {
                        
                        const klineData: KLineData = {
                            time,
                            open,
                            high,
                            low,
                            close,
                        };

                        if (klineSeries && typeof klineSeries.update === 'function') {
                            klineSeries.update(klineData);
                        }
                        
                        // Update volume in real-time
                        if (volumeSeries && data.k.v) {
                            const volume = parseFloat(data.k.v);
                            if (!isNaN(volume) && isFinite(volume) && volume >= 0) {
                                const volumeUpdate = {
                                    time,
                                    value: volume,
                                    color: close > open ? '#26a69a' : '#ef5350'
                                };
                                volumeSeries.update(volumeUpdate);
                            }
                        }
                    } else {
                        logger.warn("Chart: Invalid kline data received, skipping update:", {
                            time, open, high, low, close
                        });
                    }
                }
            } catch (e) {
                logger.error("Chart: Error parsing enhanced kline WebSocket message:", e);
            }
        };

        ws.onerror = (error) => {
            logger.error("Chart: Enhanced Binance kline WebSocket error:", error);
        };

        ws.onclose = (event) => {
            logger.log(`Chart: Enhanced Binance kline WebSocket closed for ${asset} (${interval}). Code: ${event.code}, Reason: ${event.reason}`);
        };
    } catch (e) {
        logger.error("Chart: Error creating enhanced Binance kline WebSocket:", e);
    }
}

export function handleChartResize() {
    if (chart && chartContainerEl && typeof chart.resize === 'function') {
        if (chartContainerEl.clientWidth > 0 && chartContainerEl.clientHeight > 0) {
            chart.resize(chartContainerEl.clientWidth, chartContainerEl.clientHeight);
        } else {
            logger.warn("Chart: Resize skipped, container has zero/negative dimensions.");
        }
    } else if (!chart && chartContainerEl && chartContainerEl.clientWidth > 0 && chartContainerEl.clientHeight > 0) {
        logger.log("Chart: Attempting to initialize chart on resize (was not initialized but now has dimensions).");
        initChart();
        if (klineSeries) {
            updateChartForAssetAndInterval(selectedAsset, currentChartInterval);
        }
    }
}

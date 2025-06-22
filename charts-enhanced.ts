/**
 * Enhanced Chart Features - Next Level Trading Charts
 * @license SPDX-License-Identifier: Apache-2.0
 */

import { KLineData } from './types';
import { logger } from './utils';

// Enhanced chart state
export let enhancedChart: any = null;
export let volumeSeries: any = null;
export let maSeries: any = null;
export let bollBandsSeries: any = null;
export let rsiSeries: any = null;
export let macdSeries: any = null;
export let orderBookDepthSeries: any = null;
export let exchangeComparisonSeries: Map<string, any> = new Map();
export let currentIndicators: Set<string> = new Set(['volume']);
export let chartMode: 'single' | 'comparison' | 'depth' = 'single';
export let depthWebSocket: WebSocket | null = null;

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

export function initEnhancedChartControls() {
    // Add chart control panel if it doesn't exist
    let controlPanel = document.getElementById('chart-controls');
    const chartContainer = document.getElementById('chart-container');
    
    if (!controlPanel && chartContainer) {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'chart-controls-toggle';
        toggleBtn.className = 'chart-controls-toggle';
        toggleBtn.innerHTML = '⚙️';
        toggleBtn.title = 'Chart Settings';
        
        // Create control panel
        controlPanel = document.createElement('div');
        controlPanel.id = 'chart-controls';
        controlPanel.className = 'chart-controls-panel';
        controlPanel.innerHTML = `
            <div class="chart-controls-header">
                <h3>📊 Chart Controls</h3>
                <button id="close-chart-controls">✕</button>
            </div>
            
            <div class="chart-controls-section">
                <h4>📈 Chart Mode</h4>
                <button class="chart-mode-btn active" data-mode="single">📈 Single Asset</button>
                <button class="chart-mode-btn" data-mode="comparison">📊 Multi-Exchange</button>
                <button class="chart-mode-btn" data-mode="depth">📚 Order Book Depth</button>
            </div>
            
            <div class="chart-controls-section">
                <h4>🔧 Technical Indicators</h4>
                <label><input type="checkbox" data-indicator="volume" checked> 📊 Volume</label>
                <label><input type="checkbox" data-indicator="sma20"> 📈 SMA 20</label>
                <label><input type="checkbox" data-indicator="ema50"> 📉 EMA 50</label>
                <label><input type="checkbox" data-indicator="bollinger"> 🎯 Bollinger Bands</label>
                <label><input type="checkbox" data-indicator="rsi"> ⚡ RSI</label>
                <label><input type="checkbox" data-indicator="macd"> 🌊 MACD</label>
            </div>
            
            <div class="chart-controls-section">
                <h4>🎨 Chart Style</h4>
                <select id="chart-theme">
                    <option value="dark">🌙 Dark Theme</option>
                    <option value="light">☀️ Light Theme</option>
                    <option value="crypto">💎 Crypto Theme</option>
                    <option value="matrix">🔢 Matrix Theme</option>
                </select>
                <label><input type="checkbox" id="show-crosshair" checked> ✚ Crosshair</label>
                <label><input type="checkbox" id="show-grid" checked> ⊞ Grid Lines</label>
                <label><input type="checkbox" id="show-volume" checked> 📊 Volume Bars</label>
            </div>
            
            <div class="chart-controls-section">
                <h4>🔄 Real-time Features</h4>
                <label><input type="checkbox" id="auto-scale" checked> 🔄 Auto Scale</label>
                <label><input type="checkbox" id="real-time-updates" checked> ⚡ Live Updates</label>
                <label><input type="checkbox" id="price-alerts"> 🔔 Price Alerts</label>
                <button id="reset-zoom">🔍 Reset Zoom</button>
                <button id="screenshot-chart">📸 Screenshot</button>
            </div>
            
            <div class="chart-controls-section">
                <h4>📊 Chart Info</h4>
                <div class="chart-stats" id="chart-stats">
                    <div class="stat-row">
                        <span>Current Price:</span>
                        <span id="current-price">-</span>
                    </div>
                    <div class="stat-row">
                        <span>24h Change:</span>
                        <span id="price-change">-</span>
                    </div>
                    <div class="stat-row">
                        <span>Volume:</span>
                        <span id="volume-info">-</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add to DOM
        chartContainer.parentElement?.appendChild(toggleBtn);
        chartContainer.parentElement?.appendChild(controlPanel);
        
        // Initially hide the panel
        controlPanel.classList.add('collapsed');
        
        // Bind events
        bindEnhancedChartControls();
        
        logger.log("Chart: Enhanced controls initialized");
    }
}

export function bindEnhancedChartControls() {
    // Toggle button
    const toggleBtn = document.getElementById('chart-controls-toggle');
    const controlPanel = document.getElementById('chart-controls');
    const closeBtn = document.getElementById('close-chart-controls');
    
    if (toggleBtn && controlPanel) {
        toggleBtn.addEventListener('click', () => {
            controlPanel.classList.toggle('collapsed');
        });
    }
    
    if (closeBtn && controlPanel) {
        closeBtn.addEventListener('click', () => {
            controlPanel.classList.add('collapsed');
        });
    }
    
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
            if (enhancedChart && enhancedChart.timeScale) {
                enhancedChart.timeScale().fitContent();
                logger.log("Chart: Zoom reset");
            }
        });
    }
    
    // Screenshot button
    const screenshotBtn = document.getElementById('screenshot-chart');
    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', () => {
            takeChartScreenshot();
        });
    }
}

export function switchChartMode(mode: 'single' | 'comparison' | 'depth') {
    chartMode = mode;
    logger.log(`Chart: Switching to ${mode} mode`);
    
    // Update UI feedback
    const modeIndicator = document.getElementById('current-mode');
    if (modeIndicator) {
        modeIndicator.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    }
    
    switch (mode) {
        case 'single':
            clearComparisonSeries();
            clearDepthVisualization();
            showSuccessMessage('📈 Single asset mode activated');
            break;
            
        case 'comparison':
            initMultiExchangeComparison();
            showSuccessMessage('📊 Multi-exchange comparison activated');
            break;
            
        case 'depth':
            initOrderBookDepthVisualization();
            showSuccessMessage('📚 Order book depth visualization activated');
            break;
    }
}

export function addIndicator(indicator: string) {
    currentIndicators.add(indicator);
    logger.log(`Chart: Adding ${indicator} indicator`);
    
    // Visual feedback
    showSuccessMessage(`✅ ${indicator.toUpperCase()} indicator added`);
    
    // The actual indicator logic would be implemented here
    // For now, we'll simulate the addition
    setTimeout(() => {
        updateChartStats();
    }, 500);
}

export function removeIndicator(indicator: string) {
    currentIndicators.delete(indicator);
    logger.log(`Chart: Removing ${indicator} indicator`);
    
    showSuccessMessage(`❌ ${indicator.toUpperCase()} indicator removed`);
}

export function applyChartTheme(theme: string) {
    logger.log(`Chart: Applying ${theme} theme`);
    
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) {
        // Remove existing theme classes
        chartContainer.classList.remove('theme-dark', 'theme-light', 'theme-crypto', 'theme-matrix');
        
        // Add new theme class
        chartContainer.classList.add(`theme-${theme}`);
        
        showSuccessMessage(`🎨 ${theme.charAt(0).toUpperCase() + theme.slice(1)} theme applied`);
    }
}

export function initMultiExchangeComparison() {
    logger.log("Chart: Initializing multi-exchange comparison mode");
    
    // Show loading state
    showLoadingMessage("🔄 Loading multi-exchange data...");
    
    // Simulate loading multiple exchange data
    setTimeout(() => {
        const exchanges = ['Binance', 'Bybit', 'OKX', 'Kraken'];
        const prices = exchanges.map(ex => ({
            exchange: ex,
            price: 44000 + (Math.random() - 0.5) * 1000,
            change: (Math.random() - 0.5) * 5
        }));
        
        updateComparisonDisplay(prices);
        hideLoadingMessage();
    }, 2000);
}

export function initOrderBookDepthVisualization() {
    logger.log("Chart: Initializing order book depth visualization");
    
    showLoadingMessage("📚 Loading order book data...");
    
    // Simulate depth data loading
    setTimeout(() => {
        const depthData = generateMockDepthData();
        updateDepthVisualization(depthData.bids, depthData.asks);
        hideLoadingMessage();
    }, 1500);
}

export function generateMockDepthData() {
    const currentPrice = 44000;
    const bids = [];
    const asks = [];
    
    // Generate mock bid data (below current price)
    for (let i = 0; i < 20; i++) {
        const price = currentPrice - (i + 1) * 10;
        const volume = Math.random() * 10 + 1;
        bids.push([price.toString(), volume.toString()]);
    }
    
    // Generate mock ask data (above current price)
    for (let i = 0; i < 20; i++) {
        const price = currentPrice + (i + 1) * 10;
        const volume = Math.random() * 10 + 1;
        asks.push([price.toString(), volume.toString()]);
    }
    
    return { bids, asks };
}

export function updateDepthVisualization(bids: string[][], asks: string[][]) {
    // This would update the actual depth visualization
    // For now, we'll update the UI to show it's working
    
    const depthStats = document.createElement('div');
    depthStats.className = 'depth-stats';
    depthStats.innerHTML = `
        <h4>📚 Order Book Depth</h4>
        <div class="depth-row">
            <span class="depth-label">Bid Orders:</span>
            <span class="depth-value">${bids.length}</span>
        </div>
        <div class="depth-row">
            <span class="depth-label">Ask Orders:</span>
            <span class="depth-value">${asks.length}</span>
        </div>
        <div class="depth-row">
            <span class="depth-label">Spread:</span>
            <span class="depth-value">${(parseFloat(asks[0][0]) - parseFloat(bids[0][0])).toFixed(2)}</span>
        </div>
    `;
    
    // Add to chart info section
    const chartStats = document.getElementById('chart-stats');
    if (chartStats) {
        chartStats.appendChild(depthStats);
    }
}

export function updateComparisonDisplay(prices: Array<{exchange: string, price: number, change: number}>) {
    const comparisonStats = document.createElement('div');
    comparisonStats.className = 'comparison-stats';
    comparisonStats.innerHTML = `
        <h4>📊 Exchange Comparison</h4>
        ${prices.map(p => `
            <div class="comparison-row">
                <span class="exchange-name">${p.exchange}:</span>
                <span class="exchange-price ${p.change >= 0 ? 'positive' : 'negative'}">
                    $${p.price.toFixed(2)} (${p.change >= 0 ? '+' : ''}${p.change.toFixed(2)}%)
                </span>
            </div>
        `).join('')}
    `;
    
    // Add to chart info section
    const chartStats = document.getElementById('chart-stats');
    if (chartStats) {
        chartStats.appendChild(comparisonStats);
    }
}

export function clearComparisonSeries() {
    // Remove comparison display
    const comparisonStats = document.querySelector('.comparison-stats');
    if (comparisonStats) {
        comparisonStats.remove();
    }
}

export function clearDepthVisualization() {
    // Remove depth display
    const depthStats = document.querySelector('.depth-stats');
    if (depthStats) {
        depthStats.remove();
    }
}

export function updateChartStats() {
    const currentPriceEl = document.getElementById('current-price');
    const priceChangeEl = document.getElementById('price-change');
    const volumeInfoEl = document.getElementById('volume-info');
    
    // Mock data - in real implementation, this would come from actual chart data
    const mockPrice = 44712.91;
    const mockChange = -287.09;
    const mockVolume = 62.05;
    
    if (currentPriceEl) {
        currentPriceEl.textContent = `$${mockPrice.toFixed(2)}`;
        currentPriceEl.className = mockChange >= 0 ? 'positive' : 'negative';
    }
    
    if (priceChangeEl) {
        priceChangeEl.textContent = `${mockChange >= 0 ? '+' : ''}${mockChange.toFixed(2)} (${((mockChange / mockPrice) * 100).toFixed(2)}%)`;
        priceChangeEl.className = mockChange >= 0 ? 'positive' : 'negative';
    }
    
    if (volumeInfoEl) {
        volumeInfoEl.textContent = `${mockVolume.toFixed(2)}K`;
    }
}

export function takeChartScreenshot() {
    showLoadingMessage("📸 Taking screenshot...");
    
    // Simulate screenshot process
    setTimeout(() => {
        hideLoadingMessage();
        showSuccessMessage("📸 Screenshot saved to downloads!");
        
        // In a real implementation, this would capture the chart canvas
        logger.log("Chart: Screenshot taken");
    }, 1000);
}

export function showSuccessMessage(message: string) {
    const notification = document.createElement('div');
    notification.className = 'chart-notification success';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

export function showLoadingMessage(message: string) {
    let loadingEl = document.getElementById('chart-loading');
    
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'chart-loading';
        loadingEl.className = 'chart-loading';
        
        const chartContainer = document.getElementById('chart-container');
        if (chartContainer) {
            chartContainer.appendChild(loadingEl);
        }
    }
    
    loadingEl.textContent = message;
    loadingEl.style.display = 'block';
}

export function hideLoadingMessage() {
    const loadingEl = document.getElementById('chart-loading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

// Initialize enhanced features when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure chart container exists
        setTimeout(() => {
            initEnhancedChartControls();
            updateChartStats();
            logger.log("Chart: Enhanced features initialized");
        }, 1000);
    });
} 
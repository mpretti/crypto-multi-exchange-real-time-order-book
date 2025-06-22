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

export function initChart() {
    // Clear existing chart data first
    if (klineSeries && typeof klineSeries.setData === 'function') {
        try { klineSeries.setData([]); } catch (e) { logger.warn("Chart: Minor error clearing old klineSeries data:", e); }
    }
    setKlineSeries(null);

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
        // Create chart with safer configuration
        const chartOptions = {
            width: chartContainerEl.clientWidth,
            height: chartContainerEl.clientHeight,
            layout: { 
                background: { type: 'solid', color: '#1e1e1e' }, 
                textColor: '#e0e0e0' 
            },
            grid: { 
                vertLines: { color: '#2a2a2a' }, 
                horzLines: { color: '#2a2a2a' } 
            },
            timeScale: { 
                timeVisible: true, 
                secondsVisible: false, 
                borderColor: '#444' 
            },
            crosshair: { 
                mode: 1 // Normal mode
            },
        };

        logger.log("Chart: Creating LightweightCharts instance...");
        const newChart = LightweightCharts.createChart(chartContainerEl, chartOptions);
        
        // Validate chart creation
        if (!newChart) {
            logger.error("Chart Error: LightweightCharts.createChart returned null/undefined.");
            return;
        }

        if (typeof newChart.addCandlestickSeries !== 'function') {
            logger.error("Chart Error: Created chart object does not have addCandlestickSeries method.");
            if (typeof newChart.remove === 'function') {
                try { newChart.remove(); } catch (e) { logger.warn("Chart: Error cleaning up invalid chart:", e); }
            }
            return;
        }

        setChart(newChart);
        logger.log("Chart: Successfully created chart instance.");

        // Create candlestick series
        const seriesOptions = {
            upColor: '#26de81', 
            downColor: '#ff4757', 
            borderDownColor: '#ff4757',
            borderUpColor: '#26de81', 
            wickDownColor: '#ff4757', 
            wickUpColor: '#26de81',
        };

        logger.log("Chart: Adding candlestick series...");
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
        logger.log("Chart: Successfully initialized chart and klineSeries.");
        
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

export function subscribeToBinanceKlineUpdates(asset: string, interval: string) {
    if (klineWebSocket && klineWebSocket.readyState === WebSocket.OPEN) {
        try { klineWebSocket.close(); } catch (e) { logger.warn("Chart: Error closing old kline WebSocket:", e); }
    }
    setKlineWebSocket(null);

    const wsUrl = `wss://stream.binance.com:9443/ws/${asset.toLowerCase()}@kline_${interval}`;
    logger.log(`Chart: Connecting to Binance kline WebSocket: ${wsUrl}`);

    try {
        const ws = new WebSocket(wsUrl);
        setKlineWebSocket(ws);

        ws.onopen = () => {
            logger.log(`Chart: Binance kline WebSocket connected for ${asset} (${interval})`);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.k && data.k.x) {
                    const klineData: KLineData = {
                        time: Math.floor(data.k.t / 1000),
                        open: parseFloat(data.k.o),
                        high: parseFloat(data.k.h),
                        low: parseFloat(data.k.l),
                        close: parseFloat(data.k.c),
                    };

                    if (klineSeries && typeof klineSeries.update === 'function') {
                        klineSeries.update(klineData);
                    }
                }
            } catch (e) {
                logger.error("Chart: Error parsing kline WebSocket message:", e);
            }
        };

        ws.onerror = (error) => {
            logger.error("Chart: Binance kline WebSocket error:", error);
        };

        ws.onclose = (event) => {
            logger.log(`Chart: Binance kline WebSocket closed for ${asset} (${interval}). Code: ${event.code}, Reason: ${event.reason}`);
        };
    } catch (e) {
        logger.error("Chart: Error creating Binance kline WebSocket:", e);
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

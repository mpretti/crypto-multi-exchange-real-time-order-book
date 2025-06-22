
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

export function initChart() {
    if (klineSeries && typeof klineSeries.setData === 'function') {
        try { klineSeries.setData([]); } catch (e) { console.warn("Chart: Minor error clearing old klineSeries data:", e); }
    }
    setKlineSeries(null);

    if (chart && typeof chart.remove === 'function') {
        try { chart.remove(); } catch (e) { console.warn("Chart: Minor error removing old chart instance:", e); }
    }
    setChart(null);

    if (!chartContainerEl) {
        console.error("Chart Error: chartContainerEl is not found in the DOM.");
        return;
    }
    if (chartContainerEl.clientWidth <= 0 || chartContainerEl.clientHeight <= 0) {
        console.warn(`Chart Warning: chartContainerEl has non-positive dimensions (${chartContainerEl.clientWidth}x${chartContainerEl.clientHeight}). Aborting initChart.`);
        return;
    }
    if (typeof LightweightCharts === 'undefined' || typeof LightweightCharts.createChart !== 'function') {
        console.error("Chart Error: LightweightCharts library is not loaded correctly or createChart is not a function.");
        return;
    }

    try {
        const newChart = LightweightCharts.createChart(chartContainerEl, {
            width: chartContainerEl.clientWidth,
            height: chartContainerEl.clientHeight,
            layout: { background: { type: LightweightCharts.ColorType.Solid, color: '#1e1e1e' }, textColor: '#e0e0e0' },
            grid: { vertLines: { color: '#2a2a2a' }, horzLines: { color: '#2a2a2a' } },
            timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#444' },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        });
        setChart(newChart);

        if (!chart || typeof chart.addCandlestickSeries !== 'function') {
            console.error("Chart Error: LightweightCharts.createChart did not return a fully valid chart object.");
            if (chart && typeof chart.remove === 'function') { try { chart.remove(); } catch (cleanupError) { console.warn("Chart: Error during cleanup of partially formed chart:", cleanupError); } }
            setChart(null);
            return;
        }

        const newSeries = chart.addCandlestickSeries({
            upColor: '#26de81', downColor: '#ff4757', borderDownColor: '#ff4757',
            borderUpColor: '#26de81', wickDownColor: '#ff4757', wickUpColor: '#26de81',
        });
        setKlineSeries(newSeries);

        if (!klineSeries || typeof klineSeries.setData !== 'function' || typeof klineSeries.update !== 'function') {
            console.error("Chart Error: chart.addCandlestickSeries did not return a valid series object.");
            setKlineSeries(null);
            if (chart && typeof chart.remove === 'function') { try { chart.remove(); } catch (cleanupError) { console.warn("Chart: Error during cleanup after failed series creation:", cleanupError); } }
            setChart(null);
            return;
        }
        console.log("Chart: Successfully initialized chart and klineSeries.");
    } catch (e) {
        console.error("Chart Error: Exception during chart/series initialization:", e);
        if (chart && typeof chart.remove === 'function') { try { chart.remove(); } catch (cleanupError) { console.warn("Chart: Error during cleanup after exception:", cleanupError); } }
        setChart(null);
        setKlineSeries(null);
    }
}

export async function updateChartForAssetAndInterval(asset: string, interval: string) {
    if (!chart || !klineSeries) {
        console.log(`Chart: Chart or klineSeries not ready for ${asset}(${interval}). Attempting initChart.`);
        initChart();
    }
    if (!klineSeries) {
        console.warn(`Chart: KlineSeries not available for ${asset} (${interval}) after init attempt.`);
        return;
    }

    setCurrentChartInterval(interval);
    document.querySelectorAll('#chart-timeframe-selector button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-interval') === interval);
    });

    try {
        klineSeries.setData([]);
    } catch (e) {
        console.error("Chart: Error clearing klineSeries data:", e, "Attempting to re-initialize chart.");
        initChart();
        if(!klineSeries) {
            console.error("Chart: Failed to re-initialize chart after series error. Cannot update.");
            return;
        }
    }

    const historicalData = await fetchBinanceHistoricalKlines(asset, interval);
    console.log(`Chart: Historical data length for ${asset} (${interval}): ${historicalData.length}.`);

    if (historicalData.length > 0) {
        try {
            klineSeries.setData(historicalData);
            if (chart && typeof chart.timeScale === 'function' && typeof chart.timeScale().fitContent === 'function') {
                 chart.timeScale().fitContent();
            }
        } catch (e) {
            console.error("Chart: Error setting historical data on klineSeries:", e, "Attempting to re-initialize chart.");
             initChart();
        }
    } else {
        console.warn(`No historical kline data for ${asset} (${interval})`);
    }
    subscribeToBinanceKlineUpdates(asset, interval);
}

export function subscribeToBinanceKlineUpdates(asset: string, interval: string) {
    if (klineWebSocket) {
        klineWebSocket.onmessage = null; klineWebSocket.onopen = null; klineWebSocket.onerror = null; klineWebSocket.onclose = null;
        klineWebSocket.close();
        setKlineWebSocket(null);
    }

    const formattedSymbol = asset.toLowerCase();
    const wsUrl = `wss://fstream.binance.com/ws/${formattedSymbol}@kline_${interval}`;
    console.log(`Chart: Attempting to connect to kline WebSocket: ${wsUrl}`);
    const newKlineWs = new WebSocket(wsUrl);
    setKlineWebSocket(newKlineWs);

    newKlineWs.onopen = () => {
        console.log(`Chart: Subscribed to Binance kline stream for ${asset} (${interval})`);
    };

    newKlineWs.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data as string);
            if (message.e === 'kline') {
                const k = message.k;
                const candleData: KLineData = {
                    time: k.t / 1000,
                    open: parseFloat(k.o),
                    high: parseFloat(k.h),
                    low: parseFloat(k.l),
                    close: parseFloat(k.c),
                    volume: parseFloat(k.v),
                };
                if (klineSeries && typeof klineSeries.update === 'function') {
                     klineSeries.update(candleData);
                } else if (!klineSeries) {
                    console.warn("Chart: klineSeries not available for update. Re-initializing chart.");
                    updateChartForAssetAndInterval(selectedAsset, currentChartInterval);
                }
            }
        } catch (error) {
            console.error('Chart: Error processing kline update:', error, event.data);
        }
    };

    newKlineWs.onerror = (error) => {
        console.error(`Chart: Kline WebSocket error for ${asset} (${interval}):`, error);
    };

    newKlineWs.onclose = () => {
        console.log(`Chart: Kline WebSocket closed for ${asset} (${interval})`);
        // Check if this close was intended or if we should reconnect
        if (klineWebSocket === newKlineWs && !document.hidden && selectedAsset === asset && currentChartInterval === interval) {
            console.log(`Chart: Attempting to reconnect kline WebSocket for ${asset} (${interval}).`);
            setTimeout(() => {
                 if (klineWebSocket === newKlineWs && !document.hidden && selectedAsset === asset && currentChartInterval === interval) {
                    subscribeToBinanceKlineUpdates(asset, interval);
                } else {
                     console.log("Chart: Kline WebSocket reconnection aborted (conditions changed or tab hidden).")
                }
            }, 5000);
        }
    };
}

export function handleChartResize() {
    if (chart && chartContainerEl && typeof chart.resize === 'function') {
        if (chartContainerEl.clientWidth > 0 && chartContainerEl.clientHeight > 0) {
            chart.resize(chartContainerEl.clientWidth, chartContainerEl.clientHeight);
        } else {
            console.warn("Chart: Resize skipped, container has zero/negative dimensions.");
        }
    } else if (!chart && chartContainerEl && chartContainerEl.clientWidth > 0 && chartContainerEl.clientHeight > 0) {
        console.log("Chart: Attempting to initialize chart on resize (was not initialized but now has dimensions).");
        initChart();
        if (klineSeries) {
            updateChartForAssetAndInterval(selectedAsset, currentChartInterval);
        }
    }
}

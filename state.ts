
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExchangeConnectionState } from './types';

// --- Global State ---
export let selectedAsset: string = 'BTCUSDT';
export const activeConnections = new Map<string, ExchangeConnectionState>();
export let maxCumulativeTotal: number = 0;
export let maxIndividualQuantity: number = 0;
export let selectedExchanges: Set<string> = new Set(['binance', 'bybit', 'okx', 'kraken', 'bitget', 'gate', 'binanceus', 'mexc', 'hyperliquid']);
export let isAggregatedView: boolean = false; // Changed to false for individual view default
export let isSidebarOpen: boolean = false;

// New toggle states - Updated defaults
export let isFeeAdjusted: boolean = true; // Changed to true
export let isSmallOrdersFiltered: boolean = true; // Changed to true
export let isTopOfBookView: boolean = true; // Changed to true
export let smallOrderThreshold: number = 10; // New configurable threshold in USD
export let isPerformanceMonitorVisible: boolean = false; // New - default to hidden
export let isMarketIntelligenceVisible: boolean = false; // New - default to hidden

// Chart State
export let chart: any = null; // LightweightCharts instance
export let klineSeries: any = null; // Candlestick series instance
export let currentChartInterval: string = '5m';
export let klineWebSocket: WebSocket | null = null;

// Functions to modify state (example, can be expanded)
export function setSelectedAsset(asset: string) {
    selectedAsset = asset;
}
export function setAggregatedView(isAggregated: boolean) {
    isAggregatedView = isAggregated;
}
export function setSidebarOpen(isOpen: boolean) {
    isSidebarOpen = isOpen;
}
export function setMaxCumulativeTotal(value: number) {
    maxCumulativeTotal = value;
}
export function setMaxIndividualQuantity(value: number) {
    maxIndividualQuantity = value;
}
export function setChart(chartInstance: any) {
    chart = chartInstance;
}
export function setKlineSeries(seriesInstance: any) {
    klineSeries = seriesInstance;
}
export function setCurrentChartInterval(interval: string) {
    currentChartInterval = interval;
}
export function setKlineWebSocket(ws: WebSocket | null) {
    klineWebSocket = ws;
}

// New toggle setters
export function setFeeAdjusted(enabled: boolean) {
    isFeeAdjusted = enabled;
}
export function setSmallOrdersFiltered(enabled: boolean) {
    isSmallOrdersFiltered = enabled;
}
export function setTopOfBookView(enabled: boolean) {
    isTopOfBookView = enabled;
}
export function setSmallOrderThreshold(threshold: number) {
    smallOrderThreshold = threshold;
}
export function setPerformanceMonitorVisible(visible: boolean) {
    isPerformanceMonitorVisible = visible;
}
export function setMarketIntelligenceVisible(visible: boolean) {
    isMarketIntelligenceVisible = visible;
}

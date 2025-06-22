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
export let selectedExchanges: Set<string> = new Set(['binance', 'bybit', 'hyperliquid']);
export let isAggregatedView: boolean = false;
export let isSidebarOpen: boolean = false;

// Fee-adjusted pricing state
export let feeAdjustedPricing: boolean = true;

// Small order filter state
export let smallOrderFilterEnabled: boolean = false;
export let minOrderSizeUsd: number = 100; // Default minimum order size in USD
export let minOrderSizeAsset: number = 0.001; // Default minimum order size in base asset (e.g., BTC)

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

export function setFeeAdjustedPricing(enabled: boolean): void {
    feeAdjustedPricing = enabled;
}

export function setSmallOrderFilterEnabled(enabled: boolean): void {
    smallOrderFilterEnabled = enabled;
}

export function setMinOrderSizeUsd(size: number): void {
    minOrderSizeUsd = size;
}

export function setMinOrderSizeAsset(size: number): void {
    minOrderSizeAsset = size;
}

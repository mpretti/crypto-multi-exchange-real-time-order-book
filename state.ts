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

// Persistence Functions
export function saveUserPreferences(): void {
    try {
        const preferences = {
            selectedAsset,
            selectedExchanges: Array.from(selectedExchanges),
            isAggregatedView,
            isSidebarOpen,
            feeAdjustedPricing,
            smallOrderFilterEnabled,
            minOrderSizeUsd,
            minOrderSizeAsset,
            currentChartInterval,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('orderBookPreferences', JSON.stringify(preferences));
        console.log('💾 Order book preferences saved successfully');
    } catch (error) {
        console.error('❌ Failed to save order book preferences:', error);
    }
}

export function loadUserPreferences(): void {
    try {
        const stored = localStorage.getItem('orderBookPreferences');
        if (!stored) {
            console.log('📝 No saved order book preferences found, using defaults');
            return;
        }
        
        const preferences = JSON.parse(stored);
        console.log('📂 Loading saved order book preferences:', preferences);
        
        // Restore basic settings
        if (preferences.selectedAsset) {
            selectedAsset = preferences.selectedAsset;
        }
        
        if (preferences.selectedExchanges && Array.isArray(preferences.selectedExchanges)) {
            // Validate exchanges are still available
            const availableExchanges = ['binance', 'bybit', 'okx', 'kraken', 'bitget', 'coinbase', 'gemini', 'bitrue', 'uniswap', 'hyperliquid', 'dydx', 'jupiter', 'vertex', 'mexc'];
            const validExchanges = preferences.selectedExchanges.filter(
                (exchange: string) => availableExchanges.includes(exchange)
            );
            
            if (validExchanges.length > 0) {
                selectedExchanges = new Set(validExchanges);
            } else {
                selectedExchanges = new Set(['binance', 'bybit']); // Default fallback
            }
        }
        
        if (typeof preferences.isAggregatedView === 'boolean') {
            isAggregatedView = preferences.isAggregatedView;
        }
        
        if (typeof preferences.isSidebarOpen === 'boolean') {
            isSidebarOpen = preferences.isSidebarOpen;
        }
        
        if (typeof preferences.feeAdjustedPricing === 'boolean') {
            feeAdjustedPricing = preferences.feeAdjustedPricing;
        }
        
        if (typeof preferences.smallOrderFilterEnabled === 'boolean') {
            smallOrderFilterEnabled = preferences.smallOrderFilterEnabled;
        }
        
        if (typeof preferences.minOrderSizeUsd === 'number') {
            minOrderSizeUsd = preferences.minOrderSizeUsd;
        }
        
        if (typeof preferences.minOrderSizeAsset === 'number') {
            minOrderSizeAsset = preferences.minOrderSizeAsset;
        }
        
        if (preferences.currentChartInterval) {
            currentChartInterval = preferences.currentChartInterval;
        }
        
        console.log('✅ Order book preferences loaded successfully');
        
    } catch (error) {
        console.error('❌ Failed to load order book preferences:', error);
        console.log('🔄 Using default settings');
    }
}

export function resetUserPreferences(): void {
    try {
        localStorage.removeItem('orderBookPreferences');
        console.log('🗑️ Order book preferences reset');
        
        // Reset to defaults
        selectedAsset = 'BTCUSDT';
        selectedExchanges = new Set(['binance', 'bybit', 'hyperliquid']);
        isAggregatedView = false;
        isSidebarOpen = false;
        feeAdjustedPricing = true;
        smallOrderFilterEnabled = false;
        minOrderSizeUsd = 100;
        minOrderSizeAsset = 0.001;
        currentChartInterval = '5m';
        
    } catch (error) {
        console.error('❌ Failed to reset preferences:', error);
    }
}

// Debounced save function to avoid excessive localStorage writes
let saveTimeout: NodeJS.Timeout;
export function saveUserPreferencesDebounced(): void {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveUserPreferences();
    }, 1000); // Save after 1 second of inactivity
}

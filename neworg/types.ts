
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Lightweight Charts type declaration ---
// Usually, you'd get this from an @types package or by importing the type if using modules
export declare const LightweightCharts: any;

// --- Interfaces and Types ---
export interface OrderBookEntry {
    price: number;
    quantity: number;
    exchangeId?: string; // For individual view
}

export interface OrderBookLevel extends OrderBookEntry {
    total: number; // Cumulative quantity
}

export type ExchangeOrderStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'closing' | 'fetching_aux_data';

export interface FeeInfo {
    makerRate?: number | string; // Can be string like "0.02%"
    takerRate?: number | string;
    raw?: any; // Original API response
}

export interface FundingRateInfo {
    rate?: number | string;
    nextFundingTime?: number | string; // Timestamp or formatted string
    raw?: any;
}

export interface VolumeInfo {
    assetVolume?: number | string; // Volume in base asset
    usdVolume?: number | string; // Volume in USDT (or quote currency)
    raw?: any;
}

export interface ExchangeConnectionState {
    ws: WebSocket | null;
    status: ExchangeOrderStatus;
    bids: Map<string, number>; // price_string -> quantity
    asks: Map<string, number>; // price_string -> quantity
    config: ExchangeConfig;
    retries: number;
    lastUpdateId?: number; // For Binance-like full stream
    snapshotReceived?: boolean; // For exchanges sending snapshot + deltas
    currentSymbol?: string; // The specific symbol used for this exchange
    pingIntervalId?: ReturnType<typeof setInterval>;
    krakenBookChecksum?: number;
    // Sidebar data
    feeInfo?: FeeInfo | null; // null if error, undefined if not fetched
    fundingRateInfo?: FundingRateInfo | null;
    volumeInfo?: VolumeInfo | null;
    auxDataFetched?: boolean; // Flag to indicate if sidebar data has been attempted
}

export interface ExchangeMessageUpdate {
    updatedBids: Map<string, number>;
    updatedAsks: Map<string, number>;
    isSnapshot: boolean;
    lastUpdateId?: number;
    checksum?: number;
}

export interface ExchangeConfig {
    id: string;
    name: string;
    getWebSocketUrl: (symbol: string) => string;
    formatSymbol: (commonSymbol: string) => string;
    getSubscribeMessage?: (formattedSymbol: string) => object | string;
    getUnsubscribeMessage?: (formattedSymbol: string) => object | string;
    parseMessage: (
        eventData: any,
        currentBids: Map<string, number>,
        currentAsks: Map<string, number>,
        snapshotReceived?: boolean
    ) => ExchangeMessageUpdate | null;
    maxRetries?: number;
    pingIntervalMs?: number;
    pingPayload?: () => string | object;
    needsSnapshotFlag?: boolean;
    sliceDepth?: number;
    // Functions to fetch sidebar data
    fetchFeeInfo?: (formattedSymbol: string) => Promise<FeeInfo | null>;
    fetchFundingRateInfo?: (formattedSymbol: string) => Promise<FundingRateInfo | null>;
    fetchVolumeInfo?: (formattedSymbol: string) => Promise<VolumeInfo | null>;
}

// Candlestick data type for Lightweight Charts
export interface KLineData {
    time: number; // UNIX timestamp (seconds)
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

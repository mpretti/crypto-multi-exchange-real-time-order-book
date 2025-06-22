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
    originalPrice?: number; // Original price before fee adjustment
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

// Asset and Instrument Type Classifications
export type InstrumentType = 
    | 'spot' 
    | 'margin' 
    | 'futures' 
    | 'perpetual' 
    | 'options' 
    | 'swap'
    | 'amm_spot'      // AMM spot pools (Uniswap, etc.)
    | 'amm_perpetual' // AMM perpetual pools
    | 'unknown';

export type AssetCategory = 
    | 'major'      // BTC, ETH
    | 'altcoin'    // SOL, ADA, LINK, etc.
    | 'meme'       // DOGE, SHIB, etc.
    | 'defi'       // LINK, UNI, etc.
    | 'layer1'     // SOL, ADA, etc.
    | 'stablecoin' // USDT, USDC, etc.
    | 'other';

export interface AssetClassification {
    symbol: string;
    baseAsset: string;  // BTC, ETH, SOL, etc.
    quoteAsset: string; // USDT, USD, etc.
    category: AssetCategory;
    marketCap?: number;
    description?: string;
}

export interface InstrumentInfo {
    symbol: string;
    exchangeId: string;
    instrumentType: InstrumentType;
    baseAsset: string;
    quoteAsset: string;
    contractSize?: number;
    tickSize?: number;
    minOrderSize?: number;
    maxLeverage?: number;
    fundingInterval?: string; // For perpetuals
    expiryDate?: string;      // For futures
    isActive: boolean;
    tradingFees?: {
        maker: number;
        taker: number;
    };
}

// Historical Volume Dashboard Types
export interface HistoricalVolumeDataPoint {
    date: string; // ISO date string (YYYY-MM-DD)
    timestamp: number; // Unix timestamp
    assetVolume: number; // Volume in base asset
    usdVolume: number; // Volume in USD/USDT
    priceClose: number; // Closing price for that day
    exchangeId: string; // Exchange identifier
    symbol: string; // Trading pair symbol
    instrumentType: InstrumentType; // Type of instrument
    baseAsset: string; // Base asset (BTC, ETH, etc.)
    quoteAsset: string; // Quote asset (USDT, USD, etc.)
}

export interface ExchangeVolumeMetrics {
    exchangeId: string;
    exchangeName: string;
    totalVolumeUsd: number;
    averageVolumeUsd: number;
    marketShare: number; // Percentage
    dataPoints: number;
    lastUpdated: string;
    isActive: boolean;
    instrumentBreakdown: Record<InstrumentType, {
        volume: number;
        percentage: number;
        assetCount: number;
    }>;
}

export interface AssetVolumeMetrics {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    category: AssetCategory;
    totalVolumeUsd: number;
    averageVolumeUsd: number;
    exchangeCount: number;
    topExchange: string;
    priceChange24h: number;
    lastUpdated: string;
    instrumentBreakdown: Record<InstrumentType, {
        volume: number;
        percentage: number;
        exchanges: string[];
        bestExchange: string;
        bestVolume: number;
    }>;
}

export interface InstrumentTypeMetrics {
    instrumentType: InstrumentType;
    totalVolumeUsd: number;
    marketShare: number;
    exchangeCount: number;
    assetCount: number;
    averageSpread?: number;
    topExchanges: Array<{
        exchangeId: string;
        volume: number;
        marketShare: number;
    }>;
    topAssets: Array<{
        symbol: string;
        volume: number;
        marketShare: number;
    }>;
    opportunities: Array<{
        type: 'volume_leader' | 'low_competition' | 'high_spread' | 'arbitrage';
        description: string;
        exchanges: string[];
        volume: number;
        score: number;
    }>;
}

export interface OpportunityAnalysis {
    type: 'arbitrage' | 'volume_concentration' | 'market_gap' | 'low_competition';
    asset: string;
    instrumentType: InstrumentType;
    description: string;
    exchanges: string[];
    potentialVolume: number;
    riskLevel: 'low' | 'medium' | 'high';
    score: number; // 0-100
    details: {
        volumeSpread?: number;
        priceSpread?: number;
        liquidityGap?: number;
        competitorCount?: number;
    };
}

export interface DashboardMetrics {
    totalVolumeAllExchanges: number;
    totalAssets: number;
    totalExchanges: number;
    dataQuality: {
        upToDateExchanges: number;
        staleDataExchanges: number;
        lastFullUpdate: string;
    };
    topAssetsByVolume: AssetVolumeMetrics[];
    exchangeMetrics: ExchangeVolumeMetrics[];
    instrumentTypeMetrics: InstrumentTypeMetrics[];
    opportunities: OpportunityAnalysis[];
    marketConcentration: {
        herfindahlIndex: number; // Market concentration measure
        topExchangeShare: number;
        top3ExchangeShare: number;
    };
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
    getWebSocketUrl: (symbol: string) => string | null;
    formatSymbol: (commonSymbol: string) => string;
    getSubscribeMessage?: (formattedSymbol: string) => object | string | null;
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
    // Snapshot-only exchanges (like Jupiter)
    isSnapshotOnly?: boolean;
    snapshotInterval?: number; // Milliseconds between snapshots
    // Functions to fetch sidebar data
    fetchFeeInfo?: (formattedSymbol: string) => Promise<FeeInfo | null>;
    fetchFundingRateInfo?: (formattedSymbol: string) => Promise<FundingRateInfo | null>;
    fetchVolumeInfo?: (formattedSymbol: string) => Promise<VolumeInfo | null>;
    // Historical data functions
    fetchHistoricalVolume?: (symbol: string, days: number) => Promise<HistoricalVolumeDataPoint[]>;
    // Instrument information
    getInstrumentInfo?: (symbol: string) => InstrumentInfo;
    getSupportedInstrumentTypes?: () => InstrumentType[];
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

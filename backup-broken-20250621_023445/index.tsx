/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Lightweight Charts type declaration ---
// Usually, you'd get this from an @types package or by importing the type if using modules
declare const LightweightCharts: any;

// --- Interfaces and Types ---
interface OrderBookEntry {
    price: number;
    quantity: number;
    exchangeId?: string; // For individual view
}

interface OrderBookLevel extends OrderBookEntry {
    total: number; // Cumulative quantity
}

type ExchangeOrderStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'closing' | 'fetching_aux_data';

interface FeeInfo {
    makerRate?: number | string; // Can be string like "0.02%"
    takerRate?: number | string;
    raw?: any; // Original API response
}

interface FundingRateInfo {
    rate?: number | string;
    nextFundingTime?: number | string; // Timestamp or formatted string
    raw?: any;
}

interface VolumeInfo {
    assetVolume?: number | string; // Volume in base asset
    usdVolume?: number | string; // Volume in USDT (or quote currency)
    raw?: any;
}

interface ExchangeConnectionState {
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

interface ExchangeMessageUpdate {
    updatedBids: Map<string, number>;
    updatedAsks: Map<string, number>;
    isSnapshot: boolean;
    lastUpdateId?: number;
    checksum?: number;
}

interface ExchangeConfig {
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
interface KLineData {
    time: number; // UNIX timestamp (seconds)
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}


// --- Binance API Helpers for Sidebar and Chart ---
const BINANCE_FUTURES_API_BASE = 'https://fapi.binance.com';

async function fetchBinanceFeeInfo(formattedSymbol: string): Promise<FeeInfo | null> {
    try {
        // Binance /fapi/v1/commissionRate requires authentication for actual user rates.
        // We'll return typical default rates for perpetuals as a placeholder.
        // Real implementation would need a backend or a way to handle signed requests.
        console.log(`Binance: Simulating fee info fetch for ${formattedSymbol}`);
        return {
            makerRate: '0.02%', // Typical default
            takerRate: '0.05%', // Typical default
            raw: { simulated: true, note: "Default Binance Futures fees" }
        };
    } catch (error) {
        console.error('Binance: Error fetching fee info:', error);
        return null;
    }
}

async function fetchBinanceFundingRateInfo(formattedSymbol: string): Promise<FundingRateInfo | null> {
    try {
        const response = await fetch(`${BINANCE_FUTURES_API_BASE}/fapi/v1/premiumIndex?symbol=${formattedSymbol.toUpperCase()}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        return {
            rate: parseFloat(data.lastFundingRate) * 100, // As percentage
            nextFundingTime: new Date(data.nextFundingTime).toLocaleString(),
            raw: data
        };
    } catch (error) {
        console.error(`Binance: Error fetching funding rate for ${formattedSymbol}:`, error);
        return null;
    }
}

async function fetchBinanceVolumeInfo(formattedSymbol: string): Promise<VolumeInfo | null> {
    try {
        const response = await fetch(`${BINANCE_FUTURES_API_BASE}/fapi/v1/ticker/24hr?symbol=${formattedSymbol.toUpperCase()}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        return {
            assetVolume: parseFloat(data.volume),
            usdVolume: parseFloat(data.quoteVolume),
            raw: data
        };
    } catch (error) {
        console.error(`Binance: Error fetching 24hr volume for ${formattedSymbol}:`, error);
        return null;
    }
}

async function fetchBinanceHistoricalKlines(symbol: string, interval: string, limit: number = 500): Promise<KLineData[]> {
    try {
        const response = await fetch(`${BINANCE_FUTURES_API_BASE}/fapi/v1/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        console.log(`Binance: Fetched ${data.length} historical klines for ${symbol} (${interval}). First item:`, data[0]);
        const mappedData = data.map((k: any) => ({
            time: k[0] / 1000, // Binance provides ms timestamps
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
        }));
        console.log(`Binance: Mapped ${mappedData.length} klines. First mapped item:`, mappedData[0]);
        return mappedData;
    } catch (error) {
        console.error(`Binance: Error fetching historical klines for ${symbol} (${interval}):`, error);
        return [];
    }
}


// --- Exchange Configurations ---
const KRAKEN_COMMON_SYMBOL_TO_PRODUCT_ID: Record<string, string> = {
    'BTCUSDT': 'PF_BTCUSDT',
    'ETHUSDT': 'PF_ETHUSDT',
    'SOLUSDT': 'PF_SOLUSDT',
    'DOGEUSDT': 'PF_DOGEUSDT',
    'ADAUSDT': 'PF_ADAUSDT',
    'XRPUSDT': 'PF_XRPUSDT',
    'LINKUSDT': 'PF_LINKUSDT',
};

const SUPPORTED_EXCHANGES: Record<string, ExchangeConfig> = {
    binance: {
        id: 'binance',
        name: 'Binance',
        formatSymbol: (commonSymbol) => commonSymbol.toLowerCase(),
        getWebSocketUrl: (formattedSymbol) => `wss://fstream.binance.com/ws/${formattedSymbol}@depth20@100ms`,
        parseMessage: (data) => {
            if (data.e === 'depthUpdate' || (data.lastUpdateId && data.b && data.a)) {
                const newBids = new Map<string, number>();
                (data.b || data.bids || []).forEach((bid: [string, string]) => newBids.set(bid[0], parseFloat(bid[1])));
                const newAsks = new Map<string, number>();
                (data.a || data.asks || []).forEach((ask: [string, string]) => newAsks.set(ask[0], parseFloat(ask[1])));
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot: true, lastUpdateId: data.lastUpdateId ?? data.U };
            }
            return null;
        },
        fetchFeeInfo: fetchBinanceFeeInfo,
        fetchFundingRateInfo: fetchBinanceFundingRateInfo,
        fetchVolumeInfo: fetchBinanceVolumeInfo,
    },
    bybit: {
        id: 'bybit',
        name: 'Bybit',
        formatSymbol: (commonSymbol) => commonSymbol.toUpperCase(),
        getWebSocketUrl: () => 'wss://stream.bybit.com/v5/public/linear',
        getSubscribeMessage: (formattedSymbol) => ({ op: 'subscribe', args: [`orderbook.50.${formattedSymbol}`] }),
        getUnsubscribeMessage: (formattedSymbol) => ({ op: 'unsubscribe', args: [`orderbook.50.${formattedSymbol}`] }),
        pingIntervalMs: 20000,
        pingPayload: () => ({ op: 'ping' }),
        needsSnapshotFlag: true,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks, snapshotReceived) => {
            if (data.op === 'subscribe' || data.op === 'unsubscribe') {
                console.log(`Bybit: ${data.op} success: ${data.success}`, data.ret_msg || '');
                return null;
            }
            if (data.topic && data.topic.startsWith('orderbook.50.')) {
                const { type, data: bookData } = data;
                let newBids = new Map(currentBids);
                let newAsks = new Map(currentAsks);
                let isSnapshot = false;

                if (type === 'snapshot') {
                    newBids = new Map<string, number>();
                    bookData.b.forEach((bid: [string, string]) => newBids.set(bid[0], parseFloat(bid[1])));
                    newAsks = new Map<string, number>();
                    bookData.a.forEach((ask: [string, string]) => newAsks.set(ask[0], parseFloat(ask[1])));
                    isSnapshot = true;
                } else if (type === 'delta') {
                    if (!snapshotReceived) return null; // Wait for snapshot
                    bookData.b.forEach((bid: [string, string]) => {
                        const quantity = parseFloat(bid[1]);
                        if (quantity === 0) newBids.delete(bid[0]); else newBids.set(bid[0], quantity);
                    });
                    bookData.a.forEach((ask: [string, string]) => {
                        const quantity = parseFloat(ask[1]);
                        if (quantity === 0) newAsks.delete(ask[0]); else newAsks.set(ask[0], quantity);
                    });
                }
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot };
            }
            return null;
        },
        // TODO: Implement fetchFeeInfo, fetchFundingRateInfo, fetchVolumeInfo for Bybit
    },
    okx: {
        id: 'okx',
        name: 'OKX',
        formatSymbol: (commonSymbol) => `${commonSymbol.toUpperCase()}-SWAP`,
        getWebSocketUrl: () => 'wss://ws.okx.com:8443/ws/v5/public',
        getSubscribeMessage: (formattedSymbol) => JSON.stringify({ op: 'subscribe', args: [{ channel: 'books', instId: formattedSymbol }] }),
        getUnsubscribeMessage: (formattedSymbol) => JSON.stringify({ op: 'unsubscribe', args: [{ channel: 'books', instId: formattedSymbol }] }),
        pingIntervalMs: 25000,
        pingPayload: () => 'ping',
        needsSnapshotFlag: true,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks, snapshotReceived) => {
            if (data.event === 'subscribe' || data.event === 'unsubscribe') {
                console.log(`OKX: ${data.event} success for arg:`, data.arg); return null;
            }
            if (data.arg?.channel === 'books' && Array.isArray(data.data) && data.data.length > 0) {
                const bookData = data.data[0];
                let newBids = new Map(currentBids);
                let newAsks = new Map(currentAsks);
                let isSnapshot = data.action === 'snapshot';

                if (isSnapshot) {
                    newBids = new Map<string, number>();
                    bookData.bids.forEach((bid: [string, string, string, string]) => newBids.set(bid[0], parseFloat(bid[1])));
                    newAsks = new Map<string, number>();
                    bookData.asks.forEach((ask: [string, string, string, string]) => newAsks.set(ask[0], parseFloat(ask[1])));
                } else if (data.action === 'update') {
                    if (!snapshotReceived) return null;
                    bookData.bids.forEach((bid: [string, string, string, string]) => {
                        const quantity = parseFloat(bid[1]);
                        if (quantity === 0) newBids.delete(bid[0]); else newBids.set(bid[0], quantity);
                    });
                    bookData.asks.forEach((ask: [string, string, string, string]) => {
                        const quantity = parseFloat(ask[1]);
                        if (quantity === 0) newAsks.delete(ask[0]); else newAsks.set(ask[0], quantity);
                    });
                }
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot, lastUpdateId: parseInt(bookData.ts,10) };
            }
            return null;
        }
        // TODO: Implement fetchFeeInfo, fetchFundingRateInfo, fetchVolumeInfo for OKX
    },
    kraken: {
        id: 'kraken',
        name: 'Kraken',
        formatSymbol: (commonSymbol) => KRAKEN_COMMON_SYMBOL_TO_PRODUCT_ID[commonSymbol.toUpperCase()] || commonSymbol.toUpperCase(),
        getWebSocketUrl: () => 'wss://futures.kraken.com/ws/v1',
        getSubscribeMessage: (formattedSymbol) => ({ event: 'subscribe', feed: 'book_ui_1', product_ids: [formattedSymbol] }),
        getUnsubscribeMessage: (formattedSymbol) => ({ event: 'unsubscribe', feed: 'book_ui_1', product_ids: [formattedSymbol] }),
        needsSnapshotFlag: true,
        sliceDepth: 25,
        parseMessage: (data, currentBids, currentAsks, snapshotReceived) => {
            if (data.event === 'subscribed' || data.event === 'unsubscribed') {
                console.log(`Kraken: ${data.feed} ${data.event} for product_ids:`, data.product_ids); return null;
            }
             if (data.event === 'alert') { console.warn('Kraken Alert:', data.message); return null; }

            if ((data.feed === 'book_ui_1_snapshot' || data.feed === 'book_ui_1') && data.product_id) {
                let newBids = new Map(currentBids);
                let newAsks = new Map(currentAsks);
                let isSnapshot = data.feed === 'book_ui_1_snapshot';

                if (isSnapshot) {
                    newBids = new Map<string, number>();
                    (data.bids || []).forEach((bid: { price: number, qty: number }) => newBids.set(bid.price.toString(), bid.qty));
                    newAsks = new Map<string, number>();
                    (data.asks || []).forEach((ask: { price: number, qty: number }) => newAsks.set(ask.price.toString(), ask.qty));
                } else if (data.feed === 'book_ui_1') { // Kraken book_ui_1 is a full book snapshot always
                    // The 'newConnectionState.snapshotReceived = true;' line was problematic here,
                    // snapshotReceived is on the connection state object managed in connectToExchange
                    // and updated based on the 'isSnapshot' flag returned by this parser.

                    const tempBids = new Map<string, number>();
                    (data.bids || []).forEach((bid: { price: number, qty: number }) => tempBids.set(bid.price.toString(), bid.qty));
                    newBids = tempBids;

                    const tempAsks = new Map<string, number>();
                    (data.asks || []).forEach((ask: { price: number, qty: number }) => tempAsks.set(ask.price.toString(), ask.qty));
                    newAsks = tempAsks;
                    isSnapshot = true; // Treat as snapshot for processing
                }
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot, checksum: data.book_checksum };
            }
            return null;
        }
        // TODO: Implement fetchFeeInfo, fetchFundingRateInfo, fetchVolumeInfo for Kraken
    },
    bitget: {
        id: 'bitget',
        name: 'Bitget',
        formatSymbol: (commonSymbol) => commonSymbol.toUpperCase(),
        getWebSocketUrl: () => 'wss://ws.bitget.com/v2/mix/ws/public',
        getSubscribeMessage: (formattedSymbol) => ({ op: 'subscribe', args: [{ instType: 'UPERP', channel: 'books50', instId: formattedSymbol }] }),
        getUnsubscribeMessage: (formattedSymbol) => ({ op: 'unsubscribe', args: [{ instType: 'UPERP', channel: 'books50', instId: formattedSymbol }] }),
        needsSnapshotFlag: true,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks, snapshotReceived) => {
            if (data.event === 'subscribe' || data.event === 'unsubscribe') {
                 console.log(`Bitget: ${data.event} success for arg:`, data.arg); return null;
            }
            if (data.action === 'snapshot' || data.action === 'update') {
                const book = data.data[0];
                let newBids = new Map(currentBids);
                let newAsks = new Map(currentAsks);
                let isSnapshot = data.action === 'snapshot';

                if (isSnapshot) {
                    newBids = new Map<string, number>();
                    book.bids.forEach((bid: [string, string]) => newBids.set(bid[0], parseFloat(bid[1])));
                    newAsks = new Map<string, number>();
                    book.asks.forEach((ask: [string, string]) => newAsks.set(ask[0], parseFloat(ask[1])));
                } else if (data.action === 'update') {
                    if (!snapshotReceived) return null;
                     book.bids.forEach((bid: [string, string]) => {
                        const quantity = parseFloat(bid[1]);
                        if (quantity === 0) newBids.delete(bid[0]); else newBids.set(bid[0], quantity);
                    });
                    book.asks.forEach((ask: [string, string]) => {
                        const quantity = parseFloat(ask[1]);
                        if (quantity === 0) newAsks.delete(ask[0]); else newAsks.set(ask[0], quantity);
                    });
                }
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot, lastUpdateId: parseInt(book.ts, 10) };
            }
            return null;
        }
        // TODO: Implement fetchFeeInfo, fetchFundingRateInfo, fetchVolumeInfo for Bitget
    }
};
const SUPPORTED_EXCHANGES_ORDER = ['binance', 'bybit', 'okx', 'kraken', 'bitget'];

// --- DEX Perpetual Swap Configurations ---
const DEX_PERP_EXCHANGES: Record<string, ExchangeConfig> = {
    dydx: {
        id: 'dydx',
        name: 'dYdX',
        formatSymbol: (commonSymbol) => commonSymbol.replace('USDT', 'USD'),
        getWebSocketUrl: (formattedSymbol) => `wss://api.dydx.exchange/v3/ws`,
        getSubscribeMessage: (formattedSymbol) => ({
            type: 'subscribe',
            channel: 'v3_orderbook',
            id: formattedSymbol
        }),
        parseMessage: (data, currentBids, currentAsks) => {
            if (data.type === 'channel_data' && data.channel === 'v3_orderbook') {
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                if (data.contents?.bids) {
                    data.contents.bids.forEach((bid: any) => {
                        newBids.set(bid.price, parseFloat(bid.size));
                    });
                }
                if (data.contents?.asks) {
                    data.contents.asks.forEach((ask: any) => {
                        newAsks.set(ask.price, parseFloat(ask.size));
                    });
                }
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: data.contents?.snapshot || false
                };
            }
            return null;
        },
        maxRetries: 3
    },
    
    gmx: {
        id: 'gmx',
        name: 'GMX',
        formatSymbol: (commonSymbol) => commonSymbol,
        getWebSocketUrl: (formattedSymbol) => `wss://api.gmx.io/ws`,
        getSubscribeMessage: (formattedSymbol) => ({
            method: 'subscribe',
            params: [`orderbook.${formattedSymbol}`]
        }),
        parseMessage: (data, currentBids, currentAsks) => {
            if (data.method === 'subscription' && data.params?.channel?.includes('orderbook')) {
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                if (data.params.data?.bids) {
                    data.params.data.bids.forEach((bid: any) => {
                        newBids.set(bid[0], parseFloat(bid[1]));
                    });
                }
                if (data.params.data?.asks) {
                    data.params.data.asks.forEach((ask: any) => {
                        newAsks.set(ask[0], parseFloat(ask[1]));
                    });
                }
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: false
                };
            }
            return null;
        },
        maxRetries: 3
    },

    drift: {
        id: 'drift',
        name: 'Drift Protocol',
        formatSymbol: (commonSymbol) => commonSymbol.replace('USDT', 'USDC'),
        getWebSocketUrl: (formattedSymbol) => `wss://api.drift.trade/ws`,
        getSubscribeMessage: (formattedSymbol) => ({
            type: 'subscribe',
            channel: 'orderbook',
            market: formattedSymbol
        }),
        parseMessage: (data, currentBids, currentAsks) => {
            if (data.channel === 'orderbook' && data.data) {
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                if (data.data.bids) {
                    data.data.bids.forEach((bid: any) => {
                        newBids.set(bid.price.toString(), parseFloat(bid.size));
                    });
                }
                if (data.data.asks) {
                    data.data.asks.forEach((ask: any) => {
                        newAsks.set(ask.price.toString(), parseFloat(ask.size));
                    });
                }
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: data.data.snapshot || false
                };
            }
            return null;
        },
        maxRetries: 3
    },

    mango: {
        id: 'mango',
        name: 'Mango Markets',
        formatSymbol: (commonSymbol) => commonSymbol.replace('USDT', 'USDC'),
        getWebSocketUrl: (formattedSymbol) => `wss://api.mngo.cloud/ws`,
        getSubscribeMessage: (formattedSymbol) => ({
            command: 'subscribe',
            marketName: formattedSymbol
        }),
        parseMessage: (data, currentBids, currentAsks) => {
            if (data.marketName && data.bids && data.asks) {
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                data.bids.forEach((bid: any) => {
                    newBids.set(bid[0].toString(), parseFloat(bid[1]));
                });
                data.asks.forEach((ask: any) => {
                    newAsks.set(ask[0].toString(), parseFloat(ask[1]));
                });
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: false
                };
            }
            return null;
        },
        maxRetries: 3
    }
};

// Add DEX exchanges to the main supported exchanges
const SUPPORTED_EXCHANGES_WITH_DEX = {
    ...SUPPORTED_EXCHANGES,
    ...DEX_PERP_EXCHANGES
};

// Update the order to include DEX exchanges
const SUPPORTED_EXCHANGES_ORDER_WITH_DEX = [
    ...SUPPORTED_EXCHANGES_ORDER,
    'dydx', 'gmx', 'drift', 'mango'
];

const EXCHANGE_COLORS: Record<string, string> = {
    binance: '#F0B90B',
    bybit: '#FFA500',
    okx: '#007bff',
    kraken: '#5D40C4',
    bitget: '#00CED1',
    default: '#777777'
};

const EXCHANGE_TAGS: Record<string, string> = {
    binance: 'BNB',
    bybit: 'BYB',
    okx: 'OKX',
    kraken: 'KRK',
    bitget: 'BGT',
    dydx: 'dYdX',
    gmx: 'GMX',
    drift: 'DRIFT',
    mango: 'MANGO',
};


// --- Global State ---
let selectedAsset: string = 'BTCUSDT';
const activeConnections = new Map<string, ExchangeConnectionState>();
let maxCumulativeTotal: number = 0;
let maxIndividualQuantity: number = 0;
let selectedExchanges: Set<string> = new Set(['binance', 'bybit']);
let isAggregatedView: boolean = true;
let isSidebarOpen: boolean = false;

// Chart State
let chart: any = null; // LightweightCharts instance
let klineSeries: any = null; // Candlestick series instance
let currentChartInterval: string = '5m'; // Default chart interval changed to 5m
let klineWebSocket: WebSocket | null = null;


// --- DOM Elements ---
const assetSelect = document.getElementById('asset-select') as HTMLSelectElement;
const connectionStatusSummaryEl = document.getElementById('connection-status-summary') as HTMLDivElement;
const spreadValueEl = document.getElementById('spread-value') as HTMLSpanElement;
const spreadPercentageEl = document.getElementById('spread-percentage') as HTMLSpanElement;
const bidsList = document.getElementById('bids-list') as HTMLUListElement;
const asksList = document.getElementById('asks-list') as HTMLUListElement;
const exchangeSelectorDiv = document.getElementById('exchange-selector') as HTMLDivElement;
const viewModeToggle = document.getElementById('view-mode-toggle') as HTMLInputElement;
const viewModeLabel = document.getElementById('view-mode-label') as HTMLSpanElement;
const bidsTitle = document.getElementById('bids-title') as HTMLElement;
const asksTitle = document.getElementById('asks-title') as HTMLElement;

// Sidebar DOM Elements
const infoSidebar = document.getElementById('info-sidebar') as HTMLElement;
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn') as HTMLButtonElement;
const closeSidebarBtn = document.getElementById('close-sidebar-btn') as HTMLButtonElement;
const refreshSidebarStatsBtn = document.getElementById('refresh-sidebar-stats-btn') as HTMLButtonElement;
const mainContainer = document.getElementById('main-container') as HTMLElement;

const feesContentEl = document.getElementById('fees-content') as HTMLDivElement;
const fundingContentEl = document.getElementById('funding-content') as HTMLDivElement;
const volumeContentEl = document.getElementById('volume-content') as HTMLDivElement;
const fundingAssetSymbolEl = document.getElementById('funding-asset-symbol') as HTMLSpanElement;
const volumeAssetSymbolEl = document.getElementById('volume-asset-symbol') as HTMLSpanElement;

// Chart DOM Elements
const chartContainerEl = document.getElementById('chart-container') as HTMLDivElement;
const chartTimeframeSelectorEl = document.getElementById('chart-timeframe-selector') as HTMLDivElement;

// DEX Selector DOM Element
const dexSelectorDiv = document.getElementById('dex-selector') as HTMLDivElement;


// --- Helper Functions ---
function waitForLightweightCharts(maxAttempts = 50, interval = 100): Promise<boolean> {
    return new Promise((resolve) => {
        let attempts = 0;
        const checkLibrary = () => {
            attempts++;
            if (typeof LightweightCharts !== 'undefined' && typeof LightweightCharts.createChart === 'function') {
                console.log(`Chart: LightweightCharts library loaded after ${attempts} attempts`);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                console.error(`Chart: LightweightCharts library failed to load after ${attempts} attempts`);
                resolve(false);
            } else {
                setTimeout(checkLibrary, interval);
            }
        };
        checkLibrary();
    });
}

function getDecimalPlaces(price: number): number {
    if (price === 0 || isNaN(price) || !isFinite(price) ) return 2;
    const absPrice = Math.abs(price);
    if (absPrice >= 1000) return 2;
    if (absPrice >= 100) return 2;
    if (absPrice >= 1) return 3;
    if (absPrice >= 0.01) return 4;
    if (absPrice >= 0.0001) return 5;
    return 6;
}

function mapToSortedEntries(map: Map<string, number>, descending: boolean = false, exchangeId?: string): OrderBookEntry[] {
    return Array.from(map.entries())
        .map(([priceStr, quantity]) => ({ price: parseFloat(priceStr), quantity, exchangeId }))
        .filter(entry => entry.quantity > 0)
        .sort((a, b) => descending ? b.price - a.price : a.price - b.price);
}

function applyDepthSlice(entries: Map<string, number>, sliceDepth: number | undefined, isBids: boolean): Map<string, number> {
    if (!sliceDepth || entries.size <= sliceDepth) {
        return entries;
    }
    const sorted = Array.from(entries.entries())
        .map(([price, quantity]) => ({ price: parseFloat(price), quantity }))
        .sort((a,b) => isBids ? b.price - a.price : a.price - b.price);

    const sliced = sorted.slice(0, sliceDepth);
    const newMap = new Map<string, number>();
    sliced.forEach(item => newMap.set(item.price.toString(), item.quantity));
    return newMap;
}

// --- Sidebar Logic ---
function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
    if (isSidebarOpen) {
        infoSidebar.classList.add('open');
        mainContainer.classList.add('sidebar-active'); // This class might be used to push main content
        updateSidebarContent();
    } else {
        infoSidebar.classList.remove('open');
        mainContainer.classList.remove('sidebar-active');
    }
}

async function fetchAuxiliaryDataForExchange(exchangeId: string, formattedSymbol: string) {
    const conn = activeConnections.get(exchangeId);
    if (!conn || !conn.config) return;

    conn.auxDataFetched = false; // Mark as fetching
    conn.status = 'fetching_aux_data';
    updateOverallConnectionStatus();

    const { config } = conn;
    try {
        if (config.fetchFeeInfo) conn.feeInfo = await config.fetchFeeInfo(formattedSymbol);
        if (config.fetchFundingRateInfo) conn.fundingRateInfo = await config.fetchFundingRateInfo(formattedSymbol);
        if (config.fetchVolumeInfo) conn.volumeInfo = await config.fetchVolumeInfo(formattedSymbol);
    } catch (e) {
        console.error(`${config.name}: Error fetching auxiliary data for ${formattedSymbol}:`, e);
        // Set to null to indicate error
        conn.feeInfo = null; conn.fundingRateInfo = null; conn.volumeInfo = null;
    } finally {
        conn.auxDataFetched = true;
        conn.status = 'connected'; // Revert to connected after fetching
        updateSidebarContent();
        updateOverallConnectionStatus();
    }
}


function updateSidebarContent() {
    if (!isSidebarOpen && !document.hidden) return; // Only update if open or page just became visible

    fundingAssetSymbolEl.textContent = selectedAsset;
    volumeAssetSymbolEl.textContent = selectedAsset;

    let feesHtml = '';
    let fundingHtml = '';
    let volumeHtml = '';
    let activeExchangeCountForSidebar = 0;
    let aggregatedUsdVolume = 0;
    let someDataIsLoading = false;

    SUPPORTED_EXCHANGES_ORDER_WITH_DEX.forEach(exchangeId => {
        const conn = activeConnections.get(exchangeId);
        if (selectedExchanges.has(exchangeId) && conn && (conn.status === 'connected' || conn.status === 'fetching_aux_data')) {
            activeExchangeCountForSidebar++;
            const config = SUPPORTED_EXCHANGES_WITH_DEX[exchangeId];
            let feeText = 'N/A';
            let fundingText = 'N/A';
            let volumeText = 'N/A';

            if (conn.auxDataFetched === undefined && conn.status === 'connected') { // Not yet attempted
                feeText = fundingText = volumeText = 'Loading...';
                someDataIsLoading = true;
            } else if (conn.auxDataFetched === false && conn.status === 'fetching_aux_data') { // Currently fetching
                 feeText = fundingText = volumeText = 'Loading...';
                 someDataIsLoading = true;
            } else { // Attempted (either success or null for error)
                // Fees
                if (conn.feeInfo) {
                    feeText = `Maker: ${conn.feeInfo.makerRate ?? '--'}, Taker: ${conn.feeInfo.takerRate ?? '--'}`;
                } else if (conn.feeInfo === null) feeText = 'Error loading fees';

                // Funding
                if (conn.fundingRateInfo) {
                    const rate = typeof conn.fundingRateInfo.rate === 'number' ? `${conn.fundingRateInfo.rate.toFixed(4)}%` : (conn.fundingRateInfo.rate || '--');
                    fundingText = `Rate: ${rate} | Next: ${conn.fundingRateInfo.nextFundingTime || '--'}`;
                } else if (conn.fundingRateInfo === null) fundingText = 'Error loading funding';

                // Volume
                if (conn.volumeInfo) {
                    const assetVol = typeof conn.volumeInfo.assetVolume === 'number' ? conn.volumeInfo.assetVolume.toLocaleString(undefined, {maximumFractionDigits: 2}) : (conn.volumeInfo.assetVolume || '--');
                    const usdVol = typeof conn.volumeInfo.usdVolume === 'number' ? parseFloat(conn.volumeInfo.usdVolume.toString()).toLocaleString(undefined, {style: 'currency', currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0 }) : (conn.volumeInfo.usdVolume || '--');
                    volumeText = `${selectedAsset}: ${assetVol} | USD: ${usdVol}`;
                    if (typeof conn.volumeInfo.usdVolume === 'number') aggregatedUsdVolume += conn.volumeInfo.usdVolume;
                } else if (conn.volumeInfo === null) volumeText = 'Error loading volume';
            }

            feesHtml += `<div class="sidebar-item"><strong>${config.name}:</strong> ${feeText}</div>`;
            fundingHtml += `<div class="sidebar-item"><strong>${config.name}:</strong> ${fundingText}</div>`;
            volumeHtml += `<div class="sidebar-item"><strong>${config.name}:</strong> ${volumeText}</div>`;
        }
    });

    if (activeExchangeCountForSidebar === 0) {
        const placeholder = "<p>Connect to exchanges to see information.</p>";
        feesContentEl.innerHTML = placeholder;
        fundingContentEl.innerHTML = placeholder;
        volumeContentEl.innerHTML = placeholder;
    } else {
        feesContentEl.innerHTML = feesHtml || "<p>No fee data available or loading...</p>";
        fundingContentEl.innerHTML = fundingHtml || "<p>No funding data available or loading...</p>";
        volumeContentEl.innerHTML = volumeHtml + `<div class="sidebar-item summary"><strong>Aggregated 24h Vol (USD):</strong> ${aggregatedUsdVolume > 0 ? aggregatedUsdVolume.toLocaleString(undefined, {style: 'currency', currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0 }) : (someDataIsLoading ? 'Calculating...' : '--')}</div>`;
    }
}


// --- Core Logic: Connection Management ---
let currentModuleScopedConnectionState: ExchangeConnectionState; // To satisfy Kraken's snapshotReceived access in parseMessage

function connectToExchange(exchangeId: string, asset: string) {
    const config = SUPPORTED_EXCHANGES_WITH_DEX[exchangeId];
    if (!config) {
        console.error(`Unsupported exchange: ${exchangeId}`);
        return;
    }

    let connectionState = activeConnections.get(exchangeId);
     if (connectionState?.ws && connectionState.status !== 'disconnected' && connectionState.status !== 'error') {
        if (connectionState.currentSymbol === asset && (connectionState.status === 'connected' || connectionState.status === 'fetching_aux_data')) {
            // If already connected and aux data not fetched, try fetching it
            if (!connectionState.auxDataFetched && connectionState.status === 'connected') {
                 fetchAuxiliaryDataForExchange(exchangeId, config.formatSymbol(asset));
            }
            updateOverallConnectionStatus();
            return;
        }
    }

    if (connectionState?.ws) {
        connectionState.ws.onopen = null; connectionState.ws.onmessage = null;
        connectionState.ws.onerror = null; connectionState.ws.onclose = null;
        if(connectionState.ws.readyState === WebSocket.OPEN || connectionState.ws.readyState === WebSocket.CONNECTING) {
            connectionState.ws.close();
        }
        if (connectionState.pingIntervalId) clearInterval(connectionState.pingIntervalId);
    }

    const formattedSymbol = config.formatSymbol(asset);
    if (!formattedSymbol && config.id === 'kraken') {
        console.warn(`Kraken: Symbol ${asset} not found in mapping. Cannot connect.`);
        updateOverallConnectionStatus();
        return;
    }
    const wsUrl = config.getWebSocketUrl(formattedSymbol);

    currentModuleScopedConnectionState = { // Assign to the module-scoped variable
        ws: new WebSocket(wsUrl),
        status: 'connecting',
        bids: new Map(),
        asks: new Map(),
        config,
        retries: 0,
        snapshotReceived: config.needsSnapshotFlag ? false : undefined,
        currentSymbol: asset,
        auxDataFetched: undefined, // Reset aux data status
    };
    activeConnections.set(exchangeId, currentModuleScopedConnectionState);
    updateOverallConnectionStatus();
    console.log(`${config.name}: Connecting to ${wsUrl} for ${asset}...`);

    currentModuleScopedConnectionState.ws!.onopen = () => {
        const currentConn = activeConnections.get(exchangeId); // Get the most current state
        if (!currentConn || currentConn.ws !== currentModuleScopedConnectionState.ws) {
             console.warn(`${config.name}: Stale WebSocket onopen triggered for ${asset}. Ignoring.`);
             return;
        }
        console.log(`${config.name}: Connected to ${asset}.`);
        currentConn.status = 'connected'; // Initially connected, then fetch aux
        currentConn.retries = 0;
        currentConn.snapshotReceived = config.needsSnapshotFlag ? false : undefined;
        updateOverallConnectionStatus();

        // Fetch auxiliary data (fees, funding, volume)
        fetchAuxiliaryDataForExchange(exchangeId, formattedSymbol);


        if (config.getSubscribeMessage) {
            const subMsg = config.getSubscribeMessage(formattedSymbol);
            currentConn.ws!.send(typeof subMsg === 'string' ? subMsg : JSON.stringify(subMsg));
            console.log(`${config.name}: Sent subscribe message:`, subMsg);
        }
        if (config.pingIntervalMs && config.pingPayload) {
            currentConn.pingIntervalId = setInterval(() => {
                const latestConn = activeConnections.get(exchangeId);
                if (latestConn && latestConn.ws?.readyState === WebSocket.OPEN) {
                    const pingMsg = config.pingPayload!();
                    latestConn.ws.send(typeof pingMsg === 'string' ? pingMsg : JSON.stringify(pingMsg));
                }
            }, config.pingIntervalMs);
        }
    };

    currentModuleScopedConnectionState.ws!.onmessage = (event) => {
        try {
            const messageData = event.data;
            const currentConnState = activeConnections.get(config.id);
            if (!currentConnState || currentConnState.ws !== event.target ) {
                 console.warn(`${config.name}: Stale WebSocket onmessage for ${asset}. Ignoring.`);
                 return;
            }


            if (typeof messageData === 'string') {
                const lowerCaseMsg = messageData.toLowerCase();
                if (lowerCaseMsg === 'ping') {
                    if (config.id === 'bitget' || config.id === 'okx') { // OKX also sends ping
                        if (currentConnState.ws?.readyState === WebSocket.OPEN) currentConnState.ws.send('pong');
                        return;
                    }
                    return;
                }
                if (lowerCaseMsg === 'pong') {
                    if (config.id === 'bybit') return; // Bybit client sends ping, server sends pong
                    return;
                }
                let parsedJson;
                try { parsedJson = JSON.parse(messageData); } catch (e) {
                    console.error(`${config.name}: Error parsing string message to JSON:`, messageData, e); return;
                }
                if (config.id === 'bybit' && parsedJson.op === 'pong') return; // Bybit's pong is JSON

                const update = config.parseMessage(
                    parsedJson, new Map(currentConnState.bids), new Map(currentConnState.asks), currentConnState.snapshotReceived
                );
                if (update) {
                    currentConnState.bids = applyDepthSlice(update.updatedBids, config.sliceDepth, true);
                    currentConnState.asks = applyDepthSlice(update.updatedAsks, config.sliceDepth, false);
                    if (update.lastUpdateId) currentConnState.lastUpdateId = update.lastUpdateId;
                    if (update.checksum && config.id === 'kraken') currentConnState.krakenBookChecksum = update.checksum;
                    if (config.needsSnapshotFlag && update.isSnapshot) currentConnState.snapshotReceived = true;
                    if (!config.needsSnapshotFlag || currentConnState.snapshotReceived) aggregateAndRenderAll();
                }
            } else { console.warn(`${config.name}: Received non-string message type:`, typeof messageData, messageData); }
        } catch (error) { console.error(`${config.name}: Critical error processing message for ${asset}:`, error, event.data); }
    };

    currentModuleScopedConnectionState.ws!.onerror = (errorEvent) => {
        const currentConnState = activeConnections.get(config.id);
         if (!currentConnState || currentConnState.ws !== errorEvent.target) {
             console.warn(`${config.name}: Stale WebSocket onerror for ${asset}. Ignoring.`);
             return;
         }
        console.error(`${config.name}: WebSocket Error for ${asset}:`, errorEvent);
        currentConnState.status = 'error';
        updateOverallConnectionStatus();
    };

    currentModuleScopedConnectionState.ws!.onclose = (event) => {
        const currentConnState = activeConnections.get(config.id);
        if (!currentConnState || currentConnState.ws !== event.target) {
            console.warn(`${config.name}: Stale WebSocket onclose for ${asset}. Ignoring.`);
            return;
        }


        console.log(`${config.name}: Disconnected from ${asset}. Code: ${event.code}, Reason: ${event.reason}`);
        if (currentConnState.pingIntervalId) {
            clearInterval(currentConnState.pingIntervalId); delete currentConnState.pingIntervalId;
        }
        // Don't set to 'disconnected' if it was a deliberate 'closing' or already 'error'
        if (currentConnState.status !== 'closing' && currentConnState.status !== 'error') {
            currentConnState.status = 'disconnected';
        }


        if (currentConnState.status !== 'closing' && selectedExchanges.has(exchangeId)) {
            const maxRetries = config.maxRetries ?? 5;
            if (currentConnState.retries < maxRetries) {
                currentConnState.retries++;
                const delay = Math.pow(2, currentConnState.retries) * 1000;
                console.log(`${config.name}: Reconnecting to ${asset} in ${delay / 1000}s (attempt ${currentConnState.retries}/${maxRetries})...`);
                setTimeout(() => {
                    if (selectedExchanges.has(exchangeId) && activeConnections.get(exchangeId) === currentConnState && currentConnState.status !== 'closing') {
                         connectToExchange(exchangeId, asset);
                    }
                }, delay);
            } else {
                console.error(`${config.name}: Max retries reached for ${asset}.`);
                currentConnState.status = 'error';
            }
        }
        updateOverallConnectionStatus();
    };
}

function disconnectFromExchange(exchangeId: string) {
    const connectionState = activeConnections.get(exchangeId);
    if (connectionState?.ws) {
        connectionState.status = 'closing'; // Mark as closing to prevent auto-reconnect
        if (connectionState.pingIntervalId) { clearInterval(connectionState.pingIntervalId); delete connectionState.pingIntervalId; }
        const config = connectionState.config; const currentWs = connectionState.ws;
        if (config.getUnsubscribeMessage && currentWs.readyState === WebSocket.OPEN && connectionState.currentSymbol) {
            try {
                const unsubMsg = config.getUnsubscribeMessage(config.formatSymbol(connectionState.currentSymbol));
                currentWs.send(typeof unsubMsg === 'string' ? unsubMsg : JSON.stringify(unsubMsg));
                console.log(`${config.name}: Sent unsubscribe for ${connectionState.currentSymbol}.`);
            } catch (e) { console.warn(`${config.name}: Error sending unsubscribe:`, e); }
        }
        currentWs.onopen = null; currentWs.onmessage = null; currentWs.onerror = null; currentWs.onclose = null;
        if (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING) currentWs.close();
        console.log(`${config.name}: Disconnected (initiated) from ${connectionState.currentSymbol || 'N/A'}.`);
        connectionState.bids.clear(); connectionState.asks.clear();
        connectionState.status = 'disconnected'; // Final status after closing
        connectionState.auxDataFetched = undefined; // Reset aux data status
        connectionState.feeInfo = undefined;
        connectionState.fundingRateInfo = undefined;
        connectionState.volumeInfo = undefined;
        aggregateAndRenderAll();
    }
    updateOverallConnectionStatus();
}

function reconnectToAllSelectedExchanges(newAsset: string) {
    console.log(`Asset changed to ${newAsset}. Reconnecting selected exchanges and chart.`);
    Array.from(activeConnections.keys()).forEach(id => disconnectFromExchange(id));
    if (klineWebSocket) {
        klineWebSocket.onopen = null; klineWebSocket.onmessage = null; klineWebSocket.onerror = null; klineWebSocket.onclose = null;
        klineWebSocket.close();
        klineWebSocket = null;
    }
    setTimeout(() => {
        // activeConnections.clear(); // Clearing all states might be too aggressive if some connections are mid-retry for OTHER assets.
                                  // Better to let disconnectFromExchange manage individual states.
        selectedExchanges.forEach(exchangeId => connectToExchange(exchangeId, newAsset));
        clearOrderBookDisplay();
        updateOverallConnectionStatus(); // Will call updateSidebarContent
        updateChartForAssetAndInterval(newAsset, currentChartInterval); // Update chart
    }, 250); // Delay to allow WebSockets to close cleanly
}

// --- Core Logic: Data Aggregation & Rendering ---
function aggregateAndRenderAll() {
    let finalBids: OrderBookLevel[] = [];
    let finalAsks: OrderBookLevel[] = [];
    maxCumulativeTotal = 0; maxIndividualQuantity = 0;

    if (isAggregatedView) {
        const aggregatedBidsMap = new Map<string, number>();
        const aggregatedAsksMap = new Map<string, number>();
        activeConnections.forEach(conn => {
            if (conn.status === 'connected' && (!conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                conn.bids.forEach((quantity, priceStr) => aggregatedBidsMap.set(priceStr, (aggregatedBidsMap.get(priceStr) || 0) + quantity));
                conn.asks.forEach((quantity, priceStr) => aggregatedAsksMap.set(priceStr, (aggregatedAsksMap.get(priceStr) || 0) + quantity));
            }
        });
        const sortedAggregatedBids = mapToSortedEntries(aggregatedBidsMap, true);
        const sortedAggregatedAsks = mapToSortedEntries(aggregatedAsksMap, false);
        finalBids = calculateCumulative(sortedAggregatedBids);
        finalAsks = calculateCumulative(sortedAggregatedAsks);
        const maxBidTotal = finalBids.length > 0 ? finalBids[finalBids.length - 1].total : 0;
        const maxAskTotal = finalAsks.length > 0 ? finalAsks[finalAsks.length - 1].total : 0;
        maxCumulativeTotal = Math.max(maxBidTotal, maxAskTotal, 1);
        updateSpread(sortedAggregatedBids, sortedAggregatedAsks);
    } else {
        const allIndividualBids: OrderBookLevel[] = [];
        const allIndividualAsks: OrderBookLevel[] = [];
        activeConnections.forEach(conn => {
            if (conn.status === 'connected' && (!conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                const exBids = mapToSortedEntries(conn.bids, true, conn.config.id);
                const exAsks = mapToSortedEntries(conn.asks, false, conn.config.id);
                calculateCumulative(exBids).forEach(level => allIndividualBids.push(level));
                calculateCumulative(exAsks).forEach(level => allIndividualAsks.push(level));
                exBids.forEach(b => maxIndividualQuantity = Math.max(maxIndividualQuantity, b.quantity));
                exAsks.forEach(a => maxIndividualQuantity = Math.max(maxIndividualQuantity, a.quantity));
            }
        });
        finalBids = allIndividualBids.sort((a, b) => b.price - a.price);
        finalAsks = allIndividualAsks.sort((a, b) => a.price - b.price);
        maxIndividualQuantity = Math.max(maxIndividualQuantity, 1);
        // For spread in individual view, use the actual best bid/ask across all displayed individual orders
        const overallBestBids: OrderBookEntry[] = [];
        if (finalBids.length > 0) overallBestBids.push({price: finalBids[0].price, quantity: finalBids[0].quantity});
        const overallBestAsks: OrderBookEntry[] = [];
        if (finalAsks.length > 0) overallBestAsks.push({price: finalAsks[0].price, quantity: finalAsks[0].quantity});
        updateSpread(overallBestBids, overallBestAsks);
    }
    updateOrderBookUI(finalBids, finalAsks);
}

function calculateCumulative(levels: OrderBookEntry[]): OrderBookLevel[] {
    let cumulativeQuantity = 0; const result: OrderBookLevel[] = [];
    for (const level of levels) {
        cumulativeQuantity += level.quantity;
        result.push({ ...level, total: cumulativeQuantity });
    }
    return result;
}

function clearOrderBookDisplay() {
    bidsList.innerHTML = ''; asksList.innerHTML = '';
    spreadValueEl.textContent = '-'; spreadPercentageEl.textContent = '-';
    maxCumulativeTotal = 0; maxIndividualQuantity = 0;
}

function updateOrderBookUI(bids: OrderBookLevel[], asks: OrderBookLevel[]) {
    renderLevels(bidsList, bids, 'bid', true);
    renderLevels(asksList, asks, 'ask', false);
}

function renderLevels(listElement: HTMLUListElement, levels: OrderBookLevel[], type: 'bid' | 'ask', isBidsLayout: boolean) {
    listElement.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const displayLevels = levels.slice(0, isAggregatedView ? 20 : 50);

    displayLevels.forEach(level => {
        const listItem = document.createElement('li');
        listItem.classList.add('order-book-row', `order-book-row-${type}`);
        listItem.setAttribute('role', 'row');
        let depthPercentage = isAggregatedView ? (level.total / maxCumulativeTotal) * 100 : (level.quantity / maxIndividualQuantity) * 100;
        const backgroundDiv = document.createElement('div');
        backgroundDiv.classList.add('depth-bar');
        backgroundDiv.style.width = `${Math.min(depthPercentage, 100)}%`;
        const priceSpan = document.createElement('span');
        priceSpan.classList.add('price'); priceSpan.setAttribute('role', 'cell');
        if (!isAggregatedView && level.exchangeId) {
            const exchangeTagSpan = document.createElement('span');
            exchangeTagSpan.classList.add('exchange-tag');
            exchangeTagSpan.textContent = EXCHANGE_TAGS[level.exchangeId] || level.exchangeId.substring(0,3).toUpperCase();
            exchangeTagSpan.style.backgroundColor = EXCHANGE_COLORS[level.exchangeId] || EXCHANGE_COLORS.default;
            priceSpan.appendChild(exchangeTagSpan);
        }
        priceSpan.appendChild(document.createTextNode(level.price.toFixed(getDecimalPlaces(level.price))));
        const quantitySpan = document.createElement('span');
        quantitySpan.classList.add('quantity'); quantitySpan.setAttribute('role', 'cell');
        quantitySpan.textContent = level.quantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
        const totalSpan = document.createElement('span');
        totalSpan.classList.add('total'); totalSpan.setAttribute('role', 'cell');
        totalSpan.textContent = level.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
        if (isBidsLayout) { listItem.appendChild(totalSpan); listItem.appendChild(quantitySpan); listItem.appendChild(priceSpan); }
        else { listItem.appendChild(priceSpan); listItem.appendChild(quantitySpan); listItem.appendChild(totalSpan); }
        listItem.appendChild(backgroundDiv);
        fragment.appendChild(listItem);
    });
    listElement.appendChild(fragment);
}

function updateSpread(bids: OrderBookEntry[], asks: OrderBookEntry[]) {
    if (bids.length > 0 && asks.length > 0) {
        const bestBid = bids[0].price; 
        const bestAsk = asks[0].price;
        const spread = bestAsk - bestBid;
        
        // Handle invalid prices (zero prices)
        if (bestAsk === 0 || bestBid === 0) {
            spreadValueEl.textContent = '-';
            spreadPercentageEl.textContent = '-'; 
            return;
        }
        
        const spreadPercentage = Math.abs(spread / bestAsk) * 100;
        
        // Check for crossed market (ARBITRAGE OPPORTUNITY!)
        if (spread < 0) {
            // CROSSED MARKET - BID > ASK = PROFIT OPPORTUNITY!
            const profit = Math.abs(spread);
            spreadValueEl.textContent = `🚀 +${profit.toFixed(getDecimalPlaces(bestAsk))} PROFIT!`;
            spreadValueEl.style.color = '#00ff88';
            spreadValueEl.style.fontWeight = 'bold';
            spreadValueEl.style.animation = 'pulse 1s infinite';
            spreadPercentageEl.textContent = `💰 ${spreadPercentage.toFixed(2)}% ARBI!`;
            spreadPercentageEl.style.color = '#00ff88';
            spreadPercentageEl.style.fontWeight = 'bold';
        } else {
            // Normal spread
            spreadValueEl.textContent = spread.toFixed(getDecimalPlaces(bestAsk));
            spreadValueEl.style.color = '';
            spreadValueEl.style.fontWeight = '';
            spreadValueEl.style.animation = '';
            spreadPercentageEl.textContent = `${spreadPercentage.toFixed(2)}%`;
            spreadPercentageEl.style.color = '';
            spreadPercentageEl.style.fontWeight = '';
        }
    } else { 
        spreadValueEl.textContent = '-'; 
        spreadPercentageEl.textContent = '-'; 
    }
}

function updateOverallConnectionStatus() {
    let summaryHtml = '';
    SUPPORTED_EXCHANGES_ORDER_WITH_DEX.forEach(exchangeId => {
        const config = SUPPORTED_EXCHANGES_WITH_DEX[exchangeId];
        const conn = activeConnections.get(exchangeId);
        let statusText = 'N/A'; let statusClass = 'status-disabled';
        if (selectedExchanges.has(exchangeId)) {
            statusClass = 'status-disconnected';
            if (conn) {
                statusText = conn.status.charAt(0).toUpperCase() + conn.status.slice(1);
                if (conn.status === 'fetching_aux_data') {
                    statusText = "Syncing Stats..."; statusClass = 'status-connecting';
                } else if(conn.config.needsSnapshotFlag && conn.status === 'connected' && !conn.snapshotReceived) {
                    statusText = "Snapshot..."; statusClass = 'status-connecting';
                } else {
                    switch (conn.status) {
                        case 'connected': statusClass = 'status-connected'; break;
                        case 'connecting': statusClass = 'status-connecting'; break;
                        case 'error': statusClass = 'status-error'; break;
                        case 'closing': statusClass = 'status-disconnected'; statusText = 'Closing'; break;
                        case 'disconnected': statusClass = 'status-disconnected'; break;
                    }
                }
            } else { statusText = 'Pending'; statusClass = 'status-connecting'; }
        } else { statusText = 'Disabled'; statusClass = 'status-disabled'; }
        summaryHtml += `<span class="connection-item ${statusClass}" title="${config.name} - ${statusText}">${config.name}: ${statusText}</span>`;
    });
    connectionStatusSummaryEl.innerHTML = summaryHtml;
    updateSidebarContent();
}

// --- Chart Logic ---
async function initChart() {
    // 1. Clear previous chart instance and series if they exist
    if (klineSeries && typeof klineSeries.setData === 'function') {
        try {
            klineSeries.setData([]);
        } catch (e) {
            console.warn("Chart: Minor error clearing old klineSeries data:", e);
        }
    }
    klineSeries = null;

    if (chart && typeof chart.remove === 'function') {
        try {
            chart.remove();
        } catch (e) {
            console.warn("Chart: Minor error removing old chart instance:", e);
        }
    }
    chart = null;

    // 2. Validate DOM element and Library
    if (!chartContainerEl) {
        console.error("Chart Error: chartContainerEl is not found in the DOM.");
        return false;
    }
    console.log("Chart: chartContainerEl dimensions:", chartContainerEl.clientWidth, "x", chartContainerEl.clientHeight);
    console.log("Chart: chartContainerEl:", chartContainerEl);
    console.log("Chart: chartContainerEl parent:", chartContainerEl.parentElement);

    // Wait for LightweightCharts library to load
    const libraryLoaded = await waitForLightweightCharts();
    if (!libraryLoaded) {
        console.error("Chart Error: LightweightCharts library failed to load");
        return false;
    }

    // 3. Create new chart and series
    try {
        console.log("Chart: LightweightCharts object:", LightweightCharts);
        console.log("Chart: Available methods:", Object.keys(LightweightCharts));
        console.log("Chart: createChart function:", typeof LightweightCharts.createChart);
        
        chart = LightweightCharts.createChart(chartContainerEl, {
            width: chartContainerEl.clientWidth,
            height: chartContainerEl.clientHeight,
            layout: {
                background: { type: LightweightCharts.ColorType.Solid, color: '#1e1e1e' },
                textColor: '#e0e0e0',
            },
            grid: {
                vertLines: { color: '#2a2a2a' },
                horzLines: { color: '#2a2a2a' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#444',
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
        });

        console.log("Chart: createChart returned:", chart);
        console.log("Chart: chart type:", typeof chart);
        if (chart) {
            console.log("Chart: chart methods:", Object.keys(chart));
            console.log("Chart: addCandlestickSeries type:", typeof chart.addCandlestickSeries);
            console.log("Chart: remove type:", typeof chart.remove);
            console.log("Chart: timeScale type:", typeof chart.timeScale);
        }

        if (!chart || typeof chart.addCandlestickSeries !== 'function' || typeof chart.remove !== 'function' || typeof chart.timeScale !== 'function') {
            console.error("Chart Error: LightweightCharts.createChart did not return a fully valid chart object.");
            if (chart && typeof chart.remove === 'function') { // Attempt to clean up if partially formed
                 try { chart.remove(); } catch (cleanupError) { console.warn("Chart: Error during cleanup of partially formed chart:", cleanupError); }
            }
            chart = null;
            return false;
        }

        klineSeries = chart.addCandlestickSeries({
            upColor: '#26de81',
            downColor: '#ff4757',
            borderDownColor: '#ff4757',
            borderUpColor: '#26de81',
            wickDownColor: '#ff4757',
            wickUpColor: '#26de81',
        });

        if (!klineSeries || typeof klineSeries.setData !== 'function' || typeof klineSeries.update !== 'function') {
            console.error("Chart Error: chart.addCandlestickSeries did not return a valid series object.");
            klineSeries = null;
            if (chart && typeof chart.remove === 'function') { // Clean up chart if series creation failed
                try { chart.remove(); } catch (cleanupError) { console.warn("Chart: Error during cleanup after failed series creation:", cleanupError); }
            }
            chart = null;
            return false;
        }

        console.log("Chart: Successfully initialized chart and candlestick series");
        return true;

    } catch (e) {
        console.error("Chart Error: Exception during chart/series initialization:", e);
        if (chart && typeof chart.remove === 'function') {
            try { chart.remove(); } catch (cleanupError) { console.warn("Chart: Error during cleanup after exception:", cleanupError); }
        }
        chart = null;
        klineSeries = null;
        return false;
    }
}


async function updateChartForAssetAndInterval(asset: string, interval: string) {
    if (!chart || !klineSeries) {
        const success = await initChart(); // Attempt to initialize if not already
        if (!success || !klineSeries) {
            console.warn(`Chart: KlineSeries not available for ${asset} (${interval}). Chart setup failed.`);
            return;
        }
    }


    currentChartInterval = interval;
    // Update active button style
    document.querySelectorAll('#chart-timeframe-selector button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-interval') === interval);
    });

    try {
        klineSeries.setData([]); // Clear old data
    } catch (e) {
        console.error("Chart: Error clearing klineSeries data:", e);
        // Attempt to re-initialize chart as series might be in a bad state
        const success = await initChart();
        if(!success || !klineSeries) {
            console.error("Chart: Failed to re-initialize chart after series error.");
            return;
        }
    }


    // Fetch historical data (using Binance as source for now)
    const historicalData = await fetchBinanceHistoricalKlines(asset, interval);
    console.log(`Chart: Historical data length for ${asset} (${interval}): ${historicalData.length}. First item:`, historicalData[0]);

    if (historicalData.length > 0) {
        try {
            klineSeries.setData(historicalData);
            if (chart && typeof chart.timeScale === 'function' && typeof chart.timeScale().fitContent === 'function') {
                 chart.timeScale().fitContent();
            }
        } catch (e) {
            console.error("Chart: Error setting historical data on klineSeries:", e);
            await initChart(); // Re-initialize if setting data fails
        }
    } else {
        console.warn(`No historical kline data for ${asset} (${interval})`);
    }

    // Subscribe to real-time updates
    subscribeToBinanceKlineUpdates(asset, interval);
}

function subscribeToBinanceKlineUpdates(asset: string, interval: string) {
    if (klineWebSocket) {
        klineWebSocket.onmessage = null; klineWebSocket.onopen = null; klineWebSocket.onerror = null; klineWebSocket.onclose = null;
        klineWebSocket.close();
        klineWebSocket = null;
    }

    const formattedSymbol = asset.toLowerCase();
    const wsUrl = `wss://fstream.binance.com/ws/${formattedSymbol}@kline_${interval}`;
    console.log(`Chart: Attempting to connect to kline WebSocket: ${wsUrl}`);
    klineWebSocket = new WebSocket(wsUrl);

    klineWebSocket.onopen = () => {
        console.log(`Chart: Subscribed to Binance kline stream for ${asset} (${interval})`);
    };

    klineWebSocket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data as string);
            if (message.e === 'kline') {
                const k = message.k;
                const candleData: KLineData = {
                    time: k.t / 1000, // Binance provides ms timestamps
                    open: parseFloat(k.o),
                    high: parseFloat(k.h),
                    low: parseFloat(k.l),
                    close: parseFloat(k.c),
                    volume: parseFloat(k.v),
                };
                if (klineSeries && typeof klineSeries.update === 'function') {
                     klineSeries.update(candleData);
                } else if (!klineSeries) {
                    console.warn("Chart: klineSeries not available for update, attempting re-init.");
                    // This might happen if initChart failed previously or is in progress from another call
                    // A more sophisticated state management might be needed for very rapid calls
                    updateChartForAssetAndInterval(selectedAsset, currentChartInterval);
                }
            }
        } catch (error) {
            console.error('Chart: Error processing kline update:', error, event.data);
        }
    };

    klineWebSocket.onerror = (error) => {
        console.error(`Chart: Kline WebSocket error for ${asset} (${interval}):`, error);
    };

    klineWebSocket.onclose = () => {
        console.log(`Chart: Kline WebSocket closed for ${asset} (${interval})`);
        // Optionally, attempt to reconnect if not deliberately closed
        // For example, if document is visible and this was not a manual close
        if (!document.hidden && selectedAsset === asset && currentChartInterval === interval) {
            console.log(`Chart: Attempting to reconnect kline WebSocket for ${asset} (${interval}) after close.`);
            // Add a small delay to prevent rapid reconnection loops on persistent errors
            setTimeout(() => {
                if (selectedAsset === asset && currentChartInterval === interval) { // Check again before reconnecting
                     subscribeToBinanceKlineUpdates(asset, interval);
                }
            }, 5000);
        }
    };
}


// --- Event Listeners & Initialization ---
assetSelect.addEventListener('change', async (event) => {
    const newAsset = (event.target as HTMLSelectElement).value;
    if (newAsset !== selectedAsset) {
        selectedAsset = newAsset;
        reconnectToAllSelectedExchanges(newAsset);
        // Update chart for new asset
        if (chart && klineSeries) {
            await updateChartForAssetAndInterval(selectedAsset, currentChartInterval);
        }
    }
});

// Add event listener for both CEX and DEX selectors
exchangeSelectorDiv.addEventListener('change', (event) => {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.type === 'checkbox' && checkbox.name === 'exchange') {
        const exchangeId = checkbox.value;
        if (checkbox.checked) {
            selectedExchanges.add(exchangeId);
            connectToExchange(exchangeId, selectedAsset);
        } else {
            selectedExchanges.delete(exchangeId);
            disconnectFromExchange(exchangeId);
        }
        updateOverallConnectionStatus();
    }
});

// Add event listener for DEX selector
dexSelectorDiv.addEventListener('change', (event) => {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.type === 'checkbox' && checkbox.name === 'exchange') {
        const exchangeId = checkbox.value;
        if (checkbox.checked) {
            selectedExchanges.add(exchangeId);
            connectToExchange(exchangeId, selectedAsset);
        } else {
            selectedExchanges.delete(exchangeId);
            disconnectFromExchange(exchangeId);
        }
        updateOverallConnectionStatus();
    }
});

viewModeToggle.addEventListener('change', (event) => {
    isAggregatedView = (event.target as HTMLInputElement).checked;
    viewModeLabel.textContent = isAggregatedView ? 'Aggregated' : 'Individual';
    bidsTitle.textContent = `BIDS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;
    asksTitle.textContent = `ASKS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;
    clearOrderBookDisplay();
    aggregateAndRenderAll();
});

toggleSidebarBtn.addEventListener('click', toggleSidebar);
closeSidebarBtn.addEventListener('click', toggleSidebar);

refreshSidebarStatsBtn.addEventListener('click', () => {
    console.log("Sidebar: Manual refresh stats triggered.");
    selectedExchanges.forEach(exchangeId => {
        const conn = activeConnections.get(exchangeId);
        // Only fetch if currently connected or was attempting to connect (might have failed aux data fetch before)
        if (conn && (conn.status === 'connected' || conn.status === 'fetching_aux_data' || conn.status === 'error')) {
            console.log(`Sidebar Refresh: Fetching aux data for ${conn.config.name}`);
            fetchAuxiliaryDataForExchange(exchangeId, conn.config.formatSymbol(selectedAsset));
        }
    });
});


chartTimeframeSelectorEl.addEventListener('click', (event) => {
    const target = event.target as HTMLButtonElement;
    if (target.tagName === 'BUTTON' && target.dataset.interval) {
        const newInterval = target.dataset.interval;
        if (newInterval !== currentChartInterval) {
            updateChartForAssetAndInterval(selectedAsset, newInterval);
        }
    }
});


document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
        console.log("Tab became visible. Checking connections and chart.");
        // Reconnect order book WebSockets if needed
        selectedExchanges.forEach(exchangeId => {
            const conn = activeConnections.get(exchangeId);
            if (!conn || conn.status === 'error' || conn.status === 'disconnected' || (conn.ws && conn.ws.readyState === WebSocket.CLOSED)) {
                 if (conn) {
                    console.log(`${conn.config.name}: Reconnecting due to visibility change (was ${conn.status}).`);
                    disconnectFromExchange(exchangeId); // Clean previous
                    setTimeout(() => connectToExchange(exchangeId, selectedAsset), 250 * (activeConnections.size + 1)); // Stagger reconnections
                 } else {
                    console.log(`Connecting ${exchangeId} due to visibility change (no prior connection state).`);
                    connectToExchange(exchangeId, selectedAsset);
                 }
            } else if (conn && conn.status === 'connected' && !conn.auxDataFetched) {
                console.log(`${conn.config.name}: Fetching aux data on visibility change.`);
                fetchAuxiliaryDataForExchange(exchangeId, conn.config.formatSymbol(selectedAsset));
            }
        });
        aggregateAndRenderAll(); // Refresh order book display
        updateSidebarContent(); // Refresh sidebar content

        // Reconnect chart WebSocket if needed
        if (selectedAsset && currentChartInterval) {
            if (!klineWebSocket || klineWebSocket.readyState === WebSocket.CLOSED || klineWebSocket.readyState === WebSocket.CLOSING) {
                console.log("Chart: Re-initializing chart and kline WebSocket due to visibility change.");
                await updateChartForAssetAndInterval(selectedAsset, currentChartInterval);
            }
        }
    } else {
      console.log("Tab became hidden.");
      // Optional: Could disconnect klineWebSocket on tab hidden to save resources if desired,
      // but Binance might disconnect it anyway after some inactivity.
      // if (klineWebSocket && klineWebSocket.readyState === WebSocket.OPEN) {
      //   klineWebSocket.close();
      //   console.log("Chart: Kline WebSocket closed due to page hidden.");
      // }
    }
});

// Handle chart resize
window.addEventListener('resize', () => {
    if (chart && chartContainerEl && typeof chart.resize === 'function') {
        chart.resize(chartContainerEl.clientWidth, chartContainerEl.clientHeight);
    }
});


async function initializeApp() {
    // Initialize CEX checkboxes
    const cexCheckboxes = exchangeSelectorDiv.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="exchange"]');
    cexCheckboxes.forEach(cb => cb.checked = selectedExchanges.has(cb.value));
    
    // Initialize DEX checkboxes
    const dexCheckboxes = dexSelectorDiv.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="exchange"]');
    dexCheckboxes.forEach(cb => cb.checked = selectedExchanges.has(cb.value));
    viewModeToggle.checked = isAggregatedView;
    viewModeLabel.textContent = isAggregatedView ? 'Aggregated' : 'Individual';
    bidsTitle.textContent = `BIDS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;
    asksTitle.textContent = `ASKS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;

    selectedExchanges.forEach(exchangeId => connectToExchange(exchangeId, selectedAsset));
    updateOverallConnectionStatus(); // This will also trigger an initial sidebar update

    // Initialize chart with default asset and interval
    const chartSuccess = await initChart(); // Initial chart setup
    if (chartSuccess && klineSeries) { // Only proceed if initChart was successful
        updateChartForAssetAndInterval(selectedAsset, currentChartInterval);
    } else {
        console.warn("Initial chart setup failed, will retry when chart is needed.");
    }
}

// --- DEX-specific helper functions ---
async function fetchDEXMarketData(exchangeId: string, symbol: string) {
    // This would fetch additional market data like TVL, funding rates, etc.
    // Implementation depends on each DEX's API
    console.log(`Fetching DEX market data for ${exchangeId}: ${symbol}`);
    
    switch (exchangeId) {
        case 'dydx':
            return await fetchDydxMarketData(symbol);
        case 'gmx':
            return await fetchGMXMarketData(symbol);
        case 'drift':
            return await fetchDriftMarketData(symbol);
        case 'mango':
            return await fetchMangoMarketData(symbol);
        default:
            return null;
    }
}

async function fetchDydxMarketData(symbol: string) {
    try {
        const response = await fetch(`https://api.dydx.exchange/v3/markets/${symbol}`);
        const data = await response.json();
        return {
            volume24h: data.market?.volume24H,
            openInterest: data.market?.openInterest,
            fundingRate: data.market?.nextFundingRate,
            indexPrice: data.market?.indexPrice
        };
    } catch (error) {
        console.error('Error fetching dYdX market data:', error);
        return null;
    }
}

async function fetchGMXMarketData(symbol: string) {
    try {
        // GMX uses different API structure
        const response = await fetch(`https://api.gmx.io/v2/stats/markets`);
        const data = await response.json();
        const marketData = data.find((m: any) => m.symbol === symbol);
        return {
            volume24h: marketData?.volume24h,
            openInterest: marketData?.openInterest,
            fundingRate: marketData?.fundingRate,
            indexPrice: marketData?.indexPrice
        };
    } catch (error) {
        console.error('Error fetching GMX market data:', error);
        return null;
    }
}

async function fetchDriftMarketData(symbol: string) {
    try {
        const response = await fetch(`https://api.drift.trade/v1/markets/${symbol}`);
        const data = await response.json();
        return {
            volume24h: data.volume24h,
            openInterest: data.openInterest,
            fundingRate: data.fundingRate,
            indexPrice: data.indexPrice
        };
    } catch (error) {
        console.error('Error fetching Drift market data:', error);
        return null;
    }
}

async function fetchMangoMarketData(symbol: string) {
    try {
        const response = await fetch(`https://api.mngo.cloud/v4/stats/perp-market/${symbol}`);
        const data = await response.json();
        return {
            volume24h: data.volume24h,
            openInterest: data.openInterest,
            fundingRate: data.fundingRate,
            indexPrice: data.indexPrice
        };
    } catch (error) {
        console.error('Error fetching Mango market data:', error);
        return null;
    }
}

initializeApp();

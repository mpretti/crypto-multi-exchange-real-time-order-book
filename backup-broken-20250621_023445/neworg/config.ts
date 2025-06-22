
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExchangeConfig, FeeInfo, FundingRateInfo, VolumeInfo } from './types';
import { fetchBinanceFeeInfo, fetchBinanceFundingRateInfo, fetchBinanceVolumeInfo } from './api';
import { applyDepthSlice, getDecimalPlaces } from './utils';


const KRAKEN_COMMON_SYMBOL_TO_PRODUCT_ID: Record<string, string> = {
    'BTCUSDT': 'PF_BTCUSDT',
    'ETHUSDT': 'PF_ETHUSDT',
    'SOLUSDT': 'PF_SOLUSDT',
    'DOGEUSDT': 'PF_DOGEUSDT',
    'ADAUSDT': 'PF_ADAUSDT',
    'XRPUSDT': 'PF_XRPUSDT',
    'LINKUSDT': 'PF_LINKUSDT',
};

export const SUPPORTED_EXCHANGES: Record<string, ExchangeConfig> = {
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
                } else if (data.feed === 'book_ui_1') { 
                    const tempBids = new Map<string, number>();
                    (data.bids || []).forEach((bid: { price: number, qty: number }) => tempBids.set(bid.price.toString(), bid.qty));
                    newBids = tempBids;

                    const tempAsks = new Map<string, number>();
                    (data.asks || []).forEach((ask: { price: number, qty: number }) => tempAsks.set(ask.price.toString(), ask.qty));
                    newAsks = tempAsks;
                    isSnapshot = true; 
                }
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot, checksum: data.book_checksum };
            }
            return null;
        }
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
    },
    uniswap_simulated: {
        id: 'uniswap_simulated',
        name: 'Uniswap (Sim.)',
        formatSymbol: (commonSymbol) => commonSymbol.toUpperCase(), // e.g., ETHUSDT
        getWebSocketUrl: (formattedSymbol) => `wss://simulated.dex.feed/${formattedSymbol}`, // Dummy URL, not actually used
        parseMessage: (data, _currentBids, _currentAsks, _snapshotReceived) => {
            // This parser expects data to be the snapshot itself, generated in connectToExchange
            if (data.type === 'snapshot' && data.bids && data.asks) {
                const newBids = new Map<string, number>();
                data.bids.forEach((bid: [string, string]) => newBids.set(bid[0], parseFloat(bid[1])));
                const newAsks = new Map<string, number>();
                data.asks.forEach((ask: [string, string]) => newAsks.set(ask[0], parseFloat(ask[1])));
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot: true };
            }
            return null;
        },
        needsSnapshotFlag: false, // It will always be a "snapshot" provided by the simulation
        sliceDepth: 10, // Simulated, smaller depth
        fetchFeeInfo: async (formattedSymbol: string): Promise<FeeInfo | null> => {
            console.log(`Uniswap (Sim.): Simulating fee info fetch for ${formattedSymbol}`);
            return { makerRate: '0.3%', takerRate: '0.3%', raw: { simulated: true, note: "Typical Uniswap V3 pool fee" } };
        },
        fetchFundingRateInfo: async (_formattedSymbol: string): Promise<FundingRateInfo | null> => {
            // Funding rates are not applicable to spot AMMs
            return { rate: 'N/A', nextFundingTime: 'N/A', raw: { simulated: true, note: "Funding rates not applicable for spot AMM." } };
        },
        fetchVolumeInfo: async (formattedSymbol: string): Promise<VolumeInfo | null> => {
            console.log(`Uniswap (Sim.): Simulating volume info fetch for ${formattedSymbol}`);
            let assetVol = 100;
            let usdVol = 2000000; // Default, e.g. for BTC
            const upperSymbol = formattedSymbol.toUpperCase();

            if (upperSymbol.includes('ETH')) { assetVol = 500; usdVol = 10000000; }
            else if (upperSymbol.includes('SOL')) { assetVol = 10000; usdVol = 1500000; }
            else if (upperSymbol.includes('DOGE')) { assetVol = 5000000; usdVol = 750000; }
            else if (upperSymbol.includes('ADA')) { assetVol = 2000000; usdVol = 1000000; }
            else if (upperSymbol.includes('LINK')) { assetVol = 50000; usdVol = 700000; }
            else if (upperSymbol.includes('XRP')) { assetVol = 3000000; usdVol = 1500000; }

            return {
                assetVolume: `${assetVol.toLocaleString()} (sim.)`,
                usdVolume: `${usdVol.toLocaleString()} (sim.)`,
                raw: { simulated: true, symbol: formattedSymbol }
            };
        },
    }
};

export const SUPPORTED_EXCHANGES_ORDER = ['binance', 'bybit', 'okx', 'kraken', 'bitget', 'uniswap_simulated'];

export const EXCHANGE_COLORS: Record<string, string> = {
    binance: '#F0B90B',
    bybit: '#FFA500',
    okx: '#007bff',
    kraken: '#5D40C4',
    bitget: '#00CED1',
    uniswap_simulated: '#FF007A',
    default: '#777777'
};

export const EXCHANGE_TAGS: Record<string, string> = {
    binance: 'BNB',
    bybit: 'BYB',
    okx: 'OKX',
    kraken: 'KRK',
    bitget: 'BGT',
    uniswap_simulated: 'UNI',
};

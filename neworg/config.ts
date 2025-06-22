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
    // REMOVED: uniswap_simulated - NO SIMULATION DATA ALLOWED
};

export const SUPPORTED_EXCHANGES_ORDER = ['binance', 'bybit', 'okx', 'kraken', 'bitget'];

export const EXCHANGE_COLORS: Record<string, string> = {
    binance: '#F0B90B',
    bybit: '#FFA500',
    okx: '#007bff',
    kraken: '#5D40C4',
    bitget: '#00CED1',
    default: '#777777'
};

export const EXCHANGE_TAGS: Record<string, string> = {
    binance: 'BNB',
    bybit: 'BYB',
    okx: 'OKX',
    kraken: 'KRK',
    bitget: 'BGT',
};

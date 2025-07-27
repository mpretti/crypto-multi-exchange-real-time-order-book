/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExchangeConfig, FeeInfo, FundingRateInfo, VolumeInfo } from './types';
import { fetchBinanceFeeInfo, fetchBinanceFundingRateInfo, fetchBinanceVolumeInfo } from './api.ts';
import { applyDepthSlice, getDecimalPlaces } from './utils.ts';


const KRAKEN_COMMON_SYMBOL_TO_PRODUCT_ID: Record<string, string> = {
    'BTCUSDT': 'PF_XBTUSD',
    'ETHUSDT': 'PF_ETHUSD',
    'SOLUSDT': 'PF_SOLUSD',
    'DOGEUSDT': 'PF_DOGEUSD',
    'ADAUSDT': 'PF_ADAUSD',
    'XRPUSDT': 'PF_XRPUSD',
    'LINKUSDT': 'PF_LINKUSD',
};

export const SUPPORTED_EXCHANGES: Record<string, ExchangeConfig> = {
    binance: {
        id: 'binance',
        name: 'Binance',
        formatSymbol: (commonSymbol) => commonSymbol.toLowerCase(),
        getWebSocketUrl: (formattedSymbol) => `wss://stream.binance.com:9443/ws/${formattedSymbol}@depth20@100ms`,
        parseMessage: (data) => {
            if (data.lastUpdateId && data.bids && data.asks) {
                const newBids = new Map<string, number>();
                data.bids.forEach((bid: [string, string]) => newBids.set(bid[0], parseFloat(bid[1])));
                const newAsks = new Map<string, number>();
                data.asks.forEach((ask: [string, string]) => newAsks.set(ask[0], parseFloat(ask[1])));
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot: true, lastUpdateId: data.lastUpdateId };
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
        getWebSocketUrl: () => 'wss://stream.bybit.com/v5/public/spot',
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
        formatSymbol: (commonSymbol) => `${commonSymbol.replace('USDT', '')}-USDT`,
        getWebSocketUrl: () => 'wss://ws.okx.com:8443/ws/v5/public',
        getSubscribeMessage: (formattedSymbol) => ({ op: 'subscribe', args: [{ channel: 'books', instId: formattedSymbol }] }),
        getUnsubscribeMessage: (formattedSymbol) => ({ op: 'unsubscribe', args: [{ channel: 'books', instId: formattedSymbol }] }),
        pingIntervalMs: 25000,
        pingPayload: () => 'ping',
        needsSnapshotFlag: false,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks) => {
            if (data.event === 'subscribe' || data.event === 'unsubscribe') {
                console.log(`OKX: ${data.event} success for arg:`, data.arg); return null;
            }
            if (data.arg?.channel === 'books' && Array.isArray(data.data) && data.data.length > 0) {
                const bookData = data.data[0];
                let newBids = new Map(currentBids);
                let newAsks = new Map(currentAsks);
                
                if (bookData.bids) {
                    bookData.bids.forEach((bid: [string, string]) => {
                        const quantity = parseFloat(bid[1]);
                        if (quantity === 0) newBids.delete(bid[0]); else newBids.set(bid[0], quantity);
                    });
                }
                if (bookData.asks) {
                    bookData.asks.forEach((ask: [string, string]) => {
                        const quantity = parseFloat(ask[1]);
                        if (quantity === 0) newAsks.delete(ask[0]); else newAsks.set(ask[0], quantity);
                    });
                }
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot: false };
            }
            return null;
        },
    },
    kraken: {
        id: 'kraken',
        name: 'Kraken',
        formatSymbol: (commonSymbol) => commonSymbol.replace('/', ''),
        getWebSocketUrl: () => 'wss://ws.kraken.com',
        getSubscribeMessage: (formattedSymbol) => ({ event: 'subscribe', pair: [formattedSymbol.replace('USDT', '/USDT')], subscription: { name: 'book' } }),
        getUnsubscribeMessage: (formattedSymbol) => ({ event: 'unsubscribe', pair: [formattedSymbol.replace('USDT', '/USDT')], subscription: { name: 'book' } }),
        needsSnapshotFlag: false,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks) => {
            if (Array.isArray(data) && data.length >= 4) {
                const [channelID, bookData, channelName, pair] = data;
                if (channelName === 'book-10') {
                    let newBids = new Map(currentBids);
                    let newAsks = new Map(currentAsks);
                    let isSnapshot = false;

                    if (bookData.bs) {
                        isSnapshot = true;
                        newBids = new Map<string, number>();
                        bookData.bs.forEach((bid: [string, string]) => newBids.set(bid[0], parseFloat(bid[1])));
                    }
                    if (bookData.as) {
                        if (!isSnapshot) isSnapshot = true;
                        newAsks = new Map<string, number>();
                        bookData.as.forEach((ask: [string, string]) => newAsks.set(ask[0], parseFloat(ask[1])));
                    }
                    if (bookData.b) {
                        bookData.b.forEach((bid: [string, string]) => {
                            const quantity = parseFloat(bid[1]);
                            if (quantity === 0) newBids.delete(bid[0]); else newBids.set(bid[0], quantity);
                        });
                    }
                    if (bookData.a) {
                        bookData.a.forEach((ask: [string, string]) => {
                            const quantity = parseFloat(ask[1]);
                            if (quantity === 0) newAsks.delete(ask[0]); else newAsks.set(ask[0], quantity);
                        });
                    }
                    return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot };
                }
            }
            return null;
        },
    },
    bitget: {
        id: 'bitget',
        name: 'Bitget',
        formatSymbol: (commonSymbol) => commonSymbol.toUpperCase(),
        getWebSocketUrl: () => 'wss://ws.bitget.com/spot/v1/stream',
        getSubscribeMessage: (formattedSymbol) => ({ op: 'subscribe', args: [{ instType: 'SP', channel: 'books', instId: formattedSymbol }] }),
        getUnsubscribeMessage: (formattedSymbol) => ({ op: 'unsubscribe', args: [{ instType: 'SP', channel: 'books', instId: formattedSymbol }] }),
        needsSnapshotFlag: false,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks) => {
            if (data.event === 'subscribe' || data.event === 'unsubscribe') {
                console.log(`Bitget: ${data.event} success`); return null;
            }
            if (data.arg?.channel === 'books' && data.data && data.data.length > 0) {
                const bookData = data.data[0];
                let newBids = new Map(currentBids);
                let newAsks = new Map(currentAsks);
                
                if (bookData.bids) {
                    bookData.bids.forEach((bid: [string, string]) => {
                        const quantity = parseFloat(bid[1]);
                        if (quantity === 0) newBids.delete(bid[0]); else newBids.set(bid[0], quantity);
                    });
                }
                if (bookData.asks) {
                    bookData.asks.forEach((ask: [string, string]) => {
                        const quantity = parseFloat(ask[1]);
                        if (quantity === 0) newAsks.delete(ask[0]); else newAsks.set(ask[0], quantity);
                    });
                }
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot: bookData.action === 'snapshot' };
            }
            return null;
        },
    },
    gate: {
        id: 'gate',
        name: 'Gate.io',
        formatSymbol: (commonSymbol) => commonSymbol.replace('USDT', '_USDT'),
        getWebSocketUrl: () => 'wss://api.gateio.ws/ws/v4/',
        getSubscribeMessage: (formattedSymbol) => ({ time: Date.now(), channel: 'spot.order_book', event: 'subscribe', payload: [formattedSymbol, '20', '1000ms'] }),
        getUnsubscribeMessage: (formattedSymbol) => ({ time: Date.now(), channel: 'spot.order_book', event: 'unsubscribe', payload: [formattedSymbol, '20', '1000ms'] }),
        needsSnapshotFlag: false,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks) => {
            if (data.event === 'subscribe' || data.event === 'unsubscribe') {
                console.log(`Gate.io: ${data.event} success`); return null;
            }
            if (data.channel === 'spot.order_book' && data.result) {
                const bookData = data.result;
                let newBids = new Map<string, number>();
                let newAsks = new Map<string, number>();
                
                if (bookData.bids) {
                    bookData.bids.forEach((bid: [string, string]) => newBids.set(bid[0], parseFloat(bid[1])));
                }
                if (bookData.asks) {
                    bookData.asks.forEach((ask: [string, string]) => newAsks.set(ask[0], parseFloat(ask[1])));
                }
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot: true };
            }
            return null;
        },
    },


    binanceus: {
        id: 'binanceus',
        name: 'Binance US',
        formatSymbol: (commonSymbol) => commonSymbol.toLowerCase(),
        getWebSocketUrl: (formattedSymbol) => `wss://stream.binance.us:9443/ws/${formattedSymbol}@depth20@100ms`,
        parseMessage: (data) => {
            if (data.lastUpdateId && data.bids && data.asks) {
                const newBids = new Map<string, number>();
                data.bids.forEach((bid: [string, string]) => newBids.set(bid[0], parseFloat(bid[1])));
                const newAsks = new Map<string, number>();
                data.asks.forEach((ask: [string, string]) => newAsks.set(ask[0], parseFloat(ask[1])));
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot: true, lastUpdateId: data.lastUpdateId };
            }
            return null;
        },
    },
    mexc: {
        id: 'mexc',
        name: 'MEXC',
        formatSymbol: (commonSymbol) => commonSymbol.toUpperCase(),
        getWebSocketUrl: () => 'wss://wbs-api.mexc.com/ws',
        getSubscribeMessage: (formattedSymbol) => ({ 
            method: 'SUBSCRIPTION', 
            params: [`spot@public.limit.depth.v3.api.pb@${formattedSymbol}@20`]
        }),
        getUnsubscribeMessage: (formattedSymbol) => ({ 
            method: 'UNSUBSCRIPTION', 
            params: [`spot@public.limit.depth.v3.api.pb@${formattedSymbol}@20`]
        }),
        pingIntervalMs: 30000,
        pingPayload: () => ({ method: 'PING' }),
        needsSnapshotFlag: false,
        sliceDepth: 20,
        parseMessage: (data) => {
            // Handle subscription confirmations
            if (data.id === 0 && data.code === 0 && data.msg) {
                console.log(`MEXC: subscription confirmed for ${data.msg}`);
                return null;
            }
            
            // Handle ping/pong
            if (data.id === 0 && data.code === 0 && data.msg === 'PONG') {
                return null;
            }
            
            // Handle MEXC's custom binary format
            try {
                // Check if this is raw binary data (not JSON)
                if (typeof data === 'string' || data instanceof ArrayBuffer || data instanceof Blob || (typeof Buffer !== 'undefined' && data instanceof Buffer)) {
                    let asString;
                    
                    if (data instanceof Blob) {
                        // Handle Blob data (browser environment)
                        console.log('MEXC: Processing Blob data');
                        // For now, we'll need to handle this differently since we can't use async in parseMessage
                        // We'll return null and let the websocket handler deal with it
                        return null;
                    } else {
                        asString = data.toString();
                    }
                    
                    // Check if this is order book data (contains price/quantity patterns)
                    if (asString.includes('@') && asString.includes('BTCUSDT')) {
                        // Extract price/quantity pairs from the readable text
                        const lines = asString.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                        const priceQuantityPairs = [];
                        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            
                            // Skip header lines
                            if (line.includes('@') || line.includes('BTCUSDT')) {
                                continue;
                            }
                            
                            // Look for price patterns (large numbers with decimals)
                            if (line.includes('.') && !isNaN(parseFloat(line))) {
                                const num = parseFloat(line);
                                
                                // If it's a large number (price), look for quantity in next lines
                                if (num > 1000) {
                                    // Look ahead for quantity
                                    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                                        const nextLine = lines[j];
                                        if (nextLine.includes('.') && !isNaN(parseFloat(nextLine))) {
                                            const quantity = parseFloat(nextLine);
                                            if (quantity < 1000) { // Quantity should be smaller
                                                priceQuantityPairs.push({ price: num, quantity: quantity });
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Sort by price and separate bids (lower prices) from asks (higher prices)
                        priceQuantityPairs.sort((a, b) => a.price - b.price);
                        
                        // Find the middle price to separate bids and asks
                        const midPrice = priceQuantityPairs[Math.floor(priceQuantityPairs.length / 2)].price;
                        
                        const bidPairs = priceQuantityPairs.filter(pair => pair.price <= midPrice);
                        const askPairs = priceQuantityPairs.filter(pair => pair.price > midPrice);
                        
                        const newBids = new Map<string, number>();
                        const newAsks = new Map<string, number>();
                        
                        // Add bids to map
                        bidPairs.forEach(pair => {
                            newBids.set(pair.price.toString(), pair.quantity);
                        });
                        
                        // Add asks to map
                        askPairs.forEach(pair => {
                            newAsks.set(pair.price.toString(), pair.quantity);
                        });
                        
                        if (newBids.size > 0 || newAsks.size > 0) {
                            console.log(`MEXC: Parsed ${newBids.size} bids and ${newAsks.size} asks`);
                            return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot: true };
                        }
                    }
                }
            } catch (error) {
                console.error('MEXC: Error parsing binary data:', error);
            }
            
            return null;
        },
    },
    hyperliquid: {
        id: 'hyperliquid',
        name: 'Hyperliquid',
        formatSymbol: (commonSymbol) => commonSymbol.replace('USDT', '').toUpperCase(),
        getWebSocketUrl: () => 'wss://api.hyperliquid.xyz/ws',
        getSubscribeMessage: (formattedSymbol) => ({ 
            method: 'subscribe', 
            subscription: { type: 'l2Book', coin: formattedSymbol }
        }),
        getUnsubscribeMessage: (formattedSymbol) => ({ 
            method: 'unsubscribe', 
            subscription: { type: 'l2Book', coin: formattedSymbol }
        }),
        needsSnapshotFlag: false,
        sliceDepth: 50,
        parseMessage: (data) => {
            // Handle subscription confirmations
            if (data.channel === 'subscriptionResponse') {
                console.log(`Hyperliquid: subscription confirmed for ${data.data?.subscription?.coin}`);
                return null;
            }
            
            // Handle order book data (l2Book channel)
            if (data.channel === 'l2Book' && data.data) {
                const bookData = data.data;
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                // Hyperliquid sends levels as [bids, asks] arrays with object format
                if (bookData.levels && Array.isArray(bookData.levels) && bookData.levels.length >= 2) {
                    const bids = bookData.levels[0]; // First array is bids
                    const asks = bookData.levels[1]; // Second array is asks
                    
                    // Parse bids (object format with px and sz fields)
                    if (Array.isArray(bids)) {
                        bids.forEach((level: { px: string; sz: string }) => {
                            const price = parseFloat(level.px);
                            const size = parseFloat(level.sz);
                            if (price > 0 && size > 0) {
                                newBids.set(price.toString(), size);
                            }
                        });
                    }
                    
                    // Parse asks (object format with px and sz fields)
                    if (Array.isArray(asks)) {
                        asks.forEach((level: { px: string; sz: string }) => {
                            const price = parseFloat(level.px);
                            const size = parseFloat(level.sz);
                            if (price > 0 && size > 0) {
                                newAsks.set(price.toString(), size);
                            }
                        });
                    }
                }
                
                return { updatedBids: newBids, updatedAsks: newAsks, isSnapshot: true };
            }
            
            return null;
        },
    },
};

export const SUPPORTED_EXCHANGES_ORDER = ['binance', 'bybit', 'okx', 'kraken', 'bitget', 'gate', 'binanceus', 'mexc', 'hyperliquid'];

export const EXCHANGE_COLORS: Record<string, string> = {
    binance: '#F0B90B',        // Binance Yellow
    bybit: '#FF6600',          // Bybit Orange
    okx: '#007bff',            // OKX Blue
    kraken: '#5D40C4',         // Kraken Purple
    bitget: '#00CED1',         // Bitget Dark Turquoise
    gate: '#E91E63',           // Gate.io Pink
    binanceus: '#F0B90B',      // Binance US Yellow (same as Binance)
    mexc: '#FF007A',           // MEXC Pink
    hyperliquid: '#06b6d4',    // Hyperliquid Cyan

    default: '#777777'         // Default Grey
};

export const EXCHANGE_TAGS: Record<string, string> = {
    binance: 'BIN',
    bybit: 'BYB',
    okx: 'OKX',
    kraken: 'KRK',
    bitget: 'BTG',
    gate: 'GAT',
    binanceus: 'BUS',
    mexc: 'MEX',
    hyperliquid: 'HYP',

    default: '???'
};

// Fee information for all exchanges (maker/taker fees)
export const EXCHANGE_FEES: Record<string, FeeInfo> = {
    binance: { maker: 0.001, taker: 0.001, funding: 0.0001 },  // 0.1%/0.1%
    bybit: { maker: 0.001, taker: 0.001, funding: 0.0001 },   // 0.1%/0.1%  
    okx: { maker: 0.0008, taker: 0.001, funding: 0.0001 },    // 0.08%/0.1%
    kraken: { maker: 0.0016, taker: 0.0026, funding: 0.0001 }, // 0.16%/0.26%
    bitget: { maker: 0.001, taker: 0.001, funding: 0.0001 },  // 0.1%/0.1%
    gate: { maker: 0.002, taker: 0.002, funding: 0.0001 },    // 0.2%/0.2%
    binanceus: { maker: 0.001, taker: 0.001, funding: 0.0001 }, // 0.1%/0.1%
    mexc: { maker: 0.001, taker: 0.001, funding: 0.0001 },    // 0.1%/0.1%
    hyperliquid: { maker: 0.0002, taker: 0.0005, funding: 0.0001 }, // 0.02%/0.05% (very competitive DEX fees)
};

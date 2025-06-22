/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExchangeConfig, FeeInfo, FundingRateInfo, VolumeInfo } from './types';
import { 
    fetchBinanceFeeInfo, fetchBinanceFundingRateInfo, fetchBinanceVolumeInfo,
    fetchBybitFeeInfo, fetchBybitFundingRateInfo, fetchBybitVolumeInfo,
    fetchOkxFeeInfo, fetchOkxFundingRateInfo, fetchOkxVolumeInfo,
    fetchMexcFeeInfo, fetchMexcFundingRateInfo, fetchMexcVolumeInfo,
    fetchHyperliquidFeeInfo, fetchHyperliquidFundingRateInfo, fetchHyperliquidVolumeInfo,
    fetchDydxFeeInfo, fetchJupiterFeeInfo
} from './api';
import { logger } from './utils';



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
                logger.log(`Bybit: ${data.op} success: ${data.success}`, data.ret_msg || '');
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
        fetchFeeInfo: fetchBybitFeeInfo,
        fetchFundingRateInfo: fetchBybitFundingRateInfo,
        fetchVolumeInfo: fetchBybitVolumeInfo,
    },
    okx: {
        id: 'okx',
        name: 'OKX',
        formatSymbol: (commonSymbol) => `${commonSymbol.toUpperCase()}-SWAP`,
        getWebSocketUrl: () => 'wss://ws.okx.com/ws/v5/public',
        getSubscribeMessage: (formattedSymbol) => JSON.stringify({ op: 'subscribe', args: [{ channel: 'books', instId: formattedSymbol }] }),
        getUnsubscribeMessage: (formattedSymbol) => JSON.stringify({ op: 'unsubscribe', args: [{ channel: 'books', instId: formattedSymbol }] }),
        pingIntervalMs: 25000,
        pingPayload: () => 'ping',
        needsSnapshotFlag: true,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks, snapshotReceived) => {
            if (data.event === 'subscribe' || data.event === 'unsubscribe') {
                logger.log(`OKX: ${data.event} success for arg:`, data.arg); return null;
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
        },
        fetchFeeInfo: fetchOkxFeeInfo,
        fetchFundingRateInfo: fetchOkxFundingRateInfo,
        fetchVolumeInfo: fetchOkxVolumeInfo,
    },
    mexc: {
        id: 'mexc',
        name: 'MEXC Global',
        formatSymbol: (commonSymbol) => commonSymbol.toUpperCase(),
        getWebSocketUrl: () => 'wss://wbs.mexc.com/ws',
        getSubscribeMessage: (formattedSymbol) => JSON.stringify({
            method: 'SUBSCRIPTION',
            params: [`spot@public.bookTicker.v3.api@${formattedSymbol}`]
        }),
        getUnsubscribeMessage: (formattedSymbol) => JSON.stringify({
            method: 'UNSUBSCRIPTION', 
            params: [`spot@public.bookTicker.v3.api@${formattedSymbol}`]
        }),
        pingIntervalMs: 30000,
        pingPayload: () => JSON.stringify({ method: 'PING' }),
        needsSnapshotFlag: false,
        sliceDepth: 20,
        parseMessage: (data, currentBids, currentAsks, _snapshotReceived) => {
            // Handle PONG response
            if (data.method === 'PONG') {
                return null;
            }
            
            // Handle subscription confirmation
            if (data.method === 'SUBSCRIPTION') {
                console.log('MEXC: Subscription confirmed for', data.params);
                return null;
            }
            
            // Handle book ticker data - MEXC sends channel with symbol appended
            if (data.c && data.c.startsWith('spot@public.bookTicker.v3.api@') && data.d) {
                const bookData = data.d;
                if (!bookData.s) return null;
                
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                // MEXC bookTicker provides best bid/ask only
                if (bookData.b && bookData.B) {
                    newBids.set(bookData.b, parseFloat(bookData.B));
                }
                if (bookData.a && bookData.A) {
                    newAsks.set(bookData.a, parseFloat(bookData.A));
                }
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: true // Always snapshot for ticker data
                };
            }
            
            return null;
        },
        fetchFeeInfo: fetchMexcFeeInfo,
        fetchFundingRateInfo: fetchMexcFundingRateInfo,
        fetchVolumeInfo: fetchMexcVolumeInfo,
    },
    kraken: {
        id: 'kraken',
        name: 'Kraken',
        formatSymbol: (commonSymbol) => commonSymbol.replace('USDT', '/USD'),
        getWebSocketUrl: () => 'wss://ws.kraken.com',
        getSubscribeMessage: (formattedSymbol) => JSON.stringify({
            event: 'subscribe',
            pair: [formattedSymbol],
            subscription: { name: 'book', depth: 25 }
        }),
        getUnsubscribeMessage: (formattedSymbol) => JSON.stringify({
            event: 'unsubscribe',
            pair: [formattedSymbol],
            subscription: { name: 'book' }
        }),
        pingIntervalMs: 30000,
        pingPayload: () => JSON.stringify({ event: 'ping' }),
        needsSnapshotFlag: true,
        sliceDepth: 25,
        parseMessage: (data, currentBids, currentAsks, snapshotReceived) => {
            // Handle pong response
            if (data.event === 'pong') {
                return null;
            }
            
            // Handle subscription confirmations
            if (data.event === 'subscriptionStatus' && data.status === 'subscribed') {
                console.log('Kraken: Subscription confirmed for:', data.subscription.name, data.pair);
                return null;
            }
            
            // Handle system status
            if (data.event === 'systemStatus') {
                console.log('Kraken: System status:', data.status);
                return null;
            }
            
            // Handle book data - Kraken v1 sends array format
            if (Array.isArray(data) && data.length >= 4) {
                const channelId = data[0];
                const bookData = data[1];
                const channelName = data[2];
                const pair = data[3];
                
                if (channelName === 'book-25' && bookData) {
                    let newBids = new Map(currentBids);
                    let newAsks = new Map(currentAsks);
                    let isSnapshot = false;
                    
                    // Check if this is a snapshot (has both 'as' and 'bs' keys)
                    if (bookData.as && bookData.bs) {
                        isSnapshot = true;
                        newBids = new Map<string, number>();
                        newAsks = new Map<string, number>();
                        
                        // Process bids (bs)
                        bookData.bs.forEach((bid: [string, string, string]) => {
                            const price = bid[0];
                            const quantity = parseFloat(bid[1]);
                            if (quantity > 0) {
                                newBids.set(price, quantity);
                            }
                        });
                        
                        // Process asks (as)
                        bookData.as.forEach((ask: [string, string, string]) => {
                            const price = ask[0];
                            const quantity = parseFloat(ask[1]);
                            if (quantity > 0) {
                                newAsks.set(price, quantity);
                            }
                        });
                    } else {
                        // Handle incremental updates
                        if (!snapshotReceived) return null;
                        
                        // Process bid updates (b)
                        if (bookData.b) {
                            bookData.b.forEach((bid: [string, string, string]) => {
                                const price = bid[0];
                                const quantity = parseFloat(bid[1]);
                                if (quantity === 0) {
                                    newBids.delete(price);
                                } else {
                                    newBids.set(price, quantity);
                                }
                            });
                        }
                        
                        // Process ask updates (a)
                        if (bookData.a) {
                            bookData.a.forEach((ask: [string, string, string]) => {
                                const price = ask[0];
                                const quantity = parseFloat(ask[1]);
                                if (quantity === 0) {
                                    newAsks.delete(price);
                                } else {
                                    newAsks.set(price, quantity);
                                }
                            });
                        }
                    }
                    
                    return { 
                        updatedBids: newBids, 
                        updatedAsks: newAsks, 
                        isSnapshot,
                        channelId: channelId
                    };
                }
            }
            return null;
        }
    },
    bitget: {
        id: 'bitget',
        name: 'Bitget',
        formatSymbol: (commonSymbol) => `${commonSymbol.toUpperCase()}USDT`,
        getWebSocketUrl: () => 'wss://ws.bitget.com/v2/ws/public',
        getSubscribeMessage: (formattedSymbol) => JSON.stringify({
            op: 'subscribe',
            args: [{
                instType: 'SPOT',
                channel: 'books',
                instId: formattedSymbol
            }]
        }),
        getUnsubscribeMessage: (formattedSymbol) => JSON.stringify({
            op: 'unsubscribe',
            args: [{
                instType: 'SPOT',
                channel: 'books',
                instId: formattedSymbol
            }]
        }),
        pingIntervalMs: 30000,
        pingPayload: () => 'ping',
        needsSnapshotFlag: true,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks, snapshotReceived) => {
            // Handle ping/pong
            if (typeof data === 'string' && data === 'pong') {
                return null;
            }
            
            // Handle subscription confirmations
            if (data.event === 'subscribe' && data.code === '0') {
                console.log(`Bitget: Subscription confirmed for:`, data.arg);
                return null;
            }
            
            // Handle order book data
            if (data.action === 'snapshot' || data.action === 'update') {
                const book = data.data && data.data[0];
                if (!book) return null;
                
                let newBids = new Map(currentBids);
                let newAsks = new Map(currentAsks);
                let isSnapshot = data.action === 'snapshot';

                if (isSnapshot) {
                    newBids = new Map<string, number>();
                    newAsks = new Map<string, number>();
                    
                    // Process bids
                    if (book.bids && Array.isArray(book.bids)) {
                        book.bids.forEach((bid: [string, string]) => {
                            const price = bid[0];
                            const size = parseFloat(bid[1]);
                            if (size > 0) newBids.set(price, size);
                        });
                    }
                    
                    // Process asks
                    if (book.asks && Array.isArray(book.asks)) {
                        book.asks.forEach((ask: [string, string]) => {
                            const price = ask[0];
                            const size = parseFloat(ask[1]);
                            if (size > 0) newAsks.set(price, size);
                        });
                    }
                } else if (data.action === 'update') {
                    if (!snapshotReceived) return null;
                    
                    // Handle incremental updates
                    if (book.bids && Array.isArray(book.bids)) {
                        book.bids.forEach((bid: [string, string]) => {
                            const price = bid[0];
                            const quantity = parseFloat(bid[1]);
                            if (quantity === 0) {
                                newBids.delete(price);
                            } else {
                                newBids.set(price, quantity);
                            }
                        });
                    }
                    
                    if (book.asks && Array.isArray(book.asks)) {
                        book.asks.forEach((ask: [string, string]) => {
                            const price = ask[0];
                            const quantity = parseFloat(ask[1]);
                            if (quantity === 0) {
                                newAsks.delete(price);
                            } else {
                                newAsks.set(price, quantity);
                            }
                        });
                    }
                }
                
                return { 
                    updatedBids: newBids, 
                    updatedAsks: newAsks, 
                    isSnapshot, 
                    lastUpdateId: parseInt(book.ts || Date.now().toString(), 10) 
                };
            }
            return null;
        }
    },
    coinbase: {
        id: 'coinbase',
        name: 'Coinbase Pro',
        formatSymbol: (commonSymbol) => {
            // Coinbase uses format like BTC-USD, ETH-USD
            return commonSymbol.replace('USDT', '-USD');
        },
        getWebSocketUrl: () => 'wss://ws-feed.exchange.coinbase.com',
        getSubscribeMessage: (formattedSymbol) => ({
            type: 'subscribe',
            product_ids: [formattedSymbol],
            channels: ['level2']
        }),
        getUnsubscribeMessage: (formattedSymbol) => ({
            type: 'unsubscribe',
            product_ids: [formattedSymbol],
            channels: ['level2']
        }),
        needsSnapshotFlag: true,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks, snapshotReceived) => {
            if (data.type === 'subscriptions') {
                console.log('Coinbase: Subscription confirmed:', data);
                return null;
            }
            
            if (data.type === 'snapshot' && data.product_id) {
                // Initial snapshot
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                (data.bids || []).forEach((bid: [string, string]) => {
                    const price = bid[0];
                    const size = parseFloat(bid[1]);
                    if (size > 0) newBids.set(price, size);
                });
                
                (data.asks || []).forEach((ask: [string, string]) => {
                    const price = ask[0];
                    const size = parseFloat(ask[1]);
                    if (size > 0) newAsks.set(price, size);
                });
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: true
                };
            }
            
            if (data.type === 'l2update' && data.product_id) {
                if (!snapshotReceived) return null;
                
                const newBids = new Map(currentBids);
                const newAsks = new Map(currentAsks);
                
                (data.changes || []).forEach((change: [string, string, string]) => {
                    const side = change[0]; // 'buy' or 'sell'
                    const price = change[1];
                    const size = parseFloat(change[2]);
                    
                    if (side === 'buy') {
                        if (size === 0) {
                            newBids.delete(price);
                        } else {
                            newBids.set(price, size);
                        }
                    } else if (side === 'sell') {
                        if (size === 0) {
                            newAsks.delete(price);
                        } else {
                            newAsks.set(price, size);
                        }
                    }
                });
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: false
                };
            }
            
            return null;
        },
        fetchFeeInfo: async (formattedSymbol: string): Promise<FeeInfo | null> => {
            try {
                console.log(`Coinbase: Fetching fee info for ${formattedSymbol}`);
                // Coinbase Pro has tiered fees based on 30-day volume
                // Tier 0 (< $10K): 0.50% maker, 0.50% taker
                // Tier 1 ($10K - $50K): 0.35% maker, 0.50% taker  
                // Tier 2 ($50K - $100K): 0.25% maker, 0.35% taker
                // Tier 3 ($100K - $1M): 0.15% maker, 0.25% taker
                // Tier 4 ($1M - $15M): 0.10% maker, 0.20% taker
                // Tier 5 ($15M - $75M): 0.05% maker, 0.15% taker
                // Tier 6 ($75M - $250M): 0.00% maker, 0.10% taker
                // Tier 7 ($250M - $400M): 0.00% maker, 0.08% taker
                // Tier 8 (> $400M): 0.00% maker, 0.05% taker
                
                return {
                    makerRate: '0.00% - 0.50%',
                    takerRate: '0.05% - 0.50%',
                    raw: {
                        exchange: 'coinbase',
                        note: "Volume-based tiered fees. Tier 0: 0.50%/0.50%, Tier 8: 0.00%/0.05%",
                        tiers: [
                            { tier: 0, volume: '< $10K', maker: '0.50%', taker: '0.50%' },
                            { tier: 1, volume: '$10K - $50K', maker: '0.35%', taker: '0.50%' },
                            { tier: 2, volume: '$50K - $100K', maker: '0.25%', taker: '0.35%' },
                            { tier: 3, volume: '$100K - $1M', maker: '0.15%', taker: '0.25%' },
                            { tier: 4, volume: '$1M - $15M', maker: '0.10%', taker: '0.20%' },
                            { tier: 5, volume: '$15M - $75M', maker: '0.05%', taker: '0.15%' },
                            { tier: 6, volume: '$75M - $250M', maker: '0.00%', taker: '0.10%' },
                            { tier: 7, volume: '$250M - $400M', maker: '0.00%', taker: '0.08%' },
                            { tier: 8, volume: '> $400M', maker: '0.00%', taker: '0.05%' }
                        ]
                    }
                };
            } catch (error) {
                console.error('Coinbase: Error fetching fee info:', error);
                return null;
            }
        },
        fetchFundingRateInfo: async (_formattedSymbol: string): Promise<FundingRateInfo | null> => {
            try {
                // Coinbase Pro is primarily spot trading, no funding rates
                return {
                    rate: 'N/A',
                    nextFundingTime: 'N/A',
                    raw: { 
                        exchange: 'coinbase',
                        note: 'Coinbase Pro is primarily spot trading - no funding rates for perpetual swaps'
                    }
                };
            } catch (error) {
                console.error('Coinbase: Error fetching funding rate info:', error);
                return null;
            }
        },
        fetchVolumeInfo: async (formattedSymbol: string): Promise<VolumeInfo | null> => {
            try {
                console.log(`Coinbase: Fetching volume info for ${formattedSymbol}`);
                const response = await fetch(`https://api.exchange.coinbase.com/products/${formattedSymbol}/stats`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                
                const data = await response.json();
                
                return {
                    assetVolume: parseFloat(data.volume || '0'),
                    usdVolume: parseFloat(data.volume || '0') * parseFloat(data.last || '0'),
                    raw: {
                        exchange: 'coinbase',
                        stats: data,
                        note: 'Volume calculated from 24h volume * last price'
                    }
                };
            } catch (error) {
                console.error(`Coinbase: Error fetching volume for ${formattedSymbol}:`, error);
                return null;
            }
        }
    },
    gemini: {
        id: 'gemini',
        name: 'Gemini',
        formatSymbol: (commonSymbol) => {
            // Gemini uses format like BTCUSD, ETHUSD (no hyphen, no T)
            return commonSymbol.replace('USDT', 'USD');
        },
        getWebSocketUrl: () => 'wss://api.gemini.com/v1/marketdata',
        getSubscribeMessage: (formattedSymbol) => ({
            type: 'subscribe',
            subscriptions: [
                {
                    name: 'l2_updates',
                    symbols: [formattedSymbol]
                }
            ]
        }),
        getUnsubscribeMessage: (formattedSymbol) => ({
            type: 'unsubscribe',
            subscriptions: [
                {
                    name: 'l2_updates',
                    symbols: [formattedSymbol]
                }
            ]
        }),
        needsSnapshotFlag: true,
        sliceDepth: 50,
        parseMessage: (data, currentBids, currentAsks, snapshotReceived) => {
            if (data.type === 'subscription_ack') {
                console.log('Gemini: Subscription acknowledged:', data);
                return null;
            }
            
            if (data.type === 'heartbeat') {
                // Handle heartbeat messages
                return null;
            }
            
            if (data.type === 'l2_updates' && data.changes) {
                if (!snapshotReceived) {
                    // First message is typically a snapshot
                    const newBids = new Map<string, number>();
                    const newAsks = new Map<string, number>();
                    
                    data.changes.forEach((change: any) => {
                        const side = change.side; // 'bid' or 'ask'
                        const price = change.price;
                        const quantity = parseFloat(change.remaining || change.delta || '0');
                        
                        if (side === 'bid') {
                            if (quantity > 0) {
                                newBids.set(price, quantity);
                            }
                        } else if (side === 'ask') {
                            if (quantity > 0) {
                                newAsks.set(price, quantity);
                            }
                        }
                    });
                    
                    return {
                        updatedBids: newBids,
                        updatedAsks: newAsks,
                        isSnapshot: true
                    };
                } else {
                    // Subsequent messages are updates
                    const newBids = new Map(currentBids);
                    const newAsks = new Map(currentAsks);
                    
                    data.changes.forEach((change: any) => {
                        const side = change.side;
                        const price = change.price;
                        const quantity = parseFloat(change.remaining || change.delta || '0');
                        
                        if (side === 'bid') {
                            if (quantity === 0 || change.reason === 'cancel') {
                                newBids.delete(price);
                            } else {
                                newBids.set(price, quantity);
                            }
                        } else if (side === 'ask') {
                            if (quantity === 0 || change.reason === 'cancel') {
                                newAsks.delete(price);
                            } else {
                                newAsks.set(price, quantity);
                            }
                        }
                    });
                    
                    return {
                        updatedBids: newBids,
                        updatedAsks: newAsks,
                        isSnapshot: false
                    };
                }
            }
            
            return null;
        },
        fetchFeeInfo: async (formattedSymbol: string): Promise<FeeInfo | null> => {
            try {
                console.log(`Gemini: Fetching fee info for ${formattedSymbol}`);
                // Gemini has different fee structures based on volume and role
                // Web fees: 1.00% convenience fee for small trades
                // ActiveTrader: 0.25% - 1.00% maker, 0.35% - 1.00% taker based on volume
                // API: 0.25% - 1.00% maker, 0.35% - 1.00% taker
                
                return {
                    makerRate: '0.25% - 1.00%',
                    takerRate: '0.35% - 1.00%',
                    raw: {
                        exchange: 'gemini',
                        note: "Volume-based fees. ActiveTrader/API: 0.25%-1.00% maker, 0.35%-1.00% taker. Web: 1.00% convenience fee",
                        tiers: [
                            { tier: 0, volume: '< $500K', maker: '1.00%', taker: '1.00%' },
                            { tier: 1, volume: '$500K - $1M', maker: '0.50%', taker: '0.75%' },
                            { tier: 2, volume: '$1M - $5M', maker: '0.35%', taker: '0.50%' },
                            { tier: 3, volume: '$5M - $15M', maker: '0.25%', taker: '0.35%' },
                            { tier: 4, volume: '> $15M', maker: '0.25%', taker: '0.35%' }
                        ]
                    }
                };
            } catch (error) {
                console.error('Gemini: Error fetching fee info:', error);
                return null;
            }
        },
        fetchFundingRateInfo: async (_formattedSymbol: string): Promise<FundingRateInfo | null> => {
            try {
                // Gemini is primarily spot trading, no funding rates
                return {
                    rate: 'N/A',
                    nextFundingTime: 'N/A',
                    raw: { 
                        exchange: 'gemini',
                        note: 'Gemini is primarily spot trading - no funding rates for perpetual swaps'
                    }
                };
            } catch (error) {
                console.error('Gemini: Error fetching funding rate info:', error);
                return null;
            }
        },
        fetchVolumeInfo: async (formattedSymbol: string): Promise<VolumeInfo | null> => {
            try {
                console.log(`Gemini: Fetching volume info for ${formattedSymbol}`);
                const response = await fetch(`https://api.gemini.com/v1/pubticker/${formattedSymbol.toLowerCase()}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                
                const data = await response.json();
                
                return {
                    assetVolume: parseFloat(data.volume?.[formattedSymbol.slice(0, 3)] || '0'),
                    usdVolume: parseFloat(data.volume?.USD || '0'),
                    raw: {
                        exchange: 'gemini',
                        ticker: data,
                        note: '24h volume from Gemini API'
                    }
                };
            } catch (error) {
                console.error(`Gemini: Error fetching volume for ${formattedSymbol}:`, error);
                return null;
            }
        }
    },
    bitrue: {
        id: 'bitrue',
        name: 'Bitrue',
        formatSymbol: (commonSymbol) => commonSymbol.toUpperCase(),
        getWebSocketUrl: () => 'wss://ws.bitrue.com/market/ws',
        getSubscribeMessage: (formattedSymbol) => ({
            event: 'sub',
            params: {
                cb_id: formattedSymbol.toLowerCase(),
                channel: `market_${formattedSymbol.toLowerCase()}_simple_depth_step0`
            }
        }),
        getUnsubscribeMessage: (formattedSymbol) => ({
            event: 'unsub',
            params: {
                cb_id: formattedSymbol.toLowerCase(),
                channel: `market_${formattedSymbol.toLowerCase()}_simple_depth_step0`
            }
        }),
        needsSnapshotFlag: true,
        sliceDepth: 50,
        parseMessage: (data, _currentBids, _currentAsks, _snapshotReceived) => {
            // Ping/pong is handled at WebSocket level, not here
            if (data.ping) {
                return null;
            }
            
            if (data.event_rep === 'subed') {
                logger.log('Bitrue: Subscription confirmed:', data);
                return null;
            }
            
            // Debug: Log message structure for debugging
            logger.log('Bitrue: Received message:', {
                hasChannel: !!data.channel,
                channel: data.channel,
                hasTick: !!data.tick,
                hasEventRep: !!data.event_rep,
                eventRep: data.event_rep
            });
            
            if (data.channel && data.channel.includes('depth') && data.tick) {
                console.log('Bitrue: Processing order book data, tick:', data.tick);
                const tick = data.tick;
                
                // Bitrue sends full snapshots regularly, not incremental updates
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                (tick.buys || []).forEach((bid: [string, string]) => {
                    const price = bid[0];
                    const quantity = parseFloat(bid[1]);
                    if (quantity > 0) newBids.set(price, quantity);
                });
                
                (tick.asks || []).forEach((ask: [string, string]) => {
                    const price = ask[0];
                    const quantity = parseFloat(ask[1]);
                    if (quantity > 0) newAsks.set(price, quantity);
                });
                
                console.log(`Bitrue: Parsed ${newBids.size} bids and ${newAsks.size} asks`);
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: true
                };
            }
            
            return null;
        },
        fetchFeeInfo: async (_formattedSymbol: string): Promise<FeeInfo | null> => {
            try {
                console.log(`Bitrue: Fetching fee info for ${_formattedSymbol}`);
                // Bitrue has volume-based fee structure
                // VIP 0: 0.098% maker, 0.098% taker
                // VIP 1: 0.090% maker, 0.090% taker  
                // VIP 2: 0.080% maker, 0.080% taker
                // VIP 3: 0.070% maker, 0.070% taker
                // VIP 4: 0.060% maker, 0.060% taker
                // VIP 5: 0.050% maker, 0.050% taker
                // VIP 6: 0.040% maker, 0.040% taker
                // VIP 7: 0.030% maker, 0.030% taker
                // VIP 8: 0.020% maker, 0.020% taker
                // VIP 9: 0.015% maker, 0.015% taker
                
                return {
                    makerRate: '0.015% - 0.098%',
                    takerRate: '0.015% - 0.098%',
                    raw: {
                        exchange: 'bitrue',
                        note: "Volume-based VIP fees. VIP 0: 0.098%/0.098%, VIP 9: 0.015%/0.015%",
                        tiers: [
                            { tier: 'VIP 0', volume: '< $50K', maker: '0.098%', taker: '0.098%' },
                            { tier: 'VIP 1', volume: '$50K - $100K', maker: '0.090%', taker: '0.090%' },
                            { tier: 'VIP 2', volume: '$100K - $500K', maker: '0.080%', taker: '0.080%' },
                            { tier: 'VIP 3', volume: '$500K - $1M', maker: '0.070%', taker: '0.070%' },
                            { tier: 'VIP 4', volume: '$1M - $2M', maker: '0.060%', taker: '0.060%' },
                            { tier: 'VIP 5', volume: '$2M - $5M', maker: '0.050%', taker: '0.050%' },
                            { tier: 'VIP 6', volume: '$5M - $10M', maker: '0.040%', taker: '0.040%' },
                            { tier: 'VIP 7', volume: '$10M - $20M', maker: '0.030%', taker: '0.030%' },
                            { tier: 'VIP 8', volume: '$20M - $50M', maker: '0.020%', taker: '0.020%' },
                            { tier: 'VIP 9', volume: '> $50M', maker: '0.015%', taker: '0.015%' }
                        ]
                    }
                };
            } catch (error) {
                console.error('Bitrue: Error fetching fee info:', error);
                return null;
            }
        },
        fetchFundingRateInfo: async (_formattedSymbol: string): Promise<FundingRateInfo | null> => {
            try {
                // Bitrue is primarily spot trading, but they do have some futures
                return {
                    rate: 'N/A',
                    nextFundingTime: 'N/A',
                    raw: { 
                        exchange: 'bitrue',
                        note: 'Bitrue is primarily spot trading - limited perpetual swap offerings'
                    }
                };
            } catch (error) {
                console.error('Bitrue: Error fetching funding rate info:', error);
                return null;
            }
        },
        fetchVolumeInfo: async (formattedSymbol: string): Promise<VolumeInfo | null> => {
            try {
                console.log(`Bitrue: Fetching volume info for ${formattedSymbol}`);
                const response = await fetch(`https://openapi.bitrue.com/api/v1/ticker/24hr?symbol=${formattedSymbol}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                
                const data = await response.json();
                
                return {
                    assetVolume: parseFloat(data.volume || '0'),
                    usdVolume: parseFloat(data.quoteVolume || '0'),
                    raw: {
                        exchange: 'bitrue',
                        ticker: data,
                        note: '24h volume from Bitrue API'
                    }
                };
            } catch (error) {
                console.error(`Bitrue: Error fetching volume for ${formattedSymbol}:`, error);
                return null;
            }
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
        fetchFeeInfo: async (_formattedSymbol: string): Promise<FeeInfo | null> => {
            console.log(`Uniswap (Sim.): Simulating fee info fetch for ${_formattedSymbol}`);
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

// --- DEX Perpetual Swap Configurations ---
export const DEX_PERP_EXCHANGES: Record<string, ExchangeConfig> = {
    dydx: {
        id: 'dydx',
        name: 'dYdX',
        formatSymbol: (commonSymbol) => {
            // dYdX uses format like BTC-USD, ETH-USD
            return commonSymbol.replace('USDT', '-USD');
        },
        getWebSocketUrl: (_formattedSymbol) => `wss://indexer.dydx.trade/v4/ws`,
        getSubscribeMessage: (formattedSymbol) => ({
            type: 'subscribe',
            channel: 'v4_orderbook',
            id: formattedSymbol
        }),
        parseMessage: (data, _currentBids, _currentAsks) => {
            if (data?.type === 'subscribed' && data?.channel === 'v4_orderbook' && data?.contents) {
                // Initial snapshot
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                const contents = data.contents;
                if (contents.bids) {
                    contents.bids.forEach((bid: any) => {
                        const price = bid.price || bid[0];
                        const size = bid.size || bid[1];
                        if (size && parseFloat(size) > 0) {
                            newBids.set(price, parseFloat(size));
                        }
                    });
                }
                if (contents.asks) {
                    contents.asks.forEach((ask: any) => {
                        const price = ask.price || ask[0];
                        const size = ask.size || ask[1];
                        if (size && parseFloat(size) > 0) {
                            newAsks.set(price, parseFloat(size));
                        }
                    });
                }
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: true
                };
            } else if (data?.type === 'channel_data' && data?.channel === 'v4_orderbook' && data?.contents) {
                // Updates - use existing order book and apply updates
                const newBids = new Map(_currentBids);
                const newAsks = new Map(_currentAsks);
                
                const contents = data.contents;
                if (contents.bids) {
                    contents.bids.forEach((bid: any) => {
                        const price = bid[0];
                        const size = parseFloat(bid[1]);
                        if (size > 0) {
                            newBids.set(price, size);
                        } else {
                            newBids.delete(price);
                        }
                    });
                }
                if (contents.asks) {
                    contents.asks.forEach((ask: any) => {
                        const price = ask[0];
                        const size = parseFloat(ask[1]);
                        if (size > 0) {
                            newAsks.set(price, size);
                        } else {
                            newAsks.delete(price);
                        }
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
        needsSnapshotFlag: false,
        sliceDepth: 20,
        maxRetries: 3,
        fetchFeeInfo: fetchDydxFeeInfo
    },
    
    hyperliquid: {
        id: 'hyperliquid',
        name: 'Hyperliquid',
        formatSymbol: (commonSymbol) => {
            // Hyperliquid uses coin symbols without USDT
            const symbolMap: Record<string, string> = {
                'BTCUSDT': 'BTC',
                'ETHUSDT': 'ETH', 
                'SOLUSDT': 'SOL',
                'DOGEUSDT': 'DOGE',
                'ADAUSDT': 'ADA',
                'LINKUSDT': 'LINK',
                'XRPUSDT': 'XRP'
            };
            return symbolMap[commonSymbol] || commonSymbol.replace('USDT', '');
        },
        getWebSocketUrl: (_formattedSymbol) => `wss://api.hyperliquid.xyz/ws`,
        getSubscribeMessage: (formattedSymbol) => ({
            method: 'subscribe',
            subscription: {
                type: 'l2Book',
                coin: formattedSymbol
            }
        }),
        parseMessage: (data, _currentBids, _currentAsks) => {
            if (data.channel === 'l2Book' && data.data) {
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                // data.data.levels is [bids_array, asks_array]
                if (data.data.levels && Array.isArray(data.data.levels)) {
                    const [bids, asks] = data.data.levels;
                        
                        // Process bids
                        if (Array.isArray(bids)) {
                            bids.forEach((bid: any) => {
                                if (bid.px && bid.sz) {
                                    newBids.set(bid.px, parseFloat(bid.sz));
                                }
                            });
                        }
                        
                        // Process asks
                        if (Array.isArray(asks)) {
                            asks.forEach((ask: any) => {
                                if (ask.px && ask.sz) {
                                    newAsks.set(ask.px, parseFloat(ask.sz));
                                }
                            });
                        }
                }
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: true // Hyperliquid sends full snapshots
                };
            }
            return null;
        },
        needsSnapshotFlag: false, // Always sends full snapshots
        sliceDepth: 20,
        maxRetries: 3,
        fetchFeeInfo: fetchHyperliquidFeeInfo,
        fetchFundingRateInfo: fetchHyperliquidFundingRateInfo,
        fetchVolumeInfo: fetchHyperliquidVolumeInfo,
    },

    vertex: {
        id: 'vertex',
        name: 'Vertex Protocol',
        formatSymbol: (commonSymbol) => {
            // Vertex uses product IDs
            const symbolMap: Record<string, string> = {
                'BTCUSDT': '2',   // BTC-USDC perp
                'ETHUSDT': '3',   // ETH-USDC perp
                'SOLUSDT': '31',  // SOL-USDC perp
                'LINKUSDT': '19', // LINK-USDC perp
                'XRPUSDT': '32'   // XRP-USDC perp
            };
            return symbolMap[commonSymbol] || '2'; // Default to BTC
        },
        getWebSocketUrl: (_formattedSymbol) => `wss://gateway.prod.vertexprotocol.com/v1/ws`,
        getSubscribeMessage: (formattedSymbol) => ({
            method: 'subscribe',
            stream: {
                type: 'book_depth',
                product_id: parseInt(formattedSymbol)
            }
        }),
        parseMessage: (data, _currentBids, _currentAsks) => {
            if (data.stream === 'book_depth' && data.data) {
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                if (data.data.bids) {
                    data.data.bids.forEach((bid: any) => {
                        const price = (parseFloat(bid.price_x18) / 1e18).toString();
                        const size = parseFloat(bid.size_x18) / 1e18;
                        if (size > 0) newBids.set(price, size);
                    });
                }
                if (data.data.asks) {
                    data.data.asks.forEach((ask: any) => {
                        const price = (parseFloat(ask.price_x18) / 1e18).toString();
                        const size = parseFloat(ask.size_x18) / 1e18;
                        if (size > 0) newAsks.set(price, size);
                    });
                }
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: data.data.is_snapshot || false
                };
            }
            return null;
        },
        needsSnapshotFlag: true,
        sliceDepth: 20,
        maxRetries: 3
    },

    jupiter: {
        id: 'jupiter',
        name: 'Jupiter Swap',
        formatSymbol: (commonSymbol) => {
            // Jupiter uses token addresses for swaps
            const symbolMap: Record<string, string> = {
                'BTCUSDT': 'BTC-USDC',
                'ETHUSDT': 'ETH-USDC', 
                'SOLUSDT': 'SOL-USDC',
                'DOGEUSDT': 'DOGE-USDC',
                'ADAUSDT': 'ADA-USDC',
                'LINKUSDT': 'LINK-USDC',
                'XRPUSDT': 'XRP-USDC'
            };
            return symbolMap[commonSymbol] || 'SOL-USDC';
        },
        getWebSocketUrl: (_formattedSymbol) => null, // No WebSocket - uses periodic snapshots
        getSubscribeMessage: (_formattedSymbol) => null,
        parseMessage: (data, _currentBids, _currentAsks) => {
            // Handle snapshot data from Jupiter API
            if (data && data.type === 'jupiter_snapshot' && data.bids && data.asks) {
                const newBids = new Map<string, number>();
                const newAsks = new Map<string, number>();
                
                data.bids.forEach((bid: [string, number]) => {
                    newBids.set(bid[0], bid[1]);
                });
                
                data.asks.forEach((ask: [string, number]) => {
                    newAsks.set(ask[0], ask[1]);
                });
                
                return {
                    updatedBids: newBids,
                    updatedAsks: newAsks,
                    isSnapshot: true
                };
            }
            return null;
        },
        needsSnapshotFlag: false,
        sliceDepth: 10,
        maxRetries: 2,
        fetchFeeInfo: fetchJupiterFeeInfo,
        isSnapshotOnly: true,
        snapshotInterval: 30000 // 30 seconds
    }
};

// Add DEX exchanges to the main supported exchanges
export const SUPPORTED_EXCHANGES_WITH_DEX = {
    ...SUPPORTED_EXCHANGES,
    ...DEX_PERP_EXCHANGES
};

export const SUPPORTED_EXCHANGES_ORDER = ["binance", "bybit", "okx", "kraken", "bitget", "mexc", "coinbase", "gemini", "bitrue", "uniswap_simulated"];

export const SUPPORTED_EXCHANGES_ORDER_WITH_DEX = [
    ...SUPPORTED_EXCHANGES_ORDER,
    "dydx", "hyperliquid", "vertex", "jupiter"
];

export const EXCHANGE_COLORS: Record<string, string> = {
    binance: "#F0B90B",
    bybit: "#FFA500", 
    okx: "#007bff",
    kraken: "#5D40C4",
    bitget: "#00CED1",
    mexc: "#1E88E5",
    coinbase: "#FF007A",
    gemini: "#00D4AA",
    bitrue: "#1E90FF",
    uniswap_simulated: "#FF007A",
    dydx: "#6966FF",
    hyperliquid: "#00D4AA",
    vertex: "#8B5CF6",
    jupiter: "#FFA500",
    default: "#777777"
};

export const EXCHANGE_TAGS: Record<string, string> = {
    binance: "BNB",
    bybit: "BYB",
    okx: "OKX", 
    kraken: "KRK",
    bitget: "BGT",
    mexc: "MXC",
    coinbase: "CB",
    gemini: "GEM",
    bitrue: "BTR",
    uniswap_simulated: "UNI",
    dydx: "dYdX",
    hyperliquid: "HL",
    vertex: "VRTX",
    jupiter: "JUP",
};

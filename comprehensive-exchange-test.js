#!/usr/bin/env node

/**
 * Comprehensive Exchange Testing Script
 * Tests all configured exchanges for order book, top of book, kline, and ticker feeds
 */

import WebSocket from 'ws';
import pako from 'pako';

const exchanges = [
    {
        name: 'Binance',
        id: 'binance',
        feeds: {
            orderbook: {
                url: 'wss://fstream.binance.com/ws/ethusdt@depth20@100ms',
                description: 'Order Book (Futures)'
            },
            topOfBook: {
                url: 'wss://fstream.binance.com/ws/ethusdt@bookTicker',
                description: 'Top of Book (Best Bid/Ask)'
            },
            kline: {
                url: 'wss://fstream.binance.com/ws/ethusdt@kline_5m',
                description: 'Kline/Candlestick (5m)'
            },
            ticker: {
                url: 'wss://fstream.binance.com/ws/ethusdt@ticker',
                description: '24hr Ticker'
            }
        }
    },
    {
        name: 'Bybit',
        id: 'bybit',
        feeds: {
            orderbook: {
                url: 'wss://stream.bybit.com/v5/public/linear',
                subscribe: { op: 'subscribe', args: ['orderbook.50.ETHUSDT'] },
                description: 'Order Book (Linear)'
            },
            topOfBook: {
                url: 'wss://stream.bybit.com/v5/public/linear',
                subscribe: { op: 'subscribe', args: ['tickers.ETHUSDT'] },
                description: 'Top of Book via Ticker'
            },
            kline: {
                url: 'wss://stream.bybit.com/v5/public/linear',
                subscribe: { op: 'subscribe', args: ['kline.5.ETHUSDT'] },
                description: 'Kline (5min)'
            },
            ticker: {
                url: 'wss://stream.bybit.com/v5/public/linear',
                subscribe: { op: 'subscribe', args: ['tickers.ETHUSDT'] },
                description: '24hr Ticker'
            }
        }
    },
    {
        name: 'OKX',
        id: 'okx',
        feeds: {
            orderbook: {
                url: 'wss://ws.okx.com:8443/ws/v5/public',
                subscribe: { op: 'subscribe', args: [{ channel: 'books', instId: 'ETHUSDT-SWAP' }] },
                description: 'Order Book (Swap)'
            },
            topOfBook: {
                url: 'wss://ws.okx.com:8443/ws/v5/public',
                subscribe: { op: 'subscribe', args: [{ channel: 'bbo-tbt', instId: 'ETHUSDT-SWAP' }] },
                description: 'Best Bid/Offer Tick-by-Tick'
            },
            kline: {
                url: 'wss://ws.okx.com:8443/ws/v5/public',
                subscribe: { op: 'subscribe', args: [{ channel: 'candle5m', instId: 'ETHUSDT-SWAP' }] },
                description: 'Candlestick (5min)'
            },
            ticker: {
                url: 'wss://ws.okx.com:8443/ws/v5/public',
                subscribe: { op: 'subscribe', args: [{ channel: 'tickers', instId: 'ETHUSDT-SWAP' }] },
                description: '24hr Ticker'
            }
        }
    },
    {
        name: 'Kraken',
        id: 'kraken',
        feeds: {
            orderbook: {
                url: 'wss://futures.kraken.com/ws/v1',
                subscribe: { method: 'subscribe', params: { feed: 'book_ui_1', product_ids: ['PF_ETHUSD'] } },
                description: 'Order Book (Futures)'
            },
            topOfBook: {
                url: 'wss://futures.kraken.com/ws/v1',
                subscribe: { method: 'subscribe', params: { feed: 'ticker', product_ids: ['PF_ETHUSD'] } },
                description: 'Ticker (includes best bid/ask)'
            },
            kline: {
                url: 'wss://futures.kraken.com/ws/v1',
                subscribe: { method: 'subscribe', params: { feed: 'candles_trade_5m', product_ids: ['PF_ETHUSD'] } },
                description: 'Candles (5min)'
            },
            ticker: {
                url: 'wss://futures.kraken.com/ws/v1',
                subscribe: { method: 'subscribe', params: { feed: 'ticker', product_ids: ['PF_ETHUSD'] } },
                description: '24hr Ticker'
            }
        }
    },
    {
        name: 'MEXC',
        id: 'mexc',
        feeds: {
            orderbook: {
                url: 'wss://wbs.mexc.com/ws',
                subscribe: { method: 'SUBSCRIPTION', params: ['spot@public.book.v3.api@ETHUSDT@20'] },
                description: 'Order Book (Spot)'
            },
            topOfBook: {
                url: 'wss://wbs.mexc.com/ws',
                subscribe: { method: 'SUBSCRIPTION', params: ['spot@public.bookTicker.v3.api@ETHUSDT'] },
                description: 'Book Ticker (Best Bid/Ask)'
            },
            kline: {
                url: 'wss://wbs.mexc.com/ws',
                subscribe: { method: 'SUBSCRIPTION', params: ['spot@public.kline.v3.api@ETHUSDT@5m'] },
                description: 'Kline (5min)'
            },
            ticker: {
                url: 'wss://wbs.mexc.com/ws',
                subscribe: { method: 'SUBSCRIPTION', params: ['spot@public.miniTickers.v3.api'] },
                description: '24hr Mini Ticker'
            }
        }
    },
    {
        name: 'Bitget',
        id: 'bitget',
        feeds: {
            orderbook: {
                url: 'wss://ws.bitget.com/mix/v1/stream',
                subscribe: { op: 'subscribe', args: [{ instType: 'UMCBL', channel: 'books', instId: 'ETHUSDT' }] },
                description: 'Order Book (UMCBL)'
            },
            topOfBook: {
                url: 'wss://ws.bitget.com/mix/v1/stream',
                subscribe: { op: 'subscribe', args: [{ instType: 'UMCBL', channel: 'ticker', instId: 'ETHUSDT' }] },
                description: 'Ticker (includes best bid/ask)'
            },
            kline: {
                url: 'wss://ws.bitget.com/mix/v1/stream',
                subscribe: { op: 'subscribe', args: [{ instType: 'UMCBL', channel: 'candle5m', instId: 'ETHUSDT' }] },
                description: 'Candlestick (5min)'
            },
            ticker: {
                url: 'wss://ws.bitget.com/mix/v1/stream',
                subscribe: { op: 'subscribe', args: [{ instType: 'UMCBL', channel: 'ticker', instId: 'ETHUSDT' }] },
                description: '24hr Ticker'
            }
        }
    },
    {
        name: 'Hyperliquid',
        id: 'hyperliquid',
        feeds: {
            orderbook: {
                url: 'wss://api.hyperliquid.xyz/ws',
                subscribe: { method: 'subscribe', subscription: { type: 'l2Book', coin: 'ETH' } },
                description: 'L2 Order Book'
            },
            topOfBook: {
                url: 'wss://api.hyperliquid.xyz/ws',
                subscribe: { method: 'subscribe', subscription: { type: 'allMids' } },
                description: 'All Mids (includes top of book)'
            }
        }
    },
    {
        name: 'HTX (Huobi)',
        id: 'huobi',
        feeds: {
            orderbook: {
                url: 'wss://api.huobi.pro/ws',
                subscribe: { sub: 'market.ethusdt.depth.step0', id: 'test-ob' },
                description: 'Order Book (Spot)'
            },
            topOfBook: {
                url: 'wss://api.huobi.pro/ws',
                subscribe: { sub: 'market.ethusdt.bbo', id: 'test-bbo' },
                description: 'Best Bid/Offer'
            },
            kline: {
                url: 'wss://api.huobi.pro/ws',
                subscribe: { sub: 'market.ethusdt.kline.1min', id: 'test-kline' },
                description: 'Kline (1min)'
            },
            ticker: {
                url: 'wss://api.huobi.pro/ws',
                subscribe: { sub: 'market.ethusdt.detail', id: 'test-ticker' },
                description: '24hr Ticker Detail'
            }
        }
    }
];

async function testFeed(exchange, feedName, feedConfig, testDuration = 5000) {
    return new Promise((resolve) => {
        console.log(`  📡 Testing ${feedName}: ${feedConfig.description}`);
        let messageCount = 0;
        let connected = false;
        let hasRelevantData = false;
        let lastMessage = null;

        const ws = new WebSocket(feedConfig.url);
        const timeout = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            resolve({
                feedName,
                success: connected && messageCount > 0 && hasRelevantData,
                messageCount,
                connected,
                hasRelevantData,
                lastMessage,
                description: feedConfig.description
            });
        }, testDuration);

        ws.on('open', () => {
            connected = true;
            if (feedConfig.subscribe) {
                ws.send(JSON.stringify(feedConfig.subscribe));
            }
        });

        ws.on('message', (data) => {
            messageCount++;
            try {
                let parsed;
                if (exchange.id === 'huobi' && data instanceof Buffer) {
                    const decompressed = pako.inflate(data, { to: 'string' });
                    parsed = JSON.parse(decompressed);
                    if (parsed.ping) {
                        ws.send(JSON.stringify({ pong: parsed.ping }));
                        return;
                    }
                } else {
                    parsed = JSON.parse(data.toString());
                }
                lastMessage = parsed;

                // Check for relevant data based on feed type
                if (feedName === 'orderbook') {
                    hasRelevantData = !!(parsed.b || parsed.bids || parsed.a || parsed.asks || (parsed.tick && (parsed.tick.bids || parsed.tick.asks)) ||
                                       (parsed.data && (parsed.data.b || parsed.data.bids || parsed.data.a || parsed.data.asks)) ||
                                       (parsed.data && parsed.data.levels));
                } else if (feedName === 'topOfBook') {
                    hasRelevantData = !!(parsed.B || parsed.A || parsed.bestBid || parsed.bestAsk || (parsed.tick && (parsed.tick.bid || parsed.tick.ask)) ||
                                       (parsed.data && (parsed.data.bidPrice || parsed.data.askPrice)));
                } else if (feedName === 'kline') {
                    hasRelevantData = !!(parsed.k || parsed.data || parsed.candle || (parsed.tick && parsed.tick.id) ||
                                       (Array.isArray(parsed.data) && parsed.data.length > 0));
                } else if (feedName === 'ticker') {
                    hasRelevantData = !!(parsed.c || parsed.lastPrice || parsed.price || (parsed.tick && parsed.tick.close) ||
                                       (parsed.data && (parsed.data.lastPrice || parsed.data.close)));
                }

                if (messageCount === 1) {
                    console.log(`     ✅ Receiving data`);
                }
            } catch (e) {
                // Handle non-JSON messages (like pings)
                if (messageCount === 1) {
                    console.log(`     ✅ Receiving data (non-JSON)`);
                }
            }
        });

        ws.on('error', (error) => {
            console.log(`     ❌ Error: ${error.message}`);
            clearTimeout(timeout);
            resolve({
                feedName,
                success: false,
                messageCount: 0,
                connected: false,
                hasRelevantData: false,
                error: error.message,
                description: feedConfig.description
            });
        });

        ws.on('close', (code) => {
            // Normal close, timeout will handle resolution
        });
    });
}

async function testExchange(exchange) {
    console.log(`\n🔧 Testing ${exchange.name} (${exchange.id})`);
    console.log('=' .repeat(50));
    
    const results = {};
    
    for (const [feedName, feedConfig] of Object.entries(exchange.feeds)) {
        const result = await testFeed(exchange, feedName, feedConfig);
        results[feedName] = result;
        
        const status = result.success ? '✅ WORKING' : '❌ FAILED';
        const details = result.success 
            ? `(${result.messageCount} messages, data: ${result.hasRelevantData ? 'yes' : 'no'})` 
            : result.error ? `(${result.error})` : '(connection failed)';
        
        console.log(`     ${status} ${details}`);
        
        // Small delay between feeds to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return { exchange: exchange.name, id: exchange.id, results };
}

async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive Exchange Testing');
    console.log('Testing Order Book, Top of Book, Kline, and Ticker feeds\n');
    
    const allResults = [];
    
    for (const exchange of exchanges) {
        const result = await testExchange(exchange);
        allResults.push(result);
    }
    
    // Summary
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
    console.log('=' .repeat(80));
    
    for (const exchangeResult of allResults) {
        console.log(`\n${exchangeResult.exchange} (${exchangeResult.id}):`);
        
        let workingFeeds = 0;
        let totalFeeds = 0;
        
        for (const [feedName, result] of Object.entries(exchangeResult.results)) {
            totalFeeds++;
            if (result.success) workingFeeds++;
            
            const status = result.success ? '✅' : '❌';
            console.log(`  ${status} ${feedName.padEnd(12)} ${result.description}`);
        }
        
        const successRate = ((workingFeeds / totalFeeds) * 100).toFixed(0);
        console.log(`  📈 Success Rate: ${workingFeeds}/${totalFeeds} (${successRate}%)`);
    }
    
    // Overall statistics
    let totalExchanges = allResults.length;
    let fullyWorkingExchanges = allResults.filter(r => 
        Object.values(r.results).every(feed => feed.success)
    ).length;
    
    let partiallyWorkingExchanges = allResults.filter(r => 
        Object.values(r.results).some(feed => feed.success) && 
        !Object.values(r.results).every(feed => feed.success)
    ).length;
    
    let nonWorkingExchanges = allResults.filter(r => 
        !Object.values(r.results).some(feed => feed.success)
    ).length;
    
    console.log(`\n🎯 OVERALL STATISTICS:`);
    console.log(`   Fully Working:     ${fullyWorkingExchanges}/${totalExchanges} exchanges`);
    console.log(`   Partially Working: ${partiallyWorkingExchanges}/${totalExchanges} exchanges`);
    console.log(`   Not Working:       ${nonWorkingExchanges}/${totalExchanges} exchanges`);
    
    return allResults;
}

runComprehensiveTest().catch(console.error); 
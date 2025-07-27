#!/usr/bin/env node

/**
 * CCXT Exchange Analyzer & WebSocket Connection Fixer
 * Analyzes exchange capabilities and creates working WebSocket connections
 */

import ccxt from 'ccxt';
import WebSocket from 'ws';

const SUPPORTED_EXCHANGES = [
    'binance', 'bybit', 'okx', 'kraken', 'bitget', 'gate', 'huobi', 
    'mexc', 'coinbase', 'bingx', 'whitebit', 'lbank', 'phemex', 
    'ascendex', 'kucoin', 'bitmart', 'bitfinex', 'hyperliquid'
];

const SYMBOL = 'ETH/USDT';
const SYMBOL_VARIANTS = ['ETHUSDT', 'ETH-USDT', 'ETH/USDT', 'ETHUSD'];

async function analyzeExchange(exchangeId) {
    console.log(`\n🔍 Analyzing ${exchangeId.toUpperCase()}`);
    console.log('=' .repeat(50));
    
    try {
        // Initialize exchange
        const exchangeClass = ccxt[exchangeId];
        if (!exchangeClass) {
            throw new Error(`Exchange ${exchangeId} not supported by CCXT`);
        }

        const exchange = new exchangeClass({
            sandbox: false,
            enableRateLimit: true,
        });

        // Check basic capabilities
        const has = exchange.has;
        console.log(`📊 Basic Capabilities:`);
        console.log(`   WebSocket: ${has.ws ? '✅' : '❌'}`);
        console.log(`   Order Book: ${has.fetchOrderBook ? '✅' : '❌'}`);
        console.log(`   Ticker: ${has.fetchTicker ? '✅' : '❌'}`);
        console.log(`   OHLCV: ${has.fetchOHLCV ? '✅' : '❌'}`);
        console.log(`   Trades: ${has.fetchTrades ? '✅' : '❌'}`);

        // Load markets
        await exchange.loadMarkets();
        
        // Find the symbol
        let symbol = null;
        for (const variant of SYMBOL_VARIANTS) {
            if (exchange.markets[variant]) {
                symbol = variant;
                break;
            }
        }

        if (!symbol) {
            console.log(`❌ Symbol not found (tried: ${SYMBOL_VARIANTS.join(', ')})`);
            return {
                exchangeId,
                supported: false,
                reason: 'Symbol not available',
                capabilities: has
            };
        }

        console.log(`✅ Symbol found: ${symbol}`);
        const market = exchange.markets[symbol];
        console.log(`   Type: ${market.type || 'spot'}`);
        console.log(`   Active: ${market.active ? '✅' : '❌'}`);

        // Test WebSocket capabilities
        const wsResults = await testWebSocketFeeds(exchangeId, symbol, market);

        return {
            exchangeId,
            supported: true,
            symbol,
            market,
            capabilities: has,
            websocket: wsResults
        };

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return {
            exchangeId,
            supported: false,
            reason: error.message,
            capabilities: {}
        };
    }
}

async function testWebSocketFeeds(exchangeId, symbol, market) {
    console.log(`\n🌐 Testing WebSocket Feeds:`);
    
    const results = {};
    
    // Test configurations based on exchange
    const configs = getWebSocketConfigs(exchangeId, symbol, market);
    
    for (const [feedType, config] of Object.entries(configs)) {
        console.log(`   📡 Testing ${feedType}...`);
        
        try {
            const result = await testWebSocketFeed(config);
            results[feedType] = result;
            
            const status = result.success ? '✅' : '❌';
            const details = result.success 
                ? `(${result.messageCount} messages in ${(result.duration/1000).toFixed(1)}s)`
                : `(${result.error})`;
            
            console.log(`      ${status} ${details}`);
            
        } catch (error) {
            results[feedType] = { success: false, error: error.message };
            console.log(`      ❌ (${error.message})`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
}

function getWebSocketConfigs(exchangeId, symbol, market) {
    const configs = {};
    
    // Normalize symbol for different exchanges
    const symbolNormalized = symbol.replace('/', '').replace('-', '');
    const symbolWithSlash = symbol.includes('/') ? symbol : symbol.replace('USDT', '/USDT');
    const symbolWithDash = symbol.replace('/', '-');
    
    switch (exchangeId) {
        case 'binance':
            configs.orderbook = {
                url: `wss://stream.binance.com:9443/ws/${symbolNormalized.toLowerCase()}@depth20@100ms`,
                description: 'Order Book (Spot)'
            };
            configs.ticker = {
                url: `wss://stream.binance.com:9443/ws/${symbolNormalized.toLowerCase()}@ticker`,
                description: '24hr Ticker'
            };
            configs.kline = {
                url: `wss://stream.binance.com:9443/ws/${symbolNormalized.toLowerCase()}@kline_5m`,
                description: 'Kline 5m'
            };
            if (market.type === 'future' || market.type === 'swap') {
                configs.orderbook_futures = {
                    url: `wss://fstream.binance.com/ws/${symbolNormalized.toLowerCase()}@depth20@100ms`,
                    description: 'Order Book (Futures)'
                };
            }
            break;
            
        case 'bybit':
            configs.orderbook = {
                url: 'wss://stream.bybit.com/v5/public/linear',
                subscribe: { op: 'subscribe', args: [`orderbook.50.${symbolNormalized}`] },
                description: 'Order Book (Linear)'
            };
            configs.ticker = {
                url: 'wss://stream.bybit.com/v5/public/linear',
                subscribe: { op: 'subscribe', args: [`tickers.${symbolNormalized}`] },
                description: 'Ticker'
            };
            configs.kline = {
                url: 'wss://stream.bybit.com/v5/public/linear',
                subscribe: { op: 'subscribe', args: [`kline.5.${symbolNormalized}`] },
                description: 'Kline 5m'
            };
            break;
            
        case 'okx':
            const instId = market.type === 'swap' ? `${symbolNormalized}-SWAP` : symbolNormalized;
            configs.orderbook = {
                url: 'wss://ws.okx.com:8443/ws/v5/public',
                subscribe: { op: 'subscribe', args: [{ channel: 'books', instId }] },
                description: 'Order Book'
            };
            configs.ticker = {
                url: 'wss://ws.okx.com:8443/ws/v5/public',
                subscribe: { op: 'subscribe', args: [{ channel: 'tickers', instId }] },
                description: 'Ticker'
            };
            configs.kline = {
                url: 'wss://ws.okx.com:8443/ws/v5/public',
                subscribe: { op: 'subscribe', args: [{ channel: 'candle5m', instId }] },
                description: 'Kline 5m'
            };
            break;
            
        case 'kraken':
            configs.orderbook = {
                url: 'wss://ws.kraken.com',
                subscribe: { event: 'subscribe', pair: [symbolWithSlash], subscription: { name: 'book' } },
                description: 'Order Book (Spot)'
            };
            configs.ticker = {
                url: 'wss://ws.kraken.com',
                subscribe: { event: 'subscribe', pair: [symbolWithSlash], subscription: { name: 'ticker' } },
                description: 'Ticker'
            };
            break;
            
        case 'gate':
            configs.orderbook = {
                url: 'wss://api.gateio.ws/ws/v4/',
                subscribe: { time: Date.now(), channel: 'spot.order_book', event: 'subscribe', payload: [symbolWithSlash, '20', '1000ms'] },
                description: 'Order Book'
            };
            break;
            
        case 'mexc':
            configs.orderbook = {
                url: 'wss://wbs.mexc.com/ws',
                subscribe: { method: 'SUBSCRIPTION', params: [`spot@public.book.v3.api@${symbolNormalized}@20`] },
                description: 'Order Book'
            };
            break;
            
        case 'bitget':
            configs.orderbook = {
                url: 'wss://ws.bitget.com/spot/v1/stream',
                subscribe: { op: 'subscribe', args: [{ instType: 'SP', channel: 'books', instId: symbolNormalized }] },
                description: 'Order Book (Spot)'
            };
            break;
            
        case 'kucoin':
            // KuCoin requires token-based connection, skip for now
            configs.note = { description: 'Requires token-based connection' };
            break;
            
        case 'coinbase':
            configs.orderbook = {
                url: 'wss://ws-feed.exchange.coinbase.com',
                subscribe: { type: 'subscribe', channels: [{ name: 'level2', product_ids: [symbolWithDash] }] },
                description: 'Order Book'
            };
            break;
            
        case 'hyperliquid':
            configs.orderbook = {
                url: 'wss://api.hyperliquid.xyz/ws',
                subscribe: { method: 'subscribe', subscription: { type: 'l2Book', coin: symbol.split('/')[0] } },
                description: 'L2 Order Book'
            };
            break;
            
        default:
            configs.note = { description: 'WebSocket configuration not implemented' };
    }
    
    return configs;
}

async function testWebSocketFeed(config, timeout = 5000) {
    if (config.description && !config.url) {
        return { success: false, error: config.description };
    }
    
    return new Promise((resolve) => {
        let messageCount = 0;
        let connected = false;
        let hasRelevantData = false;
        const startTime = Date.now();
        
        const ws = new WebSocket(config.url);
        
        const timeoutId = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            resolve({
                success: connected && messageCount > 0,
                messageCount,
                connected,
                hasRelevantData,
                duration: Date.now() - startTime
            });
        }, timeout);
        
        ws.on('open', () => {
            connected = true;
            if (config.subscribe) {
                ws.send(JSON.stringify(config.subscribe));
            }
        });
        
        ws.on('message', (data) => {
            messageCount++;
            try {
                const parsed = JSON.parse(data.toString());
                // Check for relevant data
                if (parsed.b || parsed.bids || parsed.a || parsed.asks || 
                    parsed.data || parsed.result || parsed.changes) {
                    hasRelevantData = true;
                }
            } catch (e) {
                // Non-JSON messages are ok
            }
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeoutId);
            resolve({
                success: false,
                error: error.message,
                messageCount: 0,
                connected: false,
                duration: Date.now() - startTime
            });
        });
        
        ws.on('close', () => {
            // Will be handled by timeout
        });
    });
}

async function generateWorkingConfigs(results) {
    console.log('\n🔧 GENERATING WORKING CONFIGURATIONS');
    console.log('=' .repeat(70));
    
    const workingConfigs = {};
    
    for (const result of results) {
        if (!result.supported || !result.websocket) continue;
        
        const workingFeeds = {};
        for (const [feedType, wsResult] of Object.entries(result.websocket)) {
            if (wsResult.success) {
                workingFeeds[feedType] = {
                    working: true,
                    messageCount: wsResult.messageCount,
                    duration: wsResult.duration
                };
            }
        }
        
        if (Object.keys(workingFeeds).length > 0) {
            workingConfigs[result.exchangeId] = {
                symbol: result.symbol,
                market: result.market,
                capabilities: result.capabilities,
                workingFeeds
            };
            
            console.log(`✅ ${result.exchangeId.toUpperCase()}: ${Object.keys(workingFeeds).length} working feeds`);
        } else {
            console.log(`❌ ${result.exchangeId.toUpperCase()}: No working feeds`);
        }
    }
    
    return workingConfigs;
}

async function runAnalysis() {
    console.log('🚀 CCXT Exchange Analysis & WebSocket Testing');
    console.log('🎯 Testing ETH/USDT on all supported exchanges\n');
    
    const results = [];
    
    // Test each exchange
    for (const exchangeId of SUPPORTED_EXCHANGES) {
        try {
            const result = await analyzeExchange(exchangeId);
            results.push(result);
        } catch (error) {
            console.log(`💥 Failed to analyze ${exchangeId}: ${error.message}`);
            results.push({
                exchangeId,
                supported: false,
                reason: error.message,
                capabilities: {}
            });
        }
        
        // Brief pause between exchanges
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Generate working configurations
    const workingConfigs = await generateWorkingConfigs(results);
    
    // Summary
    console.log('\n📊 FINAL SUMMARY');
    console.log('=' .repeat(50));
    
    const supported = results.filter(r => r.supported).length;
    const withWorkingWS = Object.keys(workingConfigs).length;
    
    console.log(`📈 Exchanges analyzed: ${results.length}`);
    console.log(`✅ Supported by CCXT: ${supported}`);
    console.log(`🌐 With working WebSocket: ${withWorkingWS}`);
    console.log(`💪 Success rate: ${((withWorkingWS / results.length) * 100).toFixed(1)}%`);
    
    // Save results
    const reportFile = 'ccxt-analysis-report.json';
    const report = {
        timestamp: new Date().toISOString(),
        summary: { total: results.length, supported, withWorkingWS },
        results,
        workingConfigs
    };
    
    await import('fs').then(fs => {
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        console.log(`\n💾 Report saved to: ${reportFile}`);
    });
    
    return report;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAnalysis().catch(console.error);
}

export { runAnalysis, analyzeExchange, testWebSocketFeed }; 
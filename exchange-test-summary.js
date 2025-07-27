#!/usr/bin/env node

import WebSocket from 'ws';
import { SUPPORTED_EXCHANGES } from './config.ts';

const TEST_SYMBOL = 'BTCUSDT';
const QUICK_TEST_TIMEOUT = 8000; // 8 seconds per exchange

async function testExchangeQuickly(exchangeId, config) {
    const result = {
        exchangeId,
        status: '❌ FAILED',
        details: '',
        latency: null,
        messages: 0,
        error: null
    };

    try {
        const startTime = Date.now();
        const formattedSymbol = config.formatSymbol(TEST_SYMBOL);
        const wsUrl = config.getWebSocketUrl(formattedSymbol);
        
        const ws = new WebSocket(wsUrl);
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
                if (result.messages > 0) {
                    result.status = '🟡 PARTIAL';
                    result.details = `${result.messages} messages, incomplete data`;
                } else if (result.latency) {
                    result.status = '🔶 NO_DATA';
                    result.details = 'Connected but no valid order book data';
                } else {
                    result.status = '⏰ TIMEOUT';
                    result.details = 'Connection timeout';
                }
                resolve(result);
            }, QUICK_TEST_TIMEOUT);

            let snapshotReceived = false;
            let currentBids = new Map();
            let currentAsks = new Map();
            let validDataCount = 0;

            ws.on('open', () => {
                result.latency = Date.now() - startTime;
                
                if (config.getSubscribeMessage) {
                    const subscribeMsg = config.getSubscribeMessage(formattedSymbol);
                    ws.send(JSON.stringify(subscribeMsg));
                }
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    result.messages++;
                    
                    const orderBookData = config.parseMessage(message, currentBids, currentAsks, snapshotReceived);
                    
                    if (orderBookData && (orderBookData.updatedBids?.size > 0 || orderBookData.updatedAsks?.size > 0)) {
                        validDataCount++;
                        
                        if (orderBookData.isSnapshot) {
                            snapshotReceived = true;
                        }
                        currentBids = orderBookData.updatedBids;
                        currentAsks = orderBookData.updatedAsks;
                        
                        if (validDataCount >= 2) {
                            result.status = '✅ SUCCESS';
                            result.details = `${validDataCount} valid updates, ${currentBids.size} bids, ${currentAsks.size} asks`;
                            clearTimeout(timeout);
                            ws.close();
                            resolve(result);
                        }
                    }
                } catch (parseError) {
                    // Ignore parse errors for this quick test
                }
            });

            ws.on('error', (error) => {
                result.status = '💥 ERROR';
                result.error = error.message;
                result.details = `WebSocket error: ${error.message}`;
                clearTimeout(timeout);
                resolve(result);
            });

            ws.on('close', () => {
                if (validDataCount >= 2) {
                    result.status = '✅ SUCCESS';
                    result.details = `${validDataCount} valid updates`;
                }
            });
        });

    } catch (error) {
        result.status = '💥 ERROR';
        result.error = error.message;
        result.details = `Setup error: ${error.message}`;
        return result;
    }
}

async function runComprehensiveTest() {
    console.log('🚀 CRYPTO EXCHANGE CONNECTIVITY TEST');
    console.log('='.repeat(60));
    console.log(`📊 Testing ${Object.keys(SUPPORTED_EXCHANGES).length} exchanges with ${TEST_SYMBOL}`);
    console.log(`⏱️  Timeout: ${QUICK_TEST_TIMEOUT/1000}s per exchange\n`);

    const results = [];
    const exchanges = Object.entries(SUPPORTED_EXCHANGES);
    
    // Test exchanges in batches to avoid overwhelming
    const batchSize = 5;
    for (let i = 0; i < exchanges.length; i += batchSize) {
        const batch = exchanges.slice(i, i + batchSize);
        console.log(`🔄 Testing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(exchanges.length/batchSize)}...`);
        
        const batchPromises = batch.map(([exchangeId, config]) => 
            testExchangeQuickly(exchangeId, config)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        for (const promiseResult of batchResults) {
            if (promiseResult.status === 'fulfilled') {
                results.push(promiseResult.value);
            } else {
                results.push({
                    exchangeId: 'unknown',
                    status: '💥 ERROR',
                    details: promiseResult.reason.message,
                    latency: null,
                    messages: 0
                });
            }
        }
        
        // Brief pause between batches
        if (i + batchSize < exchanges.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Print results
    console.log('\n📊 FINAL RESULTS');
    console.log('='.repeat(80));
    
    const categories = {
        success: results.filter(r => r.status.includes('SUCCESS')),
        partial: results.filter(r => r.status.includes('PARTIAL')),
        timeout: results.filter(r => r.status.includes('TIMEOUT')),
        noData: results.filter(r => r.status.includes('NO_DATA')),
        error: results.filter(r => r.status.includes('ERROR'))
    };

    // Print by category
    if (categories.success.length > 0) {
        console.log(`\n🎉 FULLY WORKING (${categories.success.length}):`);
        categories.success.forEach(r => {
            console.log(`  ${r.status} ${r.exchangeId.padEnd(15)} - ${r.details} (${r.latency}ms)`);
        });
    }

    if (categories.partial.length > 0) {
        console.log(`\n🟡 PARTIALLY WORKING (${categories.partial.length}):`);
        categories.partial.forEach(r => {
            console.log(`  ${r.status} ${r.exchangeId.padEnd(15)} - ${r.details} (${r.latency}ms)`);
        });
    }

    if (categories.noData.length > 0) {
        console.log(`\n🔶 CONNECTED BUT NO DATA (${categories.noData.length}):`);
        categories.noData.forEach(r => {
            console.log(`  ${r.status} ${r.exchangeId.padEnd(15)} - ${r.details} (${r.latency}ms)`);
        });
    }

    if (categories.timeout.length > 0) {
        console.log(`\n⏰ TIMEOUTS (${categories.timeout.length}):`);
        categories.timeout.forEach(r => {
            console.log(`  ${r.status} ${r.exchangeId.padEnd(15)} - ${r.details}`);
        });
    }

    if (categories.error.length > 0) {
        console.log(`\n💥 ERRORS (${categories.error.length}):`);
        categories.error.forEach(r => {
            console.log(`  ${r.status} ${r.exchangeId.padEnd(15)} - ${r.details}`);
        });
    }

    // Summary
    const total = results.length;
    const working = categories.success.length + categories.partial.length;
    const workingPercent = Math.round((working / total) * 100);
    const successPercent = Math.round((categories.success.length / total) * 100);

    console.log('\n📈 SUMMARY');
    console.log('='.repeat(40));
    console.log(`Total Exchanges: ${total}`);
    console.log(`Fully Working: ${categories.success.length} (${successPercent}%)`);
    console.log(`Partially Working: ${categories.partial.length}`);
    console.log(`Overall Working: ${working}/${total} (${workingPercent}%)`);
    console.log(`Issues: ${total - working}`);

    if (workingPercent >= 90) {
        console.log('\n🏆 EXCELLENT! Almost all exchanges operational!');
    } else if (workingPercent >= 75) {
        console.log('\n👍 GOOD! Most exchanges are functional!');
    } else if (workingPercent >= 50) {
        console.log('\n⚠️  MODERATE! Some exchanges need attention!');
    } else {
        console.log('\n🚨 NEEDS WORK! Many exchanges have issues!');
    }

    console.log('\n💡 Run with `npm run test:exchanges:quick` for detailed debugging');
    console.log('='.repeat(80));
}

runComprehensiveTest().catch(console.error); 
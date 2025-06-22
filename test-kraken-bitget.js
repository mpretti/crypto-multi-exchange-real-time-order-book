/**
 * Test script to debug Kraken and Bitget WebSocket connections
 */

import WebSocket from 'ws';

// Test Kraken WebSocket connection
function testKraken() {
    console.log('🔵 Testing Kraken WebSocket connection...');
    
    const ws = new WebSocket('wss://futures.kraken.com/ws/v1');
    
    ws.on('open', () => {
        console.log('✅ Kraken: Connected successfully');
        
        // Subscribe to BTC spot order book
        const subscribeMessage = JSON.stringify({
            method: 'subscribe',
            params: {
                channel: 'book',
                symbol: ['BTC/USD'],
                depth: 25
            }
        });
        
        ws.send(subscribeMessage);
        console.log('📡 Kraken: Sent subscription for BTC/USD');
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.event === 'subscribed') {
                console.log('✅ Kraken: Subscription confirmed:', message.feed, message.product_ids);
            } else if (message.event === 'alert') {
                console.log('⚠️ Kraken: Alert:', message.message);
            } else if (message.event === 'info') {
                console.log('ℹ️ Kraken: Info:', message.message);
            } else if (message.feed === 'book_ui_1_snapshot' || message.feed === 'book_ui_1') {
                console.log(`📊 Kraken: ${message.feed} data for ${message.product_id}`);
                if (message.bids && message.asks) {
                    console.log(`   Bids: ${message.bids.length}, Asks: ${message.asks.length}`);
                    if (message.bids.length > 0) {
                        console.log(`   Best bid: ${message.bids[0].price} @ ${message.bids[0].qty}`);
                    }
                    if (message.asks.length > 0) {
                        console.log(`   Best ask: ${message.asks[0].price} @ ${message.asks[0].qty}`);
                    }
                }
            } else {
                console.log('📥 Kraken: Other message:', JSON.stringify(message, null, 2));
            }
        } catch (error) {
            console.log('📥 Kraken: Raw data (not JSON):', data.toString());
        }
    });
    
    ws.on('error', (error) => {
        console.error('❌ Kraken: WebSocket error:', error);
    });
    
    ws.on('close', (code, reason) => {
        console.log(`🔴 Kraken: Connection closed - Code: ${code}, Reason: ${reason}`);
    });
}

// Test Bitget WebSocket connection
function testBitget() {
    console.log('🟡 Testing Bitget WebSocket connection...');
    
    const ws = new WebSocket('wss://ws.bitget.com/mix/v1/stream');
    
    ws.on('open', () => {
        console.log('✅ Bitget: Connected successfully');
        
        // Subscribe to BTC perpetual order book
        const subscribeMessage = JSON.stringify({
            op: 'subscribe',
            args: [{
                instType: 'UMCBL',
                channel: 'books5',
                instId: 'BTCUSDT_UMCBL'
            }]
        });
        
        ws.send(subscribeMessage);
        console.log('📡 Bitget: Sent subscription for BTCUSDT_UMCBL');
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.event === 'subscribe') {
                console.log('✅ Bitget: Subscription confirmed for:', message.arg);
            } else if (message.action === 'snapshot' || message.action === 'update') {
                const book = message.data[0];
                if (book) {
                    console.log(`📊 Bitget: ${message.action} data for ${book.instId || 'unknown'}`);
                    if (book.bids && book.asks) {
                        console.log(`   Bids: ${book.bids.length}, Asks: ${book.asks.length}`);
                        if (book.bids.length > 0) {
                            console.log(`   Best bid: ${book.bids[0][0]} @ ${book.bids[0][1]}`);
                        }
                        if (book.asks.length > 0) {
                            console.log(`   Best ask: ${book.asks[0][0]} @ ${book.asks[0][1]}`);
                        }
                    }
                }
            } else {
                console.log('📥 Bitget: Other message:', JSON.stringify(message, null, 2));
            }
        } catch (error) {
            console.log('📥 Bitget: Raw data (not JSON):', data.toString());
        }
    });
    
    ws.on('error', (error) => {
        console.error('❌ Bitget: WebSocket error:', error);
    });
    
    ws.on('close', (code, reason) => {
        console.log(`🔴 Bitget: Connection closed - Code: ${code}, Reason: ${reason}`);
    });
    
    // Set up ping interval for Bitget
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
            console.log('🏓 Bitget: Sent ping');
        }
    }, 30000);
}

console.log('🚀 Starting Kraken and Bitget integration tests...\n');

// Start tests
testKraken();
setTimeout(() => {
    testBitget();
}, 2000);

// Auto-close after 30 seconds
setTimeout(() => {
    console.log('\n✨ Tests completed!');
    process.exit(0);
}, 30000); 
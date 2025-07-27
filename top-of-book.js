// Top of Book - Ultra Fast Implementation
// Streamlined version with only essential functionality

// --- Configuration ---
const EXCHANGE_CONFIGS = {
    binance: {
        id: 'binance',
        name: 'Binance',
        formatSymbol: (symbol) => symbol.toUpperCase(),
        getWebSocketUrl: (symbol) => `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@100ms`,
        parseMessage: (data) => {
            if (data.bids && data.asks) {
                return {
                    bids: data.bids.map(([price, qty]) => [parseFloat(price), parseFloat(qty)]),
                    asks: data.asks.map(([price, qty]) => [parseFloat(price), parseFloat(qty)])
                };
            }
            return null;
        }
    },
    bybit: {
        id: 'bybit',
        name: 'Bybit',
        formatSymbol: (symbol) => symbol.toUpperCase(),
        getWebSocketUrl: (symbol) => 'wss://stream.bybit.com/v5/public/spot',
        getSubscribeMessage: (symbol) => JSON.stringify({
            op: 'subscribe',
            args: [`orderbook.1.${symbol}`]
        }),
        parseMessage: (data) => {
            if (data.topic && data.topic.includes('orderbook') && data.data) {
                const bookData = data.data;
                if (bookData.b && bookData.a) {
                    return {
                        bids: bookData.b.map(([price, qty]) => [parseFloat(price), parseFloat(qty)]),
                        asks: bookData.a.map(([price, qty]) => [parseFloat(price), parseFloat(qty)])
                    };
                }
            }
            return null;
        }
    },
    okx: {
        id: 'okx',
        name: 'OKX',
        formatSymbol: (symbol) => symbol.toUpperCase().replace('USDT', '-USDT'),
        getWebSocketUrl: (symbol) => 'wss://ws.okx.com:8443/ws/v5/public',
        getSubscribeMessage: (symbol) => JSON.stringify({
            op: 'subscribe',
            args: [{ channel: 'books5', instId: symbol }]
        }),
        parseMessage: (data) => {
            if (data.data && data.data[0] && data.data[0].bids && data.data[0].asks) {
                const bookData = data.data[0];
                return {
                    bids: bookData.bids.map(([price, qty]) => [parseFloat(price), parseFloat(qty)]),
                    asks: bookData.asks.map(([price, qty]) => [parseFloat(price), parseFloat(qty)])
                };
            }
            return null;
        }
    },
    kraken: {
        id: 'kraken',
        name: 'Kraken',
        formatSymbol: (symbol) => symbol.replace('USDT', '/USDT'),
        getWebSocketUrl: (symbol) => 'wss://ws.kraken.com',
        getSubscribeMessage: (symbol) => JSON.stringify({
            event: 'subscribe',
            pair: [symbol],
            subscription: { name: 'book', depth: 10 }
        }),
        parseMessage: (data) => {
            if (Array.isArray(data) && data[1] && data[1].bs && data[1].as) {
                return {
                    bids: data[1].bs.map(([price, qty]) => [parseFloat(price), parseFloat(qty)]),
                    asks: data[1].as.map(([price, qty]) => [parseFloat(price), parseFloat(qty)])
                };
            }
            return null;
        }
    },
    hyperliquid: {
        id: 'hyperliquid',
        name: 'Hyperliquid',
        formatSymbol: (symbol) => symbol.replace('USDT', '').replace('USDC', ''),
        getWebSocketUrl: (symbol) => 'wss://api.hyperliquid.xyz/ws',
        getSubscribeMessage: (symbol) => JSON.stringify({
            method: 'subscribe',
            subscription: { type: 'l2Book', coin: symbol }
        }),
        parseMessage: (data) => {
            if (data.channel === 'l2Book' && data.data) {
                const bookData = data.data;
                if (bookData.levels && bookData.levels[0]) {
                    const bids = bookData.levels[0].filter(([, , side]) => side === 'B')
                        .map(([price, sz]) => [parseFloat(price), parseFloat(sz)]);
                    const asks = bookData.levels[0].filter(([, , side]) => side === 'A')
                        .map(([price, sz]) => [parseFloat(price), parseFloat(sz)]);
                    return { bids, asks };
                }
            }
            return null;
        }
    }
};

// --- State ---
let selectedAsset = 'BTCUSDT';
let selectedExchanges = new Set(['binance', 'bybit', 'okx']);
let connections = new Map();
let topOfBookData = new Map();

// --- DOM Elements ---
const assetSelect = document.getElementById('asset-select');
const exchangeSelector = document.getElementById('exchange-selector');
const bidsListEl = document.getElementById('bids-list');
const asksListEl = document.getElementById('asks-list');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const spreadValue = document.getElementById('spread-value');
const refreshBtn = document.getElementById('refresh-btn');

// --- Core Functions ---
function connectToExchange(exchangeId) {
    const config = EXCHANGE_CONFIGS[exchangeId];
    if (!config) return;

    const formattedSymbol = config.formatSymbol(selectedAsset);
    const wsUrl = config.getWebSocketUrl(formattedSymbol);
    
    try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log(`✅ Connected to ${config.name}`);
            
            // Send subscription message if needed
            if (config.getSubscribeMessage) {
                const subscribeMsg = config.getSubscribeMessage(formattedSymbol);
                ws.send(subscribeMsg);
            }
            
            connections.set(exchangeId, {
                ws,
                config,
                status: 'connected',
                lastUpdate: Date.now()
            });
            
            updateConnectionStatus();
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const parsed = config.parseMessage(data);
                
                if (parsed && parsed.bids && parsed.asks) {
                    // Get best bid (highest price) and best ask (lowest price)
                    const bestBid = parsed.bids.length > 0 ? parsed.bids[0] : null;
                    const bestAsk = parsed.asks.length > 0 ? parsed.asks[0] : null;
                    
                    if (bestBid || bestAsk) {
                        topOfBookData.set(exchangeId, {
                            exchange: exchangeId,
                            name: config.name,
                            bestBid: bestBid ? { price: bestBid[0], quantity: bestBid[1] } : null,
                            bestAsk: bestAsk ? { price: bestAsk[0], quantity: bestAsk[1] } : null,
                            timestamp: Date.now()
                        });
                        
                        updateTopOfBookDisplay();
                    }
                }
            } catch (error) {
                console.error(`Error parsing message from ${config.name}:`, error);
            }
        };
        
        ws.onerror = (error) => {
            console.error(`❌ WebSocket error for ${config.name}:`, error);
            connections.set(exchangeId, {
                ...connections.get(exchangeId),
                status: 'error'
            });
            updateConnectionStatus();
        };
        
        ws.onclose = () => {
            console.log(`🔌 Disconnected from ${config.name}`);
            connections.delete(exchangeId);
            topOfBookData.delete(exchangeId);
            updateConnectionStatus();
            updateTopOfBookDisplay();
            
            // Auto-reconnect after 5 seconds
            setTimeout(() => {
                if (selectedExchanges.has(exchangeId)) {
                    connectToExchange(exchangeId);
                }
            }, 5000);
        };
        
    } catch (error) {
        console.error(`Failed to connect to ${config.name}:`, error);
    }
}

function disconnectFromExchange(exchangeId) {
    const connection = connections.get(exchangeId);
    if (connection && connection.ws) {
        connection.ws.close();
    }
    connections.delete(exchangeId);
    topOfBookData.delete(exchangeId);
    updateConnectionStatus();
    updateTopOfBookDisplay();
}

function updateTopOfBookDisplay() {
    // Clear existing lists
    bidsListEl.innerHTML = '';
    asksListEl.innerHTML = '';
    
    if (topOfBookData.size === 0) {
        bidsListEl.innerHTML = '<li class="no-data">No data available</li>';
        asksListEl.innerHTML = '<li class="no-data">No data available</li>';
        return;
    }
    
    // Collect all bids and asks
    const allBids = [];
    const allAsks = [];
    
    topOfBookData.forEach((data, exchangeId) => {
        if (data.bestBid) {
            allBids.push({
                ...data.bestBid,
                exchange: exchangeId,
                name: data.name
            });
        }
        if (data.bestAsk) {
            allAsks.push({
                ...data.bestAsk,
                exchange: exchangeId,
                name: data.name
            });
        }
    });
    
    // Sort bids (highest price first) and asks (lowest price first)
    allBids.sort((a, b) => b.price - a.price);
    allAsks.sort((a, b) => a.price - b.price);
    
    // Display bids
    allBids.forEach(bid => {
        const li = document.createElement('li');
        li.className = 'book-item bid-item';
        li.innerHTML = `
            <span class="exchange">${bid.name}</span>
            <span class="price">$${bid.price.toFixed(2)}</span>
            <span class="quantity">${bid.quantity.toFixed(4)}</span>
        `;
        bidsListEl.appendChild(li);
    });
    
    // Display asks
    allAsks.forEach(ask => {
        const li = document.createElement('li');
        li.className = 'book-item ask-item';
        li.innerHTML = `
            <span class="exchange">${ask.name}</span>
            <span class="price">$${ask.price.toFixed(2)}</span>
            <span class="quantity">${ask.quantity.toFixed(4)}</span>
        `;
        asksListEl.appendChild(li);
    });
    
    // Update spread
    if (allBids.length > 0 && allAsks.length > 0) {
        const bestBidPrice = allBids[0].price;
        const bestAskPrice = allAsks[0].price;
        const spread = bestAskPrice - bestBidPrice;
        const spreadPercent = (spread / bestBidPrice) * 100;
        
        spreadValue.textContent = `$${spread.toFixed(2)} (${spreadPercent.toFixed(3)}%)`;
    } else {
        spreadValue.textContent = '-';
    }
}

function updateConnectionStatus() {
    const connectedCount = Array.from(connections.values()).filter(c => c.status === 'connected').length;
    const totalSelected = selectedExchanges.size;
    
    statusText.textContent = `${connectedCount}/${totalSelected} exchanges connected`;
    
    if (connectedCount === totalSelected && totalSelected > 0) {
        statusIndicator.className = 'status-indicator connected';
    } else if (connectedCount > 0) {
        statusIndicator.className = 'status-indicator connecting';
    } else {
        statusIndicator.className = 'status-indicator error';
    }
}

function reconnectAll() {
    // Disconnect all existing connections
    connections.forEach((connection, exchangeId) => {
        if (connection.ws) {
            connection.ws.close();
        }
    });
    connections.clear();
    topOfBookData.clear();
    
    // Reconnect to selected exchanges
    selectedExchanges.forEach(exchangeId => {
        connectToExchange(exchangeId);
    });
    
    updateTopOfBookDisplay();
}

// --- Event Listeners ---
assetSelect.addEventListener('change', (e) => {
    selectedAsset = e.target.value;
    reconnectAll();
});

exchangeSelector.addEventListener('click', (e) => {
    const pill = e.target.closest('.exchange-pill');
    if (pill) {
        const exchangeId = pill.dataset.exchange;
        const checkbox = pill.querySelector('input[type="checkbox"]');
        const isActive = pill.dataset.active === 'true';
        
        if (isActive) {
            // Deactivate
            selectedExchanges.delete(exchangeId);
            pill.dataset.active = 'false';
            checkbox.checked = false;
            disconnectFromExchange(exchangeId);
        } else {
            // Activate
            selectedExchanges.add(exchangeId);
            pill.dataset.active = 'true';
            checkbox.checked = true;
            connectToExchange(exchangeId);
        }
    }
});

refreshBtn.addEventListener('click', () => {
    reconnectAll();
});

// --- Initialize ---
function init() {
    console.log('🚀 Initializing Top of Book page...');
    
    // Set initial asset
    assetSelect.value = selectedAsset;
    
    // Connect to initially selected exchanges
    selectedExchanges.forEach(exchangeId => {
        connectToExchange(exchangeId);
    });
    
    updateConnectionStatus();
    
    console.log('✅ Top of Book page initialized');
}

// Start the application
init();

// Add periodic cleanup for stale data
setInterval(() => {
    const now = Date.now();
    const staleThreshold = 30000; // 30 seconds
    
    topOfBookData.forEach((data, exchangeId) => {
        if (now - data.timestamp > staleThreshold) {
            console.log(`🧹 Removing stale data for ${data.name}`);
            topOfBookData.delete(exchangeId);
            updateTopOfBookDisplay();
        }
    });
}, 10000); // Check every 10 seconds 
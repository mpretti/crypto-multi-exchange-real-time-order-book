
// Updated SUPPORTED_EXCHANGES based on CCXT analysis
// Generated on 2025-07-22T05:09:58.427Z

export const SUPPORTED_EXCHANGES: Record<string, ExchangeConfig> = {
    binance:     {
            "id": "binance",
            "name": "Binance",
            "status": "✅ Working - Order Book, Ticker, Kline (3/3 feeds)"
    },
    bybit:     {
            "id": "bybit",
            "name": "Bybit",
            "pingIntervalMs": 20000,
            "needsSnapshotFlag": true,
            "sliceDepth": 50,
            "status": "✅ Working - Order Book, Ticker, Kline (3/3 feeds)"
    },
    okx:     {
            "id": "okx",
            "name": "OKX",
            "pingIntervalMs": 25000,
            "needsSnapshotFlag": false,
            "sliceDepth": 50,
            "status": "✅ Working - Order Book, Ticker, Kline (3/3 feeds)"
    },
    kraken:     {
            "id": "kraken",
            "name": "Kraken",
            "needsSnapshotFlag": false,
            "sliceDepth": 50,
            "status": "✅ Working - Order Book, Ticker (2/3 feeds)"
    },
    bitget:     {
            "id": "bitget",
            "name": "Bitget",
            "needsSnapshotFlag": false,
            "sliceDepth": 50,
            "status": "✅ Working - Order Book (1/3 feeds)"
    },
    gate:     {
            "id": "gate",
            "name": "Gate.io",
            "needsSnapshotFlag": false,
            "sliceDepth": 50,
            "status": "✅ Working - Order Book (1/3 feeds)"
    },
    mexc:     {
            "id": "mexc",
            "name": "MEXC",
            "needsSnapshotFlag": false,
            "sliceDepth": 50,
            "status": "✅ Working - Order Book (1/3 feeds)"
    },
    coinbase:     {
            "id": "coinbase",
            "name": "Coinbase",
            "needsSnapshotFlag": false,
            "sliceDepth": 50,
            "status": "✅ Working - Order Book (1/3 feeds)"
    },
};

/* 
NON-WORKING EXCHANGES (Removed from active config):
- huobi: WebSocket configuration not implemented or not working
- bingx: WebSocket configuration not implemented or not working
- whitebit: WebSocket configuration not implemented or not working
- lbank: WebSocket configuration not implemented or not working
- phemex: WebSocket configuration not implemented or not working
- ascendex: WebSocket configuration not implemented or not working
- kucoin: WebSocket configuration not implemented or not working
- bitmart: WebSocket configuration not implemented or not working
- bitfinex: WebSocket configuration not implemented or not working
- hyperliquid: WebSocket configuration not implemented or not working
*/

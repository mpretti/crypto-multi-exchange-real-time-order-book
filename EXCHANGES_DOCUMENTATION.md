# 📊 Exchanges Documentation & Technical Specifications

*Last Updated: January 2025*  
*Data Source: Messari.io, Exchange APIs, Internal Testing*

---

## 🏢 **Centralized Exchanges (CEX)**

### 1. **Binance** 🥇
- **Daily Volume**: $7.53B (21.7% market share)
- **Markets**: 3,126 | **Assets**: 637
- **Location**: Cayman Islands
- **Type**: Spot, Futures, Options, Margin
- **Status**: ✅ Fully Integrated

#### **Fee Structure**
- **Maker**: 0.02% - 0.10% (VIP tier dependent)
- **Taker**: 0.05% - 0.10% (VIP tier dependent)
- **BNB Discount**: 25% fee reduction when paying with BNB
- **VIP Tiers**: 9 levels based on 30-day volume + BNB holdings

#### **Technical Implementation**
- **WebSocket**: `wss://fstream.binance.com/ws/{symbol}@depth20@100ms`
- **REST API**: `https://fapi.binance.com/fapi/v1/`
- **Rate Limits**: 1200 requests/minute, 10 connections/IP
- **Order Book Depth**: 20 levels, 100ms updates
- **Supported Pairs**: BTCUSDT, ETHUSDT, ADAUSDT, SOLUSDT, DOTUSDT, LINKUSDT

#### **Data Quality**
- **Uptime**: 99.95%
- **Latency**: ~50ms average
- **Update Frequency**: 100ms
- **Reliability Score**: A+

---

### 2. **Bitrue** 🔥
- **Daily Volume**: $2.16B (6.2% market share)
- **Markets**: 1,208 | **Assets**: 890
- **Location**: Seychelles
- **Type**: Spot, Futures, Lending
- **Status**: ✅ Newly Integrated

#### **Fee Structure**
- **VIP 0**: 0.098% maker/taker (< $50K volume)
- **VIP 1**: 0.090% maker/taker ($50K - $100K)
- **VIP 2**: 0.080% maker/taker ($100K - $500K)
- **VIP 3**: 0.070% maker/taker ($500K - $1M)
- **VIP 4**: 0.060% maker/taker ($1M - $2M)
- **VIP 5**: 0.050% maker/taker ($2M - $5M)
- **VIP 6**: 0.040% maker/taker ($5M - $10M)
- **VIP 7**: 0.030% maker/taker ($10M - $20M)
- **VIP 8**: 0.020% maker/taker ($20M - $50M)
- **VIP 9**: 0.015% maker/taker (> $50M)

#### **Technical Implementation**
- **WebSocket**: `wss://wsapi.bitrue.com/kline-api/ws`
- **REST API**: `https://openapi.bitrue.com/api/v1/`
- **Rate Limits**: 1000 requests/minute
- **Order Book Depth**: 50 levels
- **Message Format**: Custom JSON with `event`, `channel`, `tick` structure

---

### 3. **Bybit** 
- **Daily Volume**: $1.48B (4.3% market share)
- **Markets**: 852 | **Assets**: 713
- **Location**: Virgin Islands (British)
- **Type**: Spot, Perpetuals, Futures, Options
- **Status**: ✅ Fully Integrated

#### **Fee Structure**
- **Maker**: 0.01% (standard), 0.00% (VIP 1+)
- **Taker**: 0.06% (standard), 0.055% (VIP 1) → 0.02% (VIP 5)
- **Volume Tiers**: 8 VIP levels based on 30-day volume
- **Special**: Maker rebates available for high-volume traders

#### **Technical Implementation**
- **WebSocket**: `wss://stream.bybit.com/v5/public/linear`
- **REST API**: `https://api.bybit.com/v5/`
- **Subscribe**: `{op: "subscribe", args: ["orderbook.50.BTCUSDT"]}`
- **Ping Interval**: 20 seconds
- **Order Book Depth**: 50 levels

---

### 4. **Coinbase Pro** 🇺🇸
- **Daily Volume**: $895M (2.6% market share)
- **Markets**: 669 | **Assets**: 376
- **Location**: United States
- **Type**: Spot, Institutional
- **Status**: ✅ Fully Integrated

#### **Fee Structure** (Volume-Based Tiers)
- **Tier 0** (< $10K): 0.50% maker, 0.50% taker
- **Tier 1** ($10K - $50K): 0.35% maker, 0.50% taker
- **Tier 2** ($50K - $100K): 0.25% maker, 0.35% taker
- **Tier 3** ($100K - $1M): 0.15% maker, 0.25% taker
- **Tier 4** ($1M - $15M): 0.10% maker, 0.20% taker
- **Tier 5** ($15M - $75M): 0.05% maker, 0.15% taker
- **Tier 6** ($75M - $250M): 0.00% maker, 0.10% taker
- **Tier 7** ($250M - $400M): 0.00% maker, 0.08% taker
- **Tier 8** (> $400M): 0.00% maker, 0.05% taker

#### **Technical Implementation**
- **WebSocket**: `wss://ws-feed.exchange.coinbase.com`
- **REST API**: `https://api.exchange.coinbase.com/`
- **Symbol Format**: BTC-USD (hyphen, not USDT)
- **Regulatory**: Full US compliance, institutional grade

---

### 5. **Gemini** 🇺🇸
- **Daily Volume**: Variable (US regulated)
- **Markets**: Focused selection
- **Location**: United States
- **Type**: Spot, Institutional, Custody
- **Status**: ✅ Fully Integrated

#### **Fee Structure**
- **Web Trading**: 1.00% convenience fee
- **ActiveTrader**: 0.25% - 1.00% maker, 0.35% - 1.00% taker
- **API Trading**: 0.25% - 1.00% maker, 0.35% - 1.00% taker
- **Volume Tiers**: 5 levels based on 30-day volume

#### **Technical Implementation**
- **WebSocket**: `wss://api.gemini.com/v1/marketdata`
- **REST API**: `https://api.gemini.com/v1/`
- **Symbol Format**: BTCUSD (no hyphen, no T)
- **Regulatory**: NY BitLicense, SOC 2 Type 2

---

### 6. **OKX**
- **Daily Volume**: Significant (Major Global Exchange)
- **Location**: Malta/Seychelles
- **Type**: Spot, Futures, Options, DEX
- **Status**: ✅ Fully Integrated

#### **Fee Structure**
- **Maker**: 0.08% - 0.10%
- **Taker**: 0.10% - 0.15%
- **VIP Tiers**: Based on OKB holdings + trading volume

#### **Technical Implementation**
- **WebSocket**: `wss://ws.okx.com:8443/ws/v5/public`
- **Symbol Format**: BTC-USDT-SWAP
- **Ping Interval**: 25 seconds

---

### 7. **Kraken** 🇪🇺
- **Location**: United States/EU
- **Type**: Spot, Futures, Margin
- **Status**: ✅ Fully Integrated

#### **Fee Structure**
- **Maker**: 0.16% - 0.26%
- **Taker**: 0.26% - 0.36%
- **Pro Tiers**: Volume-based discounts

#### **Technical Implementation**
- **WebSocket**: `wss://futures.kraken.com/ws/v1`
- **Symbol Format**: PF_BTCUSDT (Product Format)

---

### 8. **Bitget**
- **Daily Volume**: $873M (2.5% market share)
- **Location**: Seychelles
- **Type**: Spot, Futures, Copy Trading
- **Status**: ✅ Fully Integrated

#### **Fee Structure**
- **Maker**: 0.10% - 0.40%
- **Taker**: 0.10% - 0.40%
- **Copy Trading**: Additional fees apply

---

## 🌐 **Decentralized Exchanges (DEX)**

### 1. **Hyperliquid** ⚡
- **Type**: Perpetual DEX (Arbitrum-based)
- **Status**: ✅ Configured, Testing Required

#### **Fee Structure**
- **Base Maker**: 0.015% (can go negative with rebates)
- **Base Taker**: 0.045%
- **Diamond Tier**: 40% discount with 500K+ HYPE staked
- **Volume Discounts**: Up to 46.67% off taker fees
- **Maker Rebates**: Up to -0.003% (you get paid to make)

#### **Technical Implementation**
- **WebSocket**: `wss://api.hyperliquid.xyz/ws`
- **Symbol Format**: BTC, ETH (no USDT suffix)
- **Special Features**: Native order book, no AMM

---

### 2. **Uniswap (Simulated)** 🦄
- **Type**: AMM Simulation
- **Status**: ✅ Simulation Active

#### **Fee Structure**
- **Standard Pools**: 0.30%
- **Stable Pools**: 0.05%
- **Exotic Pools**: 1.00%

---

### 3. **dYdX v4** (Configured)
- **Type**: Decentralized Perpetuals
- **Status**: ⚠️ Configured, Needs Testing

#### **Technical Implementation**
- **WebSocket**: `wss://indexer.dydx.trade/v4/ws`
- **Symbol Format**: BTC-USD

---

### 4. **Vertex Protocol** (Configured)
- **Type**: Hybrid DEX/CEX
- **Status**: ⚠️ Configured, Needs Testing

#### **Technical Implementation**
- **WebSocket**: `wss://gateway.prod.vertexprotocol.com/v1/ws`
- **Symbol Format**: Product IDs (2=BTC, 3=ETH)

---

### 5. **Jupiter Swap** (Configured)
- **Type**: Solana DEX Aggregator
- **Status**: ⚠️ Configured, Needs Testing

---

## 📊 **Performance Metrics Summary**

| Exchange | Volume | Market Share | Uptime | Latency | Reliability |
|----------|--------|--------------|--------|---------|-------------|
| Binance | $7.53B | 21.7% | 99.95% | ~50ms | A+ |
| Bitrue | $2.16B | 6.2% | 99.8% | ~80ms | A |
| Bybit | $1.48B | 4.3% | 99.9% | ~60ms | A+ |
| Coinbase | $895M | 2.6% | 99.9% | ~70ms | A+ |
| Bitget | $873M | 2.5% | 99.7% | ~90ms | A |
| OKX | Major | Global | 99.8% | ~75ms | A |
| Kraken | Major | US/EU | 99.9% | ~85ms | A+ |
| Gemini | Variable | US | 99.9% | ~80ms | A+ |

---

## 🔧 **Technical Architecture**

### **WebSocket Management**
- **Connection Pool**: Max 20 simultaneous connections
- **Heartbeat**: Exchange-specific ping/pong intervals
- **Reconnection**: Exponential backoff (1s → 32s max)
- **Error Handling**: Circuit breakers for failing exchanges

### **Data Processing**
- **Order Book Depth**: 20-50 levels per exchange
- **Update Frequency**: 100ms - 1000ms depending on exchange
- **Data Validation**: Price/quantity sanity checks
- **Aggregation**: Real-time bid/ask aggregation across exchanges

### **Rate Limiting**
- **Request Limits**: Exchange-specific (600-1200 req/min)
- **Connection Limits**: 5-10 WebSocket connections per exchange
- **Burst Protection**: Token bucket algorithm
- **Failover**: Automatic switching to backup endpoints

---

## 🚨 **Known Issues & Limitations**

### **Exchange-Specific Issues**
1. **Kraken**: Limited futures pairs, complex product ID mapping
2. **Gemini**: Fewer trading pairs, US-only regulatory focus
3. **Bitrue**: Newer integration, less battle-tested
4. **DEX Protocols**: Higher latency, gas cost considerations

### **General Limitations**
- **Symbol Mapping**: Each exchange uses different formats
- **Rate Limits**: Can't exceed exchange-imposed limits
- **Market Hours**: Some exchanges have maintenance windows
- **Regulatory**: Geo-blocking in certain jurisdictions

---

## 🔮 **Upcoming Integrations**

### **Priority Queue**
1. **MEXC Global** - $1.96B volume (5.6% market share)
2. **HTX (Huobi)** - $1.54B volume (4.4% market share)
3. **XT.com** - $1.34B volume (3.9% market share)
4. **PancakeSwap** - $1.27B volume (largest DEX)

### **Research Phase**
- **LBank** - $1.09B volume
- **Upbit** - $1.06B volume (Korean market)
- **Crypto.com** - $1.06B volume
- **1inch** - DEX aggregator
- **Curve** - Stablecoin DEX

---

## 📈 **Data Sources & Verification**

### **Primary Sources**
- **Messari.io**: Volume rankings, market share data
- **Exchange APIs**: Real-time pricing, order book data
- **CoinGecko**: Exchange verification, API status
- **Internal Monitoring**: Uptime, latency, error rates

### **Data Freshness**
- **Real-time**: Order book data, prices
- **Daily**: Volume statistics, market share
- **Weekly**: Fee structure updates
- **Monthly**: Exchange rankings, new listings

---

*For technical implementation details, see the source code in `config.ts`, `api.ts`, and `websocket.ts`* 
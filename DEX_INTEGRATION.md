# DEX Perpetual Swap Integration Guide

## Overview
This document outlines the integration of decentralized perpetual swap exchanges into the real-time order book application.

## Supported DEX Exchanges

### **Ethereum & Layer 2s**

#### 1. **dYdX** (StarkEx/Ethereum)
- **Volume**: $2-5B daily
- **Features**: Professional trading, isolated margins, advanced orders
- **API**: REST + WebSocket
- **WebSocket**: `wss://api.dydx.exchange/v3/ws`
- **Symbols**: BTC-USD, ETH-USD, etc.

#### 2. **GMX** (Arbitrum/Avalanche)
- **Volume**: $100-500M daily
- **Features**: Zero-price-impact trades, real yield
- **Liquidity**: GLP pools (multi-asset)
- **API**: Custom WebSocket feeds
- **WebSocket**: `wss://api.gmx.io/ws`

#### 3. **Gains Network** (Arbitrum/Polygon)
- **Volume**: $50-200M daily
- **Features**: Leveraged trading up to 150x
- **API**: GraphQL + WebSocket
- **WebSocket**: `wss://api.gainsnetwork.io/ws`

### **Solana**

#### 1. **Drift Protocol**
- **Volume**: $50-200M daily
- **Features**: AMM + orderbook hybrid, cross-margin
- **API**: Custom WebSocket
- **WebSocket**: `wss://api.drift.trade/ws`
- **Symbols**: SOL-PERP, BTC-PERP, ETH-PERP

#### 2. **Mango Markets**
- **Volume**: $20-100M daily
- **Features**: Cross-margin trading, lending integration
- **API**: Custom WebSocket
- **WebSocket**: `wss://api.mngo.cloud/ws`

## Implementation Details

### WebSocket Message Formats

#### dYdX
```json
{
  "type": "channel_data",
  "channel": "v3_orderbook",
  "id": "BTC-USD",
  "contents": {
    "bids": [["50000", "1.5"], ["49999", "2.0"]],
    "asks": [["50001", "1.2"], ["50002", "0.8"]],
    "snapshot": true
  }
}
```

#### GMX
```json
{
  "method": "subscription",
  "params": {
    "channel": "orderbook.BTC-USD",
    "data": {
      "bids": [["50000", "1.5"]],
      "asks": [["50001", "1.2"]]
    }
  }
}
```

#### Drift Protocol
```json
{
  "channel": "orderbook",
  "market": "BTC-PERP",
  "data": {
    "bids": [{"price": 50000, "size": 1.5}],
    "asks": [{"price": 50001, "size": 1.2}],
    "snapshot": false
  }
}
```

### Data Considerations

#### 1. **Liquidity Differences**
- DEX liquidity is typically lower than CEX
- Price impact considerations for large orders
- Slippage calculations needed

#### 2. **Update Frequencies**
- CEX: ~100ms updates
- DEX: ~1-5s updates (blockchain dependent)
- Some DEXs use off-chain orderbooks with on-chain settlement

#### 3. **Symbol Mapping**
```typescript
const SYMBOL_MAPPING = {
  'BTCUSDT': {
    dydx: 'BTC-USD',
    gmx: 'BTC-USD',
    drift: 'BTC-PERP',
    mango: 'BTC-PERP'
  }
};
```

## Advanced Features

### 1. **Cross-Chain Arbitrage Detection**
```typescript
interface ArbitrageOpportunity {
  buyExchange: string;
  sellExchange: string;
  profit: number;
  profitPercent: number;
  volume: number;
}
```

### 2. **Liquidity Aggregation**
- Combine CEX + DEX liquidity
- Smart order routing
- Optimal execution paths

### 3. **DeFi-Specific Metrics**
- Total Value Locked (TVL)
- Funding rates comparison
- Governance token yields
- Impermanent loss calculations

## Integration Challenges

### 1. **Rate Limiting**
- Different rate limits per DEX
- Some require authentication for higher limits
- Implement exponential backoff

### 2. **Data Quality**
- Validate price feeds against multiple sources
- Handle stale data gracefully
- Circuit breakers for anomalous data

### 3. **Network Dependencies**
- Ethereum L2 sequencer uptime
- Solana network congestion
- Cross-chain bridge delays

## Future Enhancements

### 1. **Additional DEX Integrations**
- **Synthetix Perps** (Optimism)
- **Vertex Protocol** (Arbitrum)
- **Hyperliquid** (Custom L1)
- **Jupiter Perps** (Solana)

### 2. **Advanced Analytics**
- Funding rate arbitrage
- Basis trading opportunities
- Cross-chain yield farming

### 3. **Trading Integration**
- Direct DEX trading
- Cross-DEX arbitrage execution
- Portfolio management

## API Endpoints Summary

| Exchange | REST API | WebSocket | Rate Limit |
|----------|----------|-----------|------------|
| dYdX | `https://api.dydx.exchange/v3` | `wss://api.dydx.exchange/v3/ws` | 175/min |
| GMX | `https://api.gmx.io/v2` | `wss://api.gmx.io/ws` | 100/min |
| Drift | `https://api.drift.trade/v1` | `wss://api.drift.trade/ws` | 200/min |
| Mango | `https://api.mngo.cloud/v4` | `wss://api.mngo.cloud/ws` | 150/min |

## Security Considerations

1. **API Key Management**: Store keys securely, rotate regularly
2. **Rate Limit Compliance**: Implement proper throttling
3. **Data Validation**: Verify all incoming data
4. **Error Handling**: Graceful degradation on failures
5. **Monitoring**: Alert on connection failures or data anomalies

## Testing Strategy

1. **Unit Tests**: Individual exchange parsers
2. **Integration Tests**: Full WebSocket flows
3. **Load Tests**: High-frequency data scenarios
4. **Chaos Tests**: Network failure simulations 
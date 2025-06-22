# Crypto Multi-Exchange Real-Time Order Book

A real-time cryptocurrency order book aggregator that connects to multiple centralized (CEX) and decentralized (DEX) exchanges to display live bid/ask data with arbitrage detection.

## Features

- **Multi-Exchange Support**: Connects to Binance, Bybit, OKX, Kraken, Bitget, Uniswap, Hyperliquid, Vertex, dYdX, and Jupiter
- **Real-Time Data**: WebSocket connections for live order book updates
- **Arbitrage Detection**: Automatically detects and highlights profitable arbitrage opportunities
- **Fee-Adjusted Pricing**: Toggle to show true cost of taking liquidity including exchange fees
- **Collapsible Exchange Selector**: Space-efficient horizontal layout with show/hide functionality
- **Aggregated & Individual Views**: Switch between combined order book or per-exchange breakdown
- **Market Statistics**: Sidebar with trading fees, funding rates, and volume data
- **Modern UI**: Dark theme with responsive design and pill-style exchange selection

## Recent Improvements

- **Horizontal Exchange Layout**: Exchanges now display horizontally in a compact, collapsible format
- **Improved Toggle Placement**: Fee-adjusted pricing toggle relocated to header controls for better UX
- **Removed Non-Working Features**: Charts and text summarizer removed to focus on core functionality
- **Enhanced Arbitrage Display**: Clear profit indicators with animated highlights when opportunities arise

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173` (or the port shown in terminal)

## Usage

1. **Select Asset**: Choose from BTC/USDT, ETH/USDT, ADA/USDT, SOL/USDT, DOT/USDT, or LINK/USDT
2. **Toggle Exchanges**: Click the arrow button next to "Exchanges" to show/hide exchange selection
3. **Enable Exchanges**: Click exchange pills to connect/disconnect from different exchanges
4. **Fee Adjustment**: Toggle "Fee-Adjusted" to see prices including trading fees
5. **View Modes**: Switch between "Aggregated" (combined) and "Individual" (per-exchange) views
6. **Monitor Arbitrage**: Watch for highlighted profit opportunities between exchanges

## Architecture

- **Frontend**: TypeScript + Vite
- **Real-time**: WebSocket connections to exchange APIs
- **State Management**: Centralized state with reactive updates
- **Modular Design**: Separated concerns (DOM, state, websockets, UI updates, etc.)

## Supported Exchanges

### Centralized Exchanges (CEX)
- Binance - ✅ Fully Working
- Bybit - ✅ Fully Working  
- OKX - ⚠️ Configured
- Kraken - ⚠️ Configured
- Bitget - ⚠️ Configured
- Uniswap (Simulated) - ⚠️ Configured

### Decentralized Exchanges (DEX)
- Hyperliquid - ✅ Fully Working
- Vertex Protocol - ❌ API Issues
- dYdX v4 - ⚠️ Configured but Untested
- Jupiter - ❌ No Order Book API

## License

Apache-2.0

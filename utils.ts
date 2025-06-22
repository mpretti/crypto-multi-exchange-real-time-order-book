/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { OrderBookEntry, OrderBookLevel } from './types';
import { smallOrderFilterEnabled, minOrderSizeUsd, minOrderSizeAsset, selectedAsset } from './state';

export function getDecimalPlaces(price: number): number {
    if (price === 0 || isNaN(price) || !isFinite(price) ) return 2;
    const absPrice = Math.abs(price);
    if (absPrice >= 1000) return 2;
    if (absPrice >= 100) return 2;
    if (absPrice >= 1) return 3;
    if (absPrice >= 0.01) return 4;
    if (absPrice >= 0.0001) return 5;
    return 6;
}

/**
 * Filter out small orders based on configurable thresholds
 */
export function filterSmallOrders(entries: OrderBookEntry[], currentPrice?: number): OrderBookEntry[] {
    if (!smallOrderFilterEnabled) {
        return entries;
    }

    return entries.filter(entry => {
        // Filter by asset quantity
        if (entry.quantity < minOrderSizeAsset) {
            return false;
        }

        // Filter by USD value if we have a current price
        if (currentPrice && currentPrice > 0) {
            const usdValue = entry.quantity * currentPrice;
            if (usdValue < minOrderSizeUsd) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Get estimated current price for filtering purposes
 */
export function getEstimatedPrice(bids: OrderBookEntry[], asks: OrderBookEntry[]): number {
    const bestBid = bids.length > 0 ? bids[0].price : 0;
    const bestAsk = asks.length > 0 ? asks[0].price : 0;
    
    if (bestBid > 0 && bestAsk > 0) {
        return (bestBid + bestAsk) / 2; // Mid price
    } else if (bestBid > 0) {
        return bestBid;
    } else if (bestAsk > 0) {
        return bestAsk;
    }
    
    return 0;
}

export function mapToSortedEntries(map: Map<string, number>, descending: boolean = false, _exchangeId?: string): OrderBookEntry[] {
    return Array.from(map.entries())
        .map(([priceStr, quantity]) => ({ price: parseFloat(priceStr), quantity, exchangeId: _exchangeId }))
        .filter(entry => entry.quantity > 0)
        .sort((a, b) => descending ? b.price - a.price : a.price - b.price);
}

export function applyDepthSlice(entries: Map<string, number>, sliceDepth: number | undefined, isBids: boolean): Map<string, number> {
    if (!sliceDepth || entries.size <= sliceDepth) {
        return entries;
    }
    const sorted = Array.from(entries.entries())
        .map(([price, quantity]) => ({ price: parseFloat(price), quantity }))
        .sort((a,b) => isBids ? b.price - a.price : a.price - b.price);

    const sliced = sorted.slice(0, sliceDepth);
    const newMap = new Map<string, number>();
    sliced.forEach(item => newMap.set(item.price.toString(), item.quantity));
    return newMap;
}

export function calculateCumulative(levels: OrderBookEntry[]): OrderBookLevel[] {
    let cumulativeQuantity = 0; const result: OrderBookLevel[] = [];
    for (const level of levels) {
        cumulativeQuantity += level.quantity;
        result.push({ ...level, total: cumulativeQuantity });
    }
    return result;
}

/**
 * Calculate fee-adjusted price for taking liquidity
 * @param price - Original price
 * @param side - 'bid' or 'ask' 
 * @param exchangeId - Exchange identifier
 * @param feeInfo - Fee information from exchange
 * @returns Fee-adjusted price that shows true cost of taking liquidity
 */
export function calculateFeeAdjustedPrice(
    price: number, 
    side: 'bid' | 'ask', 
    _exchangeId: string, 
    feeInfo: any
): number {
    if (!feeInfo || !feeInfo.takerRate) {
        return price; // Return original price if no fee info
    }

    // Parse taker fee rate (e.g., "0.001" = 0.1%)
    const takerFeeRate = parseFloat(feeInfo.takerRate) || 0;
    
    if (side === 'bid') {
        // For bids: buyer pays more due to fees
        // Effective price = bid_price * (1 + fee_rate)
        return price * (1 + takerFeeRate);
    } else {
        // For asks: seller receives less due to fees  
        // Effective price = ask_price * (1 - fee_rate)
        return price * (1 - takerFeeRate);
    }
}

/**
 * Get fee-adjusted order book data
 * @param orderBookData - Original order book data
 * @param feeAdjusted - Whether to apply fee adjustment
 * @param connections - Exchange connections with fee info
 * @returns Fee-adjusted order book data
 */
export function getFeeAdjustedOrderBook(
    orderBookData: any, 
    feeAdjusted: boolean, 
    _connections: Map<string, any>
): any {
    if (!feeAdjusted) {
        return orderBookData;
    }
    
    // Implementation would adjust prices based on fees
    return orderBookData;
}

/**
 * Format fee rate for display
 * @param feeRate - Fee rate as string (e.g., "0.001")
 * @returns Formatted fee rate (e.g., "0.10%")
 */
export function formatFeeRate(feeRate: string | number): string {
    const rate = typeof feeRate === 'string' ? parseFloat(feeRate) : feeRate;
    return `${(rate * 100).toFixed(2)}%`;
}

// ============================================================================
// LOGGING SYSTEM WITH FILTERING
// ============================================================================

export interface LogFilters {
  enabled: boolean;
  levels: {
    log: boolean;
    warn: boolean;
    error: boolean;
  };
  exchanges: {
    [key: string]: boolean;
  };
  categories: {
    websocket: boolean;
    api: boolean;
    chart: boolean;
    ui: boolean;
    volume: boolean;
    general: boolean;
  };
}

// Default log filters - can be overridden by user preferences
const defaultLogFilters: LogFilters = {
  enabled: true,
  levels: {
    log: true,
    warn: true,
    error: true,
  },
  exchanges: {
    binance: true,
    bybit: true,
    okx: true,
    kraken: true,
    bitget: true,
    coinbase: true,
    gemini: true,
    bitrue: true,
    uniswap: true,
    hyperliquid: true,
    dydx: true,
    jupiter: true,
    vertex: true,
  },
  categories: {
    websocket: true,
    api: true,
    chart: true,
    ui: true,
    volume: true,
    general: true,
  },
};

// Store current log filters in localStorage
const LOG_FILTERS_KEY = 'crypto-orderbook-log-filters';

class Logger {
  private filters: LogFilters = { ...defaultLogFilters };

  constructor() {
    this.loadFilters();
  }

  private loadFilters(): void {
    try {
      const saved = localStorage.getItem(LOG_FILTERS_KEY);
      if (saved) {
        this.filters = { ...defaultLogFilters, ...JSON.parse(saved) };
      } else {
        this.filters = { ...defaultLogFilters };
      }
    } catch (e) {
      this.filters = { ...defaultLogFilters };
    }
  }

  public saveFilters(): void {
    try {
      localStorage.setItem(LOG_FILTERS_KEY, JSON.stringify(this.filters));
    } catch (e) {
      console.error('Failed to save log filters:', e);
    }
  }

  public getFilters(): LogFilters {
    return { ...this.filters };
  }

  public updateFilters(newFilters: Partial<LogFilters>): void {
    this.filters = { ...this.filters, ...newFilters };
    this.saveFilters();
  }

  private shouldLog(level: 'log' | 'warn' | 'error', exchange?: string, category?: string): boolean {
    if (!this.filters.enabled) return false;
    if (!this.filters.levels[level]) return false;
    
    if (exchange && !this.filters.exchanges[exchange.toLowerCase()]) return false;
    if (category && category in this.filters.categories && !this.filters.categories[category as keyof typeof this.filters.categories]) return false;
    
    return true;
  }

  private extractContext(message: string): { exchange?: string; category?: string } {
    const exchange = this.extractExchange(message);
    const category = this.extractCategory(message);
    return { exchange, category };
  }

  private extractExchange(message: string): string | undefined {
    const exchangePatterns = [
      /^(Binance|Bybit|OKX|Kraken|Bitget|Coinbase|Gemini|Bitrue|Uniswap|Hyperliquid|dYdX|Jupiter|Vertex):/i,
      /(Binance|Bybit|OKX|Kraken|Bitget|Coinbase|Gemini|Bitrue|Uniswap|Hyperliquid|dYdX|Jupiter|Vertex)\s/i,
    ];
    
    for (const pattern of exchangePatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    return undefined;
  }

  private extractCategory(message: string): string | undefined {
    if (message.includes('WebSocket') || message.includes('WS ') || message.includes('ws ') || 
        message.includes('Connected') || message.includes('Disconnected') || 
        message.includes('Reconnecting') || message.includes('Subscription')) {
      return 'websocket';
    }
    
    if (message.includes('Chart:') || message.includes('chart ') || message.includes('kline') || 
        message.includes('LightweightCharts') || message.includes('candlestick')) {
      return 'chart';
    }
    
    if (message.includes('Fetching') || message.includes('API ') || message.includes('fee info') || 
        message.includes('funding rate') || message.includes('volume')) {
      return 'api';
    }
    
    if (message.includes('📊') || message.includes('Volume') || message.includes('Chart.js')) {
      return 'volume';
    }
    
    if (message.includes('DOM') || message.includes('UI ') || message.includes('Dashboard') || 
        message.includes('elements not found')) {
      return 'ui';
    }
    
    return 'general';
  }

  public log(message: any, ...args: any[]): void {
    const messageStr = typeof message === 'string' ? message : String(message);
    const context = this.extractContext(messageStr);
    
    if (this.shouldLog('log', context.exchange, context.category)) {
      // Use original console if available, otherwise use native console
      if (originalConsole) {
        originalConsole.log(message, ...args);
      } else {
        // Prevent infinite recursion by directly calling native console
        const nativeLog = Function.prototype.call.bind(console.log);
        nativeLog(console, message, ...args);
      }
    }
  }

  public warn(message: any, ...args: any[]): void {
    const messageStr = typeof message === 'string' ? message : String(message);
    const context = this.extractContext(messageStr);
    
    if (this.shouldLog('warn', context.exchange, context.category)) {
      // Use original console if available, otherwise use native console
      if (originalConsole) {
        originalConsole.warn(message, ...args);
      } else {
        // Prevent infinite recursion by directly calling native console
        const nativeWarn = Function.prototype.call.bind(console.warn);
        nativeWarn(console, message, ...args);
      }
    }
  }

  public error(message: any, ...args: any[]): void {
    const messageStr = typeof message === 'string' ? message : String(message);
    const context = this.extractContext(messageStr);
    
    if (this.shouldLog('error', context.exchange, context.category)) {
      // Use original console if available, otherwise use native console
      if (originalConsole) {
        originalConsole.error(message, ...args);
      } else {
        // Prevent infinite recursion by directly calling native console
        const nativeError = Function.prototype.call.bind(console.error);
        nativeError(console, message, ...args);
      }
    }
  }

  // Force log - bypasses all filters (for critical system messages)
  public forceLog(message: any, ...args: any[]): void {
    if (originalConsole) {
      originalConsole.log('🔧 [SYSTEM]', message, ...args);
    } else {
      const nativeLog = Function.prototype.call.bind(console.log);
      nativeLog(console, '🔧 [SYSTEM]', message, ...args);
    }
  }

  public forceWarn(message: any, ...args: any[]): void {
    if (originalConsole) {
      originalConsole.warn('⚠️ [SYSTEM]', message, ...args);
    } else {
      const nativeWarn = Function.prototype.call.bind(console.warn);
      nativeWarn(console, '⚠️ [SYSTEM]', message, ...args);
    }
  }

  public forceError(message: any, ...args: any[]): void {
    if (originalConsole) {
      originalConsole.error('❌ [SYSTEM]', message, ...args);
    } else {
      const nativeError = Function.prototype.call.bind(console.error);
      nativeError(console, '❌ [SYSTEM]', message, ...args);
    }
  }
}

// Create global logger instance
export const logger = new Logger();

// Convenience functions for backward compatibility
export const filteredLog = logger.log.bind(logger);
export const filteredWarn = logger.warn.bind(logger);
export const filteredError = logger.error.bind(logger);

// Global console override system
let originalConsole: {
  log: typeof console.log;
  warn: typeof console.warn;
  error: typeof console.error;
} | null = null;

export function enableGlobalConsoleFiltering() {
  if (originalConsole) return; // Already enabled
  
  // Store original console methods
  originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
  };
  
  // Override console methods with filtered versions
  console.log = logger.log.bind(logger);
  console.warn = logger.warn.bind(logger);
  console.error = logger.error.bind(logger);
  
  // Use original console for this message
  originalConsole.log('🔧 Global console filtering enabled');
}

export function disableGlobalConsoleFiltering() {
  if (!originalConsole) return; // Not enabled
  
  // Restore original console methods
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  
  console.log('🔧 Global console filtering disabled');
  originalConsole = null;
}

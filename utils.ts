
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { OrderBookEntry, OrderBookLevel, ExchangeConnectionState, FeeInfo } from './types';

// Simple logger implementation
export const logger = {
    info: (...args: any[]) => console.log(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    debug: (...args: any[]) => console.debug(...args)
};

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

export function formatPrice(price: number): string {
    if (price === 0 || isNaN(price) || !isFinite(price)) return '0.00';
    
    const decimals = getDecimalPlaces(price);
    return price.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

export function formatQuantity(quantity: number): string {
    if (quantity === 0 || isNaN(quantity) || !isFinite(quantity)) return '0';
    
    // For large quantities, show fewer decimals
    if (quantity >= 1000000) {
        return (quantity / 1000000).toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2
        }) + 'M';
    } else if (quantity >= 1000) {
        return (quantity / 1000).toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2
        }) + 'K';
    } else if (quantity >= 100) {
        return quantity.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        });
    } else if (quantity >= 1) {
        return quantity.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
        });
    } else {
        return quantity.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4
        });
    }
}

export function mapToSortedEntries(map: Map<string, number>, descending: boolean = false, exchangeId?: string): OrderBookEntry[] {
    return Array.from(map.entries())
        .map(([priceStr, quantity]) => ({ price: parseFloat(priceStr), quantity, exchangeId }))
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
 * Parses fee rate string to decimal number
 * @param feeStr Fee string like "0.1%" or "0.001" or number
 * @returns Decimal fee rate (e.g., 0.001 for 0.1%)
 */
export function parseFeeRate(feeStr: string | number | undefined): number {
    if (typeof feeStr === 'number') return feeStr;
    if (!feeStr) return 0.001; // Default 0.1% if no fee info
    
    const str = String(feeStr).trim();
    if (str.endsWith('%')) {
        return parseFloat(str.slice(0, -1)) / 100;
    }
    return parseFloat(str) || 0.001;
}

/**
 * Gets the effective taker fee rate for an exchange
 * @param connectionState Exchange connection state with fee info
 * @returns Decimal fee rate for taker orders
 */
export function getExchangeTakerFee(connectionState: ExchangeConnectionState): number {
    if (!connectionState.feeInfo) return 0.001; // Default 0.1%
    
    // Use taker fee (more conservative for price impact calculation)
    const takerRate = parseFeeRate(connectionState.feeInfo.takerRate);
    return takerRate || 0.001;
}

/**
 * Applies fee adjustment to a price for order book display
 * @param price Original price
 * @param side 'bid' or 'ask'
 * @param feeRate Decimal fee rate (e.g., 0.001 for 0.1%)
 * @returns Fee-adjusted price
 */
export function applyFeeAdjustment(price: number, side: 'bid' | 'ask', feeRate: number): number {
    if (side === 'bid') {
        // For bids (buy orders), subtract fee to show true cost
        // If you buy at this bid price, you'll pay bid_price + fee
        return price * (1 + feeRate);
    } else {
        // For asks (sell orders), add fee to show net proceeds
        // If you sell at this ask price, you'll receive ask_price - fee
        return price * (1 - feeRate);
    }
}

/**
 * Creates fee legend data for display
 * @param activeConnections Map of active exchange connections
 * @returns Array of fee legend items
 */
export function createFeeLegend(activeConnections: Map<string, ExchangeConnectionState>): Array<{
    exchange: string;
    name: string;
    makerFee: string;
    takerFee: string;
    color: string;
}> {
    const EXCHANGE_COLORS: Record<string, string> = {
        binance: '#f0b90b',
        bybit: '#f7a600',
        okx: '#1890ff',
        kraken: '#5b47d6',
        bitget: '#00d4aa',
        coinbase: '#0052ff',
        gemini: '#00dcfa',
        dydx: '#6966ff',
        gmx: '#4f46e5',
        drift: '#9333ea',
        hyperliquid: '#06b6d4'
    };

    const feeItems: Array<{
        exchange: string;
        name: string;
        makerFee: string;
        takerFee: string;
        color: string;
    }> = [];

    activeConnections.forEach((conn, exchangeId) => {
        if (conn.status === 'connected' && conn.feeInfo) {
            const makerRate = parseFeeRate(conn.feeInfo.makerRate);
            const takerRate = parseFeeRate(conn.feeInfo.takerRate);
            
            feeItems.push({
                exchange: exchangeId,
                name: conn.config.name,
                makerFee: (makerRate * 100).toFixed(3) + '%',
                takerFee: (takerRate * 100).toFixed(3) + '%',
                color: EXCHANGE_COLORS[exchangeId] || '#666'
            });
        }
    });

    return feeItems.sort((a, b) => a.name.localeCompare(b.name));
}


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { OrderBookEntry, OrderBookLevel } from './types';

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

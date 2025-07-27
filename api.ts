
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FeeInfo, FundingRateInfo, VolumeInfo, KLineData } from './types';

export const BINANCE_FUTURES_API_BASE = 'https://fapi.binance.com';

export async function fetchBinanceFeeInfo(formattedSymbol: string): Promise<FeeInfo | null> {
    try {
        console.log(`Binance: Simulating fee info fetch for ${formattedSymbol}`);
        return {
            makerRate: '0.02%',
            takerRate: '0.05%',
            raw: { simulated: true, note: "Default Binance Futures fees" }
        };
    } catch (error) {
        console.error('Binance: Error fetching fee info:', error);
        return null;
    }
}

export async function fetchBinanceFundingRateInfo(formattedSymbol: string): Promise<FundingRateInfo | null> {
    try {
        const response = await fetch(`${BINANCE_FUTURES_API_BASE}/fapi/v1/premiumIndex?symbol=${formattedSymbol.toUpperCase()}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        return {
            rate: parseFloat(data.lastFundingRate) * 100, // As percentage
            nextFundingTime: new Date(data.nextFundingTime).toLocaleString(),
            raw: data
        };
    } catch (error) {
        console.error(`Binance: Error fetching funding rate for ${formattedSymbol}:`, error);
        return null;
    }
}

export async function fetchBinanceVolumeInfo(formattedSymbol: string): Promise<VolumeInfo | null> {
    try {
        const response = await fetch(`${BINANCE_FUTURES_API_BASE}/fapi/v1/ticker/24hr?symbol=${formattedSymbol.toUpperCase()}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        return {
            assetVolume: parseFloat(data.volume),
            usdVolume: parseFloat(data.quoteVolume),
            raw: data
        };
    } catch (error) {
        console.error(`Binance: Error fetching 24hr volume for ${formattedSymbol}:`, error);
        return null;
    }
}

export async function fetchBinanceHistoricalKlines(symbol: string, interval: string, limit: number = 500): Promise<KLineData[]> {
    try {
        const response = await fetch(`${BINANCE_FUTURES_API_BASE}/fapi/v1/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        console.log(`Binance: Fetched ${data.length} historical klines for ${symbol} (${interval}). First item:`, data[0]);
        const mappedData = data.map((k: any) => ({
            time: k[0] / 1000, // Binance provides ms timestamps
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
        }));
        console.log(`Binance: Mapped ${mappedData.length} klines. First mapped item:`, mappedData[0]);
        return mappedData;
    } catch (error) {
        console.error(`Binance: Error fetching historical klines for ${symbol} (${interval}):`, error);
        return [];
    }
}

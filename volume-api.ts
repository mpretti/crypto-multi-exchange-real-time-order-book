/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { 
    HistoricalVolumeDataPoint, 
    ExchangeVolumeMetrics, 
    AssetVolumeMetrics, 
    DashboardMetrics,
    InstrumentType,
    AssetCategory,
    AssetClassification,
    InstrumentTypeMetrics,
    OpportunityAnalysis
} from './types';
import { SUPPORTED_EXCHANGES_WITH_DEX, EXCHANGE_COLORS } from './config';

// Supported assets for volume tracking
export const SUPPORTED_ASSETS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'ADAUSDT', 'LINKUSDT', 'XRPUSDT'];

// Asset Classifications
export const ASSET_CLASSIFICATIONS: Record<string, AssetClassification> = {
    'BTCUSDT': {
        symbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        category: 'major',
        marketCap: 800000000000, // ~$800B
        description: 'Bitcoin - Digital Gold'
    },
    'ETHUSDT': {
        symbol: 'ETHUSDT',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
        category: 'major',
        marketCap: 300000000000, // ~$300B
        description: 'Ethereum - Smart Contract Platform'
    },
    'SOLUSDT': {
        symbol: 'SOLUSDT',
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
        category: 'layer1',
        marketCap: 15000000000, // ~$15B
        description: 'Solana - High Performance Blockchain'
    },
    'DOGEUSDT': {
        symbol: 'DOGEUSDT',
        baseAsset: 'DOGE',
        quoteAsset: 'USDT',
        category: 'meme',
        marketCap: 12000000000, // ~$12B
        description: 'Dogecoin - Meme Cryptocurrency'
    },
    'ADAUSDT': {
        symbol: 'ADAUSDT',
        baseAsset: 'ADA',
        quoteAsset: 'USDT',
        category: 'layer1',
        marketCap: 10000000000, // ~$10B
        description: 'Cardano - Academic Blockchain'
    },
    'LINKUSDT': {
        symbol: 'LINKUSDT',
        baseAsset: 'LINK',
        quoteAsset: 'USDT',
        category: 'defi',
        marketCap: 8000000000, // ~$8B
        description: 'Chainlink - Oracle Network'
    },
    'XRPUSDT': {
        symbol: 'XRPUSDT',
        baseAsset: 'XRP',
        quoteAsset: 'USDT',
        category: 'altcoin',
        marketCap: 25000000000, // ~$25B
        description: 'Ripple - Payment Network'
    }
};

// Exchange Instrument Type Mappings
export const EXCHANGE_INSTRUMENT_TYPES: Record<string, Record<string, InstrumentType>> = {
    'binance': {
        'BTCUSDT': 'perpetual',
        'ETHUSDT': 'perpetual',
        'SOLUSDT': 'perpetual',
        'DOGEUSDT': 'perpetual',
        'ADAUSDT': 'perpetual',
        'LINKUSDT': 'perpetual',
        'XRPUSDT': 'perpetual'
    },
    'bybit': {
        'BTCUSDT': 'perpetual',
        'ETHUSDT': 'perpetual',
        'SOLUSDT': 'perpetual',
        'DOGEUSDT': 'perpetual',
        'ADAUSDT': 'perpetual',
        'LINKUSDT': 'perpetual',
        'XRPUSDT': 'perpetual'
    },
    'okx': {
        'BTCUSDT': 'swap',
        'ETHUSDT': 'swap',
        'SOLUSDT': 'swap',
        'DOGEUSDT': 'swap',
        'ADAUSDT': 'swap',
        'LINKUSDT': 'swap',
        'XRPUSDT': 'swap'
    },
    'kraken': {
        'BTCUSDT': 'futures',
        'ETHUSDT': 'futures',
        'SOLUSDT': 'futures',
        'DOGEUSDT': 'futures',
        'ADAUSDT': 'futures',
        'LINKUSDT': 'futures',
        'XRPUSDT': 'futures'
    },
    'bitget': {
        'BTCUSDT': 'perpetual',
        'ETHUSDT': 'perpetual',
        'SOLUSDT': 'perpetual',
        'DOGEUSDT': 'perpetual',
        'ADAUSDT': 'perpetual',
        'LINKUSDT': 'perpetual',
        'XRPUSDT': 'perpetual'
    },
    'mexc': {
        'BTCUSDT': 'spot',
        'ETHUSDT': 'spot',
        'SOLUSDT': 'spot',
        'DOGEUSDT': 'spot',
        'ADAUSDT': 'spot',
        'LINKUSDT': 'spot',
        'XRPUSDT': 'spot'
    },
    'dydx': {
        'BTCUSDT': 'perpetual',
        'ETHUSDT': 'perpetual',
        'SOLUSDT': 'perpetual',
        'DOGEUSDT': 'perpetual',
        'ADAUSDT': 'perpetual',
        'LINKUSDT': 'perpetual',
        'XRPUSDT': 'perpetual'
    },
    'hyperliquid': {
        'BTCUSDT': 'perpetual',
        'ETHUSDT': 'perpetual',
        'SOLUSDT': 'perpetual',
        'DOGEUSDT': 'perpetual',
        'ADAUSDT': 'perpetual',
        'LINKUSDT': 'perpetual',
        'XRPUSDT': 'perpetual'
    },
    'vertex': {
        'BTCUSDT': 'perpetual',
        'ETHUSDT': 'perpetual',
        'SOLUSDT': 'perpetual',
        'DOGEUSDT': 'perpetual',
        'ADAUSDT': 'perpetual',
        'LINKUSDT': 'perpetual',
        'XRPUSDT': 'perpetual'
    },
    'jupiter': {
        'BTCUSDT': 'perpetual',
        'ETHUSDT': 'perpetual',
        'SOLUSDT': 'perpetual',
        'DOGEUSDT': 'perpetual',
        'ADAUSDT': 'perpetual',
        'LINKUSDT': 'perpetual',
        'XRPUSDT': 'perpetual'
    },
    'uniswap': {
        'BTCUSDT': 'amm_spot',
        'ETHUSDT': 'amm_spot',
        'SOLUSDT': 'amm_spot',
        'DOGEUSDT': 'amm_spot',
        'ADAUSDT': 'amm_spot',
        'LINKUSDT': 'amm_spot',
        'XRPUSDT': 'amm_spot'
    }
};

// Exchange API base URLs
export const EXCHANGE_APIS = {
    binance: 'https://fapi.binance.com',
    bybit: 'https://api.bybit.com',
    okx: 'https://www.okx.com',
    kraken: 'https://futures.kraken.com',
    bitget: 'https://api.bitget.com',
    mexc: 'https://api.mexc.com'
};

/**
 * Get instrument type for a symbol on a specific exchange
 */
export function getInstrumentType(exchangeId: string, symbol: string): InstrumentType {
    return EXCHANGE_INSTRUMENT_TYPES[exchangeId]?.[symbol] || 'unknown';
}

/**
 * Get asset classification
 */
export function getAssetClassification(symbol: string): AssetClassification {
    return ASSET_CLASSIFICATIONS[symbol] || {
        symbol,
        baseAsset: symbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        category: 'other',
        description: 'Unknown Asset'
    };
}

/**
 * Fetch historical volume data from Binance
 */
export async function fetchBinanceHistoricalVolume(symbol: string, days: number = 30): Promise<HistoricalVolumeDataPoint[]> {
    try {
        const endTime = Date.now();
        const startTime = endTime - (days * 24 * 60 * 60 * 1000);
        
        const response = await fetch(
            `${EXCHANGE_APIS.binance}/fapi/v1/klines?symbol=${symbol.toUpperCase()}&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=${days}`
        );
        
        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
        }
        
        const data = await response.json();
        const classification = getAssetClassification(symbol);
        
        return data.map((kline: any[]) => ({
            date: new Date(kline[0]).toISOString().split('T')[0],
            timestamp: kline[0],
            assetVolume: parseFloat(kline[5]),
            usdVolume: parseFloat(kline[7]),
            priceClose: parseFloat(kline[4]),
            exchangeId: 'binance',
            symbol: symbol.toUpperCase(),
            instrumentType: getInstrumentType('binance', symbol),
            baseAsset: classification.baseAsset,
            quoteAsset: classification.quoteAsset
        }));
    } catch (error) {
        console.error(`Error fetching Binance historical volume for ${symbol}:`, error);
        return [];
    }
}

/**
 * Fetch historical volume data from Bybit
 */
export async function fetchBybitHistoricalVolume(symbol: string, days: number = 30): Promise<HistoricalVolumeDataPoint[]> {
    try {
        const endTime = Date.now();
        const startTime = endTime - (days * 24 * 60 * 60 * 1000);
        
        const response = await fetch(
            `${EXCHANGE_APIS.bybit}/v5/market/kline?category=linear&symbol=${symbol.toUpperCase()}&interval=D&start=${startTime}&end=${endTime}&limit=${days}`
        );
        
        if (!response.ok) {
            throw new Error(`Bybit API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.retCode !== 0 || !data.result?.list) {
            throw new Error(`Bybit API error: ${data.retMsg || 'No data'}`);
        }
        
        const classification = getAssetClassification(symbol);
        
        return data.result.list.map((kline: any[]) => ({
            date: new Date(parseInt(kline[0])).toISOString().split('T')[0],
            timestamp: parseInt(kline[0]),
            assetVolume: parseFloat(kline[5]),
            usdVolume: parseFloat(kline[6]),
            priceClose: parseFloat(kline[4]),
            exchangeId: 'bybit',
            symbol: symbol.toUpperCase(),
            instrumentType: getInstrumentType('bybit', symbol),
            baseAsset: classification.baseAsset,
            quoteAsset: classification.quoteAsset
        })).reverse(); // Bybit returns newest first, we want oldest first
    } catch (error) {
        console.error(`Error fetching Bybit historical volume for ${symbol}:`, error);
        return [];
    }
}

/**
 * Generate simulated historical volume data for DEX exchanges and testing
 */
export function generateSimulatedVolumeData(exchangeId: string, symbol: string, days: number = 30): HistoricalVolumeDataPoint[] {
    const data: HistoricalVolumeDataPoint[] = [];
    const now = Date.now();
    const classification = getAssetClassification(symbol);
    
    // Base volumes by asset (simulated)
    const baseVolumes: Record<string, { asset: number; usd: number; price: number }> = {
        'BTCUSDT': { asset: 1000, usd: 45000000, price: 45000 },
        'ETHUSDT': { asset: 15000, usd: 25000000, price: 1666 },
        'SOLUSDT': { asset: 500000, usd: 12000000, price: 24 },
        'DOGEUSDT': { asset: 50000000, usd: 3000000, price: 0.06 },
        'ADAUSDT': { asset: 25000000, usd: 8000000, price: 0.32 },
        'LINKUSDT': { asset: 800000, usd: 6000000, price: 7.5 },
        'XRPUSDT': { asset: 20000000, usd: 10000000, price: 0.5 }
    };
    
    // Exchange multipliers (market share simulation)
    const exchangeMultipliers: Record<string, number> = {
        'binance': 1.0,
        'bybit': 0.7,
        'okx': 0.5,
        'kraken': 0.3,
        'bitget': 0.2,
        'dydx': 0.15,
        'hyperliquid': 0.1,
        'vertex': 0.05,
        'jupiter': 0.08,
        'uniswap': 0.25
    };
    
    const baseData = baseVolumes[symbol] || baseVolumes['BTCUSDT'];
    const multiplier = exchangeMultipliers[exchangeId] || 0.1;
    
    for (let i = days - 1; i >= 0; i--) {
        const timestamp = now - (i * 24 * 60 * 60 * 1000);
        const date = new Date(timestamp);
        
        // Add some realistic variation (weekend effects, market cycles)
        const dayOfWeek = date.getDay();
        const weekendEffect = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1.0;
        
        // Market cycle simulation (30-day cycle)
        const cycleEffect = 0.8 + 0.4 * Math.sin((i / 30) * 2 * Math.PI);
        
        // Random daily variation
        const randomEffect = 0.7 + 0.6 * Math.random();
        
        const totalEffect = weekendEffect * cycleEffect * randomEffect * multiplier;
        
        // Price simulation with some correlation to volume
        const priceVariation = 0.95 + 0.1 * Math.random();
        const price = baseData.price * priceVariation;
        
        data.push({
            date: date.toISOString().split('T')[0],
            timestamp,
            assetVolume: Math.round(baseData.asset * totalEffect),
            usdVolume: Math.round(baseData.usd * totalEffect),
            priceClose: Math.round(price * 100) / 100,
            exchangeId,
            symbol,
            instrumentType: getInstrumentType(exchangeId, symbol),
            baseAsset: classification.baseAsset,
            quoteAsset: classification.quoteAsset
        });
    }
    
    return data;
}

/**
 * Fetch historical volume data from all supported exchanges
 */
export async function fetchAllHistoricalVolumeData(days: number = 30): Promise<HistoricalVolumeDataPoint[]> {
    const allData: HistoricalVolumeDataPoint[] = [];
    const fetchPromises: Promise<HistoricalVolumeDataPoint[]>[] = [];
    
    // Fetch real data from supported CEX exchanges
    for (const asset of SUPPORTED_ASSETS) {
        // Binance
        fetchPromises.push(fetchBinanceHistoricalVolume(asset, days));
        
        // Bybit
        fetchPromises.push(fetchBybitHistoricalVolume(asset, days));
        
        // Generate simulated data for other exchanges
        const simulatedExchanges = ['okx', 'kraken', 'bitget', 'mexc', 'dydx', 'hyperliquid', 'vertex', 'jupiter', 'uniswap'];
        for (const exchangeId of simulatedExchanges) {
            fetchPromises.push(Promise.resolve(generateSimulatedVolumeData(exchangeId, asset, days)));
        }
    }
    
    try {
        const results = await Promise.allSettled(fetchPromises);
        
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                allData.push(...result.value);
            } else {
                console.warn('Failed to fetch volume data:', result.reason);
            }
        });
        
        // Sort by timestamp
        allData.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log(`Fetched ${allData.length} historical volume data points`);
        return allData;
    } catch (error) {
        console.error('Error fetching historical volume data:', error);
        return [];
    }
}

/**
 * Calculate instrument type metrics
 */
export function calculateInstrumentTypeMetrics(data: HistoricalVolumeDataPoint[]): InstrumentTypeMetrics[] {
    const instrumentMap = new Map<InstrumentType, {
        totalVolume: number;
        exchanges: Set<string>;
        assets: Set<string>;
        dataPoints: HistoricalVolumeDataPoint[];
    }>();
    
    // Aggregate data by instrument type
    data.forEach(point => {
        if (!instrumentMap.has(point.instrumentType)) {
            instrumentMap.set(point.instrumentType, {
                totalVolume: 0,
                exchanges: new Set(),
                assets: new Set(),
                dataPoints: []
            });
        }
        
        const existing = instrumentMap.get(point.instrumentType)!;
        existing.totalVolume += point.usdVolume;
        existing.exchanges.add(point.exchangeId);
        existing.assets.add(point.symbol);
        existing.dataPoints.push(point);
    });
    
    const totalVolume = Array.from(instrumentMap.values()).reduce((sum, item) => sum + item.totalVolume, 0);
    
    // Convert to metrics array
    const metrics: InstrumentTypeMetrics[] = [];
    
    instrumentMap.forEach((data, instrumentType) => {
        // Calculate top exchanges for this instrument type
        const exchangeVolumes = new Map<string, number>();
        data.dataPoints.forEach(point => {
            exchangeVolumes.set(point.exchangeId, (exchangeVolumes.get(point.exchangeId) || 0) + point.usdVolume);
        });
        
        const topExchanges = Array.from(exchangeVolumes.entries())
            .map(([exchangeId, volume]) => ({
                exchangeId,
                volume,
                marketShare: (volume / data.totalVolume) * 100
            }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);
        
        // Calculate top assets for this instrument type
        const assetVolumes = new Map<string, number>();
        data.dataPoints.forEach(point => {
            assetVolumes.set(point.symbol, (assetVolumes.get(point.symbol) || 0) + point.usdVolume);
        });
        
        const topAssets = Array.from(assetVolumes.entries())
            .map(([symbol, volume]) => ({
                symbol,
                volume,
                marketShare: (volume / data.totalVolume) * 100
            }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);
        
        // Generate opportunities
        const opportunities = generateInstrumentOpportunities(instrumentType, data.dataPoints, topExchanges, topAssets);
        
        metrics.push({
            instrumentType,
            totalVolumeUsd: data.totalVolume,
            marketShare: (data.totalVolume / totalVolume) * 100,
            exchangeCount: data.exchanges.size,
            assetCount: data.assets.size,
            topExchanges,
            topAssets,
            opportunities
        });
    });
    
    // Sort by total volume descending
    metrics.sort((a, b) => b.totalVolumeUsd - a.totalVolumeUsd);
    
    return metrics;
}

/**
 * Generate opportunities for a specific instrument type
 */
function generateInstrumentOpportunities(
    instrumentType: InstrumentType,
    _dataPoints: HistoricalVolumeDataPoint[],
    topExchanges: Array<{ exchangeId: string; volume: number; marketShare: number }>,
    _topAssets: Array<{ symbol: string; volume: number; marketShare: number }>
): Array<{
    type: 'volume_leader' | 'low_competition' | 'high_spread' | 'arbitrage';
    description: string;
    exchanges: string[];
    volume: number;
    score: number;
}> {
    const opportunities = [];
    
    // Volume leader opportunity
    if (topExchanges.length > 0 && topExchanges[0].marketShare > 40) {
        opportunities.push({
            type: 'volume_leader' as const,
            description: `${topExchanges[0].exchangeId} dominates ${instrumentType} with ${topExchanges[0].marketShare.toFixed(1)}% market share`,
            exchanges: [topExchanges[0].exchangeId],
            volume: topExchanges[0].volume,
            score: Math.min(topExchanges[0].marketShare, 100)
        });
    }
    
    // Low competition opportunity
    if (topExchanges.length > 1 && topExchanges[1].marketShare < 20) {
        opportunities.push({
            type: 'low_competition' as const,
            description: `Low competition in ${instrumentType} - second place only has ${topExchanges[1].marketShare.toFixed(1)}%`,
            exchanges: topExchanges.slice(1, 4).map(e => e.exchangeId),
            volume: topExchanges.slice(1, 4).reduce((sum, e) => sum + e.volume, 0),
            score: 100 - topExchanges[1].marketShare
        });
    }
    
    // Arbitrage opportunity (simulated)
    if (topExchanges.length > 2) {
        const volumeSpread = (topExchanges[0].volume - topExchanges[2].volume) / topExchanges[0].volume;
        if (volumeSpread > 0.5) {
            opportunities.push({
                type: 'arbitrage' as const,
                description: `Significant volume disparity in ${instrumentType} between top exchanges`,
                exchanges: [topExchanges[0].exchangeId, topExchanges[2].exchangeId],
                volume: topExchanges[2].volume,
                score: volumeSpread * 100
            });
        }
    }
    
    return opportunities;
}

/**
 * Calculate enhanced exchange metrics with instrument breakdown
 */
export function calculateExchangeMetrics(data: HistoricalVolumeDataPoint[]): ExchangeVolumeMetrics[] {
    const exchangeMap = new Map<string, {
        totalVolumeUsd: number;
        dataPoints: number;
        lastTimestamp: number;
        instrumentData: Map<InstrumentType, { volume: number; assetCount: Set<string> }>;
    }>();
    
    // Aggregate data by exchange
    data.forEach(point => {
        if (!exchangeMap.has(point.exchangeId)) {
            exchangeMap.set(point.exchangeId, {
                totalVolumeUsd: 0,
                dataPoints: 0,
                lastTimestamp: 0,
                instrumentData: new Map()
            });
        }
        
        const existing = exchangeMap.get(point.exchangeId)!;
        existing.totalVolumeUsd += point.usdVolume;
        existing.dataPoints += 1;
        existing.lastTimestamp = Math.max(existing.lastTimestamp, point.timestamp);
        
        // Track instrument breakdown
        if (!existing.instrumentData.has(point.instrumentType)) {
            existing.instrumentData.set(point.instrumentType, {
                volume: 0,
                assetCount: new Set()
            });
        }
        
        const instrumentData = existing.instrumentData.get(point.instrumentType)!;
        instrumentData.volume += point.usdVolume;
        instrumentData.assetCount.add(point.symbol);
    });
    
    // Calculate total volume for market share
    const totalVolume = Array.from(exchangeMap.values()).reduce((sum, ex) => sum + ex.totalVolumeUsd, 0);
    
    // Convert to metrics array
    const metrics: ExchangeVolumeMetrics[] = [];
    
    exchangeMap.forEach((data, exchangeId) => {
        const config = SUPPORTED_EXCHANGES_WITH_DEX[exchangeId];
        const isRecent = (Date.now() - data.lastTimestamp) < (2 * 24 * 60 * 60 * 1000); // Within 2 days
        
        // Calculate instrument breakdown
        const instrumentBreakdown: Record<InstrumentType, { volume: number; percentage: number; assetCount: number }> = {} as any;
        
        data.instrumentData.forEach((instrumentData, instrumentType) => {
            instrumentBreakdown[instrumentType] = {
                volume: instrumentData.volume,
                percentage: (instrumentData.volume / data.totalVolumeUsd) * 100,
                assetCount: instrumentData.assetCount.size
            };
        });
        
        metrics.push({
            exchangeId,
            exchangeName: config?.name || exchangeId,
            totalVolumeUsd: data.totalVolumeUsd,
            averageVolumeUsd: data.totalVolumeUsd / Math.max(data.dataPoints / SUPPORTED_ASSETS.length, 1),
            marketShare: (data.totalVolumeUsd / totalVolume) * 100,
            dataPoints: data.dataPoints,
            lastUpdated: new Date(data.lastTimestamp).toISOString(),
            isActive: isRecent,
            instrumentBreakdown
        });
    });
    
    // Sort by total volume descending
    metrics.sort((a, b) => b.totalVolumeUsd - a.totalVolumeUsd);
    
    return metrics;
}

/**
 * Calculate enhanced asset metrics with instrument breakdown
 */
export function calculateAssetMetrics(data: HistoricalVolumeDataPoint[]): AssetVolumeMetrics[] {
    const assetMap = new Map<string, {
        totalVolumeUsd: number;
        exchanges: Set<string>;
        topExchange: { id: string; volume: number };
        dataPoints: number;
        lastTimestamp: number;
        prices: number[];
        instrumentData: Map<InstrumentType, { volume: number; exchanges: Set<string>; bestExchange: { id: string; volume: number } }>;
    }>();
    
    // Aggregate data by asset
    data.forEach(point => {
        if (!assetMap.has(point.symbol)) {
            assetMap.set(point.symbol, {
                totalVolumeUsd: 0,
                exchanges: new Set(),
                topExchange: { id: '', volume: 0 },
                dataPoints: 0,
                lastTimestamp: 0,
                prices: [],
                instrumentData: new Map()
            });
        }
        
        const existing = assetMap.get(point.symbol)!;
        existing.totalVolumeUsd += point.usdVolume;
        existing.exchanges.add(point.exchangeId);
        existing.dataPoints += 1;
        existing.lastTimestamp = Math.max(existing.lastTimestamp, point.timestamp);
        existing.prices.push(point.priceClose);
        
        if (point.usdVolume > existing.topExchange.volume) {
            existing.topExchange = { id: point.exchangeId, volume: point.usdVolume };
        }
        
        // Track instrument breakdown
        if (!existing.instrumentData.has(point.instrumentType)) {
            existing.instrumentData.set(point.instrumentType, {
                volume: 0,
                exchanges: new Set(),
                bestExchange: { id: '', volume: 0 }
            });
        }
        
        const instrumentData = existing.instrumentData.get(point.instrumentType)!;
        instrumentData.volume += point.usdVolume;
        instrumentData.exchanges.add(point.exchangeId);
        
        if (point.usdVolume > instrumentData.bestExchange.volume) {
            instrumentData.bestExchange = { id: point.exchangeId, volume: point.usdVolume };
        }
    });
    
    // Convert to metrics array
    const metrics: AssetVolumeMetrics[] = [];
    
    assetMap.forEach((data, symbol) => {
        const classification = getAssetClassification(symbol);
        const prices = data.prices.sort((a, b) => a - b);
        const oldPrice = prices[0] || 0;
        const newPrice = prices[prices.length - 1] || 0;
        const priceChange24h = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
        
        const topExchangeConfig = SUPPORTED_EXCHANGES_WITH_DEX[data.topExchange.id];
        
        // Calculate instrument breakdown
        const instrumentBreakdown: Record<InstrumentType, { 
            volume: number; 
            percentage: number; 
            exchanges: string[]; 
            bestExchange: string; 
            bestVolume: number 
        }> = {} as any;
        
        data.instrumentData.forEach((instrumentData, instrumentType) => {
            const bestExchangeConfig = SUPPORTED_EXCHANGES_WITH_DEX[instrumentData.bestExchange.id];
            instrumentBreakdown[instrumentType] = {
                volume: instrumentData.volume,
                percentage: (instrumentData.volume / data.totalVolumeUsd) * 100,
                exchanges: Array.from(instrumentData.exchanges),
                bestExchange: bestExchangeConfig?.name || instrumentData.bestExchange.id,
                bestVolume: instrumentData.bestExchange.volume
            };
        });
        
        metrics.push({
            symbol,
            baseAsset: classification.baseAsset,
            quoteAsset: classification.quoteAsset,
            category: classification.category,
            totalVolumeUsd: data.totalVolumeUsd,
            averageVolumeUsd: data.totalVolumeUsd / Math.max(data.dataPoints / data.exchanges.size, 1),
            exchangeCount: data.exchanges.size,
            topExchange: topExchangeConfig?.name || data.topExchange.id,
            priceChange24h,
            lastUpdated: new Date(data.lastTimestamp).toISOString(),
            instrumentBreakdown
        });
    });
    
    // Sort by total volume descending
    metrics.sort((a, b) => b.totalVolumeUsd - a.totalVolumeUsd);
    
    return metrics;
}

/**
 * Generate opportunity analysis
 */
export function generateOpportunityAnalysis(data: HistoricalVolumeDataPoint[]): OpportunityAnalysis[] {
    const opportunities: OpportunityAnalysis[] = [];
    
    // Group by asset and instrument type
    const assetInstrumentMap = new Map<string, Map<InstrumentType, HistoricalVolumeDataPoint[]>>();
    
    data.forEach(point => {
        if (!assetInstrumentMap.has(point.symbol)) {
            assetInstrumentMap.set(point.symbol, new Map());
        }
        
        const assetMap = assetInstrumentMap.get(point.symbol)!;
        if (!assetMap.has(point.instrumentType)) {
            assetMap.set(point.instrumentType, []);
        }
        
        assetMap.get(point.instrumentType)!.push(point);
    });
    
    // Analyze each asset-instrument combination
    assetInstrumentMap.forEach((instrumentMap, symbol) => {
        const classification = getAssetClassification(symbol);
        
        instrumentMap.forEach((points, instrumentType) => {
            // Calculate exchange volumes
            const exchangeVolumes = new Map<string, number>();
            points.forEach(point => {
                exchangeVolumes.set(point.exchangeId, (exchangeVolumes.get(point.exchangeId) || 0) + point.usdVolume);
            });
            
            const sortedExchanges = Array.from(exchangeVolumes.entries()).sort((a, b) => b[1] - a[1]);
            
            if (sortedExchanges.length > 1) {
                const topVolume = sortedExchanges[0][1];
                const secondVolume = sortedExchanges[1][1];
                const volumeSpread = (topVolume - secondVolume) / topVolume;
                
                // Volume concentration opportunity
                if (volumeSpread > 0.6) {
                    opportunities.push({
                        type: 'volume_concentration',
                        asset: symbol,
                        instrumentType,
                        description: `${sortedExchanges[0][0]} dominates ${symbol} ${instrumentType} trading with ${(volumeSpread * 100).toFixed(1)}% more volume than competitors`,
                        exchanges: [sortedExchanges[0][0]],
                        potentialVolume: topVolume,
                        riskLevel: 'medium',
                        score: Math.min(volumeSpread * 100, 100),
                        details: {
                            volumeSpread: volumeSpread,
                            competitorCount: sortedExchanges.length - 1
                        }
                    });
                }
                
                // Low competition opportunity
                if (sortedExchanges.length < 4 && classification.category === 'major') {
                    opportunities.push({
                        type: 'low_competition',
                        asset: symbol,
                        instrumentType,
                        description: `Limited competition in ${symbol} ${instrumentType} - only ${sortedExchanges.length} active exchanges`,
                        exchanges: sortedExchanges.slice(1).map(e => e[0]),
                        potentialVolume: sortedExchanges.slice(1).reduce((sum, e) => sum + e[1], 0),
                        riskLevel: 'low',
                        score: Math.max(100 - (sortedExchanges.length * 20), 20),
                        details: {
                            competitorCount: sortedExchanges.length
                        }
                    });
                }
                
                // Market gap opportunity
                if (sortedExchanges.length > 0 && topVolume < 1000000 && classification.category === 'major') {
                    opportunities.push({
                        type: 'market_gap',
                        asset: symbol,
                        instrumentType,
                        description: `Potential market gap in ${symbol} ${instrumentType} - low overall volume despite major asset status`,
                        exchanges: sortedExchanges.map(e => e[0]),
                        potentialVolume: topVolume * 5, // Estimated potential
                        riskLevel: 'high',
                        score: Math.max(100 - (topVolume / 10000), 30),
                        details: {
                            liquidityGap: 1000000 - topVolume
                        }
                    });
                }
            }
        });
    });
    
    // Sort by score descending
    opportunities.sort((a, b) => b.score - a.score);
    
    return opportunities.slice(0, 10); // Top 10 opportunities
}

/**
 * Calculate overall dashboard metrics with enhanced analysis
 */
export function calculateDashboardMetrics(data: HistoricalVolumeDataPoint[]): DashboardMetrics {
    const exchangeMetrics = calculateExchangeMetrics(data);
    const assetMetrics = calculateAssetMetrics(data);
    const instrumentTypeMetrics = calculateInstrumentTypeMetrics(data);
    const opportunities = generateOpportunityAnalysis(data);
    
    const totalVolumeAllExchanges = exchangeMetrics.reduce((sum, ex) => sum + ex.totalVolumeUsd, 0);
    const upToDateExchanges = exchangeMetrics.filter(ex => ex.isActive).length;
    const staleDataExchanges = exchangeMetrics.length - upToDateExchanges;
    
    const lastUpdate = Math.max(...data.map(d => d.timestamp));
    
    // Calculate market concentration (Herfindahl Index)
    const marketShares = exchangeMetrics.map(ex => ex.marketShare / 100);
    const herfindahlIndex = marketShares.reduce((sum, share) => sum + (share * share), 0);
    
    const topExchangeShare = exchangeMetrics[0]?.marketShare || 0;
    const top3ExchangeShare = exchangeMetrics.slice(0, 3).reduce((sum, ex) => sum + ex.marketShare, 0);
    
    return {
        totalVolumeAllExchanges,
        totalAssets: assetMetrics.length,
        totalExchanges: exchangeMetrics.length,
        dataQuality: {
            upToDateExchanges,
            staleDataExchanges,
            lastFullUpdate: new Date(lastUpdate).toISOString()
        },
        topAssetsByVolume: assetMetrics.slice(0, 5),
        exchangeMetrics,
        instrumentTypeMetrics,
        opportunities,
        marketConcentration: {
            herfindahlIndex,
            topExchangeShare,
            top3ExchangeShare
        }
    };
}

/**
 * Filter volume data by criteria
 */
export function filterVolumeData(
    data: HistoricalVolumeDataPoint[],
    filters: {
        asset?: string;
        exchange?: string;
        instrumentType?: InstrumentType;
        category?: AssetCategory;
        startDate?: string;
        endDate?: string;
    }
): HistoricalVolumeDataPoint[] {
    return data.filter(point => {
        if (filters.asset && filters.asset !== 'all' && point.symbol !== filters.asset) {
            return false;
        }
        
        if (filters.exchange && filters.exchange !== 'all' && point.exchangeId !== filters.exchange) {
            return false;
        }
        
        if (filters.instrumentType && point.instrumentType !== filters.instrumentType) {
            return false;
        }
        
        if (filters.category) {
            const classification = getAssetClassification(point.symbol);
            if (classification.category !== filters.category) {
                return false;
            }
        }
        
        if (filters.startDate && point.date < filters.startDate) {
            return false;
        }
        
        if (filters.endDate && point.date > filters.endDate) {
            return false;
        }
        
        return true;
    });
}

/**
 * Format volume numbers for display
 */
export function formatVolumeNumber(volume: number): string {
    if (volume >= 1e9) {
        return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
        return `$${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
        return `$${(volume / 1e3).toFixed(2)}K`;
    } else {
        return `$${volume.toFixed(2)}`;
    }
}

/**
 * Format percentage change for display
 */
export function formatPercentageChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}

/**
 * Get exchange color for charts
 */
export function getExchangeColor(exchangeId: string): string {
    return EXCHANGE_COLORS[exchangeId] || EXCHANGE_COLORS.default;
}

/**
 * Get instrument type display name
 */
export function getInstrumentTypeDisplayName(instrumentType: InstrumentType): string {
    const displayNames: Record<InstrumentType, string> = {
        'spot': 'Spot',
        'margin': 'Margin',
        'futures': 'Futures',
        'perpetual': 'Perpetual',
        'options': 'Options',
        'swap': 'Swap',
        'amm_spot': 'AMM Spot',
        'amm_perpetual': 'AMM Perpetual',
        'unknown': 'Unknown'
    };
    
    return displayNames[instrumentType] || instrumentType;
}

/**
 * Get asset category display name
 */
export function getAssetCategoryDisplayName(category: AssetCategory): string {
    const displayNames: Record<AssetCategory, string> = {
        'major': 'Major',
        'altcoin': 'Altcoin',
        'meme': 'Meme',
        'defi': 'DeFi',
        'layer1': 'Layer 1',
        'stablecoin': 'Stablecoin',
        'other': 'Other'
    };
    
    return displayNames[category] || category;
} 
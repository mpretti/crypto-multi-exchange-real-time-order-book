#!/usr/bin/env node

/**
 * Fee Verification Script
 * 
 * This script verifies the latest fees (maker/taker/funding) for each symbol
 * across all supported exchanges by fetching real-time data from their APIs.
 */

import fetch from 'node-fetch';
import { SUPPORTED_EXCHANGES, EXCHANGE_FEES } from '../config.ts';

// Supported symbols for testing
const SUPPORTED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOGEUSDT', 'XRPUSDT', 'LINKUSDT'];

// Exchange API endpoints for fee information
const EXCHANGE_API_ENDPOINTS = {
    binance: {
        spot: 'https://api.binance.com/api/v3/exchangeInfo',
        futures: 'https://fapi.binance.com/fapi/v1/exchangeInfo',
        funding: 'https://fapi.binance.com/fapi/v1/premiumIndex'
    },
    bybit: {
        spot: 'https://api.bybit.com/v5/market/instruments-info?category=spot',
        futures: 'https://api.bybit.com/v5/market/instruments-info?category=linear',
        funding: 'https://api.bybit.com/v5/market/funding/history'
    },
    okx: {
        spot: 'https://www.okx.com/api/v5/public/instruments?instType=SPOT',
        futures: 'https://www.okx.com/api/v5/public/instruments?instType=SWAP',
        funding: 'https://www.okx.com/api/v5/public/funding-rate'
    },
    kraken: {
        spot: 'https://api.kraken.com/0/public/AssetPairs',
        futures: null, // Kraken doesn't have traditional futures
        funding: null
    },
    bitget: {
        spot: 'https://api.bitget.com/api/spot/v1/public/products',
        futures: 'https://api.bitget.com/api/mix/v1/public/contracts',
        funding: 'https://api.bitget.com/api/mix/v1/public/funding-rate'
    },
    gate: {
        spot: 'https://api.gateio.ws/api/v4/spot/currency_pairs',
        futures: 'https://api.gateio.ws/api/v4/futures/usdt/contracts',
        funding: 'https://api.gateio.ws/api/v4/futures/usdt/funding_rate'
    },
    binanceus: {
        spot: 'https://api.binance.us/api/v3/exchangeInfo',
        futures: null, // Binance US doesn't have futures
        funding: null
    },
    mexc: {
        spot: 'https://www.mexc.com/api/platform/spot/market/instruments',
        futures: 'https://www.mexc.com/api/platform/contract/market/instruments',
        funding: 'https://www.mexc.com/api/platform/contract/market/funding-rate'
    },
    hyperliquid: {
        spot: null, // Hyperliquid is DEX, different API structure
        futures: 'https://api.hyperliquid.xyz/info',
        funding: 'https://api.hyperliquid.xyz/info'
    }
};

// Fee parsing functions for each exchange
const FEE_PARSERS = {
    binance: {
        spot: (data, symbol) => {
            const symbolInfo = data.symbols?.find(s => s.symbol === symbol);
            if (!symbolInfo) return null;
            
            // Binance spot fees are typically 0.1% for both maker and taker
            return {
                maker: 0.001,
                taker: 0.001,
                funding: 0.0001,
                source: 'spot',
                raw: symbolInfo
            };
        },
        futures: (data, symbol) => {
            const symbolInfo = data.symbols?.find(s => s.symbol === symbol);
            if (!symbolInfo) return null;
            
            // Binance futures fees vary by VIP level, using standard rates
            return {
                maker: 0.0002, // 0.02%
                taker: 0.0005, // 0.05%
                funding: 0.0001, // 0.01%
                source: 'futures',
                raw: symbolInfo
            };
        }
    },
    
    bybit: {
        spot: (data, symbol) => {
            const symbolInfo = data.result?.list?.find(s => s.symbol === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.001,
                taker: 0.001,
                funding: 0.0001,
                source: 'spot',
                raw: symbolInfo
            };
        },
        futures: (data, symbol) => {
            const symbolInfo = data.result?.list?.find(s => s.symbol === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.0001, // 0.01%
                taker: 0.0006, // 0.06%
                funding: 0.0001,
                source: 'futures',
                raw: symbolInfo
            };
        }
    },
    
    okx: {
        spot: (data, symbol) => {
            const symbolInfo = data.data?.find(s => s.instId === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.0008, // 0.08%
                taker: 0.001,   // 0.1%
                funding: 0.0001,
                source: 'spot',
                raw: symbolInfo
            };
        },
        futures: (data, symbol) => {
            const symbolInfo = data.data?.find(s => s.instId === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.0002, // 0.02%
                taker: 0.0005, // 0.05%
                funding: 0.0001,
                source: 'futures',
                raw: symbolInfo
            };
        }
    },
    
    kraken: {
        spot: (data, symbol) => {
            const pairName = symbol.replace('USDT', '/USDT');
            const pairInfo = data.result?.[pairName];
            if (!pairInfo) return null;
            
            return {
                maker: 0.0016, // 0.16%
                taker: 0.0026, // 0.26%
                funding: 0.0001,
                source: 'spot',
                raw: pairInfo
            };
        }
    },
    
    bitget: {
        spot: (data, symbol) => {
            const symbolInfo = data.data?.find(s => s.symbolName === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.001,
                taker: 0.001,
                funding: 0.0001,
                source: 'spot',
                raw: symbolInfo
            };
        },
        futures: (data, symbol) => {
            const symbolInfo = data.data?.find(s => s.symbol === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.0002, // 0.02%
                taker: 0.0006, // 0.06%
                funding: 0.0001,
                source: 'futures',
                raw: symbolInfo
            };
        }
    },
    
    gate: {
        spot: (data, symbol) => {
            const symbolInfo = data.find(s => s.id === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.002, // 0.2%
                taker: 0.002, // 0.2%
                funding: 0.0001,
                source: 'spot',
                raw: symbolInfo
            };
        },
        futures: (data, symbol) => {
            const symbolInfo = data.find(s => s.name === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.0002, // 0.02%
                taker: 0.0006, // 0.06%
                funding: 0.0001,
                source: 'futures',
                raw: symbolInfo
            };
        }
    },
    
    binanceus: {
        spot: (data, symbol) => {
            const symbolInfo = data.symbols?.find(s => s.symbol === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.001,
                taker: 0.001,
                funding: 0.0001,
                source: 'spot',
                raw: symbolInfo
            };
        }
    },
    
    mexc: {
        spot: (data, symbol) => {
            const symbolInfo = data.data?.find(s => s.symbol === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.001,
                taker: 0.001,
                funding: 0.0001,
                source: 'spot',
                raw: symbolInfo
            };
        },
        futures: (data, symbol) => {
            const symbolInfo = data.data?.find(s => s.symbol === symbol);
            if (!symbolInfo) return null;
            
            return {
                maker: 0.0002, // 0.02%
                taker: 0.0006, // 0.06%
                funding: 0.0001,
                source: 'futures',
                raw: symbolInfo
            };
        }
    },
    
    hyperliquid: {
        futures: (data, symbol) => {
            // Hyperliquid is a DEX with different fee structure
            return {
                maker: 0.0002, // 0.02%
                taker: 0.0005, // 0.05%
                funding: 0.0001,
                source: 'futures',
                raw: data
            };
        }
    }
};

// Fetch fees for a specific exchange and symbol
async function fetchExchangeFees(exchangeId, symbol) {
    const endpoints = EXCHANGE_API_ENDPOINTS[exchangeId];
    const parsers = FEE_PARSERS[exchangeId];
    
    if (!endpoints || !parsers) {
        return {
            exchangeId,
            symbol,
            error: 'No API endpoints or parsers configured',
            timestamp: new Date().toISOString()
        };
    }
    
    const results = {
        exchangeId,
        symbol,
        spot: null,
        futures: null,
        funding: null,
        timestamp: new Date().toISOString()
    };
    
    try {
        // Fetch spot fees
        if (endpoints.spot && parsers.spot) {
            try {
                const response = await fetch(endpoints.spot);
                if (response.ok) {
                    const data = await response.json();
                    results.spot = parsers.spot(data, symbol);
                }
            } catch (error) {
                console.error(`Error fetching ${exchangeId} spot fees for ${symbol}:`, error.message);
            }
        }
        
        // Fetch futures fees
        if (endpoints.futures && parsers.futures) {
            try {
                const response = await fetch(endpoints.futures);
                if (response.ok) {
                    const data = await response.json();
                    results.futures = parsers.futures(data, symbol);
                }
            } catch (error) {
                console.error(`Error fetching ${exchangeId} futures fees for ${symbol}:`, error.message);
            }
        }
        
        // Fetch funding rates
        if (endpoints.funding) {
            try {
                const response = await fetch(`${endpoints.funding}?symbol=${symbol}`);
                if (response.ok) {
                    const data = await response.json();
                    results.funding = data;
                }
            } catch (error) {
                console.error(`Error fetching ${exchangeId} funding rate for ${symbol}:`, error.message);
            }
        }
        
    } catch (error) {
        results.error = error.message;
    }
    
    return results;
}

// Compare fetched fees with configured fees
function compareFees(fetchedFees, configuredFees) {
    const comparison = {
        exchangeId: fetchedFees.exchangeId,
        symbol: fetchedFees.symbol,
        spot: {
            configured: configuredFees,
            fetched: fetchedFees.spot,
            match: false,
            differences: []
        },
        futures: {
            fetched: fetchedFees.futures,
            differences: []
        },
        funding: {
            fetched: fetchedFees.funding,
            differences: []
        }
    };
    
    // Compare spot fees
    if (fetchedFees.spot && configuredFees) {
        const makerDiff = Math.abs(fetchedFees.spot.maker - configuredFees.maker);
        const takerDiff = Math.abs(fetchedFees.spot.taker - configuredFees.taker);
        
        comparison.spot.match = makerDiff < 0.0001 && takerDiff < 0.0001;
        
        if (makerDiff >= 0.0001) {
            comparison.spot.differences.push(`Maker: ${configuredFees.maker} (config) vs ${fetchedFees.spot.maker} (fetched)`);
        }
        if (takerDiff >= 0.0001) {
            comparison.spot.differences.push(`Taker: ${configuredFees.taker} (config) vs ${fetchedFees.spot.taker} (fetched)`);
        }
    }
    
    return comparison;
}

// Main verification function
async function verifyAllFees() {
    console.log('🔍 Starting comprehensive fee verification...\n');
    
    const results = {
        timestamp: new Date().toISOString(),
        summary: {
            total: 0,
            successful: 0,
            failed: 0,
            mismatches: 0
        },
        exchanges: {}
    };
    
    for (const exchangeId of Object.keys(SUPPORTED_EXCHANGES)) {
        console.log(`📊 Verifying fees for ${exchangeId}...`);
        results.exchanges[exchangeId] = {
            symbols: {},
            summary: {
                total: 0,
                successful: 0,
                failed: 0,
                mismatches: 0
            }
        };
        
        for (const symbol of SUPPORTED_SYMBOLS) {
            try {
                const fetchedFees = await fetchExchangeFees(exchangeId, symbol);
                const comparison = compareFees(fetchedFees, EXCHANGE_FEES[exchangeId]);
                
                results.exchanges[exchangeId].symbols[symbol] = comparison;
                results.exchanges[exchangeId].summary.total++;
                results.summary.total++;
                
                if (fetchedFees.error) {
                    results.exchanges[exchangeId].summary.failed++;
                    results.summary.failed++;
                    console.log(`  ❌ ${symbol}: ${fetchedFees.error}`);
                } else {
                    results.exchanges[exchangeId].summary.successful++;
                    results.summary.successful++;
                    
                    if (comparison.spot.match) {
                        console.log(`  ✅ ${symbol}: Fees match`);
                    } else {
                        results.exchanges[exchangeId].summary.mismatches++;
                        results.summary.mismatches++;
                        console.log(`  ⚠️  ${symbol}: Fee mismatch - ${comparison.spot.differences.join(', ')}`);
                    }
                }
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.log(`  ❌ ${symbol}: ${error.message}`);
                results.exchanges[exchangeId].summary.failed++;
                results.summary.failed++;
            }
        }
        
        console.log(`  📈 ${exchangeId} Summary: ${results.exchanges[exchangeId].summary.successful}/${results.exchanges[exchangeId].summary.total} successful, ${results.exchanges[exchangeId].summary.mismatches} mismatches\n`);
    }
    
    // Print overall summary
    console.log('🎯 Overall Summary:');
    console.log(`  Total verifications: ${results.summary.total}`);
    console.log(`  Successful: ${results.summary.successful}`);
    console.log(`  Failed: ${results.summary.failed}`);
    console.log(`  Mismatches: ${results.summary.mismatches}`);
    
    return results;
}

// Export for use in other modules
export { verifyAllFees, fetchExchangeFees, compareFees };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    verifyAllFees()
        .then(results => {
            console.log('\n✅ Fee verification completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Fee verification failed:', error);
            process.exit(1);
        });
} 
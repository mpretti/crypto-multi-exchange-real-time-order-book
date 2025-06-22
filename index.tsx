/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    selectedAsset, activeConnections, selectedExchanges, isAggregatedView,
    setSelectedAsset, setAggregatedView,
    setMaxCumulativeTotal, setMaxIndividualQuantity, currentChartInterval,
    chart, klineSeries, klineWebSocket, feeAdjustedPricing, setFeeAdjustedPricing,
    smallOrderFilterEnabled, minOrderSizeUsd, minOrderSizeAsset,
    setSmallOrderFilterEnabled, setMinOrderSizeUsd, setMinOrderSizeAsset,
    loadUserPreferences, saveUserPreferencesDebounced
} from './state';
import { logger, enableGlobalConsoleFiltering, LogFilters } from './utils';
import {
    assetSelect, exchangeLegendDiv, viewModeToggle, viewModeLabel,
    bidsTitle, asksTitle, toggleSidebarBtn, closeSidebarBtn,
    refreshSidebarStatsBtn, toggleExchangesBtn, pillsContainer, feeAdjustedToggle,
    feeLegendContainer, feeLegendContent
} from './dom';
import { SUPPORTED_EXCHANGES_ORDER_WITH_DEX, EXCHANGE_COLORS } from './config';
import { mapToSortedEntries, calculateCumulative, filterSmallOrders, getEstimatedPrice, getDecimalPlaces } from './utils';
import {
    updateOrderBookUI, updateSpread, updateOverallConnectionStatus,
    clearOrderBookDisplay, toggleSidebar, updateSidebarContent
} from './uiUpdates';
import {
    connectToExchange, disconnectFromExchange, reconnectToAllSelectedExchanges,
    fetchAuxiliaryDataForExchange
} from './websocket';
import {
    initChart, updateChartForAssetAndInterval, handleChartResize
} from './charts';
import type { OrderBookLevel, OrderBookEntry } from './types';


// --- Fee Legend Update Function ---
function updateFeeLegend() {
    if (!feeAdjustedPricing) {
        feeLegendContainer.style.display = 'none';
        return;
    }

    feeLegendContainer.style.display = 'block';
    feeLegendContent.innerHTML = '';
    
    // Add explanation header
    const explanationDiv = document.createElement('div');
    explanationDiv.style.marginBottom = '10px';
    explanationDiv.style.padding = '8px';
    explanationDiv.style.backgroundColor = 'rgba(255, 140, 0, 0.1)';
    explanationDiv.style.borderRadius = '4px';
    explanationDiv.style.fontSize = '0.85em';
    explanationDiv.style.color = '#ffa500';
    explanationDiv.innerHTML = `
        <strong>⚡ Fee-Adjusted Pricing Active</strong><br>
        Order book shows what you actually pay/receive after trading fees.<br>
        <span style="color: #26de81;">Bids</span> = what you get when selling | 
        <span style="color: #ff4757;">Asks</span> = what you pay when buying
    `;
    feeLegendContent.appendChild(explanationDiv);
    
    activeConnections.forEach(conn => {
        if (conn.status === 'connected' && conn.feeInfo?.takerRate && (conn.bids.size > 0 || conn.asks.size > 0)) {
            const exchangeDiv = document.createElement('div');
            exchangeDiv.className = 'fee-legend-exchange';
            
            const takerFeeRateStr = conn.feeInfo.takerRate.toString().replace('%', '');
            const takerFeeRate = parseFloat(takerFeeRateStr) / 100 || 0;
            
            // Get current best bid and ask from this exchange
            const bestBidPrice = conn.bids.size > 0 ? Math.max(...Array.from(conn.bids.keys()).map(p => parseFloat(p))) : null;
            const bestAskPrice = conn.asks.size > 0 ? Math.min(...Array.from(conn.asks.keys()).map(p => parseFloat(p))) : null;
            
            const exchangeColor = EXCHANGE_COLORS[conn.config.id] || EXCHANGE_COLORS.default;
            
            let bidSection = '';
            let askSection = '';
            
            // Build bid section if we have bid data
            if (bestBidPrice !== null) {
                const bidAdjustedPrice = bestBidPrice * (1 - takerFeeRate); // Net received when selling
                const bidImpact = bestBidPrice - bidAdjustedPrice;
                const bidDecimals = getDecimalPlaces(bestBidPrice);
                const impactDecimals = Math.max(getDecimalPlaces(bidImpact), 2);
                bidSection = `
                    <div class="fee-legend-detail bid">
                        <div class="fee-legend-detail-label">Sell to ${conn.config.name}</div>
                        <div class="fee-legend-detail-value">
                            <span style="color: #aaa; font-size: 0.9em;">Bid: ${bestBidPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: bidDecimals})}</span><br>
                            <span style="color: #26de81; font-weight: bold;">You Get: ${bidAdjustedPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: bidDecimals})}</span>
                        </div>
                        <div class="fee-legend-detail-impact">-${bidImpact.toFixed(impactDecimals)} fee</div>
                    </div>
                `;
            }
            
            // Build ask section if we have ask data
            if (bestAskPrice !== null) {
                const askAdjustedPrice = bestAskPrice * (1 + takerFeeRate); // Total paid when buying
                const askImpact = askAdjustedPrice - bestAskPrice;
                const askDecimals = getDecimalPlaces(bestAskPrice);
                const askImpactDecimals = Math.max(getDecimalPlaces(askImpact), 2);
                askSection = `
                    <div class="fee-legend-detail ask">
                        <div class="fee-legend-detail-label">Buy from ${conn.config.name}</div>
                        <div class="fee-legend-detail-value">
                            <span style="color: #aaa; font-size: 0.9em;">Ask: ${bestAskPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: askDecimals})}</span><br>
                            <span style="color: #ff4757; font-weight: bold;">You Pay: ${askAdjustedPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: askDecimals})}</span>
                        </div>
                        <div class="fee-legend-detail-impact">+${askImpact.toFixed(askImpactDecimals)} fee</div>
                    </div>
                `;
            }
            
            // Only show if we have at least one section
            if (bidSection || askSection) {
                exchangeDiv.innerHTML = `
                    <div class="fee-legend-exchange-name">
                        <span class="fee-legend-exchange-tag" style="background-color: ${exchangeColor};">
                            ${conn.config.name}
                        </span>
                        <span>${(takerFeeRate * 100).toFixed(3)}% Taker Fee</span>
                    </div>
                    <div class="fee-legend-details">
                        ${bidSection}
                        ${askSection}
                    </div>
                `;
                
                feeLegendContent.appendChild(exchangeDiv);
            }
        }
    });
    
    // If no exchanges with fee data, show message
    if (feeLegendContent.children.length === 0) {
        feeLegendContent.innerHTML = '<p style="text-align: center; color: #aaa; margin: 0;">No live price data available for fee calculation</p>';
    }
}

// --- Core Logic: Data Aggregation & Rendering ---
export function aggregateAndRenderAll() {
    let finalBids: OrderBookLevel[] = [];
    let finalAsks: OrderBookLevel[] = [];
    let newMaxCumulativeTotal = 0;
    let newMaxIndividualQuantity = 0;

    // Apply fee-adjusted pricing to connection data if enabled
    const getAdjustedPrice = (price: number, side: 'bid' | 'ask', conn: any) => {
        if (!feeAdjustedPricing || !conn.feeInfo?.takerRate) {
            return price;
        }
        const takerFeeRateStr = conn.feeInfo.takerRate.toString().replace('%', '');
        const takerFeeRate = parseFloat(takerFeeRateStr) / 100 || 0;
        
        let adjustedPrice;
        if (side === 'bid') {
            // For bids: You SELL to them, so you receive LESS due to fees
            adjustedPrice = price * (1 - takerFeeRate);
        } else {
            // For asks: You BUY from them, so you pay MORE due to fees  
            adjustedPrice = price * (1 + takerFeeRate);
        }
        
        // Debug logging for first few prices
        if (Math.random() < 0.01) { // Log ~1% of adjustments to avoid spam
            logger.log(`Fee adjustment for ${conn.config.name}: ${side} ${price} → ${adjustedPrice} (fee: ${(takerFeeRate * 100).toFixed(3)}%) ${side === 'bid' ? 'SELL→RECEIVE LESS' : 'BUY→PAY MORE'}`);
        }
        
        return adjustedPrice;
    };

    if (isAggregatedView) {
        const aggregatedBidsMap = new Map<string, number>();
        const aggregatedAsksMap = new Map<string, number>();
        activeConnections.forEach(conn => {
            if (conn.status === 'connected' && (conn.config.id === 'uniswap_simulated' || !conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                // Apply fee adjustment to bids and asks
                conn.bids.forEach((quantity, priceStr) => {
                    const originalPrice = parseFloat(priceStr);
                    const adjustedPrice = getAdjustedPrice(originalPrice, 'bid', conn);
                    const adjustedPriceStr = adjustedPrice.toString();
                    aggregatedBidsMap.set(adjustedPriceStr, (aggregatedBidsMap.get(adjustedPriceStr) || 0) + quantity);
                });
                conn.asks.forEach((quantity, priceStr) => {
                    const originalPrice = parseFloat(priceStr);
                    const adjustedPrice = getAdjustedPrice(originalPrice, 'ask', conn);
                    const adjustedPriceStr = adjustedPrice.toString();
                    aggregatedAsksMap.set(adjustedPriceStr, (aggregatedAsksMap.get(adjustedPriceStr) || 0) + quantity);
                });
            }
        });
        const sortedAggregatedBids = mapToSortedEntries(aggregatedBidsMap, true);
        const sortedAggregatedAsks = mapToSortedEntries(aggregatedAsksMap, false);
        
        // Apply small order filtering if enabled
        const currentPrice = getEstimatedPrice(sortedAggregatedBids, sortedAggregatedAsks);
        const filteredBids = filterSmallOrders(sortedAggregatedBids, currentPrice);
        const filteredAsks = filterSmallOrders(sortedAggregatedAsks, currentPrice);
        
        finalBids = calculateCumulative(filteredBids);
        finalAsks = calculateCumulative(filteredAsks);
        const maxBidTotal = finalBids.length > 0 ? finalBids[finalBids.length - 1].total : 0;
        const maxAskTotal = finalAsks.length > 0 ? finalAsks[finalAsks.length - 1].total : 0;
        newMaxCumulativeTotal = Math.max(maxBidTotal, maxAskTotal, 1);
        updateSpread(filteredBids, filteredAsks);
    } else {
        const allIndividualBids: OrderBookLevel[] = [];
        const allIndividualAsks: OrderBookLevel[] = [];
        activeConnections.forEach(conn => {
             if (conn.status === 'connected' && (conn.config.id === 'uniswap_simulated' || !conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                // Create fee-adjusted maps for individual view
                const adjustedBidsMap = new Map<string, number>();
                const adjustedAsksMap = new Map<string, number>();
                
                conn.bids.forEach((quantity, priceStr) => {
                    const originalPrice = parseFloat(priceStr);
                    const adjustedPrice = getAdjustedPrice(originalPrice, 'bid', conn);
                    const adjustedPriceStr = adjustedPrice.toString();
                    adjustedBidsMap.set(adjustedPriceStr, quantity);
                });
                conn.asks.forEach((quantity, priceStr) => {
                    const originalPrice = parseFloat(priceStr);
                    const adjustedPrice = getAdjustedPrice(originalPrice, 'ask', conn);
                    const adjustedPriceStr = adjustedPrice.toString();
                    adjustedAsksMap.set(adjustedPriceStr, quantity);
                });
                
                const exBids = mapToSortedEntries(adjustedBidsMap, true, conn.config.id);
                const exAsks = mapToSortedEntries(adjustedAsksMap, false, conn.config.id);
                
                // Apply small order filtering if enabled
                const currentPrice = getEstimatedPrice(exBids, exAsks);
                const filteredExBids = filterSmallOrders(exBids, currentPrice);
                const filteredExAsks = filterSmallOrders(exAsks, currentPrice);
                
                calculateCumulative(filteredExBids).forEach(level => allIndividualBids.push(level));
                calculateCumulative(filteredExAsks).forEach(level => allIndividualAsks.push(level));
                filteredExBids.forEach(b => newMaxIndividualQuantity = Math.max(newMaxIndividualQuantity, b.quantity));
                filteredExAsks.forEach(a => newMaxIndividualQuantity = Math.max(newMaxIndividualQuantity, a.quantity));
            }
        });
        finalBids = allIndividualBids.sort((a, b) => b.price - a.price);
        finalAsks = allIndividualAsks.sort((a, b) => a.price - b.price);
        newMaxIndividualQuantity = Math.max(newMaxIndividualQuantity, 1);
        
        // For spread calculation, use fee-adjusted prices
        const overallBestBids: OrderBookEntry[] = [];
        const overallBestAsks: OrderBookEntry[] = [];
        let topBidPrice = -Infinity, topAskPrice = Infinity;

        activeConnections.forEach(conn => {
            if (conn.status === 'connected' && (conn.config.id === 'uniswap_simulated' || !conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                if (conn.bids.size > 0) {
                    const bestExBidPrice = Math.max(...Array.from(conn.bids.keys()).map(p => {
                        const originalPrice = parseFloat(p);
                        return getAdjustedPrice(originalPrice, 'bid', conn);
                    }));
                    if (bestExBidPrice > topBidPrice) topBidPrice = bestExBidPrice;
                }
                if (conn.asks.size > 0) {
                     const bestExAskPrice = Math.min(...Array.from(conn.asks.keys()).map(p => {
                        const originalPrice = parseFloat(p);
                        return getAdjustedPrice(originalPrice, 'ask', conn);
                    }));
                     if (bestExAskPrice < topAskPrice) topAskPrice = bestExAskPrice;
                }
            }
        });
        if (topBidPrice > -Infinity) overallBestBids.push({price: topBidPrice, quantity: 1}); 
        if (topAskPrice < Infinity) overallBestAsks.push({price: topAskPrice, quantity: 1});
        updateSpread(overallBestBids, overallBestAsks);
    }
    setMaxCumulativeTotal(newMaxCumulativeTotal);
    setMaxIndividualQuantity(newMaxIndividualQuantity);
    updateOrderBookUI(finalBids, finalAsks);
    updateFeeLegend();
}



// ============================================================================
// LOGGING CONTROLS FUNCTIONALITY
// ============================================================================

function initializeLoggingControls(loggingToggle: HTMLInputElement, loggingSettingsBtn: HTMLButtonElement, loggingModal: HTMLDivElement, closeLoggingModal: HTMLButtonElement, loggingResetBtn: HTMLButtonElement) {
    // Initialize main logging toggle
    const currentFilters = logger.getFilters();
    loggingToggle.checked = currentFilters.enabled;

    // Main logging toggle
    loggingToggle.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        logger.updateFilters({ enabled });
        logger.forceLog(`🔧 Console logging ${enabled ? 'ENABLED' : 'DISABLED'}`);
        
        // Test the filtering with some sample messages
        if (enabled) {
            logger.log('✅ Test: This should appear (info level)');
            logger.warn('⚠️ Test: This should appear (warning level)');
            logger.error('❌ Test: This should appear (error level)');
        }
    });

    // Settings button
    loggingSettingsBtn.addEventListener('click', () => {
        openLoggingModal();
    });

    // Close modal
    closeLoggingModal.addEventListener('click', () => {
        closeModal();
    });

    // Close modal on backdrop click
    loggingModal.addEventListener('click', (e) => {
        if (e.target === loggingModal) {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loggingModal.style.display === 'block') {
            closeModal();
        }
    });

    // Reset button
    loggingResetBtn.addEventListener('click', () => {
        resetToDefaults();
    });

    function openLoggingModal() {
        const filters = logger.getFilters();
        populateModalWithCurrentSettings(filters);
        loggingModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeModal() {
        loggingModal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }

    function populateModalWithCurrentSettings(filters: LogFilters) {
        // Log levels
        const logLevelLog = document.getElementById('log-level-log') as HTMLInputElement;
        const logLevelWarn = document.getElementById('log-level-warn') as HTMLInputElement;
        const logLevelError = document.getElementById('log-level-error') as HTMLInputElement;

        if (logLevelLog) logLevelLog.checked = filters.levels.log;
        if (logLevelWarn) logLevelWarn.checked = filters.levels.warn;
        if (logLevelError) logLevelError.checked = filters.levels.error;

        // Categories
        const categories = ['websocket', 'api', 'chart', 'ui', 'volume', 'general'];
        categories.forEach(category => {
            const checkbox = document.getElementById(`log-category-${category}`) as HTMLInputElement;
            if (checkbox) {
                checkbox.checked = filters.categories[category as keyof typeof filters.categories];
            }
        });

        // Exchanges
        const exchanges = ['binance', 'bybit', 'okx', 'kraken', 'bitget', 'coinbase', 'gemini', 'bitrue', 'uniswap', 'hyperliquid', 'dydx', 'jupiter', 'vertex'];
        exchanges.forEach(exchange => {
            const checkbox = document.getElementById(`log-exchange-${exchange}`) as HTMLInputElement;
            if (checkbox) {
                checkbox.checked = filters.exchanges[exchange] !== false;
            }
        });
    }

    function resetToDefaults() {
        logger.forceLog('🔧 Resetting logging filters to defaults');
        
        // Reset to default values
        const defaultFilters: LogFilters = {
            enabled: true,
            levels: { log: true, warn: true, error: true },
            exchanges: {
                binance: true, bybit: true, okx: true, kraken: true, bitget: true,
                coinbase: true, gemini: true, bitrue: true, uniswap: true,
                hyperliquid: true, dydx: true, jupiter: true, vertex: true
            },
            categories: {
                websocket: true, api: true, chart: true, ui: true, volume: true, general: true
            }
        };

        populateModalWithCurrentSettings(defaultFilters);
    }
}

// --- Event Listeners & Initialization ---
function initializeApp() {
    // Load user preferences first
    loadUserPreferences();
    console.log('📂 Loaded user preferences - selectedAsset:', selectedAsset, 'selectedExchanges:', [...selectedExchanges]);
    
    assetSelect.value = selectedAsset;
    // Initialize exchange pills
    const exchangePills = exchangeLegendDiv.querySelectorAll<HTMLDivElement>('.exchange-pill');
    exchangePills.forEach(pill => {
        const exchangeId = pill.dataset.exchange;
        const checkbox = pill.querySelector<HTMLInputElement>('input[type="checkbox"]');
        if (exchangeId && checkbox) {
            const isSelected = selectedExchanges.has(exchangeId);
            pill.dataset.active = isSelected.toString();
            checkbox.checked = isSelected;
        }
    });

    viewModeToggle.checked = isAggregatedView;
    viewModeLabel.textContent = isAggregatedView ? 'Aggregated' : 'Individual';
    bidsTitle.textContent = `BIDS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;
    asksTitle.textContent = `ASKS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;

    // Apply loaded preferences to UI elements
    if (feeAdjustedToggle) {
        feeAdjustedToggle.checked = feeAdjustedPricing;
    }

    selectedExchanges.forEach(exchangeId => connectToExchange(exchangeId, selectedAsset));
    updateOverallConnectionStatus();

    // Event Listeners
    assetSelect.addEventListener('change', (event) => {
        const newAsset = (event.target as HTMLSelectElement).value;
        if (newAsset !== selectedAsset) {
            setSelectedAsset(newAsset);
            reconnectToAllSelectedExchanges(newAsset);
            updateChartForAssetAndInterval(newAsset, currentChartInterval);
            saveUserPreferencesDebounced(); // Save preferences
        }
    });

    // Add event listener for exchange pills
    exchangeLegendDiv.addEventListener('click', (event) => {
        const pill = (event.target as HTMLElement).closest('.exchange-pill') as HTMLDivElement;
        if (pill) {
            const exchangeId = pill.dataset.exchange;
            const checkbox = pill.querySelector<HTMLInputElement>('input[type="checkbox"]');
            
            if (exchangeId && checkbox) {
                const isCurrentlyActive = pill.dataset.active === 'true';
                const newActiveState = !isCurrentlyActive;
                
                logger.log(`Exchange pill clicked: ${exchangeId}, current: ${isCurrentlyActive}, new: ${newActiveState}`);
                
                // Update pill state
                pill.dataset.active = newActiveState.toString();
                checkbox.checked = newActiveState;
                
                // Update selected exchanges
                if (newActiveState) {
                    selectedExchanges.add(exchangeId);
                    logger.log(`✅ Added ${exchangeId} to selectedExchanges. Current set:`, [...selectedExchanges]);
                    connectToExchange(exchangeId, selectedAsset);
                } else {
                    selectedExchanges.delete(exchangeId);
                    logger.log(`❌ Removed ${exchangeId} from selectedExchanges. Current set:`, [...selectedExchanges]);
                    disconnectFromExchange(exchangeId);
                }
                
                updateOverallConnectionStatus(); 
                aggregateAndRenderAll(); 
                saveUserPreferencesDebounced(); // Save preferences
            }
        }
    });

    viewModeToggle.addEventListener('change', (event) => {
        setAggregatedView((event.target as HTMLInputElement).checked);
        viewModeLabel.textContent = isAggregatedView ? 'Aggregated' : 'Individual';
        bidsTitle.textContent = `BIDS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;
        asksTitle.textContent = `ASKS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;
        clearOrderBookDisplay();
        aggregateAndRenderAll();
        saveUserPreferencesDebounced(); // Save preferences
    });

    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);

    refreshSidebarStatsBtn.addEventListener('click', () => {
        console.log("Sidebar: Manual refresh stats triggered.");
        selectedExchanges.forEach(exchangeId => {
            const conn = activeConnections.get(exchangeId);
            if (conn && (conn.status === 'connected' || conn.status === 'fetching_aux_data' || conn.status === 'error')) {
                console.log(`Sidebar Refresh: Fetching aux data for ${conn.config.name}`);
                const symbolToUse = conn.currentSymbol || selectedAsset;
                fetchAuxiliaryDataForExchange(exchangeId, conn.config.formatSymbol(symbolToUse));
            }
        });
    });

    // Exchange toggle functionality
    toggleExchangesBtn.addEventListener('click', () => {
        const isCollapsed = pillsContainer.classList.contains('collapsed');
        
        if (isCollapsed) {
            pillsContainer.classList.remove('collapsed');
            toggleExchangesBtn.classList.remove('collapsed');
        } else {
            pillsContainer.classList.add('collapsed');
            toggleExchangesBtn.classList.add('collapsed');
        }
    });

    // Fee-adjusted pricing toggle
    if (feeAdjustedToggle) {
        feeAdjustedToggle.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            setFeeAdjustedPricing(target.checked);
            console.log(`Fee-adjusted pricing: ${target.checked ? 'ON' : 'OFF'}`);
            
            // Log current fee data for debugging
            if (target.checked) {
                logger.log('Fee adjustment enabled - Current exchange fees:');
                activeConnections.forEach(conn => {
                    if (conn.feeInfo?.takerRate) {
                        logger.log(`  ${conn.config.name}: ${conn.feeInfo.takerRate} taker fee`);
                    }
                });
            }
            
            // Trigger order book update with new pricing and legend update
            aggregateAndRenderAll();
            updateFeeLegend();
            saveUserPreferencesDebounced(); // Save preferences
        });
    }

    // Small order filter controls
    const smallOrderFilterToggle = document.getElementById('small-order-filter-toggle') as HTMLInputElement;
    const filterSettings = document.getElementById('filter-settings') as HTMLDivElement;
    const minUsdInput = document.getElementById('min-usd-input') as HTMLInputElement;
    const minAssetInput = document.getElementById('min-asset-input') as HTMLInputElement;
    
    if (smallOrderFilterToggle && filterSettings && minUsdInput && minAssetInput) {
        // Initialize filter controls
        smallOrderFilterToggle.checked = smallOrderFilterEnabled;
        filterSettings.style.display = smallOrderFilterEnabled ? 'flex' : 'none';
        minUsdInput.value = minOrderSizeUsd.toString();
        minAssetInput.value = minOrderSizeAsset.toString();
        
        // Toggle filter enable/disable
        smallOrderFilterToggle.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            setSmallOrderFilterEnabled(target.checked);
            filterSettings.style.display = target.checked ? 'flex' : 'none';
            logger.log(`Small order filter: ${target.checked ? 'ON' : 'OFF'}`);
            aggregateAndRenderAll();
            saveUserPreferencesDebounced(); // Save preferences
        });
        
        // Update minimum USD value
        minUsdInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const value = parseFloat(target.value) || 0;
            setMinOrderSizeUsd(value);
            logger.log(`Min USD order size: ${value}`);
            if (smallOrderFilterEnabled) {
                aggregateAndRenderAll();
            }
            saveUserPreferencesDebounced(); // Save preferences
        });
        
        // Update minimum asset value
        minAssetInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const value = parseFloat(target.value) || 0;
            setMinOrderSizeAsset(value);
            logger.log(`Min asset order size: ${value}`);
            if (smallOrderFilterEnabled) {
                aggregateAndRenderAll();
            }
            saveUserPreferencesDebounced(); // Save preferences
        });
    }

    // Chart initialization and event handlers
    initChart();
    updateChartForAssetAndInterval(selectedAsset, currentChartInterval);
    
    // Chart timeframe selector
    const chartTimeframeBtns = document.querySelectorAll('#chart-timeframe-selector button');
    chartTimeframeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target as HTMLButtonElement;
            const interval = target.getAttribute('data-interval');
            if (interval) {
                updateChartForAssetAndInterval(selectedAsset, interval);
            }
        });
    });
    
    // Chart resize handler
    window.addEventListener('resize', handleChartResize);

    // Initialize logging controls with delayed global override
    const loggingToggle = document.getElementById('logging-toggle') as HTMLInputElement;
    const loggingSettingsBtn = document.getElementById('logging-settings-btn') as HTMLButtonElement;
    const loggingModal = document.getElementById('logging-modal') as HTMLDivElement;
    const closeLoggingModal = document.getElementById('close-logging-modal') as HTMLButtonElement;
    const loggingResetBtn = document.getElementById('logging-reset-btn') as HTMLButtonElement;

    console.log('🔧 Initializing logging controls...', {
        loggingToggle: !!loggingToggle,
        loggingSettingsBtn: !!loggingSettingsBtn,
        loggingModal: !!loggingModal,
        closeLoggingModal: !!closeLoggingModal,
        loggingResetBtn: !!loggingResetBtn,
        loggingFiltersForm: !!document.getElementById('logging-filters-form')
    });

    if (loggingToggle && loggingSettingsBtn && loggingModal && closeLoggingModal && loggingResetBtn) {
        initializeLoggingControls(loggingToggle, loggingSettingsBtn, loggingModal, closeLoggingModal, loggingResetBtn);
        console.log('✅ Logging controls initialized successfully');
        
        // Enable global console filtering with a delay to prevent startup issues
        setTimeout(() => {
            logger.forceLog('🔧 Filtered logging system is active');
            // enableGlobalConsoleFiltering(); // Disable this for now to prevent recursion
        }, 2000);
    } else {
        console.warn('⚠️ Some logging control elements not found, logging controls not fully initialized');
    }

    // Add a simple chart connectivity test
    setTimeout(() => {
        console.log('=== Order Book Chart Integration Test ===');
        console.log('Chart container exists:', !!document.getElementById('chart-container'));
        console.log('Chart timeframe selector exists:', !!document.getElementById('chart-timeframe-selector'));
        console.log('Chart instance exists:', !!chart);
        console.log('Kline series exists:', !!klineSeries);
        console.log('Current chart interval:', currentChartInterval);
        console.log('=== End Chart Integration Test ===');
    }, 3000);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            logger.log("Tab became visible. Checking connections and chart.");
            selectedExchanges.forEach(exchangeId => {
                const conn = activeConnections.get(exchangeId);
                const isSimulated = exchangeId === 'uniswap_simulated';
                 const needsReconnect = !conn || conn.status === 'error' || conn.status === 'disconnected' || (conn.ws && conn.ws.readyState === WebSocket.CLOSED && !isSimulated && conn.status !== 'closing');


                if (needsReconnect) {
                     if (conn) { 
                        logger.log(`${conn.config.name}: Reconnecting due to visibility change (was ${conn.status}).`);
                        disconnectFromExchange(exchangeId); 
                        setTimeout(() => connectToExchange(exchangeId, selectedAsset), 250 * (SUPPORTED_EXCHANGES_ORDER_WITH_DEX.indexOf(exchangeId) + 1));
                     } else { 
                        logger.log(`Connecting ${exchangeId} due to visibility change (no prior connection state).`);
                        connectToExchange(exchangeId, selectedAsset);
                     }
                } else if (conn && conn.status === 'connected' && !conn.auxDataFetched) {
                    logger.log(`${conn.config.name}: Fetching aux data on visibility change (was connected, aux not fetched).`);
                    fetchAuxiliaryDataForExchange(exchangeId, conn.config.formatSymbol(selectedAsset));
                }
            });
            aggregateAndRenderAll();
            updateSidebarContent();
        } else {
          logger.log("Tab became hidden.");
        }
    });

    // Save preferences when user leaves the page
    window.addEventListener('beforeunload', () => {
        saveUserPreferencesDebounced();
    });
}

// Start the application
initializeApp();
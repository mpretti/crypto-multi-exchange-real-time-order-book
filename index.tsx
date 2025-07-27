
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Extend Window interface for global state access
declare global {
    interface Window {
        activeConnections: Map<string, any>;
        selectedAsset: string;
        selectedExchanges: Set<string>;
        isPerformanceMonitorVisible: boolean;
        isMarketIntelligenceVisible: boolean;
    }
}

import { 
    activeConnections, selectedAsset, setSelectedAsset, selectedExchanges, 
    isAggregatedView, setAggregatedView, maxCumulativeTotal, setMaxCumulativeTotal,
    maxIndividualQuantity, setMaxIndividualQuantity, currentChartInterval,
    isFeeAdjusted, setFeeAdjusted, isSmallOrdersFiltered, setSmallOrdersFiltered,
    isTopOfBookView, setTopOfBookView, smallOrderThreshold, setSmallOrderThreshold,
    isPerformanceMonitorVisible, setPerformanceMonitorVisible,
    isMarketIntelligenceVisible, setMarketIntelligenceVisible,
    chart, klineSeries, klineWebSocket
} from './state';
import { SUPPORTED_EXCHANGES, SUPPORTED_EXCHANGES_ORDER, EXCHANGE_FEES } from './config';
import {
    assetSelect, viewModeToggle, viewModeLabel,
    bidsTitle, asksTitle, toggleSidebarBtn, closeSidebarBtn,
    refreshSidebarStatsBtn, chartTimeframeSelectorEl, chartContainerEl
} from './dom';
import { 
    applyDepthSlice, getDecimalPlaces, mapToSortedEntries, calculateCumulative,
    applyFeeAdjustment, getExchangeTakerFee, createFeeLegend
} from './utils';
import {
    updateOrderBookUI, updateSpread, updateOverallConnectionStatus,
    clearOrderBookDisplay, toggleSidebar, updateSidebarContent
} from './uiUpdates';
import {
    connectToExchange, disconnectFromExchange, reconnectToAllSelectedExchanges,
    fetchAuxiliaryDataForExchange, setAggregateAndRenderAll
} from './websocket';
import {
    initChart, updateChartForAssetAndInterval, handleChartResize, subscribeToBinanceKlineUpdates
} from './charts';

import type { OrderBookLevel, OrderBookEntry, ExchangeConnectionState } from './types';


// --- UI Update Functions ---
function updateFeeLegendVisibility() {
    const feeLegendContainer = document.getElementById('fee-legend-container');
    if (feeLegendContainer) {
        if (isFeeAdjusted) {
            feeLegendContainer.classList.add('visible');
            updateFeeLegendContent();
        } else {
            feeLegendContainer.classList.remove('visible');
        }
    }
}

function updateFeeLegendContent() {
    const feeLegendContent = document.getElementById('fee-legend-content');
    if (!feeLegendContent) return;

    const feeItems = createFeeLegend(activeConnections);
    feeLegendContent.innerHTML = feeItems.map(item => `
        <div class="fee-item" style="border-left-color: ${item.color}">
            <strong>${item.name}</strong><br>
            Maker: ${item.makerFee} | Taker: ${item.takerFee}
        </div>
    `).join('');
}

// Exchange Grid Collapse/Expand functionality
function setupExchangeGridToggle() {
    const toggleBtn = document.getElementById('toggle-exchange-grid');
    const exchangeSection = document.querySelector('.exchange-controls-section');
    const toggleIcon = toggleBtn?.querySelector('.toggle-icon');
    const toggleText = toggleBtn?.querySelector('.toggle-text');
    
    if (!toggleBtn || !exchangeSection) return;
    
    let isCollapsed = false;
    
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isCollapsed = !isCollapsed;
        
        if (isCollapsed) {
            exchangeSection.classList.add('collapsed');
            toggleIcon!.textContent = '▶';
            toggleText!.textContent = 'Expand';
        } else {
            exchangeSection.classList.remove('collapsed');
            toggleIcon!.textContent = '▼';
            toggleText!.textContent = 'Collapse';
        }
    });
    
    // Also allow clicking the header to toggle
    const sectionHeader = exchangeSection.querySelector('.section-header');
    sectionHeader?.addEventListener('click', (e) => {
        if (e.target === toggleBtn || toggleBtn.contains(e.target as Node)) return;
        toggleBtn.click();
    });
}

// Enhanced exchange card creation with working toggles
function createExchangeControls() {
    const exchangeGrid = document.getElementById('exchange-grid');
    const exchangeCountElement = document.getElementById('exchange-count');
    
    if (!exchangeGrid) return;

    // Clear existing content
    exchangeGrid.innerHTML = '';
    
    // Update exchange count
    const totalExchanges = Object.keys(SUPPORTED_EXCHANGES).length;
    const connectedCount = Array.from(activeConnections.values()).filter(conn => conn.status === 'connected').length;
    if (exchangeCountElement) {
        exchangeCountElement.textContent = `${connectedCount}/${totalExchanges} Connected`;
        exchangeCountElement.style.background = connectedCount > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
        exchangeCountElement.style.color = connectedCount > 0 ? '#22c55e' : '#ef4444';
    }

    // Create exchange cards for all working exchanges
    Object.keys(SUPPORTED_EXCHANGES).forEach(exchangeId => {
        const exchange = SUPPORTED_EXCHANGES[exchangeId];
        const connectionState = activeConnections.get(exchangeId);
        const isEnabled = selectedExchanges.has(exchangeId);
        const fees = EXCHANGE_FEES[exchangeId];
        
        // Get current order book data from activeConnections and process it
        const connection = activeConnections.get(exchangeId);
        let bestBid = 0;
        let bestAsk = 0;
        
        if (connection?.status === 'connected' && connection.bids && connection.asks) {
            // Get raw bid/ask data for display (without fee adjustment or filtering)
            const bids = Array.from(connection.bids.keys()).map(p => parseFloat(p)).sort((a, b) => b - a);
            const asks = Array.from(connection.asks.keys()).map(p => parseFloat(p)).sort((a, b) => a - b);
            
            // Get best bid (highest price)
            if (bids.length > 0) {
                bestBid = bids[0];
            }
            
            // Get best ask (lowest price)
            if (asks.length > 0) {
                bestAsk = asks[0];
            }
        }

        // Create exchange card
        const exchangeCard = document.createElement('div');
        exchangeCard.className = `exchange-card ${exchangeId} ${isEnabled ? 'enabled' : 'disabled'}`;
        exchangeCard.setAttribute('data-exchange', exchangeId);
        exchangeCard.innerHTML = `
            <div class="exchange-header">
                <div class="exchange-info">
                    <div class="exchange-name ${exchangeId}">${exchange.name}</div>
                    <div class="connection-status ${connectionState?.status || 'disconnected'}">
                        <span class="status-dot"></span>
                        <span class="status-text">${connectionState?.status || 'disconnected'}</span>
                    </div>
                </div>
                
                <label class="exchange-toggle">
                    <input type="checkbox" ${isEnabled ? 'checked' : ''} data-exchange="${exchangeId}">
                    <span class="slider"></span>
                </label>
            </div>
            
            <div class="exchange-stats">
                <div class="price-info">
                    <div class="price-item">
                        <span class="price-label">Best Bid</span>
                        <span class="price-value">${bestBid > 0 ? `$${bestBid.toFixed(2)}` : '-'}</span>
                    </div>
                    <div class="price-item">
                        <span class="price-label">Best Ask</span>
                        <span class="price-value">${bestAsk > 0 ? `$${bestAsk.toFixed(2)}` : '-'}</span>
                    </div>
                </div>
                
                ${fees ? `
                <div class="fee-info">
                    <div class="fee-item">
                        <span class="fee-label">Maker</span>
                        <span class="fee-value">${((fees.maker || 0) * 100).toFixed(3)}%</span>
                    </div>
                    <div class="fee-item">
                        <span class="fee-label">Taker</span>
                        <span class="fee-value">${((fees.taker || 0) * 100).toFixed(3)}%</span>
                    </div>
                    ${EXCHANGE_FEE_URLS[exchangeId] ? `
                    <div class="fee-link">
                        <a href="${EXCHANGE_FEE_URLS[exchangeId]}" target="_blank" rel="noopener noreferrer" title="View official fee schedule">
                            📋 Fee Schedule
                        </a>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
            </div>
        `;

        // Add event listener to the toggle
        const toggle = exchangeCard.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                const exchangeId = target.getAttribute('data-exchange');
                if (!exchangeId) return;

                if (target.checked) {
                    // Enable exchange
                    selectedExchanges.add(exchangeId);
                    exchangeCard.classList.remove('disabled');
                    exchangeCard.classList.add('enabled');
                    
                    // Connect to the exchange
                    connectToExchange(exchangeId, selectedAsset);
                } else {
                    // Disable exchange
                    selectedExchanges.delete(exchangeId);
                    exchangeCard.classList.remove('enabled');
                    exchangeCard.classList.add('disabled');
                    
                    // Disconnect from the exchange
                    disconnectFromExchange(exchangeId);
                }

                // Update the order book display
                setTimeout(() => {
                    updateOrderBookUI([], []); // This will be called properly by the system
                    createExchangeControls(); // Refresh to update connection status
                }, 100);
            });
        }

        exchangeGrid.appendChild(exchangeCard);
    });
    
    // Apply grid styles AFTER all items are added
    exchangeGrid.style.display = 'grid';
    exchangeGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    exchangeGrid.style.gap = '16px';
    exchangeGrid.style.marginBottom = '0';
}

/**
 * Handle exchange toggle
 */
function handleExchangeToggle(exchangeId: string, enabled: boolean) {
    if (enabled) {
        if (!selectedExchanges.has(exchangeId)) {
            selectedExchanges.add(exchangeId);
            connectToExchange(exchangeId, selectedAsset);
        }
    } else {
        if (selectedExchanges.has(exchangeId)) {
            selectedExchanges.delete(exchangeId);
            disconnectFromExchange(exchangeId);
        }
    }
    
    // Update the display
    setTimeout(() => {
        createExchangeControls();
        aggregateAndRenderAll();
    }, 100);
}

/**
 * Update exchange controls with latest data
 */
function updateExchangeControls() {
    createExchangeControls();
}

// --- Order Book Processing ---
function processOrderBookData(
    rawBids: Map<string, number>, 
    rawAsks: Map<string, number>,
    connectionState: ExchangeConnectionState
): { processedBids: Map<string, number>, processedAsks: Map<string, number> } {
    const processedBids = new Map<string, number>();
    const processedAsks = new Map<string, number>();
    
    // Get fee rate for this exchange
    const feeRate = isFeeAdjusted ? getExchangeTakerFee(connectionState) : 0;
    
    // Use configurable threshold from state
    const threshold = isSmallOrdersFiltered ? smallOrderThreshold : 0;
    
    // Process bids
    rawBids.forEach((quantity, priceStr) => {
        const price = parseFloat(priceStr);
        const orderValue = price * quantity;
        
        // Apply small order filter
        if (orderValue >= threshold) {
            // Apply fee adjustment if enabled
            const adjustedPrice = isFeeAdjusted ? 
                applyFeeAdjustment(price, 'bid', feeRate) : price;
            
            const adjustedPriceStr = adjustedPrice.toFixed(getDecimalPlaces(adjustedPrice));
            processedBids.set(adjustedPriceStr, quantity);
        }
    });
    
    // Process asks
    rawAsks.forEach((quantity, priceStr) => {
        const price = parseFloat(priceStr);
        const orderValue = price * quantity;
        
        // Apply small order filter
        if (orderValue >= threshold) {
            // Apply fee adjustment if enabled
            const adjustedPrice = isFeeAdjusted ? 
                applyFeeAdjustment(price, 'ask', feeRate) : price;
            
            const adjustedPriceStr = adjustedPrice.toFixed(getDecimalPlaces(adjustedPrice));
            processedAsks.set(adjustedPriceStr, quantity);
        }
    });
    
    return { processedBids, processedAsks };
}

// --- Market Data Event Emission for Paper Trading ---
function emitMarketDataUpdate() {
    // Get the best bid and ask from all connected exchanges
    let bestBid = 0;
    let bestAsk = 0;
    let totalVolume = 0;
    let exchangeCount = 0;
    
    activeConnections.forEach(conn => {
        if (conn.status === 'connected' && (conn.config.id === 'uniswap_simulated' || !conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
            const { processedBids, processedAsks } = processOrderBookData(conn.bids, conn.asks, conn);
            
            // Get best bid (highest price)
            if (processedBids.size > 0) {
                const exchangeBestBid = Math.max(...Array.from(processedBids.keys()).map(p => parseFloat(p)));
                if (exchangeBestBid > bestBid) {
                    bestBid = exchangeBestBid;
                }
            }
            
            // Get best ask (lowest price)
            if (processedAsks.size > 0) {
                const exchangeBestAsk = Math.min(...Array.from(processedAsks.keys()).map(p => parseFloat(p)));
                if (bestAsk === 0 || exchangeBestAsk < bestAsk) {
                    bestAsk = exchangeBestAsk;
                }
            }
            
            // Calculate volume from this exchange
            const exchangeVolume = Array.from(processedBids.values()).reduce((sum, qty) => sum + qty, 0) +
                                 Array.from(processedAsks.values()).reduce((sum, qty) => sum + qty, 0);
            totalVolume += exchangeVolume;
            exchangeCount++;
        }
    });
    
    // Calculate mid price
    const midPrice = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : 0;
    const spread = bestBid > 0 && bestAsk > 0 ? ((bestAsk - bestBid) / bestBid) * 100 : 0;
    
    if (midPrice > 0) {
        // Emit market data update event for paper trading
        const marketDataEvent = new CustomEvent('marketDataUpdate', {
            detail: {
                price: midPrice,
                volume: totalVolume,
                bid: bestBid,
                ask: bestAsk,
                spread: spread,
                exchangeCount: exchangeCount,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(marketDataEvent);
    }
}

// --- Panel Visibility Control Functions ---
function togglePerformanceMonitor(visible: boolean) {
    const overlay = document.getElementById('performance-overlay');
    if (overlay) {
        if (visible) {
            overlay.style.display = 'block';
            overlay.classList.remove('minimized');
            const minimizeBtn = document.getElementById('perf-minimize');
            if (minimizeBtn) {
                minimizeBtn.textContent = '−';
            }
        } else {
            overlay.style.display = 'none';
        }
    }
}

function toggleMarketIntelligence(visible: boolean) {
    const panel = document.getElementById('market-intelligence-panel');
    if (panel) {
        if (visible) {
            panel.style.display = 'block';
            const intelContent = document.querySelector('.intel-content');
            if (intelContent) {
                intelContent.classList.remove('hidden');
                panel.classList.remove('collapsed');
                const toggleBtn = document.getElementById('intel-toggle-btn');
                if (toggleBtn) {
                    toggleBtn.textContent = '▲';
                }
            }
        } else {
            panel.style.display = 'none';
        }
    }
}

// --- Core Logic: Data Aggregation & Rendering ---
export function aggregateAndRenderAll() {
    let finalBids: OrderBookLevel[] = [];
    let finalAsks: OrderBookLevel[] = [];
    let newMaxCumulativeTotal = 0;
    let newMaxIndividualQuantity = 0;

    // Top-of-book view: Show only best bid/ask from each exchange
    if (isTopOfBookView) {
        const topOfBookBids: OrderBookLevel[] = [];
        const topOfBookAsks: OrderBookLevel[] = [];
        
        activeConnections.forEach(conn => {
            if (conn.status === 'connected' && (conn.config.id === 'uniswap_simulated' || !conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                // Process raw data with fee adjustment and filtering
                const { processedBids, processedAsks } = processOrderBookData(conn.bids, conn.asks, conn);
                
                // Get best bid (highest price)
                if (processedBids.size > 0) {
                    const bestBidPrice = Math.max(...Array.from(processedBids.keys()).map(p => parseFloat(p)));
                    const bestBidQuantity = processedBids.get(bestBidPrice.toString()) || 0;
                    topOfBookBids.push({
                        price: bestBidPrice,
                        quantity: bestBidQuantity,
                        total: bestBidQuantity,
                        exchangeId: conn.config.id
                    });
                }
                
                // Get best ask (lowest price)
                if (processedAsks.size > 0) {
                    const bestAskPrice = Math.min(...Array.from(processedAsks.keys()).map(p => parseFloat(p)));
                    const bestAskQuantity = processedAsks.get(bestAskPrice.toString()) || 0;
                    topOfBookAsks.push({
                        price: bestAskPrice,
                        quantity: bestAskQuantity,
                        total: bestAskQuantity,
                        exchangeId: conn.config.id
                    });
                }
            }
        });
        
        // Sort for display
        finalBids = topOfBookBids.sort((a, b) => b.price - a.price);
        finalAsks = topOfBookAsks.sort((a, b) => a.price - b.price);
        
        newMaxIndividualQuantity = Math.max(
            ...finalBids.map(b => b.quantity),
            ...finalAsks.map(a => a.quantity),
            1
        );
        
        // Update spread for top-of-book
        if (finalBids.length > 0 && finalAsks.length > 0) {
            const bestBid = finalBids[0];
            const bestAsk = finalAsks[0];
            updateSpread([bestBid], [bestAsk]);
        }
    } else if (isAggregatedView) {
        const aggregatedBidsMap = new Map<string, number>();
        const aggregatedAsksMap = new Map<string, number>();
        activeConnections.forEach(conn => {
            if (conn.status === 'connected' && (conn.config.id === 'uniswap_simulated' || !conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                // Process raw data with fee adjustment and filtering
                const { processedBids, processedAsks } = processOrderBookData(conn.bids, conn.asks, conn);
                
                // Aggregate processed data
                processedBids.forEach((quantity, priceStr) => {
                    aggregatedBidsMap.set(priceStr, (aggregatedBidsMap.get(priceStr) || 0) + quantity);
                });
                processedAsks.forEach((quantity, priceStr) => {
                    aggregatedAsksMap.set(priceStr, (aggregatedAsksMap.get(priceStr) || 0) + quantity);
                });
            }
        });
        const sortedAggregatedBids = mapToSortedEntries(aggregatedBidsMap, true);
        const sortedAggregatedAsks = mapToSortedEntries(aggregatedAsksMap, false);
        finalBids = calculateCumulative(sortedAggregatedBids);
        finalAsks = calculateCumulative(sortedAggregatedAsks);
        const maxBidTotal = finalBids.length > 0 ? finalBids[finalBids.length - 1].total : 0;
        const maxAskTotal = finalAsks.length > 0 ? finalAsks[finalAsks.length - 1].total : 0;
        newMaxCumulativeTotal = Math.max(maxBidTotal, maxAskTotal, 1);
        updateSpread(sortedAggregatedBids, sortedAggregatedAsks);
    } else {
        const allIndividualBids: OrderBookLevel[] = [];
        const allIndividualAsks: OrderBookLevel[] = [];
        activeConnections.forEach(conn => {
             if (conn.status === 'connected' && (conn.config.id === 'uniswap_simulated' || !conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                // Process raw data with fee adjustment and filtering
                const { processedBids, processedAsks } = processOrderBookData(conn.bids, conn.asks, conn);
                
                const exBids = mapToSortedEntries(processedBids, true, conn.config.id);
                const exAsks = mapToSortedEntries(processedAsks, false, conn.config.id);
                calculateCumulative(exBids).forEach(level => allIndividualBids.push(level));
                calculateCumulative(exAsks).forEach(level => allIndividualAsks.push(level));
                exBids.forEach(b => newMaxIndividualQuantity = Math.max(newMaxIndividualQuantity, b.quantity));
                exAsks.forEach(a => newMaxIndividualQuantity = Math.max(newMaxIndividualQuantity, a.quantity));
            }
        });
        finalBids = allIndividualBids.sort((a, b) => b.price - a.price);
        finalAsks = allIndividualAsks.sort((a, b) => a.price - b.price);
        newMaxIndividualQuantity = Math.max(newMaxIndividualQuantity, 1);
        
        const overallBestBids: OrderBookEntry[] = [];
        const overallBestAsks: OrderBookEntry[] = [];
        let topBidPrice = -Infinity, topAskPrice = Infinity;

        activeConnections.forEach(conn => {
            if (conn.status === 'connected' && (conn.config.id === 'uniswap_simulated' || !conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                if (conn.bids.size > 0) {
                    const bestExBidPrice = Math.max(...Array.from(conn.bids.keys()).map(p => parseFloat(p)));
                    if (bestExBidPrice > topBidPrice) topBidPrice = bestExBidPrice;
                }
                if (conn.asks.size > 0) {
                     const bestExAskPrice = Math.min(...Array.from(conn.asks.keys()).map(p => parseFloat(p)));
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
    
    // Update titles based on current view mode
    const viewMode = isTopOfBookView ? 'Top of Book' : 
                     isAggregatedView ? 'Aggregated' : 'Individual';
    bidsTitle.textContent = `BIDS (${viewMode})`;
    asksTitle.textContent = `ASKS (${viewMode})`;
    
    // Update fee legend if fee adjustment is enabled
    if (isFeeAdjusted) {
        updateFeeLegendContent();
    }
    
    // Update exchange controls with latest data
    updateExchangeControls();
    
    // Update UI with new data
    updateOrderBookUI(finalBids, finalAsks);
    
    // Update max values for future calculations
    setMaxCumulativeTotal(newMaxCumulativeTotal);
    setMaxIndividualQuantity(newMaxIndividualQuantity);
    
    // Emit market data update for paper trading
    emitMarketDataUpdate();
}


// Exchange fee URL mapping
const EXCHANGE_FEE_URLS: { [key: string]: string } = {
    binance: 'https://www.binance.com/en/fee/schedule',
    bybit: 'https://www.bybit.com/en/help-center/article/Trading-Fee-Structure',
    okx: 'https://www.okx.com/fees',
    kraken: 'https://www.kraken.com/features/fee-schedule',
    bitget: 'https://www.bitget.com/en/rate',
    gate: 'https://www.gate.io/fee',
    binanceus: 'https://www.binance.us/en/fee/schedule',
    mexc: 'https://www.mexc.com/fee',
    hyperliquid: 'https://hyperliquid.gitbook.io/hyperliquid/fees'
};

// --- Event Listeners & Initialization ---
function initializeApp() {
    console.log("Initializing main app with initial values for selectedAsset, selectedExchanges...");
    
    // Set default selected exchanges (already set in state.ts)
    // selectedExchanges is already initialized in state.ts with the correct exchanges

    viewModeToggle.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        setAggregatedView(target.checked);
        viewModeLabel.textContent = target.checked ? 'Aggregated' : 'Individual';
        aggregateAndRenderAll();
    });
    
    // Set initial view mode state
    viewModeToggle.checked = isAggregatedView;
    viewModeLabel.textContent = isAggregatedView ? 'Aggregated' : 'Individual';

    bidsTitle.textContent = `BIDS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;
    asksTitle.textContent = `ASKS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;

    // Initialize fee legend visibility since fee-adjusted is now enabled by default
    updateFeeLegendVisibility();
    
    // Initialize panel visibility (both hidden by default)
    togglePerformanceMonitor(false);
    toggleMarketIntelligence(false);
    
    // Initial aggregation and rendering
    aggregateAndRenderAll();

    selectedExchanges.forEach(exchangeId => connectToExchange(exchangeId, selectedAsset));
    updateOverallConnectionStatus();

    requestAnimationFrame(() => {
        console.log("Chart: Attempting initial chart setup via requestAnimationFrame.");
        initChart();
        if (selectedAsset && currentChartInterval) { 
            updateChartForAssetAndInterval(selectedAsset, currentChartInterval);
        } else {
            console.warn("Initial chart setup: selectedAsset or currentChartInterval not set.");
        }
    });

    // Initialize exchange controls
    createExchangeControls();

    // Event Listeners
    assetSelect.addEventListener('change', (event) => {
        const newAsset = (event.target as HTMLSelectElement).value;
        if (newAsset !== selectedAsset) {
            setSelectedAsset(newAsset);
            reconnectToAllSelectedExchanges(newAsset);
        }
    });

    // Handle exchange control toggles (new system)
    const exchangeGrid = document.getElementById('exchange-grid');
    if (exchangeGrid) {
        exchangeGrid.addEventListener('change', (event) => {
            const checkbox = event.target as HTMLInputElement;
            if (checkbox.type === 'checkbox' && checkbox.dataset.exchange) {
                const exchangeId = checkbox.dataset.exchange;
                if (checkbox.checked) {
                    selectedExchanges.add(exchangeId);
                    connectToExchange(exchangeId, selectedAsset);
                } else {
                    selectedExchanges.delete(exchangeId);
                    disconnectFromExchange(exchangeId);
                }
                updateOverallConnectionStatus();
                createExchangeControls(); // Refresh the controls
            }
        });
    }

    // Fee-adjusted toggle
    const feeAdjustedToggle = document.getElementById('fee-adjusted-toggle') as HTMLInputElement;
    if (feeAdjustedToggle) {
        // Set initial state
        feeAdjustedToggle.checked = isFeeAdjusted;
        
        feeAdjustedToggle.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            setFeeAdjusted(target.checked);
            updateFeeLegendVisibility();
            aggregateAndRenderAll();
        });
    }

    // Small orders filter toggle
    const smallOrdersToggle = document.getElementById('filter-small-orders-toggle') as HTMLInputElement;
    const thresholdInput = document.getElementById('small-order-threshold') as HTMLInputElement;
    
    if (smallOrdersToggle) {
        // Set initial state
        smallOrdersToggle.checked = isSmallOrdersFiltered;
        
        smallOrdersToggle.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            setSmallOrdersFiltered(target.checked);
            aggregateAndRenderAll();
        });
    }
    
    if (thresholdInput) {
        // Set initial value
        thresholdInput.value = smallOrderThreshold.toString();
        
        thresholdInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            const newThreshold = parseInt(target.value) || 10;
            setSmallOrderThreshold(newThreshold);
            aggregateAndRenderAll();
        });
        
        thresholdInput.addEventListener('blur', (event) => {
            const target = event.target as HTMLInputElement;
            const newThreshold = parseInt(target.value) || 10;
            // Ensure value is within bounds
            if (newThreshold < 1) target.value = '1';
            if (newThreshold > 1000) target.value = '1000';
            setSmallOrderThreshold(parseInt(target.value));
            aggregateAndRenderAll();
        });
    }

    // Top of book toggle
    const topOfBookToggle = document.getElementById('top-of-book-toggle') as HTMLInputElement;
    if (topOfBookToggle) {
        // Set initial state
        topOfBookToggle.checked = isTopOfBookView;
        
        topOfBookToggle.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            setTopOfBookView(target.checked);
            aggregateAndRenderAll();
        });
    }

    // Performance Monitor toggle
    const performanceMonitorToggle = document.getElementById('performance-monitor-toggle') as HTMLInputElement;
    if (performanceMonitorToggle) {
        // Set initial state (default to hidden)
        performanceMonitorToggle.checked = isPerformanceMonitorVisible;
        
        performanceMonitorToggle.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            setPerformanceMonitorVisible(target.checked);
            togglePerformanceMonitor(target.checked);
        });
    }

    // Market Intelligence toggle
    const marketIntelligenceToggle = document.getElementById('market-intelligence-toggle') as HTMLInputElement;
    if (marketIntelligenceToggle) {
        // Set initial state (default to hidden)
        marketIntelligenceToggle.checked = isMarketIntelligenceVisible;
        
        marketIntelligenceToggle.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            setMarketIntelligenceVisible(target.checked);
            toggleMarketIntelligence(target.checked);
        });
    }

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

    chartTimeframeSelectorEl.addEventListener('click', (event) => {
        const target = event.target as HTMLButtonElement;
        if (target.tagName === 'BUTTON' && target.dataset.interval) {
            const newInterval = target.dataset.interval;
            if (newInterval !== currentChartInterval) {
                updateChartForAssetAndInterval(selectedAsset, newInterval);
            }
        }
    });

    // Text Summarizer Event Listener



    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log("Tab became visible. Checking connections and chart.");
            selectedExchanges.forEach(exchangeId => {
                const conn = activeConnections.get(exchangeId);
                const isSimulated = exchangeId === 'uniswap_simulated';
                 const needsReconnect = !conn || conn.status === 'error' || conn.status === 'disconnected' || (conn.ws && conn.ws.readyState === WebSocket.CLOSED && !isSimulated && conn.status !== 'closing');


                if (needsReconnect) {
                     if (conn) { 
                        console.log(`${conn.config.name}: Reconnecting due to visibility change (was ${conn.status}).`);
                        disconnectFromExchange(exchangeId); 
                        setTimeout(() => connectToExchange(exchangeId, selectedAsset), 250 * (SUPPORTED_EXCHANGES_ORDER.indexOf(exchangeId) + 1));
                     } else { 
                        console.log(`Connecting ${exchangeId} due to visibility change (no prior connection state).`);
                        connectToExchange(exchangeId, selectedAsset);
                     }
                } else if (conn && conn.status === 'connected' && !conn.auxDataFetched) {
                    console.log(`${conn.config.name}: Fetching aux data on visibility change (was connected, aux not fetched).`);
                    fetchAuxiliaryDataForExchange(exchangeId, conn.config.formatSymbol(selectedAsset));
                }
            });
            aggregateAndRenderAll();
            updateSidebarContent();

            if (selectedAsset && currentChartInterval) {
                 if (!chartContainerEl.clientWidth || !chartContainerEl.clientHeight) {
                    console.log("Chart: Container not ready on visibility change. Will try on resize.");
                } else {
                    const chartState = { chart, klineSeries, klineWebSocket }; 
                    if (!chartState.chart || !chartState.klineSeries) {
                        console.log("Chart: Attempting to initialize chart on visibility change (was not initialized).");
                        initChart();
                    }
                    if (chartState.klineSeries) {
                        if (!chartState.klineWebSocket || chartState.klineWebSocket.readyState === WebSocket.CLOSED || chartState.klineWebSocket.readyState === WebSocket.CLOSING) {
                            console.log("Chart: Re-subscribing to kline WebSocket due to visibility change.");
                            subscribeToBinanceKlineUpdates(selectedAsset, currentChartInterval);
                        }
                    } else {
                         console.warn("Chart: Still no klineSeries on visibility change. Chart updates may not occur.");
                    }
                }
            }


        } else {
          console.log("Tab became hidden.");
        }
    });

    window.addEventListener('resize', handleChartResize);
}

// Initialize the aggregateAndRenderAll function reference for websocket.ts
setAggregateAndRenderAll(aggregateAndRenderAll);

// Start the application
initializeApp();

// AI Trading Simulation
class AITradingSimulator {
    private isRunning = false;
    private portfolio = {
        cash: 10000,
        totalValue: 10000,
        pnl: 0,
        pnlPercent: 0,
        positions: new Map<string, { quantity: number; entryPrice: number; side: 'long' | 'short' }>()
    };
    private performance = {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        aiAccuracy: 0,
        profitFactor: 0
    };
    private intervalId: number | null = null;

    constructor() {
        this.initializeUI();
        this.setupEventListeners();
    }

    private initializeUI() {
        this.updatePortfolioDisplay();
        this.updatePerformanceDisplay();
        this.updateAIStatus('ready', 'Ready to trade');
        this.addActivityLog('AI trading bot initialized');
    }

    private setupEventListeners() {
        const startBtn = document.getElementById('start-ai-trading') as HTMLButtonElement;
        const stopBtn = document.getElementById('stop-ai-trading') as HTMLButtonElement;
        const resetBtn = document.getElementById('reset-ai-portfolio') as HTMLButtonElement;

        startBtn?.addEventListener('click', () => this.startTrading());
        stopBtn?.addEventListener('click', () => this.stopTrading());
        resetBtn?.addEventListener('click', () => this.resetPortfolio());
    }

    private startTrading() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.updateAIStatus('trading', 'AI actively trading');
        this.addActivityLog('Started AI trading session');

        const startBtn = document.getElementById('start-ai-trading') as HTMLButtonElement;
        const stopBtn = document.getElementById('stop-ai-trading') as HTMLButtonElement;
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;

        // Simulate trading activity every 10-30 seconds
        this.intervalId = window.setInterval(() => {
            this.simulateTradeDecision();
        }, Math.random() * 20000 + 10000); // 10-30 seconds
    }

    private stopTrading() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.updateAIStatus('ready', 'Trading stopped');
        this.addActivityLog('Stopped AI trading session');

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        const startBtn = document.getElementById('start-ai-trading') as HTMLButtonElement;
        const stopBtn = document.getElementById('stop-ai-trading') as HTMLButtonElement;
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
    }

    private resetPortfolio() {
        this.portfolio = {
            cash: 10000,
            totalValue: 10000,
            pnl: 0,
            pnlPercent: 0,
            positions: new Map()
        };

        this.performance = {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            aiAccuracy: 0,
            profitFactor: 0
        };

        this.updatePortfolioDisplay();
        this.updatePerformanceDisplay();
        this.addActivityLog('Portfolio reset to initial state');
    }

    private simulateTradeDecision() {
        const symbols = Array.from(selectedExchanges).length > 0 ? [selectedAsset] : ['BTCUSDT'];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        // Get current price from order book
        const currentPrice = this.getCurrentPrice(symbol);
        if (!currentPrice) return;

        // AI "decision" (simulated)
        const confidence = Math.random();
        const shouldTrade = confidence > 0.6; // 40% chance to trade
        
        if (!shouldTrade) {
            this.addActivityLog(`AI analyzing ${symbol} - no trade signal (confidence: ${(confidence * 100).toFixed(1)}%)`);
            return;
        }

        // Check if we have an existing position
        const existingPosition = this.portfolio.positions.get(symbol);
        
        if (existingPosition) {
            // Consider closing position
            const shouldClose = Math.random() > 0.7; // 30% chance to close
            if (shouldClose) {
                this.closePosition(symbol, currentPrice);
            }
        } else {
            // Consider opening new position
            if (this.portfolio.positions.size < 3) { // Max 3 positions
                this.openPosition(symbol, currentPrice, confidence);
            }
        }

        this.updatePortfolioDisplay();
        this.updatePerformanceDisplay();
    }

    private getCurrentPrice(symbol: string): number | null {
        // Try to get price from active connections
        for (const [exchangeId, connection] of activeConnections) {
            if (connection.status === 'connected' && connection.asks.size > 0) {
                const prices = Array.from(connection.asks.keys()).map(p => parseFloat(p));
                return Math.min(...prices);
            }
        }
        
        // Fallback to simulated price based on symbol
        const basePrices: Record<string, number> = {
            'BTCUSDT': 45000,
            'ETHUSDT': 2800,
            'SOLUSDT': 120,
            'ADAUSDT': 0.45,
            'DOGEUSDT': 0.08
        };
        
        const basePrice = basePrices[symbol] || 100;
        return basePrice * (0.95 + Math.random() * 0.1); // ±5% variation
    }

    private openPosition(symbol: string, price: number, confidence: number) {
        const side: 'long' | 'short' = Math.random() > 0.5 ? 'long' : 'short';
        const positionSize = this.portfolio.cash * 0.2 * confidence; // Up to 20% of cash, scaled by confidence
        const quantity = positionSize / price;

        if (positionSize > this.portfolio.cash * 0.1) { // Minimum 10% of cash required
            this.portfolio.positions.set(symbol, { quantity, entryPrice: price, side });
            this.portfolio.cash -= positionSize;
            
            this.addActivityLog(`Opened ${side.toUpperCase()} position: ${quantity.toFixed(4)} ${symbol} @ $${price.toFixed(2)} (${(confidence * 100).toFixed(1)}% confidence)`);
        }
    }

    private closePosition(symbol: string, currentPrice: number) {
        const position = this.portfolio.positions.get(symbol);
        if (!position) return;

        const positionValue = position.quantity * currentPrice;
        let pnl: number;

        if (position.side === 'long') {
            pnl = (currentPrice - position.entryPrice) * position.quantity;
        } else {
            pnl = (position.entryPrice - currentPrice) * position.quantity;
        }

        this.portfolio.cash += positionValue;
        this.portfolio.positions.delete(symbol);
        this.performance.totalTrades++;

        if (pnl > 0) {
            this.performance.winningTrades++;
        } else {
            this.performance.losingTrades++;
        }

        const pnlPercent = (pnl / (position.entryPrice * position.quantity)) * 100;
        this.addActivityLog(`Closed ${position.side.toUpperCase()} position: ${position.quantity.toFixed(4)} ${symbol} @ $${currentPrice.toFixed(2)} (P&L: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)}, ${pnlPercent > 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)`);
    }

    private updatePortfolioDisplay() {
        // Calculate total portfolio value
        let positionsValue = 0;
        for (const [symbol, position] of this.portfolio.positions) {
            const currentPrice = this.getCurrentPrice(symbol) || position.entryPrice;
            positionsValue += position.quantity * currentPrice;
        }

        this.portfolio.totalValue = this.portfolio.cash + positionsValue;
        this.portfolio.pnl = this.portfolio.totalValue - 10000;
        this.portfolio.pnlPercent = (this.portfolio.pnl / 10000) * 100;

        // Update UI
        const portfolioValue = document.getElementById('ai-portfolio-value');
        const portfolioPnl = document.getElementById('ai-portfolio-pnl');
        const cashElement = document.getElementById('ai-cash');
        const openPositions = document.getElementById('ai-open-positions');

        if (portfolioValue) portfolioValue.textContent = `$${this.portfolio.totalValue.toFixed(2)}`;
        if (portfolioPnl) {
            portfolioPnl.textContent = `$${this.portfolio.pnl > 0 ? '+' : ''}${this.portfolio.pnl.toFixed(2)} (${this.portfolio.pnlPercent > 0 ? '+' : ''}${this.portfolio.pnlPercent.toFixed(1)}%)`;
            portfolioPnl.className = `stat-value pnl ${this.portfolio.pnl > 0 ? 'positive' : this.portfolio.pnl < 0 ? 'negative' : ''}`;
        }
        if (cashElement) cashElement.textContent = `$${this.portfolio.cash.toFixed(2)}`;
        if (openPositions) openPositions.textContent = this.portfolio.positions.size.toString();
    }

    private updatePerformanceDisplay() {
        if (this.performance.totalTrades > 0) {
            this.performance.winRate = (this.performance.winningTrades / this.performance.totalTrades) * 100;
            this.performance.aiAccuracy = this.performance.winRate; // Simplified
            
            if (this.performance.losingTrades > 0) {
                this.performance.profitFactor = this.performance.winningTrades / this.performance.losingTrades;
            }
        }

        const totalTrades = document.getElementById('ai-total-trades');
        const winRate = document.getElementById('ai-win-rate');
        const aiAccuracy = document.getElementById('ai-accuracy');
        const profitFactor = document.getElementById('ai-profit-factor');

        if (totalTrades) totalTrades.textContent = this.performance.totalTrades.toString();
        if (winRate) winRate.textContent = `${this.performance.winRate.toFixed(1)}%`;
        if (aiAccuracy) aiAccuracy.textContent = `${this.performance.aiAccuracy.toFixed(1)}%`;
        if (profitFactor) profitFactor.textContent = this.performance.profitFactor.toFixed(2);
    }

    private updateAIStatus(status: 'ready' | 'trading' | 'error', message: string) {
        const statusDot = document.getElementById('ai-status-dot');
        const statusText = document.getElementById('ai-status-text');

        if (statusDot) {
            statusDot.className = 'status-dot';
            if (status === 'trading') statusDot.classList.add('trading');
            else if (status === 'ready') statusDot.classList.add('active');
        }

        if (statusText) statusText.textContent = message;
    }

    private addActivityLog(message: string) {
        const activityLog = document.getElementById('ai-activity-log');
        if (!activityLog) return;

        const time = new Date().toLocaleTimeString();
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <span class="activity-time">${time}</span>
            <span class="activity-text">${message}</span>
        `;

        // Add to top and limit to 10 items
        activityLog.insertBefore(activityItem, activityLog.firstChild);
        while (activityLog.children.length > 10) {
            activityLog.removeChild(activityLog.lastChild!);
        }
    }
}

// Chart Data Source Display
function updateChartDataSource() {
    const chartDataSourceElement = document.getElementById('chart-data-source-value');
    if (!chartDataSourceElement) return;

    // Determine primary data source (first connected exchange)
    const connectedExchanges = Array.from(activeConnections.entries())
        .filter(([_, conn]) => conn.status === 'connected')
        .map(([id, _]) => id);

    if (connectedExchanges.length > 0) {
        const primaryExchange = connectedExchanges[0];
        const exchangeName = SUPPORTED_EXCHANGES[primaryExchange]?.name || primaryExchange;
        chartDataSourceElement.textContent = exchangeName;
        // Use a default color since EXCHANGE_COLORS is not available in this scope
        chartDataSourceElement.style.color = '#00bcd4';
    } else {
        chartDataSourceElement.textContent = 'No active connection';
        chartDataSourceElement.style.color = '#666';
    }
}

// Initialize AI Trading
let aiTrader: AITradingSimulator;

document.addEventListener('DOMContentLoaded', () => {
    aiTrader = new AITradingSimulator();
    
    // Setup collapsible exchange grid
    setupExchangeGridToggle();
    
    // Update chart data source when connections change
    // Use a simple interval to periodically update the chart data source
    setInterval(updateChartDataSource, 5000); // Update every 5 seconds
    
    // Initial chart data source update
    updateChartDataSource();
    
    // Expose state to global window object for market intelligence
    window.activeConnections = activeConnections;
    window.selectedAsset = selectedAsset;
    window.selectedExchanges = selectedExchanges;
    window.isPerformanceMonitorVisible = isPerformanceMonitorVisible;
    window.isMarketIntelligenceVisible = isMarketIntelligenceVisible;
    
    // Initialize the main app
    initializeApp();
});
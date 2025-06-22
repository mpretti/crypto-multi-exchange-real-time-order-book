
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    selectedAsset, activeConnections, selectedExchanges, isAggregatedView,
    setSelectedAsset, setAggregatedView,
    setMaxCumulativeTotal, setMaxIndividualQuantity, currentChartInterval,
    chart, klineSeries, klineWebSocket
} from './state';
import {
    assetSelect, exchangeSelectorDiv, viewModeToggle, viewModeLabel,
    bidsTitle, asksTitle, toggleSidebarBtn, closeSidebarBtn,
    refreshSidebarStatsBtn, chartTimeframeSelectorEl, chartContainerEl,
    textToSummarizeEl, summarizeBtn, summaryOutputEl // Added summarizer DOM elements
} from './dom';
import { SUPPORTED_EXCHANGES, SUPPORTED_EXCHANGES_ORDER } from './config';
import { mapToSortedEntries, calculateCumulative } from './utils';
import {
    updateOrderBookUI, updateSpread, updateOverallConnectionStatus,
    clearOrderBookDisplay, toggleSidebar, updateSidebarContent
} from './uiUpdates';
import {
    connectToExchange, disconnectFromExchange, reconnectToAllSelectedExchanges,
    fetchAuxiliaryDataForExchange
} from './websocket';
import {
    initChart, updateChartForAssetAndInterval, handleChartResize, subscribeToBinanceKlineUpdates
} from './charts';
import { summarizeTextWithGemini } from './gemini'; // Import Gemini summarizer
import type { OrderBookLevel, OrderBookEntry } from './types';


// --- Core Logic: Data Aggregation & Rendering ---
export function aggregateAndRenderAll() {
    let finalBids: OrderBookLevel[] = [];
    let finalAsks: OrderBookLevel[] = [];
    let newMaxCumulativeTotal = 0;
    let newMaxIndividualQuantity = 0;

    if (isAggregatedView) {
        const aggregatedBidsMap = new Map<string, number>();
        const aggregatedAsksMap = new Map<string, number>();
        activeConnections.forEach(conn => {
            if (conn.status === 'connected' && (conn.config.id === 'uniswap_simulated' || !conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                conn.bids.forEach((quantity, priceStr) => aggregatedBidsMap.set(priceStr, (aggregatedBidsMap.get(priceStr) || 0) + quantity));
                conn.asks.forEach((quantity, priceStr) => aggregatedAsksMap.set(priceStr, (aggregatedAsksMap.get(priceStr) || 0) + quantity));
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
                const exBids = mapToSortedEntries(conn.bids, true, conn.config.id);
                const exAsks = mapToSortedEntries(conn.asks, false, conn.config.id);
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
    updateOrderBookUI(finalBids, finalAsks);
}


// --- Event Listeners & Initialization ---
function initializeApp() {
    assetSelect.value = selectedAsset; 
    const checkboxes = exchangeSelectorDiv.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="exchange"]');
    checkboxes.forEach(cb => {
        cb.checked = selectedExchanges.has(cb.value);
        if (cb.checked && !selectedExchanges.has(cb.value)) { 
             selectedExchanges.add(cb.value);
        } else if (!cb.checked && selectedExchanges.has(cb.value)) { 
            selectedExchanges.delete(cb.value);
        }
    });

    viewModeToggle.checked = isAggregatedView;
    viewModeLabel.textContent = isAggregatedView ? 'Aggregated' : 'Individual';
    bidsTitle.textContent = `BIDS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;
    asksTitle.textContent = `ASKS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;

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

    // Event Listeners
    assetSelect.addEventListener('change', (event) => {
        const newAsset = (event.target as HTMLSelectElement).value;
        if (newAsset !== selectedAsset) {
            setSelectedAsset(newAsset);
            reconnectToAllSelectedExchanges(newAsset);
        }
    });

    exchangeSelectorDiv.addEventListener('change', (event) => {
        const checkbox = event.target as HTMLInputElement;
        if (checkbox.type === 'checkbox' && checkbox.name === 'exchange') {
            const exchangeId = checkbox.value;
            if (checkbox.checked) {
                selectedExchanges.add(exchangeId);
                connectToExchange(exchangeId, selectedAsset);
            } else {
                selectedExchanges.delete(exchangeId);
                disconnectFromExchange(exchangeId);
            }
            updateOverallConnectionStatus(); 
            aggregateAndRenderAll(); 
        }
    });

    viewModeToggle.addEventListener('change', (event) => {
        setAggregatedView((event.target as HTMLInputElement).checked);
        viewModeLabel.textContent = isAggregatedView ? 'Aggregated' : 'Individual';
        bidsTitle.textContent = `BIDS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;
        asksTitle.textContent = `ASKS (${isAggregatedView ? 'Aggregated' : 'Individual'})`;
        clearOrderBookDisplay();
        aggregateAndRenderAll();
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
    if (summarizeBtn && textToSummarizeEl && summaryOutputEl) {
        summarizeBtn.addEventListener('click', async () => {
            const textToSummarize = textToSummarizeEl.value;
            if (!textToSummarize.trim()) {
                summaryOutputEl.textContent = 'Please enter some text to summarize.';
                summaryOutputEl.className = 'error';
                return;
            }

            summarizeBtn.disabled = true;
            summaryOutputEl.textContent = 'Summarizing, please wait...';
            summaryOutputEl.className = 'loading'; // Add 'loading' class for styling

            try {
                const summary = await summarizeTextWithGemini(textToSummarize);
                summaryOutputEl.textContent = summary;
                summaryOutputEl.className = ''; // Reset class to default
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during summarization.';
                summaryOutputEl.textContent = errorMessage;
                summaryOutputEl.className = 'error'; // Add 'error' class for styling
                console.error("Summarization Error:", error);
            } finally {
                summarizeBtn.disabled = false;
            }
        });
    } else {
        console.warn("Summarizer UI elements (button, textarea, or output) not found. Summarization feature may not work.");
    }


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

// Start the application
initializeApp();
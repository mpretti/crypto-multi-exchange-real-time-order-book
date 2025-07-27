/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    bidsList, asksList, spreadValueEl, spreadPercentageEl,
    infoSidebar, mainContainer, connectionStatusSummaryEl,
    feesContentEl, fundingContentEl, volumeContentEl,
    fundingAssetSymbolEl, volumeAssetSymbolEl, spreadContainerEl
} from './dom';
import {
    selectedAsset, activeConnections, selectedExchanges,
    isAggregatedView, maxCumulativeTotal, maxIndividualQuantity,
    isSidebarOpen, setSidebarOpen,
    setMaxCumulativeTotal, setMaxIndividualQuantity
} from './state';
import { SUPPORTED_EXCHANGES, SUPPORTED_EXCHANGES_ORDER, EXCHANGE_COLORS, EXCHANGE_TAGS, EXCHANGE_FEES } from './config';
import { getDecimalPlaces, formatPrice, formatQuantity } from './utils';
import type { OrderBookLevel, OrderBookEntry } from './types';

// --- Sidebar Logic ---
export function toggleSidebar() {
    setSidebarOpen(!isSidebarOpen);
    if (isSidebarOpen) {
        infoSidebar.classList.add('open');
        mainContainer.classList.add('sidebar-active');
        updateSidebarContent();
    } else {
        infoSidebar.classList.remove('open');
        mainContainer.classList.remove('sidebar-active');
    }
}

export function updateSidebarContent() {
    if (!isSidebarOpen && !document.hidden) return;

    fundingAssetSymbolEl.textContent = selectedAsset;
    volumeAssetSymbolEl.textContent = selectedAsset;

    let feesHtml = '';
    let fundingHtml = '';
    let volumeHtml = '';
    let activeExchangeCountForSidebar = 0;
    let aggregatedUsdVolume = 0;
    let someDataIsLoading = false;

    SUPPORTED_EXCHANGES_ORDER.forEach(exchangeId => {
        const conn = activeConnections.get(exchangeId);
        if (selectedExchanges.has(exchangeId) && conn && (conn.status === 'connected' || conn.status === 'fetching_aux_data')) {
            activeExchangeCountForSidebar++;
            const config = SUPPORTED_EXCHANGES[exchangeId];
            let feeText = 'N/A';
            let fundingText = 'N/A';
            let volumeText = 'N/A';

            if (conn.auxDataFetched === undefined && conn.status === 'connected') {
                feeText = fundingText = volumeText = 'Loading...';
                someDataIsLoading = true;
            } else if (conn.auxDataFetched === false && conn.status === 'fetching_aux_data') {
                 feeText = fundingText = volumeText = 'Loading...';
                 someDataIsLoading = true;
            } else {
                if (conn.feeInfo) {
                    feeText = `Maker: ${conn.feeInfo.makerRate ?? '--'}, Taker: ${conn.feeInfo.takerRate ?? '--'}`;
                } else if (conn.feeInfo === null) feeText = 'Error loading fees';

                if (conn.fundingRateInfo) {
                    const rate = typeof conn.fundingRateInfo.rate === 'number' ? `${conn.fundingRateInfo.rate.toFixed(4)}%` : (conn.fundingRateInfo.rate || '--');
                    fundingText = `Rate: ${rate} | Next: ${conn.fundingRateInfo.nextFundingTime || '--'}`;
                } else if (conn.fundingRateInfo === null) fundingText = 'Error loading funding';

                if (conn.volumeInfo) {
                    const assetVol = typeof conn.volumeInfo.assetVolume === 'number' ? conn.volumeInfo.assetVolume.toLocaleString(undefined, {maximumFractionDigits: 2}) : (conn.volumeInfo.assetVolume || '--');
                    let usdVolDisplay = typeof conn.volumeInfo.usdVolume === 'number'
                        ? parseFloat(conn.volumeInfo.usdVolume.toString()).toLocaleString(undefined, {style: 'currency', currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0 })
                        : (conn.volumeInfo.usdVolume || '--');

                    volumeText = `${selectedAsset}: ${assetVol} | USD: ${usdVolDisplay}`;
                    if (typeof conn.volumeInfo.usdVolume === 'number') {
                        aggregatedUsdVolume += conn.volumeInfo.usdVolume;
                    } else if (typeof conn.volumeInfo.usdVolume === 'string') {
                        const parsedVol = parseFloat(conn.volumeInfo.usdVolume.replace(/[^0-9.-]+/g,""));
                        if (!isNaN(parsedVol)) aggregatedUsdVolume += parsedVol;
                    }
                } else if (conn.volumeInfo === null) volumeText = 'Error loading volume';
            }

            feesHtml += `<div class="sidebar-item"><strong>${config.name}:</strong> ${feeText}</div>`;
            fundingHtml += `<div class="sidebar-item"><strong>${config.name}:</strong> ${fundingText}</div>`;
            volumeHtml += `<div class="sidebar-item"><strong>${config.name}:</strong> ${volumeText}</div>`;
        }
    });

    if (activeExchangeCountForSidebar === 0) {
        const placeholder = "<p>Connect to exchanges to see information.</p>";
        feesContentEl.innerHTML = placeholder;
        fundingContentEl.innerHTML = placeholder;
        volumeContentEl.innerHTML = placeholder;
    } else {
        feesContentEl.innerHTML = feesHtml || "<p>No fee data available or loading...</p>";
        fundingContentEl.innerHTML = fundingHtml || "<p>No funding data available or loading...</p>";
        volumeContentEl.innerHTML = volumeHtml + `<div class="sidebar-item summary"><strong>Aggregated 24h Vol (USD):</strong> ${aggregatedUsdVolume > 0 ? aggregatedUsdVolume.toLocaleString(undefined, {style: 'currency', currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0 }) : (someDataIsLoading ? 'Calculating...' : '--')}</div>`;
    }
}


// --- UI Rendering ---
export function clearOrderBookDisplay() {
    bidsList.innerHTML = '';
    asksList.innerHTML = '';
    spreadValueEl.textContent = '-';
    spreadPercentageEl.textContent = '-';
    setMaxCumulativeTotal(0);
    setMaxIndividualQuantity(0);
     if (spreadContainerEl) spreadContainerEl.classList.remove('crossed-market');
}

export function updateOrderBookHeaders() {
    const bidsHeader = document.querySelector('#bids-column .order-book-header');
    const asksHeader = document.querySelector('#asks-column .order-book-header');
    
    if (!bidsHeader || !asksHeader) return;

    // Add appropriate CSS class
    bidsHeader.className = `order-book-header ${isAggregatedView ? 'aggregated' : 'individual'}`;
    asksHeader.className = `order-book-header ${isAggregatedView ? 'aggregated' : 'individual'}`;

    if (isAggregatedView) {
        // Aggregated view headers
        bidsHeader.innerHTML = `
            <span class="total-header">Total</span>
            <span class="quantity-header">Quantity</span>
            <span class="price-header">Price (USDT)</span>
        `;
        
        asksHeader.innerHTML = `
            <span class="price-header">Price (USDT)</span>
            <span class="quantity-header">Quantity</span>
            <span class="total-header">Total</span>
        `;
    } else {
        // Individual view headers (with exchange column)
        bidsHeader.innerHTML = `
            <span class="exchange-header">Exchange</span>
            <span class="price-header">Price (USDT)</span>
            <span class="quantity-header">Quantity</span>
            <span class="total-header">Total</span>
        `;
        
        asksHeader.innerHTML = `
            <span class="exchange-header">Exchange</span>
            <span class="price-header">Price (USDT)</span>
            <span class="quantity-header">Quantity</span>
            <span class="total-header">Total</span>
        `;
    }
}

export function updateOrderBookUI(bids: OrderBookLevel[], asks: OrderBookLevel[]) {
    updateOrderBookHeaders();
    renderLevels(bidsList, bids, 'bid', true);
    renderLevels(asksList, asks, 'ask', false);
}

export function renderLevels(listElement: HTMLUListElement, levels: OrderBookLevel[], type: 'bid' | 'ask', isBidsLayout: boolean) {
    listElement.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const displayLevels = levels.slice(0, isAggregatedView ? 20 : 50);

    displayLevels.forEach(level => {
        const listItem = document.createElement('li');
        listItem.classList.add('order-book-row', `order-book-row-${type}`);
        listItem.classList.add(isAggregatedView ? 'aggregated' : 'individual');
        listItem.setAttribute('role', 'row');
        
        let depthPercentage = isAggregatedView ? (level.total / maxCumulativeTotal) * 100 : (level.quantity / maxIndividualQuantity) * 100;
        const backgroundDiv = document.createElement('div');
        backgroundDiv.classList.add('depth-bar');
        backgroundDiv.style.width = `${Math.min(depthPercentage, 100)}%`;

        // Exchange cell (only for individual view)
        if (!isAggregatedView && level.exchangeId) {
            const exchangeSpan = document.createElement('span');
            exchangeSpan.classList.add('exchange-cell');
            
            const exchangeTagSpan = document.createElement('span');
            exchangeTagSpan.classList.add('exchange-tag');
            exchangeTagSpan.textContent = EXCHANGE_TAGS[level.exchangeId] || level.exchangeId.substring(0,3).toUpperCase();
            
            const exchangeColor = EXCHANGE_COLORS[level.exchangeId] || EXCHANGE_COLORS.default;
            exchangeTagSpan.style.backgroundColor = exchangeColor;
            
            // Determine if background is light or dark
            if (isLightColor(exchangeColor)) {
                exchangeTagSpan.classList.add('light-bg');
            } else {
                exchangeTagSpan.classList.add('dark-bg');
            }
            
            exchangeSpan.appendChild(exchangeTagSpan);
            listItem.appendChild(exchangeSpan);
        }
        
        // Price cell
        const priceSpan = document.createElement('span');
        priceSpan.classList.add('price'); 
        priceSpan.setAttribute('role', 'cell');
        priceSpan.appendChild(document.createTextNode(formatPrice(level.price)));
        
        // Quantity cell
        const quantitySpan = document.createElement('span');
        quantitySpan.classList.add('quantity'); 
        quantitySpan.setAttribute('role', 'cell');
        quantitySpan.textContent = formatQuantity(level.quantity);
        
        // Total cell
        const totalSpan = document.createElement('span');
        totalSpan.classList.add('total'); 
        totalSpan.setAttribute('role', 'cell');
        totalSpan.textContent = formatQuantity(level.total);

        // Append cells in correct order
        if (isAggregatedView) {
            if (isBidsLayout) { 
                listItem.appendChild(totalSpan); 
                listItem.appendChild(quantitySpan); 
                listItem.appendChild(priceSpan); 
            } else { 
                listItem.appendChild(priceSpan); 
                listItem.appendChild(quantitySpan); 
                listItem.appendChild(totalSpan); 
            }
        } else {
            // Individual view: Exchange | Price | Quantity | Total
            listItem.appendChild(priceSpan);
            listItem.appendChild(quantitySpan);
            listItem.appendChild(totalSpan);
        }

        listItem.appendChild(backgroundDiv);
        fragment.appendChild(listItem);
    });
    listElement.appendChild(fragment);
}

// Helper function to determine if a color is light or dark
function isLightColor(color: string): boolean {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

export function updateSpread(bids: OrderBookEntry[], asks: OrderBookEntry[]) {
    if (!spreadContainerEl || !spreadValueEl || !spreadPercentageEl) return;

    if (bids.length > 0 && asks.length > 0) {
        const bestBid = bids[0].price;
        const bestAsk = asks[0].price;
        const spread = bestAsk - bestBid;

        const isCrossed = bestBid > 0 && bestAsk > 0 && bestBid >= bestAsk;

        if (isCrossed) {
            spreadContainerEl.classList.add('crossed-market');
            spreadValueEl.textContent = spread.toFixed(getDecimalPlaces(bestAsk));
            spreadPercentageEl.textContent = `(Crossed!)`;
        } else {
            spreadContainerEl.classList.remove('crossed-market');
            // Check for other invalid spread conditions (e.g. zero price, actual negative spread not from crossing)
            if (bestAsk <= 0 || bestBid <= 0 || spread < 0) {
                spreadValueEl.textContent = '-';
                spreadPercentageEl.textContent = '-';
                return;
            }
            const spreadPercentage = (spread / bestAsk) * 100;
            spreadValueEl.textContent = spread.toFixed(getDecimalPlaces(bestAsk));
            spreadPercentageEl.textContent = `${spreadPercentage.toFixed(2)}%`;
        }
    } else {
        spreadContainerEl.classList.remove('crossed-market');
        spreadValueEl.textContent = '-';
        spreadPercentageEl.textContent = '-';
    }
}


export function updateOverallConnectionStatus() {
    let summaryHtml = '';
    SUPPORTED_EXCHANGES_ORDER.forEach(exchangeId => {
        const config = SUPPORTED_EXCHANGES[exchangeId];
        // Safety check: skip if exchange config doesn't exist
        if (!config || !config.name) {
            console.warn(`Exchange config missing for: ${exchangeId}`);
            return;
        }
        
        const conn = activeConnections.get(exchangeId);
        let statusText = 'N/A'; let statusClass = 'status-disabled';
        if (selectedExchanges.has(exchangeId)) {
            statusClass = 'status-disconnected';
            if (conn) {
                statusText = conn.status.charAt(0).toUpperCase() + conn.status.slice(1);
                 if (conn.status === 'fetching_aux_data') {
                    statusText = "Syncing Stats..."; statusClass = 'status-connecting';
                } else if(conn.config.needsSnapshotFlag && conn.status === 'connected' && !conn.snapshotReceived && conn.config.id !== 'uniswap_simulated') {
                    statusText = "Snapshot..."; statusClass = 'status-connecting';
                } else {
                    switch (conn.status) {
                        case 'connected': statusClass = 'status-connected'; break;
                        case 'connecting': statusClass = 'status-connecting'; break;
                        case 'error': statusClass = 'status-error'; break;
                        case 'closing': statusClass = 'status-disconnected'; statusText = 'Closing'; break;
                        case 'disconnected': statusClass = 'status-disconnected'; break;
                    }
                }
            } else { statusText = 'Pending'; statusClass = 'status-connecting'; }
        } else { statusText = 'Disabled'; statusClass = 'status-disabled'; }
        summaryHtml += `<span class="connection-item ${statusClass}" title="${config.name} - ${statusText}">${config.name}: ${statusText}</span>`;
    });
    connectionStatusSummaryEl.innerHTML = summaryHtml;
    updateSidebarContent(); // Update sidebar as connection status might affect its content
}

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
    selectedAsset, selectedExchanges, activeConnections,
    isAggregatedView, maxCumulativeTotal, maxIndividualQuantity,
    isSidebarOpen, setSidebarOpen,
    setMaxCumulativeTotal, setMaxIndividualQuantity,
    feeAdjustedPricing
} from './state';
import { SUPPORTED_EXCHANGES_WITH_DEX, SUPPORTED_EXCHANGES_ORDER_WITH_DEX, EXCHANGE_COLORS, EXCHANGE_TAGS } from './config';
import { getDecimalPlaces } from './utils';
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

    SUPPORTED_EXCHANGES_ORDER_WITH_DEX.forEach(exchangeId => {
        const conn = activeConnections.get(exchangeId);
        if (selectedExchanges.has(exchangeId) && conn && (conn.status === 'connected' || conn.status === 'fetching_aux_data')) {
            activeExchangeCountForSidebar++;
            const config = SUPPORTED_EXCHANGES_WITH_DEX[exchangeId];
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
                    // Enhanced display for Hyperliquid with detailed fee structure
                    if (config.id === 'hyperliquid' && conn.feeInfo.raw?.feeStructure) {
                        const fs = conn.feeInfo.raw.feeStructure;
                        feeText = `
                            <div class="fee-detailed">
                                <div><strong>Perps:</strong> Maker: ${fs.perps.baseMaker}%-${fs.perps.diamondMaker}%, Taker: ${fs.perps.baseTaker}%-${fs.perps.diamondTaker}%</div>
                                <div><strong>Staking Discount:</strong> Up to ${fs.stakingTiers[fs.stakingTiers.length-1].discount*100}% (${fs.stakingTiers[fs.stakingTiers.length-1].minStake.toLocaleString()} HYPE)</div>
                                <div><strong>Volume Discount:</strong> Up to ${(fs.volumeTiers[fs.volumeTiers.length-1].takerDiscount*100).toFixed(1)}% off</div>
                                <div><strong>Maker Rebates:</strong> Earn up to ${Math.abs(fs.makerRebates[fs.makerRebates.length-1].rebate)*100}%</div>
                                <div class="fee-note">💡 Fees go to community (HLP, assistance fund)</div>
                            </div>
                        `;
                    } else {
                        feeText = `Maker: ${conn.feeInfo.makerRate ?? '--'}, Taker: ${conn.feeInfo.takerRate ?? '--'}`;
                    }
                } else if (conn.feeInfo === null) feeText = 'Error loading fees';

                if (conn.fundingRateInfo) {
                    const rate = typeof conn.fundingRateInfo.rate === 'number' ? `${conn.fundingRateInfo.rate.toFixed(4)}%` : (conn.fundingRateInfo.rate || '--');
                    fundingText = `Rate: ${rate} | Next: ${conn.fundingRateInfo.nextFundingTime || '--'}`;
                     if (config.id === 'uniswap') fundingText = `${conn.fundingRateInfo.rate || 'N/A (Spot AMM)'}`;
                } else if (conn.fundingRateInfo === null) fundingText = 'Error loading funding';

                if (conn.volumeInfo) {
                    const assetVol = typeof conn.volumeInfo.assetVolume === 'number' ? conn.volumeInfo.assetVolume.toLocaleString(undefined, {maximumFractionDigits: 2}) : (conn.volumeInfo.assetVolume || '--');
                    let usdVolDisplay = typeof conn.volumeInfo.usdVolume === 'number'
                        ? parseFloat(conn.volumeInfo.usdVolume.toString()).toLocaleString(undefined, {style: 'currency', currency: 'USD', minimumFractionDigits:0, maximumFractionDigits:0 })
                        : (conn.volumeInfo.usdVolume || '--');

                    volumeText = `${selectedAsset}: ${assetVol} | USD: ${usdVolDisplay}`;
                    if (typeof conn.volumeInfo.usdVolume === 'number') {
                        aggregatedUsdVolume += conn.volumeInfo.usdVolume;
                    } else if (typeof conn.volumeInfo.usdVolume === 'string' && config.id !== 'uniswap') {
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

export function updateOrderBook(): void {
    if (!selectedAsset) return;

    const bidsList = document.getElementById('bids-list');
    const asksList = document.getElementById('asks-list');
    
    if (!bidsList || !asksList) return;

    // This function will be called from index.tsx where orderBookData is available
    // The fee adjustment will be handled in the calling context
}

export function updateOrderBookUI(bids: OrderBookLevel[], asks: OrderBookLevel[]) {
    if (!bidsList || !asksList) {
        console.error('Order book elements not found!');
        return;
    }
    
    // Find the crossing point to highlight crossed orders
    const bestBid = bids.length > 0 ? bids[0].price : 0;
    const bestAsk = asks.length > 0 ? asks[0].price : Infinity;
    
    renderLevels(bidsList, bids, 'bid', true, bestAsk);
    renderLevels(asksList, asks, 'ask', false, bestBid);
}

export function renderLevels(listElement: HTMLUListElement, levels: OrderBookLevel[], type: 'bid' | 'ask', isBidsLayout: boolean, crossingPrice?: number) {
    listElement.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const displayLevels = levels.slice(0, isAggregatedView ? 20 : 50);

    displayLevels.forEach(level => {
        const listItem = document.createElement('li');
        listItem.classList.add('order-book-row', `order-book-row-${type}`);
        listItem.setAttribute('role', 'row');
        
        // Check if this order is crossed (arbitrage opportunity)
        const isCrossed = crossingPrice !== undefined && (
            (type === 'bid' && level.price >= crossingPrice) ||
            (type === 'ask' && level.price <= crossingPrice)
        );
        
        if (isCrossed) {
            listItem.classList.add('crossed-order');
            const profit = type === 'bid' 
                ? level.price - (crossingPrice || 0)
                : (crossingPrice || 0) - level.price;
            const profitPercentage = ((profit / level.price) * 100).toFixed(2);
            listItem.title = `🚀 ARBITRAGE OPPORTUNITY! Profit: ${profit.toFixed(getDecimalPlaces(level.price))} (${profitPercentage}%)`;
            
 
        }
        let depthPercentage = isAggregatedView ? (level.total / maxCumulativeTotal) * 100 : (level.quantity / maxIndividualQuantity) * 100;
        const backgroundDiv = document.createElement('div');
        backgroundDiv.classList.add('depth-bar');
        backgroundDiv.style.width = `${Math.min(depthPercentage, 100)}%`;
        const priceSpan = document.createElement('span');
        priceSpan.classList.add('price'); priceSpan.setAttribute('role', 'cell');
        if (!isAggregatedView && level.exchangeId) {
            const exchangeTagSpan = document.createElement('span');
            exchangeTagSpan.classList.add('exchange-tag');
            exchangeTagSpan.textContent = EXCHANGE_TAGS[level.exchangeId] || level.exchangeId.substring(0,3).toUpperCase();
            exchangeTagSpan.style.backgroundColor = EXCHANGE_COLORS[level.exchangeId] || EXCHANGE_COLORS.default;
            priceSpan.appendChild(exchangeTagSpan);
        }
        
        // Show price with fee adjustment indicator
        const priceText = level.price.toFixed(getDecimalPlaces(level.price));
        priceSpan.appendChild(document.createTextNode(priceText));
        
        // Add fee adjustment indicator if enabled
        if (feeAdjustedPricing && level.exchangeId) {
            const feeIndicator = document.createElement('span');
            feeIndicator.textContent = '⚡';
            feeIndicator.style.marginLeft = '2px';
            feeIndicator.style.fontSize = '0.7em';
            feeIndicator.style.opacity = '0.6';
            feeIndicator.title = `Fee-adjusted price (${type === 'bid' ? 'what you receive' : 'what you pay'})`;
            priceSpan.appendChild(feeIndicator);
        }
        
        const quantitySpan = document.createElement('span');
        quantitySpan.classList.add('quantity'); quantitySpan.setAttribute('role', 'cell');
        quantitySpan.textContent = level.quantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
        const totalSpan = document.createElement('span');
        totalSpan.classList.add('total'); totalSpan.setAttribute('role', 'cell');
        totalSpan.textContent = level.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
        if (isBidsLayout) { listItem.appendChild(totalSpan); listItem.appendChild(quantitySpan); listItem.appendChild(priceSpan); }
        else { listItem.appendChild(priceSpan); listItem.appendChild(quantitySpan); listItem.appendChild(totalSpan); }
        listItem.appendChild(backgroundDiv);
        fragment.appendChild(listItem);
    });
    listElement.appendChild(fragment);
}

export function updateSpread(bids: OrderBookEntry[], asks: OrderBookEntry[]) {
    if (!spreadContainerEl || !spreadValueEl || !spreadPercentageEl) return;

    if (bids.length > 0 && asks.length > 0) {
        const bestBid = bids[0].price;
        const bestAsk = asks[0].price;
        const spread = bestAsk - bestBid;

        // Find which exchanges have the best bid and ask for arbitrage identification
        let bestBidExchange = '';
        let bestAskExchange = '';
        
        // In individual view, we can see exchange IDs directly
        if (!isAggregatedView && bids[0].exchangeId && asks[0].exchangeId) {
            bestBidExchange = bids[0].exchangeId;
            bestAskExchange = asks[0].exchangeId;
        } else {
            // In aggregated view, find exchanges with best prices
            activeConnections.forEach(conn => {
                if (conn.status === 'connected' && (conn.config.id === 'uniswap' || !conn.config.needsSnapshotFlag || conn.snapshotReceived)) {
                    if (conn.bids.size > 0) {
                        const connBestBidPrice = Math.max(...Array.from(conn.bids.keys()).map(p => parseFloat(p)));
                        if (Math.abs(connBestBidPrice - bestBid) < 0.01) {
                            bestBidExchange = conn.config.name;
                        }
                    }
                    if (conn.asks.size > 0) {
                        const connBestAskPrice = Math.min(...Array.from(conn.asks.keys()).map(p => parseFloat(p)));
                        if (Math.abs(connBestAskPrice - bestAsk) < 0.01) {
                            bestAskExchange = conn.config.name;
                        }
                    }
                }
            });
        }

        // Check if market is crossed (bid >= ask) - this is an arbitrage opportunity!
        const isCrossed = bestBid > 0 && bestAsk > 0 && bestBid >= bestAsk;

        if (isCrossed) {
            // 🚀 ARBITRAGE OPPORTUNITY! 💰
            const profit = bestBid - bestAsk; // Profit per unit
            const profitPercentage = (profit / bestBid) * 100;
            
            spreadContainerEl.classList.add('crossed-market');
            spreadValueEl.textContent = `🚀 +${profit.toFixed(getDecimalPlaces(bestAsk))} PROFIT!`;
            
            // Show which exchanges enable the arbitrage
            const arbInfo = bestBidExchange && bestAskExchange && bestBidExchange !== bestAskExchange 
                ? `💰 ${profitPercentage.toFixed(4)}% ARBI! (Buy: ${bestAskExchange} → Sell: ${bestBidExchange})`
                : `💰 ${profitPercentage.toFixed(4)}% ARBI!`;
            spreadPercentageEl.textContent = arbInfo;
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
    let connectedCount = 0;
    let connectingCount = 0;
    let errorCount = 0;
    let totalSelected = 0;
    
    SUPPORTED_EXCHANGES_ORDER_WITH_DEX.forEach(exchangeId => {
        const config = SUPPORTED_EXCHANGES_WITH_DEX[exchangeId];
        const conn = activeConnections.get(exchangeId);
        let pillStatus = 'disabled';
        
        if (selectedExchanges.has(exchangeId)) {
            totalSelected++;
            pillStatus = 'disconnected';
            
            if (conn) {
                if (conn.status === 'fetching_aux_data') {
                    connectingCount++;
                    pillStatus = 'connecting';
                } else if(conn.config.needsSnapshotFlag && conn.status === 'connected' && !conn.snapshotReceived && conn.config.id !== 'uniswap') {
                    connectingCount++;
                    pillStatus = 'connecting';
                } else {
                    switch (conn.status) {
                        case 'connected': 
                            connectedCount++; 
                            pillStatus = 'connected'; 
                            break;
                        case 'connecting': 
                            connectingCount++; 
                            pillStatus = 'connecting'; 
                            break;
                        case 'error': 
                            errorCount++; 
                            pillStatus = 'error'; 
                            break;
                        case 'closing': 
                        case 'disconnected': 
                            pillStatus = 'disconnected'; 
                            break;
                    }
                }
            } else { 
                connectingCount++; 
                pillStatus = 'connecting'; 
            }
        }
        
        // Update pill status
        const pill = document.querySelector(`.exchange-pill[data-exchange="${exchangeId}"]`) as HTMLDivElement;
        if (pill) {
            updatePillStatus(pill, pillStatus);
        }
    });
    
    // Generate clean summary with essential info
    let summaryHtml = `
        <div class="connection-stat">
            <span>Selected:</span>
            <span class="stat-value">${totalSelected}</span>
        </div>
    `;
    
    if (connectedCount > 0) {
        summaryHtml += `
            <div class="connection-stat connected">
                <span>🟢 Connected:</span>
                <span class="stat-value">${connectedCount}</span>
            </div>
        `;
    }
    
    if (connectingCount > 0) {
        summaryHtml += `
            <div class="connection-stat connecting">
                <span>🟡 Connecting:</span>
                <span class="stat-value">${connectingCount}</span>
            </div>
        `;
    }
    
    if (errorCount > 0) {
        summaryHtml += `
            <div class="connection-stat error">
                <span>🔴 Errors:</span>
                <span class="stat-value">${errorCount}</span>
            </div>
        `;
    }
    
    connectionStatusSummaryEl.innerHTML = summaryHtml;
    updateSidebarContent(); // Update sidebar as connection status might affect its content
}

// Helper function for updating pill status
function updatePillStatus(pill: HTMLDivElement, status: string) {
    const statusElement = pill.querySelector('.pill-status') as HTMLSpanElement;
    if (statusElement) {
        // Remove all status classes
        statusElement.classList.remove('connecting', 'connected', 'disconnected', 'error', 'disabled');
        // Add the new status class
        statusElement.classList.add(status);
        
        // Update status text
        switch (status) {
            case 'connecting':
                statusElement.textContent = 'CONN';
                break;
            case 'connected':
                statusElement.textContent = 'ON';
                break;
            case 'disconnected':
                statusElement.textContent = 'OFF';
                break;
            case 'error':
                statusElement.textContent = 'ERR';
                break;
            case 'disabled':
                statusElement.textContent = '';
                break;
        }
    }
}

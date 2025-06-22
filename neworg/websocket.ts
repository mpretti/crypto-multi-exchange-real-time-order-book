/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SUPPORTED_EXCHANGES } from './config';
import { activeConnections, selectedExchanges, selectedAsset, klineWebSocket, setKlineWebSocket, currentChartInterval } from './state';
import { applyDepthSlice, getDecimalPlaces } from './utils';
import { updateOverallConnectionStatus, updateSidebarContent, clearOrderBookDisplay } from './uiUpdates';
import { aggregateAndRenderAll } from './main'; // main.ts will export this
import type { ExchangeConnectionState } from './types';
import { updateChartForAssetAndInterval } from './charts';


export async function fetchAuxiliaryDataForExchange(exchangeId: string, formattedSymbol: string) {
    const conn = activeConnections.get(exchangeId);
    if (!conn || !conn.config) return;

    conn.auxDataFetched = false;
    conn.status = 'fetching_aux_data';
    updateOverallConnectionStatus();

    const { config } = conn;
    try {
        if (config.fetchFeeInfo) conn.feeInfo = await config.fetchFeeInfo(formattedSymbol);
        if (config.fetchFundingRateInfo) conn.fundingRateInfo = await config.fetchFundingRateInfo(formattedSymbol);
        if (config.fetchVolumeInfo) conn.volumeInfo = await config.fetchVolumeInfo(formattedSymbol);
    } catch (e) {
        console.error(`${config.name}: Error fetching auxiliary data for ${formattedSymbol}:`, e);
        conn.feeInfo = null; conn.fundingRateInfo = null; conn.volumeInfo = null;
    } finally {
        conn.auxDataFetched = true;
        if (conn.status === 'fetching_aux_data') { // Only revert if still in this state
            conn.status = conn.ws || config.id === 'uniswap_simulated' ? 'connected' : 'disconnected';
        }
        updateSidebarContent();
        updateOverallConnectionStatus();
    }
}


export function connectToExchange(exchangeId: string, asset: string) {
    const config = SUPPORTED_EXCHANGES[exchangeId];
    if (!config) {
        console.error(`Unsupported exchange: ${exchangeId}`);
        return;
    }

    let connectionState = activeConnections.get(exchangeId);
    if (connectionState?.ws && connectionState.status !== 'disconnected' && connectionState.status !== 'error') {
        if (connectionState.currentSymbol === asset && (connectionState.status === 'connected' || connectionState.status === 'fetching_aux_data')) {
            if (!connectionState.auxDataFetched && connectionState.status === 'connected') {
                 fetchAuxiliaryDataForExchange(exchangeId, config.formatSymbol(asset));
            }
            updateOverallConnectionStatus();
            return;
        }
    }
    
    // If a previous connection object exists, ensure it's properly closed before creating a new one
    if (connectionState?.ws) {
        console.log(`${config.name}: Closing existing WebSocket before reconnecting for ${asset}. Old symbol: ${connectionState.currentSymbol}`);
        connectionState.ws.onopen = null; connectionState.ws.onmessage = null;
        connectionState.ws.onerror = null; connectionState.ws.onclose = null; // Detach handlers
        if(connectionState.ws.readyState === WebSocket.OPEN || connectionState.ws.readyState === WebSocket.CONNECTING) {
            connectionState.ws.close();
        }
        if (connectionState.pingIntervalId) clearInterval(connectionState.pingIntervalId);
        // Do not remove from activeConnections yet, let the new one overwrite or handle in disconnect explicitly
    }


    if (exchangeId === 'uniswap_simulated') {
        console.error('❌ SIMULATION DATA BLOCKED: uniswap_simulated is not allowed');
        return;
    }

    const formattedSymbol = config.formatSymbol(asset);
    if (!formattedSymbol && config.id === 'kraken') {
        console.warn(`Kraken: Symbol ${asset} not found in mapping. Cannot connect.`);
        updateOverallConnectionStatus(); // Update status for Kraken to show error or disabled
        return;
    }
    const wsUrl = config.getWebSocketUrl(formattedSymbol);
    const newWs = new WebSocket(wsUrl);

    const newConnectionState: ExchangeConnectionState = {
        ws: newWs, status: 'connecting', bids: new Map(), asks: new Map(), config,
        retries: 0, snapshotReceived: config.needsSnapshotFlag ? false : undefined,
        currentSymbol: asset, auxDataFetched: undefined,
    };
    activeConnections.set(exchangeId, newConnectionState); // Set new state object in map
    updateOverallConnectionStatus();
    console.log(`${config.name}: Connecting to ${wsUrl} for ${asset}...`);

    newWs.onopen = () => {
        const currentConn = activeConnections.get(exchangeId);
        if (!currentConn || currentConn.ws !== newWs) {
             console.warn(`${config.name}: Stale WebSocket onopen for ${asset}. WS mismatch. Ignoring.`); return;
        }
        console.log(`${config.name}: Connected to ${asset}.`);
        currentConn.status = 'connected';
        currentConn.retries = 0;
        currentConn.snapshotReceived = config.needsSnapshotFlag ? false : undefined; // Reset snapshot flag
        updateOverallConnectionStatus();
        fetchAuxiliaryDataForExchange(exchangeId, formattedSymbol);

        if (config.getSubscribeMessage) {
            const subMsg = config.getSubscribeMessage(formattedSymbol);
            newWs.send(typeof subMsg === 'string' ? subMsg : JSON.stringify(subMsg));
            console.log(`${config.name}: Sent subscribe message:`, subMsg);
        }
        if (config.pingIntervalMs && config.pingPayload) {
            currentConn.pingIntervalId = setInterval(() => {
                const latestConn = activeConnections.get(exchangeId); // Get latest state for interval
                if (latestConn && latestConn.ws === newWs && newWs.readyState === WebSocket.OPEN) {
                    const pingMsg = config.pingPayload!();
                    newWs.send(typeof pingMsg === 'string' ? pingMsg : JSON.stringify(pingMsg));
                } else if (latestConn && latestConn.ws !== newWs) { // Interval from old WS firing
                     if (currentConn.pingIntervalId) clearInterval(currentConn.pingIntervalId);
                }
            }, config.pingIntervalMs);
        }
    };

    newWs.onmessage = (event) => {
        const currentConn = activeConnections.get(exchangeId);
        if (!currentConn || currentConn.ws !== newWs) {
            console.warn(`${config.name}: Stale WebSocket onmessage for ${asset}. WS mismatch. Ignoring.`); return;
        }
        try {
            const messageData = event.data;
            if (typeof messageData === 'string') {
                const lowerCaseMsg = messageData.toLowerCase();
                 if (lowerCaseMsg === 'ping' && (config.id === 'bitget' || config.id === 'okx')) {
                    if (newWs.readyState === WebSocket.OPEN) newWs.send('pong'); return;
                }
                if (lowerCaseMsg === 'pong' && config.id === 'bybit') return;

                let parsedJson;
                try { parsedJson = JSON.parse(messageData); } catch (e) {
                    console.error(`${config.name}: Error parsing string message to JSON:`, messageData, e); return;
                }
                 if (config.id === 'bybit' && parsedJson.op === 'pong') return;


                const update = config.parseMessage(
                    parsedJson, new Map(currentConn.bids), new Map(currentConn.asks), currentConn.snapshotReceived
                );
                if (update) {
                    currentConn.bids = applyDepthSlice(update.updatedBids, config.sliceDepth, true);
                    currentConn.asks = applyDepthSlice(update.updatedAsks, config.sliceDepth, false);
                    if (update.lastUpdateId) currentConn.lastUpdateId = update.lastUpdateId;
                    if (update.checksum && config.id === 'kraken') currentConn.krakenBookChecksum = update.checksum;
                    if (config.needsSnapshotFlag && update.isSnapshot) currentConn.snapshotReceived = true;

                    if (!config.needsSnapshotFlag || currentConn.snapshotReceived) aggregateAndRenderAll();
                }
            } else { console.warn(`${config.name}: Received non-string message type:`, typeof messageData, messageData); }
        } catch (error) { console.error(`${config.name}: Critical error processing message for ${asset}:`, error, event.data); }
    };

    newWs.onerror = (errorEvent) => {
        const currentConn = activeConnections.get(exchangeId);
        if (!currentConn || currentConn.ws !== newWs) {
            console.warn(`${config.name}: Stale WebSocket onerror for ${asset}. WS mismatch. Ignoring.`); return;
        }
        console.error(`${config.name}: WebSocket Error for ${asset}:`, errorEvent);
        currentConn.status = 'error';
        updateOverallConnectionStatus();
    };

    newWs.onclose = (event) => {
        const currentConn = activeConnections.get(exchangeId);
         // If the connection in activeConnections is not this one, this is a close event for an old WebSocket.
        if (!currentConn || currentConn.ws !== newWs) {
            console.warn(`${config.name}: Stale WebSocket onclose for ${asset}. WS mismatch or already replaced. Code: ${event.code}. Ignoring.`);
            // Clear any interval associated with this specific old ws instance if its ID was stored on it
            // This part is tricky if pingIntervalId is on the connectionState object that might have been replaced.
            // The ping interval itself checks `latestConn.ws === newWs`
            return;
        }

        console.log(`${config.name}: Disconnected from ${asset}. Code: ${event.code}, Reason: ${event.reason}`);
        if (currentConn.pingIntervalId) {
            clearInterval(currentConn.pingIntervalId); delete currentConn.pingIntervalId;
        }

        if (currentConn.status !== 'closing' && currentConn.status !== 'error') { // Avoid overwriting deliberate closing or error state
            currentConn.status = 'disconnected';
        }


        if (currentConn.status !== 'closing' && selectedExchanges.has(exchangeId)) { // Attempt reconnect if not deliberately closed
            const maxRetries = config.maxRetries ?? 5;
            if (currentConn.retries < maxRetries) {
                currentConn.retries++;
                const delay = Math.pow(2, currentConn.retries) * 1000;
                console.log(`${config.name}: Reconnecting to ${asset} in ${delay / 1000}s (attempt ${currentConn.retries}/${maxRetries})...`);
                setTimeout(() => {
                    // Check again if still selected and if this connection object is still the one in charge
                    const latestConnCheck = activeConnections.get(exchangeId);
                    if (selectedExchanges.has(exchangeId) && latestConnCheck === currentConn && currentConn.status !== 'closing') {
                         connectToExchange(exchangeId, asset);
                    } else {
                        console.log(`${config.name}: Reconnection aborted for ${asset}. Conditions changed (not selected, state replaced, or closing).`);
                    }
                }, delay);
            } else {
                console.error(`${config.name}: Max retries reached for ${asset}.`);
                currentConn.status = 'error';
            }
        }
        updateOverallConnectionStatus();
    };
}

export function disconnectFromExchange(exchangeId: string) {
    const connectionState = activeConnections.get(exchangeId);
    if (connectionState) {
        console.log(`${connectionState.config.name}: Initiating disconnect from ${connectionState.currentSymbol || 'N/A'}. Current status: ${connectionState.status}`);
        connectionState.status = 'closing'; // Mark as closing
        if (connectionState.pingIntervalId) { clearInterval(connectionState.pingIntervalId); delete connectionState.pingIntervalId; }

        if (connectionState.ws) {
            const config = connectionState.config; const currentWs = connectionState.ws;
            currentWs.onopen = null; currentWs.onmessage = null; currentWs.onerror = null; currentWs.onclose = null; // Detach all handlers

            if (config.getUnsubscribeMessage && currentWs.readyState === WebSocket.OPEN && connectionState.currentSymbol) {
                try {
                    const unsubMsg = config.getUnsubscribeMessage(config.formatSymbol(connectionState.currentSymbol));
                    currentWs.send(typeof unsubMsg === 'string' ? unsubMsg : JSON.stringify(unsubMsg));
                    console.log(`${config.name}: Sent unsubscribe for ${connectionState.currentSymbol}.`);
                } catch (e) { console.warn(`${config.name}: Error sending unsubscribe:`, e); }
            }
            if (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING) {
                currentWs.close();
            }
        }
        
        connectionState.bids.clear(); connectionState.asks.clear();
        connectionState.status = 'disconnected'; // Final status after closing procedures
        connectionState.auxDataFetched = undefined;
        connectionState.feeInfo = undefined; connectionState.fundingRateInfo = undefined; connectionState.volumeInfo = undefined;
        // Do not remove from activeConnections here, let connectToExchange overwrite or a dedicated cleanup manage it.
        // Or, if this is a permanent disconnect (e.g. user unchecks), then we can remove:
        // if (!selectedExchanges.has(exchangeId)) activeConnections.delete(exchangeId);

        aggregateAndRenderAll(); // Update UI to reflect cleared books
    }
    updateOverallConnectionStatus();
}

export function reconnectToAllSelectedExchanges(newAsset: string) {
    console.log(`Asset changed to ${newAsset}. Reconnecting selected exchanges and chart.`);
    
    // Disconnect all currently active or pending connections
    Array.from(activeConnections.keys()).forEach(id => {
        // We only fully disconnect if it's for an exchange that's currently selected.
        // If an exchange was in a retry loop but is no longer selected, disconnectFromExchange will handle it.
        // If an exchange is selected, disconnect it to prepare for new asset.
         if(selectedExchanges.has(id) || activeConnections.get(id)?.status !== 'disconnected') {
            disconnectFromExchange(id);
        }
    });

    if (klineWebSocket) {
        klineWebSocket.onopen = null; klineWebSocket.onmessage = null; klineWebSocket.onerror = null; klineWebSocket.onclose = null;
        klineWebSocket.close();
        setKlineWebSocket(null);
    }
    
    // A short delay to allow disconnections to process.
    setTimeout(() => {
        // Connect only to currently selected exchanges
        selectedExchanges.forEach(exchangeId => connectToExchange(exchangeId, newAsset));
        clearOrderBookDisplay(); // Clear old data
        updateOverallConnectionStatus();
        updateChartForAssetAndInterval(newAsset, currentChartInterval); // Update chart for new asset
    }, 500); // Delay to ensure websockets are closed
}

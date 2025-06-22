/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SUPPORTED_EXCHANGES_WITH_DEX } from './config';
import { activeConnections, selectedExchanges, klineWebSocket, setKlineWebSocket, currentChartInterval } from './state';
import { applyDepthSlice, getDecimalPlaces } from './utils';
import { updateOverallConnectionStatus, updateSidebarContent, clearOrderBookDisplay } from './uiUpdates';
import { aggregateAndRenderAll } from './index'; // index.tsx exports this
import type { ExchangeConnectionState } from './types';

// Enhanced tracking for status dashboard
export const exchangeStats = new Map();

function initializeExchangeStats(exchangeId: string) {
    if (!exchangeStats.has(exchangeId)) {
        exchangeStats.set(exchangeId, {
            connectionTime: null,
            lastMessageTime: null,
            lastMessageContent: null,
            messageCount: 0,
            errorCount: 0,
            retryCount: 0,
            latencyHistory: [],
            dataRateHistory: [],
            lastError: null,
            lastErrorTime: null,
            pingLatency: 0,
            reconnectAttempts: 0
        });
    }
}

function updateExchangeStats(exchangeId: string, update: any) {
    const stats = exchangeStats.get(exchangeId);
    if (stats) {
        Object.assign(stats, update);
        
        // Broadcast to status dashboard if available
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'exchange-stats-update',
                    exchangeId,
                    stats: { ...stats }
                }, '*');
            }
        } catch (e) {
            // Ignore if can't access parent
        }
    }
}
import { updateChartForAssetAndInterval } from './charts';

// Generate simulated Jupiter swap data
function generateJupiterSnapshot(asset: string) {
    let basePrice = 2000;
    const upperAsset = asset.toUpperCase();
    if (upperAsset.startsWith('BTC')) basePrice = 103000;
    else if (upperAsset.startsWith('ETH')) basePrice = 3800;
    else if (upperAsset.startsWith('SOL')) basePrice = 220;
    else if (upperAsset.startsWith('DOGE')) basePrice = 0.32;
    else if (upperAsset.startsWith('ADA')) basePrice = 1.05;
    else if (upperAsset.startsWith('LINK')) basePrice = 22;
    else if (upperAsset.startsWith('XRP')) basePrice = 2.15;

    const assetDecimals = getDecimalPlaces(basePrice);
    
    // Simulate Jupiter swap rates with wider spreads (typical for DEX aggregator)
    const bidSpread = 0.003; // 0.3% spread
    const askSpread = 0.003;
    
    return {
        type: 'jupiter_snapshot',
        bids: [
            [(basePrice * (1 - bidSpread)).toFixed(assetDecimals), (Math.random() * 2 + 0.5).toFixed(3)],
            [(basePrice * (1 - bidSpread * 1.5)).toFixed(assetDecimals), (Math.random() * 3 + 1).toFixed(3)],
            [(basePrice * (1 - bidSpread * 2)).toFixed(assetDecimals), (Math.random() * 5 + 2).toFixed(3)],
        ],
        asks: [
            [(basePrice * (1 + askSpread)).toFixed(assetDecimals), (Math.random() * 2 + 0.5).toFixed(3)],
            [(basePrice * (1 + askSpread * 1.5)).toFixed(assetDecimals), (Math.random() * 3 + 1).toFixed(3)],
            [(basePrice * (1 + askSpread * 2)).toFixed(assetDecimals), (Math.random() * 5 + 2).toFixed(3)],
        ]
    };
}

// Generate simulated MEXC order book data
function generateMexcSnapshot(asset: string) {
    let basePrice = 2000;
    const upperAsset = asset.toUpperCase();
    if (upperAsset.startsWith('BTC')) basePrice = 103000;
    else if (upperAsset.startsWith('ETH')) basePrice = 3800;
    else if (upperAsset.startsWith('SOL')) basePrice = 220;
    else if (upperAsset.startsWith('DOGE')) basePrice = 0.32;
    else if (upperAsset.startsWith('ADA')) basePrice = 1.05;
    else if (upperAsset.startsWith('LINK')) basePrice = 22;
    else if (upperAsset.startsWith('XRP')) basePrice = 2.15;

    const assetDecimals = getDecimalPlaces(basePrice);
    
    // Simulate MEXC order book with tighter spreads (typical for CEX)
    const bidSpread = 0.0015; // 0.15% spread
    const askSpread = 0.0015;
    
    return {
        type: 'mexc_snapshot',
        bids: [
            [(basePrice * (1 - bidSpread)).toFixed(assetDecimals), (Math.random() * 10 + 2).toFixed(3)],
            [(basePrice * (1 - bidSpread * 1.2)).toFixed(assetDecimals), (Math.random() * 15 + 5).toFixed(3)],
            [(basePrice * (1 - bidSpread * 1.5)).toFixed(assetDecimals), (Math.random() * 20 + 8).toFixed(3)],
            [(basePrice * (1 - bidSpread * 2)).toFixed(assetDecimals), (Math.random() * 25 + 10).toFixed(3)],
        ],
        asks: [
            [(basePrice * (1 + askSpread)).toFixed(assetDecimals), (Math.random() * 10 + 2).toFixed(3)],
            [(basePrice * (1 + askSpread * 1.2)).toFixed(assetDecimals), (Math.random() * 15 + 5).toFixed(3)],
            [(basePrice * (1 + askSpread * 1.5)).toFixed(assetDecimals), (Math.random() * 20 + 8).toFixed(3)],
            [(basePrice * (1 + askSpread * 2)).toFixed(assetDecimals), (Math.random() * 25 + 10).toFixed(3)],
        ]
    };
}

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
            conn.status = conn.ws || config.id === 'uniswap' ? 'connected' : 'disconnected';
        }
        updateSidebarContent();
        updateOverallConnectionStatus();
    }
}


export function connectToExchange(exchangeId: string, asset: string) {
    const config = SUPPORTED_EXCHANGES_WITH_DEX[exchangeId];
    if (!config) {
        console.error(`Unsupported exchange: ${exchangeId}`);
        return;
    }

    // Initialize stats tracking
    initializeExchangeStats(exchangeId);

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


    // Handle simulated exchanges (MEXC temporarily, Uniswap)
    if (exchangeId === 'uniswap' || (config as any).isSimulated) {
        console.log(`${config.name}: Simulating connection for ${asset}...`);
        const simConnectionState: ExchangeConnectionState = {
            ws: null, status: 'connecting', bids: new Map(), asks: new Map(), config,
            retries: 0, snapshotReceived: true, currentSymbol: asset, auxDataFetched: undefined,
        };
        activeConnections.set(exchangeId, simConnectionState);
        updateOverallConnectionStatus();

        setTimeout(() => {
            const currentSimConn = activeConnections.get(exchangeId);
            if (!currentSimConn || currentSimConn.currentSymbol !== asset || currentSimConn.status === 'closing') {
                console.warn(`${config.name}: Stale or closed simulated connection for ${asset}. Aborting data load.`);
                return;
            }

            let simulatedSnapshot;
            if (exchangeId === 'mexc') {
                // Use MEXC-specific simulation
                simulatedSnapshot = generateMexcSnapshot(asset);
                console.log(`${config.name}: Generated MEXC simulation data:`, simulatedSnapshot);
            } else if (exchangeId === 'uniswap') {
                // Use Uniswap simulation
                let basePrice = 2000;
                const upperAsset = asset.toUpperCase();
                if (upperAsset.startsWith('BTC')) basePrice = 60000;
                else if (upperAsset.startsWith('SOL')) basePrice = 150;
                else if (upperAsset.startsWith('DOGE')) basePrice = 0.15;
                else if (upperAsset.startsWith('ADA')) basePrice = 0.5;
                else if (upperAsset.startsWith('LINK')) basePrice = 15;
                else if (upperAsset.startsWith('XRP')) basePrice = 0.5;

                const assetDecimals = getDecimalPlaces(basePrice);
                simulatedSnapshot = {
                    type: 'snapshot',
                    bids: [
                        [(basePrice * 0.999).toFixed(assetDecimals), (Math.random() * 5 + 1).toFixed(3)],
                        [(basePrice * 0.998).toFixed(assetDecimals), (Math.random() * 10 + 2).toFixed(3)],
                    ],
                    asks: [
                        [(basePrice * 1.001).toFixed(assetDecimals), (Math.random() * 5 + 1).toFixed(3)],
                        [(basePrice * 1.002).toFixed(assetDecimals), (Math.random() * 10 + 2).toFixed(3)],
                    ]
                };
                console.log(`${config.name}: Generated Uniswap simulation data:`, simulatedSnapshot);
            }

            const update = config.parseMessage(simulatedSnapshot, new Map(), new Map(), false);
            console.log(`${config.name}: Parsed simulation update:`, update);
            
            if (update) {
                currentSimConn.bids = applyDepthSlice(update.updatedBids, config.sliceDepth, true);
                currentSimConn.asks = applyDepthSlice(update.updatedAsks, config.sliceDepth, false);
                currentSimConn.snapshotReceived = true;
                console.log(`${config.name}: Applied simulation data - Bids:`, currentSimConn.bids.size, 'Asks:', currentSimConn.asks.size);
            } else {
                console.error(`${config.name}: Failed to parse simulation data!`);
            }
            
            currentSimConn.status = 'connected';
            console.log(`${config.name}: Simulated connection established for ${asset}.`);
            
            // Update stats
            updateExchangeStats(exchangeId, {
                connectionTime: Date.now(),
                lastMessageTime: Date.now(),
                lastMessageContent: 'Simulated connection established'
            });
            
            fetchAuxiliaryDataForExchange(exchangeId, config.formatSymbol(asset));
            aggregateAndRenderAll();
        }, 500);
        return;
    }

    const formattedSymbol = config.formatSymbol(asset);
    if (!formattedSymbol && config.id === 'kraken') {
        console.warn(`Kraken: Symbol ${asset} not found in mapping. Cannot connect.`);
        updateOverallConnectionStatus(); // Update status for Kraken to show error or disabled
        return;
    }

    // Handle snapshot-only exchanges (like Jupiter)
    if ((config as any).isSnapshotOnly) {
        console.log(`${config.name}: Setting up snapshot-only connection for ${asset}...`);
        const snapshotConnectionState: ExchangeConnectionState = {
            ws: null, status: 'connecting', bids: new Map(), asks: new Map(), config,
            retries: 0, snapshotReceived: true, currentSymbol: asset, auxDataFetched: undefined,
        };
        activeConnections.set(exchangeId, snapshotConnectionState);
        updateOverallConnectionStatus();

        // Start periodic snapshots
        const snapshotInterval = (config as any).snapshotInterval || 30000; // Default 30 seconds
        const fetchSnapshot = async () => {
            const currentConn = activeConnections.get(exchangeId);
            if (!currentConn || currentConn.currentSymbol !== asset || !selectedExchanges.has(exchangeId)) {
                console.log(`${config.name}: Snapshot fetch cancelled - connection state changed`);
                return;
            }

            try {
                console.log(`${config.name}: Fetching snapshot for ${asset}...`);
                // Simulate Jupiter swap data - in real implementation, you'd call Jupiter API
                const simulatedData = generateJupiterSnapshot(asset);
                const update = config.parseMessage(simulatedData, new Map(), new Map(), false);
                
                if (update) {
                    currentConn.bids = applyDepthSlice(update.updatedBids, config.sliceDepth, true);
                    currentConn.asks = applyDepthSlice(update.updatedAsks, config.sliceDepth, false);
                    currentConn.snapshotReceived = true;
                    
                    // Update status to connected on first successful snapshot
                    if (currentConn.status === 'connecting') {
                        currentConn.status = 'connected';
                        console.log(`${config.name}: Snapshot connection established for ${asset}.`);
                        updateOverallConnectionStatus();
                        
                        // Fetch auxiliary data after successful connection
                        setTimeout(() => {
                            fetchAuxiliaryDataForExchange(exchangeId, formattedSymbol);
                        }, 100);
                    }
                    
                    // Trigger UI update
                    aggregateAndRenderAll();
                } else {
                    console.warn(`${config.name}: Failed to parse snapshot data for ${asset}`);
                }
            } catch (error) {
                console.error(`${config.name}: Error fetching snapshot for ${asset}:`, error);
                currentConn.status = 'error';
                updateOverallConnectionStatus();
            }
        };

        // Initial snapshot with slight delay to ensure UI is ready
        setTimeout(() => {
            fetchSnapshot();
        }, 500);
        
        // Set up periodic snapshots
        const intervalId = setInterval(() => {
            // Check if still selected before fetching
            if (selectedExchanges.has(exchangeId)) {
                fetchSnapshot();
            } else {
                console.log(`${config.name}: Clearing interval - exchange no longer selected`);
                clearInterval(intervalId);
            }
        }, snapshotInterval);
        
        snapshotConnectionState.pingIntervalId = intervalId; // Reuse this field for cleanup
        
        return;
    }

    const wsUrl = config.getWebSocketUrl(formattedSymbol);
    if (!wsUrl) {
        console.error(`${config.name}: No WebSocket URL provided for ${asset}`);
        return;
    }
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

    newWs.onmessage = async (event) => {
        const currentConn = activeConnections.get(exchangeId);
        if (!currentConn || currentConn.ws !== newWs) {
            console.warn(`${config.name}: Stale WebSocket onmessage for ${asset}. WS mismatch. Ignoring.`); return;
        }
        try {
            const messageData = event.data;
            let parsedJson;
            
            if (typeof messageData === 'string') {
                const lowerCaseMsg = messageData.toLowerCase();
                 if (lowerCaseMsg === 'ping' && (config.id === 'bitget' || config.id === 'okx')) {
                    if (newWs.readyState === WebSocket.OPEN) newWs.send('pong'); return;
                }
                if (lowerCaseMsg === 'pong' && (config.id === 'bybit' || config.id === 'okx')) return;

                try { parsedJson = JSON.parse(messageData); } catch (e) {
                    console.error(`${config.name}: Error parsing string message to JSON:`, messageData, e); return;
                }
            } else if (messageData instanceof Blob) {
                // Handle Blob data (e.g., compressed data from Bitrue)
                try {
                    const arrayBuffer = await messageData.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);
                    
                    // Check for gzip magic number (1f 8b)
                    if (uint8Array[0] === 0x1f && uint8Array[1] === 0x8b) {
                        // It's gzip compressed, decompress it
                        const decompressedStream = new DecompressionStream('gzip');
                        const decompressedResponse = new Response(new ReadableStream({
                            start(controller) {
                                controller.enqueue(uint8Array);
                                controller.close();
                            }
                        }).pipeThrough(decompressedStream));
                        const textData = await decompressedResponse.text();
                        parsedJson = JSON.parse(textData);
                    } else {
                        // Not compressed, try as text
                        const textData = await messageData.text();
                        parsedJson = JSON.parse(textData);
                    }
                } catch (e) {
                    console.error(`${config.name}: Error parsing Blob message:`, e); return;
                }
            } else if (typeof messageData === 'object' && messageData !== null) {
                // Handle cases where WebSocket already provides parsed objects
                parsedJson = messageData;
            } else {
                console.warn(`${config.name}: Received unsupported message type:`, typeof messageData, messageData);
                return;
            }
            
            if (config.id === 'bybit' && parsedJson.op === 'pong') return;
            
            // Handle Bitrue ping/pong (JSON format)
            if (config.id === 'bitrue' && parsedJson.ping) {
                if (newWs.readyState === WebSocket.OPEN) {
                    newWs.send(JSON.stringify({ pong: parsedJson.ping }));
                }
                return;
            }

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

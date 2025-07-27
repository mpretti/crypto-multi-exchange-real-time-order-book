/**
 * 🚀 C3PO Integration for Browser
 * ==============================
 * 
 * JavaScript client for accessing C3PO AI trading models from the browser.
 * This bridges the gap between the Python AI service and the browser-based trading system.
 */

class C3POBridge {
    constructor(serviceUrl = 'http://localhost:8002') {
        this.serviceUrl = serviceUrl;
        this.isConnected = false;
        this.lastPredictions = new Map();
        this.predictionCache = new Map();
        this.cacheTimeout = 30000; // 30 seconds cache
        
        // Initialize connection
        this.checkConnection();
    }

    /**
     * Check if C3PO service is available
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.serviceUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isConnected = data.status === 'healthy';
                if (this.isConnected) {
                    console.log('✅ C3PO AI service connected');
                    this.logMessage('🤖 C3PO AI models online and ready');
                }
            }
        } catch (error) {
            this.isConnected = false;
            console.warn('⚠️ C3PO service not available:', error.message);
        }
        
        return this.isConnected;
    }

    /**
     * Get AI prediction for market data
     */
    async getPrediction(marketData, symbol = 'BTCUSDT', modelType = 'ensemble') {
        if (!this.isConnected) {
            await this.checkConnection();
            if (!this.isConnected) {
                return null;
            }
        }

        // Check cache first
        const cacheKey = `${symbol}_${modelType}`;
        const cached = this.predictionCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.prediction;
        }

        try {
            // Convert market data to required format
            const formattedData = this.formatMarketData(marketData);
            
            if (formattedData.length < 10) {
                console.warn('⚠️ Insufficient market data for prediction');
                return null;
            }

            const requestData = {
                market_data: formattedData,
                symbol: symbol,
                timeframe: '1m',
                model_type: modelType,
                prediction_horizon: '1h'
            };

            const response = await fetch(`${this.serviceUrl}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData),
                timeout: 30000
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    const prediction = {
                        direction: data.prediction.direction || 'NEUTRAL',
                        confidence: data.prediction.confidence || 0.5,
                        modelType: data.model_type,
                        symbol: data.symbol,
                        timestamp: Date.now(),
                        individualPredictions: data.prediction.individual_predictions || {}
                    };

                    // Cache the prediction
                    this.predictionCache.set(cacheKey, {
                        prediction: prediction,
                        timestamp: Date.now()
                    });

                    // Store in last predictions
                    this.lastPredictions.set(symbol, prediction);

                    this.logPrediction(prediction);
                    return prediction;
                }
            }
        } catch (error) {
            console.error('❌ C3PO prediction error:', error);
            this.isConnected = false;
        }

        return null;
    }

    /**
     * Format market data for C3PO API
     */
    formatMarketData(marketData) {
        if (!Array.isArray(marketData)) {
            return [];
        }

        return marketData.map(candle => ({
            open: parseFloat(candle.open || candle.o || 0),
            high: parseFloat(candle.high || candle.h || 0),
            low: parseFloat(candle.low || candle.l || 0),
            close: parseFloat(candle.close || candle.c || 0),
            volume: parseFloat(candle.volume || candle.v || 0)
        })).filter(candle => 
            candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0
        );
    }

    /**
     * Get ensemble prediction for multiple models
     */
    async getEnsemblePrediction(marketData, symbol = 'BTCUSDT') {
        const models = ['autoencoder', 'vae', 'transformer'];
        const predictions = [];

        for (const model of models) {
            const prediction = await this.getPrediction(marketData, symbol, model);
            if (prediction) {
                predictions.push(prediction);
            }
        }

        if (predictions.length === 0) {
            return null;
        }

        // Calculate ensemble prediction
        const directions = predictions.map(p => p.direction);
        const confidences = predictions.map(p => p.confidence);
        
        // Vote-based direction
        const upVotes = directions.filter(d => d === 'UP').length;
        const downVotes = directions.filter(d => d === 'DOWN').length;
        const neutralVotes = directions.filter(d => d === 'NEUTRAL').length;
        
        let finalDirection = 'NEUTRAL';
        if (upVotes > downVotes && upVotes > neutralVotes) {
            finalDirection = 'UP';
        } else if (downVotes > upVotes && downVotes > neutralVotes) {
            finalDirection = 'DOWN';
        }

        // Average confidence
        const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

        return {
            direction: finalDirection,
            confidence: avgConfidence,
            modelType: 'ensemble',
            symbol: symbol,
            timestamp: Date.now(),
            individualPredictions: predictions.reduce((acc, pred) => {
                acc[pred.modelType] = {
                    direction: pred.direction,
                    confidence: pred.confidence
                };
                return acc;
            }, {})
        };
    }

    /**
     * Get prediction signal strength
     */
    getSignalStrength(prediction) {
        if (!prediction) return 0;
        
        const baseStrength = prediction.confidence;
        let multiplier = 1;
        
        // Boost for non-neutral predictions
        if (prediction.direction !== 'NEUTRAL') {
            multiplier *= 1.2;
        }
        
        // Boost for ensemble models
        if (prediction.modelType === 'ensemble') {
            multiplier *= 1.1;
        }
        
        return Math.min(baseStrength * multiplier, 1.0);
    }

    /**
     * Check if prediction suggests buying
     */
    shouldBuy(prediction, minConfidence = 0.7) {
        return prediction && 
               prediction.direction === 'UP' && 
               prediction.confidence >= minConfidence;
    }

    /**
     * Check if prediction suggests selling
     */
    shouldSell(prediction, minConfidence = 0.7) {
        return prediction && 
               prediction.direction === 'DOWN' && 
               prediction.confidence >= minConfidence;
    }

    /**
     * Log prediction to UI
     */
    logPrediction(prediction) {
        const emoji = prediction.direction === 'UP' ? '🟢' : 
                     prediction.direction === 'DOWN' ? '🔴' : '🟡';
        
        const confidenceBar = '█'.repeat(Math.floor(prediction.confidence * 10)) + 
                             '░'.repeat(10 - Math.floor(prediction.confidence * 10));
        
        const message = `${emoji} ${prediction.symbol}: ${prediction.direction} | ` +
                       `Confidence: ${(prediction.confidence * 100).toFixed(1)}% [${confidenceBar}] | ` +
                       `Model: ${prediction.modelType}`;
        
        this.logMessage(message);
        
        // Show individual predictions for ensemble
        if (prediction.individualPredictions && Object.keys(prediction.individualPredictions).length > 0) {
            Object.entries(prediction.individualPredictions).forEach(([model, pred]) => {
                const subEmoji = pred.direction === 'UP' ? '🟢' : 
                               pred.direction === 'DOWN' ? '🔴' : '🟡';
                this.logMessage(`   └─ ${model}: ${subEmoji} ${pred.direction} (${(pred.confidence * 100).toFixed(1)}%)`);
            });
        }
    }

    /**
     * Log message to UI
     */
    logMessage(message) {
        // Try to log to existing logger
        if (window.logger && typeof window.logger.log === 'function') {
            window.logger.log(message, 'ai');
        } else {
            console.log(`[C3PO] ${message}`);
        }

        // Also try to update UI elements
        this.updateUIElements(message);
    }

    /**
     * Update UI elements with prediction info
     */
    updateUIElements(message) {
        // Update AI status indicator
        const aiStatus = document.getElementById('ai-status');
        if (aiStatus) {
            aiStatus.textContent = this.isConnected ? '🤖 AI Online' : '🔴 AI Offline';
            aiStatus.className = this.isConnected ? 'ai-online' : 'ai-offline';
        }

        // Update latest prediction display
        const predictionDisplay = document.getElementById('latest-prediction');
        if (predictionDisplay) {
            predictionDisplay.textContent = message;
        }
    }

    /**
     * Get status for UI display
     */
    getStatus() {
        return {
            connected: this.isConnected,
            lastPredictions: Object.fromEntries(this.lastPredictions),
            cacheSize: this.predictionCache.size,
            serviceUrl: this.serviceUrl
        };
    }
}

// Create global C3PO bridge instance
window.c3poBridge = new C3POBridge();

// Add CSS for AI status indicators
const aiStatusCSS = `
    .ai-online {
        color: #00ff00;
        font-weight: bold;
    }
    .ai-offline {
        color: #ff6b6b;
        font-weight: bold;
    }
    #latest-prediction {
        font-family: monospace;
        font-size: 12px;
        background: rgba(0,0,0,0.8);
        color: #fff;
        padding: 5px;
        border-radius: 3px;
        margin: 5px 0;
    }
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = aiStatusCSS;
document.head.appendChild(styleSheet);

console.log('🚀 C3PO Bridge initialized - AI trading predictions available!'); 
/**
 * 🤖 AI-Enhanced Trading Agent with C3PO Integration
 * =================================================
 * 
 * Enhanced trading agent that combines traditional strategies with C3PO AI predictions
 * for improved decision making and performance.
 */

class AIEnhancedTradingAgent extends TradingAgent {
    constructor(id, name, template, sessionId) {
        super(id, name, template, sessionId);
        
        // AI-specific configuration
        this.aiConfig = {
            useC3PO: true,
            minC3POConfidence: 0.7,
            c3poWeight: 0.6,  // Weight C3PO predictions vs strategy
            predictionHistory: [],
            adaptiveLearning: true,
            performanceTracking: true,
            riskAdjustment: true
        };
        
        // Extended metrics for AI performance
        this.aiMetrics = {
            c3poAccuracy: 0,
            c3poPredictions: 0,
            c3poSuccessful: 0,
            strategyCombinations: 0,
            adaptiveLearningScore: 0.5,
            confidenceCalibration: 0.5
        };
        
        // Market data buffer for AI predictions
        this.marketDataBuffer = [];
        this.maxBufferSize = 100;
        
        console.log(`🚀 AI-Enhanced Agent ${this.name} created with C3PO integration`);
    }

    /**
     * Enhanced trading evaluation with AI predictions
     */
    async evaluateTrading(symbol, price, exchange) {
        if (this.status !== 'active') return;
        
        // Update market data buffer
        this.updateMarketDataBuffer(symbol, price, exchange);
        
        try {
            // Get AI-enhanced decision
            const decision = await this.getAIDecision(symbol, price, exchange);
            
            if (decision && decision.action !== 'hold') {
                await this.executeAIDecision(decision, symbol, price, exchange);
            }
            
        } catch (error) {
            console.error(`❌ AI decision error for agent ${this.name}:`, error);
            // Fallback to strategy-only decision
            super.evaluateTrading(symbol, price, exchange);
        }
    }

    /**
     * Get AI-enhanced trading decision
     */
    async getAIDecision(symbol, price, exchange) {
        if (this.marketDataBuffer.length < 20) {
            return null; // Need sufficient data
        }

        let c3poPrediction = null;
        let strategyDecision = null;

        // Get C3PO prediction if enabled and available
        if (this.aiConfig.useC3PO && window.c3poBridge && window.c3poBridge.isConnected) {
            try {
                c3poPrediction = await window.c3poBridge.getPrediction(
                    this.formatMarketDataForC3PO(),
                    symbol,
                    'ensemble'
                );
                
                if (c3poPrediction) {
                    this.aiMetrics.c3poPredictions++;
                    this.logAIPrediction(c3poPrediction, symbol);
                }
            } catch (error) {
                console.warn(`⚠️ C3PO prediction failed for ${this.name}:`, error);
            }
        }

        // Get strategy decision
        strategyDecision = this.getStrategyDecision(symbol, price, exchange);

        // Combine decisions using AI logic
        const combinedDecision = this.combineDecisions(strategyDecision, c3poPrediction, symbol, price);

        // Apply adaptive learning adjustments
        if (this.aiConfig.adaptiveLearning) {
            this.applyAdaptiveLearning(combinedDecision, symbol, price);
        }

        // Store prediction for later validation
        if (combinedDecision) {
            this.storePredictionForValidation(combinedDecision, symbol, price);
        }

        return combinedDecision;
    }

    /**
     * Get traditional strategy decision
     */
    getStrategyDecision(symbol, price, exchange) {
        if (!this.strategy) return null;

        const portfolio = this.paperTrading.getPortfolio();
        
        let action = 'hold';
        let confidence = 0.5;
        let reason = 'Strategy evaluation';

        try {
            if (this.strategy.shouldBuy(symbol, price, portfolio)) {
                action = 'buy';
                confidence = 0.7;
                reason = 'Strategy buy signal';
            } else if (this.strategy.shouldSell(symbol, price, portfolio)) {
                action = 'sell';
                confidence = 0.7;
                reason = 'Strategy sell signal';
            }
        } catch (error) {
            console.error(`Strategy decision error for ${this.name}:`, error);
        }

        return {
            action,
            confidence,
            reason,
            source: 'strategy',
            positionSize: this.strategy ? this.strategy.getPositionSize(portfolio.cash) : 1000
        };
    }

    /**
     * Combine strategy and C3PO decisions using AI logic
     */
    combineDecisions(strategyDecision, c3poPrediction, symbol, price) {
        if (!strategyDecision) return null;

        // If no C3PO prediction or low confidence, use strategy only
        if (!c3poPrediction || c3poPrediction.confidence < this.aiConfig.minC3POConfidence) {
            return {
                ...strategyDecision,
                source: 'strategy-only',
                c3poUsed: false,
                finalConfidence: strategyDecision.confidence
            };
        }

        // Convert C3PO prediction to action
        let c3poAction = 'hold';
        if (window.c3poBridge.shouldBuy(c3poPrediction, this.aiConfig.minC3POConfidence)) {
            c3poAction = 'buy';
        } else if (window.c3poBridge.shouldSell(c3poPrediction, this.aiConfig.minC3POConfidence)) {
            c3poAction = 'sell';
        }

        // Combine using weighted approach
        const c3poWeight = this.aiConfig.c3poWeight;
        const strategyWeight = 1 - c3poWeight;
        
        let finalAction = strategyDecision.action;
        let finalConfidence = strategyDecision.confidence;

        if (c3poAction === strategyDecision.action) {
            // Both agree - boost confidence
            finalConfidence = Math.min(finalConfidence + 0.2, 1.0);
        } else if (c3poAction !== 'hold') {
            // Disagreement - use weighted decision
            if (c3poPrediction.confidence > finalConfidence) {
                finalAction = c3poAction;
                finalConfidence = c3poPrediction.confidence * c3poWeight + finalConfidence * strategyWeight;
            }
        }

        // Apply risk adjustment
        if (this.aiConfig.riskAdjustment) {
            finalConfidence = this.adjustForRisk(finalConfidence, symbol, price);
        }

        this.aiMetrics.strategyCombinations++;

        return {
            action: finalAction,
            confidence: finalConfidence,
            reason: `AI Combined: Strategy(${strategyDecision.action}) + C3PO(${c3poAction}, ${(c3poPrediction.confidence * 100).toFixed(1)}%)`,
            source: 'ai-combined',
            c3poUsed: true,
            c3poPrediction: c3poPrediction,
            strategyDecision: strategyDecision,
            positionSize: this.calculateAIPositionSize(finalConfidence, strategyDecision.positionSize),
            finalConfidence: finalConfidence
        };
    }

    /**
     * Execute AI-enhanced trading decision
     */
    async executeAIDecision(decision, symbol, price, exchange) {
        if (decision.action === 'buy') {
            const quantity = decision.positionSize / price;
            
            if (this.paperTrading.buyMarket(symbol, quantity, exchange)) {
                console.log(`🤖 ${this.name}: AI BUY ${quantity.toFixed(6)} ${symbol} at $${price} (${decision.reason})`);
                this.logAITrade('buy', symbol, quantity, price, decision);
            }
            
        } else if (decision.action === 'sell') {
            const position = this.paperTrading.portfolio.positions.get(symbol);
            
            if (position && position.quantity > 0) {
                // Calculate sell quantity based on confidence
                const sellRatio = Math.min(decision.confidence, 0.8); // Max 80% position
                const sellQuantity = position.quantity * sellRatio;
                
                if (this.paperTrading.sellMarket(symbol, sellQuantity, exchange)) {
                    console.log(`🤖 ${this.name}: AI SELL ${sellQuantity.toFixed(6)} ${symbol} at $${price} (${decision.reason})`);
                    this.logAITrade('sell', symbol, sellQuantity, price, decision);
                }
            }
        }
    }

    /**
     * Calculate AI-adjusted position size
     */
    calculateAIPositionSize(confidence, baseSize) {
        // Adjust position size based on AI confidence
        const confidenceMultiplier = 0.5 + (confidence * 0.5); // 0.5x to 1.0x
        const riskAdjustment = Math.min(this.config.riskLevel / 5, 1.0); // Risk level adjustment
        
        return baseSize * confidenceMultiplier * riskAdjustment;
    }

    /**
     * Apply risk adjustment to confidence
     */
    adjustForRisk(confidence, symbol, price) {
        // Adjust based on portfolio risk
        const portfolio = this.paperTrading.getPortfolioSummary();
        const drawdown = Math.abs(portfolio.totalPnLPercent);
        
        if (drawdown > this.config.maxDrawdown * 0.8) {
            // Near max drawdown - reduce confidence
            confidence *= 0.7;
        }
        
        // Adjust based on recent performance
        if (this.aiMetrics.c3poAccuracy < 0.6) {
            // Poor AI accuracy - reduce C3PO weight
            confidence *= 0.8;
        }
        
        return Math.max(confidence, 0.1);
    }

    /**
     * Format market data for C3PO API
     */
    formatMarketDataForC3PO() {
        return this.marketDataBuffer.slice(-50).map(data => ({
            open: data.price * 0.999,  // Simulate OHLC from price
            high: data.price * 1.001,
            low: data.price * 0.998,
            close: data.price,
            volume: 1000 + Math.random() * 2000 // Simulated volume
        }));
    }

    /**
     * Update market data buffer
     */
    updateMarketDataBuffer(symbol, price, exchange) {
        this.marketDataBuffer.push({
            timestamp: Date.now(),
            symbol,
            price,
            exchange
        });

        // Keep buffer size manageable
        if (this.marketDataBuffer.length > this.maxBufferSize) {
            this.marketDataBuffer.shift();
        }
    }

    /**
     * Store prediction for later validation
     */
    storePredictionForValidation(decision, symbol, price) {
        this.aiConfig.predictionHistory.push({
            timestamp: Date.now(),
            symbol,
            price,
            decision,
            validated: false
        });

        // Keep history manageable
        if (this.aiConfig.predictionHistory.length > 100) {
            this.aiConfig.predictionHistory.shift();
        }
    }

    /**
     * Apply adaptive learning based on performance
     */
    applyAdaptiveLearning(decision, symbol, price) {
        // Validate previous predictions
        this.validatePredictions(symbol, price);
        
        // Adjust AI weights based on performance
        if (this.aiMetrics.c3poPredictions > 10) {
            this.aiMetrics.c3poAccuracy = this.aiMetrics.c3poSuccessful / this.aiMetrics.c3poPredictions;
            
            // Adjust C3PO weight based on accuracy
            if (this.aiMetrics.c3poAccuracy > 0.7) {
                this.aiConfig.c3poWeight = Math.min(this.aiConfig.c3poWeight + 0.05, 0.8);
            } else if (this.aiMetrics.c3poAccuracy < 0.5) {
                this.aiConfig.c3poWeight = Math.max(this.aiConfig.c3poWeight - 0.05, 0.3);
            }
        }
    }

    /**
     * Validate previous predictions
     */
    validatePredictions(currentSymbol, currentPrice) {
        const now = Date.now();
        const validationWindow = 60000; // 1 minute

        this.aiConfig.predictionHistory.forEach(pred => {
            if (!pred.validated && pred.symbol === currentSymbol && 
                now - pred.timestamp > validationWindow) {
                
                const priceChange = (currentPrice - pred.price) / pred.price;
                let correct = false;

                if (pred.decision.action === 'buy' && priceChange > 0.001) {
                    correct = true;
                } else if (pred.decision.action === 'sell' && priceChange < -0.001) {
                    correct = true;
                }

                if (correct && pred.decision.c3poUsed) {
                    this.aiMetrics.c3poSuccessful++;
                }

                pred.validated = true;
            }
        });
    }

    /**
     * Log AI prediction
     */
    logAIPrediction(prediction, symbol) {
        if (window.logger) {
            const emoji = prediction.direction === 'UP' ? '🟢' : 
                         prediction.direction === 'DOWN' ? '🔴' : '🟡';
            
            const message = `${emoji} ${symbol}: ${prediction.direction} | ` +
                           `Confidence: ${(prediction.confidence * 100).toFixed(1)}% | ` +
                           `Agent: ${this.name}`;
            
            window.logger.log(message, 'ai');
        }
    }

    /**
     * Log AI trade
     */
    logAITrade(action, symbol, quantity, price, decision) {
        if (window.logger) {
            const emoji = action === 'buy' ? '🟢' : '🔴';
            const message = `${emoji} ${this.name}: ${action.toUpperCase()} ${quantity.toFixed(6)} ${symbol} ` +
                           `at $${price} | Confidence: ${(decision.finalConfidence * 100).toFixed(1)}%`;
            
            window.logger.log(message, 'ai');
        }
    }

    /**
     * Get enhanced status including AI metrics
     */
    getStatus() {
        const baseStatus = super.getStatus();
        
        return {
            ...baseStatus,
            aiEnabled: true,
            aiConfig: this.aiConfig,
            aiMetrics: this.aiMetrics,
            c3poConnected: window.c3poBridge ? window.c3poBridge.isConnected : false,
            marketDataBufferSize: this.marketDataBuffer.length,
            predictionHistorySize: this.aiConfig.predictionHistory.length
        };
    }

    /**
     * Update AI configuration
     */
    updateAIConfig(newConfig) {
        this.aiConfig = { ...this.aiConfig, ...newConfig };
        console.log(`🤖 AI config updated for agent ${this.name}`);
    }
}

// Export for use in other modules
window.AIEnhancedTradingAgent = AIEnhancedTradingAgent;

console.log('🚀 AI-Enhanced Trading Agent with C3PO integration loaded!'); 
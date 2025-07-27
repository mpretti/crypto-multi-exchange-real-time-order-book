/**
 * Multi-Exchange Chart Overlay Fix
 * Fixes the issue where multiple exchange charts overlap instead of displaying properly
 */

// Add this method to the ChartsDashboard class to replace the existing loadHistoricalData method

private async loadHistoricalDataFixed(chartInstance: ChartInstance) {
    console.log(`Loading historical data for chart ${chartInstance.chartId}`);
    
    // List of exchanges that actually work reliably
    const workingExchanges = ['binance', 'bybit', 'okx'];
    
    if (this.overlayMode) {
        // Load data for all selected overlay exchanges, but only working ones
        const exchangesToUse = Array.from(this.selectedOverlayExchanges).filter(ex => workingExchanges.includes(ex));
        console.log(`🔄 Overlay mode: Loading data for exchanges: ${exchangesToUse.join(', ')}`);
        
        // Track which series have been created successfully
        let seriesCreated = 0;
        
        for (const exchangeId of exchangesToUse) {
            const exchangeConfig = this.exchanges[exchangeId];
            if (exchangeConfig) {
                const symbol = exchangeConfig.formatSymbol(this.selectedAsset);
                console.log(`Fetching data for ${exchangeId}: ${symbol} ${chartInstance.timeframe}`);
                
                try {
                    const historicalData = await this.fetchHistoricalData(symbol, chartInstance.timeframe, exchangeId);
                    
                    if (historicalData && historicalData.length > 0 && this.validateKlineData(historicalData)) {
                        // Create different series types based on the number of exchanges
                        if (exchangesToUse.length === 1) {
                            // Single exchange - use candlestick
                            console.log(`🕯️ Creating candlestick series for single exchange ${exchangeId}`);
                            const series = chartInstance.chart.addCandlestickSeries({
                                upColor: exchangeConfig.color,
                                downColor: this.darkenColor(exchangeConfig.color),
                                borderDownColor: this.darkenColor(exchangeConfig.color),
                                borderUpColor: exchangeConfig.color,
                                wickDownColor: this.darkenColor(exchangeConfig.color),
                                wickUpColor: exchangeConfig.color,
                                priceLineVisible: true,
                                lastValueVisible: true,
                                title: exchangeConfig.name,
                            });
                            series.setData(historicalData);
                            chartInstance.series.set(exchangeId, series);
                        } else {
                            // Multiple exchanges - use line series for better visibility
                            console.log(`📈 Creating line series for multi-exchange overlay ${exchangeId}`);
                            
                            // Convert candlestick data to line data (using close prices)
                            const lineData = historicalData.map(candle => ({
                                time: candle.time,
                                value: candle.close
                            }));
                            
                            // Enhanced line series with better visibility
                            const series = chartInstance.chart.addLineSeries({
                                color: exchangeConfig.color,
                                lineWidth: 3,
                                lineStyle: 0, // Solid line
                                priceLineVisible: true,
                                lastValueVisible: true,
                                title: exchangeConfig.name,
                                priceLineColor: exchangeConfig.color,
                                priceLineWidth: 2,
                                priceLineStyle: 1, // Dotted line for price
                                crosshairMarkerVisible: true,
                                crosshairMarkerRadius: 6,
                                crosshairMarkerBorderColor: exchangeConfig.color,
                                crosshairMarkerBackgroundColor: exchangeConfig.color,
                                crosshairMarkerBorderWidth: 2,
                            });
                            
                            series.setData(lineData);
                            chartInstance.series.set(exchangeId, series);
                            
                            // Add a subtle area series for additional visual distinction
                            if (seriesCreated === 0) {
                                // Only add area for the first exchange to avoid too much visual clutter
                                const areaSeries = chartInstance.chart.addAreaSeries({
                                    topColor: exchangeConfig.color + '20', // 20% opacity
                                    bottomColor: exchangeConfig.color + '05', // 5% opacity
                                    lineColor: exchangeConfig.color,
                                    lineWidth: 1,
                                    priceLineVisible: false,
                                    lastValueVisible: false,
                                    crosshairMarkerVisible: false,
                                });
                                areaSeries.setData(lineData);
                                chartInstance.series.set(`${exchangeId}_area`, areaSeries);
                            }
                        }
                        
                        seriesCreated++;
                        console.log(`✅ Series created for ${exchangeId} (${seriesCreated}/${exchangesToUse.length})`);
                        
                        // Store the last candle for stats
                        if (historicalData.length > 0) {
                            chartInstance.lastCandles.set(exchangeId, historicalData[historicalData.length - 1]);
                            chartInstance.openPrices.set(exchangeId, historicalData[0].open);
                            
                            // Update historical prices for technical analysis (use first exchange)
                            if (seriesCreated === 1) {
                                chartInstance.historicalPrices = historicalData.map(candle => candle.close);
                                this.updateTechnicalAnalysis(chartInstance);
                            }
                        }
                        
                        console.log(`✅ Added ${historicalData.length} candles for ${exchangeId}`);
                    } else {
                        console.warn(`❌ Invalid or empty data for ${exchangeId}, skipping this exchange`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to load data for ${exchangeId}:`, error);
                    console.log(`🚫 Skipping ${exchangeId} - no fallback data allowed`);
                }
            }
        }
        
        // Add legend for multi-exchange view
        if (seriesCreated > 1) {
            this.addMultiExchangeLegend(chartInstance, exchangesToUse);
        }
        
        // Fit content after all overlay data is loaded
        if (chartInstance.series.size > 0) {
            chartInstance.chart.timeScale().fitContent();
            console.log(`📊 Fitted chart content for overlay mode with ${chartInstance.series.size} series`);
        }
    } else {
        // Single exchange mode - use candlestick as before
        if (!workingExchanges.includes(this.selectedExchange)) {
            console.warn(`Exchange ${this.selectedExchange} is not reliable, switching to Binance`);
            this.selectedExchange = 'binance';
            if (this.exchangeSelect) {
                this.exchangeSelect.value = 'binance';
            }
        }
        
        const exchangeConfig = this.exchanges[this.selectedExchange];
        if (exchangeConfig) {
            const symbol = exchangeConfig.formatSymbol(this.selectedAsset);
            console.log(`Fetching data for ${this.selectedExchange}: ${symbol} ${chartInstance.timeframe}`);
            
            try {
                const historicalData = await this.fetchHistoricalData(symbol, chartInstance.timeframe, this.selectedExchange);
                
                if (historicalData && historicalData.length > 0 && this.validateKlineData(historicalData)) {
                    console.log(`🕯️ Creating candlestick series for ${this.selectedExchange}`);
                    const series = chartInstance.chart.addCandlestickSeries({
                        upColor: '#26de81',
                        downColor: '#ff4757',
                        borderDownColor: '#ff4757',
                        borderUpColor: '#26de81',
                        wickDownColor: '#ff4757',
                        wickUpColor: '#26de81',
                        priceLineVisible: true,
                        lastValueVisible: true,
                        title: exchangeConfig.name,
                    });
                    
                    series.setData(historicalData);
                    chartInstance.series.set(this.selectedExchange, series);
                    
                    // Store the last candle for stats
                    if (historicalData.length > 0) {
                        chartInstance.lastCandles.set(this.selectedExchange, historicalData[historicalData.length - 1]);
                        chartInstance.openPrices.set(this.selectedExchange, historicalData[0].open);
                        chartInstance.historicalPrices = historicalData.map(candle => candle.close);
                        this.updateTechnicalAnalysis(chartInstance);
                    }
                    
                    chartInstance.chart.timeScale().fitContent();
                    console.log(`✅ Added ${historicalData.length} candles for ${this.selectedExchange}`);
                } else {
                    console.warn(`❌ Invalid or empty data for ${this.selectedExchange}, charts will show empty state`);
                }
            } catch (error) {
                console.error(`❌ Failed to load data for ${this.selectedExchange}:`, error);
                console.log(`🚫 No fallback data for ${this.selectedExchange} - charts will remain empty`);
            }
        }
    }
    
    // Final chart adjustments
    if (chartInstance.chart && chartInstance.series.size > 0) {
        setTimeout(() => {
            const width = chartInstance.container.clientWidth;
            const height = chartInstance.container.clientHeight;
            chartInstance.chart.applyOptions({ 
                width, 
                height,
                // Improve overlay visibility
                layout: {
                    backgroundColor: 'transparent',
                    textColor: '#d1d4dc',
                },
                grid: {
                    vertLines: {
                        color: 'rgba(42, 46, 57, 0.5)',
                    },
                    horzLines: {
                        color: 'rgba(42, 46, 57, 0.5)',
                    },
                },
                rightPriceScale: {
                    borderColor: 'rgba(197, 203, 206, 0.4)',
                    visible: true,
                },
                timeScale: {
                    borderColor: 'rgba(197, 203, 206, 0.4)',
                    timeVisible: true,
                    secondsVisible: false,
                },
                crosshair: {
                    mode: 1, // Normal crosshair mode
                    vertLine: {
                        width: 1,
                        color: 'rgba(224, 227, 235, 0.5)',
                        style: 2, // Dashed
                    },
                    horzLine: {
                        width: 1,
                        color: 'rgba(224, 227, 235, 0.5)',
                        style: 2, // Dashed
                    },
                },
            });
            
            chartInstance.chart.timeScale().fitContent();
            console.log(`🎯 Final chart setup for ${chartInstance.chartId} (${width}x${height}) with ${chartInstance.series.size} series`);
        }, 100);
    } else {
        console.warn(`⚠️ No series created for chart ${chartInstance.chartId}`);
    }
}

// Add method to create a legend for multi-exchange charts
private addMultiExchangeLegend(chartInstance: ChartInstance, exchanges: string[]) {
    // Remove existing legend if any
    const existingLegend = chartInstance.container.querySelector('.multi-exchange-legend');
    if (existingLegend) {
        existingLegend.remove();
    }
    
    // Create legend container
    const legend = document.createElement('div');
    legend.className = 'multi-exchange-legend';
    legend.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 6px;
        padding: 8px 12px;
        z-index: 100;
        font-size: 12px;
        color: white;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // Add legend items
    exchanges.forEach(exchangeId => {
        const exchangeConfig = this.exchanges[exchangeId];
        if (exchangeConfig) {
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                margin: 2px 0;
                gap: 6px;
            `;
            
            item.innerHTML = `
                <div style="
                    width: 12px;
                    height: 2px;
                    background: ${exchangeConfig.color};
                    border-radius: 1px;
                "></div>
                <span>${exchangeConfig.name}</span>
            `;
            
            legend.appendChild(item);
        }
    });
    
    chartInstance.container.appendChild(legend);
}

// Enhanced exchange colors for better distinction
private getEnhancedExchangeColors(): Record<string, string> {
    return {
        'binance': '#f0b90b',     // Binance yellow/orange
        'bybit': '#f7931a',       // Bybit orange  
        'okx': '#0066ff',         // OKX blue (changed from light blue to darker blue)
        'kraken': '#5741d9',      // Kraken purple
        'coinbase': '#0052ff',    // Coinbase blue
        'bitget': '#00CED1',      // Bitget cyan
        'mexc': '#FF007A',        // MEXC pink
        'gemini': '#00D4AA',      // Gemini green
    };
}

// Update the exchange configurations with enhanced colors
private updateExchangeColorsForBetterVisibility() {
    const enhancedColors = this.getEnhancedExchangeColors();
    
    Object.keys(this.exchanges).forEach(exchangeId => {
        if (enhancedColors[exchangeId]) {
            this.exchanges[exchangeId].color = enhancedColors[exchangeId];
        }
    });
}

// Call this in the constructor to apply enhanced colors
// Add this line to the constructor: this.updateExchangeColorsForBetterVisibility(); 
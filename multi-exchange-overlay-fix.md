# Multi-Exchange Overlay Fix

## Problem
When multiple exchanges are selected in overlay mode, the charts overlap completely, with one exchange's candlestick chart covering the other, making it impossible to see both datasets.

## Root Cause
Both exchanges were creating candlestick series on the same chart with the same price scale, causing complete overlap.

## Solution
Convert to line charts for multi-exchange overlay mode to prevent overlapping and add visual legend.

## Key Changes Needed

### 1. Update OKX Color (Line 308 in charts-dashboard.ts)
```typescript
// Change from:
color: '#00d4ff'
// To:
color: '#0066ff'  // Darker blue for better distinction from Binance orange
```

### 2. Update loadHistoricalData Method (Around line 1355)
Replace the overlay mode section with:

```typescript
if (this.overlayMode) {
    const exchangesToUse = Array.from(this.selectedOverlayExchanges).filter(ex => workingExchanges.includes(ex));
    console.log(`🔄 Overlay mode: Loading data for exchanges: ${exchangesToUse.join(', ')}`);
    
    let seriesCreated = 0;
    
    for (const exchangeId of exchangesToUse) {
        const exchangeConfig = this.exchanges[exchangeId];
        if (exchangeConfig) {
            const symbol = exchangeConfig.formatSymbol(this.selectedAsset);
            
            try {
                const historicalData = await this.fetchHistoricalData(symbol, chartInstance.timeframe, exchangeId);
                
                if (historicalData && historicalData.length > 0 && this.validateKlineData(historicalData)) {
                    if (exchangesToUse.length === 1) {
                        // Single exchange - use candlestick
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
                        const lineData = historicalData.map(candle => ({
                            time: candle.time,
                            value: candle.close
                        }));
                        
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
                    }
                    
                    seriesCreated++;
                    // ... rest of the logic for storing candles and updating stats
                }
            } catch (error) {
                console.error(`❌ Failed to load data for ${exchangeId}:`, error);
            }
        }
    }
    
    // Add legend for multi-exchange view
    if (seriesCreated > 1) {
        this.addMultiExchangeLegend(chartInstance, exchangesToUse);
    }
}
```

### 3. Add Legend Method (Add to end of class)
```typescript
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
```

## Result
- ✅ Single exchange: Shows candlestick chart as before
- ✅ Multiple exchanges: Shows line charts with distinct colors
- ✅ Visual legend showing which color represents which exchange
- ✅ Better color contrast between Binance (orange) and OKX (dark blue)
- ✅ No more overlapping charts hiding each other

## Testing
1. Enable overlay mode
2. Select Binance and OKX
3. You should now see two distinct colored lines instead of overlapping candlesticks
4. Legend in top-right shows which color is which exchange 
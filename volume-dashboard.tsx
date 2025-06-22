/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Chart.js is loaded globally via CDN
declare const Chart: any;

import type { 
    HistoricalVolumeDataPoint, 
    DashboardMetrics, 
    ExchangeVolumeMetrics, 
    AssetVolumeMetrics,
    InstrumentTypeMetrics,
    OpportunityAnalysis,
    InstrumentType,
    AssetCategory
} from './types';
import { 
    fetchAllHistoricalVolumeData, 
    calculateDashboardMetrics, 
    filterVolumeData,
    formatVolumeNumber,
    formatPercentageChange,
    getExchangeColor,
    getInstrumentTypeDisplayName,
    getAssetCategoryDisplayName
} from './volume-api';

// Chart.js instance
let volumeChart: any = null;

// Global data storage
let allVolumeData: HistoricalVolumeDataPoint[] = [];
let dashboardMetrics: DashboardMetrics | null = null;
let isInitializing = false;

// Current filters
let currentFilters = {
    timeRange: 30,
    asset: 'all',
    exchange: 'all',
    instrumentType: 'all' as InstrumentType | 'all',
    category: 'all' as AssetCategory | 'all',
    chartType: 'line'
};

/**
 * Wait for Chart.js to be available and then initialize
 */
function waitForChartJSAndInitialize() {
    if (isInitializing) {
        console.log('⚠️ Already initializing, skipping...');
        return;
    }
    
    isInitializing = true;
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds max
    
    const checkAndInit = async () => {
        attempts++;
        console.log(`Attempt ${attempts}: Checking Chart.js availability`);
        
        // Check if Chart.js is available
        const ChartJS = (typeof Chart !== 'undefined' && Chart) || 
                       (typeof window !== 'undefined' && (window as any).Chart);
        
        if (ChartJS && typeof ChartJS === 'function') {
            console.log('✅ Chart.js is available, initializing dashboard...');
            await initializeDashboard();
            isInitializing = false;
            return;
        }
        
        if (attempts >= maxAttempts) {
            console.error('❌ Failed to load Chart.js after maximum attempts.');
            console.log('🔄 Attempting to manually load Chart.js...');
            
            // Try to load Chart.js manually as a last resort
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.onload = async () => {
                console.log('✅ Chart.js loaded manually, retrying initialization...');
                setTimeout(async () => {
                    if (typeof Chart !== 'undefined' && Chart) {
                        await initializeDashboard();
                    } else {
                        console.error('❌ Chart.js still not available after manual load');
                        showErrorStates();
                        isInitializing = false;
                    }
                }, 100);
            };
            script.onerror = () => {
                console.error('❌ Failed to manually load Chart.js. Please check your internet connection and try refreshing the page.');
                showErrorStates();
                isInitializing = false;
            };
            document.head.appendChild(script);
            return;
        }
        
        console.log('⏳ Chart.js not yet available, waiting...');
        setTimeout(checkAndInit, 100);
    };
    
    // Start checking immediately
    checkAndInit();
}

/**
 * Initialize the dashboard
 */
async function initializeDashboard() {
    console.log('🚀 Initializing Volume Dashboard...');
    
    // Verify Chart.js is available
    const ChartJS = (typeof Chart !== 'undefined' && Chart) || 
                   (typeof window !== 'undefined' && (window as any).Chart);
    
    if (!ChartJS) {
        console.error('❌ Chart.js is not available during initialization');
        showErrorStates();
        return;
    }
    
    console.log('📊 Chart.js confirmed available:', {
        typeof: typeof ChartJS,
        isFunction: typeof ChartJS === 'function'
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    await loadDashboardData();
    
    console.log('✅ Dashboard initialized successfully');
}

/**
 * Set up event listeners for controls
 */
function setupEventListeners() {
    // Filter controls
    const timeRangeSelect = document.getElementById('timeRange') as HTMLSelectElement;
    const assetFilterSelect = document.getElementById('assetFilter') as HTMLSelectElement;
    const exchangeFilterSelect = document.getElementById('exchangeFilter') as HTMLSelectElement;
    const instrumentFilterSelect = document.getElementById('instrumentFilter') as HTMLSelectElement;
    const categoryFilterSelect = document.getElementById('categoryFilter') as HTMLSelectElement;
    const chartTypeSelect = document.getElementById('chartType') as HTMLSelectElement;
    
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', (e) => {
            currentFilters.timeRange = parseInt((e.target as HTMLSelectElement).value);
            loadDashboardData();
        });
    }
    
    if (assetFilterSelect) {
        assetFilterSelect.addEventListener('change', (e) => {
            currentFilters.asset = (e.target as HTMLSelectElement).value;
            updateDashboardWithFilters();
        });
    }
    
    if (exchangeFilterSelect) {
        exchangeFilterSelect.addEventListener('change', (e) => {
            currentFilters.exchange = (e.target as HTMLSelectElement).value;
            updateDashboardWithFilters();
        });
    }
    
    if (instrumentFilterSelect) {
        instrumentFilterSelect.addEventListener('change', (e) => {
            currentFilters.instrumentType = (e.target as HTMLSelectElement).value as InstrumentType | 'all';
            updateDashboardWithFilters();
        });
    }
    
    if (categoryFilterSelect) {
        categoryFilterSelect.addEventListener('change', (e) => {
            currentFilters.category = (e.target as HTMLSelectElement).value as AssetCategory | 'all';
            updateDashboardWithFilters();
        });
    }
    
    if (chartTypeSelect) {
        chartTypeSelect.addEventListener('change', (e) => {
            currentFilters.chartType = (e.target as HTMLSelectElement).value;
            updateChart();
        });
    }
}

/**
 * Load dashboard data from APIs
 */
async function loadDashboardData() {
    try {
        console.log(`📊 Loading ${currentFilters.timeRange} days of volume data...`);
        
        // Show loading states
        showLoadingStates();
        
        // Fetch all volume data
        allVolumeData = await fetchAllHistoricalVolumeData(currentFilters.timeRange);
        
        if (allVolumeData.length === 0) {
            console.warn('⚠️ No volume data received');
            showErrorStates();
            return;
        }
        
        console.log(`📈 Loaded ${allVolumeData.length} data points`);
        
        // Calculate metrics
        dashboardMetrics = calculateDashboardMetrics(allVolumeData);
        
        // Update all dashboard components
        updateMetricsCards();
        updateChart();
        updateInstrumentTable();
        updateOpportunitiesSection();
        updateExchangeTable();
        updateAssetTable();
        updateDataSources();
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showErrorStates();
    }
}

/**
 * Update dashboard with current filters
 */
function updateDashboardWithFilters() {
    if (!allVolumeData.length || !dashboardMetrics) {
        return;
    }
    
    // Apply filters to data
    const filteredData = filterVolumeData(allVolumeData, {
        asset: currentFilters.asset !== 'all' ? currentFilters.asset : undefined,
        exchange: currentFilters.exchange !== 'all' ? currentFilters.exchange : undefined,
        instrumentType: currentFilters.instrumentType !== 'all' ? currentFilters.instrumentType : undefined,
        category: currentFilters.category !== 'all' ? currentFilters.category : undefined
    });
    
    // Recalculate metrics with filtered data
    const filteredMetrics = calculateDashboardMetrics(filteredData);
    
    // Update components with filtered data
    updateMetricsCards(filteredMetrics);
    updateChart(filteredData);
    updateInstrumentTable(filteredMetrics.instrumentTypeMetrics);
    updateOpportunitiesSection(filteredMetrics.opportunities);
    updateExchangeTable(filteredMetrics.exchangeMetrics);
    updateAssetTable(filteredMetrics.topAssetsByVolume);
}

/**
 * Show loading states for all components
 */
function showLoadingStates() {
    // Metrics cards
    const loadingElements = [
        'totalVolume', 'activeExchanges', 'topAsset', 'dataQuality', 'instrumentTypes', 'opportunities'
    ];
    
    loadingElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = 'Loading...';
        }
    });
    
    // Chart loading
    const chartLoading = document.getElementById('chartLoading');
    if (chartLoading) {
        chartLoading.style.display = 'block';
    }
}

/**
 * Show error states for components
 */
function showErrorStates() {
    const errorElements = [
        'totalVolume', 'activeExchanges', 'topAsset', 'dataQuality', 'instrumentTypes', 'opportunities'
    ];
    
    errorElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = 'Error';
        }
    });
    
    // Hide chart loading and show error in chart area
    const chartLoading = document.getElementById('chartLoading');
    if (chartLoading) {
        chartLoading.style.display = 'none';
    }
}

/**
 * Update metrics cards
 */
function updateMetricsCards(metrics: DashboardMetrics = dashboardMetrics!) {
    if (!metrics) return;
    
    // Total Volume
    const totalVolumeElement = document.getElementById('totalVolume');
    if (totalVolumeElement) {
        totalVolumeElement.textContent = formatVolumeNumber(metrics.totalVolumeAllExchanges);
    }
    
    // Active Exchanges
    const activeExchangesElement = document.getElementById('activeExchanges');
    if (activeExchangesElement) {
        activeExchangesElement.textContent = `${metrics.dataQuality.upToDateExchanges}/${metrics.totalExchanges}`;
    }
    
    // Top Asset
    const topAssetElement = document.getElementById('topAsset');
    if (topAssetElement && metrics.topAssetsByVolume.length > 0) {
        const topAsset = metrics.topAssetsByVolume[0];
        topAssetElement.textContent = `${topAsset.baseAsset} (${formatVolumeNumber(topAsset.totalVolumeUsd)})`;
    }
    
    // Data Quality
    const dataQualityElement = document.getElementById('dataQuality');
    if (dataQualityElement) {
        const qualityScore = Math.round((metrics.dataQuality.upToDateExchanges / metrics.totalExchanges) * 100);
        dataQualityElement.textContent = `${qualityScore}%`;
    }
    
    // Instrument Types
    const instrumentTypesElement = document.getElementById('instrumentTypes');
    if (instrumentTypesElement) {
        instrumentTypesElement.textContent = `${metrics.instrumentTypeMetrics.length}`;
    }
    
    // Opportunities
    const opportunitiesElement = document.getElementById('opportunities');
    if (opportunitiesElement) {
        opportunitiesElement.textContent = `${metrics.opportunities.length}`;
    }
}

/**
 * Get time display format based on time range
 */
function getTimeDisplayFormat(timeRange: number): { unit: string, displayFormat: string, tooltipFormat: string } {
    if (timeRange <= 1) {
        // For 1 day, show hourly granularity with minutes
        return {
            unit: 'hour',
            displayFormat: 'HH:mm',
            tooltipFormat: 'MMM dd, yyyy HH:mm'
        };
    } else if (timeRange <= 3) {
        // For 3 days or less, show hourly granularity
        return {
            unit: 'hour',
            displayFormat: 'MMM dd, HH:mm',
            tooltipFormat: 'MMM dd, yyyy HH:mm'
        };
    } else if (timeRange <= 7) {
        // For 7 days or less, show daily granularity with hours
        return {
            unit: 'day',
            displayFormat: 'MMM dd',
            tooltipFormat: 'MMM dd, yyyy'
        };
    } else if (timeRange <= 30) {
        // For 30 days or less, show daily granularity
        return {
            unit: 'day',
            displayFormat: 'MMM dd',
            tooltipFormat: 'MMM dd, yyyy'
        };
    } else if (timeRange <= 90) {
        // For 90 days or less, show weekly granularity
        return {
            unit: 'week',
            displayFormat: 'MMM dd',
            tooltipFormat: 'Week of MMM dd, yyyy'
        };
    } else if (timeRange <= 180) {
        // For 6 months or less, show weekly granularity
        return {
            unit: 'week',
            displayFormat: 'MMM dd',
            tooltipFormat: 'Week of MMM dd, yyyy'
        };
    } else {
        // For longer periods, show monthly granularity
        return {
            unit: 'month',
            displayFormat: 'MMM yyyy',
            tooltipFormat: 'MMM yyyy'
        };
    }
}

/**
 * Format date for tooltip display
 */
function formatTooltipDate(dateStr: string, tooltipFormat: string): string {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return dateStr;
        }
        
        // Use Intl.DateTimeFormat for consistent formatting
        const options: Intl.DateTimeFormatOptions = {};
        
        if (tooltipFormat.includes('HH:mm')) {
            options.year = 'numeric';
            options.month = 'short';
            options.day = '2-digit';
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = false;
        } else if (tooltipFormat.includes('Week of')) {
            options.year = 'numeric';
            options.month = 'short';
            options.day = '2-digit';
            return `Week of ${date.toLocaleDateString('en-US', options)}`;
        } else if (tooltipFormat.includes('yyyy')) {
            options.year = 'numeric';
            options.month = 'short';
            if (!tooltipFormat.includes('MMM yyyy')) {
                options.day = '2-digit';
            }
        } else {
            options.month = 'short';
            if (tooltipFormat.includes('dd')) {
                options.day = '2-digit';
            }
        }
        
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.warn('Error formatting tooltip date:', error);
        return dateStr;
    }
}

/**
 * Update time range indicator
 */
function updateTimeRangeIndicator(timeRange: number) {
    const indicator = document.getElementById('timeRangeIndicator');
    if (!indicator) return;
    
    const timeConfig = getTimeDisplayFormat(timeRange);
    let granularityText = '';
    
    switch (timeConfig.unit) {
        case 'hour':
            granularityText = timeRange <= 1 ? 'Hourly View' : 'Hourly View';
            break;
        case 'day':
            granularityText = 'Daily View';
            break;
        case 'week':
            granularityText = 'Weekly View';
            break;
        case 'month':
            granularityText = 'Monthly View';
            break;
        default:
            granularityText = 'Time View';
    }
    
    const timeText = timeRange === 1 ? '1 Day' : `${timeRange} Days`;
    indicator.textContent = `${timeText} - ${granularityText}`;
}

/**
 * Update the main chart
 */
function updateChart(data: HistoricalVolumeDataPoint[] = allVolumeData) {
    const canvas = document.getElementById('volumeChart') as HTMLCanvasElement;
    const chartLoading = document.getElementById('chartLoading');
    
    if (!canvas || !data.length) {
        return;
    }
    
    // Hide loading indicator
    if (chartLoading) {
        chartLoading.style.display = 'none';
    }
    
    // Update time range indicator
    updateTimeRangeIndicator(currentFilters.timeRange);
    
    // Destroy existing chart
    if (volumeChart) {
        volumeChart.destroy();
    }
    
    // Group data by exchange and date
    const chartData = prepareChartData(data);
    
    // Get time display configuration based on current time range
    const timeConfig = getTimeDisplayFormat(currentFilters.timeRange);
    
    // Create chart configuration
    const config = {
        type: currentFilters.chartType === 'stacked' ? 'bar' : currentFilters.chartType,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index' as const,
                intersect: false,
            },
            hover: {
                mode: 'index' as const,
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: `Volume Analysis - ${currentFilters.timeRange} Day${currentFilters.timeRange > 1 ? 's' : ''}`,
                    color: '#e2e8f0',
                    font: { size: 16, weight: 'bold' as const }
                },
                legend: {
                    position: 'top' as const,
                    labels: { color: '#e2e8f0' }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#334155',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    titleFont: { size: 14, weight: 'bold' as const },
                    bodyFont: { size: 13 },
                    padding: 12,
                    callbacks: {
                        title: function(context: any) {
                            if (context && context.length > 0) {
                                const dataPoint = context[0];
                                const rawDate = dataPoint.label || dataPoint.parsed?.x;
                                if (rawDate) {
                                    return formatTooltipDate(rawDate, timeConfig.tooltipFormat);
                                }
                            }
                            return '';
                        },
                        label: function(context: any) {
                            const exchangeName = context.dataset.label;
                            const volume = formatVolumeNumber(context.raw);
                            return `${exchangeName}: ${volume}`;
                        },
                        afterBody: function(context: any) {
                            if (context && context.length > 0) {
                                const total = context.reduce((sum: number, item: any) => sum + (item.raw || 0), 0);
                                return [``, `Total: ${formatVolumeNumber(total)}`];
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: timeConfig.unit as any,
                        displayFormats: { 
                            [timeConfig.unit]: timeConfig.displayFormat 
                        }
                    },
                    grid: { 
                        color: '#334155',
                        drawOnChartArea: true,
                        drawTicks: true
                    },
                    ticks: { 
                        color: '#94a3b8',
                        maxTicksLimit: 10,
                        font: { size: 11 }
                    },
                    title: {
                        display: true,
                        text: 'Time',
                        color: '#94a3b8',
                        font: { size: 12, weight: 'bold' as const }
                    }
                },
                y: {
                    stacked: currentFilters.chartType === 'stacked',
                    grid: { 
                        color: '#334155',
                        drawOnChartArea: true,
                        drawTicks: true
                    },
                    ticks: { 
                        color: '#94a3b8',
                        font: { size: 11 },
                        callback: function(value: any) {
                            return formatVolumeNumber(value);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Volume (USD)',
                        color: '#94a3b8',
                        font: { size: 12, weight: 'bold' as const }
                    }
                }
            },
            elements: {
                point: {
                    radius: currentFilters.chartType === 'line' ? 3 : 0,
                    hoverRadius: currentFilters.chartType === 'line' ? 6 : 0,
                    hitRadius: 10
                },
                line: {
                    tension: 0.1
                }
            }
        }
    };
    
    // Get Chart.js from global scope or window
    const ChartJS = (typeof Chart !== 'undefined' && Chart) || 
                   (typeof window !== 'undefined' && (window as any).Chart);
    
    if (!ChartJS || typeof ChartJS !== 'function') {
        console.error('❌ Chart.js is not available for chart creation');
        return;
    }
    
    // Create chart
    const ctx = canvas.getContext('2d');
    if (ctx) {
        volumeChart = new ChartJS(ctx, config);
    }
}

/**
 * Prepare chart data from volume data points
 */
function prepareChartData(data: HistoricalVolumeDataPoint[]) {
    // Group by exchange
    const exchangeData = new Map<string, HistoricalVolumeDataPoint[]>();
    
    data.forEach(point => {
        if (!exchangeData.has(point.exchangeId)) {
            exchangeData.set(point.exchangeId, []);
        }
        exchangeData.get(point.exchangeId)!.push(point);
    });
    
    // Create datasets for each exchange
    const datasets = Array.from(exchangeData.entries()).map(([exchangeId, points]) => {
        // Aggregate by date
        const dailyVolumes = new Map<string, number>();
        
        points.forEach(point => {
            const existing = dailyVolumes.get(point.date) || 0;
            dailyVolumes.set(point.date, existing + point.usdVolume);
        });
        
        // Convert to chart data format
        const chartPoints = Array.from(dailyVolumes.entries())
            .map(([date, volume]) => ({
                x: date,
                y: volume
            }))
            .sort((a, b) => a.x.localeCompare(b.x));
        
        return {
            label: exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1),
            data: chartPoints,
            borderColor: getExchangeColor(exchangeId),
            backgroundColor: getExchangeColor(exchangeId) + '20',
            borderWidth: 2,
            fill: currentFilters.chartType === 'stacked'
        };
    });
    
    return { datasets };
}

/**
 * Update instrument type table
 */
function updateInstrumentTable(instrumentMetrics: InstrumentTypeMetrics[] = dashboardMetrics?.instrumentTypeMetrics || []) {
    const tableBody = document.querySelector('#instrumentTable tbody') as HTMLTableSectionElement;
    if (!tableBody) return;
    
    if (instrumentMetrics.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="loading-row">No instrument data available</td></tr>';
        return;
    }
    
    tableBody.innerHTML = instrumentMetrics.map(metric => `
        <tr>
            <td>
                <div class="instrument-type">
                    <span class="instrument-name">${getInstrumentTypeDisplayName(metric.instrumentType)}</span>
                </div>
            </td>
            <td>
                <div class="volume-cell">
                    <span class="volume-primary">${formatVolumeNumber(metric.totalVolumeUsd)}</span>
                </div>
            </td>
            <td>
                <div class="share-cell">
                    <span class="share-value">${metric.marketShare.toFixed(1)}%</span>
                    <div class="share-bar">
                        <div class="share-fill" style="width: ${metric.marketShare}%"></div>
                    </div>
                </div>
            </td>
            <td>${metric.exchangeCount}</td>
            <td>${metric.assetCount}</td>
            <td>
                <div class="top-exchange">
                    <span class="exchange-name">${metric.topExchanges[0]?.exchangeId || 'N/A'}</span>
                    <span class="exchange-share">(${metric.topExchanges[0]?.marketShare.toFixed(1) || '0'}%)</span>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Update opportunities section
 */
function updateOpportunitiesSection(opportunities: OpportunityAnalysis[] = dashboardMetrics?.opportunities || []) {
    const container = document.getElementById('opportunitiesContainer');
    if (!container) return;
    
    if (opportunities.length === 0) {
        container.innerHTML = '<div class="loading-message">No opportunities identified</div>';
        return;
    }
    
    container.innerHTML = opportunities.map(opportunity => {
        const riskColor = {
            'low': '#10b981',
            'medium': '#f59e0b',
            'high': '#ef4444'
        }[opportunity.riskLevel];
        
        const typeIcon = {
            'arbitrage': '⚡',
            'volume_concentration': '🎯',
            'market_gap': '🕳️',
            'low_competition': '🏆'
        }[opportunity.type];
        
        return `
            <div class="opportunity-card">
                <div class="opportunity-header">
                    <div class="opportunity-type">
                        <span class="opportunity-icon">${typeIcon}</span>
                        <span class="opportunity-title">${opportunity.type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div class="opportunity-score" style="color: ${riskColor}">
                        ${opportunity.score.toFixed(0)}
                    </div>
                </div>
                <div class="opportunity-content">
                    <div class="opportunity-asset">
                        <strong>${opportunity.asset}</strong> - ${getInstrumentTypeDisplayName(opportunity.instrumentType)}
                    </div>
                    <div class="opportunity-description">
                        ${opportunity.description}
                    </div>
                    <div class="opportunity-details">
                        <div class="opportunity-exchanges">
                            <strong>Exchanges:</strong> ${opportunity.exchanges.join(', ')}
                        </div>
                        <div class="opportunity-volume">
                            <strong>Volume:</strong> ${formatVolumeNumber(opportunity.potentialVolume)}
                        </div>
                        <div class="opportunity-risk" style="color: ${riskColor}">
                            <strong>Risk:</strong> ${opportunity.riskLevel.toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Update exchange table
 */
function updateExchangeTable(exchangeMetrics: ExchangeVolumeMetrics[] = dashboardMetrics?.exchangeMetrics || []) {
    const tableBody = document.querySelector('#exchangeTable tbody') as HTMLTableSectionElement;
    if (!tableBody) return;
    
    if (exchangeMetrics.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="loading-row">No exchange data available</td></tr>';
        return;
    }
    
    tableBody.innerHTML = exchangeMetrics.map(exchange => {
        const statusClass = exchange.isActive ? 'status-active' : 'status-inactive';
        const statusText = exchange.isActive ? 'Active' : 'Stale';
        
        // Find primary instrument type
        const instrumentTypes = Object.entries(exchange.instrumentBreakdown);
        const primaryInstrument = instrumentTypes.reduce((max, [type, data]) => 
            data.volume > max.volume ? { type: type as InstrumentType, volume: data.volume } : max,
            { type: 'unknown' as InstrumentType, volume: 0 }
        );
        
        return `
            <tr>
                <td>
                    <div class="exchange-cell">
                        <span class="exchange-name">${exchange.exchangeName}</span>
                    </div>
                </td>
                <td>
                    <div class="volume-cell">
                        <span class="volume-primary">${formatVolumeNumber(exchange.totalVolumeUsd)}</span>
                    </div>
                </td>
                <td>
                    <div class="share-cell">
                        <span class="share-value">${exchange.marketShare.toFixed(1)}%</span>
                        <div class="share-bar">
                            <div class="share-fill" style="width: ${exchange.marketShare}%"></div>
                        </div>
                    </div>
                </td>
                <td>${formatVolumeNumber(exchange.averageVolumeUsd)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="instrument-cell">
                        <span class="instrument-name">${getInstrumentTypeDisplayName(primaryInstrument.type)}</span>
                    </div>
                </td>
                <td>
                    <div class="timestamp-cell">
                        ${new Date(exchange.lastUpdated).toLocaleString()}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Update asset table
 */
function updateAssetTable(assetMetrics: AssetVolumeMetrics[] = dashboardMetrics?.topAssetsByVolume || []) {
    const tableBody = document.querySelector('#assetTable tbody') as HTMLTableSectionElement;
    if (!tableBody) return;
    
    if (assetMetrics.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="loading-row">No asset data available</td></tr>';
        return;
    }
    
    tableBody.innerHTML = assetMetrics.map(asset => {
        const changeClass = asset.priceChange24h >= 0 ? 'change-positive' : 'change-negative';
        
        // Find primary instrument type
        const instrumentTypes = Object.entries(asset.instrumentBreakdown);
        const primaryInstrument = instrumentTypes.reduce((max, [type, data]) => 
            data.volume > max.volume ? { type: type as InstrumentType, volume: data.volume } : max,
            { type: 'unknown' as InstrumentType, volume: 0 }
        );
        
        return `
            <tr>
                <td>
                    <div class="asset-cell">
                        <span class="asset-symbol">${asset.baseAsset}</span>
                        <span class="asset-pair">/USDT</span>
                    </div>
                </td>
                <td>
                    <div class="category-cell">
                        <span class="category-badge category-${asset.category}">
                            ${getAssetCategoryDisplayName(asset.category)}
                        </span>
                    </div>
                </td>
                <td>
                    <div class="volume-cell">
                        <span class="volume-primary">${formatVolumeNumber(asset.totalVolumeUsd)}</span>
                    </div>
                </td>
                <td>${asset.exchangeCount}</td>
                <td>
                    <div class="exchange-cell">
                        <span class="exchange-name">${asset.topExchange}</span>
                    </div>
                </td>
                <td>
                    <div class="instrument-cell">
                        <span class="instrument-name">${getInstrumentTypeDisplayName(primaryInstrument.type)}</span>
                    </div>
                </td>
                <td>
                    <div class="change-cell">
                        <span class="change-value ${changeClass}">
                            ${formatPercentageChange(asset.priceChange24h)}
                        </span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Update data sources section
 */
function updateDataSources() {
    if (!dashboardMetrics) return;
    
    // Update status indicators
    const binanceStatus = document.getElementById('binanceStatus');
    const bybitStatus = document.getElementById('bybitStatus');
    
    if (binanceStatus) binanceStatus.textContent = 'Live';
    if (bybitStatus) bybitStatus.textContent = 'Live';
    
    // Update timestamps
    const lastFullUpdate = document.getElementById('lastFullUpdate');
    const binanceUpdate = document.getElementById('binanceUpdate');
    const bybitUpdate = document.getElementById('bybitUpdate');
    
    const now = new Date();
    const timeString = now.toLocaleString();
    
    if (lastFullUpdate) lastFullUpdate.textContent = timeString;
    if (binanceUpdate) binanceUpdate.textContent = timeString;
    if (bybitUpdate) bybitUpdate.textContent = timeString;
}

// Initialize dashboard when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM loaded, waiting for Chart.js...');
        waitForChartJSAndInitialize();
    });
} else {
    console.log('📄 Document already complete, waiting for Chart.js...');
    waitForChartJSAndInitialize();
} 
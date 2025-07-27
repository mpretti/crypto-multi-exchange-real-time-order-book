
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- DOM Elements ---
export const assetSelect = document.getElementById('asset-select') as HTMLSelectElement;
export const connectionStatusSummaryEl = document.getElementById('connection-status-summary') as HTMLDivElement;
export const spreadValueEl = document.getElementById('spread-value') as HTMLSpanElement;
export const spreadPercentageEl = document.getElementById('spread-percentage') as HTMLSpanElement;
export const bidsList = document.getElementById('bids-list') as HTMLUListElement;
export const asksList = document.getElementById('asks-list') as HTMLUListElement;
export const viewModeToggle = document.getElementById('view-mode-toggle') as HTMLInputElement;
export const viewModeLabel = document.getElementById('view-mode-label') as HTMLSpanElement;
export const bidsTitle = document.getElementById('bids-title') as HTMLElement;
export const asksTitle = document.getElementById('asks-title') as HTMLElement;
export const spreadContainerEl = document.querySelector('.spread-container') as HTMLDivElement;


// Sidebar DOM Elements
export const infoSidebar = document.getElementById('info-sidebar') as HTMLElement;
export const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn') as HTMLButtonElement;
export const closeSidebarBtn = document.getElementById('close-sidebar-btn') as HTMLButtonElement;
export const refreshSidebarStatsBtn = document.getElementById('refresh-sidebar-stats-btn') as HTMLButtonElement;
export const mainContainer = document.getElementById('main-container') as HTMLElement;

export const feesContentEl = document.getElementById('fees-content') as HTMLDivElement;
export const fundingContentEl = document.getElementById('funding-content') as HTMLDivElement;
export const volumeContentEl = document.getElementById('volume-content') as HTMLDivElement;
export const fundingAssetSymbolEl = document.getElementById('funding-asset-symbol') as HTMLSpanElement;
export const volumeAssetSymbolEl = document.getElementById('volume-asset-symbol') as HTMLSpanElement;

// Chart DOM Elements
export const chartContainerEl = document.getElementById('chart-container') as HTMLDivElement;
export const chartTimeframeSelectorEl = document.getElementById('chart-timeframe-selector') as HTMLDivElement;


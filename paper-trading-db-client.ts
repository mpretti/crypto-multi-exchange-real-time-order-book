// Paper Trading Database Client
// Frontend interface to communicate with the database backend

import { logger } from './utils';

interface ApiResponse<T = any> {
    success?: boolean;
    error?: string;
    data?: T;
}

class PaperTradingDbClient {
    private baseUrl: string;
    private sessionId: string;

    constructor(baseUrl: string = 'http://localhost:3001/api', sessionId: string = 'default') {
        this.baseUrl = baseUrl;
        this.sessionId = sessionId;
    }

    private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            logger.error(`Database API error for ${endpoint}:`, error);
            throw error;
        }
    }

    // Session Management
    async createSession(sessionName: string, notes?: string): Promise<{ success: boolean; id: number }> {
        const sessionId = `session_${Date.now()}`;
        return this.makeRequest('/sessions', {
            method: 'POST',
            body: JSON.stringify({
                session_id: sessionId,
                session_name: sessionName,
                notes: notes
            })
        });
    }

    async getSessions(): Promise<any[]> {
        return this.makeRequest('/sessions');
    }

    // Configuration
    async saveConfiguration(config: any): Promise<{ success: boolean }> {
        return this.makeRequest(`/sessions/${this.sessionId}/config`, {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    async getConfiguration(): Promise<any> {
        return this.makeRequest(`/sessions/${this.sessionId}/config`);
    }

    // Portfolio
    async savePortfolioState(portfolio: any): Promise<{ success: boolean }> {
        return this.makeRequest(`/sessions/${this.sessionId}/portfolio`, {
            method: 'POST',
            body: JSON.stringify(portfolio)
        });
    }

    async getCurrentPortfolio(): Promise<any> {
        return this.makeRequest(`/sessions/${this.sessionId}/portfolio`);
    }

    async getPortfolioHistory(limit: number = 100): Promise<any[]> {
        return this.makeRequest(`/sessions/${this.sessionId}/portfolio/history?limit=${limit}`);
    }

    // Trades
    async saveTrade(trade: any): Promise<{ success: boolean }> {
        return this.makeRequest(`/sessions/${this.sessionId}/trades`, {
            method: 'POST',
            body: JSON.stringify(trade)
        });
    }

    async getTrades(limit: number = 50, side?: 'buy' | 'sell'): Promise<any[]> {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (side) params.append('side', side);
        
        return this.makeRequest(`/sessions/${this.sessionId}/trades?${params.toString()}`);
    }

    // Agent Logs
    async saveAgentLog(type: 'thought' | 'action' | 'error' | 'config_change', content: string, data?: any): Promise<{ success: boolean }> {
        return this.makeRequest(`/sessions/${this.sessionId}/logs`, {
            method: 'POST',
            body: JSON.stringify({ type, content, data })
        });
    }

    async getAgentLogs(limit: number = 100, type?: string): Promise<any[]> {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (type) params.append('type', type);
        
        return this.makeRequest(`/sessions/${this.sessionId}/logs?${params.toString()}`);
    }

    // Analytics
    async getAnalytics(): Promise<{
        trades: any;
        portfolio: any;
        strategies: any[];
    }> {
        return this.makeRequest(`/sessions/${this.sessionId}/analytics`);
    }

    // Exchange Fees
    async cacheExchangeFees(exchange: string, asset: string, makerFee: number, takerFee: number, note?: string): Promise<{ success: boolean }> {
        return this.makeRequest('/exchange-fees', {
            method: 'POST',
            body: JSON.stringify({ exchange, asset, makerFee, takerFee, note })
        });
    }

    async getCachedExchangeFees(exchange: string, asset: string): Promise<any> {
        return this.makeRequest(`/exchange-fees/${exchange}/${asset}`);
    }

    // Export/Import
    async exportSessionData(): Promise<any> {
        return this.makeRequest(`/sessions/${this.sessionId}/export`);
    }

    // Health Check
    async healthCheck(): Promise<{ status: string; timestamp: string; database: string }> {
        return this.makeRequest('/health');
    }

    // Migration from localStorage
    async migrateFromLocalStorage(): Promise<void> {
        try {
            logger.log('DB: Starting migration from localStorage...');

            // Get existing localStorage data
            const existingConfig = localStorage.getItem('paperTradingConfig');
            const existingPortfolio = localStorage.getItem('paperTradingPortfolio');
            const existingTrades = localStorage.getItem('paperTradingTrades');

            if (existingConfig) {
                const config = JSON.parse(existingConfig);
                await this.saveConfiguration(config);
                logger.log('DB: Migrated configuration to database');
            }

            if (existingPortfolio) {
                const portfolio = JSON.parse(existingPortfolio);
                await this.savePortfolioState(portfolio);
                logger.log('DB: Migrated portfolio to database');
            }

            if (existingTrades) {
                const trades = JSON.parse(existingTrades);
                for (const trade of trades) {
                    await this.saveTrade(trade);
                }
                logger.log(`DB: Migrated ${trades.length} trades to database`);
            }

            // Save thoughts/actions if they exist
            const existingActions = localStorage.getItem('paperTradingActions');
            if (existingActions) {
                const actions = JSON.parse(existingActions);
                for (const action of actions) {
                    await this.saveAgentLog('action', action);
                }
                logger.log(`DB: Migrated ${actions.length} actions to database`);
            }

            logger.log('DB: Migration completed successfully');
        } catch (error) {
            logger.error('DB: Migration failed:', error);
            throw error;
        }
    }

    // Utility methods
    setSessionId(sessionId: string): void {
        this.sessionId = sessionId;
    }

    getSessionId(): string {
        return this.sessionId;
    }

    async isBackendAvailable(): Promise<boolean> {
        try {
            await this.healthCheck();
            return true;
        } catch (error) {
            logger.warn('DB: Backend not available, falling back to localStorage');
            return false;
        }
    }
}

// Create singleton instance
export const paperTradingDb = new PaperTradingDbClient();

// Export types for use in other modules
export interface TradeRecord {
    id: string;
    session_id: string;
    timestamp: number;
    side: 'buy' | 'sell';
    asset: string;
    exchange: string;
    price: number;
    quantity: number;
    value: number;
    fee: number;
    fee_rate?: number;
    pnl: number;
    strategy: string;
    reason: string;
    confidence?: number;
    market_conditions?: string;
}

export interface PortfolioState {
    session_id: string;
    timestamp: number;
    cash: number;
    total_value: number;
    initial_value: number;
    day_start_value: number;
    position_asset?: string;
    position_quantity?: number;
    position_average_price?: number;
    position_entry_time?: number;
    total_pnl?: number;
    daily_pnl?: number;
    unrealized_pnl?: number;
}

export interface TradingConfiguration {
    session_id: string;
    exchange: string;
    asset: string;
    strategy: string;
    initial_capital: number;
    trading_speed: string;
    risk_level: string;
    position_size: number;
    ai_personality: string;
    chart_overlay_enabled: boolean;
}

export interface AgentLog {
    id: number;
    session_id: string;
    timestamp: string;
    log_type: 'thought' | 'action' | 'error' | 'config_change';
    content: string;
    data?: any;
} 
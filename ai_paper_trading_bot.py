#!/usr/bin/env python3
"""
🤖 AI-Powered Paper Trading Bot with C3PO Integration
====================================================

Advanced paper trading bot that combines C3PO AI predictions with traditional
trading strategies for optimal performance.
"""

import asyncio
import time
import json
import logging
import random
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from c3po_client import C3POClient, create_sample_market_data, format_prediction_output

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_trading_bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class Position:
    """Trading position data structure"""
    symbol: str
    quantity: float
    entry_price: float
    current_price: float
    entry_time: datetime
    side: str  # 'long' or 'short'
    
    @property
    def unrealized_pnl(self) -> float:
        if self.side == 'long':
            return (self.current_price - self.entry_price) * self.quantity
        else:
            return (self.entry_price - self.current_price) * self.quantity
    
    @property
    def unrealized_pnl_percent(self) -> float:
        return (self.unrealized_pnl / (self.entry_price * self.quantity)) * 100

@dataclass
class Trade:
    """Completed trade data structure"""
    symbol: str
    side: str
    quantity: float
    entry_price: float
    exit_price: float
    entry_time: datetime
    exit_time: datetime
    pnl: float
    pnl_percent: float
    strategy: str
    ai_confidence: float
    c3po_used: bool

class Portfolio:
    """Portfolio management class"""
    def __init__(self, initial_cash: float = 10000):
        self.initial_cash = initial_cash
        self.cash = initial_cash
        self.positions: Dict[str, Position] = {}
        self.trades: List[Trade] = []
        self.max_position_size = 0.2  # 20% of portfolio per position
        self.max_total_exposure = 0.8  # 80% total exposure
    
    @property
    def total_value(self) -> float:
        position_value = sum(pos.current_price * pos.quantity for pos in self.positions.values())
        return self.cash + position_value
    
    @property
    def total_pnl(self) -> float:
        return self.total_value - self.initial_cash
    
    @property
    def total_pnl_percent(self) -> float:
        return (self.total_pnl / self.initial_cash) * 100
    
    @property
    def exposure_percent(self) -> float:
        position_value = sum(pos.current_price * pos.quantity for pos in self.positions.values())
        return (position_value / self.total_value) * 100
    
    def can_open_position(self, symbol: str, price: float, quantity: float) -> bool:
        position_value = price * quantity
        max_position_value = self.total_value * self.max_position_size
        
        if position_value > max_position_value:
            return False
        
        current_exposure = sum(pos.current_price * pos.quantity for pos in self.positions.values())
        if (current_exposure + position_value) > (self.total_value * self.max_total_exposure):
            return False
        
        return position_value <= self.cash

class AIPaperTradingBot:
    """AI-powered paper trading bot with C3PO integration"""
    
    def __init__(self, 
                 initial_balance: float = 10000,
                 trading_symbols: List[str] = None,
                 ai_confidence_threshold: float = 0.7,
                 max_positions: int = 5):
        
        self.portfolio = Portfolio(initial_balance)
        self.c3po_client = C3POClient()
        self.trading_symbols = trading_symbols or ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
        self.ai_confidence_threshold = ai_confidence_threshold
        self.max_positions = max_positions
        
        # Strategy configuration
        self.strategy_config = {
            'position_sizing': 'ai_adaptive',  # 'fixed', 'volatility_adjusted', 'ai_adaptive'
            'risk_management': True,
            'stop_loss_percent': 0.05,  # 5% stop loss
            'take_profit_percent': 0.10,  # 10% take profit
            'max_holding_time': timedelta(hours=24),  # Max 24 hours per position
            'ai_weight': 0.7,  # Weight given to AI predictions vs technical analysis
        }
        
        # Performance tracking
        self.performance_metrics = {
            'total_trades': 0,
            'winning_trades': 0,
            'losing_trades': 0,
            'win_rate': 0.0,
            'avg_win': 0.0,
            'avg_loss': 0.0,
            'profit_factor': 0.0,
            'max_drawdown': 0.0,
            'sharpe_ratio': 0.0,
            'ai_accuracy': 0.0,
            'c3po_predictions': 0,
            'c3po_successful': 0
        }
        
        # Market data buffer
        self.market_data: Dict[str, List[Dict]] = {symbol: [] for symbol in self.trading_symbols}
        self.running = False
        
        logger.info(f"🤖 AI Paper Trading Bot initialized")
        logger.info(f"💰 Initial balance: ${initial_balance:,.2f}")
        logger.info(f"📈 Trading symbols: {', '.join(self.trading_symbols)}")
        logger.info(f"🎯 AI confidence threshold: {ai_confidence_threshold:.1%}")
    
    async def start_trading(self, duration_minutes: int = 60):
        """Start the AI trading session"""
        logger.info(f"🚀 Starting AI trading session for {duration_minutes} minutes...")
        
        # Check C3PO connection
        if not self.c3po_client.health_check():
            logger.error("❌ C3PO service not available! Cannot start AI trading.")
            return
        
        logger.info("✅ C3PO AI models connected and ready")
        
        self.running = True
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)
        
        # Initialize market data
        await self._initialize_market_data()
        
        try:
            iteration = 0
            while time.time() < end_time and self.running:
                iteration += 1
                await self._trading_iteration(iteration)
                
                # Update every 30 seconds
                await asyncio.sleep(30)
                
        except KeyboardInterrupt:
            logger.info("⏹️ Trading session stopped by user")
        except Exception as e:
            logger.error(f"❌ Trading session error: {e}")
        finally:
            self.running = False
            await self._session_cleanup()
    
    async def _initialize_market_data(self):
        """Initialize market data for all trading symbols"""
        logger.info("📊 Initializing market data...")
        
        for symbol in self.trading_symbols:
            # Generate initial market data
            self.market_data[symbol] = create_sample_market_data(symbol, 100)
            logger.info(f"   {symbol}: {len(self.market_data[symbol])} data points")
    
    async def _trading_iteration(self, iteration: int):
        """Single trading iteration"""
        logger.info(f"\n🔄 Trading Iteration #{iteration}")
        logger.info("-" * 50)
        
        # Update market data and prices
        await self._update_market_data()
        
        # Update existing positions
        self._update_positions()
        
        # Check for exit signals
        await self._check_exit_signals()
        
        # Look for new entry opportunities
        await self._check_entry_signals()
        
        # Update performance metrics
        self._update_performance_metrics()
        
        # Log portfolio status
        self._log_portfolio_status()
    
    async def _update_market_data(self):
        """Update market data with new price movements"""
        for symbol in self.trading_symbols:
            # Simulate price movement
            last_price = self.market_data[symbol][-1]['close']
            new_price = last_price * (1 + random.uniform(-0.02, 0.02))  # ±2% movement
            
            new_candle = {
                'open': last_price,
                'high': max(last_price, new_price) * 1.001,
                'low': min(last_price, new_price) * 0.999,
                'close': new_price,
                'volume': random.uniform(100, 1000),
                'timestamp': time.time()
            }
            
            self.market_data[symbol].append(new_candle)
            
            # Keep buffer manageable
            if len(self.market_data[symbol]) > 200:
                self.market_data[symbol] = self.market_data[symbol][-100:]
    
    def _update_positions(self):
        """Update current positions with latest prices"""
        for symbol, position in self.portfolio.positions.items():
            if symbol in self.market_data and self.market_data[symbol]:
                position.current_price = self.market_data[symbol][-1]['close']
    
    async def _check_exit_signals(self):
        """Check for position exit signals"""
        positions_to_close = []
        
        for symbol, position in self.portfolio.positions.items():
            should_exit, reason = await self._should_exit_position(position)
            
            if should_exit:
                positions_to_close.append((symbol, reason))
        
        # Close positions
        for symbol, reason in positions_to_close:
            await self._close_position(symbol, reason)
    
    async def _should_exit_position(self, position: Position) -> tuple[bool, str]:
        """Determine if a position should be exited"""
        current_price = position.current_price
        entry_price = position.entry_price
        
        # Time-based exit
        if datetime.now() - position.entry_time > self.strategy_config['max_holding_time']:
            return True, "max_holding_time"
        
        # Stop loss
        if position.side == 'long':
            if current_price <= entry_price * (1 - self.strategy_config['stop_loss_percent']):
                return True, "stop_loss"
            if current_price >= entry_price * (1 + self.strategy_config['take_profit_percent']):
                return True, "take_profit"
        
        # AI-based exit signal
        try:
            market_data = self.market_data[position.symbol][-50:]  # Last 50 candles
            prediction = self.c3po_client.predict(
                market_data=market_data,
                symbol=position.symbol,
                model_type='ensemble'
            )
            
            if prediction and prediction['confidence'] > self.ai_confidence_threshold:
                if position.side == 'long' and prediction['direction'] == 'DOWN':
                    return True, f"ai_exit_signal (confidence: {prediction['confidence']:.1%})"
                elif position.side == 'short' and prediction['direction'] == 'UP':
                    return True, f"ai_exit_signal (confidence: {prediction['confidence']:.1%})"
        
        except Exception as e:
            logger.warning(f"AI exit signal check failed for {position.symbol}: {e}")
        
        return False, ""
    
    async def _check_entry_signals(self):
        """Check for new position entry signals"""
        if len(self.portfolio.positions) >= self.max_positions:
            return
        
        for symbol in self.trading_symbols:
            if symbol in self.portfolio.positions:
                continue  # Already have position in this symbol
            
            entry_signal = await self._get_entry_signal(symbol)
            
            if entry_signal['action'] != 'hold':
                await self._open_position(symbol, entry_signal)
    
    async def _get_entry_signal(self, symbol: str) -> Dict[str, Any]:
        """Get entry signal for a symbol"""
        try:
            market_data = self.market_data[symbol][-50:]  # Last 50 candles
            current_price = market_data[-1]['close']
            
            # Get AI prediction
            prediction = self.c3po_client.predict(
                market_data=market_data,
                symbol=symbol,
                model_type='ensemble'
            )
            
            if not prediction:
                return {'action': 'hold', 'confidence': 0, 'reason': 'no_ai_prediction'}
            
            self.performance_metrics['c3po_predictions'] += 1
            
            # Check AI confidence
            if prediction['confidence'] < self.ai_confidence_threshold:
                return {'action': 'hold', 'confidence': prediction['confidence'], 'reason': 'low_ai_confidence'}
            
            # Determine action based on AI prediction
            action = 'hold'
            if prediction['direction'] == 'UP':
                action = 'buy'
            elif prediction['direction'] == 'DOWN':
                action = 'sell'  # Short position
            
            return {
                'action': action,
                'confidence': prediction['confidence'],
                'reason': f"ai_signal_{prediction['direction'].lower()}",
                'prediction': prediction,
                'current_price': current_price
            }
            
        except Exception as e:
            logger.error(f"Error getting entry signal for {symbol}: {e}")
            return {'action': 'hold', 'confidence': 0, 'reason': 'error'}
    
    async def _open_position(self, symbol: str, signal: Dict[str, Any]):
        """Open a new position"""
        try:
            current_price = signal['current_price']
            action = signal['action']
            confidence = signal['confidence']
            
            # Calculate position size
            position_size = self._calculate_position_size(symbol, current_price, confidence)
            quantity = position_size / current_price
            
            # Check if we can open position
            if not self.portfolio.can_open_position(symbol, current_price, quantity):
                logger.warning(f"   ⚠️ Cannot open position: insufficient funds or risk limits")
                return
            
            # Create position
            side = 'long' if action == 'buy' else 'short'
            position = Position(
                symbol=symbol,
                quantity=quantity,
                entry_price=current_price,
                current_price=current_price,
                entry_time=datetime.now(),
                side=side
            )
            
            # Update portfolio
            self.portfolio.positions[symbol] = position
            self.portfolio.cash -= position_size
            
            # Log trade
            emoji = "🟢" if action == 'buy' else "🔴"
            logger.info(f"   {emoji} OPENED {side.upper()} position: {quantity:.6f} {symbol} at ${current_price:.2f}")
            logger.info(f"      💡 Reason: {signal['reason']} | Confidence: {confidence:.1%}")
            logger.info(f"      💰 Position size: ${position_size:.2f} | Remaining cash: ${self.portfolio.cash:.2f}")
            
        except Exception as e:
            logger.error(f"Error opening position for {symbol}: {e}")
    
    async def _close_position(self, symbol: str, reason: str):
        """Close an existing position"""
        try:
            position = self.portfolio.positions[symbol]
            exit_price = position.current_price
            
            # Calculate P&L
            if position.side == 'long':
                pnl = (exit_price - position.entry_price) * position.quantity
            else:
                pnl = (position.entry_price - exit_price) * position.quantity
            
            pnl_percent = (pnl / (position.entry_price * position.quantity)) * 100
            
            # Create trade record
            trade = Trade(
                symbol=symbol,
                side=position.side,
                quantity=position.quantity,
                entry_price=position.entry_price,
                exit_price=exit_price,
                entry_time=position.entry_time,
                exit_time=datetime.now(),
                pnl=pnl,
                pnl_percent=pnl_percent,
                strategy='ai_c3po',
                ai_confidence=0.8,  # Would track actual confidence used
                c3po_used=True
            )
            
            # Update portfolio
            self.portfolio.cash += exit_price * position.quantity
            self.portfolio.trades.append(trade)
            del self.portfolio.positions[symbol]
            
            # Update performance tracking
            if pnl > 0:
                self.performance_metrics['winning_trades'] += 1
                self.performance_metrics['c3po_successful'] += 1
            else:
                self.performance_metrics['losing_trades'] += 1
            
            # Log trade
            emoji = "🟢" if pnl > 0 else "🔴"
            logger.info(f"   {emoji} CLOSED {position.side.upper()} position: {position.quantity:.6f} {symbol} at ${exit_price:.2f}")
            logger.info(f"      💡 Reason: {reason}")
            logger.info(f"      💰 P&L: ${pnl:+.2f} ({pnl_percent:+.2f}%) | New cash: ${self.portfolio.cash:.2f}")
            
        except Exception as e:
            logger.error(f"Error closing position for {symbol}: {e}")
    
    def _calculate_position_size(self, symbol: str, price: float, confidence: float) -> float:
        """Calculate position size based on confidence and risk management"""
        base_size = self.portfolio.total_value * 0.15  # Base 15% position
        
        if self.strategy_config['position_sizing'] == 'ai_adaptive':
            # Adjust based on AI confidence
            confidence_multiplier = 0.5 + (confidence * 0.5)  # 0.5x to 1.0x
            position_size = base_size * confidence_multiplier
        else:
            position_size = base_size
        
        # Apply risk limits
        max_position = self.portfolio.total_value * self.portfolio.max_position_size
        return min(position_size, max_position, self.portfolio.cash)
    
    def _update_performance_metrics(self):
        """Update performance metrics"""
        trades = self.portfolio.trades
        
        if len(trades) > 0:
            self.performance_metrics['total_trades'] = len(trades)
            self.performance_metrics['win_rate'] = (self.performance_metrics['winning_trades'] / len(trades)) * 100
            
            winning_trades = [t for t in trades if t.pnl > 0]
            losing_trades = [t for t in trades if t.pnl <= 0]
            
            if winning_trades:
                self.performance_metrics['avg_win'] = sum(t.pnl for t in winning_trades) / len(winning_trades)
            
            if losing_trades:
                self.performance_metrics['avg_loss'] = sum(t.pnl for t in losing_trades) / len(losing_trades)
            
            if self.performance_metrics['avg_loss'] != 0:
                self.performance_metrics['profit_factor'] = abs(self.performance_metrics['avg_win'] / self.performance_metrics['avg_loss'])
        
        # AI accuracy
        if self.performance_metrics['c3po_predictions'] > 0:
            self.performance_metrics['ai_accuracy'] = (self.performance_metrics['c3po_successful'] / self.performance_metrics['c3po_predictions']) * 100
    
    def _log_portfolio_status(self):
        """Log current portfolio status"""
        logger.info(f"\n📊 Portfolio Status:")
        logger.info(f"   💰 Total Value: ${self.portfolio.total_value:.2f}")
        logger.info(f"   💵 Cash: ${self.portfolio.cash:.2f}")
        logger.info(f"   📈 Total P&L: ${self.portfolio.total_pnl:+.2f} ({self.portfolio.total_pnl_percent:+.2f}%)")
        logger.info(f"   📊 Exposure: {self.portfolio.exposure_percent:.1f}%")
        logger.info(f"   🎯 Open Positions: {len(self.portfolio.positions)}")
        
        # Show open positions
        for symbol, position in self.portfolio.positions.items():
            emoji = "🟢" if position.unrealized_pnl > 0 else "🔴"
            logger.info(f"      {emoji} {symbol}: {position.quantity:.6f} @ ${position.entry_price:.2f} "
                       f"(P&L: ${position.unrealized_pnl:+.2f})")
        
        # Show recent performance
        if self.performance_metrics['total_trades'] > 0:
            logger.info(f"   📊 Performance: {self.performance_metrics['total_trades']} trades, "
                       f"{self.performance_metrics['win_rate']:.1f}% win rate, "
                       f"{self.performance_metrics['ai_accuracy']:.1f}% AI accuracy")
    
    async def _session_cleanup(self):
        """Cleanup at end of session"""
        logger.info("\n🏁 Trading Session Complete!")
        logger.info("=" * 60)
        
        # Close all open positions
        for symbol in list(self.portfolio.positions.keys()):
            await self._close_position(symbol, "session_end")
        
        # Final performance summary
        self._print_final_summary()
    
    def _print_final_summary(self):
        """Print comprehensive session summary"""
        logger.info("\n📊 FINAL PERFORMANCE SUMMARY")
        logger.info("=" * 60)
        
        # Portfolio performance
        logger.info(f"💰 Final Portfolio Value: ${self.portfolio.total_value:.2f}")
        logger.info(f"📈 Total Return: ${self.portfolio.total_pnl:+.2f} ({self.portfolio.total_pnl_percent:+.2f}%)")
        logger.info(f"🎯 Total Trades: {self.performance_metrics['total_trades']}")
        
        if self.performance_metrics['total_trades'] > 0:
            logger.info(f"🏆 Win Rate: {self.performance_metrics['win_rate']:.1f}%")
            logger.info(f"💡 Average Win: ${self.performance_metrics['avg_win']:.2f}")
            logger.info(f"💔 Average Loss: ${self.performance_metrics['avg_loss']:.2f}")
            logger.info(f"⚖️ Profit Factor: {self.performance_metrics['profit_factor']:.2f}")
        
        # AI performance
        logger.info(f"\n🤖 AI Performance:")
        logger.info(f"   🔮 C3PO Predictions: {self.performance_metrics['c3po_predictions']}")
        logger.info(f"   🎯 AI Accuracy: {self.performance_metrics['ai_accuracy']:.1f}%")
        logger.info(f"   ✅ Successful AI Trades: {self.performance_metrics['c3po_successful']}")
        
        # Trade history
        if self.portfolio.trades:
            logger.info(f"\n📝 Trade History:")
            for i, trade in enumerate(self.portfolio.trades[-10:], 1):  # Last 10 trades
                emoji = "🟢" if trade.pnl > 0 else "🔴"
                logger.info(f"   {i:2d}. {emoji} {trade.side.upper()} {trade.symbol}: "
                           f"${trade.pnl:+.2f} ({trade.pnl_percent:+.1f}%) | "
                           f"AI: {trade.ai_confidence:.1%}")

async def main():
    """Run the AI paper trading bot"""
    print("🤖 AI-Powered Paper Trading Bot with C3PO")
    print("=" * 60)
    
    # Configuration
    config = {
        'initial_balance': 10000,
        'trading_symbols': ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
        'ai_confidence_threshold': 0.7,
        'session_duration': 10,  # minutes
        'max_positions': 3
    }
    
    # Create and run bot
    bot = AIPaperTradingBot(
        initial_balance=config['initial_balance'],
        trading_symbols=config['trading_symbols'],
        ai_confidence_threshold=config['ai_confidence_threshold'],
        max_positions=config['max_positions']
    )
    
    try:
        await bot.start_trading(duration_minutes=config['session_duration'])
    except KeyboardInterrupt:
        logger.info("🛑 Bot stopped by user")
    except Exception as e:
        logger.error(f"❌ Bot error: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 
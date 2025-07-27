#!/usr/bin/env python3
"""
🚀 C3PO CLIENT LIBRARY
======================

Lightweight Python client for accessing C3PO AI trading models.
Copy this file to your project and use it to get trading predictions.

Usage:
    from c3po_client import C3POClient
    
    client = C3POClient("http://localhost:8002")
    prediction = client.predict(market_data, symbol="BTCUSDT")
    print(f"Prediction: {prediction['direction']} with {prediction['confidence']:.2%} confidence")
"""

import requests
import json
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class C3POClient:
    """
    Lightweight client for C3PO AI trading model service
    
    Features:
    - Simple API for getting trading predictions
    - Multiple model types (autoencoder, vae, transformer, ensemble)
    - Error handling and fallbacks
    - Minimal dependencies (only requests)
    """
    
    def __init__(self, base_url: str = "http://localhost:8002", timeout: int = 30):
        """
        Initialize C3PO client
        
        Args:
            base_url: URL of the C3PO model service
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        
        # Test connection
        try:
            response = self._make_request('GET', '/health')
            if response and response.get('status') == 'healthy':
                logger.info(f"✅ Connected to C3PO service at {base_url}")
            else:
                logger.warning(f"⚠️ C3PO service not responding properly")
        except Exception as e:
            logger.error(f"❌ Failed to connect to C3PO service: {e}")
    
    def predict(self,
                market_data: List[Dict[str, float]],
                symbol: str = "BTCUSDT",
                model_type: str = "ensemble",
                prediction_horizon: str = "1h",
                timeframe: str = "1m") -> Optional[Dict[str, Any]]:
        """
        Get trading prediction from C3PO models
        
        Args:
            market_data: List of OHLCV data points
                        Example: [{"open": 50000, "high": 50100, "low": 49900, "close": 50050, "volume": 100}, ...]
            symbol: Trading pair (e.g., "BTCUSDT", "ETHUSDT")
            model_type: Model to use ("autoencoder", "vae", "transformer", "ensemble")
            prediction_horizon: Time horizon ("1m", "5m", "15m", "1h", "4h", "24h")
            timeframe: Data timeframe ("1m", "5m", "15m", "1h")
        
        Returns:
            Prediction dictionary with keys: direction, confidence, prediction, model_type
            None if prediction fails
        """
        try:
            # Prepare request
            request_data = {
                "market_data": market_data,
                "symbol": symbol,
                "timeframe": timeframe,
                "model_type": model_type,
                "prediction_horizon": prediction_horizon
            }
            
            # Make prediction request
            response = self._make_request('POST', '/predict', json=request_data)
            
            if response and response.get('success'):
                prediction = response.get('prediction', {})
                return {
                    'direction': prediction.get('direction', 'NEUTRAL'),
                    'confidence': prediction.get('confidence', 0.5),
                    'prediction': prediction.get('prediction', 0.5),
                    'model_type': response.get('model_type', model_type),
                    'symbol': response.get('symbol', symbol),
                    'timestamp': response.get('timestamp'),
                    'individual_predictions': prediction.get('individual_predictions', {}),
                    'success': True
                }
            else:
                error_msg = response.get('message', 'Unknown error') if response else 'No response'
                logger.error(f"❌ Prediction failed: {error_msg}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error making prediction: {e}")
            return None
    
    def get_models(self) -> Optional[List[str]]:
        """
        Get list of available models
        
        Returns:
            List of model names or None if request fails
        """
        try:
            response = self._make_request('GET', '/models')
            if response:
                return response.get('available_models', [])
            return None
        except Exception as e:
            logger.error(f"❌ Error getting models: {e}")
            return None
    
    def get_status(self) -> Optional[Dict[str, Any]]:
        """
        Get service status
        
        Returns:
            Status dictionary or None if request fails
        """
        try:
            response = self._make_request('GET', '/')
            return response
        except Exception as e:
            logger.error(f"❌ Error getting status: {e}")
            return None
    
    def health_check(self) -> bool:
        """
        Check if service is healthy
        
        Returns:
            True if service is healthy, False otherwise
        """
        try:
            response = self._make_request('GET', '/health')
            return response is not None and response.get('status') == 'healthy'
        except:
            return False
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Optional[Dict[str, Any]]:
        """
        Make HTTP request to the service
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            **kwargs: Additional request arguments
        
        Returns:
            Response JSON or None if request fails
        """
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                timeout=self.timeout,
                **kwargs
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Request failed ({method} {url}): {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON response: {e}")
            return None

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def create_sample_market_data(symbol: str = "BTCUSDT", count: int = 50) -> List[Dict[str, float]]:
    """
    Create sample market data for testing
    
    Args:
        symbol: Trading symbol
        count: Number of data points
    
    Returns:
        List of OHLCV data points
    """
    import random
    
    # Base price based on symbol
    base_prices = {
        "BTCUSDT": 50000,
        "ETHUSDT": 3000,
        "SOLUSDT": 100,
        "DOGEUSDT": 0.1
    }
    
    base_price = base_prices.get(symbol, 50000)
    data = []
    current_price = base_price
    
    for i in range(count):
        # Random price movement
        change = random.uniform(-0.02, 0.02)  # ±2%
        current_price *= (1 + change)
        
        # Generate OHLCV
        open_price = current_price
        high = open_price * random.uniform(1.0, 1.005)  # Up to 0.5% higher
        low = open_price * random.uniform(0.995, 1.0)   # Up to 0.5% lower
        close = random.uniform(low, high)
        volume = random.uniform(10, 1000)
        
        data.append({
            "open": round(open_price, 2),
            "high": round(high, 2),
            "low": round(low, 2),
            "close": round(close, 2),
            "volume": round(volume, 2)
        })
        
        current_price = close
    
    return data

def format_prediction_output(prediction: Optional[Dict[str, Any]]) -> str:
    """
    Format prediction for display
    
    Args:
        prediction: Prediction dictionary from C3POClient.predict()
    
    Returns:
        Formatted string for display
    """
    if not prediction:
        return "❌ No prediction available"
    
    direction = prediction.get('direction', 'NEUTRAL')
    confidence = prediction.get('confidence', 0.0)
    symbol = prediction.get('symbol', 'Unknown')
    model_type = prediction.get('model_type', 'unknown')
    
    # Emoji for direction
    emoji = "🟢" if direction == "UP" else "🔴" if direction == "DOWN" else "🟡"
    
    # Confidence bar
    conf_bars = int(confidence * 10)
    conf_display = "█" * conf_bars + "░" * (10 - conf_bars)
    
    return f"{emoji} {symbol}: {direction} | Confidence: {confidence:.1%} [{conf_display}] | Model: {model_type}"

# ============================================================================
# EXAMPLE USAGE
# ============================================================================

def main():
    """Example usage of C3PO client"""
    print("🚀 C3PO Client Library Example")
    print("=" * 50)
    
    # Initialize client
    client = C3POClient("http://localhost:8002")
    
    # Check service health
    if not client.health_check():
        print("❌ C3PO service is not available")
        print("💡 Make sure the C3PO service is running")
        return
    
    # Get service status
    status = client.get_status()
    if status:
        print(f"✅ Service: {status.get('service_name', 'Unknown')}")
        print(f"📊 Models loaded: {len(status.get('models_loaded', []))}")
        print(f"⏱️ Uptime: {status.get('uptime_seconds', 0):.1f} seconds")
    
    # Get available models
    models = client.get_models()
    if models:
        print(f"🧠 Available models: {', '.join(models)}")
    
    print("\n🔮 Making predictions...")
    print("-" * 50)
    
    # Test with different symbols and models
    symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
    model_types = ["ensemble", "autoencoder", "vae", "transformer"]
    
    for symbol in symbols:
        print(f"\n📈 {symbol}:")
        
        # Create sample data
        market_data = create_sample_market_data(symbol, 50)
        
        for model_type in model_types:
            prediction = client.predict(
                market_data=market_data,
                symbol=symbol,
                model_type=model_type,
                prediction_horizon="1h"
            )
            
            output = format_prediction_output(prediction)
            print(f"   {output}")
    
    print("\n" + "=" * 50)
    print("✅ Example completed!")

if __name__ == "__main__":
    main() 
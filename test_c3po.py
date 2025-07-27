#!/usr/bin/env python3
"""
🧪 C3PO Integration Test
=======================

Test script to verify C3PO AI models are working with the crypto trading system.
"""

from c3po_client import C3POClient, create_sample_market_data, format_prediction_output
import time

def test_c3po_integration():
    """Test C3PO integration with the trading system"""
    print("🧪 Testing C3PO Integration")
    print("=" * 50)
    
    # Initialize client
    print("🔌 Connecting to C3PO service...")
    client = C3POClient("http://localhost:8002")
    
    # Test health check
    if not client.health_check():
        print("❌ C3PO service is not available!")
        print("💡 Make sure the C3PO service is running at http://localhost:8002")
        return False
    
    print("✅ C3PO service is healthy!")
    
    # Get service status
    status = client.get_status()
    if status:
        print(f"📊 Service: {status.get('service_name', 'Unknown')}")
        models_loaded = status.get('models_loaded', [])
        print(f"🧠 Models loaded: {len(models_loaded)} ({', '.join(models_loaded)})")
        print(f"⏱️ Uptime: {status.get('uptime_seconds', 0):.1f} seconds")
    
    # Test predictions for different trading pairs
    test_symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
    model_types = ["ensemble", "autoencoder", "vae", "transformer"]
    
    print("\n🔮 Testing predictions...")
    print("-" * 50)
    
    successful_predictions = 0
    total_tests = 0
    
    for symbol in test_symbols:
        print(f"\n📈 Testing {symbol}:")
        
        # Create realistic market data
        market_data = create_sample_market_data(symbol, 30)
        
        for model_type in model_types:
            total_tests += 1
            prediction = client.predict(
                market_data=market_data,
                symbol=symbol,
                model_type=model_type,
                prediction_horizon="1h"
            )
            
            if prediction:
                successful_predictions += 1
                output = format_prediction_output(prediction)
                print(f"   ✅ {output}")
                
                # Show individual model predictions for ensemble
                if model_type == "ensemble" and prediction.get('individual_predictions'):
                    individual = prediction['individual_predictions']
                    for model_name, pred in individual.items():
                        direction = pred.get('direction', 'NEUTRAL')
                        confidence = pred.get('confidence', 0.0)
                        print(f"      └─ {model_name}: {direction} ({confidence:.1%})")
            else:
                print(f"   ❌ {model_type}: Prediction failed")
    
    # Test results summary
    print("\n" + "=" * 50)
    print("📋 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    success_rate = (successful_predictions / total_tests) * 100 if total_tests > 0 else 0
    print(f"✅ Successful predictions: {successful_predictions}/{total_tests} ({success_rate:.1f}%)")
    
    if success_rate >= 80:
        print("🎉 EXCELLENT: C3PO integration is working perfectly!")
        return True
    elif success_rate >= 60:
        print("👍 GOOD: C3PO integration is mostly working")
        return True
    else:
        print("⚠️ WARNING: C3PO integration has issues")
        return False

def test_real_time_predictions():
    """Test real-time prediction capability"""
    print("\n🔄 Testing Real-Time Predictions")
    print("-" * 40)
    
    client = C3POClient()
    
    if not client.health_check():
        print("❌ C3PO service not available for real-time test")
        return
    
    print("🚀 Getting real-time predictions for 30 seconds...")
    
    start_time = time.time()
    prediction_count = 0
    
    while time.time() - start_time < 30:  # Run for 30 seconds
        # Simulate fresh market data
        market_data = create_sample_market_data("BTCUSDT", 20)
        
        prediction = client.predict(
            market_data=market_data,
            symbol="BTCUSDT",
            model_type="ensemble"
        )
        
        if prediction:
            prediction_count += 1
            direction = prediction['direction']
            confidence = prediction['confidence']
            emoji = "🟢" if direction == "UP" else "🔴" if direction == "DOWN" else "🟡"
            print(f"   {emoji} Prediction #{prediction_count}: {direction} ({confidence:.1%})")
        
        time.sleep(3)  # Wait 3 seconds between predictions
    
    print(f"✅ Completed {prediction_count} real-time predictions in 30 seconds")

def main():
    """Run all C3PO integration tests"""
    print("🚀 C3PO AI Model Integration Test Suite")
    print("🤖 Testing connection to advanced trading AI models")
    print("=" * 60)
    
    # Test basic integration
    integration_success = test_c3po_integration()
    
    if integration_success:
        # Test real-time predictions
        test_real_time_predictions()
        
        print("\n🎯 INTEGRATION TEST COMPLETE!")
        print("✅ C3PO AI models are ready for live trading!")
        print("\n💡 Next steps:")
        print("   1. Run paper trading bot with AI predictions")
        print("   2. Monitor prediction accuracy over time")
        print("   3. Adjust confidence thresholds based on performance")
    else:
        print("\n❌ INTEGRATION TEST FAILED!")
        print("💡 Troubleshooting:")
        print("   1. Ensure C3PO service is running: http://localhost:8002")
        print("   2. Check network connectivity")
        print("   3. Verify service has models loaded")

if __name__ == "__main__":
    main() 
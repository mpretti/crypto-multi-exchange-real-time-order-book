#!/bin/bash

echo "🔧 Setting up exchange test environment..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if ws package is installed
if ! node -e "require('ws')" 2>/dev/null; then
    echo "📦 Installing ws package..."
    npm install ws
fi

echo "🚀 Starting exchange connectivity test..."
echo "⏱️  This will test all 21 exchanges with BTCUSDT"
echo "📊 Each exchange has 15 seconds to demonstrate functionality"
echo ""

# Run the test
node test-all-exchanges.js

echo ""
echo "🔄 Test completed! Check the results above."
echo "💡 Tip: Run 'node test-all-exchanges.js' directly for future tests" 
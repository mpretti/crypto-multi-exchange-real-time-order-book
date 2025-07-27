#!/bin/bash

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "paper-trading-db-api.js" 2>/dev/null
pkill -f "http.server 8001" 2>/dev/null  
pkill -f "ai_paper_trading_bot.py" 2>/dev/null
sleep 2

# Start the database API in background
echo "🗄️ Starting Database API on port 3001..."
node paper-trading-db-api.js > db_api.log 2>&1 &
DB_PID=$!
sleep 3

# Start the web server in background  
echo "🌐 Starting Web Server on port 8001..."
python3 -m http.server 8001 > web_server.log 2>&1 &
WEB_PID=$!
sleep 2

# Show status
echo "✅ Services started:"
echo "   📊 Database API: PID $DB_PID (logs: db_api.log)"
echo "   🌐 Web Server: PID $WEB_PID (logs: web_server.log)"
echo ""

# Check if C3PO is running
if curl -s http://localhost:8002/health >/dev/null 2>&1; then
    echo "🤖 C3PO AI Service: ✅ Running on port 8002"
else
    echo "🤖 C3PO AI Service: ❌ Not running (start with 'python3 c3po_service.py')"
fi

echo ""
echo "🚀 Starting AI Paper Trading Bot with visible output..."
echo "=================================================="

# Run the AI bot in foreground so you can see output
python3 ai_paper_trading_bot.py

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $DB_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    echo "✅ Cleanup complete"
}

# Set trap to cleanup on script exit
trap cleanup EXIT 
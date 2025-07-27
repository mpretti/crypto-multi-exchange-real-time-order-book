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

# Check if C3PO is running
if curl -s http://localhost:8002/health >/dev/null 2>&1; then
    echo "🤖 C3PO AI Service: ✅ Running on port 8002"
else
    echo "🤖 C3PO AI Service: ❌ Not running (start with 'python3 c3po_service.py')"
fi

# Start the AI bot in background with logging
echo "🚀 Starting AI Paper Trading Bot in background..."
python3 ai_paper_trading_bot.py > ai_bot_output.log 2>&1 &
AI_BOT_PID=$!

echo ""
echo "✅ All services running:"
echo "   📊 Database API: PID $DB_PID (logs: db_api.log)"
echo "   🌐 Web Server: PID $WEB_PID (logs: web_server.log)"
echo "   🤖 AI Trading Bot: PID $AI_BOT_PID (logs: ai_bot_output.log)"
echo ""
echo "📖 To watch AI bot output in real-time:"
echo "   tail -f ai_bot_output.log"
echo ""
echo "🌐 Web interface: http://localhost:8001"
echo "📊 Database API: http://localhost:3001/api/health"
echo ""
echo "🛑 To stop all services:"
echo "   pkill -f 'paper-trading-db-api.js' && pkill -f 'http.server 8001' && pkill -f 'ai_paper_trading_bot.py'" 
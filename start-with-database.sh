#!/bin/bash

# Paper Trading with Database - Startup Script
echo "🚀 Starting Paper Trading System with Database..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install backend dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Create database if it doesn't exist
if [ ! -f "paper-trading.db" ]; then
    echo "🗄️ Initializing database..."
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend database server
echo "🔧 Starting database backend on port 3001..."
node paper-trading-db-api.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Failed to start backend server"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Database backend started successfully"

# Start frontend server
echo "🌐 Starting frontend server on port 8001..."
python3 -m http.server 8001 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 1

echo "✅ Frontend server started successfully"
echo ""
echo "🎉 Paper Trading System is ready!"
echo "📊 Frontend: http://localhost:8001"
echo "🗄️ Backend API: http://localhost:3001/api/"
echo "❤️  Health Check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait 
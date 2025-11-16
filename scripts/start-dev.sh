#!/bin/bash

# SmartDeadlines Development Startup Script
# This script starts both the backend and frontend servers

echo "🚀 Starting SmartDeadlines Development Environment"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Start backend server in background
echo "📦 Starting backend server on port 3001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

echo ""
echo "✅ Backend server started (PID: $BACKEND_PID)"
echo "   - API: http://localhost:3001"
echo "   - Health check: http://localhost:3001/health"
echo ""
echo "💡 Tips:"
echo "   - Emails will be logged to console (SendGrid not configured)"
echo "   - IPFS uploads use mock implementation (Web3.Storage not configured)"
echo "   - Using Devnet for Solana transactions"
echo ""
echo "🌐 To start the frontend, run in a new terminal:"
echo "   cd app && npm run dev"
echo ""
echo "⏹️  To stop the backend server:"
echo "   kill $BACKEND_PID"
echo ""

# Keep the script running
wait $BACKEND_PID

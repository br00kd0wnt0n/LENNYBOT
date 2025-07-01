#!/bin/bash

echo "🚀 Starting Slack Project Monitor Setup..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing"
    echo "   Required: Slack tokens, channel IDs, MongoDB URI, and AI API key"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install-all
fi

# Test connections
echo "🔍 Testing connections..."
npm run test:connection

if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
    echo "🎯 Starting development server..."
    npm run dev
else
    echo "❌ Connection tests failed. Please check your configuration."
    exit 1
fi 
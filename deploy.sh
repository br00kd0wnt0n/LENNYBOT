#!/bin/bash

# Railway Deployment Script
echo "🚀 Deploying Slack Project Monitor to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Build the application
echo "📦 Building application..."
npm run build:prod

# Deploy to Railway
echo "🚂 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at the Railway URL"
echo "📊 Check the Railway dashboard for logs and monitoring" 
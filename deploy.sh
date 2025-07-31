#!/bin/bash

echo "🚀 Deploying LazBot with PM2..."

# Create necessary directories
mkdir -p logs .sessions temp

# Build the project
echo "📦 Building project..."
pnpm run build

# Start with PM2
echo "🔄 Starting with PM2..."
pnpm run pm2:start

# Show status
echo "📊 PM2 Status:"
pm2 status

echo "✅ LazBot deployed successfully!"
echo "📋 Available commands:"
echo "   pnpm run pm2:logs    - View logs"
echo "   pnpm run pm2:monit   - Monitor processes"
echo "   pnpm run pm2:restart - Restart bot"
echo "   pnpm run pm2:stop    - Stop bot"

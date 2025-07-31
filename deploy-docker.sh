#!/bin/bash

echo "🐳 Deploying LazBot with Docker..."

# Create environment file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running!"
    exit 1
fi

# Create necessary directories
mkdir -p sessions logs temp

# Build and run with Docker Compose
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Show status
echo "📊 Container Status:"
docker-compose ps

echo "✅ LazBot deployed successfully with Docker!"
echo "📋 Available commands:"
echo "   pnpm run docker:compose:logs  - View logs"
echo "   pnpm run docker:compose:down  - Stop containers"
echo "   docker-compose exec lazbot sh - Access container shell"

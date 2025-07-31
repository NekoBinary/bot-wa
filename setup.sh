#!/bin/bash

echo "🚀 Setting up LazBot environment..."

# Create necessary directories
mkdir -p temp
mkdir -p .sessions

# Install system dependencies (Ubuntu/Debian)
if command -v apt-get &> /dev/null; then
    echo "📦 Installing system dependencies..."
    sudo apt-get update
    sudo apt-get install -y ffmpeg
    
    # Try to install webpmux if available
    if command -v npm &> /dev/null; then
        echo "🔧 Installing webpmux..."
        npm install -g node-webpmux || echo "⚠️  webpmux installation failed, stickers will work without metadata"
    fi
fi

# Install system dependencies (macOS)
if command -v brew &> /dev/null; then
    echo "📦 Installing system dependencies for macOS..."
    brew install ffmpeg
    
    if command -v npm &> /dev/null; then
        echo "🔧 Installing webpmux..."
        npm install -g node-webpmux || echo "⚠️  webpmux installation failed, stickers will work without metadata"
    fi
fi

echo "✅ Environment setup complete!"
echo "📋 Next steps:"
echo "   1. Edit app/index.ts and update owner number"
echo "   2. Run: pnpm run dev"
echo "   3. Scan QR code to login"
echo "   4. Send .help in WhatsApp to see commands"

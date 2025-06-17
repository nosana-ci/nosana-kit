#!/bin/bash

echo "🚀 Starting Nosana SDK Browser Playground..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20.18.0 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="20.18.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "⚠️  Warning: Node.js version $NODE_VERSION detected. Recommended version is $REQUIRED_VERSION or higher."
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the examples/browser directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🌐 Starting development server..."
echo "📖 Open http://localhost:3000 in your browser"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm run dev 
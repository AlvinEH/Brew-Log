#!/bin/bash

# GitHub Pages Deployment Script for Brew-Log
# Run with: ./deploy.sh

set -e

echo "🚀 Starting deployment to GitHub Pages..."

# Check if gh-pages is installed
if ! npm list gh-pages --depth=0 >/dev/null 2>&1; then
    echo "📦 Installing gh-pages..."
    npm install --save-dev gh-pages
fi

# Build the project
echo "🔨 Building the project..."
NODE_ENV=production npm run build

# Deploy to gh-pages branch
echo "🌐 Deploying to GitHub Pages..."
npx gh-pages -d dist

echo "✅ Deployment complete!"
echo "🔗 Your app will be available at: https://[your-username].github.io/Brew-Log/"
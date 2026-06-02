#!/bin/bash

# Back4App Build Script for Battle City
echo "🏗️  Building Battle City for Back4App..."

# Install dependencies with npm install (not npm ci) to allow updates
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Optional: Run any startup tasks
echo "✓ Dependencies installed successfully!"
echo "🚀 Ready to start server with: npm start"

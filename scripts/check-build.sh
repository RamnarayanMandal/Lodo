#!/bin/bash

# Build Check Script
# This script checks if frontend and backend builds are successful
# Run this before pushing to ensure code compiles

echo "🔍 Running build checks..."
echo ""

# Check if we're in the project root
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: frontend or backend directory not found"
    echo "Please run this script from the project root directory."
    exit 1
fi

BUILD_FAILED=false

# Build frontend
echo "📦 Building frontend..."
cd frontend
if npm run build; then
    echo "✅ Frontend build successful!"
else
    BUILD_FAILED=true
    echo ""
    echo "❌ Frontend build failed!"
    echo "Fix the errors above before pushing."
fi
cd ..

# Build backend (only if frontend succeeded)
if [ "$BUILD_FAILED" = false ]; then
    echo ""
    echo "📦 Building backend..."
    cd backend
    if npm run build; then
        echo "✅ Backend build successful!"
    else
        BUILD_FAILED=true
        echo ""
        echo "❌ Backend build failed!"
        echo "Fix the errors above before pushing."
    fi
    cd ..
fi

echo ""

if [ "$BUILD_FAILED" = true ]; then
    echo "❌ Build check failed! Do not push code yet."
    echo "Please fix all build errors before pushing."
    exit 1
else
    echo "✅ All builds successful! Safe to push code."
    exit 0
fi


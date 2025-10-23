#!/bin/bash

# Shiteni Deployment Script
echo "🚀 Starting Shiteni Deployment Process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
echo "📋 Checking Node.js version..."
node --version
npm --version

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting (if available)
echo "🔍 Running linting..."
if npm run lint 2>/dev/null; then
    echo "✅ Linting passed"
else
    echo "⚠️  Linting not configured or failed, continuing..."
fi

# Run TypeScript check
echo "🔧 Running TypeScript check..."
if npx tsc --noEmit 2>/dev/null; then
    echo "✅ TypeScript check passed"
else
    echo "⚠️  TypeScript check failed, but continuing..."
fi

# Build the project
echo "🏗️  Building the project..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Check for common deployment issues
echo "🔍 Checking for common deployment issues..."

# Check if required files exist
required_files=("public/favicon.ico" "public/background.jpg" "vercel.json")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "⚠️  $file missing"
    fi
done

# Check environment variables
echo "🔧 Environment variables check:"
env_vars=("MONGODB_URI" "NEXTAUTH_URL" "NEXTAUTH_SECRET" "JWT_SECRET")
for var in "${env_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo "✅ $var is set"
    else
        echo "⚠️  $var is not set"
    fi
done

echo "🎉 Deployment preparation complete!"
echo "📋 Next steps:"
echo "1. Set all required environment variables in your deployment platform"
echo "2. Deploy to your chosen platform (Vercel, Netlify, Railway, etc.)"
echo "3. Test the deployed application"
echo "4. Check logs for any runtime errors"

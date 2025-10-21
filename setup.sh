#!/bin/bash

# Mankuca Setup Script
echo "🚀 Setting up Mankuca Fintech Platform..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp env.example .env.local
    echo "✅ Created .env.local - Please update the values as needed"
else
    echo "✅ .env.local already exists"
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand('ping')" &> /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Please start MongoDB before running the application."
    fi
else
    echo "⚠️  MongoDB client not found. Please ensure MongoDB is installed and running."
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Start MongoDB if not already running"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000 to see the application"
echo ""
echo "📚 For more information, see README.md"

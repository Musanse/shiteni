#!/bin/bash
# Clear Next.js development cache
echo "🧹 Clearing Next.js development cache..."

# Stop any running Node processes
pkill -f "next dev" 2>/dev/null || true

# Clear Next.js cache
rm -rf .next 2>/dev/null || true

# Clear TypeScript build cache
rm -f tsconfig.tsbuildinfo 2>/dev/null || true

# Clear node_modules cache
rm -rf node_modules/.cache 2>/dev/null || true

echo "✅ Cache cleared! Starting development server..."
npm run dev:webpack

# Clear Next.js development cache
Write-Host "🧹 Clearing Next.js development cache..." -ForegroundColor Yellow

# Stop any running Node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear Next.js cache
if (Test-Path ".next") { Remove-Item -Path ".next" -Recurse -Force }

# Clear TypeScript build cache
if (Test-Path "tsconfig.tsbuildinfo") { Remove-Item -Path "tsconfig.tsbuildinfo" -Force }

# Clear node_modules cache
if (Test-Path "node_modules\.cache") { Remove-Item -Path "node_modules\.cache" -Recurse -Force }

Write-Host "✅ Cache cleared! Starting development server..." -ForegroundColor Green
npm run dev:webpack

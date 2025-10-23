# Clean up script for development
Write-Host "Cleaning up temporary files..."

# Remove Next.js cache
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "Removed .next directory"
}

# Remove node_modules cache
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "Removed node_modules cache"
}

# Remove turbo cache
if (Test-Path ".turbo") {
    Remove-Item -Recurse -Force ".turbo"
    Write-Host "Removed .turbo directory"
}

Write-Host "Cleanup complete. Starting Next.js with minimal caching..."

# PowerShell script to update Vercel build command
# This script modifies vercel.json to use npm run build instead of npx next build

Write-Host "🔧 Updating Vercel build configuration..." -ForegroundColor Cyan

# Check if vercel.json exists
if (Test-Path "vercel.json") {
    Write-Host "✅ Found vercel.json file" -ForegroundColor Green
    
    # Read the current content
    $content = Get-Content "vercel.json" -Raw
    
    # Replace the build command
    $updatedContent = $content -replace '"buildCommand": "npx next build"', '"buildCommand": "npm run build"'
    
    # Check if the replacement was made
    if ($updatedContent -ne $content) {
        # Write the updated content back to the file
        Set-Content "vercel.json" -Value $updatedContent -NoNewline
        Write-Host "✅ Updated buildCommand to 'npm run build'" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Build command was already set to 'npm run build'" -ForegroundColor Yellow
    }
    
    # Display the current build command
    $jsonContent = Get-Content "vercel.json" | ConvertFrom-Json
    Write-Host "📋 Current build command: $($jsonContent.buildCommand)" -ForegroundColor Blue
    
} else {
    Write-Host "❌ vercel.json file not found!" -ForegroundColor Red
    Write-Host "Creating a new vercel.json file..." -ForegroundColor Yellow
    
    # Create a new vercel.json file
    $newVercelConfig = @{
        framework = "nextjs"
        buildCommand = "npm run build"
        installCommand = "npm install"
        regions = @("iad1")
        outputDirectory = ".next"
        public = $true
    } | ConvertTo-Json -Depth 3
    
    Set-Content "vercel.json" -Value $newVercelConfig
    Write-Host "✅ Created new vercel.json with npm run build command" -ForegroundColor Green
}

Write-Host "`n🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Commit and push these changes to GitHub" -ForegroundColor White
Write-Host "2. Vercel will automatically use 'npm run build' for future deployments" -ForegroundColor White
Write-Host "3. The build will now run your package.json build script instead of npx next build" -ForegroundColor White

Write-Host "`n📝 To commit these changes, run:" -ForegroundColor Cyan
Write-Host "git add vercel.json" -ForegroundColor White
Write-Host "git commit -m 'Update Vercel to use npm run build instead of npx next build'" -ForegroundColor White
Write-Host "git push origin main" -ForegroundColor White

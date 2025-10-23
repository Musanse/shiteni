@echo off
REM Shiteni Deployment Script for Windows

echo 🚀 Starting Shiteni Deployment Process...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    exit /b 1
)

REM Check Node.js version
echo 📋 Checking Node.js version...
node --version
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the project
echo 🏗️  Building the project...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)
echo ✅ Build successful

REM Check for common deployment issues
echo 🔍 Checking for common deployment issues...

REM Check if required files exist
if exist "public\favicon.ico" (
    echo ✅ public\favicon.ico exists
) else (
    echo ⚠️  public\favicon.ico missing
)

if exist "public\background.jpg" (
    echo ✅ public\background.jpg exists
) else (
    echo ⚠️  public\background.jpg missing
)

if exist "vercel.json" (
    echo ✅ vercel.json exists
) else (
    echo ⚠️  vercel.json missing
)

echo 🎉 Deployment preparation complete!
echo 📋 Next steps:
echo 1. Set all required environment variables in your deployment platform
echo 2. Deploy to your chosen platform (Vercel, Netlify, Railway, etc.)
echo 3. Test the deployed application
echo 4. Check logs for any runtime errors

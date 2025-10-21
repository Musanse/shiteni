@echo off
echo 🚀 Setting up Mankuca Fintech Platform...

REM Check if .env.local exists
if not exist ".env.local" (
    echo 📝 Creating .env.local from template...
    copy env.example .env.local
    echo ✅ Created .env.local - Please update the values as needed
) else (
    echo ✅ .env.local already exists
)

echo.
echo 🎉 Setup complete! Next steps:
echo 1. Update .env.local with your configuration
echo 2. Start MongoDB if not already running
echo 3. Run 'npm run dev' to start the development server
echo 4. Visit http://localhost:3000 to see the application
echo.
echo 📚 For more information, see README.md
pause
